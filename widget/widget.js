/**
 * SHM Instagram Widget
 * A lightweight, embeddable Instagram feed widget
 */
(function(window) {
  'use strict';

  const SHMInstagramWidget = {
    config: {
      container: '#shm-instagram-widget',
      apiUrl: '/api/posts',
      postLimit: 12,
      showHeader: true,
      showFollowButton: true,
      instagramUsername: 'strawhutmedia',
      darkMode: false,
      onLoad: null,
      onError: null
    },

    // Instagram gradient icon SVG
    instagramIcon: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="instagram-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#f09433"/>
          <stop offset="25%" style="stop-color:#e6683c"/>
          <stop offset="50%" style="stop-color:#dc2743"/>
          <stop offset="75%" style="stop-color:#cc2366"/>
          <stop offset="100%" style="stop-color:#bc1888"/>
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="5" stroke="url(#instagram-gradient)" stroke-width="2"/>
      <circle cx="12" cy="12" r="4" stroke="url(#instagram-gradient)" stroke-width="2"/>
      <circle cx="17.5" cy="6.5" r="1.5" fill="url(#instagram-gradient)"/>
    </svg>`,

    // Video icon SVG
    videoIcon: `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <polygon points="5,3 19,12 5,21"/>
    </svg>`,

    // Carousel icon SVG
    carouselIcon: `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="15" height="15" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>
      <rect x="6" y="6" width="15" height="15" rx="2" fill="currentColor"/>
    </svg>`,

    /**
     * Initialize the widget
     * @param {Object} options - Configuration options
     */
    init: function(options) {
      // Merge options with defaults
      this.config = Object.assign({}, this.config, options);

      const container = document.querySelector(this.config.container);
      if (!container) {
        console.error('SHM Instagram Widget: Container not found:', this.config.container);
        return;
      }

      // Apply dark mode if set
      if (this.config.darkMode) {
        container.classList.add('shm-dark');
      }

      // Fetch and render posts
      this.fetchPosts(container);
    },

    /**
     * Fetch posts from the API
     * @param {HTMLElement} container - The widget container
     */
    fetchPosts: async function(container) {
      try {
        const response = await fetch(this.config.apiUrl);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch posts');
        }

        // Get username from first post if available
        if (data.posts && data.posts.length > 0 && data.posts[0].username) {
          this.config.instagramUsername = data.posts[0].username;
        }

        // Limit posts if needed
        const posts = data.posts.slice(0, this.config.postLimit);

        this.render(container, posts);

        if (typeof this.config.onLoad === 'function') {
          this.config.onLoad(posts);
        }

      } catch (error) {
        console.error('SHM Instagram Widget: Error fetching posts:', error);
        this.renderError(container, error.message);

        if (typeof this.config.onError === 'function') {
          this.config.onError(error);
        }
      }
    },

    /**
     * Render the widget
     * @param {HTMLElement} container - The widget container
     * @param {Array} posts - Array of Instagram posts
     */
    render: function(container, posts) {
      let html = '';

      // Header
      if (this.config.showHeader) {
        html += `
          <div class="shm-header">
            ${this.instagramIcon}
            <h3>@${this.config.instagramUsername}</h3>
          </div>
        `;
      }

      // Posts grid
      html += '<div class="shm-posts-grid">';

      posts.forEach(post => {
        const mediaIcon = this.getMediaIcon(post.mediaType);
        const caption = this.escapeHtml(post.caption);

        html += `
          <a href="${post.permalink}" target="_blank" rel="noopener noreferrer" class="shm-post" title="${caption}">
            <img
              src="${post.mediaUrl}"
              alt="${caption.substring(0, 100)}"
              class="loading"
              loading="lazy"
              onload="this.classList.remove('loading'); this.classList.add('loaded');"
              onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect fill=%22%23ddd%22 width=%22100%22 height=%22100%22/%3E%3C/svg%3E'"
            />
            ${mediaIcon ? `<div class="shm-media-icon">${mediaIcon}</div>` : ''}
            <div class="shm-post-overlay">
              <p class="shm-post-caption">${caption}</p>
            </div>
          </a>
        `;
      });

      html += '</div>';

      // Follow button
      if (this.config.showFollowButton) {
        html += `
          <div class="shm-follow-cta">
            <a href="https://instagram.com/${this.config.instagramUsername}"
               target="_blank"
               rel="noopener noreferrer"
               class="shm-follow-btn">
              ${this.instagramIcon}
              Follow @${this.config.instagramUsername}
            </a>
          </div>
        `;
      }

      container.innerHTML = html;
    },

    /**
     * Render error state
     * @param {HTMLElement} container - The widget container
     * @param {string} message - Error message
     */
    renderError: function(container, message) {
      container.innerHTML = `
        <div class="shm-error">
          <p>Unable to load Instagram feed</p>
          <p><small>${message}</small></p>
        </div>
      `;
    },

    /**
     * Get media type icon
     * @param {string} mediaType - The media type (IMAGE, VIDEO, CAROUSEL_ALBUM)
     * @returns {string|null} - SVG icon or null
     */
    getMediaIcon: function(mediaType) {
      switch (mediaType) {
        case 'VIDEO':
          return this.videoIcon;
        case 'CAROUSEL_ALBUM':
          return this.carouselIcon;
        default:
          return null;
      }
    },

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} - Escaped text
     */
    escapeHtml: function(text) {
      if (!text) return '';
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  };

  // Expose to global scope
  window.SHMInstagramWidget = SHMInstagramWidget;

})(window);
