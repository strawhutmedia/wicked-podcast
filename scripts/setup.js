#!/usr/bin/env node

/**
 * SHM Instagram Widget Setup Script
 * Helps generate the configuration needed for the widget
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setup() {
  console.log('\n========================================');
  console.log('  SHM Instagram Widget Setup');
  console.log('========================================\n');

  console.log('This script will help you configure the Instagram widget.\n');
  console.log('Before continuing, make sure you have:');
  console.log('1. A Facebook Developer account');
  console.log('2. Created a Facebook App with Instagram Basic Display API');
  console.log('3. Generated a long-lived access token\n');
  console.log('See README.md for detailed instructions.\n');

  const accessToken = await question('Enter your Instagram Long-Lived Access Token: ');

  if (!accessToken || accessToken.length < 50) {
    console.log('\nWarning: The token seems too short. Make sure you\'re using a long-lived token.');
  }

  const port = await question('Enter the port to run the server on (default: 3000): ');
  const postLimit = await question('How many posts to display (default: 12, max: 25): ');
  const allowedOrigins = await question('Enter allowed domains (comma-separated, leave empty for all): ');

  // Generate a secure admin API key
  const adminApiKey = crypto.randomBytes(32).toString('hex');

  // Create .env file
  const envContent = `# Instagram API Configuration
INSTAGRAM_ACCESS_TOKEN=${accessToken}

# Server Configuration
PORT=${port || '3000'}

# Number of posts to fetch (max 25)
POST_LIMIT=${postLimit || '12'}

# CORS allowed origins
${allowedOrigins ? `ALLOWED_ORIGINS=${allowedOrigins}` : '# ALLOWED_ORIGINS=https://example.com'}

# Admin API key for manual refresh
ADMIN_API_KEY=${adminApiKey}
`;

  const envPath = path.join(__dirname, '../.env');

  fs.writeFileSync(envPath, envContent);

  console.log('\n========================================');
  console.log('  Setup Complete!');
  console.log('========================================\n');
  console.log('Your .env file has been created.\n');
  console.log('Admin API Key (save this somewhere safe):');
  console.log(adminApiKey);
  console.log('\nNext steps:');
  console.log('1. Run: npm install');
  console.log('2. Run: npm start');
  console.log(`3. Visit: http://localhost:${port || '3000'}/embed`);
  console.log('\nSee README.md for embedding instructions.\n');

  rl.close();
}

setup().catch((err) => {
  console.error('Setup failed:', err);
  rl.close();
  process.exit(1);
});
