import { CodeAnalyzer } from './analyzer/code_analyzer.js'
import { ControllerClassifier } from './classifiers/controller_classifier.js'
import { ServiceClassifier } from './classifiers/service_classifier.js'
import { ModelClassifier } from './classifiers/model_classifier.js'
import { MiddlewareClassifier } from './classifiers/middleware_classifier.js'
import { ValidatorClassifier } from './classifiers/validator_classifier.js'
import { CommandClassifier } from './classifiers/command_classifier.js'
import { ListenerClassifier } from './classifiers/listener_classifier.js'
import { EventClassifier } from './classifiers/event_classifier.js'
import { ExceptionClassifier } from './classifiers/exception_classifier.js'
import { TestClassifier } from './classifiers/test_classifier.js'
import type { Classifier } from './classifiers/base_classifier.js'
import type { ComponentStats, StatisticsSummary, ClassifiedFile, StatsConfig } from './types.js'
import { RouteJSON } from '@adonisjs/core/types/http'
import { Project } from 'ts-morph'
/**
 * Collects and aggregates statistics from the codebase
 */
export class StatisticsCollector {
  private classifiers: Classifier[] = []

  #routes: Array<RouteJSON>
  #project: Project
  #config: StatsConfig
  constructor(options: { routes: Array<RouteJSON>; project: Project; config: StatsConfig }) {
    this.#routes = options.routes
    this.#project = options.project
    this.#config = options.config
  }

  /**
   * Register custom classifiers (called during collect)
   */
  private async registerCustomClassifiers(): Promise<void> {
    if (this.#config.customClassifiers.length === 0) {
      return
    }

    for (const classifierPath of this.#config.customClassifiers) {
      try {
        // Dynamic import of custom classifier
        const classifierModule = await import(classifierPath)
        const ClassifierClass = classifierModule.default || Object.values(classifierModule)[0]
        if (ClassifierClass && typeof ClassifierClass === 'function') {
          this.classifiers.push(new ClassifierClass())
        }
      } catch {
        // Silently fail - custom classifiers are optional
      }
    }
  }

  /**
   * Register the default classifiers
   */
  private async registerClassifiers(): Promise<void> {
    this.classifiers.push(new ControllerClassifier())
    this.classifiers.push(new ServiceClassifier())
    this.classifiers.push(new ModelClassifier())
    this.classifiers.push(new MiddlewareClassifier())
    this.classifiers.push(new ValidatorClassifier())
    this.classifiers.push(new CommandClassifier())
    this.classifiers.push(new ListenerClassifier())
    this.classifiers.push(new EventClassifier())
    this.classifiers.push(new ExceptionClassifier())
    this.classifiers.push(new TestClassifier())
    this.registerCustomClassifiers()
  }

  /**
   * Classify a file using all registered classifiers
   */
  private classifyFile(filePath: string, analysis: any): string | null {
    for (const classifier of this.classifiers) {
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
    this.registerClassifiers()

    const sourceFiles = this.#project.getSourceFiles()

    // Analyze and classify files
    const classifiedFiles: ClassifiedFile[] = []
    const unclassifiedFiles: ClassifiedFile[] = []

    const codeAnalyzer = new CodeAnalyzer()

    for (const sourceFile of sourceFiles) {
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

    // Add unclassified files as "Other"
    classifiedFiles.push(...unclassifiedFiles)

    // Aggregate statistics by component type
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

      if (file.analysis.className) {
        stats.classes++
      }
      stats.methods += file.analysis.methods
      stats.linesOfCode += file.analysis.linesOfCode
      stats.logicalLinesOfCode += file.analysis.logicalLinesOfCode

      componentStatsMap.set(file.componentType, stats)
    }

    // // Calculate ratios and create component stats array
    const components: ComponentStats[] = []
    let totalClasses = 0
    let totalMethods = 0
    let totalLoC = 0
    let totalLLoC = 0
    let codeLLoC = 0
    let testLLoC = 0

    for (const [componentType, stats] of componentStatsMap.entries()) {
      // Calculate ratios
      stats.methodsPerClass = stats.classes > 0 ? stats.methods / stats.classes : 0
      stats.logicalLinesPerMethod = stats.methods > 0 ? stats.logicalLinesOfCode / stats.methods : 0

      components.push(stats)

      // Accumulate totals
      totalClasses += stats.classes
      totalMethods += stats.methods
      totalLoC += stats.linesOfCode
      totalLLoC += stats.logicalLinesOfCode

      // Separate code and test LLoC
      const classifier = this.classifiers.find((c) => c.name() === componentType)
      if (classifier?.countsTowardsTests()) {
        testLLoC += stats.logicalLinesOfCode
      } else {
        codeLLoC += stats.logicalLinesOfCode
      }
    }

    // Sort components by name
    components.sort((a, b) => a.name.localeCompare(b.name))

    // Calculate total ratios
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

    // Count routes
    const routes = this.#routes.length

    // Calculate code/test ratio
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
    // Register custom classifiers if any
    await this.registerCustomClassifiers()
    this.registerClassifiers()

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
