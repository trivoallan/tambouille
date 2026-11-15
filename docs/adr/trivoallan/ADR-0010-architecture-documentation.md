---
adr: ADR-0010
slug: architecture-documentation
title: Architecture documentation
status: accepted
revision: 2
date: 2026-11-15
authors: [Tristan Rivoallan]
supersedes: []
check: npx --no-install ontrack-engineering-check ADR-0010
traits:
  architecture:
    document: arc42
    model: none
    diagrams: mermaid
---

# Architecture documentation

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

While this key is empty, an agent that needs to understand the system as a
whole (its context, its building blocks, how it is deployed) has nowhere to
look, so it rebuilds that picture from the code each time, and rebuilds it
differently. An agent that changes the architecture does not know whether a
document or a diagram should change with it. Once these values are written,
it knows where the document is, whether the diagrams are code it can edit,
or that there is neither.

This question is asked separately from the code's pattern
([ADR-0003](ADR-0003-architecture.md)) because the two are ruled at
different times. A pattern is chosen before the first module; a document
is worth writing once there is something to describe, and a repository can
answer one without the other.

## Decision

**What governance recommends, and why.**

| Key | Recommended value | Reason |
| --- | --- | --- |
| `architecture.document` | `arc42` | its twelve sections give every architecture fact one fixed place, so an agent and a reader know where to look and where to write, and a missing section is visible as a missing file |
| `architecture.diagrams` | `mermaid` | GitHub renders it from a fenced code block, and the recommended site (ADR-0008) renders it in the browser, so a diagram is text in the page that needs no build step and no image file |
| `architecture.model` | `likec4` | the diagrams become code: one model in text files, several views generated from it, reviewed in a diff like the rest of the repository. An agent can read and change it, which it cannot do with an image |

**The document is a directory, `docs/architecture/arc42/`, with one file
per section.** One file per section keeps each change small, lets a pull
request touch only the section it changes, and gives an agent a precise
file to open. The path is fixed: it does not move with `docs.root`.

**governance ships no template for now.** Create the twelve files below.
Fill only those you have something to say in; a section with nothing to say
yet keeps its file with one line saying so, rather than disappearing:

| File | arc42 section |
| --- | --- |
| `01-introduction-and-goals.md` | Introduction and Goals |
| `02-constraints.md` | Constraints |
| `03-context-and-scope.md` | Context and Scope |
| `04-solution-strategy.md` | Solution Strategy |
| `05-building-block-view.md` | Building Block View |
| `06-runtime-view.md` | Runtime View |
| `07-deployment-view.md` | Deployment View |
| `08-cross-cutting-concepts.md` | Cross-cutting Concepts |
| `09-architecture-decisions.md` | Architecture Decisions |
| `10-quality-requirements.md` | Quality Requirements |
| `11-risks-and-technical-debt.md` | Risks and Technical Debt |
| `12-glossary.md` | Glossary |

**Section 9 does not repeat the ADRs.** It links to `docs/adr/`, where the
decisions live; copying them would give two places to keep in step.

**The model lives in `docs/architecture/model/`**, as LikeC4 `.c4` files:
one model of the system's elements and relationships, from which the views
are generated. The sections that show structure use views of that model
rather than hand-drawn diagrams: Context and Scope (3), Building Block View
(5) and Deployment View (7). A diagram drawn by hand next to the model would
be a second source, and it would drift.

**What the model does not show is drawn in `mermaid`.** Sequences, state
machines and flows (mostly in the Runtime View, section 6, and in
Cross-cutting Concepts, section 8) are not structure, so they do not belong
in the model. They are written as Mermaid code blocks in the section file
itself. Never redraw in Mermaid an element the model already holds: that is
the second source the model exists to avoid.

**This document is not the user documentation of
[ADR-0008](ADR-0008-documentation.md).** It is written for whoever changes
the product, often an agent, and borrows nothing from ADR-0008 but,
possibly, the site that serves both. Diátaxis does not classify its
sections, and `docs.audience` does not apply to it.

**Its audience, and that of the ADRs, is the repository's visibility**:
whoever can read the repository reads them. It is observed, not asked, so
it has no key. A private repository whose user documentation is `public`
keeps its architecture private only if its site does not publish
`docs/architecture/`; ADR-0008 shows how to exclude it.

