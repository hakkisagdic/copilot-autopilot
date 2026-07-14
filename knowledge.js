const fs = require('fs/promises');
const path = require('path');

const repoRoot = __dirname;

function getKnowledgePath() {
  return process.env.COPILOT_KNOWLEDGE_PATH || path.join(repoRoot, 'copilot-knowledge.md');
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

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .split(/\s+/)
    .map(token => token.trim())
    .filter(token => token.length >= 4);
}

function getTopThemes(entries, limit = 6) {
  const stopwords = new Set([
    'this', 'that', 'with', 'from', 'into', 'your', 'what', 'have', 'will', 'then', 'when', 'were', 'been', 'shall', 'does', 'done',
    'bir', 'için', 'olan', 'olarak', 'veya', 'gibi', 'daha', 'bunu', 'şunu', 'beni', 'sana', 'size', 'olan', 'olanlar', 'kadar', 'olarak',
    'ekle', 'yap', 'yapma', 'lütfen', 'bana', 'bunu', 'şimdi'
  ]);

  const counts = new Map();

  for (const entry of entries) {
    for (const token of tokenize(entry.prompt)) {
      if (stopwords.has(token)) {
        continue;
      }

      counts.set(token, (counts.get(token) || 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((left, right) => {
      if (right[1] !== left[1]) {
        return right[1] - left[1];
      }

      return left[0].localeCompare(right[0]);
    })
    .slice(0, limit)
    .map(([term, count]) => ({ term, count }));
}

function formatKnowledge({ entries, themes }) {
  const sourceCounts = entries.reduce((counts, entry) => {
    counts.set(entry.source, (counts.get(entry.source) || 0) + 1);
    return counts;
  }, new Map());

  const lines = [
    '# Copilot Knowledge',
    '',
    'Bu dosya prompt arşivinden türetilen yüksek seviye özetleri, kararları ve tekrar eden temaları taşır.',
    '',
    '## Genel Bakış',
    '',
    `- toplam kayıt: ${entries.length}`,
    `- kaynak sayısı: ${sourceCounts.size}`,
    ''
  ];

  for (const [source, count] of sourceCounts.entries()) {
    lines.push(`- ${source}: ${count}`);
  }

  lines.push('', '## Öne Çıkan Temalar', '');

  if (themes.length === 0) {
    lines.push('- yeterli veri yok');
  } else {
    for (const theme of themes) {
      lines.push(`- ${theme.term} (${theme.count})`);
    }
  }

  lines.push('', '## Son Kayıtlar', '');

  const recentEntries = entries.slice(-5).reverse();

  if (recentEntries.length === 0) {
    lines.push('- kayıt yok');
  } else {
    for (const entry of recentEntries) {
      const firstLine = entry.prompt.split('\n').find(line => line.trim()) || '';
      lines.push(`- ${entry.timestamp} | ${entry.source} | ${firstLine}`);
    }
  }

  lines.push('', '## Kullanım Notları', '', '- Bu dosya archive katmanından otomatik üretilir.', '- Gerekirse elle genişletilebilir ama kaynak yine arşiv olmalıdır.', '');

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

async function writeKnowledge(markdown, knowledgePath = getKnowledgePath()) {
  await fs.writeFile(knowledgePath, markdown, 'utf8');
  return knowledgePath;
}

async function buildKnowledge({ archivePath = getArchivePath(), knowledgePath = getKnowledgePath() } = {}) {
  const archiveContent = await readArchive(archivePath);
  const entries = parseArchive(archiveContent);
  const themes = getTopThemes(entries);
  const markdown = formatKnowledge({ entries, themes });

  await writeKnowledge(markdown, knowledgePath);
  return { entries, themes, knowledgePath };
}

module.exports = {
  buildKnowledge,
  formatKnowledge,
  getArchivePath,
  getKnowledgePath,
  getTopThemes,
  parseArchive,
  readArchive,
  tokenize,
  writeKnowledge
};
