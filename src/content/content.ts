// Content script for analyzing page content
import { analyzePageContent, getSecurityAdvice, ContentAnalysisResult } from '../lib/contentAnalysis';

console.log('Content script loaded');

// Global state
let isExtensionEnabled = true;
let lastAnalysisResult: ContentAnalysisResult | null = null;

/**
 * Initialize content script
 */
function init() {
  // Check if extension is enabled
  chrome.storage.sync.get(['enabled'], (result) => {
    isExtensionEnabled = result.enabled !== false;
    
    if (isExtensionEnabled) {
      // Analyze page immediately
      analyzePage();
      
      // Set up observers for dynamic content
      setupContentObserver();
    }
  });

  // Listen for messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
      case 'ANALYZE_PAGE':
        if (isExtensionEnabled) {
          const result = analyzePage();
          sendResponse(result);
        }
        break;
        
      case 'GET_LAST_ANALYSIS':
        sendResponse(lastAnalysisResult);
        break;
        
      case 'EXTENSION_TOGGLED':
        isExtensionEnabled = message.enabled;
        if (isExtensionEnabled) {
          analyzePage();
        } else {
          lastAnalysisResult = null;
        }
        break;
    }
  });
}

/**
 * Analyze current page content
 */
function analyzePage(): ContentAnalysisResult | null {
  try {
    if (!isExtensionEnabled) {
      return null;
    }

    console.log('Analyzing page content...');
    
    const result = analyzePageContent(document, window);
    lastAnalysisResult = result;
    
    // Send results to background script
    chrome.runtime.sendMessage({
      type: 'CONTENT_ANALYSIS_RESULT',
      result: result,
      url: window.location.href
    });

    // Log results for debugging
    if (result.issues.length > 0) {
      console.warn('Security issues detected:', result.issues);
      console.log('Security advice:', getSecurityAdvice(result.issues));
    } else {
      console.log('No security issues detected');
    }

    return result;
    
  } catch (error) {
    console.error('Error analyzing page content:', error);
    return null;
  }
}

/**
 * Set up observer for dynamic content changes
 */
function setupContentObserver() {
  // Debounce function to avoid excessive analysis
  let analysisTimeout: NodeJS.Timeout | null = null;
  
  const debouncedAnalyze = () => {
    if (analysisTimeout) {
      clearTimeout(analysisTimeout);
    }
    
    analysisTimeout = setTimeout(() => {
      analyzePage();
    }, 1000); // Wait 1 second after last change
  };

  // Observer for DOM changes
  const observer = new MutationObserver((mutations) => {
    let shouldAnalyze = false;
    
    for (const mutation of mutations) {
      // Check if relevant elements were added
      if (mutation.type === 'childList') {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            
            // Check if it's a security-relevant element
            if (element.tagName === 'IFRAME' || 
                element.tagName === 'SCRIPT' || 
                element.tagName === 'FORM' ||
                element.querySelector('iframe, script, form')) {
              shouldAnalyze = true;
              break;
            }
          }
        }
      }
      
      if (shouldAnalyze) break;
    }
    
    if (shouldAnalyze) {
      debouncedAnalyze();
    }
  });

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Store observer reference for cleanup
  (window as any).__securityExtensionObserver = observer;
}

/**
 * Cleanup function
 */
function cleanup() {
  const observer = (window as any).__securityExtensionObserver;
  if (observer) {
    observer.disconnect();
    delete (window as any).__securityExtensionObserver;
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Cleanup on page unload
window.addEventListener('beforeunload', cleanup); 