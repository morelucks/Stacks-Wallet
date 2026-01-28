;; =====================================================================
;; Multi-Token Vesting Module
;; =====================================================================
;; 
;; Token vesting and time-locked release system
;; Enables gradual token distribution with customizable schedules
;;
;; Version: 1.0.0
;; Compatible with: Clarity 4
;; ===================================================================== 

;; ===== CONSTANTS =====
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_UNAUTHORIZED (err u401))
(define-constant ERR_NOT_FOUND (err u404))
(define-constant ERR_INVALID_PARAMETER (err u400))
(define-constant ERR_INSUFFICIENT_BALANCE (err u402))
(define-constant ERR_VESTING_NOT_STARTED (err u403))
(define-constant ERR_ALREADY_CLAIMED (err u405))

;; Vesting types
(define-constant VESTING_LINEAR u1)
(define-constant VESTING_CLIFF u2)
(define-constant VESTING_MILESTONE u3)
(define-constant VESTING_CUSTOM u4)

;; ===== VESTING DATA MAPS =====

;; Vesting schedules
(define-map vesting-schedules {schedule-id: uint} {
  beneficiary: principal,
  token-id: uint,
  total-amount: uint,
  vesting-type: uint,
  start-time: uint,
  cliff-duration: uint,
  vesting-duration: uint,
  claimed-amount: uint,
  revoked: bool,
  revocable: bool,
  creator: principal,
  created-at: uint
})

;; Milestone-based vesting
(define-map vesting-milestones {schedule-id: uint, milestone-id: uint} {
  unlock-time: uint,
  unlock-amount: uint,
  condition: (string-utf8 256),
  achieved: bool,
  achieved-at: (optional uint)
})

;; Vesting claims
(define-map vesting-claims {claim-id: uint} {
  schedule-id: uint,
  beneficiary: principal,
  amount: uint,
  claimed-at: uint,
  transaction-hash: (optional (buff 32))
})

;; Counters
(define-data-var next-schedule-id uint u1)
(define-data-var next-claim-id uint u1)
(define-data-var total-vested-amount uint u0)

;; ===== VESTING SCHEDULE FUNCTIONS =====

