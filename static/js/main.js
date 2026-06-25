document.addEventListener('DOMContentLoaded', () => {
    // State Variables
    let allReleases = [];
    let filteredReleases = [];
    let activeFilter = 'all';
    let searchQuery = '';
    let sortBy = 'newest';

    // DOM Elements
    const releasesContainer = document.getElementById('releases-container');
    const loaderSkeleton = document.getElementById('loader-skeleton');
    const errorState = document.getElementById('error-state');
    const errorMessage = document.getElementById('error-message');
    const emptyState = document.getElementById('empty-state');
    const resultsCount = document.getElementById('results-count');
    const feedTitle = document.getElementById('feed-title');
    
    const searchInput = document.getElementById('search-input');
    const clearSearchBtn = document.getElementById('clear-search');
    const categoryFilters = document.getElementById('category-filters');
    const sortSelect = document.getElementById('sort-select');
    
    const themeToggleBtn = document.getElementById('theme-toggle');
    const refreshBtn = document.getElementById('refresh-btn');
    const exportBtn = document.getElementById('export-btn');
    const retryBtn = document.getElementById('retry-btn');
    const resetFiltersBtn = document.getElementById('reset-filters-btn');
    
    // Stats Elements
    const statTotal = document.querySelector('#stat-total .stat-value');
    const statFeature = document.getElementById('val-feature');
    const statBug = document.getElementById('val-bug');
    const statWarn = document.getElementById('val-warn');
    const statCards = document.querySelectorAll('.stat-card');

    // 1. Theme Configuration
    const loadSavedTheme = () => {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        if (savedTheme === 'light') {
            document.body.classList.remove('dark-theme');
            document.body.classList.add('light-theme');
        } else {
            document.body.classList.remove('light-theme');
            document.body.classList.add('dark-theme');
        }
    };

    themeToggleBtn.addEventListener('click', () => {
        if (document.body.classList.contains('dark-theme')) {
            document.body.classList.remove('dark-theme');
            document.body.classList.add('light-theme');
            localStorage.setItem('theme', 'light');
        } else {
            document.body.classList.remove('light-theme');
            document.body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
        }
    });

    // Initialize Theme
    loadSavedTheme();

    // 2. Fetch Release Notes API
    const fetchReleases = async (force = false) => {
        showLoadingState();
        try {
            const url = force ? '/api/releases?force=true' : '/api/releases';
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (data.status === 'success') {
                allReleases = data.releases;
                calculateStats(allReleases);
                applyFiltersAndRender();
            } else {
                throw new Error(data.message || 'Unknown server error');
            }
        } catch (error) {
            console.error('Fetch error:', error);
            showErrorState(error.message);
        }
    };

    // 3. Stats Calculation
    const calculateStats = (releases) => {
        statTotal.textContent = releases.length;
        
        let featureCount = 0;
        let bugCount = 0;
        let warnCount = 0;

        releases.forEach(release => {
            const cats = release.categories.map(c => c.toLowerCase());
            if (cats.includes('feature')) featureCount++;
            if (cats.includes('bug fix') || cats.includes('fix')) bugCount++;
            if (cats.includes('deprecation')) warnCount++;
        });

        statFeature.textContent = featureCount;
        statBug.textContent = bugCount;
        statWarn.textContent = warnCount;
    };

    // 4. Filtering and Sorting Logic
    const applyFiltersAndRender = () => {
        let filtered = [...allReleases];

        // Apply Category Filter
        if (activeFilter !== 'all') {
            filtered = filtered.filter(release => 
                release.categories.some(cat => cat.toLowerCase() === activeFilter.toLowerCase())
            );
        }

        // Apply Search Query Filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(release => {
                const titleMatch = release.title.toLowerCase().includes(query);
                const contentMatch = release.content.toLowerCase().includes(query);
                const categoryMatch = release.categories.some(cat => cat.toLowerCase().includes(query));
                return titleMatch || contentMatch || categoryMatch;
            });
        }

        // Apply Sorting
        filtered.sort((a, b) => {
            const dateA = new Date(a.updated || a.title);
            const dateB = new Date(b.updated || b.title);
            return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
        });

        filteredReleases = filtered;
        renderReleases(filtered);
    };

    // 5. Render to UI
    const renderReleases = (releases) => {
        hideAllStates();
        resultsCount.textContent = `${releases.length} results`;
        
        if (activeFilter === 'all') {
            feedTitle.textContent = 'All Release Notes';
        } else {
            feedTitle.textContent = `${activeFilter} Updates`;
        }

        if (releases.length === 0) {
            emptyState.classList.remove('hidden');
            releasesContainer.innerHTML = '';
            return;
        }

        releasesContainer.innerHTML = '';
        
        releases.forEach((release, index) => {
            const card = document.createElement('article');
            card.className = 'release-card card-appear';
            card.style.animationDelay = `${index * 0.05}s`;
            card.id = `release-${index}`;
            card.setAttribute('tabindex', '0');
            
            // Build category tags HTML
            let tagsHtml = '';
            release.categories.forEach(cat => {
                let tagClass = 'tag-announcement';
                const lowerCat = cat.toLowerCase();
                if (lowerCat === 'feature') tagClass = 'tag-feature';
                else if (lowerCat === 'bug fix' || lowerCat === 'fix') tagClass = 'tag-bug-fix';
                else if (lowerCat === 'deprecation') tagClass = 'tag-deprecation';
                
                tagsHtml += `<span class="category-tag ${tagClass}">${cat}</span>`;
            });

            // Parse readable timestamp
            let timeStr = '';
            if (release.updated) {
                try {
                    const dateObj = new Date(release.updated);
                    timeStr = dateObj.toLocaleString('en-US', { 
                        hour: 'numeric', 
                        minute: 'numeric', 
                        hour12: true,
                        timeZoneName: 'short' 
                    });
                } catch(e) {
                    timeStr = '';
                }
            }

            card.innerHTML = `
                <div class="card-header">
                    <div class="card-meta">
                        <h3 class="release-date">${release.title}</h3>
                        ${timeStr ? `<span class="release-timestamp"><i class="fa-regular fa-clock"></i> ${timeStr}</span>` : ''}
                    </div>
                    <div class="card-tags">
                        ${tagsHtml}
                    </div>
                </div>
                <div class="release-card-body">
                    ${release.content}
                </div>
                <div class="card-actions">
                    <button class="btn-copy" aria-label="Copy to Clipboard">
                        <i class="fa-regular fa-copy"></i> <span>Copy</span>
                    </button>
                    <button class="btn-tweet" aria-label="Tweet this update">
                        <i class="fa-brands fa-x-twitter"></i> <span>Tweet</span>
                    </button>
                </div>
            `;

            // Simple keyboard navigation for accessibility
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    card.classList.toggle('expanded');
                }
            });

            // HTML stripping utility
            const stripHtml = (html) => {
                const tmp = document.createElement("div");
                tmp.innerHTML = html;
                return tmp.textContent || tmp.innerText || "";
            };

            // Copy button click handler
            const copyBtn = card.querySelector('.btn-copy');
            copyBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent card selection/expansion trigger
                
                const plainText = stripHtml(release.content).replace(/\s+/g, ' ').trim();
                const copyText = `BigQuery Update (${release.title}):\n${plainText}`;
                
                navigator.clipboard.writeText(copyText).then(() => {
                    const icon = copyBtn.querySelector('i');
                    const text = copyBtn.querySelector('span');
                    icon.className = 'fa-solid fa-check';
                    text.textContent = 'Copied!';
                    copyBtn.classList.add('copied');
                    
                    setTimeout(() => {
                        icon.className = 'fa-regular fa-copy';
                        text.textContent = 'Copy';
                        copyBtn.classList.remove('copied');
                    }, 2000);
                }).catch(err => {
                    console.error('Failed to copy text: ', err);
                });
            });

            // Tweet button click handler
            const tweetBtn = card.querySelector('.btn-tweet');
            tweetBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent card selection/expansion trigger
                
                const plainText = stripHtml(release.content).replace(/\s+/g, ' ').trim();
                const prefix = `BigQuery Update (${release.title}):\n"`;
                const suffix = `"\n\n#BigQuery #GoogleCloud`;
                const maxSnippetLength = 280 - prefix.length - suffix.length - 5;
                const truncatedContent = plainText.length > maxSnippetLength 
                    ? plainText.substring(0, maxSnippetLength) + '...' 
                    : plainText;
                
                const tweetText = `${prefix}${truncatedContent}${suffix}`;
                const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
                window.open(twitterUrl, '_blank', 'noopener,noreferrer');
            });

            releasesContainer.appendChild(card);
        });
    };

    // UI State Helpers
    const showLoadingState = () => {
        hideAllStates();
        loaderSkeleton.classList.remove('hidden');
    };

    const showErrorState = (msg) => {
        hideAllStates();
        errorMessage.textContent = msg || 'Something went wrong while connecting to the BigQuery release feed.';
        errorState.classList.remove('hidden');
    };

    const hideAllStates = () => {
        loaderSkeleton.classList.add('hidden');
        errorState.classList.add('hidden');
        emptyState.classList.add('hidden');
    };

    // 6. Event Handlers
    
    // Search input handler with clear button display
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        if (searchQuery.trim()) {
            clearSearchBtn.style.display = 'block';
        } else {
            clearSearchBtn.style.display = 'none';
        }
        applyFiltersAndRender();
    });

    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.style.display = 'none';
        searchInput.focus();
        applyFiltersAndRender();
    });

    // Category button filters
    categoryFilters.addEventListener('click', (e) => {
        const badge = e.target.closest('.badge');
        if (!badge) return;

        // Toggle Active Badge
        document.querySelectorAll('#category-filters .badge').forEach(b => b.classList.remove('active'));
        badge.classList.add('active');

        activeFilter = badge.getAttribute('data-filter');
        applyFiltersAndRender();
    });

    // Interactive Dashboard Stat Cards
    statCards.forEach(card => {
        card.addEventListener('click', () => {
            const cat = card.getAttribute('data-cat') || 'all';
            
            // Find and activate the corresponding filter badge
            const targetBadge = document.querySelector(`#category-filters .badge[data-filter="${cat}"]`);
            if (targetBadge) {
                document.querySelectorAll('#category-filters .badge').forEach(b => b.classList.remove('active'));
                targetBadge.classList.add('active');
                activeFilter = cat;
                applyFiltersAndRender();
                
                // Scroll down to the feed header smoothly
                document.querySelector('.feed-section').scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Sort Handler
    sortSelect.addEventListener('change', (e) => {
        sortBy = e.target.value;
        applyFiltersAndRender();
    });

    // Refresh & Retry button handlers
    refreshBtn.addEventListener('click', () => {
        // Spin animation
        const icon = refreshBtn.querySelector('i');
        icon.style.transition = 'transform 0.6s ease';
        icon.style.transform = 'rotate(360deg)';
        setTimeout(() => {
            icon.style.transition = 'none';
            icon.style.transform = 'rotate(0deg)';
        }, 600);
        
        // Fetch new data bypass cache
        fetchReleases(true);
    });

    retryBtn.addEventListener('click', () => fetchReleases(true));

    // Export to CSV handler
    exportBtn.addEventListener('click', () => {
        if (!filteredReleases || filteredReleases.length === 0) {
            alert('No release notes available to export.');
            return;
        }

        // Helper to escape values for CSV
        const escapeCSV = (val) => {
            if (val === null || val === undefined) return '';
            let formatted = val.toString().replace(/"/g, '""'); // escape double quotes
            if (formatted.search(/("|,|\n)/g) >= 0) {
                formatted = `"${formatted}"`; // wrap in quotes if it has comma, quote or newline
            }
            return formatted;
        };

        // CSV Header
        let csvContent = "Date/Title,Categories,Content,ID\n";

        // Helper to strip HTML for plain text CSV content
        const stripHtml = (html) => {
            const tmp = document.createElement("div");
            tmp.innerHTML = html;
            return tmp.textContent || tmp.innerText || "";
        };

        // CSV rows
        filteredReleases.forEach(release => {
            const date = escapeCSV(release.title);
            const categories = escapeCSV(release.categories.join('; '));
            const plainText = stripHtml(release.content).replace(/\s+/g, ' ').trim();
            const content = escapeCSV(plainText);
            const id = escapeCSV(release.id);
            
            csvContent += `${date},${categories},${content},${id}\n`;
        });

        // Trigger browser download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        
        // Generate filename based on active filters
        const categoryStr = activeFilter !== 'all' ? `-${activeFilter.toLowerCase().replace(/\s+/g, '-')}` : '';
        const searchStr = searchQuery ? `-search-${searchQuery.toLowerCase().substring(0, 10).replace(/[^a-z0-9]/g, '')}` : '';
        const filename = `bigquery-release-notes${categoryStr}${searchStr}.csv`;
        
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // Reset filters handler
    resetFiltersBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.style.display = 'none';
        
        document.querySelectorAll('#category-filters .badge').forEach(b => b.classList.remove('active'));
        document.querySelector('#category-filters .badge[data-filter="all"]').classList.add('active');
        
        activeFilter = 'all';
        sortSelect.value = 'newest';
        sortBy = 'newest';
        
        applyFiltersAndRender();
    });

    // 7. Initialize Application
    fetchReleases();
});
