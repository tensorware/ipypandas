const CopyPlugin = require('copy-webpack-plugin');
const version = require('./package.json').version;
const path = require('path');

const rules = [
    {
        test: /\.ts$/,
        use: [{ loader: 'ts-loader' }]
    },
    {
        test: /\.js$/,
        use: [{ loader: 'source-map-loader' }]
    },
    {
        test: /\.css$/,
        use: [{ loader: 'style-loader' }, { loader: 'css-loader' }]
    },
    {
        test: /\.less$/,
        use: [{ loader: 'file-loader' }, { loader: 'style-loader' }, { loader: 'less-loader' }, { loader: 'css-loader' }]
    }
];
const resolve = { extensions: ['.webpack.js', '.web.js', '.js', '.ts'] };
const externals = ['@jupyter-widgets/base'];

module.exports = [
    {
        // javascript bundle that is run on load of the notebook
        entry: './src/nbextension/index.ts',
        devtool: 'source-map',
        output: {
            filename: 'index.js',
            path: path.resolve(__dirname, 'ipypandas', 'nbextension'),
            library: {
                name: 'ipypandas',
                type: 'amd'
            }
        },
        module: {
            rules: rules
        },
        plugins: [
            new CopyPlugin({
                patterns: [{ from: path.resolve(__dirname, 'src', 'nbextension', 'extension.js'), to: 'extension.js' }]
            })
        ],
        externals,
        resolve
    },
    {
        // similar to the notebook bundle with unpkg public path for static assets
        entry: './src/labextension/index.ts',
        devtool: 'source-map',
        output: {
            filename: 'index.js',
            path: path.resolve(__dirname, 'dist'),
            publicPath: 'https://unpkg.com/ipypandas@' + version + '/dist/',
            library: {
                name: 'ipypandas',
                type: 'amd'
            }
        },
        module: {
            rules: rules
        },
        externals,
        resolve
    },
    {
        // similar to the notebook bundle which embeds widgets in the documentation
        entry: './src/index.ts',
        devtool: 'source-map',
        output: {
            filename: 'embed.js',
            path: path.resolve(__dirname, 'docs', 'source', 'static'),
            library: {
                name: 'ipypandas',
                type: 'amd'
            }
        },
        module: {
            rules: rules
        },
        externals,
        resolve
    }
];
