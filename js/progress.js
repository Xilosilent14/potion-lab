/* Jack's Potion Lab — Progress & Spaced Repetition v1.0 */

const PotionProgress = (() => {
  const KEY = 'potion_lab_progress';

  const defaults = () => ({
    version: 1,
    playerName: 'Asher',
    potionsCollected: [],    // array of potion IDs
    totalPotions: 0,
    sessionPotions: 0,
    totalCorrect: 0,
    totalAttempts: 0,
    currentStreak: 0,
    bestStreak: 0,
    consecutiveDays: 0,
    lastPlayDate: null,
    settings: { music: true, sfx: true },
    concepts: {}             // per-concept spaced rep tracking
  });

  let state = null;

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      state = raw ? { ...defaults(), ...JSON.parse(raw) } : defaults();
    } catch (_) {
      state = defaults();
    }
    return state;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) {}
  }

  function get() { return state || load(); }

  /* ---- Potions ---- */
  function collectPotion(potionId) {
    const s = get();
    if (!s.potionsCollected.includes(potionId)) {
      s.potionsCollected.push(potionId);
      s.totalPotions = s.potionsCollected.length;
    }
    s.sessionPotions = (s.sessionPotions || 0) + 1;
    save();
  }

  function hasPotion(potionId) { return get().potionsCollected.includes(potionId); }

  function getPotionCount() { return get().potionsCollected.length; }

  function getNextPotionId() {
    const s = get();
    for (let i = 1; i <= 24; i++) {
      if (!s.potionsCollected.includes(i)) return i;
    }
    return null; // all collected!
  }

  function getCurrentRoom() {
    const count = getPotionCount();
    if (count >= 18) return 5;
    if (count >= 15) return 4;
    if (count >= 10) return 3;
    if (count >= 5)  return 2;
    return 1;
  }

  /* ---- Concepts / Spaced Rep ---- */
  function recordAnswer(conceptId, conceptType, correct, timeMs) {
    const s = get();
    if (!s.concepts[conceptId]) {
      s.concepts[conceptId] = {
        id: conceptId,
        type: conceptType,
        box: 1,
        streak: 0,
        attempts: 0,
        correct: 0,
        state: 'new'
      };
    }
    const c = s.concepts[conceptId];
    c.attempts++;
    s.totalAttempts++;

    if (correct) {
      c.correct++;
      c.streak++;
      s.totalCorrect++;
      s.currentStreak++;
      if (s.currentStreak > s.bestStreak) s.bestStreak = s.currentStreak;
      // Leitner: move up a box on correct
      c.box = Math.min(6, c.box + 1);
      if (c.streak >= 3) c.state = 'familiar';
      if (c.streak >= 5) c.state = 'mastered';
    } else {
      c.streak = 0;
      s.currentStreak = 0;
      // Leitner: drop to box 1 on wrong (box 2 if was mastered)
      c.box = c.state === 'mastered' ? 2 : 1;
      if (c.state === 'mastered') c.state = 'relearning';
      else c.state = 'learning';
    }
    save();
  }

  function getWeakConcepts(type, limit = 3) {
    const s = get();
    return Object.values(s.concepts)
      .filter(c => c.type === type && c.box <= 2)
      .sort((a, b) => a.box - b.box || a.streak - b.streak)
      .slice(0, limit)
      .map(c => c.id);
  }

  /* ---- Streak ---- */
  function recordSession() {
    const s = get();
    const today = new Date().toDateString();
    if (s.lastPlayDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      s.consecutiveDays = s.lastPlayDate === yesterday ? (s.consecutiveDays || 0) + 1 : 1;
      s.lastPlayDate = today;
    }
    s.sessionPotions = 0;
    save();
  }

  /* ---- Settings ---- */
  function getSettings() { return get().settings; }

  function saveSettings(patch) {
    const s = get();
    s.settings = { ...s.settings, ...patch };
    save();
  }

  function getPlayerName() { return get().playerName || 'Asher'; }

  function setPlayerName(name) {
    const s = get();
    s.playerName = name || 'Asher';
    save();
  }

  /* ---- Reset ---- */
  function reset() {
    state = defaults();
    save();
  }

  return {
    load, get, save,
    collectPotion, hasPotion, getPotionCount, getNextPotionId, getCurrentRoom,
    recordAnswer, getWeakConcepts,
    recordSession,
    getSettings, saveSettings,
    getPlayerName, setPlayerName,
    reset
  };
})();
