const assert = require('assert');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const test = require('node:test');

const projects = require('../projects.js');

async function withTempProjects(run) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'copilot-projects-test-'));
  const projectsPath = path.join(tempDir, 'projects.md');
  const previousProjects = process.env.COPILOT_PROJECTS_PATH;

  process.env.COPILOT_PROJECTS_PATH = projectsPath;

  try {
    await run({ projectsPath });
  } finally {
    if (previousProjects === undefined) {
      delete process.env.COPILOT_PROJECTS_PATH;
    } else {
      process.env.COPILOT_PROJECTS_PATH = previousProjects;
    }

    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

test('normalizeProjectName trims repeated whitespace', () => {
  assert.strictEqual(projects.normalizeProjectName('  alpha   beta  '), 'alpha beta');
});

test('formatProjectEntry renders a project note block', () => {
  const entry = projects.formatProjectEntry({
    project: 'Alpha',
    updated: '2026-07-14T10:00:00.000Z',
    source: 'manual',
    note: 'first note'
  });

  assert.match(entry, /## Project: Alpha/);
  assert.match(entry, /- updated: 2026-07-14T10:00:00\.000Z/);
  assert.match(entry, /```text\nfirst note\n```/);
});

test('addProjectNote appends a project entry and rebuilds the index', async () => {
  await withTempProjects(async ({ projectsPath }) => {
    await projects.addProjectNote({
      project: 'Alpha',
      note: 'document the alpha project',
      source: 'manual',
      updated: '2026-07-14T10:00:00.000Z',
      projectsPath
    });

    const content = await fs.readFile(projectsPath, 'utf8');

    assert.match(content, /# Copilot Projects/);
    assert.match(content, /- Alpha \(1\) \| son güncelleme: 2026-07-14T10:00:00\.000Z/);
    assert.match(content, /document the alpha project/);
  });
});

test('buildProjectDocs keeps an existing file normalized', async () => {
  await withTempProjects(async ({ projectsPath }) => {
    await fs.writeFile(projectsPath, [
      '# Copilot Projects',
      '',
      '## Project: Alpha',
      '',
      '- updated: 2026-07-14T10:00:00.000Z',
      '- source: manual',
      '',
      '```text',
      'alpha note',
      '```',
      ''
    ].join('\n'));

    const result = await projects.buildProjectDocs({ projectsPath });
    const content = await fs.readFile(projectsPath, 'utf8');

    assert.strictEqual(result.entries.length, 1);
    assert.match(content, /## Project Index/);
    assert.match(content, /Alpha \(1\)/);
  });
});
