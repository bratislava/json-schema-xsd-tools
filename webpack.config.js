const path = require('path')
const ESLintPlugin = require('eslint-webpack-plugin')

module.exports = {
  entry: './src/json-schema-xsd-tools.ts',
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'json-schema-xsd-tools.js',
    globalObject: 'this',
    library: {
      name: 'json-schema-xsd-tools',
      type: 'umd',
    },
  },
  mode: 'production',
  plugins: [new ESLintPlugin()],
  externals: {
    lodash: {
      commonjs: 'lodash',
      commonjs2: 'lodash',
      amd: 'lodash',
      root: '_',
    },
    cheerio: {
      commonjs: 'cheerio',
      commonjs2: 'cheerio',
      amd: 'cheerio',
      root: 'cheerio',
    },
  },
}
