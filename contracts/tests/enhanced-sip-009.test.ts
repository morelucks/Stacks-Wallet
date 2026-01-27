import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const alice = accounts.get("wallet_1")!;
const bob = accounts.get("wallet_2")!;
const charlie = accounts.get("wallet_3")!;

/*
  Enhanced SIP-009 NFT Contract Test Suite
  
  Comprehensive tests for the enhanced SIP-009 implementation covering:
  - Basic SIP-009 compliance
  - Enhanced metadata system
  - Batch operations
  - Marketplace functionality
  - Staking system
  - Governance features
  - Collection management
  - Analytics integration
  - Cross-chain bridge
*/

describe("Enhanced SIP-009 NFT Contract", () => {
  beforeEach(() => {
    // Reset simnet state before each test
  });

  describe("Basic SIP-009 Compliance", () => {
    it("should implement SIP-009 trait correctly", () => {
      // Test get-last-token-id
      const lastTokenId = simnet.callReadOnlyFn(
        "enhanced-sip-009",
        "get-last-token-id",
        [],
        deployer
      );
      expect(lastTokenId.result).toBeOk(Cl.uint(0));
    });

    it("should mint NFT with metadata", () => {
      const mintResult = simnet.callPublicFn(
        "enhanced-sip-009",
        "mint-with-metadata",
        [
          Cl.principal(alice),
          Cl.stringAscii("Test NFT"),
          Cl.stringAscii("A test NFT with metadata"),
          Cl.stringAscii("https://example.com/image.png"),
          Cl.list([
            Cl.tuple({
              trait_type: Cl.stringAscii("Color"),
              value: Cl.stringAscii("Blue")
            })
          ]),
          Cl.stringAscii("rare")
        ],
        deployer
      );
      
      expect(mintResult.result).toBeOk(Cl.uint(1));
      
      // Verify ownership
      const owner = simnet.callReadOnlyFn(
        "enhanced-sip-009",
        "get-owner",
        [Cl.uint(1)],
        deployer
      );
      expect(owner.result).toBeOk(Cl.some(Cl.principal(alice)));
    });

    it("should transfer NFT correctly", () => {
      // First mint an NFT
      simnet.callPublicFn(
        "enhanced-sip-009",
        "mint-with-metadata",
        [
          Cl.principal(alice),
          Cl.stringAscii("Test NFT"),
          Cl.stringAscii("Description"),
          Cl.stringAscii("https://example.com/image.png"),
          Cl.list([]),
          Cl.stringAscii("common")
        ],
        deployer
      );

      // Transfer from alice to bob
      const transferResult = simnet.callPublicFn(
        "enhanced-sip-009",
        "transfer",
        [Cl.uint(1), Cl.principal(alice), Cl.principal(bob)],
        alice
      );
      
      expect(transferResult.result).toBeOk(Cl.bool(true));
      
      // Verify new ownership
      const owner = simnet.callReadOnlyFn(
        "enhanced-sip-009",
        "get-owner",
        [Cl.uint(1)],
        deployer
      );
      expect(owner.result).toBeOk(Cl.some(Cl.principal(bob)));
    });
  });

  describe("Enhanced Metadata System", () => {
    it("should store and retrieve token metadata", () => {
      // Mint NFT with metadata
      simnet.callPublicFn(
        "enhanced-sip-009",
        "mint-with-metadata",
        [
          Cl.principal(alice),
          Cl.stringAscii("Rare Dragon"),
          Cl.stringAscii("A legendary dragon NFT"),
          Cl.stringAscii("https://example.com/dragon.png"),
          Cl.list([
            Cl.tuple({
              trait_type: Cl.stringAscii("Element"),
              value: Cl.stringAscii("Fire")
            }),
            Cl.tuple({
              trait_type: Cl.stringAscii("Level"),
              value: Cl.stringAscii("100")
            })
          ]),
          Cl.stringAscii("legendary")
        ],
        deployer
      );

      // Get metadata
      const metadata = simnet.callReadOnlyFn(
        "enhanced-sip-009",
        "get-token-metadata",
        [Cl.uint(1)],
        deployer
      );
      
      expect(metadata.result).toBeSome(Cl.tuple({
        name: Cl.stringAscii("Rare Dragon"),
        description: Cl.stringAscii("A legendary dragon NFT"),
        image: Cl.stringAscii("https://example.com/dragon.png"),
        attributes: Cl.list([
          Cl.tuple({
            trait_type: Cl.stringAscii("Element"),
            value: Cl.stringAscii("Fire")
          }),
          Cl.tuple({
            trait_type: Cl.stringAscii("Level"),
            value: Cl.stringAscii("100")
          })
        ]),
        creator: Cl.principal(deployer),
        created_at: Cl.uint(simnet.blockHeight),
        rarity: Cl.stringAscii("legendary")
      }));
    });

    it("should update token metadata by creator", () => {
      // Mint NFT
      simnet.callPublicFn(
        "enhanced-sip-009",
        "mint-with-metadata",
        [
          Cl.principal(alice),
          Cl.stringAscii("Original Name"),
          Cl.stringAscii("Original Description"),
          Cl.stringAscii("https://example.com/original.png"),
          Cl.list([]),
          Cl.stringAscii("common")
        ],
        deployer
      );

      // Update metadata
      const updateResult = simnet.callPublicFn(
        "enhanced-sip-009",
        "update-token-metadata",
        [
          Cl.uint(1),
          Cl.stringAscii("Updated Name"),
          Cl.stringAscii("Updated Description"),
          Cl.stringAscii("https://example.com/updated.png")
        ],
        deployer
      );
      
      expect(updateResult.result).toBeOk(Cl.bool(true));
    });
  });

  describe("Batch Operations", () => {
    it("should batch mint multiple NFTs", () => {
      const batchMintResult = simnet.callPublicFn(
        "enhanced-sip-009",
        "batch-mint",
        [
          Cl.list([Cl.principal(alice), Cl.principal(bob), Cl.principal(charlie)]),
          Cl.list([Cl.stringAscii("NFT 1"), Cl.stringAscii("NFT 2"), Cl.stringAscii("NFT 3")]),
          Cl.list([Cl.stringAscii("Desc 1"), Cl.stringAscii("Desc 2"), Cl.stringAscii("Desc 3")]),
          Cl.list([Cl.stringAscii("img1.png"), Cl.stringAscii("img2.png"), Cl.stringAscii("img3.png")])
        ],
        deployer
      );
      
      expect(batchMintResult.result).toBeOk(Cl.uint(3));
      
      // Verify all tokens were minted
      const lastTokenId = simnet.callReadOnlyFn(
        "enhanced-sip-009",
        "get-last-token-id",
        [],
        deployer
      );
      expect(lastTokenId.result).toBeOk(Cl.uint(3));
    });

    it("should batch transfer multiple NFTs", () => {
      // First batch mint
      simnet.callPublicFn(
        "enhanced-sip-009",
        "batch-mint",
        [
          Cl.list([Cl.principal(alice), Cl.principal(alice)]),
          Cl.list([Cl.stringAscii("NFT 1"), Cl.stringAscii("NFT 2")]),
          Cl.list([Cl.stringAscii("Desc 1"), Cl.stringAscii("Desc 2")]),
          Cl.list([Cl.stringAscii("img1.png"), Cl.stringAscii("img2.png")])
        ],
        deployer
      );

      // Batch transfer
      const batchTransferResult = simnet.callPublicFn(
        "enhanced-sip-009",
        "batch-transfer",
        [
          Cl.list([Cl.uint(1), Cl.uint(2)]),
          Cl.list([Cl.principal(alice), Cl.principal(alice)]),
          Cl.list([Cl.principal(bob), Cl.principal(charlie)])
        ],
        alice
      );
      
      expect(batchTransferResult.result).toBeOk(Cl.uint(2));
    });
  });

  describe("Marketplace Functionality", () => {
    beforeEach(() => {
      // Mint an NFT for marketplace tests
      simnet.callPublicFn(
        "enhanced-sip-009",
        "mint-with-metadata",
        [
          Cl.principal(alice),
          Cl.stringAscii("Marketplace NFT"),
          Cl.stringAscii("NFT for marketplace testing"),
          Cl.stringAscii("https://example.com/marketplace.png"),
          Cl.list([]),
          Cl.stringAscii("common")
        ],
        deployer
      );
    });

    it("should list NFT for sale", () => {
      const listResult = simnet.callPublicFn(
        "enhanced-sip-009",
        "list-for-sale",
        [
          Cl.uint(1),
          Cl.uint(1000000), // 1 STX
          Cl.stringAscii("STX"),
          Cl.uint(1000) // 1000 blocks duration
        ],
        alice
      );
      
      expect(listResult.result).toBeOk(Cl.bool(true));
      
      // Verify listing
      const listing = simnet.callReadOnlyFn(
        "enhanced-sip-009",
        "get-listing",
        [Cl.uint(1)],
        deployer
      );
      
      expect(listing.result).toBeSome(Cl.tuple({
        seller: Cl.principal(alice),
        price: Cl.uint(1000000),
        currency: Cl.stringAscii("STX"),
        expires_at: Cl.uint(simnet.blockHeight + 1000),
        active: Cl.bool(true)
      }));
    });

    it("should make and accept offers", () => {
      // Make offer
      const offerResult = simnet.callPublicFn(
        "enhanced-sip-009",
        "make-offer",
        [
          Cl.uint(1),
          Cl.uint(800000), // 0.8 STX
          Cl.stringAscii("STX"),
          Cl.uint(500) // 500 blocks duration
        ],
        bob
      );
      
      expect(offerResult.result).toBeOk(Cl.uint(1));
      
      // Accept offer
      const acceptResult = simnet.callPublicFn(
        "enhanced-sip-009",
        "accept-offer",
        [Cl.uint(1)],
        alice
      );
      
      expect(acceptResult.result).toBeOk(Cl.bool(true));
    });

    it("should set and distribute royalties", () => {
      // Set royalty
      const royaltyResult = simnet.callPublicFn(
        "enhanced-sip-009",
        "set-token-royalty",
        [
          Cl.uint(1),
          Cl.uint(500), // 5%
          Cl.principal(deployer)
        ],
        deployer
      );
      
      expect(royaltyResult.result).toBeOk(Cl.bool(true));
      
      // Verify royalty info
      const royaltyInfo = simnet.callReadOnlyFn(
        "enhanced-sip-009",
        "get-token-royalty",
        [Cl.uint(1)],
        deployer
      );
      
      expect(royaltyInfo.result).toBeSome(Cl.tuple({
        creator: Cl.principal(deployer),
        percentage: Cl.uint(500),
        recipient: Cl.principal(deployer)
      }));
    });
  });

  describe("Collection Management", () => {
    it("should create collection", () => {
      const collectionResult = simnet.callPublicFn(
        "enhanced-sip-009",
        "create-collection",
        [
          Cl.stringAscii("Dragon Collection"),
          Cl.stringAscii("A collection of legendary dragons"),
          Cl.uint(1000), // max supply
          Cl.uint(750), // 7.5% royalty
          Cl.stringAscii("https://dragons.com/metadata/")
        ],
        deployer
      );
      
      expect(collectionResult.result).toBeOk(Cl.uint(1));
    });

    it("should mint to collection", () => {
      // Create collection first
      simnet.callPublicFn(
        "enhanced-sip-009",
        "create-collection",
        [
          Cl.stringAscii("Test Collection"),
          Cl.stringAscii("Test collection description"),
          Cl.uint(100),
          Cl.uint(500),
          Cl.stringAscii("https://test.com/")
        ],
        deployer
      );

      // Mint to collection
      const mintResult = simnet.callPublicFn(
        "enhanced-sip-009",
        "mint-to-collection",
        [
          Cl.uint(1), // collection-id
          Cl.principal(alice),
          Cl.stringAscii("Collection NFT"),
          Cl.stringAscii("NFT in collection"),
          Cl.stringAscii("https://test.com/nft.png"),
          Cl.list([])
        ],
        deployer
      );
      
      expect(mintResult.result).toBeOk(Cl.uint(1));
    });

    it("should reveal collection", () => {
      // Create collection
      simnet.callPublicFn(
        "enhanced-sip-009",
        "create-collection",
        [
          Cl.stringAscii("Mystery Collection"),
          Cl.stringAscii("Mystery collection"),
          Cl.uint(100),
          Cl.uint(500),
          Cl.stringAscii("https://mystery.com/")
        ],
        deployer
      );

      // Reveal collection
      const revealResult = simnet.callPublicFn(
        "enhanced-sip-009",
        "reveal-collection",
        [
          Cl.uint(1),
          Cl.stringAscii("https://revealed.com/metadata/")
        ],
        deployer
      );
      
      expect(revealResult.result).toBeOk(Cl.bool(true));
    });
  });

  describe("Staking System", () => {
    beforeEach(() => {
      // Mint NFT for staking tests
      simnet.callPublicFn(
        "enhanced-sip-009",
        "mint-with-metadata",
        [
          Cl.principal(alice),
          Cl.stringAscii("Stakeable NFT"),
          Cl.stringAscii("NFT for staking"),
          Cl.stringAscii("https://example.com/stake.png"),
          Cl.list([]),
          Cl.stringAscii("common")
        ],
        deployer
      );

      // Create staking pool
      simnet.callPublicFn(
        "enhanced-sip-009",
        "create-staking-pool",
        [
          Cl.stringAscii("Dragon Pool"),
          Cl.uint(10), // 10 rewards per block
          Cl.uint(100) // minimum 100 blocks stake duration
        ],
        deployer
      );
    });

    it("should stake NFT", () => {
      const stakeResult = simnet.callPublicFn(
        "enhanced-sip-009",
        "stake-nft",
        [Cl.uint(1), Cl.uint(1)], // token-id, pool-id
        alice
      );
      
      expect(stakeResult.result).toBeOk(Cl.bool(true));
      
      // Verify staking info
      const stakingInfo = simnet.callReadOnlyFn(
        "enhanced-sip-009",
        "get-staking-info",
        [Cl.uint(1)],
        deployer
      );
      
      expect(stakingInfo.result).toBeSome(Cl.tuple({
        owner: Cl.principal(alice),
        staked_at: Cl.uint(simnet.blockHeight),
        rewards_earned: Cl.uint(0),
        pool_id: Cl.uint(1)
      }));
    });

    it("should calculate and claim rewards", () => {
      // Stake NFT
      simnet.callPublicFn(
        "enhanced-sip-009",
        "stake-nft",
        [Cl.uint(1), Cl.uint(1)],
        alice
      );

      // Mine some blocks to accumulate rewards
      simnet.mineEmptyBlocks(50);

      // Check pending rewards
      const pendingRewards = simnet.callReadOnlyFn(
        "enhanced-sip-009",
        "get-pending-rewards",
        [Cl.uint(1)],
        deployer
      );
      
      expect(pendingRewards.result).toBe(Cl.uint(500)); // 50 blocks * 10 rewards

      // Claim rewards
      const claimResult = simnet.callPublicFn(
        "enhanced-sip-009",
        "claim-staking-rewards",
        [Cl.uint(1)],
        alice
      );
      
      expect(claimResult.result).toBeOk(Cl.uint(500));
    });
  });

  describe("Governance System", () => {
    beforeEach(() => {
      // Mint NFTs for governance tests
      for (let i = 0; i < 15; i++) {
        simnet.callPublicFn(
          "enhanced-sip-009",
          "mint-with-metadata",
          [
            Cl.principal(alice),
            Cl.stringAscii(`Governance NFT ${i + 1}`),
            Cl.stringAscii("NFT for governance"),
            Cl.stringAscii("https://example.com/gov.png"),
            Cl.list([]),
            Cl.stringAscii("common")
          ],
          deployer
        );
      }
    });

    it("should create governance proposal", () => {
      const proposalResult = simnet.callPublicFn(
        "enhanced-sip-009",
        "create-proposal",
        [
          Cl.stringAscii("Increase Staking Rewards"),
          Cl.stringAscii("Proposal to increase staking rewards by 50%"),
          Cl.uint(1000), // voting duration
          Cl.uint(5) // minimum tokens required
        ],
        alice
      );
      
      expect(proposalResult.result).toBeOk(Cl.uint(1));
    });

    it("should vote on proposal", () => {
      // Create proposal
      simnet.callPublicFn(
        "enhanced-sip-009",
        "create-proposal",
        [
          Cl.stringAscii("Test Proposal"),
          Cl.stringAscii("Test proposal description"),
          Cl.uint(1000),
          Cl.uint(5)
        ],
        alice
      );

      // Vote on proposal
      const voteResult = simnet.callPublicFn(
        "enhanced-sip-009",
        "vote-on-proposal",
        [
          Cl.uint(1), // proposal-id
          Cl.bool(true), // vote for
          Cl.list([Cl.uint(1), Cl.uint(2), Cl.uint(3)]) // token-ids
        ],
        alice
      );
      
      expect(voteResult.result).toBeOk(Cl.bool(true));
    });
  });

  describe("Administrative Functions", () => {
    it("should pause and unpause contract", () => {
      // Pause contract
      const pauseResult = simnet.callPublicFn(
        "enhanced-sip-009",
        "set-contract-paused",
        [Cl.bool(true)],
        deployer
      );
      
      expect(pauseResult.result).toBeOk(Cl.bool(true));
      
      // Verify contract is paused
      const contractInfo = simnet.callReadOnlyFn(
        "enhanced-sip-009",
        "get-contract-info",
        [],
        deployer
      );
      
      expect(contractInfo.result.paused).toBe(Cl.bool(true));
    });

    it("should get contract statistics", () => {
      // Mint some NFTs first
      simnet.callPublicFn(
        "enhanced-sip-009",
        "batch-mint",
        [
          Cl.list([Cl.principal(alice), Cl.principal(bob)]),
          Cl.list([Cl.stringAscii("NFT 1"), Cl.stringAscii("NFT 2")]),
          Cl.list([Cl.stringAscii("Desc 1"), Cl.stringAscii("Desc 2")]),
          Cl.list([Cl.stringAscii("img1.png"), Cl.stringAscii("img2.png")])
        ],
        deployer
      );

      const stats = simnet.callReadOnlyFn(
        "enhanced-sip-009",
        "get-contract-stats",
        [],
        deployer
      );
      
      expect(stats.result.total_supply).toBe(Cl.uint(2));
      expect(stats.result.last_token_id).toBe(Cl.uint(2));
    });
  });

  describe("Error Handling", () => {
    it("should reject unauthorized minting", () => {
      const mintResult = simnet.callPublicFn(
        "enhanced-sip-009",
        "mint-with-metadata",
        [
          Cl.principal(alice),
          Cl.stringAscii("Unauthorized NFT"),
          Cl.stringAscii("Should fail"),
          Cl.stringAscii("https://example.com/fail.png"),
          Cl.list([]),
          Cl.stringAscii("common")
        ],
        alice // Not the contract owner
      );
      
      expect(mintResult.result).toBeErr(Cl.uint(100)); // ERR-OWNER-ONLY
    });

    it("should reject transfer of non-owned token", () => {
      // Mint NFT to alice
      simnet.callPublicFn(
        "enhanced-sip-009",
        "mint-with-metadata",
        [
          Cl.principal(alice),
          Cl.stringAscii("Test NFT"),
          Cl.stringAscii("Description"),
          Cl.stringAscii("https://example.com/image.png"),
          Cl.list([]),
          Cl.stringAscii("common")
        ],
        deployer
      );

      // Try to transfer from bob (who doesn't own it)
      const transferResult = simnet.callPublicFn(
        "enhanced-sip-009",
        "transfer",
        [Cl.uint(1), Cl.principal(alice), Cl.principal(charlie)],
        bob
      );
      
      expect(transferResult.result).toBeErr(Cl.uint(104)); // ERR-UNAUTHORIZED
    });
  });
});