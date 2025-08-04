const path = require('path')
const walkdir = require('walkdir')

const entryNameReplacePrefix = new RegExp(`^${__dirname}\\/src\\/main\\/typescript\\/`)
const entryValueReplacePrefix = new RegExp(`^${__dirname}\\/`)

const entries = walkdir.sync(path.resolve(__dirname, 'src/main/typescript'))
  .filter(path => path.endsWith('.ts'))
  .reduce((acc, path) => {
    const entryName = path.replace(entryNameReplacePrefix, '')
      .replace(/.ts$/, '')

    acc[entryName] = `./${path.replace(entryValueReplacePrefix, '')}`
    return acc
  }, {})

module.exports = (env) => {
  return {
    entry: entries,
    mode: env.environment,
    module: {
      rules: [
        {
          test: /[.]ts$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
    devtool: 'source-map',
    resolve: {
      extensions: [
        '.ts',
        '.js'
      ],
    },
    output: {
      path: path.resolve(__dirname, 'build/resources/main/static/js'),
      filename: '[name].js',
    },
  }
}