/* Jack's Potion Lab — Potion Definitions v2.0 */
/* 69 potions across 14 rooms (Pre-K through 2nd Grade) */

/* Grade levels for progression */
const GRADE_LEVELS = [
  { id: 'prek',   label: 'Pre-K',     icon: '🧪', rooms: [1,2,3,4,5],         potionRange: [1,24],  unlockAt: 0 },
  { id: 'kinder', label: 'Kindergarten', icon: '🎓', rooms: [6,7,8],           potionRange: [25,39], unlockAt: 24 },
  { id: 'grade1', label: '1st Grade',  icon: '📚', rooms: [9,10,11],           potionRange: [40,54], unlockAt: 39 },
  { id: 'grade2', label: '2nd Grade',  icon: '🏆', rooms: [12,13,14],          potionRange: [55,69], unlockAt: 54 }
];

const POTIONS = [
  // ========== PRE-K (Rooms 1-5, Potions 1-24) ==========
  // Room 1: Dr. Finkelstein's Lab (1-5)
  { id: 1, name: 'Ghost Glow',       icon: '🤍', color: '#e8e8ff', room: 1, shelfEffect: 'zero-float',   desc: 'Zero floats up high!' },
  { id: 2, name: 'Pumpkin Brew',     icon: '🎃', color: '#ff7518', room: 1, shelfEffect: 'pumpkins',     desc: 'Pumpkins bounce everywhere!' },
  { id: 3, name: 'Moonlight',        icon: '🌙', color: '#b89fd4', room: 1, shelfEffect: 'moon',         desc: 'The moon appears!' },
  { id: 4, name: 'Bat Wing',         icon: '🦇', color: '#4a0080', room: 1, shelfEffect: 'bats',         desc: 'Bats fly across!' },
  { id: 5, name: "Zero's Bone",      icon: '🦴', color: '#f5f0e0', room: 1, shelfEffect: 'zero-trick',   desc: 'Zero does a trick!' },

  // Room 2: The Graveyard (6-10)
  { id: 6,  name: 'Graveyard Mist',  icon: '💨', color: '#9ab8c8', room: 2, shelfEffect: 'mist',         desc: 'Spooky mist rolls in!' },
  { id: 7,  name: 'Bone Dust',       icon: '💀', color: '#f5f0e0', room: 2, shelfEffect: 'bones',        desc: 'Bones go flying!' },
  { id: 8,  name: 'Raven Black',     icon: '🪶', color: '#1a1a2e', room: 2, shelfEffect: 'ravens',       desc: 'Ravens take wing!' },
  { id: 9,  name: 'Stone Cold',      icon: '🪨', color: '#778899', room: 2, shelfEffect: 'sparks',       desc: 'Sparks fly off the stone!' },
  { id: 10, name: 'Midnight Ink',    icon: '🌑', color: '#0d0d2b', room: 2, shelfEffect: 'stars',        desc: 'Stars pop out!' },

  // Room 3: Halloween Town Square (11-15)
  { id: 11, name: "Mayor's Megaphone", icon: '📣', color: '#ffd700', room: 3, shelfEffect: 'mayor',      desc: 'The Mayor cheers!' },
  { id: 12, name: 'Parade Dust',     icon: '🎉', color: '#e83845', room: 3, shelfEffect: 'confetti',     desc: 'Confetti rains down!' },
  { id: 13, name: 'Witch Hazel',     icon: '🧙', color: '#8b4513', room: 3, shelfEffect: 'stars',        desc: 'Magic stars appear!' },
  { id: 14, name: 'Spider Silk',     icon: '🕷️', color: '#888',    room: 3, shelfEffect: 'webs',        desc: 'Spiderwebs shoot out!' },
  { id: 15, name: 'Lantern Flame',   icon: '🏮', color: '#ff4500', room: 3, shelfEffect: 'flames',       desc: 'Flames dance!' },

  // Room 4: Oogie Boogie's Lair (16-20)
  { id: 16, name: "Oogie's Dare",    icon: '🎲', color: '#39ff14', room: 4, shelfEffect: 'oogie',        desc: 'Oogie grumbles then cheers!' },
  { id: 17, name: 'Bug Juice',       icon: '🐛', color: '#7cfc00', room: 4, shelfEffect: 'bugs',         desc: 'Bugs go everywhere!' },
  { id: 18, name: 'Lucky Dice',      icon: '🎰', color: '#ffd700', room: 4, shelfEffect: 'dice',         desc: 'Dice roll around!' },
  { id: 19, name: 'Shadow Slime',    icon: '🟢', color: '#006400', room: 4, shelfEffect: 'slime',        desc: 'Slime bubbles up!' },
  { id: 20, name: 'Sandy Claws',     icon: '🎅', color: '#e83845', room: 4, shelfEffect: 'santa',        desc: 'Sandy Claws waves!' },

  // Room 5: Jack's Tower (21-24)
  { id: 21, name: "Sally's Patchwork", icon: '🧵', color: '#e83845', room: 5, shelfEffect: 'sally',      desc: 'Sally waves sweetly!' },
  { id: 22, name: 'Spiral Hill Dew', icon: '🌅', color: '#ff7518', room: 5, shelfEffect: 'panorama',    desc: 'Halloween Town glows!' },
  { id: 23, name: "Jack's Triumph",  icon: '🎩', color: '#e8d5ff', room: 5, shelfEffect: 'all-chars',   desc: 'Everyone celebrates!' },
  { id: 24, name: 'Master Brewer',   icon: '✨', color: '#ffd700', room: 5, shelfEffect: 'rainbow',     desc: 'A rainbow of magic!' },

  // ========== KINDERGARTEN (Rooms 6-8, Potions 25-39) ==========
  // Room 6: The Witching Woods (25-30)
  { id: 25, name: 'Fog Crawler',     icon: '🌫️', color: '#8899aa', room: 6, shelfEffect: 'mist',        desc: 'Fog creeps through the woods!' },
  { id: 26, name: 'Owl Eyes',        icon: '🦉', color: '#c8a85c', room: 6, shelfEffect: 'stars',        desc: 'Owl eyes glow in the dark!' },
  { id: 27, name: 'Toadstool Tea',   icon: '🍄', color: '#e83845', room: 6, shelfEffect: 'pumpkins',     desc: 'Mushrooms pop up everywhere!' },
  { id: 28, name: 'Howl Mist',       icon: '🐺', color: '#5c6b7a', room: 6, shelfEffect: 'moon',         desc: 'A wolf howls at the moon!' },
  { id: 29, name: 'Firefly Flask',   icon: '✨', color: '#ffd700', room: 6, shelfEffect: 'sparks',       desc: 'Fireflies light up the path!' },
  { id: 30, name: 'Thorn Brew',      icon: '🌹', color: '#cc1144', room: 6, shelfEffect: 'flames',       desc: 'Thorny vines sprout!' },

  // Room 7: The Haunted Library (31-35)
  { id: 31, name: 'Book Worm',       icon: '📖', color: '#8b4513', room: 7, shelfEffect: 'bones',        desc: 'Books fly off the shelves!' },
  { id: 32, name: 'Ink Splash',      icon: '🖋️', color: '#1a1a2e', room: 7, shelfEffect: 'ravens',      desc: 'Ink splatters everywhere!' },
  { id: 33, name: 'Candle Wax',      icon: '🕯️', color: '#f5f0e0', room: 7, shelfEffect: 'flames',     desc: 'Candles flicker to life!' },
  { id: 34, name: 'Dust Bunny',      icon: '🐰', color: '#c8b8a8', room: 7, shelfEffect: 'mist',         desc: 'Dust bunnies bounce around!' },
  { id: 35, name: 'Spell Scroll',    icon: '📜', color: '#e8d5ff', room: 7, shelfEffect: 'stars',        desc: 'Magic scrolls unroll!' },

  // Room 8: The Clocktower (36-39)
  { id: 36, name: 'Gear Grease',     icon: '⚙️', color: '#778899', room: 8, shelfEffect: 'sparks',      desc: 'Gears start spinning!' },
  { id: 37, name: 'Bell Toll',       icon: '🔔', color: '#ffd700', room: 8, shelfEffect: 'confetti',     desc: 'The bell rings out!' },
  { id: 38, name: 'Pendulum Potion', icon: '🕰️', color: '#4a0080', room: 8, shelfEffect: 'bats',       desc: 'Time swings back and forth!' },
  { id: 39, name: 'K Graduate',      icon: '🎓', color: '#39ff14', room: 8, shelfEffect: 'rainbow',     desc: 'Kindergarten complete!' },

  // ========== 1ST GRADE (Rooms 9-11, Potions 40-54) ==========
  // Room 9: The Forbidden Crypt (40-45)
  { id: 40, name: 'Crypt Dust',      icon: '⚱️', color: '#5c4a3a', room: 9,  shelfEffect: 'bones',       desc: 'Ancient dust swirls!' },
  { id: 41, name: 'Emerald Ooze',    icon: '💚', color: '#2ecc71', room: 9,  shelfEffect: 'slime',        desc: 'Green ooze bubbles up!' },
  { id: 42, name: 'Cobweb Elixir',   icon: '🕸️', color: '#c8c8c8', room: 9,  shelfEffect: 'webs',       desc: 'Cobwebs stretch everywhere!' },
  { id: 43, name: 'Coffin Nail',     icon: '🪦', color: '#4a4a5e', room: 9,  shelfEffect: 'sparks',      desc: 'Sparks shoot from the coffin!' },
  { id: 44, name: 'Soul Fire',       icon: '🔥', color: '#3498db', room: 9,  shelfEffect: 'flames',       desc: 'Blue flames dance!' },
  { id: 45, name: 'Echo Drop',       icon: '🔊', color: '#9b59b6', room: 9,  shelfEffect: 'stars',        desc: 'Echoes bounce off the walls!' },

  // Room 10: The Treasure Vault (46-50)
  { id: 46, name: 'Gold Coin',       icon: '🪙', color: '#ffd700', room: 10, shelfEffect: 'dice',         desc: 'Gold coins rain down!' },
  { id: 47, name: 'Ruby Dust',       icon: '💎', color: '#e83845', room: 10, shelfEffect: 'confetti',     desc: 'Rubies sparkle everywhere!' },
  { id: 48, name: 'Crystal Ball',    icon: '🔮', color: '#e8d5ff', room: 10, shelfEffect: 'stars',        desc: 'The crystal ball glows!' },
  { id: 49, name: 'Diamond Drip',    icon: '💠', color: '#b8d8e8', room: 10, shelfEffect: 'sparks',       desc: 'Diamonds shimmer and fall!' },
  { id: 50, name: 'Crown Jewel',     icon: '👑', color: '#ffd700', room: 10, shelfEffect: 'rainbow',      desc: 'A crown appears!' },

  // Room 11: The Dragon's Den (51-54)
  { id: 51, name: 'Dragon Scale',    icon: '🐉', color: '#2ecc71', room: 11, shelfEffect: 'flames',       desc: 'Scales shimmer with fire!' },
  { id: 52, name: 'Smoke Ring',      icon: '💨', color: '#778899', room: 11, shelfEffect: 'mist',          desc: 'Smoke rings float up!' },
  { id: 53, name: 'Flame Tongue',    icon: '👅', color: '#ff4500', room: 11, shelfEffect: 'flames',        desc: 'Flames lick the ceiling!' },
  { id: 54, name: '1st Grade Hero',  icon: '📚', color: '#e83845', room: 11, shelfEffect: 'all-chars',     desc: 'A true hero of learning!' },

  // ========== 2ND GRADE (Rooms 12-14, Potions 55-69) ==========
  // Room 12: The Shadow Realm (55-60)
  { id: 55, name: 'Shadow Cloak',    icon: '🖤', color: '#1a1a2e', room: 12, shelfEffect: 'mist',          desc: 'Shadows swirl around!' },
  { id: 56, name: 'Dark Crystal',    icon: '🔮', color: '#4a0080', room: 12, shelfEffect: 'stars',         desc: 'Dark crystals glow!' },
  { id: 57, name: 'Phantom Chill',   icon: '❄️', color: '#a8d8ea', room: 12, shelfEffect: 'sparks',       desc: 'An icy breeze blows!' },
  { id: 58, name: 'Nightmare Nectar', icon: '🌑', color: '#2c2c3e', room: 12, shelfEffect: 'bats',        desc: 'Nightmares turn to dreams!' },
  { id: 59, name: 'Void Essence',    icon: '🕳️', color: '#0d0d2b', room: 12, shelfEffect: 'ravens',      desc: 'The void opens and closes!' },
  { id: 60, name: 'Wraith Whisper',  icon: '👤', color: '#5c6b7a', room: 12, shelfEffect: 'moon',          desc: 'Whispers echo softly!' },

  // Room 13: The Alchemist's Peak (61-65)
  { id: 61, name: 'Sun Drop',        icon: '☀️', color: '#ffd700', room: 13, shelfEffect: 'stars',        desc: 'Sunlight breaks through!' },
  { id: 62, name: 'Storm Brew',      icon: '⛈️', color: '#3498db', room: 13, shelfEffect: 'sparks',      desc: 'Lightning crackles!' },
  { id: 63, name: 'Rainbow Mist',    icon: '🌈', color: '#e8d5ff', room: 13, shelfEffect: 'rainbow',      desc: 'A rainbow appears!' },
  { id: 64, name: 'Starfall',        icon: '💫', color: '#ffd700', room: 13, shelfEffect: 'stars',         desc: 'Stars rain from the sky!' },
  { id: 65, name: 'Phoenix Ash',     icon: '🦅', color: '#ff4500', room: 13, shelfEffect: 'flames',        desc: 'A phoenix rises!' },

  // Room 14: The Grand Hall (66-69)
  { id: 66, name: 'Eternal Flame',   icon: '🕯️', color: '#ff7518', room: 14, shelfEffect: 'flames',      desc: 'An eternal flame burns bright!' },
  { id: 67, name: 'Wizard Stone',    icon: '💎', color: '#9b59b6', room: 14, shelfEffect: 'all-chars',     desc: 'The wizard stone pulses!' },
  { id: 68, name: 'Grand Elixir',    icon: '🏆', color: '#ffd700', room: 14, shelfEffect: 'confetti',      desc: 'The ultimate achievement!' },
  { id: 69, name: 'Potion Master',   icon: '👨‍🔬', color: '#ffd700', room: 14, shelfEffect: 'rainbow',   desc: 'You mastered ALL the potions!' }
];

