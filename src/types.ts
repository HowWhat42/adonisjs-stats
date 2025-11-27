/**
 * Statistics for a single component type
 */
export interface ComponentStats {
  name: string
  classes: number
  methods: number
  methodsPerClass: number
  linesOfCode: number
  logicalLinesOfCode: number
  logicalLinesPerMethod: number
}

/**
 * File analysis result
 */
export interface FileAnalysis {
  filePath: string
  className: string | null
  methods: number
  linesOfCode: number
  logicalLinesOfCode: number
}

/**
 * Statistics summary
 */
export interface StatisticsSummary {
  components: ComponentStats[]
  total: ComponentStats
  codeLogicalLines: number
  testLogicalLines: number
  codeTestRatio: string
  routes: number
}

/**
 * Classified file information
 */
export interface ClassifiedFile {
  filePath: string
  componentType: string
  analysis: FileAnalysis
}

export interface StatsConfig {
  customClassifiers: string[]
}
