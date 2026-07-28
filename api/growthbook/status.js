// Vercel serverless function -- one request in, one response out, no
// persistent process. Reads GROWTHBOOK_API_KEY etc. straight from
// process.env, which Vercel injects from the project's dashboard env vars
// (no .env file involved in this environment; initEnv()/.env parsing is
// only for the local `node server.js` path in server.js).
import { isConnected } from "../../growthbook-server.js";

export default function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }
  res.status(200).json({ connected: isConnected() });
}
