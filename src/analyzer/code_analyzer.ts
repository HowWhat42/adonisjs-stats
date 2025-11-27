import { readFile } from 'node:fs/promises'
import type { FileAnalysis } from '../types.js'

/**
 * Analyzes TypeScript/JavaScript files to extract code metrics
 */
export class CodeAnalyzer {
  /**
   * Analyze a single file
   */
  async analyzeFile(filePath: string): Promise<FileAnalysis> {
    const content = await readFile(filePath, 'utf-8')
    return this.analyzeContent(filePath, content)
  }

  /**
   * Analyze file content
   */
  analyzeContent(filePath: string, content: string): FileAnalysis {
    const lines = content.split('\n')
    const linesOfCode = lines.length

    // Count logical lines (excluding comments and empty lines)
    let logicalLinesOfCode = 0
    let inMultiLineComment = false

    for (const line of lines) {
      const trimmed = line.trim()

      // Skip empty lines
      if (trimmed === '') {
        continue
      }

      // Handle single-line comments
      if (trimmed.startsWith('//')) {
        continue
      }

      // Handle multi-line comments
      if (trimmed.includes('/*')) {
        inMultiLineComment = true
        if (trimmed.includes('*/')) {
          inMultiLineComment = false
          // Check if there's code after the comment
          const afterComment = trimmed.split('*/')[1]?.trim()
          if (afterComment && afterComment !== '') {
            logicalLinesOfCode++
          }
        }
        continue
      }

      if (trimmed.includes('*/')) {
        inMultiLineComment = false
        // Check if there's code before the comment end
        const beforeComment = trimmed.split('*/')[0]?.trim()
        if (beforeComment && beforeComment !== '') {
          logicalLinesOfCode++
        }
        continue
      }

      if (inMultiLineComment) {
        continue
      }

      logicalLinesOfCode++
    }

    // Extract class name and count methods using regex
    // This is a simpler approach than full AST parsing
    const className = this.extractClassName(content)
    const methods = this.countMethods(content)

    return {
      filePath,
      className,
      methods,
      linesOfCode,
      logicalLinesOfCode,
    }
  }

  /**
   * Extract class name from file content
   */
  private extractClassName(content: string): string | null {
    // Match: export class ClassName or class ClassName
    const classMatch = content.match(
      /(?:export\s+)?(?:default\s+)?class\s+([A-Za-z_$][A-Za-z0-9_$]*)/m
    )
    return classMatch ? classMatch[1] : null
  }

  /**
   * Count methods in a class
   */
  private countMethods(content: string): number {
    // Count method definitions (including async, private, protected, public, static)
    // This regex matches: methodName(, async methodName(, private methodName(, etc.
    const methodRegex =
      /(?:(?:public|private|protected|static|async)\s+)*(?:[A-Za-z_$][A-Za-z0-9_$]*\s*)?[A-Za-z_$][A-Za-z0-9_$]*\s*\([^)]*\)\s*(?::\s*[^{]*)?\{/g

    const matches = content.match(methodRegex)
    if (!matches) {
      return 0
    }

    // Filter out constructors and getters/setters if needed
    // For now, we'll count all methods including constructors
    return matches.length
  }
}
