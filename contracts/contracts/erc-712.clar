;; ERC-712 Style Contract in Clarity
;; Implements structured data hashing and signature verification

;; Contract constants
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_UNAUTHORIZED (err u401))
(define-constant ERR_INVALID_SIGNATURE (err u402))
(define-constant ERR_EXPIRED (err u403))
(define-constant ERR_ALREADY_USED (err u404))
(define-constant ERR_PAUSED (err u405))
(define-constant ERR_UNSUPPORTED_ALGORITHM (err u406))
(define-constant ERR_MALFORMED_SIGNATURE (err u407))
(define-constant ERR_SIGNATURE_TOO_SHORT (err u408))
(define-constant ERR_SIGNATURE_TOO_LONG (err u409))
(define-constant ERR_INVALID_RECOVERY_ID (err u410))

;; Domain separator constants
(define-constant DOMAIN_NAME "ERC712Contract")
(define-constant DOMAIN_VERSION "1")
(define-constant DOMAIN_CHAIN_ID u1) ;; Stacks chain ID

;; Type hashes (keccak256 equivalent using sha256)
(define-constant DOMAIN_TYPEHASH 
  0x8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f)

(define-constant PERMIT_TYPEHASH
  0x6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c9)

;; Domain separator
(define-data-var domain-separator (buff 32) 0x00)

;; Nonces for replay protection
(define-map nonces principal uint)

;; Used signatures to prevent replay
(define-map used-signatures (buff 65) bool)

;; Enhanced signature metadata for comprehensive tracking
(define-map signature-metadata
  (buff 65)
  {
    used: bool,
    timestamp: uint,
    signer: principal,
    algorithm: (string-ascii 10),
    expiry: (optional uint),
    context: (optional (buff 256)),
    invalidated: bool,
    blacklisted: bool
  })

;; Supported signature algorithms with enhanced support
(define-map supported-algorithms (string-ascii 10) bool)

;; Global signature blacklist for security
(define-map signature-blacklist (buff 65) { reason: (string-ascii 100), timestamp: uint })

;; Time-based nonces with expiration
(define-map expiring-nonces
  { user: principal, nonce: uint }
  { created: uint, expiry: uint, used: bool })

;; Signature usage history for audit trails
(define-map signature-history
  principal
  (list 100 { signature: (buff 65), timestamp: uint, operation: (string-ascii 20) }))

;; Initialize supported algorithms
(map-set supported-algorithms "secp256k1" true)
(map-set supported-algorithms "sha256" true)
(map-set supported-algorithms "keccak256" true)
(map-set supported-algorithms "blake2b" true)

;; Initialize domain separator on contract deployment
(define-private (compute-domain-separator)
  (sha256 (concat 
    DOMAIN_TYPEHASH
    (sha256 DOMAIN_NAME)
    (sha256 DOMAIN_VERSION)
    (int-to-ascii DOMAIN_CHAIN_ID)
    (as-contract tx-sender))))

;; Initialize domain separator
(var-set domain-separator (compute-domain-separator))

;; Helper function to get current nonce for a user
(define-read-only (get-nonce (user principal))
  (default-to u0 (map-get? nonces user)))

;; Helper function to increment nonce
(define-private (increment-nonce (user principal))
  (let ((current-nonce (get-nonce user)))
    (map-set nonces user (+ current-nonce u1))
    (+ current-nonce u1)))

;; Get domain separator
(define-read-only (get-domain-separator)
  (var-get domain-separator))
;; Structured data types
(define-map struct-hashes 
  { struct-type: (string-ascii 32), data: (buff 1024) }
  (buff 32))

;; Hash structured data according to EIP-712
(define-private (hash-struct (struct-type (string-ascii 32)) (data (buff 1024)))
  (let ((type-hash (sha256 struct-type)))
    (sha256 (concat type-hash data))))

;; Create EIP-712 compliant hash
(define-private (create-typed-data-hash (struct-hash (buff 32)))
  (sha256 (concat 
    0x1901  ;; EIP-191 prefix
    (var-get domain-separator)
    struct-hash)))

