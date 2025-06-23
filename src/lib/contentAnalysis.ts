export interface SecurityIssue {
  type: 'insecure_iframe' | 'insecure_form' | 'cross_domain_form' | 'suspicious_script' | 'phishing_language' | 'malicious_script' | 'suspicious_form_fields';
  severity: 'high' | 'medium' | 'low';
  description: string;
  element: string;
  details?: string;
}

export interface ContentAnalysisResult {
  riskLevel: 'high' | 'medium' | 'low';
  score: number; // 0-100, higher is safer
  issues: SecurityIssue[];
  timestamp: number;
  url: string;
}

// Suspicious TLDs for iframe/script analysis
const SUSPICIOUS_TLDS = ['tk', 'ml', 'ga', 'cf', 'pw', 'top', 'click', 'download', 'zip', 'exe'];

// Trusted domains for iframes and scripts
const TRUSTED_DOMAINS = [
  'youtube.com', 'google.com', 'googleapis.com', 'gstatic.com',
  'facebook.com', 'twitter.com', 'instagram.com', 'linkedin.com',
  'cloudflare.com', 'jsdelivr.net', 'unpkg.com', 'cdnjs.cloudflare.com',
  'maps.google.com', 'docs.google.com', 'drive.google.com'
];

// Phishing keywords and patterns (English and Spanish) - More conservative patterns
const PHISHING_KEYWORDS = {
  urgent: ['act now urgent', 'expires immediately', 'urgent immediate action', 'deadline expires', 
           'actúa ahora urgente', 'expira inmediatamente', 'acción urgente inmediata', 'plazo vence'],
  security: ['account suspended verify', 'verify immediately blocked', 'security alert verify', 'unauthorized access verify',
            'cuenta suspendida verificar', 'verificar inmediatamente bloqueada', 'alerta seguridad verificar', 'acceso no autorizado verificar'],
  financial: ['you have won million', 'lottery winner selected', 'inheritance million claim', 'congratulations winner',
             'has ganado millón', 'ganador lotería seleccionado', 'herencia millón reclamar', 'felicidades ganador'],
  action: ['click here immediately', 'click now verify', 'download now urgent', 'install immediately',
          'haz clic inmediatamente', 'haga clic verificar', 'descargar urgente', 'instalar inmediatamente'],
  threats: ['account will be deleted', 'access will be blocked', 'legal action taken', 'arrest warrant issued',
           'cuenta será eliminada', 'acceso será bloqueado', 'acción legal tomada', 'orden arresto emitida']
};

