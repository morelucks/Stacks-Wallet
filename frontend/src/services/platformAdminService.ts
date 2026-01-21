import { WalletService, MemberInfo } from './walletService'

export interface PlatformWallet {
  adminAddress: string
  walletName: string
  walletId: number
  creationDate: string
  memberCount: number
  currentBalance: number
  activityLevel: 'low' | 'medium' | 'high'
  suspiciousActivity: boolean
  lastActivity: string
}

export interface GlobalMember {
  memberAddress: string
  memberName: string
  walletAssociations: WalletAssociation[]
  accountStatus: 'active' | 'frozen' | 'inactive'
  totalSpendLimit: number
  joinDate: string
}

export interface WalletAssociation {
  adminAddress: string
  walletName: string
  role: string
  spendLimit: number
  active: boolean
  frozen: boolean
}

export interface PlatformAnalytics {
  totalWallets: number
  totalMembers: number
  totalValueLocked: number
  transactionVolume: number
  growthMetrics: GrowthMetrics
  activityPatterns: ActivityPattern[]
}

export interface GrowthMetrics {
  walletsGrowth: number
  membersGrowth: number
  volumeGrowth: number
}

export interface ActivityPattern {
  date: string
  walletCreations: number
  memberAdditions: number
  transactionCount: number
}

export interface BulkOperationResult {
  itemId: string
  success: boolean
  error?: string
}

export class PlatformAdminService {
  static async getAllWallets(): Promise<PlatformWallet[]> {
    // Mock data for now - in real implementation, this would query all wallets from contract
    return [
      {
        adminAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        walletName: 'Tech Startup Multi-Sig',
        walletId: 1,
        creationDate: '2024-01-15T10:30:00Z',
        memberCount: 8,
        currentBalance: 250000000,
        activityLevel: 'high',
        suspiciousActivity: false,
        lastActivity: '2024-12-29T14:22:00Z'
      },
      {
        adminAddress: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
        walletName: 'Investment DAO Wallet',
        walletId: 2,
        creationDate: '2024-02-03T09:15:00Z',
        memberCount: 15,
        currentBalance: 500000000,
        activityLevel: 'medium',
        suspiciousActivity: false,
        lastActivity: '2024-12-28T11:45:00Z'
      },
      {
        adminAddress: 'ST3PF13W7Z0RRM42A8VZRVFQ75SV1K26RXEP8YGKJ',
        walletName: 'Suspicious Wallet',
        walletId: 3,
        creationDate: '2024-12-20T16:00:00Z',
        memberCount: 2,
        currentBalance: 1000000000,
        activityLevel: 'low',
        suspiciousActivity: true,
        lastActivity: '2024-12-20T16:30:00Z'
      }
    ]
  }

  static async getAllMembers(): Promise<GlobalMember[]> {
    // Mock data for now - in real implementation, this would aggregate all members from all wallets
    return [
      {
        memberAddress: 'ST2REHHS5J3CERCRBEPMGH7921Q6PYKAADT7JP2VB',
        memberName: 'Alice Johnson',
        walletAssociations: [
          {
            adminAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
            walletName: 'Tech Startup Multi-Sig',
            role: 'member',
            spendLimit: 50000000,
            active: true,
            frozen: false
          }
        ],
        accountStatus: 'active',
        totalSpendLimit: 50000000,
        joinDate: '2024-01-20T12:00:00Z'
      },
      {
        memberAddress: 'ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5',
        memberName: 'Bob Smith',
        walletAssociations: [
          {
            adminAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
            walletName: 'Tech Startup Multi-Sig',
            role: 'member',
            spendLimit: 25000000,
            active: true,
            frozen: true
          },
          {
            adminAddress: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
            walletName: 'Investment DAO Wallet',
            role: 'member',
            spendLimit: 75000000,
            active: true,
            frozen: false
          }
        ],
        accountStatus: 'frozen',
        totalSpendLimit: 100000000,
        joinDate: '2024-01-25T14:30:00Z'
      }
    ]
  }

  static async getPlatformAnalytics(): Promise<PlatformAnalytics> {
    const wallets = await this.getAllWallets()
    const members = await this.getAllMembers()
    
    return {
      totalWallets: wallets.length,
      totalMembers: members.length,
      totalValueLocked: wallets.reduce((sum, wallet) => sum + wallet.currentBalance, 0),
      transactionVolume: 1250000000, // Mock data
      growthMetrics: {
        walletsGrowth: 15.2,
        membersGrowth: 23.8,
        volumeGrowth: 45.6
      },
      activityPatterns: [
        { date: '2024-12-25', walletCreations: 2, memberAdditions: 5, transactionCount: 12 },
        { date: '2024-12-26', walletCreations: 1, memberAdditions: 3, transactionCount: 8 },
        { date: '2024-12-27', walletCreations: 3, memberAdditions: 7, transactionCount: 15 },
        { date: '2024-12-28', walletCreations: 0, memberAdditions: 2, transactionCount: 6 },
        { date: '2024-12-29', walletCreations: 1, memberAdditions: 4, transactionCount: 11 }
      ]
    }
  }

  static formatSTX(microSTX: number): string {
    return (microSTX / 1000000).toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 6 
    })
  }

  static calculateActivityLevel(memberCount: number, lastActivity: string): 'low' | 'medium' | 'high' {
    const daysSinceActivity = Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysSinceActivity > 7) return 'low'
    if (memberCount > 10 && daysSinceActivity <= 1) return 'high'
    return 'medium'
  }
}