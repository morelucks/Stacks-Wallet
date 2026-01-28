;; =====================================================================
;; Multi-Token Insurance Module
;; =====================================================================
;; 
;; Insurance and protection mechanisms for multi-token ecosystem
;; Provides coverage for various risks and automated claim processing
;;
;; Version: 1.0.0
;; Compatible with: Clarity 4
;; ===================================================================== 

;; ===== CONSTANTS =====
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_UNAUTHORIZED (err u401))
(define-constant ERR_NOT_FOUND (err u404))
(define-constant ERR_INVALID_PARAMETER (err u400))
(define-constant ERR_INSUFFICIENT_FUNDS (err u402))
(define-constant ERR_CLAIM_EXPIRED (err u403))
(define-constant ERR_ALREADY_CLAIMED (err u404))

;; Insurance types
(define-constant INSURANCE_SMART_CONTRACT u1)
(define-constant INSURANCE_BRIDGE u2)
(define-constant INSURANCE_STAKING u3)
(define-constant INSURANCE_MARKETPLACE u4)
(define-constant INSURANCE_GOVERNANCE u5)

;; ===== INSURANCE DATA MAPS =====

;; Insurance policies
(define-map insurance-policies {policy-id: uint} {
  policy-holder: principal,
  insurance-type: uint,
  coverage-amount: uint,
  premium-amount: uint,
  premium-token: uint,
  coverage-period: uint,
  created-at: uint,
  expires-at: uint,
  status: (string-ascii 16), ;; "active", "expired", "claimed", "cancelled"
  conditions: (string-utf8 512)
})

;; Insurance claims
(define-map insurance-claims {claim-id: uint} {
  policy-id: uint,
  claimant: principal,
  claim-amount: uint,
  incident-type: (string-ascii 32),
  incident-description: (string-utf8 512),
  evidence-hash: (buff 32),
  status: (string-ascii 16), ;; "pending", "investigating", "approved", "rejected", "paid"
  created-at: uint,
  investigated-at: (optional uint),
  resolved-at: (optional uint),
  investigator: (optional principal)
})

;; Insurance pool
(define-map insurance-pools {insurance-type: uint} {
  total-funds: uint,
  total-policies: uint,
  total-claims-paid: uint,
  risk-assessment: uint, ;; 0-100 risk score
  premium-multiplier: uint, ;; Basis points
  last-actuarial-review: uint
})

;; Risk assessments
(define-map risk-assessments {token-id: uint, risk-type: uint} {
  risk-score: uint, ;; 0-100
  risk-factors: (list 10 (string-ascii 32)),
  last-assessment: uint,
  assessor: principal,
  confidence-level: uint
})

;; Claim investigators
(define-map claim-investigators {investigator: principal} {
  active: bool,
  reputation-score: uint,
  total-investigations: uint,
  successful-investigations: uint,
  stake-amount: uint,
  last-activity: uint
})

;; Counters
(define-data-var next-policy-id uint u1)
(define-data-var next-claim-id uint u1)
(define-data-var total-insurance-volume uint u0)

;; ===== INSURANCE POLICY FUNCTIONS =====

;; Create insurance policy
(define-public (create-insurance-policy
  (insurance-type uint)
  (coverage-amount uint)
  (premium-token uint)
  (coverage-period uint)
  (conditions (string-utf8 512))
)
  (let (
    (policy-id (var-get next-policy-id))
    (pool-data (unwrap! (map-get? insurance-pools {insurance-type: insurance-type}) ERR_NOT_FOUND))
    (premium-amount (calculate-premium coverage-amount insurance-type))
    (current-time (default-to u0 (get-block-info? time (- block-height u1))))
    (expires-at (+ current-time coverage-period))
  )
    (begin
      ;; Validation
      (asserts! (> coverage-amount u0) ERR_INVALID_PARAMETER)
      (asserts! (> coverage-period u0) ERR_INVALID_PARAMETER)
      (asserts! (> (len conditions) u0) ERR_INVALID_PARAMETER)
      
      ;; Check user can pay premium
      (asserts! (>= (get-token-balance premium-token tx-sender) premium-amount) ERR_INSUFFICIENT_FUNDS)
      
      ;; Transfer premium to insurance pool
      ;; (try! (transfer-to-pool premium-token premium-amount tx-sender))
      
      ;; Create policy
      (map-set insurance-policies {policy-id: policy-id} {
        policy-holder: tx-sender,
        insurance-type: insurance-type,
        coverage-amount: coverage-amount,
        premium-amount: premium-amount,
        premium-token: premium-token,
        coverage-period: coverage-period,
        created-at: current-time,
        expires-at: expires-at,
        status: "active",
        conditions: conditions
      })
      
      ;; Update pool statistics
      (map-set insurance-pools {insurance-type: insurance-type}
        (merge pool-data {
          total-funds: (+ (get total-funds pool-data) premium-amount),
          total-policies: (+ (get total-policies pool-data) u1)
        })
      )
      
      ;; Increment policy ID
      (var-set next-policy-id (+ policy-id u1))
      (var-set total-insurance-volume (+ (var-get total-insurance-volume) coverage-amount))
      
      (print {
        notification: "insurance-policy-created",
        payload: {
          policy-id: policy-id,
          holder: tx-sender,
          insurance-type: insurance-type,
          coverage-amount: coverage-amount,
          premium-amount: premium-amount,
          expires-at: expires-at
        }
      })
      
      (ok policy-id)
    )
  )
)

