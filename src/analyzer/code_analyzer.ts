import { readFile } from 'node:fs/promises'
import { parse, Lang, SgNode, kind } from '@ast-grep/napi'
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

    const classNames = this.extractClassNames(content)
    const methods = this.countMethods(content)

    return {
      filePath,
      classNames,
      methods,
      linesOfCode,
      logicalLinesOfCode,
    }
  }

  /**
   * Extract all class names from file content using AST grep
   */
  private extractClassNames(content: string): string[] {
    try {
      const ast = parse(Lang.TypeScript, content)
      const root = ast.root()
      const classNodes = root.findAll(kind(Lang.TypeScript, 'class_declaration'))

      if (classNodes.length === 0) {
        return []
      }

      // Helper function to extract class name from a node
      const extractNameFromNode = (node: SgNode): string | null => {
        try {
          const nameNodes = node.findAll(kind(Lang.TypeScript, 'type_identifier'))
          if (nameNodes.length > 0) {
            return nameNodes[0].text()
          }
        } catch {
          return null
        }

        return null
      }

      const classNames: string[] = []

      for (const classNode of classNodes) {
        const className = extractNameFromNode(classNode)
        if (className) {
          classNames.push(className)
        }
      }

      return classNames
    } catch (error) {
      return []
    }
  }

  /**
   * Count methods in a class using AST grep
   */
  private countMethods(content: string): number {
    try {
      const ast = parse(Lang.TypeScript, content)
      const root = ast.root()

      let count = 0
      const arrowFunctionDeclarations = root.findAll(kind(Lang.TypeScript, 'arrow_function'))
      count += arrowFunctionDeclarations.length

      const methodDefinitions = root.findAll(kind(Lang.TypeScript, 'method_definition'))
      count += methodDefinitions.length

      const functionDeclarations = root.findAll(kind(Lang.TypeScript, 'function_declaration'))
      count += functionDeclarations.length

      return count
    } catch (error) {
      return 0
    }
  }
}
