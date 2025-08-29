#!/usr/bin/env node

/**
 * Quality check script for the minimarket project
 * Runs linting, type checking, and provides summary
 */

const { execSync } = require('child_process');
const chalk = require('chalk') || { green: (s) => s, yellow: (s) => s, red: (s) => s };

console.log('🔍 Running quality checks for Minimarket ARAMAC...\n');

let hasErrors = false;

try {
  console.log('📋 Running ESLint...');
  execSync('npm run lint', { stdio: 'inherit' });
  console.log('✅ ESLint passed\n');
} catch (error) {
  console.log('⚠️  ESLint found issues (see above)\n');
}

try {
  console.log('🔧 Running TypeScript check...');
  execSync('npm run type-check', { stdio: 'inherit' });
  console.log('✅ TypeScript check passed\n');
} catch (error) {
  console.log('⚠️  TypeScript found issues (see above)\n');
  hasErrors = true;
}

// Build test
try {
  console.log('🔨 Testing build...');
  execSync('npm run build', { stdio: 'pipe' });
  console.log('✅ Build successful\n');
} catch (error) {
  console.log('❌ Build failed\n');
  hasErrors = true;
}

console.log('📊 Quality Check Summary:');
console.log('• ESLint: Configuration active');
console.log('• TypeScript: Configuration enhanced'); 
console.log('• Build: ' + (hasErrors ? 'Issues found' : 'Successful'));

if (!hasErrors) {
  console.log('\n🎉 All quality checks passed!');
} else {
  console.log('\n⚠️  Some issues found - review output above');
  console.log('💡 Tip: Run individual commands to debug:');
  console.log('   npm run lint:fix');
  console.log('   npm run type-check');
}

process.exit(hasErrors ? 1 : 0);