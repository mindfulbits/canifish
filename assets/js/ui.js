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
        const { getFiltersExpanded, getSummaryExpanded, getUseFahrenheit } = AppState;
        const filtersBtn = DOM.filtersToggleBtn();
        const summaryBtn = DOM.summaryToggleBtn();
        const tempToggleInput = DOM.tempToggleInput();

        if (filtersBtn) {
            filtersBtn.textContent = getFiltersExpanded() ? 'Hide Filters' : 'Show Filters';
        }

        if (summaryBtn) {
            summaryBtn.textContent = getSummaryExpanded() ? 'Collapse' : 'Expand';
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

    function createTableHeaderWithToggle(titleElement, toggleKey, container) {
        // Create header with title and toggle button
        const tableHeader = document.createElement('div');
        tableHeader.className = 'table-header';
        tableHeader.style.display = 'flex';
        tableHeader.style.alignItems = 'center';
        tableHeader.style.justifyContent = 'space-between';
        tableHeader.style.marginBottom = '15px';

        tableHeader.appendChild(titleElement);

        const collapsedTables = AppState.getCollapsedTables();
        const isCollapsed = collapsedTables[toggleKey] || false;

        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'table-toggle-btn';
        toggleBtn.textContent = isCollapsed ? 'Expand' : 'Collapse';
        toggleBtn.addEventListener('click', () => toggleTableVisibility(toggleKey));
        tableHeader.appendChild(toggleBtn);

        container.appendChild(tableHeader);

        return isCollapsed;
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
        scrollToElement,
        createTableHeaderWithToggle
    };
})();
