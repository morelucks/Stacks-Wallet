;; SIP-010 Fungible Token Standard Trait - ENHANCED VERSION
;; This is an enhanced implementation of the SIP-010 trait with additional functionality
;; Includes allowances, mint/burn, access control, pausable operations, and more

;; Import enhanced trait for compatibility
(use-trait enhanced-sip-010 .enhanced-sip-010-trait.enhanced-sip-010-trait)

;; Original SIP-010 trait maintained for backward compatibility
(define-trait sip-010-trait
  (
    ;; Transfer from the caller to a new principal
    (transfer (uint principal principal (optional (buff 34))) (response bool uint))

    ;; the human readable name of the token
    (get-name () (response (string-ascii 32) uint))

    ;; the ticker symbol, or empty if none
    (get-symbol () (response (string-ascii 32) uint))

    ;; the number of decimals used, e.g. 6 would mean 1_000_000 represents 1 token
    (get-decimals () (response uint uint))

    ;; the balance of the passed principal
    (get-balance (principal) (response uint uint))

    ;; the current total supply (which does not need to be a constant)
    (get-total-supply () (response uint uint))

    ;; an optional URI that represents metadata of this token
    (get-token-uri () (response (optional (string-utf8 256)) uint))
  )
)

;; Enhanced trait reference - use enhanced-sip-010-trait.clar for full functionality