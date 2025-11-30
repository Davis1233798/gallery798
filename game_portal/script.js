// 遊戲入口網站主要功能
class GamePortal {
    constructor() {
        this.games = window.gamesDatabase || [];
        this.categories = window.gameCategories || {};
        this.currentFilter = 'all';
        this.currentPage = 0;
        this.gamesPerPage = 20;
        this.searchQuery = '';
        this.playedToday = this.getPlayedToday();

        this.init();
    }

    init() {
        this.bindEvents();
        this.loadFeaturedGames();
        this.loadGames();
        this.updateStats();
        this.initServiceWorker();
    }

    bindEvents() {
        // 搜尋功能
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');

        searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.resetAndLoadGames();
        });

        searchBtn.addEventListener('click', () => {
            this.resetAndLoadGames();
        });

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.resetAndLoadGames();
            }
        });

        // 類別過濾
        const categoryBtns = document.querySelectorAll('.category-btn');
        categoryBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // 移除所有active class
                categoryBtns.forEach(b => b.classList.remove('active'));
                // 添加active class到點擊的按鈕
                e.target.classList.add('active');

                this.currentFilter = e.target.dataset.category;
                this.resetAndLoadGames();
                this.updateFilterInfo();
            });
        });

        // 載入更多遊戲
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        loadMoreBtn.addEventListener('click', () => {
            this.currentPage++;
            this.loadGames(false);
        });

        // 遊戲模態框
        const modal = document.getElementById('gameModal');
        const closeModal = document.getElementById('closeModal');

        closeModal.addEventListener('click', () => {
            this.closeGameModal();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeGameModal();
            }
        });

        // ESC鍵關閉模態框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeGameModal();
            }
        });
    }

    getFilteredGames() {
        let filteredGames = this.games;

        // 應用類別過濾
        if (this.currentFilter !== 'all') {
            filteredGames = filteredGames.filter(game => game.category === this.currentFilter);
        }

        // 應用搜尋過濾
        if (this.searchQuery) {
            filteredGames = filteredGames.filter(game =>
                game.title.toLowerCase().includes(this.searchQuery) ||
                game.description.toLowerCase().includes(this.searchQuery)
            );
        }

        return filteredGames;
    }

    loadFeaturedGames() {
        const featuredContainer = document.getElementById('featuredGames');
        const featuredGames = this.games.filter(game => game.featured).slice(0, 6);

        featuredContainer.innerHTML = featuredGames.map(game => this.createGameCard(game, true)).join('');
    }

    loadGames(reset = false) {
        const gamesContainer = document.getElementById('gamesGrid');
        const loadingSpinner = document.getElementById('loadingSpinner');
        const loadMoreBtn = document.getElementById('loadMoreBtn');

        if (reset) {
            gamesContainer.innerHTML = '';
        }

        loadingSpinner.style.display = 'flex';

        // 模擬載入延遲
        setTimeout(() => {
            const filteredGames = this.getFilteredGames();
            const startIndex = this.currentPage * this.gamesPerPage;
            const endIndex = startIndex + this.gamesPerPage;
            const gamesToShow = filteredGames.slice(startIndex, endIndex);

            const gamesHTML = gamesToShow.map(game => this.createGameCard(game)).join('');

            if (reset) {
                gamesContainer.innerHTML = gamesHTML;
            } else {
                gamesContainer.insertAdjacentHTML('beforeend', gamesHTML);
            }

            // 檢查是否還有更多遊戲
            if (endIndex >= filteredGames.length) {
                loadMoreBtn.style.display = 'none';
            } else {
                loadMoreBtn.style.display = 'block';
            }

            loadingSpinner.style.display = 'none';
            this.updateGameCount(filteredGames.length);
        }, 300);
    }

    createGameCard(game, isFeatured = false) {
        const cardClass = isFeatured ? 'game-card featured-card' : 'game-card';
        return `
            <div class="${cardClass}" onclick="gamePortal.openGame(${game.id})">
                <img src="${game.image}" alt="${game.title}" class="game-image" 
                     onerror="this.src='https://via.placeholder.com/300x200/6366F1/ffffff?text=${encodeURIComponent(game.title)}'">
                <div class="game-info">
                    <h3 class="game-title">${game.title}</h3>
                    <p class="game-description">${game.description}</p>
                    <div class="game-meta">
                        <span class="game-category">${this.categories[game.category]?.icon || '🎮'} ${this.categories[game.category]?.name || game.category}</span>
                        ${game.rating ? `<span class="game-rating">⭐ ${game.rating.toFixed(1)}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    openGame(gameId) {
        const game = this.games.find(g => g.id === gameId);
        if (!game) return;

        const modal = document.getElementById('gameModal');
        const modalTitle = document.getElementById('modalGameTitle');
        const gameFrame = document.getElementById('gameFrame');

        modalTitle.textContent = game.title;
        gameFrame.src = game.url;
        modal.style.display = 'block';

        // 記錄遊戲遊玩
        this.recordGamePlay();

        // 阻止背景滾動
        document.body.style.overflow = 'hidden';
    }

    closeGameModal() {
        const modal = document.getElementById('gameModal');
        const gameFrame = document.getElementById('gameFrame');

        modal.style.display = 'none';
        gameFrame.src = '';

        // 恢復背景滾動
        document.body.style.overflow = 'auto';
    }

    recordGamePlay() {
        this.playedToday++;
        localStorage.setItem('playedToday', JSON.stringify({
            count: this.playedToday,
            date: new Date().toDateString()
        }));
        this.updateStats();
    }

    getPlayedToday() {
        const stored = localStorage.getItem('playedToday');
        if (!stored) return 0;

        const data = JSON.parse(stored);
        const today = new Date().toDateString();

        return data.date === today ? data.count : 0;
    }

    resetAndLoadGames() {
        this.currentPage = 0;
        this.loadGames(true);
    }

    updateStats() {
        document.getElementById('totalGames').textContent = `${this.games.length}+`;
        document.getElementById('playedToday').textContent = this.playedToday;
    }

    updateFilterInfo() {
        const filteredGames = this.getFilteredGames();
        const filterInfo = document.getElementById('filterInfo');
        const gameCount = document.getElementById('gameCount');

        if (this.currentFilter === 'all' && !this.searchQuery) {
            filterInfo.textContent = '顯示所有遊戲';
        } else if (this.searchQuery) {
            filterInfo.textContent = `搜尋結果: "${this.searchQuery}"`;
        } else {
            const categoryName = this.categories[this.currentFilter]?.name || this.currentFilter;
            filterInfo.textContent = `${categoryName}遊戲`;
        }

        gameCount.textContent = `(${filteredGames.length} 個遊戲)`;
    }

    updateGameCount(count) {
        const gameCount = document.getElementById('gameCount');
        gameCount.textContent = `(${count} 個遊戲)`;
    }

    // Service Worker 初始化（PWA支援）
    initServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function (registrations) {
                for (let registration of registrations) {
                    registration.unregister();
                    console.log('Service Worker unregistered to ensure fresh content');
                }
            });
        }
        console.log("Service Worker disabled for development and cache cleared");
    }

    // 隨機遊戲功能
    playRandomGame() {
        const filteredGames = this.getFilteredGames();
        if (filteredGames.length === 0) return;

        const randomIndex = Math.floor(Math.random() * filteredGames.length);
        const randomGame = filteredGames[randomIndex];
        this.openGame(randomGame.id);
    }

    // 收藏功能
    toggleFavorite(gameId) {
        const favorites = this.getFavorites();
        const index = favorites.indexOf(gameId);

        if (index === -1) {
            favorites.push(gameId);
        } else {
            favorites.splice(index, 1);
        }

        localStorage.setItem('gamePortalFavorites', JSON.stringify(favorites));
        this.updateFavoriteButtons();
    }

    getFavorites() {
        const stored = localStorage.getItem('gamePortalFavorites');
        return stored ? JSON.parse(stored) : [];
    }

    updateFavoriteButtons() {
        const favorites = this.getFavorites();
        // 更新收藏按鈕狀態的邏輯
    }

    // 搜尋建議功能
    getSearchSuggestions(query) {
        if (!query) return [];

        return this.games
            .filter(game => game.title.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 5)
            .map(game => game.title);
    }
}

