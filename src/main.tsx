import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// OAuth popup callback handler to extract tokens and close the popup instantly
if (window.opener && (window.location.hash.includes('access_token') || window.location.hash.includes('error'))) {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (accessToken && refreshToken) {
    window.opener.postMessage({ type: 'SUPABASE_AUTH_SUCCESS', accessToken, refreshToken }, '*');
  } else {
    window.opener.postMessage({ type: 'SUPABASE_AUTH_ERROR', error: params.get('error_description') || 'Authentication failed' }, '*');
  }
  window.close();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
