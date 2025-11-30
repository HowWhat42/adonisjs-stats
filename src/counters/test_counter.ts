import { parse, Lang } from '@ast-grep/napi'
import type { Project } from 'ts-morph'

/**
 * Result of test counting operation
 */
export interface TestCountResult {
  count: number
  logicalLinesOfCode: number
}

/**
 * Test counter using AST grep to detect test cases in test files
 */
export class TestCounter {
  #project: Project

  constructor(project: Project) {
    this.#project = project
  }

  /**
   * Count tests and calculate test logical lines of code
   */
  async countTests(): Promise<TestCountResult> {
    let testCount = 0
    let testLLoC = 0
    const processedFiles = new Set<string>()

    const sourceFiles = this.#project.getSourceFiles()
    const filteredSourceFiles = sourceFiles.filter(
      (file) =>
        file.getFilePath().includes('tests') &&
        (file.getFilePath().includes('test') || file.getFilePath().includes('spec'))
    )
    for (const sourceFile of filteredSourceFiles) {
      const filePath = sourceFile.getFilePath()
      processedFiles.add(filePath)
      try {
        const content = sourceFile.getFullText()
        testCount += this.countTestsInContent(content)
        testLLoC += this.calculateLogicalLinesOfCode(content)
      } catch (error) {
        console.error(`Error reading source file ${filePath}:`, error)
      }
    }

    return {
      count: testCount,
      logicalLinesOfCode: testLLoC,
    }
  }

  /**
   * Count tests in a given file content using AST grep
   * Handles Japa test framework patterns (standard for AdonisJS)
   */
  private countTestsInContent(content: string): number {
    let count = 0

    try {
      const ast = parse(Lang.TypeScript, content)
      const root = ast.root()

      // Pattern for individual test cases (Japa framework)
      // Note: test($$$) matches test() calls but not test.group() calls
      const matches = root.findAll('test($$$)')

      // Count individual test cases
      for (const match of matches) {
        const methodCall = match.text()

        // Skip if it's actually a group call (test.group)
        // This shouldn't happen with the pattern above, but adding as safety check
        if (methodCall.includes('test.group(')) {
          continue
        }

        // Count individual test cases
        count += 1
      }
    } catch (error) {
      console.error(`Error parsing content:`, error)
    }

    return count
  }

  /**
   * Calculate logical lines of code for test files
   * Excludes empty lines and comments
   */
  private calculateLogicalLinesOfCode(content: string): number {
    const lines = content.split('\n')
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

      if (inMultiLineComment) {
        continue
      }

      logicalLinesOfCode++
    }

    return logicalLinesOfCode
  }
}
