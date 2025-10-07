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

        const tableContainer = createDayTable(schedule, date, label, currentHour, key === dates[1].key, key);
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

function createDayTable(schedule, date, label, currentHour, isToday, key) {
    const container = document.createElement('div');
    container.className = 'table-container';

    if (isToday && label === 'Current Day') {
        container.id = 'dam-current-day-table';
    }

    const collapsedTables = AppState.getCollapsedTables();
    const collapsedKey = 'usace-' + key;
    let isCollapsed = collapsedTables[collapsedKey] || false;

    const title = document.createElement('div');
    title.className = 'day-table-title';
    title.innerHTML = `
        <span>${label}</span>
        <span class="day-date">${date.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })}</span>
    `;

    isCollapsed = UI.createTableHeaderWithToggle(title, collapsedKey, container);

    const table = document.createElement('table');
    table.className = 'generation-table';
    if (isCollapsed) {
        table.style.display = 'none';
    }

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

function getDisplayInfo(measurements, isTemperature, preferFahrenheit) {
    if (measurements.length === 0) return { text: '<span style="color: #dc3545;">N/A</span>', value: null };
    let rawValue = measurements[0].value;
    if (isTemperature) {
        const fahrenheit = Utils.celsiusToFahrenheit(rawValue);
        const displayValue = preferFahrenheit ? fahrenheit : rawValue;
        return {
            text: `${displayValue.toFixed(1)}${preferFahrenheit ? '°F' : '°C'}`,
            value: fahrenheit
        };
    } else {
        return {
            text: rawValue.toFixed(2),
            value: rawValue
        };
    }
}

function getConditionClass(value, categoryName, isTemperature) {
    if (isTemperature) {
        if (value >= 45 && value <= 65) return 'good';
        if ((value >= 40 && value < 45) || (value > 65 && value <= 67)) return 'caution';
        return 'poor';
    }
    const lower = categoryName.toLowerCase();
    if (lower.includes('gage height')) {
        if (value < 3.5) return 'good';
        if (value >= 3.5 && value <= 4) return 'caution';
        return 'poor';
    }
    if (lower.includes('turbidity')) {
        if (value <= 8) return 'good';
        if (value > 8 && value < 9) return 'caution';
        return 'poor';
    }
    if (lower.includes('streamflow')) {
        if (value <= 1000) return 'good';
        if (value > 1000 && value < 3000) return 'caution';
        return 'poor';
    }
    return '';
}

function calculateTimeSince(measurements) {
    if (measurements.length === 0) return '<span style="color: #dc3545;">N/A</span>';
    const lastTime = new Date(measurements[0].datetime);
    const now = new Date();
    const diffMinutes = Math.floor((now - lastTime) / (1000 * 60));
    if (diffMinutes < 60) {
        return `${diffMinutes} minutes ago`;
    } else {
        const diffHours = Math.floor(diffMinutes / 60);
        const remainingMinutes = diffMinutes % 60;
        return `${diffHours}h ${remainingMinutes}m ago`;
    }
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

    const preferFahrenheit = AppState.getUseFahrenheit();
    const isTemperature = categoryName.toLowerCase().includes('temperature') ||
        categoryName.includes('°C') ||
        categoryName.includes('deg C');

    const { text, value } = getDisplayInfo(measurements, isTemperature, preferFahrenheit);
    latestValue.innerHTML = text;

    // Add condition-based CSS class
    const conditionClass = getConditionClass(value, categoryName, isTemperature);
    if (conditionClass) latestValue.classList.add(conditionClass);

    summaryInfo.appendChild(latestValue);

    const timeSince = document.createElement('div');
    timeSince.className = 'time-since';
    timeSince.innerHTML = calculateTimeSince(measurements);
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

        const latestTime = new Date(measurements[0]?.datetime || '');
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
                const currentTime = new Date(measurements[i]?.datetime || '');
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

    // Add condition-based CSS class to dam-current-value
    if (currentPeriod) {
        const currentGen = currentPeriod.generation;
        const triggerTime = Storage.getGenerationTriggerTime();
        let hoursSinceHighGeneration = null;

        if (triggerTime) {
            const triggerTimestamp = parseInt(triggerTime, 10);
            const now = new Date();
            hoursSinceHighGeneration = (now.getTime() - triggerTimestamp) / (1000 * 60 * 60);
        }

        // Logic based on recent high generation activity
        if (currentGen < 5 && (!triggerTime || hoursSinceHighGeneration > 8)) {
            // Generation currently < 5 MW and no recent high generation (or high generation was >8 hours ago)
            currentValue.classList.add('good');
        } else if (currentGen >= 5 || (triggerTime && hoursSinceHighGeneration <= 4)) {
            // Generation currently >= 5 MW OR high generation within last 6 hours
            currentValue.classList.add('caution');
        } else if (currentGen < 5 && triggerTime && hoursSinceHighGeneration > 4 && hoursSinceHighGeneration <= 8) {
            // Generation currently < 5 MW but high generation occurred 4-8 hours ago
            currentValue.classList.add('poor');
        }
    }

    damInfo.appendChild(currentValue);

    const statusInfo = document.createElement('div');
    statusInfo.className = 'dam-status-info';
    if (data?.timestamp) {
        const now = new Date();
        const updateTime = new Date(data.timestamp);
        const diffMinutes = Math.floor((now - updateTime) / (1000 * 60));
        let timeText = Utils.formatTimeAgo(diffMinutes);
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

            const collapsedTables = AppState.getCollapsedTables();
            let isCollapsed = collapsedTables[categoryName] || false;

            const title = document.createElement('h3');
            title.textContent = categoryName;
            title.style.margin = '0';
            title.style.color = '#333';
            if (measurements.originalTitle) {
                title.title = measurements.originalTitle;
                title.style.cursor = 'help';
            }

            isCollapsed = UI.createTableHeaderWithToggle(title, categoryName, tableContainer);

            const table = document.createElement('table');
            table.className = 'data-table';
            if (isCollapsed) {
                table.style.display = 'none';
            }

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
            if (isCollapsed) {
                scrollHint.style.display = 'none';
            }
            tableContainer.appendChild(scrollHint);

            fragment.appendChild(tableContainer);
        });
    });

    const hasTableContent = dataContainer.children.length > 0;
    dataTablesSection.style.display = hasTableContent ? 'block' : 'none';

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

function updateTimeSinceUpdate() {
    const lastUpdated = UI.DOM.lastUpdated();
    if (!lastUpdated) return;

    const updateTime = lastUpdated.getAttribute('data-update-time');
    if (!updateTime) return;

    const now = new Date();
    const updateDate = new Date(parseInt(updateTime, 10));
    const diffMinutes = Math.floor((now - updateDate) / (1000 * 60));

    let timeText = Utils.formatTimeAgo(diffMinutes);

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
