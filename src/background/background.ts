import { getSafeBrowsingService, ThreatMatch } from '../lib/safeBrowsing';
import { detectSuspiciousPatterns, getCombinedThreatLevel, SuspiciousPattern } from '../lib/urlPatterns';
import { ContentAnalysisResult } from '../lib/contentAnalysis';

interface TabInfo {
  url?: string;
  status?: 'safe' | 'danger' | 'unknown';
  threat?: ThreatMatch;
  patterns?: SuspiciousPattern[];
  contentAnalysis?: ContentAnalysisResult;
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

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getCurrentTabStatus') {
    handleGetCurrentTabStatus(sendResponse);
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'recheckCurrentTab') {
    handleRecheckCurrentTab(sendResponse);
    return true;
  }
  
  if (request.type === 'CONTENT_ANALYSIS_RESULT') {
    handleContentAnalysisResult(request, sender);
    return false; // No response needed
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
      
      // Get existing content analysis if available
      const existingTabInfo = tabCache.get(tabId);
      const existingContentAnalysis = existingTabInfo?.contentAnalysis;
      
      // Only consider content analysis if it's recent and has high-confidence threats
      if (existingContentAnalysis && finalStatus === 'safe') {
        const analysisAge = now - (existingContentAnalysis.timestamp || 0);
        const isRecentAnalysis = analysisAge < CACHE_DURATION;
        
        // Only override safe status if analysis is recent and shows high risk with very low score
        if (isRecentAnalysis && existingContentAnalysis.riskLevel === 'high' && existingContentAnalysis.score < 40) {
          finalStatus = 'danger';
        }
      }
      
      // Cache the result
      tabCache.set(tabId, {
        url,
        status: finalStatus,
        threat: threat || undefined,
        patterns,
        contentAnalysis: existingContentAnalysis,
        lastChecked: now
      });

      // Update icon and storage
      updateIconAndStorage(tabId, finalStatus, threat, patterns, existingContentAnalysis);

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

function updateIconAndStorage(tabId: number, status: 'safe' | 'danger' | 'unknown', threat?: ThreatMatch | null, patterns?: SuspiciousPattern[], contentAnalysis?: ContentAnalysisResult): void {
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
    currentPatterns: patterns || [],
    currentContentAnalysis: contentAnalysis
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

    // Preserve existing content analysis but clear URL/API analysis
    const existingTab = tabCache.get(activeTab.id);
    const existingContentAnalysis = existingTab?.contentAnalysis;
    
    // Clear cache for this tab
    tabCache.delete(activeTab.id);
    
    // Recheck the tab (URL patterns and Safe Browsing only)
    await checkTabSafety(activeTab.id, activeTab.url);
    
    // Get the updated tab info and restore content analysis if it exists
    let updatedTab = tabCache.get(activeTab.id);
    if (updatedTab && existingContentAnalysis) {
      updatedTab.contentAnalysis = existingContentAnalysis;
      
      // Re-evaluate final status considering content analysis
      let finalStatus = updatedTab.status || 'safe';
      
      // If content analysis indicates danger, consider it
      if (finalStatus === 'safe' && existingContentAnalysis.riskLevel === 'high' && existingContentAnalysis.score < 40) {
        finalStatus = 'danger';
      }
      
      updatedTab.status = finalStatus;
      tabCache.set(activeTab.id, updatedTab);
      
      // Update icon with final status
      updateIconAndStorage(activeTab.id, finalStatus, updatedTab.threat, updatedTab.patterns, existingContentAnalysis);
    }
    
    // Return the result
    const cached = tabCache.get(activeTab.id);
    sendResponse({
      status: cached?.status || 'unknown',
      threat: cached?.threat,
      patterns: cached?.patterns || [],
      contentAnalysis: cached?.contentAnalysis,
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

/**
 * Handle content analysis results from content script
 */
function handleContentAnalysisResult(request: any, sender: chrome.runtime.MessageSender): void {
  try {
    if (!sender.tab?.id || !request.result) {
      return;
    }

    const tabId = sender.tab.id;
    const contentAnalysis: ContentAnalysisResult = request.result;
    
    // Get current tab info or create new one
    let tabInfo: TabInfo = tabCache.get(tabId) || { url: request.url };
    
    // Update with content analysis
    tabInfo.contentAnalysis = contentAnalysis;
    tabInfo.lastChecked = Date.now();
    
    // Determine if content analysis indicates danger
    let contentThreatLevel: 'safe' | 'danger' | 'unknown' = 'safe';
    
    if (contentAnalysis.riskLevel === 'high') {
      contentThreatLevel = 'danger';
    } else if (contentAnalysis.riskLevel === 'medium' && contentAnalysis.score < 60) {
      contentThreatLevel = 'danger';
    }
    
    // Update overall status considering all threat sources
    let finalStatus = tabInfo.status || 'safe';
    
    // If we already detected API or pattern threats, keep danger status
    if (finalStatus !== 'danger' && contentThreatLevel === 'danger') {
      finalStatus = 'danger';
    }
    
    tabInfo.status = finalStatus;
    tabCache.set(tabId, tabInfo);
    
    // Update icon and storage
    updateIconAndStorage(tabId, finalStatus, tabInfo.threat, tabInfo.patterns, contentAnalysis);
    
    // Show notification for high-risk content issues
    if (contentAnalysis.riskLevel === 'high' && contentAnalysis.issues.length > 0) {
      showContentAnalysisNotification(contentAnalysis);
    }
    
    // If content analysis shows high risk, consider redirecting to warning page
    if (contentAnalysis.riskLevel === 'high' && contentAnalysis.score < 40) {
      redirectToWarningPage(tabId, {
        type: 'content',
        severity: 'high',
        details: `Content analysis detected ${contentAnalysis.issues.length} security issues`,
        url: request.url
      }, contentAnalysis);
    }
    
  } catch (error) {
    console.error('Error handling content analysis result:', error);
  }
}

/**
 * Show notification for content analysis issues
 */
function showContentAnalysisNotification(contentAnalysis: ContentAnalysisResult): void {
  const highIssues = contentAnalysis.issues.filter(issue => issue.severity === 'high');
  const issue = highIssues[0] || contentAnalysis.issues[0];
  
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon-danger-48.png',
    title: 'Safe Browse Guard - Contenido Sospechoso',
    message: issue ? issue.description : 'Se detectaron problemas de seguridad en el contenido',
    priority: 1
  });
}

/**
 * Redirect to warning page
 */
function redirectToWarningPage(tabId: number, threat: any, contentAnalysis?: ContentAnalysisResult): void {
  try {
    // Store content analysis in session storage (will be accessed by warning page)
    if (contentAnalysis) {
      // We'll use chrome.tabs.executeScript to store in sessionStorage
      chrome.scripting.executeScript({
        target: { tabId },
        func: (analysis) => {
          sessionStorage.setItem('contentAnalysis', JSON.stringify(analysis));
        },
        args: [contentAnalysis]
      }).catch(console.error);
    }
    
    // Build warning page URL with parameters
    const warningUrl = chrome.runtime.getURL('warning/warning.html') + 
      `?type=${threat.type}&severity=${threat.severity}&details=${encodeURIComponent(threat.details)}&url=${encodeURIComponent(threat.url)}`;
    
    // Navigate to warning page
    chrome.tabs.update(tabId, { url: warningUrl });
    
  } catch (error) {
    console.error('Error redirecting to warning page:', error);
  }
} 