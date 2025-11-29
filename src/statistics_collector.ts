import { CodeAnalyzer } from './analyzer/code_analyzer.js'
import type {
  ComponentStats,
  StatisticsSummary,
  ClassifiedFile,
  StatsConfig,
  FileAnalysis,
} from './types.js'
import { Project } from 'ts-morph'
import { RouteCounter } from './route_counter.js'
import { ClassifierRegistry } from './classifier_registry.js'
/**
 * Collects and aggregates statistics from the codebase
 */
export class StatisticsCollector {
  #project: Project
  #config: StatsConfig
  #classifierRegistry: ClassifierRegistry
  #routeCounter: RouteCounter

  constructor(options: { project: Project; config: StatsConfig }) {
    this.#project = options.project
    this.#config = options.config
    this.#classifierRegistry = new ClassifierRegistry(this.#config)
    this.#routeCounter = new RouteCounter(this.#project)
  }

  /**
   * Classify a file using all registered classifiers
   */
  private classifyFile(filePath: string, analysis: FileAnalysis): string | null {
    const classifiers = this.#classifierRegistry.getClassifiers()
    for (const classifier of classifiers) {
      if (classifier.satisfies(filePath, analysis)) {
        return classifier.name()
      }
    }
    return null
  }

  /**
   * Collect all statistics
   */
  async collect(): Promise<StatisticsSummary> {
    await this.#classifierRegistry.registerAll()

    const sourceFiles = this.#project.getSourceFiles()
    const filteredSourceFiles = sourceFiles.filter(
      (file) => file.getFilePath().includes('app') || file.getFilePath().includes('tests')
    )

    const classifiedFiles: ClassifiedFile[] = []
    const unclassifiedFiles: ClassifiedFile[] = []

    const codeAnalyzer = new CodeAnalyzer()

    for (const sourceFile of filteredSourceFiles) {
      const filePath = sourceFile.getFilePath()
      const analysis = await codeAnalyzer.analyzeFile(filePath)
      const componentType = this.classifyFile(filePath, analysis)

      const classifiedFile: ClassifiedFile = {
        filePath,
        componentType: componentType || 'Other',
        analysis,
      }

      if (componentType) {
        classifiedFiles.push(classifiedFile)
      } else {
        unclassifiedFiles.push(classifiedFile)
      }
    }

    classifiedFiles.push(...unclassifiedFiles)

    const componentStatsMap = new Map<string, ComponentStats>()

    for (const file of classifiedFiles) {
      const stats = componentStatsMap.get(file.componentType) || {
        name: file.componentType,
        classes: 0,
        methods: 0,
        methodsPerClass: 0,
        linesOfCode: 0,
        logicalLinesOfCode: 0,
        logicalLinesPerMethod: 0,
      }

      stats.classes += file.analysis.classNames.length
      stats.methods += file.analysis.methods
      stats.linesOfCode += file.analysis.linesOfCode
      stats.logicalLinesOfCode += file.analysis.logicalLinesOfCode

      componentStatsMap.set(file.componentType, stats)
    }

    const components: ComponentStats[] = []
    let totalClasses = 0
    let totalMethods = 0
    let totalLoC = 0
    let totalLLoC = 0
    let codeLLoC = 0
    let testLLoC = 0

    for (const [componentType, stats] of componentStatsMap.entries()) {
      stats.methodsPerClass = stats.classes > 0 ? stats.methods / stats.classes : 0
      stats.logicalLinesPerMethod = stats.methods > 0 ? stats.logicalLinesOfCode / stats.methods : 0

      components.push(stats)

      totalClasses += stats.classes
      totalMethods += stats.methods
      totalLoC += stats.linesOfCode
      totalLLoC += stats.logicalLinesOfCode

      const classifier = this.#classifierRegistry.findByName(componentType)
      if (classifier?.countsTowardsTests()) {
        testLLoC += stats.logicalLinesOfCode
      } else {
        codeLLoC += stats.logicalLinesOfCode
      }
    }

    components.sort((a, b) => a.name.localeCompare(b.name))

    const totalMethodsPerClass = totalClasses > 0 ? totalMethods / totalClasses : 0
    const totalLLoCPerMethod = totalMethods > 0 ? totalLLoC / totalMethods : 0

    const total: ComponentStats = {
      name: 'Total',
      classes: totalClasses,
      methods: totalMethods,
      methodsPerClass: totalMethodsPerClass,
      linesOfCode: totalLoC,
      logicalLinesOfCode: totalLLoC,
      logicalLinesPerMethod: totalLLoCPerMethod,
    }

    const routes = await this.#routeCounter.countRoutes()

    const ratio = testLLoC > 0 ? codeLLoC / testLLoC : 0
    const codeTestRatio = `1:${ratio.toFixed(1)}`

    return {
      components,
      total,
      codeLogicalLines: codeLLoC,
      testLogicalLines: testLLoC,
      codeTestRatio,
      routes,
    }
  }

  /**
   * Get detailed file breakdown (for verbose mode)
   */
  async getDetailedBreakdown(): Promise<Map<string, ClassifiedFile[]>> {
    await this.#classifierRegistry.registerAll()

    const sourceFiles = this.#project.getSourceFiles()
    const breakdown = new Map<string, ClassifiedFile[]>()
    const codeAnalyzer = new CodeAnalyzer()

    for (const sourceFile of sourceFiles) {
      const filePath = sourceFile.getFilePath()
      const analysis = await codeAnalyzer.analyzeFile(filePath)
      const componentType = this.classifyFile(filePath, analysis) || 'Other'

      if (!breakdown.has(componentType)) {
        breakdown.set(componentType, [])
      }

      breakdown.get(componentType)!.push({
        filePath,
        componentType,
        analysis,
      })
    }

    return breakdown
  }
}