**This recommendation does not bind your repository.** If your architecture
already lives in a mature document elsewhere, say `elsewhere` and name the
path in this ADR's body. If you keep no architecture document, say `none`:
that is an honest answer for a small repository. For `architecture.model`,
another architecture-as-code tool is a valid answer when named, and `none`
means the diagrams, if any, are drawn by hand. For
`architecture.diagrams`, `plantuml` is the other text format, and `none`
means the section files hold no diagram outside the model's views.

**Ruling.** We adopt `arc42` (in `docs/architecture/arc42/`, one file per
section) and `mermaid`, and depart on the model: `model: none`.
[ADR-0008](ADR-0008-documentation.md) ruled that there is no documentation
site, so pages are read on GitHub, which renders Mermaid from a code block
but cannot display LikeC4 views. A model nobody can see without running a
CLI would not be read. The structure views (sections 3, 5 and 7) are
therefore drawn in Mermaid too, and each one is kept consistent with the
others by review. Revisit this if a documentation site is ever set up.

## Consequences

### Positive

- Every architecture fact has one fixed place, and every diagram renders
  on GitHub with no build step.
- Nothing to install to read or change a diagram.

### Negative

- Each Mermaid structure view repeats the elements it shows, so views can
  drift from one another; only review keeps them in step.
- The twelve sections have to be written: today the only structure
  description is an outdated tree in `README.md`.

### Neutral

- Section 9 links to `docs/adr/` instead of repeating the decisions.

## Alternatives Considered

### `arc42` in one directory, one file per section

`docs/architecture/arc42/`, twelve files. Recommended.

### `arc42` in a single file

One `arc42.md`, as surdesrails does. Simpler to start, but every change
touches the same file, and the file grows long enough that an agent reads
far more than it needs.

### `elsewhere`

The architecture already lives in another document. Keep it there and name
its path in this ADR.

### `none`

No architecture document. Honest for a small repository whose structure is
read from the code and ADR-0003.

### Diagrams drawn by hand

Images or drawing-tool files next to the document. No tool to learn, but an
agent cannot change them, review cannot diff them, and each view drifts from
the others on its own.

### PlantUML for diagrams outside the model

Richer sequence and state notation than Mermaid, but it needs a renderer:
GitHub does not display it from a code block, and a documentation site
needs a plugin or a rendering server.

### Another architecture-as-code tool

Structurizr DSL or diagrams as code in Mermaid or PlantUML. Valid answers
when named; governance recommends LikeC4 because one model feeds every view,
where diagram-by-diagram tools repeat each element in each picture.

## References

- Suggested skills: `arc42-section-01` to `arc42-section-12` and `arc42-review` from `arc42-toolkit@arc42-toolkit`.
- Split out of surdesrails [SDR-0003](https://github.com/trivoallan/surdesrails/blob/main/resources/docs/adr/SDR-0003-architecture.md), revision 1 (its `architecture.document` key). surdesrails ships an arc42 template; governance does not yet.
- [arc42](https://arc42.org/overview): the twelve sections.
- [LikeC4](https://likec4.dev/): architecture as code, one model and generated views.
- [C4 model](https://c4model.com/): the context, container and component levels LikeC4 views draw.
- [Mermaid](https://mermaid.js.org/): diagrams as text, rendered by GitHub and in the browser by the documentation site.
- [ADR-0001](ADR-0001-record-architecture-decisions.md): how governance ADRs are ruled on.

**The keys.**

| Key | What it holds | Allowed values |
| --- | --- | --- |
| `architecture.document` | where this repository's architecture document lives | `arc42` (`docs/architecture/arc42/`, one file per section), `elsewhere`, `none` |
| `architecture.model` | what the architecture diagrams are made from | `likec4` (`docs/architecture/model/`), another named tool, or `none` |
| `architecture.diagrams` | the text format of diagrams the model does not cover | `mermaid`, `plantuml`, `none` |

**`architecture.model` is not checked against a list**: architecture-as-code
tools are not a closed set. The schema checks that you answered, never that
the answer is right.

**All three keys are required**: an empty key is not an answer. The value is
written in this file and nowhere else; whoever needs it links here. See
ADR-0001 for the check command.
