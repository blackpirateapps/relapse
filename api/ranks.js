// This data is used for server-side calculations.
export const ranks = [
    { name: "Ashen Egg I", id: "egg-1", hours: 0, reward: 0, level: 0 },
    { name: "Ashen Egg II", id: "egg-2", hours: 6, reward: 50, level: 1 },
    { name: "Ashen Egg III", id: "egg-3", hours: 12, reward: 100, level: 2 },
    { name: "Fledgling Hatchling", id: "hatchling-1", hours: 24, reward: 250, level: 3 },
    { name: "Ember Glance", id: "hatchling-2", hours: 36, reward: 150, level: 4 },
    { name: "First Steps", id: "hatchling-3", hours: 48, reward: 200, level: 5 },
    { name: "Ember Chick", id: "chick-1", hours: 72, reward: 500, level: 6 },
    { name: "Warmth of Will", id: "chick-2", hours: 120, reward: 300, level: 7 },
    { name: "Flame Youngling", id: "youngling-1", hours: 168, reward: 1000, level: 8 },
    { name: "Spark of Defiance", id: "youngling-2", hours: 240, reward: 750, level: 9 },
    { name: "Sunfire Phoenix", id: "sunfire-1", hours: 336, reward: 2000, level: 10 },
    { name: "Blinding Light", id: "sunfire-2", hours: 500, reward: 1500, level: 11 },
    { name: "Blaze Guardian", id: "guardian-1", hours: 720, reward: 4000, level: 12 },
    { name: "Vigilant Stance", id: "guardian-2", hours: 1440, reward: 3000, level: 13 },
    { name: "Solar Drake", id: "drake", hours: 2160, reward: 8000, level: 14 },
    { name: "Celestial Phoenix", id: "celestial-phoenix", hours: 4320, reward: 15000, level: 15 }
];

/**
 * Calculates the user's current rank based on the total hours of their streak.
 * @param {number} totalHours - The total hours since the last relapse.
 * @returns {object} The rank object corresponding to the total hours.
 */
export function getRank(totalHours) {
    // Iterate backwards to find the highest achieved rank
    for (let i = ranks.length - 1; i >= 0; i--) {
        if (totalHours >= ranks[i].hours) {
            return ranks[i];
        }
    }
    return ranks[0]; // Default to the first rank if something goes wrong
}