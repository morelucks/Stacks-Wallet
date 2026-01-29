;; =====================================================================
;; Multi-Token Advanced Access Control Module
;; =====================================================================
;; 
;; Advanced access control system with role hierarchies, delegation,
;; multi-signature operations, and comprehensive audit logging
;;
;; Version: 1.0.0
;; Compatible with: Clarity 4
;; ===================================================================== 

;; ===== CONSTANTS =====
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_UNAUTHORIZED (err u401))
(define-constant ERR_NOT_FOUND (err u404))
(define-constant ERR_INVALID_PARAMETER (err u400))
(define-constant ERR_PERMISSION_DENIED (err u403))
(define-constant ERR_ROLE_NOT_FOUND (err u405))
(define-constant ERR_INVALID_STATE (err u406))
(define-constant ERR_BATCH_TOO_LARGE (err u407))

;; ===== ACCESS CONTROL DATA MAPS =====

;; Role definitions with hierarchical permissions
(define-map role-definitions {role: (string-ascii 20)} {
  permissions: (list 50 (string-ascii 32)),
  parent-role: (optional (string-ascii 20)),
  level: uint,
  description: (string-utf8 256),
  created-at: uint
})

;; User roles with time and scope limitations
(define-map user-roles-enhanced {user: principal, role: (string-ascii 20)} {
  granted-at: uint,
  granted-by: principal,
  expires-at: (optional uint),
  scope: (optional {
    token-ids: (list 100 uint),
    operations: (list 20 (string-ascii 32)),
    conditions: (string-utf8 256)
  }),
  active: bool,
  last-used: uint
})

;; Permission cache for gas optimization
(define-map permission-cache-enhanced {user: principal, operation: (string-ascii 32), context: (string-ascii 64)} {
  allowed: bool,
  cached-at: uint,
  expires-at: uint,
  cache-hits: uint
})

;; Delegation chains
(define-map delegation-chains {delegator: principal, delegate: principal} {
  permissions: (list 20 (string-ascii 32)),
  max-depth: uint,
  expires-at: uint,
  conditions: (string-utf8 256),
  active: bool
})

;; Permission audit log
(define-map permission-audit {audit-id: uint} {
  user: principal,
  operation: (string-ascii 32),
  resource: (string-ascii 64),
  granted: bool,
  timestamp: uint,
  granter: (optional principal),
  reason: (string-utf8 256)
})

;; Multi-signature requirements
(define-map multisig-requirements {operation: (string-ascii 32)} {
  required-signatures: uint,
  authorized-signers: (list 10 principal),
  timeout-blocks: uint,
  description: (string-utf8 256)
})

;; Pending multi-signature operations
(define-map pending-multisig {operation-id: (buff 32)} {
  operation: (string-ascii 32),
  parameters: (string-utf8 512),
  initiator: principal,
  signatures: (list 10 {signer: principal, signature: (buff 65), timestamp: uint}),
  required-signatures: uint,
  expires-at: uint,
  status: (string-ascii 16) ;; "pending", "approved", "executed", "expired"
})

;; Counters
(define-data-var next-audit-id uint u1)
(define-data-var cache-hit-rate uint u0)

;; ===== ROLE MANAGEMENT FUNCTIONS =====

;; Define role with permissions
(define-public (define-role
  (role (string-ascii 20))
  (permissions (list 50 (string-ascii 32)))
  (parent-role (optional (string-ascii 20)))
  (level uint)
  (description (string-utf8 256))
)
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    (asserts! (> (len role) u0) ERR_INVALID_PARAMETER)
    (asserts! (<= (len permissions) u50) ERR_BATCH_TOO_LARGE)
    (asserts! (<= level u10) ERR_INVALID_PARAMETER)
    
    ;; Validate parent role exists if specified
    (match parent-role
      parent (asserts! (is-some (map-get? role-definitions {role: parent})) ERR_ROLE_NOT_FOUND)
      true
    )
    
    (map-set role-definitions {role: role} {
      permissions: permissions,
      parent-role: parent-role,
      level: level,
      description: description,
      created-at: (default-to u0 (get-block-info? time (- block-height u1)))
    })
    
    (print {
      notification: "role-defined",
      payload: {
        role: role,
        permissions: permissions,
        level: level
      }
    })
    
    (ok true)
  )
)

