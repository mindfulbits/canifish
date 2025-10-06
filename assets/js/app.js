const AppState = (() => {
    let currentPeriod = 'PT3H';
    let currentData = {};
    let visibleCategories = {};
    let usaceData = null;
    let filtersExpanded = false;
    let useFahrenheit = true;
    let summaryExpanded = true;
    let dataTablesExpanded = true;
    let usaceExpanded = true;

    return {
        getPeriod: () => currentPeriod,
        setPeriod: (period) => {
            currentPeriod = period;
        },
        getCurrentData: () => currentData,
        setCurrentData: (data) => {
            currentData = data;
        },
        getVisibleCategories: () => visibleCategories,
        setVisibleCategories: (categories) => {
            visibleCategories = categories;
        },
        getUsaceData: () => usaceData,
        setUsaceData: (data) => {
            usaceData = data;
        },
        getFiltersExpanded: () => filtersExpanded,
        setFiltersExpanded: (expanded) => {
            filtersExpanded = expanded;
        },
        getUseFahrenheit: () => useFahrenheit,
        setUseFahrenheit: (flag) => {
            useFahrenheit = flag;
        },
        getSummaryExpanded: () => summaryExpanded,
        setSummaryExpanded: (expanded) => {
            summaryExpanded = expanded;
        },
        getDataTablesExpanded: () => dataTablesExpanded,
        setDataTablesExpanded: (expanded) => {
            dataTablesExpanded = expanded;
        },
        getUsaceExpanded: () => usaceExpanded,
        setUsaceExpanded: (expanded) => {
            usaceExpanded = expanded;
        }
    };
})();

const Storage = (() => {
    const storagePrefix = 'canifish';
    const storageKeys = {
        visibleCategories: `${storagePrefix}VisibleCategories`,
        filtersExpanded: `${storagePrefix}FiltersExpanded`,
        useFahrenheit: `${storagePrefix}UseFahrenheit`,
        summaryExpanded: `${storagePrefix}SummaryExpanded`,
        dataTablesExpanded: `${storagePrefix}DataTablesExpanded`,
        usaceExpanded: `${storagePrefix}UsaceExpanded`,
        generationTriggerTime: `${storagePrefix}GenerationTriggerTime`
    };

    function loadJSON(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (error) {
            console.warn(`Unable to parse localStorage key ${key}:`, error);
            return fallback;
        }
    }

    function saveJSON(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.warn(`Unable to persist localStorage key ${key}:`, error);
        }
    }

    return {
        loadSettings() {
            const visibleCategories = loadJSON(storageKeys.visibleCategories, {});
            AppState.setVisibleCategories(visibleCategories);

            const filtersExpanded = loadJSON(storageKeys.filtersExpanded, false);
            AppState.setFiltersExpanded(filtersExpanded);

            const useFahrenheit = loadJSON(storageKeys.useFahrenheit, true);
            AppState.setUseFahrenheit(useFahrenheit);

            const summaryExpanded = loadJSON(storageKeys.summaryExpanded, true);
            AppState.setSummaryExpanded(summaryExpanded);

            const dataTablesExpanded = loadJSON(storageKeys.dataTablesExpanded, true);
            AppState.setDataTablesExpanded(dataTablesExpanded);

            const usaceExpanded = loadJSON(storageKeys.usaceExpanded, true);
            AppState.setUsaceExpanded(usaceExpanded);
        },
        saveSettings() {
            const { getVisibleCategories, getFiltersExpanded, getUseFahrenheit, getSummaryExpanded, getDataTablesExpanded, getUsaceExpanded } = AppState;
            saveJSON(storageKeys.visibleCategories, getVisibleCategories());
            saveJSON(storageKeys.filtersExpanded, getFiltersExpanded());
            saveJSON(storageKeys.useFahrenheit, getUseFahrenheit());
            saveJSON(storageKeys.summaryExpanded, getSummaryExpanded());
            saveJSON(storageKeys.dataTablesExpanded, getDataTablesExpanded());
            saveJSON(storageKeys.usaceExpanded, getUsaceExpanded());
        },
        getGenerationTriggerTime() {
            return localStorage.getItem(storageKeys.generationTriggerTime);
        },
        setGenerationTriggerTime(value) {
            localStorage.setItem(storageKeys.generationTriggerTime, value);
        },
        clearGenerationTriggerTime() {
            localStorage.removeItem(storageKeys.generationTriggerTime);
        },
        keys: storageKeys
    };
})();

const Utils = (() => {
    function celsiusToFahrenheit(celsius) {
        return (celsius * 9) / 5 + 32;
    }

    function formatDateTime(dateTimeString) {
        try {
            const date = new Date(dateTimeString);
            const month = date.getMonth() + 1;
            const day = date.getDate();
            const year = date.getFullYear().toString().slice(-2);
            let hours = date.getHours();
            const minutes = date.getMinutes().toString().padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12 || 12;
            return `${month}/${day}/${year}, ${hours}:${minutes} ${ampm}`;
        } catch (err) {
            console.warn('Unable to format date time', dateTimeString, err);
            return dateTimeString;
        }
    }

    function safeJSONParse(text) {
        try {
            return JSON.parse(text);
        } catch (error) {
            console.warn('Malformed JSON payload encountered', error);
            return null;
        }
    }

    return {
        celsiusToFahrenheit,
        formatDateTime,
        safeJSONParse
    };
})();

