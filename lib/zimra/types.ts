// ZIMRA FDMS TypeScript Definitions

export interface ZIMRAConfig {
  id: number
  taxpayerTIN: string
  vatRegistrationNo?: string
  businessName: string
  businessType: string
  branchName: string
  branchAddress: {
    street: string
    city: string
    province: string
    country: string
  }
  deviceCertificatePath?: string
  certificateThumbprint?: string
  certificateExpiry?: Date
  testEnvironment: boolean
  apiEndpoint?: string
  status: 'pending' | 'approved' | 'active' | 'suspended'
  isFDMSEnabled: boolean
}

export interface FiscalDevice {
  id: number
  zimraConfigId: number
  deviceId: string
  deviceSerialNo: string
  branchName: string
  branchAddress: {
    street: string
    city: string
    province: string
    country: string
  }
  operatingMode: 'Online' | 'Offline'
  status: 'Active' | 'Blocked' | 'Pending'
  dailyReceiptCounter: number
  globalReceiptCounter: bigint
  fiscalDayOpened?: Date
  lastZReport?: Date
}

export interface FiscalTransaction {
  id: bigint
  zimraConfigId: number
  deviceId: string
  receiptGlobalNo: bigint
  receiptType: 'FiscalInvoice' | 'CreditNote' | 'DebitNote'
  invoiceNo: string
  receiptCurrency: string
  receiptTotal: number
  taxAmount: number
  receiptDate: Date
  buyerTIN?: string
  buyerName?: string
  receiptItems: FiscalReceiptItem[]
  deviceSignature: string
  fdmsSignature?: string
  qrCodeData?: string
  zimraStatus: 'pending' | 'submitted' | 'confirmed' | 'failed'
  errorMessage?: string
  retryCount: number
}

export interface FiscalReceiptItem {
  itemName: string
  itemQuantity: number
  itemPrice: number
  itemTotal: number
  taxPercent: number
  taxID: number
  HSCode?: string
}

export interface ZIMRAInvoiceData {
  invoiceNo: string
  total: number
  currency?: string
  customer?: {
    tin?: string
    name?: string
  }
  items: {
    name: string
    quantity: number
    price: number
    taxRate?: number
    taxId?: number
    hsCode?: string
  }[]
  saleId?: number
}

export interface ZIMRAResponse {
  success: boolean
  receiptGlobalNo?: bigint
  qrCodeData?: {
    data: any
    qrString: string
    qrCodeUrl: string
  }
  fdmsSignature?: string
  verificationUrl?: string
  status?: string
  message?: string
}

export interface QRCodeData {
  deviceId: string
  receiptNo: bigint
  total: number
  date: string
  verification?: string
}

export class ZIMRAError extends Error {
  public type: string
  public details: any

  constructor(message: string, type: string, details?: any) {
    super(message)
    this.name = 'ZIMRAError'
    this.type = type
    this.details = details
  }
}