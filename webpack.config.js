const path = require('path');
const version = require('./package.json').version;

const mode = 'production'
const externals = ['@jupyter-widgets/base'];
const resolve = {
    extensions: ['.webpack.js', '.web.js', '.js', '.ts']
};
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

module.exports = [
    /**
     * JavaScript that is run on load of the notebook.
     */
    {
        entry: './src/index.ts',
        devtool: 'source-map',
        output: {
            filename: 'index.js',
            path: path.resolve(__dirname, 'dist'),
            library: 'ipypandas',
            libraryTarget: 'amd',
            publicPath: 'https://unpkg.com/ipypandas@' + version + '/dist/'
        },
        mode: mode,
        module: {
            rules: rules
        },
        externals,
        resolve
    },
    /**
     * Embed widgets in the package documentation.
     */
    {
        entry: './src/index.ts',
        devtool: 'source-map',
        output: {
            filename: 'embed.js',
            path: path.resolve(__dirname, 'docs', 'source', 'static'),
            library: 'ipypandas',
            libraryTarget: 'amd'
        },
        mode: mode,
        module: {
            rules: rules
        },
        externals,
        resolve
    }
];
