import { useState, useEffect } from 'react';
import './App.css';

// React 17 - Hooks with new JSX Transform (no need to import React)
function App() {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    console.log('React 17: Component mounted with Hooks');
    setMessage('Hello from React 17!');
  }, []);

  const increment = () => setCount(count + 1);
  const decrement = () => setCount(count - 1);
  const reset = () => setCount(0);

  return (
    <div className="App">
      <header className="App-header">
        <h1>🚀 React 17 Sample Application</h1>
        <p className="version-badge">React Version 17.0.2</p>
        <p>Welcome to the React 17 build agent test application!</p>
        
        <div className="counter-section">
          <h2>Counter Demo (Hooks)</h2>
          <p className="counter-display">Count: {count}</p>
          <div className="button-group">
            <button onClick={increment}>Increment</button>
            <button onClick={decrement}>Decrement</button>
            <button onClick={reset}>Reset</button>
          </div>
        </div>

        <div className="message-section">
          <h3>Dynamic Message</h3>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="message-input"
          />
          <p className="message-display">{message || 'No message yet'}</p>
        </div>

        <div className="info-section">
          <h3>React 17 Features</h3>
          <ul>
            <li>✓ New JSX Transform (no React import needed)</li>
            <li>✓ Event Delegation Changes</li>
            <li>✓ No Event Pooling</li>
            <li>✓ Effect Cleanup Timing</li>
            <li>✓ Consistent Errors for Returning Undefined</li>
            <li>✓ Native Component Stacks</li>
          </ul>
        </div>

        <div className="info-section">
          <h3>Build Information</h3>
          <ul>
            <li>Framework: React 17.0.2</li>
            <li>Build Tool: react-scripts 5.0.1</li>
            <li>Component Type: Function Component with Hooks</li>
            <li>JSX Transform: New (automatic)</li>
            <li>Status: Ready for deployment</li>
          </ul>
        </div>
      </header>
    </div>
  );
}

export default App;



