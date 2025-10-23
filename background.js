/**
 * background.js - Background service worker for Chrome extension
 * Handles extension lifecycle and message passing
 */

// Installation and updates
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[AI and Troll Detector] Extension installed');

    // Set default settings
    chrome.storage.sync.set({
      autoAnalyze: true,
      showIndicators: true,
      flagThreshold: 0.5
    });

    // Open welcome page (optional)
    // chrome.tabs.create({ url: 'welcome.html' });
  } else if (details.reason === 'update') {
    console.log('[AI and Troll Detector] Extension updated');
  }
});

// Handle messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'analyzeComplete':
      // Update badge with suspicious count
      if (request.stats && request.stats.suspiciousCount) {
        updateBadge(sender.tab.id, request.stats.suspiciousCount);
      }
      sendResponse({ success: true });
      break;

    case 'getSettings':
      chrome.storage.sync.get(['autoAnalyze', 'showIndicators', 'flagThreshold'], (result) => {
        sendResponse(result);
      });
      return true; // Keep channel open for async response

    default:
      sendResponse({ error: 'Unknown action' });
  }
});

/**
 * Update extension badge with suspicious item count
 */
function updateBadge(tabId, count) {
  if (count > 0) {
    chrome.action.setBadgeText({
      tabId: tabId,
      text: count.toString()
    });

    chrome.action.setBadgeBackgroundColor({
      tabId: tabId,
      color: count > 5 ? '#ef4444' : '#fbbf24'
    });
  } else {
    chrome.action.setBadgeText({
      tabId: tabId,
      text: ''
    });
  }
}

/**
 * Clear badge when tab is updated/navigated
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading') {
    chrome.action.setBadgeText({
      tabId: tabId,
      text: ''
    });
  }
});

// Keep service worker alive (Manifest V3 requirement)
chrome.runtime.onConnect.addListener((port) => {
  console.log('[AI and Troll Detector] Port connected');
});

console.log('[AI and Troll Detector] Background service worker loaded');
