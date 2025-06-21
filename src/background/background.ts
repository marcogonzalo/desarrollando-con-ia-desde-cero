// Background script for Safe Browse Guard extension
console.log('Safe Browse Guard background script loaded');

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  // Set default settings
  chrome.storage.local.set({
    isEnabled: true,
    currentSiteStatus: 'unknown',
  });
  
  console.log('Safe Browse Guard extension installed');
}); 