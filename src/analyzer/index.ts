import { existsSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { Project, QuoteKind } from 'ts-morph'
import { StatisticsCollector } from '../statistics_collector.js'
import { TableFormatter } from '../formatters/table_formatter.js'
import { JsonFormatter } from '../formatters/json_formatter.js'
import type { StatisticsSummary } from '../types.js'

interface AnalysisOptions {
  cwd: string
  customClassifiers?: string[]
}

interface AnalysisResult {
  summary: StatisticsSummary
  toTable(): string
  toJson(verbose?: boolean): string
  getDetailedBreakdown(): Promise<Map<string, any[]>>
}

function findTsConfig(cwd: string): string | undefined {
  const possiblePaths = [resolve(cwd, 'tsconfig.json')]

  for (const path of possiblePaths) {
    if (existsSync(path)) {
      return path
    }
  }

  return undefined
}

export async function runAnalysis(options: AnalysisOptions): Promise<AnalysisResult> {
  const { cwd, customClassifiers = [] } = options

  const tsConfigPath = findTsConfig(cwd)
  const project = new Project({
    manipulationSettings: { quoteKind: QuoteKind.Single },
    ...(tsConfigPath ? { tsConfigFilePath: tsConfigPath } : {}),
  })

  const sourceDirs = ['app', 'tests']
  for (const dir of sourceDirs) {
    const dirPath = resolve(cwd, dir)
    if (existsSync(dirPath)) {
      project.addSourceFilesAtPaths(join(dirPath, '**/*.ts'))
    }
  }

  const collector = new StatisticsCollector({
    project,
    config: { customClassifiers },
    cwd,
  })

  const summary = await collector.collect()

  const result: AnalysisResult = {
    summary,
    toTable(): string {
      const formatter = new TableFormatter()
      return formatter.format(summary)
    },
    toJson(verbose: boolean = false): string {
      const formatter = new JsonFormatter()
      return formatter.format(summary, verbose)
    },
    async getDetailedBreakdown(): Promise<Map<string, any[]>> {
      return await collector.getDetailedBreakdown()
    },
  }

  return result
}
