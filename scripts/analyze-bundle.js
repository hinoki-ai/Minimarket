#!/usr/bin/env node

/**
 * Bundle Analysis and Unused Code Detection Script
 * 
 * This script performs comprehensive bundle analysis including:
 * - Bundle size analysis
 * - Tree-shaking effectiveness
 * - Unused code detection
 * - Dependency analysis
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ANALYZE_DIR = path.join(process.cwd(), 'analyze');

/**
 * Ensure analyze directory exists
 */
function ensureAnalyzeDir() {
  if (!fs.existsSync(ANALYZE_DIR)) {
    fs.mkdirSync(ANALYZE_DIR, { recursive: true });
  }
}

/**
 * Run a command and return a promise
 */
function runCommand(command, args, env = {}) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      env: { ...process.env, ...env },
      shell: true
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
  });
}

/**
 * Analyze client bundle
 */
async function analyzeClient() {
  console.log('📊 Analyzing client bundle...');
  await runCommand('npm', ['run', 'build'], {
    ANALYZE: 'true',
    NODE_ENV: 'production'
  });
}

/**
 * Analyze server bundle
 */
async function analyzeServer() {
  console.log('🖥️  Analyzing server bundle...');
  await runCommand('npm', ['run', 'analyze:server'], {
    NODE_ENV: 'production'
  });
}

/**
 * Find unused files by analyzing the build output
 */
async function findUnusedFiles() {
  console.log('🔍 Finding potentially unused files...');
  
  const sourceDir = process.cwd();
  const patterns = [
    'app/**/*.{ts,tsx,js,jsx}',
    'components/**/*.{ts,tsx,js,jsx}',
    'lib/**/*.{ts,tsx,js,jsx}',
    'hooks/**/*.{ts,tsx,js,jsx}'
  ];

  // This is a simplified approach - in a real scenario, 
  // you'd want to use tools like depcheck or unimported
  console.log('ℹ️  For detailed unused code analysis, consider using:');
  console.log('   - npx depcheck (for unused dependencies)');
  console.log('   - npx unimported (for unused files)');
  console.log('   - npx next-unused (for Next.js specific unused code)');
}

/**
 * Generate bundle summary report
 */
function generateSummaryReport() {
  console.log('📋 Generating bundle summary report...');
  
  const report = {
    timestamp: new Date().toISOString(),
    reports: {
      client: fs.existsSync(path.join(ANALYZE_DIR, 'client-bundle-report.html')),
      server: fs.existsSync(path.join(ANALYZE_DIR, 'server-bundle-report.html'))
    },
    recommendations: [
      'Check for duplicate dependencies in the bundle analyzer',
      'Look for large libraries that could be lazy-loaded',
      'Verify tree-shaking is working for imported libraries',
      'Consider code splitting for large components',
      'Check for unused CSS or assets'
    ]
  };

  const reportPath = path.join(ANALYZE_DIR, 'analysis-summary.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📊 Summary report generated: ${reportPath}`);
}

/**
 * Main analysis function
 */
async function analyzeBundle() {
  const startTime = Date.now();
  
  console.log('🚀 Starting comprehensive bundle analysis...');
  ensureAnalyzeDir();

  try {
    // Analyze client bundle
    await analyzeClient();
    
    // Analyze server bundle
    await analyzeServer();
    
    // Find unused files
    await findUnusedFiles();
    
    // Generate summary
    generateSummaryReport();
    
    const duration = (Date.now() - startTime) / 1000;
    console.log(`✅ Bundle analysis completed in ${duration.toFixed(1)}s`);
    console.log(`📂 Reports available in: ${ANALYZE_DIR}`);
    
    // Open reports if they exist
    const clientReport = path.join(ANALYZE_DIR, 'client-bundle-report.html');
    const serverReport = path.join(ANALYZE_DIR, 'server-bundle-report.html');
    
    if (fs.existsSync(clientReport)) {
      console.log(`🌐 Client bundle report: file://${clientReport}`);
    }
    if (fs.existsSync(serverReport)) {
      console.log(`🖥️  Server bundle report: file://${serverReport}`);
    }
    
  } catch (error) {
    console.error('❌ Bundle analysis failed:', error.message);
    process.exit(1);
  }
}

/**
 * CLI handling
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Bundle Analysis Tool

Usage: node scripts/analyze-bundle.js [options]

Options:
  --client-only     Analyze only client bundle
  --server-only     Analyze only server bundle
  --help, -h       Show this help message

Examples:
  node scripts/analyze-bundle.js                    # Analyze both bundles
  node scripts/analyze-bundle.js --client-only      # Client only
  node scripts/analyze-bundle.js --server-only      # Server only
`);
    process.exit(0);
  }

  if (args.includes('--client-only')) {
    ensureAnalyzeDir();
    analyzeClient()
      .then(() => {
        generateSummaryReport();
        console.log('✅ Client bundle analysis completed');
      })
      .catch(error => {
        console.error('❌ Client bundle analysis failed:', error.message);
        process.exit(1);
      });
  } else if (args.includes('--server-only')) {
    ensureAnalyzeDir();
    analyzeServer()
      .then(() => {
        generateSummaryReport();
        console.log('✅ Server bundle analysis completed');
      })
      .catch(error => {
        console.error('❌ Server bundle analysis failed:', error.message);
        process.exit(1);
      });
  } else {
    analyzeBundle();
  }
}

module.exports = {
  analyzeBundle,
  analyzeClient,
  analyzeServer,
  findUnusedFiles
};