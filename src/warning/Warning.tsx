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