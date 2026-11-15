---
adr: ADR-0007
slug: tests
title: Tests
status: accepted
revision: 1
date: 2026-11-14
authors: [Tristan Rivoallan]
supersedes: []
traits:
  tests:
    coverage_target: 90
---

# Tests

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
know what coverage to hold. So it aims for none, and ships code tested
according to whatever seemed useful at the time. Once the value is written,
it knows what it must reach before opening its pull request.

governance already requires **test-driven development** and **three fixed
bounds** on what "coverage" means. What is left to you is the **number**,
because it depends on what this repository does and on what you are willing
to defend in review.

## Decision

**What governance recommends, and why.**

| Key | Recommended value | Reason |
| --- | --- | --- |
| `tests.coverage_target` | `90` | high enough that untested code stands out, and the three bounds below make it reachable without gaming it |

**The three bounds are not up for ruling**, and they are what makes the
number comparable from one repository to the next:

1. **unit tests only**: an integration harness does not count;
2. **hand-written code**: excluding tests, generated output and templates;
3. **line coverage**.

**This recommendation does not bind your repository.** A repository that
aims higher says so; a repository that aims lower says so too, and writes
why. What is not an answer is a number nobody holds.

**The threshold applies to the main language**, the one
[ADR-0004](ADR-0004-languages.md) declares. A repository with several
languages declares the others in this ADR's body, with their tool. The key
carries only one, because an agent only needs that one to know where it
stands.

**Ruling.** We adopt the recommendation as is: 90% line coverage of
hand-written TypeScript, by unit tests (Jest in `backend`, Vitest in
`frontend`). On the day of ruling the backend stood at 69.8% and the
frontend was not measured; the target is where we are going, not where we
are.

## Consequences

### Positive

- Untested code stands out, in the backend and the frontend alike.
- A change an agent makes is checkable without standing up the
  environment.

### Negative

- The backend is 20 points short and the frontend unmeasured: reaching the
  target is real work, and until a threshold is enforced the number is
  held by nobody.

### Neutral

- The e2e suite (`backend/test`) does not count toward the threshold.

## Alternatives Considered

### A numeric threshold

The one you hold and can defend. Recommended, at `90`.

### `none`

For a language with no coverage tool, or a repository where the measure
would teach nothing. **It is an answer**, and it is justified in this file
like any other.

## References

- Suggested skills: `test-driven-development` from `superpowers@superpowers-marketplace`.
- Adapted from surdesrails [SDR-0007](https://github.com/trivoallan/surdesrails/blob/main/resources/docs/adr/SDR-0007-tests.md), revision 1.
- [ADR-0001](ADR-0001-record-architecture-decisions.md): how governance ADRs are ruled on.
- [ADR-0004](ADR-0004-languages.md): the main language the threshold applies to.

**The key.**

| Key | What it holds | Allowed values |
| --- | --- | --- |
| `tests.coverage_target` | the coverage threshold of the main language, as a percentage | a number, or `none` |

**What this key does not cover:** no runner, test command, expected output
or coverage tool. governance does not carry them: it does not know what your
repository runs.

**An empty key is not an answer**: this one is required, and `none` is an
answer where empty is not. **On this point the check does not protect
you.** It can refuse a value outside a closed set, but here the value is a
number or the word `none`, and no type covers both, so **an empty key
passes**. Review catches it, and it is better to know that than to find out.
The value is written in this file and nowhere else; whoever needs it links
here. See ADR-0001 for the check command.
