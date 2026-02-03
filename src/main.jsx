// src/main.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // ÚNICO BrowserRouter aquí
import App from './App.jsx'; // Importa el componente App
import './index.css'; // Tus estilos globales, si tienes
import 'bootstrap/dist/css/bootstrap.min.css'; // Estilos de Bootstrap
import './styles/seasonal-decorations.css'; // Decoraciones visuales de temporada
import ThemeProvider from './components/ThemeProvider.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter> {/* Envuelve toda la aplicación */}
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);