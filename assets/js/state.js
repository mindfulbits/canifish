const AppState = (() => {
    let currentPeriod = 'PT3H';
    let currentData = {};
    let visibleCategories = {};
    let usaceData = null;
    let filtersExpanded = false;
    let summaryExpanded = true;
    let dataTablesExpanded = true;
    let collapsedTables = {};
    let useFahrenheit = false;

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
        getCollapsedTables: () => collapsedTables,
        setCollapsedTables: (tables) => {
            collapsedTables = tables;
        }
    };
})();
