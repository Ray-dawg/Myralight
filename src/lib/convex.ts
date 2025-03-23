import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ConvexClient as OriginalConvexClient } from "convex/browser";

// Create a client using the browser's URL
// When deploying to production, this needs to be updated with your production URL
export const convex = new ConvexReactClient(
  import.meta.env.VITE_CONVEX_URL || "https://unique-trout-650.convex.cloud",
);

// Export ConvexClient for use in services
export class ConvexClient extends OriginalConvexClient {
  constructor() {
    super(
      import.meta.env.VITE_CONVEX_URL ||
        "https://unique-trout-650.convex.cloud",
    );
  }
}

export { ConvexProvider };
