import type { Classifier } from './base_classifier.js'
import type { FileAnalysis } from '../types.js'

/**
 * Classifies AdonisJS Ace commands
 */
export class CommandClassifier implements Classifier {
  name(): string {
    return 'Commands'
  }

  satisfies(filePath: string, analysis: FileAnalysis): boolean {
    // Check if file is in commands directory
    const isInCommandsDir = filePath.includes('/commands/') || filePath.includes('\\commands\\')
    const endsWithCommand = filePath.toLowerCase().endsWith('command.ts')

    return (isInCommandsDir || endsWithCommand) && analysis.className !== null
  }

  countsTowardsApplicationCode(): boolean {
    return true
  }

  countsTowardsTests(): boolean {
    return false
  }
}
