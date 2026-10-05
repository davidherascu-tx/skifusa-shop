import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Add an R2 incremental cache here later if you rely on ISR/revalidate:
// https://opennext.js.org/cloudflare/caching
export default defineCloudflareConfig();
