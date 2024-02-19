module.exports = {
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/eslint-recommended', 'plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'],
    plugins: ['@typescript-eslint'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        sourceType: 'module',
        project: 'tsconfig.json'
    },
    rules: {
        eqeqeq: 'error',
        curly: ['error', 'all'],
        'prefer-arrow-callback': 'error',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unused-vars': [
            'warn',
            {
                args: 'none'
            }
        ],
        '@typescript-eslint/quotes': [
            'error',
            'single',
            {
                avoidEscape: true,
                allowTemplateLiterals: false
            }
        ]
    },
    ignorePatterns: ['**/node_modules', '**/dist', '**/lib', '*.js']
};
