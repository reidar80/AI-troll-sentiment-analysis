/**
 * popup.js - Popup interface logic
 * Displays analysis results and allows configuration
 */

class PopupController {
  constructor() {
    this.results = null;
    this.settings = {
      autoAnalyze: true,
      showIndicators: true,
      flagThreshold: 0.5
    };

    this.init();
  }

  async init() {
    // Load settings
    await this.loadSettings();

    // Load latest results
    await this.loadResults();

    // Setup event listeners
    this.setupEventListeners();

    // Update UI
    this.updateUI();
  }

  /**
   * Load settings from Chrome storage
   */
  async loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['autoAnalyze', 'showIndicators', 'flagThreshold'], (result) => {
        this.settings = {
          autoAnalyze: result.autoAnalyze !== false,
          showIndicators: result.showIndicators !== false,
          flagThreshold: result.flagThreshold || 0.5
        };
        resolve();
      });
    });
  }

  /**
   * Load analysis results from Chrome storage
   */
  async loadResults() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['latestAnalysis'], (result) => {
        this.results = result.latestAnalysis || null;
        resolve();
      });
    });
  }

  /**
   * Save settings to Chrome storage
   */
  async saveSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.set(this.settings, () => {
        resolve();
      });
    });
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Auto-analyze toggle
    const autoAnalyzeToggle = document.getElementById('autoAnalyze');
    autoAnalyzeToggle.checked = this.settings.autoAnalyze;
    autoAnalyzeToggle.addEventListener('change', (e) => {
      this.settings.autoAnalyze = e.target.checked;
      this.saveSettings();
      this.notifyContentScript();
    });

    // Show indicators toggle
    const showIndicatorsToggle = document.getElementById('showIndicators');
    showIndicatorsToggle.checked = this.settings.showIndicators;
    showIndicatorsToggle.addEventListener('change', (e) => {
      this.settings.showIndicators = e.target.checked;
      this.saveSettings();
      this.notifyContentScript();
    });

    // Threshold slider
    const thresholdSlider = document.getElementById('threshold');
    const thresholdValue = document.getElementById('threshold-value');
    thresholdSlider.value = this.settings.flagThreshold * 100;
    thresholdValue.textContent = `${Math.round(this.settings.flagThreshold * 100)}%`;

    thresholdSlider.addEventListener('input', (e) => {
      const value = parseInt(e.target.value) / 100;
      this.settings.flagThreshold = value;
      thresholdValue.textContent = `${Math.round(value * 100)}%`;
    });

    thresholdSlider.addEventListener('change', () => {
      this.saveSettings();
      this.notifyContentScript();
    });

    // Analyze button
    const analyzeBtn = document.getElementById('analyze-btn');
    analyzeBtn.addEventListener('click', () => {
      this.triggerAnalysis();
    });
  }

  /**
   * Notify content script of settings changes
   */
  notifyContentScript() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'updateSettings',
          settings: this.settings
        });
      }
    });
  }

  /**
   * Trigger analysis on current page
   */
  async triggerAnalysis() {
    const analyzeBtn = document.getElementById('analyze-btn');
    analyzeBtn.textContent = '⏳ Analyzing...';
    analyzeBtn.disabled = true;

    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'analyzeNow'
        }, async (response) => {
          // Wait a bit for analysis to complete
          setTimeout(async () => {
            await this.loadResults();
            this.updateUI();
            analyzeBtn.textContent = '🔍 Analyze Page Now';
            analyzeBtn.disabled = false;
          }, 2000);
        });
      }
    });
  }

  /**
   * Update UI with current results
   */
  updateUI() {
    const loading = document.getElementById('loading');
    const resultsDiv = document.getElementById('results');
    const noDataDiv = document.getElementById('no-data');

    loading.style.display = 'none';

    if (!this.results || !this.results.results.overallStats.totalAnalyzed) {
      resultsDiv.style.display = 'none';
      noDataDiv.style.display = 'block';
      return;
    }

    noDataDiv.style.display = 'none';
    resultsDiv.style.display = 'block';

    const stats = this.results.results.overallStats;

    // Update stat cards
    document.getElementById('total-analyzed').textContent = stats.totalAnalyzed || 0;
    document.getElementById('suspicious-count').textContent = stats.suspiciousCount || 0;

    // Style suspicious card based on percentage
    const suspiciousCard = document.getElementById('suspicious-card');
    const suspiciousPercent = stats.suspiciousPercent || 0;

    suspiciousCard.classList.remove('warning', 'danger', 'success');
    if (suspiciousPercent > 30) {
      suspiciousCard.classList.add('danger');
    } else if (suspiciousPercent > 10) {
      suspiciousCard.classList.add('warning');
    } else {
      suspiciousCard.classList.add('success');
    }

    // Update sentiment bars
    if (stats.sentimentDistribution) {
      const total = stats.totalAnalyzed;
      const positive = stats.sentimentDistribution.positive || 0;
      const negative = stats.sentimentDistribution.negative || 0;
      const neutral = stats.sentimentDistribution.neutral || 0;

      const positivePercent = (positive / total) * 100;
      const negativePercent = (negative / total) * 100;
      const neutralPercent = (neutral / total) * 100;

      const positiveBar = document.getElementById('positive-bar');
      const negativeBar = document.getElementById('negative-bar');
      const neutralBar = document.getElementById('neutral-bar');

      positiveBar.style.width = `${positivePercent}%`;
      negativeBar.style.width = `${negativePercent}%`;
      neutralBar.style.width = `${neutralPercent}%`;

      // Only show text if percentage is significant
      document.getElementById('positive-text').textContent = positivePercent > 10 ? `${Math.round(positivePercent)}%` : '';
      document.getElementById('negative-text').textContent = negativePercent > 10 ? `${Math.round(negativePercent)}%` : '';
      document.getElementById('neutral-text').textContent = neutralPercent > 10 ? `${Math.round(neutralPercent)}%` : '';

      // Hide segments with 0%
      positiveBar.style.display = positivePercent === 0 ? 'none' : 'flex';
      negativeBar.style.display = negativePercent === 0 ? 'none' : 'flex';
      neutralBar.style.display = neutralPercent === 0 ? 'none' : 'flex';
    }
  }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});
