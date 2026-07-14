#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');

const repoRoot = __dirname;

function getArchivePath() {
  return process.env.COPILOT_PROMPTS_ARCHIVE_PATH || path.join(repoRoot, 'copilot-prompts.md');
}

function getInboxPath() {
  return process.env.COPILOT_PROMPTS_INBOX_PATH || path.join(repoRoot, 'copilot-prompt-inbox.md');
}

function formatTimestamp(date = new Date()) {
  return date.toISOString().replace('T', ' ').replace('Z', ' UTC');
}

function parseArgs(argv) {
  const result = { source: 'terminal', prompt: '', filePath: '', watch: false, watchPath: getInboxPath() };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--source' && argv[index + 1]) {
      result.source = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === '--prompt' && argv[index + 1]) {
      result.prompt = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === '--file' && argv[index + 1]) {
      result.filePath = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === '--watch') {
      result.watch = true;

      if (argv[index + 1] && !argv[index + 1].startsWith('--')) {
        result.watchPath = path.resolve(argv[index + 1]);
        index += 1;
      }

      continue;
    }

    if (arg === '--stdin') {
      result.prompt = result.prompt || '__stdin__';
      continue;
    }

    if (!arg.startsWith('--') && !result.prompt) {
      result.prompt = arg;
    }
  }

  return result;
}

async function ensureFileExists(filePath) {
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, '', 'utf8');
  }
}

async function readPrompt({ prompt, filePath }) {
  if (filePath) {
    return fs.readFile(filePath, 'utf8');
  }

  if (prompt === '__stdin__' || !prompt) {
    if (process.stdin.isTTY) {
      return '';
    }

    return new Promise((resolve, reject) => {
      let content = '';

      process.stdin.setEncoding('utf8');
      process.stdin.on('data', chunk => {
        content += chunk;
      });
      process.stdin.on('end', () => resolve(content));
      process.stdin.on('error', reject);
    });
  }

  return prompt;
}

function ensureArchiveHeader(existingContent) {
  if (existingContent.trim().length > 0) {
    return existingContent;
  }

  return [
    '# Copilot Prompt Archive',
    '',
    'Bu dosya Copilot promptlarını zaman içinde biriktirmek için kullanılır.',
    ''
  ].join('\n');
}

function formatEntry({ source, prompt, timestamp }) {
  const normalizedPrompt = prompt.trimEnd();

  return [
    `## ${timestamp}`,
    '',
    `- source: ${source}`,
    '',
    '```text',
    normalizedPrompt,
    '```',
    ''
  ].join('\n');
}

async function appendPrompt(entry) {
  let existingContent = '';
  const archivePath = getArchivePath();

  try {
    existingContent = await fs.readFile(archivePath, 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  const preparedContent = ensureArchiveHeader(existingContent);
  const separator = preparedContent.endsWith('\n') ? '' : '\n';
  const nextContent = `${preparedContent}${separator}${entry}`;

  await fs.writeFile(archivePath, nextContent, 'utf8');
}

async function consumeInbox(sourcePath) {
  await ensureFileExists(sourcePath);

  const inboxContent = await fs.readFile(sourcePath, 'utf8');

  if (!inboxContent.trim()) {
    return false;
  }

  const entry = formatEntry({
    source: 'vscode-watch',
    prompt: inboxContent,
    timestamp: formatTimestamp()
  });

  await appendPrompt(entry);
  await fs.writeFile(sourcePath, '', 'utf8');

  return true;
}

async function watchInbox(sourcePath) {
  await ensureFileExists(sourcePath);
  await consumeInbox(sourcePath);

  process.stdout.write(`Watching ${sourcePath} for prompt text...\n`);

  fs.watchFile(sourcePath, { interval: 1000 }, async () => {
    try {
      await consumeInbox(sourcePath);
    } catch (error) {
      process.stderr.write(`${error.stack || error.message}\n`);
    }
  });

  process.on('SIGINT', () => {
    fs.unwatchFile(sourcePath);
    process.exit(0);
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.watch) {
    await watchInbox(args.watchPath);
    return;
  }

  const prompt = await readPrompt(args);

  if (!prompt.trim()) {
    process.stderr.write('No prompt content provided. Use --prompt, --file, or stdin.\n');
    process.exitCode = 1;
    return;
  }

  const entry = formatEntry({
    source: args.source,
    prompt,
    timestamp: formatTimestamp()
  });

  await appendPrompt(entry);
  process.stdout.write(`${getArchivePath()}\n`);
}

if (require.main === module) {
  main().catch(error => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = {
  appendPrompt,
  consumeInbox,
  ensureArchiveHeader,
  ensureFileExists,
  formatEntry,
  formatTimestamp,
  getArchivePath,
  getInboxPath,
  parseArgs,
  readPrompt,
  watchInbox
};
