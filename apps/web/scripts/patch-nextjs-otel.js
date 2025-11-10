const fs = require('fs')
const path = require('path')

// Path to the bundled OpenTelemetry API in Next.js
const otelPath = path.join(
  __dirname,
  '../node_modules/next/dist/compiled/@opentelemetry/api/index.js'
)

try {
  if (fs.existsSync(otelPath)) {
    let content = fs.readFileSync(otelPath, 'utf8')

    // Replace all DiagLogLevel references with numeric values
    if (!content.includes('__NEXTJS_OTEL_PATCHED__')) {
      // Replace patterns like n.DiagLogLevel.ERROR or DiagLogLevel.ERROR with just the number
      content = content.replace(/\w+\.DiagLogLevel\.ERROR/g, '30')
      content = content.replace(/\w+\.DiagLogLevel\.WARN/g, '50')
      content = content.replace(/\w+\.DiagLogLevel\.INFO/g, '60')
      content = content.replace(/\w+\.DiagLogLevel\.DEBUG/g, '70')
      content = content.replace(/\w+\.DiagLogLevel\.VERBOSE/g, '80')
      content = content.replace(/\w+\.DiagLogLevel\.ALL/g, '9999')
      content = content.replace(/\w+\.DiagLogLevel\.NONE/g, '0')
      // Also replace standalone DiagLogLevel.X references
      content = content.replace(/DiagLogLevel\.ERROR/g, '30')
      content = content.replace(/DiagLogLevel\.WARN/g, '50')
      content = content.replace(/DiagLogLevel\.INFO/g, '60')
      content = content.replace(/DiagLogLevel\.DEBUG/g, '70')
      content = content.replace(/DiagLogLevel\.VERBOSE/g, '80')
      content = content.replace(/DiagLogLevel\.ALL/g, '9999')
      content = content.replace(/DiagLogLevel\.NONE/g, '0')

      // Add marker at the beginning
      content = '/* __NEXTJS_OTEL_PATCHED__ */\n' + content

      fs.writeFileSync(otelPath, content, 'utf8')
      console.log('✅ Patched Next.js OpenTelemetry API - replaced DiagLogLevel references')
    } else {
      console.log('✅ Next.js OpenTelemetry API already patched')
    }
  } else {
    console.log('⚠️  Next.js OpenTelemetry API file not found - skipping patch')
  }
} catch (error) {
  console.error('❌ Error patching Next.js OpenTelemetry:', error.message)
}

// Patch @edge-runtime/primitives ERROR constant issue
const edgeRuntimeFiles = [
  path.join(__dirname, '../node_modules/next/dist/compiled/@edge-runtime/primitives/fetch.js'),
  path.join(__dirname, '../node_modules/next/dist/compiled/@edge-runtime/primitives/load.js'),
]

try {
  for (const filePath of edgeRuntimeFiles) {
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8')

      if (!content.includes('__EDGE_RUNTIME_PATCHED__')) {
        // Replace ERROR = void 0 with ERROR = {} to prevent undefined access
        content = content.replace(
          /exports2\.ERROR = void 0;/g,
          'exports2.ERROR = {};'
        )

        // Fix the IIFE pattern that tries to read ERROR before it's initialized
        // Change: })(ERROR = exports2.ERROR || (exports2.ERROR = {}));
        // To:     })(ERROR = exports2.ERROR = exports2.ERROR || {});
        content = content.replace(
          /\}\)\(ERROR = exports2\.ERROR \|\| \(exports2\.ERROR = \{\}\)\);/g,
          '})(ERROR = exports2.ERROR = exports2.ERROR || {});'
        )

        // Add marker
        content = '/* __EDGE_RUNTIME_PATCHED__ */\n' + content

        fs.writeFileSync(filePath, content, 'utf8')
        console.log(`✅ Patched ${path.basename(filePath)} - fixed ERROR constant`)
      } else {
        console.log(`✅ ${path.basename(filePath)} already patched`)
      }
    }
  }
} catch (error) {
  console.error('❌ Error patching Edge Runtime:', error.message)
}
