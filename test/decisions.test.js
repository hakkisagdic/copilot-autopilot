const assert = require('assert');
const test = require('node:test');

const decisions = require('../decisions.js');

test('isDecisionPrompt identifies decision-oriented prompts', () => {
  assert.strictEqual(decisions.isDecisionPrompt('hangi yaklaşımı seçelim, trade-off nedir?'), true);
  assert.strictEqual(decisions.isDecisionPrompt('sadece prompt ekle'), false);
});

test('buildDecisionItems extracts compact summaries', () => {
  const items = decisions.buildDecisionItems([
    {
      timestamp: '2026-07-14 10:00:00.000 UTC',
      source: 'terminal',
      prompt: 'hangi yaklaşımı seçelim\nikinci satır'
    },
    {
      timestamp: '2026-07-14 10:05:00.000 UTC',
      source: 'vscode',
      prompt: 'sadece kayıt tut'
    }
  ]);

  assert.strictEqual(items.length, 1);
  assert.deepStrictEqual(items[0], {
    timestamp: '2026-07-14 10:00:00.000 UTC',
    source: 'terminal',
    summary: 'hangi yaklaşımı seçelim',
    prompt: 'hangi yaklaşımı seçelim\nikinci satır'
  });
});

test('formatDecisions renders a readable decision note', () => {
  const markdown = decisions.formatDecisions({
    items: [
      {
        timestamp: '2026-07-14 10:00:00.000 UTC',
        source: 'terminal',
        summary: 'hangi yaklaşımı seçelim',
        prompt: 'hangi yaklaşımı seçelim'
      }
    ]
  });

  assert.match(markdown, /# Copilot Decisions/);
  assert.match(markdown, /Karar Adayları/);
  assert.match(markdown, /hangi yaklaşımı seçelim/);
});
