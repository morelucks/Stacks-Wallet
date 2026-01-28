;; =====================================================================
;; Multi-Token Social Module
;; =====================================================================
;; 
;; Reputation system and social features for multi-token ecosystem
;; Enables community building, reputation tracking, and social interactions
;;
;; Version: 1.0.0
;; Compatible with: Clarity 4
;; ===================================================================== 

;; ===== CONSTANTS =====
(define-constant CONTRACT_OWNER tx-sender)
(define-constant ERR_UNAUTHORIZED (err u401))
(define-constant ERR_NOT_FOUND (err u404))
(define-constant ERR_INVALID_PARAMETER (err u400))
(define-constant ERR_ALREADY_EXISTS (err u405))
(define-constant ERR_INSUFFICIENT_REPUTATION (err u406))

;; Reputation actions
(define-constant ACTION_TOKEN_CREATION u1)
(define-constant ACTION_SUCCESSFUL_TRADE u2)
(define-constant ACTION_COMMUNITY_CONTRIBUTION u3)
(define-constant ACTION_GOVERNANCE_PARTICIPATION u4)
(define-constant ACTION_LIQUIDITY_PROVISION u5)

;; ===== SOCIAL DATA MAPS =====

;; User profiles
(define-map user-profiles {user: principal} {
  username: (string-utf8 32),
  bio: (string-utf8 256),
  avatar-url: (string-utf8 128),
  reputation-score: uint,
  level: uint,
  badges: (list 20 (string-ascii 16)),
  created-at: uint,
  last-active: uint,
  verified: bool
})

;; User reputation history
(define-map reputation-history {user: principal, action-id: uint} {
  action-type: uint,
  reputation-change: int,
  reason: (string-utf8 128),
  timestamp: uint,
  validator: (optional principal)
})

;; Social connections (following/followers)
(define-map social-connections {follower: principal, following: principal} {
  connected-at: uint,
  connection-strength: uint,
  mutual: bool
})

;; User achievements and badges
(define-map user-achievements {user: principal, achievement-id: uint} {
  achievement-name: (string-ascii 32),
  description: (string-utf8 128),
  earned-at: uint,
  rarity: (string-ascii 16), ;; "common", "rare", "epic", "legendary"
  token-reward: (optional uint)
})

;; Community groups
(define-map community-groups {group-id: uint} {
  name: (string-utf8 64),
  description: (string-utf8 256),
  creator: principal,
  member-count: uint,
  min-reputation: uint,
  token-requirement: (optional {token-id: uint, min-amount: uint}),
  created-at: uint,
  active: bool
})

;; Group memberships
(define-map group-memberships {group-id: uint, member: principal} {
  joined-at: uint,
  role: (string-ascii 16), ;; "member", "moderator", "admin"
  contribution-score: uint,
  last-activity: uint
})

;; Social posts and content
(define-map social-posts {post-id: uint} {
  author: principal,
  content: (string-utf8 512),
  post-type: (string-ascii 16), ;; "text", "trade", "analysis", "news"
  likes: uint,
  shares: uint,
  comments: uint,
  created-at: uint,
  token-mentions: (list 10 uint),
  hashtags: (list 10 (string-ascii 32))
})

;; Post interactions
(define-map post-interactions {post-id: uint, user: principal} {
  liked: bool,
  shared: bool,
  commented: bool,
  interaction-time: uint
})

;; Reputation validators
(define-map reputation-validators {validator: principal} {
  active: bool,
  validation-count: uint,
  accuracy-score: uint,
  stake-amount: uint,
  last-validation: uint
})

;; Counters
(define-data-var next-group-id uint u1)
(define-data-var next-post-id uint u1)
(define-data-var next-achievement-id uint u1)
(define-data-var next-action-id uint u1)

;; ===== PROFILE MANAGEMENT FUNCTIONS =====

