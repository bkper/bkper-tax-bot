# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the Bkper Tax Bot - a Google Cloud Function that automatically calculates and records VAT, GST, and other taxes based on transaction amounts. The bot provides real-time visibility into tax receivables and payables with support for both tax-included and tax-excluded calculations.

## Architecture

The project follows an event-driven architecture:

### Main Components
- **index.ts**: Entry point that handles HTTP requests and routes events to appropriate handlers
- **EventHandler.ts**: Abstract base class for all event handlers with common functionality
- **EventHandlerTransactionPosted.ts**: Handles TRANSACTION_POSTED events - calculates and creates tax transactions
- **EventHandlerTransactionDeleted.ts**: Handles TRANSACTION_DELETED events - removes associated tax transactions
- **EventHandlerTransactionUpdated.ts**: Handles TRANSACTION_UPDATED events - combines delete and post operations
- **constants.ts**: Contains all property keys and expression constants used throughout the system

### Event Flow
1. Bkper sends webhook events to the Cloud Function
2. `doPost` function in index.ts initializes OAuth and API configuration
3. Events are routed to appropriate handlers based on event type
4. Handlers process transactions and calculate taxes using account/group properties
5. New tax transactions are created or existing ones are deleted/updated

### Key Properties System
The bot uses a property-based configuration system:
- **Account/Group Properties**: `tax_included_rate`, `tax_excluded_rate`, `tax_description`
- **Transaction Properties**: `tax_round`, `tax_included_amount`, `tax_excluded_amount`
- **Book Properties**: `tax_copy_properties`

## Development Commands

### Build and Deploy
```bash
# Clean build artifacts
bun run clean

# Build project (includes TypeScript compilation and dependency installation)
bun run build

# Deploy to Google Cloud Functions
bun run deploy
```

### Development Workflow
```bash
# Start development environment with live reload
bun run dev

# Individual development commands:
bun run dev:compile    # Watch TypeScript compilation
bun run dev:webhook    # Start webhook server
bun run dev:nodemon    # Start function with nodemon
```

### Testing and Validation
```bash
# Compile TypeScript to check for errors
npx tsc

# Run the function locally for testing
bun run functions:dev
```

### Cloud Function Management
```bash
# Enable required GCP services
bun run functions:enable

# Authorize function with Bkper service account
bun run functions:authorize

# Open function logs in GCP console
bun run functions:open
```

### Dependency Management
```bash
# Update Bkper libraries
bun run update:app
bun run update:api

# Sync with Bkper app configuration
bun run bkper:sync
```

## Code Architecture Details

### OAuth and API Configuration
- Uses `bkper-oauth-token` header for OAuth tokens
- Supports both development (via bkper CLI) and production token providers
- API key provided via `BKPER_API_KEY` environment variable or header

### Transaction Processing Logic
1. **Tax Calculation**: Calculates tax amounts based on rates from account/group properties
2. **Expression Evaluation**: Supports dynamic expressions in tax descriptions (e.g., `${account.name}`, `${transaction.description}`)
3. **Batch Operations**: Uses `batchCreateTransactions` for efficient bulk operations
4. **Duplicate Prevention**: Prevents processing of transactions from the same bot to avoid loops

### Error Handling
- Comprehensive error catching with stack trace logging
- Graceful handling of missing properties and invalid configurations
- Timeout protection for long-running operations

## Important Notes

- The project uses ES modules (`"type": "module"`) and targets Node.js 22
- TypeScript configuration extends Google TypeScript Style (`gts`)
- All code is compiled to the `dist/` directory for deployment
- The bot runs as a Google Cloud Function Gen2 with specific resource limits (256Mi memory, 360s timeout)
- Uses `bkper-js` library for Bkper API interactions and BigNumber.js for precise decimal calculations

## Property Configuration Examples

### Tax Excluded (Additional Tax)
```yaml
tax_excluded_rate: 7
tax_description: #incometax
```

### Tax Included (Extract from Amount)
```yaml
tax_included_rate: 12.85
tax_description: #vatin
```

### Dynamic Descriptions
```yaml
tax_description: ${account.name} Input Tax #vatin ${transaction.description}
```

## Development Environment Setup

1. Install dependencies: `bun install`
2. Set up environment variables (BKPER_API_KEY)
3. Configure OAuth tokens via bkper CLI for development
4. Use `bun run dev` for local development with live reload
5. Deploy with `bun run deploy` after successful build