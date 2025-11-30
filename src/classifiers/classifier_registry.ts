import type { Classifier } from './base_classifier.js'
import { ControllerClassifier } from './controller_classifier.js'
import { ServiceClassifier } from './service_classifier.js'
import { ModelClassifier } from './model_classifier.js'
import { MiddlewareClassifier } from './middleware_classifier.js'
import { CommandClassifier } from './command_classifier.js'
import { ListenerClassifier } from './listener_classifier.js'
import { EventClassifier } from './event_classifier.js'
import { ExceptionClassifier } from './exception_classifier.js'
import type { StatsConfig } from '../types.js'

/**
 * Manages registration and retrieval of classifiers
 */
export class ClassifierRegistry {
  private classifiers: Classifier[] = []
  #config: StatsConfig

  constructor(config: StatsConfig) {
    this.#config = config
  }

  /**
   * Register all classifiers (default and custom)
   */
  async registerAll(): Promise<void> {
    this.registerDefaultClassifiers()
    await this.registerCustomClassifiers()
  }

  /**
   * Register the default classifiers
   */
  private registerDefaultClassifiers(): void {
    this.classifiers.push(new ControllerClassifier())
    this.classifiers.push(new ServiceClassifier())
    this.classifiers.push(new ModelClassifier())
    this.classifiers.push(new MiddlewareClassifier())
    this.classifiers.push(new CommandClassifier())
    this.classifiers.push(new ListenerClassifier())
    this.classifiers.push(new EventClassifier())
    this.classifiers.push(new ExceptionClassifier())
  }

  /**
   * Register custom classifiers (called during collect)
   */
  private async registerCustomClassifiers(): Promise<void> {
    if (this.#config.customClassifiers.length === 0) {
      return
    }

    for (const classifierPath of this.#config.customClassifiers) {
      try {
        const classifierModule = await import(classifierPath)
        const ClassifierClass = classifierModule.default || Object.values(classifierModule)[0]
        if (ClassifierClass && typeof ClassifierClass === 'function') {
          this.classifiers.push(new ClassifierClass())
        }
      } catch (error) {
        console.error(`Error importing custom classifier ${classifierPath}:`, error)
      }
    }
  }

  /**
   * Get all registered classifiers
   */
  getClassifiers(): Classifier[] {
    return this.classifiers
  }

  /**
   * Find a classifier by name
   */
  findByName(name: string): Classifier | undefined {
    return this.classifiers.find((c) => c.name() === name)
  }
}