;; File insurance claim
(define-public (file-insurance-claim
  (policy-id uint)
  (claim-amount uint)
  (incident-type (string-ascii 32))
  (incident-description (string-utf8 512))
  (evidence-hash (buff 32))
)
  (let (
    (claim-id (var-get next-claim-id))
    (policy-data (unwrap! (map-get? insurance-policies {policy-id: policy-id}) ERR_NOT_FOUND))
    (current-time (default-to u0 (get-block-info? time (- block-height u1))))
  )
    (begin
      ;; Validation
      (asserts! (is-eq tx-sender (get policy-holder policy-data)) ERR_UNAUTHORIZED)
      (asserts! (is-eq (get status policy-data) "active") ERR_INVALID_PARAMETER)
      (asserts! (< current-time (get expires-at policy-data)) ERR_CLAIM_EXPIRED)
      (asserts! (<= claim-amount (get coverage-amount policy-data)) ERR_INVALID_PARAMETER)
      (asserts! (> (len incident-description) u0) ERR_INVALID_PARAMETER)
      
      ;; Create claim
      (map-set insurance-claims {claim-id: claim-id} {
        policy-id: policy-id,
        claimant: tx-sender,
        claim-amount: claim-amount,
        incident-type: incident-type,
        incident-description: incident-description,
        evidence-hash: evidence-hash,
        status: "pending",
        created-at: current-time,
        investigated-at: none,
        resolved-at: none,
        investigator: none
      })
      
      ;; Increment claim ID
      (var-set next-claim-id (+ claim-id u1))
      
      (print {
        notification: "insurance-claim-filed",
        payload: {
          claim-id: claim-id,
          policy-id: policy-id,
          claimant: tx-sender,
          claim-amount: claim-amount,
          incident-type: incident-type
        }
      })
      
      (ok claim-id)
    )
  )
)

;; Investigate claim (by authorized investigators)
(define-public (investigate-claim
  (claim-id uint)
  (approved bool)
  (investigation-notes (string-utf8 512))
)
  (let (
    (claim-data (unwrap! (map-get? insurance-claims {claim-id: claim-id}) ERR_NOT_FOUND))
    (investigator-data (unwrap! (map-get? claim-investigators {investigator: tx-sender}) ERR_UNAUTHORIZED))
    (current-time (default-to u0 (get-block-info? time (- block-height u1))))
  )
    (begin
      ;; Validation
      (asserts! (get active investigator-data) ERR_UNAUTHORIZED)
      (asserts! (is-eq (get status claim-data) "pending") ERR_INVALID_PARAMETER)
      
      ;; Update claim status
      (map-set insurance-claims {claim-id: claim-id}
        (merge claim-data {
          status: (if approved "approved" "rejected"),
          investigated-at: (some current-time),
          investigator: (some tx-sender)
        })
      )
      
      ;; Update investigator stats
      (map-set claim-investigators {investigator: tx-sender}
        (merge investigator-data {
          total-investigations: (+ (get total-investigations investigator-data) u1),
          successful-investigations: (if approved 
                                       (+ (get successful-investigations investigator-data) u1)
                                       (get successful-investigations investigator-data)),
          last-activity: current-time
        })
      )
      
      ;; Process payment if approved
      (if approved
        (try! (process-claim-payment claim-id))
        (ok true)
      )
      
      (print {
        notification: "claim-investigated",
        payload: {
          claim-id: claim-id,
          investigator: tx-sender,
          approved: approved,
          investigation-notes: investigation-notes
        }
      })
      
      (ok true)
    )
  )
)

;; Process claim payment
(define-private (process-claim-payment (claim-id uint))
  (let (
    (claim-data (unwrap! (map-get? insurance-claims {claim-id: claim-id}) ERR_NOT_FOUND))
    (policy-data (unwrap! (map-get? insurance-policies {policy-id: (get policy-id claim-data)}) ERR_NOT_FOUND))
    (pool-data (unwrap! (map-get? insurance-pools {insurance-type: (get insurance-type policy-data)}) ERR_NOT_FOUND))
  )
    (begin
      ;; Check pool has sufficient funds
      (asserts! (>= (get total-funds pool-data) (get claim-amount claim-data)) ERR_INSUFFICIENT_FUNDS)
      
      ;; Transfer payment to claimant
      ;; (try! (transfer-from-pool (get premium-token policy-data) (get claim-amount claim-data) (get claimant claim-data)))
      
      ;; Update claim status
      (map-set insurance-claims {claim-id: claim-id}
        (merge claim-data {
          status: "paid",
          resolved-at: (some (default-to u0 (get-block-info? time (- block-height u1))))
        })
      )
      
      ;; Update pool statistics
      (map-set insurance-pools {insurance-type: (get insurance-type policy-data)}
        (merge pool-data {
          total-funds: (- (get total-funds pool-data) (get claim-amount claim-data)),
          total-claims-paid: (+ (get total-claims-paid pool-data) (get claim-amount claim-data))
        })
      )
      
      ;; Update policy status
      (map-set insurance-policies {policy-id: (get policy-id claim-data)}
        (merge policy-data {status: "claimed"})
      )
      
      (ok true)
    )
  )
)

