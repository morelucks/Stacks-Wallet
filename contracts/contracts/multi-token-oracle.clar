;; =====================================================================
;; Multi-Token Oracle Module
;; =====================================================================
;; 
;; Decentralized oracle system for multi-token price feeds and data
;; Provides reliable price data with multiple oracle sources and validation
;;
;; Version: 1.0.0
;; Compatible with: Clarity 4
;; ===================================================================== 

;; ===== CONSTANTS =====
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_UNAUTHORIZED (err u401))
(define-constant ERR_NOT_FOUND (err u404))
(define-constant ERR_INVALID_PARAMETER (err u400))
(define-constant ERR_STALE_PRICE (err u402))
(define-constant ERR_INSUFFICIENT_ORACLES (err u403))
(define-constant ERR_PRICE_DEVIATION (err u405))

;; Enhanced error constants
(define-constant ERR_INVALID_DATA_FORMAT (err u406))
(define-constant ERR_OUT_OF_RANGE (err u407))
(define-constant ERR_STALE_TIMESTAMP (err u408))
(define-constant ERR_INSUFFICIENT_CONFIDENCE (err u409))
(define-constant ERR_DUPLICATE_SUBMISSION (err u410))
(define-constant ERR_HIGH_VARIANCE (err u411))
(define-constant ERR_OUTLIER_DETECTED (err u412))
(define-constant ERR_AGGREGATION_FAILED (err u413))
(define-constant ERR_CONFIDENCE_TOO_LOW (err u414))
(define-constant ERR_SIGNATURE_INVALID (err u415))
(define-constant ERR_RATE_LIMIT_EXCEEDED (err u416))
(define-constant ERR_SUSPICIOUS_ACTIVITY (err u417))
(define-constant ERR_CIRCUIT_BREAKER_ACTIVE (err u418))
(define-constant ERR_CHAIN_DISCONNECTED (err u419))
(define-constant ERR_BRIDGE_VALIDATION_FAILED (err u420))
(define-constant ERR_SYNC_CONFLICT (err u421))
(define-constant ERR_REPLAY_ATTACK_DETECTED (err u422))
(define-constant ERR_CHAIN_PRIORITY_VIOLATION (err u423))
(define-constant ERR_PROPOSAL_INVALID (err u424))
(define-constant ERR_VOTING_PERIOD_EXPIRED (err u425))
(define-constant ERR_INSUFFICIENT_STAKE (err u426))
(define-constant ERR_EXECUTION_TIME_LOCKED (err u427))
(define-constant ERR_APPEAL_PERIOD_EXPIRED (err u428))

;; Oracle types
(define-constant ORACLE_PRICE_FEED u1)
(define-constant ORACLE_VOLUME_FEED u2)
(define-constant ORACLE_MARKET_CAP u3)
(define-constant ORACLE_VOLATILITY u4)

;; ===== ORACLE DATA MAPS =====

;; Oracle providers
(define-map oracle-providers {oracle-id: uint} {
  provider: principal,
  name: (string-utf8 64),
  reputation-score: uint,
  total-submissions: uint,
  accurate-submissions: uint,
  stake-amount: uint,
  active: bool,
  created-at: uint,
  last-submission: uint
})

;; Token price feeds
(define-map token-price-feeds {token-id: uint} {
  current-price: uint,
  previous-price: uint,
  price-change-24h: int,
  volume-24h: uint,
  market-cap: uint,
  last-updated: uint,
  update-count: uint,
  data-sources: uint
})

;; Oracle price submissions
(define-map price-submissions {token-id: uint, oracle-id: uint, round-id: uint} {
  price: uint,
  volume: uint,
  timestamp: uint,
  confidence: uint,
  data-source: (string-ascii 32),
  validated: bool
})

;; Price aggregation rounds
(define-map aggregation-rounds {token-id: uint, round-id: uint} {
  start-time: uint,
  end-time: uint,
  submissions-count: uint,
  min-submissions: uint,
  aggregated-price: (optional uint),
  median-price: (optional uint),
  price-variance: uint,
  status: (string-ascii 16) ;; "active", "completed", "failed"
})

;; Oracle configurations
(define-map oracle-configs {token-id: uint} {
  min-oracles: uint,
  max-price-deviation: uint, ;; Basis points
  update-frequency: uint, ;; Seconds
  stale-threshold: uint, ;; Seconds
  aggregation-method: (string-ascii 16), ;; "median", "mean", "weighted"
  active: bool
})

