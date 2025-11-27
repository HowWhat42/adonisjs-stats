import type { FileAnalysis } from '../types.js'

/**
 * Base interface for component classifiers
 */
export interface Classifier {
  /**
   * Name of the component type this classifier identifies
   */
  name(): string

  /**
   * Check if a file satisfies this classifier's criteria
   */
  satisfies(filePath: string, analysis: FileAnalysis): boolean

  /**
   * Whether this component counts towards application code
   */
  countsTowardsApplicationCode(): boolean

  /**
   * Whether this component counts towards tests
   */
  countsTowardsTests(): boolean
}
