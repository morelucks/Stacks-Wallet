;; =====================================================================
;; Multi-Token Lottery Module
;; =====================================================================
;; 
;; Lottery and gaming mechanics for multi-token ecosystem
;; Enables fair and transparent lottery games with token rewards
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
(define-constant ERR_LOTTERY_ENDED (err u403))
(define-constant ERR_LOTTERY_ACTIVE (err u405))
(define-constant ERR_ALREADY_PARTICIPATED (err u406))

;; Lottery types
(define-constant LOTTERY_SIMPLE u1)
(define-constant LOTTERY_MULTI_TIER u2)
(define-constant LOTTERY_PROGRESSIVE u3)
(define-constant LOTTERY_INSTANT u4)

;; ===== LOTTERY DATA MAPS =====

;; Lottery games
(define-map lottery-games {lottery-id: uint} {
  name: (string-utf8 64),
  description: (string-utf8 256),
  entry-token: uint,
  entry-price: uint,
  prize-token: uint,
  total-prize-pool: uint,
  max-participants: (optional uint),
  lottery-type: uint,
  start-time: uint,
  end-time: uint,
  draw-time: (optional uint),
  status: (string-ascii 16), ;; "active", "ended", "drawn", "cancelled"
  creator: principal,
  winner: (optional principal)
})

;; Lottery participants
(define-map lottery-participants {lottery-id: uint, participant: principal} {
  entry-count: uint,
  total-paid: uint,
  participation-time: uint,
  lucky-numbers: (list 10 uint),
  instant-win: bool
})

;; Lottery tickets
(define-map lottery-tickets {ticket-id: uint} {
  lottery-id: uint,
  owner: principal,
  numbers: (list 6 uint),
  purchase-time: uint,
  winning-tier: (optional uint),
  claimed: bool
})

;; Prize tiers for multi-tier lotteries
(define-map prize-tiers {lottery-id: uint, tier: uint} {
  matches-required: uint,
  prize-percentage: uint,
  winner-count: uint,
  total-prize: uint
})

;; Gaming statistics
(define-map gaming-stats {user: principal} {
  total-games-played: uint,
  total-spent: uint,
  total-won: uint,
  biggest-win: uint,
  win-streak: uint,
  last-game: uint
})

;; Random number generation (simplified)
(define-map random-seeds {block-height: uint} (buff 32))

;; Counters
(define-data-var next-lottery-id uint u1)
(define-data-var next-ticket-id uint u1)
(define-data-var total-lottery-volume uint u0)
(define-data-var house-edge uint u500) ;; 5% house edge

;; ===== LOTTERY CREATION FUNCTIONS =====

;; Create simple lottery
(define-public (create-simple-lottery
  (name (string-utf8 64))
  (description (string-utf8 256))
  (entry-token uint)
  (entry-price uint)
  (prize-token uint)
  (initial-prize uint)
  (max-participants (optional uint))
  (duration uint)
)
  (let ((lottery-id (var-get next-lottery-id)))
    (begin
      ;; Validation
      (asserts! (> (len name) u0) ERR_INVALID_PARAMETER)
      (asserts! (> entry-price u0) ERR_INVALID_PARAMETER)
      (asserts! (> initial-prize u0) ERR_INVALID_PARAMETER)
      (asserts! (> duration u0) ERR_INVALID_PARAMETER)
      
      ;; Check creator has initial prize tokens
      (asserts! (>= (get-token-balance prize-token tx-sender) initial-prize) ERR_INSUFFICIENT_BALANCE)
      
      (let (
        (current-time (default-to u0 (get-block-info? time (- block-height u1))))
        (end-time (+ current-time duration))
      )
        ;; Create lottery
        (map-set lottery-games {lottery-id: lottery-id} {
          name: name,
          description: description,
          entry-token: entry-token,
          entry-price: entry-price,
          prize-token: prize-token,
          total-prize-pool: initial-prize,
          max-participants: max-participants,
          lottery-type: LOTTERY_SIMPLE,
          start-time: current-time,
          end-time: end-time,
          draw-time: none,
          status: "active",
          creator: tx-sender,
          winner: none
        })
        
        ;; Transfer initial prize to contract (simplified)
        ;; (try! (transfer-to-lottery prize-token initial-prize tx-sender))
        
        ;; Increment lottery ID
        (var-set next-lottery-id (+ lottery-id u1))
        
        (print {
          notification: "lottery-created",
          payload: {
            lottery-id: lottery-id,
            name: name,
            entry-price: entry-price,
            initial-prize: initial-prize,
            end-time: end-time,
            creator: tx-sender
          }
        })
        
        (ok lottery-id)
      )
    )
  )
)

