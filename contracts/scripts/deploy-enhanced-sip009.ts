import { 
  makeContractDeploy,
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  createStacksPrivateKey,
  getAddressFromPrivateKey,
  TransactionVersion
} from '@stacks/transactions';
import { StacksTestnet, StacksMainnet } from '@stacks/network';
import * as fs from 'fs';

/**
 * Enhanced SIP-009 NFT Contract Deployment Script
 * 
 * Deploys the complete enhanced SIP-009 ecosystem including:
 * - Enhanced SIP-009 main contract
 * - Analytics contract
 * - Bridge contract
 * - Initializes default configurations
 */

const NETWORK = process.env.NETWORK || 'testnet';
const PRIVATE_KEY = process.env.PRIVATE_KEY || '';

if (!PRIVATE_KEY) {
  console.error('Please set PRIVATE_KEY environment variable');
  process.exit(1);
}

const network = NETWORK === 'mainnet' ? new StacksMainnet() : new StacksTestnet();
const privateKey = createStacksPrivateKey(PRIVATE_KEY);
const senderAddress = getAddressFromPrivateKey(privateKey.data, TransactionVersion.Testnet);

console.log(`🚀 Deploying Enhanced SIP-009 NFT Ecosystem`);
console.log(`📍 Network: ${NETWORK}`);
console.log(`👤 Deployer: ${senderAddress}`);
console.log(`⏰ Timestamp: ${new Date().toISOString()}`);

interface DeploymentResult {
  contractName: string;
  txid: string;
  success: boolean;
  address?: string;
}

async function deployContract(
  contractName: string, 
  contractPath: string, 
  fee: number = 50000
): Promise<DeploymentResult> {
  try {
    console.log(`\n📦 Deploying ${contractName}...`);
    
    const contractSource = fs.readFileSync(contractPath, 'utf8');
    console.log(`📄 Contract size: ${contractSource.length} characters`);
    
    const deployTx = await makeContractDeploy({
      contractName,
      codeBody: contractSource,
      senderKey: privateKey.data,
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      fee,
    });

    console.log(`📦 Transaction ID: ${deployTx.txid()}`);
    
    const broadcastResponse = await broadcastTransaction(deployTx, network);
    
    if (broadcastResponse.error) {
      console.error(`❌ ${contractName} deployment failed:`, broadcastResponse.error);
      return { contractName, txid: '', success: false };
    }
    
    console.log(`✅ ${contractName} deployed successfully!`);
    console.log(`🔗 Transaction ID: ${broadcastResponse.txid}`);
    
    return {
      contractName,
      txid: broadcastResponse.txid,
      success: true,
      address: `${senderAddress}.${contractName}`
    };
    
  } catch (error) {
    console.error(`❌ ${contractName} deployment error:`, error);
    return { contractName, txid: '', success: false };
  }
}

