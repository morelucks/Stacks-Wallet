;; =====================================================================
;; Multi-Token NFT Contract (ERC1155-like)
;; =====================================================================
;; 
;; A comprehensive multi-token contract supporting both fungible and 
;; non-fungible tokens in a single contract. This implementation provides:
;;
;; - Batch operations for gas efficiency
;; - Comprehensive validation and security checks
;; - Emergency controls and administrative functions
;; - Detailed event logging for transparency
;; - Optimized storage patterns
;; - Creator-based token management
;;
;; Version: 2.1.0
;; Compatible with: Clarity 4
;; Standard: ERC1155-like (adapted for Stacks)
;; Last Updated: December 2024
;;
;; ===================================================================== 

;; ===== CONSTANTS =====

;; Contract owner (set at deployment)
(define-constant CONTRACT_OWNER tx-sender)

;; Maximum values for safety
(define-constant MAX_SUPPLY u1000000000000) ;; 1 trillion max supply per token
(define-constant MAX_BATCH_SIZE u100) ;; Increased from 50 to 100
(define-constant MAX_URI_LENGTH u256)

;; ===== COMPREHENSIVE ERROR CODES =====

;; Authorization and Permission Errors (100-199)
(define-constant ERR_OWNER_ONLY (err u100))
(define-constant ERR_NOT_TOKEN_OWNER (err u101))
(define-constant ERR_UNAUTHORIZED (err u102))
(define-constant ERR_PERMISSION_DENIED (err u103))
(define-constant ERR_ROLE_NOT_FOUND (err u104))
(define-constant ERR_PERMISSION_EXPIRED (err u105))
(define-constant ERR_INVALID_ROLE (err u106))
(define-constant ERR_DELEGATION_FAILED (err u107))
(define-constant ERR_REVOCATION_FAILED (err u108))
(define-constant ERR_SCOPE_VIOLATION (err u109))

;; Token Operation Errors (200-299)
(define-constant ERR_TOKEN_NOT_FOUND (err u200))
(define-constant ERR_INSUFFICIENT_BALANCE (err u201))
(define-constant ERR_INVALID_AMOUNT (err u202))
(define-constant ERR_SUPPLY_EXCEEDED (err u203))
(define-constant ERR_TOKEN_CREATION_FAILED (err u204))
(define-constant ERR_MINT_FAILED (err u205))
(define-constant ERR_BURN_FAILED (err u206))
(define-constant ERR_TRANSFER_FAILED (err u207))
(define-constant ERR_TOKEN_LOCKED (err u208))
(define-constant ERR_INVALID_TOKEN_TYPE (err u209))

;; Validation and Input Errors (300-399)
(define-constant ERR_INVALID_RECIPIENT (err u300))
(define-constant ERR_BATCH_SIZE_MISMATCH (err u301))
(define-constant ERR_BATCH_TOO_LARGE (err u302))
(define-constant ERR_INVALID_URI (err u303))
(define-constant ERR_INVALID_STRING_LENGTH (err u304))
(define-constant ERR_INVALID_PARAMETER (err u305))
(define-constant ERR_NULL_VALUE (err u306))
(define-constant ERR_OUT_OF_BOUNDS (err u307))
(define-constant ERR_INVALID_FORMAT (err u308))
(define-constant ERR_ENCODING_ERROR (err u309))

;; System and State Errors (400-499)
(define-constant ERR_CONTRACT_PAUSED (err u400))
(define-constant ERR_INVALID_STATE (err u401))
(define-constant ERR_OPERATION_FAILED (err u402))
(define-constant ERR_INVARIANT_VIOLATION (err u403))
(define-constant ERR_STATE_CORRUPTION (err u404))
(define-constant ERR_INITIALIZATION_FAILED (err u405))
(define-constant ERR_CLEANUP_FAILED (err u406))
(define-constant ERR_RESOURCE_EXHAUSTED (err u407))
(define-constant ERR_TIMEOUT (err u408))
(define-constant ERR_DEADLOCK (err u409))

;; Batch Operation Errors (500-599)
(define-constant ERR_BATCH_VALIDATION_FAILED (err u500))
(define-constant ERR_BATCH_PARTIAL_FAILURE (err u501))
(define-constant ERR_BATCH_ROLLBACK_FAILED (err u502))
(define-constant ERR_BATCH_SIZE_EXCEEDED (err u503))
(define-constant ERR_BATCH_EMPTY (err u504))
(define-constant ERR_BATCH_DUPLICATE (err u505))
(define-constant ERR_BATCH_ORDERING (err u506))
(define-constant ERR_BATCH_ATOMICITY (err u507))
(define-constant ERR_BATCH_CONSISTENCY (err u508))
(define-constant ERR_BATCH_ISOLATION (err u509))

