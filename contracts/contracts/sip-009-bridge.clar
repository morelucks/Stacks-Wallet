;; SIP-009 Cross-Chain Bridge Contract
;; Enables NFT bridging between Stacks and other blockchains

;; Bridge state management
(define-map bridge-requests uint {
  token-id: uint,
  owner: principal,
  target-chain: (string-ascii 32),
  target-address: (string-ascii 64),
  status: (string-ascii 16), ;; pending, confirmed, completed, failed
  created-at: uint,
  confirmed-at: (optional uint),
  validator-signatures: (list 10 (buff 65))
})

(define-map locked-tokens uint {
  original-owner: principal,
  locked-at: uint,
  bridge-request-id: uint,
  unlock-signature: (optional (buff 65))
})

(define-map bridge-validators principal {
  active: bool,
  added-at: uint,
  total-validations: uint,
  reputation-score: uint
})

(define-map chain-configs (string-ascii 32) {
  active: bool,
  min-confirmations: uint,
  bridge-fee: uint,
  supported-standards: (list 5 (string-ascii 16))
})

;; Bridge statistics
(define-map bridge-stats (string-ascii 32) {
  total-bridged: uint,
  total-volume: uint,
  success-rate: uint,
  average-time: uint
})

;; Constants
(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u401))
(define-constant ERR-TOKEN-LOCKED (err u402))
(define-constant ERR-INVALID-CHAIN (err u403))
(define-constant ERR-INSUFFICIENT-VALIDATORS (err u404))
(define-constant ERR-BRIDGE-DISABLED (err u405))
(define-constant ERR-INVALID-REQUEST (err u406))
(define-constant ERR-INSUFFICIENT-BALANCE (err u407))
(define-constant ERR-INVALID-SIGNATURE (err u408))
(define-constant ERR-REQUEST-EXPIRED (err u409))

;; Data variables
(define-data-var next-bridge-request-id uint u1)
(define-data-var bridge-enabled bool true)
(define-data-var min-validator-signatures uint u3)
(define-data-var bridge-fee-percentage uint u100) ;; 1%
(define-data-var max-bridge-amount uint u1000000000) ;; 1000 STX max
(define-data-var bridge-timeout-blocks uint u144) ;; ~24 hours

(map-set chain-configs "ethereum" {
  active: true,
  min-confirmations: u12,
  bridge-fee: u1000000, ;; 1 STX
  supported-standards: (list "ERC721" "ERC1155")
})

(map-set chain-configs "polygon" {
  active: true,
  min-confirmations: u20,
  bridge-fee: u500000, ;; 0.5 STX
  supported-standards: (list "ERC721" "ERC1155")
})

(map-set chain-configs "arbitrum" {
  active: true,
  min-confirmations: u8,
  bridge-fee: u750000, ;; 0.75 STX
  supported-standards: (list "ERC721" "ERC1155")
})

(map-set chain-configs "optimism" {
  active: true,
  min-confirmations: u10,
  bridge-fee: u600000, ;; 0.6 STX
  supported-standards: (list "ERC721" "ERC1155")
})

;; Bridge request functions
(define-public (initiate-bridge-request 
  (token-id uint)
  (target-chain (string-ascii 32))
  (target-address (string-ascii 64)))
  (let ((request-id (var-get next-bridge-request-id))
        (chain-config (unwrap! (map-get? chain-configs target-chain) ERR-INVALID-CHAIN))
        (bridge-fee (get bridge-fee chain-config)))
    (begin
      (asserts! (var-get bridge-enabled) ERR-BRIDGE-DISABLED)
      (asserts! (get active chain-config) ERR-INVALID-CHAIN)
      (asserts! (>= (stx-get-balance tx-sender) bridge-fee) ERR-INSUFFICIENT-BALANCE)
      
      ;; Verify token ownership (would integrate with main NFT contract)
      (asserts! (is-token-owner token-id tx-sender) ERR-NOT-AUTHORIZED)
      
      ;; Charge bridge fee
      (try! (stx-transfer? bridge-fee tx-sender CONTRACT-OWNER))
      
      ;; Lock the token
      (try! (lock-token token-id request-id))
      
      ;; Create bridge request
      (map-set bridge-requests request-id {
        token-id: token-id,
        owner: tx-sender,
        target-chain: target-chain,
        target-address: target-address,
        status: "pending",
        created-at: block-height,
        confirmed-at: none,
        validator-signatures: (list)
      })
      
      (var-set next-bridge-request-id (+ request-id u1))
      
      (print {
        notification: "bridge-request-initiated",
        payload: {
          request-id: request-id,
          token-id: token-id,
          target-chain: target-chain,
          target-address: target-address,
          owner: tx-sender,
          fee-paid: bridge-fee
        }
      })
      
      (ok request-id))))

