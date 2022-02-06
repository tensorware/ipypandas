const path = require('path');
const version = require('./package.json').version;

const mode = 'production'
const rules = [
    { test: /\.ts$/, loader: 'ts-loader' },
    { test: /\.js$/, loader: 'source-map-loader' },
    { test: /\.css$/, use: ['style-loader', 'css-loader'] }
];
const externals = ['@jupyter-widgets/base'];
const resolve = {
    extensions: ['.webpack.js', '.web.js', '.ts', '.js']
};

module.exports = [
    /**
     * JavaScript bundle that is run on load of the notebook.
     */
    {
        entry: './src/extension.ts',
        mode: mode,
        output: {
            filename: 'index.js',
            path: path.resolve(__dirname, 'ipypandas', 'nbextension'),
            libraryTarget: 'amd',
            publicPath: '',
        },
        module: {
            rules: rules
        },
        devtool: 'source-map',
        externals,
        resolve,
    },
    /**
     * Similar to the notebook bundle but with path for static assets.
     */
    {
        entry: './src/index.ts',
        mode: mode,
        output: {
            filename: 'index.js',
            path: path.resolve(__dirname, 'dist'),
            libraryTarget: 'amd',
            library: 'ipypandas',
            publicPath: 'https://unpkg.com/ipypandas@' + version + '/dist/'
        },
        devtool: 'source-map',
        module: {
            rules: rules
        },
        externals,
        resolve,
    },
    /**
     * Embed widgets in the package documentation.
     */
    {
        entry: './src/index.ts',
        mode: mode,
        output: {
            filename: 'embed-bundle.js',
            path: path.resolve(__dirname, 'docs', 'source', '_static'),
            library: 'ipypandas',
            libraryTarget: 'amd'
        },
        module: {
            rules: rules
        },
        devtool: 'source-map',
        externals,
        resolve,
    }
];
