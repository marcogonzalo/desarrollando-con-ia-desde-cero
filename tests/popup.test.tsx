import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Popup } from '../src/popup/popup';

// Mock Chrome APIs
const mockChromeStorage = {
  local: {
    get: jest.fn(),
    set: jest.fn(),
  },
};

(global as any).chrome = {
  storage: mockChromeStorage,
};

describe('Popup Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockChromeStorage.local.get.mockImplementation((keys, callback) => {
      callback({ isEnabled: true, currentSiteStatus: 'unknown' });
    });
  });

  test('renders popup with correct title', async () => {
    render(<Popup />);
    
    await waitFor(() => {
      expect(screen.getByText('Safe Browse Guard')).toBeInTheDocument();
    });
  });

  test('displays protection status when enabled', async () => {
    render(<Popup />);
    
    await waitFor(() => {
      expect(screen.getByText('Listo para proteger')).toBeInTheDocument();
    });
  });

  test('shows disabled state when protection is off', async () => {
    mockChromeStorage.local.get.mockImplementation((keys, callback) => {
      callback({ isEnabled: false, currentSiteStatus: 'unknown' });
    });

    render(<Popup />);
    
    await waitFor(() => {
      expect(screen.getByText('Protección desactivada')).toBeInTheDocument();
    });
  });

  test('toggles protection state', async () => {
    render(<Popup />);
    
    await waitFor(() => {
      const toggle = screen.getByRole('switch');
      fireEvent.click(toggle);
      expect(mockChromeStorage.local.set).toHaveBeenCalledWith({ isEnabled: false });
    });
  });

  test('displays correct status for safe site', async () => {
    mockChromeStorage.local.get.mockImplementation((keys, callback) => {
      callback({ isEnabled: true, currentSiteStatus: 'safe' });
    });

    render(<Popup />);
    
    await waitFor(() => {
      expect(screen.getByText('Sitio seguro')).toBeInTheDocument();
    });
  });

  test('displays correct status for dangerous site', async () => {
    mockChromeStorage.local.get.mockImplementation((keys, callback) => {
      callback({ isEnabled: true, currentSiteStatus: 'danger' });
    });

    render(<Popup />);
    
    await waitFor(() => {
      expect(screen.getByText('Sitio peligroso')).toBeInTheDocument();
    });
  });
}); 