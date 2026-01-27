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