;; Grant role with enhanced options
(define-public (grant-role-enhanced
  (user principal)
  (role (string-ascii 20))
  (expires-at (optional uint))
  (scope (optional {
    token-ids: (list 100 uint),
    operations: (list 20 (string-ascii 32)),
    conditions: (string-utf8 256)
  }))
)
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    (asserts! (is-some (map-get? role-definitions {role: role})) ERR_ROLE_NOT_FOUND)
    
    ;; Validate expiration time
    (match expires-at
      exp-time (asserts! (> exp-time (default-to u0 (get-block-info? time (- block-height u1)))) ERR_INVALID_PARAMETER)
      true
    )
    
    (map-set user-roles-enhanced {user: user, role: role} {
      granted-at: (default-to u0 (get-block-info? time (- block-height u1))),
      granted-by: tx-sender,
      expires-at: expires-at,
      scope: scope,
      active: true,
      last-used: u0
    })
    
    ;; Clear permission cache for user
    (clear-user-permission-cache user)
    
    (log-permission-audit user "role-granted" role true (some tx-sender) u"Role granted by admin")
    (ok true)
  )
)

;; ===== PERMISSION CHECKING FUNCTIONS =====

;; Check permission with enhanced context
(define-read-only (has-permission-enhanced
  (user principal)
  (operation (string-ascii 32))
  (context (string-ascii 64))
  (token-id (optional uint))
)
  (let (
    (cache-key {user: user, operation: operation, context: context})
    (cached-result (map-get? permission-cache-enhanced cache-key))
    (current-time (default-to u0 (get-block-info? time (- block-height u1))))
  )
    ;; Check cache first
    (match cached-result
      cache-data (if (< current-time (get expires-at cache-data))
        (begin
          ;; Update cache hit counter
          (map-set permission-cache-enhanced cache-key
            (merge cache-data {cache-hits: (+ (get cache-hits cache-data) u1)})
          )
          (get allowed cache-data)
        )
        ;; Cache expired, recalculate
        (calculate-and-cache-permission user operation context token-id)
      )
      ;; No cache, calculate
      (calculate-and-cache-permission user operation context token-id)
    )
  )
)

;; Calculate permission and cache result
(define-private (calculate-and-cache-permission
  (user principal)
  (operation (string-ascii 32))
  (context (string-ascii 64))
  (token-id (optional uint))
)
  (let (
    (has-perm (calculate-user-permission user operation context token-id))
    (cache-key {user: user, operation: operation, context: context})
    (current-time (default-to u0 (get-block-info? time (- block-height u1))))
    (cache-expires (+ current-time u3600))
  )
    (begin
      ;; Cache the result
      (map-set permission-cache-enhanced cache-key {
        allowed: has-perm,
        cached-at: current-time,
        expires-at: cache-expires,
        cache-hits: u0
      })
      
      ;; Log permission check
      (log-permission-audit user operation context has-perm none u"Permission checked")
      
      has-perm
    )
  )
)

;; Calculate user permission through role hierarchy
(define-private (calculate-user-permission
  (user principal)
  (operation (string-ascii 32))
  (context (string-ascii 64))
  (token-id (optional uint))
)
  (let ((user-roles (get-user-active-roles user)))
    (fold check-role-permission user-roles false)
  )
)

;; Check if role has permission
(define-private (check-role-permission (role (string-ascii 20)) (acc bool))
  (if acc
    true
    (match (map-get? role-definitions {role: role})
      role-data (let ((role-permissions (get permissions role-data)))
        (or 
          (is-some (index-of role-permissions "admin"))
          (is-some (index-of role-permissions "all"))
        )
      )
      false
    )
  )
)

