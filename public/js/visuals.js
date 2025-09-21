// Data for ranks, used in both progression and visual rendering.
export const ranks = [
    { name: "Ashen Egg", hours: 0 },
    { name: "Fledgling Hatchling", hours: 24 },
    { name: "Ember Chick", hours: 72 },
    { name: "Flame Youngling", hours: 168 },
    { name: "Sunfire Phoenix", hours: 336 },
    { name: "Blaze Guardian", hours: 720 },
    { name: "Solar Drake", hours: 2160 },
    { name: "Celestial Phoenix", hours: 4320 }
];

// Helper functions to determine colors based on upgrades.
const flameColor = (upgrades) => upgrades.celestialFlames ? '#3B82F6' : '#F59E0B';
const secondaryFlameColor = (upgrades) => upgrades.celestialFlames ? '#60A5FA' : '#DC2626';
const celestialPrimaryColor = (upgrades) => upgrades.celestialFlames ? '#6D28D9' : '#9333EA';

// A dictionary mapping each rank level to its SVG visual.
// Each visual is a function that takes 'upgrades' to dynamically change its appearance.
export const visuals = {
    0: { name: 'Ashen Egg', svg: (upgrades) => {
        const eggColor = upgrades.celestialFlames ? '#a0b3c4' : '#d1c7b7'; // bluish-gray or normal gray
        const speckleColor = upgrades.celestialFlames ? '#8093a4' : '#a89d8d';
        return `
        <svg viewBox="0 0 200 200">
            <g class="${upgrades.aura ? 'phoenix-pulse' : ''}">
                <path d="M100,20 C140,20 170,70 170,120 C170,180 130,190 100,190 C70,190 30,180 30,120 C30,70 60,20 100,20 Z" fill="${eggColor}" />
                <circle cx="90" cy="90" r="3" fill="${speckleColor}" />
                <circle cx="120" cy="110" r="2" fill="${speckleColor}" />
                <circle cx="100" cy="150" r="4" fill="${speckleColor}" />
                <circle cx="75" cy="125" r="2.5" fill="${speckleColor}" />
            </g>
        </svg>`;
      }},
    1: { name: 'Fledgling Hatchling', svg: (upgrades) => `<svg viewBox="0 0 200 200"><g class="${upgrades.aura ? 'phoenix-pulse' : ''}"><path fill="${flameColor(upgrades)}" d="M100 20c-20 0-40 10-50 30-10 20-10 50 0 70 10 20 30 30 50 30s40-10 50-30c10-20 10-50 0-70-10-20-30-30-50-30zm0 10c15 0 30 8 40 25 8 17 8 43 0 60-10 15-25 25-40 25s-30-10-40-25c-8-17-8-43 0-60 10-17 25-25 40-25z M100 60 a 5 5 0 0 1 0 10 a 5 5 0 0 1 0 -10 M70 80 a 5 5 0 0 1 0 10 a 5 5 0 0 1 0 -10 M130 80 a 5 5 0 0 1 0 10 a 5 5 0 0 1 0 -10 M100 100 q -20 20 0 40 q 20 -20 0 -40"></path></g></svg>` },
    2: { name: 'Ember Chick', svg: (upgrades) => `<svg viewBox="0 0 200 200"><g class="${upgrades.aura ? 'phoenix-pulse' : ''}"><path fill="${flameColor(upgrades)}" d="M100 20 C60 20 40 60 40 100 C40 140 60 180 100 180 C140 180 160 140 160 100 C160 60 140 20 100 20 Z M100 50 C110 50 110 60 100 60 C90 60 90 50 100 50 Z M80 80 C85 80 85 85 80 85 C75 85 75 80 80 80 Z M120 80 C125 80 125 85 120 85 C115 85 115 80 120 80 Z M100 100 C120 100 130 130 100 150 C70 130 80 100 100 100 Z"></path></g></svg>` },
    3: { name: 'Flame Youngling', svg: (upgrades) => `<svg viewBox="0 0 200 200"><g class="${upgrades.aura ? 'phoenix-pulse' : ''}"><path fill="${secondaryFlameColor(upgrades)}" d="M100 10 C 50 10, 50 80, 100 130 C 150 80, 150 10, 100 10 M100 120 C 80 150, 120 150, 100 190 C 80 150, 120 150, 100 120"></path><path fill="${flameColor(upgrades)}" d="M100 30 C 70 30, 70 80, 100 110 C 130 80, 130 30, 100 30"></path></g></svg>` },
    4: { name: 'Sunfire Phoenix', svg: (upgrades) => `<svg viewBox="0 0 200 200"><g class="${upgrades.aura ? 'phoenix-pulse' : ''}"><path class="phoenix-fire" fill="${flameColor(upgrades)}" d="M28.6,115.3c-2.4,5.4-3.5,11.3-3.5,17.5c0,29.3,23.7,53,53,53s53-23.7,53-53c0-6.2-1.1-12.1-3.5-17.5c-3.1,10-10.9,17.5-20.7,17.5c-12,0-21.7-9.7-21.7-21.7c0-6.4,2.8-12.2,7.2-16.1c-4.8-1.5-10-2.3-15.3-2.3C70.7,75,46.1,98.7,46.1,128c0-9.8,7.9-17.7,17.7-17.7C54,110.3,41.2,107.2,28.6,115.3z"/><path class="phoenix-fire" fill="${secondaryFlameColor(upgrades)}" d="M100,5C72.4,5,50,27.4,50,55s22.4,50,50,50s50-22.4,50-50S127.6,5,100,5z M100,85c-16.6,0-30-13.4-30-30s13.4-30,30-30s30,13.4,30,30S116.6,85,100,85z"/></g></svg>` },
    5: { name: 'Blaze Guardian', svg: (upgrades) => `<svg viewBox="0 0 200 200"><g class="phoenix-fire ${upgrades.aura ? 'phoenix-pulse' : ''}"><path fill="${secondaryFlameColor(upgrades)}" d="M100,10c-30,0-55,25-55,55s25,55,55,55s55-25,55-55S130,10,100,10z M100,100c-19.3,0-35-15.7-35-35s15.7-35,35-35s35,15.7,35,35S119.3,100,100,100z"/><path fill="${flameColor(upgrades)}" d="M100,120c-40,0-70,40-20,70c50,30,50-30,20-70z"/></g></svg>` },
    6: { name: 'Solar Drake', svg: (upgrades) => `<svg viewBox="0 0 200 200"><g class="phoenix-fire ${upgrades.aura ? 'phoenix-pulse' : ''}"><path fill="${flameColor(upgrades)}" d="M 98.5,10.2 C 54.4,21.5 35.2,69.5 54.7,109.1 C 65.5,131.2 92.2,143.4 116.8,138.3 C 141.4,133.2 161.4,113.1 166.5,88.5 C 172.5,59.8 153.3,-1.1 98.5,10.2 z"/><path fill="${secondaryFlameColor(upgrades)}" d="M 100,140 C 50,140 40,190 100,190 C 160,190 150,140 100,140 z"/></g></svg>` },
    7: { name: 'Celestial Phoenix', svg: (upgrades) => `<svg viewBox="0 0 200 200"><g class="phoenix-fire ${upgrades.aura ? 'phoenix-pulse' : ''}"><path fill="${celestialPrimaryColor(upgrades)}" d="M100 5C50 5 10 50 10 100c0 50 40 95 90 95s90-45 90-95C190 50 150 5 100 5zm0 170c-41.4 0-75-33.6-75-75S58.6 25 100 25s75 33.6 75 75-33.6 75-75 75z"/><path fill="${flameColor(upgrades)}" d="M100 60c-22.1 0-40 17.9-40 40s17.9 40 40 40 40-17.9 40-40-17.9-40-40-40z"/></g></svg>` }
};