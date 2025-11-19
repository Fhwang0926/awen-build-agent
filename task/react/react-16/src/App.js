import React, { Component } from 'react';
import './App.css';

// React 16 - Class Component Example
class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      count: 0,
      message: 'Hello from React 16!'
    };
  }

  increment = () => {
    this.setState({ count: this.state.count + 1 });
  }

  decrement = () => {
    this.setState({ count: this.state.count - 1 });
  }

  reset = () => {
    this.setState({ count: 0 });
  }

  componentDidMount() {
    console.log('React 16: Component mounted');
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <h1>🚀 React 16 Sample Application</h1>
          <p className="version-badge">React Version 16.14.0</p>
          <p>Welcome to the React 16 build agent test application!</p>
          
          <div className="counter-section">
            <h2>Counter Demo (Class Component)</h2>
            <p className="counter-display">Count: {this.state.count}</p>
            <div className="button-group">
              <button onClick={this.increment}>Increment</button>
              <button onClick={this.decrement}>Decrement</button>
              <button onClick={this.reset}>Reset</button>
            </div>
          </div>

          <div className="info-section">
            <h3>React 16 Features</h3>
            <ul>
              <li>✓ Class Components</li>
              <li>✓ Lifecycle Methods</li>
              <li>✓ Error Boundaries</li>
              <li>✓ Fragments</li>
              <li>✓ Portals</li>
              <li>✓ Context API</li>
            </ul>
          </div>

          <div className="info-section">
            <h3>Build Information</h3>
            <ul>
              <li>Framework: React 16.14.0</li>
              <li>Build Tool: react-scripts 4.0.3</li>
              <li>Component Type: Class Component</li>
              <li>Status: Ready for deployment</li>
            </ul>
          </div>
        </header>
      </div>
    );
  }
}

export default App;



