import React, { useState, useEffect } from 'react';
import { AlertTriangle, Shield, ArrowLeft, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { SecurityIssue, ContentAnalysisResult } from '../lib/contentAnalysis';

interface WarningProps {
  threat?: {
    type: 'api' | 'pattern' | 'content';
    severity: 'high' | 'medium' | 'low';
    details: string;
    url: string;
  };
  contentAnalysis?: ContentAnalysisResult;
  onProceed?: () => void;
  onGoBack?: () => void;
}

const Warning: React.FC<WarningProps> = ({ 
  threat, 
  contentAnalysis, 
  onProceed, 
  onGoBack 
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [userChoice, setUserChoice] = useState<'none' | 'proceed' | 'back'>('none');

  // Announce to screen readers when component loads
  useEffect(() => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'assertive');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = 'Advertencia de seguridad: Se ha detectado un sitio web potencialmente peligroso';
    document.body.appendChild(announcement);
    
    return () => {
      document.body.removeChild(announcement);
    };
  }, []);

  // Determine overall threat level
  const getThreatLevel = (): 'high' | 'medium' | 'low' => {
    if (threat?.severity === 'high' || contentAnalysis?.riskLevel === 'high') {
      return 'high';
    }
    if (threat?.severity === 'medium' || contentAnalysis?.riskLevel === 'medium') {
      return 'medium';
    }
    return 'low';
  };

  const threatLevel = getThreatLevel();

  // Get threat icon and colors
  const getThreatIcon = () => {
    const iconProps = { 
      className: "w-16 h-16",
      'aria-hidden': true
    };
    
    switch (threatLevel) {
      case 'high':
        return <XCircle {...iconProps} className={`${iconProps.className} text-red-500`} />;
      case 'medium':
        return <AlertCircle {...iconProps} className={`${iconProps.className} text-yellow-500`} />;
      case 'low':
        return <AlertTriangle {...iconProps} className={`${iconProps.className} text-orange-500`} />;
    }
  };

  const getThreatColors = () => {
    switch (threatLevel) {
      case 'high':
        return {
          bg: 'bg-red-50 dark:bg-red-950',
          border: 'border-red-200 dark:border-red-800',
          text: 'text-red-800 dark:text-red-200',
          button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
        };
      case 'medium':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-950',
          border: 'border-yellow-200 dark:border-yellow-800',
          text: 'text-yellow-800 dark:text-yellow-200',
          button: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
        };
      case 'low':
        return {
          bg: 'bg-orange-50 dark:bg-orange-950',
          border: 'border-orange-200 dark:border-orange-800',
          text: 'text-orange-800 dark:text-orange-200',
          button: 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500'
        };
    }
  };

  const colors = getThreatColors();

  // Get warning title
  const getWarningTitle = () => {
    switch (threatLevel) {
      case 'high':
        return 'PELIGRO: Sitio Web Malicioso Detectado';
      case 'medium':
        return 'PRECAUCIÓN: Sitio Web Sospechoso';
      case 'low':
        return 'AVISO: Elementos de Seguridad Detectados';
    }
  };

  // Get warning description
  const getWarningDescription = () => {
    if (threat) {
      switch (threat.type) {
        case 'api':
          return 'Este sitio web está en la base de datos de Google Safe Browsing como sitio malicioso.';
        case 'pattern':
          return 'La URL de este sitio web presenta patrones sospechosos típicos de sitios maliciosos.';
        case 'content':
          return 'El contenido de esta página presenta elementos de seguridad sospechosos.';
      }
    }
    
    if (contentAnalysis) {
      return 'El análisis del contenido de esta página ha detectado elementos de seguridad sospechosos.';
    }
    
    return 'Se han detectado posibles riesgos de seguridad en este sitio web.';
  };

  // Get security advice
  const getSecurityAdvice = (): string[] => {
    const advice: string[] = [];
    
    if (threat?.type === 'api') {
      advice.push('Este sitio está confirmado como malicioso por Google Safe Browsing');
      advice.push('NO ingreses información personal, contraseñas o datos financieros');
      advice.push('Cierra esta pestaña inmediatamente');
    } else if (threatLevel === 'high') {
      advice.push('NO ingreses información personal en este sitio');
      advice.push('NO descargues archivos de esta página');
      advice.push('Considera salir de este sitio inmediatamente');
    } else if (threatLevel === 'medium') {
      advice.push('Procede con extrema precaución');
      advice.push('Verifica la URL cuidadosamente');
      advice.push('No ingreses información sensible');
    } else {
      advice.push('Mantén precaución al navegar en este sitio');
      advice.push('Verifica que la URL sea correcta');
      advice.push('Busca el candado de seguridad en la barra de direcciones');
    }

    // Add content-specific advice
    if (contentAnalysis?.issues) {
      const issueTypes = new Set(contentAnalysis.issues.map(issue => issue.type));
      
      if (issueTypes.has('insecure_form')) {
        advice.push('Evita completar formularios que no usan HTTPS');
      }
      if (issueTypes.has('phishing_language')) {
        advice.push('El texto de esta página usa lenguaje típico de estafas');
      }
      if (issueTypes.has('suspicious_script')) {
        advice.push('La página contiene scripts de fuentes sospechosas');
      }
    }

    return advice;
  };

  const securityAdvice = getSecurityAdvice();

  const handleProceed = () => {
    setUserChoice('proceed');
    if (onProceed) {
      onProceed();
    }
  };

  const handleGoBack = () => {
    setUserChoice('back');
    if (onGoBack) {
      onGoBack();
    } else {
      window.history.back();
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Main Warning Card */}
        <main 
          className={`rounded-lg border-2 ${colors.border} ${colors.bg} p-8 shadow-lg`}
          role="main"
          aria-labelledby="warning-title"
          aria-describedby="warning-description"
        >
          {/* Header */}
          <div className="flex items-center justify-center mb-6" role="img" aria-label={`Icono de advertencia de nivel ${threatLevel}`}>
            {getThreatIcon()}
          </div>
          
          <div className="text-center mb-6">
            <h1 
              id="warning-title"
              className={`text-2xl font-bold mb-2 ${colors.text}`}
            >
              {getWarningTitle()}
            </h1>
            <p 
              id="warning-description"
              className={`text-lg ${colors.text}`}
            >
              {getWarningDescription()}
            </p>
          </div>

          {/* URL Display */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">URL detectada:</p>
            <p className="font-mono text-sm break-all" aria-label="URL del sitio web sospechoso">
              {threat?.url || contentAnalysis?.url || window.location.href}
            </p>
          </div>

          {/* Security Score */}
          {contentAnalysis && (
            <div className="mb-6" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={contentAnalysis.score} aria-label="Puntuación de seguridad">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Puntuación de Seguridad</span>
                <span className={`text-sm font-bold ${colors.text}`}>
                  {contentAnalysis.score}/100
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    contentAnalysis.score > 75 ? 'bg-green-500' :
                    contentAnalysis.score > 50 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${contentAnalysis.score}%` }}
                  aria-hidden="true"
                />
              </div>
            </div>
          )}

          {/* Security Advice */}
          <section className="mb-8" aria-labelledby="security-advice-title">
            <h2 id="security-advice-title" className="text-lg font-semibold mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2" aria-hidden="true" />
              Consejos de Seguridad
            </h2>
            <ul className="space-y-2" role="list">
              {securityAdvice.map((advice, index) => (
                <li key={index} className="flex items-start" role="listitem">
                  <CheckCircle className="w-4 h-4 mt-0.5 mr-2 text-green-500 flex-shrink-0" aria-hidden="true" />
                  <span className="text-sm">{advice}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Details Section */}
          {(contentAnalysis?.issues.length || 0) > 0 && (
            <section className="mb-6" aria-labelledby="technical-details-title">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                aria-expanded={showDetails}
                aria-controls="security-details"
                id="technical-details-title"
              >
                {showDetails ? 'Ocultar' : 'Mostrar'} detalles técnicos
              </button>
              
              {showDetails && (
                <div 
                  id="security-details"
                  className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4"
                  role="region"
                  aria-labelledby="technical-details-title"
                >
                  <h3 className="font-medium mb-3">Problemas de Seguridad Detectados:</h3>
                  <ul className="space-y-2" role="list">
                    {contentAnalysis?.issues.map((issue, index) => (
                      <li key={index} className="text-sm" role="listitem">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium mr-2 ${
                          issue.severity === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                          issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                        }`}>
                          {issue.severity.toUpperCase()}
                        </span>
                        {issue.description}
                        {issue.details && (
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 ml-2">
                            {issue.details}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3" role="group" aria-label="Opciones de navegación">
            <button
              onClick={handleGoBack}
              className="flex-1 bg-gray-600 hover:bg-gray-700 focus:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              disabled={userChoice !== 'none'}
              aria-describedby="back-button-description"
            >
              <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
              Volver Atrás (Recomendado)
            </button>
            <span id="back-button-description" className="sr-only">
              Opción recomendada: volver a la página anterior de forma segura
            </span>
            
            {threatLevel !== 'high' && (
              <>
                <button
                  onClick={handleProceed}
                  className={`flex-1 ${colors.button} text-white font-medium py-3 px-6 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2`}
                  disabled={userChoice !== 'none'}
                  aria-describedby="proceed-button-description"
                >
                  Continuar Bajo Mi Riesgo
                </button>
                <span id="proceed-button-description" className="sr-only">
                  Advertencia: continuar a este sitio puede exponer tu información personal a riesgos de seguridad
                </span>
              </>
            )}
          </div>

          {/* Footer */}
          <footer className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Protegido por Safe Browse Guard • 
              Esta advertencia te ayuda a navegar de forma más segura
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default Warning; 