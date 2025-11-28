import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createJiti } from 'jiti'
import { runAnalysis } from './analyzer/index.js'

function parseArgs() {
  const args = process.argv.slice(2)
  const json = args.includes('--json') || args.includes('-j')
  const verbose = args.includes('--verbose') || args.includes('-v')
  return { json, verbose }
}

async function main() {
  const cwd = process.cwd()
  const { json, verbose } = parseArgs()

  if (!existsSync(resolve(cwd, 'adonisrc.ts'))) {
    console.error('❌ This command must be run inside an AdonisJS project.')
    process.exit(1)
  }

  let config: { customClassifiers?: string[] } = {}
  const configPath = resolve(cwd, 'stats.config.ts')

  if (existsSync(configPath)) {
    try {
      const jiti = createJiti(fileURLToPath(import.meta.url))
      const loaded = (await jiti.import(configPath)) as {
        default?: { customClassifiers?: string[] }
        customClassifiers?: string[]
      }
      config = loaded.default || loaded
      console.log('🔧 Loaded config from stats.config.ts')
    } catch (err) {
      console.warn('⚠️ Failed to load stats.config.ts, using defaults.')
    }
  }

  const results = await runAnalysis({
    cwd,
    customClassifiers: config.customClassifiers || [],
  })

  if (json) {
    console.log(results.toJson(verbose))
  } else {
    console.log(results.toPrettyString())

    if (verbose) {
      console.log('\nDetailed Breakdown:')
      const breakdown = await results.getDetailedBreakdown()
      for (const [componentType, files] of breakdown.entries()) {
        console.log(`\n${componentType}:`)
        for (const file of files) {
          console.log(
            `  ${file.filePath} - ${file.analysis.className || 'No class'} (${file.analysis.methods} methods, ${file.analysis.logicalLinesOfCode} LLoC)`
          )
        }
      }
    }
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
