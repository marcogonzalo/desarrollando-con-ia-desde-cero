import { 
  analyzePageContent, 
  detectSuspiciousIframes,
  detectInsecureForms,
  detectSuspiciousScripts,
  detectPhishingIndicators,
  ContentAnalysisResult,
  SecurityIssue
} from '../src/lib/contentAnalysis';

// Mock DOM environment
const mockDocument = {
  querySelectorAll: jest.fn(),
  querySelector: jest.fn(),
  location: { href: 'https://example.com', protocol: 'https:' },
  title: 'Test Page'
};

const mockWindow = {
  location: { href: 'https://example.com', protocol: 'https:' }
};

// Mock Chrome APIs
(global as any).chrome = {
  runtime: {
    sendMessage: jest.fn()
  }
};

describe('Content Analysis', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzePageContent', () => {
    test('should return clean result for safe page', () => {
      mockDocument.querySelectorAll.mockReturnValue([]);
      
      const result = analyzePageContent(mockDocument as any, mockWindow as any);
      
      expect(result.riskLevel).toBe('low');
      expect(result.issues).toHaveLength(0);
      expect(result.score).toBeGreaterThan(80);
    });

    test('should detect multiple security issues', () => {
      // Mock suspicious iframes
      const suspiciousIframe = {
        src: 'http://malicious-site.com/frame',
        getAttribute: jest.fn().mockReturnValue('http://malicious-site.com/frame')
      };
      
      // Mock insecure forms
      const insecureForm = {
        action: 'http://unsecure-site.com/login',
        method: 'post',
        querySelector: jest.fn().mockReturnValue({
          type: 'password'
        })
      };

      mockDocument.querySelectorAll
        .mockReturnValueOnce([suspiciousIframe]) // iframes
        .mockReturnValueOnce([insecureForm]) // forms
        .mockReturnValueOnce([]) // scripts
        .mockReturnValueOnce([]); // phishing indicators

      const result = analyzePageContent(mockDocument as any, mockWindow as any);
      
      expect(result.riskLevel).toBe('high');
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues.some((issue: any) => issue.type === 'insecure_iframe')).toBe(true);
      expect(result.issues.some((issue: any) => issue.type === 'insecure_form')).toBe(true);
    });

    test('should calculate risk score correctly', () => {
      // Mock forms with insecure action
      const insecureForm = {
        action: 'http://insecure-site.com/login',
        method: 'post',
        querySelector: jest.fn().mockReturnValue({ type: 'password' })
      };

      mockDocument.querySelectorAll
        .mockReturnValueOnce([]) // iframes
        .mockReturnValueOnce([insecureForm]) // forms
        .mockReturnValueOnce([]) // scripts
        .mockReturnValueOnce([]); // text elements

      const result = analyzePageContent(mockDocument as any, mockWindow as any);
      
      expect(result.score).toBeLessThan(80); // Should be reduced due to high severity issue
      expect(result.riskLevel).toBe('high');
    });
  });

  describe('detectSuspiciousIframes', () => {
    test('should detect iframes with suspicious sources', () => {
      const suspiciousIframes = [
        { src: 'http://malicious-site.com/frame', getAttribute: jest.fn().mockReturnValue('http://malicious-site.com/frame') },
        { src: 'https://suspicious-ads.tk/banner', getAttribute: jest.fn().mockReturnValue('https://suspicious-ads.tk/banner') },
        { src: 'javascript:alert("xss")', getAttribute: jest.fn().mockReturnValue('javascript:alert("xss")') }
      ];

      const issues = detectSuspiciousIframes(suspiciousIframes as any);
      
      expect(issues).toHaveLength(3);
      expect(issues[0].type).toBe('insecure_iframe');
      expect(issues[0].severity).toBe('high');
      expect(issues[1].severity).toBe('medium');
      expect(issues[2].severity).toBe('high');
    });

    test('should not flag legitimate iframes', () => {
      const legitimateIframes = [
        { src: 'https://www.youtube.com/embed/video123', getAttribute: jest.fn().mockReturnValue('https://www.youtube.com/embed/video123') },
        { src: 'https://maps.google.com/embed', getAttribute: jest.fn().mockReturnValue('https://maps.google.com/embed') },
        { src: 'https://same-domain.example.com/content', getAttribute: jest.fn().mockReturnValue('https://same-domain.example.com/content') }
      ];

      const issues = detectSuspiciousIframes(legitimateIframes as any);
      
      expect(issues).toHaveLength(0);
    });

    test('should handle iframes without src attribute', () => {
      const iframesWithoutSrc = [
        { src: '', getAttribute: jest.fn().mockReturnValue('') },
        { src: undefined, getAttribute: jest.fn().mockReturnValue(null) }
      ];

      const issues = detectSuspiciousIframes(iframesWithoutSrc as any);
      
      expect(issues).toHaveLength(0);
    });
  });

  describe('detectInsecureForms', () => {
    test('should detect forms submitting to HTTP', () => {
      const insecureForms = [
        {
          action: 'http://insecure-site.com/login',
          method: 'post',
          querySelector: jest.fn().mockReturnValue({ type: 'password' })
        }
      ];

      const issues = detectInsecureForms(insecureForms as any, 'https://secure-site.com');
      
      expect(issues).toHaveLength(1);
      expect(issues[0].type).toBe('insecure_form');
      expect(issues[0].severity).toBe('high');
      expect(issues[0].description).toContain('HTTP');
    });

    test('should detect forms submitting to different domains', () => {
      const crossDomainForms = [
        {
          action: 'https://different-site.com/submit',
          method: 'post',
          querySelector: jest.fn().mockReturnValue({ type: 'password' })
        }
      ];

      const issues = detectInsecureForms(crossDomainForms as any, 'https://original-site.com');
      
      expect(issues).toHaveLength(1);
      expect(issues[0].type).toBe('cross_domain_form');
      expect(issues[0].severity).toBe('medium');
    });

    test('should not flag secure same-domain forms', () => {
      const secureForms = [
        {
          action: 'https://same-site.com/login',
          method: 'post',
          querySelector: jest.fn().mockReturnValue({ type: 'password' })
        },
        {
          action: '/relative/path/submit',
          method: 'post',
          querySelector: jest.fn().mockReturnValue({ type: 'email' })
        }
      ];

      const issues = detectInsecureForms(secureForms as any, 'https://same-site.com');
      
      expect(issues).toHaveLength(0);
    });
  });

  describe('detectSuspiciousScripts', () => {
    test('should detect scripts from suspicious domains', () => {
      const suspiciousScripts = [
        { src: 'http://malicious-cdn.tk/script.js' },
        { src: 'https://suspicious-analytics.ml/track.js' },
        { src: 'javascript:document.location="http://evil.com"' }
      ];

      const issues = detectSuspiciousScripts(suspiciousScripts as any);
      
      expect(issues.length).toBeGreaterThan(0);
      expect(issues.some((issue: any) => issue.type === 'suspicious_script')).toBe(true);
    });

    test('should detect inline scripts with suspicious content', () => {
      const inlineScripts = [
        { 
          src: '',
          textContent: 'document.location = "http://phishing-site.com"',
          innerHTML: 'document.location = "http://phishing-site.com"'
        },
        {
          src: '',
          textContent: 'eval(atob("bWFsaWNpb3VzIGNvZGU="))',
          innerHTML: 'eval(atob("bWFsaWNpb3VzIGNvZGU="))'
        }
      ];

      const issues = detectSuspiciousScripts(inlineScripts as any);
      
      expect(issues.length).toBeGreaterThan(0);
      expect(issues.some((issue: any) => issue.description.includes('redirect'))).toBe(true);
      expect(issues.some((issue: any) => issue.description.includes('obfuscated'))).toBe(true);
    });

    test('should not flag legitimate scripts', () => {
      const legitimateScripts = [
        { src: 'https://cdn.jsdelivr.net/npm/react@17/umd/react.production.min.js' },
        { src: 'https://www.google-analytics.com/analytics.js' },
        { src: '/js/app.js' }
      ];

      const issues = detectSuspiciousScripts(legitimateScripts as any);
      
      expect(issues).toHaveLength(0);
    });
  });

  describe('detectPhishingIndicators', () => {
    test('should detect common phishing keywords', () => {
      const elementsWithPhishingText = [
        { textContent: 'Urgent! Your account will be suspended!', tagName: 'DIV' },
        { textContent: 'Click here to verify your PayPal account', tagName: 'P' },
        { textContent: 'You have won $1,000,000! Claim now!', tagName: 'H1' },
        { textContent: 'Security alert: Login required immediately', tagName: 'SPAN' }
      ];

      const issues = detectPhishingIndicators(elementsWithPhishingText as any);
      
      expect(issues.length).toBeGreaterThan(0);
      expect(issues.some((issue: any) => issue.type === 'phishing_language')).toBe(true);
    });

    test('should detect suspicious urgency language', () => {
      const urgentElements = [
        { textContent: 'Act now or lose access forever!', tagName: 'P' },
        { textContent: 'Limited time offer - expires in 5 minutes!', tagName: 'DIV' },
        { textContent: 'Immediate action required!', tagName: 'H2' }
      ];

      const issues = detectPhishingIndicators(urgentElements as any);
      
      expect(issues.length).toBeGreaterThan(0);
      expect(issues.every((issue: any) => issue.severity === 'medium' || issue.severity === 'high')).toBe(true);
    });

    test('should not flag normal business language', () => {
      const normalElements = [
        { textContent: 'Welcome to our website', tagName: 'H1' },
        { textContent: 'Contact us for more information', tagName: 'P' },
        { textContent: 'Our products and services', tagName: 'DIV' }
      ];

      const issues = detectPhishingIndicators(normalElements as any);
      
      expect(issues).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    test('should handle empty DOM gracefully', () => {
      mockDocument.querySelectorAll.mockReturnValue([]);
      
      const result = analyzePageContent(mockDocument as any, mockWindow as any);
      
      expect(result).toBeDefined();
      expect(result.issues).toHaveLength(0);
      expect(result.riskLevel).toBe('low');
    });

    test('should handle malformed URLs in forms', () => {
      const malformedForms = [
        {
          action: 'not-a-valid-url',
          method: 'post',
          querySelector: jest.fn().mockReturnValue({ type: 'password' })
        }
      ];

      expect(() => {
        detectInsecureForms(malformedForms as any, 'https://example.com');
      }).not.toThrow();
    });

    test('should handle missing attributes gracefully', () => {
      const elementsWithMissingAttrs = [
        { src: undefined, textContent: undefined },
        { action: null, method: undefined }
      ];

      expect(() => {
        detectSuspiciousScripts([elementsWithMissingAttrs[0]] as any);
        detectInsecureForms([elementsWithMissingAttrs[1]] as any, 'https://example.com');
      }).not.toThrow();
    });
  });
}); 