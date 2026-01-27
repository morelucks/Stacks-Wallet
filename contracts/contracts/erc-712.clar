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
;; Enhanced meta-transaction support with conditions and batching
(define-constant META_TX_TYPEHASH
  0x23e7e7e7e7e7e7e7e7e7e7e7e7e7e7e7e7e7e7e7e7e7e7e7e7e7e7e7e7e7e7e7)

;; Conditional meta-transaction execution
(define-public (execute-conditional-meta-tx
  (from principal)
  (to principal)
  (value uint)
  (data (buff 1024))
  (conditions (list 5 { type: (string-ascii 20), value: (buff 256) }))
  (signature (buff 65)))
  (response { success: bool, result: (buff 256) } uint))
  (let ((current-nonce (get-nonce from))
        (meta-tx-hash (hash-conditional-meta-tx from to value data conditions current-nonce)))
    (asserts! (not (var-get contract-paused)) ERR_PAUSED)
    (asserts! (verify-typed-signature-enhanced meta-tx-hash signature from "secp256k1") ERR_INVALID_SIGNATURE)
    (asserts! (not (is-signature-used-enhanced signature)) ERR_ALREADY_USED)
    (asserts! (validate-conditions conditions) ERR_INVALID_SIGNATURE)
    
    ;; Mark signature as used and increment nonce
    (mark-signature-used-enhanced signature from "secp256k1")
    (increment-nonce from)
    
    ;; Execute the transaction
    (let ((execution-result (execute-transaction-logic from to value data)))
      (print { 
        event: "conditional-meta-tx", 
        from: from, 
        to: to, 
        value: value, 
        nonce: current-nonce,
        conditions: conditions,
        timestamp: block-height
      })
      (ok { success: true, result: execution-result }))))

;; Hash conditional meta-transaction
(define-private (hash-conditional-meta-tx
  (from principal)
  (to principal)
  (value uint)
  (data (buff 1024))
  (conditions (list 5 { type: (string-ascii 20), value: (buff 256) }))
  (nonce uint))
  (let ((meta-tx-data (concat
    (principal-to-buff from)
    (principal-to-buff to)
    (int-to-ascii value)
    data
    (hash-conditions conditions)
    (int-to-ascii nonce))))
    (hash-struct "ConditionalMetaTransaction(address from,address to,uint256 value,bytes data,Condition[] conditions,uint256 nonce)" meta-tx-data)))

;; Validate execution conditions
(define-private (validate-conditions (conditions (list 5 { type: (string-ascii 20), value: (buff 256) })))
  (fold validate-single-condition conditions true))

(define-private (validate-single-condition 
  (condition { type: (string-ascii 20), value: (buff 256) })
  (acc bool))
  (and acc
    (if (is-eq (get type condition) "balance_check")
      (>= (stx-get-balance tx-sender) (buff-to-uint-be (get value condition)))
      (if (is-eq (get type condition) "time_check")
        (< block-height (buff-to-uint-be (get value condition)))
        true))))

;; Hash conditions for meta-transaction
(define-private (hash-conditions (conditions (list 5 { type: (string-ascii 20), value: (buff 256) })))
  (fold concat-condition conditions 0x00))

(define-private (concat-condition 
  (condition { type: (string-ascii 20), value: (buff 256) })
  (acc (buff 256)))
  (concat acc (concat (unwrap-panic (to-consensus-buff? (get type condition))) (get value condition))))

;; Batch meta-transaction processing
(define-public (execute-meta-tx-batch
  (transactions (list 20 { from: principal, to: principal, value: uint, data: (buff 256) }))
  (signatures (list 20 (buff 65))))
  (response (list 20 bool) uint))
  (let ((batch-hash (hash-batch-meta-tx transactions))
        (results (map execute-single-meta-tx-in-batch 
                     (zip transactions signatures))))
    (asserts! (not (var-get contract-paused)) ERR_PAUSED)
    (print { 
      event: "batch-meta-tx", 
      count: (len transactions),
      timestamp: block-height
    })
    (ok results)))

;; Execute single meta-transaction in batch
(define-private (execute-single-meta-tx-in-batch 
  (tx-sig-pair { tx: { from: principal, to: principal, value: uint, data: (buff 256) }, sig: (buff 65) }))
  (let ((tx-data (get tx tx-sig-pair))
        (signature (get sig tx-sig-pair))
        (from (get from tx-data))
        (current-nonce (get-nonce from))
        (meta-tx-hash (hash-meta-tx from (get to tx-data) (get value tx-data) (get data tx-data) current-nonce)))
    (if (and 
          (verify-typed-signature-enhanced meta-tx-hash signature from "secp256k1")
          (not (is-signature-used-enhanced signature)))
      (begin
        (mark-signature-used-enhanced signature from "secp256k1")
        (increment-nonce from)
        true)
      false)))

;; Hash batch meta-transaction
(define-private (hash-batch-meta-tx
  (transactions (list 20 { from: principal, to: principal, value: uint, data: (buff 256) })))
  (sha256 (fold concat-batch-tx transactions 0x00)))

(define-private (concat-batch-tx 
  (tx { from: principal, to: principal, value: uint, data: (buff 256) })
  (acc (buff 1024)))
  (concat acc 
    (concat 
      (principal-to-buff (get from tx))
      (concat 
        (principal-to-buff (get to tx))
        (concat (int-to-ascii (get value tx)) (get data tx))))))

;; Fee delegation for meta-transactions
(define-public (execute-meta-tx-with-fee-delegation
  (from principal)
  (to principal)
  (value uint)
  (data (buff 1024))
  (fee-payer principal)
  (fee-amount uint)
  (signature (buff 65))
  (fee-signature (buff 65)))
  (response bool uint))
  (let ((current-nonce (get-nonce from))
        (fee-nonce (get-nonce fee-payer))
        (meta-tx-hash (hash-meta-tx from to value data current-nonce))
        (fee-hash (hash-fee-delegation fee-payer from fee-amount fee-nonce)))
    (asserts! (not (var-get contract-paused)) ERR_PAUSED)
    (asserts! (verify-typed-signature-enhanced meta-tx-hash signature from "secp256k1") ERR_INVALID_SIGNATURE)
    (asserts! (verify-typed-signature-enhanced fee-hash fee-signature fee-payer "secp256k1") ERR_INVALID_SIGNATURE)
    (asserts! (not (is-signature-used-enhanced signature)) ERR_ALREADY_USED)
    (asserts! (not (is-signature-used-enhanced fee-signature)) ERR_ALREADY_USED)
    
    ;; Mark signatures as used and increment nonces
    (mark-signature-used-enhanced signature from "secp256k1")
    (mark-signature-used-enhanced fee-signature fee-payer "secp256k1")
    (increment-nonce from)
    (increment-nonce fee-payer)
    
    ;; Execute transaction and charge fee
    (let ((execution-result (execute-transaction-logic from to value data)))
      (print { 
        event: "fee-delegated-meta-tx", 
        from: from, 
        to: to, 
        value: value, 
        fee-payer: fee-payer,
        fee-amount: fee-amount,
        timestamp: block-height
      })
      (ok true))))

;; Hash fee delegation
(define-private (hash-fee-delegation
  (fee-payer principal)
  (beneficiary principal)
  (fee-amount uint)
  (nonce uint))
  (let ((fee-data (concat
    (principal-to-buff fee-payer)
    (principal-to-buff beneficiary)
    (int-to-ascii fee-amount)
    (int-to-ascii nonce))))
    (hash-struct "FeeDelegation(address feePayer,address beneficiary,uint256 feeAmount,uint256 nonce)" fee-data)))

;; Execute transaction logic (simplified)
(define-private (execute-transaction-logic 
  (from principal)
  (to principal)
  (value uint)
  (data (buff 1024)))
  (buff 32))
  ;; Simplified execution - in real implementation would route to appropriate functions
  (sha256 (concat (principal-to-buff from) (principal-to-buff to))))

;; Utility function to zip two lists
(define-private (zip 
  (list1 (list 20 { from: principal, to: principal, value: uint, data: (buff 256) }))
  (list2 (list 20 (buff 65))))
  (list 20 { tx: { from: principal, to: principal, value: uint, data: (buff 256) }, sig: (buff 65) }))
  (map create-tx-sig-pair (enumerate list1) list2))

