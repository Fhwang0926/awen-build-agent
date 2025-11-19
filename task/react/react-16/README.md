# React 16 Sample Application

This is a sample React 16 application using **Class Components** for testing the build agent.

## React 16 Features

- **Class Components**: Traditional React component pattern
- **Lifecycle Methods**: componentDidMount, componentDidUpdate, etc.
- **Error Boundaries**: Catch JavaScript errors in component tree
- **Fragments**: Return multiple elements without wrapper
- **Portals**: Render children into different DOM subtree
- **Context API**: Share data without prop drilling

## Build Instructions

### Install Dependencies
```bash
npm install
```

### Development Server
```bash
npm start
```

### Production Build
```bash
npm run build
```

The build output will be in the `build` directory.

## Build Agent Integration

- **Framework**: React 16.14.0
- **Build Tool**: react-scripts 4.0.3
- **Output Directory**: `build/`
- **Build Command**: `npm install && npm run build`
- **Component Pattern**: Class Components

## Key Differences from React 17/18

- Uses `ReactDOM.render()` instead of `createRoot()`
- Class components are the primary pattern
- No automatic JSX transform (requires React import)
- Legacy lifecycle methods still supported