;; Metadata and Query Errors (600-699)
(define-constant ERR_METADATA_NOT_FOUND (err u600))
(define-constant ERR_METADATA_INVALID (err u601))
(define-constant ERR_METADATA_TOO_LARGE (err u602))
(define-constant ERR_CATEGORY_NOT_FOUND (err u603))
(define-constant ERR_TAG_NOT_FOUND (err u604))
(define-constant ERR_ATTRIBUTE_INVALID (err u605))
(define-constant ERR_QUERY_FAILED (err u606))
(define-constant ERR_INDEX_CORRUPTION (err u607))
(define-constant ERR_SEARCH_FAILED (err u608))
(define-constant ERR_FILTER_INVALID (err u609))

;; Royalty and Fee Errors (700-799)
(define-constant ERR_ROYALTY_INVALID (err u700))
(define-constant ERR_ROYALTY_EXCEEDED (err u701))
(define-constant ERR_FEE_CALCULATION_FAILED (err u702))
(define-constant ERR_PAYMENT_FAILED (err u703))
(define-constant ERR_RECIPIENT_INVALID (err u704))
(define-constant ERR_DISTRIBUTION_FAILED (err u705))
(define-constant ERR_PERCENTAGE_INVALID (err u706))
(define-constant ERR_MARKETPLACE_FEE_INVALID (err u707))
(define-constant ERR_ROYALTY_SPLIT_INVALID (err u708))
(define-constant ERR_PAYMENT_TRACKING_FAILED (err u709))

;; Administrative and Emergency Errors (800-899)
(define-constant ERR_ADMIN_ONLY (err u800))
(define-constant ERR_EMERGENCY_ACTIVE (err u801))
(define-constant ERR_MAINTENANCE_MODE (err u802))
(define-constant ERR_RECOVERY_FAILED (err u803))
(define-constant ERR_DIAGNOSTIC_FAILED (err u804))
(define-constant ERR_UPGRADE_FAILED (err u805))
(define-constant ERR_BACKUP_FAILED (err u806))
(define-constant ERR_RESTORE_FAILED (err u807))
(define-constant ERR_MIGRATION_FAILED (err u808))
(define-constant ERR_CONFIGURATION_INVALID (err u809))

;; ===== TOKEN DEFINITION =====

;; Define the semi-fungible token
(define-non-fungible-token multi-token uint)

;; ===== DATA VARIABLES =====

(define-data-var next-token-id uint u1)
(define-data-var contract-uri (string-utf8 256) u"https://api.example.com/metadata/")
(define-data-var contract-paused bool false)
(define-data-var total-transactions uint u0) ;; Track total number of transactions
(define-data-var event-sequence uint u0) ;; Track event sequence for ordering
(define-data-var contract-version (string-ascii 16) "2.2.0") ;; Contract version tracking

;; ===== DATA MAPS =====

;; Core token data
(define-map token-balances {token-id: uint, owner: principal} uint)
(define-map token-supplies uint uint)
(define-map token-creators uint principal)

;; Metadata and URIs
(define-map token-uris uint (string-utf8 256))
(define-map token-names uint (string-utf8 64))

;; Permissions and approvals
(define-map operator-approvals {owner: principal, operator: principal} bool)

;; Token metadata extensions
(define-map token-descriptions uint (string-utf8 512)) ;; Extended descriptions
(define-map token-royalties uint {creator: principal, percentage: uint}) ;; Royalty info

;; ===== EVENT LOGGING INFRASTRUCTURE =====

;; Event categories for filtering and organization
(define-map event-logs uint {
  event-type: (string-ascii 32),
  category: (string-ascii 16),
  timestamp: uint,
  block-height: uint,
  transaction-sender: principal,
  event-data: (string-utf8 512),
  severity: (string-ascii 8)
})

;; Event statistics for analytics
(define-map event-stats (string-ascii 32) {
  count: uint,
  last-occurrence: uint,
  first-occurrence: uint
})

;; User activity tracking
(define-map user-activity-log {user: principal, date: uint} {
  actions-count: uint,
  last-action: (string-ascii 32),
  total-volume: uint
})

;; ===== ENHANCED VALIDATION HELPERS =====

;; Check if contract is not paused
(define-private (assert-not-paused)
  (asserts! (not (var-get contract-paused)) ERR_CONTRACT_PAUSED)
)

;; Comprehensive amount validation
(define-private (is-valid-amount (amount uint))
  (and (> amount u0) (<= amount MAX_SUPPLY))
)

;; Enhanced principal validation
(define-private (is-valid-recipient (recipient principal))
  (and 
    (not (is-eq recipient CONTRACT_OWNER))
    (not (is-eq recipient (as-contract tx-sender)))
  )
)

