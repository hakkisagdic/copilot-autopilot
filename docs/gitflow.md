# Gitflow Guide

This repository uses a Gitflow-style branch model.

## Branch Model

1. `main` contains production-ready releases.
2. `develop` collects completed feature work before release.
3. `feature/*` branches are created from `develop`.
4. `release/*` branches are created from `develop` when a release is being prepared.
5. `hotfix/*` branches are created from `main` when production needs an urgent fix.

## Workflow

1. Start new work from `develop` using a `feature/*` branch.
2. Merge finished features back into `develop` through pull requests.
3. Create a `release/*` branch from `develop` when you want to stabilize a version.
4. Merge the release branch into `main` when it is ready to ship.
5. Merge the same release branch back into `develop` if needed to keep history aligned.
6. Use `hotfix/*` branches for urgent production fixes and merge them into both `main` and `develop`.

## Automation

- CI runs on pull requests and pushes to `develop`, `main`, `release/*`, and `hotfix/*`.
- release-please remains tied to successful CI on `main` so releases only come from production-ready code.

## Practical Rules

- Keep commits conventional so release-please can build clean release notes.
- Prefer squash merges for feature branches.
- Avoid direct pushes to `develop` and `main`.
- Treat `release/*` and `hotfix/*` as short-lived branches.