import puppeteer from 'puppeteer'
import Handlebars from 'handlebars'
import fs from 'fs'
import path from 'path'

export interface PDFGenerationOptions {
  template: string
  data: any
  filename: string
  format?: 'A4' | 'Letter' | 'Legal'
  orientation?: 'portrait' | 'landscape'
  margins?: {
    top?: string
    right?: string
    bottom?: string
    left?: string
  }
}

export class PDFGenerator {
  private static instance: PDFGenerator
  private templateCache: Map<string, HandlebarsTemplateDelegate> = new Map()

  private constructor() {}

  public static getInstance(): PDFGenerator {
    if (!PDFGenerator.instance) {
      PDFGenerator.instance = new PDFGenerator()
    }
    return PDFGenerator.instance
  }

  private async loadTemplate(templateName: string): Promise<HandlebarsTemplateDelegate> {
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName)!
    }

    const templatePath = path.join(process.cwd(), 'templates', 'pdf', `${templateName}.hbs`)

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found: ${templatePath}`)
    }

    const templateSource = fs.readFileSync(templatePath, 'utf8')
    const template = Handlebars.compile(templateSource)

    this.templateCache.set(templateName, template)
    return template
  }

  public async generatePDF(options: PDFGenerationOptions): Promise<Buffer> {
    const {
      template,
      data,
      filename,
      format = 'A4',
      orientation = 'portrait',
      margins = {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    } = options

    try {
      // Load and compile main template and base template
      const mainTemplateFunction = await this.loadTemplate(template)
      const baseTemplateFunction = await this.loadTemplate('base')

      // Generate content from main template
      const content = mainTemplateFunction(data)

      // Combine with base template
      const fullData = { ...data, content }
      const html = baseTemplateFunction(fullData)

      // Launch Puppeteer
      const browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ],
        timeout: 60000
      })

      const page = await browser.newPage()

      // Set content
      await page.setContent(html, {
        waitUntil: 'networkidle0'
      })

      // Generate PDF
      const pdf = await page.pdf({
        format,
        landscape: orientation === 'landscape',
        margin: margins,
        printBackground: true,
        preferCSSPageSize: true
      })

      await browser.close()
      return pdf

    } catch (error) {
      console.error('PDF Generation Error:', error)
      throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  public registerHelpers() {
    // Register Handlebars helpers
    Handlebars.registerHelper('formatCurrency', function(amount: number) {
      return new Handlebars.SafeString(`$${Number(amount || 0).toFixed(2)}`)
    })

    Handlebars.registerHelper('formatDate', function(date: string | Date) {
      if (!date) return 'N/A'
      const d = new Date(date)
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    })

    Handlebars.registerHelper('formatDateTime', function(date: string | Date) {
      if (!date) return 'N/A'
      const d = new Date(date)
      return d.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
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
  }
}

// Initialize helpers
PDFGenerator.getInstance().registerHelpers()

export default PDFGenerator