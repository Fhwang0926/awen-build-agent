const fs = require('fs');
const path = require('path');

// Create dist directory if it doesn't exist
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

// Create subdirectories
const dirs = ['css', 'js', 'images', 'assets'];
dirs.forEach(dir => {
    const dirPath = path.join(distDir, dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
});

// Copy HTML files
const copyFile = (src, dest) => {
    if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log(`✓ Copied: ${src} -> ${dest}`);
    }
};

// Copy files
copyFile(path.join(__dirname, 'src', 'index.html'), path.join(distDir, 'index.html'));
copyFile(path.join(__dirname, 'src', 'about.html'), path.join(distDir, 'about.html'));
copyFile(path.join(__dirname, 'src', 'js', 'main.js'), path.join(distDir, 'js', 'main.js'));
copyFile(path.join(__dirname, 'src', 'js', 'app.js'), path.join(distDir, 'js', 'app.js'));

// Copy CSS if exists (fallback)
const cssDir = path.join(__dirname, 'src', 'css');
if (fs.existsSync(cssDir)) {
    fs.readdirSync(cssDir).forEach(file => {
        if (file.endsWith('.css')) {
            copyFile(
                path.join(cssDir, file),
                path.join(distDir, 'css', file)
            );
        }
    });
}

console.log('\n✅ Build completed successfully!');
console.log(`📦 Output directory: ${distDir}`);



