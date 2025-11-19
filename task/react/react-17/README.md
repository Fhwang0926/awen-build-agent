# React 17 Sample Application

This is a sample React 17 application using **Function Components with Hooks** for testing the build agent.

## React 17 Features

- **New JSX Transform**: No need to import React in every file
- **Event Delegation Changes**: Events attach to root container instead of document
- **No Event Pooling**: Synthetic events are no longer pooled
- **Effect Cleanup Timing**: Cleanup runs asynchronously
- **Consistent Errors**: Returns undefined consistently throw errors
- **Native Component Stacks**: Better error messages with native stacks

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

- **Framework**: React 17.0.2
- **Build Tool**: react-scripts 5.0.1
- **Output Directory**: `build/`
- **Build Command**: `npm install && npm run build`
- **Component Pattern**: Function Components with Hooks

## Key Differences from React 16/18

### From React 16:
- New JSX transform (no React import needed in JSX files)
- Event delegation changes for better integration
- No event pooling for better performance

### From React 18:
- Uses `ReactDOM.render()` instead of `createRoot()`
- No concurrent features
- No automatic batching outside of React events
- No Suspense for data fetching

## Migration Path

React 17 is designed as a "stepping stone" release to make gradual upgrades easier. It includes no new developer-facing features but makes it easier to upgrade to React 18.



