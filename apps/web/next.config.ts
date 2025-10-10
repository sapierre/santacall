import type { NextConfig } from "next";

import env from "./env.config";

const INTERNAL_PACKAGES = [
  "@turbostarter/analytics-web",
  "@turbostarter/api",
  "@turbostarter/auth",
  "@turbostarter/billing",
  "@turbostarter/cms",
  "@turbostarter/email",
  "@turbostarter/db",
  "@turbostarter/i18n",
  "@turbostarter/shared",
  "@turbostarter/storage",
  "@turbostarter/ui",
  "@turbostarter/ui-web",
];

const config: NextConfig = {
  reactStrictMode: true,
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/i,
      use: ["@svgr/webpack"],
    });

    return config;
  },
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },

  experimental: {
    optimizePackageImports: INTERNAL_PACKAGES,
  },

  images: {
    remotePatterns: [
      {
        hostname: "images.unsplash.com",
      },
    ],
  },

  /** Enables hot reloading for local packages without a build step */
  transpilePackages: INTERNAL_PACKAGES,

  /** We already do linting and typechecking as separate tasks in CI */
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: env.ANALYZE,
});

export default withBundleAnalyzer(config);