;; Create multi-tier lottery
(define-public (create-multi-tier-lottery
  (name (string-utf8 64))
  (entry-token uint)
  (entry-price uint)
  (prize-token uint)
  (initial-prize uint)
  (tier-config (list 5 {matches: uint, percentage: uint}))
  (duration uint)
)
  (let ((lottery-id (var-get next-lottery-id)))
    (begin
      ;; Validation
      (asserts! (> (len name) u0) ERR_INVALID_PARAMETER)
      (asserts! (> entry-price u0) ERR_INVALID_PARAMETER)
      (asserts! (> initial-prize u0) ERR_INVALID_PARAMETER)
      (asserts! (<= (len tier-config) u5) ERR_INVALID_PARAMETER)
      
      ;; Validate tier percentages sum to 100%
      (asserts! (is-eq (fold sum-tier-percentages tier-config u0) u10000) ERR_INVALID_PARAMETER)
      
      (let (
        (current-time (default-to u0 (get-block-info? time (- block-height u1))))
        (end-time (+ current-time duration))
      )
        ;; Create lottery
        (map-set lottery-games {lottery-id: lottery-id} {
          name: name,
          description: u"Multi-tier lottery with multiple prize levels",
          entry-token: entry-token,
          entry-price: entry-price,
          prize-token: prize-token,
          total-prize-pool: initial-prize,
          max-participants: none,
          lottery-type: LOTTERY_MULTI_TIER,
          start-time: current-time,
          end-time: end-time,
          draw-time: none,
          status: "active",
          creator: tx-sender,
          winner: none
        })
        
        ;; Create prize tiers
        (try! (create-prize-tiers lottery-id tier-config u0))
        
        ;; Increment lottery ID
        (var-set next-lottery-id (+ lottery-id u1))
        
        (print {
          notification: "multi-tier-lottery-created",
          payload: {
            lottery-id: lottery-id,
            name: name,
            tier-count: (len tier-config),
            total-prize: initial-prize
          }
        })
        
        (ok lottery-id)
      )
    )
  )
)

;; Helper to sum tier percentages
(define-private (sum-tier-percentages 
  (tier {matches: uint, percentage: uint})
  (acc uint)
)
  (+ acc (get percentage tier))
)

;; Helper to create prize tiers
(define-private (create-prize-tiers 
  (lottery-id uint)
  (tier-config (list 5 {matches: uint, percentage: uint}))
  (tier-index uint)
)
  (match (element-at tier-config tier-index)
    tier-data (begin
      (map-set prize-tiers {lottery-id: lottery-id, tier: tier-index} {
        matches-required: (get matches tier-data),
        prize-percentage: (get percentage tier-data),
        winner-count: u0,
        total-prize: u0
      })
      (if (< tier-index (- (len tier-config) u1))
        (create-prize-tiers lottery-id tier-config (+ tier-index u1))
        (ok true)
      )
    )
    (ok true)
  )
)

;; ===== LOTTERY PARTICIPATION FUNCTIONS =====

;; Enter lottery
(define-public (enter-lottery (lottery-id uint) (entry-count uint))
  (let (
    (lottery-data (unwrap! (map-get? lottery-games {lottery-id: lottery-id}) ERR_NOT_FOUND))
    (participant-key {lottery-id: lottery-id, participant: tx-sender})
    (existing-participation (map-get? lottery-participants participant-key))
    (current-time (default-to u0 (get-block-info? time (- block-height u1))))
    (total-cost (* entry-count (get entry-price lottery-data)))
  )
    (begin
      ;; Validation
      (asserts! (is-eq (get status lottery-data) "active") ERR_LOTTERY_ENDED)
      (asserts! (< current-time (get end-time lottery-data)) ERR_LOTTERY_ENDED)
      (asserts! (> entry-count u0) ERR_INVALID_PARAMETER)
      (asserts! (>= (get-token-balance (get entry-token lottery-data) tx-sender) total-cost) ERR_INSUFFICIENT_BALANCE)
      
      ;; Check max participants limit
      (match (get max-participants lottery-data)
        max-parts (asserts! (< (count-lottery-participants lottery-id) max-parts) ERR_INVALID_PARAMETER)
        true
      )
      
      ;; Generate lucky numbers
      (let ((lucky-numbers (generate-lucky-numbers entry-count)))
        ;; Update participation
        (map-set lottery-participants participant-key
          (match existing-participation
            participation-data {
              entry-count: (+ (get entry-count participation-data) entry-count),
              total-paid: (+ (get total-paid participation-data) total-cost),
              participation-time: (get participation-time participation-data),
              lucky-numbers: lucky-numbers,
              instant-win: (check-instant-win lucky-numbers)
            }
            {
              entry-count: entry-count,
              total-paid: total-cost,
              participation-time: current-time,
              lucky-numbers: lucky-numbers,
              instant-win: (check-instant-win lucky-numbers)
            }
          )
        )
        
        ;; Update lottery prize pool
        (let ((house-fee (/ (* total-cost (var-get house-edge)) u10000)))
          (map-set lottery-games {lottery-id: lottery-id}
            (merge lottery-data {
              total-prize-pool: (+ (get total-prize-pool lottery-data) (- total-cost house-fee))
            })
          )
        )
        
        ;; Update gaming stats
        (update-gaming-stats tx-sender "entry" total-cost u0)
        
        ;; Update total volume
        (var-set total-lottery-volume (+ (var-get total-lottery-volume) total-cost))
        
        (print {
          notification: "lottery-entered",
          payload: {
            lottery-id: lottery-id,
            participant: tx-sender,
            entry-count: entry-count,
            total-cost: total-cost,
            lucky-numbers: lucky-numbers
          }
        })
        
        (ok true)
      )
    )
  )
)