;; Create user profile
(define-public (create-user-profile
  (username (string-utf8 32))
  (bio (string-utf8 256))
  (avatar-url (string-utf8 128))
)
  (let ((current-time (default-to u0 (get-block-info? time (- block-height u1)))))
    (begin
      ;; Validation
      (asserts! (> (len username) u0) ERR_INVALID_PARAMETER)
      (asserts! (<= (len username) u32) ERR_INVALID_PARAMETER)
      (asserts! (is-none (map-get? user-profiles {user: tx-sender})) ERR_ALREADY_EXISTS)
      
      ;; Check username uniqueness (simplified)
      (asserts! (is-username-available username) ERR_ALREADY_EXISTS)
      
      ;; Create profile
      (map-set user-profiles {user: tx-sender} {
        username: username,
        bio: bio,
        avatar-url: avatar-url,
        reputation-score: u100, ;; Starting reputation
        level: u1,
        badges: (list),
        created-at: current-time,
        last-active: current-time,
        verified: false
      })
      
      ;; Award profile creation achievement
      (try! (award-achievement tx-sender "profile-creator" u"Created first profile" "common" none))
      
      (print {
        notification: "profile-created",
        payload: {
          user: tx-sender,
          username: username,
          created-at: current-time
        }
      })
      
      (ok true)
    )
  )
)

;; Update user profile
(define-public (update-user-profile
  (bio (string-utf8 256))
  (avatar-url (string-utf8 128))
)
  (let (
    (profile-data (unwrap! (map-get? user-profiles {user: tx-sender}) ERR_NOT_FOUND))
    (current-time (default-to u0 (get-block-info? time (- block-height u1))))
  )
    (begin
      ;; Update profile
      (map-set user-profiles {user: tx-sender}
        (merge profile-data {
          bio: bio,
          avatar-url: avatar-url,
          last-active: current-time
        })
      )
      
      (print {
        notification: "profile-updated",
        payload: {
          user: tx-sender,
          updated-at: current-time
        }
      })
      
      (ok true)
    )
  )
)

;; ===== REPUTATION SYSTEM FUNCTIONS =====

;; Add reputation points
(define-public (add-reputation
  (user principal)
  (action-type uint)
  (reputation-change int)
  (reason (string-utf8 128))
)
  (let (
    (profile-data (unwrap! (map-get? user-profiles {user: user}) ERR_NOT_FOUND))
    (action-id (var-get next-action-id))
    (current-time (default-to u0 (get-block-info? time (- block-height u1))))
    (new-reputation (+ (get reputation-score profile-data) (if (> reputation-change 0) (to-uint reputation-change) u0)))
  )
    (begin
      ;; Validation (simplified - would check validator permissions)
      (asserts! (is-valid-reputation-action action-type) ERR_INVALID_PARAMETER)
      
      ;; Update reputation
      (map-set user-profiles {user: user}
        (merge profile-data {
          reputation-score: new-reputation,
          level: (calculate-user-level new-reputation),
          last-active: current-time
        })
      )
      
      ;; Record reputation history
      (map-set reputation-history {user: user, action-id: action-id} {
        action-type: action-type,
        reputation-change: reputation-change,
        reason: reason,
        timestamp: current-time,
        validator: (some tx-sender)
      })
      
      ;; Check for level-up achievements
      (try! (check-level-achievements user new-reputation))
      
      ;; Increment action ID
      (var-set next-action-id (+ action-id u1))
      
      (print {
        notification: "reputation-updated",
        payload: {
          user: user,
          action-type: action-type,
          reputation-change: reputation-change,
          new-reputation: new-reputation,
          new-level: (calculate-user-level new-reputation)
        }
      })
      
      (ok true)
    )
  )
)

;; Award achievement
(define-public (award-achievement
  (user principal)
  (achievement-name (string-ascii 32))
  (description (string-utf8 128))
  (rarity (string-ascii 16))
  (token-reward (optional uint))
)
  (let (
    (achievement-id (var-get next-achievement-id))
    (current-time (default-to u0 (get-block-info? time (- block-height u1))))
  )
    (begin
      ;; Validation
      (asserts! (> (len achievement-name) u0) ERR_INVALID_PARAMETER)
      (asserts! (is-valid-rarity rarity) ERR_INVALID_PARAMETER)
      
      ;; Award achievement
      (map-set user-achievements {user: user, achievement-id: achievement-id} {
        achievement-name: achievement-name,
        description: description,
        earned-at: current-time,
        rarity: rarity,
        token-reward: token-reward
      })
      
      ;; Add badge to profile
      (try! (add-badge-to-profile user achievement-name))
      
      ;; Award token reward if specified
      (match token-reward
        reward-amount (try! (award-token-reward user reward-amount))
        true
      )
      
      ;; Increment achievement ID
      (var-set next-achievement-id (+ achievement-id u1))
      
      (print {
        notification: "achievement-awarded",
        payload: {
          user: user,
          achievement: achievement-name,
          rarity: rarity,
          token-reward: token-reward
        }
      })
      
      (ok achievement-id)
    )
  )
)

