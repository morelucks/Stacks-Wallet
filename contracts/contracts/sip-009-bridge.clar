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
  validator-signatures: (list 10 (buff 65)),
  proof-hash: (optional (buff 32)),
  merkle-root: (optional (buff 32)),
  proof-data: (optional (string-ascii 256))
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
  reputation-score: uint,
  successful-validations: uint,
  failed-validations: uint,
  last-validation: uint,
  stake-amount: uint,
  slashing-count: uint
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
      
      ;; Generate cryptographic proof
      (let ((proof-info (generate-transfer-proof token-id tx-sender target-chain)))
        ;; Create bridge request
        (map-set bridge-requests request-id {
          token-id: token-id,
          owner: tx-sender,
          target-chain: target-chain,
          target-address: target-address,
          status: "pending",
          created-at: block-height,
          confirmed-at: none,
          validator-signatures: (list),
          proof-hash: (some (get proof-hash proof-info)),
          merkle-root: (some (get merkle-root proof-info)),
          proof-data: (some (get proof-data proof-info))
        }))
      
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

;; Generate cryptographic proof for cross-chain transfer
(define-private (generate-transfer-proof (token-id uint) (owner principal) (target-chain (string-ascii 32)))
  (let ((proof-data (concat (concat (uint-to-ascii token-id) "|") 
                           (concat (principal-to-string owner) "|")))
        (proof-hash (keccak256 (concat proof-data target-chain))))
    {
      proof-hash: proof-hash,
      proof-data: proof-data,
      merkle-root: (keccak256 (concat proof-hash (buff-to-hex block-height)))
    }))

;; Verify cross-chain proof
(define-private (verify-cross-chain-proof 
  (proof-hash (buff 32))
  (expected-data (string-ascii 256))
  (merkle-root (buff 32)))
  (let ((computed-hash (keccak256 expected-data)))
    (and (is-eq proof-hash computed-hash)
         (is-eq merkle-root (keccak256 (concat proof-hash (buff-to-hex block-height)))))))

;; Cross-chain metadata synchronization
(define-map metadata-sync uint {
  token-id: uint,
  source-chain: (string-ascii 32),
  target-chain: (string-ascii 32),
  metadata-hash: (buff 32),
  sync-status: (string-ascii 16), ;; pending, synced, failed
  last-updated: uint,
  sync-attempts: uint
})

;; Synchronize metadata across chains
(define-public (sync-metadata-cross-chain 
  (token-id uint)
  (target-chain (string-ascii 32))
  (metadata-uri (string-ascii 256)))
  (let ((metadata-hash (keccak256 metadata-uri))
        (sync-id (+ (* token-id u1000) (len target-chain))))
    (begin
      (asserts! (is-token-owner token-id tx-sender) ERR-NOT-AUTHORIZED)
      
      (map-set metadata-sync sync-id {
        token-id: token-id,
        source-chain: "stacks",
        target-chain: target-chain,
        metadata-hash: metadata-hash,
        sync-status: "pending",
        last-updated: block-height,
        sync-attempts: u1
      })
      
      (print {
        notification: "metadata-sync-initiated",
        payload: {
          token-id: token-id,
          target-chain: target-chain,
          metadata-hash: metadata-hash,
          sync-id: sync-id
        }
      })
      
      (ok sync-id))))

;; Confirm metadata synchronization
(define-public (confirm-metadata-sync 
  (sync-id uint)
  (confirmation-hash (buff 32)))
  (let ((sync-info (unwrap! (map-get? metadata-sync sync-id) ERR-INVALID-REQUEST)))
    (begin
      (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED) ;; Would be oracle
      (asserts! (is-eq (get sync-status sync-info) "pending") ERR-INVALID-REQUEST)
      (asserts! (is-eq (get metadata-hash sync-info) confirmation-hash) ERR-INVALID-REQUEST)
      
      (map-set metadata-sync sync-id
        (merge sync-info {
          sync-status: "synced",
          last-updated: block-height
        }))
      
      (print {
        notification: "metadata-sync-confirmed",
        payload: {
          sync-id: sync-id,
          token-id: (get token-id sync-info),
          target-chain: (get target-chain sync-info)
        }
      })
      
      (ok true))))