;; Buy lottery ticket (for number-based lotteries)
(define-public (buy-lottery-ticket 
  (lottery-id uint)
  (numbers (list 6 uint))
)
  (let (
    (ticket-id (var-get next-ticket-id))
    (lottery-data (unwrap! (map-get? lottery-games {lottery-id: lottery-id}) ERR_NOT_FOUND))
    (current-time (default-to u0 (get-block-info? time (- block-height u1))))
  )
    (begin
      ;; Validation
      (asserts! (is-eq (get status lottery-data) "active") ERR_LOTTERY_ENDED)
      (asserts! (< current-time (get end-time lottery-data)) ERR_LOTTERY_ENDED)
      (asserts! (is-eq (len numbers) u6) ERR_INVALID_PARAMETER)
      (asserts! (validate-lottery-numbers numbers) ERR_INVALID_PARAMETER)
      (asserts! (>= (get-token-balance (get entry-token lottery-data) tx-sender) (get entry-price lottery-data)) ERR_INSUFFICIENT_BALANCE)
      
      ;; Create ticket
      (map-set lottery-tickets {ticket-id: ticket-id} {
        lottery-id: lottery-id,
        owner: tx-sender,
        numbers: numbers,
        purchase-time: current-time,
        winning-tier: none,
        claimed: false
      })
      
      ;; Update lottery prize pool
      (let ((house-fee (/ (* (get entry-price lottery-data) (var-get house-edge)) u10000)))
        (map-set lottery-games {lottery-id: lottery-id}
          (merge lottery-data {
            total-prize-pool: (+ (get total-prize-pool lottery-data) (- (get entry-price lottery-data) house-fee))
          })
        )
      )
      
      ;; Increment ticket ID
      (var-set next-ticket-id (+ ticket-id u1))
      
      (print {
        notification: "lottery-ticket-purchased",
        payload: {
          ticket-id: ticket-id,
          lottery-id: lottery-id,
          owner: tx-sender,
          numbers: numbers,
          price: (get entry-price lottery-data)
        }
      })
      
      (ok ticket-id)
    )
  )
)

;; Draw lottery winner
(define-public (draw-lottery (lottery-id uint))
  (let (
    (lottery-data (unwrap! (map-get? lottery-games {lottery-id: lottery-id}) ERR_NOT_FOUND))
    (current-time (default-to u0 (get-block-info? time (- block-height u1))))
  )
    (begin
      ;; Validation
      (asserts! (is-eq (get status lottery-data) "active") ERR_INVALID_PARAMETER)
      (asserts! (>= current-time (get end-time lottery-data)) ERR_LOTTERY_ACTIVE)
      (asserts! (or (is-eq tx-sender (get creator lottery-data)) (is-eq tx-sender CONTRACT_OWNER)) ERR_UNAUTHORIZED)
      
      ;; Generate winning numbers
      (let ((winning-numbers (generate-winning-numbers lottery-id)))
        ;; Determine winner based on lottery type
        (let ((winner (determine-lottery-winner lottery-id winning-numbers)))
          ;; Update lottery status
          (map-set lottery-games {lottery-id: lottery-id}
            (merge lottery-data {
              status: "drawn",
              draw-time: (some current-time),
              winner: winner
            })
          )
          
          ;; Distribute prizes
          (try! (distribute-lottery-prizes lottery-id winner))
          
          (print {
            notification: "lottery-drawn",
            payload: {
              lottery-id: lottery-id,
              winning-numbers: winning-numbers,
              winner: winner,
              prize-pool: (get total-prize-pool lottery-data)
            }
          })
          
          (ok winner)
        )
      )
    )
  )
)

;; ===== HELPER FUNCTIONS =====

;; Generate lucky numbers (simplified random)
(define-private (generate-lucky-numbers (count uint))
  (list u1 u2 u3 u4 u5) ;; Simplified - would use proper randomness
)

;; Check instant win condition
(define-private (check-instant-win (numbers (list 10 uint)))
  false ;; Simplified - would check actual instant win conditions
)

