// Enhanced health-focused interaction system
const cells = document.querySelectorAll('.cell');
let activeTimer = null;
let activeCell = null;
let inactivityTimer = null;
let lastInteractionTime = Date.now();

// Health categories mapping for better user feedback
const healthCategories = {
  'first': { name: 'Su', icon: 'fa-glass-water', message: 'Su içme zamanı etkinleştirildi!' },
  'second': { name: 'Klima', icon: 'fa-snowflake', message: 'Klima ayarlaması etkinleştirildi!' },
  'third': { name: 'Tuvalet', icon: 'fa-toilet', message: 'Tuvalet ihtiyacı kaydedildi!' },
  'fifth': { name: 'SOS', icon: 'fa-triangle-exclamation', message: 'Acil yardım sinyali gönderildi!' }
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
    console.log('Veri normalleştirildi (sıfırlandı):', result);
  })
  .catch(err => {
    console.error('Normalizasyon hatası:', err);
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

// Enhanced visual feedback system
function createRippleEffect(element, x, y) {
  const ripple = document.createElement('div');
  ripple.style.cssText = `
    position: absolute;
    width: 20px;
    height: 20px;
    background: rgba(37, 99, 235, 0.3);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
    animation: ripple 0.6s linear;
    left: ${x}px;
    top: ${y}px;
  `;
  
  element.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
}

// Add ripple animation to CSS
if (!document.getElementById('ripple-styles')) {
  const style = document.createElement('style');
  style.id = 'ripple-styles';
  style.textContent = `
    @keyframes ripple {
      to {
        transform: translate(-50%, -50%) scale(4);
        opacity: 0;
      }
    }
    
    .cell-activating {
      animation: pulse-glow 5s ease-in-out;
    }
    
    @keyframes pulse-glow {
      0%, 100% { box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
      50% { box-shadow: 0 0 20px rgba(37, 99, 235, 0.5); }
    }
    
    .success-feedback {
      animation: success-pulse 0.5s ease-out;
    }
    
    @keyframes success-pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
  `;
  document.head.appendChild(style);
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
    
    // Create ripple effect at interaction point
    if (event.type === 'mouseenter') {
      const rect = cell.getBoundingClientRect();
      createRippleEffect(cell, event.clientX - rect.left, event.clientY - rect.top);
    }
    
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
        console.log('Sağlık kategorisi etkinleştirildi:', result);
        showSuccessFeedback(cell, category);
        // Reset inactivity timer after successful activation
        resetInactivityTimer();
      })
      .catch(err => {
        console.error('Hata oluştu:', err);
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
    showErrorNotification('Bağlantı hatası oluştu. Tekrar deneyin.');
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
      <span>Bağlantı hatası oluştu. Tekrar deneyin.</span>
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

// EEG Graph Auto-Refresh System
class EEGGraphManager {
  constructor() {
    this.refreshInterval = 1000; // Refresh every 1 second for real-time feel
    this.isRefreshing = false;
    this.refreshTimer = null;
    this.initializeGraphs();
  }

  initializeGraphs() {
    const eegDisplays = document.querySelectorAll('.eeg-display img');
    
    console.log(`Found ${eegDisplays.length} EEG display elements`);
    
    if (eegDisplays.length === 0) {
      console.warn('EEG display elements not found - retrying in 1 second');
      setTimeout(() => this.initializeGraphs(), 1000);
      return;
    }

    // Add loading states and better event handling
    eegDisplays.forEach((img, index) => {
      img.style.transition = 'opacity 0.3s ease';
      img.style.opacity = '1'; // Start with full opacity
      
      // Remove any existing event listeners
      img.onload = null;
      img.onerror = null;
      
      // Track error count to prevent excessive error handling
      img.errorCount = 0;
      
      img.addEventListener('load', () => {
        img.style.opacity = '1';
        img.errorCount = 0; // Reset error count on successful load
        console.log(`EEG graph ${index + 1} loaded successfully`);
      });
      
      img.addEventListener('error', (e) => {
        img.errorCount = (img.errorCount || 0) + 1;
        console.error(`Failed to load EEG graph ${index + 1} (error count: ${img.errorCount}):`, e);
        
        // Only show error after multiple failures
        if (img.errorCount >= 3) {
          this.handleGraphError(img, index);
        } else {
          // Try to reload with a different timestamp
          setTimeout(() => {
            const baseUrl = index === 0 ? '/eeg_stream1' : '/eeg_stream2';
            const retryTimestamp = Date.now();
            img.src = `${baseUrl}?retry=${retryTimestamp}&attempt=${img.errorCount}`;
            console.log(`Retrying EEG graph ${index + 1}, attempt ${img.errorCount}`);
          }, 1000 * img.errorCount); // Increasing delay for retries
        }
      });
      
      // Log current src for debugging
      console.log(`EEG graph ${index + 1} initial src:`, img.src);
    });

    this.startAutoRefresh();
    console.log('EEG Graph Manager initialized - graphs will refresh every', this.refreshInterval, 'ms');
  }

  refreshGraphs() {
    if (this.isRefreshing) {
      console.log('Refresh already in progress, skipping...');
      return;
    }
    
    this.isRefreshing = true;
    const timestamp = Date.now();
    const randomSeed = Math.random().toString(36).substring(7);
    const eegDisplays = document.querySelectorAll('.eeg-display img');
    
    console.log(`Refreshing EEG graphs at ${new Date().toLocaleTimeString()} with timestamp: ${timestamp}`);
    
    eegDisplays.forEach((img, index) => {
      // Skip refresh if image is currently in error state
      if (img.errorCount >= 3) {
        console.log(`Skipping refresh for EEG graph ${index + 1} due to repeated errors`);
        return;
      }
      
      // Gentle loading effect
      img.style.opacity = '0.9';
      
      // Use simpler cache busting - the complex method might be causing issues
      const baseUrl = index === 0 ? '/eeg_stream1' : '/eeg_stream2';
      const newSrc = `${baseUrl}?t=${timestamp}`;
      
      // Direct update without clearing src first
      img.src = newSrc;
      console.log(`Updated EEG graph ${index + 1}: ${newSrc}`);
    });

    // Reset refresh flag after a reasonable delay
    setTimeout(() => {
      this.isRefreshing = false;
    }, 500);
  }

  handleGraphError(img, index) {
    console.error(`Creating error placeholder for EEG graph ${index + 1}`);
    
    // Create error placeholder
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    
    // Draw error state
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#6b7280';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('EEG bağlantı sorunu', canvas.width/2, canvas.height/2 - 20);
    ctx.fillText('Sayfa yenilenerek çözülebilir', canvas.width/2, canvas.height/2);
    ctx.fillText('Veya F12 > Console > refreshEEGGraphs()', canvas.width/2, canvas.height/2 + 20);
    
    img.src = canvas.toDataURL();
  }

  // Method to reset error states and force fresh reload
  resetErrors() {
    const eegDisplays = document.querySelectorAll('.eeg-display img');
    eegDisplays.forEach((img, index) => {
      img.errorCount = 0;
      img.style.opacity = '1';
      const baseUrl = index === 0 ? '/eeg_stream1' : '/eeg_stream2';
      img.src = `${baseUrl}?reset=${Date.now()}`;
      console.log(`Reset EEG graph ${index + 1} error state`);
    });
  }

  startAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    
    this.refreshTimer = setInterval(() => {
      this.refreshGraphs();
    }, this.refreshInterval);
  }

  stopAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  // Method to adjust refresh rate (can be called from external controls)
  setRefreshRate(intervalMs) {
    this.refreshInterval = Math.max(500, intervalMs); // Minimum 500ms
    this.stopAutoRefresh();
    this.startAutoRefresh();
    console.log('EEG refresh rate updated to', this.refreshInterval, 'ms');
  }
}

// Initialize EEG Graph Manager when DOM is ready
let eegManager = null;

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM Content Loaded - Initializing EEG Manager');
  eegManager = new EEGGraphManager();
  
  // Add global function for manual refresh (debugging)
  window.refreshEEGGraphs = () => {
    if (eegManager) {
      console.log('Manual EEG refresh triggered');
      eegManager.refreshGraphs();
    } else {
      console.error('EEG Manager not initialized');
    }
  };
  
  // Add global function to reset errors
  window.resetEEGErrors = () => {
    if (eegManager) {
      console.log('Resetting EEG errors');
      eegManager.resetErrors();
    } else {
      console.error('EEG Manager not initialized');
    }
  };
  
  // Add global function to check status
  window.checkEEGStatus = () => {
    if (eegManager) {
      const displays = document.querySelectorAll('.eeg-display img');
      console.log('EEG Status:', {
        managerExists: !!eegManager,
        refreshInterval: eegManager.refreshInterval,
        isRefreshing: eegManager.isRefreshing,
        displayCount: displays.length,
        errorCounts: Array.from(displays).map(img => img.errorCount || 0),
        displaySources: Array.from(displays).map(img => img.src.substring(0, 50) + '...')
      });
    }
  };
});

// Also try to initialize after window load as fallback
window.addEventListener('load', () => {
  if (!eegManager) {
    console.log('Window loaded - Fallback EEG Manager initialization');
    eegManager = new EEGGraphManager();
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