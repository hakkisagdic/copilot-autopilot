#!/usr/bin/env node

const knowledge = require('./knowledge.js');

async function main() {
  const result = await knowledge.buildKnowledge();
  process.stdout.write(`${result.knowledgePath}\n`);
}

if (require.main === module) {
  main().catch(error => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