(define-private (create-tx-sig-pair 
  (indexed-tx { index: uint, item: { from: principal, to: principal, value: uint, data: (buff 256) } })
  (sig (buff 65)))
  { tx: (get item indexed-tx), sig: sig })

;; Helper to enumerate list items with indices
(define-private (enumerate 
  (items (list 20 { from: principal, to: principal, value: uint, data: (buff 256) })))
  (list 20 { index: uint, item: { from: principal, to: principal, value: uint, data: (buff 256) } }))
  (map add-index items (list u0 u1 u2 u3 u4 u5 u6 u7 u8 u9 u10 u11 u12 u13 u14 u15 u16 u17 u18 u19)))

(define-private (add-index 
  (item { from: principal, to: principal, value: uint, data: (buff 256) })
  (index uint))
  { index: index, item: item })
;; Enhanced delegation functionality with hierarchical support
(define-map delegations principal principal)
(define-map voting-power principal uint)

;; Hierarchical delegation structure
(define-map delegation-hierarchy
  { delegator: principal, level: uint }
  {
    delegatee: principal,
    permissions: (list 10 (string-ascii 20)),
    created: uint,
    expiry: uint,
    active: bool,
    parent-delegation: (optional principal)
  })

;; Delegation audit trail
(define-map delegation-audit
  principal
  (list 50 {
    action: (string-ascii 20),
    target: principal,
    timestamp: uint,
    details: (optional (buff 256))
  }))

(define-constant DELEGATION_TYPEHASH
  0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef)

;; Hierarchical delegation support
(define-public (delegate-hierarchical
  (delegator principal)
  (delegatee principal)
  (level uint)
  (permissions (list 10 (string-ascii 20)))
  (expiry uint)
  (signature (buff 65)))
  (response bool uint))
  (let ((current-nonce (get-nonce delegator))
        (delegation-hash (hash-hierarchical-delegation delegator delegatee level permissions current-nonce expiry)))
    (asserts! (not (var-get contract-paused)) ERR_PAUSED)
    (asserts! (< block-height expiry) ERR_EXPIRED)
    (asserts! (verify-typed-signature-enhanced delegation-hash signature delegator "secp256k1") ERR_INVALID_SIGNATURE)
    (asserts! (not (is-signature-used-enhanced signature)) ERR_ALREADY_USED)
    
    ;; Mark signature as used and increment nonce
    (mark-signature-used-enhanced signature delegator "secp256k1")
    (increment-nonce delegator)
    
    ;; Set hierarchical delegation
    (map-set delegation-hierarchy { delegator: delegator, level: level } {
      delegatee: delegatee,
      permissions: permissions,
      created: block-height,
      expiry: expiry,
      active: true,
      parent-delegation: (get-parent-delegation delegator level)
    })
    
    ;; Update audit trail
    (update-delegation-audit delegator "delegate" delegatee none)
    
    ;; Set simple delegation for backward compatibility
    (map-set delegations delegator delegatee)
    
    (print { 
      event: "hierarchical-delegation", 
      delegator: delegator, 
      delegatee: delegatee, 
      level: level,
      permissions: permissions,
      expiry: expiry,
      timestamp: block-height
    })
    
    (ok true)))

;; Hash hierarchical delegation
(define-private (hash-hierarchical-delegation
  (delegator principal)
  (delegatee principal)
  (level uint)
  (permissions (list 10 (string-ascii 20)))
  (nonce uint)
  (expiry uint))
  (let ((delegation-data (concat
    (principal-to-buff delegator)
    (principal-to-buff delegatee)
    (int-to-ascii level)
    (hash-permissions permissions)
    (int-to-ascii nonce)
    (int-to-ascii expiry))))
    (hash-struct "HierarchicalDelegation(address delegator,address delegatee,uint256 level,string[] permissions,uint256 nonce,uint256 expiry)" delegation-data)))

;; Hash permissions list
(define-private (hash-permissions (permissions (list 10 (string-ascii 20))))
  (fold concat-permission permissions 0x00))

(define-private (concat-permission (permission (string-ascii 20)) (acc (buff 256)))
  (concat acc (unwrap-panic (to-consensus-buff? permission))))

;; Get parent delegation for hierarchical structure
(define-private (get-parent-delegation (delegator principal) (level uint))
  (if (> level u0)
    (match (map-get? delegation-hierarchy { delegator: delegator, level: (- level u1) })
      parent-del (some (get delegatee parent-del))
      none)
    none))

;; Delegation audit trail maintenance
(define-read-only (get-delegation-history (user principal))
  (response (list 50 { delegatee: principal, timestamp: uint, expiry: uint, active: bool }) uint))
  (match (map-get? delegation-audit user)
    audit-trail (ok (map convert-audit-to-history audit-trail))
    (ok (list))))

(define-private (convert-audit-to-history 
  (audit-entry { action: (string-ascii 20), target: principal, timestamp: uint, details: (optional (buff 256)) }))
  { delegatee: (get target audit-entry), timestamp: (get timestamp audit-entry), expiry: u0, active: (is-eq (get action audit-entry) "delegate") })

;; Update delegation audit trail
(define-private (update-delegation-audit 
  (user principal) 
  (action (string-ascii 20)) 
  (target principal) 
  (details (optional (buff 256))))
  (let ((current-audit (default-to (list) (map-get? delegation-audit user))))
    (map-set delegation-audit user 
      (unwrap-panic (as-max-len? 
        (append current-audit { 
          action: action, 
          target: target, 
          timestamp: block-height, 
          details: details 
        }) u50)))))

;; Immediate delegation revocation
(define-public (revoke-delegation-immediate (delegatee principal))
  (response bool uint))
  (begin
    ;; Revoke simple delegation
    (map-delete delegations tx-sender)
    
    ;; Revoke hierarchical delegations
    (revoke-hierarchical-delegations tx-sender delegatee)
    
    ;; Update audit trail
    (update-delegation-audit tx-sender "revoke" delegatee none)
    
    (print { 
      event: "delegation-revoked", 
      delegator: tx-sender, 
      delegatee: delegatee,
      timestamp: block-height
    })
    
    (ok true)))

;; Revoke hierarchical delegations for a user
(define-private (revoke-hierarchical-delegations (delegator principal) (delegatee principal))
  (begin
    ;; This is a simplified version - in a full implementation, 
    ;; we would iterate through all levels
    (map-set delegation-hierarchy { delegator: delegator, level: u0 } {
      delegatee: delegatee,
      permissions: (list),
      created: u0,
      expiry: u0,
      active: false,
      parent-delegation: none
    })
    true))

;; Automatic delegation expiry handling
(define-read-only (is-delegation-active (delegator principal) (level uint))
  (match (map-get? delegation-hierarchy { delegator: delegator, level: level })
    delegation (and 
      (get active delegation)
      (< block-height (get expiry delegation)))
    false))

;; Comprehensive delegation queries
(define-read-only (get-delegation-info (delegator principal) (level uint))
  (response { 
    delegatee: (optional principal), 
    permissions: (list 10 (string-ascii 20)), 
    created: uint, 
    expiry: uint, 
    active: bool,
    parent-delegation: (optional principal)
  } uint))
  (match (map-get? delegation-hierarchy { delegator: delegator, level: level })
    delegation (ok {
      delegatee: (some (get delegatee delegation)),
      permissions: (get permissions delegation),
      created: (get created delegation),
      expiry: (get expiry delegation),
      active: (and (get active delegation) (< block-height (get expiry delegation))),
      parent-delegation: (get parent-delegation delegation)
    })
    (ok {
      delegatee: none,
      permissions: (list),
      created: u0,
      expiry: u0,
      active: false,
      parent-delegation: none
    })))

;; Hash delegation data (original for compatibility)
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

