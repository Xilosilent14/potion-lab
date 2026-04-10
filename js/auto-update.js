/**
 * BBG Auto-Updater — Detects new deployments and prompts refresh
 * Include this script on every page. It checks /version.json against
 * the locally cached version and shows an update banner when they differ.
 *
 * Works on Amazon Silk, Chrome, Firefox, Safari — no manual cache clearing needed.
 */
(function() {
    const VERSION_KEY = 'bbg_app_version';
    const CHECK_INTERVAL = 60000; // Check every 60 seconds
    const VERSION_URL = (typeof OTBConfig !== 'undefined' && !OTBConfig.isLocal)
        ? '/version.json'
        : null; // Skip version checks in local dev

    // Don't run in local dev
    if (!VERSION_URL) return;

    let bannerShown = false;

    function showUpdateBanner() {
        if (bannerShown) return;
        bannerShown = true;

        const banner = document.createElement('div');
        banner.id = 'bbg-update-banner';
        banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;' +
            'background:linear-gradient(135deg,#10b981,#059669);padding:12px 20px;' +
            'display:flex;align-items:center;justify-content:center;gap:12px;' +
            'box-shadow:0 2px 12px rgba(0,0,0,0.4);font-family:var(--otb-font-body,sans-serif);';

        banner.innerHTML =
            '<span style="color:#fff;font-size:1rem;font-weight:600;">🎮 New update available!</span>' +
            '<button id="bbg-update-btn" style="background:#fff;color:#059669;border:none;' +
            'border-radius:8px;padding:8px 20px;font-weight:700;font-size:0.9rem;' +
            'cursor:pointer;min-height:44px;min-width:44px;">Tap to Update</button>';

        document.body.insertBefore(banner, document.body.firstChild);

        document.getElementById('bbg-update-btn').addEventListener('click', function() {
            banner.innerHTML = '<span style="color:#fff;font-size:1rem;font-weight:600;">Updating...</span>';
            forceUpdate();
        });
    }

    function forceUpdate() {
        // Unregister the old service worker, clear caches, reload
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(registrations) {
                var promises = registrations.map(function(reg) { return reg.unregister(); });
                return Promise.all(promises);
            }).then(function() {
                // Clear all caches
                return caches.keys();
            }).then(function(keys) {
                return Promise.all(keys.map(function(k) { return caches.delete(k); }));
            }).then(function() {
                // Hard reload
                window.location.reload(true);
            }).catch(function() {
                window.location.reload(true);
            });
        } else {
            window.location.reload(true);
        }
    }

    function checkForUpdate() {
        // Fetch version.json bypassing all caches
        fetch(VERSION_URL, { cache: 'no-store' })
            .then(function(r) { return r.ok ? r.json() : null; })
            .then(function(data) {
                if (!data || !data.version) return;
                var cached = localStorage.getItem(VERSION_KEY);
                if (!cached) {
                    // First visit, just store the version
                    localStorage.setItem(VERSION_KEY, data.version);
                    return;
                }
                if (cached !== data.version) {
                    // New version available
                    showUpdateBanner();
                    // Update stored version so after refresh we don't show again
                    localStorage.setItem(VERSION_KEY, data.version);
                }
            })
            .catch(function() { /* offline or error, ignore */ });
    }

    // Check on page load (after a short delay to not block rendering)
    setTimeout(checkForUpdate, 3000);

    // Periodic check while page is open
    setInterval(checkForUpdate, CHECK_INTERVAL);
})();
