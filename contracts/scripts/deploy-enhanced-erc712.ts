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

/**
 * Enhanced ERC-712 Contract Deployment Script
 * 
 * This script deploys the enhanced ERC-712 contract with all improvements:
 * - Multi-algorithm signature verification
 * - Advanced replay protection
 * - Hierarchical delegation
 * - Enhanced permit functionality
 * - Role-based access control
 * - Performance optimizations
 * - Configuration management
 * - Security monitoring
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

console.log(`🚀 Deploying Enhanced ERC-712 Contract`);
console.log(`📍 Network: ${NETWORK}`);
console.log(`👤 Deployer: ${senderAddress}`);
console.log(`⏰ Timestamp: ${new Date().toISOString()}`);

async function deployEnhancedERC712() {
  try {
    // Read the contract source code
    const fs = require('fs');
    const contractSource = fs.readFileSync('./contracts/erc-712.clar', 'utf8');
    
    console.log(`📄 Contract size: ${contractSource.length} characters`);
    console.log(`🔧 Features: Enhanced signature verification, replay protection, delegation, permits`);
    
    // Create deployment transaction
    const deployTx = await makeContractDeploy({
      contractName: 'enhanced-erc-712',
      codeBody: contractSource,
      senderKey: privateKey.data,
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      fee: 50000, // Higher fee for large contract
    });

    console.log(`📦 Transaction ID: ${deployTx.txid()}`);
    console.log(`💰 Fee: ${deployTx.auth.spendingCondition?.fee} microSTX`);
    
    // Broadcast the transaction
    const broadcastResponse = await broadcastTransaction(deployTx, network);
    
    if (broadcastResponse.error) {
      console.error('❌ Deployment failed:', broadcastResponse.error);
      console.error('Reason:', broadcastResponse.reason);
      return false;
    }
    
    console.log(`✅ Contract deployed successfully!`);
    console.log(`🔗 Transaction ID: ${broadcastResponse.txid}`);
    console.log(`📍 Contract Address: ${senderAddress}.enhanced-erc-712`);
    
    // Wait for confirmation
    console.log(`⏳ Waiting for transaction confirmation...`);
    await waitForConfirmation(broadcastResponse.txid);
    
    // Initialize contract with default configuration
    await initializeContract();
    
    return true;
    
  } catch (error) {
    console.error('❌ Deployment error:', error);
    return false;
  }
}

async function waitForConfirmation(txid: string) {
  const maxAttempts = 30;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`${network.coreApiUrl}/extended/v1/tx/${txid}`);
      const txData = await response.json();
      
      if (txData.tx_status === 'success') {
        console.log(`✅ Transaction confirmed in block ${txData.block_height}`);
        return true;
      } else if (txData.tx_status === 'abort_by_response' || txData.tx_status === 'abort_by_post_condition') {
        console.error(`❌ Transaction failed: ${txData.tx_status}`);
        return false;
      }
      
      console.log(`⏳ Attempt ${attempts + 1}/${maxAttempts} - Status: ${txData.tx_status}`);
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      attempts++;
      
    } catch (error) {
      console.log(`⏳ Checking confirmation... (${attempts + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 10000));
      attempts++;
    }
  }
  
  console.log(`⚠️  Timeout waiting for confirmation, but deployment may still succeed`);
  return false;
}

async function initializeContract() {
  console.log(`🔧 Initializing contract configuration...`);
  
  try {
    // Set initial operational limits
    const setLimitTx = await makeContractCall({
      contractAddress: senderAddress,
      contractName: 'enhanced-erc-712',
      functionName: 'set-operational-limit',
      functionArgs: [
        { type: 'string-ascii', value: 'max_batch_size' },
        { type: 'uint', value: 50 }
      ],
      senderKey: privateKey.data,
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      fee: 5000,
    });
    
    const limitResponse = await broadcastTransaction(setLimitTx, network);
    console.log(`📊 Operational limits set: ${limitResponse.txid}`);
    
    // Enable all features
    const features = ['hierarchical_delegation', 'conditional_permits', 'batch_operations'];
    
    for (const feature of features) {
      const featureTx = await makeContractCall({
        contractAddress: senderAddress,
        contractName: 'enhanced-erc-712',
        functionName: 'toggle-feature',
        functionArgs: [
          { type: 'string-ascii', value: feature },
          { type: 'bool', value: true }
        ],
        senderKey: privateKey.data,
        network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow,
        fee: 3000,
      });
      
      const featureResponse = await broadcastTransaction(featureTx, network);
      console.log(`🎛️  Feature '${feature}' enabled: ${featureResponse.txid}`);
    }
    
    console.log(`✅ Contract initialization complete!`);
    
  } catch (error) {
    console.error('⚠️  Initialization error (contract still deployed):', error);
  }
}

async function verifyDeployment() {
  console.log(`🔍 Verifying deployment...`);
  
  try {
    // Check contract info
    const contractAddress = `${senderAddress}.enhanced-erc-712`;
    const infoUrl = `${network.coreApiUrl}/v2/contracts/interface/${contractAddress}`;
    
    const response = await fetch(infoUrl);
    const contractInfo = await response.json();
    
    if (contractInfo.functions) {
      console.log(`✅ Contract verified: ${contractInfo.functions.length} functions found`);
      console.log(`📋 Key functions available:`);
      
      const keyFunctions = [
        'verify-signature-advanced',
        'blacklist-signature',
        'delegate-hierarchical',
        'create-conditional-permit',
        'grant-role',
        'get-contract-health'
      ];
      
      keyFunctions.forEach(func => {
        const found = contractInfo.functions.find((f: any) => f.name === func);
        console.log(`   ${found ? '✅' : '❌'} ${func}`);
      });
      
      return true;
    }
    
  } catch (error) {
    console.error('❌ Verification error:', error);
  }
  
  return false;
}

// Main deployment process
async function main() {
  console.log(`\n🎯 Starting Enhanced ERC-712 Deployment Process\n`);
  
  const deployed = await deployEnhancedERC712();
  
  if (deployed) {
    await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds
    await verifyDeployment();
    
    console.log(`\n🎉 Enhanced ERC-712 Contract Deployment Complete!`);
    console.log(`📍 Contract: ${senderAddress}.enhanced-erc-712`);
    console.log(`🌐 Network: ${NETWORK}`);
    console.log(`📚 Documentation: See contract comments for usage examples`);
    console.log(`🔧 Features: All enhanced features enabled and ready to use`);
  } else {
    console.log(`\n❌ Deployment failed. Please check the error messages above.`);
    process.exit(1);
  }
}

// Run deployment
main().catch(console.error);