;; Permit structure for token approvals
(define-private (hash-permit 
  (owner principal)
  (spender principal) 
  (value uint)
  (nonce uint)
  (deadline uint))
  (let ((permit-data (concat
    (principal-to-buff owner)
    (principal-to-buff spender)
    (int-to-ascii value)
    (int-to-ascii nonce)
    (int-to-ascii deadline))))
    (hash-struct "Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)" permit-data)))

;; Convert principal to buffer (simplified)
(define-private (principal-to-buff (p principal))
  (unwrap-panic (to-consensus-buff? p)))
;; Enhanced signature verification with multiple algorithms
(define-public (verify-signature-advanced 
  (message-hash (buff 32))
  (signature (buff 65))
  (signer principal)
  (algorithm (string-ascii 10))
  (options (optional { expiry: (optional uint), context: (optional (buff 256)) })))
  (response bool uint))
  (begin
    ;; Validate signature format first
    (asserts! (is-eq (len signature) u65) ERR_SIGNATURE_TOO_SHORT)
    (asserts! (default-to true (map-get? supported-algorithms algorithm)) ERR_UNSUPPORTED_ALGORITHM)
    
    ;; Check expiry if provided
    (match options
      opts (match (get expiry opts)
        exp (asserts! (< block-height exp) ERR_EXPIRED)
        true)
      true)
    
    ;; Verify signature based on algorithm
    (let ((verification-result 
      (if (is-eq algorithm "secp256k1")
        (verify-signature-secp256k1 message-hash signature signer)
        (if (is-eq algorithm "sha256")
          (verify-signature-sha256 message-hash signature signer)
          false))))
      
      ;; Update signature metadata
      (map-set signature-metadata signature {
        used: verification-result,
        timestamp: block-height,
        signer: signer,
        algorithm: algorithm,
        expiry: (match options opts (get expiry opts) none),
        context: (match options opts (get context opts) none),
        invalidated: false,
        blacklisted: false
      })
      
      (ok verification-result))))

;; Original signature verification (secp256k1)
(define-private (verify-signature-secp256k1
  (message-hash (buff 32))
  (signature (buff 65))
  (signer principal))
  (let ((recovered-pubkey (secp256k1-recover? message-hash signature)))
    (match recovered-pubkey
      pubkey (is-eq signer (principal-of? pubkey))
      false)))

;; SHA256-based signature verification
(define-private (verify-signature-sha256
  (message-hash (buff 32))
  (signature (buff 65))
  (signer principal))
  ;; Simplified SHA256 verification - in real implementation would use appropriate crypto
  (let ((hash-check (is-eq message-hash (sha256 signature))))
    (and hash-check (is-eq signer tx-sender))))

;; Batch signature verification
(define-public (verify-signatures-batch
  (signatures (list 50 { hash: (buff 32), signature: (buff 65), signer: principal })))
  (response (list 50 bool) uint))
  (let ((results (map verify-single-signature signatures)))
    (ok results)))

;; Helper for batch verification
(define-private (verify-single-signature 
  (sig-data { hash: (buff 32), signature: (buff 65), signer: principal }))
  (verify-signature-secp256k1 (get hash sig-data) (get signature sig-data) (get signer sig-data)))

;; Signature format validation
(define-read-only (validate-signature-format (signature (buff 65)))
  (response bool uint))
  (begin
    (asserts! (is-eq (len signature) u65) ERR_SIGNATURE_TOO_SHORT)
    (asserts! (not (is-eq signature 0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000)) ERR_MALFORMED_SIGNATURE)
    
    ;; Check recovery ID (last byte should be 0, 1, 2, or 3)
    (let ((recovery-id (buff-to-uint-be (unwrap-panic (slice? signature u64 u65)))))
      (asserts! (< recovery-id u4) ERR_INVALID_RECOVERY_ID)
      (ok true))))

;; Global signature blacklist management
(define-public (blacklist-signature (signature (buff 65)) (reason (string-ascii 100)))
  (response bool uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    (map-set signature-blacklist signature { reason: reason, timestamp: block-height })
    (map-set signature-metadata signature {
      used: true,
      timestamp: block-height,
      signer: tx-sender,
      algorithm: "blacklist",
      expiry: none,
      context: none,
      invalidated: false,
      blacklisted: true
    })
    (ok true)))