;; Validate string length with bounds
(define-private (is-valid-string-length (str (string-utf8 512)) (min-len uint) (max-len uint))
  (let ((str-len (len str)))
    (and (>= str-len min-len) (<= str-len max-len))
  )
)

;; Validate URI format and length
(define-private (is-valid-uri (uri (string-utf8 256)))
  (and 
    (> (len uri) u0) 
    (<= (len uri) MAX_URI_LENGTH)
    (not (is-eq uri u""))
  )
)

;; Check if token exists
(define-private (token-exists-check (token-id uint))
  (is-some (map-get? token-creators token-id))
)

;; Validate royalty percentage (0-10000 basis points = 0-100%)
(define-private (is-valid-royalty (percentage uint))
  (<= percentage u10000)
)

;; Validate list is not empty
(define-private (is-non-empty-list (items (list 100 uint)))
  (> (len items) u0)
)

;; Validate batch size within limits
(define-private (is-valid-batch-size (size uint))
  (and (> size u0) (<= size MAX_BATCH_SIZE))
)

;; Comprehensive input validation for token creation
(define-private (validate-token-creation-inputs 
  (initial-supply uint) 
  (uri (string-utf8 256)) 
  (name (string-utf8 64))
  (description (string-utf8 512))
  (royalty-percentage uint)
)
  (begin
    (asserts! (is-valid-amount initial-supply) ERR_INVALID_AMOUNT)
    (asserts! (<= initial-supply MAX_SUPPLY) ERR_SUPPLY_EXCEEDED)
    (asserts! (is-valid-uri uri) ERR_INVALID_URI)
    (asserts! (is-valid-string-length name u1 u64) ERR_INVALID_STRING_LENGTH)
    (asserts! (is-valid-string-length description u1 u512) ERR_INVALID_STRING_LENGTH)
    (asserts! (is-valid-royalty royalty-percentage) ERR_ROYALTY_INVALID)
    (ok true)
  )
)

;; Validate transfer parameters
(define-private (validate-transfer-params 
  (from principal) 
  (to principal) 
  (token-id uint) 
  (amount uint)
)
  (begin
    (asserts! (token-exists-check token-id) ERR_TOKEN_NOT_FOUND)
    (asserts! (is-valid-recipient to) ERR_INVALID_RECIPIENT)
    (asserts! (is-valid-amount amount) ERR_INVALID_AMOUNT)
    (asserts! (not (is-eq from to)) ERR_INVALID_PARAMETER)
    (ok true)
  )
)

;; Validate batch operation parameters
(define-private (validate-batch-params (token-ids (list 100 uint)) (amounts (list 100 uint)))
  (let ((ids-count (len token-ids))
        (amounts-count (len amounts)))
    (begin
      (asserts! (is-eq ids-count amounts-count) ERR_BATCH_SIZE_MISMATCH)
      (asserts! (is-valid-batch-size ids-count) ERR_BATCH_TOO_LARGE)
      (asserts! (is-non-empty-list token-ids) ERR_BATCH_EMPTY)
      (ok true)
    )
  )
)

;; Enhanced error context helper
(define-private (create-error-context (operation (string-ascii 32)) (details (string-ascii 64)))
  {
    operation: operation,
    details: details,
    block-height: block-height,
    timestamp: (default-to u0 (get-block-info? time (- block-height u1)))
  }
)

;; ===== ENHANCED EVENT LOGGING SYSTEM =====

;; Get next event sequence number
(define-private (get-next-event-sequence)
  (let ((current-seq (var-get event-sequence)))
    (begin
      (var-set event-sequence (+ current-seq u1))
      current-seq
    )
  )
)

;; Log structured event with categorization
(define-private (log-structured-event 
  (event-type (string-ascii 32))
  (category (string-ascii 16))
  (severity (string-ascii 8))
  (event-data (string-utf8 512))
)
  (let (
    (event-id (get-next-event-sequence))
    (current-time (default-to u0 (get-block-info? time (- block-height u1))))
  )
    (begin
      ;; Store event in log
      (map-set event-logs event-id {
        event-type: event-type,
        category: category,
        timestamp: current-time,
        block-height: block-height,
        transaction-sender: tx-sender,
        event-data: event-data,
        severity: severity
      })
      
      ;; Update event statistics
      (map-set event-stats event-type 
        (match (map-get? event-stats event-type)
          existing-stats {
            count: (+ (get count existing-stats) u1),
            last-occurrence: current-time,
            first-occurrence: (get first-occurrence existing-stats)
          }
          {
            count: u1,
            last-occurrence: current-time,
            first-occurrence: current-time
          }
        )
      )
      
      ;; Emit structured print event
      (print {
        notification: event-type,
        category: category,
        severity: severity,
        event-id: event-id,
        timestamp: current-time,
        block-height: block-height,
        sender: tx-sender,
        payload: event-data
      })
      
      event-id
    )
  )
)