;; Enhanced Price Feed Model
(define-map enhanced-price-feeds {token-id: uint} {
  current-price: uint,
  twap-1h: uint,
  twap-24h: uint,
  vwap-24h: uint,
  price-confidence: uint,
  volatility-index: uint,
  liquidity-score: uint,
  last-updated: uint,
  update-frequency: uint,
  data-quality-score: uint,
  circuit-breaker-status: (string-ascii 16),
  cross-chain-sync-status: (string-ascii 16)
})

;; Oracle Reputation Model
(define-map oracle-reputation {oracle-id: uint} {
  accuracy-score: uint,      ;; 0-1000 based on historical accuracy
  timeliness-score: uint,    ;; 0-1000 based on submission timing
  consistency-score: uint,   ;; 0-1000 based on data consistency
  stake-weight: uint,        ;; Weighted by staked amount
  penalty-points: uint,      ;; Accumulated penalties
  total-score: uint,         ;; Composite reputation score
  last-updated: uint,
  performance-history: (list 100 uint) ;; Rolling performance window
})

;; Historical Analytics Model
(define-map price-analytics {token-id: uint, period: uint} {
  open-price: uint,
  high-price: uint,
  low-price: uint,
  close-price: uint,
  volume: uint,
  volatility: uint,
  correlation-btc: int,
  correlation-eth: int,
  market-cap: uint,
  liquidity-depth: uint,
  price-impact: uint,
  data-points: uint
})

;; Cross-Chain Synchronization Model
(define-map cross-chain-state {chain-id: uint, token-id: uint} {
  local-price: uint,
  remote-price: uint,
  sync-timestamp: uint,
  sync-status: (string-ascii 16),
  conflict-resolution: (string-ascii 16),
  bridge-hash: (buff 32),
  validation-count: uint
})

;; Governance Model
(define-map governance-proposals {proposal-id: uint} {
  proposer: principal,
  proposal-type: (string-ascii 32),
  description: (string-utf8 256),
  parameters: (string-utf8 512),
  voting-start: uint,
  voting-end: uint,
  votes-for: uint,
  votes-against: uint,
  execution-time: uint,
  status: (string-ascii 16)
})

;; Multi-Signature Controls
(define-map admin-operations {operation-id: uint} {
  operation-type: (string-ascii 32),
  required-signatures: uint,
  current-signatures: uint,
  signers: (list 10 principal),
  execution-time: uint,
  executed: bool
})

;; Circuit Breaker State
(define-map circuit-breaker-state {token-id: uint} {
  level: uint,               ;; 0=normal, 1=warning, 2=pause, 3=halt, 4=lockdown
  triggered-at: uint,
  trigger-reason: (string-ascii 64),
  recovery-time: uint,
  manual-intervention-required: bool
})

;; Enhanced Data Submissions
(define-map enhanced-submissions {token-id: uint, oracle-id: uint, round-id: uint} {
  price: uint,
  volume: uint,
  market-cap: uint,
  liquidity: uint,
  volatility: uint,
  confidence: uint,
  data-sources: (list 10 (string-ascii 32)),
  timestamp: uint,
  signature: (buff 65),
  validated: bool,
  outlier-score: uint
})

;; Oracle rewards
(define-map oracle-rewards {oracle-id: uint, period: uint} {
  base-reward: uint,
  accuracy-bonus: uint,
  total-earned: uint,
  last-claim: uint
})

;; Counters and state variables
(define-data-var next-oracle-id uint u1)
(define-data-var next-round-id uint u1)
(define-data-var next-proposal-id uint u1)
(define-data-var next-operation-id uint u1)
(define-data-var total-oracle-rewards uint u0)
(define-data-var system-paused bool false)
(define-data-var maintenance-mode bool false)

;; ===== ORACLE PROVIDER FUNCTIONS =====

;; Register oracle provider
(define-public (register-oracle-provider
  (name (string-utf8 64))
  (stake-amount uint)
)
  (let ((oracle-id (var-get next-oracle-id)))
    (begin
      ;; Validation
      (asserts! (> (len name) u0) ERR_INVALID_PARAMETER)
      (asserts! (> stake-amount u0) ERR_INVALID_PARAMETER)
      
      ;; Check stake amount (simplified - would transfer actual tokens)
      (asserts! (>= (get-token-balance u1 tx-sender) stake-amount) ERR_INVALID_PARAMETER)
      
      ;; Register oracle
      (map-set oracle-providers {oracle-id: oracle-id} {
        provider: tx-sender,
        name: name,
        reputation-score: u100, ;; Starting reputation
        total-submissions: u0,
        accurate-submissions: u0,
        stake-amount: stake-amount,
        active: true,
        created-at: (default-to u0 (get-block-info? time (- block-height u1))),
        last-submission: u0
      })
      
      ;; Increment oracle ID
      (var-set next-oracle-id (+ oracle-id u1))
      
      (print {
        notification: "oracle-provider-registered",
        payload: {
          oracle-id: oracle-id,
          provider: tx-sender,
          name: name,
          stake-amount: stake-amount
        }
      })
      
      (ok oracle-id)
    )
  )
)

