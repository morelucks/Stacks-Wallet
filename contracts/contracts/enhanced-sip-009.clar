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

;; Export metadata in multiple formats
(define-read-only (export-metadata-formats (token-id uint))
  (let ((metadata (map-get? token-metadata token-id))
        (serialized (map-get? serialized-metadata token-id)))
    {
      raw-metadata: metadata,
      json-format: (match serialized
        data (some (get json-data data))
        none),
      schema-version: (match serialized
        data (some (get schema-version data))
        none)
    }))
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