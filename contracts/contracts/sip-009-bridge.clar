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
      
      ;; Add validator signature
      (let ((current-signatures (get validator-signatures request)))
        (map-set bridge-requests request-id
          (merge request {
            validator-signatures: (unwrap-panic (as-max-len? (append current-signatures signature) u10))
          }))
        
        ;; Update validator stats
        (map-set bridge-validators tx-sender
          (merge validator-info {
            total-validations: (+ (get total-validations validator-info) u1)
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

;; Complete bridge (called when token is minted on target chain)
(define-public (complete-bridge-request 
  (request-id uint)
  (target-tx-hash (string-ascii 64)))
  (let ((request (unwrap! (map-get? bridge-requests request-id) ERR-INVALID-REQUEST)))
    (begin
      (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED) ;; Would be oracle/validator
      (asserts! (is-eq (get status request) "confirmed") ERR-INVALID-REQUEST)
      
      (map-set bridge-requests request-id
        (merge request {status: "completed"}))
      
      ;; Update bridge statistics
      (update-bridge-stats (get target-chain request) true)
      
      (print {
        notification: "bridge-request-completed",
        payload: {
          request-id: request-id,
          token-id: (get token-id request),
          target-tx-hash: target-tx-hash
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

(define-private (update-bridge-stats (chain (string-ascii 32)) (success bool))
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
          (- (get success-rate current-stats) u1))
      }))))

;; Query functions
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
    (var-set min-validator-signatures min-sigs)
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