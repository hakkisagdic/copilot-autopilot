const assert = require('assert');
const test = require('node:test');

const knowledge = require('../knowledge.js');

test('parseArchive extracts prompt entries from markdown', () => {
  const content = [
    '# Copilot Prompt Archive',
    '',
    '## 2026-07-14 10:00:00.000 UTC',
    '',
    '- source: terminal',
    '',
    '```text',
    'first prompt',
    '```',
    '',
    '## 2026-07-14 10:05:00.000 UTC',
    '',
    '- source: vscode',
    '',
    '```text',
    'second prompt',
    '```',
    ''
  ].join('\n');

  const entries = knowledge.parseArchive(content);

  assert.strictEqual(entries.length, 2);
  assert.deepStrictEqual(entries[0], {
    timestamp: '2026-07-14 10:00:00.000 UTC',
    source: 'terminal',
    prompt: 'first prompt'
  });
});

test('getTopThemes surfaces repeated keywords', () => {
  const themes = knowledge.getTopThemes([
    { prompt: 'create markdown archive', source: 'terminal', timestamp: 'x' },
    { prompt: 'archive and generate markdown', source: 'vscode', timestamp: 'y' }
  ], 3);

  assert.strictEqual(themes[0].term, 'archive');
  assert.ok(themes.some(theme => theme.term === 'markdown'));
});

test('formatKnowledge produces a summary document', () => {
  const markdown = knowledge.formatKnowledge({
    entries: [
      { timestamp: '2026-07-14 10:00:00.000 UTC', source: 'terminal', prompt: 'create archive' },
      { timestamp: '2026-07-14 10:05:00.000 UTC', source: 'vscode', prompt: 'generate knowledge' }
    ],
    themes: [{ term: 'archive', count: 2 }]
  });

  assert.match(markdown, /# Copilot Knowledge/);
  assert.match(markdown, /- toplam kayıt: 2/);
  assert.match(markdown, /- archive \(2\)/);
  assert.match(markdown, /## Son Kayıtlar/);
});