;; Bridge failure recovery system
(define-map recovery-requests uint {
  original-request-id: uint,
  failure-reason: (string-ascii 64),
  recovery-method: (string-ascii 32), ;; rollback, retry, manual
  initiated-by: principal,
  initiated-at: uint,
  recovery-status: (string-ascii 16), ;; pending, processing, completed, failed
  recovery-data: (optional (string-ascii 256))
})

(define-data-var next-recovery-id uint u1)

;; Initiate bridge failure recovery
(define-public (initiate-recovery 
  (request-id uint)
  (failure-reason (string-ascii 64))
  (recovery-method (string-ascii 32)))
  (let ((request (unwrap! (map-get? bridge-requests request-id) ERR-INVALID-REQUEST))
        (recovery-id (var-get next-recovery-id)))
    (begin
      (asserts! (or (is-eq tx-sender (get owner request))
                    (is-eq tx-sender CONTRACT-OWNER)) ERR-NOT-AUTHORIZED)
      (asserts! (or (is-eq (get status request) "failed")
                    (is-eq (get status request) "pending")) ERR-INVALID-REQUEST)
      
      (map-set recovery-requests recovery-id {
        original-request-id: request-id,
        failure-reason: failure-reason,
        recovery-method: recovery-method,
        initiated-by: tx-sender,
        initiated-at: block-height,
        recovery-status: "pending",
        recovery-data: none
      })
      
      (var-set next-recovery-id (+ recovery-id u1))
      
      (print {
        notification: "recovery-initiated",
        payload: {
          recovery-id: recovery-id,
          original-request-id: request-id,
          failure-reason: failure-reason,
          recovery-method: recovery-method
        }
      })
      
      (ok recovery-id))))

