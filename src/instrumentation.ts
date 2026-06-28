// Runs once when a Next.js server instance starts.
export async function register() {
  // Only seed from the Node.js runtime — MongoDB can't run on the Edge runtime.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { seedAdmin, migrateLegacyData } = await import("@/lib/seed");
    try {
      await migrateLegacyData();
      await seedAdmin();
    } catch (err) {
      console.error("[instrumentation] startup tasks failed:", err);
    }
  }
}
