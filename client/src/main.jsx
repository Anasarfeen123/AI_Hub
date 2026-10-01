import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter'
import '@fontsource-variable/jetbrains-mono'
import './styles/theme.css'
import './styles/contributions.css'
import './styles/login.css'
import './styles/features.css'
import './styles/community.css'
// Last, so its media queries override the base layout rules above.
import './styles/mobile.css'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)

// Installable + offline reading, in production only: in development a cached
// app would hide every code change.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

// Browsers that support installing (Chrome, Edge, Android) offer it through
// this event; it's kept so the account menu can show "Install app".
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  window.__aihubInstall = e;
  window.dispatchEvent(new Event("aihub:installable"));
});
