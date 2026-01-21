#!/usr/bin/env node
/**
 * Test script to send mock Chainhook events to the webhook server
 * Usage: node test-webhook.js [webhook-url]
 */

const webhookUrl = process.argv[2] || "http://localhost:3001/hooks/stacks";

const mockEvent = {
  block_height: 12345,
  txid: "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(""),
  matched_events: [
    {
      contract_identifier: "ST1EQNTKNRGME36P9EEXZCFFNCYBA50VN6SHNZ40.token-contract-1765968837127",
      function_name: "mint",
      args: [
        { type: "uint", value: "100" },
        { type: "principal", value: "ST1NAECS2PABSRJN70E1PPG77WSWBK66E9X21G0WX" }
      ]
    }
  ],
  network: "stacks",
  chain: "testnet",
  cursor: null
};

async function sendTestEvent() {
  try {
    console.log(`Sending test event to ${webhookUrl}...`);
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mockEvent)
    });

    if (response.ok) {
      console.log("✅ Webhook accepted:", response.status);
    } else {
      console.error("❌ Webhook rejected:", response.status, await response.text());
    }
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

sendTestEvent();

