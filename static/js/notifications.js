// Enhanced notification system with modern features
let notificationCount = 0;
let notifications = [];
let notificationUpdateInterval = null;

// Modern Modal System
class ModernModal {
  constructor() {
    this.activeModals = [];
  }

  // Show a modern modal with various types
  show(options = {}) {
    const {
      type = 'info',
      title = 'Information',
      message = '',
      icon = null,
      buttons = [{ text: 'OK', type: 'primary', action: () => this.close() }],
      closeOnBackdrop = true,
      closeOnEscape = true,
      customClass = ''
    } = options;

    const modal = document.createElement('div');
    modal.className = `modern-modal ${customClass}`;
    
    const iconClass = icon || this.getDefaultIcon(type);
    
    modal.innerHTML = `
      <div class="modern-modal-content">
        <button class="modern-modal-close" onclick="modernModal.close(this)">
          <i class="fa-solid fa-xmark"></i>
        </button>
        <div class="modern-modal-header">
          <div class="modern-modal-icon ${type}">
            <i class="fa-solid ${iconClass}"></i>
          </div>
          <h2 class="modern-modal-title">${title}</h2>
        </div>
        <div class="modern-modal-body">
          ${message}
        </div>
        <div class="modern-modal-footer">
          ${buttons.map((btn, index) => 
            `<button class="modern-modal-btn ${btn.type || 'secondary'}" 
                     onclick="modernModal.handleButtonClick(${index}, this)" 
                     data-action="${btn.action || ''}">
              ${btn.icon ? `<i class="fa-solid ${btn.icon}"></i>` : ''}
              ${btn.text}
             </button>`
          ).join('')}
        </div>
      </div>
    `;

    // Store button actions
    modal._buttonActions = buttons.map(btn => btn.action || (() => this.close()));

    // Event listeners
    if (closeOnBackdrop) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.close(modal);
        }
      });
    }

    if (closeOnEscape) {
      const escapeHandler = (e) => {
        if (e.key === 'Escape') {
          this.close(modal);
          document.removeEventListener('keydown', escapeHandler);
        }
      };
      document.addEventListener('keydown', escapeHandler);
      modal._escapeHandler = escapeHandler;
    }

    document.body.appendChild(modal);
    this.activeModals.push(modal);

    // Focus first button
    setTimeout(() => {
      const firstBtn = modal.querySelector('.modern-modal-btn');
      if (firstBtn) firstBtn.focus();
    }, 100);

    return modal;
  }

  // Handle button clicks
  handleButtonClick(buttonIndex, buttonElement) {
    const modal = buttonElement.closest('.modern-modal');
    const action = modal._buttonActions[buttonIndex];
    
    if (typeof action === 'function') {
      action();
    }
    
    this.close(modal);
  }

  // Close modal
  close(modal = null) {
    if (!modal) {
      modal = this.activeModals[this.activeModals.length - 1];
    }
    
    if (modal) {
      // Remove escape handler
      if (modal._escapeHandler) {
        document.removeEventListener('keydown', modal._escapeHandler);
      }

      // Animate out
      modal.style.animation = 'fadeInModal 0.2s ease-in reverse';
      const content = modal.querySelector('.modern-modal-content');
      if (content) {
        content.style.animation = 'slideInModal 0.2s ease-in reverse';
      }

      setTimeout(() => {
        if (modal.parentElement) {
          modal.remove();
        }
        this.activeModals = this.activeModals.filter(m => m !== modal);
      }, 200);
    }
  }

  // Get default icon for modal type
  getDefaultIcon(type) {
    const icons = {
      'success': 'fa-check-circle',
      'error': 'fa-exclamation-triangle',
      'warning': 'fa-exclamation-triangle',
      'info': 'fa-info-circle',
      'question': 'fa-question-circle'
    };
    return icons[type] || 'fa-info-circle';
  }

  // Convenience methods
  alert(message, title = 'Alert') {
    return this.show({
      type: 'info',
      title,
      message,
      buttons: [{ text: 'OK', type: 'primary' }]
    });
  }

  confirm(message, title = 'Confirm') {
    return new Promise((resolve) => {
      this.show({
        type: 'question',
        title,
        message,
        buttons: [
          { text: 'Cancel', type: 'secondary', action: () => resolve(false) },
          { text: 'Confirm', type: 'primary', action: () => resolve(true) }
        ]
      });
    });
  }

  success(message, title = 'Success') {
    return this.show({
      type: 'success',
      title,
      message,
      buttons: [{ text: 'OK', type: 'success' }]
    });
  }

  error(message, title = 'Error') {
    return this.show({
      type: 'error',
      title,
      message,
      buttons: [{ text: 'OK', type: 'danger' }]
    });
  }

  warning(message, title = 'Warning') {
    return this.show({
      type: 'warning',
      title,
      message,
      buttons: [{ text: 'OK', type: 'primary' }]
    });
  }
}

