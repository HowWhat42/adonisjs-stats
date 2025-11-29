import { parse, Lang } from '@ast-grep/napi'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { existsSync } from 'node:fs'
import { resolve, join, normalize } from 'node:path'
import type { Project } from 'ts-morph'

/**
 * Route counter using AST grep to detect routes in AdonisJS applications
 */
export class RouteCounter {
  #project: Project
  #cwd: string

  constructor(project: Project, cwd: string) {
    this.#project = project
    this.#cwd = cwd
  }

  /**
   * Find all TypeScript files in a directory recursively
   */
  private findTypeScriptFiles(dir: string): string[] {
    const files: string[] = []

    if (!existsSync(dir)) {
      return files
    }

    try {
      const entries = readdirSync(dir)

      for (const entry of entries) {
        const fullPath = join(dir, entry)
        const stat = statSync(fullPath)

        if (stat.isDirectory()) {
          files.push(...this.findTypeScriptFiles(fullPath))
        } else if (stat.isFile() && entry.endsWith('.ts')) {
          files.push(fullPath)
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${dir}:`, error)
    }

    return files
  }

  /**
   * Normalize file path for consistent comparison
   */
  private normalizePath(filePath: string): string {
    return normalize(filePath.replace(/\\/g, '/')).toLowerCase()
  }

  /**
   * Count routes using AST grep patterns
   */
  async countRoutes(): Promise<number> {
    let routeCount = 0
    const processedFiles = new Set<string>()

    const startDir = resolve(this.#cwd, 'start')
    const startFiles = this.findTypeScriptFiles(startDir)

    for (const routeFile of startFiles) {
      if (!existsSync(routeFile)) {
        continue
      }

      const normalizedPath = this.normalizePath(routeFile)
      if (processedFiles.has(normalizedPath)) {
        continue
      }

      processedFiles.add(normalizedPath)
      try {
        const content = readFileSync(routeFile, 'utf-8')
        routeCount += this.countRoutesInContent(content)
      } catch (error) {
        console.error(`Error reading route file ${routeFile}:`, error)
      }
    }

    const sourceFiles = this.#project.getSourceFiles()
    for (const sourceFile of sourceFiles) {
      const filePath = sourceFile.getFilePath()
      const normalizedPath = this.normalizePath(filePath)

      if (normalizedPath.includes('/tests/')) {
        continue
      }

      if (processedFiles.has(normalizedPath)) {
        continue
      }

      if (!normalizedPath.includes('/start/') && !normalizedPath.includes('/routes/')) {
        continue
      }

      processedFiles.add(normalizedPath)
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
      ]

      for (const pattern of routePatterns) {
        const matches = root.findAll(pattern)
        for (const match of matches) {
          // Get the method name from the match
          const methodCall = match.text()

          // Verify this is actually a route method call
          // Check for common router variable names or method patterns
          const isRouteCall =
            methodCall.includes('.get(') ||
            methodCall.includes('.post(') ||
            methodCall.includes('.put(') ||
            methodCall.includes('.patch(') ||
            methodCall.includes('.delete(') ||
            methodCall.includes('.head(') ||
            methodCall.includes('.options(') ||
            methodCall.includes('.any(') ||
            methodCall.includes('.match(') ||
            methodCall.includes('.on(') ||
            methodCall.includes('.resource(')

          if (isRouteCall) {
            if (methodCall.includes('.resource(')) {
              // Resource routes create 7 routes (index, show, store, update, destroy, edit, create)
              count += 7
            } else {
              // Regular route method calls
              count += 1
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error parsing content:`, error)
    }

    return count
  }
}
