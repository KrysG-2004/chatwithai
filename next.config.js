/** @type {import('next').NextConfig} */
const nextConfig = {
  // 文件上传相关配置
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups'
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp'
          }
        ],
      },
      {
        // API 路由配置
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          }
        ],
      },
      {
        // 上传文件的缓存和安全策略
        source: '/uploads/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          }
        ],
      }
    ]
  },

  // webpack 配置优化
  webpack: (config, { isServer }) => {
    // 处理文件解析相关的模块
    config.externals = [
      ...(config.externals || []),
      {
        // 排除不需要的模块，避免 SSR 问题
        canvas: 'canvas',
        jsdom: 'jsdom',
        'pdf-parse': 'pdf-parse',
      }
    ]

    if (!isServer) {
      // 客户端的特殊配置
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,  // 客户端不需要 fs 模块
        stream: false,
        path: false,
      }
    }

    return config
  },

  // 输出配置
  output: 'standalone',
  distDir: '.next',

  // 图片和文件处理配置
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/uploads/**',
      }
    ],
    formats: ['image/webp'],
    unoptimized: true
  },

  // 性能和安全配置
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,

  // 文件上传相关的实验性功能
  experimental: {
    // 允许较大的请求体，用于文件上传
    largePageDataBytes: 128 * 1024 * 1024,
    // 支持流式响应
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },

  // 开发环境配置
  ...(process.env.NODE_ENV === 'development' && {
    typescript: {
      ignoreBuildErrors: false,
    },
    eslint: {
      ignoreDuringBuilds: false,
    },
  })
}

module.exports = nextConfig 