const UI = (() => {
    const DOM = {
        loading: () => document.getElementById('loading'),
        error: () => document.getElementById('error'),
        dataContainer: () => document.getElementById('data-container'),
        summaryContainer: () => document.getElementById('summary-cards'),
        summarySkeleton: () => document.getElementById('summary-skeletons'),
        tablesSkeleton: () => document.getElementById('tables-skeleton'),
        usaceSkeleton: () => document.getElementById('usace-skeleton'),
        filtersToggleBtn: () => document.getElementById('filters-toggle-btn'),
        summaryToggleBtn: () => document.getElementById('summary-toggle-btn'),
        dataTablesToggleBtn: () => document.getElementById('data-tables-toggle-btn'),
        usaceToggleBtn: () => document.getElementById('usace-toggle-btn'),
        tempToggleInput: () => document.getElementById('temp-toggle'),
        lastUpdated: () => document.getElementById('last-updated'),
        summarySection: () => document.getElementById('summary-cards-section'),
        dataTablesSection: () => document.getElementById('data-tables-section'),
        categoryFilters: () => document.getElementById('category-filters'),
        generationTables: () => document.getElementById('generation-tables'),
        usaceSection: () => document.getElementById('usace-section'),
        usaceInfo: () => document.getElementById('usace-info'),
        currentGenerationStatus: () => document.getElementById('current-generation-status')
    };

    function showLoadingSkeletons() {
        const summarySkeleton = DOM.summarySkeleton();
        const tablesSkeleton = DOM.tablesSkeleton();
        const usaceSkeleton = DOM.usaceSkeleton();

        if (summarySkeleton) summarySkeleton.hidden = false;
        if (tablesSkeleton) tablesSkeleton.hidden = false;
        if (usaceSkeleton) usaceSkeleton.hidden = false;
    }

    function hideLoadingSkeletons() {
        const summarySkeleton = DOM.summarySkeleton();
        const tablesSkeleton = DOM.tablesSkeleton();
        const usaceSkeleton = DOM.usaceSkeleton();

        if (summarySkeleton) summarySkeleton.hidden = true;
        if (tablesSkeleton) tablesSkeleton.hidden = true;
        if (usaceSkeleton) usaceSkeleton.hidden = true;
    }

    function announceError(text) {
        const errorEl = DOM.error();
        if (!errorEl) return;
        errorEl.innerHTML = text;
        errorEl.style.display = 'block';
    }

    function clearError() {
        const errorEl = DOM.error();
        if (!errorEl) return;
        errorEl.style.display = 'none';
        errorEl.innerHTML = '';
    }

    function updateLastUpdated(text, timestamp = Date.now()) {
        const lastUpdated = DOM.lastUpdated();
        if (!lastUpdated) return;
        lastUpdated.innerHTML = text;
        lastUpdated.setAttribute('data-update-time', timestamp);
    }

    function syncToggleStates() {
        const { getFiltersExpanded, getSummaryExpanded, getDataTablesExpanded, getUsaceExpanded, getUseFahrenheit } = AppState;
        const filtersBtn = DOM.filtersToggleBtn();
        const summaryBtn = DOM.summaryToggleBtn();
        const tablesBtn = DOM.dataTablesToggleBtn();
        const usaceBtn = DOM.usaceToggleBtn();
        const tempToggleInput = DOM.tempToggleInput();

        if (filtersBtn) {
            filtersBtn.textContent = getFiltersExpanded() ? 'Hide Filters' : 'Show Filters';
        }

        if (summaryBtn) {
            summaryBtn.textContent = getSummaryExpanded() ? 'Hide Summary' : 'Show Summary';
        }

        if (tablesBtn) {
            tablesBtn.textContent = getDataTablesExpanded() ? 'Hide Tables' : 'Show Tables';
        }

        if (usaceBtn) {
            usaceBtn.textContent = getUsaceExpanded() ? 'Hide Dam Data' : 'Show Dam Data';
        }

        if (tempToggleInput) {
            tempToggleInput.checked = getUseFahrenheit();
        }
    }

    function toggleSectionVisibility(section, expanded) {
        if (!section) return;
        section.style.display = expanded ? 'block' : 'none';
    }

    function renderCategoryFilters(categories, damKey) {
        const container = document.getElementById('category-toggles');
        if (!container) return;

        container.innerHTML = '';
        const visibleCategories = AppState.getVisibleCategories();

        if (AppState.getUsaceData()) {
            const toggle = createCategoryToggle(damKey, '🏗️ ' + damKey, visibleCategories[damKey]);
            container.appendChild(toggle);
        }

        Object.keys(categories).forEach((categoryName) => {
            const toggle = createCategoryToggle(categoryName, categoryName, visibleCategories[categoryName]);
            container.appendChild(toggle);
        });
    }

    function createCategoryToggle(categoryName, labelText, isActive = true) {
        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = `category-toggle ${isActive ? 'active' : ''}`;
        toggle.setAttribute('data-category', categoryName);
        toggle.innerHTML = `
            <span class="toggle-checkbox ${isActive ? 'checked' : ''}"></span>
            <span>${labelText}</span>
        `;
        toggle.addEventListener('click', () => {
            toggleCategory(categoryName);
        });
        return toggle;
    }

    function lazyUpdateContainer(container, newContentBuilder) {
        if (!container) return;
        const fragment = document.createDocumentFragment();
        newContentBuilder(fragment);
        container.innerHTML = '';
        container.appendChild(fragment);
    }

    function scrollToElement(element) {
        if (!element) return;
        element.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
        element.style.transition = 'background-color 0.3s ease';
        element.style.backgroundColor = 'rgba(102, 126, 234, 0.1)';
        setTimeout(() => {
            element.style.backgroundColor = '';
        }, 1000);
    }

    return {
        DOM,
        showLoadingSkeletons,
        hideLoadingSkeletons,
        announceError,
        clearError,
        updateLastUpdated,
        syncToggleStates,
        toggleSectionVisibility,
        renderCategoryFilters,
        lazyUpdateContainer,
        scrollToElement
    };
})();

const DAM_CATEGORY_KEY = 'Buford Dam Generation';

function updateTimeSinceUpdate() {
    const lastUpdated = UI.DOM.lastUpdated();
    if (!lastUpdated) return;

    const updateTime = lastUpdated.getAttribute('data-update-time');
    if (!updateTime) return;

    const now = new Date();
    const updateDate = new Date(parseInt(updateTime, 10));
    const diffMinutes = Math.floor((now - updateDate) / (1000 * 60));

    let timeText;
    if (diffMinutes < 1) {
        timeText = 'just now';
    } else if (diffMinutes === 1) {
        timeText = '1 minute ago';
    } else if (diffMinutes < 60) {
        timeText = `${diffMinutes} minutes ago`;
    } else if (diffMinutes < 120) {
        timeText = '1 hour ago';
    } else {
        const hours = Math.floor(diffMinutes / 60);
        timeText = `${hours} hours ago`;
    }

    const currentText = lastUpdated.innerHTML || '';
    if (currentText.includes('Data unavailable')) {
        UI.updateLastUpdated(`<span style="color: #dc3545;">Data unavailable - ${timeText}</span>`, updateTime);
    } else {
        UI.updateLastUpdated(`Last updated: ${timeText}`, updateTime);
    }

    const usaceData = AppState.getUsaceData();
    if (usaceData && usaceData.timestamp) {
        displayTable(AppState.getCurrentData());
    }
}

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

    UI.updateLastUpdated('<span style="color: #dc3545;">Data unavailable - just now</span>');
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
        currentStatus.innerHTML = '<span style="color: #dc3545;">⚠️ Data Unavailable</span>';
        usaceSection.style.display = 'block';
    } finally {
        if (usaceSkeleton) {
            usaceSkeleton.hidden = true;
        }
    }
}