;; Execute rollback recovery
(define-public (execute-rollback-recovery (recovery-id uint))
  (let ((recovery-info (unwrap! (map-get? recovery-requests recovery-id) ERR-INVALID-REQUEST))
        (original-request (unwrap! (map-get? bridge-requests (get original-request-id recovery-info)) ERR-INVALID-REQUEST)))
    (begin
      (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
      (asserts! (is-eq (get recovery-method recovery-info) "rollback") ERR-INVALID-REQUEST)
      (asserts! (is-eq (get recovery-status recovery-info) "pending") ERR-INVALID-REQUEST)
      
      ;; Update recovery status
      (map-set recovery-requests recovery-id
        (merge recovery-info {
          recovery-status: "processing"
        }))
      
      ;; Unlock the token
      (map-delete locked-tokens (get token-id original-request))
      
      ;; Update original request status
      (map-set bridge-requests (get original-request-id recovery-info)
        (merge original-request {status: "rolled-back"}))
      
      ;; Complete recovery
      (map-set recovery-requests recovery-id
        (merge recovery-info {
          recovery-status: "completed",
          recovery-data: (some "Token unlocked and request rolled back")
        }))
      
      (print {
        notification: "rollback-completed",
        payload: {
          recovery-id: recovery-id,
          token-id: (get token-id original-request),
          owner: (get owner original-request)
        }
      })
      
      (ok true))))

;; Retry failed bridge request
(define-public (retry-bridge-request (recovery-id uint))
  (let ((recovery-info (unwrap! (map-get? recovery-requests recovery-id) ERR-INVALID-REQUEST))
        (original-request (unwrap! (map-get? bridge-requests (get original-request-id recovery-info)) ERR-INVALID-REQUEST)))
    (begin
      (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
      (asserts! (is-eq (get recovery-method recovery-info) "retry") ERR-INVALID-REQUEST)
      (asserts! (is-eq (get recovery-status recovery-info) "pending") ERR-INVALID-REQUEST)
      
      ;; Reset original request to pending
      (map-set bridge-requests (get original-request-id recovery-info)
        (merge original-request {
          status: "pending",
          validator-signatures: (list)
        }))
      
      ;; Update recovery status
      (map-set recovery-requests recovery-id
        (merge recovery-info {
          recovery-status: "completed",
          recovery-data: (some "Request reset for retry")
        }))
      
      (print {
        notification: "retry-initiated",
        payload: {
          recovery-id: recovery-id,
          request-id: (get original-request-id recovery-info)
        }
      })
      
      (ok true))))

;; Get recovery request info
(define-read-only (get-recovery-request (recovery-id uint))
  (map-get? recovery-requests recovery-id))

;; Get metadata sync status
(define-read-only (get-metadata-sync-status (sync-id uint))
  (map-get? metadata-sync sync-id))

;; Helper functions for proof generation
(define-private (uint-to-ascii (value uint))
  (if (is-eq value u0) "0"
    (unwrap-panic (as-max-len? (int-to-ascii (to-int value)) u32))))

(define-private (principal-to-string (p principal))
  (unwrap-panic (as-max-len? (unwrap-panic (principal-destruct? p)) u64)))

(define-private (buff-to-hex (value uint))
  (unwrap-panic (as-max-len? (concat "0x" (uint-to-ascii value)) u32)))

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

;; Validator staking and slashing system
(define-constant MIN-VALIDATOR-STAKE u1000000000) ;; 1000 STX minimum stake

;; Stake tokens to become validator
(define-public (stake-as-validator (stake-amount uint))
  (begin
    (asserts! (>= stake-amount MIN-VALIDATOR-STAKE) ERR-INSUFFICIENT-BALANCE)
    (asserts! (>= (stx-get-balance tx-sender) stake-amount) ERR-INSUFFICIENT-BALANCE)
    
    ;; Transfer stake to contract
    (try! (stx-transfer? stake-amount tx-sender (as-contract tx-sender)))
    
    ;; Add or update validator
    (map-set bridge-validators tx-sender {
      active: true,
      added-at: block-height,
      total-validations: u0,
      reputation-score: u100,
      successful-validations: u0,
      failed-validations: u0,
      last-validation: u0,
      stake-amount: stake-amount,
      slashing-count: u0
    })
    
    (print {
      notification: "validator-staked",
      payload: {
        validator: tx-sender,
        stake-amount: stake-amount
      }
    })
    
    (ok true)))

;; Slash validator for malicious behavior
(define-public (slash-validator (validator principal) (slash-percentage uint))
  (let ((validator-info (unwrap! (map-get? bridge-validators validator) ERR-NOT-AUTHORIZED)))
    (begin
      (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
      (asserts! (<= slash-percentage u100) ERR-INVALID-REQUEST)
      
      (let ((slash-amount (/ (* (get stake-amount validator-info) slash-percentage) u100))
            (remaining-stake (- (get stake-amount validator-info) slash-amount)))
        
        ;; Update validator info
        (map-set bridge-validators validator
          (merge validator-info {
            stake-amount: remaining-stake,
            slashing-count: (+ (get slashing-count validator-info) u1),
            reputation-score: (max (- (get reputation-score validator-info) u10) u0),
            active: (> remaining-stake (/ MIN-VALIDATOR-STAKE u2)) ;; Deactivate if stake too low
          }))
        
        (print {
          notification: "validator-slashed",
          payload: {
            validator: validator,
            slash-amount: slash-amount,
            remaining-stake: remaining-stake
          }
        })
        
        (ok slash-amount)))))

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
    bridge-timeout-blocks: (var-get bridge-timeout-blocks),
    max-bridge-amount: (var-get max-bridge-amount),
    supported-chains: (list "ethereum" "polygon" "arbitrum" "optimism")
  })

;; Get comprehensive bridge analytics
(define-read-only (get-bridge-analytics)
  (let ((ethereum-stats (default-to {total-bridged: u0, total-volume: u0, success-rate: u100, average-time: u0} 
                                   (map-get? bridge-stats "ethereum")))
        (polygon-stats (default-to {total-bridged: u0, total-volume: u0, success-rate: u100, average-time: u0} 
                                  (map-get? bridge-stats "polygon")))
        (arbitrum-stats (default-to {total-bridged: u0, total-volume: u0, success-rate: u100, average-time: u0} 
                                   (map-get? bridge-stats "arbitrum")))
        (optimism-stats (default-to {total-bridged: u0, total-volume: u0, success-rate: u100, average-time: u0} 
                                   (map-get? bridge-stats "optimism"))))
    {
      total-bridges: (+ (+ (get total-bridged ethereum-stats) (get total-bridged polygon-stats))
                       (+ (get total-bridged arbitrum-stats) (get total-bridged optimism-stats))),
      ethereum: ethereum-stats,
      polygon: polygon-stats,
      arbitrum: arbitrum-stats,
      optimism: optimism-stats
    }))

;; Pause/unpause specific chain
(define-public (set-chain-status (chain (string-ascii 32)) (active bool))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (let ((current-config (unwrap! (map-get? chain-configs chain) ERR-INVALID-CHAIN)))
      (map-set chain-configs chain
        (merge current-config {active: active}))
      
      (print {
        notification: "chain-status-updated",
        payload: {
          chain: chain,
          active: active,
          updated-by: tx-sender
        }
      })
      
      (ok true))))

