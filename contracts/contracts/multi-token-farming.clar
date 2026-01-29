;; =====================================================================
;; Multi-Token Farming Module
;; =====================================================================
;; 
;; Yield farming and liquidity mining system for multi-token ecosystem
;; Enables users to earn rewards by providing liquidity and staking tokens
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
(define-constant ERR_FARM_INACTIVE (err u403))
(define-constant ERR_HARVEST_TOO_EARLY (err u405))

;; Farm types
(define-constant FARM_SINGLE_STAKE u1)
(define-constant FARM_LP_STAKE u2)
(define-constant FARM_MULTI_STAKE u3)

;; ===== FARMING DATA MAPS =====

;; Farming pools
(define-map farming-pools {pool-id: uint} {
  name: (string-utf8 64),
  stake-token: uint,
  reward-token: uint,
  reward-rate: uint, ;; Rewards per block per staked token
  total-staked: uint,
  total-rewards-distributed: uint,
  start-block: uint,
  end-block: (optional uint),
  farm-type: uint,
  multiplier: uint, ;; Reward multiplier (basis points)
  active: bool,
  creator: principal
})

;; User stakes in farming pools
(define-map user-stakes {pool-id: uint, user: principal} {
  staked-amount: uint,
  reward-debt: uint,
  last-harvest: uint,
  stake-time: uint,
  boost-multiplier: uint
})

;; Liquidity provider positions
(define-map lp-positions {position-id: uint} {
  user: principal,
  token-a: uint,
  token-b: uint,
  liquidity-amount: uint,
  token-a-amount: uint,
  token-b-amount: uint,
  created-at: uint,
  farm-pool: (optional uint)
})

;; Yield farming strategies
(define-map farming-strategies {strategy-id: uint} {
  name: (string-utf8 64),
  description: (string-utf8 256),
  target-pools: (list 5 uint),
  allocation-weights: (list 5 uint),
  auto-compound: bool,
  min-harvest-amount: uint,
  strategy-fee: uint,
  active: bool
})

;; User strategy positions
(define-map user-strategies {strategy-id: uint, user: principal} {
  invested-amount: uint,
  shares: uint,
  last-compound: uint,
  total-rewards: uint,
  entry-time: uint
})

;; Boost multipliers for long-term staking
(define-map boost-tiers {tier: uint} {
  min-stake-duration: uint,
  multiplier: uint, ;; Basis points
  min-stake-amount: uint
})

;; Counters
(define-data-var next-pool-id uint u1)
(define-data-var next-position-id uint u1)
(define-data-var next-strategy-id uint u1)
(define-data-var total-farming-rewards uint u0)

;; ===== FARMING POOL FUNCTIONS =====

;; Create farming pool
(define-public (create-farming-pool
  (name (string-utf8 64))
  (stake-token uint)
  (reward-token uint)
  (reward-rate uint)
  (start-block uint)
  (end-block (optional uint))
  (farm-type uint)
  (multiplier uint)
)
  (let ((pool-id (var-get next-pool-id)))
    (begin
      ;; Validation
      (asserts! (> (len name) u0) ERR_INVALID_PARAMETER)
      (asserts! (> reward-rate u0) ERR_INVALID_PARAMETER)
      (asserts! (>= start-block block-height) ERR_INVALID_PARAMETER)
      (asserts! (>= multiplier u10000) ERR_INVALID_PARAMETER) ;; Min 1x multiplier
      
      ;; Validate end block if provided
      (match end-block
        end-blk (asserts! (> end-blk start-block) ERR_INVALID_PARAMETER)
        true
      )
      
      ;; Create farming pool
      (map-set farming-pools {pool-id: pool-id} {
        name: name,
        stake-token: stake-token,
        reward-token: reward-token,
        reward-rate: reward-rate,
        total-staked: u0,
        total-rewards-distributed: u0,
        start-block: start-block,
        end-block: end-block,
        farm-type: farm-type,
        multiplier: multiplier,
        active: true,
        creator: tx-sender
      })
      
      ;; Increment pool ID
      (var-set next-pool-id (+ pool-id u1))
      
      (print {
        notification: "farming-pool-created",
        payload: {
          pool-id: pool-id,
          name: name,
          stake-token: stake-token,
          reward-token: reward-token,
          reward-rate: reward-rate,
          creator: tx-sender
        }
      })
      
      (ok pool-id)
    )
  )
)

