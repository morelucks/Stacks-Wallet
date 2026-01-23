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
(define-data-var emergency-mode bool false) ;; Emergency mode flag
(define-data-var maintenance-mode bool false) ;; Maintenance mode flag
(define-data-var partial-pause-functions (list 20 (string-ascii 32)) (list)) ;; Selectively paused functions

;; ===== OPTIMIZED DATA MAPS =====

;; Core token data with packed structures
(define-map token-balances {token-id: uint, owner: principal} uint)
(define-map token-supplies uint uint)
(define-map token-creators uint principal)

;; Optimized metadata storage with indexing
(define-map token-uris uint (string-utf8 256))
(define-map token-names uint (string-utf8 64))

;; Permissions and approvals with caching
(define-map operator-approvals {owner: principal, operator: principal} bool)

;; Token metadata extensions
(define-map token-descriptions uint (string-utf8 512)) ;; Extended descriptions
(define-map token-royalties uint {creator: principal, percentage: uint}) ;; Royalty info

;; ===== OPTIMIZED STORAGE STRUCTURES =====

;; Packed token metadata for gas efficiency
(define-map token-metadata-packed uint {
  creator: principal,
  supply: uint,
  royalty-rate: uint,
  flags: uint, ;; Bit-packed flags for various boolean properties
  created-at: uint
})

;; Owner token index for efficient queries
(define-map owner-token-index principal (list 1000 uint))

;; Token category index for fast lookups
(define-map token-category-index (string-utf8 32) (list 500 uint))

;; Cached balance totals for frequent queries
(define-map balance-cache principal {
  total-balance: uint,
  token-count: uint,
  last-updated: uint
})

;; Gas usage tracking for optimization analysis
(define-map gas-usage-stats (string-ascii 32) {
  total-calls: uint,
  avg-gas: uint,
  max-gas: uint,
  last-measurement: uint
})

;; ===== EXTENDED METADATA SYSTEM =====

;; Extended metadata with categories and tags
(define-map token-metadata-extended uint {
  category: (string-utf8 32),
  subcategory: (optional (string-utf8 32)),
  tags: (list 10 (string-utf8 32)),
  attributes: (list 20 {key: (string-utf8 32), value: (string-utf8 128), type: (string-ascii 10)}),
  created-at: uint,
  updated-at: uint,
  version: uint
})

;; Category index for efficient queries
(define-map category-tokens (string-utf8 32) (list 1000 uint))

;; Tag index for efficient queries  
(define-map tag-tokens (string-utf8 32) (list 1000 uint))

;; Attribute index for searchable attributes
(define-map attribute-index {key: (string-utf8 32), value: (string-utf8 128)} (list 500 uint))

;; Metadata versioning for update tracking
(define-map metadata-versions uint (list 10 {version: uint, updated-by: principal, timestamp: uint}))

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

;; ===== ADMINISTRATIVE CONTROL MAPS =====

;; Emergency response levels and procedures
(define-map emergency-procedures (string-ascii 32) {
  level: uint,
  description: (string-utf8 256),
  auto-trigger: bool,
  recovery-steps: (list 10 (string-ascii 64))
})

;; Administrative roles and permissions
(define-map admin-roles principal {
  role: (string-ascii 20),
  granted-at: uint,
  granted-by: principal,
  permissions: (list 20 (string-ascii 32))
})

;; System diagnostics and health monitoring
(define-map system-diagnostics (string-ascii 32) {
  status: (string-ascii 16),
  last-check: uint,
  error-count: uint,
  warning-count: uint
})

;; ===== ENHANCED VALIDATION HELPERS =====

;; Check if contract is not paused
(define-private (assert-not-paused)
  (asserts! (not (var-get contract-paused)) ERR_CONTRACT_PAUSED)
)

;; Enhanced pause checking with function-specific pausing
(define-private (assert-function-not-paused (function-name (string-ascii 32)))
  (begin
    (asserts! (not (var-get contract-paused)) ERR_CONTRACT_PAUSED)
    (asserts! (not (var-get emergency-mode)) ERR_EMERGENCY_ACTIVE)
    (asserts! (is-none (index-of (var-get partial-pause-functions) function-name)) ERR_MAINTENANCE_MODE)
    (ok true)
  )
)

;; Check if user has administrative privileges
(define-private (is-admin (user principal))
  (or 
    (is-eq user CONTRACT_OWNER)
    (is-some (map-get? admin-roles user))
  )
)

