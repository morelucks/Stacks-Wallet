/**
 * Enhanced SIP-009 Integration Examples
 * 
 * Comprehensive examples showing how to integrate with the enhanced SIP-009 ecosystem
 */

import { 
  makeContractCall,
  broadcastTransaction,
  callReadOnlyFunction,
  cvToJSON,
  standardPrincipalCV,
  uintCV,
  stringAsciiCV,
  bufferCV,
  listCV,
  tupleCV,
  boolCV,
  noneCV,
  someCV
} from '@stacks/transactions';
import { StacksTestnet } from '@stacks/network';

const network = new StacksTestnet();
const contractAddress = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';

/**
 * Enhanced SIP-009 Client Class
 */
export class EnhancedSIP009Client {
  private contractAddress: string;
  private network: any;

  constructor(contractAddress: string, network: any) {
    this.contractAddress = contractAddress;
    this.network = network;
  }

  // Basic SIP-009 Operations
  async getLastTokenId(): Promise<any> {
    return await callReadOnlyFunction({
      contractAddress: this.contractAddress,
      contractName: 'enhanced-sip-009',
      functionName: 'get-last-token-id',
      functionArgs: [],
      network: this.network,
      senderAddress: this.contractAddress
    });
  }

  async getTokenOwner(tokenId: number): Promise<any> {
    return await callReadOnlyFunction({
      contractAddress: this.contractAddress,
      contractName: 'enhanced-sip-009',
      functionName: 'get-owner',
      functionArgs: [uintCV(tokenId)],
      network: this.network,
      senderAddress: this.contractAddress
    });
  }

  async getTokenURI(tokenId: number): Promise<any> {
    return await callReadOnlyFunction({
      contractAddress: this.contractAddress,
      contractName: 'enhanced-sip-009',
      functionName: 'get-token-uri',
      functionArgs: [uintCV(tokenId)],
      network: this.network,
      senderAddress: this.contractAddress
    });
  }

  // Enhanced Metadata Operations
  async getTokenMetadata(tokenId: number): Promise<any> {
    return await callReadOnlyFunction({
      contractAddress: this.contractAddress,
      contractName: 'enhanced-sip-009',
      functionName: 'get-token-metadata',
      functionArgs: [uintCV(tokenId)],
      network: this.network,
      senderAddress: this.contractAddress
    });
  }

  async mintWithMetadata(
    recipient: string,
    name: string,
    description: string,
    image: string,
    attributes: Array<{trait_type: string, value: string}>,
    rarity: string,
    senderKey: string
  ): Promise<any> {
    const attributeList = attributes.map(attr => 
      tupleCV({
        trait_type: stringAsciiCV(attr.trait_type),
        value: stringAsciiCV(attr.value)
      })
    );

    const transaction = await makeContractCall({
      contractAddress: this.contractAddress,
      contractName: 'enhanced-sip-009',
      functionName: 'mint-with-metadata',
      functionArgs: [
        standardPrincipalCV(recipient),
        stringAsciiCV(name),
        stringAsciiCV(description),
        stringAsciiCV(image),
        listCV(attributeList),
        stringAsciiCV(rarity)
      ],
      senderKey,
      network: this.network,
      fee: 50000
    });

    return await broadcastTransaction(transaction, this.network);
  }

  // Batch Operations
  async batchMint(
    recipients: string[],
    names: string[],
    descriptions: string[],
    images: string[],
    senderKey: string
  ): Promise<any> {
    const transaction = await makeContractCall({
      contractAddress: this.contractAddress,
      contractName: 'enhanced-sip-009',
      functionName: 'batch-mint',
      functionArgs: [
        listCV(recipients.map(r => standardPrincipalCV(r))),
        listCV(names.map(n => stringAsciiCV(n))),
        listCV(descriptions.map(d => stringAsciiCV(d))),
        listCV(images.map(i => stringAsciiCV(i)))
      ],
      senderKey,
      network: this.network,
      fee: 100000
    });

    return await broadcastTransaction(transaction, this.network);
  }

  // Marketplace Operations
  async listForSale(
    tokenId: number,
    price: number,
    currency: string,
    duration: number,
    senderKey: string
  ): Promise<any> {
    const transaction = await makeContractCall({
      contractAddress: this.contractAddress,
      contractName: 'enhanced-sip-009',
      functionName: 'list-for-sale',
      functionArgs: [
        uintCV(tokenId),
        uintCV(price),
        stringAsciiCV(currency),
        uintCV(duration)
      ],
      senderKey,
      network: this.network,
      fee: 15000
    });

    return await broadcastTransaction(transaction, this.network);
  }