;; Update user activity tracking
(define-private (track-user-activity (user principal) (action (string-ascii 32)) (volume uint))
  (let (
    (today (/ (default-to u0 (get-block-info? time (- block-height u1))) u86400))
    (activity-key {user: user, date: today})
  )
    (map-set user-activity-log activity-key
      (match (map-get? user-activity-log activity-key)
        existing-activity {
          actions-count: (+ (get actions-count existing-activity) u1),
          last-action: action,
          total-volume: (+ (get total-volume existing-activity) volume)
        }
        {
          actions-count: u1,
          last-action: action,
          total-volume: volume
        }
      )
    )
  )
)

;; Enhanced event emission for token operations
(define-private (emit-token-event 
  (event-type (string-ascii 32))
  (token-id uint)
  (user principal)
  (amount uint)
  (additional-data (string-utf8 256))
)
  (let (
    (event-data (concat 
      (concat "token_id:" (uint-to-ascii token-id))
      (concat ",user:" (principal-to-string user))
      (concat ",amount:" (uint-to-ascii amount))
      (concat ",data:" additional-data)
    ))
  )
    (begin
      (log-structured-event event-type "token" "info" event-data)
      (track-user-activity user event-type amount)
    )
  )
)

;; Helper function to convert uint to ascii (simplified)
(define-private (uint-to-ascii (value uint))
  (if (<= value u9)
    (unwrap-panic (element-at "0123456789" value))
    "N"  ;; Simplified for demo - would need full implementation
  )
)

;; Helper function to convert principal to string (simplified)
(define-private (principal-to-string (p principal))
  "principal" ;; Simplified for demo - would need full implementation
)

;; Concat helper for string building
(define-private (concat (str1 (string-utf8 128)) (str2 (string-utf8 128)))
  (unwrap-panic (as-max-len? (concat str1 str2) u256))
)

;; ===== AUTHORIZATION HELPERS =====

;; Check if caller is authorized to act on behalf of owner
(define-private (is-authorized (owner principal) (operator principal))
  (or 
    (is-eq operator owner)
    (is-eq contract-caller owner)
    (default-to false (map-get? operator-approvals {owner: owner, operator: operator}))
  )
)

;; Check if caller is token creator
(define-private (is-token-creator (token-id uint) (caller principal))
  (match (map-get? token-creators token-id)
    creator (is-eq caller creator)
    false
  )
)

;; Check if caller is contract owner
(define-private (is-contract-owner (caller principal))
  (is-eq caller CONTRACT_OWNER)
)

;; ===== READ-ONLY FUNCTIONS =====

;; Get balance of a specific token for an owner
(define-read-only (balance-of (owner principal) (token-id uint))
  (ok (default-to u0 (map-get? token-balances {token-id: token-id, owner: owner})))
)

;; Get balances of multiple tokens for multiple owners (optimized)
(define-read-only (balance-of-batch (owners (list 100 principal)) (token-ids (list 100 uint)))
  (let ((owner-count (len owners))
        (token-count (len token-ids)))
    (begin
      (asserts! (is-eq owner-count token-count) ERR_BATCH_SIZE_MISMATCH)
      (asserts! (<= owner-count MAX_BATCH_SIZE) ERR_BATCH_TOO_LARGE)
      (ok (map balance-of-single (zip-optimized owners token-ids)))
    )
  )
)

;; Optimized helper function for batch balance queries
(define-private (balance-of-single (owner-token-pair {owner: principal, token-id: uint}))
  (default-to u0 (map-get? token-balances owner-token-pair))
)

;; Optimized zip function with direct tuple creation
(define-private (zip-optimized (owners (list 100 principal)) (token-ids (list 100 uint)))
  (map create-balance-key owners token-ids)
)

;; Create balance key tuple directly
(define-private (create-balance-key (owner principal) (token-id uint))
  {owner: owner, token-id: token-id}
)

;; Get total supply of a token
(define-read-only (total-supply (token-id uint))
  (ok (default-to u0 (map-get? token-supplies token-id)))
)

;; Get token URI
(define-read-only (get-token-uri (token-id uint))
  (ok (map-get? token-uris token-id))
)

;; Get contract URI
(define-read-only (get-contract-uri)
  (ok (var-get contract-uri))
)

;; Get token description
(define-read-only (get-token-description (token-id uint))
  (ok (map-get? token-descriptions token-id))
)

;; Get token royalty info
(define-read-only (get-token-royalty (token-id uint))
  (ok (map-get? token-royalties token-id))
)

