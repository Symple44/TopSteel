import { execSync } from 'node:child_process'

try {
  execSync('npx @biomejs/biome check . --max-diagnostics=1000', {
    encoding: 'utf8',
    stdio: 'pipe',
  })
} catch (error) {
  const output = error.stdout || error.stderr || ''
  const lines = output.split('\n')

  const unusedVarErrors = []
  let currentError = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.includes('lint/correctness/noUnusedVariables')) {
      currentError = {
        file: '',
        location: '',
        rule: 'noUnusedVariables',
        context: [],
      }

      // Extract file path from the previous lines
      for (let j = i - 5; j < i; j++) {
        if (j >= 0 && lines[j].trim() && !lines[j].includes('━') && !lines[j].includes('!')) {
          const match = lines[j].match(/^([^:]+):(\d+):(\d+)/)
          if (match) {
            currentError.file = match[1]
            currentError.location = `${match[2]}:${match[3]}`
            break
          }
        }
      }

      unusedVarErrors.push(currentError)
    }

    if (currentError && (line.includes('>') || line.includes('│'))) {
      currentError.context.push(line)
    }

    if (line.includes('━━━') && currentError) {
      currentError = null
    }
  }
  unusedVarErrors.forEach((err, _i) => {
    err.context.slice(0, 3).forEach((_ctx) => {})
  })
}