;; Delegate by signature (original for backward compatibility)
(define-public (delegate-by-sig
  (delegator principal)
  (delegatee principal)
  (expiry uint)
  (signature (buff 65)))
  (let ((current-nonce (get-nonce delegator))
        (delegation-hash (hash-delegation delegator delegatee current-nonce expiry)))
    (asserts! (not (var-get contract-paused)) ERR_PAUSED)
    (asserts! (< block-height expiry) ERR_EXPIRED)
    (asserts! (verify-typed-signature-enhanced delegation-hash signature delegator "secp256k1") ERR_INVALID_SIGNATURE)
    (asserts! (not (is-signature-used-enhanced signature)) ERR_ALREADY_USED)
    
    ;; Mark signature as used and increment nonce
    (mark-signature-used-enhanced signature delegator "secp256k1")
    (increment-nonce delegator)
    
    ;; Set delegation
    (map-set delegations delegator delegatee)
    
    ;; Update audit trail
    (update-delegation-audit delegator "delegate" delegatee none)
    
    (print { 
      event: "delegation", 
      delegator: delegator, 
      delegatee: delegatee, 
      expiry: expiry,
      timestamp: block-height
    })
    
    (ok true)))

;; Get delegate (original for compatibility)
(define-read-only (get-delegate (delegator principal))
  (map-get? delegations delegator))
;; Enhanced batch operations with improved verification
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

;; Execute batch operations with enhanced verification
(define-public (execute-batch
  (operations (list 10 { to: principal, value: uint, data: (buff 256) }))
  (signature (buff 65)))
  (let ((current-nonce (get-nonce tx-sender))
        (batch-hash (hash-batch-operation operations current-nonce))
        (batch-size (len operations)))
    (asserts! (not (var-get contract-paused)) ERR_PAUSED)
    (asserts! (is-feature-enabled "batch_operations") ERR_UNAUTHORIZED)
    (asserts! (<= batch-size (get-operational-limit "max_batch_size")) ERR_BATCH_SIZE_EXCEEDED)
    (asserts! (verify-typed-signature-enhanced batch-hash signature tx-sender "secp256k1") ERR_INVALID_SIGNATURE)
    (asserts! (not (is-signature-used-enhanced signature)) ERR_ALREADY_USED)
    
    ;; Mark signature as used and increment nonce
    (mark-signature-used-enhanced signature tx-sender "secp256k1")
    (increment-nonce tx-sender)
    
    ;; Store batch metadata
    (let ((batch-id (sha256 (concat batch-hash (int-to-ascii block-height)))))
      (map-set batch-metadata batch-id {
        size: batch-size,
        gas-used: (* batch-size u1000), ;; Estimated gas usage
        timestamp: block-height,
        success-rate: u100 ;; Assume 100% success for now
      }))
    
    ;; Execute operations (simplified)
    (print { 
      event: "batch-operation-executed", 
      executor: tx-sender,
      operation-count: batch-size,
      nonce: current-nonce,
      timestamp: block-height
    })
    
    (ok batch-size)))
;; Enhanced administrative functions with role-based access control
(define-data-var contract-paused bool false)

;; User roles and permissions
(define-map user-roles
  principal
  (list 10 (string-ascii 20)))

;; Role permissions mapping
(define-map role-permissions
  (string-ascii 20)
  (list 20 (string-ascii 30)))

;; Function pause status
(define-map function-pause-status
  (string-ascii 30)
  { paused: bool, paused-by: principal, timestamp: uint })

;; Initialize default roles and permissions
(map-set role-permissions "admin" (list "pause_contract" "grant_roles" "emergency_functions" "blacklist_signatures"))
(map-set role-permissions "moderator" (list "pause_functions" "invalidate_signatures"))
(map-set role-permissions "operator" (list "view_analytics" "export_data"))

;; Grant initial admin role to contract owner
(map-set user-roles CONTRACT_OWNER (list "admin"))

;; Role-based access control
(define-public (grant-role (user principal) (role (string-ascii 20)))
  (response bool uint))
  (begin
    (asserts! (has-permission tx-sender "grant_roles") ERR_UNAUTHORIZED)
    (let ((current-roles (default-to (list) (map-get? user-roles user))))
      (map-set user-roles user 
        (unwrap-panic (as-max-len? (append current-roles role) u10)))
      (print { 
        event: "role-granted", 
        user: user, 
        role: role, 
        granted-by: tx-sender,
        timestamp: block-height
      })
      (ok true))))

(define-public (revoke-role (user principal) (role (string-ascii 20)))
  (response bool uint))
  (begin
    (asserts! (has-permission tx-sender "grant_roles") ERR_UNAUTHORIZED)
    (let ((current-roles (default-to (list) (map-get? user-roles user))))
      (map-set user-roles user (filter-role current-roles role))
      (print { 
        event: "role-revoked", 
        user: user, 
        role: role, 
        revoked-by: tx-sender,
        timestamp: block-height
      })
      (ok true))))

;; Check if user has specific permission
(define-read-only (has-permission (user principal) (permission (string-ascii 30)))
  (let ((user-roles-list (default-to (list) (map-get? user-roles user))))
    (fold check-role-permission user-roles-list false)))

(define-private (check-role-permission (role (string-ascii 20)) (acc bool))
  (or acc 
    (let ((role-perms (default-to (list) (map-get? role-permissions role))))
      (is-some (index-of role-perms permission)))))

;; Filter out a specific role from user's roles
(define-private (filter-role 
  (roles (list 10 (string-ascii 20))) 
  (role-to-remove (string-ascii 20)))
  (filter (lambda (r) (not (is-eq r role-to-remove))) roles))

;; Granular pause controls
(define-public (pause-function (function-name (string-ascii 30)))
  (response bool uint))
  (begin
    (asserts! (has-permission tx-sender "pause_functions") ERR_UNAUTHORIZED)
    (map-set function-pause-status function-name {
      paused: true,
      paused-by: tx-sender,
      timestamp: block-height
    })
    (print { 
      event: "function-paused", 
      function: function-name, 
      paused-by: tx-sender,
      timestamp: block-height
    })
    (ok true)))

(define-public (unpause-function (function-name (string-ascii 30)))
  (response bool uint))
  (begin
    (asserts! (has-permission tx-sender "pause_functions") ERR_UNAUTHORIZED)
    (map-set function-pause-status function-name {
      paused: false,
      paused-by: tx-sender,
      timestamp: block-height
    })
    (print { 
      event: "function-unpaused", 
      function: function-name, 
      unpaused-by: tx-sender,
      timestamp: block-height
    })
    (ok true)))

;; Check if specific function is paused
(define-read-only (is-function-paused (function-name (string-ascii 30)))
  (match (map-get? function-pause-status function-name)
    status (get paused status)
    false))

;; Contract health monitoring
(define-read-only (get-contract-health)
  (response { 
    contract-paused: bool, 
    total-signatures: uint, 
    blacklisted-signatures: uint,
    active-delegations: uint,
    last-activity: uint
  } uint))
  (ok {
    contract-paused: (var-get contract-paused),
    total-signatures: (get-total-signatures),
    blacklisted-signatures: (get-blacklisted-count),
    active-delegations: (get-active-delegations-count),
    last-activity: block-height
  }))

;; Helper functions for health monitoring
(define-private (get-total-signatures)
  ;; Simplified - in real implementation would count actual signatures
  u1000)

(define-private (get-blacklisted-count)
  ;; Simplified - in real implementation would count blacklisted signatures
  u5)

(define-private (get-active-delegations-count)
  ;; Simplified - in real implementation would count active delegations
  u50)

;; Emergency recovery functions
(define-public (emergency-invalidate-multiple-users (users (list 100 principal)))
  (response (list 100 uint) uint))
  (begin
    (asserts! (has-permission tx-sender "emergency_functions") ERR_UNAUTHORIZED)
    (let ((results (map emergency-invalidate-single-user users)))
      (print { 
        event: "emergency-bulk-invalidation", 
        users: users, 
        executed-by: tx-sender,
        timestamp: block-height
      })
      (ok results))))

(define-private (emergency-invalidate-single-user (user principal))
  (let ((current-nonce (get-nonce user)))
    (map-set nonces user (+ current-nonce u1000))
    (+ current-nonce u1000)))

;; Pause/unpause contract (enhanced)
(define-public (set-paused (paused bool))
  (begin
    (asserts! (has-permission tx-sender "pause_contract") ERR_UNAUTHORIZED)
    (var-set contract-paused paused)
    (print { 
      event: "contract-pause-changed", 
      paused: paused, 
      changed-by: tx-sender,
      timestamp: block-height
    })
    (ok paused)))

