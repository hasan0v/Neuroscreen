// NeuroScreen PWA Installation Manager
class NeuroScreenPWA {
  constructor() {
    this.deferredPrompt = null;
    this.init();
  }

  init() {
    // Register service worker
    this.registerServiceWorker();
    
    // Handle installation prompt
    this.handleInstallPrompt();
    
    // Handle app updates
    // this.handleAppUpdates(); // Removed as it's not defined
    // Handle network status
    this.handleNetworkStatus();
    
    // Ensure standalone mode
    this.enforceStandaloneMode();
  }

  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/static/sw.js');
        console.log('NeuroScreen PWA: Service Worker registered successfully', registration);
        
        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.showUpdateNotification();
            }
          });
        });
        
      } catch (error) {
        console.error('NeuroScreen PWA: Service Worker registration failed', error);
      }
    }
  }

  handleInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('NeuroScreen PWA: Install prompt triggered');
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallButton();
    });

    window.addEventListener('appinstalled', () => {
      console.log('NeuroScreen PWA: App installed successfully');
      this.hideInstallButton();
      this.showInstallSuccessMessage();
    });
  }

  addInstallButton() {
    const installHTML = `
      <div id="pwa-install-banner" class="pwa-install-banner hidden">
        <div class="install-content">
          <div class="install-icon">
            <i class="fa-solid fa-download"></i>
          </div>
          <div class="install-text">
            <h4>NeuroScreen'i Yükle</h4>
            <p>Daha iyi deneyim için uygulamayı telefonunuza yükleyin</p>
          </div>
          <div class="install-actions">
            <button id="pwa-install-btn" class="install-btn primary">
              <i class="fa-solid fa-plus"></i>
              Yükle
            </button>
            <button id="pwa-dismiss-btn" class="install-btn secondary">
              <i class="fa-solid fa-times"></i>
              Kapat
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', installHTML);

    // Install button click handler
    document.getElementById('pwa-install-btn')?.addEventListener('click', () => {
      this.installApp();
    });

    // Dismiss button click handler
    document.getElementById('pwa-dismiss-btn')?.addEventListener('click', () => {
      this.hideInstallButton();
    });
  }

  showInstallButton() {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
      banner.classList.remove('hidden');
      setTimeout(() => banner.classList.add('visible'), 100);
    }
  }

  hideInstallButton() {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
      banner.classList.remove('visible');
      setTimeout(() => banner.classList.add('hidden'), 300);
    }
  }

  async installApp() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('NeuroScreen PWA: User accepted install');
      } else {
        console.log('NeuroScreen PWA: User dismissed install');
      }
      
      this.deferredPrompt = null;
      this.hideInstallButton();
    }
  }

  showInstallSuccessMessage() {
    this.showNotification('✅ NeuroScreen başarıyla yüklendi!', 'success');
  }

  showUpdateNotification() {
    const updateHTML = `
      <div id="pwa-update-banner" class="pwa-update-banner">
        <div class="update-content">
          <i class="fa-solid fa-sync-alt"></i>
          <span>Yeni güncelleme mevcut</span>
          <button id="pwa-update-btn" class="update-btn">Güncelle</button>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', updateHTML);

    document.getElementById('pwa-update-btn')?.addEventListener('click', () => {
      this.updateApp();
    });
  }

  updateApp() {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }

  handleNetworkStatus() {
    window.addEventListener('online', () => {
      this.showNotification('🌐 İnternet bağlantısı geri döndü', 'success');
    });

    window.addEventListener('offline', () => {
      this.showNotification('📱 Çevrimdışı modda çalışıyor', 'info');
    });
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `pwa-notification ${type}`;
    notification.innerHTML = `
      <span>${message}</span>
      <button onclick="this.parentElement.remove()">
        <i class="fa-solid fa-times"></i>
      </button>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('show');
    }, 100);

    setTimeout(() => {
      notification.remove();
    }, 4000);
  }

  // Push notification permission
  async requestNotificationPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      console.log('NeuroScreen PWA: Notification permission', permission);
      return permission === 'granted';
    }
    return false;
  }

  // Check if app is installed
  isAppInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
  }

  // Enforce standalone mode - hide browser UI
  enforceStandaloneMode() {
    // Hide address bar on mobile browsers
    if (!this.isAppInstalled()) {
      // Try to hide address bar by scrolling
      window.addEventListener('load', () => {
        setTimeout(() => {
          window.scrollTo(0, 1);
        }, 100);
      });
      
      // Hide on orientation change
      window.addEventListener('orientationchange', () => {
        setTimeout(() => {
          window.scrollTo(0, 1);
        }, 500);
      });
    }
    
    // Prevent zoom on double tap
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (event) => {
      const now = (new Date()).getTime();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    }, false);
    
    // Disable pull-to-refresh
    document.body.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        // Disable pull-to-refresh if at top of page
        if (document.body.scrollTop === 0 || document.documentElement.scrollTop === 0) {
          e.preventDefault();
        }
      }
    }, { passive: false });
    
    document.body.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        // Prevent overscroll bounce
        const touch = e.touches[0];
        if (document.body.scrollTop === 0 && touch.pageY > touch.target.offsetTop) {
          e.preventDefault();
        }
      }
    }, { passive: false });
    
    // Add body class for standalone mode
    if (this.isAppInstalled()) {
      document.body.classList.add('pwa-standalone');
    }
    
    // Detect and handle fullscreen mode
    if (window.matchMedia('(display-mode: fullscreen)').matches) {
      document.body.classList.add('pwa-fullscreen');
    }
    
    console.log('NeuroScreen PWA: Standalone mode enforced');
  }
}

// Initialize PWA when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const neuroScreenPWA = new NeuroScreenPWA();
  
  // Make it globally available
  window.neuroScreenPWA = neuroScreenPWA;
  
  console.log('NeuroScreen PWA: Initialized successfully');
});