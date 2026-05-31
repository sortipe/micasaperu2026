import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { unregister } from './unregisterServiceWorker';
import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

unregister();

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
  console.debug(`[RUM] ${metric.name}: ${metric.value.toFixed(0)} (${metric.rating})`);
}

onCLS(sendToAnalytics);
onFCP(sendToAnalytics);
onINP(sendToAnalytics);
onLCP(sendToAnalytics);
onTTFB(sendToAnalytics);

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
        }
        observer.unobserve(img);
      }
    });
  });
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('img[loading="lazy"]').forEach(img => observer.observe(img));
  });
}
