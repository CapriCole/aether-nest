import { createServer } from "../server";
import serverless from "serverless-http";
import { ensureDbReady } from "../server/db";

export const config = {
    api: {
        bodyParser: false,
    },
};

const app = createServer();
const sls = serverless(app);

// Wrap handler to ensure DB is initialized before each request
const handler = async (req: any, res: any) => {
    try {
        await ensureDbReady();
        return sls(req, res);
    } catch (err: any) {
        console.error("Server handler error:", err);
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({
            success: false,
            message: "Server initialization failed",
            error: err?.message || String(err),
        }));
    }
};

export default handler;
