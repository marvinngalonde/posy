/**
 * PDF Generation Utilities with Organization Branding
 * Provides standardized PDF generation functions that use organization details
 */

import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Organization } from '@/lib/types/prisma'
import { format } from 'date-fns'

// Extend jsPDF type for autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

/**
 * Brand colors for consistent styling
 */
export const PDF_COLORS = {
  primary: [59, 130, 246], // Blue
  lightBlue: [147, 197, 253], // Light blue for accents
  secondary: [255, 150, 0], // Orange
  dark: [31, 41, 55], // Dark gray
  light: [249, 250, 251], // Light gray
  text: [0, 0, 0], // Black
  white: [255, 255, 255], // White
  success: [34, 197, 94], // Green
  danger: [239, 68, 68], // Red
} as const

/**
 * Document configuration interface
 */
export interface PDFDocumentConfig {
  title: string
  documentNumber: string
  documentDate: Date
  clientInfo: {
    name: string
    email?: string
    phone?: string
    address?: string
    city?: string
    country?: string
  }
  items: Array<{
    description: string
    quantity: number
    unitPrice: number
    total: number
  }>
  totals: {
    subtotal: number
    tax?: number
    discount?: number
    total: number
  }
  notes?: string
  dueDate?: Date
  status?: string
}

/**
 * Initialize PDF document with organization branding
 */
export function createBrandedPDF(organization?: Organization): jsPDF {
  const doc = new jsPDF()

  // Set up brand colors
  const [primaryR, primaryG, primaryB] = PDF_COLORS.primary
  const [lightBlueR, lightBlueG, lightBlueB] = PDF_COLORS.lightBlue
  const [darkR, darkG, darkB] = PDF_COLORS.dark
  const [whiteR, whiteG, whiteB] = PDF_COLORS.white

  // Header background with gradient effect
  doc.setFillColor(darkR, darkG, darkB)
  doc.rect(0, 0, 210, 50, 'F')

  // Symmetrical decorative circles
  doc.setFillColor(lightBlueR, lightBlueG, lightBlueB)
  // Right circle - perfectly positioned
  doc.circle(185, 25, 20, 'F')
  // Left smaller accent circle
  doc.circle(25, 25, 8, 'F')

  // Primary color accent bar
  doc.setFillColor(primaryR, primaryG, primaryB)
  doc.rect(0, 45, 210, 5, 'F')

  // Organization logo placeholder/name with better typography
  if (organization?.logo) {
    // TODO: Load and add actual logo image
    // For now, just show organization name with better styling
    doc.setFont("helvetica", "bold")
    doc.setFontSize(18)
    doc.setTextColor(whiteR, whiteG, whiteB)
    doc.text(organization.name, 50, 20)
  } else {
    // Modern logo placeholder
    doc.setFillColor(whiteR, whiteG, whiteB)
    doc.circle(42, 18, 6, 'F')
    doc.setFillColor(primaryR, primaryG, primaryB)
    doc.circle(42, 18, 4, 'F')

    doc.setFont("helvetica", "bold")
    doc.setFontSize(16)
    doc.setTextColor(whiteR, whiteG, whiteB)
    doc.text(organization?.name || "Your Company", 52, 22)
  }

  // Organization contact info with better spacing
  doc.setFont("helvetica", "normal")
  if (organization?.website || organization?.email || organization?.phone) {
    doc.setFontSize(9)
    doc.setTextColor(200, 200, 200)

    const contactInfo = []
    if (organization?.email) contactInfo.push(organization.email)
    if (organization?.phone) contactInfo.push(organization.phone)
    if (organization?.website) contactInfo.push(organization.website)

    doc.text(contactInfo.join(' | '), 50, 30)
  }

  // Organization address
  if (organization?.address) {
    doc.setFontSize(8)
    doc.setTextColor(180, 180, 180)
    const addressLine = [organization.address, organization.city, organization.country]
      .filter(Boolean).join(', ')
    doc.text(addressLine, 50, 38)
  }

  return doc
}

