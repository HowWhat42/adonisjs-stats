import { parse, Lang } from '@ast-grep/napi'
import type { Project } from 'ts-morph'

/**
 * Validator counter using AST grep to detect validators in AdonisJS applications
 */
export class ValidatorCounter {
  #project: Project

  constructor(project: Project) {
    this.#project = project
  }

  /**
   * Count validators using AST grep patterns
   */
  async countValidators(): Promise<number> {
    let validatorCount = 0
    const processedFiles = new Set<string>()

    const sourceFiles = this.#project.getSourceFiles()
    const filteredSourceFiles = sourceFiles.filter(
      (file) =>
        file.getFilePath().includes('validators') ||
        file.getFilePath().toLowerCase().endsWith('validator.ts')
    )
    for (const sourceFile of filteredSourceFiles) {
      const filePath = sourceFile.getFilePath()
      processedFiles.add(filePath)
      try {
        const content = sourceFile.getFullText()
        validatorCount += this.countValidatorsInContent(content)
      } catch (error) {
        console.error(`Error reading source file ${filePath}:`, error)
      }
    }

    return validatorCount
  }

  /**
   * Count validators in a given file content using AST grep
   * Looks for vine.compile($$$) pattern
   */
  private countValidatorsInContent(content: string): number {
    try {
      const ast = parse(Lang.TypeScript, content)
      const root = ast.root()
      const matches = root.findAll('vine.compile($$$)')
      return matches.length
    } catch (error) {
      console.error(`Error parsing content:`, error)
      return 0
    }
  }
}
