const fs = require('fs/promises');
const path = require('path');

const repoRoot = __dirname;

function getProjectsPath() {
  return process.env.COPILOT_PROJECTS_PATH || path.join(repoRoot, 'copilot-projects.md');
}

function normalizeProjectName(name) {
  return String(name || '').trim().replace(/\s+/g, ' ');
}

function parseProjectNotes(content) {
  const normalizedContent = content.replace(/\r\n/g, '\n');
  const entries = [];
  const entryPattern = /## Project: (.+?)\n\n- updated: (.+?)\n- source: (.+?)\n\n```text\n([\s\S]*?)\n```/g;
  let match;

  while ((match = entryPattern.exec(normalizedContent)) !== null) {
    entries.push({
      project: match[1].trim(),
      updated: match[2].trim(),
      source: match[3].trim(),
      note: match[4].trimEnd()
    });
  }

  return entries;
}

function formatProjectEntry({ project, updated, source, note }) {
  const normalizedProject = normalizeProjectName(project);
  const normalizedNote = String(note || '').trimEnd();

  return [
    `## Project: ${normalizedProject}`,
    '',
    `- updated: ${updated}`,
    `- source: ${source}`,
    '',
    '```text',
    normalizedNote,
    '```',
    ''
  ].join('\n');
}

function formatProjectDocs({ entries }) {
  const grouped = new Map();

  for (const entry of entries) {
    if (!grouped.has(entry.project)) {
      grouped.set(entry.project, []);
    }

    grouped.get(entry.project).push(entry);
  }

  const lines = [
    '# Copilot Projects',
    '',
    'Bu dosya proje bazlı notları, durumları ve kısa çalışma özetlerini taşır.',
    '',
    '## Project Index',
    ''
  ];

  if (grouped.size === 0) {
    lines.push('- henüz proje notu yok');
  } else {
    for (const [project, projectEntries] of grouped.entries()) {
      const latest = projectEntries[projectEntries.length - 1];
      lines.push(`- ${project} (${projectEntries.length}) | son güncelleme: ${latest.updated}`);
    }
  }

  lines.push('', '## Project Notes', '');

  if (entries.length === 0) {
    lines.push('- kayıt yok');
  } else {
    for (const entry of entries) {
      const firstLine = entry.note.split('\n').find(line => line.trim()) || '';
      lines.push(`- ${entry.project} | ${entry.updated} | ${entry.source} | ${firstLine}`);
    }
  }

  lines.push('', '## Usage Notes', '', '- Bu dosya proje notlarından otomatik üretilebilir.', '- Proje notları elle veya araç komutlarıyla eklenebilir.', '');

  return lines.join('\n');
}

async function readProjects(projectsPath = getProjectsPath()) {
  try {
    return await fs.readFile(projectsPath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      return '';
    }

    throw error;
  }
}

async function writeProjects(markdown, projectsPath = getProjectsPath()) {
  await fs.writeFile(projectsPath, markdown, 'utf8');
  return projectsPath;
}

async function addProjectNote({ project, note, source = 'manual', updated = new Date().toISOString(), projectsPath = getProjectsPath() } = {}) {
  const existingContent = await readProjects(projectsPath);
  const entries = parseProjectNotes(existingContent);
  entries.push({
    project: normalizeProjectName(project),
    updated,
    source,
    note
  });

  const markdown = formatProjectDocs({ entries });
  await writeProjects(markdown, projectsPath);
  return { entries, projectsPath };
}

async function buildProjectDocs({ projectsPath = getProjectsPath() } = {}) {
  const existingContent = await readProjects(projectsPath);
  const entries = parseProjectNotes(existingContent);
  const markdown = formatProjectDocs({ entries });

  await writeProjects(markdown, projectsPath);
  return { entries, projectsPath };
}

module.exports = {
  addProjectNote,
  buildProjectDocs,
  formatProjectDocs,
  formatProjectEntry,
  getProjectsPath,
  normalizeProjectName,
  parseProjectNotes,
  readProjects,
  writeProjects
};
