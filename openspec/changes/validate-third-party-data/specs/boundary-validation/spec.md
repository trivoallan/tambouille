## ADDED Requirements

### Requirement: Les réponses des sources importées sont validées par un schéma déclaré

Le système MUST décrire la forme attendue de chaque réponse d'une source
importée par un schéma déclaré, placé à côté de l'importeur qui la lit. Il MUST
refuser une réponse qui ne s'y conforme pas, avant d'en utiliser un champ. Il
MUST NOT reposer sur des tests de type écrits à la main champ par champ.

#### Scenario: Réponse conforme

- **WHEN** une source renvoie une réponse conforme au schéma
- **THEN** l'import aboutit comme avant

#### Scenario: Champ obligatoire absent ou mal typé

- **WHEN** une source renvoie une réponse dont un champ obligatoire manque ou n'a pas le bon type
- **THEN** l'import est refusé avec une erreur de réponse inexploitable
- **AND** aucun champ de cette réponse n'est utilisé

#### Scenario: Champ facultatif absent

- **WHEN** une source renvoie une réponse sans l'un de ses champs facultatifs
- **THEN** l'import aboutit sans cette valeur

### Requirement: Les réponses de l'API lues par le frontend sont validées par un schéma déclaré

Le frontend MUST valider chaque réponse de l'API qu'il consomme contre un schéma
déclaré, et MUST traiter une réponse non conforme comme une erreur d'API plutôt
que de la transmettre aux composants.

#### Scenario: Réponse conforme

- **WHEN** l'API renvoie une réponse conforme au schéma attendu
- **THEN** les composants reçoivent la donnée typée

#### Scenario: Réponse non conforme

- **WHEN** l'API renvoie une réponse qui ne respecte pas le schéma attendu
- **THEN** la lecture échoue comme une erreur d'API
- **AND** aucune donnée non vérifiée n'atteint les composants
