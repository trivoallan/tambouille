---
adr: ADR-0004
slug: languages
title: Languages
status: accepted
revision: 1
date: 2026-11-14
authors: [Tristan Rivoallan]
supersedes: []
traits:
  languages:
    main:
      name: TypeScript
---

# Languages

## Status

Accepted

> **What is this file?** A question governance asks your repository, with
> the answer it recommends. While it says `status: proposed`, you may edit
> it freely. `revision:` dates the question, not the file: you do not fill
> it, and it only moves when the question changes. `rejected` is a full
> answer: when the question does not apply here, rule `rejected`, remove
> the whole `traits:` block, and say what stands in for it.
> [ADR-0001](ADR-0001-record-architecture-decisions.md) explains the
> mechanics.

## Context

While this key is empty, an agent adding code to this repository does not
know which language to write it in. It infers from what it sees, and gets it
wrong as soon as the repository holds more than one. Once the value is
written, it reads it and sticks to it.

The main language is not the only language in the repository: it is the one
code is written in by default, and the one whose tooling is the reference.
A repository can hold others without changing the answer.

## Decision

**governance does not choose for you, but it narrows the field.** It
recommends two languages:

| Key | Recommended value | Reason |
| --- | --- | --- |
| `languages.main.name` | `Python` or `TypeScript` | both have mature test, typing and coverage tooling, both have a schema-first validation library that ADR-0005 can recommend (`pydantic`, `zod`), and coding agents write and review both reliably |

Between the two: **TypeScript** when the repository runs in a browser or
shares code between browser and server; **Python** for scripts, data work
and services that do neither. Neither is better in the abstract.

**Another language remains possible, and is justified here**, not
elsewhere. Write what the two recommended languages did not give you: a
single static binary, a runtime constraint, an ecosystem the repository
depends on. That justification is the only thing governance asks in return.

**None of this is checked by a tool.** The schema checks that a value is
written, never that it is in the list: refusing a language mechanically
would make impossible the very case this section allows. Review reads your
justification, not a command.

**Ruling.** We adopt the recommendation as is: TypeScript, since the
frontend (Vue 3) runs in a browser and the backend (NestJS) is TypeScript
too.

## Consequences

### Positive

- One language from the Vue frontend to the NestJS backend: types and
  habits carry across.
- `zod` is available for ADR-0005, and the test and coverage tooling
  (Jest, Vitest) is already in place.

### Negative

- Two TypeScript toolchains (backend `typescript@^5`, frontend `~6.0`) to
  keep in step.

### Neutral

- Scripts or data work that would fit Python better still go through this
  ADR's justification if one is ever added.

## Alternatives Considered

### `Python`

Mature test and typing tooling, `pydantic` for validation, a large
ecosystem for scripts and data work.

### `TypeScript`

One language from browser to server, gradual typing, `zod` for validation.

### `Go`

One binary to deploy, fast compilation, simple concurrency. surdesrails
recommends it; governance does not, because its repositories rarely need a
static binary and one fewer language keeps the other recommendations
shorter. It remains a valid answer when justified.

### Another language

Possible, and justified in this file: what the recommended languages did not
give you.

### No main language

For a documentation, configuration or infrastructure repository. Rule
`rejected` then, and say what the repository holds instead.

## References

- Adapted from surdesrails [SDR-0004](https://github.com/trivoallan/surdesrails/blob/main/resources/docs/adr/SDR-0004-languages.md), revision 1.
- [ADR-0001](ADR-0001-record-architecture-decisions.md): how governance ADRs are ruled on.
- [ADR-0005](ADR-0005-validation.md) and [ADR-0007](ADR-0007-tests.md): validation and coverage, which depend on this answer.

**The key.**

| Key | What it holds | Allowed values |
| --- | --- | --- |
| `languages.main.name` | the main language, as a person writes it | `Python`, `TypeScript`, or another one justified above |

**What this key does not cover:** no test runner, test command, coverage
threshold, lint command or tool. The coverage threshold is ADR-0007's;
commands are not carried by governance, which does not know what your
repository runs.

**An empty key is not an answer**: this one is required. The value is
written in this file and nowhere else; whoever needs it links here. See
ADR-0001 for the check command.