;; Stake tokens in farming pool
(define-public (stake-in-farm (pool-id uint) (amount uint))
  (let (
    (pool-data (unwrap! (map-get? farming-pools {pool-id: pool-id}) ERR_NOT_FOUND))
    (stake-key {pool-id: pool-id, user: tx-sender})
    (existing-stake (map-get? user-stakes stake-key))
    (current-time (default-to u0 (get-block-info? time (- block-height u1))))
  )
    (begin
      ;; Validation
      (asserts! (get active pool-data) ERR_FARM_INACTIVE)
      (asserts! (>= block-height (get start-block pool-data)) ERR_INVALID_PARAMETER)
      (asserts! (> amount u0) ERR_INVALID_PARAMETER)
      (asserts! (>= (get-token-balance (get stake-token pool-data) tx-sender) amount) ERR_INSUFFICIENT_BALANCE)
      
      ;; Check if farm has ended
      (match (get end-block pool-data)
        end-blk (asserts! (< block-height end-blk) ERR_FARM_INACTIVE)
        true
      )
      
      ;; Harvest existing rewards first
      (match existing-stake
        stake-data (try! (harvest-rewards pool-id))
        true
      )
      
      ;; Update stake
      (map-set user-stakes stake-key
        (match existing-stake
          stake-data {
            staked-amount: (+ (get staked-amount stake-data) amount),
            reward-debt: u0, ;; Reset after harvesting
            last-harvest: block-height,
            stake-time: (get stake-time stake-data),
            boost-multiplier: (calculate-boost-multiplier (get stake-time stake-data) (+ (get staked-amount stake-data) amount))
          }
          {
            staked-amount: amount,
            reward-debt: u0,
            last-harvest: block-height,
            stake-time: current-time,
            boost-multiplier: u10000 ;; 1x multiplier initially
          }
        )
      )
      
      ;; Update pool total
      (map-set farming-pools {pool-id: pool-id}
        (merge pool-data {
          total-staked: (+ (get total-staked pool-data) amount)
        })
      )
      
      ;; Transfer tokens to farm (simplified)
      ;; (try! (transfer-to-farm (get stake-token pool-data) amount tx-sender))
      
      (print {
        notification: "tokens-staked-in-farm",
        payload: {
          pool-id: pool-id,
          user: tx-sender,
          amount: amount,
          total-staked: (+ (get total-staked pool-data) amount)
        }
      })
      
      (ok true)
    )
  )
)

;; Harvest farming rewards
(define-public (harvest-rewards (pool-id uint))
  (let (
    (pool-data (unwrap! (map-get? farming-pools {pool-id: pool-id}) ERR_NOT_FOUND))
    (stake-key {pool-id: pool-id, user: tx-sender})
    (stake-data (unwrap! (map-get? user-stakes stake-key) ERR_NOT_FOUND))
    (pending-rewards (calculate-pending-rewards pool-data stake-data))
  )
    (begin
      ;; Validation
      (asserts! (> pending-rewards u0) ERR_INVALID_PARAMETER)
      
      ;; Update stake data
      (map-set user-stakes stake-key
        (merge stake-data {
          reward-debt: (+ (get reward-debt stake-data) pending-rewards),
          last-harvest: block-height
        })
      )
      
      ;; Update pool rewards distributed
      (map-set farming-pools {pool-id: pool-id}
        (merge pool-data {
          total-rewards-distributed: (+ (get total-rewards-distributed pool-data) pending-rewards)
        })
      )
      
      ;; Transfer rewards (simplified)
      ;; (try! (transfer-rewards (get reward-token pool-data) pending-rewards tx-sender))
      
      ;; Update total farming rewards
      (var-set total-farming-rewards (+ (var-get total-farming-rewards) pending-rewards))
      
      (print {
        notification: "farming-rewards-harvested",
        payload: {
          pool-id: pool-id,
          user: tx-sender,
          reward-amount: pending-rewards,
          reward-token: (get reward-token pool-data)
        }
      })
      
      (ok pending-rewards)
    )
  )
)

