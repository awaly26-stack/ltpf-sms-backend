import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// 1. Ajoute cet import pour enregistrer la PWA
import { registerSW } from 'virtual:pwa-register';

// 2. Enregistre le Service Worker (sw.js)
registerSW({ immediate: true });

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
    <App />
);