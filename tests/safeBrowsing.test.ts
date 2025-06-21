import { SafeBrowsingService, getSafeBrowsingService, ThreatMatch } from '../src/lib/safeBrowsing';

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock chrome storage
const mockChromeStorage = {
  local: {
    get: jest.fn(),
  },
};

(global as any).chrome = {
  storage: mockChromeStorage,
  runtime: {
    lastError: null,
  },
};

describe('SafeBrowsingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('constructor', () => {
    test('should create instance with valid API key', () => {
      const service = new SafeBrowsingService('test-api-key');
      expect(service).toBeInstanceOf(SafeBrowsingService);
    });

    test('should throw error with empty API key', () => {
      expect(() => new SafeBrowsingService('')).toThrow('Google Safe Browsing API key is required');
    });

    test('should throw error with null API key', () => {
      expect(() => new SafeBrowsingService(null as any)).toThrow('Google Safe Browsing API key is required');
    });
  });

  describe('checkUrls', () => {
    let service: SafeBrowsingService;

    beforeEach(() => {
      service = new SafeBrowsingService('test-api-key');
    });

    test('should return empty array for empty URLs', async () => {
      const result = await service.checkUrls([]);
      expect(result).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    test('should return empty array for null URLs', async () => {
      const result = await service.checkUrls(null as any);
      expect(result).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    test('should call API with correct parameters for safe URLs', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({}),
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const urls = ['https://example.com', 'https://google.com'];
      await service.checkUrls(urls);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://safebrowsing.googleapis.com/v4/threatMatches:find?key=test-api-key',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
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
              threatEntries: [
                { url: 'https://example.com' },
                { url: 'https://google.com' }
              ]
            }
          })
        }
      );
    });

    test('should return empty array for safe URLs', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({}),
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await service.checkUrls(['https://safe-site.com']);
      expect(result).toEqual([]);
    });

    test('should return threat matches for dangerous URLs', async () => {
      const mockApiResponse = {
        matches: [
          {
            threatType: 'MALWARE',
            platformType: 'ANY_PLATFORM',
            threat: {
              url: 'https://malicious-site.com'
            },
            cacheDuration: '300s',
            threatEntryType: 'URL'
          }
        ]
      };

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockApiResponse),
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await service.checkUrls(['https://malicious-site.com']);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        url: 'https://malicious-site.com',
        threatType: 'MALWARE',
        severity: 'high'
      });
    });

    test('should handle multiple threat matches', async () => {
      const mockApiResponse = {
        matches: [
          {
            threatType: 'MALWARE',
            platformType: 'ANY_PLATFORM',
            threat: { url: 'https://malware-site.com' },
            cacheDuration: '300s',
            threatEntryType: 'URL'
          },
          {
            threatType: 'SOCIAL_ENGINEERING',
            platformType: 'ANY_PLATFORM',
            threat: { url: 'https://phishing-site.com' },
            cacheDuration: '300s',
            threatEntryType: 'URL'
          }
        ]
      };

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockApiResponse),
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await service.checkUrls(['https://malware-site.com', 'https://phishing-site.com']);
      
      expect(result).toHaveLength(2);
      expect(result[0].threatType).toBe('MALWARE');
      expect(result[1].threatType).toBe('SOCIAL_ENGINEERING');
    });

    test('should handle API errors gracefully', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      await expect(service.checkUrls(['https://test.com']))
        .rejects.toThrow('Safe Browsing API error: 400 Bad Request');
    });

    test('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(service.checkUrls(['https://test.com']))
        .rejects.toThrow('Network error');
    });
  });

  describe('checkUrl', () => {
    let service: SafeBrowsingService;

    beforeEach(() => {
      service = new SafeBrowsingService('test-api-key');
    });

    test('should return null for safe URL', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({}),
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await service.checkUrl('https://safe-site.com');
      expect(result).toBeNull();
    });

    test('should return threat match for dangerous URL', async () => {
      const mockApiResponse = {
        matches: [
          {
            threatType: 'SOCIAL_ENGINEERING',
            platformType: 'ANY_PLATFORM',
            threat: { url: 'https://phishing-site.com' },
            cacheDuration: '300s',
            threatEntryType: 'URL'
          }
        ]
      };

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockApiResponse),
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await service.checkUrl('https://phishing-site.com');
      expect(result).toEqual({
        url: 'https://phishing-site.com',
        threatType: 'SOCIAL_ENGINEERING',
        severity: 'high'
      });
    });
  });

  describe('threat severity mapping', () => {
    let service: SafeBrowsingService;

    beforeEach(() => {
      service = new SafeBrowsingService('test-api-key');
    });

    test('should map MALWARE to high severity', async () => {
      const mockApiResponse = {
        matches: [{
          threatType: 'MALWARE',
          platformType: 'ANY_PLATFORM',
          threat: { url: 'https://test.com' },
          cacheDuration: '300s',
          threatEntryType: 'URL'
        }]
      };

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockApiResponse),
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await service.checkUrl('https://test.com');
      expect(result?.severity).toBe('high');
    });

    test('should map UNWANTED_SOFTWARE to medium severity', async () => {
      const mockApiResponse = {
        matches: [{
          threatType: 'UNWANTED_SOFTWARE',
          platformType: 'ANY_PLATFORM',
          threat: { url: 'https://test.com' },
          cacheDuration: '300s',
          threatEntryType: 'URL'
        }]
      };

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockApiResponse),
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await service.checkUrl('https://test.com');
      expect(result?.severity).toBe('medium');
    });

    test('should map POTENTIALLY_HARMFUL_APPLICATION to low severity', async () => {
      const mockApiResponse = {
        matches: [{
          threatType: 'POTENTIALLY_HARMFUL_APPLICATION',
          platformType: 'ANY_PLATFORM',
          threat: { url: 'https://test.com' },
          cacheDuration: '300s',
          threatEntryType: 'URL'
        }]
      };

      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockApiResponse),
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await service.checkUrl('https://test.com');
      expect(result?.severity).toBe('low');
    });
  });
});

describe('getSafeBrowsingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).chrome.runtime.lastError = null;
  });

  test('should create service with API key from storage', async () => {
    mockChromeStorage.local.get.mockImplementation((keys, callback) => {
      callback({ safeBrowsingApiKey: 'stored-api-key' });
    });

    const service = await getSafeBrowsingService();
    expect(service).toBeInstanceOf(SafeBrowsingService);
  });

  test('should reject when API key is not configured', async () => {
    mockChromeStorage.local.get.mockImplementation((keys, callback) => {
      callback({});
    });

    await expect(getSafeBrowsingService())
      .rejects.toThrow('Google Safe Browsing API key not configured');
  });

  test('should reject when chrome storage has error', async () => {
    (global as any).chrome.runtime.lastError = { message: 'Storage error' };
    mockChromeStorage.local.get.mockImplementation((keys, callback) => {
      callback({});
    });

    await expect(getSafeBrowsingService())
      .rejects.toThrow('Storage error');
  });
}); 