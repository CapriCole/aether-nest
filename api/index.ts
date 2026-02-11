import { createServer } from "../server";
import serverless from "serverless-http";

export const config = {
    api: {
        bodyParser: false,
    },
};

let handler: any;
try {
    const app = createServer();
    handler = serverless(app);
} catch (err: any) {
    console.error("Failed to initialize server:", err);
    // Return a diagnostic handler so Vercel doesn't just show a blank 500
    handler = async (req: any, res: any) => {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({
            success: false,
            message: "Server initialization failed",
            error: err?.message || String(err),
        }));
    };
}

export default handler;
