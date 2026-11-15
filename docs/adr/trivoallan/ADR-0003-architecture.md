---
adr: ADR-0003
slug: architecture
title: Software architecture
status: accepted
revision: 1
date: 2026-11-14
authors: [Tristan Rivoallan]
supersedes: []
traits:
  architecture:
    pattern: layered
---

# Software architecture

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

While this key is empty, an agent adding a module to this repository
invents a structure, and invents a different one each time, because it
infers from whichever file it has open. Once the value is written, it knows
where code goes and what may depend on what.

The question comes early because it is expensive to undo: a directory
layout and dependency boundaries change one module at a time, long after
anyone stopped thinking about them.

Where the architecture is *documented* is a separate question, asked by
[ADR-0010](ADR-0010-architecture-documentation.md).

## Decision

**What governance recommends, and why.**

| Key | Recommended value | Reason |
| --- | --- | --- |
| `architecture.pattern` | `hexagonal` | **it suits agentic work**: the domain depends on no I/O, so an agent writes and tests it without a running environment, and changes an adapter without touching the domain |

The reason deserves unpacking, because it is not the usual one. A hexagonal
pattern bounds what an agent has to hold in mind to change a rule: the
domain alone, with no database, no network, no framework. It is also what
makes a change checkable without standing up an environment, so an agent
knows whether it broke something instead of assuming it did not.

**This recommendation does not bind your repository.** It holds for an
application service of moderate size. Under about 500 lines, or for a
repository that is not a service, `monolithic` is often the honest answer;
and if the question has no object here, rule `rejected`.

**Ruling.** We depart from the recommendation: `layered`, not `hexagonal`.
The code is already layered and nothing asks to change it. The backend is
a set of NestJS feature modules (`backend/src/mixes`, `auth`, `comments`,
`playlists`, `users`, `imports`, …), each going controller → service →
`PrismaService`, and services use Prisma and NestJS exceptions directly.
The frontend follows the same shape: views → components and Pinia stores →
`frontend/src/api`. Moving to hexagonal would mean a port between every
service and Prisma, a rewrite for a single-deployable application of about
6,700 backend lines. Where an I/O seam earns its keep, as with the source
importers behind `imports/source-importer.ts`, it is kept as an interface
within its layer.

## Consequences

### Positive

- The ruling describes the code as it is: an agent adding a module copies
  the controller → service → Prisma shape it finds next door.
- NestJS's own conventions (modules, controllers, providers) carry the
  layers, so there is nothing extra to maintain.

### Negative

- Business rules live in services that depend on Prisma, so testing them
  needs a mocked `PrismaService` or a database.
- Changing the persistence layer touches every service.

### Neutral

- A module that grows a real domain can still introduce a port locally, as
  the importers did, without reopening this decision.

## Alternatives Considered

### `hexagonal`

Ports and adapters: the domain depends on no I/O.

### `layered`

Classic layers, each knowing only the next one down.

### `microservices`

Services deployed separately.

### `monolithic`

One deployable, without strong internal boundaries.

### `event-driven`

Components communicate through events.

### `soa`

Shared services, coupled through contracts.

## References

- Suggested skills: `architecture` and `system-design` from `engineering@knowledge-work-plugins`.
- Adapted from surdesrails [SDR-0003](https://github.com/trivoallan/surdesrails/blob/main/resources/docs/adr/SDR-0003-architecture.md), revision 1 (its `architecture.pattern` key; `architecture.document` is asked by ADR-0010).
- [ADR-0001](ADR-0001-record-architecture-decisions.md): how governance ADRs are ruled on.

**The key.**

| Key | What it holds | Allowed values |
| --- | --- | --- |
| `architecture.pattern` | the pattern that structures this repository's code | `event-driven`, `hexagonal`, `layered`, `microservices`, `monolithic`, `soa` |

**One key, on purpose.** governance does not carry your directory layout,
package names or dependency rules: they are decided in your repository and
written in this ADR's body. The trait carries only what an agent must read
without interpreting.

**An empty key is not an answer**: this one is required. The value is
written in this file and nowhere else; whoever needs it links here. See
ADR-0001 for the check command.
