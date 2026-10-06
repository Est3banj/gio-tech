import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/design-tokens.css';
import './styles/seasonal-decorations.css';
import ThemeProvider from './components/ThemeProvider';
import { ThemeModeProvider } from './contexts/ThemeModeContext';
import { initAnalytics } from './services/analytics.loader';

// Trackers sólo con consentimiento explícito (stub de gtag siempre disponible).
initAnalytics();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <ThemeModeProvider>
          <App />
        </ThemeModeProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);
