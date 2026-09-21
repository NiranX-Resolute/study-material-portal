// StudyVault Application Logic

class StudyVaultApp {
  constructor() {
    this.items = [];
    this.filteredItems = [];
    this.activeFilters = {
      subject: new Set(),
      source: new Set(),
      exam: new Set(),
      type: new Set(),
      status: 'all' // 'all', 'starred', 'completed'
    };
    this.searchQuery = '';
    this.sortBy = 'name_asc';
    this.viewMode = localStorage.getItem('studyvault_view_mode') || 'grid';
    this.currentPage = 1;
    this.itemsPerPage = 24;

    // LocalStorage state
    this.starredIds = new Set(JSON.parse(localStorage.getItem('studyvault_starred') || '[]'));
    this.completedIds = new Set(JSON.parse(localStorage.getItem('studyvault_completed') || '[]'));
    this.cloudBaseUrl = localStorage.getItem('studyvault_cloud_url') || '';

    this.initElements();
    this.initEventListeners();
    this.loadCatalog();
  }

  initElements() {
    this.searchInput = document.getElementById('searchInput');
    this.clearSearchBtn = document.getElementById('clearSearchBtn');
    this.sortSelect = document.getElementById('sortSelect');
    this.viewGridBtn = document.getElementById('viewGridBtn');
    this.viewListBtn = document.getElementById('viewListBtn');
    this.itemsContainer = document.getElementById('itemsContainer');
    this.emptyState = document.getElementById('emptyState');
    this.visibleCount = document.getElementById('visibleCount');
    this.totalMatchesCount = document.getElementById('totalMatchesCount');
    this.activeFilterPills = document.getElementById('activeFilterPills');
    this.prevPageBtn = document.getElementById('prevPageBtn');
    this.nextPageBtn = document.getElementById('nextPageBtn');
    this.currentPageNum = document.getElementById('currentPageNum');
    this.totalPagesNum = document.getElementById('totalPagesNum');
    this.pageNumbersContainer = document.getElementById('pageNumbersContainer');
    this.starredCount = document.getElementById('starredCount');
    this.completedCount = document.getElementById('completedCount');
    this.settingsModal = document.getElementById('settingsModal');
    this.cloudBaseUrlInput = document.getElementById('cloudBaseUrlInput');
    this.themeToggleBtn = document.getElementById('themeToggleBtn');
    this.themeIcon = document.getElementById('themeIcon');
  }

