<!-- ontrack:begin -->
## Project rules (ontrack)

### Record architecture decisions (trivoallan/ADR-0001-record-architecture-decisions)

```yaml
record-architecture-decisions:
  format: nygard
```

### Localization (trivoallan/ADR-0002-localization)

```yaml
localization:
  language:
    default: french
    documentation:
    commits:
    code: english
    comments:
```

### Software architecture (trivoallan/ADR-0003-architecture)

```yaml
architecture:
  pattern: layered
```

### Languages (trivoallan/ADR-0004-languages)

```yaml
languages:
  main:
    name: TypeScript
```

### Validation (trivoallan/ADR-0005-validation)

```yaml
validation:
  boundary: class-validator
  data_files: vitest
```

### Commits (trivoallan/ADR-0006-commits)

```yaml
commits:
  scopes: [auth, comments, common, imports, mail, mixes, playlists, users, fournee, player, upload, frontend, backend, ci, openspec, incongrues, profil, deploy, images, navbar, edition]
  tool: none
```

### Tests (trivoallan/ADR-0007-tests)

```yaml
tests:
  coverage_target: 90
```

### Documentation (trivoallan/ADR-0008-documentation)

```yaml
docs:
  tool: none
  root: docs/
  audience: public
```

### Branching (trivoallan/ADR-0009-branching)

```yaml
branching:
  model: github-flow
  merge: squash
  prefixes: [feat, fix, perf, docs]
```

### Architecture documentation (trivoallan/ADR-0010-architecture-documentation)

```yaml
architecture:
  document: arc42
  model: none
  diagrams: mermaid
```

### Forge and continuous integration (trivoallan/ADR-0011-forge-and-ci)

```yaml
forge:
  gate: blocking
  audit: zizmor
```

### Delivery (trivoallan/ADR-0012-delivery)

```yaml
delivery:
  target: platform
  environments:
    - { name: production, trigger: merge }
  release_tool: none
  release_notes: none
  registry: none
deployment:
  manifests: deploy/
```

### Frontend (trivoallan/ADR-0013-frontend)

```yaml
frontend:
  framework: vue
```

### Work tracking (trivoallan/ADR-0014-work-tracking)

```yaml
tracking:
  tool: github-issues
  project: trivoallan/tambouille
```

### Secrets (trivoallan/ADR-0015-secrets)

```yaml
secrets:
  storage: keychain
  guard: gitleaks
```

### Changes (trivoallan/ADR-0016-changes)

```yaml
changes:
  framework: openspec
  schema: spec-driven
```

### Agent tooling (trivoallan/ADR-0017-agent-tooling)

```yaml
agent:
  hosts: [claude-code]
```

### Dependencies (trivoallan/ADR-0018-dependencies)

```yaml
dependencies:
  updater: dependabot
  automerge: patch
```

### Vulnerabilities (trivoallan/ADR-0019-vulnerabilities)

```yaml
vulnerabilities:
  sbom: none
  scanner: github
  fail_on: critical
```

### Adding a dependency (trivoallan/ADR-0020-adding-dependencies)

```yaml
admission:
  approver: person
  install_scripts: ignored
```

### Not yet decided

- Review and merge (trivoallan/ADR-0022-review-and-merge)
- License (trivoallan/ADR-0023-license)
- Code scanning (trivoallan/ADR-0024-code-scanning)
- Tools outside the package manager (trivoallan/ADR-0025-tools)
- Agent identity (trivoallan/ADR-0026-agent-identity)

<!-- ontrack:end -->