;; Lock token for bridging
(define-private (lock-token (token-id uint) (request-id uint))
  (begin
    ;; Check if token is already locked
    (asserts! (is-none (map-get? locked-tokens token-id)) ERR-TOKEN-LOCKED)
    
    ;; Lock the token
    (map-set locked-tokens token-id {
      original-owner: tx-sender,
      locked-at: block-height,
      bridge-request-id: request-id,
      unlock-signature: none
    })
    
    (ok true)))

;; Validator functions
(define-public (add-validator (validator principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    
    (map-set bridge-validators validator {
      active: true,
      added-at: block-height,
      total-validations: u0,
      reputation-score: u100
    })
    
    (print {
      notification: "validator-added",
      payload: {
        validator: validator,
        added-by: tx-sender
      }
    })
    
    (ok true)))

;; Validate bridge request
(define-public (validate-bridge-request 
  (request-id uint)
  (signature (buff 65)))
  (let ((request (unwrap! (map-get? bridge-requests request-id) ERR-INVALID-REQUEST))
        (validator-info (unwrap! (map-get? bridge-validators tx-sender) ERR-NOT-AUTHORIZED)))
    (begin
      (asserts! (get active validator-info) ERR-NOT-AUTHORIZED)
      (asserts! (is-eq (get status request) "pending") ERR-INVALID-REQUEST)
      (asserts! (< (- block-height (get created-at request)) (var-get bridge-timeout-blocks)) ERR-REQUEST-EXPIRED)
      
      ;; Verify signature format
      (asserts! (is-eq (len signature) u65) ERR-INVALID-SIGNATURE)
      
      ;; Add validator signature
      (let ((current-signatures (get validator-signatures request)))
        (map-set bridge-requests request-id
          (merge request {
            validator-signatures: (unwrap-panic (as-max-len? (append current-signatures signature) u10))
          }))
        
        ;; Update validator stats
        (map-set bridge-validators tx-sender
          (merge validator-info {
            total-validations: (+ (get total-validations validator-info) u1),
            reputation-score: (+ (get reputation-score validator-info) u1)
          }))
        
        ;; Check if we have enough signatures
        (if (>= (+ (len current-signatures) u1) (var-get min-validator-signatures))
          (try! (confirm-bridge-request request-id))
          (ok false))))))

;; Confirm bridge request
(define-private (confirm-bridge-request (request-id uint))
  (let ((request (unwrap! (map-get? bridge-requests request-id) ERR-INVALID-REQUEST)))
    (begin
      (map-set bridge-requests request-id
        (merge request {
          status: "confirmed",
          confirmed-at: (some block-height)
        }))
      
      (print {
        notification: "bridge-request-confirmed",
        payload: {
          request-id: request-id,
          token-id: (get token-id request),
          confirmed-at: block-height
        }
      })
      
      (ok true))))

;; Batch bridge operations
(define-public (batch-initiate-bridge-requests 
  (requests (list 10 {token-id: uint, target-chain: (string-ascii 32), target-address: (string-ascii 64)})))
  (let ((total-fee (fold calculate-batch-fee requests u0)))
    (begin
      (asserts! (>= (stx-get-balance tx-sender) total-fee) ERR-INSUFFICIENT-BALANCE)
      (try! (stx-transfer? total-fee tx-sender CONTRACT-OWNER))
      
      (fold process-batch-request requests (ok (list)))
    )))

(define-private (calculate-batch-fee 
  (request {token-id: uint, target-chain: (string-ascii 32), target-address: (string-ascii 64)})
  (acc uint))
  (let ((chain-config (unwrap-panic (map-get? chain-configs (get target-chain request)))))
    (+ acc (get bridge-fee chain-config))))

(define-private (process-batch-request 
  (request {token-id: uint, target-chain: (string-ascii 32), target-address: (string-ascii 64)})
  (acc (response (list 10 uint) uint)))
  (match acc
    success-list (match (initiate-bridge-request 
                          (get token-id request) 
                          (get target-chain request) 
                          (get target-address request))
                   request-id (ok (unwrap-panic (as-max-len? (append success-list request-id) u10)))
                   error (err error))
    error (err error)))
(define-public (complete-bridge-request 
  (request-id uint)
  (target-tx-hash (string-ascii 64)))
  (let ((request (unwrap! (map-get? bridge-requests request-id) ERR-INVALID-REQUEST))
        (completion-time (- block-height (get created-at request))))
    (begin
      (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED) ;; Would be oracle/validator
      (asserts! (is-eq (get status request) "confirmed") ERR-INVALID-REQUEST)
      
      (map-set bridge-requests request-id
        (merge request {status: "completed"}))
      
      ;; Update bridge statistics with completion time
      (update-bridge-stats (get target-chain request) true completion-time)
      
      (print {
        notification: "bridge-request-completed",
        payload: {
          request-id: request-id,
          token-id: (get token-id request),
          target-tx-hash: target-tx-hash,
          completion-time: completion-time
        }
      })
      
      (ok true))))

;; Unlock token (for failed bridges or return from target chain)
(define-public (unlock-token 
  (token-id uint)
  (unlock-signature (buff 65)))
  (let ((lock-info (unwrap! (map-get? locked-tokens token-id) ERR-INVALID-REQUEST)))
    (begin
      ;; Verify unlock signature (would validate against oracle/validator signatures)
      (asserts! (verify-unlock-signature token-id unlock-signature) ERR-NOT-AUTHORIZED)
      
      ;; Remove lock
      (map-delete locked-tokens token-id)
      
      (print {
        notification: "token-unlocked",
        payload: {
          token-id: token-id,
          original-owner: (get original-owner lock-info)
        }
      })
      
      (ok true))))

;; Helper functions
(define-private (is-token-owner (token-id uint) (user principal))
  ;; Would integrate with main NFT contract to check ownership
  true) ;; Simplified for demo

(define-private (verify-unlock-signature (token-id uint) (signature (buff 65)))
  ;; Would verify signature against validator consensus
  true) ;; Simplified for demo

(define-private (update-bridge-stats (chain (string-ascii 32)) (success bool) (completion-time uint))
  (let ((current-stats (default-to {
    total-bridged: u0,
    total-volume: u0,
    success-rate: u100,
    average-time: u0
  } (map-get? bridge-stats chain))))
    (map-set bridge-stats chain
      (merge current-stats {
        total-bridged: (+ (get total-bridged current-stats) u1),
        success-rate: (if success 
          (get success-rate current-stats) 
          (- (get success-rate current-stats) u1)),
        average-time: (/ (+ (* (get average-time current-stats) (get total-bridged current-stats)) completion-time)
                        (+ (get total-bridged current-stats) u1))
      }))))

;; Cancel bridge request (for expired or failed requests)
(define-public (cancel-bridge-request (request-id uint))
  (let ((request (unwrap! (map-get? bridge-requests request-id) ERR-INVALID-REQUEST)))
    (begin
      (asserts! (or (is-eq tx-sender (get owner request)) 
                    (is-eq tx-sender CONTRACT-OWNER)) ERR-NOT-AUTHORIZED)
      (asserts! (or (is-eq (get status request) "pending")
                    (> (- block-height (get created-at request)) (var-get bridge-timeout-blocks))) ERR-INVALID-REQUEST)
      
      ;; Update request status
      (map-set bridge-requests request-id
        (merge request {status: "cancelled"}))
      
      ;; Unlock the token
      (map-delete locked-tokens (get token-id request))
      
      ;; Refund bridge fee if cancelled by owner within grace period
      (if (and (is-eq tx-sender (get owner request))
               (< (- block-height (get created-at request)) u6)) ;; 1 hour grace period
        (let ((chain-config (unwrap-panic (map-get? chain-configs (get target-chain request)))))
          (try! (stx-transfer? (get bridge-fee chain-config) CONTRACT-OWNER tx-sender)))
        (ok true))
      
      (print {
        notification: "bridge-request-cancelled",
        payload: {
          request-id: request-id,
          token-id: (get token-id request),
          cancelled-by: tx-sender
        }
      })
      
      (ok true))))
(define-read-only (get-bridge-request (request-id uint))
  (map-get? bridge-requests request-id))

(define-read-only (get-locked-token-info (token-id uint))
  (map-get? locked-tokens token-id))

(define-read-only (get-validator-info (validator principal))
  (map-get? bridge-validators validator))

(define-read-only (get-chain-config (chain (string-ascii 32)))
  (map-get? chain-configs chain))

(define-read-only (get-bridge-stats (chain (string-ascii 32)))
  (map-get? bridge-stats chain))

(define-read-only (is-token-locked (token-id uint))
  (is-some (map-get? locked-tokens token-id)))

;; Get pending requests for a user
(define-read-only (get-user-pending-requests (user principal))
  (filter is-user-pending-request (list u1 u2 u3 u4 u5 u6 u7 u8 u9 u10)))

(define-private (is-user-pending-request (request-id uint))
  (match (map-get? bridge-requests request-id)
    request (and (is-eq (get owner request) user)
                 (is-eq (get status request) "pending"))
    false))

;; Get validator performance metrics
(define-read-only (get-validator-metrics (validator principal))
  (match (map-get? bridge-validators validator)
    validator-info (some {
      active: (get active validator-info),
      total-validations: (get total-validations validator-info),
      reputation-score: (get reputation-score validator-info),
      success-rate: (/ (* (get reputation-score validator-info) u100) 
                      (max (get total-validations validator-info) u1))
    })
    none))

;; Administrative functions
(define-public (set-bridge-enabled (enabled bool))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (var-set bridge-enabled enabled)
    (ok true)))