;; Create linear vesting schedule
(define-public (create-linear-vesting
  (beneficiary principal)
  (token-id uint)
  (total-amount uint)
  (start-time uint)
  (cliff-duration uint)
  (vesting-duration uint)
  (revocable bool)
)
  (let ((schedule-id (var-get next-schedule-id)))
    (begin
      ;; Validation
      (asserts! (> total-amount u0) ERR_INVALID_PARAMETER)
      (asserts! (> vesting-duration u0) ERR_INVALID_PARAMETER)
      (asserts! (>= start-time (default-to u0 (get-block-info? time (- block-height u1)))) ERR_INVALID_PARAMETER)
      (asserts! (<= cliff-duration vesting-duration) ERR_INVALID_PARAMETER)
      
      ;; Check creator has sufficient tokens
      (asserts! (>= (get-token-balance token-id tx-sender) total-amount) ERR_INSUFFICIENT_BALANCE)
      
      ;; Lock tokens (simplified)
      ;; (try! (lock-tokens-for-vesting token-id total-amount tx-sender))
      
      ;; Create vesting schedule
      (map-set vesting-schedules {schedule-id: schedule-id} {
        beneficiary: beneficiary,
        token-id: token-id,
        total-amount: total-amount,
        vesting-type: VESTING_LINEAR,
        start-time: start-time,
        cliff-duration: cliff-duration,
        vesting-duration: vesting-duration,
        claimed-amount: u0,
        revoked: false,
        revocable: revocable,
        creator: tx-sender,
        created-at: (default-to u0 (get-block-info? time (- block-height u1)))
      })
      
      ;; Update total vested amount
      (var-set total-vested-amount (+ (var-get total-vested-amount) total-amount))
      
      ;; Increment schedule ID
      (var-set next-schedule-id (+ schedule-id u1))
      
      (print {
        notification: "vesting-schedule-created",
        payload: {
          schedule-id: schedule-id,
          beneficiary: beneficiary,
          token-id: token-id,
          total-amount: total-amount,
          vesting-type: VESTING_LINEAR
        }
      })
      
      (ok schedule-id)
    )
  )
)
;; Create milestone-based vesting
(define-public (create-milestone-vesting
  (beneficiary principal)
  (token-id uint)
  (total-amount uint)
  (milestones (list 10 {unlock-time: uint, unlock-amount: uint, condition: (string-utf8 256)}))
  (revocable bool)
)
  (let ((schedule-id (var-get next-schedule-id)))
    (begin
      ;; Validation
      (asserts! (> total-amount u0) ERR_INVALID_PARAMETER)
      (asserts! (> (len milestones) u0) ERR_INVALID_PARAMETER)
      (asserts! (<= (len milestones) u10) ERR_INVALID_PARAMETER)
      
      ;; Validate milestone amounts sum to total
      (asserts! (is-eq (fold sum-milestone-amounts milestones u0) total-amount) ERR_INVALID_PARAMETER)
      
      ;; Check creator has sufficient tokens
      (asserts! (>= (get-token-balance token-id tx-sender) total-amount) ERR_INSUFFICIENT_BALANCE)
      
      ;; Create vesting schedule
      (map-set vesting-schedules {schedule-id: schedule-id} {
        beneficiary: beneficiary,
        token-id: token-id,
        total-amount: total-amount,
        vesting-type: VESTING_MILESTONE,
        start-time: (default-to u0 (get-block-info? time (- block-height u1))),
        cliff-duration: u0,
        vesting-duration: u0,
        claimed-amount: u0,
        revoked: false,
        revocable: revocable,
        creator: tx-sender,
        created-at: (default-to u0 (get-block-info? time (- block-height u1)))
      })
      
      ;; Create milestones
      (try! (create-milestones schedule-id milestones u0))
      
      ;; Update total vested amount
      (var-set total-vested-amount (+ (var-get total-vested-amount) total-amount))
      
      ;; Increment schedule ID
      (var-set next-schedule-id (+ schedule-id u1))
      
      (print {
        notification: "milestone-vesting-created",
        payload: {
          schedule-id: schedule-id,
          beneficiary: beneficiary,
          token-id: token-id,
          total-amount: total-amount,
          milestones-count: (len milestones)
        }
      })
      
      (ok schedule-id)
    )
  )
)

;; Helper to sum milestone amounts
(define-private (sum-milestone-amounts 
  (milestone {unlock-time: uint, unlock-amount: uint, condition: (string-utf8 256)})
  (acc uint)
)
  (+ acc (get unlock-amount milestone))
)

;; Helper to create milestones
(define-private (create-milestones 
  (schedule-id uint)
  (milestones (list 10 {unlock-time: uint, unlock-amount: uint, condition: (string-utf8 256)}))
  (milestone-id uint)
)
  (match (element-at milestones milestone-id)
    milestone (begin
      (map-set vesting-milestones {schedule-id: schedule-id, milestone-id: milestone-id} {
        unlock-time: (get unlock-time milestone),
        unlock-amount: (get unlock-amount milestone),
        condition: (get condition milestone),
        achieved: false,
        achieved-at: none
      })
      (if (< milestone-id (- (len milestones) u1))
        (create-milestones schedule-id milestones (+ milestone-id u1))
        (ok true)
      )
    )
    (ok true)
  )
)

