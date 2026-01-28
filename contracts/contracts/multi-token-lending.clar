;; =====================================================================
;; Multi-Token Lending Module
;; =====================================================================
;; 
;; Decentralized lending and borrowing system for multi-token ecosystem
;; Enables collateralized loans and interest-bearing deposits
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
(define-constant ERR_INSUFFICIENT_COLLATERAL (err u403))
(define-constant ERR_LOAN_DEFAULTED (err u405))
(define-constant ERR_LOAN_ACTIVE (err u406))

;; Loan status constants
(define-constant LOAN_ACTIVE u1)
(define-constant LOAN_REPAID u2)
(define-constant LOAN_DEFAULTED u3)
(define-constant LOAN_LIQUIDATED u4)

;; ===== LENDING DATA MAPS =====

;; Lending pools
(define-map lending-pools {pool-id: uint} {
  token-id: uint,
  total-deposits: uint,
  total-borrowed: uint,
  interest-rate: uint, ;; Annual rate in basis points
  collateral-ratio: uint, ;; Required collateral ratio in basis points
  liquidation-threshold: uint, ;; Liquidation threshold in basis points
  pool-creator: principal,
  active: bool,
  created-at: uint
})

;; User deposits
(define-map user-deposits {pool-id: uint, depositor: principal} {
  amount: uint,
  deposit-time: uint,
  interest-earned: uint,
  last-interest-claim: uint
})

;; Loans
(define-map loans {loan-id: uint} {
  borrower: principal,
  pool-id: uint,
  loan-amount: uint,
  collateral-token: uint,
  collateral-amount: uint,
  interest-rate: uint,
  loan-start: uint,
  loan-duration: uint,
  status: uint,
  interest-paid: uint,
  last-payment: uint
})

;; Collateral prices (simplified oracle)
(define-map token-prices {token-id: uint} {
  price: uint, ;; Price in basis currency
  last-updated: uint,
  oracle: principal
})

;; Liquidation events
(define-map liquidations {liquidation-id: uint} {
  loan-id: uint,
  liquidator: principal,
  collateral-seized: uint,
  debt-covered: uint,
  liquidation-time: uint,
  bonus-paid: uint
})

;; Counters
(define-data-var next-pool-id uint u1)
(define-data-var next-loan-id uint u1)
(define-data-var next-liquidation-id uint u1)
(define-data-var total-lending-volume uint u0)

;; ===== LENDING POOL FUNCTIONS =====

;; Create lending pool
(define-public (create-lending-pool
  (token-id uint)
  (interest-rate uint)
  (collateral-ratio uint)
  (liquidation-threshold uint)
)
  (let ((pool-id (var-get next-pool-id)))
    (begin
      ;; Validation
      (asserts! (> interest-rate u0) ERR_INVALID_PARAMETER)
      (asserts! (<= interest-rate u10000) ERR_INVALID_PARAMETER) ;; Max 100% APR
      (asserts! (> collateral-ratio u10000) ERR_INVALID_PARAMETER) ;; Must be over-collateralized
      (asserts! (< liquidation-threshold collateral-ratio) ERR_INVALID_PARAMETER)
      
      ;; Create pool
      (map-set lending-pools {pool-id: pool-id} {
        token-id: token-id,
        total-deposits: u0,
        total-borrowed: u0,
        interest-rate: interest-rate,
        collateral-ratio: collateral-ratio,
        liquidation-threshold: liquidation-threshold,
        pool-creator: tx-sender,
        active: true,
        created-at: (default-to u0 (get-block-info? time (- block-height u1)))
      })
      
      ;; Increment pool ID
      (var-set next-pool-id (+ pool-id u1))
      
      (print {
        notification: "lending-pool-created",
        payload: {
          pool-id: pool-id,
          token-id: token-id,
          interest-rate: interest-rate,
          collateral-ratio: collateral-ratio,
          creator: tx-sender
        }
      })
      
      (ok pool-id)
    )
  )
)

