import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// React 18 uses createRoot (new concurrent rendering API)
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);



