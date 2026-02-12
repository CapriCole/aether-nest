import { createServer } from "../server";
import { ensureDbReady } from "../server/db";

export const config = {
  api: {
    bodyParser: false,
  },
};

// Single Express app instance reused across invocations
const app = createServer();

// Vercel Node function handler – use Express app directly
const handler = async (req: any, res: any) => {
  try {
    await ensureDbReady();
    // Express apps are compatible request handlers: (req, res, next)
    return app(req, res);
  } catch (err: any) {
    console.error("Server handler error:", err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        success: false,
        message: "Server initialization failed",
        error: err?.message || String(err),
      }),
    );
  }
};

export default handler;
