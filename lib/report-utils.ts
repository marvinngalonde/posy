import { toast } from 'sonner'

export interface StandardReportData {
  title: string
  template: string
  data: any[]
  searchTerm?: string
  dateRange?: string
  additionalFilters?: Array<{ label: string; value: string }>
  summary?: Array<{ label: string; value: string | number; isCurrency?: boolean }>
  [key: string]: any
}

export async function generateStandardPDF(reportData: StandardReportData) {
  try {
    const response = await fetch('/api/reports/pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reportData)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.details || 'Failed to generate PDF')
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = url
    a.download = `${reportData.title.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)

    toast.success('PDF generated successfully')
  } catch (error) {
    console.error('PDF generation error:', error)
    toast.error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export function calculateFinancialTotals(data: any[]) {
  return data.reduce((acc, item) => ({
    subtotal: (acc.subtotal || 0) + Number(item.subtotal || 0),
    tax_amount: (acc.tax_amount || 0) + Number(item.tax_amount || 0),
    discount: (acc.discount || 0) + Number(item.discount || 0),
    total: (acc.total || 0) + Number(item.total || 0),
    paid: (acc.paid || 0) + Number(item.paid || 0),
    due: (acc.due || 0) + Number(item.due || 0)
  }), {
    subtotal: 0,
    tax_amount: 0,
    discount: 0,
    total: 0,
    paid: 0,
    due: 0
  })
}

export function groupByStatus(data: any[], statusField = 'status') {
  return Array.from(
    data.reduce((acc, item) => {
      const status = item[statusField] || 'unknown'
      if (!acc.has(status)) {
        acc.set(status, { [statusField]: status, count: 0, amount: 0 })
      }
      const existing = acc.get(status)!
      existing.count++
      existing.amount += Number(item.total || 0)
      return acc
    }, new Map())
  ).map(([_, data]) => data)
}

export function getTopEntities(data: any[], groupField: string, limitTo = 10) {
  return Array.from(
    data.reduce((acc, item) => {
      const entity = item[groupField] || 'Unknown'
      if (!acc.has(entity)) {
        acc.set(entity, { [groupField]: entity, count: 0, amount: 0 })
      }
      const existing = acc.get(entity)!
      existing.count++
      existing.amount += Number(item.total || item.total_amount || 0)
      return acc
    }, new Map())
  ).map(([_, data]) => data)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limitTo)
}