  async makeOffer(
    tokenId: number,
    price: number,
    currency: string,
    duration: number,
    senderKey: string
  ): Promise<any> {
    const transaction = await makeContractCall({
      contractAddress: this.contractAddress,
      contractName: 'enhanced-sip-009',
      functionName: 'make-offer',
      functionArgs: [
        uintCV(tokenId),
        uintCV(price),
        stringAsciiCV(currency),
        uintCV(duration)
      ],
      senderKey,
      network: this.network,
      fee: 12000
    });

    return await broadcastTransaction(transaction, this.network);
  }

  async getListing(tokenId: number): Promise<any> {
    return await callReadOnlyFunction({
      contractAddress: this.contractAddress,
      contractName: 'enhanced-sip-009',
      functionName: 'get-listing',
      functionArgs: [uintCV(tokenId)],
      network: this.network,
      senderAddress: this.contractAddress
    });
  }

  // Collection Operations
  async createCollection(
    name: string,
    description: string,
    maxSupply: number,
    royaltyPercentage: number,
    baseUri: string,
    senderKey: string
  ): Promise<any> {
    const transaction = await makeContractCall({
      contractAddress: this.contractAddress,
      contractName: 'enhanced-sip-009',
      functionName: 'create-collection',
      functionArgs: [
        stringAsciiCV(name),
        stringAsciiCV(description),
        uintCV(maxSupply),
        uintCV(royaltyPercentage),
        stringAsciiCV(baseUri)
      ],
      senderKey,
      network: this.network,
      fee: 25000
    });

    return await broadcastTransaction(transaction, this.network);
  }

  async getCollectionInfo(collectionId: number): Promise<any> {
    return await callReadOnlyFunction({
      contractAddress: this.contractAddress,
      contractName: 'enhanced-sip-009',
      functionName: 'get-collection-info',
      functionArgs: [uintCV(collectionId)],
      network: this.network,
      senderAddress: this.contractAddress
    });
  }

  // Staking Operations
  async createStakingPool(
    name: string,
    rewardRate: number,
    minStakeDuration: number,
    senderKey: string
  ): Promise<any> {
    const transaction = await makeContractCall({
      contractAddress: this.contractAddress,
      contractName: 'enhanced-sip-009',
      functionName: 'create-staking-pool',
      functionArgs: [
        stringAsciiCV(name),
        uintCV(rewardRate),
        uintCV(minStakeDuration)
      ],
      senderKey,
      network: this.network,
      fee: 20000
    });

    return await broadcastTransaction(transaction, this.network);
  }

  async stakeNFT(tokenId: number, poolId: number, senderKey: string): Promise<any> {
    const transaction = await makeContractCall({
      contractAddress: this.contractAddress,
      contractName: 'enhanced-sip-009',
      functionName: 'stake-nft',
      functionArgs: [uintCV(tokenId), uintCV(poolId)],
      senderKey,
      network: this.network,
      fee: 15000
    });

    return await broadcastTransaction(transaction, this.network);
  }

  async getStakingInfo(tokenId: number): Promise<any> {
    return await callReadOnlyFunction({
      contractAddress: this.contractAddress,
      contractName: 'enhanced-sip-009',
      functionName: 'get-staking-info',
      functionArgs: [uintCV(tokenId)],
      network: this.network,
      senderAddress: this.contractAddress
    });
  }

  async getPendingRewards(tokenId: number): Promise<any> {
    return await callReadOnlyFunction({
      contractAddress: this.contractAddress,
      contractName: 'enhanced-sip-009',
      functionName: 'get-pending-rewards',
      functionArgs: [uintCV(tokenId)],
      network: this.network,
      senderAddress: this.contractAddress
    });
  }

  // Governance Operations
  async createProposal(
    title: string,
    description: string,
    votingDuration: number,
    minTokensRequired: number,
    senderKey: string
  ): Promise<any> {
    const transaction = await makeContractCall({
      contractAddress: this.contractAddress,
      contractName: 'enhanced-sip-009',
      functionName: 'create-proposal',
      functionArgs: [
        stringAsciiCV(title),
        stringAsciiCV(description),
        uintCV(votingDuration),
        uintCV(minTokensRequired)
      ],
      senderKey,
      network: this.network,
      fee: 30000
    });

    return await broadcastTransaction(transaction, this.network);
  }