// Global modal instance
const modernModal = new ModernModal();

// Fetch notifications from server
function fetchNotifications() {
  const loadingElement = document.getElementById('notification-loading');
  const emptyElement = document.getElementById('notification-empty');
  const itemsContainer = document.getElementById('notification-items');
  const clearAllBtn = document.getElementById('clear-all-notifications');
  
  // Show loading state
  if (loadingElement) loadingElement.style.display = 'flex';
  if (emptyElement) emptyElement.style.display = 'none';
  
  fetch('/get_notifications')
    .then(response => response.json())
    .then(data => {
      // Hide loading state
      if (loadingElement) loadingElement.style.display = 'none';
      
      notifications = data.notifications || [];
      
      if (notifications.length > 0) {
        renderNotifications(notifications);
        if (clearAllBtn) clearAllBtn.style.display = 'block';
        if (emptyElement) emptyElement.style.display = 'none';
      } else {
        if (itemsContainer) itemsContainer.innerHTML = '';
        if (emptyElement) emptyElement.style.display = 'flex';
        if (clearAllBtn) clearAllBtn.style.display = 'none';
      }
      
      updateNotificationBadge(notifications.length);
    })
    .catch(err => {
      console.error('Failed to fetch notifications:', err);
      if (loadingElement) loadingElement.style.display = 'none';
      if (emptyElement) emptyElement.style.display = 'flex';
      modernModal.error('Network error while loading notifications', 'Connection Error');
    });
}

// Render notifications with enhanced styling
function renderNotifications(notificationList) {
  const container = document.getElementById('notification-items');
  if (!container) return;
  
  container.innerHTML = '';
  
  // Render in reverse order (Newest first)
  for (let i = notificationList.length - 1; i >= 0; i--) {
    const notificationElement = createNotificationElement(notificationList[i], i);
    container.appendChild(notificationElement);
  }
}

// Create modern notification element
function createNotificationElement(notification, index) {
  const element = document.createElement('div');
  element.className = 'notification-item';
  element.setAttribute('tabindex', '0');
  element.setAttribute('role', 'listitem');
  element.setAttribute('data-index', index);
  
  // Determine notification type and styling
  const { type, icon, message } = parseNotificationContent(notification);
  element.classList.add(`notification-${type}`);
  
  // Check if this is a priority notification
  if (type === 'danger' || message.includes('SOS') || message.includes('Emergency')) {
    element.classList.add('priority-high');
  }
  
  element.innerHTML = `
    <i class="fa-solid ${icon}"></i>
    <div class="notification-text">
      <div>${message}</div>
    </div>
    <button class="notification-remove" onclick="showRemoveConfirmation(${index})" title="Remove this notification">
      <i class="fa-solid fa-times"></i>
    </button>
  `;
  
  // Add click event for interaction (excluding remove button)
  element.addEventListener('click', (e) => {
    if (!e.target.closest('.notification-remove')) {
      element.style.transform = 'scale(0.98)';
      setTimeout(() => {
        element.style.transform = '';
      }, 150);
    }
  });
  
  return element;
}

// Parse notification content to determine type and icon
function parseNotificationContent(notification) {
  const message = notification.toString().toLowerCase();
  
  if (message.includes('success') || message.includes('complete') || message.includes('check')) {
    return { type: 'success', icon: 'fa-check-circle', message: notification };
  } else if (message.includes('sos') || message.includes('emergency') || message.includes('help')) {
    return { type: 'danger', icon: 'fa-triangle-exclamation', message: notification };
  } else if (message.includes('warning') || message.includes('attention') || message.includes('caution')) {
    return { type: 'warning', icon: 'fa-exclamation-triangle', message: notification };
  } else {
    return { type: 'info', icon: 'fa-info-circle', message: notification };
  }
}

