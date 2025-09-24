/**
 * PDF Generation Service using Handlebars and Puppeteer
 * Replaces the previous jsPDF implementation with a more flexible template-based approach
 */

import * as fs from 'fs'
import * as path from 'path'
import Handlebars from 'handlebars'
import puppeteer from 'puppeteer'
import { format } from 'date-fns'
import { Organization } from '@/lib/types/prisma'

// Handlebars helper functions
Handlebars.registerHelper('formatCurrency', function(amount: number, symbol: string = '$') {
  if (typeof amount !== 'number') return `${symbol}0.00`
  return `${symbol}${amount.toFixed(2)}`
})

Handlebars.registerHelper('formatDate', function(date: Date | string) {
  if (!date) return ''
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return format(dateObj, 'MMM dd, yyyy')
})

Handlebars.registerHelper('formatDateTime', function(date: Date | string) {
  if (!date) return ''
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return format(dateObj, 'MMM dd, yyyy hh:mm a')
})

Handlebars.registerHelper('toLowerCase', function(str: string) {
  return str ? str.toLowerCase() : ''
})

Handlebars.registerHelper('statusBadge', function(status: string) {
  const statusColors: Record<string, string> = {
    'completed': 'background: #10b981; color: white;',
    'pending': 'background: #f59e0b; color: white;',
    'cancelled': 'background: #ef4444; color: white;',
    'received': 'background: #10b981; color: white;',
    'paid': 'background: #10b981; color: white;',
    'unpaid': 'background: #ef4444; color: white;',
    'partial': 'background: #f59e0b; color: white;'
  }

  const style = statusColors[status?.toLowerCase()] || 'background: #6b7280; color: white;'
  return new Handlebars.SafeString(
    `<span style="padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; ${style}">${status}</span>`
  )
})

Handlebars.registerHelper('add', function(a: number, b: number) {
  return Number(a || 0) + Number(b || 0)
})

Handlebars.registerHelper('multiply', function(a: number, b: number) {
  return Number(a || 0) * Number(b || 0)
})

Handlebars.registerHelper('eq', function(a: any, b: any) {
  return a === b
})

Handlebars.registerHelper('gt', function(a: number, b: number) {
  return Number(a || 0) > Number(b || 0)
})

Handlebars.registerHelper('ifEmpty', function(value: any, options: any) {
  if (!value || (Array.isArray(value) && value.length === 0)) {
    return options.fn(this)
  }
  return options.inverse(this)
})

/**
 * Template types supported by the PDF generator
 */
export type PDFTemplateType = 'invoice' | 'quotation' | 'receipt' | 'sales-report'

/**
 * Base interface for all PDF document data
 */
export interface BasePDFData {
  organization: Organization
  customer?: {
    name: string
    email?: string
    phone?: string
    address?: string
    city?: string
    country?: string
  }
  items: Array<{
    product: {
      name: string
      description?: string
      sku?: string
    }
    quantity: number
    price: number
    total: number
  }>
  subtotal: number
  taxAmount?: number
  taxPercentage?: number
  discountAmount?: number
  totalAmount: number
  notes?: string
  currentDate?: Date
}

/**
 * Invoice-specific data interface
 */
export interface InvoicePDFData extends BasePDFData {
  invoiceNumber: string
  invoiceDate: Date
  dueDate?: Date
  status?: string
  paymentMethod?: string
  shippingCost?: number
  amountPaid?: number
  balanceDue?: number
}

/**
 * Quotation-specific data interface
 */
export interface QuotationPDFData extends BasePDFData {
  quotationNumber: string
  quotationDate: Date
  validUntil?: Date
  status?: string
}

/**
 * Receipt-specific data interface
 */
export interface ReceiptPDFData extends BasePDFData {
  receiptNumber: string
  saleDate: Date
  cashier?: {
    name: string
  }
  paymentMethod?: string
  amountPaid?: number
  changeAmount?: number
  qrCode?: string
}

/**
 * PDF generation options
 */
export interface PDFGenerationOptions {
  format?: 'A4' | 'A5' | 'Letter'
  margin?: {
    top?: string
    right?: string
    bottom?: string
    left?: string
  }
  printBackground?: boolean
  landscape?: boolean
  preferCSSPageSize?: boolean
}

/**
 * Main PDF Generator class
 */
export class PDFGenerator {
  private templatesPath: string
  private stylesCache: Map<string, string> = new Map()

  constructor() {
    this.templatesPath = path.join(process.cwd(), 'lib', 'templates', 'pdf')
  }

  /**
   * Load and cache CSS styles
   */
  private async loadStyles(): Promise<string> {
    const cacheKey = 'base-styles'

    if (this.stylesCache.has(cacheKey)) {
      return this.stylesCache.get(cacheKey)!
    }

    try {
      const stylesPath = path.join(this.templatesPath, 'base-styles.css')
      const styles = await fs.promises.readFile(stylesPath, 'utf-8')
      this.stylesCache.set(cacheKey, styles)
      return styles
    } catch (error) {
      console.error('Error loading CSS styles:', error)
      return ''
    }
  }

  /**
   * Load and compile Handlebars template
   */
  private async loadTemplate(templateType: PDFTemplateType): Promise<HandlebarsTemplateDelegate> {
    try {
      const templatePath = path.join(this.templatesPath, `${templateType}.hbs`)
      const templateContent = await fs.promises.readFile(templatePath, 'utf-8')
      return Handlebars.compile(templateContent)
    } catch (error) {
      throw new Error(`Failed to load template ${templateType}: ${error}`)
    }
  }

