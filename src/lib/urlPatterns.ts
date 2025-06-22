export interface SuspiciousPattern {
  type: 'homograph' | 'suspicious_tld' | 'subdomain_spoofing' | 'excessive_length' | 'suspicious_keywords';
  severity: 'high' | 'medium' | 'low';
  description: string;
  url: string;
}

// Known brand names for spoofing detection
const BRAND_NAMES = [
  'google', 'amazon', 'paypal', 'microsoft', 'apple', 'facebook', 'twitter',
  'instagram', 'linkedin', 'github', 'stackoverflow', 'netflix', 'spotify',
  'dropbox', 'adobe', 'salesforce', 'oracle', 'ibm', 'intel', 'nvidia'
];

// Suspicious TLDs categorized by risk level
const SUSPICIOUS_TLDS = {
  high: ['exe', 'scr', 'bat', 'cmd', 'pif', 'zip', 'rar'],
  medium: ['tk', 'ml', 'ga', 'cf', 'pw', 'top', 'click', 'download']
};

// Common homograph character substitutions
const HOMOGRAPH_CHARS = {
  'a': ['а', 'α', '@'],  // Cyrillic a, Greek alpha
  'e': ['е', 'ε', '3'],  // Cyrillic e, Greek epsilon
  'o': ['о', 'ο', '0'],  // Cyrillic o, Greek omicron, zero
  'p': ['р', 'ρ'],       // Cyrillic p, Greek rho
  'c': ['с', 'ς'],       // Cyrillic c, Greek final sigma
  'x': ['х', 'χ'],       // Cyrillic x, Greek chi
  'y': ['у', 'γ'],       // Cyrillic y, Greek gamma
  'i': ['і', 'ι', '1', 'l', 'I'], // Cyrillic i, Greek iota, one, lowercase L, uppercase i
  'l': ['I', '1', 'і'], // uppercase I, one, Cyrillic i can look like l
  'm': ['rn'],           // rn can look like m
  'w': ['vv'],           // double v can look like w
  'n': ['ո'],            // Armenian o can look like n
};

/**
 * Detect all suspicious patterns in a URL
 */
export function detectSuspiciousPatterns(url: string): SuspiciousPattern[] {
  if (!url || typeof url !== 'string') {
    return [];
  }

  const patterns: SuspiciousPattern[] = [];

  try {
    // Check for homograph attacks
    const homographPattern = checkHomographAttack(url);
    if (homographPattern) {
      patterns.push(homographPattern);
    }

    // Check for suspicious TLDs
    const tldPattern = checkSuspiciousTLD(url);
    if (tldPattern) {
      patterns.push(tldPattern);
    }

    // Check for subdomain spoofing
    const subdomainPattern = checkSubdomainSpoofing(url);
    if (subdomainPattern) {
      patterns.push(subdomainPattern);
    }

    // Check for excessive URL length
    const lengthPattern = checkUrlLength(url);
    if (lengthPattern) {
      patterns.push(lengthPattern);
    }

  } catch (error) {
    console.error('Error detecting suspicious patterns:', error);
  }

  return patterns;
}

/**
 * Check for homograph attacks (character substitution)
 */