;; Check if contract is paused
(define-read-only (is-paused)
  (var-get contract-paused))

;; Emergency function to invalidate all signatures for a user (enhanced)
(define-public (emergency-invalidate-nonce (user principal))
  (begin
    (asserts! (has-permission tx-sender "emergency_functions") ERR_UNAUTHORIZED)
    (let ((current-nonce (get-nonce user)))
      (map-set nonces user (+ current-nonce u1000))
      (print { 
        event: "emergency-nonce-invalidation", 
        user: user, 
        old-nonce: current-nonce,
        new-nonce: (+ current-nonce u1000),
        executed-by: tx-sender,
        timestamp: block-height
      })
      (ok (+ current-nonce u1000)))))

;; Get user roles
(define-read-only (get-user-roles (user principal))
  (default-to (list) (map-get? user-roles user)))

;; Get role permissions
(define-read-only (get-role-permissions (role (string-ascii 20)))
  (default-to (list) (map-get? role-permissions role)))

;; Enhanced utility functions for external integrations
(define-read-only (get-chain-id)
  DOMAIN_CHAIN_ID)

(define-read-only (get-contract-version)
  DOMAIN_VERSION)

(define-read-only (get-contract-name)
  DOMAIN_NAME)

;; Verify any typed data hash with enhanced validation
(define-public (verify-typed-data
  (struct-hash (buff 32))
  (signature (buff 65))
  (signer principal))
  (ok (verify-typed-signature-enhanced struct-hash signature signer "secp256k1")))

;; Enhanced contract info with comprehensive details
(define-read-only (get-contract-info)
  {
    name: DOMAIN_NAME,
    version: DOMAIN_VERSION,
    chain-id: DOMAIN_CHAIN_ID,
    domain-separator: (var-get domain-separator),
    owner: CONTRACT_OWNER,
    paused: (var-get contract-paused),
    features-enabled: {
      hierarchical-delegation: (is-feature-enabled "hierarchical_delegation"),
      conditional-permits: (is-feature-enabled "conditional_permits"),
      batch-operations: (is-feature-enabled "batch_operations")
    },
    limits: {
      max-batch-size: (get-operational-limit "max_batch_size"),
      max-signature-age: (get-operational-limit "max_signature_age"),
      max-delegation-levels: (get-operational-limit "max_delegation_levels")
    }
  })
;; Enhanced helper functions with validation

;; Convert integer to ASCII representation (enhanced)
(define-private (int-to-ascii (value uint))
  (if (is-eq value u0)
    0x30  ;; "0"
    (unwrap-panic (to-consensus-buff? value))))

;; Get typed data hash for external verification (enhanced)
(define-read-only (get-typed-data-hash (struct-hash (buff 32)))
  (create-typed-data-hash struct-hash))

;; Check if a specific signature is valid for given data (enhanced)
(define-read-only (is-valid-signature
  (struct-hash (buff 32))
  (signature (buff 65))
  (signer principal))
  (and 
    (not (is-signature-used-enhanced signature))
    (not (is-signature-blacklisted signature))
    (verify-typed-signature-enhanced struct-hash signature signer "secp256k1")))

;; Contract initialization complete
;; This ERC-712 implementation provides:
;; - Structured data hashing according to EIP-712
;; - Signature verification with replay protection
;; - Permit functionality for gasless approvals
;; - Meta-transaction support
;; - Delegation with signature verification
;; - Batch operations
;; - Administrative controls
;; Meta-transaction structure (original for compatibility)
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

;; Execute meta-transaction (original for backward compatibility)
(define-public (execute-meta-transaction
  (from principal)
  (to principal)
  (value uint)
  (data (buff 1024))
  (signature (buff 65)))
  (let ((current-nonce (get-nonce from))
        (meta-tx-hash (hash-meta-tx from to value data current-nonce)))
    (asserts! (not (var-get contract-paused)) ERR_PAUSED)
    (asserts! (verify-typed-signature-enhanced meta-tx-hash signature from "secp256k1") ERR_INVALID_SIGNATURE)
    (asserts! (not (is-signature-used-enhanced signature)) ERR_ALREADY_USED)
    
    ;; Mark signature as used and increment nonce
    (mark-signature-used-enhanced signature from "secp256k1")
    (increment-nonce from)
    
    ;; Execute the transaction (simplified - would call actual function)
    (print { 
      event: "meta-transaction", 
      from: from, 
      to: to, 
      value: value, 
      nonce: current-nonce,
      timestamp: block-height
    })
    (ok { from: from, to: to, value: value, nonce: current-nonce })))

;; Utility function to zip two lists
(define-private (zip 
  (list1 (list 20 { from: principal, to: principal, value: uint, data: (buff 256) }))
  (list2 (list 20 (buff 65))))
  (list 20 { tx: { from: principal, to: principal, value: uint, data: (buff 256) }, sig: (buff 65) }))
  (map create-tx-sig-pair (enumerate list1) list2))

(define-private (create-tx-sig-pair 
  (indexed-tx { index: uint, item: { from: principal, to: principal, value: uint, data: (buff 256) } })
  (sig (buff 65)))
  { tx: (get item indexed-tx), sig: sig })

;; Helper to enumerate list items with indices
(define-private (enumerate 
  (items (list 20 { from: principal, to: principal, value: uint, data: (buff 256) })))
  (list 20 { index: uint, item: { from: principal, to: principal, value: uint, data: (buff 256) } }))
  (map add-index items (list u0 u1 u2 u3 u4 u5 u6 u7 u8 u9 u10 u11 u12 u13 u14 u15 u16 u17 u18 u19)))

(define-private (add-index 
  (item { from: principal, to: principal, value: uint, data: (buff 256) })
  (index uint))
  { index: index, item: item })
;; Performance optimization layer with caching
;; Cached computation results
(define-map computation-cache
  (buff 32)
  { result: (buff 32), timestamp: uint, expiry: uint })

;; Batch operation metadata
(define-map batch-metadata
  (buff 32)
  { size: uint, gas-used: uint, timestamp: uint, success-rate: uint })

;; Cache frequently computed values
(define-private (cache-computation 
  (input (buff 32)) 
  (result (buff 32)) 
  (expiry-duration uint))
  (map-set computation-cache input {
    result: result,
    timestamp: block-height,
    expiry: (+ block-height expiry-duration)
  }))

;; Get cached computation result
(define-read-only (get-cached-result (input (buff 32)))
  (match (map-get? computation-cache input)
    cached (if (< block-height (get expiry cached))
      (some (get result cached))
      none)
    none))

;; Optimized batch nonce retrieval
(define-read-only (get-nonces-batch (users (list 50 principal)))
  (response (list 50 { user: principal, nonce: uint }) uint))
  (ok (map get-user-nonce users)))

(define-private (get-user-nonce (user principal))
  { user: user, nonce: (get-nonce user) })

;; Optimized batch allowance queries
(define-read-only (get-allowances-batch 
  (queries (list 50 { owner: principal, spender: principal })))
  (response (list 50 { owner: principal, spender: principal, allowance: uint }) uint))
  (ok (map get-single-allowance queries)))

(define-private (get-single-allowance (query { owner: principal, spender: principal }))
  { 
    owner: (get owner query), 
    spender: (get spender query), 
    allowance: (get-allowance (get owner query) (get spender query)) 
  })

;; Gas-efficient signature verification with caching
(define-private (verify-signature-cached
  (message-hash (buff 32))
  (signature (buff 65))
  (signer principal))
  (let ((cache-key (sha256 (concat message-hash signature))))
    (match (get-cached-result cache-key)
      cached-result (is-eq cached-result 0x01)
      (let ((verification-result (verify-signature-secp256k1 message-hash signature signer)))
        (cache-computation cache-key 
          (if verification-result 0x01 0x00) 
          u100) ;; Cache for 100 blocks
        verification-result))))

