import { detectSuspiciousFormFields } from '../src/lib/contentAnalysis';

// Mock DOM environment
const createMockForm = (html: string): HTMLFormElement => {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.querySelector('form') as HTMLFormElement;
};

describe('Contact Form Detection', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  test('should NOT detect legitimate contact form as suspicious', () => {
    const form = createMockForm(`
      <form id="contactForm">
        <div class="form-group">
          <label for="name">Nombre Completo</label>
          <input type="text" id="name" name="name" required>
        </div>
        
        <div class="form-group">
          <label for="email">Correo Electrónico</label>
          <input type="email" id="email" name="email" required>
        </div>
        
        <div class="form-group">
          <label for="company">Empresa (Opcional)</label>
          <input type="text" id="company" name="company">
        </div>
        
        <div class="form-group">
          <label for="subject">Asunto</label>
          <select id="subject" name="subject" required>
            <option value="">Selecciona un asunto</option>
            <option value="info">Información general</option>
            <option value="support">Soporte técnico</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="message">Mensaje</label>
          <textarea id="message" name="message" required 
                    placeholder="Escribe tu mensaje aquí..."></textarea>
        </div>
        
        <button type="submit">📤 Enviar Mensaje</button>
      </form>
    `);
    
    const issues = detectSuspiciousFormFields([form]);
    
    expect(issues.length).toBe(0);
  });

  test('should NOT detect contact form with "contacto" text', () => {
    const form = createMockForm(`
      <form>
        <h2>Formulario de Contacto</h2>
        <input type="text" name="nombre" placeholder="Tu nombre">
        <input type="email" name="correo" placeholder="Tu email">
        <textarea name="mensaje" placeholder="Tu mensaje"></textarea>
        <button type="submit">Contactar</button>
      </form>
    `);
    
    const issues = detectSuspiciousFormFields([form]);
    
    expect(issues.length).toBe(0);
  });

  test('should NOT detect support form', () => {
    const form = createMockForm(`
      <form>
        <p>Formulario de Soporte Técnico</p>
        <input type="text" name="name" placeholder="Nombre">
        <input type="email" name="email" placeholder="Email">
        <select name="issue_type">
          <option>Problema técnico</option>
          <option>Consulta</option>
        </select>
        <textarea name="description" placeholder="Describe tu problema"></textarea>
      </form>
    `);
    
    const issues = detectSuspiciousFormFields([form]);
    
    expect(issues.length).toBe(0);
  });

  test('should STILL detect phishing form with financial fields', () => {
    const form = createMockForm(`
      <form>
        <h2>Verificación de Cuenta</h2>
        <input type="text" name="name" placeholder="Nombre">
        <input type="email" name="email" placeholder="Email">
        <input type="text" name="ssn" placeholder="SSN">
        <input type="text" name="credit_card" placeholder="Tarjeta de crédito">
        <input type="password" name="cvv" placeholder="CVV">
      </form>
    `);
    
    const issues = detectSuspiciousFormFields([form]);
    
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some(issue => 
      issue.description.includes('Social Security') ||
      issue.description.includes('credit card') ||
      issue.description.includes('security code')
    )).toBe(true);
  });

  test('should NOT detect newsletter signup form', () => {
    const form = createMockForm(`
      <form>
        <h3>Suscríbete a nuestro newsletter</h3>
        <input type="email" name="email" placeholder="Tu email">
        <input type="text" name="name" placeholder="Tu nombre">
        <button type="submit">Suscribirse</button>
      </form>
    `);
    
    const issues = detectSuspiciousFormFields([form]);
    
    expect(issues.length).toBe(0);
  });

  test('should NOT detect inquiry form', () => {
    const form = createMockForm(`
      <form>
        <p>Envíanos tu consulta</p>
        <input type="text" name="full_name" placeholder="Nombre completo">
        <input type="email" name="email" placeholder="Email">
        <textarea name="inquiry" placeholder="Tu consulta"></textarea>
      </form>
    `);
    
    const issues = detectSuspiciousFormFields([form]);
    
    expect(issues.length).toBe(0);
  });

  test('should detect form requesting both contact info AND financial data', () => {
    const form = createMockForm(`
      <form>
        <p>Formulario de contacto</p>
        <input type="text" name="name" placeholder="Nombre">
        <input type="email" name="email" placeholder="Email">
        <textarea name="message" placeholder="Mensaje"></textarea>
        <!-- These should still be detected as suspicious -->
        <input type="text" name="account_number" placeholder="Número de cuenta">
        <input type="password" name="pin" placeholder="PIN">
      </form>
    `);
    
    const issues = detectSuspiciousFormFields([form]);
    
    // Should detect the financial fields even in a "contact" form
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some(issue => 
      issue.description.includes('account') || issue.description.includes('PIN')
    )).toBe(true);
  });
}); 