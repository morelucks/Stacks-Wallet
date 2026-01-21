import { useState, useEffect } from 'react'

interface ResponsiveLayoutProps {
  children: React.ReactNode
  className?: string
}

export function ResponsiveLayout({ children, className = '' }: ResponsiveLayoutProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768)
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024)
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)

    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  return (
    <div className={`
      ${isMobile ? 'px-2 py-4' : isTablet ? 'px-4 py-6' : 'px-6 py-8'}
      ${className}
    `}>
      {children}
    </div>
  )
}

interface ResponsiveGridProps {
  children: React.ReactNode
  cols?: {
    mobile?: number
    tablet?: number
    desktop?: number
  }
  gap?: number
  className?: string
}

export function ResponsiveGrid({ 
  children, 
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 4,
  className = '' 
}: ResponsiveGridProps) {
  return (
    <div className={`
      grid 
      grid-cols-${cols.mobile || 1}
      md:grid-cols-${cols.tablet || 2}
      lg:grid-cols-${cols.desktop || 3}
      gap-${gap}
      ${className}
    `}>
      {children}
    </div>
  )
}

interface ResponsiveCardProps {
  children: React.ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg'
}

export function ResponsiveCard({ 
  children, 
  className = '',
  padding = 'md'
}: ResponsiveCardProps) {
  const paddingClasses = {
    sm: 'p-3 md:p-4',
    md: 'p-4 md:p-6',
    lg: 'p-6 md:p-8'
  }

  return (
    <div className={`
      bg-white rounded-lg shadow-sm border
      ${paddingClasses[padding]}
      ${className}
    `}>
      {children}
    </div>
  )
}

interface ResponsiveTableProps {
  headers: string[]
  children: React.ReactNode
  className?: string
}

export function ResponsiveTable({ headers, children, className = '' }: ResponsiveTableProps) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50">
            {headers.map((header, index) => (
              <th key={index} className="text-left py-3 px-4 font-medium text-gray-700">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {children}
        </tbody>
      </table>
    </div>
  )
}

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

export function MobileMenu({ isOpen, onClose, children }: MobileMenuProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  )
}

interface ResponsiveModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

export function ResponsiveModal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'lg' 
}: ResponsiveModalProps) {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl'
  }

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className={`
        relative bg-white rounded-lg shadow-xl w-full
        ${sizeClasses[size]}
        max-h-[90vh] overflow-hidden
      `}>
        <div className="flex items-center justify-between p-4 md:p-6 border-b">
          <h2 className="text-lg md:text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {children}
        </div>
      </div>
    </div>
  )
}