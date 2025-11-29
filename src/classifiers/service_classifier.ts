import type { Classifier } from './base_classifier.js'
import type { FileAnalysis } from '../types.js'

/**
 * Classifies AdonisJS services
 */
export class ServiceClassifier implements Classifier {
  name(): string {
    return 'Services'
  }

  satisfies(filePath: string, analysis: FileAnalysis): boolean {
    // Check if file is in services directory
    const isInServicesDir = filePath.includes('/services/') || filePath.includes('\\services\\')
    const endsWithService = filePath.toLowerCase().endsWith('service.ts')

    return (isInServicesDir || endsWithService) && analysis.classNames.length > 0
  }

  countsTowardsApplicationCode(): boolean {
    return true
  }

  countsTowardsTests(): boolean {
    return false
  }
}
