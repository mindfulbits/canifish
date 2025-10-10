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

    UI.scrollToElement(tableElement);
}

function scrollToDamTable() {
    const damCurrentDayTable = document.getElementById('dam-current-day-table');
    if (!damCurrentDayTable) return;

    UI.scrollToElement(damCurrentDayTable);
}

function toggleSummaryVisibility() {
    const newValue = !AppState.getSummaryExpanded();
    AppState.setSummaryExpanded(newValue);
    Storage.saveSettings();
    const summaryContainer = UI.DOM.summaryContainer();
    if (summaryContainer) {
        summaryContainer.style.display = newValue ? 'grid' : 'none';
    }
    UI.syncToggleStates();
}

function toggleTableVisibility(categoryName) {
    const updatedCollapsed = { ...AppState.getCollapsedTables() };
    updatedCollapsed[categoryName] = !updatedCollapsed[categoryName];
    AppState.setCollapsedTables(updatedCollapsed);
    Storage.saveSettings();
    if (categoryName.startsWith('usace-')) {
        displayUSACEData(AppState.getUsaceData());
    } else {
        displayTable(AppState.getCurrentData());
    }
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
window.toggleTableVisibility = toggleTableVisibility;
window.toggleAllCategories = toggleAllCategories;
