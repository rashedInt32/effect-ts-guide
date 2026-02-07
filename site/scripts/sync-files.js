const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '..');
const targetDir = path.join(__dirname, 'public', 'learning-files');

// Files and directories to exclude
const excludePatterns = [
  'node_modules',
  'site',
  '.git',
  'bun.lock',
  'package.json',
  'tsconfig.json',
  'README.md',
  'LEARNING.md',
  '.gitignore'
];

function shouldExclude(itemPath) {
  const basename = path.basename(itemPath);
  return excludePatterns.some(pattern => 
    itemPath.includes(pattern) || basename === pattern || basename.startsWith('.')
  );
}

function copyFile(src, dest) {
  try {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    console.log(`✓ ${path.relative(sourceDir, src)}`);
  } catch (err) {
    console.error(`✗ Error copying ${src}:`, err.message);
  }
}

function syncDirectory(src, dest) {
  if (shouldExclude(src)) return;

  try {
    const items = fs.readdirSync(src);
    
    for (const item of items) {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      
      if (shouldExclude(srcPath)) continue;
      
      const stat = fs.statSync(srcPath);
      
      if (stat.isDirectory()) {
        syncDirectory(srcPath, destPath);
      } else if (item.endsWith('.ts')) {
        copyFile(srcPath, destPath);
      }
    }
  } catch (err) {
    console.error(`Error reading directory ${src}:`, err.message);
  }
}

console.log('🔄 Syncing TypeScript files to public/learning-files...\n');

// Ensure target directory exists
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Sync files
syncDirectory(sourceDir, targetDir);

console.log('\n✅ Sync complete!');
