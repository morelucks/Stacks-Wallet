#!/usr/bin/env node
/**
 * Test script to query the activity API endpoint
 * Usage: node test-activity.js [server-url] [network]
 */

const serverUrl = process.argv[2] || "http://localhost:3001";
const network = process.argv[3] || "testnet";

async function testActivity() {
  try {
    const url = new URL(`${serverUrl}/activity`);
    url.searchParams.set("limit", "10");
    url.searchParams.set("network", network);

    console.log(`Fetching activity from ${url.toString()}...`);
    const response = await fetch(url.toString());

    if (!response.ok) {
      console.error("❌ API error:", response.status, await response.text());
      process.exit(1);
    }

    const data = await response.json();
    console.log(`✅ Found ${data.count} events`);
    
    if (data.items && data.items.length > 0) {
      console.log("\nRecent events:");
      data.items.slice(0, 5).forEach((event, idx) => {
        console.log(`\n[${idx + 1}] ${event.txid?.slice(0, 16)}...`);
        console.log(`    Block: ${event.block_height}, Network: ${event.network || event.chain}`);
        if (event.matched_events) {
          event.matched_events.forEach(evt => {
            console.log(`    → ${evt.function_name} on ${evt.contract_identifier}`);
          });
        }
      });
    } else {
      console.log("No events found. Send test events first.");
    }
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

testActivity();