;; Check if operator is approved
(define-read-only (is-approved-for-all (owner principal) (operator principal))
  (ok (default-to false (map-get? operator-approvals {owner: owner, operator: operator})))
)

;; Set approval for all tokens with enhanced validation and logging
(define-public (set-approval-for-all (operator principal) (approved bool))
  (begin
    ;; Validation
    (try! (assert-not-paused))
    (asserts! (not (is-eq tx-sender operator)) ERR_INVALID_RECIPIENT)
    
    ;; Update approval
    (map-set operator-approvals {owner: tx-sender, operator: operator} approved)
    
    ;; Emit detailed approval event
    (print {
      notification: "approval-for-all",
      payload: {
        owner: tx-sender,
        operator: operator,
        approved: approved,
        block-height: block-height,
        timestamp: (unwrap-panic (get-block-info? time (- block-height u1)))
      }
    })
    
    (ok true)
  )
)

;; Create a new token type with comprehensive validation and royalty support
(define-public (create-token-with-royalty 
  (initial-supply uint) 
  (uri (string-utf8 256)) 
  (name (string-utf8 64))
  (description (string-utf8 512))
  (royalty-percentage uint)
)
  (let ((token-id (var-get next-token-id)))
    (begin
      ;; Comprehensive validation
      (try! (assert-not-paused))
      (asserts! (is-valid-amount initial-supply) ERR_INVALID_AMOUNT)
      (asserts! (<= initial-supply MAX_SUPPLY) ERR_SUPPLY_EXCEEDED)
      (asserts! (> (len uri) u0) ERR_INVALID_URI)
      (asserts! (<= (len uri) MAX_URI_LENGTH) ERR_INVALID_URI)
      (asserts! (> (len name) u0) ERR_INVALID_URI)
      (asserts! (<= (len name) u64) ERR_INVALID_URI)
      (asserts! (> (len description) u0) ERR_INVALID_URI)
      (asserts! (<= (len description) u512) ERR_INVALID_URI)
      (asserts! (is-valid-royalty royalty-percentage) ERR_INVALID_AMOUNT)
      
      ;; Set token metadata
      (map-set token-uris token-id uri)
      (map-set token-names token-id name)
      (map-set token-descriptions token-id description)
      (map-set token-creators token-id tx-sender)
      (map-set token-supplies token-id initial-supply)
      (map-set token-royalties token-id {creator: tx-sender, percentage: royalty-percentage})
      
      ;; Mint initial supply to creator
      (map-set token-balances {token-id: token-id, owner: tx-sender} initial-supply)
      
      ;; Increment next token ID
      (var-set next-token-id (+ token-id u1))
      
      ;; Emit creation event with enhanced logging
      (emit-token-event "token-created" token-id tx-sender initial-supply name)
      (print {
        notification: "token-created",
        payload: {
          token-id: token-id,
          creator: tx-sender,
          initial-supply: initial-supply,
          uri: uri,
          name: name,
          description: description,
          royalty-percentage: royalty-percentage,
          timestamp: (default-to u0 (get-block-info? time (- block-height u1))),
          block-height: block-height
        }
      })
      
      (ok token-id)
    )
  )
)

;; Mint additional tokens with enhanced validation (only creator can mint)
(define-public (mint (to principal) (token-id uint) (amount uint))
  (let (
    (creator (unwrap! (map-get? token-creators token-id) ERR_TOKEN_NOT_FOUND))
    (current-balance (default-to u0 (map-get? token-balances {token-id: token-id, owner: to})))
    (current-supply (default-to u0 (map-get? token-supplies token-id)))
    (new-supply (+ current-supply amount))
  )
    (begin
      ;; Comprehensive validation
      (try! (assert-not-paused))
      (asserts! (is-token-creator token-id tx-sender) ERR_UNAUTHORIZED)
      (asserts! (is-valid-amount amount) ERR_INVALID_AMOUNT)
      (asserts! (is-valid-recipient to) ERR_INVALID_RECIPIENT)
      (asserts! (<= new-supply MAX_SUPPLY) ERR_SUPPLY_EXCEEDED)
      
      ;; Update balances and supply
      (map-set token-balances {token-id: token-id, owner: to} (+ current-balance amount))
      (map-set token-supplies token-id new-supply)
      
      ;; Emit mint event
      (print {
        notification: "tokens-minted",
        payload: {
          token-id: token-id,
          to: to,
          amount: amount,
          new-balance: (+ current-balance amount),
          new-supply: new-supply
        }
      })
      
      (ok true)
    )
  )
)

