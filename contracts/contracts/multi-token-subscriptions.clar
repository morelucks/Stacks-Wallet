;; =====================================================================
;; Multi-Token Subscriptions Module
;; =====================================================================
;; 
;; Subscription and recurring payment system for multi-token ecosystem
;; Enables automated recurring payments and subscription management
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
(define-constant ERR_SUBSCRIPTION_EXPIRED (err u403))
(define-constant ERR_SUBSCRIPTION_CANCELLED (err u405))

;; Subscription intervals
(define-constant INTERVAL_DAILY u86400)
(define-constant INTERVAL_WEEKLY u604800)
(define-constant INTERVAL_MONTHLY u2592000)
(define-constant INTERVAL_YEARLY u31536000)

;; ===== SUBSCRIPTION DATA MAPS =====

;; Subscription plans
(define-map subscription-plans {plan-id: uint} {
  creator: principal,
  name: (string-utf8 64),
  description: (string-utf8 256),
  price: uint,
  payment-token: uint,
  interval: uint, ;; Seconds between payments
  max-subscribers: (optional uint),
  benefits: (list 10 (string-utf8 128)),
  active: bool,
  created-at: uint
})

;; User subscriptions
(define-map user-subscriptions {subscription-id: uint} {
  subscriber: principal,
  plan-id: uint,
  start-date: uint,
  next-payment-due: uint,
  payments-made: uint,
  total-paid: uint,
  status: (string-ascii 16), ;; "active", "paused", "cancelled", "expired"
  auto-renew: bool,
  grace-period: uint
})

;; Subscription payments
(define-map subscription-payments {payment-id: uint} {
  subscription-id: uint,
  amount: uint,
  payment-token: uint,
  payment-date: uint,
  status: (string-ascii 16), ;; "pending", "completed", "failed", "refunded"
  transaction-hash: (optional (buff 32)),
  failure-reason: (optional (string-utf8 256))
})

;; Subscription analytics
(define-map subscription-analytics {plan-id: uint, period: uint} {
  new-subscribers: uint,
  cancelled-subscribers: uint,
  total-revenue: uint,
  churn-rate: uint,
  retention-rate: uint,
  avg-lifetime-value: uint
})

;; Recurring payment schedules
(define-map payment-schedules {schedule-id: uint} {
  payer: principal,
  payee: principal,
  amount: uint,
  payment-token: uint,
  interval: uint,
  next-payment: uint,
  payments-remaining: (optional uint),
  total-payments: uint,
  active: bool,
  created-at: uint
})

;; Counters
(define-data-var next-plan-id uint u1)
(define-data-var next-subscription-id uint u1)
(define-data-var next-payment-id uint u1)
(define-data-var next-schedule-id uint u1)
(define-data-var total-subscription-revenue uint u0)

;; ===== SUBSCRIPTION PLAN FUNCTIONS =====

;; Create subscription plan
(define-public (create-subscription-plan
  (name (string-utf8 64))
  (description (string-utf8 256))
  (price uint)
  (payment-token uint)
  (interval uint)
  (max-subscribers (optional uint))
  (benefits (list 10 (string-utf8 128)))
)
  (let ((plan-id (var-get next-plan-id)))
    (begin
      ;; Validation
      (asserts! (> (len name) u0) ERR_INVALID_PARAMETER)
      (asserts! (> price u0) ERR_INVALID_PARAMETER)
      (asserts! (> interval u0) ERR_INVALID_PARAMETER)
      (asserts! (<= (len benefits) u10) ERR_INVALID_PARAMETER)
      
      ;; Validate interval is one of the supported values
      (asserts! (or (is-eq interval INTERVAL_DAILY)
                    (or (is-eq interval INTERVAL_WEEKLY)
                        (or (is-eq interval INTERVAL_MONTHLY)
                            (is-eq interval INTERVAL_YEARLY)))) ERR_INVALID_PARAMETER)
      
      ;; Create plan
      (map-set subscription-plans {plan-id: plan-id} {
        creator: tx-sender,
        name: name,
        description: description,
        price: price,
        payment-token: payment-token,
        interval: interval,
        max-subscribers: max-subscribers,
        benefits: benefits,
        active: true,
        created-at: (default-to u0 (get-block-info? time (- block-height u1)))
      })
      
      ;; Initialize analytics
      (let ((current-period (/ (default-to u0 (get-block-info? time (- block-height u1))) u86400)))
        (map-set subscription-analytics {plan-id: plan-id, period: current-period} {
          new-subscribers: u0,
          cancelled-subscribers: u0,
          total-revenue: u0,
          churn-rate: u0,
          retention-rate: u100,
          avg-lifetime-value: u0
        })
      )
      
      ;; Increment plan ID
      (var-set next-plan-id (+ plan-id u1))
      
      (print {
        notification: "subscription-plan-created",
        payload: {
          plan-id: plan-id,
          creator: tx-sender,
          name: name,
          price: price,
          interval: interval
        }
      })
      
      (ok plan-id)
    )
  )
)

