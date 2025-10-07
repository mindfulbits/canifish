const Storage = (() => {
    const storagePrefix = 'canifish';
    const storageKeys = {
        visibleCategories: `${storagePrefix}VisibleCategories`,
        filtersExpanded: `${storagePrefix}FiltersExpanded`,
        useFahrenheit: `${storagePrefix}UseFahrenheit`,
        summaryExpanded: `${storagePrefix}SummaryExpanded`,
        dataTablesExpanded: `${storagePrefix}DataTablesExpanded`,
        collapsedTables: `${storagePrefix}CollapsedTables`,
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

            const collapsedTables = loadJSON(storageKeys.collapsedTables, {});
            AppState.setCollapsedTables(collapsedTables);
        },
        saveSettings() {
            const { getVisibleCategories, getFiltersExpanded, getUseFahrenheit, getSummaryExpanded, getDataTablesExpanded, getCollapsedTables } = AppState;
            saveJSON(storageKeys.visibleCategories, getVisibleCategories());
            saveJSON(storageKeys.filtersExpanded, getFiltersExpanded());
            saveJSON(storageKeys.useFahrenheit, getUseFahrenheit());
            saveJSON(storageKeys.summaryExpanded, getSummaryExpanded());
            saveJSON(storageKeys.dataTablesExpanded, getDataTablesExpanded());
            saveJSON(storageKeys.collapsedTables, getCollapsedTables());
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
