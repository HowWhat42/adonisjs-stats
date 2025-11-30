import type { StatisticsSummary } from '../types.js'

/**
 * Formats statistics as a table similar to Laravel Stats
 */
export class TableFormatter {
  /**
   * Format a number with 2 decimal places
   */
  private formatNumber(num: number, decimals: number = 2): string {
    return num.toFixed(decimals)
  }

  /**
   * Pad a string to a specific width
   */
  private pad(str: string, width: number, align: 'left' | 'right' = 'left'): string {
    const strValue = String(str)
    if (align === 'right') {
      return strValue.padStart(width)
    }
    return strValue.padEnd(width)
  }

  /**
   * Format statistics as a table
   */
  format(summary: StatisticsSummary): string {
    const lines: string[] = []

    // Table header
    const header = [
      this.pad('Name', 20),
      this.pad('Classes', 10, 'right'),
      this.pad('Methods', 10, 'right'),
      this.pad('Methods/Class', 14, 'right'),
      this.pad('LoC', 8, 'right'),
      this.pad('LLoC', 8, 'right'),
      this.pad('LLoC/Method', 12, 'right'),
    ].join(' | ')

    lines.push(header)
    lines.push('-'.repeat(header.length))

    // Component rows
    for (const component of summary.components) {
      const row = [
        this.pad(component.name, 20),
        this.pad(component.classes.toString(), 10, 'right'),
        this.pad(component.methods.toString(), 10, 'right'),
        this.pad(this.formatNumber(component.methodsPerClass), 14, 'right'),
        this.pad(component.linesOfCode.toString(), 8, 'right'),
        this.pad(component.logicalLinesOfCode.toString(), 8, 'right'),
        this.pad(this.formatNumber(component.logicalLinesPerMethod), 12, 'right'),
      ].join(' | ')

      lines.push(row)
    }

    // Total row
    const totalRow = [
      this.pad(summary.total.name, 20),
      this.pad(summary.total.classes.toString(), 10, 'right'),
      this.pad(summary.total.methods.toString(), 10, 'right'),
      this.pad(this.formatNumber(summary.total.methodsPerClass), 14, 'right'),
      this.pad(summary.total.linesOfCode.toString(), 8, 'right'),
      this.pad(summary.total.logicalLinesOfCode.toString(), 8, 'right'),
      this.pad(this.formatNumber(summary.total.logicalLinesPerMethod), 12, 'right'),
    ].join(' | ')

    lines.push(totalRow)

    // Summary footer
    lines.push('')
    const summaryLine = `Code LLoC: ${summary.codeLogicalLines} • Test LLoC: ${summary.testLogicalLines} • Routes: ${summary.routes} • Tests: ${summary.tests} • Validators: ${summary.validators}`

    lines.push(summaryLine)

    return lines.join('\n')
  }
}
