const fs = require('fs/promises');
const path = require('path');

const repoRoot = __dirname;

function getDecisionsPath() {
  return process.env.COPILOT_DECISIONS_PATH || path.join(repoRoot, 'copilot-decisions.md');
}

function getArchivePath() {
  return process.env.COPILOT_PROMPTS_ARCHIVE_PATH || path.join(repoRoot, 'copilot-prompts.md');
}

function parseArchive(content) {
  const normalizedContent = content.replace(/\r\n/g, '\n');
  const entries = [];
  const entryPattern = /## (.+?)\n\n- source: (.+?)\n\n```text\n([\s\S]*?)\n```/g;
  let match;

  while ((match = entryPattern.exec(normalizedContent)) !== null) {
    entries.push({
      timestamp: match[1].trim(),
      source: match[2].trim(),
      prompt: match[3].trimEnd()
    });
  }

  return entries;
}

function isDecisionPrompt(prompt) {
  const decisionPattern = /(karar|neden|trade[- ]?off|alternatif|seçim|seçelim|hangi|alalım|choose|decision|why|vs\.?|kıyas|compare|preferred)/i;
  return decisionPattern.test(prompt);
}

function extractDecisionSummary(prompt) {
  const firstLine = prompt.split('\n').find(line => line.trim()) || '';
  return firstLine.trim().replace(/\s+/g, ' ');
}

function buildDecisionItems(entries) {
  return entries
    .filter(entry => isDecisionPrompt(entry.prompt))
    .map(entry => ({
      timestamp: entry.timestamp,
      source: entry.source,
      summary: extractDecisionSummary(entry.prompt),
      prompt: entry.prompt
    }));
}

function formatDecisions({ items }) {
  const lines = [
    '# Copilot Decisions',
    '',
    'Bu dosya prompt arşivinden çıkan karar, seçim ve trade-off adaylarını taşır.',
    '',
    '## Karar Adayları',
    ''
  ];

  if (items.length === 0) {
    lines.push('- karar adayı bulunamadı');
  } else {
    for (const item of items) {
      lines.push(`- ${item.timestamp} | ${item.source} | ${item.summary}`);
    }
  }

  lines.push('', '## Kullanım Notları', '', '- Bu dosya archive katmanından otomatik üretilir.', '- Karar cümleleri en iyi durumda elle gözden geçirilmelidir.', '');

  return lines.join('\n');
}

async function readArchive(archivePath = getArchivePath()) {
  try {
    return await fs.readFile(archivePath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      return '';
    }

    throw error;
  }
}

async function writeDecisions(markdown, decisionsPath = getDecisionsPath()) {
  await fs.writeFile(decisionsPath, markdown, 'utf8');
  return decisionsPath;
}

async function buildDecisions({ archivePath = getArchivePath(), decisionsPath = getDecisionsPath() } = {}) {
  const archiveContent = await readArchive(archivePath);
  const entries = parseArchive(archiveContent);
  const items = buildDecisionItems(entries);
  const markdown = formatDecisions({ items });

  await writeDecisions(markdown, decisionsPath);
  return { entries, items, decisionsPath };
}

module.exports = {
  buildDecisionItems,
  buildDecisions,
  extractDecisionSummary,
  formatDecisions,
  getArchivePath,
  getDecisionsPath,
  isDecisionPrompt,
  parseArchive,
  readArchive,
  writeDecisions
};