// Simple time ago simulation
function getTimeAgo(index) {
  const timeOptions = ['Just now', '1 minute ago', '2 minutes ago', '5 minutes ago', '10 minutes ago'];
  return timeOptions[Math.min(index, timeOptions.length - 1)];
}

// Update notification badge
function updateNotificationBadge(count) {
  const badge = document.getElementById('notification-badge');
  const btn = document.getElementById('notification-btn');
  
  notificationCount = count;
  
  if (badge && btn) {
    if (count > 0) {
      badge.textContent = count > 99 ? '99+' : count.toString();
      badge.style.display = 'flex';
      btn.classList.add('has-notifications');
    } else {
      badge.style.display = 'none';
      btn.classList.remove('has-notifications');
    }
  }
}

// Clear all notifications with backend integration
function clearAllNotifications() {
  if (notifications.length === 0) {
    modernModal.alert('No notifications to clear', 'Info');
    return;
  }
  
  modernModal.show({
    type: 'warning',
    title: 'Clear All Notifications',
    message: `Are you sure you want to permanently clear all ${notifications.length} notifications? This action cannot be undone.`,
    buttons: [
      { 
        text: 'Cancel', 
        type: 'secondary',
        action: () => {} // Just closes the modal
      },
      { 
        text: 'Clear All', 
        type: 'danger', 
        icon: 'fa-trash',
        action: () => performClearAllNotifications()
      }
    ]
  });
}

// Perform the actual clear all operation
function performClearAllNotifications() {
  // Call backend to clear all notifications
  fetch('/clear_notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    }
  })
  .then(response => response.json())
  .then(data => {
    if (data.status === 'success') {
      notifications = [];
      renderNotifications([]);
      updateNotificationBadge(0);
      
      const emptyElement = document.getElementById('notification-empty');
      const clearAllBtn = document.getElementById('clear-all-notifications');
      
      if (emptyElement) emptyElement.style.display = 'flex';
      if (clearAllBtn) clearAllBtn.style.display = 'none';
      
      modernModal.success('All notifications cleared successfully', 'Success');
    } else {
      modernModal.error('Error clearing notifications: ' + data.message, 'Error');
    }
  })
  .catch(err => {
    console.error('Notification clearing error:', err);
    modernModal.error('Network error while clearing notifications', 'Network Error');
  });
}

// Enhanced notification removal with backend integration
function removeNotification(index) {
  const notificationElement = document.querySelector(`[data-index="${index}"]`);
  
  if (notificationElement) {
    // Add removing animation
    notificationElement.classList.add('removing');
    
    // Call backend to remove from log file
    fetch('/remove_notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ index: index })
    })
    .then(response => response.json())
    .then(data => {
      if (data.status === 'success') {
        // Remove from local array after animation
        setTimeout(() => {
          notifications.splice(index, 1);
          renderNotifications(notifications);
          updateNotificationBadge(notifications.length);
          
          if (notifications.length === 0) {
            const emptyElement = document.getElementById('notification-empty');
            const clearAllBtn = document.getElementById('clear-all-notifications');
            
            if (emptyElement) emptyElement.style.display = 'flex';
            if (clearAllBtn) clearAllBtn.style.display = 'none';
          }
          
          showSuccessNotification('Notification removed successfully');
        }, 400);
      } else {
        // Remove animation class if failed
        notificationElement.classList.remove('removing');
        modernModal.error('Error removing notification: ' + data.message, 'Error');
      }
    })
    .catch(err => {
      console.error('Notification removal error:', err);
      notificationElement.classList.remove('removing');
      modernModal.error('Network error while removing notification', 'Network Error');
    });
  }
}

