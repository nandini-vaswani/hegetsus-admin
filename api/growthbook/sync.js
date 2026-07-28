import { syncExperimentToGrowthBook } from "../../growthbook-server.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }
  try {
    const result = await syncExperimentToGrowthBook(req.body || {});
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ ok: false, message: "Bad request: " + err.message });
  }
}
