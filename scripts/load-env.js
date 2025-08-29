#!/usr/bin/env node

// Script to load custom environment files for Next.js
const fs = require('fs');
const path = require('path');

// Determine which environment file to load
const isProduction = process.env.NODE_ENV === 'production';

// Check if we're on dev branch (staging environment)
const { execSync } = require('child_process');
let currentBranch = 'main';
try {
  currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
} catch (e) {
  // Ignore git errors
}

const isStaging = currentBranch === 'dev';
const envFile = isProduction ? '.env.prod' : (isStaging ? '.env.dev.staging' : '.env.dev');
const targetFile = isProduction ? '.env.production' : '.env.local';

const envPath = path.join(process.cwd(), envFile);
const targetPath = path.join(process.cwd(), targetFile);

try {
  // Check if the custom env file exists
  if (fs.existsSync(envPath)) {
    // Copy the custom env file to .env.local
    fs.copyFileSync(envPath, targetPath);
    console.log(`✅ Loaded ${envFile} → ${targetFile}`);
  } else {
    console.log(`⚠️  ${envFile} not found, skipping environment loading`);
  }
} catch (error) {
  console.error(`❌ Error loading environment file: ${error.message}`);
  process.exit(1);
}
