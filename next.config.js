/** @type {import("next").NextConfig} */
const { version } = require("./package.json")

const nextConfig = {
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "/dashboard",
        permanent: true
      }
    ]
  },
  async rewrites() {
    return [
      {
        source: "/api/(.*)",
        destination: "/api"
      }
    ]
  },
  experimental: {
    serverComponentsExternalPackages: ["sequelize", "sequelize-typescript"]
  },
  publicRuntimeConfig: {
    version
  },
  webpack: config => {
    // eslint-disable-next-line no-param-reassign
    config.resolve.fallback = { fs: false }

    config.module.rules.push({
      test: /\.svg$/,
      use: [
        {
          loader: "@svgr/webpack",
          options: {
            svgo: true,
            svgoConfig: {
              prefixClassNames: true
            }
          }
        }
      ],
      issuer: {
        and: [/\.(ts|tsx|js|jsx)$/]
      }
    })

    return {
      ...config
    }
  }
}

module.exports = nextConfig