// Show confirmation dialog for removing notification
function showRemoveConfirmation(index) {
  const notification = notifications[index];
  if (!notification) return;
  
  const { message } = parseNotificationContent(notification);
  const truncatedMessage = message.length > 50 ? message.substring(0, 50) + '...' : message;
  
  modernModal.show({
    type: 'warning',
    title: 'Remove Notification',
    message: `Are you sure you want to permanently remove notification "${truncatedMessage}"?`,
    buttons: [
      { 
        text: 'Cancel', 
        type: 'secondary',
        action: () => {} // Just closes the modal
      },
      { 
        text: 'Remove', 
        type: 'danger', 
        icon: 'fa-trash',
        action: () => removeNotification(index)
      }
    ]
  });
}

// Auto-refresh notifications
function startNotificationPolling() {
  notificationUpdateInterval = setInterval(() => {
    const pane = document.getElementById('notification-pane');
    if (!pane || pane.style.display === 'none') {
      fetchNotifications();
    }
  }, 5000);
}

// Stop notification polling
function stopNotificationPolling() {
  if (notificationUpdateInterval) {
    clearInterval(notificationUpdateInterval);
    notificationUpdateInterval = null;
  }
}

// Enhanced notification feedback system
function showSuccessNotification(message) {
  createToastNotification(message, 'success', 'fa-check-circle');
}

function showErrorNotification(message) {
  createToastNotification(message, 'error', 'fa-exclamation-triangle');
}

function showInfoNotification(message) {
  createToastNotification(message, 'info', 'fa-info-circle');
}

// Create toast notification
function createToastNotification(message, type = 'info', icon = 'fa-info-circle') {
  const toast = document.createElement('div');
  toast.className = `pwa-notification ${type} show`;
  
  const colors = {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6'
  };
  
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${colors[type] || colors.info};
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 12px;
    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05);
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-weight: 600;
    transform: translateX(100%);
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    max-width: 400px;
    backdrop-filter: blur(10px);
  `;
  
  toast.innerHTML = `
    <i class="fa-solid ${icon}"></i>
    <span>${message}</span>
    <button onclick="this.parentElement.remove()" style="
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 4px;
      transition: background 0.3s ease;
      margin-left: 0.5rem;
    ">
      <i class="fa-solid fa-times"></i>
    </button>
  `;
  
  document.body.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => {
    toast.style.transform = 'translateX(0)';
  }, 100);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 300);
  }, 5000);
}

// Enhanced visibility handling
function handleNotificationBtnVisibility() {
  const btn = document.getElementById('notification-btn');
  if (btn) {
    btn.style.display = 'flex';
  }
}

// Initialize notification system
function initializeNotificationSystem() {
  fetchNotifications();
  startNotificationPolling();
  handleNotificationBtnVisibility();
  
  window.addEventListener('resize', handleNotificationBtnVisibility);
  window.addEventListener('beforeunload', stopNotificationPolling);
  
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopNotificationPolling();
    } else {
      startNotificationPolling();
    }
  });
}

// Main notification pane toggle logic
function setupNotificationEventListeners() {
  const notificationBtn = document.getElementById('notification-btn');
  const notificationPane = document.getElementById('notification-pane');
  const closeNotification = document.getElementById('close-notification');

  if (notificationBtn && notificationPane && closeNotification) {
    notificationBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      if (notificationPane.style.display === 'none' || notificationPane.style.display === '') {
        fetchNotifications();
        notificationPane.style.display = 'block';
        setTimeout(() => {
          document.addEventListener('mousedown', outsideClickListener);
        }, 0);
      } else {
        notificationPane.style.display = 'none';
        document.removeEventListener('mousedown', outsideClickListener);
      }
    });
    
    closeNotification.addEventListener('click', function(e) {
      e.stopPropagation();
      notificationPane.classList.add('slide-out');
      setTimeout(() => {
        notificationPane.style.display = 'none';
        notificationPane.classList.remove('slide-out');
        document.removeEventListener('mousedown', outsideClickListener);
      }, 400);
    });

    function outsideClickListener(event) {
      if (!notificationPane.contains(event.target) && event.target !== notificationBtn) {
        notificationPane.classList.add('slide-out');
        setTimeout(() => {
          notificationPane.style.display = 'none';
          notificationPane.classList.remove('slide-out');
          document.removeEventListener('mousedown', outsideClickListener);
        }, 400);
      }
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  initializeNotificationSystem();
  setupNotificationEventListeners();
});