  initEventListeners() {
    // Search
    this.searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.trim().toLowerCase();
      this.clearSearchBtn.classList.toggle('hidden', !this.searchQuery);
      this.currentPage = 1;
      this.applyFilters();
    });

    this.clearSearchBtn.addEventListener('click', () => {
      this.searchInput.value = '';
      this.searchQuery = '';
      this.clearSearchBtn.classList.add('hidden');
      this.currentPage = 1;
      this.applyFilters();
      this.searchInput.focus();
    });

    // Keyboard shortcut to focus search
    window.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement !== this.searchInput) {
        e.preventDefault();
        this.searchInput.focus();
      } else if (e.key === 'Escape') {
        this.closeSettings();
        if (this.searchQuery) {
          this.searchInput.value = '';
          this.searchQuery = '';
          this.clearSearchBtn.classList.add('hidden');
          this.applyFilters();
        }
      }
    });

    // Sort
    this.sortSelect.addEventListener('change', (e) => {
      this.sortBy = e.target.value;
      this.sortItems();
      this.render();
    });

    // View toggles
    this.viewGridBtn.addEventListener('click', () => this.setViewMode('grid'));
    this.viewListBtn.addEventListener('click', () => this.setViewMode('list'));

    // Pagination
    this.prevPageBtn.addEventListener('click', () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });

    this.nextPageBtn.addEventListener('click', () => {
      const maxPages = Math.ceil(this.filteredItems.length / this.itemsPerPage);
      if (this.currentPage < maxPages) {
        this.currentPage++;
        this.render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });

    // Status filter buttons
    document.querySelectorAll('.tracker-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tracker-filter-btn').forEach(b => {
          b.classList.remove('bg-indigo-600', 'text-white');
          b.classList.add('text-slate-400');
        });
        btn.classList.add('bg-indigo-600', 'text-white');
        btn.classList.remove('text-slate-400');
        this.activeFilters.status = btn.dataset.status;
        this.currentPage = 1;
        this.applyFilters();
      });
    });

    // Reset filters button
    document.getElementById('resetFiltersBtn').addEventListener('click', () => this.resetFilters());
    document.getElementById('emptyResetBtn').addEventListener('click', () => this.resetFilters());

    // Settings Modal
    document.getElementById('settingsBtn').addEventListener('click', () => this.openSettings());
    document.getElementById('closeSettingsBtn').addEventListener('click', () => this.closeSettings());
    document.getElementById('saveSettingsBtn').addEventListener('click', () => this.saveSettings());

    // Theme Toggle
    this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());

    // Quick summary buttons
    document.getElementById('quickStarredBtn').addEventListener('click', () => {
      this.setTrackerStatus('starred');
    });
    document.getElementById('quickCompletedBtn').addEventListener('click', () => {
      this.setTrackerStatus('completed');
    });

    // Restore saved theme
    if (localStorage.getItem('studyvault_theme') === 'light') {
      document.body.classList.add('light-theme');
      this.themeIcon.setAttribute('data-lucide', 'moon');
    }
  }

  async loadCatalog() {
    try {
      this.itemsContainer.innerHTML = `
        <div class="col-span-full py-16 text-center text-slate-400">
          <div class="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p class="text-sm font-medium">Loading 4,753 study materials...</p>
        </div>
      `;
      const response = await fetch('catalog.json');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      this.items = await response.json();
      
      this.updateCounters();
      this.buildSidebarFilters();
      this.applyFilters();
    } catch (err) {
      console.error('Failed to load catalog.json:', err);
      this.itemsContainer.innerHTML = `
        <div class="col-span-full py-16 text-center text-rose-400">
          <p class="text-base font-semibold">Failed to load study catalog.</p>
          <p class="text-xs text-slate-400 mt-1">Please ensure catalog.json is available in the same directory.</p>
        </div>
      `;
    }
  }

  updateCounters() {
    this.starredCount.textContent = this.starredIds.size;
    this.completedCount.textContent = this.completedIds.size;
  }

  setTrackerStatus(status) {
    document.querySelectorAll('.tracker-filter-btn').forEach(btn => {
      const match = btn.dataset.status === status;
      btn.classList.toggle('bg-indigo-600', match);
      btn.classList.toggle('text-white', match);
      btn.classList.toggle('text-slate-400', !match);
    });
    this.activeFilters.status = status;
    this.currentPage = 1;
    this.applyFilters();
  }

  buildSidebarFilters() {
    // Collect counts for each facet
    const facets = {
      subject: {},
      source: {},
      exam: {},
      type: {}
    };

    this.items.forEach(item => {
      facets.subject[item.subject] = (facets.subject[item.subject] || 0) + 1;
      facets.source[item.source] = (facets.source[item.source] || 0) + 1;
      facets.exam[item.exam] = (facets.exam[item.exam] || 0) + 1;
      facets.type[item.type] = (facets.type[item.type] || 0) + 1;
    });

    this.renderFilterSection('subjectFilterContainer', 'subject', facets.subject);
    this.renderFilterSection('docTypeFilterContainer', 'type', facets.type);
    this.renderFilterSection('examFilterContainer', 'exam', facets.exam);
    this.renderFilterSection('sourceFilterContainer', 'source', facets.source);
  }

  renderFilterSection(containerId, facetKey, facetData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const sortedEntries = Object.entries(facetData).sort((a, b) => b[1] - a[1]);

    container.innerHTML = sortedEntries.map(([name, count]) => {
      const isChecked = this.activeFilters[facetKey].has(name);
      return `
        <label class="flex items-center justify-between text-xs py-1 px-1.5 rounded-lg hover:bg-slate-800/60 cursor-pointer text-slate-300 transition-colors">
          <div class="flex items-center gap-2 min-w-0 pr-2">
            <input 
              type="checkbox" 
              class="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 w-3.5 h-3.5"
              data-facet="${facetKey}"
              data-value="${name}"
              ${isChecked ? 'checked' : ''}
            >
            <span class="truncate" title="${name}">${name}</span>
          </div>
          <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono shrink-0">${count}</span>
        </label>
      `;
    }).join('');

    // Attach click events
    container.querySelectorAll('input[type="checkbox"]').forEach(input => {
      input.addEventListener('change', (e) => {
        const facet = e.target.dataset.facet;
        const value = e.target.dataset.value;
        if (e.target.checked) {
          this.activeFilters[facet].add(value);
        } else {
          this.activeFilters[facet].delete(value);
        }
        this.currentPage = 1;
        this.applyFilters();
      });
    });
  }

  applyFilters() {
    const tokens = this.searchQuery ? this.searchQuery.split(/\s+/).filter(Boolean) : [];

    this.filteredItems = this.items.filter(item => {
      // Status filter
      if (this.activeFilters.status === 'starred' && !this.starredIds.has(item.id)) return false;
      if (this.activeFilters.status === 'completed' && !this.completedIds.has(item.id)) return false;

      // Facet filters
      if (this.activeFilters.subject.size > 0 && !this.activeFilters.subject.has(item.subject)) return false;
      if (this.activeFilters.source.size > 0 && !this.activeFilters.source.has(item.source)) return false;
      if (this.activeFilters.exam.size > 0 && !this.activeFilters.exam.has(item.exam)) return false;
      if (this.activeFilters.type.size > 0 && !this.activeFilters.type.has(item.type)) return false;

      // Search tokens
      if (tokens.length > 0) {
        const searchText = `${item.name} ${item.topic} ${item.source} ${item.exam} ${item.subject} ${item.path}`.toLowerCase();
        for (const token of tokens) {
          if (!searchText.includes(token)) return false;
        }
      }

      return true;
    });

    this.sortItems();
    this.render();
  }

  sortItems() {
    switch (this.sortBy) {
      case 'name_asc':
        this.filteredItems.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
        break;
      case 'name_desc':
        this.filteredItems.sort((a, b) => b.name.localeCompare(a.name, undefined, { numeric: true }));
        break;
      case 'size_desc':
        this.filteredItems.sort((a, b) => b.bytes - a.bytes);
        break;
      case 'size_asc':
        this.filteredItems.sort((a, b) => a.bytes - b.bytes);
        break;
      case 'subject':
        this.filteredItems.sort((a, b) => a.subject.localeCompare(b.subject));
        break;
      case 'exam':
        this.filteredItems.sort((a, b) => a.exam.localeCompare(b.exam));
        break;
    }
  }

  render() {
    const total = this.filteredItems.length;
    this.totalMatchesCount.textContent = total;
    this.visibleCount.textContent = Math.min(total, this.itemsPerPage);

    // Empty state
    if (total === 0) {
      this.itemsContainer.classList.add('hidden');
      this.emptyState.classList.remove('hidden');
      document.getElementById('paginationBar').classList.add('hidden');
      this.renderActiveFilterPills();
      return;
    }

    this.itemsContainer.classList.remove('hidden');
    this.emptyState.classList.add('hidden');
    document.getElementById('paginationBar').classList.remove('hidden');

    // Pagination calculations
    const maxPages = Math.ceil(total / this.itemsPerPage) || 1;
    if (this.currentPage > maxPages) this.currentPage = maxPages;
    this.currentPageNum.textContent = this.currentPage;
    this.totalPagesNum.textContent = maxPages;
    this.prevPageBtn.disabled = this.currentPage === 1;
    this.nextPageBtn.disabled = this.currentPage === maxPages;

    this.renderPaginationPills(maxPages);

    // Slice current page
    const startIdx = (this.currentPage - 1) * this.itemsPerPage;
    const pageItems = this.filteredItems.slice(startIdx, startIdx + this.itemsPerPage);

    // Render cards or list
    if (this.viewMode === 'grid') {
      this.itemsContainer.className = 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4';
      this.itemsContainer.innerHTML = pageItems.map(item => this.createCardHtml(item)).join('');
    } else {
      this.itemsContainer.className = 'flex flex-col gap-2';
      this.itemsContainer.innerHTML = pageItems.map(item => this.createRowHtml(item)).join('');
    }

    this.renderActiveFilterPills();

    // Re-initialize Lucide icons on newly inserted DOM elements
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  getSubjectBadgeColor(subject) {
    switch (subject) {
      case 'Mathematics':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'Physics':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'Chemistry':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Astronomy & Astrophysics':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Biology & Medical':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  }

  createCardHtml(item) {
    const isStarred = this.starredIds.has(item.id);
    const isCompleted = this.completedIds.has(item.id);
    const badgeColor = this.getSubjectBadgeColor(item.subject);

    return `
      <div class="study-card rounded-2xl p-4 flex flex-col justify-between relative group">
        
        <!-- Header: Subject & Size -->
        <div class="space-y-2">
          <div class="flex items-center justify-between gap-2 text-xs">
            <span class="px-2 py-0.5 rounded-full border text-[11px] font-semibold ${badgeColor}">
              ${item.subject}
            </span>
            <span class="text-slate-400 font-mono text-[11px] bg-slate-900/60 px-1.5 py-0.5 rounded border border-slate-800">
              ${item.size}
            </span>
          </div>

          <!-- Title -->
          <h3 class="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors line-clamp-2" title="${item.name}">
            ${item.name}
          </h3>

          <!-- Tags -->
          <div class="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400 pt-1">
            <span class="px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700/50 text-slate-300 font-medium">
              ${item.topic}
            </span>
            <span class="px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700/50 text-slate-300">
              ${item.exam}
            </span>
            <span class="px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700/50 text-slate-300">
              ${item.type}
            </span>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between gap-2 text-xs">
          
          <!-- Local Path Copy Buttons -->
          <div class="flex items-center gap-1.5">
            <button 
              onclick="window.studyVault.copyPath('${this.escapeQuotes(item.full_path)}')"
              class="p-1.5 bg-slate-800/80 hover:bg-indigo-600 hover:text-white rounded-lg text-slate-400 transition-all border border-slate-700/60" 
              title="Copy Windows Path to Clipboard"
            >
              <i data-lucide="copy" class="w-3.5 h-3.5"></i>
            </button>
            <button 
              onclick="window.studyVault.copyFileUri('${this.escapeQuotes(item.full_path)}')"
              class="p-1.5 bg-slate-800/80 hover:bg-cyan-600 hover:text-white rounded-lg text-slate-400 transition-all border border-slate-700/60" 
              title="Copy file:// Link"
            >
              <i data-lucide="link" class="w-3.5 h-3.5"></i>
            </button>
            ${this.cloudBaseUrl ? `
              <a 
                href="${this.getCloudUrl(item.path)}" 
                target="_blank" 
                class="p-1.5 bg-slate-800/80 hover:bg-emerald-600 hover:text-white rounded-lg text-slate-400 transition-all border border-slate-700/60"
                title="Open Cloud Link"
              >
                <i data-lucide="cloud-download" class="w-3.5 h-3.5"></i>
              </a>
            ` : ''}
          </div>

          <!-- Study Tracker Toggle Buttons -->
          <div class="flex items-center gap-1">
            <button 
              onclick="window.studyVault.toggleStar(${item.id})" 
              class="p-1.5 rounded-lg transition-all ${isStarred ? 'text-amber-400 bg-amber-400/10' : 'text-slate-500 hover:text-amber-400 hover:bg-slate-800'}"
              title="${isStarred ? 'Unstar' : 'Star for Later'}"
            >
              <i data-lucide="star" class="w-3.5 h-3.5 ${isStarred ? 'fill-amber-400' : ''}"></i>
            </button>
            <button 
              onclick="window.studyVault.toggleCompleted(${item.id})" 
              class="p-1.5 rounded-lg transition-all ${isCompleted ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-500 hover:text-emerald-400 hover:bg-slate-800'}"
              title="${isCompleted ? 'Mark as Incomplete' : 'Mark as Completed'}"
            >
              <i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>

        </div>

      </div>
    `;
  }

  createRowHtml(item) {
    const isStarred = this.starredIds.has(item.id);
    const isCompleted = this.completedIds.has(item.id);
    const badgeColor = this.getSubjectBadgeColor(item.subject);

    return `
      <div class="study-card rounded-xl p-3 flex items-center justify-between gap-4 text-xs">
        <div class="flex items-center gap-3 min-w-0 flex-1">
          <span class="px-2 py-0.5 rounded-full border text-[10px] font-semibold ${badgeColor} shrink-0">
            ${item.subject}
          </span>
          <div class="min-w-0 flex-1">
            <h4 class="font-medium text-slate-100 truncate hover:text-indigo-300 cursor-pointer" title="${item.name}" onclick="window.studyVault.copyPath('${this.escapeQuotes(item.full_path)}')">
              ${item.name}
            </h4>
            <p class="text-[11px] text-slate-400 truncate">${item.path}</p>
          </div>
        </div>

        <div class="flex items-center gap-3 shrink-0">
          <span class="text-slate-400 font-mono text-[11px]">${item.size}</span>
          <button 
            onclick="window.studyVault.copyPath('${this.escapeQuotes(item.full_path)}')"
            class="p-1.5 hover:bg-indigo-600 hover:text-white rounded text-slate-400 transition-colors" 
            title="Copy Path"
          >
            <i data-lucide="copy" class="w-3.5 h-3.5"></i>
          </button>
          <button 
            onclick="window.studyVault.toggleStar(${item.id})" 
            class="p-1.5 rounded transition-colors ${isStarred ? 'text-amber-400' : 'text-slate-500 hover:text-amber-400'}"
          >
            <i data-lucide="star" class="w-3.5 h-3.5 ${isStarred ? 'fill-amber-400' : ''}"></i>
          </button>
          <button 
            onclick="window.studyVault.toggleCompleted(${item.id})" 
            class="p-1.5 rounded transition-colors ${isCompleted ? 'text-emerald-400' : 'text-slate-500 hover:text-emerald-400'}"
          >
            <i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>
    `;
  }

  renderPaginationPills(maxPages) {
    if (maxPages <= 1) {
      this.pageNumbersContainer.innerHTML = '';
      return;
    }

    let pages = [];
    const current = this.currentPage;

    if (maxPages <= 5) {
      for (let i = 1; i <= maxPages; i++) pages.push(i);
    } else {
      if (current <= 3) {
        pages = [1, 2, 3, '...', maxPages];
      } else if (current >= maxPages - 2) {
        pages = [1, '...', maxPages - 2, maxPages - 1, maxPages];
      } else {
        pages = [1, '...', current, '...', maxPages];
      }
    }

    this.pageNumbersContainer.innerHTML = pages.map(p => {
      if (p === '...') {
        return `<span class="px-2 text-xs text-slate-500">...</span>`;
      }
      const isActive = p === current;
      return `
        <button 
          onclick="window.studyVault.goToPage(${p})"
          class="w-7 h-7 rounded-lg text-xs font-medium transition-all ${isActive ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'}"
        >
          ${p}
        </button>
      `;
    }).join('');
  }

  goToPage(page) {
    this.currentPage = page;
    this.render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  renderActiveFilterPills() {
    const pills = [];

    if (this.searchQuery) {
      pills.push({ label: `"${this.searchQuery}"`, onRemove: () => { this.searchInput.value = ''; this.searchQuery = ''; this.clearSearchBtn.classList.add('hidden'); this.applyFilters(); } });
    }

    if (this.activeFilters.status !== 'all') {
      pills.push({ label: `Status: ${this.activeFilters.status}`, onRemove: () => this.setTrackerStatus('all') });
    }

    ['subject', 'source', 'exam', 'type'].forEach(facet => {
      this.activeFilters[facet].forEach(val => {
        pills.push({
          label: val,
          onRemove: () => {
            this.activeFilters[facet].delete(val);
            const checkbox = document.querySelector(`input[data-facet="${facet}"][data-value="${val}"]`);
            if (checkbox) checkbox.checked = false;
            this.applyFilters();
          }
        });
      });
    });

    if (pills.length === 0) {
      this.activeFilterPills.innerHTML = `<span class="text-xs text-slate-500 italic">No active filters</span>`;
      return;
    }

    this.activeFilterPills.innerHTML = pills.map((pill, idx) => `
      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-medium">
        ${pill.label}
        <button onclick="window.studyVault.removePill(${idx})" class="hover:text-white p-0.5">
          <i data-lucide="x" class="w-3 h-3"></i>
        </button>
      </span>
    `).join('') + `
      <button onclick="window.studyVault.resetFilters()" class="text-xs text-slate-400 hover:text-indigo-400 font-medium ml-2">
        Clear All
      </button>
    `;

    this._activePills = pills;
  }

  removePill(idx) {
    if (this._activePills && this._activePills[idx]) {
      this._activePills[idx].onRemove();
    }
  }

  resetFilters() {
    this.searchQuery = '';
    this.searchInput.value = '';
    this.clearSearchBtn.classList.add('hidden');
    this.activeFilters.subject.clear();
    this.activeFilters.source.clear();
    this.activeFilters.exam.clear();
    this.activeFilters.type.clear();
    this.setTrackerStatus('all');

    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    this.currentPage = 1;
    this.applyFilters();
  }

  setViewMode(mode) {
    this.viewMode = mode;
    localStorage.setItem('studyvault_view_mode', mode);
    this.viewGridBtn.classList.toggle('bg-slate-800', mode === 'grid');
    this.viewGridBtn.classList.toggle('text-slate-200', mode === 'grid');
    this.viewGridBtn.classList.toggle('text-slate-400', mode !== 'grid');

    this.viewListBtn.classList.toggle('bg-slate-800', mode === 'list');
    this.viewListBtn.classList.toggle('text-slate-200', mode === 'list');
    this.viewListBtn.classList.toggle('text-slate-400', mode !== 'list');
    this.render();
  }

  toggleStar(id) {
    if (this.starredIds.has(id)) {
      this.starredIds.delete(id);
      this.showToast('Removed from Starred');
    } else {
      this.starredIds.add(id);
      this.showToast('Added to Starred ⭐');
    }
    localStorage.setItem('studyvault_starred', JSON.stringify(Array.from(this.starredIds)));
    this.updateCounters();
    this.render();
  }

  toggleCompleted(id) {
    if (this.completedIds.has(id)) {
      this.completedIds.delete(id);
      this.showToast('Marked as Incomplete');
    } else {
      this.completedIds.add(id);
      this.showToast('Marked as Completed ✅');
    }
    localStorage.setItem('studyvault_completed', JSON.stringify(Array.from(this.completedIds)));
    this.updateCounters();
    this.render();
  }

  copyPath(path) {
    navigator.clipboard.writeText(path).then(() => {
      this.showToast('Copied Windows path to clipboard!');
    }).catch(err => {
      console.error('Failed to copy path:', err);
    });
  }

  copyFileUri(path) {
    const uri = 'file:///' + path.replace(/\\/g, '/');
    navigator.clipboard.writeText(uri).then(() => {
      this.showToast('Copied file:/// URI to clipboard!');
    });
  }

  getCloudUrl(relPath) {
    if (!this.cloudBaseUrl) return '#';
    const cleanBase = this.cloudBaseUrl.replace(/\/+$/, '');
    return `${cleanBase}/${relPath}`;
  }

  openSettings() {
    this.cloudBaseUrlInput.value = this.cloudBaseUrl;
    this.settingsModal.classList.remove('hidden');
  }

  closeSettings() {
    this.settingsModal.classList.add('hidden');
  }

  saveSettings() {
    this.cloudBaseUrl = this.cloudBaseUrlInput.value.trim();
    localStorage.setItem('studyvault_cloud_url', this.cloudBaseUrl);
    this.closeSettings();
    this.showToast('Settings saved!');
    this.render();
  }

  toggleTheme() {
    const isLight = document.body.classList.toggle('light-theme');
    localStorage.setItem('studyvault_theme', isLight ? 'light' : 'dark');
    this.themeIcon.setAttribute('data-lucide', isLight ? 'moon' : 'sun');
    if (window.lucide) window.lucide.createIcons();
  }

  showToast(message) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <i data-lucide="check" class="w-4 h-4 text-emerald-400"></i>
      <span>${message}</span>
    `;
    container.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.2s ease';
      setTimeout(() => toast.remove(), 200);
    }, 2500);
  }

  escapeQuotes(str) {
    return (str || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  window.studyVault = new StudyVaultApp();
});
