# Branch Protection Recommendations

This repository has one GitHub Actions workflow: `CI` (tests on push to `main` and on pull requests).
There is no release automation; the project is not published.

## GitHub Setup

Apply these settings on the `main` branch in GitHub:

1. Require a pull request before merging.
2. Require the `CI` workflow to pass before merging.
3. Restrict direct pushes to `main`.
4. Require conversation resolution before merge if you want a stricter review flow.

GitHub branch protection is configured in the repository settings, not in source control; this
document is the checklist for keeping the rules consistent.