;; Deposit tokens to lending pool
(define-public (deposit-to-pool (pool-id uint) (amount uint))
  (let (
    (pool-data (unwrap! (map-get? lending-pools {pool-id: pool-id}) ERR_NOT_FOUND))
    (deposit-key {pool-id: pool-id, depositor: tx-sender})
    (existing-deposit (map-get? user-deposits deposit-key))
    (current-time (default-to u0 (get-block-info? time (- block-height u1))))
  )
    (begin
      ;; Validation
      (asserts! (get active pool-data) ERR_INVALID_PARAMETER)
      (asserts! (> amount u0) ERR_INVALID_PARAMETER)
      (asserts! (>= (get-token-balance (get token-id pool-data) tx-sender) amount) ERR_INSUFFICIENT_BALANCE)
      
      ;; Claim existing interest first
      (match existing-deposit
        deposit-data (try! (claim-deposit-interest pool-id))
        true
      )
      
      ;; Update deposit
      (map-set user-deposits deposit-key
        (match existing-deposit
          deposit-data {
            amount: (+ (get amount deposit-data) amount),
            deposit-time: (get deposit-time deposit-data),
            interest-earned: u0, ;; Reset after claiming
            last-interest-claim: current-time
          }
          {
            amount: amount,
            deposit-time: current-time,
            interest-earned: u0,
            last-interest-claim: current-time
          }
        )
      )
      
      ;; Update pool totals
      (map-set lending-pools {pool-id: pool-id}
        (merge pool-data {
          total-deposits: (+ (get total-deposits pool-data) amount)
        })
      )
      
      ;; Transfer tokens to pool (simplified)
      ;; (try! (transfer-to-pool (get token-id pool-data) amount tx-sender))
      
      (print {
        notification: "tokens-deposited",
        payload: {
          pool-id: pool-id,
          depositor: tx-sender,
          amount: amount,
          new-total: (+ (get total-deposits pool-data) amount)
        }
      })
      
      (ok true)
    )
  )
)

;; Borrow tokens from pool
(define-public (borrow-from-pool
  (pool-id uint)
  (loan-amount uint)
  (collateral-token uint)
  (collateral-amount uint)
  (loan-duration uint)
)
  (let (
    (loan-id (var-get next-loan-id))
    (pool-data (unwrap! (map-get? lending-pools {pool-id: pool-id}) ERR_NOT_FOUND))
    (current-time (default-to u0 (get-block-info? time (- block-height u1))))
  )
    (begin
      ;; Validation
      (asserts! (get active pool-data) ERR_INVALID_PARAMETER)
      (asserts! (> loan-amount u0) ERR_INVALID_PARAMETER)
      (asserts! (> collateral-amount u0) ERR_INVALID_PARAMETER)
      (asserts! (> loan-duration u0) ERR_INVALID_PARAMETER)
      
      ;; Check pool has sufficient liquidity
      (asserts! (>= (- (get total-deposits pool-data) (get total-borrowed pool-data)) loan-amount) ERR_INSUFFICIENT_BALANCE)
      
      ;; Check borrower has sufficient collateral
      (asserts! (>= (get-token-balance collateral-token tx-sender) collateral-amount) ERR_INSUFFICIENT_BALANCE)
      
      ;; Validate collateral ratio
      (try! (validate-collateral-ratio loan-amount (get token-id pool-data) collateral-amount collateral-token (get collateral-ratio pool-data)))
      
      ;; Create loan
      (map-set loans {loan-id: loan-id} {
        borrower: tx-sender,
        pool-id: pool-id,
        loan-amount: loan-amount,
        collateral-token: collateral-token,
        collateral-amount: collateral-amount,
        interest-rate: (get interest-rate pool-data),
        loan-start: current-time,
        loan-duration: loan-duration,
        status: LOAN_ACTIVE,
        interest-paid: u0,
        last-payment: current-time
      })
      
      ;; Update pool borrowed amount
      (map-set lending-pools {pool-id: pool-id}
        (merge pool-data {
          total-borrowed: (+ (get total-borrowed pool-data) loan-amount)
        })
      )
      
      ;; Transfer collateral to contract and loan amount to borrower (simplified)
      ;; (try! (transfer-collateral collateral-token collateral-amount tx-sender))
      ;; (try! (transfer-loan-amount (get token-id pool-data) loan-amount tx-sender))
      
      ;; Update total lending volume
      (var-set total-lending-volume (+ (var-get total-lending-volume) loan-amount))
      
      ;; Increment loan ID
      (var-set next-loan-id (+ loan-id u1))
      
      (print {
        notification: "loan-created",
        payload: {
          loan-id: loan-id,
          borrower: tx-sender,
          loan-amount: loan-amount,
          collateral-amount: collateral-amount,
          interest-rate: (get interest-rate pool-data)
        }
      })
      
      (ok loan-id)
    )
  )
)

