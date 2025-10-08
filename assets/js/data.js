function getApiEndpoints(period) {
    const baseUrl = `https://waterservices.usgs.gov/nwis/iv/?format=json&sites=02335000&period=${period}`;
    return [
        baseUrl,
        'https://api.allorigins.win/get?url=' + encodeURIComponent(baseUrl),
        'https://corsproxy.io/?' + encodeURIComponent(baseUrl),
        'https://cors-anywhere.herokuapp.com/' + baseUrl
    ];
}

async function loadWaterData() {
    const loading = UI.DOM.loading();
    const dataContainer = UI.DOM.dataContainer();
    const lastUpdated = UI.DOM.lastUpdated();

    if (!loading || !dataContainer || !lastUpdated) return;

    loading.style.display = 'block';
    UI.clearError();
    dataContainer.innerHTML = '';
    UI.showLoadingSkeletons();

    let lastError = null;
    const endpoints = getApiEndpoints(AppState.getPeriod());

    for (let i = 0; i < endpoints.length; i++) {
        try {
            const response = await fetch(endpoints[i]);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            let data;
            const payload = await response.json();

            if (i === 0) {
                // Direct USGS API response
                data = payload;
            } else if (i === 1 && payload.contents) {
                // allorigins.win response
                data = Utils.safeJSONParse(payload.contents);
            } else if (payload.value || payload.name) {
                // Other proxy responses or direct response
                data = payload;
            }

            if (!data) {
                throw new Error('Unexpected response format');
            }

            const categories = parseTimeSeriesData(data);
            AppState.setCurrentData(categories);
            displayTable(categories);
            checkFishingConditions(categories, AppState.getUsaceData());

            UI.updateLastUpdated('Last updated: just now');

            loading.style.display = 'none';
            UI.hideLoadingSkeletons();
            return;
        } catch (error) {
            console.warn(`Water data endpoint ${i + 1} failed`, error);
            lastError = error;
        }
    }

    console.error('All water data endpoints failed', lastError);
    AppState.setCurrentData({});

    UI.updateLastUpdated('<span class="error">Data unavailable - just now</span>');
    UI.announceError('⚠️ Live data unavailable. Check your connection or retry shortly.');
    loading.style.display = 'none';
    UI.hideLoadingSkeletons();
    dataContainer.innerHTML = '<div class="data-unavailable">N/A - Data Currently Unavailable</div>';
}

async function loadUSACEData() {
    const usaceSection = UI.DOM.usaceSection();
    const currentStatus = UI.DOM.currentGenerationStatus();

    if (!usaceSection || !currentStatus) return;

    const usaceEndpoints = [
        'https://raw.githubusercontent.com/mindfulbits/usace-data-collector/refs/heads/main/data/usace-latest.json',
        'https://api.allorigins.win/get?url=' + encodeURIComponent('https://raw.githubusercontent.com/mindfulbits/usace-data-collector/refs/heads/main/data/usace-latest.json'),
        'https://corsproxy.io/?' + encodeURIComponent('https://raw.githubusercontent.com/mindfulbits/usace-data-collector/refs/heads/main/data/usace-latest.json')
    ];

    const usaceSkeleton = UI.DOM.usaceSkeleton();
    if (usaceSkeleton) {
        usaceSkeleton.hidden = false;
    }

    try {
        let data = null;
        for (let i = 0; i < usaceEndpoints.length; i++) {
            try {
                const response = await fetch(usaceEndpoints[i]);
                const payload = await response.json();

                if (i === 0) {
                    // Direct GitHub raw response
                    data = payload;
                } else if (i === 1 && payload.contents) {
                    // allorigins.win response
                    data = Utils.safeJSONParse(payload.contents);
                } else {
                    // Other proxy responses
                    data = payload;
                }
                if (data) break;
            } catch (err) {
                console.warn(`USACE endpoint ${i + 1} failed`, err);
            }
        }

        if (!data) {
            throw new Error('USACE data unavailable from all endpoints');
        }

        AppState.setUsaceData(data);
        displayUSACEData(data);
        checkFishingConditions(AppState.getCurrentData(), data);

        if (Object.keys(AppState.getCurrentData()).length > 0) {
            displayTable(AppState.getCurrentData());
        } else {
            const summaryCards = UI.DOM.summaryContainer();
            if (summaryCards) {
                summaryCards.innerHTML = '';
                const damCard = createDamSummaryCard(data);
                summaryCards.appendChild(damCard);
                summaryCards.style.display = 'grid';
            }
        }
    } catch (error) {
        console.error('Failed to load USACE data', error);
        currentStatus.innerHTML = '<span class="error">⚠️ Data Unavailable</span>';
        usaceSection.style.display = 'block';
    } finally {
        if (usaceSkeleton) {
            usaceSkeleton.hidden = true;
        }
    }
}