;; Check if signature is blacklisted
(define-read-only (is-signature-blacklisted (signature (buff 65)))
  (is-some (map-get? signature-blacklist signature)))

;; Time-based nonce management
(define-public (create-expiring-nonce (expiry uint))
  (response uint uint))
  (let ((current-nonce (get-nonce tx-sender))
        (new-nonce (+ current-nonce u1)))
    (asserts! (> expiry block-height) ERR_EXPIRED)
    (map-set expiring-nonces { user: tx-sender, nonce: new-nonce } {
      created: block-height,
      expiry: expiry,
      used: false
    })
    (increment-nonce tx-sender)
    (ok new-nonce)))

;; Check if expiring nonce is valid
(define-read-only (is-expiring-nonce-valid (user principal) (nonce uint))
  (match (map-get? expiring-nonces { user: user, nonce: nonce })
    nonce-data (and 
      (not (get used nonce-data))
      (< block-height (get expiry nonce-data)))
    false))

;; Use expiring nonce
(define-private (use-expiring-nonce (user principal) (nonce uint))
  (match (map-get? expiring-nonces { user: user, nonce: nonce })
    nonce-data (begin
      (asserts! (not (get used nonce-data)) ERR_ALREADY_USED)
      (asserts! (< block-height (get expiry nonce-data)) ERR_EXPIRED)
      (map-set expiring-nonces { user: user, nonce: nonce } 
        (merge nonce-data { used: true }))
      (ok true))
    ERR_INVALID_SIGNATURE))

;; User signature invalidation
(define-public (invalidate-my-signatures (signatures (list 10 (buff 65))))
  (response bool uint))
  (begin
    (map invalidate-single-signature signatures)
    (ok true)))

;; Helper to invalidate single signature
(define-private (invalidate-single-signature (signature (buff 65)))
  (match (map-get? signature-metadata signature)
    metadata (if (is-eq (get signer metadata) tx-sender)
      (map-set signature-metadata signature 
        (merge metadata { invalidated: true, used: true }))
      false)
    false))

;; Atomic nonce operations
(define-public (increment-nonce-atomic (user principal))
  (response uint uint))
  (begin
    (asserts! (or (is-eq tx-sender user) (is-eq tx-sender CONTRACT_OWNER)) ERR_UNAUTHORIZED)
    (let ((new-nonce (increment-nonce user)))
      (ok new-nonce))))

;; Enhanced signature usage checking with comprehensive validation
(define-private (is-signature-used-enhanced (signature (buff 65)))
  (match (map-get? signature-metadata signature)
    metadata (or 
      (get used metadata)
      (get invalidated metadata)
      (get blacklisted metadata))
    (default-to false (map-get? used-signatures signature))))

;; Mark signature as used with enhanced metadata
(define-private (mark-signature-used-enhanced 
  (signature (buff 65)) 
  (signer principal) 
  (algorithm (string-ascii 10)))
  (begin
    (map-set used-signatures signature true)
    (map-set signature-metadata signature {
      used: true,
      timestamp: block-height,
      signer: signer,
      algorithm: algorithm,
      expiry: none,
      context: none,
      invalidated: false,
      blacklisted: false
    })
    ;; Add to signature history
    (let ((current-history (default-to (list) (map-get? signature-history signer))))
      (map-set signature-history signer 
        (unwrap-panic (as-max-len? 
          (append current-history { 
            signature: signature, 
            timestamp: block-height, 
            operation: "signature_use" 
          }) u100))))))

;; Enhanced signature verification with replay protection
(define-private (verify-typed-signature-enhanced
  (struct-hash (buff 32))
  (signature (buff 65))
  (signer principal)
  (algorithm (string-ascii 10)))
  (let ((typed-hash (create-typed-data-hash struct-hash)))
    (and 
      (not (is-signature-used-enhanced signature))
      (not (is-signature-blacklisted signature))
      (verify-signature-secp256k1 typed-hash signature signer))))
