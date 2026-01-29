;; Rewards Calculator Contract
;; This contract calculates reward multipliers and scores based on on-chain activity.
;; It tracks cumulative impact and determines payout amounts for the Rewards Vault.

;; Constants
(define-constant ERR_UNAUTHORIZED (err u401))
(define-constant ERR_NOT_FOUND (err u404))
(define-constant ERR_INVALID_SCORE (err u400))
(define-constant ERR_USER_NOT_VERIFIED (err u410))
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

;; Data Map for GitHub Verification
;; user principal -> git-username
(define-map github-verifications principal (string-ascii 39))

;; Data Map for GitHub Contribution Scores (Live Activity tracking)
(define-map github-scores principal {
    pull-requests: uint,
    commits: uint,
    stars-received: uint,
    last-updated: uint
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

;; @desc Get GitHub specific stats for a verified user
(define-read-only (get-github-stats (user principal))
    (ok (default-to {pull-requests: u0, commits: u0, stars-received: u0, last-updated: u0} (map-get? github-scores user)))
)

;; @desc Check if a user has a linked GitHub account
(define-read-only (is-github-verified (user principal))
    (is-some (map-get? github-verifications user))
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

;; --- GitHub Scoring Logic (Commit 4) ---

;; @desc Link a GitHub username to a Stacks address (Admin only)
(define-public (verify-github-user (user principal) (gh-username (string-ascii 39)))
    (begin
        (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
        (map-set github-verifications user gh-username)
        (print {action: "verify-github", user: user, github: gh-username})
        (ok true)
    )
)

;; @desc Sync GitHub activity points to the on-chain calculator (Admin/Oracle only)
(define-public (sync-github-activity (user principal) (prs uint) (commits uint) (stars uint))
    (let (
        (is-verified (is-github-verified user))
        (current-stats (default-to {base-score: u0, multiplier: u100, total-impact: u0} (map-get? user-stats user)))
        ;; Calculate points: PRs = 20, Commits = 5, Stars = 10
        (gh-points (+ (* prs u20) (+ (* commits u5) (* stars u10))))
    )
    (begin
        (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
        (asserts! is-verified ERR_USER_NOT_VERIFIED)
        
        ;; Update detailed GitHub stats
        (map-set github-scores user {
            pull-requests: prs,
            commits: commits,
            stars-received: stars,
            last-updated: block-height
        })
        
        ;; Update the master user stats base score
        (map-set user-stats user (merge current-stats {
            base-score: (+ (get base-score current-stats) gh-points)
        }))
        
        (print {action: "sync-github", user: user, added-points: gh-points})
        (ok gh-points)
    )
    )
)
