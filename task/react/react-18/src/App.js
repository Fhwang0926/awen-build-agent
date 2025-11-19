import { useState, useEffect, useTransition, useDeferredValue } from 'react';
import './App.css';

// React 18 - Concurrent Features Demo
function App() {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState('');
  const [list, setList] = useState([]);
  const [isPending, startTransition] = useTransition();
  const deferredList = useDeferredValue(list);

  useEffect(() => {
    console.log('React 18: Component mounted with Concurrent Features');
    setMessage('Hello from React 18!');
  }, []);

  const increment = () => setCount(count + 1);
  const decrement = () => setCount(count - 1);
  const reset = () => setCount(0);

  // Demonstrate useTransition for non-urgent updates
  const handleGenerateList = () => {
    startTransition(() => {
      const newList = Array.from({ length: 100 }, (_, i) => `Item ${i + 1}`);
      setList(newList);
    });
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🚀 React 18 Sample Application</h1>
        <p className="version-badge">React Version 18.2.0 - Concurrent Mode</p>
        <p>Welcome to the React 18 build agent test application!</p>
        
        <div className="counter-section">
          <h2>Counter Demo (Hooks + Automatic Batching)</h2>
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

        <div className="transition-section">
          <h3>useTransition Demo</h3>
          <button 
            onClick={handleGenerateList}
            className="generate-btn"
            disabled={isPending}
          >
            {isPending ? 'Generating...' : 'Generate List (100 items)'}
          </button>
          {deferredList.length > 0 && (
            <div className="list-info">
              <p>Generated {deferredList.length} items</p>
              <p className="list-sample">First item: {deferredList[0]}</p>
            </div>
          )}
        </div>

        <div className="info-section">
          <h3>React 18 New Features</h3>
          <ul>
            <li>✓ Concurrent Rendering</li>
            <li>✓ Automatic Batching (everywhere)</li>
            <li>✓ useTransition Hook</li>
            <li>✓ useDeferredValue Hook</li>
            <li>✓ useId Hook</li>
            <li>✓ Suspense Improvements</li>
            <li>✓ Streaming SSR</li>
            <li>✓ New Root API (createRoot)</li>
          </ul>
        </div>

        <div className="info-section">
          <h3>Build Information</h3>
          <ul>
            <li>Framework: React 18.2.0</li>
            <li>Build Tool: react-scripts 5.0.1</li>
            <li>Component Type: Function Component with Hooks</li>
            <li>Rendering Mode: Concurrent</li>
            <li>Features: useTransition, useDeferredValue</li>
            <li>Status: Ready for deployment</li>
          </ul>
        </div>
      </header>
    </div>
  );
}

export default App;



