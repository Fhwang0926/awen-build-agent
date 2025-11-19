# HTML5 Static Application

A modern static website built with HTML5, CSS3 (compiled from SCSS), and vanilla JavaScript.

## 🎨 Features

- **Pure HTML5**: Semantic markup with modern HTML5 elements
- **SCSS Styling**: Organized and maintainable styles with SCSS preprocessor
- **Vanilla JavaScript**: Modern ES6+ JavaScript without frameworks
- **Responsive Design**: Mobile-first responsive layout
- **Interactive Components**: Counter, forms, navigation, and more
- **Modern UI**: Beautiful gradient designs and smooth animations
- **Multiple Pages**: Home and About pages with navigation

## 📁 Project Structure

```
task/html5/
├── src/
│   ├── index.html          # Main page
│   ├── about.html          # About page
│   ├── js/
│   │   ├── main.js         # Main JavaScript logic
│   │   └── app.js          # Additional app logic
│   ├── scss/
│   │   ├── main.scss       # Main styles and variables
│   │   └── components.scss # Component-specific styles
│   └── css/
│       └── fallback.css    # Fallback CSS if SCSS fails
├── dist/                   # Build output (generated)
├── build.js                # Build script
├── package.json
└── README.md
```

## 🚀 Build Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm

### Install Dependencies
```bash
npm install
```

### Development
```bash
# Compile SCSS and watch for changes
npm run watch

# Run development server
npm run dev
```

### Production Build
```bash
npm run build
```

This will:
1. Compile SCSS files to CSS in `dist/css/`
2. Copy HTML files to `dist/`
3. Copy JavaScript files to `dist/js/`
4. Organize all assets for deployment

### Build Output
The production-ready files will be in the `dist/` directory:
```
dist/
├── index.html
├── about.html
├── css/
│   ├── main.css
│   └── components.css
├── js/
│   ├── main.js
│   └── app.js
└── assets/
```

## 🎯 Build Agent Integration

This project is designed to work with the LLM build agent system:

- **Framework**: HTML5 + SCSS + Vanilla JS
- **Build Tool**: npm scripts + sass compiler
- **Output Directory**: `dist/`
- **Build Command**: `npm install && npm run build`

## 📦 Technologies Used

- **HTML5**: Semantic markup, forms, and modern elements
- **CSS3**: Flexbox, Grid, animations, and transitions
- **SCSS**: Variables, mixins, nesting, and modular styles
- **JavaScript (ES6+)**: Classes, modules, async/await, and modern APIs
- **Sass**: CSS preprocessor for maintainable styles

## 🎨 Components Included

1. **Navigation Bar**: Responsive navigation with mobile menu
2. **Hero Section**: Eye-catching hero with gradient background
3. **Counter Component**: Interactive counter with increment/decrement
4. **Features Grid**: Responsive grid layout showcasing features
5. **Contact Form**: Functional form with validation
6. **Footer**: Multi-column footer with links
7. **About Page**: Additional page demonstrating routing

## 🔧 Scripts

- `npm run build`: Compile SCSS and copy files to dist/
- `npm run watch`: Watch SCSS files for changes
- `npm run dev`: Build and start development server
- `npm run copy-files`: Copy HTML and JS files to dist/

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## 📝 Notes

- SCSS files are compiled to CSS during build
- All source files are in `src/` directory
- Production files are generated in `dist/` directory
- The build process is automated via npm scripts
- Includes fallback CSS if SCSS compilation fails

## 🚢 Deployment

After building, deploy the contents of the `dist/` directory to any static hosting service:
- Netlify
- Vercel
- GitHub Pages
- AWS S3
- Any web server

## 📄 License

This is a sample project for build agent testing.



