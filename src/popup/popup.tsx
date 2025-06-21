import React, { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { createRoot } from 'react-dom/client';
import '../styles/globals.css';

interface PopupState {
  isEnabled: boolean;
  currentSiteStatus: 'safe' | 'warning' | 'danger' | 'unknown';
}

export const Popup: React.FC = () => {
  const [state, setState] = useState<PopupState>({
    isEnabled: true,
    currentSiteStatus: 'unknown',
  });

  useEffect(() => {
    // Load initial state from Chrome storage
    chrome.storage.local.get(['isEnabled', 'currentSiteStatus'], (result) => {
      setState({
        isEnabled: result.isEnabled ?? true,
        currentSiteStatus: result.currentSiteStatus ?? 'unknown',
      });
    });
  }, []);

  const handleToggle = (enabled: boolean) => {
    setState((prev) => ({ ...prev, isEnabled: enabled }));
    chrome.storage.local.set({ isEnabled: enabled });
  };

  const getStatusIcon = () => {
    switch (state.currentSiteStatus) {
      case 'safe':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
      case 'danger':
        return <AlertTriangle className="h-6 w-6 text-red-500" />;
      default:
        return <Shield className="h-6 w-6 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (state.currentSiteStatus) {
      case 'safe':
        return 'Sitio seguro';
      case 'warning':
        return 'Sitio sospechoso';
      case 'danger':
        return 'Sitio peligroso';
      default:
        return 'Listo para proteger';
    }
  };

  const getStatusDescription = () => {
    switch (state.currentSiteStatus) {
      case 'safe':
        return 'Este sitio es seguro';
      case 'warning':
        return 'Se detectaron elementos sospechosos';
      case 'danger':
        return 'Sitio peligroso detectado';
      default:
        return 'Verificación en tiempo real disponible pronto';
    }
  };

  return (
    <div className="popup-container p-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-blue-600" />
          <h1 className="text-lg font-semibold">
            Safe Browse Guard
          </h1>
        </div>
        <Switch checked={state.isEnabled} onCheckedChange={handleToggle} />
      </div>

      {state.isEnabled && (
        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
            {getStatusIcon()}
            <div>
              <p className="font-medium">
                {getStatusText()}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {getStatusDescription()}
              </p>
            </div>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Extensión configurada y lista
          </div>
        </div>
      )}

      {!state.isEnabled && (
        <div className="text-center py-4">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 dark:text-gray-300">
            Protección desactivada
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Activa el interruptor para proteger tu navegación
          </p>
        </div>
      )}
    </div>
  );
};

// Renderizar el componente
const container = document.getElementById('popup-root');
if (container) {
  const root = createRoot(container);
  root.render(<Popup />);
} 