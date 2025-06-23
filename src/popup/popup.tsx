import React, { useState, useEffect } from 'react';
import { Shield, Settings } from 'lucide-react';
import { createRoot } from 'react-dom/client';
import '../styles/globals.css';

// Force Tailwind to include these classes:
// text-green-600 bg-green-600 text-red-600 bg-red-600 border-green-400 border-red-400 text-green-700 text-red-700 bg-green-50 bg-red-50

interface PopupState {
  isEnabled: boolean;
  currentSiteStatus: 'safe' | 'warning' | 'danger' | 'unknown';
  activeTab: 'safety' | 'settings';
}

export const Popup: React.FC = () => {
  const [state, setState] = useState<PopupState>({
    isEnabled: true,
    currentSiteStatus: 'safe', // Simulando sitio seguro por defecto
    activeTab: 'safety',
  });

  useEffect(() => {
    // Load initial state from Chrome storage
    chrome.storage.local.get(['isEnabled'], (result) => {
      setState(prev => ({
        ...prev,
        isEnabled: result.isEnabled ?? true,
      }));
    });

    // Get current tab status from background script
    getCurrentTabStatus();
  }, []);

  const getCurrentTabStatus = () => {
    chrome.runtime.sendMessage({ action: 'getCurrentTabStatus' }, (response) => {
      if (response && response.status) {
        setState(prev => ({
          ...prev,
          currentSiteStatus: response.status
        }));
      }
    });
  };

  const handleToggle = (enabled: boolean) => {
    setState((prev) => ({ ...prev, isEnabled: enabled }));
    chrome.storage.local.set({ isEnabled: enabled });
  };

  const openOptionsPage = () => {
    chrome.runtime.openOptionsPage();
  };

  const getStatusConfig = () => {
    switch (state.currentSiteStatus) {
      case 'safe':
        return {
          bgColor: 'bg-green-600',
          textColor: 'text-green-600',
          messageClass: 'font-semibold',
          messageStyle: { color: '#16a34a' },
          message: 'Sitio web seguro',
          icon: (
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#16a34a' }}>
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )
        };
      case 'warning':
      case 'danger':
        return {
          bgColor: 'bg-red-600',
          textColor: 'text-red-600',
          messageClass: 'font-semibold',
          messageStyle: { color: '#dc2626' },
          message: 'Sitio web peligroso',
          icon: (
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#dc2626' }}>
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          )
        };
      default:
        return {
          bgColor: 'bg-blue-500',
          textColor: 'text-blue-500',
          messageClass: 'font-semibold',
          messageStyle: { color: '#3b82f6' },
          message: 'Analizando sitio web...',
          icon: (
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#3b82f6' }}>
              <Shield className="w-8 h-8 text-white" />
            </div>
          )
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <div className="w-80 bg-white text-gray-900 font-sans">
      {/* Hidden div to force Tailwind to include these classes */}
      <div className="hidden text-green-600 bg-green-600 text-red-600 bg-red-600 border-green-400 border-red-400 text-green-700 text-red-700 bg-green-50 bg-red-50"></div>
      {/* Header */}
      <div className="bg-blue-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-blue-900">
            Safe Browse Guard
          </h1>
        </div>
        <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
          <Shield className="w-4 h-4 text-white" />
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setState(prev => ({ ...prev, activeTab: 'safety' }))}
            className={`flex-1 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              state.activeTab === 'safety'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            Estado de Seguridad
          </button>
          <button
            onClick={() => setState(prev => ({ ...prev, activeTab: 'settings' }))}
            className={`flex-1 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              state.activeTab === 'settings'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            Configuración
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-8">
        {state.activeTab === 'safety' ? (
          <div className="text-center">
            {/* Status Icon */}
            <div className="flex justify-center">
              {statusConfig.icon}
            </div>

                         {/* Status Message */}
             <h2 className={`text-xl mb-6 ${statusConfig.messageClass}`} style={statusConfig.messageStyle}>
               {statusConfig.message}
             </h2>

                         {/* Additional Info for unsafe sites */}
             {state.currentSiteStatus !== 'safe' && state.currentSiteStatus !== 'unknown' && (
               <div className="rounded-lg p-4 mb-4 border-2" style={{ backgroundColor: '#fef2f2', borderColor: '#f87171' }}>
                 <p className="text-sm font-semibold mb-2" style={{ color: '#b91c1c' }}>
                   Detectamos riesgos de seguridad potenciales en este sitio web.
                 </p>
                 <p className="text-xs" style={{ color: '#dc2626' }}>
                   Evita ingresar información personal o procede con precaución.
                 </p>
               </div>
             )}

             {/* Safe site additional info */}
             {state.currentSiteStatus === 'safe' && (
               <div className="rounded-lg p-4 mb-4 border-2" style={{ backgroundColor: '#f0fdf4', borderColor: '#4ade80' }}>
                 <p className="text-sm font-semibold" style={{ color: '#15803d' }}>
                   Este sitio web ha sido verificado como seguro por nuestros sistemas.
                 </p>
               </div>
             )}

             {/* Re-scan button - moved to main view */}
             <div className="mt-4">
               <button
                 onClick={() => {
                   // Set to checking state
                   setState(prev => ({
                     ...prev,
                     currentSiteStatus: 'unknown'
                   }));
                   
                   // Request recheck from background script
                   chrome.runtime.sendMessage({ action: 'recheckCurrentTab' }, (response) => {
                     if (response && response.status) {
                       setState(prev => ({
                         ...prev,
                         currentSiteStatus: response.status
                       }));
                     }
                   });
                 }}
                 className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
               >
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                 </svg>
                 <span className="text-sm font-medium">Volver a Analizar</span>
               </button>
             </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Extension Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900 mb-1">Estado de Protección</h3>
                <p className="text-sm text-gray-600">
                  {state.isEnabled ? 'Extensión activada' : 'Extensión desactivada'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={state.isEnabled}
                  onChange={(e) => handleToggle(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <button
                onClick={openOptionsPage}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Settings className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">Configuración Avanzada</span>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Footer Info */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                Safe Browse Guard v1.0.0
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 

// Renderizar el componente
const container = document.getElementById('popup-root');
if (container) {
  const root = createRoot(container);
  root.render(<Popup />);
} 