;; Submit price data
(define-public (submit-price-data
  (token-id uint)
  (oracle-id uint)
  (price uint)
  (volume uint)
  (confidence uint)
  (data-source (string-ascii 32))
)
  (let (
    (oracle-data (unwrap! (map-get? oracle-providers {oracle-id: oracle-id}) ERR_NOT_FOUND))
    (oracle-config (unwrap! (map-get? oracle-configs {token-id: token-id}) ERR_NOT_FOUND))
    (current-round (get-current-round token-id))
    (current-time (default-to u0 (get-block-info? time (- block-height u1))))
  )
    (begin
      ;; Validation
      (asserts! (is-eq tx-sender (get provider oracle-data)) ERR_UNAUTHORIZED)
      (asserts! (get active oracle-data) ERR_INVALID_PARAMETER)
      (asserts! (get active oracle-config) ERR_INVALID_PARAMETER)
      (asserts! (> price u0) ERR_INVALID_PARAMETER)
      (asserts! (<= confidence u100) ERR_INVALID_PARAMETER)
      
      ;; Check if already submitted for this round
      (asserts! (is-none (map-get? price-submissions {token-id: token-id, oracle-id: oracle-id, round-id: current-round})) ERR_INVALID_PARAMETER)
      
      ;; Validate price against existing submissions (prevent manipulation)
      (try! (validate-price-submission token-id price oracle-config))
      
      ;; Submit price data
      (map-set price-submissions {token-id: token-id, oracle-id: oracle-id, round-id: current-round} {
        price: price,
        volume: volume,
        timestamp: current-time,
        confidence: confidence,
        data-source: data-source,
        validated: false
      })
      
      ;; Update oracle stats
      (map-set oracle-providers {oracle-id: oracle-id}
        (merge oracle-data {
          total-submissions: (+ (get total-submissions oracle-data) u1),
          last-submission: current-time
        })
      )
      
      ;; Update round submission count
      (try! (update-round-submissions token-id current-round))
      
      ;; Check if enough submissions to aggregate
      (try! (check-aggregation-threshold token-id current-round))
      
      (print {
        notification: "price-data-submitted",
        payload: {
          token-id: token-id,
          oracle-id: oracle-id,
          round-id: current-round,
          price: price,
          volume: volume,
          confidence: confidence
        }
      })
      
      (ok true)
    )
  )
)

;; Aggregate price data
(define-public (aggregate-price-data (token-id uint) (round-id uint))
  (let (
    (round-data (unwrap! (map-get? aggregation-rounds {token-id: token-id, round-id: round-id}) ERR_NOT_FOUND))
    (oracle-config (unwrap! (map-get? oracle-configs {token-id: token-id}) ERR_NOT_FOUND))
  )
    (begin
      ;; Validation
      (asserts! (is-eq (get status round-data) "active") ERR_INVALID_PARAMETER)
      (asserts! (>= (get submissions-count round-data) (get min-submissions round-data)) ERR_INSUFFICIENT_ORACLES)
      
      ;; Calculate aggregated price
      (let (
        (aggregated-price (calculate-aggregated-price token-id round-id (get aggregation-method oracle-config)))
        (median-price (calculate-median-price token-id round-id))
        (price-variance (calculate-price-variance token-id round-id))
      )
        ;; Update round with aggregated data
        (map-set aggregation-rounds {token-id: token-id, round-id: round-id}
          (merge round-data {
            end-time: (default-to u0 (get-block-info? time (- block-height u1))),
            aggregated-price: (some aggregated-price),
            median-price: (some median-price),
            price-variance: price-variance,
            status: "completed"
          })
        )
        
        ;; Update token price feed
        (try! (update-price-feed token-id aggregated-price))
        
        ;; Validate oracle submissions and update reputation
        (try! (validate-oracle-submissions token-id round-id aggregated-price))
        
        ;; Distribute oracle rewards
        (try! (distribute-oracle-rewards token-id round-id))
        
        (print {
          notification: "price-data-aggregated",
          payload: {
            token-id: token-id,
            round-id: round-id,
            aggregated-price: aggregated-price,
            median-price: median-price,
            submissions-count: (get submissions-count round-data)
          }
        })
        
        (ok aggregated-price)
      )
    )
  )
)

