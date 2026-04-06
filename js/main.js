/* Jack's Potion Lab — Main Controller v1.0
   Screens: splash → menu → game → potion-complete → session-complete
   Question types: color, shape, count-1-5, letter, letter-sound, pattern, sort, count-6-10, more-less, size
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
    showScreen('menu');
    renderMenuShelf();
    const name = PotionProgress.getPlayerName();
    const el = document.getElementById('menu-player');
    if (el) el.textContent = `Hi, ${name}!`;
    const pc = document.getElementById('menu-potions-count');
    if (pc) pc.textContent = PotionProgress.getPotionCount();
    PotionAudio.startMusic();
  }

  function renderMenuShelf() {
    const shelf = document.getElementById('menu-shelf');
    if (!shelf) return;
    const collected = PotionProgress.get().potionsCollected;
    shelf.innerHTML = POTIONS.slice(0, 12).map(p => {
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

    showScreen('game');
    PotionEngine.resetCauldron(game.questionsNeeded);
    updateHUD();
    PotionEngine.jackTalk();

    setTimeout(() => askNextQuestion(), 600);
  }

  function updateHUD() {
    const potionCount = PotionProgress.getPotionCount();
    const hud = document.getElementById('hud-potion-count');
    if (hud) hud.textContent = `${potionCount} / 24`;

    const title = document.getElementById('hud-title');
    if (title && game.currentPotion) title.textContent = game.currentPotion.name;

    const streak = document.getElementById('hud-streak');
    if (streak) {
      const s = game.streak;
      streak.textContent = s >= 3 ? `🔥 ${s}` : s >= 1 ? `⭐ ${s}` : '';
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
      case 'count-dice':      return buildDiceQuestion();
      case 'more-less':       return buildMoreLessQuestion();
      case 'size':            return buildSizeQuestion();
      case 'letter':          return buildLetterQuestion();
      case 'letter-sound':    return buildLetterSoundQuestion();
      case 'pattern':         return buildPatternQuestion();
      case 'sort':            return buildSortQuestion();
      case 'review':          return buildReviewQuestion();
      case 'color-mix':       return buildColorMixQuestion();
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
      case 'letter-sound': {
        btn.className = 'opt-letter';
        btn.innerHTML = `<span class="opt-letter-char">${opt.emoji}</span>`;
        break;
      }
      case 'count':
      case 'more-less':
      case 'count-dice': {
        btn.className = 'opt-number';
        btn.innerHTML = `<span class="opt-number-char">${opt.emoji}</span>`;
        break;
      }
      case 'shape': {
        btn.className = 'opt-shape';
        btn.dataset.shape = (opt.label || '').toLowerCase();
        btn.innerHTML = `<span class="opt-shape-icon">${opt.emoji}</span><span class="opt-shape-label">${opt.label}</span>`;
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

  function handleCorrect(btn, q, timeMs) {
    btn.classList.add('correct-flash');
    PotionAudio.playCorrect();
    PotionAudio.playPickup();

    game.questionsThisPotion++;
    game.wrongCount = 0;
    game.streak++;

    PotionProgress.recordAnswer(q.conceptId, q.type, true, timeMs);
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
      count:         () => 'Count slowly, one by one!',
      letter:        () => 'Look at the shape of the letter!',
      'letter-sound':() => 'Think of the sound it makes!',
      pattern:       () => 'What comes first, what comes second?',
      sort:          () => 'Find the one that matches the group!',
      'more-less':   () => 'Count each pile!',
      size:          () => 'Which one is bigger?',
      'color-mix':   () => 'Mix the two colors together!',
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
    if (count) count.textContent = `Potion ${PotionProgress.getPotionCount()} of 24`;

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
    if (msg) msg.textContent = 'You brewed ALL 24 potions! Jack is so proud!';
  }

  /* ---- SHELF ---- */
  function showShelf() {
    showScreen('shelf');
    const label = document.getElementById('shelf-count-label');
    const count = PotionProgress.getPotionCount();
    if (label) label.textContent = `${count} of 24 potions collected`;

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
    {
      at: 24,
      icon: '✨',
      title: 'All Potions Collected!',
      body: 'You brewed every single potion in Halloween Town! Jack is SO proud of you!',
      tts: 'You did it! Every potion is brewed! Jack is so proud!'
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
      { key: 'color',        label: '🎨 Colors',      types: ['color', 'color-mix'] },
      { key: 'shape',        label: '🔷 Shapes',      types: ['shape'] },
      { key: 'count',        label: '🔢 Counting',    types: ['count', 'count-1-5', 'count-6-10', 'count-dice', 'more-less'] },
      { key: 'letter',       label: '🔤 Letters',     types: ['letter', 'letter-sound'] },
      { key: 'pattern',      label: '🔁 Patterns',    types: ['pattern', 'sort'] },
      { key: 'size',         label: '📏 Size',        types: ['size'] },
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
