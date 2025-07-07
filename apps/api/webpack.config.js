const path = require('path');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = function(options, webpack) {
  return {
    ...options,
    plugins: [
      ...options.plugins.filter(plugin => 
        !(plugin instanceof ForkTsCheckerWebpackPlugin)
      ),
      new ForkTsCheckerWebpackPlugin({
        typescript: {
          memoryLimit: 4096, // 4GB au lieu de la limite par défaut
          configFile: path.resolve(__dirname, 'tsconfig.json'),
        },
        logger: {
          infrastructure: 'silent',
          issues: 'console',
          devServer: false,
        },
      }),
    ],
  };
};
