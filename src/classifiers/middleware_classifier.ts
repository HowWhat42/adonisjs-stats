import type { Classifier } from './base_classifier.js'
import type { FileAnalysis } from '../types.js'

/**
 * Classifies AdonisJS middleware
 */
export class MiddlewareClassifier implements Classifier {
  name(): string {
    return 'Middlewares'
  }

  satisfies(filePath: string, analysis: FileAnalysis): boolean {
    // Check if file is in middleware directory
    const isInMiddlewareDir =
      filePath.includes('/middleware/') || filePath.includes('\\middleware\\')
    const endsWithMiddleware = filePath.toLowerCase().endsWith('middleware.ts')

    return (isInMiddlewareDir || endsWithMiddleware) && analysis.classNames.length > 0
  }
}
