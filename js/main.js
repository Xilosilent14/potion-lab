/* Jack's Potion Lab — Main Controller v2.0
   Screens: splash → menu → game → potion-complete → session-complete
   Grade levels: Pre-K, Kindergarten, 1st Grade, 2nd Grade (69 potions across 14 rooms)
   Pre-K types: color, shape, count-1-5, letter, letter-sound, pattern, sort, count-6-10, more-less, size, color-mix
   Kindergarten types: count-11-20, add-to-5, sub-from-5, number-compare, beginning-sound, rhyming, letter-sound-k, pattern-advanced
   1st Grade types: add-to-20, sub-from-20, sight-words, beginning-blends, skip-counting, coins, place-value
   2nd Grade types: two-digit-add, two-digit-sub, telling-time, fractions, vowel-teams, measurement, even-odd
*/

(() => {
  /* ---- Boot ---- */
  document.addEventListener('DOMContentLoaded', () => {
    PotionProgress.load();
    applySettings();
    initCanvases();
    initEvents();
    showSplash();
    registerSW();
    if (typeof OTBEcosystem !== 'undefined') OTBEcosystem.checkDailyStreak();
  });

  function registerSW() {
    // Skip SW on localhost to prevent caching during development
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') return;
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }

  /* ---- Canvases ---- */
  function initCanvases() {
    const gameCanvas = document.getElementById('game-canvas');
    if (gameCanvas) {
      PotionEngine.init(gameCanvas);
    }
  }

  /* ---- Settings ---- */
  function applySettings() {
    const s = PotionProgress.getSettings();
    PotionAudio.setMusic(s.music !== false);
    PotionAudio.setSfx(s.sfx !== false);
    PotionAudio.setTts(s.tts !== false);
  }

  // Pre-load voices on user gesture (required by some browsers)
  function primeVoices() {
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      // Chrome loads voices async
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
  }

  /* ---- Screen Router ---- */
  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById('screen-' + id);
    if (el) el.classList.add('active');
  }

  /* ---- SPLASH ---- */
  function showSplash() {
    showScreen('splash');
    setTimeout(() => showMenu(), 2200);
  }

  /* ---- MENU ---- */
  function showMenu() {
    PotionEngine.setMode('menu');
    showScreen('menu');
    renderMenuShelf();
    const name = PotionProgress.getPlayerName();
    const el = document.getElementById('menu-player');
    if (el) el.textContent = `Hi, ${name}!`;
    const pc = document.getElementById('menu-potions-count');
    if (pc) pc.textContent = PotionProgress.getPotionCount();
    // Show current grade level
    const gradeEl = document.getElementById('menu-grade');
    if (gradeEl) {
      const grade = PotionProgress.getCurrentGrade();
      const gradeInfo = GRADE_LEVELS.find(g => g.id === grade);
      gradeEl.textContent = gradeInfo ? `${gradeInfo.icon} ${gradeInfo.label}` : '';
    }
    PotionAudio.startMusic();
  }

  function renderMenuShelf() {
    const shelf = document.getElementById('menu-shelf');
    if (!shelf) return;
    const collected = PotionProgress.get().potionsCollected;
    // Show potions from the current grade level (up to 15)
    const grade = PotionProgress.getCurrentGrade();
    const gradeInfo = GRADE_LEVELS.find(g => g.id === grade);
    const startId = gradeInfo ? gradeInfo.potionRange[0] : 1;
    const endId = gradeInfo ? gradeInfo.potionRange[1] : 24;
    const gradePotions = POTIONS.filter(p => p.id >= startId && p.id <= endId).slice(0, 15);
    shelf.innerHTML = gradePotions.map(p => {
      const earned = collected.includes(p.id);
      return `<span class="mini-potion ${earned ? 'earned' : ''}" title="${p.name}">${p.icon}</span>`;
    }).join('');
  }

  /* ---- GAME STATE ---- */
  const game = {
    currentPotion: null,
    questionsThisPotion: 0,
    questionsNeeded: 3,
    wrongCount: 0,
    sessionPotions: [],
    currentQuestion: null,
    answered: false,
    startTime: 0,
    streak: 0
  };

  /* ---- GAME ---- */
  function startGame() {
    PotionAudio.resume();
    const nextId = PotionProgress.getNextPotionId();
    if (!nextId) {
      showFinalCelebration();
      return;
    }
    game.currentPotion = POTIONS.find(p => p.id === nextId);
    game.questionsThisPotion = 0;
    game.questionsNeeded = 3 + Math.floor(Math.random() * 2); // 3-4 questions per potion
    game.wrongCount = 0;
    game.sessionPotions = [];
    game.streak = 0;

    // Set the canvas room background and music to match the current potion's room
    // Cycle through 5 visual themes for rooms beyond 5
    const roomIdx = (game.currentPotion.room || 1) - 1;
    PotionEngine.setRoom(roomIdx % 5);
    PotionAudio.setRoomMusic(roomIdx % 5);
    PotionEngine.setMode('game');

    showScreen('game');
    PotionEngine.resetCauldron(game.questionsNeeded);
    updateHUD();
    PotionEngine.jackTalk();

    setTimeout(() => askNextQuestion(), 600);
  }

  function updateHUD() {
    const potionCount = PotionProgress.getPotionCount();
    const hud = document.getElementById('hud-potion-count');
    if (hud) hud.textContent = `${potionCount} / ${TOTAL_POTIONS}`;

    const title = document.getElementById('hud-title');
    if (title && game.currentPotion) title.textContent = game.currentPotion.name;

    const streak = document.getElementById('hud-streak');
    if (streak) {
      const s = game.streak;
      streak.textContent = s >= 3 ? `🔥 ${s}` : s >= 1 ? `⭐ ${s}` : '';
    }

    // Show grade badge in HUD
    const gradeBadge = document.getElementById('hud-grade');
    if (gradeBadge) {
      const grade = PotionProgress.getCurrentGrade();
      const gradeInfo = GRADE_LEVELS.find(g => g.id === grade);
      gradeBadge.textContent = gradeInfo ? gradeInfo.label : '';
    }
  }

  /* ---- QUESTION SYSTEM ---- */
  function getQuestionType() {
    const room = PotionProgress.getCurrentRoom();
    const roomDef = ROOMS[room];
    const types = roomDef ? roomDef.questionTypes : ['color', 'shape', 'count-1-5'];
    // Weight by spaced rep (weak concepts more often)
    return types[Math.floor(Math.random() * types.length)];
  }

  function askNextQuestion() {
    game.answered = false;
    game.startTime = Date.now();

    const type = getQuestionType();
    const q = buildQuestion(type);
    game.currentQuestion = q;

    renderQuestion(q);
  }

  /* ---- QUESTION BUILDERS ---- */
  function buildQuestion(type) {
    switch (type) {
      case 'color':           return buildColorQuestion();
      case 'shape':           return buildShapeQuestion();
      case 'count-1-5':       return buildCountQuestion(1, 5);
      case 'count-6-10':      return buildCountQuestion(6, 10);
      case 'count-11-20':     return buildCountQuestion(11, 20);
      case 'count-dice':      return buildDiceQuestion();
      case 'more-less':       return buildMoreLessQuestion();
      case 'number-compare':  return buildNumberCompareQuestion();
      case 'size':            return buildSizeQuestion();
      case 'letter':          return buildLetterQuestion();
      case 'letter-sound':    return buildLetterSoundQuestion();
      case 'letter-sound-k':  return buildLetterSoundQuestion();
      case 'beginning-sound': return buildBeginningSoundQuestion();
      case 'rhyming':         return buildRhymingQuestion();
      case 'pattern':         return buildPatternQuestion();
      case 'pattern-advanced':return buildPatternAdvancedQuestion();
      case 'sort':            return buildSortQuestion();
      case 'review':          return buildReviewQuestion();
      case 'color-mix':       return buildColorMixQuestion();
      case 'add-to-5':        return buildAddSubQuestion(0, 5, 'add');
      case 'sub-from-5':      return buildAddSubQuestion(0, 5, 'sub');
      case 'add-to-20':       return buildAddSubQuestion(0, 20, 'add');
      case 'sub-from-20':     return buildAddSubQuestion(0, 20, 'sub');
      case 'sight-words':     return buildSightWordQuestion();
      case 'beginning-blends':return buildBeginningBlendsQuestion();
      case 'skip-counting':   return buildSkipCountingQuestion();
      case 'coins':           return buildCoinsQuestion();
      case 'place-value':     return buildPlaceValueQuestion();
      case 'two-digit-add':   return buildTwoDigitAddSubQuestion('add');
      case 'two-digit-sub':   return buildTwoDigitAddSubQuestion('sub');
      case 'telling-time':    return buildTellingTimeQuestion();
      case 'fractions':       return buildFractionsQuestion();
      case 'vowel-teams':     return buildVowelTeamsQuestion();
      case 'measurement':     return buildMeasurementQuestion();
      case 'even-odd':        return buildEvenOddQuestion();
      case 'review-advanced': return buildReviewAdvancedQuestion();
      default:                return buildColorQuestion();
    }
  }

  const COLORS = [
    { name: 'red',    emoji: '🔴', label: 'Red',    hex: '#e83845' },
    { name: 'blue',   emoji: '🔵', label: 'Blue',   hex: '#3498db' },
    { name: 'green',  emoji: '🟢', label: 'Green',  hex: '#2ecc71' },
    { name: 'yellow', emoji: '🟡', label: 'Yellow', hex: '#ffd700' },
    { name: 'orange', emoji: '🟠', label: 'Orange', hex: '#ff7518' },
    { name: 'purple', emoji: '🟣', label: 'Purple', hex: '#9b59b6' },
    { name: 'white',  emoji: '⚪', label: 'White',  hex: '#f5f0e0' },
    { name: 'black',  emoji: '⚫', label: 'Black',  hex: '#2c2c3e' }
  ];

  const SHAPES = [
    { name: 'circle',    emoji: '⭕', label: 'Circle',    desc: 'round like a ball' },
    { name: 'square',    emoji: '🟦', label: 'Square',    desc: 'four equal sides' },
    { name: 'triangle',  emoji: '🔺', label: 'Triangle',  desc: 'three corners' },
    { name: 'star',      emoji: '⭐', label: 'Star',      desc: 'shiny and pointy' },
    { name: 'heart',     emoji: '❤️', label: 'Heart',     desc: 'shaped like love' },
    { name: 'diamond',   emoji: '💎', label: 'Diamond',   desc: 'four pointy sides' }
  ];

  const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  const LETTER_SOUNDS = {
    A: { sound: 'A (like apple 🍎)', examples: '🍎🐜🐊' },
    B: { sound: 'B (like bat 🦇)', examples: '🦇🐝🌕' },
    C: { sound: 'C (like cat 🐱)', examples: '🐱🎃🌽' },
    D: { sound: 'D (like dog 🐶)', examples: '🐶🦆💎' },
    E: { sound: 'E (like elephant 🐘)', examples: '🐘🥚🦅' },
    F: { sound: 'F (like fish 🐟)', examples: '🐟🌸🦊' },
    G: { sound: 'G (like ghost 👻)', examples: '👻🍇🦒' },
    H: { sound: 'H (like hat 🎩)', examples: '🎩🏠🦔' },
    I: { sound: 'I (like igloo 🏔️)', examples: '🏔️🍦🦎' },
    J: { sound: 'J (like Jack 🎃)', examples: '🎃🌟🦊' },
    K: { sound: 'K (like king 👑)', examples: '👑🪁🦘' },
    L: { sound: 'L (like leaf 🍃)', examples: '🍃🦁🪔' },
    M: { sound: 'M (like moon 🌙)', examples: '🌙🍄🦋' },
    N: { sound: 'N (like night 🌃)', examples: '🌃🥜🕷️' },
    O: { sound: 'O (like owl 🦉)', examples: '🦉🍊🐙' },
    P: { sound: 'P (like pumpkin 🎃)', examples: '🎃🐧🍕' },
    Q: { sound: 'Q (like queen 👸)', examples: '👸🦜❓' },
    R: { sound: 'R (like raven 🐦)', examples: '🐦🌹🤖' },
    S: { sound: 'S (like spider 🕷️)', examples: '🕷️🌟🐍' },
    T: { sound: 'T (like tree 🌲)', examples: '🌲🎩🐢' },
    U: { sound: 'U (like umbrella ☂️)', examples: '☂️🦄🔵' },
    V: { sound: 'V (like vine 🌿)', examples: '🌿🎻🦅' },
    W: { sound: 'W (like witch 🧙)', examples: '🧙🕸️🐺' },
    X: { sound: 'X (like x-ray ✨)', examples: '✨🎸🦊' },
    Y: { sound: 'Y (like yarn 🧶)', examples: '🧶🍋🐍' },
    Z: { sound: 'Z (like Zero 👻)', examples: '👻🦓🍕' }
  };

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function pick(arr, n) { return shuffle(arr).slice(0, n); }

  function buildColorQuestion() {
    const correct = COLORS[Math.floor(Math.random() * COLORS.length)];
    const others = shuffle(COLORS.filter(c => c.name !== correct.name)).slice(0, 2);
    const options = shuffle([correct, ...others]);

    return {
      type: 'color',
      conceptId: 'color_' + correct.name,
      prompt: `Jack needs the ${correct.label} potion!\nFind the ${correct.label} ingredient!`,
      options: options.map(c => ({
        emoji: c.emoji,
        label: c.label,
        correct: c.name === correct.name
      }))
    };
  }

  function buildShapeQuestion() {
    const correct = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const others = shuffle(SHAPES.filter(s => s.name !== correct.name)).slice(0, 2);
    const options = shuffle([correct, ...others]);

    return {
      type: 'shape',
      conceptId: 'shape_' + correct.name,
      prompt: `Jack needs the ${correct.label} ingredient!\nFind the ${correct.label}!`,
      options: options.map(s => ({
        emoji: s.emoji,
        label: s.label,
        correct: s.name === correct.name
      }))
    };
  }

  function buildCountQuestion(min, max) {
    const target = min + Math.floor(Math.random() * (max - min + 1));
    const display = buildCountDisplay(target);
    const others = [];
    while (others.length < 2) {
      const n = min + Math.floor(Math.random() * (max - min + 1));
      if (n !== target && !others.includes(n)) others.push(n);
    }
    const options = shuffle([target, ...others]);

    return {
      type: 'count',
      conceptId: 'count_' + target,
      prompt: `How many? Count them!`,
      display,
      options: options.map(n => ({
        emoji: String(n),
        label: String(n),
        correct: n === target,
        isNumber: true
      }))
    };
  }

  function buildCountDisplay(n) {
    const items = ['🕷️', '🦇', '🎃', '🌙', '⭐', '💀', '🕯️', '🌕', '🌹', '👻'];
    const icon = items[Math.floor(Math.random() * items.length)];
    return icon.repeat(n);
  }

  function buildDiceQuestion() {
    const d1 = 1 + Math.floor(Math.random() * 3);
    const d2 = 1 + Math.floor(Math.random() * 3);
    const total = d1 + d2;
    const display = `🎲${buildDiceDots(d1)}  🎲${buildDiceDots(d2)}`;
    const others = [];
    while (others.length < 2) {
      const n = 2 + Math.floor(Math.random() * 5);
      if (n !== total && !others.includes(n)) others.push(n);
    }
    const options = shuffle([total, ...others]);
    return {
      type: 'count',
      conceptId: 'count_dice_' + total,
      prompt: `Oogie rolled the dice!\nHow many dots altogether?`,
      display,
      options: options.map(n => ({ emoji: String(n), label: String(n), correct: n === total, isNumber: true }))
    };
  }

  function buildDiceDots(n) {
    return '●'.repeat(n);
  }

  function buildMoreLessQuestion() {
    const a = 1 + Math.floor(Math.random() * 9);
    let b = 1 + Math.floor(Math.random() * 9);
    while (b === a) b = 1 + Math.floor(Math.random() * 9);
    const prompt = `Which pile has MORE?`;
    const pileA = '🐛'.repeat(a) + ` (${a})`;
    const pileB = '🐛'.repeat(b) + ` (${b})`;
    return {
      type: 'more-less',
      conceptId: 'more_less',
      prompt,
      display: `${pileA}\n${pileB}`,
      options: [
        { emoji: '⬆️', label: `Top pile (${a})`, correct: a > b },
        { emoji: '⬇️', label: `Bottom pile (${b})`, correct: b > a }
      ]
    };
  }

  function buildSizeQuestion() {
    const sizes = [
      { label: 'big', emoji: '🔵', size: 'big' },
      { label: 'small', emoji: '🔵', size: 'small' }
    ];
    const prompt = `Jack needs the BIG bottle!\nWhich one is bigger?`;
    return {
      type: 'size',
      conceptId: 'size_big_small',
      prompt,
      options: [
        { emoji: '🫙', label: 'Big jar', correct: true,  size: 'big' },
        { emoji: '🍶', label: 'Small jar', correct: false, size: 'small' }
      ]
    };
  }

  function buildLetterQuestion() {
    const target = LETTERS[Math.floor(Math.random() * LETTERS.length)];
    const others = shuffle(LETTERS.filter(l => l !== target)).slice(0, 2);
    const options = shuffle([target, ...others]);
    return {
      type: 'letter',
      conceptId: 'letter_' + target,
      prompt: `Find the letter ${target} on the gravestone!`,
      options: options.map(l => ({
        emoji: l,
        label: l,
        correct: l === target,
        isLetter: true
      }))
    };
  }

  function buildLetterSoundQuestion() {
    const target = LETTERS[Math.floor(Math.random() * 20)]; // A-T most common
    const info = LETTER_SOUNDS[target] || { sound: target, examples: '' };
    const others = shuffle(LETTERS.filter(l => l !== target)).slice(0, 2);
    const options = shuffle([target, ...others]);
    return {
      type: 'letter-sound',
      conceptId: 'letter_sound_' + target,
      prompt: `Which letter says ${info.sound}?`,
      options: options.map(l => ({
        emoji: l,
        label: l,
        correct: l === target,
        isLetter: true
      }))
    };
  }

  const PATTERN_ITEMS = ['🎃', '🦇', '🌙', '💀', '🕷️', '👻', '⭐', '🌹'];

  function buildPatternQuestion() {
    // AB pattern
    const a = PATTERN_ITEMS[Math.floor(Math.random() * 4)];
    let b = PATTERN_ITEMS[Math.floor(Math.random() * 4)];
    while (b === a) b = PATTERN_ITEMS[Math.floor(Math.random() * 4)];

    const isAB = Math.random() > 0.4;
    let sequence, answer;

    if (isAB) {
      sequence = [a, b, a, b, a, '?'];
      answer = b;
    } else {
      // ABB pattern
      sequence = [a, b, b, a, b, '?'];
      answer = b;
    }

    const wrong1 = PATTERN_ITEMS.find(x => x !== answer && x !== a && x !== b) || a;
    const options = shuffle([
      { emoji: answer, label: answer, correct: true },
      { emoji: a === answer ? b : a, label: a === answer ? b : a, correct: false },
      { emoji: wrong1, label: wrong1, correct: false }
    ]);

    return {
      type: 'pattern',
      conceptId: 'pattern_ab',
      prompt: `What comes next in the pattern?`,
      display: sequence.join(' '),
      options
    };
  }

  function buildSortQuestion() {
    const groups = [
      { name: 'bats', emoji: '🦇', correct: '🦇', wrong: ['🎃', '🌙', '👻'] },
      { name: 'pumpkins', emoji: '🎃', correct: '🎃', wrong: ['🦇', '🌙', '💀'] },
      { name: 'moons', emoji: '🌙', correct: '🌙', wrong: ['🎃', '🕷️', '⭐'] }
    ];
    const g = groups[Math.floor(Math.random() * groups.length)];
    const wrongOpts = shuffle(g.wrong).slice(0, 2);
    const options = shuffle([
      { emoji: g.correct, label: g.correct, correct: true },
      ...wrongOpts.map(w => ({ emoji: w, label: w, correct: false }))
    ]);
    return {
      type: 'sort',
      conceptId: 'sort_' + g.name,
      prompt: `Help sort the parade!\nFind the ${g.name}!`,
      options
    };
  }

  function buildReviewQuestion() {
    const allTypes = ['color', 'shape', 'count-1-5', 'letter', 'size'];
    const t = allTypes[Math.floor(Math.random() * allTypes.length)];
    return buildQuestion(t);
  }

  function buildReviewAdvancedQuestion() {
    const allTypes = ['add-to-20', 'sub-from-20', 'sight-words', 'telling-time', 'even-odd', 'two-digit-add'];
    const t = allTypes[Math.floor(Math.random() * allTypes.length)];
    return buildQuestion(t);
  }

  /* ---- KINDERGARTEN QUESTION BUILDERS ---- */

  function buildNumberCompareQuestion() {
    const a = 1 + Math.floor(Math.random() * 15);
    let b = 1 + Math.floor(Math.random() * 15);
    while (b === a) b = 1 + Math.floor(Math.random() * 15);
    const useEqual = Math.random() < 0.2;
    const bVal = useEqual ? a : b;
    const correct = a > bVal ? 'more' : a < bVal ? 'less' : 'equal';
    const options = shuffle([
      { emoji: '>', label: `${a} is MORE`, correct: correct === 'more' },
      { emoji: '<', label: `${a} is LESS`, correct: correct === 'less' },
      { emoji: '=', label: 'They are EQUAL', correct: correct === 'equal' }
    ]);
    return {
      type: 'number-compare',
      conceptId: 'number_compare',
      prompt: `Compare: ${a} and ${bVal}`,
      display: `${a}  ???  ${bVal}`,
      options
    };
  }

  const BEGINNING_SOUND_WORDS = [
    { word: 'ball',    letter: 'B', emoji: '⚽' },
    { word: 'cat',     letter: 'C', emoji: '🐱' },
    { word: 'dog',     letter: 'D', emoji: '🐶' },
    { word: 'fish',    letter: 'F', emoji: '🐟' },
    { word: 'goat',    letter: 'G', emoji: '🐐' },
    { word: 'hat',     letter: 'H', emoji: '🎩' },
    { word: 'kite',    letter: 'K', emoji: '🪁' },
    { word: 'lamp',    letter: 'L', emoji: '💡' },
    { word: 'moon',    letter: 'M', emoji: '🌙' },
    { word: 'nest',    letter: 'N', emoji: '🪺' },
    { word: 'pig',     letter: 'P', emoji: '🐷' },
    { word: 'rain',    letter: 'R', emoji: '🌧️' },
    { word: 'sun',     letter: 'S', emoji: '☀️' },
    { word: 'top',     letter: 'T', emoji: '🔝' },
    { word: 'van',     letter: 'V', emoji: '🚐' },
    { word: 'web',     letter: 'W', emoji: '🕸️' },
    { word: 'zip',     letter: 'Z', emoji: '⚡' }
  ];

  function buildBeginningSoundQuestion() {
    const target = BEGINNING_SOUND_WORDS[Math.floor(Math.random() * BEGINNING_SOUND_WORDS.length)];
    const others = shuffle(BEGINNING_SOUND_WORDS.filter(w => w.letter !== target.letter)).slice(0, 2);
    const options = shuffle([
      { emoji: target.letter, label: target.letter, correct: true, isLetter: true },
      ...others.map(w => ({ emoji: w.letter, label: w.letter, correct: false, isLetter: true }))
    ]);
    return {
      type: 'beginning-sound',
      conceptId: 'beginning_sound_' + target.letter,
      prompt: `What sound does "${target.word}" start with? ${target.emoji}`,
      options
    };
  }

  const RHYME_GROUPS = [
    { words: ['cat', 'bat', 'hat', 'mat', 'rat', 'sat'], display: 'cat 🐱' },
    { words: ['dog', 'log', 'fog', 'hog', 'jog', 'bog'], display: 'dog 🐶' },
    { words: ['bug', 'rug', 'mug', 'hug', 'tug', 'dug'], display: 'bug 🐛' },
    { words: ['hop', 'top', 'mop', 'pop', 'stop', 'drop'], display: 'hop 🐸' },
    { words: ['run', 'fun', 'sun', 'bun', 'gun', 'pun'], display: 'sun ☀️' },
    { words: ['cake', 'lake', 'make', 'bake', 'rake', 'take'], display: 'cake 🎂' },
    { words: ['bell', 'well', 'tell', 'fell', 'sell', 'yell'], display: 'bell 🔔' },
    { words: ['king', 'ring', 'sing', 'wing', 'thing', 'bring'], display: 'king 👑' }
  ];

  function buildRhymingQuestion() {
    const group = RHYME_GROUPS[Math.floor(Math.random() * RHYME_GROUPS.length)];
    const baseWord = group.words[0];
    const rhyme = group.words[1 + Math.floor(Math.random() * (group.words.length - 1))];
    // Get non-rhyming words from other groups
    const nonRhymes = shuffle(
      RHYME_GROUPS.filter(g => g !== group).map(g => g.words[Math.floor(Math.random() * g.words.length)])
    ).slice(0, 2);
    const options = shuffle([
      { emoji: '✅', label: rhyme, correct: true },
      ...nonRhymes.map(w => ({ emoji: '❌', label: w, correct: false }))
    ]);
    return {
      type: 'rhyming',
      conceptId: 'rhyming_' + baseWord,
      prompt: `What rhymes with "${baseWord}"? ${group.display}`,
      options
    };
  }

  function buildPatternAdvancedQuestion() {
    const patterns = [
      // ABC pattern
      () => {
        const items = shuffle(PATTERN_ITEMS).slice(0, 3);
        const seq = [items[0], items[1], items[2], items[0], items[1], '?'];
        return { seq, answer: items[2], wrong: [items[0], items[1]] };
      },
      // AABB pattern
      () => {
        const items = shuffle(PATTERN_ITEMS).slice(0, 2);
        const seq = [items[0], items[0], items[1], items[1], items[0], '?'];
        return { seq, answer: items[0], wrong: [items[1], PATTERN_ITEMS.find(x => x !== items[0] && x !== items[1]) || '🌟'] };
      },
      // Growing number pattern
      () => {
        const start = 1 + Math.floor(Math.random() * 3);
        const seq = [String(start), String(start + 1), String(start + 2), String(start + 3), String(start + 4), '?'];
        const answer = String(start + 5);
        const wrong = [String(start + 6), String(start + 3)];
        return { seq, answer, wrong, isNumber: true };
      }
    ];
    const builder = patterns[Math.floor(Math.random() * patterns.length)];
    const { seq, answer, wrong, isNumber } = builder();
    const wrongItem = PATTERN_ITEMS.find(x => x !== answer && !wrong.includes(x)) || wrong[0];
    const options = shuffle([
      { emoji: answer, label: answer, correct: true, isNumber },
      { emoji: wrong[0], label: wrong[0], correct: false, isNumber },
      { emoji: wrong.length > 1 ? wrong[1] : wrongItem, label: wrong.length > 1 ? wrong[1] : wrongItem, correct: false, isNumber }
    ]);
    return {
      type: 'pattern',
      conceptId: 'pattern_advanced',
      prompt: 'What comes next in the pattern?',
      display: seq.join(' '),
      options
    };
  }

  function buildAddSubQuestion(min, max, operation) {
    let a, b, answer;
    if (operation === 'add') {
      if (max <= 5) {
        a = Math.floor(Math.random() * (max + 1));
        b = Math.floor(Math.random() * (max - a + 1));
      } else {
        a = 1 + Math.floor(Math.random() * Math.min(max - 1, 10));
        b = 1 + Math.floor(Math.random() * Math.min(max - a, 10));
      }
      answer = a + b;
    } else {
      if (max <= 5) {
        answer = Math.floor(Math.random() * max);
        b = Math.floor(Math.random() * (max - answer + 1));
        a = answer + b;
      } else {
        a = 2 + Math.floor(Math.random() * max);
        b = 1 + Math.floor(Math.random() * (a - 1));
        if (b > 10) b = Math.floor(Math.random() * 10) + 1;
        if (a > max) a = max;
        answer = a - b;
      }
    }
    const symbol = operation === 'add' ? '+' : '-';
    const others = [];
    while (others.length < 2) {
      const n = Math.max(0, answer + (Math.random() < 0.5 ? 1 : -1) * (1 + Math.floor(Math.random() * 3)));
      if (n !== answer && !others.includes(n) && n >= 0) others.push(n);
    }
    const options = shuffle([answer, ...others]);
    return {
      type: operation === 'add' ? 'addition' : 'subtraction',
      conceptId: `${operation}_${a}_${symbol}_${b}`,
      prompt: `Solve: ${a} ${symbol} ${b} = ?`,
      display: `${a} ${symbol} ${b} = ?`,
      options: options.map(n => ({ emoji: String(n), label: String(n), correct: n === answer, isNumber: true }))
    };
  }

  /* ---- 1ST GRADE QUESTION BUILDERS ---- */

  const SIGHT_WORDS_K = ['the', 'and', 'is', 'it', 'to', 'in', 'he', 'I', 'was', 'you', 'my', 'we', 'do', 'no', 'go'];
  const SIGHT_WORDS_1 = ['are', 'have', 'they', 'said', 'come', 'some', 'were', 'there', 'what', 'when', 'your', 'been', 'from', 'could', 'would'];

  function buildSightWordQuestion() {
    const allWords = [...SIGHT_WORDS_K, ...SIGHT_WORDS_1];
    const target = allWords[Math.floor(Math.random() * allWords.length)];
    // Scramble the word for display
    const scrambled = shuffle(target.split('')).join('');
    const others = shuffle(allWords.filter(w => w !== target)).slice(0, 2);
    const options = shuffle([
      { emoji: '📖', label: target, correct: true },
      ...others.map(w => ({ emoji: '📖', label: w, correct: false }))
    ]);
    return {
      type: 'sight-words',
      conceptId: 'sight_word_' + target,
      prompt: `Which word is "${target}"? Read carefully!`,
      options
    };
  }

  const BLENDS_DATA = [
    { blend: 'bl', words: ['black', 'blue', 'block', 'blow'], emoji: '🖤' },
    { blend: 'br', words: ['brown', 'bread', 'bring', 'brave'], emoji: '🍞' },
    { blend: 'cl', words: ['clap', 'clock', 'cloud', 'class'], emoji: '👏' },
    { blend: 'cr', words: ['crab', 'crown', 'cry', 'crash'], emoji: '🦀' },
    { blend: 'dr', words: ['drum', 'dream', 'drop', 'draw'], emoji: '🥁' },
    { blend: 'fl', words: ['flag', 'fly', 'flower', 'flat'], emoji: '🏴' },
    { blend: 'gr', words: ['green', 'grow', 'grass', 'gray'], emoji: '🟢' },
    { blend: 'pl', words: ['play', 'plan', 'plant', 'plate'], emoji: '🎮' },
    { blend: 'sl', words: ['sleep', 'slide', 'slow', 'slip'], emoji: '😴' },
    { blend: 'sn', words: ['snow', 'snake', 'snack', 'snap'], emoji: '❄️' },
    { blend: 'sp', words: ['spider', 'spot', 'spin', 'space'], emoji: '🕷️' },
    { blend: 'st', words: ['star', 'stop', 'stone', 'step'], emoji: '⭐' },
    { blend: 'tr', words: ['tree', 'truck', 'train', 'trip'], emoji: '🌲' }
  ];

  function buildBeginningBlendsQuestion() {
    const target = BLENDS_DATA[Math.floor(Math.random() * BLENDS_DATA.length)];
    const word = target.words[Math.floor(Math.random() * target.words.length)];
    const others = shuffle(BLENDS_DATA.filter(b => b.blend !== target.blend)).slice(0, 2);
    const options = shuffle([
      { emoji: target.emoji, label: target.blend, correct: true },
      ...others.map(b => ({ emoji: b.emoji, label: b.blend, correct: false }))
    ]);
    return {
      type: 'beginning-blends',
      conceptId: 'blend_' + target.blend,
      prompt: `"${word}" starts with which blend? ${target.emoji}`,
      options
    };
  }

  function buildSkipCountingQuestion() {
    const skipBy = [2, 5, 10][Math.floor(Math.random() * 3)];
    const start = skipBy === 2 ? (Math.floor(Math.random() * 5) * 2) :
                  skipBy === 5 ? (Math.floor(Math.random() * 4) * 5) :
                  (Math.floor(Math.random() * 3) * 10);
    const sequence = [];
    for (let i = 0; i < 4; i++) sequence.push(start + skipBy * i);
    const answer = start + skipBy * 4;
    const display = sequence.join(', ') + ', ?';
    const others = [];
    while (others.length < 2) {
      const n = answer + (Math.random() < 0.5 ? skipBy : -skipBy) * (1 + Math.floor(Math.random() * 2));
      if (n !== answer && !others.includes(n) && n > 0) others.push(n);
    }
    if (others.length < 2) others.push(answer + 1);
    const options = shuffle([answer, ...others]);
    return {
      type: 'skip-counting',
      conceptId: 'skip_count_by_' + skipBy,
      prompt: `Skip count by ${skipBy}s! What comes next?`,
      display,
      options: options.map(n => ({ emoji: String(n), label: String(n), correct: n === answer, isNumber: true }))
    };
  }

  const COIN_DATA = [
    { name: 'penny',  value: 1,  emoji: '🟤', symbol: '1¢' },
    { name: 'nickel', value: 5,  emoji: '⚪', symbol: '5¢' },
    { name: 'dime',   value: 10, emoji: '⬜', symbol: '10¢' }
  ];

  function buildCoinsQuestion() {
    const questionType = Math.random();
    if (questionType < 0.5) {
      // "How much is a ___?"
      const coin = COIN_DATA[Math.floor(Math.random() * COIN_DATA.length)];
      const others = COIN_DATA.filter(c => c.name !== coin.name);
      const options = shuffle([
        { emoji: coin.symbol, label: `${coin.value} cents`, correct: true, isNumber: true },
        ...others.map(c => ({ emoji: c.symbol, label: `${c.value} cents`, correct: false, isNumber: true }))
      ]);
      return {
        type: 'coins',
        conceptId: 'coin_' + coin.name,
        prompt: `How much is a ${coin.name} worth? ${coin.emoji}`,
        options
      };
    } else {
      // "Count the coins"
      const coins = [];
      const numCoins = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < numCoins; i++) {
        coins.push(COIN_DATA[Math.floor(Math.random() * COIN_DATA.length)]);
      }
      const total = coins.reduce((sum, c) => sum + c.value, 0);
      const display = coins.map(c => `${c.emoji}${c.symbol}`).join(' + ');
      const others = [];
      while (others.length < 2) {
        const n = total + (Math.random() < 0.5 ? 5 : -5) * (1 + Math.floor(Math.random() * 2));
        if (n !== total && !others.includes(n) && n > 0) others.push(n);
      }
      const options = shuffle([total, ...others]);
      return {
        type: 'coins',
        conceptId: 'coin_count_' + total,
        prompt: 'How many cents altogether?',
        display,
        options: options.map(n => ({ emoji: String(n) + '¢', label: `${n} cents`, correct: n === total, isNumber: true }))
      };
    }
  }

  function buildPlaceValueQuestion() {
    const tens = 1 + Math.floor(Math.random() * 9);
    const ones = Math.floor(Math.random() * 10);
    const number = tens * 10 + ones;
    const askTens = Math.random() < 0.5;
    const answer = askTens ? tens : ones;
    const place = askTens ? 'tens' : 'ones';
    const others = [];
    while (others.length < 2) {
      const n = Math.floor(Math.random() * 10);
      if (n !== answer && !others.includes(n)) others.push(n);
    }
    const options = shuffle([answer, ...others]);
    return {
      type: 'place-value',
      conceptId: 'place_value_' + place,
      prompt: `In the number ${number}, what digit is in the ${place} place?`,
      display: `${number}`,
      options: options.map(n => ({ emoji: String(n), label: String(n), correct: n === answer, isNumber: true }))
    };
  }

  /* ---- 2ND GRADE QUESTION BUILDERS ---- */

  function buildTwoDigitAddSubQuestion(operation) {
    let a, b, answer;
    if (operation === 'add') {
      // Mix of no-regrouping and with-regrouping
      a = 10 + Math.floor(Math.random() * 80);
      b = 10 + Math.floor(Math.random() * (99 - a));
      answer = a + b;
    } else {
      a = 20 + Math.floor(Math.random() * 80);
      b = 10 + Math.floor(Math.random() * (a - 10));
      answer = a - b;
    }
    const symbol = operation === 'add' ? '+' : '-';
    const others = [];
    while (others.length < 2) {
      const offset = (Math.random() < 0.5 ? 1 : -1) * (1 + Math.floor(Math.random() * 10));
      const n = answer + offset;
      if (n !== answer && !others.includes(n) && n >= 0 && n <= 199) others.push(n);
    }
    const options = shuffle([answer, ...others]);
    return {
      type: 'two-digit-math',
      conceptId: `two_digit_${operation}_${a}_${b}`,
      prompt: `Solve: ${a} ${symbol} ${b} = ?`,
      display: `${a} ${symbol} ${b} = ?`,
      options: options.map(n => ({ emoji: String(n), label: String(n), correct: n === answer, isNumber: true }))
    };
  }

  function buildTellingTimeQuestion() {
    const hours = 1 + Math.floor(Math.random() * 12);
    const minuteOptions = [0, 15, 30, 45];
    const minutes = minuteOptions[Math.floor(Math.random() * minuteOptions.length)];
    const timeStr = minutes === 0 ? `${hours}:00` :
                    `${hours}:${minutes < 10 ? '0' + minutes : minutes}`;
    const timeWord = minutes === 0 ? `${hours} o'clock` :
                     minutes === 30 ? `half past ${hours}` :
                     minutes === 15 ? `quarter past ${hours}` :
                     `quarter to ${hours + 1 > 12 ? 1 : hours + 1}`;
    // Build wrong answers
    const wrongTimes = [];
    while (wrongTimes.length < 2) {
      const wh = 1 + Math.floor(Math.random() * 12);
      const wm = minuteOptions[Math.floor(Math.random() * minuteOptions.length)];
      const wStr = wm === 0 ? `${wh}:00` : `${wh}:${wm < 10 ? '0' + wm : wm}`;
      if (wStr !== timeStr && !wrongTimes.includes(wStr)) wrongTimes.push(wStr);
    }
    const options = shuffle([
      { emoji: '🕐', label: timeStr, correct: true },
      ...wrongTimes.map(t => ({ emoji: '🕐', label: t, correct: false }))
    ]);
    // Clock face using emoji
    const clockEmojis = ['🕛','🕐','🕑','🕒','🕓','🕔','🕕','🕖','🕗','🕘','🕙','🕚'];
    const clockEmoji = clockEmojis[hours % 12];
    return {
      type: 'telling-time',
      conceptId: 'time_' + timeStr.replace(':', '_'),
      prompt: `What time does the clock show?`,
      display: `${clockEmoji} ${timeWord}`,
      options
    };
  }

  function buildFractionsQuestion() {
    const fractions = [
      { name: 'one half',     symbol: '1/2', value: 0.5, visual: '◐' },
      { name: 'one third',    symbol: '1/3', value: 0.33, visual: '◔' },
      { name: 'two thirds',   symbol: '2/3', value: 0.67, visual: '◕' },
      { name: 'one quarter',  symbol: '1/4', value: 0.25, visual: '◔' },
      { name: 'three quarters', symbol: '3/4', value: 0.75, visual: '◕' }
    ];
    const target = fractions[Math.floor(Math.random() * fractions.length)];
    const others = shuffle(fractions.filter(f => f.symbol !== target.symbol)).slice(0, 2);
    // Visual: show a shape divided
    const totalParts = target.symbol.includes('/2') ? 2 : target.symbol.includes('/3') ? 3 : 4;
    const filledParts = parseInt(target.symbol.split('/')[0]);
    const visual = '🟧'.repeat(filledParts) + '⬜'.repeat(totalParts - filledParts) + ` out of ${totalParts} parts`;
    const options = shuffle([
      { emoji: target.visual, label: target.symbol, correct: true },
      ...others.map(f => ({ emoji: f.visual, label: f.symbol, correct: false }))
    ]);
    return {
      type: 'fractions',
      conceptId: 'fraction_' + target.symbol.replace('/', '_'),
      prompt: `What fraction is shaded?`,
      display: visual,
      options
    };
  }

  const VOWEL_TEAMS_DATA = [
    { team: 'ea', words: ['read', 'bead', 'heat', 'meat', 'beat', 'seat'], sound: 'long E' },
    { team: 'ee', words: ['tree', 'bee', 'free', 'seed', 'feet', 'keep'], sound: 'long E' },
    { team: 'ai', words: ['rain', 'tail', 'mail', 'wait', 'pain', 'sail'], sound: 'long A' },
    { team: 'oa', words: ['boat', 'coat', 'road', 'goat', 'soap', 'load'], sound: 'long O' },
    { team: 'oo', words: ['moon', 'food', 'cool', 'pool', 'zoo', 'boot'], sound: 'long OO' },
    { team: 'ou', words: ['house', 'mouse', 'out', 'loud', 'cloud', 'found'], sound: 'OW' },
    { team: 'ow', words: ['snow', 'grow', 'show', 'blow', 'flow', 'slow'], sound: 'long O' }
  ];

  function buildVowelTeamsQuestion() {
    const target = VOWEL_TEAMS_DATA[Math.floor(Math.random() * VOWEL_TEAMS_DATA.length)];
    const word = target.words[Math.floor(Math.random() * target.words.length)];
    const others = shuffle(VOWEL_TEAMS_DATA.filter(v => v.team !== target.team)).slice(0, 2);
    const options = shuffle([
      { emoji: '📖', label: target.team, correct: true },
      ...others.map(v => ({ emoji: '📖', label: v.team, correct: false }))
    ]);
    return {
      type: 'vowel-teams',
      conceptId: 'vowel_team_' + target.team,
      prompt: `What vowel team is in "${word}"?`,
      display: word.replace(target.team, `[${target.team}]`),
      options
    };
  }

  function buildMeasurementQuestion() {
    const qType = Math.floor(Math.random() * 3);
    if (qType === 0) {
      // Longer/shorter comparison
      const items = [
        { name: 'pencil', length: 6, emoji: '✏️' },
        { name: 'crayon', length: 3, emoji: '🖍️' },
        { name: 'book', length: 10, emoji: '📕' },
        { name: 'shoe', length: 9, emoji: '👟' },
        { name: 'phone', length: 5, emoji: '📱' },
        { name: 'ruler', length: 12, emoji: '📏' }
      ];
      const pair = shuffle(items).slice(0, 2);
      const longer = pair[0].length > pair[1].length ? pair[0] : pair[1];
      const options = shuffle([
        { emoji: pair[0].emoji, label: pair[0].name, correct: pair[0] === longer },
        { emoji: pair[1].emoji, label: pair[1].name, correct: pair[1] === longer }
      ]);
      return {
        type: 'measurement',
        conceptId: 'measure_longer',
        prompt: `Which is LONGER?`,
        display: `${pair[0].emoji} ${pair[0].name} (${pair[0].length} in.)  vs  ${pair[1].emoji} ${pair[1].name} (${pair[1].length} in.)`,
        options
      };
    } else if (qType === 1) {
      // Inches to feet
      const inches = [12, 24, 36][Math.floor(Math.random() * 3)];
      const feet = inches / 12;
      const others = shuffle([1, 2, 3, 4].filter(n => n !== feet)).slice(0, 2);
      const options = shuffle([feet, ...others]);
      return {
        type: 'measurement',
        conceptId: 'measure_inches_to_feet',
        prompt: `How many feet is ${inches} inches?`,
        display: `${inches} inches = ? feet  (12 inches = 1 foot)`,
        options: options.map(n => ({ emoji: String(n), label: `${n} feet`, correct: n === feet, isNumber: true }))
      };
    } else {
      // Estimate length
      const objects = [
        { name: 'your thumb', approx: 1, unit: 'inch' },
        { name: 'a banana', approx: 7, unit: 'inches' },
        { name: 'a door', approx: 7, unit: 'feet' },
        { name: 'a car', approx: 15, unit: 'feet' }
      ];
      const obj = objects[Math.floor(Math.random() * objects.length)];
      const others = [];
      while (others.length < 2) {
        const n = obj.approx + (Math.random() < 0.5 ? 1 : -1) * (2 + Math.floor(Math.random() * 5));
        if (n !== obj.approx && !others.includes(n) && n > 0) others.push(n);
      }
      const options = shuffle([obj.approx, ...others]);
      return {
        type: 'measurement',
        conceptId: 'measure_estimate',
        prompt: `About how long is ${obj.name}?`,
        options: options.map(n => ({ emoji: '📏', label: `${n} ${obj.unit}`, correct: n === obj.approx, isNumber: true }))
      };
    }
  }

  function buildEvenOddQuestion() {
    const number = 1 + Math.floor(Math.random() * 30);
    const isEven = number % 2 === 0;
    const options = shuffle([
      { emoji: '2️⃣', label: 'Even', correct: isEven },
      { emoji: '1️⃣', label: 'Odd', correct: !isEven }
    ]);
    return {
      type: 'even-odd',
      conceptId: 'even_odd_' + number,
      prompt: `Is ${number} even or odd?`,
      display: String(number),
      options
    };
  }

  function buildColorMixQuestion() {
    const mixes = [
      { a: 'Red', b: 'Yellow', result: 'orange 🟠', emoji: '🔴🟡' },
      { a: 'Red', b: 'Blue', result: 'purple 🟣', emoji: '🔴🔵' },
      { a: 'Blue', b: 'Yellow', result: 'green 🟢', emoji: '🔵🟡' }
    ];
    const mix = mixes[Math.floor(Math.random() * mixes.length)];
    const options = [
      { emoji: '🟠', label: 'Orange', correct: mix.result.includes('orange') },
      { emoji: '🟣', label: 'Purple', correct: mix.result.includes('purple') },
      { emoji: '🟢', label: 'Green',  correct: mix.result.includes('green') }
    ].sort(() => Math.random() - 0.5).slice(0, 3);

    // Make sure correct is included
    const hasCorrect = options.some(o => o.correct);
    if (!hasCorrect) {
      options[0] = { emoji: '🟠', label: 'Orange', correct: mix.result.includes('orange') };
    }

    return {
      type: 'color-mix',
      conceptId: 'color_mix',
      prompt: `${mix.a} + ${mix.b} makes...?`,
      display: mix.emoji,
      options: shuffle(options)
    };
  }

  /* ---- RENDER QUESTION ---- */
  function renderQuestion(q) {
    const promptEl = document.getElementById('question-prompt');
    if (promptEl) promptEl.textContent = q.prompt;

    const countDisplay = document.getElementById('count-display');
    if (countDisplay) {
      if (q.display) {
        countDisplay.textContent = q.display;
        countDisplay.style.display = 'block';
      } else {
        countDisplay.style.display = 'none';
      }
    }

    const area = document.getElementById('ingredients-area');
    if (!area) return;
    area.innerHTML = '';

    q.options.forEach((opt, i) => {
      const btn = createIngredientButton(opt, q.type);
      btn.dataset.correct = opt.correct ? '1' : '0';
      btn.style.animation = `badge-pop 0.3s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.09}s both`;
      btn.addEventListener('click', () => handleAnswer(btn, opt, q));
      area.appendChild(btn);
    });

    hideSallyHint();
    PotionEngine.jackTalk();

    // Jack speaks the prompt aloud
    setTimeout(() => PotionAudio.jackSpeak(q.prompt.replace('\n', '. ')), 300);
  }

  function getColorHex(label) {
    const c = COLORS.find(c => c.label === label || c.name === label.toLowerCase());
    return c ? c.hex : '#888888';
  }

  function createIngredientButton(opt, type) {
    const btn = document.createElement('button');
    switch (type) {
      case 'color': {
        btn.className = 'opt-color';
        btn.style.backgroundColor = getColorHex(opt.label);
        btn.style.borderColor = getColorHex(opt.label);
        btn.innerHTML = `<span class="opt-color-label">${opt.label}</span>`;
        break;
      }
      case 'letter':
      case 'letter-sound':
      case 'letter-sound-k':
      case 'beginning-sound': {
        btn.className = 'opt-letter';
        btn.innerHTML = `<span class="opt-letter-char">${opt.emoji}</span>`;
        break;
      }
      case 'count':
      case 'more-less':
      case 'count-dice':
      case 'number-compare':
      case 'addition':
      case 'subtraction':
      case 'skip-counting':
      case 'coins':
      case 'place-value':
      case 'two-digit-math':
      case 'even-odd': {
        btn.className = 'opt-number';
        btn.innerHTML = `<span class="opt-number-char">${opt.emoji}</span>`;
        if (opt.label && opt.label !== opt.emoji) {
          btn.innerHTML += `<span class="opt-number-label">${opt.label}</span>`;
        }
        break;
      }
      case 'shape': {
        btn.className = 'opt-shape';
        btn.dataset.shape = (opt.label || '').toLowerCase();
        btn.innerHTML = `<span class="opt-shape-icon">${opt.emoji}</span><span class="opt-shape-label">${opt.label}</span>`;
        break;
      }
      case 'sight-words':
      case 'rhyming':
      case 'beginning-blends':
      case 'vowel-teams': {
        btn.className = 'opt-word';
        btn.innerHTML = `<span class="opt-word-text">${opt.label}</span>`;
        break;
      }
      case 'telling-time':
      case 'fractions':
      case 'measurement': {
        btn.className = 'opt-word';
        btn.innerHTML = `<span class="opt-word-icon">${opt.emoji}</span><span class="opt-word-text">${opt.label}</span>`;
        break;
      }
      default: {
        btn.className = 'ingredient-btn';
        btn.innerHTML = `<span>${opt.emoji}</span><span class="ingredient-label">${opt.label}</span>`;
      }
    }
    return btn;
  }

  /* ---- ANSWER HANDLING ---- */
  function handleAnswer(btn, opt, q) {
    if (game.answered) return;
    game.answered = true;

    const timeMs = Date.now() - game.startTime;
    PotionAudio.resume();

    if (opt.correct) {
      handleCorrect(btn, q, timeMs);
    } else {
      handleWrong(btn, q, timeMs);
    }
  }

  function _ecoCategory(type) {
    const mathTypes = [
      'count-1-5','count-6-10','count-11-20','count-dice','pattern','pattern-advanced',
      'sort','more-less','size','number-compare','add-to-5','sub-from-5',
      'add-to-20','sub-from-20','addition','subtraction','skip-counting','coins',
      'place-value','two-digit-add','two-digit-sub','two-digit-math',
      'telling-time','fractions','measurement','even-odd','color-mix'
    ];
    return mathTypes.includes(type) ? 'math' : 'reading';
  }

  function handleCorrect(btn, q, timeMs) {
    btn.classList.add('correct-flash');
    PotionAudio.playCorrect();
    PotionAudio.playPickup();

    game.questionsThisPotion++;
    game.wrongCount = 0;
    game.streak++;

    PotionProgress.recordAnswer(q.conceptId, q.type, true, timeMs);
    if (typeof OTBEcosystem !== 'undefined') OTBEcosystem.recordAnswer(q.type, _ecoCategory(q.type), true, 0, 'potion-lab');
    PotionEngine.zeroHappy();
    PotionEngine.addIngredient();
    PotionAudio.jackPraise();

    if (game.streak >= 3) {
      PotionAudio.playStreak(Math.min(5, game.streak));
    }

    updateHUD();

    // Fly ingredient into cauldron
    const rect = btn.getBoundingClientRect();
    // Use the question's first option emoji or the button's visible content
    const flyEmoji = q.options.find(o => o.correct)?.emoji || btn.querySelector('span')?.textContent || '✨';
    PotionEngine.flyIngredientTo(flyEmoji, rect.left + rect.width / 2, rect.top + rect.height / 2);

    setTimeout(() => {
      if (game.questionsThisPotion >= game.questionsNeeded) {
        completePotionBrew();
      } else {
        askNextQuestion();
      }
    }, 900);
  }

  function handleWrong(btn, q, timeMs) {
    btn.classList.add('wrong-shake');
    PotionAudio.playWrong();

    game.wrongCount++;
    game.streak = 0;

    PotionProgress.recordAnswer(q.conceptId, q.type, false, timeMs);
    if (typeof OTBEcosystem !== 'undefined') OTBEcosystem.recordAnswer(q.type, _ecoCategory(q.type), false, 0, 'potion-lab');
    PotionEngine.zeroSad();
    PotionAudio.jackWrongLine();

    updateHUD();
    showWrongFeedback();

    // Sally hint after 2 wrong
    if (game.wrongCount >= 2) {
      showSallyHint(q);
      PotionEngine.jackHint();
    }

    setTimeout(() => {
      game.answered = false;
      // Highlight the correct answer gently
      document.querySelectorAll('[data-correct]').forEach(b => {
        if (b.dataset.correct === '1') b.classList.add('glow-pulse');
      });
    }, 600);
  }

  function showWrongFeedback() {
    const messages = [
      'Oops! Try again!',
      "Lock, Shock & Barrel are sneaky!",
      'Not quite! Look again!',
      "Almost! Try once more!"
    ];
    const el = document.getElementById('wrong-feedback');
    if (!el) return;
    el.querySelector('span').textContent = messages[Math.floor(Math.random() * messages.length)];
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 1500);
  }

  function showSallyHint(q) {
    const hints = {
      color: () => {
        const correct = q.options.find(o => o.correct);
        return correct ? `Look for the ${correct.label} one!` : 'Look carefully!';
      },
      shape: () => {
        const correct = q.options.find(o => o.correct);
        return correct ? `Find the ${correct.label}!` : 'Look carefully!';
      },
      count:              () => 'Count slowly, one by one!',
      letter:             () => 'Look at the shape of the letter!',
      'letter-sound':     () => 'Think of the sound it makes!',
      pattern:            () => 'What comes first, what comes second?',
      sort:               () => 'Find the one that matches the group!',
      'more-less':        () => 'Count each pile!',
      size:               () => 'Which one is bigger?',
      'color-mix':        () => 'Mix the two colors together!',
      'number-compare':   () => 'Which number is bigger? Count up!',
      'beginning-sound':  () => 'Say the word slowly. What sound comes first?',
      'rhyming':          () => 'Rhyming words sound the same at the end!',
      'addition':         () => 'Put the groups together and count!',
      'subtraction':      () => 'Start with the big number and take away!',
      'sight-words':      () => 'Look at each word carefully!',
      'beginning-blends': () => 'Say it slowly. What two letters start it?',
      'skip-counting':    () => 'Keep adding the same number each time!',
      'coins':            () => 'Remember: penny=1, nickel=5, dime=10!',
      'place-value':      () => 'The ones are on the right, tens on the left!',
      'two-digit-math':   () => 'Start with the ones place, then do the tens!',
      'telling-time':     () => 'The short hand shows the hour!',
      'fractions':        () => 'Count the colored parts out of the total!',
      'vowel-teams':      () => 'Look for two vowels working together!',
      'measurement':      () => 'Think about how long things are!',
      'even-odd':         () => 'Can you split it into two equal groups?',
    };
    const hintFn = hints[q.type] || (() => 'You can do it!');
    const hint = hintFn();

    const el = document.getElementById('sally-hint');
    const bubble = document.getElementById('sally-bubble');
    if (el && bubble) {
      bubble.textContent = `💕 ${hint}`;
      el.style.display = 'flex';
    }
  }

  function hideSallyHint() {
    const el = document.getElementById('sally-hint');
    if (el) el.style.display = 'none';
  }

  /* ---- POTION COMPLETE ---- */
  function completePotionBrew() {
    PotionEngine.eruptCauldron();
    PotionAudio.playPotionComplete();
    PotionEngine.jackCelebrate();
    PotionEngine.zeroTrick();

    const potion = game.currentPotion;
    PotionProgress.collectPotion(potion.id);
    game.sessionPotions.push(potion);
    if (typeof OTBEcosystem !== 'undefined') { OTBEcosystem.addXP(10, 'potion-lab'); OTBEcosystem.addCoins(5, 'potion-lab'); }

    const newCount = PotionProgress.getPotionCount();
    setTimeout(() => {
      showPotionComplete(potion);
      // Small delay so potion screen appears first, then unlock
      setTimeout(() => checkUnlocks(newCount), 2200);
    }, 1200);
  }

  function showPotionComplete(potion) {
    showScreen('potion');

    const icon = document.getElementById('potion-icon');
    const name = document.getElementById('potion-name');
    const count = document.getElementById('potion-complete-count');

    if (icon) icon.textContent = potion.icon;
    if (name) name.textContent = potion.name;
    if (count) count.textContent = `Potion ${PotionProgress.getPotionCount()} of ${TOTAL_POTIONS}`;

    // Jack announces the potion
    setTimeout(() => PotionAudio.jackAnnouncePotion(potion.name), 600);

    // Spawn celebration on the potion canvas
    const potionCanvas = document.getElementById('potion-canvas');
    if (potionCanvas) {
      const pCtx = potionCanvas.getContext('2d');
      potionCanvas.width = window.innerWidth;
      potionCanvas.height = window.innerHeight;
      spawnPotionCelebration(pCtx, potionCanvas.width, potionCanvas.height, potion);
    }
  }

  function spawnPotionCelebration(pCtx, W, H, potion) {
    const particles = [];
    const emojis = ['🦇', '🎃', '⭐', '🌙', '👻', potion.icon];

    for (let i = 0; i < 40; i++) {
      particles.push({
        x: W * 0.5 + (Math.random() - 0.5) * 200,
        y: H * 0.5 + (Math.random() - 0.5) * 100,
        vx: (Math.random() - 0.5) * 6,
        vy: -(Math.random() * 8 + 2),
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        size: Math.floor(Math.random() * 16 + 20),
        life: 80 + Math.random() * 40,
        maxLife: 120,
        alpha: 1
      });
    }

    function animateParticles() {
      pCtx.clearRect(0, 0, W, H);
      let alive = false;
      particles.forEach(p => {
        if (p.life <= 0) return;
        alive = true;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15;
        p.vx *= 0.98;
        p.life--;
        p.alpha = p.life / p.maxLife;
        pCtx.save();
        pCtx.globalAlpha = p.alpha;
        pCtx.font = `${p.size}px serif`;
        pCtx.textAlign = 'center';
        pCtx.fillText(p.emoji, p.x, p.y);
        pCtx.restore();
      });
      if (alive) requestAnimationFrame(animateParticles);
    }
    animateParticles();
  }

  /* ---- SESSION COMPLETE ---- */
  function showSessionComplete() {
    showScreen('session');
    const msg = document.getElementById('session-msg');
    const potions = document.getElementById('session-potions');
    const total = PotionProgress.getPotionCount();

    if (msg) msg.textContent = `You brewed ${game.sessionPotions.length} potions! (${total} total)`;

    if (potions) {
      potions.innerHTML = game.sessionPotions.map((p, i) =>
        `<span class="session-potion-badge" style="animation-delay:${i * 0.15}s">${p.icon}</span>`
      ).join('');
    }
  }

  /* ---- FINAL CELEBRATION ---- */
  function showFinalCelebration() {
    showScreen('session');
    const title = document.querySelector('.session-title');
    const msg = document.getElementById('session-msg');
    if (title) title.textContent = 'YOU DID IT!!!';
    if (msg) msg.textContent = `You brewed ALL ${TOTAL_POTIONS} potions! Jack is so proud!`;
  }

  /* ---- SHELF ---- */
  function showShelf() {
    showScreen('shelf');
    const label = document.getElementById('shelf-count-label');
    const count = PotionProgress.getPotionCount();
    if (label) label.textContent = `${count} of ${TOTAL_POTIONS} potions collected`;

    const grid = document.getElementById('shelf-grid');
    if (!grid) return;
    grid.innerHTML = POTIONS.map(p => {
      const unlocked = PotionProgress.hasPotion(p.id);
      return `<div class="shelf-potion ${unlocked ? 'unlocked' : 'locked'}" data-id="${p.id}">
        <span class="shelf-potion-icon">${p.icon}</span>
        <span class="shelf-potion-name">${unlocked ? p.name : '???'}</span>
      </div>`;
    }).join('');

    grid.querySelectorAll('.shelf-potion.unlocked').forEach(el => {
      el.addEventListener('click', () => {
        const p = POTIONS.find(p => p.id === parseInt(el.dataset.id));
        if (p) showPotionEffect(p);
      });
    });
  }

  function showPotionEffect(potion) {
    // Quick celebration flash for tapping a collected potion
    PotionAudio.playPotionComplete();
    PotionEngine.zeroTrick();
    PotionEngine.jackCelebrate();
  }

  /* ---- SETTINGS ---- */
  function openSettings() {
    const modal = document.getElementById('settings-modal');
    if (!modal) return;
    modal.style.display = 'flex';

    const s = PotionProgress.getSettings();
    const mBtn = document.getElementById('toggle-music');
    const sBtn = document.getElementById('toggle-sfx');
    const tBtn = document.getElementById('toggle-tts');
    const nameInput = document.getElementById('player-name-input');

    if (mBtn) { mBtn.dataset.on = s.music !== false ? 'true' : 'false'; mBtn.textContent = s.music !== false ? 'ON' : 'OFF'; }
    if (sBtn) { sBtn.dataset.on = s.sfx !== false ? 'true' : 'false'; sBtn.textContent = s.sfx !== false ? 'ON' : 'OFF'; }
    if (tBtn) { tBtn.dataset.on = s.tts !== false ? 'true' : 'false'; tBtn.textContent = s.tts !== false ? 'ON' : 'OFF'; }
    if (nameInput) nameInput.value = PotionProgress.getPlayerName();
  }

  function closeSettings() {
    const modal = document.getElementById('settings-modal');
    if (modal) modal.style.display = 'none';
  }

  /* ---- ROOM UNLOCKS ---- */
  const UNLOCKS = [
    // Pre-K unlocks
    {
      at: 3,
      icon: '💕',
      title: 'Sally Joins!',
      body: 'Sally will now help with hints when things get tricky. She is always gentle!',
      tts: 'Oh my, Sally is here to help!'
    },
    {
      at: 5,
      icon: '🪦',
      title: 'The Graveyard Opens!',
      body: 'A new room unlocked! Find letters on the gravestones in the Halloween graveyard.',
      tts: 'The graveyard is open! Find the letters!'
    },
    {
      at: 8,
      icon: '👻',
      title: "Zero's New Collar!",
      body: 'Zero got a glowing collar! He is extra happy to cheer you on now.',
      tts: 'Zero got a new collar! Look how it glows!'
    },
    {
      at: 10,
      icon: '🏘️',
      title: 'Halloween Town Square!',
      body: "The Town Square is open! Help fix the Halloween parade with the Mayor.",
      tts: 'Halloween Town Square is open! The Mayor needs your help!'
    },
    {
      at: 15,
      icon: '🎲',
      title: "Oogie's Lair Unlocked!",
      body: 'Oogie Boogie stole the ingredients! Beat his number game to get them back.',
      tts: "Oogie Boogie's lair is open! Can you beat his number game?"
    },
    {
      at: 18,
      icon: '🌙',
      title: "Jack's Tower!",
      body: 'The very top of Spiral Hill! Only the most magical potions are brewed up here.',
      tts: "Jack's tower is open! We made it to the very top!"
    },
    // Kindergarten unlocks
    {
      at: 24,
      icon: '🎓',
      title: 'Kindergarten Unlocked!',
      body: 'Pre-K complete! The Witching Woods await with bigger numbers and new sounds!',
      tts: 'Amazing! You finished Pre-K! Time for Kindergarten challenges!'
    },
    {
      at: 30,
      icon: '📚',
      title: 'The Haunted Library!',
      body: 'A dusty library full of spooky books! Learn rhymes and sounds!',
      tts: 'The Haunted Library is open! So many books to discover!'
    },
    {
      at: 35,
      icon: '🕰️',
      title: 'The Clocktower!',
      body: 'Gears and patterns await at the top of the tower!',
      tts: 'The Clocktower is unlocked! Master the patterns!'
    },
    // 1st Grade unlocks
    {
      at: 39,
      icon: '📚',
      title: '1st Grade Unlocked!',
      body: 'Kindergarten mastered! Enter the Forbidden Crypt for bigger math and reading!',
      tts: 'Wow! First grade is here! The Forbidden Crypt awaits!'
    },
    {
      at: 45,
      icon: '🪙',
      title: 'The Treasure Vault!',
      body: 'Gold coins and gems everywhere! Count the treasure to unlock it!',
      tts: 'The Treasure Vault is open! Count all the coins!'
    },
    {
      at: 50,
      icon: '🐉',
      title: "The Dragon's Den!",
      body: 'A fearsome dragon guards the den! Read and solve to get past!',
      tts: "The Dragon's Den is unlocked! Can you outsmart the dragon?"
    },
    // 2nd Grade unlocks
    {
      at: 54,
      icon: '🏆',
      title: '2nd Grade Unlocked!',
      body: 'You are a true potion prodigy! The Shadow Realm has the hardest challenges yet!',
      tts: 'Second grade! The Shadow Realm opens for the bravest brewers!'
    },
    {
      at: 60,
      icon: '🏔️',
      title: "The Alchemist's Peak!",
      body: 'High above Halloween Town! Tell time, measure, and split things into fractions!',
      tts: "The Alchemist's Peak is unlocked! Almost at the top!"
    },
    {
      at: 65,
      icon: '🏆',
      title: 'The Grand Hall!',
      body: 'The final room! Only the greatest potion masters reach the Grand Hall!',
      tts: 'The Grand Hall! The ultimate challenge awaits!'
    },
    {
      at: 69,
      icon: '👨‍🔬',
      title: 'POTION MASTER!',
      body: 'You brewed every single potion from Pre-K to 2nd Grade! You are a TRUE Potion Master!',
      tts: 'You did it! Every potion from Pre-K to second grade! You are the Potion Master!'
    }
  ];

  // Track which unlocks have been shown this save (stored in progress)
  function checkUnlocks(potionCount) {
    const s = PotionProgress.get();
    const shown = s.shownUnlocks || [];
    const toShow = UNLOCKS.find(u => u.at === potionCount && !shown.includes(u.at));
    if (!toShow) return;

    // Mark shown
    shown.push(toShow.at);
    s.shownUnlocks = shown;
    PotionProgress.save();

    showUnlockModal(toShow);
  }

  function showUnlockModal(unlock) {
    const modal = document.getElementById('unlock-modal');
    const icon  = document.getElementById('unlock-icon');
    const title = document.getElementById('unlock-title');
    const body  = document.getElementById('unlock-body');
    if (!modal) return;

    if (icon)  icon.textContent  = unlock.icon;
    if (title) title.textContent = unlock.title;
    if (body)  body.textContent  = unlock.body;

    modal.style.display = 'flex';
    PotionAudio.jackSpeak(unlock.tts);
    PotionEngine.jackCelebrate();
    PotionEngine.zeroTrick();
  }

  /* ---- PARENT DASHBOARD ---- */
  function showParentDashboard() {
    const modal = document.getElementById('parent-dashboard');
    if (!modal) return;
    modal.style.display = 'flex';
    renderDashboard();
  }

  function renderDashboard() {
    const s = PotionProgress.get();
    const concepts = Object.values(s.concepts || {});

    // Summary stats
    const summaryEl = document.getElementById('dash-summary');
    if (summaryEl) {
      const potions = s.potionsCollected.length;
      const correct = s.totalCorrect || 0;
      const attempts = s.totalAttempts || 0;
      const acc = attempts > 0 ? Math.round((correct / attempts) * 100) : 0;
      const mastered = concepts.filter(c => c.state === 'mastered').length;

      summaryEl.innerHTML = `
        <div class="dash-stat">
          <span class="dash-stat-value">🧪 ${potions}</span>
          <span class="dash-stat-label">Potions Brewed</span>
        </div>
        <div class="dash-stat">
          <span class="dash-stat-value">✅ ${correct}</span>
          <span class="dash-stat-label">Correct Answers</span>
        </div>
        <div class="dash-stat">
          <span class="dash-stat-value">🎯 ${acc}%</span>
          <span class="dash-stat-label">Accuracy</span>
        </div>
        <div class="dash-stat">
          <span class="dash-stat-value">⭐ ${mastered}</span>
          <span class="dash-stat-label">Concepts Mastered</span>
        </div>
      `;
    }

    // Concept breakdown by type
    const gridEl = document.getElementById('dash-grid');
    if (!gridEl) return;

    if (concepts.length === 0) {
      gridEl.innerHTML = '<p class="dash-empty">Play some rounds to see Asher\'s progress here!</p>';
      return;
    }

    const SECTIONS = [
      // Pre-K
      { key: 'color',        label: '🎨 Colors',              types: ['color', 'color-mix'] },
      { key: 'shape',        label: '🔷 Shapes',              types: ['shape'] },
      { key: 'count',        label: '🔢 Counting',            types: ['count', 'count-1-5', 'count-6-10', 'count-11-20', 'count-dice', 'more-less', 'number-compare'] },
      { key: 'letter',       label: '🔤 Letters & Sounds',    types: ['letter', 'letter-sound', 'letter-sound-k', 'beginning-sound'] },
      { key: 'pattern',      label: '🔁 Patterns',            types: ['pattern', 'sort'] },
      { key: 'size',         label: '📏 Size',                types: ['size'] },
      // Kindergarten
      { key: 'addition',     label: '➕ Addition',             types: ['addition'] },
      { key: 'subtraction',  label: '➖ Subtraction',          types: ['subtraction'] },
      { key: 'rhyming',      label: '🎵 Rhyming',             types: ['rhyming'] },
      // 1st Grade
      { key: 'sight-words',  label: '📖 Sight Words',         types: ['sight-words'] },
      { key: 'blends',       label: '🔗 Blends',              types: ['beginning-blends'] },
      { key: 'skip-count',   label: '🔢 Skip Counting',       types: ['skip-counting'] },
      { key: 'coins',        label: '🪙 Coins',               types: ['coins'] },
      { key: 'place-value',  label: '🏠 Place Value',          types: ['place-value'] },
      // 2nd Grade
      { key: '2-digit',      label: '🔢 2-Digit Math',        types: ['two-digit-math'] },
      { key: 'time',         label: '🕐 Telling Time',         types: ['telling-time'] },
      { key: 'fractions',    label: '🍕 Fractions',            types: ['fractions'] },
      { key: 'vowel-teams',  label: '📚 Vowel Teams',          types: ['vowel-teams'] },
      { key: 'measurement',  label: '📏 Measurement',          types: ['measurement'] },
      { key: 'even-odd',     label: '🔢 Even & Odd',           types: ['even-odd'] },
    ];

    let html = '';
    SECTIONS.forEach(section => {
      const sectionConcepts = concepts.filter(c => section.types.includes(c.type));
      if (sectionConcepts.length === 0) return;

      html += `<div class="dash-section-title">${section.label}</div>`;
      sectionConcepts.sort((a, b) => {
        const order = { mastered: 0, familiar: 1, learning: 2, new: 3, relearning: 2 };
        return (order[a.state] || 3) - (order[b.state] || 3);
      }).forEach(c => {
        const acc = c.attempts > 0 ? Math.round((c.correct / c.attempts) * 100) : 0;
        const state = c.state === 'relearning' ? 'learning' : (c.state || 'new');
        const label = c.id.replace(/_/g, ' ').replace(/^(color|shape|letter|count|sort|pattern|size)\s*/i, '');
        const displayName = label.charAt(0).toUpperCase() + label.slice(1);
        html += `
          <div class="dash-concept-row">
            <span class="dash-concept-name">${displayName}</span>
            <div class="dash-bar-wrap">
              <div class="dash-bar-fill ${state}" style="width:${acc}%"></div>
            </div>
            <span class="dash-concept-badge ${state}">${state}</span>
          </div>
        `;
      });
    });

    gridEl.innerHTML = html || '<p class="dash-empty">No concept data yet.</p>';
  }

  function closeParentDashboard() {
    const modal = document.getElementById('parent-dashboard');
    if (modal) modal.style.display = 'none';
  }

  /* ---- PARENTAL GATE ---- */
  let gateCallback = null;
  let gateA = 0, gateB = 0;

  function openParentalGate(callback) {
    gateCallback = callback;
    gateA = 2 + Math.floor(Math.random() * 8);
    gateB = 2 + Math.floor(Math.random() * 8);
    const q = document.getElementById('gate-question');
    if (q) q.textContent = `What is ${gateA} + ${gateB}?`;
    const ans = document.getElementById('gate-answer');
    if (ans) ans.value = '';
    const gate = document.getElementById('parental-gate');
    if (gate) gate.style.display = 'flex';
  }

  function closeParentalGate() {
    const gate = document.getElementById('parental-gate');
    if (gate) gate.style.display = 'none';
    gateCallback = null;
  }

  /* ---- EVENTS ---- */
  function initEvents() {
    // Menu
    on('btn-play', 'click', () => startGame());
    on('btn-settings-menu', 'click', () => openSettings());
    on('btn-dashboard', 'click', () => openParentalGate(() => showParentDashboard()));
    on('btn-dash-close', 'click', () => closeParentDashboard());
    on('btn-unlock-close', 'click', () => {
      const modal = document.getElementById('unlock-modal');
      if (modal) modal.style.display = 'none';
    });

    // Game HUD
    on('btn-menu', 'click', () => openParentalGate(() => showMenu()));
    on('btn-settings-game', 'click', () => openSettings());

    // Potion complete
    on('btn-next-potion', 'click', () => {
      const nextId = PotionProgress.getNextPotionId();
      if (nextId) {
        startNextPotion();
      } else {
        showFinalCelebration();
      }
    });

    // Session complete
    on('btn-keep-going', 'click', () => startGame());
    on('btn-session-menu', 'click', () => showMenu());

    // Shelf back
    on('btn-shelf-back', 'click', () => showMenu());

    // Settings save
    on('btn-settings-save', 'click', () => {
      const mBtn = document.getElementById('toggle-music');
      const sBtn = document.getElementById('toggle-sfx');
      const tBtn = document.getElementById('toggle-tts');
      const nameInput = document.getElementById('player-name-input');
      const musicOn = mBtn?.dataset.on === 'true';
      const sfxOn = sBtn?.dataset.on === 'true';
      const ttsOn = tBtn?.dataset.on === 'true';
      const name = nameInput?.value?.trim() || 'Asher';

      PotionProgress.saveSettings({ music: musicOn, sfx: sfxOn, tts: ttsOn });
      PotionProgress.setPlayerName(name);
      PotionAudio.setMusic(musicOn);
      PotionAudio.setSfx(sfxOn);
      PotionAudio.setTts(ttsOn);
      closeSettings();
    });
    on('btn-settings-close', 'click', () => closeSettings());

    // Toggle buttons
    ['toggle-music', 'toggle-sfx', 'toggle-tts'].forEach(id => {
      on(id, 'click', () => {
        const btn = document.getElementById(id);
        if (!btn) return;
        const on = btn.dataset.on === 'true';
        btn.dataset.on = on ? 'false' : 'true';
        btn.textContent = on ? 'OFF' : 'ON';
      });
    });

    // Reset
    on('btn-reset', 'click', () => {
      if (confirm('Reset ALL progress? This cannot be undone.')) {
        PotionProgress.reset();
        closeSettings();
        showMenu();
      }
    });

    // Parental gate
    on('btn-gate-submit', 'click', () => {
      const ans = parseInt(document.getElementById('gate-answer')?.value || '0');
      if (ans === gateA + gateB) {
        const cb = gateCallback;  // capture before closeParentalGate nulls it
        closeParentalGate();
        if (cb) cb();
      } else {
        const q = document.getElementById('gate-question');
        if (q) q.textContent = `Nope! Try again: ${gateA} + ${gateB} = ?`;
      }
    });
    on('btn-gate-cancel', 'click', () => closeParentalGate());

    // Keyboard gate
    document.getElementById('gate-answer')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') document.getElementById('btn-gate-submit')?.click();
    });

    // Start music + prime TTS on first touch
    document.addEventListener('touchstart', () => { PotionAudio.resume(); primeVoices(); }, { once: true });
    document.addEventListener('click', () => { PotionAudio.resume(); primeVoices(); }, { once: true });
  }

  function startNextPotion() {
    const nextId = PotionProgress.getNextPotionId();
    if (!nextId) { showFinalCelebration(); return; }
    game.currentPotion = POTIONS.find(p => p.id === nextId);
    game.questionsThisPotion = 0;
    game.questionsNeeded = 3 + Math.floor(Math.random() * 2);
    game.wrongCount = 0;

    // Update room background/music when room changes
    const roomIdx = (game.currentPotion.room || 1) - 1;
    PotionEngine.setRoom(roomIdx % 5); // cycle through 5 visual themes
    PotionAudio.setRoomMusic(roomIdx % 5);

    showScreen('game');
    PotionEngine.resetCauldron(game.questionsNeeded);
    updateHUD();
    setTimeout(() => askNextQuestion(), 400);
  }

  function on(id, event, handler) {
    const el = document.getElementById(id);
    if (el) el.addEventListener(event, handler);
  }

})();
