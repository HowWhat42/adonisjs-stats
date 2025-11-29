import type { Classifier } from './base_classifier.js'
import type { FileAnalysis } from '../types.js'

/**
 * Classifies test files
 */
export class TestClassifier implements Classifier {
  name(): string {
    return 'Tests'
  }

  satisfies(filePath: string, analysis: FileAnalysis): boolean {
    // Check if file is in tests directory or ends with test/spec
    const isInTestsDir = filePath.includes('/tests/') || filePath.includes('\\tests\\')
    const endsWithTest = filePath.toLowerCase().endsWith('.test.ts')
    const endsWithSpec = filePath.toLowerCase().endsWith('.spec.ts')

    return (isInTestsDir || endsWithTest || endsWithSpec) && analysis.classNames.length > 0
  }

  countsTowardsApplicationCode(): boolean {
    return false
  }

  countsTowardsTests(): boolean {
    return true
  }
}