function parseTimeSeriesData(data) {
    const categories = {};

    if (!data?.value?.timeSeries) {
        return categories;
    }

    const preferFahrenheit = AppState.getUseFahrenheit();

    data.value.timeSeries.forEach((series) => {
        const variable = series?.variable || {};
        const paramName = variable.variableName || 'Unknown Parameter';
        const paramCode = variable.variableCode?.[0]?.value || 'Unknown';
        const unit = variable.unit?.unitAbbreviation || '';

        let categoryKey = `${paramName} (${paramCode})${unit ? ' - ' + unit : ''}`;
        let displayName = categoryKey;
        let originalTitle = categoryKey;

        const renameIf = (match, replacement) => {
            if (categoryKey.includes(match)) {
                displayName = replacement;
                originalTitle = categoryKey;
                categoryKey = replacement;
            }
        };

        renameIf('Turbidity', `Turbidity (FNU)${unit ? ' - ' + unit : ''}`);
        renameIf('Temperature', `Temperature${unit ? ' - ' + unit : ''}`);
        renameIf('Precipitation', `Precipitation (in)${unit ? ' - ' + unit : ''}`);
        renameIf('Streamflow', `Streamflow (ft³/s)${unit ? ' - ' + unit : ''}`);
        renameIf('Gage height', `Gage Height (ft)${unit ? ' - ' + unit : ''}`);
        renameIf('Specific conductance', `Specific Conductance (µS/cm)${unit ? ' - ' + unit : ''}`);
        renameIf('Escherichia coli', `Escherichia Coli (cfu/100ml)${unit ? ' - ' + unit : ''}`);

        if (preferFahrenheit && (categoryKey.includes('°C') || categoryKey.includes('deg C'))) {
            categoryKey = categoryKey.replace(/°C|deg C/g, '°F');
            displayName = categoryKey;
        }

        const values = series?.values?.[0]?.value || [];
        const measurements = values
            .map((valueEntry) => ({
                value: parseFloat(valueEntry.value) || 0,
                datetime: valueEntry.dateTime || '',
                qualifiers: valueEntry.qualifiers || []
            }))
            .filter((measurement) => measurement.datetime);

        if (measurements.length > 0) {
            measurements.sort((a, b) => new Date(b.datetime) - new Date(a.datetime));
            categories[displayName] = measurements;
            if (originalTitle !== displayName) {
                categories[displayName].originalTitle = originalTitle;
            }
        }
    });

    return categories;
}

function evaluateTurbidity(measurements) {
    if (measurements.length === 0) return { good: false, moderate: false, bad: false };
    const value = measurements[0].value;
    return {
        good: value <= 8,
        moderate: value > 8 && value < 9,
        bad: value >= 9
    };
}

function evaluateGageHeight(measurements) {
    if (measurements.length === 0) return { good: false, bad: false };
    const value = measurements[0].value;
    return {
        good: value <= 4,
        bad: value > 4
    };
}

function evaluateStreamflow(measurements) {
    if (measurements.length === 0) return { good: false, moderate: false, high: false };
    const value = measurements[0].value;
    return {
        good: value <= 1000,
        moderate: value >= 1000 && value < 3000,
        high: value >= 3000
    };
}

