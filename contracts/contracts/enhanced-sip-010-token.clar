;; Enhanced SIP-010 Token Implementation
;; Complete implementation of the enhanced SIP-010 trait

;; Import the enhanced trait
(use-trait enhanced-sip-010 .enhanced-sip-010-trait.enhanced-sip-010-trait)

;; Core storage maps
(define-map balances principal uint)
(define-map allowances {owner: principal, spender: principal} uint)
(define-map balance-history {account: principal, block: uint} uint)
(define-map transfer-records uint {from: principal, to: principal, amount: uint, block: uint, memo: (optional (buff 34))})

;; Configuration variables and metadata
(define-data-var token-name (string-ascii 32) "Enhanced Token")
(define-data-var token-symbol (string-ascii 32) "ETOKEN")
(define-data-var token-decimals uint u6)
(define-data-var token-uri (optional (string-utf8 256)) none)

;; Supply tracking
(define-data-var total-supply uint u0)

;; Access control
(define-data-var contract-owner principal tx-sender)

;; Pausable state
(define-data-var paused bool false)

;; Transfer counter for history
(define-data-var transfer-counter uint u0)
;; Event definitions
(define-data-var transfer-event (tuple (from principal) (to principal) (amount uint) (memo (optional (buff 34)))) 
  {from: tx-sender, to: tx-sender, amount: u0, memo: none})

;; Helper functions
(define-private (is-paused-check)
  (if (var-get paused)
    (err .enhanced-sip-010-trait.ERR-PAUSED)
    (ok true)))

(define-private (record-balance-history (account principal))
  (map-set balance-history 
    {account: account, block: block-height}
    (default-to u0 (map-get? balances account))))

;; Enhanced transfer function
(define-public (transfer (amount uint) (from principal) (to principal) (memo (optional (buff 34))))
  (begin
    ;; Check if contract is paused
    (try! (is-paused-check))
    
    ;; Validate amount is not zero
    (asserts! (> amount u0) (err .enhanced-sip-010-trait.ERR-ZERO-AMOUNT))
    
    ;; Check sender authorization
    (asserts! (or (is-eq tx-sender from) (is-eq contract-caller from)) 
              (err .enhanced-sip-010-trait.ERR-UNAUTHORIZED))
    
    ;; Get current balances
    (let ((sender-balance (default-to u0 (map-get? balances from)))
          (recipient-balance (default-to u0 (map-get? balances to))))
      
      ;; Check sufficient balance
      (asserts! (>= sender-balance amount) (err .enhanced-sip-010-trait.ERR-INSUFFICIENT-BALANCE))
      
      ;; Record balance history before transfer
      (record-balance-history from)
      (record-balance-history to)
      
      ;; Update balances
      (map-set balances from (- sender-balance amount))
      (map-set balances to (+ recipient-balance amount))
      
      ;; Record transfer in history
      (let ((counter (var-get transfer-counter)))
        (map-set transfer-records counter 
          {from: from, to: to, amount: amount, block: block-height, memo: memo})
        (var-set transfer-counter (+ counter u1)))
      
      ;; Emit transfer event
      (var-set transfer-event {from: from, to: to, amount: amount, memo: memo})
      
      (ok true))))

;; Get balance function
(define-read-only (get-balance (account principal))
  (ok (default-to u0 (map-get? balances account))))
;; Approval event
(define-data-var approval-event (tuple (owner principal) (spender principal) (amount uint)) 
  {owner: tx-sender, spender: tx-sender, amount: u0})

;; Approve function
(define-public (approve (spender principal) (amount uint))
  (begin
    ;; Check if contract is paused
    (try! (is-paused-check))
    
    ;; Set allowance
    (map-set allowances {owner: tx-sender, spender: spender} amount)
    
    ;; Emit approval event
    (var-set approval-event {owner: tx-sender, spender: spender, amount: amount})
    
    (ok true)))

;; Transfer from allowance
(define-public (transfer-from (owner principal) (to principal) (amount uint) (memo (optional (buff 34))))
  (begin
    ;; Check if contract is paused
    (try! (is-paused-check))
    
    ;; Validate amount is not zero
    (asserts! (> amount u0) (err .enhanced-sip-010-trait.ERR-ZERO-AMOUNT))
    
    ;; Get current allowance
    (let ((current-allowance (default-to u0 (map-get? allowances {owner: owner, spender: tx-sender})))
          (owner-balance (default-to u0 (map-get? balances owner)))
          (recipient-balance (default-to u0 (map-get? balances to))))
      
      ;; Check sufficient allowance
      (asserts! (>= current-allowance amount) (err .enhanced-sip-010-trait.ERR-INSUFFICIENT-ALLOWANCE))
      
      ;; Check sufficient balance
      (asserts! (>= owner-balance amount) (err .enhanced-sip-010-trait.ERR-INSUFFICIENT-BALANCE))
      
      ;; Record balance history before transfer
      (record-balance-history owner)
      (record-balance-history to)
      
      ;; Update balances
      (map-set balances owner (- owner-balance amount))
      (map-set balances to (+ recipient-balance amount))
      
      ;; Update allowance
      (map-set allowances {owner: owner, spender: tx-sender} (- current-allowance amount))
      
      ;; Record transfer in history
      (let ((counter (var-get transfer-counter)))
        (map-set transfer-records counter 
          {from: owner, to: to, amount: amount, block: block-height, memo: memo})
        (var-set transfer-counter (+ counter u1)))
      
      ;; Emit transfer event
      (var-set transfer-event {from: owner, to: to, amount: amount, memo: memo})
      
      (ok true))))

