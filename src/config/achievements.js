// Achievement definitions and logic

export const ACHIEVEMENTS = [
    // Getting Started
    { id: 'first_game', name: 'First Steps', emoji: '👶', desc: 'Play your first game', condition: (stats) => stats.totalGames >= 1 },
    { id: 'five_games', name: 'Getting Warmed Up', emoji: '🏃', desc: 'Play 5 games', condition: (stats) => stats.totalGames >= 5 },
    { id: 'ten_games', name: 'Regular Player', emoji: '🎮', desc: 'Play 10 games', condition: (stats) => stats.totalGames >= 10 },
    { id: 'twenty_games', name: 'Dedicated Gamer', emoji: '🏆', desc: 'Play 25 games', condition: (stats) => stats.totalGames >= 25 },

    // Accuracy
    { id: 'perfect_score', name: 'Perfection!', emoji: '⭐', desc: 'Complete a game with no mistakes', condition: (stats) => stats.hasPerfectGame },
    { id: 'high_accuracy', name: 'Sharp Shooter', emoji: '🎯', desc: 'Achieve 80%+ accuracy', condition: (stats) => stats.averageAccuracy >= 80 },

    // Streaks
    { id: 'streak_3', name: 'On Fire!', emoji: '🔥', desc: '3-day streak', condition: (stats) => stats.streak >= 3 },
    { id: 'streak_7', name: 'Week Warrior', emoji: '⚡', desc: '7-day streak', condition: (stats) => stats.streak >= 7 },
    { id: 'streak_14', name: 'Unstoppable', emoji: '💪', desc: '14-day streak', condition: (stats) => stats.streak >= 14 },
    { id: 'streak_30', name: 'Legend', emoji: '👑', desc: '30-day streak', condition: (stats) => stats.streak >= 30 },

    // Game Variety
    { id: 'all_games', name: 'Explorer', emoji: '🗺️', desc: 'Try all 4 games', condition: (stats) => stats.gamesPlayed?.length >= 4 },

    // Special
    { id: 'early_bird', name: 'Early Bird', emoji: '🌅', desc: 'Play before 8 AM', condition: (stats) => stats.playedEarly },
    { id: 'night_owl', name: 'Night Owl', emoji: '🦉', desc: 'Play after 8 PM', condition: (stats) => stats.playedLate },
];

// Check which achievements are unlocked
export function checkAchievements(stats) {
    return ACHIEVEMENTS.map(ach => ({
        ...ach,
        unlocked: ach.condition(stats)
    }));
}

// Calculate streak from game history
export function calculateStreak(sessions) {
    if (!sessions || sessions.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get unique dates played
    const playedDates = new Set();
    sessions.forEach(s => {
        const date = new Date(s.startedAt?.toDate?.() || s.startedAt);
        date.setHours(0, 0, 0, 0);
        playedDates.add(date.toDateString());
    });

    // Count consecutive days from today backwards
    let streak = 0;
    let checkDate = new Date(today);

    while (playedDates.has(checkDate.toDateString())) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
    }

    return streak;
}

// Get achievement progress
export function getAchievementProgress(stats) {
    const achievements = checkAchievements(stats);
    const unlocked = achievements.filter(a => a.unlocked).length;
    return {
        unlocked,
        total: achievements.length,
        percentage: Math.round((unlocked / achievements.length) * 100),
        achievements
    };
}
