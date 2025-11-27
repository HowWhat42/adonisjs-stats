import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { StatisticsCollector } from '../src/statistics_collector.js'
import { TableFormatter } from '../src/formatters/table_formatter.js'
import { JsonFormatter } from '../src/formatters/json_formatter.js'
import { Project, QuoteKind } from 'ts-morph'
import { fileURLToPath } from 'node:url'

export default class Stats extends BaseCommand {
  static commandName = 'stats'
  static description = 'Get insights about your AdonisJS project'

  static options: CommandOptions = {
    startApp: true,
  }

  @flags.boolean({ alias: 'j', description: 'Output statistics as JSON' })
  declare json: boolean

  @flags.boolean({ alias: 'v', description: 'Show verbose output with detailed breakdown' })
  declare verbose: boolean

  async #getRoutes() {
    const router = await this.app.container.make('router')
    router.commit()

    return router.toJSON().root
  }

  async run() {
    const project = new Project({
      manipulationSettings: { quoteKind: QuoteKind.Single },
      tsConfigFilePath: fileURLToPath(new URL('./tsconfig.json', this.app.appRoot)),
    })

    const collector = new StatisticsCollector({
      routes: await this.#getRoutes(),
      project,
      config: this.app.config.get('stats'),
    })
    const summary = await collector.collect()

    if (this.json) {
      const formatter = new JsonFormatter()
      this.logger.log(formatter.format(summary, this.verbose))
    } else {
      const formatter = new TableFormatter()
      this.logger.log(formatter.format(summary))

      if (this.verbose) {
        this.logger.log('\nDetailed Breakdown:')
        const breakdown = await collector.getDetailedBreakdown()
        for (const [componentType, files] of breakdown.entries()) {
          this.logger.log(`\n${componentType}:`)
          for (const file of files) {
            this.logger.log(
              `  ${file.filePath} - ${file.analysis.className || 'No class'} (${file.analysis.methods} methods, ${file.analysis.logicalLinesOfCode} LLoC)`
            )
          }
        }
      }
    }
  }
}
