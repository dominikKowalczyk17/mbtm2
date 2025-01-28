import Events from '../utils/Events';
import { delegate } from '../utils/helpers';

class ShareDialog {
  constructor() {
    // Create dialog only once when class is instantiated
    this.dialogEl = null;
    this.isActive = false;

    // Bind methods
    this.handleShare = this.handleShare.bind(this);
    this.hide = this.hide.bind(this);
    this.show = this.show.bind(this);

    // Initialize
    this.createDialog();
    this.bindEvents();
  }

  createDialog() {
    if (this.dialogEl) return;

    this.dialogEl = document.createElement('div');
    this.dialogEl.className = 'share-dialog';
    this.dialogEl.innerHTML = `
      <div class="share-dialog__overlay"></div>
      <div class="share-dialog__content">
        <header class="share-dialog__header">
          <h2 class="share-dialog__title">Udostępnij</h2>
        </header>
        <div class="share-dialog__options">
          <button type="button" class="share-dialog__option" data-platform="facebook">
            <span class="share-dialog__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
              </svg>
            </span>
            <span class="share-dialog__label">Facebook</span>
          </button>
          <button type="button" class="share-dialog__option" data-platform="twitter">
            <span class="share-dialog__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
              </svg>
            </span>
            <span class="share-dialog__label">Twitter</span>
          </button>
          <button type="button" class="share-dialog__option" data-platform="messenger">
            <span class="share-dialog__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
              </svg>
            </span>
            <span class="share-dialog__label">Messenger</span>
          </button>
          <button type="button" class="share-dialog__option" data-platform="whatsapp">
            <span class="share-dialog__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
              </svg>
            </span>
            <span class="share-dialog__label">WhatsApp</span>
          </button>
        </div>
        <button type="button" class="share-dialog__cancel">Anuluj</button>
      </div>
    `;

    document.body.appendChild(this.dialogEl);
  }

  matches = (el) => {
    return el.matches && el.matches('.button__share');
  };

  handleOutsideClick = (event) => {
    // Check if click is outside dialog content
    const dialogContent = this.dialogEl.querySelector('.share-dialog__content');
    if (!dialogContent.contains(event.target)) {
      this.hide();
    }
  };

  bindEvents() {
    // Share button clicks
    Events.on(
      document.body,
      'click',
      delegate(this.matches, (event) => {
        event.preventDefault();
        this.show();
      })
    );

    // Close on overlay click and outside clicks
    Events.on(this.dialogEl, 'click', this.handleOutsideClick);

    // Close on cancel button
    const cancel = this.dialogEl.querySelector('.share-dialog__cancel');
    Events.on(cancel, 'click', this.hide);

    // Share options
    const handleOptionClick = delegate('.share-dialog__option', (event) => {
      const platform = event.delegateTarget.dataset.platform;
      this.handleShare(platform);
    });
    Events.on(this.dialogEl, 'click', handleOptionClick);
  }

  show() {
    if (this.isActive) return;
    this.isActive = true;
    this.dialogEl.classList.add('is--active');
    document.body.style.overflow = 'hidden';

    // Add outside click handler when dialog is shown
    Events.on(this.dialogEl, 'click', this.handleOutsideClick);
  }

  hide() {
    if (!this.isActive) return;
    this.isActive = false;
    this.dialogEl.classList.remove('is--active');
    document.body.style.overflow = '';

    // Remove outside click handler when dialog is hidden
    Events.off(this.dialogEl, 'click', this.handleOutsideClick);
  }

  handleShare(platform) {
    // Mock share data
    const shareData = {
      title: 'Must be the music: Raper Miuosh za jurorskim stołem',
      text: 'Sprawdź najnowsze wiadomości z Must Be The Music!',
      url: window.location.href,
    };

    // Check for native sharing support
    if (navigator.share) {
      navigator
        .share(shareData)
        .then(() => {
          this.hide();
        })
        .catch(() => {
          this.fallbackShare(platform, shareData);
        });
    } else {
      this.fallbackShare(platform, shareData);
    }
  }

  fallbackShare(platform, shareData) {
    const platformUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.text)}&url=${encodeURIComponent(shareData.url)}`,
      messenger: `fb-messenger://share/?link=${encodeURIComponent(shareData.url)}`,
      whatsapp: `whatsapp://send?text=${encodeURIComponent(shareData.text + ' ' + shareData.url)}`,
    };

    if (platformUrls[platform]) {
      window.open(platformUrls[platform], '_blank');
    }

    this.hide();
  }
}

export default ShareDialog;