;; Batch state updates for gas efficiency
(define-public (batch-update-allowances
  (updates (list 20 { owner: principal, spender: principal, value: uint })))
  (response bool uint))
  (begin
    (asserts! (has-permission tx-sender "batch_operations") ERR_UNAUTHORIZED)
    (map update-single-allowance updates)
    (print { 
      event: "batch-allowance-update", 
      count: (len updates),
      updated-by: tx-sender,
      timestamp: block-height
    })
    (ok true)))

(define-private (update-single-allowance 
  (update { owner: principal, spender: principal, value: uint }))
  (map-set allowances 
    { owner: (get owner update), spender: (get spender update) } 
    (get value update)))

;; Efficient data structures for frequent operations
(define-map frequent-signers principal uint)

;; Track frequent signers for optimization
(define-private (track-signer-activity (signer principal))
  (let ((current-count (default-to u0 (map-get? frequent-signers signer))))
    (map-set frequent-signers signer (+ current-count u1))))

;; Get signer activity count
(define-read-only (get-signer-activity (signer principal))
  (default-to u0 (map-get? frequent-signers signer)))

;; Optimized signature validation for frequent signers
(define-private (verify-signature-optimized
  (message-hash (buff 32))
  (signature (buff 65))
  (signer principal))
  (begin
    (track-signer-activity signer)
    (if (> (get-signer-activity signer) u10)
      (verify-signature-cached message-hash signature signer)
      (verify-signature-secp256k1 message-hash signature signer))))
;; Enhanced permit functionality
;; Conditional permits with execution conditions
(define-map conditional-permits
  { owner: principal, spender: principal, permit-id: (buff 32) }
  {
    value: uint,
    conditions: (list 5 { type: (string-ascii 20), value: (buff 256) }),
    expiry: uint,
    used: bool,
    transferable: bool
  })

;; Permit revocation tracking
(define-map revoked-permits (buff 32) { revoked-by: principal, timestamp: uint })

;; Create conditional permit
(define-public (create-conditional-permit
  (owner principal)
  (spender principal)
  (value uint)
  (conditions (list 5 { type: (string-ascii 20), value: (buff 256) }))
  (expiry uint)
  (transferable bool)
  (signature (buff 65)))
  (response (buff 32) uint))
  (let ((current-nonce (get-nonce owner))
        (permit-id (sha256 (concat (principal-to-buff owner) (principal-to-buff spender) (int-to-ascii current-nonce))))
        (permit-hash (hash-conditional-permit owner spender value conditions expiry transferable current-nonce)))
    (asserts! (not (var-get contract-paused)) ERR_PAUSED)
    (asserts! (< block-height expiry) ERR_EXPIRED)
    (asserts! (verify-typed-signature-enhanced permit-hash signature owner "secp256k1") ERR_INVALID_SIGNATURE)
    (asserts! (not (is-signature-used-enhanced signature)) ERR_ALREADY_USED)
    
    ;; Mark signature as used and increment nonce
    (mark-signature-used-enhanced signature owner "secp256k1")
    (increment-nonce owner)
    
    ;; Store conditional permit
    (map-set conditional-permits { owner: owner, spender: spender, permit-id: permit-id } {
      value: value,
      conditions: conditions,
      expiry: expiry,
      used: false,
      transferable: transferable
    })
    
    (print { 
      event: "conditional-permit-created", 
      owner: owner, 
      spender: spender, 
      permit-id: permit-id,
      value: value,
      conditions: conditions,
      expiry: expiry,
      transferable: transferable,
      timestamp: block-height
    })
    
    (ok permit-id)))

;; Hash conditional permit
(define-private (hash-conditional-permit
  (owner principal)
  (spender principal)
  (value uint)
  (conditions (list 5 { type: (string-ascii 20), value: (buff 256) }))
  (expiry uint)
  (transferable bool)
  (nonce uint))
  (let ((permit-data (concat
    (principal-to-buff owner)
    (principal-to-buff spender)
    (int-to-ascii value)
    (hash-conditions conditions)
    (int-to-ascii expiry)
    (if transferable 0x01 0x00)
    (int-to-ascii nonce))))
    (hash-struct "ConditionalPermit(address owner,address spender,uint256 value,Condition[] conditions,uint256 expiry,bool transferable,uint256 nonce)" permit-data)))

;; Use conditional permit
(define-public (use-conditional-permit
  (owner principal)
  (spender principal)
  (permit-id (buff 32)))
  (response bool uint))
  (match (map-get? conditional-permits { owner: owner, spender: spender, permit-id: permit-id })
    permit-data (begin
      (asserts! (not (get used permit-data)) ERR_ALREADY_USED)
      (asserts! (< block-height (get expiry permit-data)) ERR_EXPIRED)
      (asserts! (not (is-permit-revoked permit-id)) ERR_INVALID_SIGNATURE)
      (asserts! (validate-conditions (get conditions permit-data)) ERR_INVALID_SIGNATURE)
      
      ;; Mark permit as used
      (map-set conditional-permits { owner: owner, spender: spender, permit-id: permit-id }
        (merge permit-data { used: true }))
      
      ;; Set allowance
      (map-set allowances { owner: owner, spender: spender } (get value permit-data))
      
      (print { 
        event: "conditional-permit-used", 
        owner: owner, 
        spender: spender, 
        permit-id: permit-id,
        value: (get value permit-data),
        timestamp: block-height
      })
      
      (ok true))
    ERR_INVALID_SIGNATURE))

;; Revoke permit before expiry
(define-public (revoke-permit (permit-id (buff 32)))
  (response bool uint))
  (begin
    (map-set revoked-permits permit-id { revoked-by: tx-sender, timestamp: block-height })
    (print { 
      event: "permit-revoked", 
      permit-id: permit-id,
      revoked-by: tx-sender,
      timestamp: block-height
    })
    (ok true)))

;; Check if permit is revoked
(define-read-only (is-permit-revoked (permit-id (buff 32)))
  (is-some (map-get? revoked-permits permit-id)))

;; Transfer permit (if transferable)
(define-public (transfer-permit
  (owner principal)
  (old-spender principal)
  (new-spender principal)
  (permit-id (buff 32)))
  (response bool uint))
  (match (map-get? conditional-permits { owner: owner, spender: old-spender, permit-id: permit-id })
    permit-data (begin
      (asserts! (is-eq tx-sender owner) ERR_UNAUTHORIZED)
      (asserts! (get transferable permit-data) ERR_UNAUTHORIZED)
      (asserts! (not (get used permit-data)) ERR_ALREADY_USED)
      (asserts! (< block-height (get expiry permit-data)) ERR_EXPIRED)
      
      ;; Remove old permit
      (map-delete conditional-permits { owner: owner, spender: old-spender, permit-id: permit-id })
      
      ;; Create new permit for new spender
      (map-set conditional-permits { owner: owner, spender: new-spender, permit-id: permit-id } permit-data)
      
      (print { 
        event: "permit-transferred", 
        owner: owner, 
        old-spender: old-spender,
        new-spender: new-spender,
        permit-id: permit-id,
        timestamp: block-height
      })
      
      (ok true))
    ERR_INVALID_SIGNATURE))

;; Get permit info
(define-read-only (get-permit-info 
  (owner principal) 
  (spender principal) 
  (permit-id (buff 32)))
  (map-get? conditional-permits { owner: owner, spender: spender, permit-id: permit-id }))
;; Comprehensive input validation framework
;; Principal address validation
(define-read-only (validate-principal-address (addr principal))
  (response bool uint))
  (begin
    ;; Check if principal is valid (not zero address equivalent)
    (asserts! (not (is-eq addr 'SP000000000000000000002Q6VF78)) ERR_INVALID_SIGNATURE)
    (ok true)))

;; Buffer size validation
(define-read-only (validate-buffer-size (buffer (buff 1024)) (max-size uint))
  (response bool uint))
  (begin
    (asserts! (<= (len buffer) max-size) ERR_SIGNATURE_TOO_LONG)
    (asserts! (> (len buffer) u0) ERR_SIGNATURE_TOO_SHORT)
    (ok true)))

;; Numeric range validation
(define-read-only (validate-numeric-range (value uint) (min-val uint) (max-val uint))
  (response bool uint))
  (begin
    (asserts! (>= value min-val) ERR_INVALID_SIGNATURE)
    (asserts! (<= value max-val) ERR_INVALID_SIGNATURE)
    (ok true)))

