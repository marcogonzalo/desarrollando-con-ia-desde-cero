import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Switch } from '@/components/ui/switch';
import { 
  Shield, 
  AlertTriangle, 
  Settings, 
  Globe, 
  Search, 
  Download, 
  Upload,
  RotateCcw,
  Save,
  Bell
} from 'lucide-react';
import '../styles/globals.css';

interface OptionsConfig {
  // General settings
  isEnabled: boolean;
  showNotifications: boolean;
  showBadges: boolean;
  showWarningPage: boolean;
  
  // Detection methods
  useSafeBrowsing: boolean;
  usePatternAnalysis: boolean;
  useContentAnalysis: boolean;
  
  // URL Pattern Detection
  detectHomographs: boolean;
  detectSuspiciousTlds: boolean;
  detectSubdomainSpoofing: boolean;
  detectExcessiveLength: boolean;
  
  // Content Analysis
  detectInsecureForms: boolean;
  detectSuspiciousScripts: boolean;
  detectPhishingLanguage: boolean;
  detectInsecureIframes: boolean;
  
  // Advanced settings
  cacheTimeout: number; // minutes
  analysisDelay: number; // milliseconds
}

const DEFAULT_CONFIG: OptionsConfig = {
  isEnabled: true,
  showNotifications: true,
  showBadges: true,
  showWarningPage: true,
  useSafeBrowsing: true,
  usePatternAnalysis: true,
  useContentAnalysis: true,
  detectHomographs: true,
  detectSuspiciousTlds: true,
  detectSubdomainSpoofing: true,
  detectExcessiveLength: true,
  detectInsecureForms: true,
  detectSuspiciousScripts: true,
  detectPhishingLanguage: true,
  detectInsecureIframes: true,
  cacheTimeout: 5,
  analysisDelay: 100
};