;; Safe transfer from one address to another with enhanced logging
(define-public (safe-transfer-from 
  (from principal) 
  (to principal) 
  (token-id uint) 
  (amount uint) 
  (memo (optional (buff 34)))
)
  (let (
    (from-key {token-id: token-id, owner: from})
    (to-key {token-id: token-id, owner: to})
    (sender-balance (default-to u0 (map-get? token-balances from-key)))
    (receiver-balance (default-to u0 (map-get? token-balances to-key)))
    (new-sender-balance (- sender-balance amount))
    (new-receiver-balance (+ receiver-balance amount))
  )
    (begin
      ;; Comprehensive validation
      (try! (assert-not-paused))
      (asserts! (token-exists-check token-id) ERR_TOKEN_NOT_FOUND)
      (asserts! (is-authorized from tx-sender) ERR_UNAUTHORIZED)
      (asserts! (is-valid-recipient to) ERR_INVALID_RECIPIENT)
      (asserts! (is-valid-amount amount) ERR_INVALID_AMOUNT)
      (asserts! (>= sender-balance amount) ERR_INSUFFICIENT_BALANCE)
      
      ;; Update balances
      (map-set token-balances from-key new-sender-balance)
      (map-set token-balances to-key new-receiver-balance)
      
      ;; Handle memo with structured logging
      (match memo 
        memo-data (print {
          notification: "transfer-memo",
          payload: {
            token-id: token-id,
            from: from,
            to: to,
            memo: memo-data
          }
        })
        true
      )
      
      ;; Emit detailed transfer event
      (print {
        notification: "transfer-single",
        payload: {
          operator: tx-sender,
          from: from,
          to: to,
          token-id: token-id,
          amount: amount,
          from-balance-before: sender-balance,
          from-balance-after: new-sender-balance,
          to-balance-before: receiver-balance,
          to-balance-after: new-receiver-balance,
          block-height: block-height
        }
      })
      
      (ok true)
    )
  )
)

;; Batch transfer multiple tokens (optimized)
(define-public (safe-batch-transfer-from 
  (from principal) 
  (to principal) 
  (token-ids (list 100 uint)) 
  (amounts (list 100 uint))
  (memo (optional (buff 34)))
)
  (let ((ids-count (len token-ids))
        (amounts-count (len amounts)))
    (begin
      ;; Early validation
      (try! (assert-not-paused))
      (asserts! (is-authorized from tx-sender) ERR_UNAUTHORIZED)
      (asserts! (is-valid-recipient to) ERR_INVALID_RECIPIENT)
      (asserts! (is-eq ids-count amounts-count) ERR_BATCH_SIZE_MISMATCH)
      (asserts! (<= ids-count MAX_BATCH_SIZE) ERR_BATCH_TOO_LARGE)
      
      ;; Process batch transfer
      (try! (fold batch-transfer-optimized 
        (zip-transfer-data token-ids amounts) 
        {from: from, to: to, index: u0}))
      
      ;; Handle memo
      (match memo memo-data (print {memo: memo-data}) true)
      
      ;; Emit batch transfer event
      (print {
        notification: "transfer-batch",
        payload: {
          operator: tx-sender,
          from: from,
          to: to,
          token-ids: token-ids,
          amounts: amounts
        }
      })
      
      (ok true)
    )
  )
)

;; Optimized batch transfer helper with better error handling
(define-private (batch-transfer-optimized 
  (transfer-item {token-id: uint, amount: uint})
  (batch-state {from: principal, to: principal, index: uint})
)
  (let (
    (token-id (get token-id transfer-item))
    (amount (get amount transfer-item))
    (from (get from batch-state))
    (to (get to batch-state))
    (from-key {token-id: token-id, owner: from})
    (to-key {token-id: token-id, owner: to})
    (sender-balance (default-to u0 (map-get? token-balances from-key)))
    (receiver-balance (default-to u0 (map-get? token-balances to-key)))
  )
    (begin
      ;; Validate transfer
      (asserts! (is-valid-amount amount) ERR_INVALID_AMOUNT)
      (asserts! (>= sender-balance amount) ERR_INSUFFICIENT_BALANCE)
      
      ;; Execute transfer
      (map-set token-balances from-key (- sender-balance amount))
      (map-set token-balances to-key (+ receiver-balance amount))
      
      ;; Return updated state
      {from: from, to: to, index: (+ (get index batch-state) u1)}
    )
  )
)

;; Create transfer data pairs
(define-private (zip-transfer-data (token-ids (list 100 uint)) (amounts (list 100 uint)))
  (map create-transfer-item token-ids amounts)
)

(define-private (create-transfer-item (token-id uint) (amount uint))
  {token-id: token-id, amount: amount}
)

