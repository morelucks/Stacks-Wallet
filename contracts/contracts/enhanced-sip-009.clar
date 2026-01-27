;; Enhanced SIP-009 NFT Contract with Advanced Features
;; Comprehensive improvements to the standard SIP-009 implementation

(impl-trait .sip-009-trait.nft-trait)

;; Enhanced NFT definition with metadata support
(define-non-fungible-token enhanced-nft uint)

;; Constants
(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-OWNER-ONLY (err u100))
(define-constant ERR-NOT-TOKEN-OWNER (err u101))
(define-constant ERR-TOKEN-EXISTS (err u102))
(define-constant ERR-TOKEN-NOT-FOUND (err u103))
(define-constant ERR-UNAUTHORIZED (err u104))
(define-constant ERR-INVALID-RECIPIENT (err u105))
(define-constant ERR-CONTRACT-PAUSED (err u106))
(define-constant ERR-INVALID-METADATA (err u107))
(define-constant ERR-ROYALTY-EXCEEDED (err u108))
(define-constant ERR-BATCH-SIZE-EXCEEDED (err u109))
(define-constant ERR-INVALID-PRICE (err u110))

;; Enhanced data variables
(define-data-var last-token-id uint u0)
(define-data-var contract-paused bool false)
(define-data-var base-uri (string-ascii 256) "https://api.enhanced-nft.com/metadata/")
(define-data-var contract-name (string-ascii 64) "Enhanced SIP-009 NFT")
(define-data-var contract-symbol (string-ascii 16) "ENFT")
(define-data-var total-supply uint u0)

;; Enhanced metadata storage
(define-map token-metadata uint {
  name: (string-ascii 64),
  description: (string-ascii 256),
  image: (string-ascii 256),
  attributes: (list 10 {trait_type: (string-ascii 32), value: (string-ascii 64)}),
  creator: principal,
  created-at: uint,
  rarity: (string-ascii 16)
})

;; Royalty system
(define-map token-royalties uint {
  creator: principal,
  percentage: uint,
  recipient: principal
})

;; Approval system for operators
(define-map operator-approvals {owner: principal, operator: principal} bool)

;; Token URI overrides
(define-map token-uris uint (string-ascii 256))

;; Collection metadata
(define-map collection-info (string-ascii 32) (string-ascii 256))

;; Enhanced read-only functions
(define-read-only (get-last-token-id)
  (ok (var-get last-token-id)))

(define-read-only (get-token-uri (token-id uint))
  (match (map-get? token-uris token-id)
    uri (ok (some uri))
    (ok (some (concat (var-get base-uri) (uint-to-ascii token-id))))))

(define-read-only (get-owner (token-id uint))
  (ok (nft-get-owner? enhanced-nft token-id)))

(define-read-only (get-contract-info)
  {
    name: (var-get contract-name),
    symbol: (var-get contract-symbol),
    total-supply: (var-get total-supply),
    owner: CONTRACT-OWNER,
    paused: (var-get contract-paused)
  })

;; Enhanced transfer function with approval support
(define-public (transfer (token-id uint) (sender principal) (recipient principal))
  (begin
    (asserts! (not (var-get contract-paused)) ERR-CONTRACT-PAUSED)
    (asserts! (is-authorized sender token-id) ERR-UNAUTHORIZED)
    (asserts! (not (is-eq sender recipient)) ERR-INVALID-RECIPIENT)
    
    (try! (nft-transfer? enhanced-nft token-id sender recipient))
    
    (print {
      notification: "nft-transfer",
      payload: {
        token-id: token-id,
        sender: sender,
        recipient: recipient,
        block-height: block-height
      }
    })
    
    (ok true)))

;; Helper function to convert uint to ascii
(define-private (uint-to-ascii (value uint))
  (if (<= value u9)
    (unwrap-panic (element-at "0123456789" value))
    "N"))

;; Authorization helper
(define-private (is-authorized (owner principal) (token-id uint))
  (or 
    (is-eq tx-sender owner)
    (is-eq contract-caller owner)
    (default-to false (map-get? operator-approvals {owner: owner, operator: tx-sender}))))

