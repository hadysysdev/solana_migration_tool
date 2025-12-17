/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Enable strict type checking during build
    ignoreBuildErrors: false,
  },
  eslint: {
    // Enable ESLint during builds
    ignoreDuringBuilds: false,
  },
  webpack: (config, { isServer }) => {
    // Handle node modules that are not compatible with webpack 5
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        url: require.resolve('url'),
        zlib: require.resolve('browserify-zlib'),
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        assert: require.resolve('assert'),
        os: require.resolve('os-browserify'),
        path: require.resolve('path-browserify'),
      };
    }

    // Handle .wasm files for Solana libraries
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    // Handle ESM modules
    config.module.rules.push({
      test: /\.m?js$/,
      resolve: {
        fullySpecified: false,
      },
    });

    return config;
  },
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "worker-src 'self' blob:",
              "child-src 'self' blob:",
              "font-src 'self'",
              // Allow local backend/API and dev websockets during development
              "connect-src 'self' http://localhost:8000 https://api.devnet.solana.com https://api.mainnet-beta.solana.com https://dlmm-api.meteora.ag https://mainnet.helius-rpc.com https://cdn.jsdelivr.net https://unpkg.com ws://localhost:3000 wss://api.devnet.solana.com wss://api.mainnet-beta.solana.com",
              "frame-src 'none'",
            ].join('; '),
          },
        ],
      },
      // Cache animation files aggressively
      {
        source: '/animations/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  // Image optimization
  images: {
    domains: ['images.unsplash.com', 'assets.coingecko.com'],
    formats: ['image/webp', 'image/avif'],
  },
  // Compression
  compress: true,
  // Enable SWC minification
  swcMinify: true,
  // Environment variables that should be available on the client
  env: {
    NEXT_PUBLIC_APP_NAME: 'W3Swap',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
  },
};

module.exports = nextConfig;
