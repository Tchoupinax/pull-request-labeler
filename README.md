# Pull Request Labeler

<!-- action-docs-header source="action.yml" -->

<!-- action-docs-header source="action.yml" -->

<!-- action-docs-description source="action.yml" -->

## Description

Multi labeler for title, body, comments, commit messages, branch, author or files with automated status checks.

<!-- action-docs-description source="action.yml" -->

<!-- action-docs-inputs source="action.yml" -->

## Inputs

| name           | description                                                                   | required | default                    |
| -------------- | ----------------------------------------------------------------------------- | -------- | -------------------------- |
| `config-path`  | <p>The path for the label configurations</p>                                  | `false`  | `.github/pull-request-labeler.yml`      |
| `config-repo`  | <p>The repository for the label configurations</p>                            | `false`  | `${{ github.repository }}` |
| `github-token` | <p>GITHUB_TOKEN or a <code>repo</code> scoped Personal Access Token (PAT)</p> | `false`  | `${{ github.token }}`      |

<!-- action-docs-inputs source="action.yml" -->

<!-- action-docs-outputs source="action.yml" -->

<!-- action-docs-outputs source="action.yml" -->

<!-- action-docs-runs source="action.yml" -->

## Runs

This action is a `node24` action.

<!-- action-docs-runs source="action.yml" -->

## Configuration

### Automatic features

Many labels can be automatically computed. You can activate or disable these features as you want:

- `majorPackagesUpgradedTriggersMajorLabel`: add the label `major` if this pull request detects a major package upgrade (Node.js only for now)

## Contributions

Any pull request is welcome!

### Maintainers

Every pull request should be reviewed and merged. Once it's done, you can trigger a release at any time going to [releases](https://github.com/apache/iggy-setup/releases). A draft release is created and updated with new pull request. You can `edit` the release, then `publish` it. It will publish the release and create the adapted tag. It's done!
