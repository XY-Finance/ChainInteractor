/**
 * ChunkLoadError Handler Utility
 *
 * This utility provides robust error handling for webpack chunk loading errors
 * that can occur in Next.js applications, especially with dynamic imports.
 */

interface ChunkLoadError extends Error {
  type?: string;
  chunk?: string;
  request?: string;
}

/**
 * Handles ChunkLoadError by attempting to reload the page
 * This is often the most effective solution for chunk loading issues
 */
export function handleChunkLoadError(error: ChunkLoadError): void {
  console.warn('ChunkLoadError detected:', {
    message: error.message,
    type: error.type,
    chunk: error.chunk,
    request: error.request,
  });

  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return;
  }

  // Attempt to reload the page to fetch fresh chunks
  if (confirm('A loading error occurred. Would you like to reload the page to fix this?')) {
    window.location.reload();
  }
}

/**
 * Sets up global error handling for ChunkLoadErrors
 * Call this in your app's root component or layout
 */
export function setupChunkErrorHandling(): void {
  if (typeof window === 'undefined') {
    return;
  }

  // Handle unhandled promise rejections (common for chunk loading errors)
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;

    if (error && typeof error === 'object') {
      const errorMessage = error.message || error.toString();

      // Check if this is a ChunkLoadError
      if (
        errorMessage.includes('ChunkLoadError') ||
        errorMessage.includes('Loading chunk') ||
        errorMessage.includes('Loading CSS chunk') ||
        errorMessage.includes('failed')
      ) {
        event.preventDefault(); // Prevent the error from being logged to console
        handleChunkLoadError(error as ChunkLoadError);
      }
    }
  });

  // Handle regular errors
  window.addEventListener('error', (event) => {
    const error = event.error;

    if (error && typeof error === 'object') {
      const errorMessage = error.message || error.toString();

      // Check if this is a ChunkLoadError
      if (
        errorMessage.includes('ChunkLoadError') ||
        errorMessage.includes('Loading chunk') ||
        errorMessage.includes('Loading CSS chunk') ||
        errorMessage.includes('failed')
      ) {
        event.preventDefault(); // Prevent the error from being logged to console
        handleChunkLoadError(error as ChunkLoadError);
      }
    }
  });
}

/**
 * Retry mechanism for failed chunk loads
 * Useful for implementing custom retry logic
 */
export async function retryChunkLoad<T>(
  chunkLoader: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await chunkLoader();
    } catch (error) {
      lastError = error as Error;

      const errorMessage = lastError.message || lastError.toString();

      // Check if this is a chunk loading error
      if (
        errorMessage.includes('ChunkLoadError') ||
        errorMessage.includes('Loading chunk') ||
        errorMessage.includes('Loading CSS chunk') ||
        errorMessage.includes('failed')
      ) {
        console.warn(`Chunk load attempt ${attempt} failed:`, lastError.message);

        if (attempt < maxRetries) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
          continue;
        }
      }

      // If it's not a chunk loading error or we've exhausted retries, throw
      throw lastError;
    }
  }

  throw lastError!;
}

/**
 * Enhanced dynamic import with chunk error handling
 * Use this instead of regular dynamic imports for better error handling
 */
export function dynamicImportWithErrorHandling<T>(
  importFn: () => Promise<T>,
  fallback?: T
): Promise<T> {
  return retryChunkLoad(importFn).catch((error) => {
    console.error('Dynamic import failed after retries:', error);

    if (fallback !== undefined) {
      return fallback;
    }

    // If no fallback provided, handle the error
    handleChunkLoadError(error as ChunkLoadError);
    throw error;
  });
}