const Options: React.FC = () => {
  const [config, setConfig] = useState<OptionsConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const result = await chrome.storage.local.get(['optionsConfig']);
      if (result.optionsConfig) {
        setConfig({ ...DEFAULT_CONFIG, ...result.optionsConfig });
      }
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async () => {
    setIsSaving(true);
    try {
      await chrome.storage.local.set({ optionsConfig: config });
      setSaveMessage('Configuración guardada correctamente');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error saving config:', error);
      setSaveMessage('Error al guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  const updateConfig = (key: keyof OptionsConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const resetConfig = () => {
    if (confirm('¿Estás seguro de que quieres restablecer toda la configuración a los valores predeterminados?')) {
      setConfig(DEFAULT_CONFIG);
    }
  };

  const exportConfig = () => {
    const dataStr = JSON.stringify(config, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'safe-browse-guard-config.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedConfig = JSON.parse(e.target?.result as string);
        setConfig({ ...DEFAULT_CONFIG, ...importedConfig });
        setSaveMessage('Configuración importada correctamente');
        setTimeout(() => setSaveMessage(''), 3000);
      } catch (error) {
        setSaveMessage('Error al importar la configuración: archivo inválido');
        setTimeout(() => setSaveMessage(''), 3000);
      }
    };
    reader.readAsText(file);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600 dark:text-gray-400">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  const SectionCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center space-x-2 mb-4">
        {icon}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );

  const ToggleOption: React.FC<{ 
    label: string; 
    description: string; 
    checked: boolean; 
    onChange: (checked: boolean) => void;
    disabled?: boolean;
  }> = ({ label, description, checked, onChange, disabled = false }) => (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <label className="text-sm font-medium text-gray-900 dark:text-white">
          {label}
        </label>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          {description}
        </p>
      </div>
      <Switch 
        checked={checked} 
        onCheckedChange={onChange}
        disabled={disabled}
      />
    </div>
  );

  const NumberInput: React.FC<{
    label: string;
    description: string;
    value: number;
    onChange: (value: number) => void;
    min: number;
    max: number;
    step?: number;
    suffix?: string;
  }> = ({ label, description, value, onChange, min, max, step = 1, suffix = '' }) => (
    <div>
      <label className="text-sm font-medium text-gray-900 dark:text-white">
        {label}
      </label>
      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 mb-2">
        {description}
      </p>
      <div className="flex items-center space-x-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step}
          className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        />
        {suffix && <span className="text-sm text-gray-600 dark:text-gray-400">{suffix}</span>}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold">Safe Browse Guard</h1>
              <p className="text-gray-600 dark:text-gray-400">Configuración de la extensión</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={saveConfig}
              disabled={isSaving}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md text-sm transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? 'Guardando...' : 'Guardar'}</span>
            </button>
          </div>
        </div>

        {saveMessage && (
          <div className={`mb-6 p-4 rounded-md text-sm ${
            saveMessage.includes('Error') 
              ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400' 
              : 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
          }`}>
            {saveMessage}
          </div>
        )}

        <div className="space-y-6">
          {/* General Configuration */}
          <SectionCard title="Configuración General" icon={<Settings className="h-5 w-5 text-blue-600" />}>
            <ToggleOption
              label="Activar Safe Browse Guard"
              description="Habilita o deshabilita completamente la extensión"
              checked={config.isEnabled}
              onChange={(checked) => updateConfig('isEnabled', checked)}
            />
            <ToggleOption
              label="Mostrar notificaciones"
              description="Muestra notificaciones del sistema cuando se detectan amenazas"
              checked={config.showNotifications}
              onChange={(checked) => updateConfig('showNotifications', checked)}
              disabled={!config.isEnabled}
            />
            <ToggleOption
              label="Mostrar badges en el icono"
              description="Muestra un indicador en el icono de la extensión según el estado de seguridad"
              checked={config.showBadges}
              onChange={(checked) => updateConfig('showBadges', checked)}
              disabled={!config.isEnabled}
            />
            <ToggleOption
              label="Mostrar página de advertencia"
              description="Redirige a una página de advertencia cuando se detecta un sitio peligroso"
              checked={config.showWarningPage}
              onChange={(checked) => updateConfig('showWarningPage', checked)}
              disabled={!config.isEnabled}
            />
          </SectionCard>

          {/* Detection Methods */}
          <SectionCard title="Métodos de Detección" icon={<Search className="h-5 w-5 text-green-600" />}>
            <ToggleOption
              label="Google Safe Browsing API"
              description="Verifica URLs contra la base de datos de amenazas de Google"
              checked={config.useSafeBrowsing}
              onChange={(checked) => updateConfig('useSafeBrowsing', checked)}
              disabled={!config.isEnabled}
            />
            <ToggleOption
              label="Análisis de patrones de URL"
              description="Detecta patrones sospechosos en nombres de dominio y URLs"
              checked={config.usePatternAnalysis}
              onChange={(checked) => updateConfig('usePatternAnalysis', checked)}
              disabled={!config.isEnabled}
            />
            <ToggleOption
              label="Análisis de contenido"
              description="Analiza el contenido de las páginas web en busca de elementos sospechosos"
              checked={config.useContentAnalysis}
              onChange={(checked) => updateConfig('useContentAnalysis', checked)}
              disabled={!config.isEnabled}
            />
          </SectionCard>

          {/* URL Pattern Detection */}
          <SectionCard title="Detección de Patrones de URL" icon={<Globe className="h-5 w-5 text-yellow-600" />}>
            <ToggleOption
              label="Ataques homográficos"
              description="Detecta caracteres Unicode similares usados para suplantar dominios"
              checked={config.detectHomographs}
              onChange={(checked) => updateConfig('detectHomographs', checked)}
              disabled={!config.isEnabled || !config.usePatternAnalysis}
            />
            <ToggleOption
              label="Dominios de primer nivel sospechosos"
              description="Detecta TLDs comúnmente usados para actividades maliciosas"
              checked={config.detectSuspiciousTlds}
              onChange={(checked) => updateConfig('detectSuspiciousTlds', checked)}
              disabled={!config.isEnabled || !config.usePatternAnalysis}
            />
            <ToggleOption
              label="Suplantación de subdominios"
              description="Detecta subdominios que intentan imitar sitios legítimos"
              checked={config.detectSubdomainSpoofing}
              onChange={(checked) => updateConfig('detectSubdomainSpoofing', checked)}
              disabled={!config.isEnabled || !config.usePatternAnalysis}
            />
            <ToggleOption
              label="URLs excesivamente largas"
              description="Detecta URLs sospechosamente largas que pueden ocultar su verdadero destino"
              checked={config.detectExcessiveLength}
              onChange={(checked) => updateConfig('detectExcessiveLength', checked)}
              disabled={!config.isEnabled || !config.usePatternAnalysis}
            />
          </SectionCard>

          {/* Content Analysis */}
          <SectionCard title="Análisis de Contenido" icon={<AlertTriangle className="h-5 w-5 text-red-600" />}>
            <ToggleOption
              label="Formularios inseguros"
              description="Detecta formularios que solicitan información sensible de forma insegura"
              checked={config.detectInsecureForms}
              onChange={(checked) => updateConfig('detectInsecureForms', checked)}
              disabled={!config.isEnabled || !config.useContentAnalysis}
            />
            <ToggleOption
              label="Scripts sospechosos"
              description="Detecta scripts de JavaScript que podrían ser maliciosos"
              checked={config.detectSuspiciousScripts}
              onChange={(checked) => updateConfig('detectSuspiciousScripts', checked)}
              disabled={!config.isEnabled || !config.useContentAnalysis}
            />
            <ToggleOption
              label="Lenguaje de phishing"
              description="Detecta texto que usa técnicas comunes de phishing y ingeniería social"
              checked={config.detectPhishingLanguage}
              onChange={(checked) => updateConfig('detectPhishingLanguage', checked)}
              disabled={!config.isEnabled || !config.useContentAnalysis}
            />
            <ToggleOption
              label="Iframes inseguros"
              description="Detecta iframes que cargan contenido de fuentes no confiables"
              checked={config.detectInsecureIframes}
              onChange={(checked) => updateConfig('detectInsecureIframes', checked)}
              disabled={!config.isEnabled || !config.useContentAnalysis}
            />
          </SectionCard>

          {/* Advanced Settings */}
          <SectionCard title="Configuración Avanzada" icon={<Settings className="h-5 w-5 text-purple-600" />}>
            <NumberInput
              label="Tiempo de caché"
              description="Tiempo en minutos para mantener en caché los resultados de verificación"
              value={config.cacheTimeout}
              onChange={(value) => updateConfig('cacheTimeout', value)}
              min={1}
              max={60}
              suffix="minutos"
            />
            <NumberInput
              label="Retraso de análisis"
              description="Tiempo en milisegundos antes de analizar el contenido de una página"
              value={config.analysisDelay}
              onChange={(value) => updateConfig('analysisDelay', value)}
              min={0}
              max={5000}
              step={100}
              suffix="ms"
            />
          </SectionCard>

          {/* Configuration Management */}
          <SectionCard title="Gestión de Configuración" icon={<Download className="h-5 w-5 text-indigo-600" />}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={resetConfig}
                className="flex items-center justify-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Restablecer</span>
              </button>
              
              <button
                onClick={exportConfig}
                className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Exportar</span>
              </button>
              
              <label className="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm transition-colors cursor-pointer">
                <Upload className="h-4 w-4" />
                <span>Importar</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={importConfig}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Puedes exportar tu configuración para hacer una copia de seguridad o compartirla. 
              También puedes importar una configuración desde un archivo JSON.
            </p>
          </SectionCard>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Safe Browse Guard v1.0.0 - Protección de navegación en tiempo real
          </p>
        </div>
      </div>
    </div>
  );
};

// Renderizar el componente
const container = document.getElementById('options-root');
if (container) {
  const root = createRoot(container);
  root.render(<Options />);
} 