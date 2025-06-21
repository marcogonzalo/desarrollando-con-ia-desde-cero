import { 
  detectSuspiciousPatterns, 
  checkHomographAttack, 
  checkSuspiciousTLD,
  checkSubdomainSpoofing,
  checkUrlLength 
} from '../src/lib/urlPatterns';

describe('URL Pattern Detection', () => {
  describe('detectSuspiciousPatterns', () => {
    test('should return empty array for safe URLs', () => {
      const safeUrls = [
        'https://google.com',
        'https://github.com',
        'https://stackoverflow.com',
        'https://example.com'
      ];

      safeUrls.forEach(url => {
        const patterns = detectSuspiciousPatterns(url);
        expect(patterns).toEqual([]);
      });
    });

    test('should detect multiple patterns in single URL', () => {
      const suspiciousUrl = 'https://g00gle.zip/login';
      const patterns = detectSuspiciousPatterns(suspiciousUrl);
      
      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns.some(p => p.type === 'homograph')).toBe(true);
      expect(patterns.some(p => p.type === 'suspicious_tld')).toBe(true);
    });

    test('should handle invalid URLs gracefully', () => {
      const invalidUrls = ['', 'not-a-url', 'ftp://example.com'];
      
      invalidUrls.forEach(url => {
        expect(() => detectSuspiciousPatterns(url)).not.toThrow();
      });
    });
  });

  describe('checkHomographAttack', () => {
    test('should detect common character substitutions', () => {
      const homographUrls = [
        'https://g00gle.com', // 0 instead of o
        'https://arnazon.com', // rn instead of m
        'https://paypaI.com', // I instead of l
        'https://microsοft.com', // Greek omicron instead of o
        'https://аpple.com', // Cyrillic a instead of Latin a
      ];

      homographUrls.forEach(url => {
        const result = checkHomographAttack(url);
        expect(result).not.toBeNull();
        expect(result?.type).toBe('homograph');
        expect(result?.severity).toBe('high');
      });
    });

    test('should not flag legitimate URLs', () => {
      const legitimateUrls = [
        'https://google.com',
        'https://amazon.com',
        'https://paypal.com',
        'https://microsoft.com',
        'https://apple.com'
      ];

      legitimateUrls.forEach(url => {
        const result = checkHomographAttack(url);
        expect(result).toBeNull();
      });
    });

    test('should detect mixed script attacks', () => {
      const mixedScriptUrl = 'https://gοοgle.com'; // Greek omicrons
      const result = checkHomographAttack(mixedScriptUrl);
      
      expect(result).not.toBeNull();
      expect(result?.type).toBe('homograph');
      expect(result?.description).toContain('mixed scripts');
    });
  });

  describe('checkSuspiciousTLD', () => {
    test('should detect suspicious top-level domains', () => {
      const suspiciousTLDs = [
        'https://example.zip',
        'https://example.rar',
        'https://example.exe',
        'https://example.scr',
        'https://example.tk',
        'https://example.ml'
      ];

      suspiciousTLDs.forEach(url => {
        const result = checkSuspiciousTLD(url);
        expect(result).not.toBeNull();
        expect(result?.type).toBe('suspicious_tld');
      });
    });

    test('should not flag common legitimate TLDs', () => {
      const legitimateTLDs = [
        'https://example.com',
        'https://example.org',
        'https://example.net',
        'https://example.edu',
        'https://example.gov',
        'https://example.co.uk'
      ];

      legitimateTLDs.forEach(url => {
        const result = checkSuspiciousTLD(url);
        expect(result).toBeNull();
      });
    });

    test('should assign correct severity levels', () => {
      const highRiskUrl = 'https://example.exe';
      const mediumRiskUrl = 'https://example.tk';
      
      const highResult = checkSuspiciousTLD(highRiskUrl);
      const mediumResult = checkSuspiciousTLD(mediumRiskUrl);
      
      expect(highResult?.severity).toBe('high');
      expect(mediumResult?.severity).toBe('medium');
    });
  });

  describe('checkSubdomainSpoofing', () => {
    test('should detect subdomain spoofing attempts', () => {
      const spoofingUrls = [
        'https://google.com.evil.com',
        'https://paypal.com.phishing.net',
        'https://amazon.com-login.fake.org',
        'https://microsoft.com.secure.tk'
      ];

      spoofingUrls.forEach(url => {
        const result = checkSubdomainSpoofing(url);
        expect(result).not.toBeNull();
        expect(result?.type).toBe('subdomain_spoofing');
      });
    });

    test('should not flag legitimate subdomains', () => {
      const legitimateSubdomains = [
        'https://mail.google.com',
        'https://docs.google.com',
        'https://aws.amazon.com',
        'https://login.microsoftonline.com'
      ];

      legitimateSubdomains.forEach(url => {
        const result = checkSubdomainSpoofing(url);
        expect(result).toBeNull();
      });
    });

    test('should detect brand name in middle of domain', () => {
      const spoofUrl = 'https://secure-paypal-login.evil.com';
      const result = checkSubdomainSpoofing(spoofUrl);
      
      expect(result).not.toBeNull();
      expect(result?.description).toContain('brand name');
    });
  });

  describe('checkUrlLength', () => {
    test('should detect extremely long URLs', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(2000);
      const result = checkUrlLength(longUrl);
      
      expect(result).not.toBeNull();
      expect(result?.type).toBe('excessive_length');
      expect(result?.severity).toBe('medium');
    });

    test('should not flag normal length URLs', () => {
      const normalUrls = [
        'https://example.com',
        'https://example.com/path/to/resource',
        'https://example.com/search?q=test&page=1'
      ];

      normalUrls.forEach(url => {
        const result = checkUrlLength(url);
        expect(result).toBeNull();
      });
    });

    test('should have different thresholds for different severity levels', () => {
      const mediumLengthUrl = 'https://example.com/' + 'a'.repeat(1500);
      const highLengthUrl = 'https://example.com/' + 'a'.repeat(3000);
      
      const mediumResult = checkUrlLength(mediumLengthUrl);
      const highResult = checkUrlLength(highLengthUrl);
      
      expect(mediumResult?.severity).toBe('medium');
      expect(highResult?.severity).toBe('high');
    });
  });

  describe('edge cases', () => {
    test('should handle URLs with unusual protocols', () => {
      const unusualUrls = [
        'ftp://example.com',
        'file:///path/to/file',
        'data:text/plain;base64,SGVsbG8='
      ];

      unusualUrls.forEach(url => {
        expect(() => detectSuspiciousPatterns(url)).not.toThrow();
      });
    });

    test('should handle URLs with special characters', () => {
      const specialUrls = [
        'https://example.com/path%20with%20spaces',
        'https://example.com/path?param=value&other=123',
        'https://example.com/path#fragment'
      ];

      specialUrls.forEach(url => {
        expect(() => detectSuspiciousPatterns(url)).not.toThrow();
      });
    });

    test('should handle internationalized domain names', () => {
      const idnUrls = [
        'https://测试.com',
        'https://тест.com',
        'https://テスト.com'
      ];

      idnUrls.forEach(url => {
        expect(() => detectSuspiciousPatterns(url)).not.toThrow();
      });
    });
  });
}); 