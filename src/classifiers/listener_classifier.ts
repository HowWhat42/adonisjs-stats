import type { Classifier } from './base_classifier.js'
import type { FileAnalysis } from '../types.js'

/**
 * Classifies AdonisJS event listeners
 */
export class ListenerClassifier implements Classifier {
  name(): string {
    return 'Listeners'
  }

  satisfies(filePath: string, analysis: FileAnalysis): boolean {
    // Check if file is in listeners directory
    const isInListenersDir = filePath.includes('/listeners/') || filePath.includes('\\listeners\\')
    const endsWithListener = filePath.toLowerCase().endsWith('listener.ts')

    return (isInListenersDir || endsWithListener) && analysis.classNames.length > 0
  }
}
