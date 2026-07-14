#!/usr/bin/env node

const decisions = require('./decisions.js');

async function main() {
  const result = await decisions.buildDecisions();
  process.stdout.write(`${result.decisionsPath}\n`);
}

if (require.main === module) {
  main().catch(error => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