(define-public (update-chain-config 
  (chain (string-ascii 32))
  (active bool)
  (min-confirmations uint)
  (bridge-fee uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    
    (map-set chain-configs chain {
      active: active,
      min-confirmations: min-confirmations,
      bridge-fee: bridge-fee,
      supported-standards: (list "ERC721" "ERC1155")
    })
    
    (ok true)))

(define-public (set-min-validator-signatures (min-sigs uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (asserts! (and (>= min-sigs u1) (<= min-sigs u10)) ERR-INVALID-REQUEST)
    (var-set min-validator-signatures min-sigs)
    (ok true)))

;; Set bridge timeout
(define-public (set-bridge-timeout (timeout-blocks uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (asserts! (and (>= timeout-blocks u6) (<= timeout-blocks u1008)) ERR-INVALID-REQUEST) ;; 1 hour to 1 week
    (var-set bridge-timeout-blocks timeout-blocks)
    (ok true)))

;; Remove inactive validator
(define-public (remove-validator (validator principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (map-delete bridge-validators validator)
    
    (print {
      notification: "validator-removed",
      payload: {
        validator: validator,
        removed-by: tx-sender
      }
    })
    
    (ok true)))

;; Emergency functions
(define-public (emergency-unlock-token (token-id uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (map-delete locked-tokens token-id)
    
    (print {
      notification: "emergency-unlock",
      payload: {
        token-id: token-id,
        admin: tx-sender
      }
    })
    
    (ok true)))

;; Bridge status and statistics
(define-read-only (get-bridge-status)
  {
    enabled: (var-get bridge-enabled),
    total-requests: (- (var-get next-bridge-request-id) u1),
    min-validator-signatures: (var-get min-validator-signatures),
    supported-chains: (list "ethereum" "polygon")
  })