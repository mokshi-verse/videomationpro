import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Add dev-mode class when running on localhost for better dev experience
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  document.documentElement.classList.add('dev-mode');
  document.body.style.background = '#0f172a';
  document.body.style.display = 'flex';
  document.body.style.alignItems = 'center';
  document.body.style.justifyContent = 'center';
  document.body.style.minHeight = '100vh';
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
