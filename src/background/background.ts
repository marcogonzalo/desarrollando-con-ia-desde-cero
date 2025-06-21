import { getSafeBrowsingService, ThreatMatch } from '../lib/safeBrowsing';
import { detectSuspiciousPatterns, getCombinedThreatLevel, SuspiciousPattern } from '../lib/urlPatterns';

interface TabInfo {
  url?: string;
  status?: 'safe' | 'danger' | 'unknown';
  threat?: ThreatMatch;
  patterns?: SuspiciousPattern[];
  lastChecked?: number;
}

// Store tab information
const tabCache = new Map<number, TabInfo>();

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

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

// Listen for tab updates (navigation)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only process when URL changes and page is complete
  if (changeInfo.status === 'complete' && tab.url) {
    await checkTabSafety(tabId, tab.url);
  }
});

// Listen for active tab changes
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  if (tab.url) {
    await checkTabSafety(activeInfo.tabId, tab.url);
  }
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getCurrentTabStatus') {
    handleGetCurrentTabStatus(sendResponse);
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'recheckCurrentTab') {
    handleRecheckCurrentTab(sendResponse);
    return true;
  }
});

async function checkTabSafety(tabId: number, url: string): Promise<void> {
  try {
    // Check if extension is enabled
    const { isEnabled } = await chrome.storage.local.get(['isEnabled']);
    if (!isEnabled) {
      return;
    }

    // Skip non-http(s) URLs
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return;
    }

    // Check cache first
    const cached = tabCache.get(tabId);
    const now = Date.now();
    if (cached && cached.url === url && cached.lastChecked && 
        (now - cached.lastChecked) < CACHE_DURATION) {
      updateIconAndStorage(tabId, cached.status || 'unknown', cached.threat);
      return;
    }

    // Update icon to analyzing state
    updateIconAndStorage(tabId, 'unknown');

    try {
      // Check for suspicious URL patterns first (faster, local check)
      const patterns = detectSuspiciousPatterns(url);
      const patternThreatLevel = getCombinedThreatLevel(patterns);
      
      let finalStatus: 'safe' | 'danger' | 'unknown' = 'safe';
      let threat: ThreatMatch | null = null;

      // If patterns indicate high risk, mark as danger
      if (patternThreatLevel === 'high') {
        finalStatus = 'danger';
      }

      try {
        // Then check with Google Safe Browsing API
        const safeBrowsingService = await getSafeBrowsingService();
        threat = await safeBrowsingService.checkUrl(url);
        
        // Safe Browsing API result takes precedence
        if (threat) {
          finalStatus = 'danger';
        } else if (patternThreatLevel === null) {
          finalStatus = 'safe';
        }
        // If patterns detected medium/low risk but Safe Browsing says safe, 
        // we keep it as safe but store the patterns for user information
        
      } catch (apiError) {
        console.warn('Safe Browsing API unavailable, using pattern analysis only:', apiError);
        // Fall back to pattern analysis if API is unavailable
        if (patternThreatLevel) {
          finalStatus = patternThreatLevel === 'high' ? 'danger' : 'safe';
        }
      }
      
      // Cache the result
      tabCache.set(tabId, {
        url,
        status: finalStatus,
        threat: threat || undefined,
        patterns,
        lastChecked: now
      });

      // Update icon and storage
      updateIconAndStorage(tabId, finalStatus, threat, patterns);

      // Show notification for dangerous sites
      if (finalStatus === 'danger') {
        if (threat) {
          showThreatNotification(threat);
        } else if (patterns.length > 0) {
          showPatternNotification(patterns);
        }
      }

    } catch (error) {
      console.error('Error checking URL safety:', error);
      
      // Cache as unknown on error
      tabCache.set(tabId, {
        url,
        status: 'unknown',
        lastChecked: now
      });
      
      updateIconAndStorage(tabId, 'unknown');
    }

  } catch (error) {
    console.error('Error in checkTabSafety:', error);
  }
}

