# React Sample Applications - Version Comparison

This directory contains React sample applications for **three major versions**: React 16, 17, and 18.

## 📁 Directory Structure

```
task/react/
├── react-16/          # React 16.14.0 - Class Components
├── react-17/          # React 17.0.2 - Hooks + New JSX Transform
├── react-18/          # React 18.2.0 - Concurrent Features
└── README.md          # This file
```

## 🔍 Version Comparison

### React 16 (react-16/)
- **Version**: 16.14.0
- **Component Pattern**: Class Components
- **Key Features**:
  - Lifecycle methods (componentDidMount, etc.)
  - Error Boundaries
  - Fragments and Portals
  - Context API
- **Rendering**: `ReactDOM.render()`
- **JSX Transform**: Classic (requires React import)

### React 17 (react-17/)
- **Version**: 17.0.2
- **Component Pattern**: Function Components with Hooks
- **Key Features**:
  - New JSX Transform (no React import needed)
  - Event delegation changes
  - No event pooling
  - Effect cleanup timing improvements
- **Rendering**: `ReactDOM.render()`
- **JSX Transform**: New (automatic)

### React 18 (react-18/)
- **Version**: 18.2.0
- **Component Pattern**: Function Components with Hooks
- **Key Features**:
  - Concurrent Rendering
  - Automatic Batching (everywhere)
  - useTransition Hook
  - useDeferredValue Hook
  - Improved Suspense
- **Rendering**: `ReactDOM.createRoot()`
- **JSX Transform**: New (automatic)

## 🚀 Quick Start

### Build All Versions

```bash
# React 16
cd react-16
npm install && npm run build

# React 17
cd ../react-17
npm install && npm run build

# React 18
cd ../react-18
npm install && npm run build
```

### Development Mode

```bash
# Choose a version and run
cd react-16  # or react-17, react-18
npm install
npm start
```

## 📊 Feature Matrix

| Feature | React 16 | React 17 | React 18 |
|---------|----------|----------|----------|
| Class Components | ✅ Primary | ✅ Supported | ✅ Supported |
| Hooks | ✅ Available | ✅ Primary | ✅ Primary |
| New JSX Transform | ❌ | ✅ | ✅ |
| Concurrent Rendering | ❌ | ❌ | ✅ |
| Automatic Batching | ⚠️ Events only | ⚠️ Events only | ✅ Everywhere |
| useTransition | ❌ | ❌ | ✅ |
| useDeferredValue | ❌ | ❌ | ✅ |
| Suspense (Data) | ❌ | ⚠️ Limited | ✅ |
| Streaming SSR | ❌ | ❌ | ✅ |

## 🎯 Build Agent Integration

All versions are configured for the build agent:

- **Build Command**: `npm install && npm run build`
- **Output Directory**: `build/`
- **Build Tool**: react-scripts
- **Ready for Docker**: Yes

## 📝 When to Use Each Version

### Use React 16 if:
- Working with legacy codebases
- Need class component patterns
- Can't upgrade dependencies yet

### Use React 17 if:
- Migrating from React 16 to 18
- Want new JSX transform benefits
- Not ready for concurrent features

### Use React 18 if:
- Starting a new project
- Want best performance
- Need concurrent features
- Want latest React capabilities

## 🔄 Migration Path

```
React 16 → React 17 → React 18
  ↓          ↓          ↓
Classes   Hooks    Concurrent
```

1. **16 → 17**: Adopt hooks, use new JSX transform
2. **17 → 18**: Switch to createRoot, adopt concurrent features

## 📦 Build Output

Each version produces a `build/` directory with:
- Optimized production bundle
- Static HTML, CSS, and JS files
- Ready for deployment to any static host

## 🧪 Testing

Each version includes:
- Interactive counter component
- Dynamic state management
- Version-specific feature demos
- Build information display

## 📚 Additional Resources

- [React 16 Docs](https://16.reactjs.org/)
- [React 17 Blog Post](https://reactjs.org/blog/2020/10/20/react-v17.html)
- [React 18 Docs](https://react.dev/)

## 🤝 Contributing

These samples are designed for build agent testing. Each version demonstrates the key features and patterns of that React version.



