// Enhanced health-focused interaction system
const cells = document.querySelectorAll('.cell');
let activeTimer = null;
let activeCell = null;
let inactivityTimer = null;
let lastInteractionTime = Date.now();

// Health categories mapping for better user feedback
const healthCategories = {
  'first': { name: 'Water', icon: 'fa-glass-water', message: 'Water drinking time activated!' },
  'second': { name: 'AC', icon: 'fa-snowflake', message: 'AC adjustment activated!' },
  'third': { name: 'Toilet', icon: 'fa-toilet', message: 'Toilet need recorded!' },
  'fifth': { name: 'SOS', icon: 'fa-triangle-exclamation', message: 'Emergency help signal sent!' }
};

// Function to normalize/reset data
function normalizeData() {
  const normalizedData = {
    first: 0,
    second: 0,
    third: 0,
    fifth: 0
  };

  fetch('/push_data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(normalizedData)
  })
  .then(response => response.json())
  .then(result => {
    console.log('Data normalized (reset):', result);
  })
  .catch(err => {
    console.error('Normalization error:', err);
  });
}

// Function to start/restart inactivity timer
function resetInactivityTimer() {
  lastInteractionTime = Date.now();
  
  // Clear existing timer
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
  }
  
  // Start new 5-second timer
  inactivityTimer = setTimeout(() => {
    // Only normalize if no button is currently being activated
    if (!activeTimer && !activeCell) {
      normalizeData();
    }
  }, 5000);
}

// Enhanced interaction handlers
cells.forEach((cell, index) => {
  let timer = null;
  let progressInterval = null;
  const progressBar = cell.querySelector('.progress');
  const name = cell.dataset.name;
  const category = healthCategories[name];

  const startActivation = (event) => {
    // Reset inactivity timer on any interaction
    resetInactivityTimer();
    
    // Clear any existing timer
    if (activeTimer && activeCell !== cell) {
      stopActivation(activeCell);
    }
    
    activeTimer = timer;
    activeCell = cell;
    
    let width = 0;
    progressBar.style.width = '0%';
    progressBar.style.opacity = '1';
    
    // Add visual feedback class
    cell.classList.add('cell-activating');
    
    // Update progress bar smoothly
    progressInterval = setInterval(() => {
      width += 2; // 2% every 100ms = 5 seconds total
      progressBar.style.width = width + '%';
      
      if (width >= 100) {
        clearInterval(progressInterval);
      }
    }, 100);

    timer = setTimeout(() => {
      // Activation complete - prepare data
      const data = {
        first: 0,
        second: 0,
        third: 0,
        fifth: 0
      };

      // Set the activated category
      data[name] = 1;

      // Send data to server
      fetch('/push_data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })
      .then(response => response.json())
      .then(result => {
        console.log('Health category activated:', result);
        showSuccessFeedback(cell, category);
        // Reset inactivity timer after successful activation
        resetInactivityTimer();
      })
      .catch(err => {
        console.error('Error occurred:', err);
        showErrorFeedback(cell);
      });

      // Clean up visual states
      cell.classList.remove('cell-activating');
      progressBar.style.opacity = '0';
      
    }, 5000);
  };

  const stopActivation = (targetCell = cell) => {
    // Reset inactivity timer when stopping activation
    resetInactivityTimer();
    
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (progressInterval) {
      clearInterval(progressInterval);
      progressInterval = null;
    }
    
    targetCell.classList.remove('cell-activating');
    const targetProgressBar = targetCell.querySelector('.progress');
    targetProgressBar.style.width = '0%';
    targetProgressBar.style.opacity = '0';
    
    if (activeCell === targetCell) {
      activeTimer = null;
      activeCell = null;
    }
  };

  // Event listeners for mouse and touch interactions
  cell.addEventListener('mouseenter', startActivation);
  cell.addEventListener('mouseleave', () => stopActivation());
  
  // Touch support for mobile devices
  cell.addEventListener('touchstart', (e) => {
    e.preventDefault();
    startActivation(e);
  });
  
  cell.addEventListener('touchend', () => stopActivation());
  cell.addEventListener('touchcancel', () => stopActivation());
});

// Success feedback system
function showSuccessFeedback(cell, category) {
  cell.classList.add('success-feedback');
  
  // Create temporary notification using the external notification system
  if (typeof showSuccessNotification === 'function') {
    showSuccessNotification(category.message);
  } else {
    // Fallback notification if external system isn't loaded
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 12px;
      box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
      z-index: 1000;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-weight: 600;
      animation: slideIn 0.3s ease-out;
    `;
    
    notification.innerHTML = `
      <i class="fa-solid ${category.icon}"></i>
      <span>${category.message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove notification
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-in forwards';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
  
  // Remove success class
  setTimeout(() => cell.classList.remove('success-feedback'), 500);
}

// Error feedback system
function showErrorFeedback(cell) {
  if (typeof showErrorNotification === 'function') {
    showErrorNotification('Connection error occurred. Please try again.');
  } else {
    // Fallback notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 12px;
      box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
      z-index: 1000;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-weight: 600;
      animation: slideIn 0.3s ease-out;
    `;
    
    notification.innerHTML = `
      <i class="fa-solid fa-exclamation-triangle"></i>
      <span>Connection error occurred. Please try again.</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-in forwards';
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  }
}

// Add notification animations to CSS
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(notificationStyles);

// Initialize inactivity timer on page load
resetInactivityTimer();

// Keyboard accessibility and global mouse movement detection
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && activeCell) {
    stopActivation();
  }
  // Reset inactivity timer on any keyboard activity
  resetInactivityTimer();
});