;; ===== SOCIAL CONNECTION FUNCTIONS =====

;; Follow user
(define-public (follow-user (user-to-follow principal))
  (let (
    (connection-key {follower: tx-sender, following: user-to-follow})
    (reverse-connection-key {follower: user-to-follow, following: tx-sender})
    (current-time (default-to u0 (get-block-info? time (- block-height u1))))
    (reverse-connection-exists (is-some (map-get? social-connections reverse-connection-key)))
  )
    (begin
      ;; Validation
      (asserts! (not (is-eq tx-sender user-to-follow)) ERR_INVALID_PARAMETER)
      (asserts! (is-some (map-get? user-profiles {user: user-to-follow})) ERR_NOT_FOUND)
      (asserts! (is-none (map-get? social-connections connection-key)) ERR_ALREADY_EXISTS)
      
      ;; Create connection
      (map-set social-connections connection-key {
        connected-at: current-time,
        connection-strength: u1,
        mutual: reverse-connection-exists
      })
      
      ;; Update reverse connection if exists
      (if reverse-connection-exists
        (map-set social-connections reverse-connection-key
          (merge (unwrap-panic (map-get? social-connections reverse-connection-key))
            {mutual: true}
          )
        )
        true
      )
      
      ;; Award reputation for social activity
      (try! (add-reputation tx-sender ACTION_COMMUNITY_CONTRIBUTION 5 u"Followed another user"))
      
      (print {
        notification: "user-followed",
        payload: {
          follower: tx-sender,
          following: user-to-follow,
          mutual: reverse-connection-exists
        }
      })
      
      (ok true)
    )
  )
)

;; Unfollow user
(define-public (unfollow-user (user-to-unfollow principal))
  (let (
    (connection-key {follower: tx-sender, following: user-to-unfollow})
    (reverse-connection-key {follower: user-to-unfollow, following: tx-sender})
  )
    (begin
      ;; Validation
      (asserts! (is-some (map-get? social-connections connection-key)) ERR_NOT_FOUND)
      
      ;; Remove connection
      (map-delete social-connections connection-key)
      
      ;; Update reverse connection if exists
      (match (map-get? social-connections reverse-connection-key)
        reverse-conn (map-set social-connections reverse-connection-key
          (merge reverse-conn {mutual: false})
        )
        true
      )
      
      (print {
        notification: "user-unfollowed",
        payload: {
          follower: tx-sender,
          unfollowed: user-to-unfollow
        }
      })
      
      (ok true)
    )
  )
)

;; ===== COMMUNITY GROUP FUNCTIONS =====

;; Create community group
(define-public (create-community-group
  (name (string-utf8 64))
  (description (string-utf8 256))
  (min-reputation uint)
  (token-requirement (optional {token-id: uint, min-amount: uint}))
)
  (let ((group-id (var-get next-group-id)))
    (begin
      ;; Validation
      (asserts! (> (len name) u0) ERR_INVALID_PARAMETER)
      (asserts! (> (len description) u0) ERR_INVALID_PARAMETER)
      
      ;; Check creator has sufficient reputation
      (let ((creator-profile (unwrap! (map-get? user-profiles {user: tx-sender}) ERR_NOT_FOUND)))
        (asserts! (>= (get reputation-score creator-profile) u500) ERR_INSUFFICIENT_REPUTATION)
      )
      
      ;; Create group
      (map-set community-groups {group-id: group-id} {
        name: name,
        description: description,
        creator: tx-sender,
        member-count: u1,
        min-reputation: min-reputation,
        token-requirement: token-requirement,
        created-at: (default-to u0 (get-block-info? time (- block-height u1))),
        active: true
      })
      
      ;; Add creator as admin
      (map-set group-memberships {group-id: group-id, member: tx-sender} {
        joined-at: (default-to u0 (get-block-info? time (- block-height u1))),
        role: "admin",
        contribution-score: u0,
        last-activity: (default-to u0 (get-block-info? time (- block-height u1)))
      })
      
      ;; Award group creation achievement
      (try! (award-achievement tx-sender "group-creator" u"Created a community group" "rare" none))
      
      ;; Increment group ID
      (var-set next-group-id (+ group-id u1))
      
      (print {
        notification: "community-group-created",
        payload: {
          group-id: group-id,
          name: name,
          creator: tx-sender,
          min-reputation: min-reputation
        }
      })
      
      (ok group-id)
    )
  )
)