// 當DOM載入完成時初始化遊戲入口網站
document.addEventListener('DOMContentLoaded', () => {
    window.gamePortal = new GamePortal();
});

// 添加鍵盤快捷鍵
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K 焦點到搜尋框
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('searchInput').focus();
    }

    // Ctrl/Cmd + R 隨機遊戲
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        if (window.gamePortal) {
            window.gamePortal.playRandomGame();
        }
    }
});

// PWA 安裝提示
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    // 顯示安裝按鈕
    const installBtn = document.createElement('button');
    installBtn.textContent = '📱 安裝到主畫面';
    installBtn.className = 'install-btn';
    installBtn.onclick = () => {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('用戶接受了安裝提示');
            }
            deferredPrompt = null;
            installBtn.remove();
        });
    };

    document.querySelector('.header-content').appendChild(installBtn);
});

// 觸控手勢支援
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

document.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    // 滑動手勢檢測
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX > 0) {
            // 向右滑動
            console.log('向右滑動');
        } else {
            // 向左滑動
            console.log('向左滑動');
        }
    }
});

// 性能監控
if ('performance' in window) {
    window.addEventListener('load', () => {
        setTimeout(() => {
            const perfData = performance.getEntriesByType('navigation')[0];
            console.log(`頁面載入時間: ${perfData.loadEventEnd - perfData.loadEventStart}ms`);
        }, 0);
    });
}