  async voteOnProposal(
    proposalId: number,
    vote: boolean,
    tokenIds: number[],
    senderKey: string
  ): Promise<any> {
    const transaction = await makeContractCall({
      contractAddress: this.contractAddress,
      contractName: 'enhanced-sip-009',
      functionName: 'vote-on-proposal',
      functionArgs: [
        uintCV(proposalId),
        boolCV(vote),
        listCV(tokenIds.map(id => uintCV(id)))
      ],
      senderKey,
      network: this.network,
      fee: 25000
    });

    return await broadcastTransaction(transaction, this.network);
  }

  // Analytics Operations
  async getUserAnalytics(user: string): Promise<any> {
    return await callReadOnlyFunction({
      contractAddress: this.contractAddress,
      contractName: 'sip-009-analytics',
      functionName: 'get-user-analytics',
      functionArgs: [standardPrincipalCV(user)],
      network: this.network,
      senderAddress: this.contractAddress
    });
  }

  async getTokenAnalytics(tokenId: number): Promise<any> {
    return await callReadOnlyFunction({
      contractAddress: this.contractAddress,
      contractName: 'sip-009-analytics',
      functionName: 'get-token-analytics',
      functionArgs: [uintCV(tokenId)],
      network: this.network,
      senderAddress: this.contractAddress
    });
  }

  async getMarketOverview(): Promise<any> {
    return await callReadOnlyFunction({
      contractAddress: this.contractAddress,
      contractName: 'sip-009-analytics',
      functionName: 'get-market-overview',
      functionArgs: [],
      network: this.network,
      senderAddress: this.contractAddress
    });
  }

  // Bridge Operations
  async initiateBridgeRequest(
    tokenId: number,
    targetChain: string,
    targetAddress: string,
    senderKey: string
  ): Promise<any> {
    const transaction = await makeContractCall({
      contractAddress: this.contractAddress,
      contractName: 'sip-009-bridge',
      functionName: 'initiate-bridge-request',
      functionArgs: [
        uintCV(tokenId),
        stringAsciiCV(targetChain),
        stringAsciiCV(targetAddress)
      ],
      senderKey,
      network: this.network,
      fee: 40000
    });

    return await broadcastTransaction(transaction, this.network);
  }

  async getBridgeRequest(requestId: number): Promise<any> {
    return await callReadOnlyFunction({
      contractAddress: this.contractAddress,
      contractName: 'sip-009-bridge',
      functionName: 'get-bridge-request',
      functionArgs: [uintCV(requestId)],
      network: this.network,
      senderAddress: this.contractAddress
    });
  }

  // Utility Functions
  async getContractStats(): Promise<any> {
    return await callReadOnlyFunction({
      contractAddress: this.contractAddress,
      contractName: 'enhanced-sip-009',
      functionName: 'get-contract-stats',
      functionArgs: [],
      network: this.network,
      senderAddress: this.contractAddress
    });
  }

  async getContractInfo(): Promise<any> {
    return await callReadOnlyFunction({
      contractAddress: this.contractAddress,
      contractName: 'enhanced-sip-009',
      functionName: 'get-contract-info',
      functionArgs: [],
      network: this.network,
      senderAddress: this.contractAddress
    });
  }
}

/**
 * Usage Examples
 */
export async function demonstrateUsage() {
  const client = new EnhancedSIP009Client(contractAddress, network);

  try {
    console.log('=== Enhanced SIP-009 Integration Examples ===\n');

    // 1. Basic NFT Operations
    console.log('1. Getting contract information...');
    const contractInfo = await client.getContractInfo();
    console.log('Contract Info:', cvToJSON(contractInfo));

    // 2. Metadata Operations
    console.log('\n2. Getting token metadata...');
    const metadata = await client.getTokenMetadata(1);
    console.log('Token Metadata:', cvToJSON(metadata));

    // 3. Marketplace Operations
    console.log('\n3. Getting marketplace listing...');
    const listing = await client.getListing(1);
    console.log('Listing Info:', cvToJSON(listing));

    // 4. Collection Operations
    console.log('\n4. Getting collection information...');
    const collectionInfo = await client.getCollectionInfo(1);
    console.log('Collection Info:', cvToJSON(collectionInfo));

    // 5. Staking Operations
    console.log('\n5. Getting staking information...');
    const stakingInfo = await client.getStakingInfo(1);
    console.log('Staking Info:', cvToJSON(stakingInfo));

    // 6. Analytics
    console.log('\n6. Getting market overview...');
    const marketOverview = await client.getMarketOverview();
    console.log('Market Overview:', cvToJSON(marketOverview));

    // 7. Bridge Operations
    console.log('\n7. Getting bridge request...');
    const bridgeRequest = await client.getBridgeRequest(1);
    console.log('Bridge Request:', cvToJSON(bridgeRequest));

    // 8. Contract Statistics
    console.log('\n8. Getting contract statistics...');
    const stats = await client.getContractStats();
    console.log('Contract Stats:', cvToJSON(stats));

  } catch (error) {
    console.error('Integration Example Error:', error);
  }
}