  /**
   * Generate HTML from template and data
   */
  private async generateHTML(
    templateType: PDFTemplateType,
    data: BasePDFData
  ): Promise<string> {
    try {
      const template = await this.loadTemplate(templateType)
      const styles = await this.loadStyles()

      // Add current date if not provided
      const templateData = {
        ...data,
        currentDate: data.currentDate || new Date(),
        styles
      }

      return template(templateData)
    } catch (error) {
      throw new Error(`Failed to generate HTML: ${error}`)
    }
  }

  /**
   * Generate PDF buffer from HTML using Puppeteer
   */
  private async generatePDFFromHTML(
    html: string,
    options: PDFGenerationOptions = {}
  ): Promise<Buffer> {
    let browser

    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      })

      const page = await browser.newPage()

      // Set content and wait for it to load
      await page.setContent(html, {
        waitUntil: 'networkidle0',
        timeout: 30000
      })

      // Generate PDF with options
      const pdfOptions = {
        format: options.format || 'A4' as const,
        printBackground: options.printBackground !== false,
        margin: options.margin || {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm'
        },
        preferCSSPageSize: options.preferCSSPageSize || true,
        landscape: options.landscape || false
      }

      const pdfBuffer = await page.pdf(pdfOptions)

      return pdfBuffer

    } catch (error) {
      throw new Error(`Failed to generate PDF: ${error}`)
    } finally {
      if (browser) {
        await browser.close()
      }
    }
  }

  /**
   * Generate invoice PDF
   */
  async generateInvoicePDF(
    data: InvoicePDFData,
    options?: PDFGenerationOptions
  ): Promise<Buffer> {
    try {
      const html = await this.generateHTML('invoice', data)
      return await this.generatePDFFromHTML(html, options)
    } catch (error) {
      throw new Error(`Failed to generate invoice PDF: ${error}`)
    }
  }

  /**
   * Generate quotation PDF
   */
  async generateQuotationPDF(
    data: QuotationPDFData,
    options?: PDFGenerationOptions
  ): Promise<Buffer> {
    try {
      const html = await this.generateHTML('quotation', data)
      return await this.generatePDFFromHTML(html, options)
    } catch (error) {
      throw new Error(`Failed to generate quotation PDF: ${error}`)
    }
  }

  /**
   * Generate receipt PDF
   */
  async generateReceiptPDF(
    data: ReceiptPDFData,
    options?: PDFGenerationOptions
  ): Promise<Buffer> {
    try {
      // Receipts typically use a smaller format
      const receiptOptions = {
        ...options,
        format: 'A5' as const,
        margin: {
          top: '5mm',
          right: '5mm',
          bottom: '5mm',
          left: '5mm'
        }
      }

      const html = await this.generateHTML('receipt', data)
      return await this.generatePDFFromHTML(html, receiptOptions)
    } catch (error) {
      throw new Error(`Failed to generate receipt PDF: ${error}`)
    }
  }

  /**
   * Generate PDF for any template type (convenience method)
   */
  async generatePDF(
    templateType: PDFTemplateType,
    data: BasePDFData,
    options?: PDFGenerationOptions
  ): Promise<Buffer> {
    switch (templateType) {
      case 'invoice':
        return this.generateInvoicePDF(data as InvoicePDFData, options)
      case 'quotation':
        return this.generateQuotationPDF(data as QuotationPDFData, options)
      case 'receipt':
        return this.generateReceiptPDF(data as ReceiptPDFData, options)
      case 'sales-report':
        // For sales report, we can use the general HTML generation
        const html = await this.generateHTML(templateType, data)
        return await this.generatePDFFromHTML(html, options)
      default:
        throw new Error(`Unsupported template type: ${templateType}`)
    }
  }

  /**
   * Generate and save PDF to file
   */
  async generateAndSavePDF(
    templateType: PDFTemplateType,
    data: BasePDFData,
    outputPath: string,
    options?: PDFGenerationOptions
  ): Promise<void> {
    try {
      const pdfBuffer = await this.generatePDF(templateType, data, options)
      await fs.promises.writeFile(outputPath, pdfBuffer)
    } catch (error) {
      throw new Error(`Failed to save PDF: ${error}`)
    }
  }

  /**
   * Clear template and style caches
   */
  clearCache(): void {
    this.stylesCache.clear()
  }
}

/**
 * Default PDF generator instance
 */
export const pdfGenerator = new PDFGenerator()

/**
 * Convenience functions for direct use
 */
export async function generateInvoicePDF(
  data: InvoicePDFData,
  options?: PDFGenerationOptions
): Promise<Buffer> {
  return pdfGenerator.generateInvoicePDF(data, options)
}

export async function generateQuotationPDF(
  data: QuotationPDFData,
  options?: PDFGenerationOptions
): Promise<Buffer> {
  return pdfGenerator.generateQuotationPDF(data, options)
}

export async function generateReceiptPDF(
  data: ReceiptPDFData,
  options?: PDFGenerationOptions
): Promise<Buffer> {
  return pdfGenerator.generateReceiptPDF(data, options)
}

/**
 * Legacy compatibility - returns base64 data URL for download
 */
export function createDownloadableURL(pdfBuffer: Buffer): string {
  const base64 = pdfBuffer.toString('base64')
  return `data:application/pdf;base64,${base64}`
}