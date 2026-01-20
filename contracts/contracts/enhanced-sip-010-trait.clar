;; Enhanced SIP-010 Fungible Token Standard Trait
;; Extended implementation with allowances, mint/burn, access control, and advanced features

;; Error constants
(define-constant ERR-INSUFFICIENT-BALANCE u1)
(define-constant ERR-ZERO-AMOUNT u2)
(define-constant ERR-INSUFFICIENT-ALLOWANCE u3)
(define-constant ERR-INSUFFICIENT-BALANCE-BURN u4)
(define-constant ERR-UNAUTHORIZED u5)
(define-constant ERR-PAUSED u6)
(define-constant ERR-BATCH-LIMIT-EXCEEDED u7)
(define-constant ERR-HISTORICAL-DATA-UNAVAILABLE u8)
(define-constant ERR-INVALID-PAGINATION u9)

;; Enhanced SIP-010 trait definition
(define-trait enhanced-sip-010-trait
  (
    ;; Original SIP-010 functions
    (transfer (uint principal principal (optional (buff 34))) (response bool uint))
    (get-name () (response (string-ascii 32) uint))
    (get-symbol () (response (string-ascii 32) uint))
    (get-decimals () (response uint uint))
    (get-balance (principal) (response uint uint))
    (get-total-supply () (response uint uint))
    (get-token-uri () (response (optional (string-utf8 256)) uint))
    
    ;; Enhanced allowance functions
    (approve (principal uint) (response bool uint))
    (transfer-from (principal principal uint (optional (buff 34))) (response bool uint))
    (get-allowance (principal principal) (response uint uint))
    
    ;; Supply management functions
    (mint (principal uint) (response bool uint))
    (burn (principal uint) (response bool uint))
    
    ;; Access control functions
    (get-owner () (response principal uint))
    (transfer-ownership (principal) (response bool uint))
    
    ;; Pausable functions
    (pause () (response bool uint))
    (unpause () (response bool uint))
    (is-paused () (response bool uint))
    
    ;; Batch operations
    (batch-transfer (list 100 {to: principal, amount: uint, memo: (optional (buff 34))}) (response bool uint))
    
    ;; Historical queries
    (get-balance-at-block (principal uint) (response uint uint))
    (get-transfer-history (principal uint uint) (response (list 50 {from: principal, to: principal, amount: uint, block: uint}) uint))
  )
)