;; Burn tokens with enhanced validation and logging
(define-public (burn (from principal) (token-id uint) (amount uint))
  (let (
    (from-key {token-id: token-id, owner: from})
    (sender-balance (default-to u0 (map-get? token-balances from-key)))
    (current-supply (default-to u0 (map-get? token-supplies token-id)))
    (new-balance (- sender-balance amount))
    (new-supply (- current-supply amount))
  )
    (begin
      ;; Comprehensive validation
      (try! (assert-not-paused))
      (asserts! (token-exists-check token-id) ERR_TOKEN_NOT_FOUND)
      (asserts! (is-authorized from tx-sender) ERR_UNAUTHORIZED)
      (asserts! (is-valid-amount amount) ERR_INVALID_AMOUNT)
      (asserts! (>= sender-balance amount) ERR_INSUFFICIENT_BALANCE)
      
      ;; Update balance and supply
      (map-set token-balances from-key new-balance)
      (map-set token-supplies token-id new-supply)
      
      ;; Increment transaction counter
      (var-set total-transactions (+ (var-get total-transactions) u1))
      
      ;; Emit detailed burn event
      (print {
        notification: "tokens-burned",
        payload: {
          operator: tx-sender,
          from: from,
          token-id: token-id,
          amount: amount,
          balance-before: sender-balance,
          balance-after: new-balance,
          supply-before: current-supply,
          supply-after: new-supply,
          block-height: block-height
        }
      })
      
      (ok true)
    )
  )
)

;; ===== ADMINISTRATIVE FUNCTIONS =====

;; Pause/unpause contract (owner only)
(define-public (set-contract-paused (paused bool))
  (begin
    (asserts! (is-contract-owner tx-sender) ERR_OWNER_ONLY)
    (var-set contract-paused paused)
    
    (print {
      notification: "contract-pause-changed",
      payload: {
        paused: paused,
        admin: tx-sender,
        block-height: block-height
      }
    })
    
    (ok true)
  )
)

;; Emergency token recovery (owner only, for stuck tokens)
(define-public (emergency-transfer (from principal) (to principal) (token-id uint) (amount uint))
  (let (
    (from-key {token-id: token-id, owner: from})
    (to-key {token-id: token-id, owner: to})
    (sender-balance (default-to u0 (map-get? token-balances from-key)))
    (receiver-balance (default-to u0 (map-get? token-balances to-key)))
  )
    (begin
      ;; Only contract owner can perform emergency transfers
      (asserts! (is-contract-owner tx-sender) ERR_OWNER_ONLY)
      (asserts! (token-exists-check token-id) ERR_TOKEN_NOT_FOUND)
      (asserts! (is-valid-amount amount) ERR_INVALID_AMOUNT)
      (asserts! (>= sender-balance amount) ERR_INSUFFICIENT_BALANCE)
      
      ;; Execute emergency transfer
      (map-set token-balances from-key (- sender-balance amount))
      (map-set token-balances to-key (+ receiver-balance amount))
      
      ;; Log emergency action
      (print {
        notification: "emergency-transfer",
        payload: {
          admin: tx-sender,
          from: from,
          to: to,
          token-id: token-id,
          amount: amount,
          reason: "emergency-recovery",
          block-height: block-height
        }
      })
      
      (ok true)
    )
  )
)

;; Set contract URI with validation (owner only)
(define-public (set-contract-uri (uri (string-utf8 256)))
  (begin
    (asserts! (is-contract-owner tx-sender) ERR_OWNER_ONLY)
    (asserts! (> (len uri) u0) ERR_INVALID_URI)
    (asserts! (<= (len uri) MAX_URI_LENGTH) ERR_INVALID_URI)
    
    (var-set contract-uri uri)
    
    (print {
      notification: "contract-uri-updated",
      payload: {
        admin: tx-sender,
        new-uri: uri,
        block-height: block-height
      }
    })
    
    (ok true)
  )
)

;; Set token URI with validation (creator only)
(define-public (set-token-uri (token-id uint) (uri (string-utf8 256)))
  (begin
    (asserts! (token-exists-check token-id) ERR_TOKEN_NOT_FOUND)
    (asserts! (is-token-creator token-id tx-sender) ERR_UNAUTHORIZED)
    (asserts! (> (len uri) u0) ERR_INVALID_URI)
    (asserts! (<= (len uri) MAX_URI_LENGTH) ERR_INVALID_URI)
    
    (map-set token-uris token-id uri)
    
    (print {
      notification: "token-uri-updated",
      payload: {
        token-id: token-id,
        creator: tx-sender,
        new-uri: uri,
        block-height: block-height
      }
    })
    
    (ok true)
  )
)

