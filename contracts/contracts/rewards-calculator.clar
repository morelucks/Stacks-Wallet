;; Rewards Calculator Contract
;; This contract calculates reward multipliers and scores based on on-chain activity.
;; It tracks cumulative impact and determines payout amounts for the Rewards Vault.

;; Constants
(define-constant ERR_UNAUTHORIZED (err u401))
(define-constant ERR_NOT_FOUND (err u404))
(define-constant ERR_INVALID_SCORE (err u400))
(define-constant CONTRACT_OWNER tx-sender)

;; Data Map for contract impact scores
;; Determined by the complexity and utility of user-deployed contracts on Stacks
(define-map contract-impact-scores principal uint)

;; Data Map for user total scores
(define-map user-stats principal {
    base-score: uint,
    multiplier: uint,      ;; Represented in basis points (e.g., 100 = 1x, 200 = 2x)
    total-impact: uint
})

;; Read-Only Functions

;; @desc Get the total calculated reward for a user based on their stats
(define-read-only (calculate-current-payout (user principal))
    (let (
        (stats (default-to {base-score: u0, multiplier: u100, total-impact: u0} (map-get? user-stats user)))
        (base (get base-score stats))
        (mult (get multiplier stats))
    )
    (ok (/ (* base mult) u100)))
)

;; @desc Get the impact score of a specific contract
(define-read-only (get-contract-impact (contract principal))
    (ok (default-to u0 (map-get? contract-impact-scores contract)))
)

;; @desc Get full user statistics
(define-read-only (get-user-stats (user principal))
    (ok (default-to {base-score: u0, multiplier: u100, total-impact: u0} (map-get? user-stats user)))
)

;; Administrative Functions

;; @desc Set the impact score for a deployed contract (Owner only)
(define-public (set-impact-score (contract principal) (score uint))
    (begin
        (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
        (asserts! (<= score u1000) ERR_INVALID_SCORE) ;; Cap impact score at 1000
        (map-set contract-impact-scores contract score)
        (print {action: "set-impact-score", contract: contract, score: score})
        (ok true)
    )
)

;; @desc Record user activity and update their multiplier
(define-public (record-activity (user principal) (points uint) (multiplier-bonus uint))
    (let (
        (current (default-to {base-score: u0, multiplier: u100, total-impact: u0} (map-get? user-stats user)))
    )
    (begin
        (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
        (map-set user-stats user {
            base-score: (+ (get base-score current) points),
            multiplier: (+ (get multiplier current) multiplier-bonus),
            total-impact: (get total-impact current)
        })
        (print {action: "record-activity", user: user, new-base: (+ (get base-score current) points)})
        (ok true)
    )
    )
)
