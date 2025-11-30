# AdonisJS Stats

📈 Get insights about your AdonisJS project.

AdonisJS Stats analyzes your codebase and provides detailed statistics about your project's structure, including counts for classes, methods, lines of code, and routes.

## Installation

### Standalone Usage (Recommended)

Install the package globally or use it with npx:

```bash
npm install -g adonisjs-stats
# or
npx adonisjs-stats
```

## Usage

### Standalone Command

Run the standalone command from your AdonisJS project root:

```bash
adonisjs-stats
```

Or with npx:

```bash
npx adonisjs-stats
```

The statistics are also available as JSON:

```bash
adonisjs-stats --json
# or
adonisjs-stats -j
```

For a more detailed report showing which classes have been grouped into which component, use the `--verbose` option:

```bash
adonisjs-stats --verbose
# or
adonisjs-stats -v
```

The verbose option is available for the JSON format as well:

```bash
adonisjs-stats --json --verbose
# or
adonisjs-stats -j -v
```

## Output Example

```
Name                 |    Classes |    Methods | Methods/Class |      LoC |     LLoC | LLoC/Method
--------------------|------------|------------|---------------|----------|----------|-------------
Commands            |          4 |         14 |          3.50 |      382 |       99 |         7.07
Controllers         |         30 |         83 |          2.77 |     1483 |      486 |         5.86
Events              |          3 |          7 |          2.33 |      175 |       60 |         8.57
Exceptions          |          6 |         13 |          2.17 |      310 |       82 |         6.31
Listeners           |          8 |          4 |          0.50 |      199 |       35 |         8.75
Middlewares         |         47 |         94 |          2.00 |     1788 |      492 |         5.23
Models              |         11 |         68 |          6.18 |      930 |      203 |         2.99
Services            |          3 |         12 |          4.00 |      212 |       34 |         2.83
Other               |         18 |         44 |          2.44 |     1421 |      382 |         8.68
Total               |        203 |        602 |          2.97 |    11964 |     3359 |         5.58

Code LLoC: 2088 • Test LLoC: 1271 • Code/Test Ratio: 1:0.6 • Routes: 169
```

## How does this package detect certain AdonisJS Components?

The package scans TypeScript files in your project using `ts-morph` and applies classifiers to determine which AdonisJS component each class represents.

| Component    | Classification                                                                 |
|--------------|--------------------------------------------------------------------------------|
| Controllers  | Files in `app/controllers/` directory or files ending with `controller.ts`    |
| Services     | Files in `app/services/` directory or files ending with `service.ts`          |
| Models       | Files in `app/models/` directory or files ending with `model.ts`              |
| Middleware   | Files in `app/middleware/` directory or files ending with `middleware.ts`     |
| Commands     | Files in `app/commands/` directory or files ending with `command.ts`           |
| Listeners    | Files in `app/listeners/` directory or files ending with `listener.ts`        |
| Events       | Files in `app/events/` directory or files ending with `event.ts`              |
| Exceptions   | Files in `app/exceptions/` directory or files ending with `exception.ts`       |

Note: The package automatically detects test files and separates them from application code in the statistics.

## Configuration

### Standalone Usage

For standalone usage, create a `stats.config.ts` file in your project root:

```typescript
import { defineConfig } from 'adonisjs-stats'

const statsConfig = defineConfig({
  /**
   * Custom classifier classes (full import paths)
   * Example: ['#app/classifiers/custom_classifier']
   */
  customClassifiers: [] as string[],
})

export default statsConfig
```

### Ace Command Usage

If using the Ace command, you can configure the package by running:

```bash
node ace configure adonisjs-stats
```

This will create a `config/stats.ts` file where you can customize the behavior:

```typescript
import { defineConfig } from 'adonisjs-stats'

const statsConfig = defineConfig({
  /**
   * Custom classifier classes (full import paths)
   * Example: ['#app/classifiers/custom_classifier']
   */
  customClassifiers: [] as string[],
})

export default statsConfig
```

## Create your own Classifiers

If your application has its own components you would like to see in `adonisjs-stats`, you can create your own classifiers. Create a classifier by implementing the `Classifier` interface and adding it to the `customClassifiers` config array.

### Example: Repository Classifier

```typescript
// app/classifiers/repository_classifier.ts
import type { Classifier } from 'adonisjs-stats/types'
import type { FileAnalysis } from 'adonisjs-stats/types'

export class RepositoryClassifier implements Classifier {
  name(): string {
    return 'Repositories'
  }

  satisfies(filePath: string, analysis: FileAnalysis): boolean {
    return (
      (filePath.includes('/repositories/') || filePath.includes('\\repositories\\')) &&
      analysis.className !== null
    )
  }

  countsTowardsApplicationCode(): boolean {
    return true
  }

  countsTowardsTests(): boolean {
    return false
  }
}
```

Then add it to your config:

**For standalone usage (`stats.config.ts`):**
```typescript
// stats.config.ts
import { defineConfig } from 'adonisjs-stats'
import { RepositoryClassifier } from '#app/classifiers/repository_classifier'

const statsConfig = defineConfig({
  customClassifiers: ['#app/classifiers/repository_classifier'],
})

export default statsConfig
```

## Statistics Explained

- **Classes**: Number of class declarations found
- **Methods**: Total number of methods in all classes
- **Methods/Class**: Average number of methods per class
- **LoC**: Lines of Code (total lines including comments and empty lines)
- **LLoC**: Logical Lines of Code (excluding comments and empty lines)
- **LLoC/Method**: Average logical lines of code per method
- **Routes**: Total number of registered routes in your application

## License

MIT
