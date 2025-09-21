// Simple test for PDF generation functionality
const { PDFGenerator } = require('./lib/utils/pdf-generator.ts');

async function testPDFGeneration() {
  console.log('Testing PDF generation...');

  const generator = new PDFGenerator();

  // Sample organization data
  const sampleOrganization = {
    name: 'Test Company',
    email: 'test@company.com',
    phone: '+1-234-567-8900',
    address: '123 Business St',
    city: 'Business City',
    country: 'Business Country',
    currency_symbol: '$',
    terms_conditions: 'Payment due within 30 days.'
  };

  // Sample invoice data
  const sampleInvoiceData = {
    organization: sampleOrganization,
    invoiceNumber: 'INV-001',
    invoiceDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    status: 'Pending',
    customer: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1-555-123-4567',
      address: '456 Customer Ave',
      city: 'Customer City',
      country: 'Customer Country'
    },
    items: [
      {
        product: {
          name: 'Sample Product 1',
          description: 'This is a sample product description',
          sku: 'SKU-001'
        },
        quantity: 2,
        price: 25.50,
        total: 51.00
      },
      {
        product: {
          name: 'Sample Product 2',
          description: 'Another sample product',
          sku: 'SKU-002'
        },
        quantity: 1,
        price: 75.00,
        total: 75.00
      }
    ],
    subtotal: 126.00,
    taxAmount: 12.60,
    taxPercentage: 10,
    discountAmount: 5.00,
    totalAmount: 133.60,
    notes: 'Thank you for your business!'
  };

  try {
    console.log('Generating invoice PDF...');
    const pdfBuffer = await generator.generateInvoicePDF(sampleInvoiceData);

    console.log(`PDF generated successfully! Size: ${pdfBuffer.length} bytes`);

    // Save to file for inspection
    const fs = require('fs');
    fs.writeFileSync('./test-invoice.pdf', pdfBuffer);
    console.log('Test PDF saved as test-invoice.pdf');

  } catch (error) {
    console.error('Error generating PDF:', error);
  }
}

testPDFGeneration();