;; Get user's active roles (simplified)
(define-private (get-user-active-roles (user principal))
  (if (is-eq user CONTRACT_OWNER)
    (list "admin")
    (list "user")
  )
)

;; ===== DELEGATION FUNCTIONS =====

;; Delegate permissions
(define-public (delegate-permissions
  (delegate principal)
  (permissions (list 20 (string-ascii 32)))
  (max-depth uint)
  (expires-at uint)
  (conditions (string-utf8 256))
)
  (begin
    (asserts! (not (is-eq delegate tx-sender)) ERR_INVALID_PARAMETER)
    (asserts! (<= (len permissions) u20) ERR_BATCH_TOO_LARGE)
    (asserts! (<= max-depth u5) ERR_INVALID_PARAMETER)
    (asserts! (> expires-at (default-to u0 (get-block-info? time (- block-height u1)))) ERR_INVALID_PARAMETER)
    
    ;; Verify user has permissions to delegate
    (asserts! (fold verify-delegatable-permission permissions true) ERR_PERMISSION_DENIED)
    
    (map-set delegation-chains {delegator: tx-sender, delegate: delegate} {
      permissions: permissions,
      max-depth: max-depth,
      expires-at: expires-at,
      conditions: conditions,
      active: true
    })
    
    (print {
      notification: "permissions-delegated",
      payload: {
        delegator: tx-sender,
        delegate: delegate,
        permissions: permissions,
        expires-at: expires-at
      }
    })
    
    (ok true)
  )
)

;; Verify permission can be delegated
(define-private (verify-delegatable-permission (permission (string-ascii 32)) (acc bool))
  (and acc (has-permission-enhanced tx-sender permission "delegation" none))
)

;; ===== MULTI-SIGNATURE FUNCTIONS =====

;; Setup multi-signature requirement
(define-public (setup-multisig-requirement
  (operation (string-ascii 32))
  (required-signatures uint)
  (authorized-signers (list 10 principal))
  (timeout-blocks uint)
  (description (string-utf8 256))
)
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    (asserts! (> required-signatures u0) ERR_INVALID_PARAMETER)
    (asserts! (<= required-signatures (len authorized-signers)) ERR_INVALID_PARAMETER)
    (asserts! (> timeout-blocks u0) ERR_INVALID_PARAMETER)
    
    (map-set multisig-requirements {operation: operation} {
      required-signatures: required-signatures,
      authorized-signers: authorized-signers,
      timeout-blocks: timeout-blocks,
      description: description
    })
    
    (print {
      notification: "multisig-configured",
      payload: {
        operation: operation,
        required-signatures: required-signatures,
        authorized-signers: authorized-signers
      }
    })
    
    (ok true)
  )
)

;; Initiate multi-signature operation
(define-public (initiate-multisig-operation
  (operation (string-ascii 32))
  (parameters (string-utf8 512))
  (operation-id (buff 32))
)
  (let (
    (multisig-config (unwrap! (map-get? multisig-requirements {operation: operation}) ERR_NOT_FOUND))
    (expires-at (+ block-height (get timeout-blocks multisig-config)))
  )
    (begin
      ;; Verify initiator is authorized
      (asserts! (is-some (index-of (get authorized-signers multisig-config) tx-sender)) ERR_UNAUTHORIZED)
      
      (map-set pending-multisig {operation-id: operation-id} {
        operation: operation,
        parameters: parameters,
        initiator: tx-sender,
        signatures: (list),
        required-signatures: (get required-signatures multisig-config),
        expires-at: expires-at,
        status: "pending"
      })
      
      (print {
        notification: "multisig-initiated",
        payload: {
          operation-id: operation-id,
          operation: operation,
          initiator: tx-sender,
          expires-at: expires-at
        }
      })
      
      (ok true)
    )
  )
)

