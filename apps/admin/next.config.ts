import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@shellty/api-contracts"],
  poweredByHeader: false,
};

export default withSentryConfig(nextConfig, {
  silent: true,
  sourcemaps: { deleteSourcemapsAfterUpload: true },
});
