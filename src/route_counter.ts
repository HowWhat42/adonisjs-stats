import { parse, Lang } from '@ast-grep/napi'
import type { Project } from 'ts-morph'

/**
 * Route counter using AST grep to detect routes in AdonisJS applications
 */
export class RouteCounter {
  #project: Project

  constructor(project: Project) {
    this.#project = project
  }

  /**
   * Count routes using AST grep patterns
   */
  async countRoutes(): Promise<number> {
    let routeCount = 0
    const processedFiles = new Set<string>()

    const sourceFiles = this.#project.getSourceFiles()
    const filteredSourceFiles = sourceFiles.filter(
      (file) => file.getFilePath().includes('start') || file.getFilePath().includes('controller')
    )
    for (const sourceFile of filteredSourceFiles) {
      const filePath = sourceFile.getFilePath()
      processedFiles.add(filePath)
      try {
        const content = sourceFile.getFullText()
        routeCount += this.countRoutesInContent(content)
      } catch (error) {
        console.error(`Error reading source file ${filePath}:`, error)
      }
    }

    return routeCount
  }

  /**
   * Count routes in a given file content using AST grep
   * Handles both single-line and multiline route definitions
   */
  private countRoutesInContent(content: string): number {
    let count = 0

    try {
      const ast = parse(Lang.TypeScript, content)
      const root = ast.root()

      const routePatterns = [
        // Pattern: router.get('/path', () => { ... })
        '$VAR.on($_)',
        '$VAR.get($_, $_)',
        '$VAR.post($_, $_)',
        '$VAR.put($_, $_)',
        '$VAR.patch($_, $_)',
        '$VAR.delete($_, $_)',
        '$VAR.head($_, $_)',
        '$VAR.options($_, $_)',
        '$VAR.any($_, $_)',
        '$VAR.match($_, $_, $_)',
        '$VAR.resource($_, $_)',
        // Routes with only path (no handler) - these are less common but possible
        '$VAR.get($_)',
        '$VAR.post($_)',
        '$VAR.put($_)',
        '$VAR.patch($_)',
        '$VAR.delete($_)',
        '$VAR.head($_)',
        '$VAR.options($_)',
        '$VAR.any($_)',

        // Girouette routes patterns
        '@Post($$$_)',
        '@Get($$$_)',
        '@Put($$$_)',
        '@Patch($$$_)',
        '@Delete($$$_)',
        '@Head($$$_)',
        '@Options($$$_)',
        '@Any($$$)',
        '@Match($$$_)',
        '@Resource($$$_)',
      ]

      for (const pattern of routePatterns) {
        const matches = root.findAll(pattern)
        for (const match of matches) {
          // Get the method name from the match
          const methodCall = match.text()

          if (methodCall.includes('.resource(') || methodCall.includes('@Resource(')) {
            // Resource routes create 7 routes (index, show, store, update, destroy, edit, create)
            count += 7
          } else {
            // Regular route method calls
            count += 1
          }
        }
      }
    } catch (error) {
      console.error(`Error parsing content:`, error)
    }

    return count
  }
}
