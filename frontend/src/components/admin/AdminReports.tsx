import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

interface AdminReportsProps {
    adminAddress: string
    className?: string
}

export function AdminReports({ adminAddress, className = '' }: AdminReportsProps) {
    const [reportType, setReportType] = useState<'monthly' | 'quarterly' | 'annual' | 'custom'>('monthly')
    const [dateRange, setDateRange] = useState({ start: '', end: '' })
    const [isGenerating, setIsGenerating] = useState(false)

    const generateReport = async () => {
        setIsGenerating(true)
        await new Promise(resolve => setTimeout(resolve, 2000))
        setIsGenerating(false)
    }

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle>Generate Reports</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    {(['monthly', 'quarterly', 'annual', 'custom'] as const).map(type => (
                        <Button
                            key={type}
                            variant={reportType === type ? 'primary' : 'outline'}
                            onClick={() => setReportType(type)}
                            className="capitalize"
                        >
                            {type} Report
                        </Button>
                    ))}
                </div>
                
                {reportType === 'custom' && (
                    <div className="grid grid-cols-2 gap-4">
                        <Input type="date" label="Start Date" value={dateRange.start} onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))} />
                        <Input type="date" label="End Date" value={dateRange.end} onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))} />
                    </div>
                )}

                <Button onClick={generateReport} disabled={isGenerating} className="w-full">
                    {isGenerating ? 'Generating...' : 'Generate Report'}
                </Button>
            </CardContent>
        </Card>
    )
}