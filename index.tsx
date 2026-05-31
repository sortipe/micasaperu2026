import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { registerServiceWorker, setupInstallPrompt } from './lib/pwa';
import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

registerServiceWorker();
setupInstallPrompt();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

function sendToAnalytics(metric: { name: string; value: number; rating: string }) {
  const body = {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    url: window.location.pathname,
    timestamp: Date.now(),
  };
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/vitals', JSON.stringify(body));
  }
}

onCLS(sendToAnalytics);
onFCP(sendToAnalytics);
onINP(sendToAnalytics);
onLCP(sendToAnalytics);
onTTFB(sendToAnalytics);
