import { makeContractDeploy, broadcastTransaction, AnchorMode, ClarityVersion } from '@stacks/transactions';
import { STACKS_TESTNET, STACKS_MAINNET } from '@stacks/network';
import { readFileSync } from 'fs';
import path from 'path';
import  dotenv  from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Load environment variables
const PRIVATE_KEY = process.env.PRIVATE_KEY || process.env.DEPLOYER_KEY;
const NETWORK_ENV = process.env.STACKS_NETWORK || 'mainnet'; // Default to mainnet for Builder Challenge
// Optional overrides for contract names so you can deploy v2/v3 without collisions
const TRAIT_NAME = process.env.TRAIT_NAME || 'sip-010-trait';
const TOKEN_BASE_NAME = process.env.TOKEN_BASE_NAME || 'token-contract';
// Fees are specified in micro-STX. Default 150_000 (0.15 STX) if not overridden.
const DEPLOY_FEE = Number.parseInt(process.env.FEE || '150000', 10);

if (!PRIVATE_KEY) {
    console.error("Error: PRIVATE_KEY or DEPLOYER_KEY environment variable is required.");
    console.error("Set your private key in .env file");
    process.exit(1);
}

// TypeScript assertion - we know PRIVATE_KEY is defined due to the check above
const privateKey: string = PRIVATE_KEY;

async function deployContract(contractFileName: string, contractName: string) {
    const network = NETWORK_ENV === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET;
    const networkName = NETWORK_ENV === 'mainnet' ? 'Mainnet' : 'Testnet';

    // Read contract source code
    const contractPath = path.join(process.cwd(), 'contracts', contractFileName);
    const contractSource = readFileSync(contractPath, 'utf-8');

    console.log(`📄 Contract: ${contractName}`);
    console.log(`📍 Network: ${networkName}`);
    console.log(`📖 Reading from: ${contractPath}\n`);

    const txOptions = {
        contractName,
        codeBody: contractSource,
        senderKey: privateKey,
        network,
        anchorMode: AnchorMode.Any,
        clarityVersion: ClarityVersion.Clarity4,
        fee: 150000,
        postConditionMode: 0x01,
    };

    try {
        console.log("⏳ Creating transaction...");
        console.log("🔧 Transaction options:", {
            contractName: txOptions.contractName,
            network: networkName,
            clarityVersion: txOptions.clarityVersion,
            fee: txOptions.fee
        });
        const transaction = await makeContractDeploy(txOptions);
        
        console.log("📤 Broadcasting to network...");
        const broadcastResponse = await broadcastTransaction({ transaction, network });

        if ('error' in broadcastResponse) {
            console.error('❌ Deployment failed:', broadcastResponse.error);
            console.error('❌ Full response:', JSON.stringify(broadcastResponse, null, 2));
            throw new Error(broadcastResponse.error);
        } else {
            console.log('\n✅ Contract deployed successfully!');
            console.log(`📋 Transaction ID: ${broadcastResponse.txid}`);
            console.log(`🔗 Explorer: https://explorer.hiro.so/txid/${broadcastResponse.txid}?chain=${NETWORK_ENV}`);
            return broadcastResponse.txid;
        }
    } catch (error) {
        console.error('❌ Error deploying contract:', error);
        throw error;
    }
}

async function deployAll() {
    console.log(`🚀 Deploying contracts to ${NETWORK_ENV}...`);
    console.log(`📦 Using Clarity 4\n`);

    try {
        // Skip trait deployment since it already exists
        console.log("1️⃣ SIP-010 trait already exists, skipping...");
        console.log("   Contract: ST8DAC2FHJFX599JR491PEAEM0CAXP95JXZ00MBD.sip-010-trait");
        
        // Deploy token contract
        console.log("\n2️⃣ Deploying token contract...");
        const timestamp = Date.now();
        // Use custom name if provided, otherwise use timestamp-based name
        const customName = process.env.TOKEN_CONTRACT_NAME;
        const tokenContractName = customName || `token-contract-v3-${timestamp}`;
        await deployContract('token-contract.clar', tokenContractName);
        
        console.log(`\n🎉 All contracts deployed successfully!`);
        console.log(`📝 Trait Contract: sip-010-trait`);
        console.log(`📝 Token Contract: ${tokenContractName}`);
        console.log(`\n💡 Next steps:`);
        console.log(`   1. Wait for transaction confirmations (~10 minutes)`);
        console.log(`   2. Share your contract addresses on GitHub`);
        console.log(`   3. Generate activity by calling contract functions`);
        console.log(`   4. Check leaderboard at https://stacks.org/builder-challenge`);
        
    } catch (error) {
        console.error('❌ Deployment process failed:', error);
        process.exit(1);
    }
}

deployAll();