;; Subscribe to plan
(define-public (subscribe-to-plan
  (plan-id uint)
  (auto-renew bool)
  (grace-period uint)
)
  (let (
    (subscription-id (var-get next-subscription-id))
    (plan-data (unwrap! (map-get? subscription-plans {plan-id: plan-id}) ERR_NOT_FOUND))
    (current-time (default-to u0 (get-block-info? time (- block-height u1))))
    (next-payment (+ current-time (get interval plan-data)))
  )
    (begin
      ;; Validation
      (asserts! (get active plan-data) ERR_INVALID_PARAMETER)
      (asserts! (<= grace-period u2592000) ERR_INVALID_PARAMETER) ;; Max 30 days grace period
      
      ;; Check max subscribers limit
      (match (get max-subscribers plan-data)
        max-subs (asserts! (< (count-plan-subscribers plan-id) max-subs) ERR_INVALID_PARAMETER)
        true
      )
      
      ;; Check user can pay first payment
      (asserts! (>= (get-token-balance (get payment-token plan-data) tx-sender) (get price plan-data)) ERR_INSUFFICIENT_BALANCE)
      
      ;; Process first payment
      (try! (process-subscription-payment subscription-id (get price plan-data) (get payment-token plan-data)))
      
      ;; Create subscription
      (map-set user-subscriptions {subscription-id: subscription-id} {
        subscriber: tx-sender,
        plan-id: plan-id,
        start-date: current-time,
        next-payment-due: next-payment,
        payments-made: u1,
        total-paid: (get price plan-data),
        status: "active",
        auto-renew: auto-renew,
        grace-period: grace-period
      })
      
      ;; Update analytics
      (update-subscription-analytics plan-id "new-subscriber" u0)
      
      ;; Increment subscription ID
      (var-set next-subscription-id (+ subscription-id u1))
      
      (print {
        notification: "subscription-created",
        payload: {
          subscription-id: subscription-id,
          subscriber: tx-sender,
          plan-id: plan-id,
          next-payment-due: next-payment
        }
      })
      
      (ok subscription-id)
    )
  )
)

;; Process subscription payment
(define-public (process-subscription-payment
  (subscription-id uint)
  (amount uint)
  (payment-token uint)
)
  (let (
    (payment-id (var-get next-payment-id))
    (subscription-data (unwrap! (map-get? user-subscriptions {subscription-id: subscription-id}) ERR_NOT_FOUND))
    (current-time (default-to u0 (get-block-info? time (- block-height u1))))
  )
    (begin
      ;; Validation
      (asserts! (is-eq (get status subscription-data) "active") ERR_SUBSCRIPTION_CANCELLED)
      (asserts! (>= (get-token-balance payment-token (get subscriber subscription-data)) amount) ERR_INSUFFICIENT_BALANCE)
      
      ;; Transfer payment (simplified)
      ;; (try! (transfer-tokens payment-token amount (get subscriber subscription-data) plan-creator))
      
      ;; Record payment
      (map-set subscription-payments {payment-id: payment-id} {
        subscription-id: subscription-id,
        amount: amount,
        payment-token: payment-token,
        payment-date: current-time,
        status: "completed",
        transaction-hash: none,
        failure-reason: none
      })
      
      ;; Update subscription
      (map-set user-subscriptions {subscription-id: subscription-id}
        (merge subscription-data {
          payments-made: (+ (get payments-made subscription-data) u1),
          total-paid: (+ (get total-paid subscription-data) amount),
          next-payment-due: (+ current-time (get-subscription-interval subscription-id))
        })
      )
      
      ;; Update total revenue
      (var-set total-subscription-revenue (+ (var-get total-subscription-revenue) amount))
      
      ;; Increment payment ID
      (var-set next-payment-id (+ payment-id u1))
      
      (print {
        notification: "subscription-payment-processed",
        payload: {
          payment-id: payment-id,
          subscription-id: subscription-id,
          amount: amount,
          payment-token: payment-token
        }
      })
      
      (ok payment-id)
    )
  )
)