// Suspicious script patterns
const SUSPICIOUS_SCRIPT_PATTERNS = [
  /document\.location\s*=\s*["']http/i,
  /window\.location\s*=\s*["']http/i,
  /location\.href\s*=\s*["']http/i,
  /eval\s*\(\s*atob\s*\(/i,
  /eval\s*\(\s*unescape\s*\(/i,
  /document\.write\s*\(\s*unescape\s*\(/i,
  /fromCharCode\s*\(/i,
  /String\.fromCharCode/i
];

// Suspicious form field patterns
const SUSPICIOUS_FORM_FIELDS = {
  // High risk fields (financial/identity)
  high: [
    // SSN patterns
    { pattern: /ssn|social.?security|social.?insurance/i, description: 'Social Security Number field' },
    { pattern: /sin.?number|insurance.?number/i, description: 'Social Insurance Number field' },
    
    // Credit card patterns
    { pattern: /cvv|cvc|card.?verification|security.?code/i, description: 'Credit card security code field' },
    { pattern: /credit.?card|card.?number|cc.?number/i, description: 'Credit card number field' },
    { pattern: /expir|exp.?date|expiry/i, description: 'Credit card expiration field' },
    
    // Banking patterns
    { pattern: /account.?number|bank.?account|routing.?number/i, description: 'Bank account information field' },
    { pattern: /pin.?code|pin.?number|atm.?pin/i, description: 'PIN code field' },
    { pattern: /sort.?code|swift.?code|iban/i, description: 'Banking identifier field' },
    
    // Identity theft patterns
    { pattern: /passport|driver.?license|license.?number/i, description: 'Government ID field' },
    { pattern: /tax.?id|ein.?number|vat.?number/i, description: 'Tax identification field' }
  ],
  
  // Medium risk fields (personal info)
  medium: [
    { pattern: /mother.?maiden|maiden.?name/i, description: 'Security question field' },
    { pattern: /birth.?date|date.?of.?birth|dob/i, description: 'Date of birth field' },
    { pattern: /first.?name.*last.?name.*middle/i, description: 'Full name with middle name combination' }
  ],
  
  // Field name/id patterns
  names: [
    // High risk field names/IDs
    'ssn', 'social-security', 'social_security', 'sin', 'cvv', 'cvc', 'cvv2', 'cid',
    'credit-card', 'creditcard', 'cc-number', 'card-number', 'cardnumber',
    'account-number', 'accountnumber', 'routing-number', 'routingnumber',
    'pin', 'pin-code', 'pincode', 'atm-pin', 'atmpin',
    'passport', 'driver-license', 'drivers-license', 'license-number',
    'tax-id', 'taxid', 'ein', 'vat-number', 'vatnumber'
  ]
};

/**
 * Analyze page content for security issues
 */
export function analyzePageContent(document: Document, window: Window): ContentAnalysisResult {
  const issues: SecurityIssue[] = [];
  const url = window.location.href;

  try {
    // Detect suspicious iframes
    const iframes = Array.from(document.querySelectorAll('iframe'));
    issues.push(...detectSuspiciousIframes(iframes));

    // Detect insecure forms
    const forms = Array.from(document.querySelectorAll('form'));
    issues.push(...detectInsecureForms(forms, url));
    
    // Detect suspicious form fields
    issues.push(...detectSuspiciousFormFields(forms));

    // Detect suspicious scripts
    const scripts = Array.from(document.querySelectorAll('script'));
    issues.push(...detectSuspiciousScripts(scripts));

    // Detect phishing indicators in text content
    const textElements = Array.from(document.querySelectorAll('p, div, span, h1, h2, h3, h4, h5, h6, a, button'));
    issues.push(...detectPhishingIndicators(textElements));

    // Calculate risk score and level
    const score = calculateRiskScore(issues);
    const riskLevel = determineRiskLevel(score, issues);

    return {
      riskLevel,
      score,
      issues,
      timestamp: Date.now(),
      url
    };

  } catch (error) {
    console.error('Error analyzing page content:', error);
    return {
      riskLevel: 'low',
      score: 100,
      issues: [],
      timestamp: Date.now(),
      url
    };
  }
}

/**
 * Detect suspicious iframes
 */
export function detectSuspiciousIframes(iframes: HTMLIFrameElement[]): SecurityIssue[] {
  const issues: SecurityIssue[] = [];

  for (const iframe of iframes) {
    const src = iframe.getAttribute('src') || iframe.src;
    
    if (!src || src === '') {
      continue;
    }

    try {
      // Check for javascript: protocol
      if (src.startsWith('javascript:')) {
        issues.push({
          type: 'insecure_iframe',
          severity: 'high',
          description: 'Iframe with JavaScript protocol detected',
          element: 'iframe',
          details: `Source: ${src.substring(0, 100)}`
        });
        continue;
      }

      // Check for HTTP protocol (insecure)
      if (src.startsWith('http://')) {
        issues.push({
          type: 'insecure_iframe',
          severity: 'high',
          description: 'Iframe loading content over insecure HTTP',
          element: 'iframe',
          details: `Source: ${src}`
        });
        continue;
      }

      // Check for suspicious TLDs
      const url = new URL(src, window.location.href);
      const hostname = url.hostname.toLowerCase();
      
      if (SUSPICIOUS_TLDS.some(tld => hostname.endsWith(`.${tld}`))) {
        issues.push({
          type: 'insecure_iframe',
          severity: 'medium',
          description: 'Iframe from suspicious domain',
          element: 'iframe',
          details: `Domain: ${hostname}`
        });
      }

    } catch (error) {
      // Invalid URL, but not necessarily dangerous
      continue;
    }
  }

  return issues;
}

/**
 * Detect insecure forms
 */
export function detectInsecureForms(forms: HTMLFormElement[], currentUrl: string): SecurityIssue[] {
  const issues: SecurityIssue[] = [];

  for (const form of forms) {
    // Ensure form has required methods for safety
    if (!form || typeof form.getAttribute !== 'function') {
      continue;
    }
    
    // Get explicit action attribute (not the computed form.action which always returns full URL)
    const explicitAction = form.getAttribute('action');
    const computedAction = form.action; // This is always a full URL
    const method = form.method?.toLowerCase();
    
    // Check if form has sensitive inputs
    const hasPasswordField = form.querySelector ? form.querySelector('input[type="password"]') : null;
    const hasEmailField = form.querySelector ? form.querySelector('input[type="email"]') : null;
    const hasSensitiveInput = hasPasswordField || hasEmailField;

    // Skip forms without sensitive inputs
    if (!hasSensitiveInput) {
      continue;
    }

    // Skip legitimate contact forms even if they have email fields
    if (isLegitimateContactForm(form)) {
      continue;
    }

    try {
      // Only check explicit actions, not default computed ones
      if (explicitAction) {
        // Check for HTTP submission (insecure)
        if (explicitAction.startsWith('http://')) {
          // Allow localhost for development
          if (!explicitAction.includes('localhost') && !explicitAction.includes('127.0.0.1')) {
            issues.push({
              type: 'insecure_form',
              severity: 'high',
              description: 'Form submitting sensitive data over insecure HTTP',
              element: 'form',
              details: `Action: ${explicitAction}`
            });
            continue;
          }
        }

        // Check for cross-domain submission
        if (explicitAction.startsWith('https://') || explicitAction.startsWith('http://')) {
          const currentDomain = new URL(currentUrl).hostname;
          const actionDomain = new URL(explicitAction, currentUrl).hostname;
          
          if (currentDomain !== actionDomain) {
            // Allow localhost for development
            if (!actionDomain.includes('localhost') && !actionDomain.includes('127.0.0.1')) {
              issues.push({
                type: 'cross_domain_form',
                severity: 'medium',
                description: 'Form submitting to different domain',
                element: 'form',
                details: `From: ${currentDomain} to: ${actionDomain}`
              });
            }
          }
        }
      }

    } catch (error) {
      // Invalid URL in action, skip
      continue;
    }
  }

  return issues;
}

/**
 * Check if a form appears to be a legitimate contact form
 */
function isLegitimateContactForm(form: HTMLFormElement): boolean {
  const inputs = Array.from(form.querySelectorAll('input, select, textarea'));
  const labels = Array.from(form.querySelectorAll('label'));
  
  // Get all text content from the form
  const allText = (form.textContent || '').toLowerCase();
  const labelTexts = labels.map(label => (label.textContent || '').toLowerCase());
  const inputNames = inputs.map(input => ((input as HTMLInputElement).name || '').toLowerCase());
  const inputPlaceholders = inputs.map(input => ((input as HTMLInputElement).placeholder || '').toLowerCase());
  
  // Contact form indicators
  const contactIndicators = [
    'contact', 'contacto', 'mensaje', 'message', 'consulta', 'inquiry',
    'soporte', 'support', 'ayuda', 'help', 'información', 'information'
  ];
  
  // Check if form has typical contact form fields
  const hasContactFields = inputNames.some(name => 
    ['name', 'nombre', 'email', 'correo', 'message', 'mensaje', 'subject', 'asunto'].includes(name)
  );
  
  // Check if form has contact-related text
  const hasContactText = contactIndicators.some(indicator => 
    allText.includes(indicator) || labelTexts.some(text => text.includes(indicator))
  );
  
  // Check if form has a message/textarea field (typical of contact forms)
  const hasTextArea = inputs.some(input => input.tagName.toLowerCase() === 'textarea');
  
  // Check for absence of financial fields
  const hasNoFinancialFields = !inputNames.some(name => 
    ['ssn', 'cvv', 'pin', 'account', 'credit', 'card', 'routing'].some(financial => name.includes(financial))
  );
  
  // Must have at least 2 indicators to be considered legitimate contact form
  const indicators = [hasContactFields, hasContactText, hasTextArea, hasNoFinancialFields];
  const positiveIndicators = indicators.filter(Boolean).length;
  
  return positiveIndicators >= 2;
}

/**
 * Detect suspicious form fields that may indicate phishing
 */
export function detectSuspiciousFormFields(forms: HTMLFormElement[]): SecurityIssue[] {
  const issues: SecurityIssue[] = [];

  for (const form of forms) {
    // Skip legitimate contact forms
    if (isLegitimateContactForm(form)) {
      continue;
    }

    const inputs = Array.from(form.querySelectorAll('input, select, textarea'));
    const labels = Array.from(form.querySelectorAll('label'));
    
    let suspiciousFieldCount = 0;
    const detectedFields: string[] = [];

    for (const input of inputs) {
      const element = input as HTMLInputElement;
      const name = element.name?.toLowerCase() || '';
      const id = element.id?.toLowerCase() || '';
      const placeholder = element.placeholder?.toLowerCase() || '';
      
      // Get associated label text
      let labelText = '';
      if (element.id) {
        const label = form.querySelector(`label[for="${element.id}"]`);
        labelText = label?.textContent?.toLowerCase() || '';
      }
      
      // Combine all text to analyze
      const allText = `${name} ${id} ${placeholder} ${labelText}`.toLowerCase();
      
      // Check high-risk patterns
      for (const fieldDef of SUSPICIOUS_FORM_FIELDS.high) {
        if (fieldDef.pattern.test(allText)) {
          suspiciousFieldCount++;
          detectedFields.push(fieldDef.description);
          
          issues.push({
            type: 'suspicious_form_fields',
            severity: 'high',
            description: `Highly suspicious form field detected: ${fieldDef.description}`,
            element: 'input',
            details: `Field: ${name || id || 'unnamed'} - ${fieldDef.description}`
          });
          break; // Only report one issue per field
        }
      }
      
      // Check medium-risk patterns
      for (const fieldDef of SUSPICIOUS_FORM_FIELDS.medium) {
        if (fieldDef.pattern.test(allText)) {
          suspiciousFieldCount++;
          detectedFields.push(fieldDef.description);
          
          issues.push({
            type: 'suspicious_form_fields',
            severity: 'medium',
            description: `Suspicious form field detected: ${fieldDef.description}`,
            element: 'input',
            details: `Field: ${name || id || 'unnamed'} - ${fieldDef.description}`
          });
          break;
        }
      }
      
      // Check exact field name matches
      const fieldName = name || id;
      if (fieldName && SUSPICIOUS_FORM_FIELDS.names.includes(fieldName)) {
        suspiciousFieldCount++;
        detectedFields.push(`Field name: ${fieldName}`);
        
        issues.push({
          type: 'suspicious_form_fields',
          severity: 'high',
          description: `Highly suspicious field name detected: ${fieldName}`,
          element: 'input',
          details: `Field name: ${fieldName}`
        });
      }
    }

    // If multiple suspicious fields detected, add summary issue
    if (suspiciousFieldCount >= 3) {
      issues.push({
        type: 'suspicious_form_fields',
        severity: 'high',
        description: `Form contains multiple suspicious fields (${suspiciousFieldCount} detected)`,
        element: 'form',
        details: `Detected fields: ${detectedFields.slice(0, 5).join(', ')}${detectedFields.length > 5 ? '...' : ''}`
      });
    }
  }

  return issues;
}

/**
 * Detect suspicious scripts
 */
export function detectSuspiciousScripts(scripts: HTMLScriptElement[]): SecurityIssue[] {
  const issues: SecurityIssue[] = [];

  for (const script of scripts) {
    const src = script.src;
    const content = script.textContent || script.innerHTML;

    // Check external scripts
    if (src) {
      try {
        // Check for HTTP protocol (insecure)
        if (src.startsWith('http://')) {
          issues.push({
            type: 'suspicious_script',
            severity: 'medium',
            description: 'Script loading over insecure HTTP',
            element: 'script',
            details: `Source: ${src}`
          });
          continue;
        }

        // Check for suspicious domains
        const url = new URL(src, window.location.href);
        const hostname = url.hostname.toLowerCase();
        
        // Skip trusted domains
        if (TRUSTED_DOMAINS.some(domain => hostname.includes(domain))) {
          continue;
        }

        // Check for suspicious TLDs
        if (SUSPICIOUS_TLDS.some(tld => hostname.endsWith(`.${tld}`))) {
          issues.push({
            type: 'suspicious_script',
            severity: 'high',
            description: 'Script from suspicious domain',
            element: 'script',
            details: `Domain: ${hostname}`
          });
        }

      } catch (error) {
        // Invalid URL, skip
        continue;
      }
    }

    // Check inline scripts
    if (content) {
      for (const pattern of SUSPICIOUS_SCRIPT_PATTERNS) {
        if (pattern.test(content)) {
          let description = 'Suspicious inline script detected';
          
          if (/location.*=.*http/i.test(content)) {
            description = 'Script attempting to redirect to external site';
          } else if (/eval.*atob|eval.*unescape/i.test(content)) {
            description = 'Script with obfuscated content detected';
          } else if (/fromCharCode/i.test(content)) {
            description = 'Script using character encoding obfuscation';
          }

          issues.push({
            type: 'malicious_script',
            severity: 'high',
            description,
            element: 'script',
            details: `Pattern: ${pattern.source}`
          });
          break; // Only report one issue per script
        }
      }
    }
  }

  return issues;
}

/**
 * Detect phishing indicators in text content
 */
export function detectPhishingIndicators(elements: Element[]): SecurityIssue[] {
  const issues: SecurityIssue[] = [];

  for (const element of elements) {
    const text = element.textContent?.toLowerCase() || '';
    
    if (text.length < 10) {
      continue; // Skip very short text
    }

    // Check for phishing keywords
    for (const [category, keywords] of Object.entries(PHISHING_KEYWORDS)) {
      for (const keyword of keywords) {
        if (text.includes(keyword.toLowerCase())) {
          const severity = category === 'threats' || category === 'urgent' ? 'high' : 
                          category === 'security' || category === 'action' ? 'medium' : 'low';
          
          issues.push({
            type: 'phishing_language',
            severity,
            description: `Suspicious ${category} language detected`,
            element: element.tagName.toLowerCase(),
            details: `Keyword: "${keyword}"`
          });
          
          // Only report one issue per element
          break;
        }
      }
      
      // Break if we found an issue for this element
      if (issues.length > 0 && issues[issues.length - 1].details?.includes(text.substring(0, 20))) {
        break;
      }
    }
  }

  return issues;
}

/**
 * Calculate risk score based on issues
 */
function calculateRiskScore(issues: SecurityIssue[]): number {
  let score = 100; // Start with perfect score
  
  for (const issue of issues) {
    switch (issue.severity) {
      case 'high':
        score -= 25;
        break;
      case 'medium':
        score -= 15;
        break;
      case 'low':
        score -= 5;
        break;
    }
  }
  
  return Math.max(0, score); // Don't go below 0
}

/**
 * Determine risk level based on score and issues
 */
function determineRiskLevel(score: number, issues: SecurityIssue[]): 'high' | 'medium' | 'low' {
  const hasHighSeverityIssue = issues.some(issue => issue.severity === 'high');
  const hasMediumSeverityIssue = issues.some(issue => issue.severity === 'medium');
  
  if (hasHighSeverityIssue || score < 50) {
    return 'high';
  }
  
  if (hasMediumSeverityIssue || score < 75) {
    return 'medium';
  }
  
  return 'low';
}

/**
 * Get security advice based on detected issues
 */
export function getSecurityAdvice(issues: SecurityIssue[]): string[] {
  const advice: string[] = [];
  const issueTypes = new Set(issues.map(issue => issue.type));

  if (issueTypes.has('insecure_form')) {
    advice.push('Evita ingresar información personal en formularios que no usan HTTPS');
    advice.push('Busca el ícono de candado en la barra de direcciones antes de enviar datos');
  }

  if (issueTypes.has('cross_domain_form')) {
    advice.push('Ten cuidado con formularios que envían datos a sitios externos');
    advice.push('Verifica que el sitio de destino sea legítimo antes de continuar');
  }

  if (issueTypes.has('suspicious_script') || issueTypes.has('malicious_script')) {
    advice.push('Esta página contiene scripts sospechosos que podrían ser maliciosos');
    advice.push('Considera salir de esta página y no descargar ningún archivo');
  }

  if (issueTypes.has('insecure_iframe')) {
    advice.push('La página contiene contenido inseguro de fuentes externas');
    advice.push('Evita interactuar con elementos que parezcan fuera de lugar');
  }

  if (issueTypes.has('phishing_language')) {
    advice.push('El texto de esta página usa lenguaje típico de estafas (phishing)');
    advice.push('Desconfía de ofertas que parecen demasiado buenas para ser verdad');
    advice.push('No hagas clic en enlaces sospechosos o urgentes');
  }

  if (issueTypes.has('suspicious_form_fields')) {
    advice.push('⚠️ PELIGRO: Esta página solicita información financiera o personal sensible');
    advice.push('🚫 NUNCA proporciones: SSN, CVV, PIN, números de cuenta bancaria');
    advice.push('🛡️ Los sitios legítimos NO solicitan esta información por formularios web');
    advice.push('📞 Si es de tu banco, llama directamente para verificar');
    advice.push('🔒 Verifica que la URL sea exactamente la correcta (sin caracteres extraños)');
  }

  // General advice if no specific issues
  if (advice.length === 0) {
    advice.push('La página parece segura, pero siempre mantén precaución');
    advice.push('Verifica la URL y busca el candado de seguridad');
  }

  return advice;
} 