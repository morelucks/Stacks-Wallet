;; Rewards Vault Contract
;; This contract acts as a secure vault for reward tokens and manages its distribution.
;; Designed to be used with the Rewards Calculator and Stacks activity tracking.

;; Constants
(define-constant ERR_UNAUTHORIZED (err u401))
(define-constant ERR_INVALID_AMOUNT (err u400))
(define-constant ERR_VAULT_EXHAUSTED (err u402))
(define-constant ERR_ALREADY_INITIALIZED (err u403))
(define-constant ERR_REWARD_ALREADY_CLAIMED (err u404))
(define-constant ERR_EXPIRED (err u405))
(define-constant ERR_INVALID_SIGNATURE (err u406))
(define-constant CONTRACT_OWNER tx-sender)

;; Data Variables
(define-data-var total-deposited uint u0)
(define-data-var total-distributed uint u0)
(define-data-var reward-token principal 'SPATASA6SYGCVB67NJ1XQ72BB0Q3EHGNGE9JQBQT.token-contract-v3)
(define-data-var is-initialized bool false)

;; Data Map for authorized reward distributors (e.g., the Calculator contract)
(define-map authorized-distributors principal bool)

;; Nonces for users to prevent replay attacks
(define-map user-nonces principal uint)

;; Read-Only Functions
(define-read-only (get-vault-stats)
    (ok {
        total-deposited: (var-get total-deposited),
        total-distributed: (var-get total-distributed),
        balance: (- (var-get total-deposited) (var-get total-distributed)),
        token: (var-get reward-token)
    })
)

(define-read-only (is-authorized (who principal))
    (default-to false (map-get? authorized-distributors who))
)

(define-read-only (get-user-nonce (user principal))
    (default-to u0 (map-get? user-nonces user))
)

;; Administrative Functions

;; @desc Set the authorization status for a distributor contract
(define-public (set-distributor (who principal) (status bool))
    (begin
        (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
        (map-set authorized-distributors who status)
        (print {action: "set-distributor", who: who, status: status})
        (ok true)
    )
)

;; @desc Deposit reward tokens into the vault (virtual balance update for local simulation)
(define-public (deposit-rewards (amount uint))
    (begin
        (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
        (asserts! (> amount u0) ERR_INVALID_AMOUNT)
        (var-set total-deposited (+ (var-get total-deposited) amount))
        (print {action: "deposit-rewards", amount: amount, cumulative: (var-get total-deposited)})
        (ok true)
    )
)

;; @desc Emergency function to lock the vault if suspicious activity is detected
(define-public (emergency-shutdown)
    (begin
        (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
        (var-set total-distributed (var-get total-deposited))
        (print {action: "emergency-shutdown", timestamp: block-height})
        (ok true)
    )
)

;; @desc Initialize the vault with its first distribution partner
(define-public (initialize-vault (initial-distributor principal))
    (begin
        (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_UNAUTHORIZED)
        (asserts! (not (var-get is-initialized)) ERR_ALREADY_INITIALIZED)
        (map-set authorized-distributors initial-distributor true)
        (var-set is-initialized true)
        (ok true)
    )
)

;; --- Claiming Logic (Commit 2) ---

;; @desc Verify the claim signature from an authorized distributor
(define-private (verify-claim-signature (user principal) (amount uint) (nonce uint) (deadline uint) (signature (buff 65)))
    (let (
        (message-hash (sha256 (concat (unwrap-panic (to-consensus-buff? user))
                                     (concat (unwrap-panic (to-consensus-buff? amount))
                                             (concat (unwrap-panic (to-consensus-buff? nonce))
                                                     (unwrap-panic (to-consensus-buff? deadline))))))))
    (secp256k1-recover? message-hash signature))
)

;; @desc Claim rewards using a signed authorization from a distributor
(define-public (claim-rewards (amount uint) (nonce uint) (deadline uint) (signature (buff 65)))
    (let (
        (user tx-sender)
        (current-nonce (get-user-nonce user))
        (vault-balance (- (var-get total-deposited) (var-get total-distributed)))
    )
    (begin
        ;; Security and Validation Checks
        (asserts! (<= block-height deadline) ERR_EXPIRED)
        (asserts! (is-eq nonce current-nonce) ERR_INVALID_AMOUNT)
        (asserts! (>= vault-balance amount) ERR_VAULT_EXHAUSTED)
        
        ;; Verify that the signature was produced by an authorized distributor
        (let ((recovered-pubkey (unwrap! (verify-claim-signature user amount nonce deadline signature) ERR_INVALID_SIGNATURE)))
            (asserts! (is-authorized (principal-of? recovered-pubkey)) ERR_UNAUTHORIZED)
        )
        
        ;; Effect: Update vault state and user nonce
        (var-set total-distributed (+ (var-get total-distributed) amount))
        (map-set user-nonces user (+ current-nonce u1))
        
        ;; Log the claim event
        (print {action: "claim-rewards", user: user, amount: amount, nonce: nonce})
        (ok true)
    )
    )
)
