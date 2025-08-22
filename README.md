# FX CLI Plugin

A powerful CLI tool built with TypeScript and oclif for managing FX operations.

## Features

- 🚀 TypeScript-based CLI with oclif framework
- 🔍 ESLint for code quality
- 💅 Prettier for code formatting
- 🧪 Vitest for testing
- 🏗️ Fast builds with tsup
- 🔄 Automated CI/CD pipeline

## Installation

### Global Installation (Development)
```bash
npm link
```

### Local Development
```bash
npm install
npm run build
./bin/run --help
```

## Usage

```bash
# Show help
fx --help

# Run hello command
fx hello

# Show help for specific command
fx help hello
```

## Development

### Available Scripts

```bash
# Build the project
npm run build

# Fast build with tsup
npm run build:fast

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format

# Run tests
npm run test

# Run tests in watch mode
npm run test:ui

# Run tests once
npm run test:run

# Run full CI pipeline locally
npm run ci:local

# Run full CI pipeline with fresh install
npm run ci
```

### CI Pipeline

The project includes a comprehensive CI pipeline that runs:

1. **Linting** - ESLint with TypeScript support
2. **Testing** - Vitest test runner
3. **Building** - TypeScript compilation
4. **Fast Build** - tsup bundling

#### Local CI Testing
```bash
npm run ci:local
```

#### Full CI Pipeline
```bash
npm run ci
```

#### GitHub Actions
The CI pipeline automatically runs on:
- Push to main/develop/master branches
- Pull requests to main/develop/master branches
- Tests against Node.js versions 18, 20, and 22

## Project Structure

```
fx-cli/
├── src/
│   ├── commands/          # CLI commands
│   │   └── hello.ts      # Hello command
│   └── index.ts          # CLI entry point
├── bin/
│   └── run               # CLI executable
├── scripts/
│   └── ci.sh            # CI pipeline script
├── .github/
│   └── workflows/        # GitHub Actions
│       └── ci.yml        # CI workflow
├── lib/                  # Compiled output
└── package.json          # Project configuration
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run the CI pipeline: `npm run ci:local`
5. Submit a pull request

## License

ISC
