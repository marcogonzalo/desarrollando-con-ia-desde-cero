import React from 'react';
import { createRoot } from 'react-dom/client';
import Warning from './WarningComponent';
import { ContentAnalysisResult } from '../lib/contentAnalysis';

// Get threat information from URL parameters
function getThreatInfoFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  
  const threat = {
    type: urlParams.get('type') as 'api' | 'pattern' | 'content' || 'content',
    severity: urlParams.get('severity') as 'high' | 'medium' | 'low' || 'medium',
    details: urlParams.get('details') || '',
    url: urlParams.get('url') || ''
  };

  // Try to get content analysis from sessionStorage
  let contentAnalysis: ContentAnalysisResult | undefined;
  try {
    const stored = sessionStorage.getItem('contentAnalysis');
    if (stored) {
      contentAnalysis = JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error parsing content analysis:', error);
  }

  return { threat, contentAnalysis };
}

function WarningApp() {
  const { threat, contentAnalysis } = getThreatInfoFromURL();

  const handleProceed = () => {
    // Get the original URL and redirect
    const originalUrl = threat.url || new URLSearchParams(window.location.search).get('url');
    if (originalUrl) {
      // Clear the warning data
      sessionStorage.removeItem('contentAnalysis');
      
      // Navigate to the original URL
      window.location.href = originalUrl;
    } else {
      // Fallback: close the warning page
      window.close();
    }
  };

  const handleGoBack = () => {
    // Clear the warning data
    sessionStorage.removeItem('contentAnalysis');
    
    // Go back in history or close
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.close();
    }
  };

  return (
    <Warning
      threat={threat}
      contentAnalysis={contentAnalysis}
      onProceed={handleProceed}
      onGoBack={handleGoBack}
    />
  );
}

// Initialize the app
const container = document.getElementById('warning-root');
if (container) {
  const root = createRoot(container);
  root.render(<WarningApp />);
} else {
  console.error('Warning root element not found');
} 
              ))}
            </ul>
          </div>

          {/* Details Section */}
          {(contentAnalysis?.issues.length || 0) > 0 && (
            <div className="mb-6">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-3"
              >
                {showDetails ? 'Ocultar' : 'Mostrar'} detalles técnicos
              </button>
              
              {showDetails && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <h3 className="font-medium mb-3">Problemas de Seguridad Detectados:</h3>
                  <ul className="space-y-2">
                    {contentAnalysis?.issues.map((issue, index) => (
                      <li key={index} className="text-sm">
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
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleGoBack}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
              disabled={userChoice !== 'none'}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver Atrás (Recomendado)
            </button>
            
            {threatLevel !== 'high' && (
              <button
                onClick={handleProceed}
                className={`flex-1 ${colors.button} text-white font-medium py-3 px-6 rounded-lg transition-colors`}
                disabled={userChoice !== 'none'}
              >
                Continuar Bajo Mi Riesgo
              </button>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Protegido por Safe Browse Guard • 
              Esta advertencia te ayuda a navegar de forma más segura
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Warning; 