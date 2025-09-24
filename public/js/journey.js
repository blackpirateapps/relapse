import {
  initializeApp,
  getRank,
  renderPhoenix,
  showModal,
  closeModal,
  updateCoinCount,
  ranks
} from './shared.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log('Journey.js loaded');

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

  console.log('Found elements:', Object.keys(elements).filter(k => elements[k]));

  // Set up event listeners immediately
  setupEventListeners();

  // Initialize app and start API call to /api/state
  console.log('Calling initializeApp...');
  initializeApp((data) => {
    console.log('initializeApp callback; has data:', !!data);
    if (data) {
      state = data;
      updateUI();
      startTimer();
    } else {
      // Login screen is shown by initializeApp on its own
      console.log('No state returned; likely unauthenticated or API error.');
    }
  });

  function setupEventListeners() {
    console.log('Setting up event listeners...');
    if (elements.loginButton) {
      elements.loginButton.addEventListener('click', attemptLogin);
      console.log('✅ Login button listener added');
    } else {
      console.log('❌ Login button not found');
    }

    if (elements.passwordInput) {
      elements.passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') attemptLogin();
      });
      console.log('✅ Password input listener added');
    }

    if (elements.urgeButton) {
      elements.urgeButton.addEventListener('click', handleUrge);
      console.log('✅ Urge button listener added');
    }
    if (elements.relapseButton) {
      elements.relapseButton.addEventListener('click', handleRelapseClick);
      console.log('✅ Relapse button listener added');
    }
  }

  function updateUI() {
    try {
      if (!state || !state.lastRelapse) return;

      const totalHours = (Date.now() - new Date(state.lastRelapse).getTime()) / (1000 * 60 * 60);
      const currentRank = getRank(totalHours);

      // Update rank display
      if (elements.rankName) elements.rankName.textContent = currentRank.name;
      if (elements.rankStory) elements.rankStory.textContent = currentRank.storyline;
      if (elements.phoenixDisplay) {
        elements.phoenixDisplay.innerHTML = renderPhoenix(currentRank.level, state.equipped_upgrades || {});
      }

      // Stats
      if (elements.longestStreak) elements.longestStreak.textContent = formatStreak((state.longestStreak || 0) / 1000);
      if (elements.rankLevel) elements.rankLevel.textContent = `${currentRank.level + 1}`;

      // Progress and coins
      updateProgress(totalHours, currentRank);
      updateCoinsDisplay();
    } catch (err) {
      console.error('Error in updateUI:', err);
    }
  }

  function updateProgress(totalHours, currentRank) {
    if (!elements.progressText || !elements.progressBar) return;
    try {
      const nextRank = ranks[currentRank.level + 1];
      if (!nextRank) {
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
    } catch (err) {
      console.error('Error in updateProgress:', err);
    }
  }

  function updateCoinsDisplay() {
    if (!elements.currentCoins || !state.lastRelapse) return;
    try {
      const totalHours = (Date.now() - new Date(state.lastRelapse).getTime()) / (1000 * 60 * 60);
      const streakCoins = Math.floor(10 * Math.pow(totalHours > 0 ? totalHours : 0, 1.2));
      const totalCoins = (state.coinsAtLastRelapse || 0) + streakCoins;
      animateNumber(elements.currentCoins, totalCoins);
    } catch (err) {
      console.error('Error in updateCoinsDisplay:', err);
    }
  }

  function animateNumber(element, targetValue) {
    if (!element) return;
    try {
      const currentValue = parseInt(element.textContent.replace(/[^d]/g, ''), 10) || 0;
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
    } catch (err) {
      console.error('Error in animateNumber:', err);
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

        updateTimerElement(elements.timerDays, days);
        updateTimerElement(elements.timerHours, hours);
        updateTimerElement(elements.timerMinutes, minutes);
        updateTimerElement(elements.timerSeconds, seconds);

        const th = diff / (1000 * 60 * 60);
        updateCoinsDisplay();
        updateProgress(th, getRank(th));
      } catch (err) {
        console.error('Error in timer:', err);
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
        setTimeout(() => { element.style.transform = 'scale(1)'; }, 200);
      }
    } catch (err) {
      console.error('Error updating timer element:', err);
    }
  }

  function formatStreak(seconds) {
    if (!seconds || seconds < 0) return "0d 0h";
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days}d ${hours}h`;
  }

  async function attemptLogin() {
    console.log('🔑 Login attempt started');
    if (!elements.loginButton || !elements.passwordInput || !elements.loginError) {
      console.error('❌ Login elements missing');
      return;
    }
    elements.loginError.textContent = '';
    elements.loginButton.textContent = 'Entering...';
    elements.loginButton.disabled = true;

    try {
      console.log('📡 Sending login request to /api/login');
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password: elements.passwordInput.value }),
      });
      console.log('📡 Login response status:', response.status);
      if (response.ok) {
        console.log('✅ Login successful, reloading page');
        window.location.reload();
      } else {
        console.log('❌ Login failed');
        elements.loginError.textContent = 'Incorrect password.';
      }
    } catch (error) {
      console.error('❌ Login error:', error);
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
      "Do a 2-minute meditation or mindfulness exercise.",
    ];
    const randomTask = tasks[Math.floor(Math.random() * tasks.length)];
    showModal('Moment of Strength',
      `${randomTask}

You have the strength to overcome this moment.`);
  }

  function handleRelapseClick() {
    showModal(
      'Confirm Relapse',
      'This will reset your current streak and archive your phoenix.
This action cannot be undone.
A new journey begins. Rise stronger from the ashes.'
    );
  }
});