/**
 * Add organization contact information to PDF footer
 */
export function addOrganizationFooter(doc: jsPDF, organization?: Organization): void {
  const pageHeight = doc.internal.pageSize.height
  const footerY = pageHeight - 20

  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)

  if (organization) {
    const footerText = [
      organization.name,
      organization.email && `Email: ${organization.email}`,
      organization.phone && `Phone: ${organization.phone}`,
      organization.website && `Web: ${organization.website}`
    ].filter(Boolean).join(' | ')

    // Center the footer text
    const textWidth = doc.getStringUnitWidth(footerText) * 8 / doc.internal.scaleFactor
    const x = (doc.internal.pageSize.width - textWidth) / 2

    doc.text(footerText, x, footerY)

    // Add address if available
    if (organization.address) {
      const addressText = [
        organization.address,
        organization.city,
        organization.country
      ].filter(Boolean).join(', ')

      const addressWidth = doc.getStringUnitWidth(addressText) * 8 / doc.internal.scaleFactor
      const addressX = (doc.internal.pageSize.width - addressWidth) / 2

      doc.text(addressText, addressX, footerY + 5)
    }
  }
}

/**
 * Generate a complete document PDF (Invoice, Quotation, etc.)
 */
export function generateDocumentPDF(
  config: PDFDocumentConfig,
  organization?: Organization
): jsPDF {
  const doc = createBrandedPDF(organization)

  const [primaryR, primaryG, primaryB] = PDF_COLORS.primary
  const [textR, textG, textB] = PDF_COLORS.text
  const [whiteR, whiteG, whiteB] = PDF_COLORS.white

  // Document title (e.g., "INVOICE", "QUOTATION") - moved to right side with better positioning
  doc.setFont("helvetica", "bold")
  doc.setFontSize(22)
  doc.setTextColor(whiteR, whiteG, whiteB)
  doc.text(config.title.toUpperCase(), 210 - 15, 30, { align: 'right' })

  let yPos = 70

  // Document information section with improved spacing
  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.setTextColor(primaryR, primaryG, primaryB)

  // Left column - Client information
  doc.text(`${config.title.toUpperCase()} TO`, 15, yPos)
  yPos += 8
  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.setTextColor(textR, textG, textB)
  doc.text(config.clientInfo.name, 15, yPos)
  yPos += 6

  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  if (config.clientInfo.email) {
    doc.text(config.clientInfo.email, 15, yPos)
    yPos += 5
  }

  if (config.clientInfo.phone) {
    doc.text(config.clientInfo.phone, 15, yPos)
    yPos += 5
  }

  if (config.clientInfo.address) {
    doc.text(config.clientInfo.address, 15, yPos)
    yPos += 5
  }

  if (config.clientInfo.city) {
    const location = [config.clientInfo.city, config.clientInfo.country]
      .filter(Boolean).join(', ')
    doc.text(location, 15, yPos)
    yPos += 5
  }

  // Right column - Document details
  const rightColumnX = 130
  let rightYPos = 70

  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.setTextColor(primaryR, primaryG, primaryB)
  doc.text("DOCUMENT DETAILS", rightColumnX, rightYPos)
  rightYPos += 10

  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.setTextColor(textR, textG, textB)

  // Document number
  doc.setFont("helvetica", "bold")
  doc.text(`${config.title} #:`, rightColumnX, rightYPos)
  doc.setFont("helvetica", "normal")
  doc.text(config.documentNumber, rightColumnX + 30, rightYPos)
  rightYPos += 6

  // Document date
  doc.setFont("helvetica", "bold")
  doc.text("Date:", rightColumnX, rightYPos)
  doc.setFont("helvetica", "normal")
  doc.text(format(config.documentDate, 'MMM dd, yyyy'), rightColumnX + 30, rightYPos)
  rightYPos += 6

  // Due date (if applicable)
  if (config.dueDate) {
    doc.setFont("helvetica", "bold")
    doc.text("Due Date:", rightColumnX, rightYPos)
    doc.setFont("helvetica", "normal")
    doc.text(format(config.dueDate, 'MMM dd, yyyy'), rightColumnX + 30, rightYPos)
    rightYPos += 6
  }

  // Status (if applicable)
  if (config.status) {
    doc.setFont("helvetica", "bold")
    doc.text("Status:", rightColumnX, rightYPos)
    doc.setFont("helvetica", "normal")

    // Add status with colored background
    const statusWidth = doc.getStringUnitWidth(config.status) * 10 / doc.internal.scaleFactor + 4
    if (config.status.toLowerCase() === 'sent' || config.status.toLowerCase() === 'pending') {
      doc.setFillColor(primaryR, primaryG, primaryB)
    } else {
      doc.setFillColor(100, 100, 100)
    }
    doc.roundedRect(rightColumnX + 30 - 2, rightYPos - 4, statusWidth, 6, 2, 2, 'F')
    doc.setTextColor(whiteR, whiteG, whiteB)
    doc.text(config.status.toUpperCase(), rightColumnX + 30, rightYPos)
    doc.setTextColor(textR, textG, textB)
    rightYPos += 6
  }

  // Items table
  const tableStartY = Math.max(yPos, rightYPos) + 10

  const currencySymbol = organization?.currency_symbol || '$'
  const tableData = config.items.map(item => [
    item.description,
    item.quantity.toString(),
    `${currencySymbol}${item.unitPrice.toFixed(2)}`,
    `${currencySymbol}${item.total.toFixed(2)}`
  ])

  autoTable(doc, {
    startY: tableStartY,
    head: [['Description', 'Qty', 'Unit Price', 'Total']],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 10,
      cellPadding: 4,
      lineColor: [200, 200, 200],
      lineWidth: 0.5,
    },
    headStyles: {
      fillColor: [primaryR, primaryG, primaryB],
      textColor: [whiteR, whiteG, whiteB],
      fontStyle: 'bold',
      fontSize: 11,
      cellPadding: 6,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 85 },
      1: { halign: 'center', cellWidth: 25 },
      2: { halign: 'right', cellWidth: 35 },
      3: { halign: 'right', cellWidth: 35, fontStyle: 'bold' },
    },
    margin: { left: 15, right: 15 },
  })

  // Totals section with improved styling
  const finalY = (doc as any).lastAutoTable.finalY + 15
  const totalsX = 135
  const totalsRightX = totalsX + 55
  let totalsY = finalY

  // Background for totals section
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(totalsX - 5, totalsY - 8, 65, 35, 3, 3, 'F')

  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.setTextColor(textR, textG, textB)

  // Subtotal
  doc.text("Subtotal:", totalsX, totalsY)
  doc.text(`${currencySymbol}${config.totals.subtotal.toFixed(2)}`, totalsRightX, totalsY, { align: 'right' })
  totalsY += 6

  // Tax (if applicable)
  if (config.totals.tax && config.totals.tax > 0) {
    doc.text("Tax:", totalsX, totalsY)
    doc.text(`${currencySymbol}${config.totals.tax.toFixed(2)}`, totalsRightX, totalsY, { align: 'right' })
    totalsY += 6
  }

  // Discount (if applicable)
  if (config.totals.discount && config.totals.discount > 0) {
    doc.setTextColor(239, 68, 68)
    doc.text("Discount:", totalsX, totalsY)
    doc.text(`-${currencySymbol}${config.totals.discount.toFixed(2)}`, totalsRightX, totalsY, { align: 'right' })
    totalsY += 6
    doc.setTextColor(textR, textG, textB)
  }

  // Separator line
  doc.setDrawColor(primaryR, primaryG, primaryB)
  doc.setLineWidth(1)
  doc.line(totalsX, totalsY + 1, totalsRightX - 5, totalsY + 1)
  totalsY += 8

  // Total
  doc.setFontSize(13)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(primaryR, primaryG, primaryB)
  doc.text("TOTAL:", totalsX, totalsY)
  doc.text(`${currencySymbol}${config.totals.total.toFixed(2)}`, totalsRightX, totalsY, { align: 'right' })

  doc.setFont("helvetica", "normal")
  doc.setTextColor(textR, textG, textB)

  // Notes section (if applicable)
  if (config.notes) {
    totalsY += 20
    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.setTextColor(primaryR, primaryG, primaryB)
    doc.text("NOTES:", 15, totalsY)
    totalsY += 8

    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.setTextColor(textR, textG, textB)

    // Split notes into multiple lines if too long
    const splitNotes = doc.splitTextToSize(config.notes, 180)
    doc.text(splitNotes, 15, totalsY)
    totalsY += splitNotes.length * 5
  }

  // Banking details (if available)
  // if (organization?.bank_name || organization?.bank_account) {
  //   totalsY += 15
  //   doc.setFont("helvetica", "bold")
  //   doc.setFontSize(11)
  //   doc.setTextColor(primaryR, primaryG, primaryB)
  //   doc.text("BANKING DETAILS:", 15, totalsY)
  //   totalsY += 8

  //   doc.setFont("helvetica", "normal")
  //   doc.setFontSize(10)
  //   doc.setTextColor(textR, textG, textB)

  //   if (organization.bank_name) {
  //     doc.setFont("helvetica", "bold")
  //     doc.text("Bank:", 15, totalsY)
  //     doc.setFont("helvetica", "normal")
  //     doc.text(organization.bank_name, 35, totalsY)
  //     totalsY += 5
  //   }
  //   if (organization.bank_account) {
  //     doc.setFont("helvetica", "bold")
  //     doc.text("Account:", 15, totalsY)
  //     doc.setFont("helvetica", "normal")
  //     doc.text(organization.bank_account, 35, totalsY)
  //     totalsY += 5
  //   }
  //   if (organization.bank_branch) {
  //     doc.setFont("helvetica", "bold")
  //     doc.text("Branch/Routing:", 15, totalsY)
  //     doc.setFont("helvetica", "normal")
  //     doc.text(organization.bank_branch, 55, totalsY)
  //     totalsY += 5
  //   }
  //   if (organization.swift_code) {
  //     doc.setFont("helvetica", "bold")
  //     doc.text("SWIFT:", 15, totalsY)
  //     doc.setFont("helvetica", "normal")
  //     doc.text(organization.swift_code, 35, totalsY)
  //     totalsY += 5
  //   }
  //   if (organization.iban) {
  //     doc.setFont("helvetica", "bold")
  //     doc.text("IBAN:", 15, totalsY)
  //     doc.setFont("helvetica", "normal")
  //     doc.text(organization.iban, 35, totalsY)
  //     totalsY += 5
  //   }
  // }

  // Terms & Conditions (if available)
  if (organization?.terms_conditions) {
    totalsY += 15
    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.setTextColor(primaryR, primaryG, primaryB)
    doc.text("TERMS & CONDITIONS:", 15, totalsY)
    totalsY += 8

    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)

    const splitTerms = doc.splitTextToSize(organization.terms_conditions, 180)
    doc.text(splitTerms, 15, totalsY)
  }

  // Add organization footer
  addOrganizationFooter(doc, organization)

  return doc
}

/**
 * Generate and download a PDF
 */
export function downloadPDF(doc: jsPDF, filename: string): void {
  doc.save(filename)
}

/**
 * Generate and open PDF in new tab
 */
export function openPDFInNewTab(doc: jsPDF): void {
  const pdfBlob = doc.output('blob')
  const pdfUrl = URL.createObjectURL(pdfBlob)
  window.open(pdfUrl, '_blank')
}