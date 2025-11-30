import type { Classifier } from './base_classifier.js'
import type { FileAnalysis } from '../types.js'

/**
 * Classifies AdonisJS controllers
 */
export class ControllerClassifier implements Classifier {
  name(): string {
    return 'Controllers'
  }

  satisfies(filePath: string, analysis: FileAnalysis): boolean {
    // Check if file is in controllers directory or ends with controller
    const isInControllersDir =
      filePath.includes('/controllers/') || filePath.includes('\\controllers\\')
    const endsWithController = filePath.toLowerCase().endsWith('controller.ts')

    // Check if class extends BaseController or has controller-like patterns
    // We'll check the file path and name patterns since we don't have full AST
    return (isInControllersDir || endsWithController) && analysis.classNames.length > 0
  }
}
