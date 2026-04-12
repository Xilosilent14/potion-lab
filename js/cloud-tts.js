/**
 * BBG Cloud TTS — Runtime text-to-speech via Google Cloud API
 * Bypasses broken browser speechSynthesis on Amazon Silk tablets.
 * Caches MP3 responses in IndexedDB for offline replay.
 *
 * Usage: CloudTTS.speak(text, options)
 * Options: { voice, rate, pitch, volume, onEnd }
 */
const CloudTTS = (() => {
    // Uses our Cloudflare Pages Function proxy (same origin, no CORS issues)
    // In production: /api/tts, in local dev: falls back to speechSynthesis
    const API_URL = (typeof OTBConfig !== 'undefined' && !OTBConfig.isLocal)
        ? '/api/tts'
        : null; // No proxy in local dev, use speechSynthesis fallback
    const DB_NAME = 'bbg_tts_cache';
    const STORE_NAME = 'audio';
    const DB_VERSION = 1;

    // Default voices per character type
    const VOICES = {
        female: { languageCode: 'en-US', name: 'en-US-Neural2-C', ssmlGender: 'FEMALE' },
        jack: { languageCode: 'en-US', name: 'en-US-Neural2-D', ssmlGender: 'MALE' },
        spidey: { languageCode: 'en-US', name: 'en-US-Neural2-F', ssmlGender: 'FEMALE' }
    };

    let db = null;
    let ctx = null;
    let _enabled = true;
    let _speaking = false;
    let _currentSource = null;

    // Open IndexedDB for caching
    function _openDB() {
        return new Promise((resolve, reject) => {
            if (db) { resolve(db); return; }
            const req = indexedDB.open(DB_NAME, DB_VERSION);
            req.onupgradeneeded = (e) => {
                e.target.result.createObjectStore(STORE_NAME);
            };
            req.onsuccess = (e) => { db = e.target.result; resolve(db); };
            req.onerror = () => reject(req.error);
        });
    }

    // Get cached audio from IndexedDB
    function _getCache(key) {
        return new Promise((resolve) => {
            _openDB().then(db => {
                const tx = db.transaction(STORE_NAME, 'readonly');
                const req = tx.objectStore(STORE_NAME).get(key);
                req.onsuccess = () => resolve(req.result || null);
                req.onerror = () => resolve(null);
            }).catch(() => resolve(null));
        });
    }

    // Store audio in IndexedDB
    function _setCache(key, arrayBuffer) {
        _openDB().then(db => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).put(arrayBuffer, key);
        }).catch(() => {});
    }

    // Simple hash for cache keys
    function _hash(text) {
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            const c = text.charCodeAt(i);
            hash = ((hash << 5) - hash) + c;
            hash |= 0;
        }
        return 'tts_' + Math.abs(hash).toString(36);
    }

    // Get or create AudioContext
    function _getCtx() {
        if (!ctx) {
            try {
                ctx = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                return null; // SES lockdown or browser restriction
            }
        }
        if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
        return ctx;
    }

    // Play an ArrayBuffer as audio
    function _playBuffer(arrayBuffer, volume, onEnd) {
        const c = _getCtx();
        if (!c) { if (onEnd) onEnd(); return; }
        // Need to clone buffer since decodeAudioData consumes it
        const bufCopy = arrayBuffer.slice(0);
        c.decodeAudioData(bufCopy, (decoded) => {
            // Stop any currently playing speech
            if (_currentSource) {
                try { _currentSource.stop(); } catch (_) {}
            }
            const source = c.createBufferSource();
            source.buffer = decoded;
            const gain = c.createGain();
            gain.gain.value = volume || 0.85;
            source.connect(gain);
            gain.connect(c.destination);
            source.onended = () => {
                _speaking = false;
                _currentSource = null;
                if (onEnd) onEnd();
            };
            _speaking = true;
            _currentSource = source;
            c.resume().then(() => source.start(0)).catch(() => {
                _speaking = false;
                _currentSource = null;
                if (onEnd) onEnd();
            });
        }, () => {
            _speaking = false;
            if (onEnd) onEnd();
        });
    }

    // Call Google Cloud TTS API via our proxy
    function _synthesize(text, voice, rate, pitch) {
        if (!API_URL) return Promise.reject(new Error('No TTS proxy in local dev'));
        return fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                input: { text: text },
                voice: voice || VOICES.female,
                audioConfig: {
                    audioEncoding: 'MP3',
                    speakingRate: rate || 0.9,
                    pitch: pitch || 0,
                    effectsProfileId: ['small-bluetooth-speaker-class-device']
                }
            })
        })
        .then(r => {
            if (!r.ok) throw new Error('TTS API ' + r.status);
            return r.json();
        })
        .then(data => {
            // Convert base64 to ArrayBuffer
            const binary = atob(data.audioContent);
            const buf = new ArrayBuffer(binary.length);
            const view = new Uint8Array(buf);
            for (let i = 0; i < binary.length; i++) view[i] = binary.charCodeAt(i);
            return buf;
        });
    }

    /**
     * Main speak function. Tries:
     * 1. IndexedDB cache (instant)
     * 2. Google Cloud TTS API (500ms delay, then cached)
     * 3. Browser speechSynthesis (last resort fallback)
     */
    function speak(text, options) {
        if (!_enabled) return Promise.resolve();
        if (!text || !text.trim()) return Promise.resolve();

        const opts = options || {};
        const voice = opts.voice || VOICES.female;
        const rate = opts.rate || 0.9;
        const pitch = opts.pitch || 0;
        const volume = opts.volume || 0.85;
        const onEnd = opts.onEnd || null;
        const cacheKey = _hash(text.trim() + voice.name + rate);

        // Stop any current speech
        cancel();

        return _getCache(cacheKey).then(cached => {
            if (cached) {
                _playBuffer(cached, volume, onEnd);
                return;
            }
            // Try Cloud TTS API
            return _synthesize(text.trim(), voice, rate, pitch).then(buf => {
                _setCache(cacheKey, buf.slice(0));
                _playBuffer(buf, volume, onEnd);
            }).catch(() => {
                // Fallback to speechSynthesis
                _fallbackSpeak(text, rate, pitch, volume, onEnd);
            });
        }).catch(() => {
            _fallbackSpeak(text, rate, pitch, volume, onEnd);
        });
    }

    // Browser speechSynthesis fallback
    function _fallbackSpeak(text, rate, pitch, volume, onEnd) {
        if (!window.speechSynthesis) {
            if (onEnd) onEnd();
            return;
        }
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.rate = rate || 0.9;
        u.pitch = (pitch || 0) + 1; // SpeechSynthesis pitch is 0-2, Cloud pitch is -20 to 20
        u.volume = volume || 0.85;
        u.onend = () => { _speaking = false; if (onEnd) onEnd(); };
        u.onerror = () => { _speaking = false; if (onEnd) onEnd(); };
        _speaking = true;
        window.speechSynthesis.speak(u);
        // Silk retry
        setTimeout(() => {
            if (window.speechSynthesis && !window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
                try { window.speechSynthesis.speak(u); } catch (_) {}
            }
        }, 250);
    }

    function cancel() {
        if (_currentSource) {
            try { _currentSource.stop(); } catch (_) {}
            _currentSource = null;
        }
        _speaking = false;
        if (window.speechSynthesis) window.speechSynthesis.cancel();
    }

    function setEnabled(on) { _enabled = on; }
    function isSpeaking() { return _speaking; }

    // Convenience wrappers for different voice characters
    function speakFemale(text, opts) {
        return speak(text, { ...opts, voice: VOICES.female });
    }
    function speakJack(text, opts) {
        return speak(text, { ...opts, voice: VOICES.jack, rate: 0.88, pitch: -3 });
    }
    function speakSpidey(text, opts) {
        return speak(text, { ...opts, voice: VOICES.spidey, rate: 0.85, pitch: 1 });
    }

    // Unlock AudioContext on first user gesture
    function unlock() {
        _getCtx();
    }

    return {
        speak, speakFemale, speakJack, speakSpidey,
        cancel, setEnabled, isSpeaking, unlock,
        VOICES
    };
})();
