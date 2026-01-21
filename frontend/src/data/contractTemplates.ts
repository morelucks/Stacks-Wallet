/**
 * Contract Templates
 * Pre-defined Clarity contract templates for quick deployment
 */

export interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  source: string;
  category: "token" | "nft" | "utility" | "governance";
}

export const contractTemplates: ContractTemplate[] = [
  {
    id: "simple-token",
    name: "Simple Token",
    description: "Basic SIP-010 fungible token with mint and transfer",
    category: "token",
    source: `;; Simple Token Contract
(define-fungible-token my-token)

(define-constant CONTRACT_OWNER tx-sender)
(define-constant TOKEN_NAME "My Token")
(define-constant TOKEN_SYMBOL "MTK")
(define-constant TOKEN_DECIMALS u6)

(define-read-only (get-name)
  (ok TOKEN_NAME)
)

(define-read-only (get-symbol)
  (ok TOKEN_SYMBOL)
)

(define-read-only (get-decimals)
  (ok TOKEN_DECIMALS)
)

(define-read-only (get-balance (who principal))
  (ok (ft-get-balance my-token who))
)

(define-read-only (get-total-supply)
  (ok (ft-get-supply my-token))
)

(define-public (mint (amount uint) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT_OWNER) (err u100))
    (try! (ft-mint? my-token amount recipient))
    (ok true)
  )
)

(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
  (begin
    (asserts! (is-eq tx-sender sender) (err u101))
    (try! (ft-transfer? my-token amount sender recipient))
    (ok true)
  )
)`,
  },
  {
    id: "hello-world",
    name: "Hello World",
    description: "Simple greeting contract",
    category: "utility",
    source: `;; Hello World Contract
(define-public (hello-world)
  (ok "Hello, World!")
)

(define-public (greet (name (string-ascii 50)))
  (ok (concat "Hello, " name "!"))
)`,
  },
  {
    id: "counter",
    name: "Counter",
    description: "Simple counter contract with increment/decrement",
    category: "utility",
    source: `;; Counter Contract
(define-data-var counter uint u0)

(define-read-only (get-counter)
  (ok (var-get counter))
)

(define-public (increment)
  (begin
    (var-set counter (+ (var-get counter) u1))
    (ok (var-get counter))
  )
)

(define-public (decrement)
  (begin
    (var-set counter (- (var-get counter) u1))
    (ok (var-get counter))
  )
)`,
  },
];

/**
 * Get template by ID
 */
export function getTemplate(id: string): ContractTemplate | undefined {
  return contractTemplates.find((t) => t.id === id);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: ContractTemplate["category"]): ContractTemplate[] {
  return contractTemplates.filter((t) => t.category === category);
}

