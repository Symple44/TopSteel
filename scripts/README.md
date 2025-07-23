# Scripts Documentation

This directory contains utility scripts for the TopSteel ERP project.

## verify-package-consistency.js

**Purpose**: Verifies that all packages in `pnpm-lock.yaml` are properly declared in `package.json` files across the workspace.

**Usage**:
```bash
# Direct execution
node scripts/verify-package-consistency.js

# Via npm script
pnpm verify:packages
```

**What it does**:
1. Parses `pnpm-lock.yaml` to extract all dependencies for each workspace
2. Reads `package.json` files from all workspace packages
3. Compares the two and identifies potential inconsistencies
4. Uses intelligent filtering to focus on likely direct dependencies vs transitive dependencies

**Key Features**:
- **Smart filtering**: Ignores common transitive dependencies and hoisted packages to reduce false positives
- **Workspace-aware**: Checks all packages in the monorepo (root, apps/*, packages/*)
- **Pattern matching**: Uses heuristics to identify packages that should likely be explicit dependencies
- **Detailed reporting**: Shows exactly which packages are missing from which workspace

**Exit Codes**:
- `0`: No inconsistencies found
- `1`: Inconsistencies detected or script error

**Common patterns it looks for**:
- Development tools: `@types/*`, `eslint`, `typescript`, `@typescript-eslint/*`
- Testing tools: `vitest`, `@vitest/*`, `jest`, `@testing-library/*`
- Build tools: `@nestjs/*`, `@storybook/*`, `tsup`, `rimraf`
- UI libraries: `@radix-ui/react-*` (main components), `@tanstack/*`, `@dnd-kit/*`
- Framework packages: `next`, `react`, `axios`, `zod`

**What it ignores**:
- Internal workspace packages (`@erp/*`)
- Common transitive dependencies (`@radix-ui/react-primitive`, `@floating-ui/*`, etc.)
- Build tool internals (`@swc/*`, `@babel/*`, `scheduler`, `tslib`)
- React ecosystem utilities (`use-callback-ref`, `react-remove-scroll`, etc.)

**Example output**:
```
🔍 Verifying package consistency across workspace...

📊 Results:

✅ root
   Lockfile: 100 packages, package.json: 101 packages

❌ packages/types
   Lockfile: 10 packages, package.json: 10 packages
   Missing from package.json: 1 packages
   📦 dependencies:
      - react

📋 Summary:
   Total workspaces checked: 9
   Workspaces with inconsistencies: 1
   Total missing packages: 1
```

**When to run**:
- After adding new dependencies
- Before committing changes
- As part of CI/CD pipeline
- When investigating dependency issues
- Periodically to maintain project health