export function checkHomographAttack(url: string): SuspiciousPattern | null {
  try {
    const urlObj = new URL(url);
    
    // Extract hostname from original URL string BEFORE URL processing to preserve case and Unicode
    const urlHostname = url.split('://')[1]?.split('/')[0]?.split('?')[0]?.split('#')[0] || urlObj.hostname;
    let originalHostname = urlHostname;
    
    // Also handle Unicode characters that might be converted to Punycode
    if (/[^\x00-\x7F]/.test(urlHostname)) {
      originalHostname = urlHostname;
    }
    
    // Also handle case where URL object converted Unicode to Punycode
    // Try to detect common Unicode homographs in the original URL
    if (originalHostname.startsWith('xn--') && url.includes('://')) {
      const urlPart = url.split('://')[1]?.split('/')[0];
      if (urlPart && /[^\x00-\x7F]/.test(urlPart)) {
        originalHostname = urlPart;
      }
    }
    
    const hostname = originalHostname.toLowerCase();
    
    // Extended list of domains to check
    const allDomains = [
      ...BRAND_NAMES,
      'google', 'amazon', 'paypal', 'microsoft', 'apple', 'facebook', 'twitter'
    ];

    // Check for mixed scripts FIRST (different writing systems)
    if (hasMixedScripts(originalHostname)) {
      // Check if it's targeting a specific brand with mixed scripts
      for (const domain of allDomains) {
        // Create a version with all Unicode characters replaced by their ASCII equivalents
        let normalizedDomain = originalHostname.toLowerCase();
        for (const [original, substitutes] of Object.entries(HOMOGRAPH_CHARS)) {
          for (const substitute of substitutes) {
            // Only replace non-ASCII characters to avoid over-replacement
            if (substitute.charCodeAt(0) > 127) {
              normalizedDomain = normalizedDomain.replace(new RegExp(escapeRegExp(substitute), 'g'), original);
            }
          }
        }
        
        // Check if the normalized domain matches or contains a brand name
        if (normalizedDomain.includes(domain) || normalizedDomain.split('.')[0] === domain) {
          // Make sure it's not the legitimate domain
          const originalDomainPart = originalHostname.toLowerCase().split('.')[0];
          if (originalDomainPart !== domain) {
            return {
              type: 'homograph',
              severity: 'high',
              description: 'Domain contains mixed scripts that could be used for spoofing',
              url
            };
          }
        }
      }
    }

    // Special check for uppercase I that might be confused with lowercase l
    if (originalHostname.includes('I')) {
      const withReplacedI = originalHostname.replace(/I/g, 'l').toLowerCase();
      
      for (const domain of allDomains) {
        // Check exact match or close match
        if (withReplacedI === domain + '.com' || 
            withReplacedI.split('.')[0] === domain) {
          // Make sure the original hostname is NOT the legitimate domain
          const originalDomainPart = originalHostname.toLowerCase().split('.')[0];
          if (originalDomainPart !== domain) {
            return {
              type: 'homograph',
              severity: 'high',
              description: `Potential homograph attack: 'I' may be impersonating 'l' in '${domain}'`,
              url
            };
          }
        }
      }
    }

    // Check for common character substitutions
    for (const [original, substitutes] of Object.entries(HOMOGRAPH_CHARS)) {
      for (const substitute of substitutes) {
        if (hostname.includes(substitute)) {
          // Check if this creates a brand name lookalike
          const possibleBrand = hostname.replace(new RegExp(escapeRegExp(substitute), 'g'), original);
          
          // Check against all domains
          for (const domain of allDomains) {
            if (possibleBrand.includes(domain)) {
              // Make sure the original hostname is NOT the legitimate domain
              const originalDomainPart = hostname.split('.')[0];
              const possibleDomainPart = possibleBrand.split('.')[0];
              
              // Only flag if:
              // 1. The original domain part is different from the target domain
              // 2. The possible brand actually matches the domain exactly or contains it prominently
              if (originalDomainPart !== domain && 
                  (possibleDomainPart === domain || possibleDomainPart.includes(domain))) {
                return {
                  type: 'homograph',
                  severity: 'high',
                  description: `Potential homograph attack: '${substitute}' may be impersonating '${original}' in '${domain}'`,
                  url
                };
              }
            }
          }
          
          // Check for suspicious character substitutions in any domain (more permissive)
          if ((substitute === '0' && original === 'o') ||
              (substitute === 'rn' && original === 'm') ||
              (substitute === 'I' && original === 'i') ||
              (substitute === 'I' && original === 'l') ||
              (substitute === '1' && original === 'l') ||
              (substitute === '1' && original === 'i') ||
              (substitute === 'l' && original === 'i')) {
            // Flag if it looks like a real domain being spoofed
            if (hostname.length > 3 && hostname.includes('.')) {
              // Check if this could be spoofing a known domain
              const correctedDomain = possibleBrand.split('.')[0];
              
              // Only flag if the corrected version would be a known domain
              let shouldFlag = false;
              for (const domain of allDomains) {
                if (correctedDomain === domain || correctedDomain.includes(domain)) {
                  shouldFlag = true;
                  break;
                }
              }
              
              if (shouldFlag) {
                return {
                  type: 'homograph',
                  severity: 'high',
                  description: `Potential homograph attack: '${substitute}' may be impersonating '${original}'`,
                  url
                };
              }
            }
          }
        }
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Check for suspicious top-level domains
 */
export function checkSuspiciousTLD(url: string): SuspiciousPattern | null {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    const tld = hostname.split('.').pop() || '';

    if (SUSPICIOUS_TLDS.high.includes(tld)) {
      return {
        type: 'suspicious_tld',
        severity: 'high',
        description: `High-risk TLD '.${tld}' commonly used in malicious campaigns`,
        url
      };
    }

    if (SUSPICIOUS_TLDS.medium.includes(tld)) {
      return {
        type: 'suspicious_tld',
        severity: 'medium',
        description: `Suspicious TLD '.${tld}' often used for temporary or disposable domains`,
        url
      };
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Check for subdomain spoofing attempts
 */
export function checkSubdomainSpoofing(url: string): SuspiciousPattern | null {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    const parts = hostname.split('.');

    // Check if a brand name appears in the middle of the domain
    for (const brand of BRAND_NAMES) {
      // Check for brand.com.evil.com pattern
      const brandComPattern = `${brand}.com`;
      if (hostname.includes(brandComPattern) && !hostname.endsWith(brandComPattern)) {
        return {
          type: 'subdomain_spoofing',
          severity: 'high',
          description: `Potential subdomain spoofing: brand name '${brand}' appears in middle of domain`,
          url
        };
      }

      // Check for brand-related keywords in subdomains
      const brandPattern = new RegExp(`(^|[.-])${brand}([.-]|$)`, 'i');
      if (parts.length > 2 && brandPattern.test(hostname)) {
        const realDomain = parts.slice(-2).join('.');
        if (!realDomain.includes(brand)) {
          return {
            type: 'subdomain_spoofing',
            severity: 'high',
            description: `Suspicious subdomain containing brand name '${brand}' on unrelated domain`,
            url
          };
        }
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Check for excessively long URLs
 */
export function checkUrlLength(url: string): SuspiciousPattern | null {
  const HIGH_THRESHOLD = 2500;
  const MEDIUM_THRESHOLD = 1000;

  if (url.length > HIGH_THRESHOLD) {
    return {
      type: 'excessive_length',
      severity: 'high',
      description: `Extremely long URL (${url.length} characters) may be used to hide malicious content`,
      url
    };
  }

  if (url.length > MEDIUM_THRESHOLD) {
    return {
      type: 'excessive_length',
      severity: 'medium',
      description: `Long URL (${url.length} characters) may indicate suspicious activity`,
      url
    };
  }

  return null;
}

/**
 * Escape special regex characters
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Check if hostname contains mixed scripts (different writing systems)
 */
function hasMixedScripts(hostname: string): boolean {
  const scripts = new Set<string>();
  
  for (const char of hostname) {
    const code = char.charCodeAt(0);
    
    // Basic Latin
    if (code >= 0x0000 && code <= 0x007F) {
      scripts.add('latin');
    }
    // Cyrillic
    else if (code >= 0x0400 && code <= 0x04FF) {
      scripts.add('cyrillic');
    }
    // Greek
    else if (code >= 0x0370 && code <= 0x03FF) {
      scripts.add('greek');
    }
    // Arabic
    else if (code >= 0x0600 && code <= 0x06FF) {
      scripts.add('arabic');
    }
    // CJK (Chinese, Japanese, Korean)
    else if (code >= 0x4E00 && code <= 0x9FFF) {
      scripts.add('cjk');
    }
  }

  // If we have more than one script (excluding numbers and punctuation), it's mixed
  return scripts.size > 1;
}

/**
 * Get combined threat level from multiple patterns
 */
export function getCombinedThreatLevel(patterns: SuspiciousPattern[]): 'high' | 'medium' | 'low' | null {
  if (patterns.length === 0) {
    return null;
  }

  const hasHigh = patterns.some(p => p.severity === 'high');
  const hasMedium = patterns.some(p => p.severity === 'medium');

  if (hasHigh || patterns.length >= 3) {
    return 'high';
  }
  if (hasMedium || patterns.length >= 2) {
    return 'medium';
  }
  return 'low';
} 