function checkFishingConditions(categories, usaceData) {
    let turbidityGood = false;
    let turbidityModerate = false;
    let turbidityBad = false;
    let gageHeightGood = false;
    let gageHeightBad = false;
    let streamflowModerate = false;
    let streamflowHigh = false;
    let generationHoursAbove5 = 0;

    const now = new Date();

    Object.entries(categories).forEach(([categoryName, measurements]) => {
        if (categoryName.toLowerCase().includes('turbidity') && measurements.length > 0) {
            const t = evaluateTurbidity(measurements);
            turbidityGood = t.good;
            turbidityModerate = t.moderate;
            turbidityBad = t.bad;
        }

        if (categoryName.toLowerCase().includes('gage height') && measurements.length > 0) {
            const g = evaluateGageHeight(measurements);
            gageHeightGood = g.good;
            gageHeightBad = g.bad;
        }

        if (categoryName.toLowerCase().includes('streamflow') && measurements.length > 0) {
            const s = evaluateStreamflow(measurements);
            streamflowGood = s.good;
            streamflowModerate = s.moderate;
            streamflowHigh = s.high;
        }
    });

    let isCurrentlyGeneratingAbove5 = false;
    if (usaceData?.schedules) {
        const today = new Date();
        const todayStr = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
        const schedule = usaceData.schedules[todayStr];

        if (Array.isArray(schedule?.periods)) {
            const currentHour = today.getHours();

            schedule.periods.slice(0, 24).forEach((period) => {
                const timeMatch = period?.time?.match(/(\d+):00 (am|pm)/);
                if (!timeMatch) return;
                let hour = parseInt(timeMatch[1], 10);
                if (timeMatch[2] === 'pm' && hour !== 12) hour += 12;
                if (timeMatch[2] === 'am' && hour === 12) hour = 0;
                if (hour === currentHour && period.generation >= 5) {
                    isCurrentlyGeneratingAbove5 = true;
                }
            });

            if (isCurrentlyGeneratingAbove5) {
                Storage.setGenerationTriggerTime(now.getTime().toString());
            }

            let consecutiveHighGeneration = 0;
            let maxConsecutiveHours = 0;
            schedule.periods.slice(0, 24).forEach((period) => {
                const timeMatch = period?.time?.match(/(\d+):00 (am|pm)/);
                if (!timeMatch) return;
                let hour = parseInt(timeMatch[1], 10);
                if (timeMatch[2] === 'pm' && hour !== 12) hour += 12;
                if (timeMatch[2] === 'am' && hour === 12) hour = 0;
                const hoursBack = currentHour >= hour ? currentHour - hour : 24 - hour + currentHour;
                if (hoursBack < 14) {
                    if (period.generation >= 5) {
                        consecutiveHighGeneration++;
                        maxConsecutiveHours = Math.max(maxConsecutiveHours, consecutiveHighGeneration);
                    } else {
                        consecutiveHighGeneration = 0;
                    }
                }
            });

            generationHoursAbove5 = maxConsecutiveHours;
        }
    }

    let shouldShowOrangeBackground = false;
    const triggerTime = Storage.getGenerationTriggerTime();
    if (triggerTime) {
        const triggerTimestamp = parseInt(triggerTime, 10);
        const hoursElapsed = (now.getTime() - triggerTimestamp) / (1000 * 60 * 60);
        if (hoursElapsed <= 6) {
            shouldShowOrangeBackground = true;
        } else {
            Storage.clearGenerationTriggerTime();
        }
    }

    const body = document.body;
    let fishingClass = '';
    let indicatorText = '';

    if (gageHeightBad || turbidityBad || streamflowHigh) {
        fishingClass = 'poor';
        indicatorText = '🚫 Poor Fishing: High Water, Turbidity > 9 NTU, or Streamflow > 3000 ft³/s';
    } else if (gageHeightGood && (turbidityModerate || streamflowModerate || shouldShowOrangeBackground)) {
        fishingClass = 'caution';
        indicatorText = '⚠️ Caution: Turbidity 8-9 NTU, Streamflow 1000-3000 ft³/s, or Recent Generation Activity';
    } else if (turbidityGood && gageHeightGood && streamflowGood) {
        fishingClass = 'good';
        indicatorText = '🎣 Excellent Fishing Conditions!';
    }

    const existingIndicator = document.querySelector('.fishing-conditions-indicator');
    if (fishingClass) {
        // Remove previous fishing classes
        body.classList.remove('fishing-good', 'fishing-caution', 'fishing-poor');
        body.classList.add('fishing-' + fishingClass);

        if (existingIndicator) {
            existingIndicator.remove();
        }

        const indicator = document.createElement('div');
        indicator.className = 'fishing-conditions-indicator fishing-conditions-indicator-' + fishingClass;
        indicator.textContent = indicatorText;

        document.body.appendChild(indicator);

        // Hide the indicator after 8 seconds
        setTimeout(() => {
            if (indicator && indicator.parentNode) {
                indicator.remove();
            }
        }, 8000);
    } else {
        body.classList.remove('fishing-good', 'fishing-caution', 'fishing-poor');
        if (existingIndicator) {
            existingIndicator.remove();
        }
    }
}
