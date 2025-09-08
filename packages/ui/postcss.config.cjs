const isProd = process.env.NODE_ENV === 'production'

module.exports = {
  plugins: [
    require('autoprefixer'),
    ...(isProd
      ? [
          require('cssnano')({
            preset: [
              'default',
              {
                discardComments: { removeAll: true },
                normalizeWhitespace: true,
                mergeRules: true,
                minifyFontValues: true,
                minifySelectors: true,
                // Advanced optimizations
                reduceIdents: false, // Keep for CSS-in-JS compatibility
                zindex: false, // Keep z-index values intact
                colormin: true,
                convertValues: true,
                discardDuplicates: true,
                discardEmpty: true,
                discardOverridden: true,
                mergeIdents: false,
                mergeLonghand: true,
                minifyGradients: true,
                minifyParams: true,
                normalizeCharset: true,
                normalizeDisplayValues: true,
                normalizePositions: true,
                normalizeRepeatStyle: true,
                normalizeString: true,
                normalizeTimingFunctions: true,
                normalizeUnicode: true,
                normalizeUrl: true,
                orderedValues: true,
                reduceInitial: true,
                reduceTransforms: true,
                svgo: true,
                uniqueSelectors: true,
              },
            ],
          }),
        ]
      : []),
  ],
}