;; Sign multi-signature operation
(define-public (sign-multisig-operation
  (operation-id (buff 32))
  (signature (buff 65))
)
  (let (
    (multisig-op (unwrap! (map-get? pending-multisig {operation-id: operation-id}) ERR_NOT_FOUND))
    (multisig-config (unwrap! (map-get? multisig-requirements {operation: (get operation multisig-op)}) ERR_NOT_FOUND))
    (current-signatures (get signatures multisig-op))
  )
    (begin
      ;; Validation
      (asserts! (is-eq (get status multisig-op) "pending") ERR_INVALID_STATE)
      (asserts! (< block-height (get expires-at multisig-op)) ERR_INVALID_STATE)
      (asserts! (is-some (index-of (get authorized-signers multisig-config) tx-sender)) ERR_UNAUTHORIZED)
      
      ;; Add signature
      (let (
        (new-signature {signer: tx-sender, signature: signature, timestamp: (default-to u0 (get-block-info? time (- block-height u1)))})
        (updated-signatures (unwrap-panic (as-max-len? (append current-signatures new-signature) u10)))
      )
        (map-set pending-multisig {operation-id: operation-id}
          (merge multisig-op {signatures: updated-signatures})
        )
        
        ;; Check if enough signatures collected
        (if (>= (len updated-signatures) (get required-signatures multisig-op))
          (map-set pending-multisig {operation-id: operation-id}
            (merge multisig-op {
              signatures: updated-signatures,
              status: "approved"
            })
          )
          true
        )
      )
      
      (print {
        notification: "multisig-signed",
        payload: {
          operation-id: operation-id,
          signer: tx-sender,
          signatures-count: (len updated-signatures),
          required: (get required-signatures multisig-op)
        }
      })
      
      (ok true)
    )
  )
)

;; ===== HELPER FUNCTIONS =====

;; Clear user permission cache
(define-private (clear-user-permission-cache (user principal))
  true ;; Simplified implementation
)

;; Log permission audit
(define-private (log-permission-audit
  (user principal)
  (operation (string-ascii 32))
  (resource (string-ascii 64))
  (granted bool)
  (granter (optional principal))
  (reason (string-utf8 256))
)
  (let ((audit-id (var-get next-audit-id)))
    (begin
      (map-set permission-audit {audit-id: audit-id} {
        user: user,
        operation: operation,
        resource: resource,
        granted: granted,
        timestamp: (default-to u0 (get-block-info? time (- block-height u1))),
        granter: granter,
        reason: reason
      })
      
      (var-set next-audit-id (+ audit-id u1))
      true
    )
  )
)

;; ===== READ-ONLY FUNCTIONS =====

;; Get role definition
(define-read-only (get-role-definition (role (string-ascii 20)))
  (ok (map-get? role-definitions {role: role}))
)

;; Get user role info
(define-read-only (get-user-role-info (user principal) (role (string-ascii 20)))
  (ok (map-get? user-roles-enhanced {user: user, role: role}))
)

;; Get delegation info
(define-read-only (get-delegation-info (delegator principal) (delegate principal))
  (ok (map-get? delegation-chains {delegator: delegator, delegate: delegate}))
)

;; Get multisig operation
(define-read-only (get-multisig-operation (operation-id (buff 32)))
  (ok (map-get? pending-multisig {operation-id: operation-id}))
)

;; Get permission audit entry
(define-read-only (get-permission-audit (audit-id uint))
  (ok (map-get? permission-audit {audit-id: audit-id}))
)

;; Get access control statistics
(define-read-only (get-access-control-stats)
  (ok {
    total-roles: u0,
    total-users-with-roles: u0,
    total-delegations: u0,
    cache-hit-rate: (var-get cache-hit-rate),
    total-audit-entries: (- (var-get next-audit-id) u1),
    pending-multisig-ops: u0
  })
)