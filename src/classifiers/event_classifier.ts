import type { Classifier } from './base_classifier.js'
import type { FileAnalysis } from '../types.js'

/**
 * Classifies AdonisJS events
 */
export class EventClassifier implements Classifier {
  name(): string {
    return 'Events'
  }

  satisfies(filePath: string, analysis: FileAnalysis): boolean {
    // Check if file is in events directory
    const isInEventsDir = filePath.includes('/events/') || filePath.includes('\\events\\')
    const endsWithEvent = filePath.toLowerCase().endsWith('event.ts')

    return (isInEventsDir || endsWithEvent) && analysis.classNames.length > 0
  }

  countsTowardsApplicationCode(): boolean {
    return true
  }

  countsTowardsTests(): boolean {
    return false
  }
}
