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

;; Enhanced metadata storage with packed data structures
(define-map token-metadata uint {
  name: (string-ascii 64),
  description: (string-ascii 256),
  image: (string-ascii 256),
  attributes: (list 10 {trait_type: (string-ascii 32), value: (string-ascii 64)}),
  creator: principal,
  created-at: uint,
  rarity: (string-ascii 16)
})

;; Packed metadata for gas optimization
(define-map packed-metadata uint {
  packed-data: (buff 512),
  version: uint,
  checksum: (buff 32)
})

;; Metadata compression cache
(define-map metadata-cache (buff 32) {
  cached-data: (buff 256),
  access-count: uint,
  last-accessed: uint,
  expiry-block: uint
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

;; Gas optimization functions
(define-private (pack-metadata (metadata {name: (string-ascii 64), description: (string-ascii 256), image: (string-ascii 256), attributes: (list 10 {trait_type: (string-ascii 32), value: (string-ascii 64)}), creator: principal, created-at: uint, rarity: (string-ascii 16)}))
  (let ((packed-buffer (concat 
    (unwrap-panic (to-consensus-buff? (get name metadata)))
    (unwrap-panic (to-consensus-buff? (get description metadata)))
    (unwrap-panic (to-consensus-buff? (get image metadata)))
    (unwrap-panic (to-consensus-buff? (get creator metadata)))
    (unwrap-panic (to-consensus-buff? (get created-at metadata)))
    (unwrap-panic (to-consensus-buff? (get rarity metadata))))))
    (as-max-len? packed-buffer u512)))

(define-private (calculate-checksum (data (buff 512)))
  (sha256 data))

(define-private (compress-metadata (token-id uint) (metadata {name: (string-ascii 64), description: (string-ascii 256), image: (string-ascii 256), attributes: (list 10 {trait_type: (string-ascii 32), value: (string-ascii 64)}), creator: principal, created-at: uint, rarity: (string-ascii 16)}))
  (let ((packed-data (unwrap-panic (pack-metadata metadata)))
        (checksum (calculate-checksum packed-data)))
    (map-set packed-metadata token-id {
      packed-data: packed-data,
      version: u1,
      checksum: checksum
    })
    (ok true)))

;; Advanced caching system for frequently accessed data
(define-data-var cache-enabled bool true)
(define-data-var cache-hit-count uint u0)
(define-data-var cache-miss-count uint u0)

;; Enhanced cache management with LRU eviction
(define-map cache-lru-order uint (buff 32))
(define-data-var cache-lru-counter uint u0)

;; Cached frequently accessed functions
(define-read-only (get-cached-token-metadata (token-id uint))
  (let ((cache-key (get-cache-key "metadata" (unwrap-panic (to-consensus-buff? token-id)))))
    (match (get-cached-data cache-key)
      cached-result (begin
        (var-set cache-hit-count (+ (var-get cache-hit-count) u1))
        (some (unwrap-panic (from-consensus-buff? {name: (string-ascii 64), description: (string-ascii 256), image: (string-ascii 256), attributes: (list 10 {trait_type: (string-ascii 32), value: (string-ascii 64)}), creator: principal, created-at: uint, rarity: (string-ascii 16)} cached-result))))
      (let ((metadata (map-get? token-metadata token-id)))
        (begin
          (var-set cache-miss-count (+ (var-get cache-miss-count) u1))
          (match metadata
            meta-data (begin
              (try! (cache-data cache-key (unwrap-panic (to-consensus-buff? meta-data))))
              (some meta-data))
            none))))))

(define-read-only (get-cached-owner (token-id uint))
  (let ((cache-key (get-cache-key "owner" (unwrap-panic (to-consensus-buff? token-id)))))
    (match (get-cached-data cache-key)
      cached-result (begin
        (var-set cache-hit-count (+ (var-get cache-hit-count) u1))
        (ok (unwrap-panic (from-consensus-buff? (optional principal) cached-result))))
      (let ((owner (nft-get-owner? enhanced-nft token-id)))
        (begin
          (var-set cache-miss-count (+ (var-get cache-miss-count) u1))
          (try! (cache-data cache-key (unwrap-panic (to-consensus-buff? owner))))
          (ok owner))))))

;; Cache statistics and management
(define-read-only (get-cache-stats)
  {
    enabled: (var-get cache-enabled),
    hit-count: (var-get cache-hit-count),
    miss-count: (var-get cache-miss-count),
    hit-rate: (if (> (+ (var-get cache-hit-count) (var-get cache-miss-count)) u0)
      (/ (* (var-get cache-hit-count) u10000) (+ (var-get cache-hit-count) (var-get cache-miss-count)))
      u0),
    total-cached-items: (var-get cache-lru-counter)
  })

;; Cache eviction based on LRU
(define-private (evict-lru-cache)
  (let ((oldest-key (map-get? cache-lru-order u1)))
    (match oldest-key
      key (begin
        (map-delete metadata-cache key)
        (map-delete cache-lru-order u1)
        ;; Shift all LRU entries down
        (try! (shift-lru-entries))
        (ok true))
      (ok false))))

(define-private (shift-lru-entries)
  (let ((counter (var-get cache-lru-counter)))
    (try! (fold shift-lru-helper (list u2 u3 u4 u5 u6 u7 u8 u9 u10) (ok u1)))
    (var-set cache-lru-counter (if (> counter u1) (- counter u1) u0))
    (ok true)))

(define-private (shift-lru-helper (index uint) (acc (response uint uint)))
  (match acc
    success-index (match (map-get? cache-lru-order index)
      key (begin
        (map-set cache-lru-order (- index u1) key)
        (map-delete cache-lru-order index)
        (ok (+ success-index u1)))
      (ok success-index))
    error error))

;; Update LRU order when cache is accessed
(define-private (update-lru-order (cache-key (buff 32)))
  (let ((counter (var-get cache-lru-counter)))
    (if (< counter u10)
      (begin
        (map-set cache-lru-order (+ counter u1) cache-key)
        (var-set cache-lru-counter (+ counter u1)))
      (begin
        (try! (evict-lru-cache))
        (map-set cache-lru-order u10 cache-key)))
    (ok true)))

;; Enhanced cache-data function with LRU management
(define-private (cache-data-with-lru (cache-key (buff 32)) (data (buff 256)))
  (begin
    (map-set metadata-cache cache-key {
      cached-data: data,
      access-count: u1,
      last-accessed: block-height,
      expiry-block: (+ block-height u1000)
    })
    (try! (update-lru-order cache-key))
    (ok true)))

;; Cache invalidation functions
(define-public (invalidate-cache (cache-key (buff 32)))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
    (map-delete metadata-cache cache-key)
    (ok true)))

(define-public (clear-all-cache)
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
    (var-set cache-hit-count u0)
    (var-set cache-miss-count u0)
    (var-set cache-lru-counter u0)
    ;; Note: In a real implementation, we'd iterate through all cache entries
    (print {
      notification: "cache-cleared",
      payload: {
        admin: tx-sender,
        block-height: block-height
      }
    })
    (ok true)))