// Track mouse movement to reset inactivity timer
document.addEventListener('mousemove', () => {
  resetInactivityTimer();
});

// Track mouse clicks to reset inactivity timer
document.addEventListener('click', () => {
  resetInactivityTimer();
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  if (activeTimer) {
    stopActivation();
  }
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
  }
});

// EEG Chart Manager using Chart.js
class EEGChartManager {
  constructor() {
    this.timeChart = null;
    this.freqChart = null;
    this.refreshInterval = 250; // 250ms for smoother updates
    this.isRefreshing = false;
    this.refreshTimer = null;
    this.initCharts();
  }

  initCharts() {
    // Check if canvas elements exist
    const timeCanvas = document.getElementById('eegTimeChart');
    const freqCanvas = document.getElementById('eegFreqChart');
    
    if (!timeCanvas || !freqCanvas) {
      console.warn('EEG Chart canvases not found, retrying...');
      setTimeout(() => this.initCharts(), 1000);
      return;
    }

    // Initialize Time Domain Chart
    const timeCtx = timeCanvas.getContext('2d');
    this.timeChart = new Chart(timeCtx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'EEG Signal',
          data: [],
          borderColor: '#2563eb',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.4,
          fill: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'EEG Time Signal (Last 2 seconds)', font: { size: 16 } }
        },
        scales: {
          x: { 
            display: true, 
            title: { display: true, text: 'Time (s)' },
            ticks: { maxTicksLimit: 10 }
          },
          y: { min: -100, max: 100, title: { display: true, text: 'Amplitude (μV)' } }
        }
      }
    });

    // Initialize Frequency Domain Chart
    const freqCtx = freqCanvas.getContext('2d');
    this.freqChart = new Chart(freqCtx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Power Spectrum',
            data: [],
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            borderWidth: 2,
            pointRadius: 0,
            fill: true,
            tension: 0.4
          },
          {
            label: 'Focus',
            data: [],
            borderColor: '#ef4444', // Red
            backgroundColor: 'rgba(239, 68, 68, 0.5)',
            borderWidth: 2,
            pointRadius: 0,
            fill: true,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'EEG Power Spectrum', font: { size: 16 } }
        },
        scales: {
          x: { min: 0, max: 50, title: { display: true, text: 'Frequency (Hz)' } },
          y: { beginAtZero: true, title: { display: true, text: 'Power (μV²/Hz)' } }
        }
      }
    });

    this.startAutoRefresh();
    console.log('EEG Chart Manager initialized');
  }

  async fetchData() {
    if (this.isRefreshing) return;
    this.isRefreshing = true;
    
    try {
      const response = await fetch('/eeg_data');
      const data = await response.json();
      
      this.updateCharts(data);
    } catch (error) {
      console.error('Error fetching EEG data:', error);
    } finally {
      this.isRefreshing = false;
    }
  }

  updateCharts(data) {
    if (!data || !this.timeChart || !this.freqChart) return;

    // Check for flatline data (all zeros or constant)
    const isFlat = data.eeg_values.every(val => Math.abs(val) < 0.01);
    if (isFlat) {
        console.warn('Received flatline EEG data - check backend simulation');
    }

    // Update Time Chart
    this.timeChart.data.labels = data.time_labels.map(t => t.toFixed(2));
    this.timeChart.data.datasets[0].data = data.eeg_values;
    
    // Update Title with Active State
    if (data.active_state) {
        this.timeChart.options.plugins.title.text = `EEG Time Signal - ACTIVE: ${data.active_state}`;
        this.timeChart.options.plugins.title.color = '#ef4444';
        this.timeChart.options.plugins.title.font = { size: 18, weight: 'bold' };
    } else {
        this.timeChart.options.plugins.title.text = 'EEG Time Signal (Live Monitoring)';
        this.timeChart.options.plugins.title.color = '#666';
        this.timeChart.options.plugins.title.font = { size: 16, weight: 'normal' };
    }
    
    this.timeChart.update('none'); // 'none' mode for performance

    // Update Freq Chart
    this.freqChart.data.labels = data.freq_labels.map(f => f.toFixed(1));
    this.freqChart.data.datasets[0].data = data.power_values;

    // Update Highlight Dataset (Red part)
    const highlightData = new Array(data.power_values.length).fill(null);
    if (data.highlight) {
        const centerFreq = data.highlight.freq;
        data.freq_labels.forEach((freq, index) => {
            // Highlight range: center +/- 2Hz
            if (freq >= centerFreq - 2 && freq <= centerFreq + 2) {
                highlightData[index] = data.power_values[index];
            }
        });
        
        // Also update Freq Chart Title
        this.freqChart.options.plugins.title.text = `EEG Power Spectrum - TARGET: ${data.highlight.freq} Hz`;
        this.freqChart.options.plugins.title.color = '#ef4444';
    } else {
        this.freqChart.options.plugins.title.text = 'EEG Power Spectrum';
        this.freqChart.options.plugins.title.color = '#666';
    }
    this.freqChart.data.datasets[1].data = highlightData;

    this.freqChart.update('none');
  }

  startAutoRefresh() {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    this.refreshTimer = setInterval(() => this.fetchData(), this.refreshInterval);
  }

  stopAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
}

// Initialize EEG Chart Manager when DOM is ready
let eegManager = null;

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM Content Loaded - Initializing EEG Manager');
  eegManager = new EEGChartManager();
});

// Also try to initialize after window load as fallback
window.addEventListener('load', () => {
  if (!eegManager) {
    console.log('Window loaded - Fallback EEG Manager initialization');
    eegManager = new EEGChartManager();
  }
});

// Stop refresh when tab is not visible to save resources
document.addEventListener('visibilitychange', () => {
  if (eegManager) {
    if (document.hidden) {
      eegManager.stopAutoRefresh();
      console.log('EEG refresh paused - tab not visible');
    } else {
      eegManager.startAutoRefresh();
      console.log('EEG refresh resumed - tab visible');
    }
  }
});

// Session timer functionality
let sessionStartTime = Date.now();
function updateSessionTime() {
  const now = Date.now();
  const elapsed = Math.floor((now - sessionStartTime) / 1000);
  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;
  
  const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const sessionTimeElement = document.getElementById('session-time');
  if (sessionTimeElement) {
    sessionTimeElement.textContent = timeString;
  }
}

// Update session time every second
setInterval(updateSessionTime, 1000);