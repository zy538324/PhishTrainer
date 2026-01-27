// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '../index.css'; // Import global styles (from project root)

// Error boundary for production
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Application Error:', error, errorInfo);
    // In production, send to error tracking service (Sentry, LogRocket, etc.)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh',
          flexDirection: 'column',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <h1>Something went wrong</h1>
          <p>Please refresh the page or contact support if the problem persists.</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Initialize app
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found. Make sure there is a <div id="root"></div> in your HTML.');
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);



// Service Worker registration (for PWA support)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registered:', registration.scope);
      })
      .catch(error => {
        console.log('Service Worker registration failed:', error);
      });
  });
}