;; Get allowance function
(define-read-only (get-allowance (owner principal) (spender principal))
  (ok (default-to u0 (map-get? allowances {owner: owner, spender: spender}))))
;; Mint event
(define-data-var mint-event (tuple (to principal) (amount uint)) 
  {to: tx-sender, amount: u0})

;; Owner-only check
(define-private (is-owner)
  (is-eq tx-sender (var-get contract-owner)))

;; Mint function
(define-public (mint (to principal) (amount uint))
  (begin
    ;; Check if contract is paused
    (try! (is-paused-check))
    
    ;; Check authorization (only owner can mint)
    (asserts! (is-owner) (err .enhanced-sip-010-trait.ERR-UNAUTHORIZED))
    
    ;; Validate amount is not zero
    (asserts! (> amount u0) (err .enhanced-sip-010-trait.ERR-ZERO-AMOUNT))
    
    ;; Get current balance and total supply
    (let ((current-balance (default-to u0 (map-get? balances to)))
          (current-supply (var-get total-supply)))
      
      ;; Record balance history before mint
      (record-balance-history to)
      
      ;; Update balance and total supply
      (map-set balances to (+ current-balance amount))
      (var-set total-supply (+ current-supply amount))
      
      ;; Record mint in transfer history (from zero address)
      (let ((counter (var-get transfer-counter)))
        (map-set transfer-records counter 
          {from: 'SP000000000000000000002Q6VF78, to: to, amount: amount, block: block-height, memo: none})
        (var-set transfer-counter (+ counter u1)))
      
      ;; Emit mint event
      (var-set mint-event {to: to, amount: amount})
      
      (ok true))))
;; Burn event
(define-data-var burn-event (tuple (from principal) (amount uint)) 
  {from: tx-sender, amount: u0})

;; Burn function
(define-public (burn (from principal) (amount uint))
  (begin
    ;; Check if contract is paused
    (try! (is-paused-check))
    
    ;; Check authorization (owner can burn anyone's tokens, users can burn their own)
    (asserts! (or (is-owner) (is-eq tx-sender from)) (err .enhanced-sip-010-trait.ERR-UNAUTHORIZED))
    
    ;; Validate amount is not zero
    (asserts! (> amount u0) (err .enhanced-sip-010-trait.ERR-ZERO-AMOUNT))
    
    ;; Get current balance and total supply
    (let ((current-balance (default-to u0 (map-get? balances from)))
          (current-supply (var-get total-supply)))
      
      ;; Check sufficient balance for burn
      (asserts! (>= current-balance amount) (err .enhanced-sip-010-trait.ERR-INSUFFICIENT-BALANCE-BURN))
      
      ;; Record balance history before burn
      (record-balance-history from)
      
      ;; Update balance and total supply
      (map-set balances from (- current-balance amount))
      (var-set total-supply (- current-supply amount))
      
      ;; Record burn in transfer history (to zero address)
      (let ((counter (var-get transfer-counter)))
        (map-set transfer-records counter 
          {from: from, to: 'SP000000000000000000002Q6VF78, amount: amount, block: block-height, memo: none})
        (var-set transfer-counter (+ counter u1)))
      
      ;; Emit burn event
      (var-set burn-event {from: from, amount: amount})
      
      (ok true))))
;; Metadata update event
(define-data-var metadata-update-event (tuple (field (string-ascii 10)) (updated-by principal)) 
  {field: "name", updated-by: tx-sender})

;; Metadata functions
(define-read-only (get-name)
  (ok (var-get token-name)))

(define-read-only (get-symbol)
  (ok (var-get token-symbol)))

(define-read-only (get-decimals)
  (let ((decimals (var-get token-decimals)))
    ;; Ensure decimals are within valid range (0-18)
    (asserts! (<= decimals u18) (err .enhanced-sip-010-trait.ERR-INVALID-PAGINATION))
    (ok decimals)))

(define-read-only (get-token-uri)
  (ok (var-get token-uri)))

(define-read-only (get-total-supply)
  (ok (var-get total-supply)))

;; Metadata update functions (owner only)
(define-public (set-name (new-name (string-ascii 32)))
  (begin
    (asserts! (is-owner) (err .enhanced-sip-010-trait.ERR-UNAUTHORIZED))
    (asserts! (> (len new-name) u0) (err .enhanced-sip-010-trait.ERR-ZERO-AMOUNT))
    (var-set token-name new-name)
    (var-set metadata-update-event {field: "name", updated-by: tx-sender})
    (ok true)))

(define-public (set-symbol (new-symbol (string-ascii 32)))
  (begin
    (asserts! (is-owner) (err .enhanced-sip-010-trait.ERR-UNAUTHORIZED))
    (asserts! (> (len new-symbol) u0) (err .enhanced-sip-010-trait.ERR-ZERO-AMOUNT))
    (var-set token-symbol new-symbol)
    (var-set metadata-update-event {field: "symbol", updated-by: tx-sender})
    (ok true)))

(define-public (set-token-uri (new-uri (optional (string-utf8 256))))
  (begin
    (asserts! (is-owner) (err .enhanced-sip-010-trait.ERR-UNAUTHORIZED))
    (var-set token-uri new-uri)
    (var-set metadata-update-event {field: "uri", updated-by: tx-sender})
    (ok true)))