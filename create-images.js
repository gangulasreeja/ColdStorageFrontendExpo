const fs = require('fs');
const path = require('path');

// Create a simple 1x1 transparent PNG (smallest valid PNG)
const pngData = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

// Ensure assets directory exists
const assetsDir = path.join(__dirname, 'assets');
const imagesDir = path.join(assetsDir, 'images');

if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir);
}
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir);
}

// Write placeholder images
const files = [
  'icon.png',
  'favicon.png',
  'splash-icon.png',
  'android-icon-foreground.png',
  'android-icon-background.png',
  'android-icon-monochrome.png'
];

files.forEach(file => {
  const filePath = path.join(imagesDir, file);
  fs.writeFileSync(filePath, pngData);
  console.log('Created:', file);
});

console.log('All placeholder images created!');