;; Repay loan
(define-public (repay-loan (loan-id uint) (repay-amount uint))
  (let (
    (loan-data (unwrap! (map-get? loans {loan-id: loan-id}) ERR_NOT_FOUND))
    (pool-data (unwrap! (map-get? lending-pools {pool-id: (get pool-id loan-data)}) ERR_NOT_FOUND))
    (current-time (default-to u0 (get-block-info? time (- block-height u1))))
    (total-owed (calculate-total-owed loan-data current-time))
  )
    (begin
      ;; Validation
      (asserts! (is-eq tx-sender (get borrower loan-data)) ERR_UNAUTHORIZED)
      (asserts! (is-eq (get status loan-data) LOAN_ACTIVE) ERR_INVALID_PARAMETER)
      (asserts! (> repay-amount u0) ERR_INVALID_PARAMETER)
      (asserts! (>= (get-token-balance (get token-id pool-data) tx-sender) repay-amount) ERR_INSUFFICIENT_BALANCE)
      
      ;; Check if full repayment
      (let ((is-full-repayment (>= repay-amount total-owed)))
        ;; Update loan
        (map-set loans {loan-id: loan-id}
          (merge loan-data {
            interest-paid: (+ (get interest-paid loan-data) (min repay-amount (- total-owed (get loan-amount loan-data)))),
            last-payment: current-time,
            status: (if is-full-repayment LOAN_REPAID (get status loan-data))
          })
        )
        
        ;; If fully repaid, return collateral
        (if is-full-repayment
          (begin
            ;; Return collateral (simplified)
            ;; (try! (return-collateral (get collateral-token loan-data) (get collateral-amount loan-data) (get borrower loan-data)))
            
            ;; Update pool borrowed amount
            (map-set lending-pools {pool-id: (get pool-id loan-data)}
              (merge pool-data {
                total-borrowed: (- (get total-borrowed pool-data) (get loan-amount loan-data))
              })
            )
            
            (print {
              notification: "loan-fully-repaid",
              payload: {
                loan-id: loan-id,
                borrower: tx-sender,
                total-repaid: repay-amount,
                collateral-returned: (get collateral-amount loan-data)
              }
            })
          )
          (print {
            notification: "loan-partially-repaid",
            payload: {
              loan-id: loan-id,
              borrower: tx-sender,
              amount-repaid: repay-amount,
              remaining-owed: (- total-owed repay-amount)
            }
          })
        )
        
        (ok true)
      )
    )
  )
)

