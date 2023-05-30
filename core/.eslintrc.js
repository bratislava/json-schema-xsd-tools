module.exports = {
  extends: [
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:eslint-comments/recommended',
    'prettier',
  ],
  plugins: ['@typescript-eslint', 'no-secrets'],
  parser: '@typescript-eslint/parser',
  rules: {
    /** We use this a lot with isDefined and hasAttributes */
    'unicorn/no-array-callback-reference': 'off',
    // Named export is easier to refactor automatically
    'import/prefer-default-export': 'off',
    /** Too tedious to type every function return explicitly */
    '@typescript-eslint/explicit-function-return-type': 'off',
    /** It's annoying to refactor from one style to another */
    'arrow-body-style': 'off',
    /** This are exceptions that we use with "__" */
    'no-underscore-dangle': [2],
    /** Links get confused for secrets */
    'no-secrets/no-secrets': ['error', { ignoreContent: '^http' }],
    /** Presently at too many places & becomes just an ignored clutter, consider turning on later */
    '@typescript-eslint/no-unsafe-assignment': 'off',
    /** Doesn't work without changing our ts config */
    'unicorn/prefer-spread': 'off',
    /** Remove console.log() warnings */
    'no-console': 'off',
    'eslint-comments/disable-enable-pair': ['error', { allowWholeFile: true }],
    'switch-case/newline-between-switch-case': 'off',
    // This rule disallows lexical declarations (let, const, function and class) in case/default clauses.
    'no-case-declarations': 'off',
  }
}
