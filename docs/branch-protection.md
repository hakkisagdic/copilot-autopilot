# Branch Protection Recommendations

This repository uses GitHub Actions for CI and semantic versioning automation.

## GitHub Setup

Gitflow branch roles:

1. `develop` is the integration branch for finished feature work.
2. `main` is the release branch for production-ready code.
3. `feature/*` branches are short-lived and merge into `develop`.
4. `release/*` branches stabilize a release before merging to `main`.
5. `hotfix/*` branches patch production issues and merge back to both `main` and `develop`.

Apply these settings in GitHub:

For `develop`:

1. Require a pull request before merging.
2. Require status checks to pass before merging.
3. Require the `CI` workflow to pass before merging.
4. Restrict direct pushes to `develop`.

For `main`:

1. Require a pull request before merging.
2. Require status checks to pass before merging.
3. Require the `CI` workflow to pass before merging.
4. Require linear history to keep release-please changelog generation clean.
5. Restrict direct pushes to `main`.
6. Require conversation resolution before merge if you want a stricter review flow.

Recommended merge strategy:

- Prefer squash merges so conventional commit messages remain clean and release-please can produce readable release notes.
- Avoid merge commits unless you intentionally want grouped history.

Recommended branch flow:

- Feature branches merge into `develop`.
- Release branches merge into `main` after final validation.
- Hotfix branches merge into both `main` and `develop` so the fix is not lost.

## Release PR Scheme

Use conventional commit messages for feature work and fixes:

1. `feat: add prompt archive index`
2. `fix: handle empty inbox files`
3. `docs: describe release workflow`
4. `refactor: simplify project note parsing`

For release pull requests, keep the title predictable and parseable by release-please.

Recommended release PR title format:

1. `chore(main): release copilot-autopilot v1.0.1`
2. `chore(main): release copilot-autopilot v1.1.0`
3. `chore(main): release copilot-autopilot v2.0.0`

That format keeps the release branch, component, and version visible at a glance while staying compatible with release-please defaults.

## release-please Notes

- The release workflow should run only after `CI` succeeds.
- `release-please` should remain the only actor that creates release PRs and version tags.
- If a release PR is created, merge it through the normal protected branch flow.

## Git Commands

Suggested local branch naming:

1. `feature/<short-topic>` for new work.
2. `release/<version>` for stabilization.
3. `hotfix/<short-topic>` for production patches.

## Operational Note

- GitHub branch protection is configured in the repository settings, not directly in source control.
- This document serves as the canonical checklist for maintaining the branch rules consistently.
