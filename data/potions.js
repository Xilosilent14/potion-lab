/* Jack's Potion Lab — Potion Definitions v1.0 */
/* 24 potions across 5 rooms */

const POTIONS = [
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
  { id: 24, name: 'Master Brewer',   icon: '✨', color: '#ffd700', room: 5, shelfEffect: 'rainbow',     desc: 'A rainbow of magic!' }
];

/* Room definitions */
const ROOMS = {
  1: {
    id: 1,
    name: "Finkelstein's Lab",
    emoji: '🧪',
    unlockAt: 0,   // starts unlocked
    bgColor: '#0d0d2b',
    accentColor: '#ff7518',
    questionTypes: ['color', 'shape', 'count-1-5'],
    description: 'Brew your first potions!'
  },
  2: {
    id: 2,
    name: 'The Graveyard',
    emoji: '🪦',
    unlockAt: 5,
    bgColor: '#0a1528',
    accentColor: '#9ab8c8',
    questionTypes: ['letter', 'letter-sound'],
    description: 'Find letters on the gravestones!'
  },
  3: {
    id: 3,
    name: 'Town Square',
    emoji: '🏘️',
    unlockAt: 10,
    bgColor: '#1a0a1e',
    accentColor: '#ffd700',
    questionTypes: ['pattern', 'sort'],
    description: "Help with the Halloween parade!"
  },
  4: {
    id: 4,
    name: "Oogie's Lair",
    emoji: '🎲',
    unlockAt: 15,
    bgColor: '#0a1a0a',
    accentColor: '#39ff14',
    questionTypes: ['count-6-10', 'more-less', 'count-dice'],
    description: 'Beat Oogie at his number game!'
  },
  5: {
    id: 5,
    name: "Jack's Tower",
    emoji: '🌙',
    unlockAt: 18,
    bgColor: '#0d0d2b',
    accentColor: '#e8d5ff',
    questionTypes: ['size', 'color-mix', 'review'],
    description: 'The most magical potions!'
  }
};
