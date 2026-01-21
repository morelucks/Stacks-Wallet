import express from "express";
import crypto from "crypto";

const PORT = process.env.PORT || 3001;
const SECRET = process.env.CHAINHOOK_SECRET || "";
const MAX_EVENTS = Number.parseInt(process.env.MAX_EVENTS || "500", 10);

const app = express();
app.use(express.json({ type: "*/*" }));

// In-memory store of recent events (for demo / small apps)
const recentEvents = [];

function verifySignature(reqBody, signatureHeader) {
  if (!SECRET) return true; // skip if no secret configured
  if (!signatureHeader) return false;

  const hmac = crypto.createHmac("sha256", SECRET);
  hmac.update(typeof reqBody === "string" ? reqBody : JSON.stringify(reqBody));
  const digest = `sha256=${hmac.digest("hex")}`;
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signatureHeader));
}

app.post("/hooks/stacks", (req, res) => {
  try {
    const sig = req.headers["x-chainhook-signature"];
    if (!verifySignature(req.body, sig)) {
      return res.status(401).send("invalid signature");
    }

    const { block_height, txid, matched_events, network, chain, cursor } =
      req.body || {};

    const normalized = {
      block_height,
      txid,
      matched_events,
      network: network || "stacks",
      chain: chain || "mainnet",
      cursor: cursor || null,
      received_at: new Date().toISOString(),
    };

    console.log("Chainhook match", normalized);

    // Persist in memory (newest first)
    recentEvents.unshift(normalized);
    if (recentEvents.length > MAX_EVENTS) {
      recentEvents.pop();
    }

    return res.sendStatus(200);
  } catch (err) {
    console.error("Webhook error", err);
    return res.sendStatus(500);
  }
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// Simple activity feed API
// Optional query params:
//   - limit: max number of events
//   - network: filter by network
//   - txid: filter by txid
app.get("/activity", (req, res) => {
  const limit = Math.min(
    Number.parseInt(req.query.limit || "50", 10),
    MAX_EVENTS,
  );
  const { network, txid } = req.query;

  let events = recentEvents;
  if (network) {
    events = events.filter(
      (e) => String(e.network).toLowerCase() === String(network).toLowerCase(),
    );
  }
  if (txid) {
    events = events.filter((e) => e.txid === txid);
  }

  res.json({
    count: events.length,
    items: events.slice(0, limit),
  });
});

app.listen(PORT, () => {
  console.log(`Chainhook webhook server listening on http://localhost:${PORT}`);
});