;; Set token name (creator only)
(define-public (set-token-name (token-id uint) (name (string-utf8 64)))
  (begin
    (asserts! (token-exists-check token-id) ERR_TOKEN_NOT_FOUND)
    (asserts! (is-token-creator token-id tx-sender) ERR_UNAUTHORIZED)
    (asserts! (> (len name) u0) ERR_INVALID_URI)
    (asserts! (<= (len name) u64) ERR_INVALID_URI)
    
    (map-set token-names token-id name)
    
    (print {
      notification: "token-name-updated",
      payload: {
        token-id: token-id,
        creator: tx-sender,
        new-name: name,
        block-height: block-height
      }
    })
    
    (ok true)
  )
)

;; Set token description (creator only)
(define-public (set-token-description (token-id uint) (description (string-utf8 512)))
  (begin
    (asserts! (token-exists-check token-id) ERR_TOKEN_NOT_FOUND)
    (asserts! (is-token-creator token-id tx-sender) ERR_UNAUTHORIZED)
    (asserts! (> (len description) u0) ERR_INVALID_URI)
    (asserts! (<= (len description) u512) ERR_INVALID_URI)
    
    (map-set token-descriptions token-id description)
    
    (print {
      notification: "token-description-updated",
      payload: {
        token-id: token-id,
        creator: tx-sender,
        new-description: description,
        block-height: block-height
      }
    })
    
    (ok true)
  )
)

;; Get next token ID
(define-read-only (get-next-token-id)
  (ok (var-get next-token-id))
)

;; Check if token exists
(define-read-only (token-exists (token-id uint))
  (ok (token-exists-check token-id))
)

;; Get token creator
(define-read-only (get-token-creator (token-id uint))
  (ok (map-get? token-creators token-id))
)

;; Get token name
(define-read-only (get-token-name (token-id uint))
  (ok (map-get? token-names token-id))
)

;; Get contract pause status
(define-read-only (get-contract-paused)
  (ok (var-get contract-paused))
)

;; Get comprehensive token info
(define-read-only (get-token-info (token-id uint))
  (match (map-get? token-creators token-id)
    creator (ok {
      token-id: token-id,
      creator: creator,
      total-supply: (default-to u0 (map-get? token-supplies token-id)),
      uri: (map-get? token-uris token-id),
      name: (map-get? token-names token-id),
      exists: true
    })
    (ok {
      token-id: token-id,
      creator: none,
      total-supply: u0,
      uri: none,
      name: none,
      exists: false
    })
  )
)

;; Get user's token portfolio (balances for multiple tokens)
(define-read-only (get-user-portfolio (user principal) (token-ids (list 50 uint)))
  (ok (map get-user-token-balance token-ids))
)

;; Helper for portfolio queries
(define-private (get-user-token-balance (token-id uint))
  {
    token-id: token-id,
    balance: (default-to u0 (map-get? token-balances {token-id: token-id, owner: tx-sender})),
    exists: (token-exists-check token-id)
  }
)

;; Batch token info query
(define-read-only (get-tokens-info (token-ids (list 50 uint)))
  (ok (map get-single-token-info token-ids))
)

;; Helper for batch token info
(define-private (get-single-token-info (token-id uint))
  {
    token-id: token-id,
    creator: (map-get? token-creators token-id),
    total-supply: (default-to u0 (map-get? token-supplies token-id)),
    exists: (token-exists-check token-id)
  }
)

;; Get contract statistics and metadata
(define-read-only (get-contract-info)
  (ok {
    contract-owner: CONTRACT_OWNER,
    contract-uri: (var-get contract-uri),
    contract-paused: (var-get contract-paused),
    next-token-id: (var-get next-token-id),
    total-tokens-created: (- (var-get next-token-id) u1),
    total-transactions: (var-get total-transactions),
    max-supply-per-token: MAX_SUPPLY,
    max-batch-size: MAX_BATCH_SIZE,
    version: (var-get contract-version),
    total-events: (var-get event-sequence)
  })
)

;; ===== EVENT QUERY FUNCTIONS =====

;; Get event by ID
(define-read-only (get-event-by-id (event-id uint))
  (ok (map-get? event-logs event-id))
)

;; Get event statistics for a specific event type
(define-read-only (get-event-stats (event-type (string-ascii 32)))
  (ok (map-get? event-stats event-type))
)

;; Get user activity for a specific date
(define-read-only (get-user-activity (user principal) (date uint))
  (ok (map-get? user-activity-log {user: user, date: date}))
)

;; Get recent events count
(define-read-only (get-recent-events-count)
  (ok (var-get event-sequence))
)

;; Get contract activity summary
(define-read-only (get-activity-summary)
  (ok {
    total-events: (var-get event-sequence),
    total-transactions: (var-get total-transactions),
    total-tokens: (- (var-get next-token-id) u1),
    contract-version: (var-get contract-version),
    last-block: block-height
  })
)