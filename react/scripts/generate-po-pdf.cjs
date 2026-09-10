const pdfMake = require('pdfmake')
const fs = require('fs')
const path = require('path')

const fonts = {
  Roboto: {
    normal: require.resolve('pdfmake/build/vfs_fonts.js').replace('vfs_fonts.js', 'fonts/Roboto/Roboto-Regular.ttf'),
    bold: require.resolve('pdfmake/build/vfs_fonts.js').replace('vfs_fonts.js', 'fonts/Roboto/Roboto-Medium.ttf'),
    italics: require.resolve('pdfmake/build/vfs_fonts.js').replace('vfs_fonts.js', 'fonts/Roboto/Roboto-Italic.ttf'),
    bolditalics: require.resolve('pdfmake/build/vfs_fonts.js').replace('vfs_fonts.js', 'fonts/Roboto/Roboto-MediumItalic.ttf'),
  },
}

pdfMake.fonts = fonts

const args = process.argv.slice(2)
const outputPath = args[0] || './public/purchase-order-sample.pdf'

function toCurrency(value, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function toDateString(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

const inputPath = args[1]

let data
if (inputPath && fs.existsSync(inputPath)) {
  data = JSON.parse(fs.readFileSync(inputPath, 'utf-8'))
} else {
  data = {
    number: 'PO-2026-08542',
    supplierName: 'NexGen Components Ltd.',
    plant: 'Acme Assembly Plant #3',
    createdDate: '2026-08-28',
    buyer: 'Jordan Blake',
    requiredDate: '2026-09-15',
    status: 'Issued',
    deliveryStatus: 'In Transit',
    currency: 'USD',
    value: 48967.10,
    lines: [
      { line: 1, sku: 'PCB-0921-A', product: 'Industrial Control PCB — Gen 3', spec: 'RoHS compliant, 6-layer', qty: 500, unitCost: 42.00, value: 21000.00 },
      { line: 2, sku: 'MTR-48V-055', product: '48V Brushless DC Motor', spec: 'IP54 rated, 1500 RPM', qty: 120, unitCost: 138.50, value: 16620.00 },
      { line: 3, sku: 'SNS-TEMP-214', product: 'Temperature Sensor Module', spec: '-40°C to +125°C, 4-20mA output', qty: 350, unitCost: 18.75, value: 6562.50 },
    ],
  }
}

const poNumber = data.number || 'PO-2026-08542'
const supplierName = data.supplierName || 'Supplier'
const plant = data.plant || 'Acme Assembly Plant'
const poDate = toDateString(data.createdDate)
const buyer = data.buyer || '—'
const requiredDate = toDateString(data.requiredDate)
const status = data.status || 'Issued'
const delivery = data.deliveryStatus || 'Pending'
const currency = data.currency || 'USD'
const lines = Array.isArray(data.lines) ? data.lines : []
const subtotal = lines.reduce((sum, l) => sum + (Number(l.value) || 0), 0)
const taxRate = 0.08
const tax = subtotal * taxRate
const shipping = 1250.00
const total = subtotal + tax + shipping

const lineItemRows = lines.map((l) => [
  String(l.line || ''),
  String(l.sku || ''),
  { stack: [{ text: String(l.product || ''), bold: true }, { text: String(l.spec || ''), style: 'muted' }] },
  { text: String(l.qty || ''), alignment: 'center' },
  { text: toCurrency(Number(l.unitCost) || 0, currency), alignment: 'right' },
  { text: toCurrency(Number(l.value) || 0, currency), alignment: 'right' },
])

if (lineItemRows.length === 0) {
  lineItemRows.push([
    '', '', { text: 'No line items configured for this purchase order.', style: 'muted' }, '', '', ''
  ])
}

const documentDefinition = {
  content: [
    {
      columns: [
        {
          stack: [
            { text: 'ACME Supply Chain', style: 'companyName' },
            { text: '1200 Logistics Parkway · Detroit, MI 48201', style: 'muted' },
            { text: 'procurement@acmesupply.example', style: 'muted' },
          ],
          width: '*',
        },
        {
          stack: [
            { text: 'PURCHASE ORDER', style: 'title', alignment: 'right' },
            { text: poNumber, style: 'poNumber', alignment: 'right' },
          ],
          width: 'auto',
        },
      ],
      margin: [0, 0, 0, 20],
    },
    {
      columns: [
        {
          stack: [
            { text: 'Supplier', style: 'sectionHeader' },
            { text: supplierName, style: 'bold' },
            { text: 'Authorized vendor per supplier master', style: 'muted' },
          ],
          width: '50%',
        },
        {
          stack: [
            { text: 'Ship To / Plant', style: 'sectionHeader' },
            { text: plant, style: 'bold' },
            { text: 'Receiving dock — inbound inspection required', style: 'muted' },
          ],
          width: '50%',
        },
      ],
      margin: [0, 0, 0, 20],
    },
    {
      columns: [
        {
          table: {
            widths: ['40%', '*'],
            body: [
              [{ text: 'PO Date', bold: true }, poDate],
              [{ text: 'Buyer', bold: true }, buyer],
              [{ text: 'Required Date', bold: true }, requiredDate],
              [{ text: 'Payment Terms', bold: true }, 'Net 30'],
            ],
          },
          layout: 'noBorders',
          width: '50%',
        },
        {
          table: {
            widths: ['40%', '*'],
            body: [
              [{ text: 'Status', bold: true }, status],
              [{ text: 'Delivery', bold: true }, delivery],
              [{ text: 'Currency', bold: true }, currency],
              [{ text: 'Incoterms', bold: true }, 'FOB Origin'],
            ],
          },
          layout: 'noBorders',
          width: '50%',
        },
      ],
      margin: [0, 0, 0, 20],
    },
    { text: 'Line Items', style: 'sectionHeader', margin: [0, 10, 0, 8] },
    {
      table: {
        headerRows: 1,
        widths: [40, 80, '*', 60, 80, 90],
        body: [
          [
            { text: 'Line', style: 'tableHeader' },
            { text: 'SKU', style: 'tableHeader' },
            { text: 'Product / Description', style: 'tableHeader' },
            { text: 'Qty', style: 'tableHeader', alignment: 'center' },
            { text: 'Unit Cost', style: 'tableHeader', alignment: 'right' },
            { text: 'Value', style: 'tableHeader', alignment: 'right' },
          ],
          ...lineItemRows,
        ],
      },
      layout: {
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => '#bbbbbb',
        vLineColor: () => '#bbbbbb',
        fillColor: (i) => (i === 0 ? '#f1f3f4' : null),
        paddingLeft: () => 6,
        paddingRight: () => 6,
        paddingTop: () => 6,
        paddingBottom: () => 6,
      },
      margin: [0, 0, 0, 12],
    },
    {
      table: {
        widths: ['*', 110, 110],
        body: [
          ['', { text: 'Subtotal', bold: true, alignment: 'right' }, { text: toCurrency(subtotal, currency), alignment: 'right' }],
          ['', { text: `Tax (${(taxRate * 100).toFixed(0)}%)`, bold: true, alignment: 'right' }, { text: toCurrency(tax, currency), alignment: 'right' }],
          ['', { text: 'Shipping & Handling', bold: true, alignment: 'right' }, { text: toCurrency(shipping, currency), alignment: 'right' }],
          ['', { text: 'TOTAL', bold: true, fontSize: 14, alignment: 'right' }, { text: toCurrency(total, currency), bold: true, fontSize: 14, alignment: 'right' }],
        ],
      },
      layout: 'noBorders',
      alignment: 'right',
      margin: [0, 0, 0, 24],
    },
    {
      text: 'Terms & Conditions',
      style: 'sectionHeader',
      margin: [0, 0, 0, 6],
    },
    {
      ul: [
        `All shipments must reference ${poNumber} on all packing slips and invoices.`,
        `Goods are subject to incoming inspection at ${plant}.`,
        'Late deliveries may be rejected or subject to chargebacks per the vendor agreement.',
        'Certificate of conformance and material safety data sheets must accompany hazardous materials.',
      ],
      style: 'muted',
      margin: [0, 0, 0, 20],
    },
    {
      columns: [
        {
          stack: [
            { text: 'Approved By', style: 'sectionHeader' },
            { text: 'Morgan Chen, Procurement Manager', style: 'bold' },
            { text: `${poDate} 09:42 AM EST`, style: 'muted' },
          ],
          width: '50%',
        },
        {
          stack: [
            { text: 'Remarks', style: 'sectionHeader' },
            { text: 'Priority shipment. Verify lot traceability on electronic component batches.', style: 'muted' },
          ],
          width: '50%',
        },
      ],
    },
    {
      text: 'This document was generated by the Supply Chain Management.',
      style: 'footer',
      alignment: 'center',
      margin: [30, 30, 30, 0],
    },
  ],
  defaultStyle: {
    font: 'Roboto',
    fontSize: 10,
    lineHeight: 1.2,
    color: '#1f2937',
  },
  styles: {
    title: { fontSize: 22, bold: true, color: '#1e3a8a' },
    poNumber: { fontSize: 16, bold: true, color: '#2563eb' },
    companyName: { fontSize: 14, bold: true, color: '#111827' },
    sectionHeader: { fontSize: 12, bold: true, color: '#374151', margin: [0, 0, 0, 4] },
    tableHeader: { bold: true, fontSize: 10, color: '#1f2937' },
    bold: { bold: true },
    muted: { color: '#4b5563' },
    footer: { fontSize: 9, italics: true, color: '#6b7280' },
  },
  pageMargins: [40, 40, 40, 40],
}

const outputDir = path.dirname(outputPath)
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

pdfMake.createPdf(documentDefinition).getBuffer().then((buffer) => {
  fs.writeFileSync(outputPath, buffer)
  console.log('Generated', outputPath)
}).catch((err) => {
  console.error('PDF generation failed:', err)
  process.exit(1)
})
