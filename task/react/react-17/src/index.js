import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';

// React 17 still uses ReactDOM.render but supports new JSX transform
ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);



