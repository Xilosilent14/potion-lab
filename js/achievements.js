/* ============================================
   JACK'S POTION LAB — Achievements System
   15 achievements tracking potions, rooms, streaks
   ============================================ */
const PotionAchievements = (() => {
    const SAVE_KEY = 'potion_lab_achievements';

    const definitions = [
        // Getting started
        { id: 'first-potion', name: 'Apprentice Brewer', icon: '🧪', desc: 'Brew your first potion' },
        { id: 'five-potions', name: 'Potion Maker', icon: '⚗️', desc: 'Brew 5 different potions' },
        { id: 'ten-potions', name: 'Skilled Brewer', icon: '🧙', desc: 'Brew 10 different potions' },

        // Collection milestones
        { id: 'half-potions', name: 'Halfway Brewed', icon: '📖', desc: 'Collect half the potions' },
        { id: 'all-potions', name: 'Potion Master', icon: '👑', desc: 'Collect all 69 potions' },

        // Room exploration
        { id: 'room-2', name: 'Graveyard Explorer', icon: '🪦', desc: 'Unlock the Graveyard' },
        { id: 'room-3', name: 'Town Visitor', icon: '🏘️', desc: 'Reach Town Square' },
        { id: 'room-4', name: 'Brave Soul', icon: '🎲', desc: 'Enter Oogie\'s Lair' },
        { id: 'room-5', name: 'Jack\'s Tower', icon: '🗼', desc: 'Reach Jack\'s Tower' },

        // Grade milestones
        { id: 'grade-kinder', name: 'Kindergarten!', icon: '🎓', desc: 'Advance to Kindergarten' },
        { id: 'grade-1st', name: '1st Grader!', icon: '📚', desc: 'Advance to 1st Grade' },
        { id: 'grade-2nd', name: '2nd Grader!', icon: '🏆', desc: 'Advance to 2nd Grade' },

        // Accuracy
        { id: 'streak-5', name: 'Hot Cauldron', icon: '🔥', desc: 'Get 5 correct in a row' },
        { id: 'streak-10', name: 'Bubbling Genius', icon: '💫', desc: 'Get 10 correct in a row' },
        { id: 'perfect-session', name: 'Zero Spills', icon: '💯', desc: 'Brew 3 potions with no wrong answers' },

        // Daily play
        { id: 'streak-3-days', name: 'Daily Brewer', icon: '🔥', desc: 'Play 3 days in a row' },
        { id: 'streak-7-days', name: 'Week of Magic', icon: '🔥', desc: 'Play 7 days in a row' },

        // Mastery
        { id: 'correct-50', name: 'Knowledge Keeper', icon: '🧠', desc: 'Answer 50 questions correctly' }
    ];

    function _load() {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) { return []; }
    }

    function _save(earned) {
        try { localStorage.setItem(SAVE_KEY, JSON.stringify(earned)); } catch (e) {}
    }

    function _award(id) {
        const earned = _load();
        if (earned.includes(id)) return false;
        earned.push(id);
        _save(earned);
        return true;
    }

    function hasAchievement(id) {
        return _load().includes(id);
    }

    function checkAfterPotion(sessionWrongCount) {
        const newlyEarned = [];
        const prog = PotionProgress.get();
        const potionCount = prog.potionsCollected.length;

        // Potion milestones
        if (potionCount >= 1) {
            if (_award('first-potion')) newlyEarned.push(get('first-potion'));
        }
        if (potionCount >= 5) {
            if (_award('five-potions')) newlyEarned.push(get('five-potions'));
        }
        if (potionCount >= 10) {
            if (_award('ten-potions')) newlyEarned.push(get('ten-potions'));
        }
        if (potionCount >= 35) {
            if (_award('half-potions')) newlyEarned.push(get('half-potions'));
        }
        if (potionCount >= 69) {
            if (_award('all-potions')) newlyEarned.push(get('all-potions'));
        }

        // Room unlocks (rooms unlock at 5, 10, 15, 18 potions)
        if (potionCount >= 5) {
            if (_award('room-2')) newlyEarned.push(get('room-2'));
        }
        if (potionCount >= 10) {
            if (_award('room-3')) newlyEarned.push(get('room-3'));
        }
        if (potionCount >= 15) {
            if (_award('room-4')) newlyEarned.push(get('room-4'));
        }
        if (potionCount >= 18) {
            if (_award('room-5')) newlyEarned.push(get('room-5'));
        }

        // Grade milestones
        const grade = PotionProgress.getCurrentGrade();
        if (grade === 'kinder' || grade === 'grade1' || grade === 'grade2') {
            if (_award('grade-kinder')) newlyEarned.push(get('grade-kinder'));
        }
        if (grade === 'grade1' || grade === 'grade2') {
            if (_award('grade-1st')) newlyEarned.push(get('grade-1st'));
        }
        if (grade === 'grade2') {
            if (_award('grade-2nd')) newlyEarned.push(get('grade-2nd'));
        }

        // Streaks (answer streaks)
        if (prog.bestStreak >= 5) {
            if (_award('streak-5')) newlyEarned.push(get('streak-5'));
        }
        if (prog.bestStreak >= 10) {
            if (_award('streak-10')) newlyEarned.push(get('streak-10'));
        }

        // Perfect session: brewed 3+ potions with zero wrong
        if (sessionWrongCount === 0 && prog.sessionPotions >= 3) {
            if (_award('perfect-session')) newlyEarned.push(get('perfect-session'));
        }

        // Total correct
        if (prog.totalCorrect >= 50) {
            if (_award('correct-50')) newlyEarned.push(get('correct-50'));
        }

        // Daily streaks (from ecosystem)
        if (typeof OTBEcosystem !== 'undefined') {
            const profile = OTBEcosystem.getProfile();
            if (profile.dailyStreak >= 3) {
                if (_award('streak-3-days')) newlyEarned.push(get('streak-3-days'));
            }
            if (profile.dailyStreak >= 7) {
                if (_award('streak-7-days')) newlyEarned.push(get('streak-7-days'));
            }
        } else if (prog.consecutiveDays >= 3) {
            if (_award('streak-3-days')) newlyEarned.push(get('streak-3-days'));
            if (prog.consecutiveDays >= 7) {
                if (_award('streak-7-days')) newlyEarned.push(get('streak-7-days'));
            }
        }

        return newlyEarned;
    }

    function get(id) {
        return definitions.find(a => a.id === id);
    }

    function getAll() {
        const earned = _load();
        return definitions.map(a => ({
            ...a,
            earned: earned.includes(a.id)
        }));
    }

    function getEarnedCount() {
        return _load().length;
    }

    return {
        definitions,
        checkAfterPotion,
        hasAchievement,
        get,
        getAll,
        getEarnedCount
    };
})();
