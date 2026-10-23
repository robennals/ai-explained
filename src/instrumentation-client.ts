import { isAnalyticsEnabled } from "@/lib/analytics";
import { initPostHog } from "@/lib/posthog";

// Runs before React hydrates the page (see Next.js's instrumentation-client).
if (isAnalyticsEnabled()) initPostHog();