/* Total potion count */
const TOTAL_POTIONS = POTIONS.length; // 69

/* Room definitions */
const ROOMS = {
  // ========== PRE-K ==========
  1: {
    id: 1, grade: 'prek',
    name: "Finkelstein's Lab",
    emoji: '🧪',
    unlockAt: 0,
    bgColor: '#0d0d2b',
    accentColor: '#ff7518',
    questionTypes: ['color', 'shape', 'count-1-5'],
    description: 'Brew your first potions!'
  },
  2: {
    id: 2, grade: 'prek',
    name: 'The Graveyard',
    emoji: '🪦',
    unlockAt: 5,
    bgColor: '#0a1528',
    accentColor: '#9ab8c8',
    questionTypes: ['letter', 'letter-sound'],
    description: 'Find letters on the gravestones!'
  },
  3: {
    id: 3, grade: 'prek',
    name: 'Town Square',
    emoji: '🏘️',
    unlockAt: 10,
    bgColor: '#1a0a1e',
    accentColor: '#ffd700',
    questionTypes: ['pattern', 'sort'],
    description: "Help with the Halloween parade!"
  },
  4: {
    id: 4, grade: 'prek',
    name: "Oogie's Lair",
    emoji: '🎲',
    unlockAt: 15,
    bgColor: '#0a1a0a',
    accentColor: '#39ff14',
    questionTypes: ['count-6-10', 'more-less', 'count-dice'],
    description: 'Beat Oogie at his number game!'
  },
  5: {
    id: 5, grade: 'prek',
    name: "Jack's Tower",
    emoji: '🌙',
    unlockAt: 18,
    bgColor: '#0d0d2b',
    accentColor: '#e8d5ff',
    questionTypes: ['size', 'color-mix', 'review'],
    description: 'The most magical potions!'
  },

  // ========== KINDERGARTEN ==========
  6: {
    id: 6, grade: 'kinder',
    name: 'The Witching Woods',
    emoji: '🌲',
    unlockAt: 24,
    bgColor: '#0a1a0d',
    accentColor: '#2ecc71',
    questionTypes: ['count-11-20', 'add-to-5', 'sub-from-5', 'number-compare'],
    description: 'Count higher in the enchanted forest!'
  },
  7: {
    id: 7, grade: 'kinder',
    name: 'The Haunted Library',
    emoji: '📚',
    unlockAt: 30,
    bgColor: '#1a0d0a',
    accentColor: '#c8a85c',
    questionTypes: ['beginning-sound', 'rhyming', 'letter-sound-k'],
    description: 'Discover the magic of reading!'
  },
  8: {
    id: 8, grade: 'kinder',
    name: 'The Clocktower',
    emoji: '🕰️',
    unlockAt: 35,
    bgColor: '#0d0d1e',
    accentColor: '#9b59b6',
    questionTypes: ['pattern-advanced', 'count-11-20', 'add-to-5', 'number-compare'],
    description: 'Master the gears of knowledge!'
  },

  // ========== 1ST GRADE ==========
  9: {
    id: 9, grade: 'grade1',
    name: 'The Forbidden Crypt',
    emoji: '⚱️',
    unlockAt: 39,
    bgColor: '#1a0a14',
    accentColor: '#e83845',
    questionTypes: ['add-to-20', 'sub-from-20', 'sight-words'],
    description: 'Unlock ancient math secrets!'
  },
  10: {
    id: 10, grade: 'grade1',
    name: 'The Treasure Vault',
    emoji: '🪙',
    unlockAt: 45,
    bgColor: '#1a1a0a',
    accentColor: '#ffd700',
    questionTypes: ['coins', 'place-value', 'skip-counting'],
    description: 'Count the treasure!'
  },
  11: {
    id: 11, grade: 'grade1',
    name: "The Dragon's Den",
    emoji: '🐉',
    unlockAt: 50,
    bgColor: '#1a0a0a',
    accentColor: '#ff4500',
    questionTypes: ['beginning-blends', 'sight-words', 'add-to-20'],
    description: 'Read your way past the dragon!'
  },

  // ========== 2ND GRADE ==========
  12: {
    id: 12, grade: 'grade2',
    name: 'The Shadow Realm',
    emoji: '🖤',
    unlockAt: 54,
    bgColor: '#0a0a1a',
    accentColor: '#a855f7',
    questionTypes: ['two-digit-add', 'two-digit-sub', 'even-odd'],
    description: 'Master bigger numbers in the shadows!'
  },
  13: {
    id: 13, grade: 'grade2',
    name: "The Alchemist's Peak",
    emoji: '🏔️',
    unlockAt: 60,
    bgColor: '#0d1a2b',
    accentColor: '#3498db',
    questionTypes: ['telling-time', 'fractions', 'measurement'],
    description: 'Measure, time, and divide!'
  },
  14: {
    id: 14, grade: 'grade2',
    name: 'The Grand Hall',
    emoji: '🏆',
    unlockAt: 65,
    bgColor: '#1a0d2b',
    accentColor: '#ffd700',
    questionTypes: ['vowel-teams', 'two-digit-add', 'telling-time', 'review-advanced'],
    description: 'The final challenge awaits!'
  }
};
