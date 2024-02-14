module.exports = {
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/eslint-recommended', 'plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'],
    plugins: ['@typescript-eslint'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        sourceType: 'module',
        project: 'tsconfig.json'
    },
    ignorePatterns: ['**/node_modules', '**/dist', '**/lib', '*.js'],
    rules: {
        '@typescript-eslint/no-use-before-define': 'off',
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-namespace': 'off',
        '@typescript-eslint/no-unused-vars': [
            'warn',
            {
                args: 'none'
            }
        ],
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/quotes': [
            'error',
            'single',
            {
                avoidEscape: true,
                allowTemplateLiterals: false
            }
        ],
        curly: ['error', 'all'],
        eqeqeq: 'error',
        'prefer-arrow-callback': 'error'
    }
};