function updateIconAndStorage(tabId: number, status: 'safe' | 'danger' | 'unknown', threat?: ThreatMatch | null, patterns?: SuspiciousPattern[]): void {
  // Update extension icon
  const iconPaths = {
    safe: {
      '16': 'icons/icon-safe-16.png',
      '32': 'icons/icon-safe-32.png',
      '48': 'icons/icon-safe-48.png',
      '128': 'icons/icon-safe-128.png'
    },
    danger: {
      '16': 'icons/icon-danger-16.png',
      '32': 'icons/icon-danger-32.png',
      '48': 'icons/icon-danger-48.png',
      '128': 'icons/icon-danger-128.png'
    },
    unknown: {
      '16': 'icons/icon-unknown-16.png',
      '32': 'icons/icon-unknown-32.png',
      '48': 'icons/icon-unknown-48.png',
      '128': 'icons/icon-unknown-128.png'
    }
  };

  // For now, use default icon (we'll add specific icons later)
  chrome.action.setIcon({
    tabId,
    path: iconPaths[status] || iconPaths.unknown
  });

  // Update badge
  const badgeText = status === 'danger' ? '!' : status === 'safe' ? '✓' : '?';
  const badgeColor = status === 'danger' ? '#dc2626' : status === 'safe' ? '#16a34a' : '#6b7280';
  
  chrome.action.setBadgeText({ tabId, text: badgeText });
  chrome.action.setBadgeBackgroundColor({ tabId, color: badgeColor });

  // Store current status for popup
  chrome.storage.local.set({
    currentSiteStatus: status,
    currentThreat: threat,
    currentPatterns: patterns || []
  });
}

function showThreatNotification(threat: ThreatMatch): void {
  const threatMessages = {
    MALWARE: 'Sitio web con malware detectado',
    SOCIAL_ENGINEERING: 'Sitio de phishing detectado',
    UNWANTED_SOFTWARE: 'Software no deseado detectado',
    POTENTIALLY_HARMFUL_APPLICATION: 'Aplicación potencialmente dañina detectada'
  };

  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon-danger-48.png',
    title: 'Safe Browse Guard - ¡Peligro!',
    message: threatMessages[threat.threatType] || 'Sitio web peligroso detectado',
    priority: 2
  });
}

function showPatternNotification(patterns: SuspiciousPattern[]): void {
  const highPatterns = patterns.filter(p => p.severity === 'high');
  const pattern = highPatterns[0] || patterns[0];
  
  const patternMessages = {
    homograph: 'Posible ataque de suplantación de identidad detectado',
    suspicious_tld: 'Dominio sospechoso detectado',
    subdomain_spoofing: 'Posible suplantación de subdominio detectada',
    excessive_length: 'URL sospechosamente larga detectada',
    suspicious_keywords: 'Palabras clave sospechosas detectadas'
  };

  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon-danger-48.png',
    title: 'Safe Browse Guard - ¡Atención!',
    message: patternMessages[pattern.type] || 'Patrón sospechoso detectado en la URL',
    priority: 1
  });
}

async function handleGetCurrentTabStatus(sendResponse: (response: any) => void): Promise<void> {
  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!activeTab.id) {
      sendResponse({ status: 'unknown' });
      return;
    }

    const cached = tabCache.get(activeTab.id);
    sendResponse({
      status: cached?.status || 'unknown',
      threat: cached?.threat,
      patterns: cached?.patterns || [],
      url: activeTab.url
    });
  } catch (error) {
    console.error('Error getting current tab status:', error);
    sendResponse({ status: 'unknown' });
  }
}

async function handleRecheckCurrentTab(sendResponse: (response: any) => void): Promise<void> {
  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!activeTab.id || !activeTab.url) {
      sendResponse({ status: 'unknown' });
      return;
    }

    // Clear cache for this tab
    tabCache.delete(activeTab.id);
    
    // Recheck the tab
    await checkTabSafety(activeTab.id, activeTab.url);
    
    // Get updated status
    const cached = tabCache.get(activeTab.id);
    sendResponse({
      status: cached?.status || 'unknown',
      threat: cached?.threat,
      patterns: cached?.patterns || [],
      url: activeTab.url
    });
  } catch (error) {
    console.error('Error rechecking current tab:', error);
    sendResponse({ status: 'unknown' });
  }
}

// Clean up cache periodically
setInterval(() => {
  const now = Date.now();
  for (const [tabId, info] of tabCache.entries()) {
    if (info.lastChecked && (now - info.lastChecked) > CACHE_DURATION * 2) {
      tabCache.delete(tabId);
    }
  }
}, CACHE_DURATION);

// Clean up cache when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
  tabCache.delete(tabId);
}); 