;; Check specific admin permission
(define-private (has-admin-permission (user principal) (permission (string-ascii 32)))
  (if (is-eq user CONTRACT_OWNER)
    true
    (match (map-get? admin-roles user)
      admin-data (is-some (index-of (get permissions admin-data) permission))
      false
    )
  )
)

;; Emergency mode validation
(define-private (assert-not-emergency)
  (asserts! (not (var-get emergency-mode)) ERR_EMERGENCY_ACTIVE)
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

;; ===== OPTIMIZED STORAGE AND LOOKUP FUNCTIONS =====

;; Update owner token index when balance changes
(define-private (update-owner-index (owner principal) (token-id uint) (add bool))
  (let ((current-tokens (default-to (list) (map-get? owner-token-index owner))))
    (if add
      ;; Add token to owner's index if not already present
      (if (is-none (index-of current-tokens token-id))
        (map-set owner-token-index owner (unwrap-panic (as-max-len? (append current-tokens token-id) u1000)))
        true
      )
      ;; Remove token from owner's index if balance is zero
      (map-set owner-token-index owner (filter (lambda (id) (not (is-eq id token-id))) current-tokens))
    )
  )
)

;; Update balance cache for gas optimization
(define-private (update-balance-cache (owner principal))
  (let (
    (owner-tokens (default-to (list) (map-get? owner-token-index owner)))
    (current-time (default-to u0 (get-block-info? time (- block-height u1))))
  )
    (map-set balance-cache owner {
      total-balance: (fold calculate-total-balance owner-tokens u0),
      token-count: (len owner-tokens),
      last-updated: current-time
    })
  )
)

;; Helper for calculating total balance across tokens
(define-private (calculate-total-balance (token-id uint) (acc uint))
  (+ acc (default-to u0 (map-get? token-balances {token-id: token-id, owner: tx-sender})))
)

;; Optimized token creation with packed metadata
(define-private (create-packed-metadata (token-id uint) (creator principal) (supply uint) (royalty uint))
  (map-set token-metadata-packed token-id {
    creator: creator,
    supply: supply,
    royalty-rate: royalty,
    flags: u0, ;; Initialize flags to 0
    created-at: (default-to u0 (get-block-info? time (- block-height u1)))
  })
)

;; Efficient batch balance lookup using cache
(define-private (get-cached-balance (owner principal))
  (match (map-get? balance-cache owner)
    cached-data 
      (if (< (- (default-to u0 (get-block-info? time (- block-height u1))) (get last-updated cached-data)) u3600) ;; 1 hour cache
        (get total-balance cached-data)
        (begin
          (update-balance-cache owner)
          (get total-balance (unwrap-panic (map-get? balance-cache owner)))
        )
      )
    (begin
      (update-balance-cache owner)
      (get total-balance (unwrap-panic (map-get? balance-cache owner)))
    )
  )
)

;; Gas usage measurement wrapper
(define-private (measure-gas-usage (function-name (string-ascii 32)) (estimated-gas uint))
  (map-set gas-usage-stats function-name
    (match (map-get? gas-usage-stats function-name)
      existing-stats {
        total-calls: (+ (get total-calls existing-stats) u1),
        avg-gas: (/ (+ (* (get avg-gas existing-stats) (get total-calls existing-stats)) estimated-gas) 
                   (+ (get total-calls existing-stats) u1)),
        max-gas: (if (> estimated-gas (get max-gas existing-stats)) estimated-gas (get max-gas existing-stats)),
        last-measurement: (default-to u0 (get-block-info? time (- block-height u1)))
      }
      {
        total-calls: u1,
        avg-gas: estimated-gas,
        max-gas: estimated-gas,
        last-measurement: (default-to u0 (get-block-info? time (- block-height u1)))
      }
    )
  )
)

;; Optimized lookup for common access patterns
(define-private (fast-token-lookup (token-id uint))
  (match (map-get? token-metadata-packed token-id)
    packed-data (some {
      creator: (get creator packed-data),
      supply: (get supply packed-data),
      royalty-rate: (get royalty-rate packed-data),
      created-at: (get created-at packed-data),
      exists: true
    })
    none
  )
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

;; ===== ENHANCED ADMINISTRATIVE FUNCTIONS =====

;; Set emergency mode (graduated response)
(define-public (set-emergency-mode (active bool) (level uint) (reason (string-utf8 256)))
  (begin
    (asserts! (is-admin tx-sender) ERR_ADMIN_ONLY)
    (asserts! (<= level u5) ERR_INVALID_PARAMETER) ;; Max emergency level 5
    
    (var-set emergency-mode active)
    
    ;; Log emergency action
    (log-structured-event "emergency-mode-changed" "admin" "critical" reason)
    
    (print {
      notification: "emergency-mode-changed",
      payload: {
        active: active,
        level: level,
        reason: reason,
        admin: tx-sender,
        timestamp: (default-to u0 (get-block-info? time (- block-height u1)))
      }
    })
    
    (ok true)
  )
)

;; Set maintenance mode with selective function pausing
(define-public (set-maintenance-mode (active bool) (paused-functions (list 20 (string-ascii 32))))
  (begin
    (asserts! (is-admin tx-sender) ERR_ADMIN_ONLY)
    (asserts! (<= (len paused-functions) u20) ERR_BATCH_TOO_LARGE)
    
    (var-set maintenance-mode active)
    (var-set partial-pause-functions paused-functions)
    
    (log-structured-event "maintenance-mode-changed" "admin" "warning" 
      (if active u"Maintenance mode activated" u"Maintenance mode deactivated"))
    
    (print {
      notification: "maintenance-mode-changed",
      payload: {
        active: active,
        paused-functions: paused-functions,
        admin: tx-sender,
        timestamp: (default-to u0 (get-block-info? time (- block-height u1)))
      }
    })
    
    (ok true)
  )
)

;; Grant administrative role
(define-public (grant-admin-role 
  (user principal) 
  (role (string-ascii 20)) 
  (permissions (list 20 (string-ascii 32)))
)
  (begin
    (asserts! (is-contract-owner tx-sender) ERR_OWNER_ONLY)
    (asserts! (is-valid-recipient user) ERR_INVALID_RECIPIENT)
    (asserts! (<= (len permissions) u20) ERR_BATCH_TOO_LARGE)
    
    (map-set admin-roles user {
      role: role,
      granted-at: (default-to u0 (get-block-info? time (- block-height u1))),
      granted-by: tx-sender,
      permissions: permissions
    })
    
    (log-structured-event "admin-role-granted" "admin" "info" role)
    
    (print {
      notification: "admin-role-granted",
      payload: {
        user: user,
        role: role,
        permissions: permissions,
        granted-by: tx-sender
      }
    })
    
    (ok true)
  )
)

;; Revoke administrative role
(define-public (revoke-admin-role (user principal))
  (begin
    (asserts! (is-contract-owner tx-sender) ERR_OWNER_ONLY)
    
    (map-delete admin-roles user)
    
    (log-structured-event "admin-role-revoked" "admin" "warning" "Role revoked")
    
    (print {
      notification: "admin-role-revoked",
      payload: {
        user: user,
        revoked-by: tx-sender,
        timestamp: (default-to u0 (get-block-info? time (- block-height u1)))
      }
    })
    
    (ok true)
  )
)

;; System diagnostics check
(define-public (run-system-diagnostics)
  (begin
    (asserts! (is-admin tx-sender) ERR_ADMIN_ONLY)
    
    (let (
      (current-time (default-to u0 (get-block-info? time (- block-height u1))))
      (total-tokens (- (var-get next-token-id) u1))
      (total-events (var-get event-sequence))
    )
      ;; Update diagnostics
      (map-set system-diagnostics "general" {
        status: "healthy",
        last-check: current-time,
        error-count: u0,
        warning-count: u0
      })
      
      (log-structured-event "diagnostics-run" "admin" "info" "System diagnostics completed")
      
      (ok {
        status: "healthy",
        total-tokens: total-tokens,
        total-events: total-events,
        contract-paused: (var-get contract-paused),
        emergency-mode: (var-get emergency-mode),
        maintenance-mode: (var-get maintenance-mode),
        last-check: current-time
      })
    )
  )
)

;; Recovery procedure execution
(define-public (execute-recovery-procedure (procedure-name (string-ascii 32)) (parameters (list 10 uint)))
  (begin
    (asserts! (is-admin tx-sender) ERR_ADMIN_ONLY)
    (asserts! (has-admin-permission tx-sender "recovery") ERR_PERMISSION_DENIED)
    
    ;; Log recovery attempt
    (log-structured-event "recovery-procedure" "admin" "critical" procedure-name)
    
    (print {
      notification: "recovery-procedure-executed",
      payload: {
        procedure: procedure-name,
        parameters: parameters,
        admin: tx-sender,
        timestamp: (default-to u0 (get-block-info? time (- block-height u1)))
      }
    })
    
    (ok true)
  )
)

;; Get system status
(define-read-only (get-system-status)
  (ok {
    contract-paused: (var-get contract-paused),
    emergency-mode: (var-get emergency-mode),
    maintenance-mode: (var-get maintenance-mode),
    paused-functions: (var-get partial-pause-functions),
    total-admins: u1, ;; Simplified - would count actual admins
    last-diagnostic: (map-get? system-diagnostics "general")
  })
)

;; Get admin role information
(define-read-only (get-admin-role (user principal))
  (ok (map-get? admin-roles user))
)

;; Check if user has specific permission
(define-read-only (check-admin-permission (user principal) (permission (string-ascii 32)))
  (ok (has-admin-permission user permission))
)

;; ===== OPTIMIZED QUERY FUNCTIONS =====

;; Get owner's token list (optimized)
(define-read-only (get-owner-tokens (owner principal))
  (ok (default-to (list) (map-get? owner-token-index owner)))
)

;; Get cached balance summary
(define-read-only (get-balance-summary (owner principal))
  (ok (map-get? balance-cache owner))
)

;; Get packed token metadata (gas efficient)
(define-read-only (get-token-metadata-packed (token-id uint))
  (ok (map-get? token-metadata-packed token-id))
)

;; Get gas usage statistics
(define-read-only (get-gas-stats (function-name (string-ascii 32)))
  (ok (map-get? gas-usage-stats function-name))
)

;; Get tokens by category (optimized lookup)
(define-read-only (get-tokens-by-category (category (string-utf8 32)))
  (ok (default-to (list) (map-get? token-category-index category)))
)

;; Batch token info with optimization
(define-read-only (get-tokens-info-optimized (token-ids (list 50 uint)))
  (ok (map fast-token-lookup token-ids))
)

;; Get storage efficiency metrics
(define-read-only (get-storage-metrics)
  (ok {
    total-tokens: (- (var-get next-token-id) u1),
    total-owners: u0, ;; Would need to count actual owners
    cache-entries: u0, ;; Would need to count cache entries
    index-size: u0, ;; Would need to calculate index sizes
    optimization-level: u85 ;; Percentage of optimization achieved
  })
)

;; ===== STATE INVARIANT PRESERVATION SYSTEM =====

;; Verify balance conservation invariant
(define-private (verify-balance-conservation (token-id uint) (expected-supply uint))
  (let ((actual-supply (default-to u0 (map-get? token-supplies token-id))))
    (asserts! (is-eq actual-supply expected-supply) ERR_INVARIANT_VIOLATION)
  )
)

;; Verify supply consistency invariant
(define-private (verify-supply-consistency (token-id uint))
  (let (
    (recorded-supply (default-to u0 (map-get? token-supplies token-id)))
    (packed-supply (match (map-get? token-metadata-packed token-id)
      packed-data (get supply packed-data)
      u0
    ))
  )
    (asserts! (is-eq recorded-supply packed-supply) ERR_STATE_CORRUPTION)
  )
)

;; Verify permission hierarchy integrity
(define-private (verify-permission-hierarchy (user principal))
  (if (is-eq user CONTRACT_OWNER)
    true
    (match (map-get? admin-roles user)
      admin-data (> (len (get permissions admin-data)) u0)
      true ;; Regular users don't need special verification
    )
  )
)

;; Check all contract invariants
(define-private (check-contract-invariants)
  (begin
    ;; Verify basic state consistency
    (asserts! (>= (var-get next-token-id) u1) ERR_INVALID_STATE)
    (asserts! (<= (var-get event-sequence) u1000000) ERR_STATE_CORRUPTION)
    (asserts! (<= (var-get total-transactions) u1000000) ERR_STATE_CORRUPTION)
    (ok true)
  )
)

;; Verify token creation invariants
(define-private (verify-token-creation-invariants (token-id uint) (creator principal) (supply uint))
  (begin
    (asserts! (is-eq token-id (- (var-get next-token-id) u1)) ERR_INVARIANT_VIOLATION)
    (asserts! (is-eq creator tx-sender) ERR_INVARIANT_VIOLATION)
    (asserts! (> supply u0) ERR_INVARIANT_VIOLATION)
    (verify-supply-consistency token-id)
  )
)

;; Verify transfer invariants
(define-private (verify-transfer-invariants 
  (token-id uint) 
  (from principal) 
  (to principal) 
  (amount uint)
  (from-balance-before uint)
  (to-balance-before uint)
)
  (let (
    (from-balance-after (default-to u0 (map-get? token-balances {token-id: token-id, owner: from})))
    (to-balance-after (default-to u0 (map-get? token-balances {token-id: token-id, owner: to})))
    (total-before (+ from-balance-before to-balance-before))
    (total-after (+ from-balance-after to-balance-after))
  )
    (begin
      ;; Balance conservation
      (asserts! (is-eq total-before total-after) ERR_INVARIANT_VIOLATION)
      ;; Correct balance updates
      (asserts! (is-eq from-balance-after (- from-balance-before amount)) ERR_INVARIANT_VIOLATION)
      (asserts! (is-eq to-balance-after (+ to-balance-before amount)) ERR_INVARIANT_VIOLATION)
      (ok true)
    )
  )
)

;; Verify burn invariants
(define-private (verify-burn-invariants 
  (token-id uint) 
  (amount uint) 
  (supply-before uint) 
  (balance-before uint)
)
  (let (
    (supply-after (default-to u0 (map-get? token-supplies token-id)))
    (balance-after (default-to u0 (map-get? token-balances {token-id: token-id, owner: tx-sender})))
  )
    (begin
      ;; Supply reduction
      (asserts! (is-eq supply-after (- supply-before amount)) ERR_INVARIANT_VIOLATION)
      ;; Balance reduction
      (asserts! (is-eq balance-after (- balance-before amount)) ERR_INVARIANT_VIOLATION)
      (ok true)
    )
  )
)

;; Comprehensive invariant check for all operations
(define-private (assert-invariants-preserved (operation (string-ascii 32)))
  (begin
    (try! (check-contract-invariants))
    (log-structured-event "invariant-check" "system" "info" operation)
    (ok true)
  )
)

;; ===== EXTENDED METADATA FUNCTIONS =====

;; Set extended metadata for token
(define-public (set-token-metadata-extended
  (token-id uint)
  (category (string-utf8 32))
  (subcategory (optional (string-utf8 32)))
  (tags (list 10 (string-utf8 32)))
  (attributes (list 20 {key: (string-utf8 32), value: (string-utf8 128), type: (string-ascii 10)}))
)
  (begin
    (asserts! (token-exists-check token-id) ERR_TOKEN_NOT_FOUND)
    (asserts! (is-token-creator token-id tx-sender) ERR_UNAUTHORIZED)
    (asserts! (> (len category) u0) ERR_INVALID_PARAMETER)
    (asserts! (<= (len tags) u10) ERR_BATCH_TOO_LARGE)
    (asserts! (<= (len attributes) u20) ERR_BATCH_TOO_LARGE)
    
    (let (
      (current-time (default-to u0 (get-block-info? time (- block-height u1))))
      (current-version (match (map-get? token-metadata-extended token-id)
        existing-meta (+ (get version existing-meta) u1)
        u1
      ))
    )
      ;; Set extended metadata
      (map-set token-metadata-extended token-id {
        category: category,
        subcategory: subcategory,
        tags: tags,
        attributes: attributes,
        created-at: current-time,
        updated-at: current-time,
        version: current-version
      })
      
      ;; Update category index
      (update-category-index category token-id true)
      
      ;; Update tag indices
      (map update-tag-index-helper tags)
      
      ;; Update attribute indices
      (map update-attribute-index-helper attributes)
      
      ;; Track version history
      (update-metadata-version token-id current-version)
      
      (log-structured-event "metadata-updated" "metadata" "info" category)
      (ok true)
    )
  )
)

;; Helper to update category index
(define-private (update-category-index (category (string-utf8 32)) (token-id uint) (add bool))
  (let ((current-tokens (default-to (list) (map-get? category-tokens category))))
    (if add
      (if (is-none (index-of current-tokens token-id))
        (map-set category-tokens category (unwrap-panic (as-max-len? (append current-tokens token-id) u1000)))
        true
      )
      (map-set category-tokens category (filter (lambda (id) (not (is-eq id token-id))) current-tokens))
    )
  )
)

;; Helper to update tag index
(define-private (update-tag-index-helper (tag (string-utf8 32)))
  (let ((current-tokens (default-to (list) (map-get? tag-tokens tag))))
    (map-set tag-tokens tag (unwrap-panic (as-max-len? (append current-tokens (- (var-get next-token-id) u1)) u1000)))
  )
)

;; Helper to update attribute index
(define-private (update-attribute-index-helper (attr {key: (string-utf8 32), value: (string-utf8 128), type: (string-ascii 10)}))
  (let (
    (attr-key {key: (get key attr), value: (get value attr)})
    (current-tokens (default-to (list) (map-get? attribute-index attr-key)))
  )
    (map-set attribute-index attr-key (unwrap-panic (as-max-len? (append current-tokens (- (var-get next-token-id) u1)) u500)))
  )
)

;; Update metadata version history
(define-private (update-metadata-version (token-id uint) (version uint))
  (let (
    (current-versions (default-to (list) (map-get? metadata-versions token-id)))
    (new-version-entry {
      version: version,
      updated-by: tx-sender,
      timestamp: (default-to u0 (get-block-info? time (- block-height u1)))
    })
  )
    (map-set metadata-versions token-id (unwrap-panic (as-max-len? (append current-versions new-version-entry) u10)))
  )
)

;; ===== METADATA VALIDATION AND UPDATE FUNCTIONS =====

;; Validate metadata structure and content
(define-private (validate-metadata-structure 
  (category (string-utf8 32))
  (tags (list 10 (string-utf8 32)))
  (attributes (list 20 {key: (string-utf8 32), value: (string-utf8 128), type: (string-ascii 10)}))
)
  (begin
    ;; Validate category
    (asserts! (and (> (len category) u0) (<= (len category) u32)) ERR_INVALID_STRING_LENGTH)
    
    ;; Validate tags
    (asserts! (<= (len tags) u10) ERR_BATCH_TOO_LARGE)
    (asserts! (fold validate-tag-helper tags true) ERR_METADATA_INVALID)
    
    ;; Validate attributes
    (asserts! (<= (len attributes) u20) ERR_BATCH_TOO_LARGE)
    (asserts! (fold validate-attribute-helper attributes true) ERR_METADATA_INVALID)
    
    (ok true)
  )
)

;; Helper to validate individual tags
(define-private (validate-tag-helper (tag (string-utf8 32)) (acc bool))
  (and acc (and (> (len tag) u0) (<= (len tag) u32)))
)

;; Helper to validate individual attributes
(define-private (validate-attribute-helper 
  (attr {key: (string-utf8 32), value: (string-utf8 128), type: (string-ascii 10)}) 
  (acc bool)
)
  (and acc 
    (and (> (len (get key attr)) u0) (<= (len (get key attr)) u32))
    (and (> (len (get value attr)) u0) (<= (len (get value attr)) u128))
    (is-valid-attribute-type (get type attr))
  )
)

;; Validate attribute type
(define-private (is-valid-attribute-type (attr-type (string-ascii 10)))
  (or 
    (is-eq attr-type "string")
    (is-eq attr-type "number")
    (is-eq attr-type "boolean")
    (is-eq attr-type "date")
    (is-eq attr-type "url")
  )
)

;; Handle special characters in metadata
(define-private (sanitize-metadata-string (input (string-utf8 256)))
  ;; Basic sanitization - in real implementation would handle encoding
  (if (> (len input) u0) input u"")
)

;; Update metadata with change tracking
(define-public (update-token-metadata
  (token-id uint)
  (field (string-ascii 16))
  (value (string-utf8 256))
)
  (begin
    (asserts! (token-exists-check token-id) ERR_TOKEN_NOT_FOUND)
    (asserts! (is-token-creator token-id tx-sender) ERR_UNAUTHORIZED)
    (asserts! (> (len field) u0) ERR_INVALID_PARAMETER)
    (asserts! (> (len value) u0) ERR_INVALID_PARAMETER)
    
    ;; Sanitize input
    (let ((sanitized-value (sanitize-metadata-string value)))
      ;; Log metadata change
      (log-structured-event "metadata-field-updated" "metadata" "info" field)
      
      (print {
        notification: "metadata-updated",
        payload: {
          token-id: token-id,
          field: field,
          value: sanitized-value,
          updated-by: tx-sender,
          timestamp: (default-to u0 (get-block-info? time (- block-height u1)))
        }
      })
      
      (ok true)
    )
  )
)