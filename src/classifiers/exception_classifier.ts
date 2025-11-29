import type { Classifier } from './base_classifier.js'
import type { FileAnalysis } from '../types.js'

/**
 * Classifies AdonisJS exceptions
 */
export class ExceptionClassifier implements Classifier {
  name(): string {
    return 'Exceptions'
  }

  satisfies(filePath: string, analysis: FileAnalysis): boolean {
    // Check if file is in exceptions directory
    const isInExceptionsDir =
      filePath.includes('/exceptions/') || filePath.includes('\\exceptions\\')
    const endsWithException = filePath.toLowerCase().endsWith('exception.ts')

    return (isInExceptionsDir || endsWithException) && analysis.classNames.length > 0
  }

  countsTowardsApplicationCode(): boolean {
    return true
  }

  countsTowardsTests(): boolean {
    return false
  }
}