;; Join community group
(define-public (join-community-group (group-id uint))
  (let (
    (group-data (unwrap! (map-get? community-groups {group-id: group-id}) ERR_NOT_FOUND))
    (user-profile (unwrap! (map-get? user-profiles {user: tx-sender}) ERR_NOT_FOUND))
    (membership-key {group-id: group-id, member: tx-sender})
    (current-time (default-to u0 (get-block-info? time (- block-height u1))))
  )
    (begin
      ;; Validation
      (asserts! (get active group-data) ERR_INVALID_PARAMETER)
      (asserts! (is-none (map-get? group-memberships membership-key)) ERR_ALREADY_EXISTS)
      (asserts! (>= (get reputation-score user-profile) (get min-reputation group-data)) ERR_INSUFFICIENT_REPUTATION)
      
      ;; Check token requirement if specified
      (match (get token-requirement group-data)
        token-req (asserts! (>= (get-token-balance (get token-id token-req) tx-sender) (get min-amount token-req)) ERR_INSUFFICIENT_REPUTATION)
        true
      )
      
      ;; Add membership
      (map-set group-memberships membership-key {
        joined-at: current-time,
        role: "member",
        contribution-score: u0,
        last-activity: current-time
      })
      
      ;; Update group member count
      (map-set community-groups {group-id: group-id}
        (merge group-data {
          member-count: (+ (get member-count group-data) u1)
        })
      )
      
      ;; Award reputation for joining community
      (try! (add-reputation tx-sender ACTION_COMMUNITY_CONTRIBUTION 10 u"Joined community group"))
      
      (print {
        notification: "group-joined",
        payload: {
          group-id: group-id,
          member: tx-sender,
          new-member-count: (+ (get member-count group-data) u1)
        }
      })
      
      (ok true)
    )
  )
)

;; ===== SOCIAL CONTENT FUNCTIONS =====

;; Create social post
(define-public (create-social-post
  (content (string-utf8 512))
  (post-type (string-ascii 16))
  (token-mentions (list 10 uint))
  (hashtags (list 10 (string-ascii 32)))
)
  (let ((post-id (var-get next-post-id)))
    (begin
      ;; Validation
      (asserts! (> (len content) u0) ERR_INVALID_PARAMETER)
      (asserts! (<= (len token-mentions) u10) ERR_INVALID_PARAMETER)
      (asserts! (<= (len hashtags) u10) ERR_INVALID_PARAMETER)
      
      ;; Create post
      (map-set social-posts {post-id: post-id} {
        author: tx-sender,
        content: content,
        post-type: post-type,
        likes: u0,
        shares: u0,
        comments: u0,
        created-at: (default-to u0 (get-block-info? time (- block-height u1))),
        token-mentions: token-mentions,
        hashtags: hashtags
      })
      
      ;; Award reputation for content creation
      (try! (add-reputation tx-sender ACTION_COMMUNITY_CONTRIBUTION 3 u"Created social post"))
      
      ;; Increment post ID
      (var-set next-post-id (+ post-id u1))
      
      (print {
        notification: "social-post-created",
        payload: {
          post-id: post-id,
          author: tx-sender,
          post-type: post-type,
          token-mentions: token-mentions
        }
      })
      
      (ok post-id)
    )
  )
)

;; Like social post
(define-public (like-social-post (post-id uint))
  (let (
    (post-data (unwrap! (map-get? social-posts {post-id: post-id}) ERR_NOT_FOUND))
    (interaction-key {post-id: post-id, user: tx-sender})
    (existing-interaction (map-get? post-interactions interaction-key))
  )
    (begin
      ;; Check if already liked
      (match existing-interaction
        interaction-data (asserts! (not (get liked interaction-data)) ERR_ALREADY_EXISTS)
        true
      )
      
      ;; Update post likes
      (map-set social-posts {post-id: post-id}
        (merge post-data {
          likes: (+ (get likes post-data) u1)
        })
      )
      
      ;; Update interaction
      (map-set post-interactions interaction-key
        (match existing-interaction
          interaction-data (merge interaction-data {
            liked: true,
            interaction-time: (default-to u0 (get-block-info? time (- block-height u1)))
          })
          {
            liked: true,
            shared: false,
            commented: false,
            interaction-time: (default-to u0 (get-block-info? time (- block-height u1)))
          }
        )
      )
      
      ;; Award reputation to post author
      (try! (add-reputation (get author post-data) ACTION_COMMUNITY_CONTRIBUTION 1 u"Received post like"))
      
      (print {
        notification: "post-liked",
        payload: {
          post-id: post-id,
          liker: tx-sender,
          total-likes: (+ (get likes post-data) u1)
        }
      })
      
      (ok true)
    )
  )
)

