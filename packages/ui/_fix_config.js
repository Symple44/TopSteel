const fs = require('fs');
let content = fs.readFileSync('vite.config.mts', 'utf8');
// Remove all business/* entry points except business/index
const entrySection = content.match(/entry: \{[\s\S]*?\},\n\s+formats:/);
if (entrySection) {
  let entry = entrySection[0];
  // Keep only valid entries
  const newEntry = `entry: {
          index: resolve(__dirname, 'src/index.ts'),
          'hooks/index': resolve(__dirname, 'src/hooks/index.ts'),
          'primitives/index': resolve(__dirname, 'src/components/primitives/index.ts'),
          'layout/index': resolve(__dirname, 'src/components/layout/index.ts'),
          'forms/index': resolve(__dirname, 'src/components/forms/index.ts'),
          'data-display/index': resolve(__dirname, 'src/components/data-display/index.ts'),
          'feedback/index': resolve(__dirname, 'src/components/feedback/index.ts'),
          'navigation/index': resolve(__dirname, 'src/components/navigation/index.ts'),
          'business/index': resolve(__dirname, 'src/components/business/index.ts'),
          'theme/index': resolve(__dirname, 'src/components/theme/index.ts'),
        },
        formats:`;
  content = content.replace(entrySection[0], newEntry);
}
fs.writeFileSync('vite.config.mts', content);
console.log('Config updated!');