;; Claim vested tokens
(define-public (claim-vested-tokens (schedule-id uint))
  (let (
    (schedule-data (unwrap! (map-get? vesting-schedules {schedule-id: schedule-id}) ERR_NOT_FOUND))
    (current-time (default-to u0 (get-block-info? time (- block-height u1))))
    (claimable-amount (unwrap! (calculate-claimable-amount schedule-id current-time) ERR_INVALID_PARAMETER))
    (claim-id (var-get next-claim-id))
  )
    (begin
      ;; Validation
      (asserts! (is-eq tx-sender (get beneficiary schedule-data)) ERR_UNAUTHORIZED)
      (asserts! (not (get revoked schedule-data)) ERR_INVALID_PARAMETER)
      (asserts! (> claimable-amount u0) ERR_INVALID_PARAMETER)
      
      ;; Update claimed amount
      (map-set vesting-schedules {schedule-id: schedule-id}
        (merge schedule-data {
          claimed-amount: (+ (get claimed-amount schedule-data) claimable-amount)
        })
      )
      
      ;; Record claim
      (map-set vesting-claims {claim-id: claim-id} {
        schedule-id: schedule-id,
        beneficiary: tx-sender,
        amount: claimable-amount,
        claimed-at: current-time,
        transaction-hash: none
      })
      
      ;; Transfer tokens (simplified)
      ;; (try! (transfer-vested-tokens (get token-id schedule-data) claimable-amount tx-sender))
      
      ;; Increment claim ID
      (var-set next-claim-id (+ claim-id u1))
      
      (print {
        notification: "vested-tokens-claimed",
        payload: {
          claim-id: claim-id,
          schedule-id: schedule-id,
          beneficiary: tx-sender,
          amount: claimable-amount
        }
      })
      
      (ok claimable-amount)
    )
  )
)

;; Calculate claimable amount
(define-read-only (calculate-claimable-amount (schedule-id uint) (current-time uint))
  (match (map-get? vesting-schedules {schedule-id: schedule-id})
    schedule-data (let (
      (vesting-type (get vesting-type schedule-data))
      (total-amount (get total-amount schedule-data))
      (claimed-amount (get claimed-amount schedule-data))
    )
      (if (get revoked schedule-data)
        (ok u0)
        (if (is-eq vesting-type VESTING_LINEAR)
          (ok (- (calculate-linear-vested-amount schedule-data current-time) claimed-amount))
          (if (is-eq vesting-type VESTING_MILESTONE)
            (ok (- (calculate-milestone-vested-amount schedule-id current-time) claimed-amount))
            (ok u0)
          )
        )
      )
    )
    (err ERR_NOT_FOUND)
  )
)

;; Calculate linear vested amount
(define-private (calculate-linear-vested-amount 
  (schedule-data {
    beneficiary: principal,
    token-id: uint,
    total-amount: uint,
    vesting-type: uint,
    start-time: uint,
    cliff-duration: uint,
    vesting-duration: uint,
    claimed-amount: uint,
    revoked: bool,
    revocable: bool,
    creator: principal,
    created-at: uint
  })
  (current-time uint)
)
  (let (
    (start-time (get start-time schedule-data))
    (cliff-end (+ start-time (get cliff-duration schedule-data)))
    (vesting-end (+ start-time (get vesting-duration schedule-data)))
    (total-amount (get total-amount schedule-data))
  )
    (if (< current-time start-time)
      u0 ;; Vesting hasn't started
      (if (< current-time cliff-end)
        u0 ;; Still in cliff period
        (if (>= current-time vesting-end)
          total-amount ;; Fully vested
          ;; Partially vested
          (/ (* total-amount (- current-time start-time)) (get vesting-duration schedule-data))
        )
      )
    )
  )
)

;; Calculate milestone vested amount
(define-private (calculate-milestone-vested-amount (schedule-id uint) (current-time uint))
  (calculate-milestone-amount schedule-id current-time u0 u0)
)

;; Helper to calculate milestone amount recursively
(define-private (calculate-milestone-amount (schedule-id uint) (current-time uint) (milestone-id uint) (acc uint))
  (match (map-get? vesting-milestones {schedule-id: schedule-id, milestone-id: milestone-id})
    milestone-data (let (
      (unlocked (or (get achieved milestone-data) (>= current-time (get unlock-time milestone-data))))
      (new-acc (if unlocked (+ acc (get unlock-amount milestone-data)) acc))
    )
      (calculate-milestone-amount schedule-id current-time (+ milestone-id u1) new-acc)
    )
    acc ;; No more milestones
  )
)