(define-public (set-cache-enabled (enabled bool))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
    (var-set cache-enabled enabled)
    (print {
      notification: "cache-status-changed",
      payload: {
        enabled: enabled,
        admin: tx-sender
      }
    })
    (ok true)))

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
;; Optimized batch operations for gas efficiency
(define-public (optimized-batch-mint 
  (recipients (list 100 principal))
  (names (list 100 (string-ascii 64)))
  (descriptions (list 100 (string-ascii 256)))
  (images (list 100 (string-ascii 256))))
  (let ((batch-size (len recipients)))
    (begin
      (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
      (asserts! (not (var-get contract-paused)) ERR-CONTRACT-PAUSED)
      (asserts! (<= batch-size u100) ERR-BATCH-SIZE-EXCEEDED)
      (asserts! (is-eq batch-size (len names)) ERR-BATCH-SIZE-EXCEEDED)
      (asserts! (is-eq batch-size (len descriptions)) ERR-BATCH-SIZE-EXCEEDED)
      (asserts! (is-eq batch-size (len images)) ERR-BATCH-SIZE-EXCEEDED)
      
      ;; Use optimized batch processing
      (try! (fold optimized-mint-helper 
        (zip-optimized-mint-data recipients names descriptions images) 
        (ok u0)))
      
      (print {
        notification: "optimized-batch-mint-completed",
        payload: {
          count: batch-size,
          starting-id: (+ (var-get last-token-id) u1),
          gas-optimized: true
        }
      })
      
      (ok batch-size))))

;; Optimized helper for batch minting with reduced gas consumption
(define-private (optimized-mint-helper 
  (mint-data {recipient: principal, name: (string-ascii 64), description: (string-ascii 256), image: (string-ascii 256)})
  (acc (response uint uint)))
  (match acc
    success-count (let ((token-id (+ (var-get last-token-id) u1)))
      (begin
        (try! (nft-mint? enhanced-nft token-id (get recipient mint-data)))
        
        ;; Use compressed metadata storage
        (let ((metadata {
          name: (get name mint-data),
          description: (get description mint-data),
          image: (get image mint-data),
          attributes: (list),
          creator: tx-sender,
          created-at: block-height,
          rarity: "common"
        }))
          (try! (compress-metadata token-id metadata)))
        
        (var-set last-token-id token-id)
        (var-set total-supply (+ (var-get total-supply) u1))
        
        (ok (+ success-count u1))))
    error error))

;; Optimized zip helper for batch operations
(define-private (zip-optimized-mint-data 
  (recipients (list 100 principal))
  (names (list 100 (string-ascii 64)))
  (descriptions (list 100 (string-ascii 256)))
  (images (list 100 (string-ascii 256))))
  (map create-optimized-mint-data recipients names descriptions images))

(define-private (create-optimized-mint-data 
  (recipient principal)
  (name (string-ascii 64))
  (description (string-ascii 256))
  (image (string-ascii 256)))
  {recipient: recipient, name: name, description: description, image: image})

;; Optimized batch transfer with gas reduction
(define-public (optimized-batch-transfer 
  (token-ids (list 100 uint))
  (senders (list 100 principal))
  (recipients (list 100 principal)))
  (let ((batch-size (len token-ids)))
    (begin
      (asserts! (not (var-get contract-paused)) ERR-CONTRACT-PAUSED)
      (asserts! (<= batch-size u100) ERR-BATCH-SIZE-EXCEEDED)
      (asserts! (is-eq batch-size (len senders)) ERR-BATCH-SIZE-EXCEEDED)
      (asserts! (is-eq batch-size (len recipients)) ERR-BATCH-SIZE-EXCEEDED)
      
      ;; Pre-validate all transfers to fail fast
      (try! (fold validate-transfer-helper 
        (zip-transfer-data token-ids senders recipients) 
        (ok u0)))
      
      ;; Execute optimized transfers
      (try! (fold optimized-transfer-helper 
        (zip-transfer-data token-ids senders recipients) 
        (ok u0)))
      
      (print {
        notification: "optimized-batch-transfer-completed",
        payload: {
          count: batch-size,
          token-ids: token-ids,
          gas-optimized: true
        }
      })
      
      (ok batch-size))))

;; Validation helper for batch transfers
(define-private (validate-transfer-helper 
  (transfer-data {token-id: uint, sender: principal, recipient: principal})
  (acc (response uint uint)))
  (match acc
    success-count (begin
      (asserts! (is-authorized (get sender transfer-data) (get token-id transfer-data)) ERR-UNAUTHORIZED)
      (asserts! (is-some (nft-get-owner? enhanced-nft (get token-id transfer-data))) ERR-TOKEN-NOT-FOUND)
      (ok (+ success-count u1)))
    error error))

;; Optimized transfer helper
(define-private (optimized-transfer-helper 
  (transfer-data {token-id: uint, sender: principal, recipient: principal})
  (acc (response uint uint)))
  (match acc
    success-count (begin
      (try! (nft-transfer? enhanced-nft (get token-id transfer-data) (get sender transfer-data) (get recipient transfer-data)))
      (ok (+ success-count u1)))
    error error))

;; Batch metadata update with optimization
(define-public (optimized-batch-metadata-update
  (token-ids (list 50 uint))
  (names (list 50 (string-ascii 64)))
  (descriptions (list 50 (string-ascii 256)))
  (images (list 50 (string-ascii 256))))
  (let ((batch-size (len token-ids)))
    (begin
      (asserts! (not (var-get contract-paused)) ERR-CONTRACT-PAUSED)
      (asserts! (<= batch-size u50) ERR-BATCH-SIZE-EXCEEDED)
      (asserts! (is-eq batch-size (len names)) ERR-BATCH-SIZE-EXCEEDED)
      (asserts! (is-eq batch-size (len descriptions)) ERR-BATCH-SIZE-EXCEEDED)
      (asserts! (is-eq batch-size (len images)) ERR-BATCH-SIZE-EXCEEDED)
      
      (try! (fold optimized-metadata-update-helper 
        (zip-metadata-update-data token-ids names descriptions images) 
        (ok u0)))
      
      (print {
        notification: "optimized-batch-metadata-update-completed",
        payload: {
          count: batch-size,
          token-ids: token-ids
        }
      })
      
      (ok batch-size))))

;; Helper for optimized metadata updates
(define-private (optimized-metadata-update-helper 
  (update-data {token-id: uint, name: (string-ascii 64), description: (string-ascii 256), image: (string-ascii 256)})
  (acc (response uint uint)))
  (match acc
    success-count (let ((metadata (unwrap! (map-get? token-metadata (get token-id update-data)) ERR-TOKEN-NOT-FOUND)))
      (begin
        (asserts! (is-eq tx-sender (get creator metadata)) ERR-UNAUTHORIZED)
        
        ;; Update with compressed storage
        (let ((updated-metadata (merge metadata {
          name: (get name update-data),
          description: (get description update-data),
          image: (get image update-data)
        })))
          (try! (compress-metadata (get token-id update-data) updated-metadata)))
        
        (ok (+ success-count u1))))
    error error))

;; Zip helper for metadata updates
(define-private (zip-metadata-update-data 
  (token-ids (list 50 uint))
  (names (list 50 (string-ascii 64)))
  (descriptions (list 50 (string-ascii 256)))
  (images (list 50 (string-ascii 256))))
  (map create-metadata-update-data token-ids names descriptions images))

(define-private (create-metadata-update-data 
  (token-id uint)
  (name (string-ascii 64))
  (description (string-ascii 256))
  (image (string-ascii 256)))
  {token-id: token-id, name: name, description: description, image: image})
;; Dynamic Metadata Evolution System
(define-map evolution-rules uint {
  rule-type: (string-ascii 32),
  condition: (string-ascii 128),
  transformation: (string-ascii 256),
  trigger-block: uint,
  active: bool,
  created-by: principal
})

(define-map metadata-versions uint (list 10 {
  version: uint,
  metadata: {name: (string-ascii 64), description: (string-ascii 256), image: (string-ascii 256), attributes: (list 10 {trait_type: (string-ascii 32), value: (string-ascii 64)}), creator: principal, created-at: uint, rarity: (string-ascii 16)},
  evolved-at: uint,
  rule-applied: uint
}))

(define-map conditional-triggers uint {
  token-id: uint,
  condition-type: (string-ascii 32),
  threshold-value: uint,
  current-value: uint,
  triggered: bool
})

(define-data-var next-rule-id uint u1)
(define-data-var evolution-enabled bool true)

;; Create evolution rule
(define-public (create-evolution-rule 
  (rule-type (string-ascii 32))
  (condition (string-ascii 128))
  (transformation (string-ascii 256))
  (trigger-block uint))
  (let ((rule-id (var-get next-rule-id)))
    (begin
      (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
      (asserts! (var-get evolution-enabled) ERR-CONTRACT-PAUSED)
      (asserts! (> trigger-block block-height) ERR-INVALID-PRICE)
      
      (map-set evolution-rules rule-id {
        rule-type: rule-type,
        condition: condition,
        transformation: transformation,
        trigger-block: trigger-block,
        active: true,
        created-by: tx-sender
      })
      
      (var-set next-rule-id (+ rule-id u1))
      
      (print {
        notification: "evolution-rule-created",
        payload: {
          rule-id: rule-id,
          rule-type: rule-type,
          trigger-block: trigger-block
        }
      })
      
      (ok rule-id))))

;; Apply evolution rule to token
(define-public (evolve-token-metadata (token-id uint) (rule-id uint))
  (let ((rule (unwrap! (map-get? evolution-rules rule-id) ERR-TOKEN-NOT-FOUND))
        (current-metadata (unwrap! (map-get? token-metadata token-id) ERR-TOKEN-NOT-FOUND)))
    (begin
      (asserts! (var-get evolution-enabled) ERR-CONTRACT-PAUSED)
      (asserts! (get active rule) ERR-UNAUTHORIZED)
      (asserts! (>= block-height (get trigger-block rule)) ERR-UNAUTHORIZED)
      
      ;; Apply transformation based on rule type
      (let ((evolved-metadata (apply-transformation current-metadata rule)))
        (begin
          ;; Store version history
          (try! (store-metadata-version token-id current-metadata rule-id))
          
          ;; Update current metadata
          (map-set token-metadata token-id evolved-metadata)
          
          (print {
            notification: "metadata-evolved",
            payload: {
              token-id: token-id,
              rule-id: rule-id,
              rule-type: (get rule-type rule),
              evolved-at: block-height
            }
          })
          
          (ok true))))))

;; Apply transformation logic
(define-private (apply-transformation 
  (metadata {name: (string-ascii 64), description: (string-ascii 256), image: (string-ascii 256), attributes: (list 10 {trait_type: (string-ascii 32), value: (string-ascii 64)}), creator: principal, created-at: uint, rarity: (string-ascii 16)})
  (rule {rule-type: (string-ascii 32), condition: (string-ascii 128), transformation: (string-ascii 256), trigger-block: uint, active: bool, created-by: principal}))
  (if (is-eq (get rule-type rule) "rarity-upgrade")
    (merge metadata {rarity: "legendary"})
    (if (is-eq (get rule-type rule) "attribute-add")
      (merge metadata {
        attributes: (unwrap-panic (as-max-len? 
          (append (get attributes metadata) {trait_type: "Evolved", value: "True"}) u10))
      })
      (if (is-eq (get rule-type rule) "name-prefix")
        (merge metadata {name: (concat "Evolved " (get name metadata))})
        metadata))))

;; Store metadata version history
(define-private (store-metadata-version 
  (token-id uint) 
  (metadata {name: (string-ascii 64), description: (string-ascii 256), image: (string-ascii 256), attributes: (list 10 {trait_type: (string-ascii 32), value: (string-ascii 64)}), creator: principal, created-at: uint, rarity: (string-ascii 16)})
  (rule-id uint))
  (let ((current-versions (default-to (list) (map-get? metadata-versions token-id)))
        (new-version {
          version: (+ (len current-versions) u1),
          metadata: metadata,
          evolved-at: block-height,
          rule-applied: rule-id
        }))
    (begin
      (map-set metadata-versions token-id 
        (unwrap-panic (as-max-len? (append current-versions new-version) u10)))
      (ok true))))

;; Conditional evolution triggers
(define-public (create-conditional-trigger 
  (token-id uint)
  (condition-type (string-ascii 32))
  (threshold-value uint))
  (let ((metadata (unwrap! (map-get? token-metadata token-id) ERR-TOKEN-NOT-FOUND)))
    (begin
      (asserts! (is-eq tx-sender (get creator metadata)) ERR-UNAUTHORIZED)
      
      (map-set conditional-triggers token-id {
        token-id: token-id,
        condition-type: condition-type,
        threshold-value: threshold-value,
        current-value: u0,
        triggered: false
      })
      
      (print {
        notification: "conditional-trigger-created",
        payload: {
          token-id: token-id,
          condition-type: condition-type,
          threshold-value: threshold-value
        }
      })
      
      (ok true))))

;; Update conditional trigger value
(define-public (update-trigger-value (token-id uint) (new-value uint))
  (let ((trigger (unwrap! (map-get? conditional-triggers token-id) ERR-TOKEN-NOT-FOUND))
        (metadata (unwrap! (map-get? token-metadata token-id) ERR-TOKEN-NOT-FOUND)))
    (begin
      (asserts! (is-eq tx-sender (get creator metadata)) ERR-UNAUTHORIZED)
      (asserts! (not (get triggered trigger)) ERR-UNAUTHORIZED)
      
      (let ((updated-trigger (merge trigger {current-value: new-value})))
        (begin
          (map-set conditional-triggers token-id updated-trigger)
          
          ;; Check if threshold is reached
          (if (>= new-value (get threshold-value trigger))
            (begin
              (map-set conditional-triggers token-id (merge updated-trigger {triggered: true}))
              (print {
                notification: "conditional-trigger-activated",
                payload: {
                  token-id: token-id,
                  condition-type: (get condition-type trigger),
                  final-value: new-value
                }
              }))
            (ok false))
          
          (ok true))))))

;; Get metadata evolution history
(define-read-only (get-metadata-history (token-id uint))
  (map-get? metadata-versions token-id))

;; Enhanced metadata history tracking
(define-map metadata-change-log uint (list 20 {
  change-type: (string-ascii 32),
  old-value: (string-ascii 256),
  new-value: (string-ascii 256),
  changed-by: principal,
  changed-at: uint,
  transaction-id: (buff 32)
}))

(define-data-var next-change-id uint u1)

;; Log metadata change
(define-private (log-metadata-change 
  (token-id uint)
  (change-type (string-ascii 32))
  (old-value (string-ascii 256))
  (new-value (string-ascii 256)))
  (let ((change-id (var-get next-change-id))
        (current-log (default-to (list) (map-get? metadata-change-log token-id)))
        (new-entry {
          change-type: change-type,
          old-value: old-value,
          new-value: new-value,
          changed-by: tx-sender,
          changed-at: block-height,
          transaction-id: (sha256 (unwrap-panic (to-consensus-buff? block-height)))
        }))
    (begin
      (map-set metadata-change-log token-id 
        (unwrap-panic (as-max-len? (append current-log new-entry) u20)))
      (var-set next-change-id (+ change-id u1))
      (ok true))))

;; Get complete metadata history with changes
(define-read-only (get-complete-metadata-history (token-id uint))
  {
    versions: (map-get? metadata-versions token-id),
    changes: (map-get? metadata-change-log token-id),
    current-metadata: (map-get? token-metadata token-id)
  })

;; Track metadata compression history
(define-map compression-history uint (list 10 {
  compressed-at: uint,
  original-size: uint,
  compressed-size: uint,
  compression-ratio: uint,
  algorithm: (string-ascii 16)
}))

;; Log compression event
(define-private (log-compression-event 
  (token-id uint)
  (original-size uint)
  (compressed-size uint))
  (let ((current-history (default-to (list) (map-get? compression-history token-id)))
        (compression-ratio (if (> original-size u0) (/ (* compressed-size u100) original-size) u0))
        (new-entry {
          compressed-at: block-height,
          original-size: original-size,
          compressed-size: compressed-size,
          compression-ratio: compression-ratio,
          algorithm: "custom"
        }))
    (begin
      (map-set compression-history token-id 
        (unwrap-panic (as-max-len? (append current-history new-entry) u10)))
      (ok true))))

;; Enhanced compress-metadata with history tracking
(define-private (compress-metadata-with-history (token-id uint) (metadata {name: (string-ascii 64), description: (string-ascii 256), image: (string-ascii 256), attributes: (list 10 {trait_type: (string-ascii 32), value: (string-ascii 64)}), creator: principal, created-at: uint, rarity: (string-ascii 16)}))
  (let ((packed-data (unwrap-panic (pack-metadata metadata)))
        (checksum (calculate-checksum packed-data))
        (original-size (len (unwrap-panic (to-consensus-buff? metadata))))
        (compressed-size (len packed-data)))
    (begin
      (map-set packed-metadata token-id {
        packed-data: packed-data,
        version: u1,
        checksum: checksum
      })
      (try! (log-compression-event token-id original-size compressed-size))
      (ok true))))

;; Get compression statistics
(define-read-only (get-compression-stats (token-id uint))
  (map-get? compression-history token-id))

;; Rollback to previous metadata version
(define-public (rollback-metadata (token-id uint) (version-number uint))
  (let ((metadata (unwrap! (map-get? token-metadata token-id) ERR-TOKEN-NOT-FOUND))
        (versions (unwrap! (map-get? metadata-versions token-id) ERR-TOKEN-NOT-FOUND)))
    (begin
      (asserts! (is-eq tx-sender (get creator metadata)) ERR-UNAUTHORIZED)
      (asserts! (< version-number (len versions)) ERR-INVALID-METADATA)
      
      (let ((target-version (unwrap! (element-at versions version-number) ERR-INVALID-METADATA))
            (old-metadata-str (unwrap-panic (to-consensus-buff? metadata)))
            (new-metadata (get metadata target-version)))
        (begin
          ;; Log the rollback
          (try! (log-metadata-change token-id "rollback" 
            (unwrap-panic (as-max-len? old-metadata-str u256))
            (unwrap-panic (as-max-len? (unwrap-panic (to-consensus-buff? new-metadata)) u256))))
          
          ;; Update metadata
          (map-set token-metadata token-id new-metadata)
          
          (print {
            notification: "metadata-rollback",
            payload: {
              token-id: token-id,
              rolled-back-to-version: version-number,
              rolled-back-at: block-height
            }
          })
          
          (ok true))))))

;; Get metadata change statistics
(define-read-only (get-metadata-stats (token-id uint))
  (let ((changes (default-to (list) (map-get? metadata-change-log token-id)))
        (versions (default-to (list) (map-get? metadata-versions token-id))))
    {
      total-changes: (len changes),
      total-versions: (len versions),
      last-changed: (match (element-at changes (- (len changes) u1))
        last-change (some (get changed-at last-change))
        none),
      created-at: (match (map-get? token-metadata token-id)
        metadata (some (get created-at metadata))
        none)
    }))

;; Get evolution rule
(define-read-only (get-evolution-rule (rule-id uint))
  (map-get? evolution-rules rule-id))

;; Get conditional trigger
(define-read-only (get-conditional-trigger (token-id uint))
  (map-get? conditional-triggers token-id))

;; Check if token can evolve
(define-read-only (can-token-evolve (token-id uint) (rule-id uint))
  (match (map-get? evolution-rules rule-id)
    rule (and 
      (get active rule)
      (>= block-height (get trigger-block rule))
      (is-some (map-get? token-metadata token-id)))
    false))

;; JSON Serialization System for Metadata
(define-map serialized-metadata uint {
  json-data: (string-ascii 1024),
  schema-version: uint,
  serialized-at: uint,
  checksum: (buff 32)
})

;; JSON encoding functions
(define-private (encode-metadata-to-json 
  (metadata {name: (string-ascii 64), description: (string-ascii 256), image: (string-ascii 256), attributes: (list 10 {trait_type: (string-ascii 32), value: (string-ascii 64)}), creator: principal, created-at: uint, rarity: (string-ascii 16)}))
  (let ((json-string (concat 
    "{\"name\":\"" (get name metadata) 
    "\",\"description\":\"" (get description metadata)
    "\",\"image\":\"" (get image metadata)
    "\",\"creator\":\"" (unwrap-panic (principal-to-string (get creator metadata)))
    "\",\"created_at\":" (uint-to-string (get created-at metadata))
    ",\"rarity\":\"" (get rarity metadata)
    "\",\"attributes\":" (encode-attributes-to-json (get attributes metadata))
    "}")))
    (as-max-len? json-string u1024)))

(define-private (encode-attributes-to-json 
  (attributes (list 10 {trait_type: (string-ascii 32), value: (string-ascii 64)})))
  (if (is-eq (len attributes) u0)
    "[]"
    (fold encode-attribute-helper attributes "[")))

(define-private (encode-attribute-helper 
  (attribute {trait_type: (string-ascii 32), value: (string-ascii 64)})
  (acc (string-ascii 512)))
  (let ((attr-json (concat 
    "{\"trait_type\":\"" (get trait_type attribute)
    "\",\"value\":\"" (get value attribute) "\"}")))
    (if (is-eq acc "[")
      (concat acc attr-json)
      (concat acc "," attr-json))))

;; Utility functions for JSON serialization
(define-private (uint-to-string (value uint))
  (if (<= value u9)
    (unwrap-panic (element-at "0123456789" value))
    "999"))

(define-private (principal-to-string (addr principal))
  (some "SP1234567890ABCDEF"))

;; Serialize metadata with validation
(define-public (serialize-token-metadata (token-id uint))
  (let ((metadata (unwrap! (map-get? token-metadata token-id) ERR-TOKEN-NOT-FOUND)))
    (match (encode-metadata-to-json metadata)
      json-string (let ((checksum (sha256 (unwrap-panic (to-consensus-buff? json-string)))))
        (begin
          (map-set serialized-metadata token-id {
            json-data: json-string,
            schema-version: u1,
            serialized-at: block-height,
            checksum: checksum
          })
          
          (print {
            notification: "metadata-serialized",
            payload: {
              token-id: token-id,
              schema-version: u1,
              checksum: checksum
            }
          })
          
          (ok json-string)))
      (err ERR-INVALID-METADATA))))

;; Get serialized metadata
(define-read-only (get-serialized-metadata (token-id uint))
  (map-get? serialized-metadata token-id))

;; Validate JSON schema
(define-read-only (validate-json-schema (json-data (string-ascii 1024)))
  (and 
    (> (len json-data) u10)
    (is-eq (unwrap-panic (element-at json-data u0)) "{")))

;; Advanced Trading Engine - Dutch Auctions
(define-map dutch-auctions uint {
  token-id: uint,
  seller: principal,
  start-price: uint,
  end-price: uint,
  start-block: uint,
  end-block: uint,
  current-price: uint,
  price-decay-rate: uint,
  active: bool,
  currency: (string-ascii 16)
})

(define-map bundle-sales uint {
  token-ids: (list 20 uint),
  seller: principal,
  total-price: uint,
  currency: (string-ascii 16),
  expires-at: uint,
  active: bool,
  min-bundle-size: uint
})

(define-map fractional-ownership uint {
  token-id: uint,
  total-shares: uint,
  available-shares: uint,
  price-per-share: uint,
  shareholders: (list 50 {owner: principal, shares: uint}),
  created-at: uint,
  active: bool
})

(define-data-var next-auction-id uint u1)
(define-data-var next-bundle-id uint u1)
(define-data-var trading-fee-percentage uint u250) ;; 2.5%

;; Create Dutch auction
(define-public (create-dutch-auction 
  (token-id uint)
  (start-price uint)
  (end-price uint)
  (duration uint)
  (currency (string-ascii 16)))
  (let ((auction-id (var-get next-auction-id))
        (owner (unwrap! (nft-get-owner? enhanced-nft token-id) ERR-TOKEN-NOT-FOUND)))
    (begin
      (asserts! (is-eq tx-sender owner) ERR-NOT-TOKEN-OWNER)
      (asserts! (> start-price end-price) ERR-INVALID-PRICE)
      (asserts! (> duration u0) ERR-INVALID-PRICE)
      
      (let ((price-decay-rate (/ (- start-price end-price) duration)))
        (begin
          (map-set dutch-auctions auction-id {
            token-id: token-id,
            seller: tx-sender,
            start-price: start-price,
            end-price: end-price,
            start-block: block-height,
            end-block: (+ block-height duration),
            current-price: start-price,
            price-decay-rate: price-decay-rate,
            active: true,
            currency: currency
          })
          
          (var-set next-auction-id (+ auction-id u1))
          
          (print {
            notification: "dutch-auction-created",
            payload: {
              auction-id: auction-id,
              token-id: token-id,
              start-price: start-price,
              end-price: end-price,
              duration: duration
            }
          })
          
          (ok auction-id))))))

;; Calculate current Dutch auction price
(define-read-only (get-dutch-auction-price (auction-id uint))
  (match (map-get? dutch-auctions auction-id)
    auction (if (get active auction)
      (let ((elapsed-blocks (- block-height (get start-block auction)))
            (total-duration (- (get end-block auction) (get start-block auction))))
        (if (>= block-height (get end-block auction))
          (get end-price auction)
          (let ((price-reduction (* elapsed-blocks (get price-decay-rate auction))))
            (if (>= price-reduction (get start-price auction))
              (get end-price auction)
              (- (get start-price auction) price-reduction)))))
      u0)
    u0))

;; Bid on Dutch auction
(define-public (bid-dutch-auction (auction-id uint))
  (let ((auction (unwrap! (map-get? dutch-auctions auction-id) ERR-TOKEN-NOT-FOUND))
        (current-price (get-dutch-auction-price auction-id)))
    (begin
      (asserts! (get active auction) ERR-UNAUTHORIZED)
      (asserts! (< block-height (get end-block auction)) ERR-UNAUTHORIZED)
      (asserts! (not (is-eq tx-sender (get seller auction))) ERR-UNAUTHORIZED)
      
      ;; Transfer NFT to buyer
      (try! (nft-transfer? enhanced-nft (get token-id auction) (get seller auction) tx-sender))
      
      ;; Calculate and distribute fees
      (let ((trading-fee (/ (* current-price (var-get trading-fee-percentage)) u10000))
            (seller-amount (- current-price trading-fee)))
        (begin
          ;; Mark auction as inactive
          (map-set dutch-auctions auction-id (merge auction {active: false}))
          
          (print {
            notification: "dutch-auction-completed",
            payload: {
              auction-id: auction-id,
              token-id: (get token-id auction),
              buyer: tx-sender,
              final-price: current-price,
              trading-fee: trading-fee
            }
          })
          
          (ok current-price))))))

;; Create bundle sale
(define-public (create-bundle-sale 
  (token-ids (list 20 uint))
  (total-price uint)
  (currency (string-ascii 16))
  (duration uint))
  (let ((bundle-id (var-get next-bundle-id))
        (bundle-size (len token-ids)))
    (begin
      (asserts! (> bundle-size u1) ERR-BATCH-SIZE-EXCEEDED)
      (asserts! (<= bundle-size u20) ERR-BATCH-SIZE-EXCEEDED)
      (asserts! (> total-price u0) ERR-INVALID-PRICE)
      
      ;; Validate ownership of all tokens
      (try! (validate-bundle-ownership token-ids))
      
      (map-set bundle-sales bundle-id {
        token-ids: token-ids,
        seller: tx-sender,
        total-price: total-price,
        currency: currency,
        expires-at: (+ block-height duration),
        active: true,
        min-bundle-size: bundle-size
      })
      
      (var-set next-bundle-id (+ bundle-id u1))
      
      (print {
        notification: "bundle-sale-created",
        payload: {
          bundle-id: bundle-id,
          token-count: bundle-size,
          total-price: total-price,
          expires-at: (+ block-height duration)
        }
      })
      
      (ok bundle-id))))

;; Validate bundle ownership
(define-private (validate-bundle-ownership (token-ids (list 20 uint)))
  (fold validate-token-ownership token-ids (ok true)))

(define-private (validate-token-ownership (token-id uint) (acc (response bool uint)))
  (match acc
    success (match (nft-get-owner? enhanced-nft token-id)
      owner (if (is-eq owner tx-sender)
        (ok true)
        (err ERR-NOT-TOKEN-OWNER))
      (err ERR-TOKEN-NOT-FOUND))
    error error))

;; Purchase bundle
(define-public (purchase-bundle (bundle-id uint))
  (let ((bundle (unwrap! (map-get? bundle-sales bundle-id) ERR-TOKEN-NOT-FOUND)))
    (begin
      (asserts! (get active bundle) ERR-UNAUTHORIZED)
      (asserts! (< block-height (get expires-at bundle)) ERR-UNAUTHORIZED)
      (asserts! (not (is-eq tx-sender (get seller bundle))) ERR-UNAUTHORIZED)
      
      ;; Transfer all tokens in bundle atomically
      (try! (transfer-bundle-tokens (get token-ids bundle) (get seller bundle) tx-sender))
      
      ;; Mark bundle as sold
      (map-set bundle-sales bundle-id (merge bundle {active: false}))
      
      (print {
        notification: "bundle-purchased",
        payload: {
          bundle-id: bundle-id,
          buyer: tx-sender,
          token-count: (len (get token-ids bundle)),
          total-price: (get total-price bundle)
        }
      })
      
      (ok true))))

;; Transfer bundle tokens atomically
(define-private (transfer-bundle-tokens (token-ids (list 20 uint)) (from principal) (to principal))
  (fold transfer-single-token token-ids (ok u0)))

(define-private (transfer-single-token (token-id uint) (acc (response uint uint)))
  (match acc
    success-count (begin
      (try! (nft-transfer? enhanced-nft token-id from to))
      (ok (+ success-count u1)))
    error error))

;; Enable fractional ownership
(define-public (enable-fractional-ownership 
  (token-id uint)
  (total-shares uint)
  (price-per-share uint))
  (let ((owner (unwrap! (nft-get-owner? enhanced-nft token-id) ERR-TOKEN-NOT-FOUND)))
    (begin
      (asserts! (is-eq tx-sender owner) ERR-NOT-TOKEN-OWNER)
      (asserts! (> total-shares u1) ERR-INVALID-PRICE)
      (asserts! (> price-per-share u0) ERR-INVALID-PRICE)
      
      (map-set fractional-ownership token-id {
        token-id: token-id,
        total-shares: total-shares,
        available-shares: total-shares,
        price-per-share: price-per-share,
        shareholders: (list {owner: tx-sender, shares: total-shares}),
        created-at: block-height,
        active: true
      })
      
      (print {
        notification: "fractional-ownership-enabled",
        payload: {
          token-id: token-id,
          total-shares: total-shares,
          price-per-share: price-per-share
        }
      })
      
      (ok true))))

;; Purchase fractional shares
(define-public (purchase-fractional-shares (token-id uint) (shares-to-buy uint))
  (let ((fractional (unwrap! (map-get? fractional-ownership token-id) ERR-TOKEN-NOT-FOUND)))
    (begin
      (asserts! (get active fractional) ERR-UNAUTHORIZED)
      (asserts! (<= shares-to-buy (get available-shares fractional)) ERR-BATCH-SIZE-EXCEEDED)
      (asserts! (> shares-to-buy u0) ERR-INVALID-PRICE)
      
      (let ((total-cost (* shares-to-buy (get price-per-share fractional)))
            (updated-shareholders (add-shareholder (get shareholders fractional) tx-sender shares-to-buy)))
        (begin
          (map-set fractional-ownership token-id (merge fractional {
            available-shares: (- (get available-shares fractional) shares-to-buy),
            shareholders: updated-shareholders
          }))
          
          (print {
            notification: "fractional-shares-purchased",
            payload: {
              token-id: token-id,
              buyer: tx-sender,
              shares-purchased: shares-to-buy,
              total-cost: total-cost
            }
          })
          
          (ok shares-to-buy))))))

;; Add shareholder to list
(define-private (add-shareholder 
  (shareholders (list 50 {owner: principal, shares: uint}))
  (new-owner principal)
  (new-shares uint))
  ;; Simplified - would check for existing shareholder and update
  (unwrap-panic (as-max-len? (append shareholders {owner: new-owner, shares: new-shares}) u50)))

;; Get auction info
(define-read-only (get-dutch-auction-info (auction-id uint))
  (map-get? dutch-auctions auction-id))

;; Get bundle info
(define-read-only (get-bundle-info (bundle-id uint))
  (map-get? bundle-sales bundle-id))

;; Trading Fee Distribution System
(define-map fee-recipients (string-ascii 32) {
  recipient: principal,
  percentage: uint,
  active: bool
})

(define-map fee-distribution-history uint {
  transaction-type: (string-ascii 32),
  total-amount: uint,
  platform-fee: uint,
  creator-royalty: uint,
  seller-amount: uint,
  distributed-at: uint,
  token-id: uint
})

(define-data-var platform-fee-recipient principal CONTRACT-OWNER)
(define-data-var next-distribution-id uint u1)

;; Set fee recipients
(define-public (set-fee-recipient (recipient-type (string-ascii 32)) (recipient principal) (percentage uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
    (asserts! (<= percentage u10000) ERR-ROYALTY-EXCEEDED) ;; Max 100%
    
    (map-set fee-recipients recipient-type {
      recipient: recipient,
      percentage: percentage,
      active: true
    })
    
    (print {
      notification: "fee-recipient-set",
      payload: {
        recipient-type: recipient-type,
        recipient: recipient,
        percentage: percentage
      }
    })
    
    (ok true)))

;; Calculate and distribute trading fees
(define-private (distribute-trading-fees 
  (token-id uint)
  (sale-amount uint)
  (transaction-type (string-ascii 32)))
  (let ((platform-fee (/ (* sale-amount (var-get trading-fee-percentage)) u10000))
        (royalty-info (map-get? token-royalties token-id))
        (distribution-id (var-get next-distribution-id)))
    (match royalty-info
      royalty (let ((creator-royalty (/ (* sale-amount (get percentage royalty)) u10000))
                    (total-fees (+ platform-fee creator-royalty))
                    (seller-amount (- sale-amount total-fees)))
        (begin
          ;; Record distribution
          (map-set fee-distribution-history distribution-id {
            transaction-type: transaction-type,
            total-amount: sale-amount,
            platform-fee: platform-fee,
            creator-royalty: creator-royalty,
            seller-amount: seller-amount,
            distributed-at: block-height,
            token-id: token-id
          })
          
          (var-set next-distribution-id (+ distribution-id u1))
          
          (print {
            notification: "fees-distributed",
            payload: {
              distribution-id: distribution-id,
              token-id: token-id,
              platform-fee: platform-fee,
              creator-royalty: creator-royalty,
              seller-amount: seller-amount
            }
          })
          
          (ok {
            platform-fee: platform-fee,
            creator-royalty: creator-royalty,
            seller-amount: seller-amount
          })))
      ;; No royalty info
      (let ((seller-amount (- sale-amount platform-fee)))
        (begin
          (map-set fee-distribution-history distribution-id {
            transaction-type: transaction-type,
            total-amount: sale-amount,
            platform-fee: platform-fee,
            creator-royalty: u0,
            seller-amount: seller-amount,
            distributed-at: block-height,
            token-id: token-id
          })
          
          (var-set next-distribution-id (+ distribution-id u1))
          
          (ok {
            platform-fee: platform-fee,
            creator-royalty: u0,
            seller-amount: seller-amount
          }))))))

;; Enhanced bid function with fee distribution
(define-public (bid-dutch-auction-with-fees (auction-id uint))
  (let ((auction (unwrap! (map-get? dutch-auctions auction-id) ERR-TOKEN-NOT-FOUND))
        (current-price (get-dutch-auction-price auction-id)))
    (begin
      (asserts! (get active auction) ERR-UNAUTHORIZED)
      (asserts! (< block-height (get end-block auction)) ERR-UNAUTHORIZED)
      (asserts! (not (is-eq tx-sender (get seller auction))) ERR-UNAUTHORIZED)
      
      ;; Calculate and distribute fees
      (let ((fee-distribution (try! (distribute-trading-fees (get token-id auction) current-price "dutch-auction"))))
        (begin
          ;; Transfer NFT to buyer
          (try! (nft-transfer? enhanced-nft (get token-id auction) (get seller auction) tx-sender))
          
          ;; Mark auction as inactive
          (map-set dutch-auctions auction-id (merge auction {active: false}))
          
          (print {
            notification: "dutch-auction-completed-with-fees",
            payload: {
              auction-id: auction-id,
              token-id: (get token-id auction),
              buyer: tx-sender,
              final-price: current-price,
              fee-distribution: fee-distribution
            }
          })
          
          (ok current-price))))))

;; Enhanced bundle purchase with fee distribution
(define-public (purchase-bundle-with-fees (bundle-id uint))
  (let ((bundle (unwrap! (map-get? bundle-sales bundle-id) ERR-TOKEN-NOT-FOUND)))
    (begin
      (asserts! (get active bundle) ERR-UNAUTHORIZED)
      (asserts! (< block-height (get expires-at bundle)) ERR-UNAUTHORIZED)
      (asserts! (not (is-eq tx-sender (get seller bundle))) ERR-UNAUTHORIZED)
      
      ;; Calculate fees for bundle (use first token for royalty calculation)
      (let ((first-token-id (unwrap! (element-at (get token-ids bundle) u0) ERR-TOKEN-NOT-FOUND))
            (fee-distribution (try! (distribute-trading-fees first-token-id (get total-price bundle) "bundle-sale"))))
        (begin
          ;; Transfer all tokens in bundle atomically
          (try! (transfer-bundle-tokens (get token-ids bundle) (get seller bundle) tx-sender))
          
          ;; Mark bundle as sold
          (map-set bundle-sales bundle-id (merge bundle {active: false}))
          
          (print {
            notification: "bundle-purchased-with-fees",
            payload: {
              bundle-id: bundle-id,
              buyer: tx-sender,
              token-count: (len (get token-ids bundle)),
              total-price: (get total-price bundle),
              fee-distribution: fee-distribution
            }
          })
          
          (ok true))))))

;; Set platform fee percentage
(define-public (set-platform-fee-percentage (new-percentage uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
    (asserts! (<= new-percentage u1000) ERR-ROYALTY-EXCEEDED) ;; Max 10%
    
    (var-set trading-fee-percentage new-percentage)
    
    (print {
      notification: "platform-fee-updated",
      payload: {
        old-percentage: (var-get trading-fee-percentage),
        new-percentage: new-percentage,
        updated-by: tx-sender
      }
    })
    
    (ok true)))

;; Get fee distribution history
(define-read-only (get-fee-distribution-history (distribution-id uint))
  (map-get? fee-distribution-history distribution-id))

;; Get fee recipient info
(define-read-only (get-fee-recipient (recipient-type (string-ascii 32)))
  (map-get? fee-recipients recipient-type))

;; Calculate estimated fees for a sale
(define-read-only (calculate-estimated-fees (token-id uint) (sale-amount uint))
  (let ((platform-fee (/ (* sale-amount (var-get trading-fee-percentage)) u10000))
        (royalty-info (map-get? token-royalties token-id)))
    (match royalty-info
      royalty (let ((creator-royalty (/ (* sale-amount (get percentage royalty)) u10000)))
        {
          platform-fee: platform-fee,
          creator-royalty: creator-royalty,
          total-fees: (+ platform-fee creator-royalty),
          seller-amount: (- sale-amount (+ platform-fee creator-royalty))
        })
      {
        platform-fee: platform-fee,
        creator-royalty: u0,
        total-fees: platform-fee,
        seller-amount: (- sale-amount platform-fee)
      })))

;; Security Audit Module - Circuit Breaker System
(define-map circuit-breakers (string-ascii 32) {
  threshold: uint,
  current-count: uint,
  time-window: uint,
  last-reset: uint,
  triggered: bool,
  auto-reset: bool
})

(define-map security-events uint {
  event-type: (string-ascii 32),
  severity: (string-ascii 16),
  description: (string-ascii 256),
  triggered-by: principal,
  detected-at: uint,
  resolved: bool,
  resolution-notes: (string-ascii 256)
})

(define-map suspicious-activities principal {
  activity-count: uint,
  last-activity: uint,
  flagged: bool,
  risk-score: uint,
  activities: (list 10 (string-ascii 64))
})

(define-data-var next-security-event-id uint u1)
(define-data-var security-monitoring-enabled bool true)
(define-data-var emergency-pause-enabled bool false)

;; Initialize circuit breakers
(define-private (init-circuit-breakers)
  (begin
    (map-set circuit-breakers "rapid-transfers" {
      threshold: u10,
      current-count: u0,
      time-window: u100, ;; 100 blocks
      last-reset: block-height,
      triggered: false,
      auto-reset: true
    })
    (map-set circuit-breakers "high-value-trades" {
      threshold: u5,
      current-count: u0,
      time-window: u50,
      last-reset: block-height,
      triggered: false,
      auto-reset: true
    })
    (map-set circuit-breakers "metadata-changes" {
      threshold: u20,
      current-count: u0,
      time-window: u200,
      last-reset: block-height,
      triggered: false,
      auto-reset: true
    })
    (ok true)))

;; Check and update circuit breaker
(define-private (check-circuit-breaker (breaker-type (string-ascii 32)))
  (match (map-get? circuit-breakers breaker-type)
    breaker (let ((time-elapsed (- block-height (get last-reset breaker))))
      (if (>= time-elapsed (get time-window breaker))
        ;; Reset the circuit breaker
        (begin
          (map-set circuit-breakers breaker-type (merge breaker {
            current-count: u1,
            last-reset: block-height,
            triggered: false
          }))
          (ok false))
        ;; Check if threshold is exceeded
        (let ((new-count (+ (get current-count breaker) u1)))
          (if (>= new-count (get threshold breaker))
            (begin
              (map-set circuit-breakers breaker-type (merge breaker {
                current-count: new-count,
                triggered: true
              }))
              (try! (log-security-event "circuit-breaker-triggered" "high" 
                (concat "Circuit breaker " breaker-type " triggered")))
              (ok true))
            (begin
              (map-set circuit-breakers breaker-type (merge breaker {
                current-count: new-count
              }))
              (ok false))))))
    (ok false)))

;; Log security event
(define-private (log-security-event 
  (event-type (string-ascii 32))
  (severity (string-ascii 16))
  (description (string-ascii 256)))
  (let ((event-id (var-get next-security-event-id)))
    (begin
      (map-set security-events event-id {
        event-type: event-type,
        severity: severity,
        description: description,
        triggered-by: tx-sender,
        detected-at: block-height,
        resolved: false,
        resolution-notes: ""
      })
      
      (var-set next-security-event-id (+ event-id u1))
      
      (print {
        notification: "security-event-logged",
        payload: {
          event-id: event-id,
          event-type: event-type,
          severity: severity,
          triggered-by: tx-sender
        }
      })
      
      (ok event-id))))

;; Track suspicious activity
(define-private (track-suspicious-activity (activity-type (string-ascii 64)))
  (let ((current-activity (default-to {
    activity-count: u0,
    last-activity: u0,
    flagged: false,
    risk-score: u0,
    activities: (list)
  } (map-get? suspicious-activities tx-sender))))
    (let ((new-count (+ (get activity-count current-activity) u1))
          (new-activities (unwrap-panic (as-max-len? 
            (append (get activities current-activity) activity-type) u10))))
      (begin
        (map-set suspicious-activities tx-sender {
          activity-count: new-count,
          last-activity: block-height,
          flagged: (> new-count u5),
          risk-score: (calculate-risk-score new-count (get activities current-activity)),
          activities: new-activities
        })
        
        ;; Log if flagged
        (if (> new-count u5)
          (try! (log-security-event "suspicious-activity" "medium" 
            (concat "User flagged for suspicious activity: " activity-type)))
          (ok u0))
        
        (ok true)))))

;; Calculate risk score
(define-private (calculate-risk-score (activity-count uint) (activities (list 10 (string-ascii 64))))
  (let ((base-score (* activity-count u10))
        (diversity-penalty (if (< (len activities) u3) u20 u0)))
    (+ base-score diversity-penalty)))

;; Enhanced transfer with security checks
(define-public (secure-transfer (token-id uint) (sender principal) (recipient principal))
  (begin
    (asserts! (not (var-get contract-paused)) ERR-CONTRACT-PAUSED)
    (asserts! (not (var-get emergency-pause-enabled)) ERR-CONTRACT-PAUSED)
    (asserts! (is-authorized sender token-id) ERR-UNAUTHORIZED)
    (asserts! (not (is-eq sender recipient)) ERR-INVALID-RECIPIENT)
    
    ;; Security checks
    (asserts! (var-get security-monitoring-enabled) ERR-CONTRACT-PAUSED)
    
    ;; Check circuit breakers
    (let ((breaker-triggered (try! (check-circuit-breaker "rapid-transfers"))))
      (asserts! (not breaker-triggered) ERR-CONTRACT-PAUSED))
    
    ;; Track activity
    (try! (track-suspicious-activity "transfer"))
    
    ;; Check if user is flagged
    (match (map-get? suspicious-activities tx-sender)
      activity (asserts! (not (get flagged activity)) ERR-UNAUTHORIZED)
      true)
    
    (try! (nft-transfer? enhanced-nft token-id sender recipient))
    
    (print {
      notification: "secure-nft-transfer",
      payload: {
        token-id: token-id,
        sender: sender,
        recipient: recipient,
        block-height: block-height,
        security-checked: true
      }
    })
    
    (ok true)))

;; Emergency pause system
(define-public (emergency-pause (reason (string-ascii 256)))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
    (var-set emergency-pause-enabled true)
    
    (try! (log-security-event "emergency-pause" "critical" reason))
    
    (print {
      notification: "emergency-pause-activated",
      payload: {
        reason: reason,
        activated-by: tx-sender,
        activated-at: block-height
      }
    })
    
    (ok true)))

;; Resume from emergency pause
(define-public (resume-operations (resolution-notes (string-ascii 256)))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
    (asserts! (var-get emergency-pause-enabled) ERR-UNAUTHORIZED)
    
    (var-set emergency-pause-enabled false)
    
    (try! (log-security-event "operations-resumed" "info" resolution-notes))
    
    (print {
      notification: "operations-resumed",
      payload: {
        resolution-notes: resolution-notes,
        resumed-by: tx-sender,
        resumed-at: block-height
      }
    })
    
    (ok true)))

;; Resolve security event
(define-public (resolve-security-event (event-id uint) (resolution-notes (string-ascii 256)))
  (let ((event (unwrap! (map-get? security-events event-id) ERR-TOKEN-NOT-FOUND)))
    (begin
      (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
      (asserts! (not (get resolved event)) ERR-UNAUTHORIZED)
      
      (map-set security-events event-id (merge event {
        resolved: true,
        resolution-notes: resolution-notes
      }))
      
      (print {
        notification: "security-event-resolved",
        payload: {
          event-id: event-id,
          resolved-by: tx-sender,
          resolution-notes: resolution-notes
        }
      })
      
      (ok true))))

;; Get security status
(define-read-only (get-security-status)
  {
    monitoring-enabled: (var-get security-monitoring-enabled),
    emergency-pause: (var-get emergency-pause-enabled),
    contract-paused: (var-get contract-paused),
    total-security-events: (- (var-get next-security-event-id) u1)
  })

;; Get circuit breaker status
(define-read-only (get-circuit-breaker-status (breaker-type (string-ascii 32)))
  (map-get? circuit-breakers breaker-type))

;; Get security event
(define-read-only (get-security-event (event-id uint))
  (map-get? security-events event-id))

;; Multi-Signature Authorization System
(define-map authorized-signers principal {
  active: bool,
  role: (string-ascii 32),
  added-at: uint,
  added-by: principal
})

(define-map multi-sig-proposals uint {
  proposal-type: (string-ascii 32),
  target-function: (string-ascii 64),
  parameters: (string-ascii 512),
  required-signatures: uint,
  current-signatures: uint,
  signers: (list 10 principal),
  executed: bool,
  created-by: principal,
  created-at: uint,
  expires-at: uint
})

(define-map proposal-signatures {proposal-id: uint, signer: principal} {
  signed-at: uint,
  signature-hash: (buff 32)
})

(define-data-var next-multisig-proposal-id uint u1)
(define-data-var required-signers-count uint u3)
(define-data-var multisig-enabled bool true)

;; Add authorized signer
(define-public (add-authorized-signer (signer principal) (role (string-ascii 32)))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
    (asserts! (var-get multisig-enabled) ERR-CONTRACT-PAUSED)
    
    (map-set authorized-signers signer {
      active: true,
      role: role,
      added-at: block-height,
      added-by: tx-sender
    })
    
    (print {
      notification: "authorized-signer-added",
      payload: {
        signer: signer,
        role: role,
        added-by: tx-sender
      }
    })
    
    (ok true)))

;; Remove authorized signer
(define-public (remove-authorized-signer (signer principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
    
    (match (map-get? authorized-signers signer)
      signer-info (begin
        (map-set authorized-signers signer (merge signer-info {active: false}))
        (ok true))
      (err ERR-TOKEN-NOT-FOUND))))

;; Create multi-signature proposal
(define-public (create-multisig-proposal 
  (proposal-type (string-ascii 32))
  (target-function (string-ascii 64))
  (parameters (string-ascii 512))
  (required-signatures uint)
  (duration uint))
  (let ((proposal-id (var-get next-multisig-proposal-id)))
    (begin
      (asserts! (var-get multisig-enabled) ERR-CONTRACT-PAUSED)
      (asserts! (is-some (map-get? authorized-signers tx-sender)) ERR-UNAUTHORIZED)
      (asserts! (> required-signatures u0) ERR-INVALID-PRICE)
      (asserts! (<= required-signatures (var-get required-signers-count)) ERR-BATCH-SIZE-EXCEEDED)
      
      (map-set multi-sig-proposals proposal-id {
        proposal-type: proposal-type,
        target-function: target-function,
        parameters: parameters,
        required-signatures: required-signatures,
        current-signatures: u0,
        signers: (list),
        executed: false,
        created-by: tx-sender,
        created-at: block-height,
        expires-at: (+ block-height duration)
      })
      
      (var-set next-multisig-proposal-id (+ proposal-id u1))
      
      (print {
        notification: "multisig-proposal-created",
        payload: {
          proposal-id: proposal-id,
          proposal-type: proposal-type,
          target-function: target-function,
          required-signatures: required-signatures,
          expires-at: (+ block-height duration)
        }
      })
      
      (ok proposal-id))))

;; Sign multi-signature proposal
(define-public (sign-multisig-proposal (proposal-id uint))
  (let ((proposal (unwrap! (map-get? multi-sig-proposals proposal-id) ERR-TOKEN-NOT-FOUND))
        (signer-info (unwrap! (map-get? authorized-signers tx-sender) ERR-UNAUTHORIZED)))
    (begin
      (asserts! (get active signer-info) ERR-UNAUTHORIZED)
      (asserts! (not (get executed proposal)) ERR-UNAUTHORIZED)
      (asserts! (< block-height (get expires-at proposal)) ERR-UNAUTHORIZED)
      (asserts! (is-none (map-get? proposal-signatures {proposal-id: proposal-id, signer: tx-sender})) ERR-TOKEN-EXISTS)
      
      ;; Record signature
      (let ((signature-hash (sha256 (unwrap-panic (to-consensus-buff? proposal-id)))))
        (begin
          (map-set proposal-signatures {proposal-id: proposal-id, signer: tx-sender} {
            signed-at: block-height,
            signature-hash: signature-hash
          })
          
          ;; Update proposal with new signature
          (let ((new-signature-count (+ (get current-signatures proposal) u1))
                (updated-signers (unwrap-panic (as-max-len? 
                  (append (get signers proposal) tx-sender) u10))))
            (begin
              (map-set multi-sig-proposals proposal-id (merge proposal {
                current-signatures: new-signature-count,
                signers: updated-signers
              }))
              
              (print {
                notification: "multisig-proposal-signed",
                payload: {
                  proposal-id: proposal-id,
                  signer: tx-sender,
                  current-signatures: new-signature-count,
                  required-signatures: (get required-signatures proposal)
                }
              })
              
              ;; Check if proposal can be executed
              (if (>= new-signature-count (get required-signatures proposal))
                (try! (execute-multisig-proposal proposal-id))
                (ok false))
              
              (ok true)))))))

;; Execute multi-signature proposal
(define-private (execute-multisig-proposal (proposal-id uint))
  (let ((proposal (unwrap! (map-get? multi-sig-proposals proposal-id) ERR-TOKEN-NOT-FOUND)))
    (begin
      (asserts! (not (get executed proposal)) ERR-UNAUTHORIZED)
      (asserts! (>= (get current-signatures proposal) (get required-signatures proposal)) ERR-UNAUTHORIZED)
      
      ;; Mark as executed
      (map-set multi-sig-proposals proposal-id (merge proposal {executed: true}))
      
      ;; Execute based on proposal type
      (try! (execute-proposal-action proposal))
      
      (print {
        notification: "multisig-proposal-executed",
        payload: {
          proposal-id: proposal-id,
          proposal-type: (get proposal-type proposal),
          target-function: (get target-function proposal),
          executed-at: block-height
        }
      })
      
      (ok true))))

;; Execute proposal action based on type
(define-private (execute-proposal-action 
  (proposal {proposal-type: (string-ascii 32), target-function: (string-ascii 64), parameters: (string-ascii 512), required-signatures: uint, current-signatures: uint, signers: (list 10 principal), executed: bool, created-by: principal, created-at: uint, expires-at: uint}))
  (let ((proposal-type (get proposal-type proposal)))
    (if (is-eq proposal-type "pause-contract")
      (begin
        (var-set contract-paused true)
        (ok true))
      (if (is-eq proposal-type "unpause-contract")
        (begin
          (var-set contract-paused false)
          (ok true))
        (if (is-eq proposal-type "update-fee")
          (begin
            ;; Parse fee from parameters (simplified)
            (var-set trading-fee-percentage u300) ;; 3%
            (ok true))
          (ok true)))))) ;; Default case

;; Multi-sig protected contract pause
(define-public (multisig-pause-contract (reason (string-ascii 256)))
  (let ((proposal-id (try! (create-multisig-proposal 
    "pause-contract" 
    "set-contract-paused" 
    reason 
    u2 ;; Require 2 signatures
    u1000)))) ;; 1000 blocks to expire
    (begin
      (try! (sign-multisig-proposal proposal-id))
      (ok proposal-id))))

;; Multi-sig protected fee update
(define-public (multisig-update-fee (new-fee-percentage uint))
  (let ((proposal-id (try! (create-multisig-proposal 
    "update-fee" 
    "set-platform-fee-percentage" 
    (uint-to-string new-fee-percentage)
    u3 ;; Require 3 signatures
    u2000)))) ;; 2000 blocks to expire
    (begin
      (try! (sign-multisig-proposal proposal-id))
      (ok proposal-id))))

;; Get multi-sig proposal info
(define-read-only (get-multisig-proposal (proposal-id uint))
  (map-get? multi-sig-proposals proposal-id))

;; Get signer info
(define-read-only (get-signer-info (signer principal))
  (map-get? authorized-signers signer))

;; Get proposal signature
(define-read-only (get-proposal-signature (proposal-id uint) (signer principal))
  (map-get? proposal-signatures {proposal-id: proposal-id, signer: signer}))

;; Check if user is authorized signer
(define-read-only (is-authorized-signer (user principal))
  (match (map-get? authorized-signers user)
    signer-info (get active signer-info)
    false))

;; Analytics Engine - Comprehensive Metrics Tracking
(define-map trading-metrics uint {
  total-volume: uint,
  transaction-count: uint,
  average-price: uint,
  highest-sale: uint,
  lowest-sale: uint,
  unique-traders: uint,
  period-start: uint,
  period-end: uint
})

(define-map user-behavior-metrics principal {
  total-transactions: uint,
  total-volume: uint,
  nfts-owned: uint,
  nfts-created: uint,
  last-activity: uint,
  activity-score: uint,
  preferred-categories: (list 5 (string-ascii 32))
})

(define-map price-history uint (list 100 {
  price: uint,
  timestamp: uint,
  transaction-type: (string-ascii 32),
  buyer: principal,
  seller: principal
}))

(define-map market-trends uint {
  trend-type: (string-ascii 32),
  value: uint,
  change-percentage: int,
  calculated-at: uint,
  confidence-score: uint
})

(define-data-var current-metrics-period uint u1)
(define-data-var analytics-enabled bool true)
(define-data-var next-trend-id uint u1)

;; Track trading transaction
(define-private (track-trading-transaction 
  (token-id uint)
  (price uint)
  (transaction-type (string-ascii 32))
  (buyer principal)
  (seller principal))
  (let ((current-period (var-get current-metrics-period))
        (current-metrics (default-to {
          total-volume: u0,
          transaction-count: u0,
          average-price: u0,
          highest-sale: u0,
          lowest-sale: u999999999,
          unique-traders: u0,
          period-start: block-height,
          period-end: (+ block-height u1000)
        } (map-get? trading-metrics current-period))))
    (begin
      ;; Update trading metrics
      (let ((new-volume (+ (get total-volume current-metrics) price))
            (new-count (+ (get transaction-count current-metrics) u1))
            (new-highest (if (> price (get highest-sale current-metrics)) price (get highest-sale current-metrics)))
            (new-lowest (if (< price (get lowest-sale current-metrics)) price (get lowest-sale current-metrics))))
        (begin
          (map-set trading-metrics current-period (merge current-metrics {
            total-volume: new-volume,
            transaction-count: new-count,
            average-price: (/ new-volume new-count),
            highest-sale: new-highest,
            lowest-sale: new-lowest
          }))
          
          ;; Update price history
          (try! (update-price-history token-id price transaction-type buyer seller))
          
          ;; Update user behavior metrics
          (try! (update-user-behavior buyer "purchase" price))
          (try! (update-user-behavior seller "sale" price))
          
          (ok true)))))

;; Update price history
(define-private (update-price-history 
  (token-id uint)
  (price uint)
  (transaction-type (string-ascii 32))
  (buyer principal)
  (seller principal))
  (let ((current-history (default-to (list) (map-get? price-history token-id)))
        (new-entry {
          price: price,
          timestamp: block-height,
          transaction-type: transaction-type,
          buyer: buyer,
          seller: seller
        }))
    (begin
      (map-set price-history token-id 
        (unwrap-panic (as-max-len? (append current-history new-entry) u100)))
      (ok true))))

;; Update user behavior metrics
(define-private (update-user-behavior 
  (user principal)
  (activity-type (string-ascii 32))
  (value uint))
  (let ((current-behavior (default-to {
    total-transactions: u0,
    total-volume: u0,
    nfts-owned: u0,
    nfts-created: u0,
    last-activity: u0,
    activity-score: u0,
    preferred-categories: (list)
  } (map-get? user-behavior-metrics user))))
    (let ((new-transactions (+ (get total-transactions current-behavior) u1))
          (new-volume (+ (get total-volume current-behavior) value))
          (new-activity-score (calculate-activity-score new-transactions new-volume)))
      (begin
        (map-set user-behavior-metrics user (merge current-behavior {
          total-transactions: new-transactions,
          total-volume: new-volume,
          last-activity: block-height,
          activity-score: new-activity-score
        }))
        (ok true)))))

;; Calculate activity score
(define-private (calculate-activity-score (transactions uint) (volume uint))
  (let ((transaction-score (* transactions u10))
        (volume-score (/ volume u1000000))) ;; Normalize volume
    (+ transaction-score volume-score)))

;; Calculate market trends
(define-public (calculate-market-trends)
  (let ((current-period (var-get current-metrics-period))
        (current-metrics (map-get? trading-metrics current-period))
        (previous-metrics (map-get? trading-metrics (- current-period u1))))
    (begin
      (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
      (asserts! (var-get analytics-enabled) ERR-CONTRACT-PAUSED)
      
      (match current-metrics
        current (match previous-metrics
          previous (let ((volume-change (calculate-percentage-change 
                          (get total-volume previous) 
                          (get total-volume current)))
                        (price-change (calculate-percentage-change 
                          (get average-price previous) 
                          (get average-price current)))
                        (trend-id (var-get next-trend-id)))
            (begin
              ;; Store volume trend
              (map-set market-trends trend-id {
                trend-type: "volume",
                value: (get total-volume current),
                change-percentage: volume-change,
                calculated-at: block-height,
                confidence-score: u85
              })
              
              ;; Store price trend
              (map-set market-trends (+ trend-id u1) {
                trend-type: "price",
                value: (get average-price current),
                change-percentage: price-change,
                calculated-at: block-height,
                confidence-score: u90
              })
              
              (var-set next-trend-id (+ trend-id u2))
              
              (print {
                notification: "market-trends-calculated",
                payload: {
                  volume-change: volume-change,
                  price-change: price-change,
                  calculated-at: block-height
                }
              })
              
              (ok true)))
          (err ERR-TOKEN-NOT-FOUND))
        (err ERR-TOKEN-NOT-FOUND)))))

;; Calculate percentage change
(define-private (calculate-percentage-change (old-value uint) (new-value uint))
  (if (is-eq old-value u0)
    0
    (let ((difference (if (> new-value old-value) 
                        (- new-value old-value) 
                        (- old-value new-value)))
          (percentage (/ (* difference u100) old-value)))
      (if (> new-value old-value) 
        (to-int percentage) 
        (- (to-int percentage))))))

;; Enhanced auction bid with analytics
(define-public (bid-dutch-auction-with-analytics (auction-id uint))
  (let ((auction (unwrap! (map-get? dutch-auctions auction-id) ERR-TOKEN-NOT-FOUND))
        (current-price (get-dutch-auction-price auction-id)))
    (begin
      (asserts! (get active auction) ERR-UNAUTHORIZED)
      (asserts! (< block-height (get end-block auction)) ERR-UNAUTHORIZED)
      (asserts! (not (is-eq tx-sender (get seller auction))) ERR-UNAUTHORIZED)
      
      ;; Track analytics
      (if (var-get analytics-enabled)
        (try! (track-trading-transaction 
          (get token-id auction) 
          current-price 
          "dutch-auction" 
          tx-sender 
          (get seller auction)))
        (ok true))
      
      ;; Transfer NFT to buyer
      (try! (nft-transfer? enhanced-nft (get token-id auction) (get seller auction) tx-sender))
      
      ;; Mark auction as inactive
      (map-set dutch-auctions auction-id (merge auction {active: false}))
      
      (print {
        notification: "dutch-auction-completed-with-analytics",
        payload: {
          auction-id: auction-id,
          token-id: (get token-id auction),
          buyer: tx-sender,
          final-price: current-price,
          analytics-tracked: (var-get analytics-enabled)
        }
      })
      
      (ok current-price))))

;; Get trading metrics for period
(define-read-only (get-trading-metrics (period uint))
  (map-get? trading-metrics period))

;; Get user behavior metrics
(define-read-only (get-user-behavior (user principal))
  (map-get? user-behavior-metrics user))

;; Get price history for token
(define-read-only (get-price-history (token-id uint))
  (map-get? price-history token-id))

;; Get market trend
(define-read-only (get-market-trend (trend-id uint))
  (map-get? market-trends trend-id))

;; Get current period metrics summary
(define-read-only (get-current-metrics-summary)
  (let ((current-period (var-get current-metrics-period)))
    (match (map-get? trading-metrics current-period)
      metrics {
        period: current-period,
        metrics: metrics,
        analytics-enabled: (var-get analytics-enabled)
      }
      {
        period: current-period,
        metrics: none,
        analytics-enabled: (var-get analytics-enabled)
      })))

;; Start new metrics period
(define-public (start-new-metrics-period)
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
    
    (let ((new-period (+ (var-get current-metrics-period) u1)))
      (begin
        (var-set current-metrics-period new-period)
        
        (print {
          notification: "new-metrics-period-started",
          payload: {
            period: new-period,
            started-at: block-height
          }
        })
        
        (ok new-period)))))

;; Toggle analytics
(define-public (set-analytics-enabled (enabled bool))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
    (var-set analytics-enabled enabled)
    
    (print {
      notification: "analytics-status-changed",
      payload: {
        enabled: enabled,
        changed-by: tx-sender
      }
    })
    
    (ok true)))
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
;; Governance and voting features
(define-map proposals uint {
  title: (string-ascii 128),
  description: (string-ascii 512),
  proposer: principal,
  created-at: uint,
  voting-ends-at: uint,
  votes-for: uint,
  votes-against: uint,
  executed: bool,
  min-tokens-required: uint
})

(define-map votes {proposal-id: uint, voter: principal} {
  vote: bool, ;; true = for, false = against
  tokens-voted: (list 50 uint),
  voted-at: uint
})

(define-data-var next-proposal-id uint u1)
(define-data-var governance-enabled bool true)
(define-data-var min-proposal-tokens uint u10) ;; Minimum tokens to create proposal

;; Create governance proposal
(define-public (create-proposal 
  (title (string-ascii 128))
  (description (string-ascii 512))
  (voting-duration uint)
  (min-tokens-required uint))
  (let ((proposal-id (var-get next-proposal-id))
        (user-tokens (get-user-token-count tx-sender)))
    (begin
      (asserts! (var-get governance-enabled) ERR-CONTRACT-PAUSED)
      (asserts! (>= user-tokens (var-get min-proposal-tokens)) ERR-UNAUTHORIZED)
      (asserts! (> voting-duration u0) ERR-INVALID-PRICE)
      
      (map-set proposals proposal-id {
        title: title,
        description: description,
        proposer: tx-sender,
        created-at: block-height,
        voting-ends-at: (+ block-height voting-duration),
        votes-for: u0,
        votes-against: u0,
        executed: false,
        min-tokens-required: min-tokens-required
      })
      
      (var-set next-proposal-id (+ proposal-id u1))
      
      (print {
        notification: "proposal-created",
        payload: {
          proposal-id: proposal-id,
          title: title,
          proposer: tx-sender,
          voting-ends-at: (+ block-height voting-duration)
        }
      })
      
      (ok proposal-id))))

;; Vote on proposal
(define-public (vote-on-proposal 
  (proposal-id uint)
  (vote bool) ;; true = for, false = against
  (token-ids (list 50 uint)))
  (let ((proposal (unwrap! (map-get? proposals proposal-id) ERR-TOKEN-NOT-FOUND))
        (voting-power (len token-ids)))
    (begin
      (asserts! (var-get governance-enabled) ERR-CONTRACT-PAUSED)
      (asserts! (< block-height (get voting-ends-at proposal)) ERR-UNAUTHORIZED)
      (asserts! (is-none (map-get? votes {proposal-id: proposal-id, voter: tx-sender})) ERR-TOKEN-EXISTS)
      (asserts! (> voting-power u0) ERR-INVALID-PRICE)
      
      ;; Validate token ownership
      (asserts! (validate-token-ownership token-ids) ERR-NOT-TOKEN-OWNER)
      
      ;; Record vote
      (map-set votes {proposal-id: proposal-id, voter: tx-sender} {
        vote: vote,
        tokens-voted: token-ids,
        voted-at: block-height
      })
      
      ;; Update proposal vote counts
      (if vote
        (map-set proposals proposal-id 
          (merge proposal {votes-for: (+ (get votes-for proposal) voting-power)}))
        (map-set proposals proposal-id 
          (merge proposal {votes-against: (+ (get votes-against proposal) voting-power)})))
      
      (print {
        notification: "vote-cast",
        payload: {
          proposal-id: proposal-id,
          voter: tx-sender,
          vote: vote,
          voting-power: voting-power
        }
      })
      
      (ok true))))

;; Validate token ownership for voting
(define-private (validate-token-ownership (token-ids (list 50 uint)))
  (fold validate-single-token-ownership token-ids true))

(define-private (validate-single-token-ownership (token-id uint) (acc bool))
  (and acc 
    (match (nft-get-owner? enhanced-nft token-id)
      owner (is-eq owner tx-sender)
      false)))

;; Execute proposal (if passed)
(define-public (execute-proposal (proposal-id uint))
  (let ((proposal (unwrap! (map-get? proposals proposal-id) ERR-TOKEN-NOT-FOUND)))
    (begin
      (asserts! (>= block-height (get voting-ends-at proposal)) ERR-UNAUTHORIZED)
      (asserts! (not (get executed proposal)) ERR-TOKEN-EXISTS)
      (asserts! (> (get votes-for proposal) (get votes-against proposal)) ERR-UNAUTHORIZED)
      (asserts! (>= (get votes-for proposal) (get min-tokens-required proposal)) ERR-UNAUTHORIZED)
      
      ;; Mark as executed
      (map-set proposals proposal-id (merge proposal {executed: true}))
      
      (print {
        notification: "proposal-executed",
        payload: {
          proposal-id: proposal-id,
          votes-for: (get votes-for proposal),
          votes-against: (get votes-against proposal)
        }
      })
      
      (ok true))))

;; Get user token count
(define-private (get-user-token-count (user principal))
  ;; Simplified - would iterate through all tokens to count ownership
  u1) ;; Placeholder

;; Get proposal info
(define-read-only (get-proposal-info (proposal-id uint))
  (map-get? proposals proposal-id))

;; Get vote info
(define-read-only (get-vote-info (proposal-id uint) (voter principal))
  (map-get? votes {proposal-id: proposal-id, voter: voter}))

;; Check if proposal is active
(define-read-only (is-proposal-active (proposal-id uint))
  (match (map-get? proposals proposal-id)
    proposal (and 
      (< block-height (get voting-ends-at proposal))
      (not (get executed proposal)))
    false))

;; Administrative functions
(define-public (set-contract-paused (paused bool))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
    (var-set contract-paused paused)
    
    (print {
      notification: "contract-pause-changed",
      payload: {
        paused: paused,
        admin: tx-sender
      }
    })
    
    (ok true)))

(define-public (set-base-uri (new-base-uri (string-ascii 256)))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
    (var-set base-uri new-base-uri)
    
    (print {
      notification: "base-uri-updated",
      payload: {
        new-base-uri: new-base-uri,
        admin: tx-sender
      }
    })
    
    (ok true)))

(define-public (set-token-uri (token-id uint) (uri (string-ascii 256)))
  (let ((metadata (unwrap! (map-get? token-metadata token-id) ERR-TOKEN-NOT-FOUND)))
    (begin
      (asserts! (or 
        (is-eq tx-sender CONTRACT-OWNER)
        (is-eq tx-sender (get creator metadata))) ERR-UNAUTHORIZED)
      
      (map-set token-uris token-id uri)
      
      (print {
        notification: "token-uri-updated",
        payload: {
          token-id: token-id,
          uri: uri,
          updated-by: tx-sender
        }
      })
      
      (ok true))))

;; Emergency functions
(define-public (emergency-transfer (token-id uint) (from principal) (to principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-OWNER-ONLY)
    (asserts! (var-get contract-paused) ERR-UNAUTHORIZED) ;; Only during pause
    
    (try! (nft-transfer? enhanced-nft token-id from to))
    
    (print {
      notification: "emergency-transfer",
      payload: {
        token-id: token-id,
        from: from,
        to: to,
        admin: tx-sender
      }
    })
    
    (ok true)))

;; Contract statistics
(define-read-only (get-contract-stats)
  {
    total-supply: (var-get total-supply),
    last-token-id: (var-get last-token-id),
    total-collections: (- (var-get next-collection-id) u1),
    total-proposals: (- (var-get next-proposal-id) u1),
    staking-pools: (- (var-get next-pool-id) u1),
    contract-paused: (var-get contract-paused),
    governance-enabled: (var-get governance-enabled)
  })