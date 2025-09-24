import { initializeApp, getRank, renderPhoenix, showModal, closeModal, updateCoinCount, ranks } from './shared.js';

document.addEventListener('DOMContentLoaded', () => {
    let state = {};
    let timerInterval;

    const elements = {
        // Timer elements
        timerDays: document.getElementById('timer-days'),
        timerHours: document.getElementById('timer-hours'),
        timerMinutes: document.getElementById('timer-minutes'),
        timerSeconds: document.getElementById('timer-seconds'),
        
        // Display elements
        rankName: document.getElementById('rank-name'),
        rankStory: document.getElementById('rank-story'),
        phoenixDisplay: document.getElementById('phoenix-display'),
        longestStreak: document.getElementById('longest-streak'),
        currentCoins: document.getElementById('current-coins'),
        rankLevel: document.getElementById('rank-level'),
        
        // Progress elements
        progressSection: document.getElementById('progress-section'),
        progressBar: document.getElementById('progress-bar'),
        progressText: document.getElementById('progress-text'),
        
        // Action buttons
        urgeButton: document.getElementById('urge-button'),
        relapseButton: document.getElementById('relapse-button'),
        
        // Login elements
        passwordInput: document.getElementById('password-input'),
        loginButton: document.getElementById('login-button'),
        loginError: document.getElementById('login-error'),
    };

    // Initialize app with proper error handling
    initializeApp(data => {
        if (data) {
            state = data;
            updateUI();
            startTimer();
            setupEventListeners();
        } else {
            console.error('No data received from initializeApp');
        }
    }).catch(error => {
        console.error('InitializeApp failed:', error);
    });

    function setupEventListeners() {
        // Login event listeners
        if (elements.loginButton) {
            elements.loginButton.addEventListener('click', attemptLogin);
        }
        
        if (elements.passwordInput) {
            elements.passwordInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') attemptLogin();
            });
        }

        // Action button listeners
        if (elements.urgeButton) {
            elements.urgeButton.addEventListener('click', handleUrge);
        }

        if (elements.relapseButton) {
            elements.relapseButton.addEventListener('click', handleRelapseClick);
        }
    }

    function updateUI() {
        try {
            if (!state || !state.lastRelapse) return;

            const totalHours = (Date.now() - new Date(state.lastRelapse).getTime()) / (1000 * 60 * 60);
            const currentRank = getRank(totalHours);

            // Update rank display with null checks
            if (elements.rankName) elements.rankName.textContent = currentRank.name;
            if (elements.rankStory) elements.rankStory.textContent = currentRank.storyline;
            if (elements.phoenixDisplay) {
                elements.phoenixDisplay.innerHTML = renderPhoenix(currentRank.level, state.equipped_upgrades || {});
            }

            // Update stats with null checks
            if (elements.longestStreak) {
                elements.longestStreak.textContent = formatStreak(state.longestStreak / 1000);
            }
            if (elements.rankLevel) {
                elements.rankLevel.textContent = `${currentRank.level + 1}`;
            }

            // Update progress to next rank
            updateProgress(totalHours, currentRank);

            // Update coins display
            updateCoinsDisplay();
        } catch (error) {
            console.error('Error in updateUI:', error);
        }
    }

    function updateProgress(totalHours, currentRank) {
        if (!elements.progressText || !elements.progressBar) return;

        try {
            const nextRank = ranks[currentRank.level + 1];
            
            if (!nextRank) {
                // Max level reached
                elements.progressText.textContent = 'Maximum Level Achieved!';
                elements.progressBar.style.width = '100%';
                elements.progressBar.classList.add('animate-pulse');
                return;
            }

            const hoursToNext = nextRank.hours - currentRank.hours;
            const currentProgress = totalHours - currentRank.hours;
            const progressPercent = Math.max(0, Math.min(100, (currentProgress / hoursToNext) * 100));
            
            const remainingHours = Math.max(0, nextRank.hours - totalHours);
            
            elements.progressText.textContent = `${Math.floor(remainingHours)}h to ${nextRank.name}`;
            elements.progressBar.style.width = `${progressPercent}%`;
        } catch (error) {
            console.error('Error in updateProgress:', error);
        }
    }

    function updateCoinsDisplay() {
        if (!elements.currentCoins || !state.lastRelapse) return;

        try {
            const totalHours = (Date.now() - new Date(state.lastRelapse).getTime()) / (1000 * 60 * 60);
            const streakCoins = Math.floor(10 * Math.pow(totalHours > 0 ? totalHours : 0, 1.2));
            const totalCoins = (state.coinsAtLastRelapse || 0) + streakCoins;
            
            // Animate coin count
            animateNumber(elements.currentCoins, totalCoins);
        } catch (error) {
            console.error('Error in updateCoinsDisplay:', error);
        }
    }

    function animateNumber(element, targetValue) {
        if (!element) return;

        try {
            // Fixed regex issue
            const currentValue = parseInt(element.textContent.replace(/[^d]/g, '')) || 0;
            const difference = targetValue - currentValue;
            
            if (difference === 0) return;

            const steps = 20;
            const stepValue = difference / steps;
            const stepTime = 50;

            let currentStep = 0;
            const timer = setInterval(() => {
                currentStep++;
                const newValue = Math.round(currentValue + (stepValue * currentStep));
                element.textContent = newValue.toLocaleString();

                if (currentStep >= steps) {
                    element.textContent = targetValue.toLocaleString();
                    clearInterval(timer);
                }
            }, stepTime);
        } catch (error) {
            console.error('Error in animateNumber:', error);
            element.textContent = targetValue.toLocaleString();
        }
    }

    function startTimer() {
        if (timerInterval) clearInterval(timerInterval);
        if (!state || !state.lastRelapse) return;

        timerInterval = setInterval(() => {
            try {
                const diff = Date.now() - new Date(state.lastRelapse).getTime();
                if (diff < 0) return;

                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);

                // Update timer displays with animation
                updateTimerElement(elements.timerDays, days);
                updateTimerElement(elements.timerHours, hours);
                updateTimerElement(elements.timerMinutes, minutes);
                updateTimerElement(elements.timerSeconds, seconds);

                // Update coins and progress
                updateCoinsDisplay();
                updateProgress(diff / (1000 * 60 * 60), getRank(diff / (1000 * 60 * 60)));
            } catch (error) {
                console.error('Error in timer:', error);
            }
        }, 1000);
    }

    function updateTimerElement(element, value) {
        if (!element) return;

        try {
            const formattedValue = String(value).padStart(2, '0');
            if (element.textContent !== formattedValue) {
                element.style.transform = 'scale(1.1)';
                element.textContent = formattedValue;
                setTimeout(() => {
                    element.style.transform = 'scale(1)';
                }, 200);
            }
        } catch (error) {
            console.error('Error updating timer element:', error);
        }
    }

    function formatStreak(seconds) {
        if (!seconds || seconds < 0) return "0d 0h";
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        return `${days}d ${hours}h`;
    }

    async function attemptLogin() {
        if (!elements.loginButton || !elements.passwordInput || !elements.loginError) return;

        elements.loginError.textContent = '';
        elements.loginButton.textContent = 'Entering...';
        elements.loginButton.disabled = true;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: elements.passwordInput.value }),
            });

            if (response.ok) {
                window.location.reload();
            } else {
                elements.loginError.textContent = 'Incorrect password.';
            }
        } catch (error) {
            console.error('Login error:', error);
            elements.loginError.textContent = 'Connection error. Please try again.';
        } finally {
            elements.loginButton.textContent = 'Enter Journey';
            elements.loginButton.disabled = false;
        }
    }

    function handleUrge() {
        const tasks = [
            "Take 10 deep breaths and focus on your goals.",
            "Do 20 push-ups to redirect your energy.",
            "Step outside for 5 minutes of fresh air.",
            "Drink a full glass of cold water mindfully.",
            "Write down 3 reasons why you started this journey.",
            "Listen to your favorite motivational song.",
            "Call or message a trusted friend.",
            "Do a 2-minute meditation or mindfulness exercise."
        ];
        
        const randomTask = tasks[Math.floor(Math.random() * tasks.length)];
        
        showModal('Moment of Strength', `
            <div class="text-center">
                <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                </div>
                <h3 class="text-xl font-semibold mb-4">Channel Your Energy</h3>
                <div class="bg-blue-900 bg-opacity-30 border border-blue-500 rounded-lg p-4 mb-4">
                    <p class="text-lg">${randomTask}</p>
                </div>
                <p class="text-gray-300 text-sm">You have the strength to overcome this moment.</p>
            </div>
        `);
    }

    function handleRelapseClick() {
        showModal('Confirm Journey Reset', `
            <div class="text-center">
                <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center">
                    <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>
                <h3 class="text-xl font-semibold mb-4">Are you sure?</h3>
                <p class="text-gray-300 mb-6">This will reset your current streak and archive your phoenix. This action cannot be undone.</p>
                <div class="flex gap-4 justify-center">
                    <button onclick="closeModal()" class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors">
                        Cancel
                    </button>
                    <button onclick="handleRelapse()" class="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-2 rounded-lg transition-all">
                        Reset Journey
                    </button>
                </div>
            </div>
        `, { showClose: false });
    }

    async function handleRelapse() {
        try {
            const response = await fetch('/api/relapse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                showModal('Phoenix Reborn', `
                    <div class="text-center">
                        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                            <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clip-rule="evenodd"></path>
                            </svg>
                        </div>
                        <h3 class="text-xl font-semibold mb-2">Your phoenix has been archived.</h3>
                        <p class="text-gray-300 mb-4">A new journey begins. Rise stronger from the ashes.</p>
                        <button onclick="closeModal(); window.location.reload();" class="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-2 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all">
                            Begin Anew
                        </button>
                    </div>
                `);
            } else {
                showModal('Error', 'Failed to process relapse. Please try again.');
            }
        } catch (error) {
            console.error('Relapse error:', error);
            showModal('Error', 'Failed to process relapse. Please try again.');
        }
    }

    // Make handleRelapse available globally for the modal
    window.handleRelapse = handleRelapse;
});