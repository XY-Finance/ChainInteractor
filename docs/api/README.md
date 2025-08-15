# API Documentation

This directory contains technical API documentation for the EIP-7702 Demo Project.

## Table of Contents

- [Components API](./components.md) - UI component documentation
- [Hooks API](./hooks.md) - Custom React hooks documentation
- [Utilities API](./utils.md) - Utility functions documentation
- [Types API](./types.md) - TypeScript type definitions

## Overview

The project provides several APIs for building EIP-7702 smart account applications:

### Core APIs

- **EIP-7702 Authorization**: Complete workflow for authorizing EOAs
- **Smart Account Creation**: Create and manage smart accounts
- **User Operations**: Send transactions through smart accounts
- **Wallet Integration**: MetaMask and other wallet support

### Architecture

The API is organized into several layers:

1. **UI Components** (`src/components/`) - Reusable React components
2. **Custom Hooks** (`src/hooks/`) - Business logic and state management
3. **Utilities** (`src/utils/`) - Shared helper functions
4. **Types** (`src/types/`) - TypeScript type definitions
5. **Configuration** (`src/config/`) - App configuration

## Getting Started

```typescript
import { useEIP7702 } from '@/hooks/useEIP7702'
import { Button, Card } from '@/components/ui'

function MyComponent() {
  const { address, isConnected, addLog } = useEIP7702()

  return (
    <Card title="EIP-7702 Demo">
      <Button variant="primary">
        Connect Wallet
      </Button>
    </Card>
  )
}
```

## Examples

See the [examples directory](../examples/) for complete usage examples.