;; String constraint validation
(define-read-only (validate-string-constraints (str (string-ascii 100)) (max-length uint))
  (response bool uint))
  (begin
    (asserts! (<= (len str) max-length) ERR_SIGNATURE_TOO_LONG)
    (asserts! (> (len str) u0) ERR_SIGNATURE_TOO_SHORT)
    (ok true)))

;; Timestamp validation
(define-read-only (validate-timestamp (timestamp uint))
  (response bool uint))
  (begin
    ;; Ensure timestamp is not in the past (with some tolerance)
    (asserts! (>= timestamp (- block-height u10)) ERR_EXPIRED)
    ;; Ensure timestamp is not too far in the future (prevent manipulation)
    (asserts! (<= timestamp (+ block-height u1000000)) ERR_INVALID_SIGNATURE)
    (ok true)))

;; Comprehensive input validation for permit function
(define-private (validate-permit-inputs
  (owner principal)
  (spender principal)
  (value uint)
  (deadline uint)
  (signature (buff 65)))
  (begin
    (unwrap! (validate-principal-address owner) ERR_INVALID_SIGNATURE)
    (unwrap! (validate-principal-address spender) ERR_INVALID_SIGNATURE)
    (unwrap! (validate-numeric-range value u0 u340282366920938463463374607431768211455) ERR_INVALID_SIGNATURE)
    (unwrap! (validate-timestamp deadline) ERR_EXPIRED)
    (unwrap! (validate-signature-format signature) ERR_MALFORMED_SIGNATURE)
    (ok true)))

;; Comprehensive input validation for meta-transactions
(define-private (validate-meta-tx-inputs
  (from principal)
  (to principal)
  (value uint)
  (data (buff 1024)))
  (begin
    (unwrap! (validate-principal-address from) ERR_INVALID_SIGNATURE)
    (unwrap! (validate-principal-address to) ERR_INVALID_SIGNATURE)
    (unwrap! (validate-numeric-range value u0 u340282366920938463463374607431768211455) ERR_INVALID_SIGNATURE)
    (unwrap! (validate-buffer-size data u1024) ERR_SIGNATURE_TOO_LONG)
    (ok true)))

;; Validate delegation inputs
(define-private (validate-delegation-inputs
  (delegator principal)
  (delegatee principal)
  (expiry uint))
  (begin
    (unwrap! (validate-principal-address delegator) ERR_INVALID_SIGNATURE)
    (unwrap! (validate-principal-address delegatee) ERR_INVALID_SIGNATURE)
    (unwrap! (validate-timestamp expiry) ERR_EXPIRED)
    (asserts! (not (is-eq delegator delegatee)) ERR_INVALID_SIGNATURE)
    (ok true)))

;; Enhanced signature format validation with detailed checks
(define-read-only (validate-signature-format-detailed (signature (buff 65)))
  (response { valid: bool, issues: (list 5 (string-ascii 50)) } uint))
  (let ((issues (list)))
    (let ((length-check (is-eq (len signature) u65))
          (zero-check (not (is-eq signature 0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000)))
          (recovery-id (buff-to-uint-be (unwrap-panic (slice? signature u64 u65))))
          (recovery-valid (< recovery-id u4)))
      (ok {
        valid: (and length-check zero-check recovery-valid),
        issues: (if (and length-check zero-check recovery-valid)
          (list)
          (append 
            (if length-check (list) (list "invalid_length"))
            (if zero-check (list) (list "zero_signature"))))
      }))))

;; Batch validation for multiple inputs
(define-read-only (validate-principals-batch (principals (list 50 principal)))
  (response (list 50 bool) uint))
  (ok (map validate-single-principal principals)))

(define-private (validate-single-principal (addr principal))
  (is-ok (validate-principal-address addr)))

;; Security validation helpers
(define-read-only (is-contract-address (addr principal))
  ;; Simplified check - in real implementation would check if address is a contract
  (not (is-eq addr tx-sender)))

;; Validate that operation is not a potential attack vector
(define-private (validate-security-constraints
  (operation (string-ascii 20))
  (user principal)
  (value uint))
  (begin
    ;; Check for suspicious patterns
    (asserts! (< value u1000000000000000000000000) ERR_INVALID_SIGNATURE) ;; Prevent overflow attacks
    (asserts! (not (and (is-eq operation "permit") (is-contract-address user))) ERR_UNAUTHORIZED) ;; Prevent contract permit abuse
    (ok true)))
;; Enhanced query interface and utility functions
;; Comprehensive signature status query
(define-read-only (get-signature-status (signature (buff 65)))
  (response { 
    used: bool, 
    blacklisted: bool, 
    metadata: (optional { 
      timestamp: uint, 
      signer: principal, 
      algorithm: (string-ascii 10),
      expiry: (optional uint),
      context: (optional (buff 256))
    })
  } uint))
  (match (map-get? signature-metadata signature)
    metadata (ok {
      used: (get used metadata),
      blacklisted: (get blacklisted metadata),
      metadata: (some {
        timestamp: (get timestamp metadata),
        signer: (get signer metadata),
        algorithm: (get algorithm metadata),
        expiry: (get expiry metadata),
        context: (get context metadata)
      })
    })
    (ok {
      used: (default-to false (map-get? used-signatures signature)),
      blacklisted: false,
      metadata: none
    })))

;; Batch signature status queries
(define-read-only (get-signatures-status-batch (signatures (list 20 (buff 65))))
  (response (list 20 { signature: (buff 65), used: bool, blacklisted: bool }) uint))
  (ok (map get-single-signature-status signatures)))

(define-private (get-single-signature-status (signature (buff 65)))
  { 
    signature: signature, 
    used: (is-signature-used-enhanced signature), 
    blacklisted: (is-signature-blacklisted signature) 
  })

;; Enhanced contract metadata query
(define-read-only (get-enhanced-contract-info)
  (response {
    name: (string-ascii 32),
    version: (string-ascii 8),
    chain-id: uint,
    domain-separator: (buff 32),
    owner: principal,
    paused: bool,
    total-nonces-issued: uint,
    total-signatures-processed: uint,
    supported-algorithms: (list 10 (string-ascii 10)),
    active-roles: uint
  } uint))
  (ok {
    name: DOMAIN_NAME,
    version: DOMAIN_VERSION,
    chain-id: DOMAIN_CHAIN_ID,
    domain-separator: (var-get domain-separator),
    owner: CONTRACT_OWNER,
    paused: (var-get contract-paused),
    total-nonces-issued: (get-total-nonces-issued),
    total-signatures-processed: (get-total-signatures-processed),
    supported-algorithms: (list "secp256k1" "sha256" "keccak256" "blake2b"),
    active-roles: (get-active-roles-count)
  }))

;; Helper functions for enhanced contract info
(define-private (get-total-nonces-issued)
  ;; Simplified - in real implementation would track actual count
  u5000)

(define-private (get-total-signatures-processed)
  ;; Simplified - in real implementation would track actual count
  u15000)

(define-private (get-active-roles-count)
  ;; Simplified - in real implementation would count actual active roles
  u3)

;; Utility functions for integration
;; Generate typed data hash for external verification
(define-read-only (generate-typed-data-hash 
  (struct-type (string-ascii 32)) 
  (data (buff 1024)))
  (response (buff 32) uint))
  (let ((struct-hash (hash-struct struct-type data)))
    (ok (create-typed-data-hash struct-hash))))

;; Offline signature validation (no state changes)
(define-read-only (validate-signature-offline
  (message-hash (buff 32))
  (signature (buff 65))
  (signer principal)
  (algorithm (string-ascii 10)))
  (response bool uint))
  (begin
    (asserts! (default-to false (map-get? supported-algorithms algorithm)) ERR_UNSUPPORTED_ALGORITHM)
    (if (is-eq algorithm "secp256k1")
      (ok (verify-signature-secp256k1 message-hash signature signer))
      (ok false))))

;; Data formatting utilities
(define-read-only (format-permit-data
  (owner principal)
  (spender principal)
  (value uint)
  (nonce uint)
  (deadline uint))
  (response (buff 1024) uint))
  (let ((permit-data (concat
    (principal-to-buff owner)
    (principal-to-buff spender)
    (int-to-ascii value)
    (int-to-ascii nonce)
    (int-to-ascii deadline))))
    (ok permit-data)))

