// Configuration pour commitlint
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Type enum
    'type-enum': [
      2,
      'always',
      [
        'feat',     // Nouvelle fonctionnalité
        'fix',      // Correction de bug
        'docs',     // Documentation
        'style',    // Formatage, point-virgule manquant, etc.
        'refactor', // Refactorisation du code
        'perf',     // Amélioration des performances
        'test',     // Ajout ou modification de tests
        'build',    // Changements liés au build
        'ci',       // Changements CI/CD
        'chore',    // Autres changements (deps, config, etc.)
        'revert',   // Revert d'un commit précédent
        'security', // Corrections de sécurité
      ],
    ],
    // Longueur du type
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],

    // Scope
    'scope-enum': [
      2,
      'always',
      [
        'api',
        'web',
        'ui',
        'marketplace',
        'deps',
        'deps-dev',
        'ci',
        'config',
        'security',
        'docs',
        'testing',
        'docker',
      ],
    ],

    // Subject
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'subject-case': [2, 'never', ['sentence-case', 'start-case', 'pascal-case', 'upper-case']],

    // Header
    'header-max-length': [2, 'always', 100],

    // Body
    'body-leading-blank': [1, 'always'],
    'body-max-line-length': [2, 'always', 100],

    // Footer
    'footer-leading-blank': [1, 'always'],
    'footer-max-line-length': [2, 'always', 100],
  },
};