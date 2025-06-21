export interface SafeBrowsingResponse {
  matches?: Array<{
    threatType: string;
    platformType: string;
    threat: {
      url: string;
    };
    cacheDuration: string;
    threatEntryType: string;
  }>;
}

export interface ThreatMatch {
  url: string;
  threatType: 'MALWARE' | 'SOCIAL_ENGINEERING' | 'UNWANTED_SOFTWARE' | 'POTENTIALLY_HARMFUL_APPLICATION';
  severity: 'high' | 'medium' | 'low';
}

export class SafeBrowsingService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://safebrowsing.googleapis.com/v4/threatMatches:find';

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Google Safe Browsing API key is required');
    }
    this.apiKey = apiKey;
  }

  /**
   * Check if URLs are safe using Google Safe Browsing API
   */
  async checkUrls(urls: string[]): Promise<ThreatMatch[]> {
    if (!urls || urls.length === 0) {
      return [];
    }

    const requestBody = {
      client: {
        clientId: 'safe-browse-guard',
        clientVersion: '1.0.0'
      },
      threatInfo: {
        threatTypes: [
          'MALWARE',
          'SOCIAL_ENGINEERING',
          'UNWANTED_SOFTWARE',
          'POTENTIALLY_HARMFUL_APPLICATION'
        ],
        platformTypes: ['ANY_PLATFORM'],
        threatEntryTypes: ['URL'],
        threatEntries: urls.map(url => ({ url }))
      }
    };

    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Safe Browsing API error: ${response.status} ${response.statusText}`);
      }

      const data: SafeBrowsingResponse = await response.json();
      return this.parseThreatMatches(data);
    } catch (error) {
      console.error('Error checking URLs with Safe Browsing API:', error);
      throw error;
    }
  }

  /**
   * Check a single URL for threats
   */
  async checkUrl(url: string): Promise<ThreatMatch | null> {
    const threats = await this.checkUrls([url]);
    return threats.length > 0 ? threats[0] : null;
  }

  private parseThreatMatches(response: SafeBrowsingResponse): ThreatMatch[] {
    if (!response.matches) {
      return [];
    }

    return response.matches.map(match => ({
      url: match.threat.url,
      threatType: match.threatType as ThreatMatch['threatType'],
      severity: this.getThreatSeverity(match.threatType)
    }));
  }

  private getThreatSeverity(threatType: string): 'high' | 'medium' | 'low' {
    switch (threatType) {
      case 'MALWARE':
      case 'SOCIAL_ENGINEERING':
        return 'high';
      case 'UNWANTED_SOFTWARE':
        return 'medium';
      case 'POTENTIALLY_HARMFUL_APPLICATION':
        return 'low';
      default:
        return 'medium';
    }
  }
}

/**
 * Get Safe Browsing service instance with API key from storage
 */
export async function getSafeBrowsingService(): Promise<SafeBrowsingService> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['safeBrowsingApiKey'], (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      const apiKey = result.safeBrowsingApiKey;
      if (!apiKey) {
        reject(new Error('Google Safe Browsing API key not configured'));
        return;
      }

      try {
        const service = new SafeBrowsingService(apiKey);
        resolve(service);
      } catch (error) {
        reject(error);
      }
    });
  });
} 