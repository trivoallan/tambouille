## Context

L'ADR-0005 fixe `boundary: class-validator` et demande que les réponses tierces
et les lectures de l'API par le frontend passent sous un schéma déclaré. Les
importeurs vérifient aujourd'hui leurs entrées par des `typeof` successifs. Le
frontend lit `response.data` sans contrôle.

## Goals / Non-Goals

**Goals**
- Un schéma déclaré par frontière, voisin du code qui lit.
- Une réponse non conforme échoue à la lecture, pas plus loin.

**Non-Goals**
- Modifier le comportement des importeurs sur les réponses conformes.
- Valider ce que le code produit lui-même.

## Decisions

1. **Backend : `class-validator` avec `class-transformer`** (`plainToInstance`
   puis `validate`) sur des classes de réponse placées à côté de chaque
   importeur. C'est le mécanisme que l'ADR-0005 a retenu ; ajouter `zod` créerait
   une seconde source. Les champs optionnels du tiers sont déclarés `@IsOptional`,
   pour conserver le comportement actuel (un titre absent est une erreur, une
   description absente non).
2. **Frontend : une bibliothèque de schéma qui dérive le type du schéma**
   (`zod`, recommandée par l'ADR-0005 pour TypeScript), parce que le frontend n'a
   pas de pipe NestJS. Alternative écartée : `class-validator` côté navigateur,
   lourd et décoratif pour de simples réponses. Son ajout est soumis à
   approbation par une personne (ADR-0020).
3. **Point d'application côté frontend** : un helper qui prend un schéma et
   renvoie la donnée typée, utilisé par les modules de `frontend/src/api/`,
   plutôt qu'un intercepteur global, qui ne saurait pas quel schéma appliquer.
4. **Échec** : côté importeur, l'erreur existante pour réponse inexploitable ;
   côté frontend, une erreur identifiable par `apiError.ts`, affichée comme les
   autres erreurs d'API.

## Risks / Trade-offs

- Un schéma trop strict casse une lecture qui fonctionnait. Mitigation : les
  schémas ne déclarent obligatoires que les champs que le code exige déjà, et
  chaque schéma est exercé sur les fixtures réelles existantes.
- Le frontend gagne une dépendance. Mitigation : approbation préalable.

## Migration Plan

Frontière par frontière, une importeur ou un module d'API par commit, sans
changement de comportement sur les données valides. Retour arrière : revert du
commit concerné.

## Open Questions

Aucune bloquante. Le choix de `zod` pour le frontend est une recommandation à
confirmer lors de l'approbation de la dépendance.