;; Liquidate undercollateralized loan
(define-public (liquidate-loan (loan-id uint))
  (let (
    (loan-data (unwrap! (map-get? loans {loan-id: loan-id}) ERR_NOT_FOUND))
    (pool-data (unwrap! (map-get? lending-pools {pool-id: (get pool-id loan-data)}) ERR_NOT_FOUND))
    (liquidation-id (var-get next-liquidation-id))
    (current-time (default-to u0 (get-block-info? time (- block-height u1))))
    (total-owed (calculate-total-owed loan-data current-time))
  )
    (begin
      ;; Validation
      (asserts! (is-eq (get status loan-data) LOAN_ACTIVE) ERR_INVALID_PARAMETER)
      
      ;; Check if loan is undercollateralized
      (try! (check-liquidation-threshold loan-data pool-data current-time))
      
      ;; Calculate liquidation amounts
      (let (
        (collateral-value (calculate-collateral-value (get collateral-token loan-data) (get collateral-amount loan-data)))
        (liquidation-bonus (/ collateral-value u20)) ;; 5% bonus
        (debt-covered (min total-owed collateral-value))
      )
        ;; Update loan status
        (map-set loans {loan-id: loan-id}
          (merge loan-data {status: LOAN_LIQUIDATED})
        )
        
        ;; Record liquidation
        (map-set liquidations {liquidation-id: liquidation-id} {
          loan-id: loan-id,
          liquidator: tx-sender,
          collateral-seized: (get collateral-amount loan-data),
          debt-covered: debt-covered,
          liquidation-time: current-time,
          bonus-paid: liquidation-bonus
        })
        
        ;; Update pool borrowed amount
        (map-set lending-pools {pool-id: (get pool-id loan-data)}
          (merge pool-data {
            total-borrowed: (- (get total-borrowed pool-data) debt-covered)
          })
        )
        
        ;; Transfer collateral to liquidator (simplified)
        ;; (try! (transfer-liquidated-collateral (get collateral-token loan-data) (get collateral-amount loan-data) tx-sender))
        
        ;; Increment liquidation ID
        (var-set next-liquidation-id (+ liquidation-id u1))
        
        (print {
          notification: "loan-liquidated",
          payload: {
            loan-id: loan-id,
            liquidator: tx-sender,
            debt-covered: debt-covered,
            collateral-seized: (get collateral-amount loan-data),
            bonus-paid: liquidation-bonus
          }
        })
        
        (ok liquidation-id)
      )
    )
  )
)

;; Claim deposit interest
(define-public (claim-deposit-interest (pool-id uint))
  (let (
    (deposit-key {pool-id: pool-id, depositor: tx-sender})
    (deposit-data (unwrap! (map-get? user-deposits deposit-key) ERR_NOT_FOUND))
    (current-time (default-to u0 (get-block-info? time (- block-height u1))))
    (interest-earned (calculate-deposit-interest deposit-data current-time))
  )
    (begin
      ;; Validation
      (asserts! (> interest-earned u0) ERR_INVALID_PARAMETER)
      
      ;; Update deposit
      (map-set user-deposits deposit-key
        (merge deposit-data {
          interest-earned: u0,
          last-interest-claim: current-time
        })
      )
      
      ;; Transfer interest (simplified)
      ;; (try! (transfer-interest interest-earned tx-sender))
      
      (print {
        notification: "interest-claimed",
        payload: {
          pool-id: pool-id,
          depositor: tx-sender,
          interest-amount: interest-earned
        }
      })
      
      (ok interest-earned)
    )
  )
)

;; ===== HELPER FUNCTIONS =====

;; Validate collateral ratio
(define-private (validate-collateral-ratio 
  (loan-amount uint)
  (loan-token uint)
  (collateral-amount uint)
  (collateral-token uint)
  (required-ratio uint)
)
  (let (
    (loan-value (calculate-token-value loan-token loan-amount))
    (collateral-value (calculate-token-value collateral-token collateral-amount))
    (actual-ratio (/ (* collateral-value u10000) loan-value))
  )
    (asserts! (>= actual-ratio required-ratio) ERR_INSUFFICIENT_COLLATERAL)
  )
)

