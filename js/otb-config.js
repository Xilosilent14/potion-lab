/**
 * Blake Boys Gaming — URL Configuration
 * Detects environment (local dev vs Cloudflare Pages) and sets game URLs.
 * Include this script before any code that references game URLs.
 */
const OTBConfig = (() => {
    const host = window.location.hostname;
    const isLocal = host === 'localhost' || host === '127.0.0.1';

    // Production URLs (bbgaming.shutterbuzzent.com sub-paths)
    const PRODUCTION_URLS = {
        hub: 'https://bbgaming.shutterbuzzent.com',
        'think-fast': 'https://bbgaming.shutterbuzzent.com/thinkfast',
        'word-mine': 'https://bbgaming.shutterbuzzent.com/wordmine',
        'rhythm-blast': 'https://bbgaming.shutterbuzzent.com/rhythmblast',
        'creature-cards': 'https://bbgaming.shutterbuzzent.com/creaturecards',
        'spidey-academy': 'https://bbgaming.shutterbuzzent.com/spidey',
        'potion-lab': 'https://bbgaming.shutterbuzzent.com/potionlab'
    };

    // Local dev URLs
    const LOCAL_URLS = {
        hub: 'http://localhost:8082',
        'think-fast': 'http://localhost:8080',
        'word-mine': 'http://localhost:8081',
        'rhythm-blast': 'http://localhost:8083',
        'creature-cards': 'http://localhost:8084',
        'spidey-academy': 'http://localhost:8085',
        'potion-lab': 'http://localhost:8086'
    };

    const urls = isLocal ? LOCAL_URLS : PRODUCTION_URLS;

    return {
        isLocal,
        urls,
        getGameUrl(gameId) {
            return urls[gameId] || '#';
        },
        getHubUrl() {
            return urls.hub;
        }
    };
})();
