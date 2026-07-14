const assert = require('assert');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const test = require('node:test');

const collector = require('../collect-prompts.js');

async function withTempPaths(run) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'copilot-autopilot-test-'));
  const archivePath = path.join(tempDir, 'archive.md');
  const inboxPath = path.join(tempDir, 'inbox.md');
  const previousArchive = process.env.COPILOT_PROMPTS_ARCHIVE_PATH;
  const previousInbox = process.env.COPILOT_PROMPTS_INBOX_PATH;

  process.env.COPILOT_PROMPTS_ARCHIVE_PATH = archivePath;
  process.env.COPILOT_PROMPTS_INBOX_PATH = inboxPath;

  try {
    await run({ archivePath, inboxPath });
  } finally {
    if (previousArchive === undefined) {
      delete process.env.COPILOT_PROMPTS_ARCHIVE_PATH;
    } else {
      process.env.COPILOT_PROMPTS_ARCHIVE_PATH = previousArchive;
    }

    if (previousInbox === undefined) {
      delete process.env.COPILOT_PROMPTS_INBOX_PATH;
    } else {
      process.env.COPILOT_PROMPTS_INBOX_PATH = previousInbox;
    }

    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

test('parseArgs supports prompt, source, and watch path', () => {
  const parsed = collector.parseArgs(['--source', 'vscode', '--prompt', 'hello', '--watch', '/tmp/inbox.md']);

  assert.strictEqual(parsed.source, 'vscode');
  assert.strictEqual(parsed.prompt, 'hello');
  assert.strictEqual(parsed.watch, true);
  assert.strictEqual(parsed.watchPath, path.resolve('/tmp/inbox.md'));
});

test('formatEntry renders markdown blocks consistently', () => {
  const entry = collector.formatEntry({
    source: 'terminal',
    prompt: 'line one\nline two\n',
    timestamp: '2026-07-14 10:00:00.000 UTC'
  });

  assert.match(entry, /## 2026-07-14 10:00:00\.000 UTC/);
  assert.match(entry, /- source: terminal/);
  assert.match(entry, /```text\nline one\nline two\n```/);
});

test('appendPrompt creates the archive with a header when missing', async () => {
  await withTempPaths(async ({ archivePath }) => {
    await collector.appendPrompt('## 2026-07-14 10:00:00.000 UTC\n\n- source: terminal\n\n```text\nhello\n```\n');

    const content = await fs.readFile(archivePath, 'utf8');

    assert.match(content, /^# Copilot Prompt Archive/m);
    assert.match(content, /hello/);
  });
});

test('consumeInbox moves inbox content into the archive and clears the inbox', async () => {
  await withTempPaths(async ({ archivePath, inboxPath }) => {
    await fs.writeFile(inboxPath, 'Inbox prompt', 'utf8');

    const consumed = await collector.consumeInbox(inboxPath);
    const archiveContent = await fs.readFile(archivePath, 'utf8');
    const inboxContent = await fs.readFile(inboxPath, 'utf8');

    assert.strictEqual(consumed, true);
    assert.match(archiveContent, /Inbox prompt/);
    assert.strictEqual(inboxContent, '');
  });
});
