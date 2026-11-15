## 1. Importeurs (backend)

- [ ] 1.1 Dresser la liste des lectures de réponses tierces dans `backend/src/imports` (SoundCloud, Archive, Lyl, Flarum, podcasts)
- [ ] 1.2 Déclarer une classe de réponse `class-validator` par source, à côté de son importeur
- [ ] 1.3 Remplacer les tests `typeof` manuels de chaque importeur par la validation de cette classe
- [ ] 1.4 Tests : réponse conforme (fixtures existantes), champ obligatoire absent, champ mal typé, champ facultatif absent

## 2. Frontend

- [ ] 2.1 Faire approuver par une personne la bibliothèque de schéma du frontend (ADR-0020)
- [ ] 2.2 Ajouter un helper de lecture validée dans `frontend/src/api/`
- [ ] 2.3 Déclarer un schéma par réponse consommée et l'appliquer dans chaque module d'API
- [ ] 2.4 Traiter une réponse non conforme comme une erreur d'API dans `apiError.ts`
- [ ] 2.5 Tests : réponse conforme, réponse non conforme

## 3. Documentation

- [ ] 3.1 Mettre à jour les conséquences de l'ADR-0005 une fois les deux frontières couvertes
