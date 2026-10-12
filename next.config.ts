import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Product images are served from /public, so no remote image hosts are needed.
const nextConfig: NextConfig = {};

export default nextConfig;

initOpenNextCloudflareForDev();
