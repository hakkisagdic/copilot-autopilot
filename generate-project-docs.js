#!/usr/bin/env node

const projects = require('./projects.js');

async function main() {
  const result = await projects.buildProjectDocs();
  process.stdout.write(`${result.projectsPath}\n`);
}

if (require.main === module) {
  main().catch(error => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