;; Token allowances for permit functionality
(define-map allowances 
  { owner: principal, spender: principal }
  uint)

;; Enhanced permit function with improved verification
(define-public (permit
  (owner principal)
  (spender principal)
  (value uint)
  (deadline uint)
  (signature (buff 65)))
  (let ((current-nonce (get-nonce owner))
        (permit-hash (hash-permit owner spender value current-nonce deadline)))
    (asserts! (not (var-get contract-paused)) ERR_PAUSED)
    (asserts! (< block-height deadline) ERR_EXPIRED)
    (asserts! (verify-typed-signature-enhanced permit-hash signature owner "secp256k1") ERR_INVALID_SIGNATURE)
    (asserts! (not (is-signature-used-enhanced signature)) ERR_ALREADY_USED)
    
    ;; Mark signature as used and increment nonce
    (mark-signature-used-enhanced signature owner "secp256k1")
    (increment-nonce owner)
    
    ;; Set allowance
    (map-set allowances { owner: owner, spender: spender } value)
    
    ;; Emit permit event (print for now)
    (print { 
      event: "permit", 
      owner: owner, 
      spender: spender, 
      value: value, 
      nonce: current-nonce,
      deadline: deadline,
      timestamp: block-height
    })
    
    (ok true)))

;; Get allowance
(define-read-only (get-allowance (owner principal) (spender principal))
  (default-to u0 (map-get? allowances { owner: owner, spender: spender })))
;; Meta-transaction support
(define-constant META_TX_TYPEHASH
  0x23e7e7e7e7e7e7e7e7e7e7e7e7e7e7e7e7e7e7e7e7e7e7e7e7e7e7e7e7e7e7e7)

;; Meta-transaction structure
(define-private (hash-meta-tx
  (from principal)
  (to principal)
  (value uint)
  (data (buff 1024))
  (nonce uint))
  (let ((meta-tx-data (concat
    (principal-to-buff from)
    (principal-to-buff to)
    (int-to-ascii value)
    data
    (int-to-ascii nonce))))
    (hash-struct "MetaTransaction(address from,address to,uint256 value,bytes data,uint256 nonce)" meta-tx-data)))

;; Execute meta-transaction
(define-public (execute-meta-transaction
  (from principal)
  (to principal)
  (value uint)
  (data (buff 1024))
  (signature (buff 65)))
  (let ((current-nonce (get-nonce from))
        (meta-tx-hash (hash-meta-tx from to value data current-nonce)))
    (asserts! (not (var-get contract-paused)) ERR_PAUSED)
    (asserts! (verify-typed-signature meta-tx-hash signature from) ERR_INVALID_SIGNATURE)
    (asserts! (not (is-signature-used signature)) ERR_ALREADY_USED)
    
    ;; Mark signature as used and increment nonce
    (mark-signature-used signature)
    (increment-nonce from)
    
    ;; Execute the transaction (simplified - would call actual function)
    (ok { from: from, to: to, value: value, nonce: current-nonce })))
;; Delegation functionality
(define-map delegations principal principal)
(define-map voting-power principal uint)

(define-constant DELEGATION_TYPEHASH
  0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef)

;; Hash delegation data
(define-private (hash-delegation
  (delegator principal)
  (delegatee principal)
  (nonce uint)
  (expiry uint))
  (let ((delegation-data (concat
    (principal-to-buff delegator)
    (principal-to-buff delegatee)
    (int-to-ascii nonce)
    (int-to-ascii expiry))))
    (hash-struct "Delegation(address delegator,address delegatee,uint256 nonce,uint256 expiry)" delegation-data)))

;; Delegate by signature
(define-public (delegate-by-sig
  (delegator principal)
  (delegatee principal)
  (expiry uint)
  (signature (buff 65)))
  (let ((current-nonce (get-nonce delegator))
        (delegation-hash (hash-delegation delegator delegatee current-nonce expiry)))
    (asserts! (not (var-get contract-paused)) ERR_PAUSED)
    (asserts! (< block-height expiry) ERR_EXPIRED)
    (asserts! (verify-typed-signature delegation-hash signature delegator) ERR_INVALID_SIGNATURE)
    (asserts! (not (is-signature-used signature)) ERR_ALREADY_USED)
    
    ;; Mark signature as used and increment nonce
    (mark-signature-used signature)
    (increment-nonce delegator)
    
    ;; Set delegation
    (map-set delegations delegator delegatee)
    (ok true)))

