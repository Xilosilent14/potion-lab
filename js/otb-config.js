/**
 * Blake Boys Gaming — URL Configuration
 * Detects environment (local dev vs Cloudflare Pages) and sets game URLs.
 * Include this script before any code that references game URLs.
 */
const OTBConfig = (() => {
    const host = window.location.hostname;
    const isLocal = host === 'localhost' || host === '127.0.0.1';

    // Production URLs: the same origin the page came from, so the games work at
    // any address they are served from (games.unratedguild.com from 2026-11,
    // or bbgaming.pages.dev). bbgaming.shutterbuzzent.com was retired when
    // shutterbuzzent.com lapsed on 2026-11-12.
    const origin = window.location.origin;
    const PRODUCTION_URLS = {
        hub: origin,
        'think-fast': origin + '/thinkfast',
        'word-mine': origin + '/wordmine',
        'rhythm-blast': origin + '/rhythmblast',
        'creature-cards': origin + '/creaturecards',
        'spidey-academy': origin + '/spidey',
        'potion-lab': origin + '/potionlab'
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
