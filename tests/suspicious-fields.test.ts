import { detectSuspiciousFormFields } from '../src/lib/contentAnalysis';

// Mock DOM environment
const createMockForm = (html: string): HTMLFormElement => {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.querySelector('form') as HTMLFormElement;
};

describe('detectSuspiciousFormFields', () => {
  beforeEach(() => {
    // Set up DOM
    document.body.innerHTML = '';
  });

  test('should detect SSN field', () => {
    const form = createMockForm(`
      <form>
        <input type="text" name="ssn" placeholder="XXX-XX-XXXX">
      </form>
    `);
    
    const issues = detectSuspiciousFormFields([form]);
    
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some(issue => 
      issue.description.includes('Social Security Number') ||
      issue.description.includes('ssn')
    )).toBe(true);
    expect(issues[0].severity).toBe('high');
  });

  test('should detect CVV field', () => {
    const form = createMockForm(`
      <form>
        <label for="cvv">CVV Code</label>
        <input type="password" id="cvv" name="cvv" maxlength="3">
      </form>
    `);
    
    const issues = detectSuspiciousFormFields([form]);
    
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some(issue => 
      issue.description.includes('security code') ||
      issue.description.includes('cvv')
    )).toBe(true);
    expect(issues[0].severity).toBe('high');
  });

  test('should detect bank account field', () => {
    const form = createMockForm(`
      <form>
        <input type="text" name="account_number" placeholder="Account Number">
      </form>
    `);
    
    const issues = detectSuspiciousFormFields([form]);
    
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some(issue => 
      issue.description.includes('Bank account') ||
      issue.description.includes('account_number')
    )).toBe(true);
    expect(issues[0].severity).toBe('high');
  });

  test('should detect PIN field', () => {
    const form = createMockForm(`
      <form>
        <label for="pin">PIN de tu tarjeta</label>
        <input type="password" id="pin" name="pin" maxlength="4">
      </form>
    `);
    
    const issues = detectSuspiciousFormFields([form]);
    
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some(issue => 
      issue.description.includes('PIN') ||
      issue.description.includes('pin')
    )).toBe(true);
    expect(issues[0].severity).toBe('high');
  });

  test('should detect multiple suspicious fields and create summary', () => {
    const form = createMockForm(`
      <form>
        <input type="text" name="ssn" placeholder="SSN">
        <input type="text" name="credit_card" placeholder="Credit Card">
        <input type="password" name="cvv" placeholder="CVV">
        <input type="text" name="pin" placeholder="PIN">
      </form>
    `);
    
    const issues = detectSuspiciousFormFields([form]);
    
    expect(issues.length).toBeGreaterThan(3); // Individual + summary
    expect(issues.some(issue => 
      issue.description.includes('multiple suspicious fields')
    )).toBe(true);
  });

  test('should detect mother maiden name field', () => {
    const form = createMockForm(`
      <form>
        <input type="text" name="mothers_maiden" placeholder="Mother's maiden name">
      </form>
    `);
    
    const issues = detectSuspiciousFormFields([form]);
    
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some(issue => 
      issue.description.includes('Security question')
    )).toBe(true);
    expect(issues[0].severity).toBe('medium');
  });

  test('should NOT detect normal contact fields', () => {
    const form = createMockForm(`
      <form>
        <input type="text" name="name" placeholder="Your name">
        <input type="email" name="email" placeholder="Email">
        <textarea name="message" placeholder="Message"></textarea>
      </form>
    `);
    
    const issues = detectSuspiciousFormFields([form]);
    
    expect(issues.length).toBe(0);
  });

  test('should detect fields by label text', () => {
    const form = createMockForm(`
      <form>
        <label for="field1">Social Security Number</label>
        <input type="text" id="field1" name="field1">
      </form>
    `);
    
    const issues = detectSuspiciousFormFields([form]);
    
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some(issue => 
      issue.description.includes('Social Security')
    )).toBe(true);
  });

  test('should detect fields by placeholder text', () => {
    const form = createMockForm(`
      <form>
        <input type="text" name="field1" placeholder="Enter your CVV code">
      </form>
    `);
    
    const issues = detectSuspiciousFormFields([form]);
    
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some(issue => 
      issue.description.includes('security code')
    )).toBe(true);
  });

  test('should handle forms with no inputs', () => {
    const form = createMockForm(`<form></form>`);
    
    const issues = detectSuspiciousFormFields([form]);
    
    expect(issues.length).toBe(0);
  });

  test('should handle empty forms array', () => {
    const issues = detectSuspiciousFormFields([]);
    
    expect(issues.length).toBe(0);
  });
}); 