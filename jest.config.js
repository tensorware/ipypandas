module.exports = {
    automock: false,
    testEnvironment: 'jsdom',
    moduleNameMapper: {
        '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
    },
    preset: 'ts-jest/presets/js-with-babel',
    setupFilesAfterEnv: ['./src/tests/setup.js'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    testPathIgnorePatterns: ['/lib/', '/node_modules/'],
    testRegex: '/tests/test_.*.ts[x]?$',
    transform: {
        '^.+\\.(ts|tsx)$': [
            'ts-jest',
            {
                tsconfig: '<rootDir>/tsconfig.json'
            },
        ],
    },
    transformIgnorePatterns: ['/node_modules/(?!(@jupyter(lab|-widgets)/.*)/)']
};