;; Unstake tokens from farming pool
(define-public (unstake-from-farm (pool-id uint) (amount uint))
  (let (
    (pool-data (unwrap! (map-get? farming-pools {pool-id: pool-id}) ERR_NOT_FOUND))
    (stake-key {pool-id: pool-id, user: tx-sender})
    (stake-data (unwrap! (map-get? user-stakes stake-key) ERR_NOT_FOUND))
  )
    (begin
      ;; Validation
      (asserts! (> amount u0) ERR_INVALID_PARAMETER)
      (asserts! (>= (get staked-amount stake-data) amount) ERR_INSUFFICIENT_BALANCE)
      
      ;; Harvest rewards first
      (try! (harvest-rewards pool-id))
      
      ;; Update stake
      (let ((new-staked-amount (- (get staked-amount stake-data) amount)))
        (if (is-eq new-staked-amount u0)
          (map-delete user-stakes stake-key)
          (map-set user-stakes stake-key
            (merge stake-data {
              staked-amount: new-staked-amount,
              boost-multiplier: (calculate-boost-multiplier (get stake-time stake-data) new-staked-amount)
            })
          )
        )
      )
      
      ;; Update pool total
      (map-set farming-pools {pool-id: pool-id}
        (merge pool-data {
          total-staked: (- (get total-staked pool-data) amount)
        })
      )
      
      ;; Return staked tokens (simplified)
      ;; (try! (return-staked-tokens (get stake-token pool-data) amount tx-sender))
      
      (print {
        notification: "tokens-unstaked-from-farm",
        payload: {
          pool-id: pool-id,
          user: tx-sender,
          amount: amount,
          remaining-staked: (- (get staked-amount stake-data) amount)
        }
      })
      
      (ok true)
    )
  )
)

;; ===== LIQUIDITY PROVIDER FUNCTIONS =====

;; Add liquidity position
(define-public (add-liquidity-position
  (token-a uint)
  (token-b uint)
  (amount-a uint)
  (amount-b uint)
  (farm-pool (optional uint))
)
  (let ((position-id (var-get next-position-id)))
    (begin
      ;; Validation
      (asserts! (not (is-eq token-a token-b)) ERR_INVALID_PARAMETER)
      (asserts! (> amount-a u0) ERR_INVALID_PARAMETER)
      (asserts! (> amount-b u0) ERR_INVALID_PARAMETER)
      (asserts! (>= (get-token-balance token-a tx-sender) amount-a) ERR_INSUFFICIENT_BALANCE)
      (asserts! (>= (get-token-balance token-b tx-sender) amount-b) ERR_INSUFFICIENT_BALANCE)
      
      ;; Calculate liquidity amount (simplified)
      (let ((liquidity-amount (* amount-a amount-b)))
        ;; Create LP position
        (map-set lp-positions {position-id: position-id} {
          user: tx-sender,
          token-a: token-a,
          token-b: token-b,
          liquidity-amount: liquidity-amount,
          token-a-amount: amount-a,
          token-b-amount: amount-b,
          created-at: (default-to u0 (get-block-info? time (- block-height u1))),
          farm-pool: farm-pool
        })
        
        ;; If farm pool specified, stake LP tokens
        (match farm-pool
          pool-id (try! (stake-in-farm pool-id liquidity-amount))
          true
        )
        
        ;; Transfer tokens to LP (simplified)
        ;; (try! (transfer-to-lp token-a amount-a tx-sender))
        ;; (try! (transfer-to-lp token-b amount-b tx-sender))
        
        ;; Increment position ID
        (var-set next-position-id (+ position-id u1))
        
        (print {
          notification: "liquidity-position-added",
          payload: {
            position-id: position-id,
            user: tx-sender,
            token-a: token-a,
            token-b: token-b,
            liquidity-amount: liquidity-amount,
            farm-pool: farm-pool
          }
        })
        
        (ok position-id)
      )
    )
  )
)

;; ===== FARMING STRATEGY FUNCTIONS =====

;; Create farming strategy
(define-public (create-farming-strategy
  (name (string-utf8 64))
  (description (string-utf8 256))
  (target-pools (list 5 uint))
  (allocation-weights (list 5 uint))
  (auto-compound bool)
  (min-harvest-amount uint)
  (strategy-fee uint)
)
  (let ((strategy-id (var-get next-strategy-id)))
    (begin
      ;; Validation
      (asserts! (> (len name) u0) ERR_INVALID_PARAMETER)
      (asserts! (is-eq (len target-pools) (len allocation-weights)) ERR_INVALID_PARAMETER)
      (asserts! (<= strategy-fee u1000) ERR_INVALID_PARAMETER) ;; Max 10% fee
      
      ;; Validate allocation weights sum to 10000 (100%)
      (asserts! (is-eq (fold + allocation-weights u0) u10000) ERR_INVALID_PARAMETER)
      
      ;; Create strategy
      (map-set farming-strategies {strategy-id: strategy-id} {
        name: name,
        description: description,
        target-pools: target-pools,
        allocation-weights: allocation-weights,
        auto-compound: auto-compound,
        min-harvest-amount: min-harvest-amount,
        strategy-fee: strategy-fee,
        active: true
      })
      
      ;; Increment strategy ID
      (var-set next-strategy-id (+ strategy-id u1))
      
      (print {
        notification: "farming-strategy-created",
        payload: {
          strategy-id: strategy-id,
          name: name,
          target-pools: target-pools,
          auto-compound: auto-compound
        }
      })
      
      (ok strategy-id)
    )
  )
)