;; Revoke vesting schedule
(define-public (revoke-vesting-schedule (schedule-id uint))
  (let (
    (schedule-data (unwrap! (map-get? vesting-schedules {schedule-id: schedule-id}) ERR_NOT_FOUND))
    (current-time (default-to u0 (get-block-info? time (- block-height u1))))
  )
    (begin
      ;; Validation
      (asserts! (is-eq tx-sender (get creator schedule-data)) ERR_UNAUTHORIZED)
      (asserts! (get revocable schedule-data) ERR_INVALID_PARAMETER)
      (asserts! (not (get revoked schedule-data)) ERR_INVALID_PARAMETER)
      
      ;; Calculate unvested amount to return
      (let ((vested-amount (unwrap-panic (calculate-claimable-amount schedule-id current-time))))
        ;; Mark as revoked
        (map-set vesting-schedules {schedule-id: schedule-id}
          (merge schedule-data {revoked: true})
        )
        
        ;; Return unvested tokens to creator (simplified)
        ;; (try! (return-unvested-tokens (get token-id schedule-data) (- (get total-amount schedule-data) vested-amount) (get creator schedule-data)))
        
        (print {
          notification: "vesting-schedule-revoked",
          payload: {
            schedule-id: schedule-id,
            revoked-by: tx-sender,
            unvested-amount: (- (get total-amount schedule-data) vested-amount)
          }
        })
        
        (ok true)
      )
    )
  )
)

;; Achieve milestone
(define-public (achieve-milestone (schedule-id uint) (milestone-id uint))
  (let (
    (schedule-data (unwrap! (map-get? vesting-schedules {schedule-id: schedule-id}) ERR_NOT_FOUND))
    (milestone-data (unwrap! (map-get? vesting-milestones {schedule-id: schedule-id, milestone-id: milestone-id}) ERR_NOT_FOUND))
    (current-time (default-to u0 (get-block-info? time (- block-height u1))))
  )
    (begin
      ;; Validation (simplified - would check actual conditions)
      (asserts! (is-eq tx-sender (get creator schedule-data)) ERR_UNAUTHORIZED)
      (asserts! (not (get achieved milestone-data)) ERR_ALREADY_CLAIMED)
      
      ;; Mark milestone as achieved
      (map-set vesting-milestones {schedule-id: schedule-id, milestone-id: milestone-id}
        (merge milestone-data {
          achieved: true,
          achieved-at: (some current-time)
        })
      )
      
      (print {
        notification: "milestone-achieved",
        payload: {
          schedule-id: schedule-id,
          milestone-id: milestone-id,
          unlock-amount: (get unlock-amount milestone-data),
          achieved-at: current-time
        }
      })
      
      (ok true)
    )
  )
)

;; Placeholder for token balance check
(define-private (get-token-balance (token-id uint) (owner principal))
  u10000 ;; Simplified - would call main contract
)

;; ===== READ-ONLY FUNCTIONS =====

;; Get vesting schedule
(define-read-only (get-vesting-schedule (schedule-id uint))
  (ok (map-get? vesting-schedules {schedule-id: schedule-id}))
)

;; Get vesting milestone
(define-read-only (get-vesting-milestone (schedule-id uint) (milestone-id uint))
  (ok (map-get? vesting-milestones {schedule-id: schedule-id, milestone-id: milestone-id}))
)

;; Get vesting claim
(define-read-only (get-vesting-claim (claim-id uint))
  (ok (map-get? vesting-claims {claim-id: claim-id}))
)

;; Get vesting overview
(define-read-only (get-vesting-overview)
  (ok {
    total-schedules: (- (var-get next-schedule-id) u1),
    total-claims: (- (var-get next-claim-id) u1),
    total-vested-amount: (var-get total-vested-amount),
    active-schedules: u0 ;; Would count non-revoked schedules
  })
)

;; Get beneficiary schedules (simplified)
(define-read-only (get-beneficiary-schedules (beneficiary principal))
  (ok (list)) ;; Would return actual schedules for beneficiary
)