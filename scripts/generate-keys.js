#!/usr/bin/env node
/**
 * RSA Key Pair Generator for DANURI
 *
 * Usage:
 *   node scripts/generate-keys.js
 *   node scripts/generate-keys.js --output ./keys
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Parse arguments
const args = process.argv.slice(2);
let outputDir = './keys';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--output' && args[i + 1]) {
    outputDir = args[i + 1];
  }
}

// Generate RSA key pair
function generateKeyPair() {
  console.log('🔐 Generating RSA-2048 key pair...\n');

  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });

  return { publicKey, privateKey };
}

// Save keys to files
function saveKeys(publicKey, privateKey, outputDir) {
  // Create output directory if not exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const publicKeyPath = path.join(outputDir, `public_${timestamp}.pem`);
  const privateKeyPath = path.join(outputDir, `private_${timestamp}.pem`);

  fs.writeFileSync(publicKeyPath, publicKey);
  fs.writeFileSync(privateKeyPath, privateKey);

  console.log(`✅ Public key saved:  ${publicKeyPath}`);
  console.log(`✅ Private key saved: ${privateKeyPath}`);
  console.log('\n⚠️  Keep your private key secure and never share it!\n');

  return { publicKeyPath, privateKeyPath };
}

// Generate site key ID
function generateSiteKeyId(type = 'live') {
  const prefix = type === 'live' ? 'sk_live_' : 'sk_test_';
  const random = crypto.randomBytes(16).toString('hex');
  return prefix + random;
}

// Main
function main() {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║     DANURI RSA Key Pair Generator              ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  // Generate keys
  const { publicKey, privateKey } = generateKeyPair();

  // Save to files
  saveKeys(publicKey, privateKey, outputDir);

  // Generate sample site key
  const siteKeyId = generateSiteKeyId('live');
  console.log(`📋 Sample Site Key ID: ${siteKeyId}\n`);

  // Show usage example
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Usage in external site:\n');
  console.log(`<script src="https://cdn.danuri.go.kr/widget/danuri-widget.js"></script>`);
  console.log(`<script>`);
  console.log(`  DanuriWidget.init({`);
  console.log(`    siteKey: '${siteKeyId}',`);
  console.log(`    user: {`);
  console.log(`      encryptedPayload: rsaEncrypt(publicKey, userInfo)`);
  console.log(`    }`);
  console.log(`  });`);
  console.log(`</script>`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main();
