# React 18 Sample Application

This is a sample React 18 application showcasing **Concurrent Features** for testing the build agent.

## React 18 New Features

### Concurrent Rendering
- **Automatic Batching**: Multiple state updates are batched automatically, even outside event handlers
- **Transitions**: Mark updates as non-urgent with `useTransition`
- **Suspense**: Better support for data fetching and code splitting

### New Hooks
- **useTransition**: Mark state updates as non-urgent transitions
- **useDeferredValue**: Defer updating a value to keep UI responsive
- **useId**: Generate unique IDs for accessibility attributes
- **useSyncExternalStore**: Subscribe to external stores
- **useInsertionEffect**: For CSS-in-JS libraries

### Other Improvements
- **New Root API**: `createRoot` instead of `render`
- **Streaming SSR**: Better server-side rendering with Suspense
- **Selective Hydration**: Hydrate parts of the page independently
- **Strict Mode**: Enhanced with double-invoking effects in development

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

- **Framework**: React 18.2.0
- **Build Tool**: react-scripts 5.0.1
- **Output Directory**: `build/`
- **Build Command**: `npm install && npm run build`
- **Component Pattern**: Function Components with Hooks
- **Rendering Mode**: Concurrent

## Concurrent Features Demo

This app demonstrates:

1. **useTransition**: Generate a large list without blocking the UI
2. **useDeferredValue**: Keep UI responsive during heavy updates
3. **Automatic Batching**: Multiple state updates batched everywhere

## Key Differences from React 16/17

### From React 16:
- New concurrent rendering engine
- `createRoot` API instead of `ReactDOM.render`
- Automatic batching everywhere
- New concurrent hooks

### From React 17:
- `createRoot` API for concurrent features
- Automatic batching outside React events
- useTransition and useDeferredValue hooks
- Better Suspense support
- Streaming SSR improvements

## Migration from React 17

1. Replace `ReactDOM.render` with `ReactDOM.createRoot`
2. Update to React 18 types if using TypeScript
3. Test with new Strict Mode behavior
4. Optionally adopt concurrent features (useTransition, Suspense)

## Performance Benefits

- **Faster rendering**: Concurrent rendering can interrupt and prioritize updates
- **Better UX**: Keep UI responsive during heavy computations
- **Automatic batching**: Fewer re-renders by default
- **Streaming SSR**: Faster time to interactive on server-rendered apps



