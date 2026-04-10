/* Jack's Potion Lab — Audio Engine v1.1
   Web Audio API: Room-specific Halloween Town music + SFX
*/

const PotionAudio = (() => {
  let ctx = null;
  let masterGain = null;
  let musicGain = null;
  let sfxGain = null;
  let bgNode = null;
  let bgStarted = false;
  let musicEnabled = true;
  let sfxEnabled = true;
  let currentRoomIndex = 0; // 0-based room index
  let loopGeneration = 0;   // incremented on room change to kill stale loops

  function ensureContext() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.7;
    masterGain.connect(ctx.destination);

    musicGain = ctx.createGain();
    musicGain.gain.value = 0.35;
    musicGain.connect(masterGain);

    sfxGain = ctx.createGain();
    sfxGain.gain.value = 0.8;
    sfxGain.connect(masterGain);
  }

  // MP3 sound effect cache
  const _mp3Cache = {};
  let _mp3Loaded = false;
  function _loadMP3Assets() {
    if (_mp3Loaded) return;
    _mp3Loaded = true;
    ensureContext();
    const manifest = [
      { key: 'click', src: 'assets/sounds/sfx/click.mp3' },
      { key: 'correct', src: 'assets/sounds/sfx/correct.mp3' },
      { key: 'wrong', src: 'assets/sounds/sfx/wrong.mp3' },
      { key: 'coin', src: 'assets/sounds/sfx/coin.mp3' },
      { key: 'star', src: 'assets/sounds/sfx/star.mp3' },
      { key: 'streak', src: 'assets/sounds/sfx/streak.mp3' },
      { key: 'victory', src: 'assets/sounds/sfx/victory.mp3' },
      { key: 'pickup', src: 'assets/sounds/sfx/pickup.mp3' },
      { key: 'cauldron-bubble', src: 'assets/sounds/sfx/cauldron-bubble.mp3' },
      { key: 'cauldron-erupt', src: 'assets/sounds/sfx/cauldron-erupt.mp3' },
      { key: 'potion-complete', src: 'assets/sounds/sfx/potion-complete.mp3' },
      { key: 'zero-yip', src: 'assets/sounds/sfx/zero-yip.mp3' }
    ];
    manifest.forEach(({ key, src }) => {
      fetch(src)
        .then(r => { if (!r.ok) throw new Error(); return r.arrayBuffer(); })
        .then(buf => ctx.decodeAudioData(buf))
        .then(decoded => { _mp3Cache[key] = decoded; })
        .catch(() => {});
    });
  }
  function _playMP3(key, volume = 0.5) {
    const buf = _mp3Cache[key];
    if (!buf) return false;
    if (!sfxEnabled) return true;
    const source = ctx.createBufferSource();
    source.buffer = buf;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    source.connect(gain);
    gain.connect(sfxGain);
    source.start(0);
    return true;
  }

  let _ttsWarmedUp = false;
  function resume() {
    if (ctx && ctx.state === 'suspended') ctx.resume();
    _loadMP3Assets();
    // Warm up TTS on first resume (user gesture)
    if (!_ttsWarmedUp && window.speechSynthesis) {
      _ttsWarmedUp = true;
      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(' ');
        u.volume = 0.01;
        u.rate = 5;
        window.speechSynthesis.speak(u);
      } catch (e) { /* ignore */ }
    }
  }

  /* ---- Room music definitions ---- */
  /* All rooms share Am Halloween Town vibe, but vary mood/tempo/texture */

  const ROOM_MUSIC = [
    // Room 1: Finkelstein's Lab — glockenspiel, bubbly plinks, BPM 80
    {
      bpm: 80,
      melody: [
        { note: 220, beat: 0, dur: 0.8 },
        { note: 261.63, beat: 1, dur: 0.8 },
        { note: 329.63, beat: 2, dur: 0.8 },
        { note: 440, beat: 3, dur: 0.8 },
        { note: 392, beat: 4, dur: 0.8 },
        { note: 329.63, beat: 5, dur: 0.8 },
        { note: 261.63, beat: 6, dur: 0.8 },
        { note: 220, beat: 7, dur: 1.4 },
        { note: 261.63, beat: 8, dur: 0.8 },
        { note: 329.63, beat: 9, dur: 0.8 },
        { note: 392, beat: 10, dur: 0.8 },
        { note: 523.25, beat: 11, dur: 0.8 },
        { note: 493.88, beat: 12, dur: 0.6 },
        { note: 392, beat: 13, dur: 0.6 },
        { note: 329.63, beat: 14, dur: 0.8 },
        { note: 220, beat: 15, dur: 1.6 },
      ],
      bass: [
        { note: 110, beat: 0, dur: 4 },
        { note: 110, beat: 8, dur: 4 },
      ],
      melodyType: 'sine',
      shimmerMult: 2.756,
      shimmerVol: 0.15,
      melodyVol: 0.5,
      bassVol: 0.2,
      extras: 'bubbles', // bubbly plinks like beakers
    },
    // Room 2: Graveyard — low, slow, spooky. BPM 70, bass-heavy, wind sweeps
    {
      bpm: 70,
      melody: [
        { note: 220, beat: 0, dur: 1.8 },
        { note: 196, beat: 3, dur: 1.8 },
        { note: 174.61, beat: 6, dur: 2.0 },
        { note: 196, beat: 9, dur: 1.2 },
        { note: 220, beat: 11, dur: 2.0 },
        { note: 174.61, beat: 14, dur: 1.8 },
      ],
      bass: [
        { note: 110, beat: 0, dur: 4 },
        { note: 82.41, beat: 4, dur: 4 },
        { note: 110, beat: 8, dur: 4 },
        { note: 82.41, beat: 12, dur: 4 },
      ],
      melodyType: 'sine',
      shimmerMult: 2.0,
      shimmerVol: 0.06,
      melodyVol: 0.25,
      bassVol: 0.3,
      extras: 'wind',
    },
    // Room 3: Town Square — brighter, cheerful. BPM 90, echo melody
    {
      bpm: 90,
      melody: [
        { note: 261.63, beat: 0, dur: 0.7 },
        { note: 293.66, beat: 1, dur: 0.7 },
        { note: 329.63, beat: 2, dur: 0.7 },
        { note: 392, beat: 3, dur: 0.7 },
        { note: 440, beat: 4, dur: 0.9 },
        { note: 392, beat: 5, dur: 0.7 },
        { note: 329.63, beat: 6, dur: 0.7 },
        { note: 293.66, beat: 7, dur: 1.2 },
        { note: 329.63, beat: 8, dur: 0.7 },
        { note: 392, beat: 9, dur: 0.7 },
        { note: 440, beat: 10, dur: 0.7 },
        { note: 523.25, beat: 11, dur: 0.9 },
        { note: 493.88, beat: 12, dur: 0.6 },
        { note: 440, beat: 13, dur: 0.6 },
        { note: 392, beat: 14, dur: 0.8 },
        { note: 261.63, beat: 15, dur: 1.4 },
      ],
      bass: [
        { note: 130.81, beat: 0, dur: 4 },
        { note: 110, beat: 4, dur: 4 },
        { note: 130.81, beat: 8, dur: 4 },
        { note: 110, beat: 12, dur: 4 },
      ],
      melodyType: 'sine',
      shimmerMult: 3.0,
      shimmerVol: 0.18,
      melodyVol: 0.45,
      bassVol: 0.15,
      extras: 'echo',
    },
    // Room 4: Oogie's Lair — tense, jazzy. BPM 100, chromatic walking bass
    {
      bpm: 100,
      melody: [
        { note: 220, beat: 0, dur: 0.5 },
        { note: 261.63, beat: 1, dur: 0.5 },
        { note: 277.18, beat: 2, dur: 0.5 },
        { note: 261.63, beat: 3, dur: 0.5 },
        { note: 246.94, beat: 4, dur: 0.7 },
        { note: 220, beat: 5, dur: 0.5 },
        { note: 207.65, beat: 6, dur: 0.5 },
        { note: 220, beat: 7, dur: 1.0 },
        { note: 329.63, beat: 8, dur: 0.5 },
        { note: 311.13, beat: 9, dur: 0.5 },
        { note: 293.66, beat: 10, dur: 0.5 },
        { note: 277.18, beat: 11, dur: 0.5 },
        { note: 261.63, beat: 12, dur: 0.6 },
        { note: 246.94, beat: 13, dur: 0.5 },
        { note: 220, beat: 14, dur: 0.8 },
        { note: 220, beat: 15, dur: 1.0 },
      ],
      bass: [
        // chromatic walk: A2 Bb2 B2 C3 repeated
        { note: 110, beat: 0, dur: 1 },
        { note: 116.54, beat: 1, dur: 1 },
        { note: 123.47, beat: 2, dur: 1 },
        { note: 130.81, beat: 3, dur: 1 },
        { note: 110, beat: 4, dur: 1 },
        { note: 116.54, beat: 5, dur: 1 },
        { note: 123.47, beat: 6, dur: 1 },
        { note: 130.81, beat: 7, dur: 1 },
        { note: 110, beat: 8, dur: 1 },
        { note: 116.54, beat: 9, dur: 1 },
        { note: 123.47, beat: 10, dur: 1 },
        { note: 130.81, beat: 11, dur: 1 },
        { note: 110, beat: 12, dur: 1 },
        { note: 116.54, beat: 13, dur: 1 },
        { note: 123.47, beat: 14, dur: 1 },
        { note: 130.81, beat: 15, dur: 1 },
      ],
      melodyType: 'triangle',
      shimmerMult: 2.5,
      shimmerVol: 0.08,
      melodyVol: 0.35,
      bassVol: 0.22,
      extras: 'none',
    },
    // Room 5: Jack's Tower — grand, triumphant. BPM 85, full harmony + pad
    {
      bpm: 85,
      melody: [
        { note: 261.63, beat: 0, dur: 0.9 },
        { note: 329.63, beat: 1, dur: 0.9 },
        { note: 392, beat: 2, dur: 0.9 },
        { note: 523.25, beat: 3, dur: 1.2 },
        { note: 440, beat: 5, dur: 0.9 },
        { note: 392, beat: 6, dur: 0.9 },
        { note: 329.63, beat: 7, dur: 1.2 },
        { note: 392, beat: 8, dur: 0.9 },
        { note: 440, beat: 9, dur: 0.9 },
        { note: 523.25, beat: 10, dur: 0.9 },
        { note: 659.25, beat: 11, dur: 1.2 },
        { note: 587.33, beat: 13, dur: 0.8 },
        { note: 523.25, beat: 14, dur: 0.9 },
        { note: 440, beat: 15, dur: 1.6 },
      ],
      bass: [
        { note: 130.81, beat: 0, dur: 4 },
        { note: 110, beat: 4, dur: 4 },
        { note: 130.81, beat: 8, dur: 4 },
        { note: 146.83, beat: 12, dur: 4 },
      ],
      melodyType: 'sine',
      shimmerMult: 2.756,
      shimmerVol: 0.2,
      melodyVol: 0.5,
      bassVol: 0.2,
      extras: 'pad',
    },
  ];

  /* ---- Halloween Town ambient music engine ---- */
  function startMusic() {
    if (!musicEnabled) return;
    ensureContext();
    resume();
    if (bgStarted) return;
    bgStarted = true;
    loopGeneration++;
    _runMusicLoop(loopGeneration);
  }

  function _runMusicLoop(gen) {
    if (!bgStarted || !musicEnabled || gen !== loopGeneration) return;

    const room = ROOM_MUSIC[currentRoomIndex] || ROOM_MUSIC[0];
    const BPM = room.bpm;
    const BEAT = 60 / BPM;
    const LOOP = 16 * BEAT;
    const now = ctx.currentTime;

    // Schedule melody notes
    room.melody.forEach(({ note, beat, dur }) => {
      const t = now + beat * BEAT;
      // Main voice
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = room.melodyType || 'sine';
      osc.frequency.value = note;
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(room.melodyVol, t + 0.01);
      env.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(env);
      env.connect(musicGain);
      osc.start(t);
      osc.stop(t + dur + 0.1);

      // Shimmer partial
      const osc2 = ctx.createOscillator();
      const env2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.value = note * room.shimmerMult;
      env2.gain.setValueAtTime(0, t);
      env2.gain.linearRampToValueAtTime(room.shimmerVol, t + 0.01);
      env2.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.5);
      osc2.connect(env2);
      env2.connect(musicGain);
      osc2.start(t);
      osc2.stop(t + dur * 0.5 + 0.05);
    });

    // Schedule bass
    room.bass.forEach(({ note, beat, dur }) => {
      const t = now + beat * BEAT;
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = note;
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(room.bassVol, t + 0.05);
      env.gain.linearRampToValueAtTime(room.bassVol * 0.4, t + (dur - 1) * BEAT);
      env.gain.linearRampToValueAtTime(0.001, t + dur * BEAT);
      osc.connect(env);
      env.connect(musicGain);
      osc.start(t);
      osc.stop(t + dur * BEAT + 0.1);
    });

    // Room-specific extra layers
    if (room.extras === 'bubbles') {
      // Occasional high plinks like beakers bubbling (3-5 per loop)
      const count = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i++) {
        const t = now + Math.random() * LOOP;
        const freq = 1200 + Math.random() * 1800;
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.7, t + 0.08);
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(0.08, t + 0.005);
        env.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        osc.connect(env);
        env.connect(musicGain);
        osc.start(t);
        osc.stop(t + 0.15);
      }
    } else if (room.extras === 'wind') {
      // Occasional filtered noise sweep (wind howl)
      const windCount = 1 + Math.floor(Math.random() * 2);
      for (let w = 0; w < windCount; w++) {
        const t = now + Math.random() * (LOOP - 2);
        const dur = 1.5 + Math.random();
        // Use oscillator detuning to approximate wind
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, t);
        osc.frequency.linearRampToValueAtTime(120, t + dur * 0.5);
        osc.frequency.linearRampToValueAtTime(60, t + dur);
        // Bandpass filter
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 400;
        bp.Q.value = 2;
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(0.04, t + dur * 0.3);
        env.gain.linearRampToValueAtTime(0, t + dur);
        osc.connect(bp);
        bp.connect(env);
        env.connect(musicGain);
        osc.start(t);
        osc.stop(t + dur + 0.1);
      }
    } else if (room.extras === 'echo') {
      // Higher octave echo of melody notes, delayed by half a beat
      room.melody.forEach(({ note, beat, dur }) => {
        const t = now + (beat + 0.5) * BEAT;
        if (t > now + LOOP) return;
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = note * 2; // octave up
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(0.12, t + 0.01);
        env.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.6);
        osc.connect(env);
        env.connect(musicGain);
        osc.start(t);
        osc.stop(t + dur * 0.6 + 0.05);
      });
    } else if (room.extras === 'pad') {
      // Sustained chord pad: Am (A3 C4 E4)
      [220, 261.63, 329.63].forEach(freq => {
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        env.gain.setValueAtTime(0, now);
        env.gain.linearRampToValueAtTime(0.06, now + 1.0);
        env.gain.linearRampToValueAtTime(0.06, now + LOOP - 1.0);
        env.gain.linearRampToValueAtTime(0, now + LOOP);
        osc.connect(env);
        env.connect(musicGain);
        osc.start(now);
        osc.stop(now + LOOP + 0.1);
      });
    }

    // Schedule next loop iteration
    setTimeout(() => {
      if (bgStarted && musicEnabled && gen === loopGeneration) {
        _runMusicLoop(gen);
      }
    }, (LOOP - 1) * 1000);
  }

  function stopMusic() {
    bgStarted = false;
    loopGeneration++;
  }

  /* Switch room music with crossfade */
  function setRoomMusic(roomIndex) {
    const idx = Math.max(0, Math.min(4, roomIndex));
    if (idx === currentRoomIndex && bgStarted) return;
    currentRoomIndex = idx;
    if (!bgStarted || !musicEnabled) return;
    // Fade out current, restart with new room params
    ensureContext();
    const fadeTime = 0.3;
    musicGain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + fadeTime);
    loopGeneration++;
    const gen = loopGeneration;
    setTimeout(() => {
      if (gen !== loopGeneration) return;
      musicGain.gain.setValueAtTime(0.35, ctx.currentTime);
      _runMusicLoop(gen);
    }, fadeTime * 1000 + 50);
  }

  /* ---- SFX ---- */
  function playCorrect() {
    if (_playMP3('correct', 0.5)) return;
    if (!sfxEnabled) return;
    ensureContext(); resume();
    // Bright sparkle arpeggio: C5 E5 G5 C6
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const t = ctx.currentTime + i * 0.08;
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      env.gain.setValueAtTime(0.4, t);
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.connect(env);
      env.connect(sfxGain);
      osc.start(t);
      osc.stop(t + 0.35);
    });
  }

  function playWrong() {
    if (_playMP3('wrong', 0.4)) return;
    if (!sfxEnabled) return;
    ensureContext(); resume();
    // Soft boing (not harsh)
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.3);
    env.gain.setValueAtTime(0.3, ctx.currentTime);
    env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(env);
    env.connect(sfxGain);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  }

  function playPickup() {
    if (_playMP3('pickup', 0.5)) return;
    if (!sfxEnabled) return;
    ensureContext(); resume();
    // Satisfying pluck
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15);
    env.gain.setValueAtTime(0.5, ctx.currentTime);
    env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.connect(env);
    env.connect(sfxGain);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  }

  function playCauldronBubble() {
    if (_playMP3('cauldron-bubble', 0.5)) return;
    if (!sfxEnabled) return;
    ensureContext(); resume();
    // Low bubble pop
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.12);
    env.gain.setValueAtTime(0.25, ctx.currentTime);
    env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(env);
    env.connect(sfxGain);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  }

  function playCauldronErupt() {
    if (_playMP3('cauldron-erupt', 0.5)) return;
    if (!sfxEnabled) return;
    ensureContext(); resume();
    // Ascending whomp sweep
    const t = ctx.currentTime;
    [80, 120, 200, 350, 600].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = t + i * 0.06;
      env.gain.setValueAtTime(0.35 - i * 0.05, start);
      env.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
      osc.connect(env);
      env.connect(sfxGain);
      osc.start(start);
      osc.stop(start + 0.45);
    });
  }

  function playPotionComplete() {
    if (_playMP3('potion-complete', 0.5)) return;
    if (!sfxEnabled) return;
    ensureContext(); resume();
    // Triumphant 4-note sting: Am → C → E → A
    const notes = [220, 261.63, 329.63, 440, 523.25];
    notes.forEach((freq, i) => {
      const t = ctx.currentTime + i * 0.12;
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      env.gain.setValueAtTime(0.15, t);
      env.gain.exponentialRampToValueAtTime(0.001, t + (i === 4 ? 0.8 : 0.3));
      osc.connect(env);
      env.connect(sfxGain);
      osc.start(t);
      osc.stop(t + (i === 4 ? 0.9 : 0.35));
    });
  }

  function playZeroYip() {
    if (_playMP3('zero-yip', 0.5)) return;
    if (!sfxEnabled) return;
    ensureContext(); resume();
    // Quick ghost dog yip
    [800, 1100, 900].forEach((freq, i) => {
      const t = ctx.currentTime + i * 0.07;
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      env.gain.setValueAtTime(0.12, t);
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      osc.connect(env);
      env.connect(sfxGain);
      osc.start(t);
      osc.stop(t + 0.12);
    });
  }

  function playStreak(level) {
    if (_playMP3('streak', 0.5)) return;
    if (!sfxEnabled) return;
    ensureContext(); resume();
    // Gets more exciting with streak level (1-5)
    const baseFreq = 400 + level * 80;
    for (let i = 0; i < level; i++) {
      const t = ctx.currentTime + i * 0.05;
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = baseFreq * (1 + i * 0.15);
      env.gain.setValueAtTime(0.2, t);
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.connect(env);
      env.connect(sfxGain);
      osc.start(t);
      osc.stop(t + 0.25);
    }
  }

  /* ---- TTS (Jack's voice) ---- */
  let ttsEnabled = true;
  let currentUtterance = null;

  // Jack-style voice: deep, theatrical, warm
  // Uses Web Speech API — works on Chrome/Silk, falls back silently
  function jackSpeak(text, onEnd) {
    if (!ttsEnabled || !window.speechSynthesis) {
      if (onEnd) onEnd();
      return;
    }
    // Cancel any in-progress speech
    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    currentUtterance = utter;

    // Pick the best available voice: deep male preferred
    // Includes Android/Fire tablet voices for Silk browser
    const voices = window.speechSynthesis.getVoices();
    const en = voices.filter(v => /^en[-_]/i.test(v.lang));
    const maleNames = [
      'Google UK English Male', 'Daniel', 'David', 'Alex',
      'Microsoft Mark',         // Windows — male US English
      'en-us-x-iom-local',     // Android/Fire — male (deeper)
      'en-gb-x-rjs-local',     // Android/Fire — British male
      'en-us-x-iom-network',   // Android/Fire — male (network)
      'English United Kingdom', // Android/Silk — often male variant
    ];
    let preferred = null;
    for (const name of maleNames) {
      const match = en.find(v => (v.name + v.lang).toLowerCase().includes(name.toLowerCase()));
      if (match) { preferred = match; break; }
    }
    if (!preferred) {
      preferred = en.find(v => /male/i.test(v.name))
        || en.find(v => v.localService)
        || en[0] || voices[0];
    }

    if (preferred) utter.voice = preferred;

    // Jack's theatrical delivery (pitch reduced slightly for Fire/Silk naturalness)
    utter.pitch  = 0.8;    // deep, spooky
    utter.rate   = 0.88;   // measured, deliberate
    utter.volume = 0.9;

    if (onEnd) utter.onend = onEnd;
    utter.onerror = () => { if (onEnd) onEnd(); };
    window.speechSynthesis.speak(utter);

    // Retry if speech engine fails to start (common on Fire/Android)
    setTimeout(() => {
      if (window.speechSynthesis && !window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
        try { window.speechSynthesis.speak(utter); } catch (e) { /* ignore */ }
      }
    }, 250);
  }

  // Pre-generated Jack TTS (Google Cloud Neural voice)
  const _jackTTSCache = {};
  const _jackTTSPending = new Set();
  function _tryJackTTS(filename, volume = 0.8) {
    if (_jackTTSCache[filename]) {
      if (!ttsEnabled) return true;
      ensureContext();
      const source = ctx.createBufferSource();
      source.buffer = _jackTTSCache[filename];
      const gain = ctx.createGain();
      gain.gain.value = volume;
      source.connect(gain);
      gain.connect(sfxGain);
      source.start(0);
      return true;
    }
    if (!_jackTTSPending.has(filename)) {
      _jackTTSPending.add(filename);
      ensureContext();
      fetch(`assets/sounds/tts/${filename}`)
        .then(r => { if (!r.ok) throw new Error(); return r.arrayBuffer(); })
        .then(b => ctx.decodeAudioData(b))
        .then(decoded => { _jackTTSCache[filename] = decoded; })
        .catch(() => {});
    }
    return false;
  }

  // Short praise lines Jack says after correct answers
  const JACK_PRAISE = [
    { text: 'Magnificent!', file: 'praise-magnificent' },
    { text: 'Splendid work!', file: 'praise-splendid-work' },
    { text: 'Most excellent!', file: 'praise-most-excellent' },
    { text: 'How wonderful!', file: 'praise-how-wonderful' },
    { text: 'Yes! Perfect!', file: 'praise-yes-perfect' },
    { text: 'Extraordinary!', file: 'praise-extraordinary' },
    { text: 'Well done!', file: 'praise-well-done' },
    { text: 'You are brilliant!', file: 'praise-you-are-brilliant' },
  ];

  function jackPraise() {
    const item = JACK_PRAISE[Math.floor(Math.random() * JACK_PRAISE.length)];
    if (_tryJackTTS(item.file + '.mp3', 0.8)) return;
    jackSpeak(item.text);
  }

  // Potion complete announcement
  function jackAnnouncePotion(potionName) {
    jackSpeak(`We brewed it! The ${potionName}! How magnificent!`);
  }

  // Wrong answer lines
  const JACK_WRONG = [
    { text: 'Oops! Try again!', file: 'wrong-oops-try-again' },
    { text: 'Hmm, not quite!', file: 'wrong-hmm-not-quite' },
    { text: 'Look carefully!', file: 'wrong-look-carefully' },
    { text: 'Almost! Look again!', file: 'wrong-almost-look-again' },
  ];

  function jackWrongLine() {
    const item = JACK_WRONG[Math.floor(Math.random() * JACK_WRONG.length)];
    if (_tryJackTTS(item.file + '.mp3', 0.8)) return;
    jackSpeak(item.text);
  }

  function setTts(on) { ttsEnabled = on; if (!on && window.speechSynthesis) window.speechSynthesis.cancel(); }

  /* ---- Controls ---- */
  function setMusic(on) {
    musicEnabled = on;
    if (!on) { stopMusic(); }
    else { startMusic(); }
    if (musicGain) musicGain.gain.value = on ? 0.35 : 0;
  }

  function setSfx(on) {
    sfxEnabled = on;
    if (sfxGain) sfxGain.gain.value = on ? 0.8 : 0;
  }

  return {
    resume,
    startMusic, stopMusic, setMusic, setSfx, setTts, setRoomMusic,
    jackSpeak, jackPraise, jackAnnouncePotion, jackWrongLine,
    playCorrect, playWrong, playPickup,
    playCauldronBubble, playCauldronErupt, playPotionComplete,
    playZeroYip, playStreak
  };
})();