function displayUSACEData(data) {
    const currentStatus = UI.DOM.currentGenerationStatus();
    const generationTables = UI.DOM.generationTables();
    const usaceSection = UI.DOM.usaceSection();
    const usaceInfo = UI.DOM.usaceInfo();
    const usaceSkeleton = UI.DOM.usaceSkeleton();

    if (!currentStatus || !generationTables || !usaceSection || !usaceInfo) return;

    if (usaceSkeleton) {
        usaceSkeleton.hidden = true;
        usaceSkeleton.setAttribute('aria-hidden', 'true');
        usaceSkeleton.style.display = 'none';
    }

    generationTables.innerHTML = '';

    const visibleCategories = AppState.getVisibleCategories();
    if (!visibleCategories[DAM_CATEGORY_KEY]) {
        usaceSection.style.display = 'none';
        if (usaceSkeleton) {
            usaceSkeleton.hidden = true;
            usaceSkeleton.setAttribute('aria-hidden', 'true');
            usaceSkeleton.style.display = 'none';
        }
        return;
    }

    usaceSection.style.display = 'block';
    const usaceExpanded = AppState.getUsaceExpanded();
    UI.toggleSectionVisibility(generationTables, usaceExpanded);
    UI.toggleSectionVisibility(usaceInfo, usaceExpanded);

    const today = new Date();
    const currentHour = today.getHours();

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const dates = [
        { date: yesterday, label: 'Previous Day', key: `${yesterday.getMonth() + 1}/${yesterday.getDate()}/${yesterday.getFullYear()}` },
        { date: today, label: 'Current Day', key: `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}` },
        { date: tomorrow, label: 'Following Day', key: `${tomorrow.getMonth() + 1}/${tomorrow.getDate()}/${tomorrow.getFullYear()}` }
    ];

    let currentPeriod = null;

    dates.forEach(({ date, label, key }) => {
        const schedule = data.schedules?.[key];
        if (!schedule || !Array.isArray(schedule.periods)) return;

        const tableContainer = createDayTable(schedule, date, label, currentHour, key === dates[1].key);
        generationTables.appendChild(tableContainer);

        if (key === dates[1].key) {
            schedule.periods.forEach((period) => {
                const timeMatch = period.time?.match(/(\d+):00 (am|pm)/);
                if (!timeMatch) return;
                let hour = parseInt(timeMatch[1], 10);
                if (timeMatch[2] === 'pm' && hour !== 12) hour += 12;
                if (timeMatch[2] === 'am' && hour === 12) hour = 0;
                if (hour === currentHour) {
                    currentPeriod = period;
                }
            });
        }
    });

    if (currentPeriod) {
        const statusClass = `status-${currentPeriod.status}`;
        const statusText = currentPeriod.status.charAt(0).toUpperCase() + currentPeriod.status.slice(1);
        currentStatus.className = `generation-status ${statusClass}`;
        currentStatus.innerHTML = `
            <span>Current: ${currentPeriod.generation} MW</span>
            <span>${statusText}</span>
        `;
    } else {
        currentStatus.innerHTML = '<span style="color: #666;">Status Unknown</span>';
    }
}

        
        function createDayTable(schedule, date, label, currentHour, isToday) {
            const container = document.createElement('div');
            container.className = 'table-container';

            if (isToday && label === 'Current Day') {
                container.id = 'dam-current-day-table';
            }

            const title = document.createElement('div');
            title.className = 'day-table-title';
            title.innerHTML = `
                <span>${label}</span>
                <span class="day-date">${date.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })}</span>
            `;
            container.appendChild(title);

            const table = document.createElement('table');
            table.className = 'generation-table';

            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            ['Time Period', 'Generation (MW)', 'Status'].forEach((headerText) => {
                const th = document.createElement('th');
                th.textContent = headerText;
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            table.appendChild(thead);

            const tbody = document.createElement('tbody');
            const periods = Array.isArray(schedule?.periods) ? schedule.periods.slice(0, 24) : [];

            periods.forEach((period) => {
                const row = document.createElement('tr');

                let hour = null;
                if (typeof period?.time === 'string') {
                    const timeMatch = period.time.match(/(\d+):00 (am|pm)/);
                    if (timeMatch) {
                        hour = parseInt(timeMatch[1], 10);
                        if (timeMatch[2] === 'pm' && hour !== 12) hour += 12;
                        if (timeMatch[2] === 'am' && hour === 12) hour = 0;
                    }
                }

                const isCurrent = isToday && hour !== null && hour === currentHour;
                if (isCurrent) {
                    row.className = 'current-hour';
                }

                const timeCell = document.createElement('td');
                const periodLabel = typeof period?.time === 'string' ? period.time : '—';
                timeCell.textContent = `${periodLabel}${isCurrent ? ' (Current)' : ''}`;
                row.appendChild(timeCell);

                const mwCell = document.createElement('td');
                mwCell.className = 'mw-value';
                mwCell.textContent = period?.generation !== undefined ? period.generation : '—';
                row.appendChild(mwCell);

                const statusCell = document.createElement('td');
                const statusSpan = document.createElement('span');
                const statusClass = period?.status || 'unknown';
                statusSpan.className = `status-cell ${statusClass}`;
                statusSpan.textContent = statusClass;
                statusCell.appendChild(statusSpan);
                row.appendChild(statusCell);

                tbody.appendChild(row);
            });

            table.appendChild(tbody);
            container.appendChild(table);

            return container;
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

                renameIf('Turbidity', `Turbidity${unit ? ' - ' + unit : ''}`);
                renameIf('Temperature', `Temperature${unit ? ' - ' + unit : ''}`);
                renameIf('Precipitation', `Precipitation (in)${unit ? ' - ' + unit : ''}`);
                renameIf('Streamflow', `Streamflow (ft³/s)${unit ? ' - ' + unit : ''}`);
                renameIf('Gage height', `Gage Height (ft)${unit ? ' - ' + unit : ''}`);
                renameIf('Specific conductance', `Specific Conductance${unit ? ' - ' + unit : ''}`);
                renameIf('Escherichia coli', `Escherichia Coli${unit ? ' - ' + unit : ''}`);

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
        
        
        
        function formatDateTime(dateTimeString) {
            try {
                const date = new Date(dateTimeString);
                
                // Manual formatting to get exact "M/d/yy, h:mm am/pm" format
                const month = date.getMonth() + 1; // getMonth() is 0-indexed
                const day = date.getDate();
                const year = date.getFullYear().toString().slice(-2); // Get last 2 digits
                
                let hours = date.getHours();
                const minutes = date.getMinutes().toString().padStart(2, '0');
                const ampm = hours >= 12 ? 'PM' : 'AM';
                
                hours = hours % 12;
                hours = hours ? hours : 12; // 0 should be 12
                
                return `${month}/${day}/${year}, ${hours}:${minutes} ${ampm}`;
            } catch (e) {
                return dateTimeString;
            }
        }
        
        function getConditionClass(categoryName, displayValue, categories, usaceData) {
            const now = new Date();
            const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

            // Helper function to check if dam generation was active recently
            const checkDamGenerationRecent = (hoursThreshold) => {
                if (!usaceData?.schedules) return false;
                
                const triggerTime = Storage.getGenerationTriggerTime();
                if (triggerTime) {
                    const triggerTimestamp = parseInt(triggerTime, 10);
                    const hoursElapsed = (now.getTime() - triggerTimestamp) / (1000 * 60 * 60);
                    return hoursElapsed <= hoursThreshold;
                }
                
                // Check if currently generating above 5 MW
                const today = new Date();
                const todayStr = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
                const schedule = usaceData.schedules[todayStr];
                
                if (Array.isArray(schedule?.periods)) {
                    const currentHour = today.getHours();
                    return schedule.periods.some((period) => {
                        const timeMatch = period?.time?.match(/(\d+):00 (am|pm)/);
                        if (!timeMatch) return false;
                        let hour = parseInt(timeMatch[1], 10);
                        if (timeMatch[2] === 'pm' && hour !== 12) hour += 12;
                        if (timeMatch[2] === 'am' && hour === 12) hour = 0;
                        return hour === currentHour && period.generation >= 5;
                    });
                }
                return false;
            };

            // Check conditions based on category type
            if (categoryName.toLowerCase().includes('gage height')) {
                // Gage Height conditions
                if (displayValue < 3.5) return 'condition-good';
                if (displayValue >= 3.5 && displayValue <= 4) return 'condition-caution';
                if (displayValue > 4) return 'condition-poor';
            }
            
            if (categoryName.toLowerCase().includes('turbidity')) {
                // Turbidity conditions
                if (displayValue <= 8) return 'condition-good';
                if (displayValue > 8 && displayValue < 9) return 'condition-caution';
                if (displayValue >= 9) return 'condition-poor';
            }
            
            if (categoryName.toLowerCase().includes('streamflow')) {
                // Streamflow conditions
                if (displayValue <= 1000) return 'condition-good';
                if (displayValue > 1000 && displayValue < 3000) return 'condition-caution';
                if (displayValue >= 3000) return 'condition-poor';
            }
            
            if (categoryName.toLowerCase().includes('temperature')) {
                // For temperature, we need to check other conditions
                // Get recent measurements for other sensors
                let gageHeightOk = false;
                let turbidityOk = false;
                let streamflowOk = false;
                let damRecent = checkDamGenerationRecent(8); // 8 hours for good
                
                // Check gage height
                const gageHeightMeasurements = Object.entries(categories).find(([name, measurements]) => 
                    name.toLowerCase().includes('gage height') && measurements.length > 0
                );
                if (gageHeightMeasurements) {
                    const recentGage = gageHeightMeasurements[1].filter(m => new Date(m.datetime) >= oneHourAgo);
                    gageHeightOk = recentGage.length > 0 && recentGage.every(m => m.value < 3.5);
                }
                
                // Check turbidity
                const turbidityMeasurements = Object.entries(categories).find(([name, measurements]) => 
                    name.toLowerCase().includes('turbidity') && measurements.length > 0
                );
                if (turbidityMeasurements) {
                    const recentTurbidity = turbidityMeasurements[1].filter(m => new Date(m.datetime) >= oneHourAgo);
                    turbidityOk = recentTurbidity.length > 0 && recentTurbidity.every(m => m.value <= 8);
                }
                
                // Check streamflow
                const streamflowMeasurements = Object.entries(categories).find(([name, measurements]) => 
                    name.toLowerCase().includes('streamflow') && measurements.length > 0
                );
                if (streamflowMeasurements) {
                    const recentStreamflow = streamflowMeasurements[1].filter(m => new Date(m.datetime) >= oneHourAgo);
                    streamflowOk = recentStreamflow.length > 0 && recentStreamflow.every(m => m.value <= 1000);
                }
                
                if (gageHeightOk && turbidityOk && streamflowOk && !damRecent) return 'condition-good';
                
                // Check caution conditions
                damRecent = checkDamGenerationRecent(4); // 4 hours for caution
                let gageHeightCaution = false;
                let turbidityCaution = false;
                let streamflowCaution = false;
                
                if (gageHeightMeasurements) {
                    const recentGage = gageHeightMeasurements[1].filter(m => new Date(m.datetime) >= oneHourAgo);
                    gageHeightCaution = recentGage.length > 0 && recentGage.every(m => m.value >= 3.5 && m.value <= 4);
                }
                
                if (turbidityMeasurements) {
                    const recentTurbidity = turbidityMeasurements[1].filter(m => new Date(m.datetime) >= oneHourAgo);
                    turbidityCaution = recentTurbidity.length > 0 && recentTurbidity.every(m => m.value > 8 && m.value < 9);
                }
                
                if (streamflowMeasurements) {
                    const recentStreamflow = streamflowMeasurements[1].filter(m => new Date(m.datetime) >= oneHourAgo);
                    streamflowCaution = recentStreamflow.length > 0 && recentStreamflow.every(m => m.value > 1000 && m.value < 3000);
                }
                
                if ((gageHeightCaution || turbidityCaution || streamflowCaution) && !damRecent) return 'condition-caution';
                
                // Check poor conditions
                damRecent = checkDamGenerationRecent(6); // 6 hours for poor
                let gageHeightPoor = false;
                let turbidityPoor = false;
                let streamflowPoor = false;
                
                if (gageHeightMeasurements) {
                    const recentGage = gageHeightMeasurements[1].filter(m => new Date(m.datetime) >= oneHourAgo);
                    gageHeightPoor = recentGage.length > 0 && recentGage.some(m => m.value > 4);
                }
                
                if (turbidityMeasurements) {
                    const recentTurbidity = turbidityMeasurements[1].filter(m => new Date(m.datetime) >= oneHourAgo);
                    turbidityPoor = recentTurbidity.length > 0 && recentTurbidity.some(m => m.value >= 9);
                }
                
                if (streamflowMeasurements) {
                    const recentStreamflow = streamflowMeasurements[1].filter(m => new Date(m.datetime) >= oneHourAgo);
                    streamflowPoor = recentStreamflow.length > 0 && recentStreamflow.some(m => m.value >= 3000);
                }
                
                if (gageHeightPoor || turbidityPoor || streamflowPoor || damRecent) return 'condition-poor';
            }
            
            return null; // No condition met
        }
        
        function createSummaryCard(categoryName, measurements) {
            const card = document.createElement('div');
            card.className = 'summary-card';

            const summaryInfo = document.createElement('div');
            summaryInfo.className = 'summary-info';

            const title = document.createElement('div');
            title.className = 'summary-title';
            title.textContent = categoryName;
            if (measurements.originalTitle) {
                title.title = measurements.originalTitle;
            }
            title.style.cursor = 'pointer';
            title.onclick = () => scrollToTable(categoryName);
            summaryInfo.appendChild(title);

            const latestValue = document.createElement('div');
            latestValue.className = 'latest-value';

            if (measurements.length > 0) {
                const preferFahrenheit = AppState.getUseFahrenheit();
                const isTemperature =
                    categoryName.toLowerCase().includes('temperature') ||
                    categoryName.includes('°C') ||
                    categoryName.includes('deg C');

                let displayValue = measurements[0].value;
                if (isTemperature) {
                    displayValue = preferFahrenheit ? Utils.celsiusToFahrenheit(displayValue) : displayValue;
                    latestValue.textContent = `${displayValue.toFixed(1)}${preferFahrenheit ? '°F' : '°C'}`;
                } else {
                    latestValue.textContent = displayValue.toFixed(2);
                }

                // Apply condition-based styling
                const conditionClass = getConditionClass(categoryName, displayValue, AppState.getCurrentData(), AppState.getUsaceData());
                if (conditionClass) {
                    latestValue.classList.add(conditionClass);
                }

            } else {
                latestValue.innerHTML = '<span style="color: #dc3545;">N/A</span>';
            }
            summaryInfo.appendChild(latestValue);

            const timeSince = document.createElement('div');
            timeSince.className = 'time-since';
            if (measurements.length > 0) {
                const lastTime = new Date(measurements[0].datetime);
                const now = new Date();
                const diffMinutes = Math.floor((now - lastTime) / (1000 * 60));
                if (diffMinutes < 60) {
                    timeSince.textContent = `${diffMinutes} minutes ago`;
                } else {
                    const diffHours = Math.floor(diffMinutes / 60);
                    const remainingMinutes = diffMinutes % 60;
                    timeSince.textContent = `${diffHours}h ${remainingMinutes}m ago`;
                }
            } else {
                timeSince.innerHTML = '<span style="color: #dc3545;">N/A</span>';
            }
            summaryInfo.appendChild(timeSince);

            const trendIndicator = document.createElement('div');
            trendIndicator.className = 'trend-indicator';

            const trendArrow = document.createElement('div');
            trendArrow.className = 'trend-arrow';

            const trendText = document.createElement('div');
            trendText.className = 'trend-text';

            const rateOfChange = document.createElement('div');
            rateOfChange.className = 'rate-of-change';

            if (measurements.length >= 2) {
                const preferFahrenheit = AppState.getUseFahrenheit();
                const isTemperature =
                    categoryName.toLowerCase().includes('temperature') ||
                    categoryName.includes('°C') ||
                    categoryName.includes('deg C');

                const latestTime = new Date(measurements[0].datetime);
                if (Number.isNaN(latestTime.getTime())) {
                    trendArrow.textContent = '?';
                    trendArrow.classList.add('trend-stable');
                    trendText.textContent = 'Unknown';
                    trendText.classList.add('trend-stable');
                    rateOfChange.textContent = 'N/A';
                    rateOfChange.classList.add('trend-stable');
                } else {
                    const windowStart = new Date(latestTime.getTime() - 3 * 60 * 60 * 1000);

                    const toDisplayValue = (rawValue) => {
                        if (isTemperature && preferFahrenheit) {
                            return Utils.celsiusToFahrenheit(rawValue);
                        }
                        return rawValue;
                    };

                    let latestValue = toDisplayValue(measurements[0].value);
                    let baselineValue = latestValue;
                    let totalDiff = 0;
                    let totalHours = 0;

                    let prevTime = latestTime;
                    let prevValue = latestValue;

                    for (let i = 1; i < measurements.length && totalHours < 3; i++) {
                        const currentTime = new Date(measurements[i].datetime);
                        if (Number.isNaN(currentTime.getTime()) || currentTime > prevTime) {
                            continue;
                        }

                        const currentValue = toDisplayValue(measurements[i].value);
                        const segmentHours = (prevTime - currentTime) / (1000 * 60 * 60);
                        if (segmentHours <= 0) {
                            prevTime = currentTime;
                            prevValue = currentValue;
                            continue;
                        }

                        if (currentTime <= windowStart) {
                            const hoursWithinWindow = (prevTime - windowStart) / (1000 * 60 * 60);
                            const totalSegmentHours = segmentHours;

                            let valueAtWindowStart = currentValue;
                            if (totalSegmentHours > 0) {
                                const ratio = hoursWithinWindow / totalSegmentHours;
                                valueAtWindowStart = prevValue - (prevValue - currentValue) * ratio;
                            }

                            totalDiff += prevValue - valueAtWindowStart;
                            totalHours += hoursWithinWindow;
                            baselineValue = valueAtWindowStart;
                            break;
                        } else {
                            totalDiff += prevValue - currentValue;
                            totalHours += segmentHours;
                            baselineValue = currentValue;
                            prevTime = currentTime;
                            prevValue = currentValue;
                        }
                    }

                    totalHours = Math.min(totalHours, 3);

                    if (totalHours <= 0) {
                        trendArrow.textContent = '?';
                        trendArrow.classList.add('trend-stable');
                        trendText.textContent = 'Unknown';
                        trendText.classList.add('trend-stable');
                        rateOfChange.textContent = 'N/A';
                        rateOfChange.classList.add('trend-stable');
                    } else {
                        const difference = latestValue - baselineValue;
                        const percentChange = Math.abs(baselineValue) > 0 ? Math.abs((difference / baselineValue) * 100) : 0;
                        const ratePerHour = totalDiff / totalHours;
                        const trendTitle = 'Average change over past 3 hours';

                        if (percentChange < 2) {
                            trendArrow.textContent = '→';
                            trendArrow.classList.add('trend-stable');
                            trendText.textContent = 'Stable';
                            trendText.classList.add('trend-stable');
                            trendText.title = trendTitle;
                            trendText.style.cursor = 'help';
                            rateOfChange.textContent = `±${Math.abs(ratePerHour).toFixed(2)} avg/hr`;
                            rateOfChange.classList.add('trend-stable');
                        } else if (ratePerHour > 0) {
                            trendArrow.textContent = '↗';
                            trendArrow.classList.add('trend-up');
                            trendText.textContent = 'Rising';
                            trendText.classList.add('trend-up');
                            trendText.title = trendTitle;
                            trendText.style.cursor = 'help';
                            rateOfChange.textContent = `+${ratePerHour.toFixed(2)} avg/hr`;
                            rateOfChange.classList.add('trend-up');
                        } else if (ratePerHour < 0) {
                            trendArrow.textContent = '↘';
                            trendArrow.classList.add('trend-down');
                            trendText.textContent = 'Falling';
                            trendText.classList.add('trend-down');
                            trendText.title = trendTitle;
                            trendText.style.cursor = 'help';
                            rateOfChange.textContent = `${ratePerHour.toFixed(2)} avg/hr`;
                            rateOfChange.classList.add('trend-down');
                        } else {
                            trendArrow.textContent = '→';
                            trendArrow.classList.add('trend-stable');
                            trendText.textContent = 'Stable';
                            trendText.classList.add('trend-stable');
                            trendText.title = trendTitle;
                            trendText.style.cursor = 'help';
                            rateOfChange.textContent = '0.00 avg/hr';
                            rateOfChange.classList.add('trend-stable');
                        }
                    }
                }
            } else {
                trendArrow.textContent = '?';
                trendArrow.classList.add('trend-stable');
                trendText.textContent = 'Unknown';
                trendText.classList.add('trend-stable');
                rateOfChange.textContent = 'N/A';
                rateOfChange.classList.add('trend-stable');
            }

            trendIndicator.appendChild(trendArrow);
            trendIndicator.appendChild(trendText);
            trendIndicator.appendChild(rateOfChange);

            card.appendChild(summaryInfo);
            card.appendChild(trendIndicator);

            return card;
        }
        
        function createDamSummaryCard(data) {
            const card = document.createElement('div');
            card.className = 'dam-summary-card';

            const damInfo = document.createElement('div');
            damInfo.className = 'dam-info';

            const title = document.createElement('div');
            title.className = 'dam-title';
            title.textContent = 'Buford Dam Generation';
            title.style.cursor = 'pointer';
            title.onclick = scrollToDamTable;
            damInfo.appendChild(title);

            const today = new Date();
            const currentHour = today.getHours();
            const todayStr = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
            const schedule = data?.schedules?.[todayStr];

            let currentPeriod = null;
            if (Array.isArray(schedule?.periods)) {
                schedule.periods.forEach((period) => {
                    const timeMatch = period?.time?.match(/(\d+):00 (am|pm)/);
                    if (!timeMatch) return;
                    let hour = parseInt(timeMatch[1], 10);
                    if (timeMatch[2] === 'pm' && hour !== 12) hour += 12;
                    if (timeMatch[2] === 'am' && hour === 12) hour = 0;
                    if (hour === currentHour) {
                        currentPeriod = period;
                    }
                });
            }

            const currentValue = document.createElement('div');
            currentValue.className = 'dam-current-value';
            currentValue.textContent = currentPeriod ? `${currentPeriod.generation} MW` : 'N/A';
            damInfo.appendChild(currentValue);

            const statusInfo = document.createElement('div');
            statusInfo.className = 'dam-status-info';
            if (data?.timestamp) {
                const now = new Date();
                const updateTime = new Date(data.timestamp);
                const diffMinutes = Math.floor((now - updateTime) / (1000 * 60));
                let timeText = 'just now';
                if (diffMinutes === 1) timeText = '1 minute ago';
                else if (diffMinutes > 1 && diffMinutes < 60) timeText = `${diffMinutes} minutes ago`;
                else if (diffMinutes >= 60 && diffMinutes < 120) timeText = '1 hour ago';
                else if (diffMinutes >= 120) {
                    const hours = Math.floor(diffMinutes / 60);
                    timeText = `${hours} hours ago`;
                }
                statusInfo.textContent = timeText;
            } else {
                statusInfo.textContent = 'No timestamp available';
            }
            damInfo.appendChild(statusInfo);

            const damIndicator = document.createElement('div');
            damIndicator.className = 'dam-indicator';

            const changesContainer = document.createElement('div');
            changesContainer.className = 'dam-changes-container';

            const previousChange = document.createElement('div');
            previousChange.className = 'dam-previous-change';
            previousChange.textContent = 'Schedule unavailable';

            if (Array.isArray(schedule?.periods) && currentPeriod) {
                const currentGen = currentPeriod.generation;
                let foundPreviousChange = false;

                for (let i = schedule.periods.length - 1; i >= 0; i--) {
                    const period = schedule.periods[i];
                    const timeMatch = period?.time?.match(/(\d+):00 (am|pm)/);
                    if (!timeMatch) continue;
                    let hour = parseInt(timeMatch[1], 10);
                    if (timeMatch[2] === 'pm' && hour !== 12) hour += 12;
                    if (timeMatch[2] === 'am' && hour === 12) hour = 0;
                    if (hour < currentHour && period.generation !== currentGen) {
                        const hoursAgo = currentHour - hour;
                        const timeAgoText = hoursAgo === 1 ? '1 hour ago' : `${hoursAgo} hours ago`;
                        const difference = currentGen - period.generation;
                        const changeDirection = difference > 0 ? '+' : '';
                        const changeColor = difference > 0 ? '#dc3545' : '#28a745';
                        previousChange.innerHTML = `
                            <div>Last change: ${timeAgoText}</div>
                            <div style="color: ${changeColor}; font-weight: bold;">
                                ${changeDirection}${difference} MW
                            </div>
                        `;
                        foundPreviousChange = true;
                        break;
                    }
                }

                if (!foundPreviousChange) {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    const yesterdayStr = `${yesterday.getMonth() + 1}/${yesterday.getDate()}/${yesterday.getFullYear()}`;
                    const yesterdaySchedule = data?.schedules?.[yesterdayStr];
                    const lastPeriod = yesterdaySchedule?.periods?.[yesterdaySchedule.periods.length - 1];
                    if (lastPeriod && lastPeriod.generation !== currentGen) {
                        const difference = currentGen - lastPeriod.generation;
                        const changeDirection = difference > 0 ? '+' : '';
                        const changeColor = difference > 0 ? '#dc3545' : '#28a745';
                        previousChange.innerHTML = `
                            <div>Last change: Earlier today</div>
                            <div style="color: ${changeColor}; font-weight: bold;">
                                ${changeDirection}${difference} MW
                            </div>
                        `;
                        foundPreviousChange = true;
                    }
                }

                if (!foundPreviousChange) {
                    previousChange.innerHTML = `
                        <div>No recent changes</div>
                        <div style="color: #666;">Stable since start of day</div>
                    `;
                }
            }

            const nextChange = document.createElement('div');
            nextChange.className = 'dam-next-change';
            nextChange.textContent = 'Schedule unavailable';

            if (Array.isArray(schedule?.periods) && currentPeriod) {
                const currentGen = currentPeriod.generation;
                let foundNextChange = false;

                for (let i = 0; i < schedule.periods.length; i++) {
                    const period = schedule.periods[i];
                    const timeMatch = period?.time?.match(/(\d+):00 (am|pm)/);
                    if (!timeMatch) continue;
                    let hour = parseInt(timeMatch[1], 10);
                    if (timeMatch[2] === 'pm' && hour !== 12) hour += 12;
                    if (timeMatch[2] === 'am' && hour === 12) hour = 0;
                    if (hour > currentHour && period.generation !== currentGen) {
                        const changeTime = timeMatch[2] === 'am'
                            ? (hour === 0 ? '12:00 am' : `${hour}:00 am`)
                            : (hour === 12 ? '12:00 pm' : `${hour - 12}:00 pm`);
                        const difference = period.generation - currentGen;
                        const changeDirection = difference > 0 ? '+' : '';
                        const changeColor = difference > 0 ? '#dc3545' : '#28a745';
                        nextChange.innerHTML = `
                            <div>Next change: ${changeTime}</div>
                            <div style="color: ${changeColor}; font-weight: bold;">
                                ${changeDirection}${difference} MW (${period.generation} MW)
                            </div>
                        `;
                        foundNextChange = true;
                        break;
                    }
                }

                if (!foundNextChange) {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    const tomorrowStr = `${tomorrow.getMonth() + 1}/${tomorrow.getDate()}/${tomorrow.getFullYear()}`;
                    const tomorrowSchedule = data?.schedules?.[tomorrowStr];
                    const firstPeriod = tomorrowSchedule?.periods?.[0];
                    if (firstPeriod && firstPeriod.generation !== currentGen) {
                        const difference = firstPeriod.generation - currentGen;
                        const changeDirection = difference > 0 ? '+' : '';
                        const changeColor = difference > 0 ? '#dc3545' : '#28a745';
                        nextChange.innerHTML = `
                            <div>Next change: Tomorrow 12:00 am</div>
                            <div style="color: ${changeColor}; font-weight: bold;">
                                ${changeDirection}${difference} MW (${firstPeriod.generation} MW)
                            </div>
                        `;
                        foundNextChange = true;
                    }
                }

                if (!foundNextChange) {
                    nextChange.innerHTML = `
                        <div>No changes scheduled</div>
                        <div style="color: #666;">Stable at ${currentGen} MW</div>
                    `;
                }
            }

            changesContainer.appendChild(previousChange);
            changesContainer.appendChild(nextChange);
            damIndicator.appendChild(changesContainer);

            card.appendChild(damInfo);
            card.appendChild(damIndicator);

            return card;
        }
        
        function checkFishingConditions(categories, usaceData) {
            let turbidityGood = false;
            let turbidityModerate = false;
            let turbidityBad = false;
            let gageHeightGood = false;
            let gageHeightBad = false;
            let streamflowGood = false;
            let streamflowModerate = false;
            let streamflowHigh = false;
            let generationHoursAbove5 = 0;

            const now = new Date();
            const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

            Object.entries(categories).forEach(([categoryName, measurements]) => {
                if (categoryName.toLowerCase().includes('turbidity') && measurements.length > 0) {
                    const recentMeasurements = measurements.filter((m) => new Date(m.datetime) >= oneHourAgo);
                    if (recentMeasurements.length > 0) {
                        turbidityGood = recentMeasurements.every((m) => m.value <= 8);
                        turbidityModerate = recentMeasurements.every((m) => m.value < 9) && recentMeasurements.some((m) => m.value > 8);
                        turbidityBad = recentMeasurements.some((m) => m.value >= 9);
                    }
                }

                if (categoryName.toLowerCase().includes('gage height') && measurements.length > 0) {
                    const recentMeasurements = measurements.filter((m) => new Date(m.datetime) >= oneHourAgo);
                    if (recentMeasurements.length > 0) {
                        gageHeightGood = recentMeasurements.every((m) => m.value <= 4);
                        gageHeightBad = recentMeasurements.some((m) => m.value > 4);
                    }
                }

                if (categoryName.toLowerCase().includes('streamflow') && measurements.length > 0) {
                    const recentMeasurements = measurements.filter((m) => new Date(m.datetime) >= oneHourAgo);
                    if (recentMeasurements.length > 0) {
                        streamflowGood = recentMeasurements.every((m) => m.value <= 1000);
                        streamflowHigh = recentMeasurements.some((m) => m.value >= 3000);
                        streamflowModerate =
                            recentMeasurements.every((m) => m.value < 3000) && recentMeasurements.some((m) => m.value >= 1000);
                    }
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
            let backgroundColor = '';
            let indicatorText = '';
            let indicatorColor = '';

            const isGreen = turbidityGood && gageHeightGood && streamflowGood;
            const isOrange = gageHeightGood && (turbidityModerate || streamflowModerate || shouldShowOrangeBackground);
            const isRed = gageHeightBad || turbidityBad || streamflowHigh;

            if (isOrange) {
                backgroundColor = 'rgba(255, 152, 0, 0.5)';
                indicatorText = '⚠️ Caution: Turbidity 8-9 NTU, Streamflow 1000-3000 ft³/s,  or Recent Generation Activity';
                indicatorColor = 'rgba(255, 152, 0, 0.9)';
            } else if (isRed) {
                backgroundColor = 'rgba(244, 67, 54, 0.5)';
                indicatorText = '🚫 Poor Fishing: High Water, Turbidity > 9 NTU, or Streamflow > 3000 ft³/s';
                indicatorColor = 'rgba(244, 67, 54, 0.9)';
            } else if (isGreen) {
                backgroundColor = 'rgba(76, 175, 80, 0.5)';
                indicatorText = '🎣 Excellent Fishing Conditions!';
                indicatorColor = 'rgba(76, 175, 80, 0.9)';
            }

            const existingIndicator = document.querySelector('.fishing-conditions-indicator');
            if (backgroundColor) {
                body.style.background = backgroundColor;
                body.style.transition = 'background 1s ease-in-out';

                if (existingIndicator) {
                    existingIndicator.remove();
                }

                const indicator = document.createElement('div');
                indicator.className = 'fishing-conditions-indicator';
                indicator.textContent = indicatorText;
                indicator.style.cssText = `
                    position: fixed;
                    top: 10px;
                    right: 10px;
                    background: ${indicatorColor};
                    color: white;
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-weight: bold;
                    font-size: 0.9rem;
                    z-index: 1001;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                    animation: slideIn 0.5s ease-out;
                `;

                let indicatorStyle = document.getElementById('fishing-indicator-style');
                if (!indicatorStyle) {
                    indicatorStyle = document.createElement('style');
                    indicatorStyle.id = 'fishing-indicator-style';
                    indicatorStyle.textContent = `
                        @keyframes slideIn {
                            from { transform: translateX(100%); opacity: 0; }
                            to { transform: translateX(0); opacity: 1; }
                        }
                    `;
                    document.head.appendChild(indicatorStyle);
                }

                document.body.appendChild(indicator);

                // Hide the indicator after 8 seconds
                setTimeout(() => {
                    if (indicator && indicator.parentNode) {
                        indicator.remove();
                    }
                }, 8000);
            } else {
                body.style.background = '';
                if (existingIndicator) {
                    existingIndicator.remove();
                }
            }
        }

        function displayTable(categories) {
            const dataContainer = UI.DOM.dataContainer();
            const summaryContainer = UI.DOM.summaryContainer();
            const summarySection = UI.DOM.summarySection();
            const dataTablesSection = UI.DOM.dataTablesSection();
            const categoryFiltersContainer = UI.DOM.categoryFilters();

            if (!dataContainer || !summaryContainer || !summarySection || !dataTablesSection || !categoryFiltersContainer) {
                return;
            }

            const usaceData = AppState.getUsaceData();
            const visibleCategories = { ...AppState.getVisibleCategories() };

            Object.keys(categories).forEach((categoryName) => {
                if (!(categoryName in visibleCategories)) {
                    visibleCategories[categoryName] = true;
                }
            });

            if (usaceData && !(DAM_CATEGORY_KEY in visibleCategories)) {
                visibleCategories[DAM_CATEGORY_KEY] = true;
            }

            AppState.setVisibleCategories(visibleCategories);

            UI.renderCategoryFilters(categories, DAM_CATEGORY_KEY);
            categoryFiltersContainer.style.display = AppState.getFiltersExpanded() ? 'block' : 'none';

            UI.lazyUpdateContainer(summaryContainer, (fragment) => {
                if (usaceData && visibleCategories[DAM_CATEGORY_KEY]) {
                    fragment.appendChild(createDamSummaryCard(usaceData));
                }

                Object.entries(categories).forEach(([categoryName, measurements]) => {
                    if (!visibleCategories[categoryName]) return;
                    fragment.appendChild(createSummaryCard(categoryName, measurements));
                });
            });

            const hasSummaryContent = summaryContainer.children.length > 0;
            summarySection.style.display = hasSummaryContent ? 'block' : 'none';
            summaryContainer.style.display = AppState.getSummaryExpanded() ? 'grid' : 'none';

            const summarySkeleton = UI.DOM.summarySkeleton();
            if (summarySkeleton) {
                summarySkeleton.hidden = hasSummaryContent;
                summarySkeleton.setAttribute('aria-hidden', hasSummaryContent ? 'true' : 'false');
                summarySkeleton.style.display = hasSummaryContent ? 'none' : '';
            }

            UI.lazyUpdateContainer(dataContainer, (fragment) => {
                Object.entries(categories).forEach(([categoryName, measurements]) => {
                    if (!visibleCategories[categoryName]) return;

                    const tableContainer = document.createElement('div');
                    tableContainer.className = 'table-container';
                    tableContainer.id = 'table-' + categoryName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();

                    const title = document.createElement('h3');
                    title.textContent = categoryName;
                    title.style.marginBottom = '15px';
                    title.style.color = '#333';
                    if (measurements.originalTitle) {
                        title.title = measurements.originalTitle;
                        title.style.cursor = 'help';
                    }
                    tableContainer.appendChild(title);

                    const table = document.createElement('table');
                    table.className = 'data-table';

                    const thead = document.createElement('thead');
                    const headerRow = document.createElement('tr');
                    ['Value', 'Date & Time'].forEach((headerText) => {
                        const th = document.createElement('th');
                        th.textContent = headerText;
                        headerRow.appendChild(th);
                    });
                    thead.appendChild(headerRow);
                    table.appendChild(thead);

                    const tbody = document.createElement('tbody');
                    const preferFahrenheit = AppState.getUseFahrenheit();
                    measurements.forEach((measurement) => {
                        const row = document.createElement('tr');

                        const valueCell = document.createElement('td');
                        let displayValue = measurement.value;
                        const isTemperature =
                            categoryName.toLowerCase().includes('temperature') ||
                            categoryName.includes('°C') ||
                            categoryName.includes('deg C');

                        if (isTemperature) {
                            displayValue = preferFahrenheit ? Utils.celsiusToFahrenheit(displayValue) : displayValue;
                            valueCell.textContent = `${displayValue.toFixed(1)}${preferFahrenheit ? '°F' : '°C'}`;
                        } else {
                            valueCell.textContent = displayValue.toFixed(2);
                        }
                        valueCell.style.fontWeight = 'bold';
                        row.appendChild(valueCell);

                        const timeCell = document.createElement('td');
                        timeCell.textContent = Utils.formatDateTime(measurement.datetime);
                        row.appendChild(timeCell);

                        tbody.appendChild(row);
                    });

                    table.appendChild(tbody);
                    tableContainer.appendChild(table);

                    const scrollHint = document.createElement('div');
                    scrollHint.className = 'table-container-scroll-hint';
                    scrollHint.setAttribute('aria-hidden', 'true');
                    scrollHint.innerHTML = '↔&nbsp;Scroll for more';
                    tableContainer.appendChild(scrollHint);

                    fragment.appendChild(tableContainer);
                });
            });

            const hasTableContent = dataContainer.children.length > 0;
            dataTablesSection.style.display = hasTableContent ? 'block' : 'none';
            dataContainer.style.display = AppState.getDataTablesExpanded() ? 'block' : 'none';

            const tablesSkeleton = UI.DOM.tablesSkeleton();
            if (tablesSkeleton) {
                tablesSkeleton.hidden = hasTableContent;
                tablesSkeleton.setAttribute('aria-hidden', hasTableContent ? 'true' : 'false');
                tablesSkeleton.style.display = hasTableContent ? 'none' : '';
            }

            UI.syncToggleStates();
            if (usaceData) {
                displayUSACEData(usaceData);
            }

            updateTableScrollHints();
        }

        function updateTableScrollHints() {
            const dataContainer = UI.DOM.dataContainer();
            if (!dataContainer) return;

            requestAnimationFrame(() => {
                const containers = dataContainer.querySelectorAll('.table-container');
                containers.forEach((container) => {
                    if (container.scrollWidth > container.clientWidth + 2) {
                        container.classList.add('scrollable');
                    } else {
                        container.classList.remove('scrollable');
                    }
                });
            });
        }
        
        function toggleCategory(categoryName) {
            const updatedCategories = { ...AppState.getVisibleCategories() };
            updatedCategories[categoryName] = !updatedCategories[categoryName];
            AppState.setVisibleCategories(updatedCategories);
            Storage.saveSettings();
            displayTable(AppState.getCurrentData());
        }

        function toggleAllCategories(show) {
            const updatedCategories = { ...AppState.getVisibleCategories() };
            Object.keys(updatedCategories).forEach((categoryName) => {
                updatedCategories[categoryName] = show;
            });
            if (AppState.getUsaceData()) {
                updatedCategories[DAM_CATEGORY_KEY] = show;
            }

            AppState.setVisibleCategories(updatedCategories);
            Storage.saveSettings();
            UI.syncToggleStates();
            displayTable(AppState.getCurrentData());
        }

        function changePeriod() {
            const select = document.getElementById('period-select');
            if (!select) return;
            AppState.setPeriod(select.value);
            loadWaterData();
        }

        function toggleFiltersVisibility() {
            const categoryFilters = UI.DOM.categoryFilters();
            if (!categoryFilters) return;

            const expanded = !AppState.getFiltersExpanded();
            AppState.setFiltersExpanded(expanded);
            categoryFilters.style.display = expanded ? 'block' : 'none';
            Storage.saveSettings();
            UI.syncToggleStates();
        }

        function toggleTemperatureUnit(event) {
            const preferFahrenheit = event?.target ? Boolean(event.target.checked) : !AppState.getUseFahrenheit();
            AppState.setUseFahrenheit(preferFahrenheit);
            Storage.saveSettings();
            UI.syncToggleStates();

            const currentData = AppState.getCurrentData();
            if (Object.keys(currentData).length > 0) {
                displayTable(currentData);
            }
        }

        function scrollToTable(categoryName) {
            const tableId = 'table-' + categoryName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
            const tableElement = document.getElementById(tableId);
            if (!tableElement) return;

            if (!AppState.getDataTablesExpanded()) {
                toggleDataTablesVisibility();
            }

            UI.scrollToElement(tableElement);
        }

        function scrollToDamTable() {
            const damCurrentDayTable = document.getElementById('dam-current-day-table');
            if (!damCurrentDayTable) return;

            if (!AppState.getUsaceExpanded()) {
                toggleUSACEVisibility();
            }

            UI.scrollToElement(damCurrentDayTable);
        }

        function toggleSummaryVisibility() {
            const newValue = !AppState.getSummaryExpanded();
            AppState.setSummaryExpanded(newValue);
            Storage.saveSettings();
            UI.syncToggleStates();
            displayTable(AppState.getCurrentData());
        }

        function toggleDataTablesVisibility() {
            const newValue = !AppState.getDataTablesExpanded();
            AppState.setDataTablesExpanded(newValue);
            Storage.saveSettings();
            UI.syncToggleStates();
            displayTable(AppState.getCurrentData());
        }

        function toggleUSACEVisibility() {
            const newValue = !AppState.getUsaceExpanded();
            AppState.setUsaceExpanded(newValue);
            Storage.saveSettings();
            UI.syncToggleStates();
            displayUSACEData(AppState.getUsaceData());
        }

        document.addEventListener('DOMContentLoaded', () => {
            Storage.loadSettings();
            UI.syncToggleStates();

            const categoryFilters = UI.DOM.categoryFilters();
            if (categoryFilters) {
                categoryFilters.style.display = AppState.getFiltersExpanded() ? 'block' : 'none';
            }

            loadWaterData();
            loadUSACEData();
            setInterval(updateTimeSinceUpdate, 60 * 1000);
            scheduleHourlyRefresh();
        });

        function scheduleHourlyRefresh() {
            const now = new Date();
            const currentMinutes = now.getMinutes();
            const currentSeconds = now.getSeconds();
            const minutesToWait = currentMinutes < 30 ? 30 - currentMinutes : 90 - currentMinutes;
            const millisecondsToWait = minutesToWait * 60 * 1000 - currentSeconds * 1000;

            setTimeout(() => {
                loadWaterData();
                loadUSACEData();
                setInterval(() => {
                    loadWaterData();
                    loadUSACEData();
                }, 60 * 60 * 1000);
            }, millisecondsToWait);
        }

        window.loadWaterData = loadWaterData;
        window.changePeriod = changePeriod;
        window.toggleFiltersVisibility = toggleFiltersVisibility;
        window.toggleTemperatureUnit = toggleTemperatureUnit;
        window.toggleSummaryVisibility = toggleSummaryVisibility;
        window.toggleDataTablesVisibility = toggleDataTablesVisibility;
        window.toggleUSACEVisibility = toggleUSACEVisibility;
        window.toggleAllCategories = toggleAllCategories;
