export { WalletFormValidation, walletNameRules, fundingAmountRules, useWalletFormValidation } from './WalletFormValidation'
export { WalletCreationProgress } from './WalletCreationProgress'
export { WalletPreview } from './WalletPreview'
export { WalletCard, EmptyWalletState } from './WalletCard'
export { AddMemberComponent } from './AddMemberComponent'
export { AddMemberForm } from './AddMemberForm'
export { WalletInfoDisplay } from './WalletInfoDisplay'
export { MemberListComponent } from './MemberListComponent'

export type { ValidationRule, ValidationResult } from './WalletFormValidation'
export type { CreationStep } from './WalletCreationProgress'

// Re-export service types for convenience
export type { 
    AddMemberParams, 
    MemberInfo, 
    WalletCreationResult 
} from '../../services/walletService'