;; Bulk validator operations
(define-public (bulk-add-validators (validators (list 10 principal)))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (fold add-single-validator validators (ok true))))

(define-private (add-single-validator (validator principal) (acc (response bool uint)))
  (match acc
    success (add-validator validator)
    error (err error)))

;; Emergency pause all bridges
(define-public (emergency-pause)
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (var-set bridge-enabled false)
    
    (print {
      notification: "emergency-pause-activated",
      payload: {
        paused-by: tx-sender,
        timestamp: block-height
      }
    })
    
    (ok true)))
;; Bridge request history tracking
(define-map request-history uint {
  previous-status: (string-ascii 16),
  new-status: (string-ascii 16),
  changed-at: uint,
  changed-by: principal
})

;; Update request status with history
(define-private (update-request-status (request-id uint) (new-status (string-ascii 16)))
  (let ((request (unwrap-panic (map-get? bridge-requests request-id))))
    (begin
      ;; Record history
      (map-set request-history request-id {
        previous-status: (get status request),
        new-status: new-status,
        changed-at: block-height,
        changed-by: tx-sender
      })
      
      ;; Update request
      (map-set bridge-requests request-id
        (merge request {status: new-status}))
      
      (ok true))))

;; Get request history
(define-read-only (get-request-history (request-id uint))
  (map-get? request-history request-id))
;; Bridge fee discount system
(define-map user-discounts principal {
  discount-percentage: uint,
  valid-until: uint,
  granted-by: principal
})

;; Grant discount to user
(define-public (grant-user-discount 
  (user principal) 
  (discount-percentage uint) 
  (valid-blocks uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (asserts! (<= discount-percentage u50) ERR-INVALID-REQUEST) ;; Max 50% discount
    
    (map-set user-discounts user {
      discount-percentage: discount-percentage,
      valid-until: (+ block-height valid-blocks),
      granted-by: tx-sender
    })
    
    (print {
      notification: "discount-granted",
      payload: {
        user: user,
        discount: discount-percentage,
        valid-until: (+ block-height valid-blocks)
      }
    })
    
    (ok true)))

;; Calculate discounted fee
(define-private (calculate-bridge-fee (user principal) (base-fee uint))
  (match (map-get? user-discounts user)
    discount-info (if (> (get valid-until discount-info) block-height)
                    (- base-fee (/ (* base-fee (get discount-percentage discount-info)) u100))
                    base-fee)
    base-fee))