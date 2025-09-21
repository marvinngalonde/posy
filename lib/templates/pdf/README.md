# PDF Generation with Handlebars and Puppeteer

This directory contains the new PDF generation system that replaces the previous jsPDF implementation with a more flexible template-based approach using Handlebars and Puppeteer.

## Overview

The new system provides:
- **Better Design Control**: Full HTML/CSS styling capabilities
- **Professional Templates**: Pre-designed templates for invoices, quotations, and receipts
- **Easy Customization**: Handlebars templates are easy to modify
- **Consistent Branding**: Organization details are integrated throughout
- **High Quality**: Vector-based PDF output from Puppeteer

## File Structure

```
lib/templates/pdf/
├── README.md                 # This documentation
├── base-styles.css          # Common CSS styles for all templates
├── invoice.hbs              # Invoice template
├── quotation.hbs            # Quotation template
└── receipt.hbs              # Receipt template
```

## Templates

### Invoice Template (`invoice.hbs`)
- Professional invoice layout with company branding
- Detailed customer information
- Itemized product/service listing
- Tax, discount, and total calculations
- Payment information section
- Terms and conditions

### Quotation Template (`quotation.hbs`)
- Similar to invoice but formatted for quotations
- Validity period display
- Status indicators
- Professional presentation for client proposals

### Receipt Template (`receipt.hbs`)
- Compact format suitable for point-of-sale
- Essential transaction information
- Customer details (when available)
- Thank you message
- QR code support for digital receipts

## Styling

All templates use the shared `base-styles.css` file which provides:
- Consistent color scheme matching your brand
- Professional typography
- Responsive layouts
- Print optimization
- Modern design elements

### Color Scheme
- Primary: #3b82f6 (Blue)
- Secondary: #6b7280 (Gray)
- Success: #10b981 (Green)
- Warning: #f59e0b (Orange)
- Danger: #ef4444 (Red)

## Usage

### Basic Usage

```typescript
import { generateInvoicePDF, InvoicePDFData } from '@/lib/utils/pdf-generator'

const invoiceData: InvoicePDFData = {
  organization: organizationData,
  invoiceNumber: 'INV-001',
  invoiceDate: new Date(),
  customer: { /* customer details */ },
  items: [ /* invoice items */ ],
  subtotal: 100.00,
  totalAmount: 110.00,
  // ... other fields
}

const pdfBuffer = await generateInvoicePDF(invoiceData)
```

### Advanced Options

```typescript
const options = {
  format: 'A4',
  margin: {
    top: '15mm',
    right: '15mm',
    bottom: '15mm',
    left: '15mm'
  },
  printBackground: true
}

const pdfBuffer = await generateInvoicePDF(invoiceData, options)
```

## Customization

### Modifying Templates

1. Edit the `.hbs` files directly for content changes
2. Modify `base-styles.css` for styling changes
3. Templates use Handlebars syntax for dynamic content

### Available Handlebars Helpers

- `formatCurrency(amount, symbol)` - Format currency values
- `formatDate(date)` - Format dates (MMM dd, yyyy)
- `formatDateTime(date)` - Format dates with time
- `toLowerCase(string)` - Convert string to lowercase

### Adding New Templates

1. Create a new `.hbs` file in this directory
2. Follow the existing template structure
3. Include the base styles: `{{{styles}}}`
4. Add corresponding TypeScript interfaces in `pdf-generator.ts`

## Data Interfaces

### Organization Data
All templates expect organization data with these fields:
- `name` - Company name
- `email` - Contact email
- `phone` - Contact phone
- `address` - Physical address
- `city` - City
- `country` - Country
- `currency_symbol` - Currency symbol (e.g., '$', '€')
- `terms_conditions` - Terms and conditions text

### Customer Data
- `name` - Customer name
- `email` - Customer email (optional)
- `phone` - Customer phone (optional)
- `address` - Customer address (optional)
- `city` - Customer city (optional)
- `country` - Customer country (optional)

### Item Data
- `product.name` - Product name
- `product.description` - Product description (optional)
- `product.sku` - Product SKU (optional)
- `quantity` - Item quantity
- `price` - Unit price
- `total` - Line total

## Migration from jsPDF

The previous jsPDF implementation has been replaced. Key changes:

1. **Import Changes**: Replace `generateDocumentPDF` imports with new generator functions
2. **Data Structure**: Use new TypeScript interfaces instead of config objects
3. **Output**: Returns Buffer instead of jsPDF document object
4. **Download**: Use Blob and URL.createObjectURL for client-side downloads

### Before (jsPDF)
```typescript
import { generateDocumentPDF } from '@/lib/utils/pdf'
const doc = generateDocumentPDF(pdfConfig, organization)
doc.save('invoice.pdf')
```

### After (Handlebars + Puppeteer)
```typescript
import { generateInvoicePDF } from '@/lib/utils/pdf-generator'
const pdfBuffer = await generateInvoicePDF(invoiceData)
// Create download link for browser
const blob = new Blob([pdfBuffer], { type: 'application/pdf' })
const url = URL.createObjectURL(blob)
// ... download logic
```

## Performance Considerations

- Templates and styles are cached for better performance
- Puppeteer instances are properly cleaned up
- Use `clearCache()` method if templates are modified at runtime

## Troubleshooting

### Common Issues

1. **Puppeteer Launch Errors**: Ensure all required dependencies are installed
2. **Template Not Found**: Check file paths and naming conventions
3. **Styling Issues**: Verify CSS syntax and selectors
4. **Memory Issues**: Ensure browser instances are properly closed

### Debug Mode

Set environment variable for additional logging:
```bash
DEBUG=puppeteer:* npm run dev
```

## Dependencies

- `handlebars` - Template engine
- `puppeteer` - Headless browser for PDF generation
- `date-fns` - Date formatting utilities

## Browser Compatibility

Generated PDFs work in all modern browsers and PDF viewers. The templates are optimized for:
- Print media queries
- Vector graphics
- Consistent cross-platform rendering