/**
 * Advanced Integration Patterns
 */
export class NFTMarketplaceIntegration {
  private client: EnhancedSIP009Client;

  constructor(client: EnhancedSIP009Client) {
    this.client = client;
  }

  // Create and list NFT in one flow
  async createAndListNFT(
    recipient: string,
    metadata: {
      name: string;
      description: string;
      image: string;
      attributes: Array<{trait_type: string, value: string}>;
      rarity: string;
    },
    listingInfo: {
      price: number;
      currency: string;
      duration: number;
    },
    senderKey: string
  ): Promise<{mintTxId: string, listTxId: string}> {
    
    // Mint NFT
    const mintResult = await this.client.mintWithMetadata(
      recipient,
      metadata.name,
      metadata.description,
      metadata.image,
      metadata.attributes,
      metadata.rarity,
      senderKey
    );

    // Wait for mint confirmation (simplified)
    await new Promise(resolve => setTimeout(resolve, 30000));

    // Get the token ID (would need to parse from mint result)
    const lastTokenId = await this.client.getLastTokenId();
    const tokenId = cvToJSON(lastTokenId).value;

    // List for sale
    const listResult = await this.client.listForSale(
      tokenId,
      listingInfo.price,
      listingInfo.currency,
      listingInfo.duration,
      senderKey
    );

    return {
      mintTxId: mintResult.txid,
      listTxId: listResult.txid
    };
  }

  // Bulk collection operations
  async createCollectionAndMintBatch(
    collectionInfo: {
      name: string;
      description: string;
      maxSupply: number;
      royaltyPercentage: number;
      baseUri: string;
    },
    nfts: Array<{
      recipient: string;
      name: string;
      description: string;
      image: string;
    }>,
    senderKey: string
  ): Promise<{collectionTxId: string, mintTxId: string}> {
    
    // Create collection
    const collectionResult = await this.client.createCollection(
      collectionInfo.name,
      collectionInfo.description,
      collectionInfo.maxSupply,
      collectionInfo.royaltyPercentage,
      collectionInfo.baseUri,
      senderKey
    );

    // Wait for collection creation
    await new Promise(resolve => setTimeout(resolve, 30000));

    // Batch mint NFTs
    const mintResult = await this.client.batchMint(
      nfts.map(nft => nft.recipient),
      nfts.map(nft => nft.name),
      nfts.map(nft => nft.description),
      nfts.map(nft => nft.image),
      senderKey
    );

    return {
      collectionTxId: collectionResult.txid,
      mintTxId: mintResult.txid
    };
  }
}

/**
 * Event Monitoring Utilities
 */
export class NFTEventMonitor {
  private network: any;
  private contractAddress: string;

  constructor(contractAddress: string, network: any) {
    this.contractAddress = contractAddress;
    this.network = network;
  }

  async monitorTransfers(callback: (event: any) => void): Promise<void> {
    // Implementation would use WebSocket or polling to monitor events
    console.log('Monitoring NFT transfers...');
    
    // Simplified example - would implement real event monitoring
    setInterval(async () => {
      try {
        // Check for recent transactions
        const response = await fetch(
          `${this.network.coreApiUrl}/extended/v1/address/${this.contractAddress}/transactions`
        );
        const data = await response.json();
        
        // Process transfer events
        data.results?.forEach((tx: any) => {
          if (tx.tx_type === 'contract_call' && 
              tx.contract_call?.function_name === 'transfer') {
            callback({
              type: 'transfer',
              txId: tx.tx_id,
              sender: tx.sender_address,
              // Parse additional data from tx
            });
          }
        });
      } catch (error) {
        console.error('Event monitoring error:', error);
      }
    }, 10000); // Check every 10 seconds
  }

  async getRecentActivity(limit: number = 10): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.network.coreApiUrl}/extended/v1/address/${this.contractAddress}/transactions?limit=${limit}`
      );
      const data = await response.json();
      
      return data.results?.map((tx: any) => ({
        txId: tx.tx_id,
        type: tx.tx_type,
        status: tx.tx_status,
        blockHeight: tx.block_height,
        functionName: tx.contract_call?.function_name,
        sender: tx.sender_address
      })) || [];
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }
  }
}

export default EnhancedSIP009Client;