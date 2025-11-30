import type { Classifier } from './base_classifier.js'
import type { FileAnalysis } from '../types.js'

/**
 * Classifies AdonisJS models
 */
export class ModelClassifier implements Classifier {
  name(): string {
    return 'Models'
  }

  satisfies(filePath: string, analysis: FileAnalysis): boolean {
    // Check if file is in models directory
    const isInModelsDir = filePath.includes('/models/') || filePath.includes('\\models\\')
    const endsWithModel = filePath.toLowerCase().endsWith('model.ts')

    return (isInModelsDir || endsWithModel) && analysis.classNames.length > 0
  }
}