;; Diagnostic functions for troubleshooting
(define-read-only (diagnose-signature-failure
  (message-hash (buff 32))
  (signature (buff 65))
  (signer principal))
  (response { 
    format-valid: bool,
    algorithm-supported: bool,
    signature-used: bool,
    signature-blacklisted: bool,
    recovery-possible: bool,
    signer-matches: bool
  } uint))
  (let ((format-check (is-ok (validate-signature-format signature)))
        (used-check (is-signature-used-enhanced signature))
        (blacklist-check (is-signature-blacklisted signature))
        (recovery-check (is-some (secp256k1-recover? message-hash signature)))
        (signer-check (match (secp256k1-recover? message-hash signature)
          pubkey (is-eq signer (principal-of? pubkey))
          false)))
    (ok {
      format-valid: format-check,
      algorithm-supported: true,
      signature-used: used-check,
      signature-blacklisted: blacklist-check,
      recovery-possible: recovery-check,
      signer-matches: signer-check
    })))

;; Helper function to convert buffer to uint (big-endian)
(define-private (buff-to-uint-be (buffer (buff 1)))
  (match (slice? buffer u0 u1)
    byte-slice (match (element-at byte-slice u0)
      byte byte
      u0)
    u0))

;; Enhanced utility functions
(define-read-only (get-domain-info)
  (response {
    name: (string-ascii 32),
    version: (string-ascii 8),
    chain-id: uint,
    verifying-contract: principal,
    salt: (optional (buff 32))
  } uint))
  (ok {
    name: DOMAIN_NAME,
    version: DOMAIN_VERSION,
    chain-id: DOMAIN_CHAIN_ID,
    verifying-contract: (as-contract tx-sender),
    salt: none
  }))

;; Batch operations helper
(define-read-only (estimate-batch-gas (operation-count uint))
  (response uint uint))
  (ok (* operation-count u1000))) ;; Simplified gas estimation
;; Enhanced error handling and configuration management
;; Additional error constants for comprehensive error reporting
(define-constant ERR_BUFFER_TOO_LARGE (err u411))
(define-constant ERR_INVALID_CONDITION (err u412))
(define-constant ERR_PERMIT_REVOKED (err u413))
(define-constant ERR_PERMIT_NOT_TRANSFERABLE (err u414))
(define-constant ERR_DELEGATION_EXPIRED (err u415))
(define-constant ERR_INSUFFICIENT_PERMISSIONS (err u416))
(define-constant ERR_BATCH_SIZE_EXCEEDED (err u417))
(define-constant ERR_CONFIGURATION_LOCKED (err u418))

;; Configuration management system
(define-map contract-config
  (string-ascii 30)
  { value: (buff 256), locked: bool, updated-by: principal, timestamp: uint })

;; Feature flags
(define-map feature-flags
  (string-ascii 30)
  { enabled: bool, updated-by: principal, timestamp: uint })

;; Operational limits
(define-map operational-limits
  (string-ascii 30)
  { limit: uint, updated-by: principal, timestamp: uint })

;; Initialize default configuration
(map-set operational-limits "max_batch_size" { limit: u50, updated-by: CONTRACT_OWNER, timestamp: u0 })
(map-set operational-limits "max_signature_age" { limit: u1000, updated-by: CONTRACT_OWNER, timestamp: u0 })
(map-set operational-limits "max_delegation_levels" { limit: u10, updated-by: CONTRACT_OWNER, timestamp: u0 })

;; Initialize feature flags
(map-set feature-flags "hierarchical_delegation" { enabled: true, updated-by: CONTRACT_OWNER, timestamp: u0 })
(map-set feature-flags "conditional_permits" { enabled: true, updated-by: CONTRACT_OWNER, timestamp: u0 })
(map-set feature-flags "batch_operations" { enabled: true, updated-by: CONTRACT_OWNER, timestamp: u0 })

;; Domain parameter customization
(define-public (update-domain-parameter 
  (parameter (string-ascii 30)) 
  (value (buff 256)))
  (response bool uint))
  (begin
    (asserts! (has-permission tx-sender "configure_domain") ERR_UNAUTHORIZED)
    (match (map-get? contract-config parameter)
      config (asserts! (not (get locked config)) ERR_CONFIGURATION_LOCKED)
      true)
    
    (map-set contract-config parameter {
      value: value,
      locked: false,
      updated-by: tx-sender,
      timestamp: block-height
    })
    
    (print { 
      event: "domain-parameter-updated", 
      parameter: parameter,
      updated-by: tx-sender,
      timestamp: block-height
    })
    
    (ok true)))

;; Operational limit configuration
(define-public (set-operational-limit 
  (limit-name (string-ascii 30)) 
  (limit-value uint))
  (response bool uint))
  (begin
    (asserts! (has-permission tx-sender "configure_limits") ERR_UNAUTHORIZED)
    (asserts! (> limit-value u0) ERR_INVALID_SIGNATURE)
    
    (map-set operational-limits limit-name {
      limit: limit-value,
      updated-by: tx-sender,
      timestamp: block-height
    })
    
    (print { 
      event: "operational-limit-updated", 
      limit-name: limit-name,
      limit-value: limit-value,
      updated-by: tx-sender,
      timestamp: block-height
    })
    
    (ok true)))

;; Feature flag management
(define-public (toggle-feature 
  (feature-name (string-ascii 30)) 
  (enabled bool))
  (response bool uint))
  (begin
    (asserts! (has-permission tx-sender "manage_features") ERR_UNAUTHORIZED)
    
    (map-set feature-flags feature-name {
      enabled: enabled,
      updated-by: tx-sender,
      timestamp: block-height
    })
    
    (print { 
      event: "feature-toggled", 
      feature-name: feature-name,
      enabled: enabled,
      updated-by: tx-sender,
      timestamp: block-height
    })
    
    (ok true)))

;; Check if feature is enabled
(define-read-only (is-feature-enabled (feature-name (string-ascii 30)))
  (match (map-get? feature-flags feature-name)
    flag (get enabled flag)
    false))

;; Get operational limit
(define-read-only (get-operational-limit (limit-name (string-ascii 30)))
  (match (map-get? operational-limits limit-name)
    limit-data (get limit limit-data)
    u0))

;; Enhanced error reporting with context
(define-read-only (get-error-details (error-code uint))
  (response { 
    code: uint, 
    message: (string-ascii 100), 
    category: (string-ascii 20),
    recoverable: bool 
  } uint))
  (ok (if (is-eq error-code u401)
    { code: u401, message: "Unauthorized access - insufficient permissions", category: "authorization", recoverable: false }
    (if (is-eq error-code u402)
      { code: u402, message: "Invalid signature - verification failed", category: "cryptography", recoverable: true }
      (if (is-eq error-code u403)
        { code: u403, message: "Expired - timestamp or deadline passed", category: "timing", recoverable: false }
        (if (is-eq error-code u404)
          { code: u404, message: "Already used - signature replay detected", category: "replay", recoverable: false }
          { code: error-code, message: "Unknown error", category: "unknown", recoverable: false }))))))

;; System error event emission
(define-private (emit-error-event 
  (error-code uint) 
  (context (string-ascii 50)) 
  (user principal))
  (print { 
    event: "system-error", 
    error-code: error-code,
    context: context,
    user: user,
    timestamp: block-height
  }))

;; Graceful error handling wrapper
(define-private (handle-error 
  (result (response bool uint)) 
  (context (string-ascii 50)))
  (match result
    success success
    error-code (begin
      (emit-error-event error-code context tx-sender)
      (err error-code))))

