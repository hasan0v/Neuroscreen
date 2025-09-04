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
    // showNormalizationFeedback(); // Commented out system refresh notification
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

// Function to show normalization feedback
function showNormalizationFeedback() {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: linear-gradient(135deg, #6b7280, #9ca3af);
    color: white;
    padding: 1rem 2rem;
    border-radius: 12px;
    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
    z-index: 1000;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-weight: 600;
    animation: slideInFromTop 0.3s ease-out;
  `;
  
  notification.innerHTML = `
    <i class="fa-solid fa-refresh"></i>
    <span>Sistem normalleştirildi - Tüm değerler sıfırlandı</span>
  `;
  
  document.body.appendChild(notification);
  
  // Auto remove notification
  setTimeout(() => {
    notification.style.animation = 'slideOutToTop 0.3s ease-in forwards';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
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
  
  // Create temporary notification
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
  
  // Remove success class
  setTimeout(() => cell.classList.remove('success-feedback'), 500);
}

// Error feedback system
function showErrorFeedback(cell) {
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
  
  @keyframes slideInFromTop {
    from {
      transform: translate(-50%, -100%);
      opacity: 0;
    }
    to {
      transform: translate(-50%, 0);
      opacity: 1;
    }
  }
  
  @keyframes slideOutToTop {
    from {
      transform: translate(-50%, 0);
      opacity: 1;
    }
    to {
      transform: translate(-50%, -100%);
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
