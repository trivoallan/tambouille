Issue served: trivoallan/tambouille#16

## Why

L'ADR-0005 exige que toute donnée qui entre sans avoir été produite par le code
en cours soit validée par un schéma déclaré. Les requêtes entrantes de l'API
le sont déjà (DTO `class-validator`). Deux frontières ne le sont pas :

- Les réponses des sources importées (`backend/src/imports` : SoundCloud,
  Archive, Lyl, Flarum, podcasts). Chaque importeur fait un `JSON.parse` suivi
  de tests `typeof` écrits à la main, différents d'un fichier à l'autre ; un
  champ ajouté à la lecture n'est couvert par rien.
- Les réponses de l'API lues par le frontend (`frontend/src/api/client.ts`),
  qui les prend telles quelles, sans aucune vérification.

L'ADR le reconnaît lui-même dans ses conséquences négatives : tant que ces
deux frontières n'ont pas de schéma, elles restent vérifiées à la main ou pas du
tout.

## What Changes

- Chaque réponse tierce lue par un importeur est décrite par un schéma
  déclaré, placé à côté de l'importeur qui la lit ; les tests `typeof` manuels
  disparaissent au profit de ce schéma. Une réponse non conforme est refusée avec
  l'erreur déjà employée aujourd'hui pour une réponse inexploitable.
- Les réponses de l'API consommées par le frontend passent par un schéma
  déclaré, appliqué au point d'accès commun. Le frontend n'a pas de pipe NestJS :
  il choisit sa propre bibliothèque, ce que l'ADR-0005 autorise.
- Aucune dépendance n'est choisie ici sans validation : le choix de la
  bibliothèque frontend, et l'éventuel usage de la même pour les importeurs,
  est tranché dans `design.md`, et son ajout est soumis à approbation (ADR-0020).

## Capabilities

### New Capabilities

- `boundary-validation`: ce qui doit être vrai pour qu'une donnée tierce ou une
  réponse d'API soit acceptée par le code qui la lit.

### Modified Capabilities

Aucune.

## Impact

- Code : `backend/src/imports/*.importer.ts`, `flarum.client.ts`, leurs
  fixtures et tests ; `frontend/src/api/` et les appelants de `apiClient`.
- Dépendances : au moins une bibliothèque de schéma côté frontend, à faire
  approuver par une personne.
- ADR-0005 : ses conséquences négatives se réduisent ; aucune nouvelle ADR n'est
  nécessaire tant que le backend reste sur `class-validator`.

## Non-Goals

- Les DTO entrants du backend : déjà couverts.
- Les fichiers de données des fournées : déjà validés par vitest.
- Exporter un JSON Schema.
- Changer la bibliothèque `boundary` du backend.