;; ===== HELPER FUNCTIONS =====

;; Check if username is available
(define-private (is-username-available (username (string-utf8 32)))
  true ;; Simplified - would check actual username uniqueness
)

;; Validate reputation action
(define-private (is-valid-reputation-action (action-type uint))
  (or (is-eq action-type ACTION_TOKEN_CREATION)
      (or (is-eq action-type ACTION_SUCCESSFUL_TRADE)
          (or (is-eq action-type ACTION_COMMUNITY_CONTRIBUTION)
              (or (is-eq action-type ACTION_GOVERNANCE_PARTICIPATION)
                  (is-eq action-type ACTION_LIQUIDITY_PROVISION)))))
)

;; Calculate user level based on reputation
(define-private (calculate-user-level (reputation uint))
  (if (< reputation u500)
    u1
    (if (< reputation u1000)
      u2
      (if (< reputation u2500)
        u3
        (if (< reputation u5000)
          u4
          u5
        )
      )
    )
  )
)

;; Check for level-up achievements
(define-private (check-level-achievements (user principal) (reputation uint))
  (let ((level (calculate-user-level reputation)))
    (if (is-eq level u5)
      (award-achievement user "reputation-master" u"Reached maximum reputation level" "legendary" (some u1000))
      (if (is-eq level u3)
        (award-achievement user "community-leader" u"Reached level 3 reputation" "rare" (some u100))
        (ok u0)
      )
    )
  )
)

;; Validate rarity
(define-private (is-valid-rarity (rarity (string-ascii 16)))
  (or (is-eq rarity "common")
      (or (is-eq rarity "rare")
          (or (is-eq rarity "epic")
              (is-eq rarity "legendary"))))
)

;; Add badge to profile
(define-private (add-badge-to-profile (user principal) (badge (string-ascii 16)))
  (let ((profile-data (unwrap! (map-get? user-profiles {user: user}) ERR_NOT_FOUND)))
    (map-set user-profiles {user: user}
      (merge profile-data {
        badges: (unwrap-panic (as-max-len? (append (get badges profile-data) badge) u20))
      })
    )
  )
)

;; Award token reward
(define-private (award-token-reward (user principal) (amount uint))
  ;; Simplified - would mint/transfer actual tokens
  (ok true)
)

;; Placeholder for token balance check
(define-private (get-token-balance (token-id uint) (owner principal))
  u10000 ;; Simplified - would call main contract
)

;; ===== READ-ONLY FUNCTIONS =====

;; Get user profile
(define-read-only (get-user-profile (user principal))
  (ok (map-get? user-profiles {user: user}))
)

;; Get reputation history
(define-read-only (get-reputation-history (user principal) (action-id uint))
  (ok (map-get? reputation-history {user: user, action-id: action-id}))
)

;; Get social connection
(define-read-only (get-social-connection (follower principal) (following principal))
  (ok (map-get? social-connections {follower: follower, following: following}))
)

;; Get user achievement
(define-read-only (get-user-achievement (user principal) (achievement-id uint))
  (ok (map-get? user-achievements {user: user, achievement-id: achievement-id}))
)

;; Get community group
(define-read-only (get-community-group (group-id uint))
  (ok (map-get? community-groups {group-id: group-id}))
)

;; Get group membership
(define-read-only (get-group-membership (group-id uint) (member principal))
  (ok (map-get? group-memberships {group-id: group-id, member: member}))
)

;; Get social post
(define-read-only (get-social-post (post-id uint))
  (ok (map-get? social-posts {post-id: post-id}))
)

;; Get post interaction
(define-read-only (get-post-interaction (post-id uint) (user principal))
  (ok (map-get? post-interactions {post-id: post-id, user: user}))
)

;; Get social overview
(define-read-only (get-social-overview)
  (ok {
    total-profiles: u0, ;; Would count actual profiles
    total-groups: (- (var-get next-group-id) u1),
    total-posts: (- (var-get next-post-id) u1),
    total-achievements: (- (var-get next-achievement-id) u1),
    total-connections: u0 ;; Would count actual connections
  })
)