;; ===== RISK ASSESSMENT FUNCTIONS =====

;; Assess token risk
(define-public (assess-token-risk
  (token-id uint)
  (risk-type uint)
  (risk-score uint)
  (risk-factors (list 10 (string-ascii 32)))
  (confidence-level uint)
)
  (begin
    ;; Validation (simplified - would check assessor credentials)
    (asserts! (<= risk-score u100) ERR_INVALID_PARAMETER)
    (asserts! (<= confidence-level u100) ERR_INVALID_PARAMETER)
    
    ;; Store risk assessment
    (map-set risk-assessments {token-id: token-id, risk-type: risk-type} {
      risk-score: risk-score,
      risk-factors: risk-factors,
      last-assessment: (default-to u0 (get-block-info? time (- block-height u1))),
      assessor: tx-sender,
      confidence-level: confidence-level
    })
    
    (print {
      notification: "risk-assessment-updated",
      payload: {
        token-id: token-id,
        risk-type: risk-type,
        risk-score: risk-score,
        assessor: tx-sender
      }
    })
    
    (ok true)
  )
)

;; Calculate insurance premium
(define-private (calculate-premium (coverage-amount uint) (insurance-type uint))
  (match (map-get? insurance-pools {insurance-type: insurance-type})
    pool-data (let (
      (base-premium (/ coverage-amount u100)) ;; 1% base rate
      (risk-multiplier (get premium-multiplier pool-data))
      (final-premium (/ (* base-premium risk-multiplier) u10000))
    )
      final-premium
    )
    (/ coverage-amount u100) ;; Default 1% if no pool data
  )
)

;; Placeholder for token balance check
(define-private (get-token-balance (token-id uint) (owner principal))
  u10000 ;; Simplified - would call main contract
)

;; ===== ADMINISTRATIVE FUNCTIONS =====

;; Add claim investigator
(define-public (add-investigator (investigator principal) (stake-amount uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    (asserts! (> stake-amount u0) ERR_INVALID_PARAMETER)
    
    (map-set claim-investigators {investigator: investigator} {
      active: true,
      reputation-score: u100,
      total-investigations: u0,
      successful-investigations: u0,
      stake-amount: stake-amount,
      last-activity: (default-to u0 (get-block-info? time (- block-height u1)))
    })
    
    (ok true)
  )
)

;; Initialize insurance pool
(define-public (initialize-insurance-pool
  (insurance-type uint)
  (initial-funds uint)
  (premium-multiplier uint)
)
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
    (asserts! (> initial-funds u0) ERR_INVALID_PARAMETER)
    
    (map-set insurance-pools {insurance-type: insurance-type} {
      total-funds: initial-funds,
      total-policies: u0,
      total-claims-paid: u0,
      risk-assessment: u50, ;; Medium risk by default
      premium-multiplier: premium-multiplier,
      last-actuarial-review: (default-to u0 (get-block-info? time (- block-height u1)))
    })
    
    (ok true)
  )
)

;; ===== READ-ONLY FUNCTIONS =====

;; Get insurance policy
(define-read-only (get-insurance-policy (policy-id uint))
  (ok (map-get? insurance-policies {policy-id: policy-id}))
)

;; Get insurance claim
(define-read-only (get-insurance-claim (claim-id uint))
  (ok (map-get? insurance-claims {claim-id: claim-id}))
)

;; Get insurance pool info
(define-read-only (get-insurance-pool (insurance-type uint))
  (ok (map-get? insurance-pools {insurance-type: insurance-type}))
)

;; Get risk assessment
(define-read-only (get-risk-assessment (token-id uint) (risk-type uint))
  (ok (map-get? risk-assessments {token-id: token-id, risk-type: risk-type}))
)

;; Calculate premium quote
(define-read-only (get-premium-quote (coverage-amount uint) (insurance-type uint))
  (ok {
    coverage-amount: coverage-amount,
    premium-amount: (calculate-premium coverage-amount insurance-type),
    insurance-type: insurance-type,
    valid-until: (+ (default-to u0 (get-block-info? time (- block-height u1))) u3600) ;; 1 hour validity
  })
)

;; Get insurance overview
(define-read-only (get-insurance-overview)
  (ok {
    total-policies: (- (var-get next-policy-id) u1),
    total-claims: (- (var-get next-claim-id) u1),
    total-coverage: (var-get total-insurance-volume),
    available-types: (list INSURANCE_SMART_CONTRACT INSURANCE_BRIDGE INSURANCE_STAKING INSURANCE_MARKETPLACE INSURANCE_GOVERNANCE)
  })
)