async function waitForConfirmation(txid: string, contractName: string): Promise<boolean> {
  console.log(`⏳ Waiting for ${contractName} confirmation...`);
  const maxAttempts = 30;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`${network.coreApiUrl}/extended/v1/tx/${txid}`);
      const txData = await response.json();
      
      if (txData.tx_status === 'success') {
        console.log(`✅ ${contractName} confirmed in block ${txData.block_height}`);
        return true;
      } else if (txData.tx_status === 'abort_by_response' || txData.tx_status === 'abort_by_post_condition') {
        console.error(`❌ ${contractName} transaction failed: ${txData.tx_status}`);
        return false;
      }
      
      console.log(`⏳ ${contractName} - Attempt ${attempts + 1}/${maxAttempts} - Status: ${txData.tx_status}`);
      await new Promise(resolve => setTimeout(resolve, 10000));
      attempts++;
      
    } catch (error) {
      console.log(`⏳ Checking ${contractName} confirmation... (${attempts + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 10000));
      attempts++;
    }
  }
  
  console.log(`⚠️  Timeout waiting for ${contractName} confirmation`);
  return false;
}

async function initializeContracts(): Promise<void> {
  console.log(`\n🔧 Initializing contracts...`);
  
  try {
    // Initialize enhanced SIP-009 contract
    console.log(`🎛️  Setting up enhanced SIP-009 configuration...`);
    
    // Create initial collection
    const createCollectionTx = await makeContractCall({
      contractAddress: senderAddress,
      contractName: 'enhanced-sip-009',
      functionName: 'create-collection',
      functionArgs: [
        { type: 'string-ascii', value: 'Genesis Collection' },
        { type: 'string-ascii', value: 'The first collection of enhanced NFTs' },
        { type: 'uint', value: 10000 },
        { type: 'uint', value: 500 }, // 5% royalty
        { type: 'string-ascii', value: 'https://api.enhanced-nft.com/genesis/' }
      ],
      senderKey: privateKey.data,
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      fee: 10000,
    });
    
    const collectionResponse = await broadcastTransaction(createCollectionTx, network);
    console.log(`📊 Genesis collection created: ${collectionResponse.txid}`);
    
    // Create initial staking pool
    const createPoolTx = await makeContractCall({
      contractAddress: senderAddress,
      contractName: 'enhanced-sip-009',
      functionName: 'create-staking-pool',
      functionArgs: [
        { type: 'string-ascii', value: 'Genesis Staking Pool' },
        { type: 'uint', value: 100 }, // 100 rewards per block
        { type: 'uint', value: 144 } // 1 day minimum stake (144 blocks)
      ],
      senderKey: privateKey.data,
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      fee: 8000,
    });
    
    const poolResponse = await broadcastTransaction(createPoolTx, network);
    console.log(`🏊 Genesis staking pool created: ${poolResponse.txid}`);
    
    // Initialize bridge validators (if bridge contract deployed)
    console.log(`🌉 Setting up bridge validators...`);
    
    const addValidatorTx = await makeContractCall({
      contractAddress: senderAddress,
      contractName: 'sip-009-bridge',
      functionName: 'add-validator',
      functionArgs: [
        { type: 'principal', value: senderAddress }
      ],
      senderKey: privateKey.data,
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      fee: 5000,
    });
    
    const validatorResponse = await broadcastTransaction(addValidatorTx, network);
    console.log(`👨‍⚖️ Bridge validator added: ${validatorResponse.txid}`);
    
    console.log(`✅ Contract initialization complete!`);
    
  } catch (error) {
    console.error('⚠️  Initialization error (contracts still deployed):', error);
  }
}

async function verifyDeployments(deployments: DeploymentResult[]): Promise<void> {
  console.log(`\n🔍 Verifying deployments...`);
  
  for (const deployment of deployments) {
    if (!deployment.success) continue;
    
    try {
      const contractAddress = `${senderAddress}.${deployment.contractName}`;
      const infoUrl = `${network.coreApiUrl}/v2/contracts/interface/${contractAddress}`;
      
      const response = await fetch(infoUrl);
      const contractInfo = await response.json();
      
      if (contractInfo.functions) {
        console.log(`✅ ${deployment.contractName}: ${contractInfo.functions.length} functions verified`);
      } else {
        console.log(`⚠️  ${deployment.contractName}: Could not verify functions`);
      }
      
    } catch (error) {
      console.error(`❌ ${deployment.contractName} verification error:`, error);
    }
  }
}

async function deployEcosystem(): Promise<void> {
  console.log(`\n🎯 Starting Enhanced SIP-009 Ecosystem Deployment\n`);
  
  const deployments: DeploymentResult[] = [];
  
  // Deploy SIP-009 trait first
  deployments.push(await deployContract('sip-009-trait', './contracts/sip-009-trait.clar', 20000));
  
  // Deploy main enhanced SIP-009 contract
  deployments.push(await deployContract('enhanced-sip-009', './contracts/enhanced-sip-009.clar', 80000));
  
  // Deploy analytics contract
  deployments.push(await deployContract('sip-009-analytics', './contracts/sip-009-analytics.clar', 60000));
  
  // Deploy bridge contract
  deployments.push(await deployContract('sip-009-bridge', './contracts/sip-009-bridge.clar', 70000));
  
  // Wait for confirmations
  console.log(`\n⏳ Waiting for all confirmations...`);
  const confirmationPromises = deployments
    .filter(d => d.success)
    .map(d => waitForConfirmation(d.txid, d.contractName));
  
  const confirmationResults = await Promise.all(confirmationPromises);
  const successfulDeployments = deployments.filter((_, index) => confirmationResults[index]);
  
  if (successfulDeployments.length > 0) {
    // Initialize contracts
    await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds
    await initializeContracts();
    
    // Verify deployments
    await new Promise(resolve => setTimeout(resolve, 15000)); // Wait 15 seconds
    await verifyDeployments(deployments);
    
    // Print deployment summary
    console.log(`\n🎉 Enhanced SIP-009 Ecosystem Deployment Complete!`);
    console.log(`\n📋 Deployment Summary:`);
    
    deployments.forEach(deployment => {
      if (deployment.success) {
        console.log(`✅ ${deployment.contractName}: ${deployment.address}`);
      } else {
        console.log(`❌ ${deployment.contractName}: Failed to deploy`);
      }
    });
    
    console.log(`\n🌐 Network: ${NETWORK}`);
    console.log(`👤 Deployer: ${senderAddress}`);
    console.log(`📚 Documentation: Enhanced SIP-009 with marketplace, staking, governance, and bridge`);
    console.log(`🔧 Features: All enhanced features enabled and ready to use`);
    
    // Print usage examples
    console.log(`\n📖 Quick Start Examples:`);
    console.log(`\n// Mint NFT with metadata`);
    console.log(`(contract-call? .enhanced-sip-009 mint-with-metadata`);
    console.log(`  'SP1234... "Dragon NFT" "Legendary dragon" "https://..." (list) "legendary")`);
    
    console.log(`\n// Create staking pool`);
    console.log(`(contract-call? .enhanced-sip-009 create-staking-pool`);
    console.log(`  "Dragon Pool" u50 u144)`);
    
    console.log(`\n// List NFT for sale`);
    console.log(`(contract-call? .enhanced-sip-009 list-for-sale`);
    console.log(`  u1 u1000000 "STX" u1000)`);
    
  } else {
    console.log(`\n❌ Deployment failed. Please check the error messages above.`);
    process.exit(1);
  }
}

// Run deployment
deployEcosystem().catch(console.error);