;; ===== ORACLE CONFIGURATION FUNCTIONS =====

;; Configure oracle for token
(define-public (configure-token-oracle
  (token-id uint)
  (min-oracles uint)
  (max-price-deviation uint)
  (update-frequency uint)
  (stale-threshold uint)
  (aggregation-method (string-ascii 16))
)
  (begin
    ;; Validation (simplified - would check admin permissions)
    (asserts! (> min-oracles u0) ERR_INVALID_PARAMETER)
    (asserts! (<= max-price-deviation u5000) ERR_INVALID_PARAMETER) ;; Max 50% deviation
    (asserts! (> update-frequency u0) ERR_INVALID_PARAMETER)
    (asserts! (> stale-threshold u0) ERR_INVALID_PARAMETER)
    (asserts! (is-valid-aggregation-method aggregation-method) ERR_INVALID_PARAMETER)
    
    ;; Configure oracle
    (map-set oracle-configs {token-id: token-id} {
      min-oracles: min-oracles,
      max-price-deviation: max-price-deviation,
      update-frequency: update-frequency,
      stale-threshold: stale-threshold,
      aggregation-method: aggregation-method,
      active: true
    })
    
    ;; Initialize price feed
    (map-set token-price-feeds {token-id: token-id} {
      current-price: u0,
      previous-price: u0,
      price-change-24h: 0,
      volume-24h: u0,
      market-cap: u0,
      last-updated: u0,
      update-count: u0,
      data-sources: u0
    })
    
    (print {
      notification: "oracle-configured",
      payload: {
        token-id: token-id,
        min-oracles: min-oracles,
        aggregation-method: aggregation-method
      }
    })
    
    (ok true)
  )
)

;; ===== HELPER FUNCTIONS =====

;; Get current aggregation round
(define-private (get-current-round (token-id uint))
  (var-get next-round-id) ;; Simplified - would calculate actual current round
)

;; Validate price submission
(define-private (validate-price-submission 
  (token-id uint) 
  (price uint) 
  (oracle-config {
    min-oracles: uint,
    max-price-deviation: uint,
    update-frequency: uint,
    stale-threshold: uint,
    aggregation-method: (string-ascii 16),
    active: bool
  })
)
  (let (
    (current-price-feed (map-get? token-price-feeds {token-id: token-id}))
    (max-deviation (get max-price-deviation oracle-config))
  )
    (match current-price-feed
      price-feed (let (
        (current-price (get current-price price-feed))
        (deviation (if (> price current-price) 
                     (/ (* (- price current-price) u10000) current-price)
                     (/ (* (- current-price price) u10000) current-price)))
      )
        (if (> current-price u0)
          (asserts! (<= deviation max-deviation) ERR_PRICE_DEVIATION)
          (ok true)
        )
      )
      (ok true) ;; No existing price data
    )
  )
)

;; Update round submissions
(define-private (update-round-submissions (token-id uint) (round-id uint))
  (let ((round-data (map-get? aggregation-rounds {token-id: token-id, round-id: round-id})))
    (map-set aggregation-rounds {token-id: token-id, round-id: round-id}
      (match round-data
        existing-round (merge existing-round {
          submissions-count: (+ (get submissions-count existing-round) u1)
        })
        {
          start-time: (default-to u0 (get-block-info? time (- block-height u1))),
          end-time: u0,
          submissions-count: u1,
          min-submissions: u3, ;; Default minimum
          aggregated-price: none,
          median-price: none,
          price-variance: u0,
          status: "active"
        }
      )
    )
  )
)

;; Check aggregation threshold
(define-private (check-aggregation-threshold (token-id uint) (round-id uint))
  (let (
    (round-data (unwrap-panic (map-get? aggregation-rounds {token-id: token-id, round-id: round-id})))
    (oracle-config (unwrap-panic (map-get? oracle-configs {token-id: token-id})))
  )
    (if (>= (get submissions-count round-data) (get min-oracles oracle-config))
      (aggregate-price-data token-id round-id)
      (ok u0)
    )
  )
)

;; Calculate aggregated price
(define-private (calculate-aggregated-price (token-id uint) (round-id uint) (method (string-ascii 16)))
  (if (is-eq method "median")
    (calculate-median-price token-id round-id)
    (if (is-eq method "mean")
      (calculate-mean-price token-id round-id)
      (calculate-weighted-price token-id round-id)
    )
  )
)