;; Cancel subscription
(define-public (cancel-subscription (subscription-id uint))
  (let (
    (subscription-data (unwrap! (map-get? user-subscriptions {subscription-id: subscription-id}) ERR_NOT_FOUND))
    (current-time (default-to u0 (get-block-info? time (- block-height u1))))
  )
    (begin
      ;; Validation
      (asserts! (is-eq tx-sender (get subscriber subscription-data)) ERR_UNAUTHORIZED)
      (asserts! (not (is-eq (get status subscription-data) "cancelled")) ERR_SUBSCRIPTION_CANCELLED)
      
      ;; Update subscription status
      (map-set user-subscriptions {subscription-id: subscription-id}
        (merge subscription-data {status: "cancelled"})
      )
      
      ;; Update analytics
      (update-subscription-analytics (get plan-id subscription-data) "cancellation" u0)
      
      (print {
        notification: "subscription-cancelled",
        payload: {
          subscription-id: subscription-id,
          subscriber: tx-sender,
          cancelled-at: current-time
        }
      })
      
      (ok true)
    )
  )
)

;; ===== RECURRING PAYMENT FUNCTIONS =====

;; Create recurring payment schedule
(define-public (create-payment-schedule
  (payee principal)
  (amount uint)
  (payment-token uint)
  (interval uint)
  (payments-count (optional uint))
)
  (let ((schedule-id (var-get next-schedule-id)))
    (begin
      ;; Validation
      (asserts! (not (is-eq payee tx-sender)) ERR_INVALID_PARAMETER)
      (asserts! (> amount u0) ERR_INVALID_PARAMETER)
      (asserts! (> interval u0) ERR_INVALID_PARAMETER)
      
      ;; Check first payment can be made
      (asserts! (>= (get-token-balance payment-token tx-sender) amount) ERR_INSUFFICIENT_BALANCE)
      
      ;; Create schedule
      (map-set payment-schedules {schedule-id: schedule-id} {
        payer: tx-sender,
        payee: payee,
        amount: amount,
        payment-token: payment-token,
        interval: interval,
        next-payment: (+ (default-to u0 (get-block-info? time (- block-height u1))) interval),
        payments-remaining: payments-count,
        total-payments: u0,
        active: true,
        created-at: (default-to u0 (get-block-info? time (- block-height u1)))
      })
      
      ;; Increment schedule ID
      (var-set next-schedule-id (+ schedule-id u1))
      
      (print {
        notification: "payment-schedule-created",
        payload: {
          schedule-id: schedule-id,
          payer: tx-sender,
          payee: payee,
          amount: amount,
          interval: interval
        }
      })
      
      (ok schedule-id)
    )
  )
)

;; Execute scheduled payment
(define-public (execute-scheduled-payment (schedule-id uint))
  (let (
    (schedule-data (unwrap! (map-get? payment-schedules {schedule-id: schedule-id}) ERR_NOT_FOUND))
    (current-time (default-to u0 (get-block-info? time (- block-height u1))))
  )
    (begin
      ;; Validation
      (asserts! (get active schedule-data) ERR_INVALID_PARAMETER)
      (asserts! (>= current-time (get next-payment schedule-data)) ERR_INVALID_PARAMETER)
      
      ;; Check payments remaining
      (match (get payments-remaining schedule-data)
        remaining (asserts! (> remaining u0) ERR_INVALID_PARAMETER)
        true
      )
      
      ;; Check payer has sufficient balance
      (asserts! (>= (get-token-balance (get payment-token schedule-data) (get payer schedule-data)) (get amount schedule-data)) ERR_INSUFFICIENT_BALANCE)
      
      ;; Process payment (simplified)
      ;; (try! (transfer-tokens (get payment-token schedule-data) (get amount schedule-data) (get payer schedule-data) (get payee schedule-data)))
      
      ;; Update schedule
      (map-set payment-schedules {schedule-id: schedule-id}
        (merge schedule-data {
          next-payment: (+ current-time (get interval schedule-data)),
          payments-remaining: (match (get payments-remaining schedule-data)
            remaining (if (is-eq remaining u1) none (some (- remaining u1)))
            none
          ),
          total-payments: (+ (get total-payments schedule-data) u1),
          active: (match (get payments-remaining schedule-data)
            remaining (> remaining u1)
            true
          )
        })
      )
      
      (print {
        notification: "scheduled-payment-executed",
        payload: {
          schedule-id: schedule-id,
          amount: (get amount schedule-data),
          payer: (get payer schedule-data),
          payee: (get payee schedule-data)
        }
      })
      
      (ok true)
    )
  )
)