;; ===== HELPER FUNCTIONS =====

;; Calculate pending rewards
(define-private (calculate-pending-rewards 
  (pool-data {
    name: (string-utf8 64),
    stake-token: uint,
    reward-token: uint,
    reward-rate: uint,
    total-staked: uint,
    total-rewards-distributed: uint,
    start-block: uint,
    end-block: (optional uint),
    farm-type: uint,
    multiplier: uint,
    active: bool,
    creator: principal
  })
  (stake-data {
    staked-amount: uint,
    reward-debt: uint,
    last-harvest: uint,
    stake-time: uint,
    boost-multiplier: uint
  })
)
  (let (
    (blocks-since-harvest (- block-height (get last-harvest stake-data)))
    (base-rewards (* (* (get staked-amount stake-data) (get reward-rate pool-data)) blocks-since-harvest))
    (multiplied-rewards (/ (* base-rewards (get multiplier pool-data)) u10000))
    (boosted-rewards (/ (* multiplied-rewards (get boost-multiplier stake-data)) u10000))
  )
    boosted-rewards
  )
)

;; Calculate boost multiplier based on stake duration and amount
(define-private (calculate-boost-multiplier (stake-time uint) (stake-amount uint))
  (let (
    (current-time (default-to u0 (get-block-info? time (- block-height u1))))
    (stake-duration (- current-time stake-time))
  )
    ;; Simplified boost calculation
    (if (> stake-duration u2592000) ;; 30 days
      (if (> stake-amount u100000) ;; Large stake
        u15000 ;; 1.5x multiplier
        u12000 ;; 1.2x multiplier
      )
      u10000 ;; 1x multiplier
    )
  )
)

;; Placeholder for token balance check
(define-private (get-token-balance (token-id uint) (owner principal))
  u10000 ;; Simplified - would call main contract
)

;; ===== READ-ONLY FUNCTIONS =====

;; Get farming pool
(define-read-only (get-farming-pool (pool-id uint))
  (ok (map-get? farming-pools {pool-id: pool-id}))
)

;; Get user stake
(define-read-only (get-user-stake (pool-id uint) (user principal))
  (ok (map-get? user-stakes {pool-id: pool-id, user: user}))
)

;; Get LP position
(define-read-only (get-lp-position (position-id uint))
  (ok (map-get? lp-positions {position-id: position-id}))
)

;; Get farming strategy
(define-read-only (get-farming-strategy (strategy-id uint))
  (ok (map-get? farming-strategies {strategy-id: strategy-id}))
)

;; Calculate pending rewards for user
(define-read-only (get-pending-rewards (pool-id uint) (user principal))
  (match (map-get? farming-pools {pool-id: pool-id})
    pool-data (match (map-get? user-stakes {pool-id: pool-id, user: user})
      stake-data (ok (calculate-pending-rewards pool-data stake-data))
      (ok u0)
    )
    (ok u0)
  )
)

;; Get farming overview
(define-read-only (get-farming-overview)
  (ok {
    total-pools: (- (var-get next-pool-id) u1),
    total-positions: (- (var-get next-position-id) u1),
    total-strategies: (- (var-get next-strategy-id) u1),
    total-rewards-distributed: (var-get total-farming-rewards)
  })
)

;; Get pool APY (simplified calculation)
(define-read-only (calculate-pool-apy (pool-id uint))
  (match (map-get? farming-pools {pool-id: pool-id})
    pool-data (let (
      (annual-rewards (* (get reward-rate pool-data) u2102400)) ;; Blocks per year (simplified)
      (apy (if (> (get total-staked pool-data) u0)
             (/ (* annual-rewards u10000) (get total-staked pool-data))
             u0))
    )
      (ok apy)
    )
    (ok u0)
  )
)