;; Enhanced mint function with metadata
(define-public (mint-with-metadata 
  (recipient principal)
  (name (string-ascii 64))
  (description (string-ascii 256))
  (image (string-ascii 256))
  (attributes (list 10 {trait_type: (string-ascii 32), value: (string-ascii 64)}))
  (rarity (string-ascii 16)))
  (let ((token-id (+ (var-get last-token-id) u1)))
    (begin
      (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
      (asserts! (not (var-get contract-paused)) ERR-CONTRACT-PAUSED)
      
      (try! (nft-mint? enhanced-nft token-id recipient))
      
      (map-set token-metadata token-id {
        name: name,
        description: description,
        image: image,
        attributes: attributes,
        creator: tx-sender,
        created-at: block-height,
        rarity: rarity
      })
      
      (var-set last-token-id token-id)
      (var-set total-supply (+ (var-get total-supply) u1))
      
      (print {
        notification: "nft-minted",
        payload: {
          token-id: token-id,
          recipient: recipient,
          name: name,
          rarity: rarity
        }
      })
      
      (ok token-id))))

;; Get token metadata
(define-read-only (get-token-metadata (token-id uint))
  (map-get? token-metadata token-id))

;; Set approval for all
(define-public (set-approval-for-all (operator principal) (approved bool))
  (begin
    (asserts! (not (is-eq tx-sender operator)) ERR-INVALID-RECIPIENT)
    (map-set operator-approvals {owner: tx-sender, operator: operator} approved)
    (ok true)))

;; Check if approved for all
(define-read-only (is-approved-for-all (owner principal) (operator principal))
  (default-to false (map-get? operator-approvals {owner: owner, operator: operator})))
;; Batch operations for gas efficiency
(define-public (batch-mint 
  (recipients (list 50 principal))
  (names (list 50 (string-ascii 64)))
  (descriptions (list 50 (string-ascii 256)))
  (images (list 50 (string-ascii 256))))
  (let ((batch-size (len recipients)))
    (begin
      (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
      (asserts! (not (var-get contract-paused)) ERR-CONTRACT-PAUSED)
      (asserts! (<= batch-size u50) ERR-BATCH-SIZE-EXCEEDED)
      (asserts! (is-eq batch-size (len names)) ERR-BATCH-SIZE-EXCEEDED)
      (asserts! (is-eq batch-size (len descriptions)) ERR-BATCH-SIZE-EXCEEDED)
      (asserts! (is-eq batch-size (len images)) ERR-BATCH-SIZE-EXCEEDED)
      
      (try! (fold batch-mint-helper 
        (zip-mint-data recipients names descriptions images) 
        (ok u0)))
      
      (print {
        notification: "batch-mint-completed",
        payload: {
          count: batch-size,
          starting-id: (+ (var-get last-token-id) u1)
        }
      })
      
      (ok batch-size))))

;; Helper for batch minting
(define-private (batch-mint-helper 
  (mint-data {recipient: principal, name: (string-ascii 64), description: (string-ascii 256), image: (string-ascii 256)})
  (acc (response uint uint)))
  (match acc
    success-count (let ((token-id (+ (var-get last-token-id) u1)))
      (begin
        (try! (nft-mint? enhanced-nft token-id (get recipient mint-data)))
        
        (map-set token-metadata token-id {
          name: (get name mint-data),
          description: (get description mint-data),
          image: (get image mint-data),
          attributes: (list),
          creator: tx-sender,
          created-at: block-height,
          rarity: "common"
        })
        
        (var-set last-token-id token-id)
        (var-set total-supply (+ (var-get total-supply) u1))
        
        (ok (+ success-count u1))))
    error error))

;; Zip helper for batch operations
(define-private (zip-mint-data 
  (recipients (list 50 principal))
  (names (list 50 (string-ascii 64)))
  (descriptions (list 50 (string-ascii 256)))
  (images (list 50 (string-ascii 256))))
  (map create-mint-data recipients names descriptions images))

(define-private (create-mint-data 
  (recipient principal)
  (name (string-ascii 64))
  (description (string-ascii 256))
  (image (string-ascii 256)))
  {recipient: recipient, name: name, description: description, image: image})

;; Batch transfer function
(define-public (batch-transfer 
  (token-ids (list 50 uint))
  (senders (list 50 principal))
  (recipients (list 50 principal)))
  (let ((batch-size (len token-ids)))
    (begin
      (asserts! (not (var-get contract-paused)) ERR-CONTRACT-PAUSED)
      (asserts! (<= batch-size u50) ERR-BATCH-SIZE-EXCEEDED)
      (asserts! (is-eq batch-size (len senders)) ERR-BATCH-SIZE-EXCEEDED)
      (asserts! (is-eq batch-size (len recipients)) ERR-BATCH-SIZE-EXCEEDED)
      
      (try! (fold batch-transfer-helper 
        (zip-transfer-data token-ids senders recipients) 
        (ok u0)))
      
      (print {
        notification: "batch-transfer-completed",
        payload: {
          count: batch-size,
          token-ids: token-ids
        }
      })
      
      (ok batch-size))))

;; Helper for batch transfers
(define-private (batch-transfer-helper 
  (transfer-data {token-id: uint, sender: principal, recipient: principal})
  (acc (response uint uint)))
  (match acc
    success-count (begin
      (asserts! (is-authorized (get sender transfer-data) (get token-id transfer-data)) ERR-UNAUTHORIZED)
      (try! (nft-transfer? enhanced-nft (get token-id transfer-data) (get sender transfer-data) (get recipient transfer-data)))
      (ok (+ success-count u1)))
    error error))

;; Zip helper for batch transfers
(define-private (zip-transfer-data 
  (token-ids (list 50 uint))
  (senders (list 50 principal))
  (recipients (list 50 principal)))
  (map create-transfer-data token-ids senders recipients))

(define-private (create-transfer-data 
  (token-id uint)
  (sender principal)
  (recipient principal))
  {token-id: token-id, sender: sender, recipient: recipient})
;; Marketplace and trading features
(define-map listings uint {
  seller: principal,
  price: uint,
  currency: (string-ascii 16),
  expires-at: uint,
  active: bool
})

(define-map offers uint {
  token-id: uint,
  buyer: principal,
  price: uint,
  currency: (string-ascii 16),
  expires-at: uint,
  active: bool
})

(define-data-var next-offer-id uint u1)
(define-data-var marketplace-fee-percentage uint u250) ;; 2.5%

;; List NFT for sale
(define-public (list-for-sale 
  (token-id uint)
  (price uint)
  (currency (string-ascii 16))
  (duration uint))
  (let ((owner (unwrap! (nft-get-owner? enhanced-nft token-id) ERR-TOKEN-NOT-FOUND)))
    (begin
      (asserts! (is-eq tx-sender owner) ERR-NOT-TOKEN-OWNER)
      (asserts! (> price u0) ERR-INVALID-PRICE)
      (asserts! (> duration u0) ERR-INVALID-PRICE)
      
      (map-set listings token-id {
        seller: tx-sender,
        price: price,
        currency: currency,
        expires-at: (+ block-height duration),
        active: true
      })
      
      (print {
        notification: "nft-listed",
        payload: {
          token-id: token-id,
          seller: tx-sender,
          price: price,
          currency: currency,
          expires-at: (+ block-height duration)
        }
      })
      
      (ok true))))

;; Cancel listing
(define-public (cancel-listing (token-id uint))
  (let ((listing (unwrap! (map-get? listings token-id) ERR-TOKEN-NOT-FOUND)))
    (begin
      (asserts! (is-eq tx-sender (get seller listing)) ERR-UNAUTHORIZED)
      
      (map-set listings token-id (merge listing {active: false}))
      
      (print {
        notification: "listing-cancelled",
        payload: {
          token-id: token-id,
          seller: tx-sender
        }
      })
      
      (ok true))))

;; Make offer on NFT
(define-public (make-offer 
  (token-id uint)
  (price uint)
  (currency (string-ascii 16))
  (duration uint))
  (let ((offer-id (var-get next-offer-id)))
    (begin
      (asserts! (is-some (nft-get-owner? enhanced-nft token-id)) ERR-TOKEN-NOT-FOUND)
      (asserts! (> price u0) ERR-INVALID-PRICE)
      (asserts! (> duration u0) ERR-INVALID-PRICE)
      
      (map-set offers offer-id {
        token-id: token-id,
        buyer: tx-sender,
        price: price,
        currency: currency,
        expires-at: (+ block-height duration),
        active: true
      })
      
      (var-set next-offer-id (+ offer-id u1))
      
      (print {
        notification: "offer-made",
        payload: {
          offer-id: offer-id,
          token-id: token-id,
          buyer: tx-sender,
          price: price,
          currency: currency
        }
      })
      
      (ok offer-id))))

;; Accept offer
(define-public (accept-offer (offer-id uint))
  (let ((offer (unwrap! (map-get? offers offer-id) ERR-TOKEN-NOT-FOUND))
        (token-id (get token-id offer))
        (owner (unwrap! (nft-get-owner? enhanced-nft token-id) ERR-TOKEN-NOT-FOUND)))
    (begin
      (asserts! (is-eq tx-sender owner) ERR-NOT-TOKEN-OWNER)
      (asserts! (get active offer) ERR-UNAUTHORIZED)
      (asserts! (< block-height (get expires-at offer)) ERR-UNAUTHORIZED)
      
      ;; Transfer NFT
      (try! (nft-transfer? enhanced-nft token-id tx-sender (get buyer offer)))
      
      ;; Calculate and distribute royalties
      (try! (distribute-royalties token-id (get price offer)))
      
      ;; Mark offer as inactive
      (map-set offers offer-id (merge offer {active: false}))
      
      (print {
        notification: "offer-accepted",
        payload: {
          offer-id: offer-id,
          token-id: token-id,
          seller: tx-sender,
          buyer: (get buyer offer),
          price: (get price offer)
        }
      })
      
      (ok true))))

;; Distribute royalties
(define-private (distribute-royalties (token-id uint) (sale-price uint))
  (match (map-get? token-royalties token-id)
    royalty-info (let ((royalty-amount (/ (* sale-price (get percentage royalty-info)) u10000)))
      (begin
        ;; In a real implementation, would transfer STX or other tokens
        (print {
          notification: "royalty-distributed",
          payload: {
            token-id: token-id,
            recipient: (get recipient royalty-info),
            amount: royalty-amount,
            percentage: (get percentage royalty-info)
          }
        })
        (ok true)))
    (ok true)))

;; Set royalty for token
(define-public (set-token-royalty 
  (token-id uint)
  (percentage uint)
  (recipient principal))
  (let ((metadata (unwrap! (map-get? token-metadata token-id) ERR-TOKEN-NOT-FOUND)))
    (begin
      (asserts! (is-eq tx-sender (get creator metadata)) ERR-UNAUTHORIZED)
      (asserts! (<= percentage u1000) ERR-ROYALTY-EXCEEDED) ;; Max 10%
      
      (map-set token-royalties token-id {
        creator: (get creator metadata),
        percentage: percentage,
        recipient: recipient
      })
      
      (print {
        notification: "royalty-set",
        payload: {
          token-id: token-id,
          percentage: percentage,
          recipient: recipient
        }
      })
      
      (ok true))))

;; Get listing info
(define-read-only (get-listing (token-id uint))
  (map-get? listings token-id))

;; Get offer info
(define-read-only (get-offer (offer-id uint))
  (map-get? offers offer-id))

;; Get token royalty info
(define-read-only (get-token-royalty (token-id uint))
  (map-get? token-royalties token-id))
;; Advanced metadata and collection features
(define-map collections uint {
  name: (string-ascii 64),
  description: (string-ascii 256),
  creator: principal,
  max-supply: uint,
  current-supply: uint,
  royalty-percentage: uint,
  base-uri: (string-ascii 256),
  created-at: uint,
  is-revealed: bool
})

(define-map token-collections uint uint) ;; token-id -> collection-id
(define-data-var next-collection-id uint u1)

;; Create new collection
(define-public (create-collection 
  (name (string-ascii 64))
  (description (string-ascii 256))
  (max-supply uint)
  (royalty-percentage uint)
  (base-uri (string-ascii 256)))
  (let ((collection-id (var-get next-collection-id)))
    (begin
      (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
      (asserts! (> max-supply u0) ERR-INVALID-METADATA)
      (asserts! (<= royalty-percentage u1000) ERR-ROYALTY-EXCEEDED)
      
      (map-set collections collection-id {
        name: name,
        description: description,
        creator: tx-sender,
        max-supply: max-supply,
        current-supply: u0,
        royalty-percentage: royalty-percentage,
        base-uri: base-uri,
        created-at: block-height,
        is-revealed: false
      })
      
      (var-set next-collection-id (+ collection-id u1))
      
      (print {
        notification: "collection-created",
        payload: {
          collection-id: collection-id,
          name: name,
          max-supply: max-supply,
          creator: tx-sender
        }
      })
      
      (ok collection-id))))

;; Mint to collection
(define-public (mint-to-collection 
  (collection-id uint)
  (recipient principal)
  (name (string-ascii 64))
  (description (string-ascii 256))
  (image (string-ascii 256))
  (attributes (list 10 {trait_type: (string-ascii 32), value: (string-ascii 64)})))
  (let ((collection (unwrap! (map-get? collections collection-id) ERR-TOKEN-NOT-FOUND))
        (token-id (+ (var-get last-token-id) u1)))
    (begin
      (asserts! (is-eq tx-sender (get creator collection)) ERR-UNAUTHORIZED)
      (asserts! (< (get current-supply collection) (get max-supply collection)) ERR-BATCH-SIZE-EXCEEDED)
      
      (try! (nft-mint? enhanced-nft token-id recipient))
      
      (map-set token-metadata token-id {
        name: name,
        description: description,
        image: image,
        attributes: attributes,
        creator: tx-sender,
        created-at: block-height,
        rarity: "common"
      })
      
      (map-set token-collections token-id collection-id)
      
      ;; Update collection supply
      (map-set collections collection-id 
        (merge collection {current-supply: (+ (get current-supply collection) u1)}))
      
      (var-set last-token-id token-id)
      (var-set total-supply (+ (var-get total-supply) u1))
      
      (print {
        notification: "nft-minted-to-collection",
        payload: {
          token-id: token-id,
          collection-id: collection-id,
          recipient: recipient,
          name: name
        }
      })
      
      (ok token-id))))

;; Reveal collection metadata
(define-public (reveal-collection (collection-id uint) (new-base-uri (string-ascii 256)))
  (let ((collection (unwrap! (map-get? collections collection-id) ERR-TOKEN-NOT-FOUND)))
    (begin
      (asserts! (is-eq tx-sender (get creator collection)) ERR-UNAUTHORIZED)
      (asserts! (not (get is-revealed collection)) ERR-UNAUTHORIZED)
      
      (map-set collections collection-id 
        (merge collection {
          base-uri: new-base-uri,
          is-revealed: true
        }))
      
      (print {
        notification: "collection-revealed",
        payload: {
          collection-id: collection-id,
          new-base-uri: new-base-uri
        }
      })
      
      (ok true))))

;; Get collection info
(define-read-only (get-collection-info (collection-id uint))
  (map-get? collections collection-id))

;; Get token collection
(define-read-only (get-token-collection (token-id uint))
  (map-get? token-collections token-id))

;; Advanced metadata functions
(define-public (update-token-metadata 
  (token-id uint)
  (name (string-ascii 64))
  (description (string-ascii 256))
  (image (string-ascii 256)))
  (let ((metadata (unwrap! (map-get? token-metadata token-id) ERR-TOKEN-NOT-FOUND)))
    (begin
      (asserts! (is-eq tx-sender (get creator metadata)) ERR-UNAUTHORIZED)
      
      (map-set token-metadata token-id 
        (merge metadata {
          name: name,
          description: description,
          image: image
        }))
      
      (print {
        notification: "metadata-updated",
        payload: {
          token-id: token-id,
          name: name,
          updated-by: tx-sender
        }
      })
      
      (ok true))))

;; Add attribute to token
(define-public (add-token-attribute 
  (token-id uint)
  (trait-type (string-ascii 32))
  (value (string-ascii 64)))
  (let ((metadata (unwrap! (map-get? token-metadata token-id) ERR-TOKEN-NOT-FOUND))
        (current-attributes (get attributes metadata)))
    (begin
      (asserts! (is-eq tx-sender (get creator metadata)) ERR-UNAUTHORIZED)
      (asserts! (< (len current-attributes) u10) ERR-BATCH-SIZE-EXCEEDED)
      
      (map-set token-metadata token-id 
        (merge metadata {
          attributes: (unwrap-panic (as-max-len? 
            (append current-attributes {trait_type: trait-type, value: value}) u10))
        }))
      
      (print {
        notification: "attribute-added",
        payload: {
          token-id: token-id,
          trait-type: trait-type,
          value: value
        }
      })
      
      (ok true))))

;; Set token rarity
(define-public (set-token-rarity (token-id uint) (rarity (string-ascii 16)))
  (let ((metadata (unwrap! (map-get? token-metadata token-id) ERR-TOKEN-NOT-FOUND)))
    (begin
      (asserts! (is-eq tx-sender (get creator metadata)) ERR-UNAUTHORIZED)
      
      (map-set token-metadata token-id (merge metadata {rarity: rarity}))
      
      (print {
        notification: "rarity-updated",
        payload: {
          token-id: token-id,
          rarity: rarity
        }
      })
      
      (ok true))))
;; Staking and utility features
(define-map staked-tokens uint {
  owner: principal,
  staked-at: uint,
  rewards-earned: uint,
  pool-id: uint
})

(define-map staking-pools uint {
  name: (string-ascii 64),
  reward-rate: uint, ;; rewards per block
  total-staked: uint,
  active: bool,
  created-by: principal,
  min-stake-duration: uint
})

(define-data-var next-pool-id uint u1)
(define-data-var staking-enabled bool true)

;; Create staking pool
(define-public (create-staking-pool 
  (name (string-ascii 64))
  (reward-rate uint)
  (min-stake-duration uint))
  (let ((pool-id (var-get next-pool-id)))
    (begin
      (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
      (asserts! (> reward-rate u0) ERR-INVALID-PRICE)
      
      (map-set staking-pools pool-id {
        name: name,
        reward-rate: reward-rate,
        total-staked: u0,
        active: true,
        created-by: tx-sender,
        min-stake-duration: min-stake-duration
      })
      
      (var-set next-pool-id (+ pool-id u1))
      
      (print {
        notification: "staking-pool-created",
        payload: {
          pool-id: pool-id,
          name: name,
          reward-rate: reward-rate
        }
      })
      
      (ok pool-id))))

;; Stake NFT
(define-public (stake-nft (token-id uint) (pool-id uint))
  (let ((owner (unwrap! (nft-get-owner? enhanced-nft token-id) ERR-TOKEN-NOT-FOUND))
        (pool (unwrap! (map-get? staking-pools pool-id) ERR-TOKEN-NOT-FOUND)))
    (begin
      (asserts! (is-eq tx-sender owner) ERR-NOT-TOKEN-OWNER)
      (asserts! (var-get staking-enabled) ERR-CONTRACT-PAUSED)
      (asserts! (get active pool) ERR-UNAUTHORIZED)
      (asserts! (is-none (map-get? staked-tokens token-id)) ERR-TOKEN-EXISTS)
      
      (map-set staked-tokens token-id {
        owner: tx-sender,
        staked-at: block-height,
        rewards-earned: u0,
        pool-id: pool-id
      })
      
      ;; Update pool total
      (map-set staking-pools pool-id 
        (merge pool {total-staked: (+ (get total-staked pool) u1)}))
      
      (print {
        notification: "nft-staked",
        payload: {
          token-id: token-id,
          owner: tx-sender,
          pool-id: pool-id,
          staked-at: block-height
        }
      })
      
      (ok true))))

;; Unstake NFT
(define-public (unstake-nft (token-id uint))
  (let ((stake-info (unwrap! (map-get? staked-tokens token-id) ERR-TOKEN-NOT-FOUND))
        (pool (unwrap! (map-get? staking-pools (get pool-id stake-info)) ERR-TOKEN-NOT-FOUND)))
    (begin
      (asserts! (is-eq tx-sender (get owner stake-info)) ERR-NOT-TOKEN-OWNER)
      (asserts! (>= (- block-height (get staked-at stake-info)) (get min-stake-duration pool)) ERR-UNAUTHORIZED)
      
      ;; Calculate rewards
      (let ((rewards (calculate-staking-rewards token-id)))
        (begin
          ;; Remove from staking
          (map-delete staked-tokens token-id)
          
          ;; Update pool total
          (map-set staking-pools (get pool-id stake-info)
            (merge pool {total-staked: (- (get total-staked pool) u1)}))
          
          (print {
            notification: "nft-unstaked",
            payload: {
              token-id: token-id,
              owner: tx-sender,
              rewards-earned: rewards,
              staked-duration: (- block-height (get staked-at stake-info))
            }
          })
          
          (ok rewards))))))

;; Calculate staking rewards
(define-private (calculate-staking-rewards (token-id uint))
  (match (map-get? staked-tokens token-id)
    stake-info (match (map-get? staking-pools (get pool-id stake-info))
      pool (let ((staked-duration (- block-height (get staked-at stake-info))))
        (* staked-duration (get reward-rate pool)))
      u0)
    u0))

;; Claim staking rewards without unstaking
(define-public (claim-staking-rewards (token-id uint))
  (let ((stake-info (unwrap! (map-get? staked-tokens token-id) ERR-TOKEN-NOT-FOUND)))
    (begin
      (asserts! (is-eq tx-sender (get owner stake-info)) ERR-NOT-TOKEN-OWNER)
      
      (let ((rewards (calculate-staking-rewards token-id)))
        (begin
          ;; Update rewards earned
          (map-set staked-tokens token-id 
            (merge stake-info {
              rewards-earned: (+ (get rewards-earned stake-info) rewards),
              staked-at: block-height ;; Reset staking time for next reward calculation
            }))
          
          (print {
            notification: "rewards-claimed",
            payload: {
              token-id: token-id,
              owner: tx-sender,
              rewards: rewards
            }
          })
          
          (ok rewards))))))

;; Get staking info
(define-read-only (get-staking-info (token-id uint))
  (map-get? staked-tokens token-id))

;; Get pool info
(define-read-only (get-pool-info (pool-id uint))
  (map-get? staking-pools pool-id))

;; Check if token is staked
(define-read-only (is-token-staked (token-id uint))
  (is-some (map-get? staked-tokens token-id)))

;; Get pending rewards
(define-read-only (get-pending-rewards (token-id uint))
  (calculate-staking-rewards token-id))

;; Utility functions for token holders
(define-public (burn-token (token-id uint))
  (let ((owner (unwrap! (nft-get-owner? enhanced-nft token-id) ERR-TOKEN-NOT-FOUND)))
    (begin
      (asserts! (is-eq tx-sender owner) ERR-NOT-TOKEN-OWNER)
      (asserts! (is-none (map-get? staked-tokens token-id)) ERR-UNAUTHORIZED) ;; Can't burn staked tokens
      
      (try! (nft-burn? enhanced-nft token-id owner))
      
      ;; Clean up metadata
      (map-delete token-metadata token-id)
      (map-delete token-royalties token-id)
      (map-delete token-uris token-id)
      
      (var-set total-supply (- (var-get total-supply) u1))
      
      (print {
        notification: "nft-burned",
        payload: {
          token-id: token-id,
          owner: owner
        }
      })
      
      (ok true))))