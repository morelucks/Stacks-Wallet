import { 
    makeContractCall,
    broadcastTransaction,
    getAddressFromPrivateKey,
    AnchorMode,
    PostConditionMode,
    uintCV,
    principalCV
} from '@stacks/transactions';
import { STACKS_TESTNET, STACKS_MAINNET } from '@stacks/network';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const NETWORK_ENV = process.env.STACKS_NETWORK || 'mainnet';
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const ADMIN_ADDRESS = process.env.ADMIN_ADDRESS;
const RECIPIENT_ADDRESS = process.env.DEFAULT_MEMBER_ADDRESS;

if (!PRIVATE_KEY) {
    console.error("❌ Missing PRIVATE_KEY in .env file");
    process.exit(1);
}

if (!CONTRACT_ADDRESS) {
    console.error("❌ Missing CONTRACT_ADDRESS in .env file");
    console.error("💡 Please deploy your contract first or set CONTRACT_ADDRESS=SP8DAC2FHJFX599JR491PEAEM0CAXP95JZWQ8ZP3.token-contract-TIMESTAMP");
    process.exit(1);
}

if (!ADMIN_ADDRESS) {
    console.error("❌ Missing ADMIN_ADDRESS in .env file");
    process.exit(1);
}

if (!RECIPIENT_ADDRESS) {
    console.error("❌ Missing DEFAULT_MEMBER_ADDRESS in .env file");
    console.error("💡 Please set DEFAULT_MEMBER_ADDRESS in your .env file");
    process.exit(1);
}

// TypeScript assertions
const privateKey: string = PRIVATE_KEY;
const contractAddress: string = CONTRACT_ADDRESS;
const adminAddress: string = ADMIN_ADDRESS;
const recipientAddress: string = RECIPIENT_ADDRESS;

// Parse contract address
const [contractAddr, contractName] = contractAddress.split('.');

if (!contractAddr || !contractName) {
    console.error("❌ Invalid CONTRACT_ADDRESS format. Expected: SP_ADDRESS.CONTRACT_NAME");
    console.error("💡 Example: SP8DAC2FHJFX599JR491PEAEM0CAXP95JZWQ8ZP3.token-contract-1234567890");
    process.exit(1);
}

async function mintTokens(amount: number, recipient: string, mintNumber: number): Promise<boolean> {
    const network = NETWORK_ENV === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET;
    const senderAddress = getAddressFromPrivateKey(privateKey);
    
    console.log(`🪙 Mint #${mintNumber}: ${amount / 1000000} CC tokens to ${recipient}`);
    
    const txOptions = {
        contractAddress: contractAddr,
        contractName: contractName,
        functionName: 'mint',
        functionArgs: [
            uintCV(amount),           // amount: in micro-tokens (1,000,000 = 1 CC)
            principalCV(recipient)    // recipient: address to receive tokens
        ],
        senderKey: privateKey,
        network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow,
        fee: 100000, // 0.1 STX fee for mainnet
    };

    try {
        console.log(`⏳ Creating mint transaction #${mintNumber}...`);
        const transaction = await makeContractCall(txOptions);
        
        console.log(`📤 Broadcasting to ${NETWORK_ENV}...`);
        const broadcastResponse = await broadcastTransaction({ transaction, network });

        if ('error' in broadcastResponse) {
            console.error(`❌ Mint #${mintNumber} failed: ${broadcastResponse.error}`);
            if (broadcastResponse.reason) {
                console.error(`📝 Reason: ${broadcastResponse.reason}`);
            }
            return false;
        } else {
            console.log(`✅ Mint #${mintNumber} successful!`);
            console.log(`📋 Transaction ID: ${broadcastResponse.txid}`);
            console.log(`🔗 Explorer: https://explorer.hiro.so/txid/${broadcastResponse.txid}?chain=${NETWORK_ENV}`);
            return true;
        }
    } catch (error) {
        console.error(`❌ Error in mint #${mintNumber}:`, error);
        return false;
    }
}

async function main() {
    console.log(`🚀 Mainnet Token Mint Script - 5 Transactions`);
    console.log(`============================================\n`);
    
    const senderAddress = getAddressFromPrivateKey(privateKey);
    const amount = 1000000; // 1 CC token per mint
    const recipient = recipientAddress; // Mint to recipient address (different from sender)
    
    console.log(`📊 Mint Details:`);
    console.log(`   Network: ${NETWORK_ENV}`);
    console.log(`   Contract: ${contractAddress}`);
    console.log(`   Sender: ${senderAddress}`);
    console.log(`   Recipient: ${recipient}`);
    console.log(`   Amount per mint: ${amount / 1000000} CC tokens`);
    console.log(`   Total mints: 5`);
    console.log(`   Total tokens: ${(amount * 5) / 1000000} CC`);
    console.log(`   Fee per tx: 0.1 STX`);
    console.log(`   Total fees: 0.5 STX\n`);
    
    // Verify sender is the contract owner
    if (senderAddress !== adminAddress) {
        console.error(`❌ Sender address mismatch!`);
        console.error(`   Expected: ${adminAddress}`);
        console.error(`   Got: ${senderAddress}`);
        console.error(`💡 Make sure PRIVATE_KEY matches ADMIN_ADDRESS`);
        process.exit(1);
    }
    
    // Verify recipient is different from sender
    if (recipient === senderAddress) {
        console.error(`❌ Recipient cannot be the same as sender!`);
        console.error(`   Sender: ${senderAddress}`);
        console.error(`   Recipient: ${recipient}`);
        console.error(`💡 Please set a different DEFAULT_MEMBER_ADDRESS in your .env file`);
        process.exit(1);
    }
    
    // Execute 5 mint transactions
    let successCount = 0;
    const txIds: string[] = [];
    
    for (let i = 1; i <= 5; i++) {
        console.log(`\n🔄 Executing mint ${i}/5:`);
        
        const success = await mintTokens(amount, recipient, i);
        
        if (success) {
            successCount++;
        }
        
        // Wait 3 seconds between transactions (except after the last one)
        if (i < 5) {
            console.log(`⏳ Waiting 3 seconds before next mint...\n`);
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }
    
    // Summary
    console.log(`\n📊 Final Summary:`);
    console.log(`   ✅ Successful mints: ${successCount}/5`);
    console.log(`   💰 Total cost: ${successCount * 0.1} STX`);
    console.log(`   🪙 Total tokens minted: ${(successCount * amount) / 1000000} CC`);
    
    if (successCount === 5) {
        console.log(`\n🎉 All 5 mints completed successfully!`);
    } else if (successCount > 0) {
        console.log(`\n⚠️  ${5 - successCount} transactions failed. Check the error messages above.`);
    } else {
        console.log(`\n❌ All mints failed. Check the error messages above.`);
        process.exit(1);
    }
    
    console.log(`\n📋 Next steps:`);
    console.log(`   1. Wait for transaction confirmations (~10 minutes each)`);
    console.log(`   2. Check balance using: npm run check-balance`);
    console.log(`   3. Monitor transactions on Stacks Explorer`);
}

main().catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
});