/**
 * contentScript.js - Main content script that runs on web pages
 * Detects and analyzes comments and profiles for AI/troll behavior
 */

class TrollDetector {
  constructor() {
    this.analyzer = new ProfileAnalyzer();
    this.sentimentAnalyzer = new SentimentAnalyzer();
    this.utils = TextAnalysisUtils;

    this.platformDetector = this.detectPlatform();
    this.analyzedElements = new WeakSet();
    this.analyzedContent = new Map(); // Content hash -> analysis result for deduplication
    this.analysisResults = {
      comments: [],
      profiles: [],
      overallStats: {}
    };

    this.settings = {
      autoAnalyze: true,
      showIndicators: true,
      showCleanIndicators: true,  // Show green shields for clean content
      flagThreshold: 0.5
    };

    this.isAnalyzing = false; // Prevent concurrent analyses
    this.analysisTimeout = null;

    this.init();
  }

  /**
   * Initialize the detector
   */
  async init() {
    // Load settings from storage
    await this.loadSettings();

    console.log('[AI and Troll Detector] Initialized on platform:', this.platformDetector.platform);

    // Start analyzing if auto-analyze is enabled
    if (this.settings.autoAnalyze) {
      this.startAnalysis();
    }

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sendResponse);
      return true; // Keep channel open for async response
    });

    // Watch for new content (dynamic loading)
    this.observeDOM();
  }

  /**
   * Detect which platform we're on
   */
  detectPlatform() {
    const hostname = window.location.hostname;

    if (hostname.includes('linkedin.com')) {
      return { platform: 'linkedin', name: 'LinkedIn' };
    } else if (hostname.includes('youtube.com')) {
      return { platform: 'youtube', name: 'YouTube' };
    } else if (hostname.includes('reddit.com')) {
      return { platform: 'reddit', name: 'Reddit' };
    } else {
      return { platform: 'generic', name: 'Generic' };
    }
  }

  /**
   * Generate hash for content deduplication
   */
  hashContent(text) {
    if (!text) return '';
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  }

  /**
   * Remove existing indicators from an element
   */
  removeExistingIndicators(element) {
    if (!element) return;
    try {
      const existingIndicators = element.querySelectorAll('.troll-detector-indicator');
      existingIndicators.forEach(indicator => indicator.remove());
    } catch (error) {
      console.error('[AI and Troll Detector] Error removing indicators:', error);
    }
  }

  /**
   * Safe querySelector with error handling
   */
  safeQuerySelector(element, selectors) {
    if (!element || !selectors) return null;
    try {
      return element.querySelector(selectors);
    } catch (error) {
      console.error('[AI and Troll Detector] Query selector error:', selectors, error);
      return null;
    }
  }

  /**
   * Safe querySelectorAll with error handling
   */
  safeQuerySelectorAll(element, selectors) {
    if (!element || !selectors) return [];
    try {
      return Array.from(element.querySelectorAll(selectors));
    } catch (error) {
      console.error('[AI and Troll Detector] Query selector all error:', selectors, error);
      return [];
    }
  }

  /**
   * Load settings from Chrome storage
   */
  async loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['autoAnalyze', 'showIndicators', 'showCleanIndicators', 'flagThreshold'], (result) => {
        this.settings = {
          autoAnalyze: result.autoAnalyze !== false, // Default true
          showIndicators: result.showIndicators !== false, // Default true
          showCleanIndicators: result.showCleanIndicators !== false, // Default true
          flagThreshold: result.flagThreshold || 0.5
        };
        resolve();
      });
    });
  }

  /**
   * Save analysis results to Chrome storage
   */
  async saveResults() {
    const data = {
      url: window.location.href,
      platform: this.platformDetector.platform,
      timestamp: Date.now(),
      results: this.analysisResults
    };

    chrome.storage.local.set({ latestAnalysis: data });
  }

  /**
   * Handle messages from popup or background script
   */
  handleMessage(request, sendResponse) {
    switch (request.action) {
      case 'analyzeNow':
        this.startAnalysis();
        sendResponse({ success: true });
        break;

      case 'getResults':
        sendResponse({ results: this.analysisResults });
        break;

      case 'updateSettings':
        this.settings = { ...this.settings, ...request.settings };
        chrome.storage.sync.set(this.settings);

        // Update badge visibility based on new settings
        this.updateBadgeVisibility();

        sendResponse({ success: true });
        break;

      default:
        sendResponse({ error: 'Unknown action' });
    }
  }

  /**
   * Start the analysis process
   */
  async startAnalysis() {
    // Prevent concurrent analyses
    if (this.isAnalyzing) {
      console.log('[AI and Troll Detector] Analysis already in progress, skipping...');
      return;
    }

    this.isAnalyzing = true;
    console.log('[AI and Troll Detector] Starting analysis...');

    try {
      // Reset results
      this.analysisResults = {
        comments: [],
        profiles: [],
        overallStats: {}
      };

      // Analyze based on platform
      switch (this.platformDetector.platform) {
        case 'linkedin':
          await this.analyzeLinkedIn();
          break;
        case 'youtube':
          await this.analyzeYouTube();
          break;
        case 'reddit':
          await this.analyzeReddit();
          break;
        default:
          await this.analyzeGeneric();
      }

      // Calculate overall statistics
      this.calculateOverallStats();

      // Save results
      await this.saveResults();

      console.log('[AI and Troll Detector] Analysis complete:', this.analysisResults);

      // Notify extension that analysis is complete
      try {
        await chrome.runtime.sendMessage({
          action: 'analysisComplete',
          stats: this.analysisResults.overallStats
        });
      } catch (error) {
        // Only ignore "receiving end does not exist" errors (popup closed)
        if (!error.message.includes('Receiving end does not exist')) {
          console.error('[AI and Troll Detector] Error sending message:', error);
        }
      }
    } catch (error) {
      console.error('[AI and Troll Detector] Analysis error:', error);
    } finally {
      this.isAnalyzing = false;
    }
  }

  /**
   * Analyze LinkedIn content
   */
  async analyzeLinkedIn() {
    console.log('[AI and Troll Detector] Analyzing LinkedIn...');

    // Check if we're on a profile page
    if (window.location.pathname.includes('/in/')) {
      await this.analyzeLinkedInProfile();
    }

    // Analyze feed posts and comments
    await this.analyzeLinkedInFeed();
  }

  /**
   * Analyze LinkedIn profile page
   */
  async analyzeLinkedInProfile() {
    try {
      const profileData = {
        bio: '',
        headline: '',
        about: '',
        posts: [],
        username: ''
      };

      // Extract headline
      const headlineEl = this.safeQuerySelector(document, '.text-heading-xlarge, .ph5 h1');
      if (headlineEl) {
        profileData.headline = headlineEl.textContent.trim();
      }

      // Extract bio/tagline
      const bioEl = this.safeQuerySelector(document, '.text-body-medium, .ph5 .text-body-medium');
      if (bioEl) {
        profileData.bio = bioEl.textContent.trim();
      }

      // Extract about section
      const aboutEl = this.safeQuerySelector(document, '#about ~ .display-flex .inline-show-more-text, .pv-about-section');
      if (aboutEl) {
        profileData.about = aboutEl.textContent.trim();
      }

      // Extract recent posts
      const postElements = this.safeQuerySelectorAll(document, '.feed-shared-update-v2__description, .feed-shared-text');
      postElements.forEach((el, index) => {
        if (index < 10) { // Limit to 10 most recent posts
          profileData.posts.push({
            text: el.textContent.trim()
          });
        }
      });

      // Analyze the profile
      const analysis = this.analyzer.analyzeProfile(profileData);
      this.analysisResults.profiles.push({
        type: 'linkedin_profile',
        url: window.location.href,
        analysis
      });

      // Show indicator on profile if suspicious
      if (this.settings.showIndicators && analysis.isLikelySuspicious) {
        this.addProfileIndicator(analysis);
      }
    } catch (error) {
      console.error('[AI and Troll Detector] Error analyzing LinkedIn profile:', error);
    }
  }

  /**
   * Analyze LinkedIn feed (posts and comments)
   */
  async analyzeLinkedInFeed() {
    try {
      // Find all posts in feed
      const posts = this.safeQuerySelectorAll(document, '.feed-shared-update-v2, .occludable-update');

      posts.forEach((post) => {
        if (this.analyzedElements.has(post)) return;
        this.analyzedElements.add(post);

        // Extract post text
        const textEl = this.safeQuerySelector(post, '.feed-shared-update-v2__description, .feed-shared-text');
        if (!textEl) return;

        const text = textEl.textContent.trim();
        if (text.length < 10) return; // Skip very short posts

        // Check if content already analyzed (deduplication)
        const contentHash = this.hashContent(text);
        if (this.analyzedContent.has(contentHash)) {
          const cachedAnalysis = this.analyzedContent.get(contentHash);
          // Still add indicator if needed, but skip re-analysis
          if (this.settings.showIndicators) {
            if (cachedAnalysis.isSuspicious) {
              this.addCommentIndicator(post, cachedAnalysis);
            } else if (this.settings.showCleanIndicators) {
              this.addCleanIndicator(post, cachedAnalysis);
            }
          }
          return;
        }

        // Analyze the content
        const analysis = this.analyzer.analyzeContent(text);
        this.analyzedContent.set(contentHash, analysis);

        this.analysisResults.comments.push({
          type: 'linkedin_post',
          text: text.substring(0, 200),
          analysis
        });

        // Add indicator (suspicious or clean)
        if (this.settings.showIndicators) {
          if (analysis.isSuspicious) {
            this.addCommentIndicator(post, analysis);
          } else if (this.settings.showCleanIndicators) {
            this.addCleanIndicator(post, analysis);
          }
        }
      });

      // Analyze comments
      const comments = this.safeQuerySelectorAll(document, '.comments-comment-item, .comment-item');
      comments.forEach((comment) => {
        if (this.analyzedElements.has(comment)) return;
        this.analyzedElements.add(comment);

        const textEl = this.safeQuerySelector(comment, '.comments-comment-item__main-content, .comment-text');
        if (!textEl) return;

        const text = textEl.textContent.trim();
        if (text.length < 5) return;

        // Check if content already analyzed (deduplication)
        const contentHash = this.hashContent(text);
        if (this.analyzedContent.has(contentHash)) {
          const cachedAnalysis = this.analyzedContent.get(contentHash);
          // Still add indicator if needed, but skip re-analysis
          if (this.settings.showIndicators) {
            if (cachedAnalysis.isSuspicious) {
              this.addCommentIndicator(comment, cachedAnalysis);
            } else if (this.settings.showCleanIndicators) {
              this.addCleanIndicator(comment, cachedAnalysis);
            }
          }
          return;
        }

        const analysis = this.analyzer.analyzeContent(text);
        this.analyzedContent.set(contentHash, analysis);

        this.analysisResults.comments.push({
          type: 'linkedin_comment',
          text: text.substring(0, 200),
          analysis
        });

        if (this.settings.showIndicators) {
          if (analysis.isSuspicious) {
            this.addCommentIndicator(comment, analysis);
          } else if (this.settings.showCleanIndicators) {
            this.addCleanIndicator(comment, analysis);
          }
        }
      });
    } catch (error) {
      console.error('[AI and Troll Detector] Error analyzing LinkedIn feed:', error);
    }
  }

  /**
   * Analyze YouTube comments
   */
  async analyzeYouTube() {
    console.log('[AI and Troll Detector] Analyzing YouTube...');

    try {
      const comments = this.safeQuerySelectorAll(document, 'ytd-comment-renderer');

      comments.forEach((comment) => {
        if (this.analyzedElements.has(comment)) return;
        this.analyzedElements.add(comment);

        const textEl = this.safeQuerySelector(comment, '#content-text');
        if (!textEl) return;

        const text = textEl.textContent.trim();
        if (text.length < 5) return;

        // Check if content already analyzed (deduplication)
        const contentHash = this.hashContent(text);
        if (this.analyzedContent.has(contentHash)) {
          const cachedAnalysis = this.analyzedContent.get(contentHash);
          if (this.settings.showIndicators) {
            if (cachedAnalysis.isSuspicious) {
              this.addCommentIndicator(comment, cachedAnalysis);
            } else if (this.settings.showCleanIndicators) {
              this.addCleanIndicator(comment, cachedAnalysis);
            }
          }
          return;
        }

        const analysis = this.analyzer.analyzeContent(text);
        this.analyzedContent.set(contentHash, analysis);

        this.analysisResults.comments.push({
          type: 'youtube_comment',
          text: text.substring(0, 200),
          analysis
        });

        if (this.settings.showIndicators) {
          if (analysis.isSuspicious) {
            this.addCommentIndicator(comment, analysis);
          } else if (this.settings.showCleanIndicators) {
            this.addCleanIndicator(comment, analysis);
          }
        }
      });
    } catch (error) {
      console.error('[AI and Troll Detector] Error analyzing YouTube:', error);
    }
  }

  /**
   * Analyze Reddit comments and posts
   */
  async analyzeReddit() {
    console.log('[AI and Troll Detector] Analyzing Reddit...');

    try {
      // Analyze Reddit posts
      const posts = this.safeQuerySelectorAll(document, '[data-test-id="post-container"], div[data-testid="post-container"], .Post, shreddit-post');

      posts.forEach((post) => {
        if (this.analyzedElements.has(post)) return;
        this.analyzedElements.add(post);

        // Try multiple selectors for post content (new Reddit and old Reddit)
        let textEl = this.safeQuerySelector(post, '[data-click-id="text"], [data-adclicklocation="title"], h3, [slot="title"], div[slot="text-body"]');

        // For shreddit-post elements, get the text from multiple possible locations
        if (!textEl && post.tagName === 'SHREDDIT-POST') {
          textEl = this.safeQuerySelector(post, 'h1, div[slot="text-body"], p');
        }

        // Fallback: check for selftext or title in old Reddit
        if (!textEl) {
          textEl = this.safeQuerySelector(post, '.title, .md, .usertext-body');
        }

        if (!textEl) return;

        const text = textEl.textContent.trim();
        if (text.length < 10) return;

        // Check if content already analyzed (deduplication)
        const contentHash = this.hashContent(text);
        if (this.analyzedContent.has(contentHash)) {
          const cachedAnalysis = this.analyzedContent.get(contentHash);
          if (this.settings.showIndicators) {
            if (cachedAnalysis.isSuspicious) {
              this.addCommentIndicator(post, cachedAnalysis);
            } else if (this.settings.showCleanIndicators) {
              this.addCleanIndicator(post, cachedAnalysis);
            }
          }
          return;
        }

        const analysis = this.analyzer.analyzeContent(text);
        this.analyzedContent.set(contentHash, analysis);

        this.analysisResults.comments.push({
          type: 'reddit_post',
          text: text.substring(0, 200),
          analysis
        });

        if (this.settings.showIndicators) {
          if (analysis.isSuspicious) {
            this.addCommentIndicator(post, analysis);
          } else if (this.settings.showCleanIndicators) {
            this.addCleanIndicator(post, analysis);
          }
        }
      });

      // Analyze Reddit comments - updated selectors for new Reddit
      const comments = this.safeQuerySelectorAll(document, 'shreddit-comment, [data-testid="comment"], .Comment, .comment, div[id^="t1_"]');

      comments.forEach((comment) => {
        if (this.analyzedElements.has(comment)) return;
        this.analyzedElements.add(comment);

        // Try multiple selectors for comment content
        let textEl = this.safeQuerySelector(comment, 'div[slot="comment"], p, [data-testid="comment-body-text"], .md, div[id^="t1_"] .md');

        // For shreddit-comment elements
        if (!textEl && comment.tagName === 'SHREDDIT-COMMENT') {
          textEl = this.safeQuerySelector(comment, 'div[slot="comment"] p, p');
        }

        // Old Reddit fallback
        if (!textEl) {
          textEl = this.safeQuerySelector(comment, '.usertext-body, .md');
        }

        if (!textEl) return;

        const text = textEl.textContent.trim();
        if (text.length < 5) return;

        // Check if content already analyzed (deduplication)
        const contentHash = this.hashContent(text);
        if (this.analyzedContent.has(contentHash)) {
          const cachedAnalysis = this.analyzedContent.get(contentHash);
          if (this.settings.showIndicators) {
            if (cachedAnalysis.isSuspicious) {
              this.addCommentIndicator(comment, cachedAnalysis);
            } else if (this.settings.showCleanIndicators) {
              this.addCleanIndicator(comment, cachedAnalysis);
            }
          }
          return;
        }

        const analysis = this.analyzer.analyzeContent(text);
        this.analyzedContent.set(contentHash, analysis);

        this.analysisResults.comments.push({
          type: 'reddit_comment',
          text: text.substring(0, 200),
          analysis
        });

        if (this.settings.showIndicators) {
          if (analysis.isSuspicious) {
            this.addCommentIndicator(comment, analysis);
          } else if (this.settings.showCleanIndicators) {
            this.addCleanIndicator(comment, analysis);
          }
        }
      });
    } catch (error) {
      console.error('[AI and Troll Detector] Error analyzing Reddit:', error);
    }
  }

  /**
   * Generic analysis for other websites
   */
  async analyzeGeneric() {
    console.log('[AI and Troll Detector] Performing generic analysis...');

    try {
      // Look for common comment patterns
      const potentialComments = this.safeQuerySelectorAll(document,
        '.comment, .post, [class*="comment"], [class*="post"], article'
      );

      potentialComments.forEach((element) => {
        if (this.analyzedElements.has(element)) return;
        this.analyzedElements.add(element);

        const text = element.textContent.trim();
        if (text.length < 10 || text.length > 5000) return;

        // Check if content already analyzed (deduplication)
        const contentHash = this.hashContent(text);
        if (this.analyzedContent.has(contentHash)) {
          const cachedAnalysis = this.analyzedContent.get(contentHash);
          if (this.settings.showIndicators) {
            if (cachedAnalysis.isSuspicious) {
              this.addCommentIndicator(element, cachedAnalysis);
            } else if (this.settings.showCleanIndicators) {
              this.addCleanIndicator(element, cachedAnalysis);
            }
          }
          return;
        }

        const analysis = this.analyzer.analyzeContent(text);
        this.analyzedContent.set(contentHash, analysis);

        this.analysisResults.comments.push({
          type: 'generic_comment',
          text: text.substring(0, 200),
          analysis
        });

        if (this.settings.showIndicators) {
          if (analysis.isSuspicious) {
            this.addCommentIndicator(element, analysis);
          } else if (this.settings.showCleanIndicators) {
            this.addCleanIndicator(element, analysis);
          }
        }
      });
    } catch (error) {
      console.error('[AI and Troll Detector] Error in generic analysis:', error);
    }
  }

  /**
   * Add visual indicator to a comment/post
   */
  addCommentIndicator(element, analysis) {
    if (!element) return;

    try {
      // Remove ALL existing indicators (fixes stacking issue)
      this.removeExistingIndicators(element);

      const indicator = document.createElement('div');
      indicator.className = 'troll-detector-indicator';

      let emoji = '⚠️';
      let label = 'Suspicious';
      let className = 'warning';

      if (analysis.suspicionScore > 0.7) {
        emoji = '🤖';
        label = 'Likely AI';
        className = 'danger';
      } else if (analysis.flags.includes('Spam patterns detected')) {
        emoji = '🚫';
        label = 'Spam';
        className = 'danger';
      } else if (analysis.details?.sentiment?.classification === 'positive' && analysis.details.sentiment.isExtreme) {
        emoji = '😍';
        label = 'Extreme Positive';
        className = 'info';
      } else if (analysis.details?.sentiment?.classification === 'negative' && analysis.details.sentiment.isExtreme) {
        emoji = '😡';
        label = 'Extreme Negative';
        className = 'danger';
      }

      indicator.innerHTML = `
        <span class="troll-detector-emoji">${emoji}</span>
        <span class="troll-detector-label">${label}</span>
        <span class="troll-detector-score">${Math.round(analysis.suspicionScore * 100)}%</span>
      `;
      indicator.setAttribute('data-class', className);
      indicator.title = `Flags: ${analysis.flags.join(', ')}`;

      // Insert indicator
      element.style.position = 'relative';
      element.insertBefore(indicator, element.firstChild);
    } catch (error) {
      console.error('[AI and Troll Detector] Error adding comment indicator:', error);
    }
  }

  /**
   * Add clean/safe indicator (green shield)
   */
  addCleanIndicator(element, analysis) {
    if (!element) return;

    try {
      // Remove ALL existing indicators (fixes stacking issue)
      this.removeExistingIndicators(element);

      const indicator = document.createElement('div');
      indicator.className = 'troll-detector-indicator';

      const emoji = '🛡️';
      const label = 'Verified Clean';
      const className = 'success';

      indicator.innerHTML = `
        <span class="troll-detector-emoji">${emoji}</span>
        <span class="troll-detector-label">${label}</span>
        <span class="troll-detector-score">✓</span>
      `;
      indicator.setAttribute('data-class', className);
      indicator.title = 'No AI, troll, or extreme sentiment patterns detected';

      // Insert indicator
      element.style.position = 'relative';
      element.insertBefore(indicator, element.firstChild);
    } catch (error) {
      console.error('[AI and Troll Detector] Error adding clean indicator:', error);
    }
  }

  /**
   * Add profile indicator for suspicious profiles
   */
  addProfileIndicator(analysis) {
    const indicator = document.createElement('div');
    indicator.className = 'troll-detector-profile-badge';
    indicator.innerHTML = `
      <div class="badge-content">
        <span class="badge-emoji">🚨</span>
        <div class="badge-text">
          <strong>${analysis.classification}</strong>
          <small>AI/Troll Score: ${Math.round(analysis.overallScore * 100)}%</small>
        </div>
      </div>
      <div class="badge-flags">
        ${analysis.flags.map(flag => `<li>${flag}</li>`).join('')}
      </div>
    `;

    // Try to insert near profile header
    const header = document.querySelector('.pv-text-details__left-panel, .ph5');
    if (header) {
      header.insertBefore(indicator, header.firstChild);
    }
  }

  /**
   * Calculate overall statistics
   */
  calculateOverallStats() {
    const total = this.analysisResults.comments.length;
    if (total === 0) {
      this.analysisResults.overallStats = {
        totalAnalyzed: 0,
        suspiciousCount: 0,
        suspiciousPercent: 0
      };
      return;
    }

    const suspicious = this.analysisResults.comments.filter(c => c.analysis.isSuspicious).length;
    const sentiments = this.analysisResults.comments.map(c => c.analysis.details?.sentiment?.classification);

    const positiveCount = sentiments.filter(s => s === 'positive').length;
    const negativeCount = sentiments.filter(s => s === 'negative').length;
    const neutralCount = sentiments.filter(s => s === 'neutral').length;

    this.analysisResults.overallStats = {
      totalAnalyzed: total,
      suspiciousCount: suspicious,
      suspiciousPercent: (suspicious / total) * 100,
      sentimentDistribution: {
        positive: positiveCount,
        negative: negativeCount,
        neutral: neutralCount
      },
      averageSuspicionScore: this.analysisResults.comments.reduce((sum, c) => sum + (c.analysis.suspicionScore || 0), 0) / total
    };
  }

  /**
   * Update visibility of badges based on settings
   */
  updateBadgeVisibility() {
    const allIndicators = document.querySelectorAll('.troll-detector-indicator');

    allIndicators.forEach((indicator) => {
      // Check if this is a clean indicator (has "success" class)
      const isCleanIndicator = indicator.getAttribute('data-class') === 'success';

      if (!this.settings.showIndicators) {
        // Master toggle off - hide all indicators
        indicator.style.display = 'none';
      } else if (isCleanIndicator && !this.settings.showCleanIndicators) {
        // Clean indicators toggle off - hide only clean badges
        indicator.style.display = 'none';
      } else {
        // Show the indicator
        indicator.style.display = 'inline-flex';
      }
    });

    // Also handle profile badges
    const profileBadges = document.querySelectorAll('.troll-detector-profile-badge');
    profileBadges.forEach((badge) => {
      badge.style.display = this.settings.showIndicators ? 'block' : 'none';
    });
  }

  /**
   * Observe DOM for dynamically loaded content
   */
  observeDOM() {
    const observer = new MutationObserver((mutations) => {
      // Debounce analysis with longer timeout to reduce CPU usage
      clearTimeout(this.analysisTimeout);
      this.analysisTimeout = setTimeout(() => {
        if (this.settings.autoAnalyze && !this.isAnalyzing) {
          // Check if page has too many elements (performance protection)
          const elementCount = document.querySelectorAll('*').length;
          if (elementCount > 5000) {
            console.log('[AI and Troll Detector] Page too large, skipping auto-analysis. Use manual analysis.');
            return;
          }
          this.startAnalysis();
        }
      }, 3000); // Increased from 1000ms to 3000ms to reduce frequency
    });

    // Observe with more targeted settings
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}

// Initialize the detector when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.trollDetector = new TrollDetector();
  });
} else {
  window.trollDetector = new TrollDetector();
}