;; Check liquidation threshold
(define-private (check-liquidation-threshold 
  (loan-data {
    borrower: principal,
    pool-id: uint,
    loan-amount: uint,
    collateral-token: uint,
    collateral-amount: uint,
    interest-rate: uint,
    loan-start: uint,
    loan-duration: uint,
    status: uint,
    interest-paid: uint,
    last-payment: uint
  })
  (pool-data {
    token-id: uint,
    total-deposits: uint,
    total-borrowed: uint,
    interest-rate: uint,
    collateral-ratio: uint,
    liquidation-threshold: uint,
    pool-creator: principal,
    active: bool,
    created-at: uint
  })
  (current-time uint)
)
  (let (
    (total-owed (calculate-total-owed loan-data current-time))
    (collateral-value (calculate-collateral-value (get collateral-token loan-data) (get collateral-amount loan-data)))
    (current-ratio (/ (* collateral-value u10000) total-owed))
  )
    (asserts! (< current-ratio (get liquidation-threshold pool-data)) ERR_INSUFFICIENT_COLLATERAL)
  )
)

;; Calculate total owed on loan
(define-private (calculate-total-owed 
  (loan-data {
    borrower: principal,
    pool-id: uint,
    loan-amount: uint,
    collateral-token: uint,
    collateral-amount: uint,
    interest-rate: uint,
    loan-start: uint,
    loan-duration: uint,
    status: uint,
    interest-paid: uint,
    last-payment: uint
  })
  (current-time uint)
)
  (let (
    (time-elapsed (- current-time (get loan-start loan-data)))
    (annual-interest (/ (* (get loan-amount loan-data) (get interest-rate loan-data)) u10000))
    (accrued-interest (/ (* annual-interest time-elapsed) u31536000)) ;; Seconds in year
  )
    (+ (get loan-amount loan-data) (- accrued-interest (get interest-paid loan-data)))
  )
)

;; Calculate deposit interest
(define-private (calculate-deposit-interest 
  (deposit-data {
    amount: uint,
    deposit-time: uint,
    interest-earned: uint,
    last-interest-claim: uint
  })
  (current-time uint)
)
  (let (
    (time-since-claim (- current-time (get last-interest-claim deposit-data)))
    (annual-rate u500) ;; 5% APR for deposits (simplified)
    (interest (/ (* (* (get amount deposit-data) annual-rate) time-since-claim) (* u10000 u31536000)))
  )
    interest
  )
)

;; Calculate token value (simplified)
(define-private (calculate-token-value (token-id uint) (amount uint))
  (match (map-get? token-prices {token-id: token-id})
    price-data (* amount (get price price-data))
    amount ;; Default to 1:1 if no price data
  )
)

;; Calculate collateral value
(define-private (calculate-collateral-value (token-id uint) (amount uint))
  (calculate-token-value token-id amount)
)

;; Placeholder for token balance check
(define-private (get-token-balance (token-id uint) (owner principal))
  u10000 ;; Simplified - would call main contract
)

;; ===== READ-ONLY FUNCTIONS =====

;; Get lending pool
(define-read-only (get-lending-pool (pool-id uint))
  (ok (map-get? lending-pools {pool-id: pool-id}))
)

;; Get user deposit
(define-read-only (get-user-deposit (pool-id uint) (depositor principal))
  (ok (map-get? user-deposits {pool-id: pool-id, depositor: depositor}))
)

;; Get loan
(define-read-only (get-loan (loan-id uint))
  (ok (map-get? loans {loan-id: loan-id}))
)

;; Get liquidation
(define-read-only (get-liquidation (liquidation-id uint))
  (ok (map-get? liquidations {liquidation-id: liquidation-id}))
)

;; Get lending overview
(define-read-only (get-lending-overview)
  (ok {
    total-pools: (- (var-get next-pool-id) u1),
    total-loans: (- (var-get next-loan-id) u1),
    total-liquidations: (- (var-get next-liquidation-id) u1),
    total-lending-volume: (var-get total-lending-volume)
  })
)