;; Calculate median price
(define-private (calculate-median-price (token-id uint) (round-id uint))
  u1000 ;; Simplified - would calculate actual median
)

;; Calculate mean price
(define-private (calculate-mean-price (token-id uint) (round-id uint))
  u1000 ;; Simplified - would calculate actual mean
)

;; Calculate weighted price
(define-private (calculate-weighted-price (token-id uint) (round-id uint))
  u1000 ;; Simplified - would calculate actual weighted average
)

;; Calculate price variance
(define-private (calculate-price-variance (token-id uint) (round-id uint))
  u100 ;; Simplified - would calculate actual variance
)

;; Update price feed
(define-private (update-price-feed (token-id uint) (new-price uint))
  (let (
    (current-feed (unwrap-panic (map-get? token-price-feeds {token-id: token-id})))
    (current-time (default-to u0 (get-block-info? time (- block-height u1))))
    (price-change (- (to-int new-price) (to-int (get current-price current-feed))))
  )
    (map-set token-price-feeds {token-id: token-id}
      (merge current-feed {
        previous-price: (get current-price current-feed),
        current-price: new-price,
        price-change-24h: price-change,
        last-updated: current-time,
        update-count: (+ (get update-count current-feed) u1),
        data-sources: (+ (get data-sources current-feed) u1)
      })
    )
  )
)

;; Validate oracle submissions
(define-private (validate-oracle-submissions (token-id uint) (round-id uint) (final-price uint))
  ;; Simplified - would validate each submission and update oracle reputation
  (ok true)
)

;; Distribute oracle rewards
(define-private (distribute-oracle-rewards (token-id uint) (round-id uint))
  ;; Simplified - would distribute rewards to participating oracles
  (ok true)
)

;; Validate aggregation method
(define-private (is-valid-aggregation-method (method (string-ascii 16)))
  (or (is-eq method "median")
      (or (is-eq method "mean")
          (is-eq method "weighted")))
)

;; Placeholder for token balance check
(define-private (get-token-balance (token-id uint) (owner principal))
  u10000 ;; Simplified - would call main contract
)

;; ===== READ-ONLY FUNCTIONS =====

;; Get oracle provider
(define-read-only (get-oracle-provider (oracle-id uint))
  (ok (map-get? oracle-providers {oracle-id: oracle-id}))
)

;; Get token price feed
(define-read-only (get-token-price-feed (token-id uint))
  (ok (map-get? token-price-feeds {token-id: token-id}))
)

;; Get price submission
(define-read-only (get-price-submission (token-id uint) (oracle-id uint) (round-id uint))
  (ok (map-get? price-submissions {token-id: token-id, oracle-id: oracle-id, round-id: round-id}))
)

;; Get aggregation round
(define-read-only (get-aggregation-round (token-id uint) (round-id uint))
  (ok (map-get? aggregation-rounds {token-id: token-id, round-id: round-id}))
)

;; Get oracle configuration
(define-read-only (get-oracle-config (token-id uint))
  (ok (map-get? oracle-configs {token-id: token-id}))
)

;; Get current price
(define-read-only (get-current-price (token-id uint))
  (match (map-get? token-price-feeds {token-id: token-id})
    price-feed (let (
      (current-time (default-to u0 (get-block-info? time (- block-height u1))))
      (last-updated (get last-updated price-feed))
      (stale-threshold (match (map-get? oracle-configs {token-id: token-id})
        config (get stale-threshold config)
        u3600 ;; Default 1 hour
      ))
    )
      (if (< (- current-time last-updated) stale-threshold)
        (ok (get current-price price-feed))
        (err ERR_STALE_PRICE)
      )
    )
    (err ERR_NOT_FOUND)
  )
)

;; Get price history
(define-read-only (get-price-history (token-id uint) (timestamp uint))
  (ok (map-get? price-history {token-id: token-id, timestamp: timestamp}))
)

;; Get oracle overview
(define-read-only (get-oracle-overview)
  (ok {
    total-oracles: (- (var-get next-oracle-id) u1),
    total-rounds: (- (var-get next-round-id) u1),
    total-rewards-distributed: (var-get total-oracle-rewards),
    active-feeds: u0 ;; Would count active price feeds
  })
)

;; Calculate price volatility
(define-read-only (calculate-price-volatility (token-id uint) (period uint))
  (ok {
    volatility: u500, ;; Simplified calculation
    period: period,
    data-points: u24, ;; Number of data points used
    confidence: u85 ;; Confidence level
  })
)