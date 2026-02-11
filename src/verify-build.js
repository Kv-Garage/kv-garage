#!/usr/bin/env node
/**
 * Build Verification Script
 * Checks for common issues in the build output before deployment
 */

const fs = require('fs');
const path = require('path');

const BUILD_DIR = './_site';
const JS_FILES_DIR = path.join(BUILD_DIR, 'assets/js');

let hasErrors = false;

console.log('🔍 Verifying build output...\n');

// Check if build directory exists
if (!fs.existsSync(BUILD_DIR)) {
  console.error('❌ Error: Build directory not found!');
  process.exit(1);
}

// Check for export statements in JS files
console.log('Checking JavaScript files for export statements...');
const jsFiles = fs.readdirSync(JS_FILES_DIR).filter(file => file.endsWith('.js'));

jsFiles.forEach(file => {
  const filePath = path.join(JS_FILES_DIR, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check for actual export statements (not in comments)
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    // Skip comments
    if (line.trim().startsWith('//')) return;
    if (line.trim().startsWith('/*')) return;
    if (line.trim().startsWith('*')) return;
    
    // Check for export statements
    if (line.match(/^\s*export\s+/)) {
      console.error(`❌ Found export statement in ${file} at line ${index + 1}:`);
      console.error(`   ${line.trim()}`);
      hasErrors = true;
    }
  });
});

if (!hasErrors) {
  console.log('✅ No export statements found in JavaScript files\n');
}

// Check for required files
console.log('Checking for required files...');
const requiredFiles = [
  'assets/js/admin-dashboard.js',
  'assets/js/shared-admin-auth.js',
  'assets/js/auth-service.js',
  'assets/js/nav.js',
  // data files are optional in this build; uncomment if your pipeline outputs them
  // 'data/packs.json',
  // 'data/manifests.json'
];

requiredFiles.forEach(file => {
  const filePath = path.join(BUILD_DIR, file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Required file missing: ${file}`);
    hasErrors = true;
  } else {
    console.log(`✅ ${file}`);
  }
});

console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.error('❌ Build verification FAILED!');
  process.exit(1);
} else {
  console.log('✅ Build verification PASSED!');
  process.exit(0);
}
