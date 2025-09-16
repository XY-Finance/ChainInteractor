import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Webpack optimizations to prevent ChunkLoadError
  webpack: (config, { dev, isServer }) => {
    // Optimize chunk splitting for better loading
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          chunks: 'all',
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            // Create separate chunks for large dependencies
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
            },
            // Separate chunk for wallet-related dependencies
            wallet: {
              test: /[\\/]node_modules[\\/](@rainbow-me|@zerodev|@metamask|wagmi|viem)[\\/]/,
              name: 'wallet',
              chunks: 'all',
              priority: 20,
            },
          },
        },
      };
    }

    // Add fallback for missing chunks
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    return config;
  },

  // Experimental features for better chunking
  experimental: {
    optimizePackageImports: ['@rainbow-me/rainbowkit', '@zerodev/sdk', '@metamask/delegation-toolkit'],
  },

  // Output configuration for better chunk loading
  output: 'standalone',

  // Disable static optimization for dynamic imports
  trailingSlash: false,
};

export default nextConfig;
