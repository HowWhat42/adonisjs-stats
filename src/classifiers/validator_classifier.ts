import type { Classifier } from './base_classifier.js'
import type { FileAnalysis } from '../types.js'

/**
 * Classifies AdonisJS validators
 */
export class ValidatorClassifier implements Classifier {
  name(): string {
    return 'Validators'
  }

  satisfies(filePath: string, analysis: FileAnalysis): boolean {
    // Check if file is in validators directory
    const isInValidatorsDir =
      filePath.includes('/validators/') || filePath.includes('\\validators\\')
    const endsWithValidator = filePath.toLowerCase().endsWith('validator.ts')

    return (isInValidatorsDir || endsWithValidator) && analysis.className !== null
  }

  countsTowardsApplicationCode(): boolean {
    return true
  }

  countsTowardsTests(): boolean {
    return false
  }
}