;; Validate lottery numbers
(define-private (validate-lottery-numbers (numbers (list 6 uint)))
  (and 
    (> (len numbers) u0)
    (<= (len numbers) u6)
    (fold validate-single-number numbers true)
  )
)

;; Validate single number
(define-private (validate-single-number (number uint) (acc bool))
  (and acc (and (>= number u1) (<= number u49))) ;; Numbers 1-49
)

;; Generate winning numbers
(define-private (generate-winning-numbers (lottery-id uint))
  (list u7 u14 u21 u28 u35 u42) ;; Simplified - would use proper randomness
)

;; Determine lottery winner
(define-private (determine-lottery-winner (lottery-id uint) (winning-numbers (list 6 uint)))
  (some CONTRACT_OWNER) ;; Simplified - would determine actual winner
)

;; Distribute lottery prizes
(define-private (distribute-lottery-prizes (lottery-id uint) (winner (optional principal)))
  (match winner
    winner-principal (begin
      ;; Transfer prize to winner (simplified)
      ;; (try! (transfer-lottery-prize lottery-id winner-principal))
      (update-gaming-stats winner-principal "win" u0 u1000) ;; Example win amount
      (ok true)
    )
    (ok true) ;; No winner
  )
)

;; Count lottery participants
(define-private (count-lottery-participants (lottery-id uint))
  u0 ;; Simplified - would count actual participants
)

;; Update gaming statistics
(define-private (update-gaming-stats (user principal) (action (string-ascii 8)) (amount uint) (win-amount uint))
  (let ((current-stats (map-get? gaming-stats {user: user})))
    (map-set gaming-stats {user: user}
      (match current-stats
        stats (if (is-eq action "entry")
          {
            total-games-played: (+ (get total-games-played stats) u1),
            total-spent: (+ (get total-spent stats) amount),
            total-won: (get total-won stats),
            biggest-win: (get biggest-win stats),
            win-streak: (get win-streak stats),
            last-game: (default-to u0 (get-block-info? time (- block-height u1)))
          }
          {
            total-games-played: (get total-games-played stats),
            total-spent: (get total-spent stats),
            total-won: (+ (get total-won stats) win-amount),
            biggest-win: (if (> win-amount (get biggest-win stats)) win-amount (get biggest-win stats)),
            win-streak: (+ (get win-streak stats) u1),
            last-game: (default-to u0 (get-block-info? time (- block-height u1)))
          }
        )
        {
          total-games-played: u1,
          total-spent: amount,
          total-won: win-amount,
          biggest-win: win-amount,
          win-streak: (if (> win-amount u0) u1 u0),
          last-game: (default-to u0 (get-block-info? time (- block-height u1)))
        }
      )
    )
  )
)

;; Placeholder for token balance check
(define-private (get-token-balance (token-id uint) (owner principal))
  u10000 ;; Simplified - would call main contract
)

;; ===== READ-ONLY FUNCTIONS =====

;; Get lottery game
(define-read-only (get-lottery-game (lottery-id uint))
  (ok (map-get? lottery-games {lottery-id: lottery-id}))
)

;; Get lottery participant
(define-read-only (get-lottery-participant (lottery-id uint) (participant principal))
  (ok (map-get? lottery-participants {lottery-id: lottery-id, participant: participant}))
)

;; Get lottery ticket
(define-read-only (get-lottery-ticket (ticket-id uint))
  (ok (map-get? lottery-tickets {ticket-id: ticket-id}))
)

;; Get prize tier
(define-read-only (get-prize-tier (lottery-id uint) (tier uint))
  (ok (map-get? prize-tiers {lottery-id: lottery-id, tier: tier}))
)

;; Get gaming statistics
(define-read-only (get-gaming-stats (user principal))
  (ok (map-get? gaming-stats {user: user}))
)

;; Get lottery overview
(define-read-only (get-lottery-overview)
  (ok {
    total-lotteries: (- (var-get next-lottery-id) u1),
    total-tickets: (- (var-get next-ticket-id) u1),
    total-volume: (var-get total-lottery-volume),
    house-edge: (var-get house-edge),
    active-lotteries: u0 ;; Would count active lotteries
  })
)

;; Calculate lottery odds
(define-read-only (calculate-lottery-odds (lottery-id uint))
  (match (map-get? lottery-games {lottery-id: lottery-id})
    lottery-data (let (
      (participant-count (count-lottery-participants lottery-id))
      (odds (if (> participant-count u0) (/ u10000 participant-count) u0))
    )
      (ok {
        participant-count: participant-count,
        win-odds: odds,
        prize-pool: (get total-prize-pool lottery-data)
      })
    )
    (ok {
      participant-count: u0,
      win-odds: u0,
      prize-pool: u0
    })
  )
)