;; ===== HELPER FUNCTIONS =====

;; Count subscribers for a plan
(define-private (count-plan-subscribers (plan-id uint))
  u0 ;; Simplified - would count actual subscribers
)

;; Get subscription interval
(define-private (get-subscription-interval (subscription-id uint))
  (match (map-get? user-subscriptions {subscription-id: subscription-id})
    sub-data (match (map-get? subscription-plans {plan-id: (get plan-id sub-data)})
      plan-data (get interval plan-data)
      INTERVAL_MONTHLY
    )
    INTERVAL_MONTHLY
  )
)

;; Update subscription analytics
(define-private (update-subscription-analytics (plan-id uint) (event-type (string-ascii 16)) (value uint))
  (let (
    (current-period (/ (default-to u0 (get-block-info? time (- block-height u1))) u86400))
    (analytics-key {plan-id: plan-id, period: current-period})
    (current-analytics (map-get? subscription-analytics analytics-key))
  )
    (map-set subscription-analytics analytics-key
      (match current-analytics
        analytics (if (is-eq event-type "new-subscriber")
          (merge analytics {new-subscribers: (+ (get new-subscribers analytics) u1)})
          (if (is-eq event-type "cancellation")
            (merge analytics {cancelled-subscribers: (+ (get cancelled-subscribers analytics) u1)})
            analytics
          )
        )
        {
          new-subscribers: (if (is-eq event-type "new-subscriber") u1 u0),
          cancelled-subscribers: (if (is-eq event-type "cancellation") u1 u0),
          total-revenue: value,
          churn-rate: u0,
          retention-rate: u100,
          avg-lifetime-value: u0
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

;; Get subscription plan
(define-read-only (get-subscription-plan (plan-id uint))
  (ok (map-get? subscription-plans {plan-id: plan-id}))
)

;; Get user subscription
(define-read-only (get-user-subscription (subscription-id uint))
  (ok (map-get? user-subscriptions {subscription-id: subscription-id}))
)

;; Get subscription payment
(define-read-only (get-subscription-payment (payment-id uint))
  (ok (map-get? subscription-payments {payment-id: payment-id}))
)

;; Get payment schedule
(define-read-only (get-payment-schedule (schedule-id uint))
  (ok (map-get? payment-schedules {schedule-id: schedule-id}))
)

;; Get subscription analytics
(define-read-only (get-subscription-analytics (plan-id uint) (period uint))
  (ok (map-get? subscription-analytics {plan-id: plan-id, period: period}))
)

;; Get subscription overview
(define-read-only (get-subscription-overview)
  (ok {
    total-plans: (- (var-get next-plan-id) u1),
    total-subscriptions: (- (var-get next-subscription-id) u1),
    total-payments: (- (var-get next-payment-id) u1),
    total-revenue: (var-get total-subscription-revenue),
    active-schedules: u0 ;; Would count active schedules
  })
)

;; Calculate subscription metrics
(define-read-only (calculate-subscription-metrics (plan-id uint) (period uint))
  (match (map-get? subscription-analytics {plan-id: plan-id, period: period})
    analytics (ok {
      growth-rate: (if (> (get new-subscribers analytics) u0) 
                    (/ (* (get new-subscribers analytics) u100) (+ (get new-subscribers analytics) (get cancelled-subscribers analytics)))
                    u0),
      churn-rate: (if (> (get cancelled-subscribers analytics) u0)
                   (/ (* (get cancelled-subscribers analytics) u100) (+ (get new-subscribers analytics) (get cancelled-subscribers analytics)))
                   u0),
      net-growth: (if (>= (get new-subscribers analytics) (get cancelled-subscribers analytics))
                   (- (get new-subscribers analytics) (get cancelled-subscribers analytics))
                   u0),
      revenue-per-subscriber: (if (> (get new-subscribers analytics) u0)
                               (/ (get total-revenue analytics) (get new-subscribers analytics))
                               u0)
    })
    (ok {
      growth-rate: u0,
      churn-rate: u0,
      net-growth: u0,
      revenue-per-subscriber: u0
    })
  )
)