/* Jack's Potion Lab — Audio Engine v1.0
   Web Audio API: Halloween Town background + SFX
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

  function resume() {
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  /* ---- Halloween Town ambient music ---- */
  /* Eerie but cheerful organ + glockenspiel loop in Am */
  function startMusic() {
    if (!musicEnabled) return;
    ensureContext();
    resume();
    if (bgStarted) return;
    bgStarted = true;

    const BPM = 80;
    const BEAT = 60 / BPM;
    const now = ctx.currentTime;

    // Halloween Town melody (Am pentatonic, glockenspiel-like)
    const melody = [
      // bar 1: A C E A
      { note: 220, beat: 0, dur: 0.8 },
      { note: 261.63, beat: 1, dur: 0.8 },
      { note: 329.63, beat: 2, dur: 0.8 },
      { note: 440, beat: 3, dur: 0.8 },
      // bar 2: G E C A
      { note: 392, beat: 4, dur: 0.8 },
      { note: 329.63, beat: 5, dur: 0.8 },
      { note: 261.63, beat: 6, dur: 0.8 },
      { note: 220, beat: 7, dur: 1.4 },
      // bar 3: C E G C
      { note: 261.63, beat: 8, dur: 0.8 },
      { note: 329.63, beat: 9, dur: 0.8 },
      { note: 392, beat: 10, dur: 0.8 },
      { note: 523.25, beat: 11, dur: 0.8 },
      // bar 4: B G E A (half step tension, resolves)
      { note: 493.88, beat: 12, dur: 0.6 },
      { note: 392, beat: 13, dur: 0.6 },
      { note: 329.63, beat: 14, dur: 0.8 },
      { note: 220, beat: 15, dur: 1.6 },
    ];

    const LOOP = 16 * BEAT;

    function scheduleLoop(startTime) {
      melody.forEach(({ note, beat, dur }) => {
        const t = startTime + beat * BEAT;
        // Glockenspiel = sine + high partial, fast attack, slow decay
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        const osc2 = ctx.createOscillator();
        const env2 = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.value = note;
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(0.5, t + 0.01);
        env.gain.exponentialRampToValueAtTime(0.001, t + dur);
        osc.connect(env);
        env.connect(musicGain);
        osc.start(t);
        osc.stop(t + dur + 0.1);

        // 2nd partial (shimmer)
        osc2.type = 'sine';
        osc2.frequency.value = note * 2.756; // inharmonic shimmer
        env2.gain.setValueAtTime(0, t);
        env2.gain.linearRampToValueAtTime(0.15, t + 0.01);
        env2.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.5);
        osc2.connect(env2);
        env2.connect(musicGain);
        osc2.start(t);
        osc2.stop(t + dur * 0.5 + 0.05);
      });

      // Organ bass (low sine drones on beats 1,3)
      [0, 8].forEach(beat => {
        const t = startTime + beat * BEAT;
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 110; // A2
        env.gain.setValueAtTime(0, t);
        env.gain.linearRampToValueAtTime(0.2, t + 0.05);
        env.gain.linearRampToValueAtTime(0.08, t + 3 * BEAT);
        env.gain.linearRampToValueAtTime(0.001, t + 4 * BEAT);
        osc.connect(env);
        env.connect(musicGain);
        osc.start(t);
        osc.stop(t + 4 * BEAT + 0.1);
      });

      // Schedule next loop
      setTimeout(() => {
        if (bgStarted && musicEnabled) scheduleLoop(startTime + LOOP);
      }, (LOOP - 2) * 1000);
    }

    scheduleLoop(now + 0.1);
  }

  function stopMusic() {
    bgStarted = false;
  }

  /* ---- SFX ---- */
  function playCorrect() {
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
    startMusic, stopMusic, setMusic, setSfx,
    playCorrect, playWrong, playPickup,
    playCauldronBubble, playCauldronErupt, playPotionComplete,
    playZeroYip, playStreak
  };
})();
