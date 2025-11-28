// Service Worker for Game Portal PWA
const CACHE_NAME = 'game-portal-v1.0.0';
const STATIC_CACHE_URLS = [
    '/',
    '/index.html',
    '/styles.css',
    '/script.js',
    '/games-database.js',
    '/manifest.json'
];

// 安裝 Service Worker
self.addEventListener('install', (event) => {
    console.log('[SW] 安裝中...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] 快取靜態檔案');
                return cache.addAll(STATIC_CACHE_URLS);
            })
            .then(() => {
                console.log('[SW] 安裝完成');
                return self.skipWaiting();
            })
    );
});

// 啟動 Service Worker
self.addEventListener('activate', (event) => {
    console.log('[SW] 啟動中...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((cacheName) => cacheName !== CACHE_NAME)
                        .map((cacheName) => {
                            console.log('[SW] 刪除舊快取:', cacheName);
                            return caches.delete(cacheName);
                        })
                );
            })
            .then(() => {
                console.log('[SW] 啟動完成');
                return self.clients.claim();
            })
    );
});

// 攔截網路請求
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // 只處理同源請求
    if (url.origin !== self.location.origin) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // 如果快取中有資源，優先使用快取
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                // 否則從網路獲取
                return fetch(event.request)
                    .then((response) => {
                        // 檢查回應是否有效
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // 複製回應以便快取
                        const responseToCache = response.clone();
                        
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    })
                    .catch(() => {
                        // 網路失敗時的後備頁面
                        if (event.request.destination === 'document') {
                            return caches.match('/index.html');
                        }
                    });
            })
    );
});

// 推送通知處理
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : '有新遊戲上線！',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-96x96.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: '1'
        },
        actions: [
            {
                action: 'explore',
                title: '立即遊玩',
                icon: '/icons/icon-72x72.png'
            },
            {
                action: 'close',
                title: '稍後再看',
                icon: '/icons/icon-72x72.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('遊戲天堂', options)
    );
});

// 通知點擊處理
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    } else if (event.action === 'close') {
        // 用戶選擇關閉，不需要額外動作
        return;
    } else {
        // 默認行為：打開應用
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// 背景同步
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        console.log('[SW] 背景同步觸發');
        event.waitUntil(doBackgroundSync());
    }
});

function doBackgroundSync() {
    // 在這裡可以同步遊戲資料、用戶進度等
    return new Promise((resolve) => {
        console.log('[SW] 執行背景同步任務');
        // 模擬同步工作
        setTimeout(resolve, 1000);
    });
}

// 消息處理
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// 週期性背景同步（實驗性功能）
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'update-games') {
        event.waitUntil(updateGamesDatabase());
    }
});

function updateGamesDatabase() {
    // 更新遊戲資料庫的邏輯
    return fetch('/api/games')
        .then(response => response.json())
        .then(games => {
            // 更新本地資料庫
            return caches.open(CACHE_NAME)
                .then(cache => {
                    cache.put('/api/games', new Response(JSON.stringify(games)));
                });
        })
        .catch(error => {
            console.log('[SW] 更新遊戲資料庫失敗:', error);
        });
}