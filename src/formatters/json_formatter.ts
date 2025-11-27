import type { StatisticsSummary } from '../types.js'

/**
 * Formats statistics as JSON
 */
export class JsonFormatter {
  /**
   * Format statistics as JSON
   */
  format(summary: StatisticsSummary, verbose: boolean = false): string {
    if (verbose) {
      return JSON.stringify(
        {
          components: summary.components,
          total: summary.total,
          summary: {
            codeLogicalLines: summary.codeLogicalLines,
            testLogicalLines: summary.testLogicalLines,
            codeTestRatio: summary.codeTestRatio,
            routes: summary.routes,
          },
        },
        null,
        2
      )
    }

    return JSON.stringify(
      {
        components: summary.components.map((c) => ({
          name: c.name,
          classes: c.classes,
          methods: c.methods,
          methodsPerClass: Number(c.methodsPerClass.toFixed(2)),
          linesOfCode: c.linesOfCode,
          logicalLinesOfCode: c.logicalLinesOfCode,
          logicalLinesPerMethod: Number(c.logicalLinesPerMethod.toFixed(2)),
        })),
        total: {
          name: summary.total.name,
          classes: summary.total.classes,
          methods: summary.total.methods,
          methodsPerClass: Number(summary.total.methodsPerClass.toFixed(2)),
          linesOfCode: summary.total.linesOfCode,
          logicalLinesOfCode: summary.total.logicalLinesOfCode,
          logicalLinesPerMethod: Number(summary.total.logicalLinesPerMethod.toFixed(2)),
        },
        summary: {
          codeLogicalLines: summary.codeLogicalLines,
          testLogicalLines: summary.testLogicalLines,
          codeTestRatio: summary.codeTestRatio,
          routes: summary.routes,
        },
      },
      null,
      2
    )
  }
}