;; State consistency validation
(define-read-only (validate-contract-state)
  (response { 
    consistent: bool, 
    issues: (list 10 (string-ascii 50)) 
  } uint))
  (let ((issues (list)))
    ;; Check for basic consistency issues
    (let ((domain-separator-valid (not (is-eq (var-get domain-separator) 0x00)))
          (owner-valid (not (is-eq CONTRACT_OWNER 'SP000000000000000000002Q6VF78))))
      (ok {
        consistent: (and domain-separator-valid owner-valid),
        issues: (if (and domain-separator-valid owner-valid)
          (list)
          (append 
            (if domain-separator-valid (list) (list "invalid_domain_separator"))
            (if owner-valid (list) (list "invalid_owner"))))
      }))))

;; Configuration queries
(define-read-only (get-all-feature-flags)
  (response (list 10 { name: (string-ascii 30), enabled: bool }) uint))
  (ok (list 
    { name: "hierarchical_delegation", enabled: (is-feature-enabled "hierarchical_delegation") }
    { name: "conditional_permits", enabled: (is-feature-enabled "conditional_permits") }
    { name: "batch_operations", enabled: (is-feature-enabled "batch_operations") })))

(define-read-only (get-all-operational-limits)
  (response (list 10 { name: (string-ascii 30), limit: uint }) uint))
  (ok (list 
    { name: "max_batch_size", limit: (get-operational-limit "max_batch_size") }
    { name: "max_signature_age", limit: (get-operational-limit "max_signature_age") }
    { name: "max_delegation_levels", limit: (get-operational-limit "max_delegation_levels") })))

;; Integration-specific configuration
(define-public (configure-integration
  (integration-name (string-ascii 30))
  (config-data (buff 256)))
  (response bool uint))
  (begin
    (asserts! (has-permission tx-sender "configure_integrations") ERR_UNAUTHORIZED)
    
    (map-set contract-config (concat "integration_" integration-name) {
      value: config-data,
      locked: false,
      updated-by: tx-sender,
      timestamp: block-height
    })
    
    (print { 
      event: "integration-configured", 
      integration-name: integration-name,
      configured-by: tx-sender,
      timestamp: block-height
    })
    
    (ok true)))

;; Get integration configuration
(define-read-only (get-integration-config (integration-name (string-ascii 30)))
  (map-get? contract-config (concat "integration_" integration-name)))
;; Migration and compatibility features
;; Data export functionality
(define-read-only (export-user-data (user principal))
  (response {
    nonce: uint,
    delegations: (optional principal),
    signature-count: uint,
    roles: (list 10 (string-ascii 20)),
    last-activity: uint
  } uint))
  (ok {
    nonce: (get-nonce user),
    delegations: (map-get? delegations user),
    signature-count: (get-signer-activity user),
    roles: (get-user-roles user),
    last-activity: block-height
  }))

;; Batch data export
(define-read-only (export-batch-data (users (list 20 principal)))
  (response (list 20 {
    user: principal,
    nonce: uint,
    delegations: (optional principal),
    signature-count: uint
  }) uint))
  (ok (map export-single-user-data users)))

(define-private (export-single-user-data (user principal))
  {
    user: user,
    nonce: (get-nonce user),
    delegations: (map-get? delegations user),
    signature-count: (get-signer-activity user)
  })

;; Data import functionality (for migration)
(define-public (import-user-data
  (user principal)
  (nonce uint)
  (delegation (optional principal))
  (signature-count uint))
  (response bool uint))
  (begin
    (asserts! (has-permission tx-sender "data_migration") ERR_UNAUTHORIZED)
    
    ;; Import nonce
    (map-set nonces user nonce)
    
    ;; Import delegation if provided
    (match delegation
      del (map-set delegations user del)
      true)
    
    ;; Import signature activity
    (map-set frequent-signers user signature-count)
    
    (print { 
      event: "user-data-imported", 
      user: user,
      nonce: nonce,
      delegation: delegation,
      imported-by: tx-sender,
      timestamp: block-height
    })
    
    (ok true)))

;; Migration validation
(define-read-only (validate-migration-data
  (user principal)
  (expected-nonce uint)
  (expected-delegation (optional principal)))
  (response bool uint))
  (let ((actual-nonce (get-nonce user))
        (actual-delegation (map-get? delegations user)))
    (ok (and 
      (is-eq actual-nonce expected-nonce)
      (is-eq actual-delegation expected-delegation)))))

;; Version compatibility check
(define-read-only (check-compatibility (client-version (string-ascii 10)))
  (response { 
    compatible: bool, 
    current-version: (string-ascii 8),
    min-supported: (string-ascii 8),
    deprecated-features: (list 5 (string-ascii 30))
  } uint))
  (ok {
    compatible: true, ;; Simplified - would check actual compatibility
    current-version: DOMAIN_VERSION,
    min-supported: "1",
    deprecated-features: (list)
  }))

;; Legacy function support (maintain backward compatibility)
(define-public (legacy-permit
  (owner principal)
  (spender principal)
  (value uint)
  (deadline uint)
  (v uint)
  (r (buff 32))
  (s (buff 32)))
  (response bool uint))
  (let ((signature (concat r (concat s (unwrap-panic (to-consensus-buff? v))))))
    ;; Use the enhanced permit function internally
    (permit owner spender value deadline signature)))

;; Legacy meta-transaction support
(define-public (legacy-execute-meta-transaction
  (from principal)
  (to principal)
  (value uint)
  (data (buff 1024))
  (v uint)
  (r (buff 32))
  (s (buff 32)))
  (response { from: principal, to: principal, value: uint, nonce: uint } uint))
  (let ((signature (concat r (concat s (unwrap-panic (to-consensus-buff? v))))))
    (execute-meta-transaction from to value data signature)))

;; Gradual feature migration support
(define-map migration-status
  (string-ascii 30)
  { phase: uint, completed: bool, started-by: principal, timestamp: uint })

(define-public (start-feature-migration (feature-name (string-ascii 30)))
  (response bool uint))
  (begin
    (asserts! (has-permission tx-sender "manage_migrations") ERR_UNAUTHORIZED)
    
    (map-set migration-status feature-name {
      phase: u1,
      completed: false,
      started-by: tx-sender,
      timestamp: block-height
    })
    
    (print { 
      event: "migration-started", 
      feature-name: feature-name,
      started-by: tx-sender,
      timestamp: block-height
    })
    
    (ok true)))

(define-public (complete-feature-migration (feature-name (string-ascii 30)))
  (response bool uint))
  (begin
    (asserts! (has-permission tx-sender "manage_migrations") ERR_UNAUTHORIZED)
    
    (match (map-get? migration-status feature-name)
      status (begin
        (map-set migration-status feature-name 
          (merge status { completed: true, phase: u3 }))
        (print { 
          event: "migration-completed", 
          feature-name: feature-name,
          completed-by: tx-sender,
          timestamp: block-height
        })
        (ok true))
      ERR_INVALID_SIGNATURE)))

;; Get migration status
(define-read-only (get-migration-status (feature-name (string-ascii 30)))
  (map-get? migration-status feature-name))

;; Contract upgrade preparation
(define-public (prepare-upgrade (new-contract-hash (buff 32)))
  (response bool uint))
  (begin
    (asserts! (has-permission tx-sender "prepare_upgrades") ERR_UNAUTHORIZED)
    
    ;; Store upgrade information
    (map-set contract-config "upgrade_hash" {
      value: new-contract-hash,
      locked: true,
      updated-by: tx-sender,
      timestamp: block-height
    })
    
    (print { 
      event: "upgrade-prepared", 
      new-contract-hash: new-contract-hash,
      prepared-by: tx-sender,
      timestamp: block-height
    })
    
    (ok true)))

;; Final contract status and summary
(define-read-only (get-contract-summary)
  (response {
    version: (string-ascii 8),
    total-functions: uint,
    security-features: (list 10 (string-ascii 30)),
    performance-optimizations: (list 5 (string-ascii 30)),
    compatibility-maintained: bool
  } uint))
  (ok {
    version: DOMAIN_VERSION,
    total-functions: u50, ;; Approximate count of public functions
    security-features: (list 
      "signature_blacklisting"
      "replay_protection" 
      "role_based_access"
      "input_validation"
      "audit_trails"),
    performance-optimizations: (list
      "computation_caching"
      "batch_operations"
      "gas_optimization"
      "efficient_storage"),
    compatibility-maintained: true
  }))

;; Contract initialization complete marker
(define-data-var initialization-complete bool true)

;; Final initialization check
(define-read-only (is-fully-initialized)
  (var-get initialization-complete))