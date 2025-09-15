// Universal Modern Modal System
// This file provides a global modal system that replaces all alert(), confirm(), and custom dialogs

// Override native alert and confirm functions
window.originalAlert = window.alert;
window.originalConfirm = window.confirm;

// Global modal instance (will be initialized when DOM is ready)
let globalModal = null;

// Modern Modal Class
class UniversalModal {
  constructor() {
    this.activeModals = [];
    this.zIndexBase = 10000;
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
      customClass = '',
      size = 'medium' // small, medium, large
    } = options;

    const modal = document.createElement('div');
    modal.className = `modern-modal ${customClass}`;
    modal.style.zIndex = this.zIndexBase + this.activeModals.length;
    
    const iconClass = icon || this.getDefaultIcon(type);
    const sizeClass = `modal-${size}`;
    
    modal.innerHTML = `
      <div class="modern-modal-content ${sizeClass}">
        <button class="modern-modal-close" onclick="globalModal.close(this)">
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
                     onclick="globalModal.handleButtonClick(${index}, this)" 
                     data-action="${btn.action || ''}">
              ${btn.icon ? `<i class="fa-solid ${btn.icon}"></i>` : ''}
              ${btn.text}
             </button>`
          ).join('')}
        </div>
      </div>
    `;

    // Store button actions and options
    modal._buttonActions = buttons.map(btn => btn.action || (() => this.close()));
    modal._options = options;

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
        if (e.key === 'Escape' && this.activeModals[this.activeModals.length - 1] === modal) {
          this.close(modal);
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
      'question': 'fa-question-circle',
      'danger': 'fa-triangle-exclamation'
    };
    return icons[type] || 'fa-info-circle';
  }

  // Convenience methods
  alert(message, title = 'Alert', type = 'info') {
    return this.show({
      type,
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
          { text: 'OK', type: 'primary', action: () => resolve(true) }
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

  info(message, title = 'Information') {
    return this.show({
      type: 'info',
      title,
      message,
      buttons: [{ text: 'OK', type: 'primary' }]
    });
  }

  // Custom confirmation with Turkish text
  confirmTurkish(message, title = 'Onay') {
    return new Promise((resolve) => {
      this.show({
        type: 'question',
        title,
        message,
        buttons: [
          { text: 'İptal', type: 'secondary', action: () => resolve(false) },
          { text: 'Tamam', type: 'primary', action: () => resolve(true) }
        ]
      });
    });
  }

  // Show loading modal
  loading(message = 'Yükleniyor...', title = 'İşlem Devam Ediyor') {
    const modal = this.show({
      type: 'info',
      title,
      message: `
        <div style="display: flex; align-items: center; gap: 1rem;">
          <div class="loading-spinner" style="
            width: 24px; 
            height: 24px; 
            border: 3px solid #f3f3f3; 
            border-top: 3px solid var(--primary-color); 
            border-radius: 50%; 
            animation: spin 1s linear infinite;
          "></div>
          <span>${message}</span>
        </div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      `,
      buttons: [],
      closeOnBackdrop: false,
      closeOnEscape: false
    });

    return {
      close: () => this.close(modal),
      update: (newMessage) => {
        const body = modal.querySelector('.modern-modal-body span');
        if (body) body.textContent = newMessage;
      }
    };
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  globalModal = new UniversalModal();
  
  // Override native functions
  window.alert = function(message) {
    return globalModal.alert(message);
  };
  
  window.confirm = function(message) {
    return globalModal.confirmTurkish(message);
  };
  
  // Make modal available globally
  window.modernModal = globalModal;
  window.modal = globalModal; // Shorter alias
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UniversalModal;
}