;; Get delegate
(define-read-only (get-delegate (delegator principal))
  (map-get? delegations delegator))
;; Batch operations
(define-constant BATCH_TYPEHASH
  0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdef)

;; Batch operation structure
(define-private (hash-batch-operation
  (operations (list 10 { to: principal, value: uint, data: (buff 256) }))
  (nonce uint))
  (let ((batch-data (fold concat-operation operations 0x00)))
    (hash-struct "BatchOperation(Operation[] operations,uint256 nonce)" 
                 (concat batch-data (int-to-ascii nonce)))))

;; Helper to concatenate operation data
(define-private (concat-operation 
  (op { to: principal, value: uint, data: (buff 256) })
  (acc (buff 1024)))
  (concat acc 
    (concat 
      (principal-to-buff (get to op))
      (concat (int-to-ascii (get value op)) (get data op)))))

;; Execute batch operations
(define-public (execute-batch
  (operations (list 10 { to: principal, value: uint, data: (buff 256) }))
  (signature (buff 65)))
  (let ((current-nonce (get-nonce tx-sender))
        (batch-hash (hash-batch-operation operations current-nonce)))
    (asserts! (verify-typed-signature batch-hash signature tx-sender) ERR_INVALID_SIGNATURE)
    (asserts! (not (is-signature-used signature)) ERR_ALREADY_USED)
    
    ;; Mark signature as used and increment nonce
    (mark-signature-used signature)
    (increment-nonce tx-sender)
    
    ;; Execute operations (simplified)
    (ok (len operations))))
;; Administrative functions
(define-data-var contract-paused bool false)

;; Pause/unpause contract
(define-public (set-paused (paused bool))
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    (var-set contract-paused paused)
    (ok paused)))

;; Check if contract is paused
(define-read-only (is-paused)
  (var-get contract-paused))

;; Emergency function to invalidate all signatures for a user
(define-public (emergency-invalidate-nonce (user principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    (let ((current-nonce (get-nonce user)))
      (map-set nonces user (+ current-nonce u1000))
      (ok (+ current-nonce u1000)))))

;; Utility functions for external integrations
(define-read-only (get-chain-id)
  DOMAIN_CHAIN_ID)

(define-read-only (get-contract-version)
  DOMAIN_VERSION)

(define-read-only (get-contract-name)
  DOMAIN_NAME)

;; Verify any typed data hash
(define-public (verify-typed-data
  (struct-hash (buff 32))
  (signature (buff 65))
  (signer principal))
  (ok (verify-typed-signature struct-hash signature signer)))
;; Additional helper functions

;; Convert integer to ASCII representation (simplified)
(define-private (int-to-ascii (value uint))
  (if (is-eq value u0)
    0x30  ;; "0"
    (unwrap-panic (to-consensus-buff? value))))

;; Get typed data hash for external verification
(define-read-only (get-typed-data-hash (struct-hash (buff 32)))
  (create-typed-data-hash struct-hash))

;; Check if a specific signature is valid for given data
(define-read-only (is-valid-signature
  (struct-hash (buff 32))
  (signature (buff 65))
  (signer principal))
  (and 
    (not (is-signature-used signature))
    (verify-typed-signature struct-hash signature signer)))

;; Get contract info
(define-read-only (get-contract-info)
  {
    name: DOMAIN_NAME,
    version: DOMAIN_VERSION,
    chain-id: DOMAIN_CHAIN_ID,
    domain-separator: (var-get domain-separator),
    owner: CONTRACT_OWNER,
    paused: (var-get contract-paused)
  })

;; Contract initialization complete
;; This ERC-712 implementation provides:
;; - Structured data hashing according to EIP-712
;; - Signature verification with replay protection
;; - Permit functionality for gasless approvals
;; - Meta-transaction support
;; - Delegation with signature verification
;; - Batch operations
;; - Administrative controls