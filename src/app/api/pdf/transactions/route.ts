import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      transactions, 
      company, 
      projectName,
      pageSize = 'A4',
      orientation = 'portrait' // Always force portrait
    } = body;

    if (!transactions || transactions.length === 0) {
      return NextResponse.json({ error: 'No transactions to export' }, { status: 400 });
    }

    // Generate a unique filename
    const timestamp = Date.now();
    const filename = `Laporan_Transaksi_${timestamp}.pdf`;
    const outputPath = path.join('/tmp', filename);

    // Create Python script for PDF generation
    const pythonScript = generatePDFScript(transactions, company, projectName, outputPath, pageSize);

    // Write Python script to temp file
    const scriptPath = path.join('/tmp', `generate_pdf_${timestamp}.py`);
    fs.writeFileSync(scriptPath, pythonScript);

    // Execute Python script
    try {
      const { stdout, stderr } = await execAsync(`python3 ${scriptPath}`);
      if (stderr && !stderr.includes('warning')) {
        console.error('Python stderr:', stderr);
      }
    } catch (execError: any) {
      console.error('Exec error:', execError);
      return NextResponse.json({ error: 'Failed to generate PDF', details: execError.message }, { status: 500 });
    }

    // Read the generated PDF
    if (!fs.existsSync(outputPath)) {
      return NextResponse.json({ error: 'PDF file was not created' }, { status: 500 });
    }

    const pdfBuffer = fs.readFileSync(outputPath);

    // Clean up temp files
    try {
      fs.unlinkSync(scriptPath);
      fs.unlinkSync(outputPath);
    } catch (e) {
      // Ignore cleanup errors
    }

    // Return PDF with download headers
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (error: any) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF', details: error.message }, { status: 500 });
  }
}

function generatePDFScript(
  transactions: any[], 
  company: any, 
  projectName: string,
  outputPath: string,
  pageSize: string
): string {
  const pageSizes: Record<string, string> = {
    'A4': 'A4',
    'Letter': 'letter',
    'Legal': 'legal',
    'A3': 'A3',
    'A5': 'A5'
  };
  
  const selectedPageSize = pageSizes[pageSize] || 'A4';
  const currentDate = new Date().toLocaleDateString('id-ID', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Format transactions data
  const transactionsData = transactions.map((tx: any) => ({
    date: new Date(tx.date).toLocaleDateString('id-ID'),
    project: tx.project?.name || '-',
    type: tx.type,
    category: tx.category,
    description: tx.description || '-',
    amount: tx.amount,
  }));

  const transactionsJSON = JSON.stringify(transactionsData);
  const companyName = company?.name || 'PT. Konstruksi Nusantara';
  const companyAddress = company?.address || 'Alamat Perusahaan';
  const companyEmail = company?.email || '';
  const companyPhone = company?.phone || '';

  return `
# -*- coding: utf-8 -*-
from reportlab.lib.pagesizes import ${selectedPageSize}
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib import colors
from reportlab.lib.units import cm, mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import json
import os

# Register fonts
try:
    pdfmetrics.registerFont(TTFont('Times New Roman', '/usr/share/fonts/truetype/english/Times-New-Roman.ttf'))
except:
    pass

# Create document
doc = SimpleDocTemplate(
    "${outputPath}",
    pagesize=${selectedPageSize},
    rightMargin=1.5*cm,
    leftMargin=1.5*cm,
    topMargin=1.5*cm,
    bottomMargin=1.5*cm,
    title="Laporan Transaksi Keuangan",
    author="Z.ai",
    creator="Z.ai",
    subject="Laporan Transaksi Keuangan"
)

styles = getSampleStyleSheet()

# Custom styles
title_style = ParagraphStyle(
    'CustomTitle',
    parent=styles['Heading1'],
    fontName='Times New Roman',
    fontSize=16,
    alignment=TA_CENTER,
    spaceAfter=10
)

header_style = ParagraphStyle(
    'HeaderStyle',
    fontName='Times New Roman',
    fontSize=18,
    alignment=TA_CENTER,
    spaceAfter=5
)

address_style = ParagraphStyle(
    'AddressStyle',
    fontName='Times New Roman',
    fontSize=10,
    alignment=TA_CENTER,
    textColor=colors.HexColor('#333333')
)

subtitle_style = ParagraphStyle(
    'SubtitleStyle',
    fontName='Times New Roman',
    fontSize=11,
    alignment=TA_CENTER,
    textColor=colors.HexColor('#555555'),
    spaceAfter=20
)

table_header_style = ParagraphStyle(
    'TableHeader',
    fontName='Times New Roman',
    fontSize=9,
    textColor=colors.white,
    alignment=TA_CENTER
)

table_cell_style = ParagraphStyle(
    'TableCell',
    fontName='Times New Roman',
    fontSize=9,
    alignment=TA_LEFT
)

table_cell_center = ParagraphStyle(
    'TableCellCenter',
    fontName='Times New Roman',
    fontSize=9,
    alignment=TA_CENTER
)

table_cell_right = ParagraphStyle(
    'TableCellRight',
    fontName='Times New Roman',
    fontSize=9,
    alignment=TA_RIGHT
)

story = []

# Letterhead
story.append(Paragraph("<b>${companyName}</b>", header_style))
story.append(Paragraph("${companyAddress}", address_style))
contact_info = []
if "${companyEmail}":
    contact_info.append("Email: ${companyEmail}")
if "${companyPhone}":
    contact_info.append("Telp: ${companyPhone}")
if contact_info:
    story.append(Paragraph(" | ".join(contact_info), address_style))
story.append(Spacer(1, 10))

# Horizontal line
from reportlab.platypus import HRFlowable
story.append(HRFlowable(width="100%", thickness=2, color=colors.black, spaceAfter=10, spaceBefore=5))
story.append(HRFlowable(width="100%", thickness=0.5, color=colors.black, spaceAfter=20))

# Document title
story.append(Paragraph("<b><u>LAPORAN TRANSAKSI KEUANGAN</u></b>", title_style))
story.append(Paragraph("Periode: ${currentDate}", subtitle_style))
if "${projectName}" and "${projectName}" != "Semua Project":
    story.append(Paragraph("Project: ${projectName}", subtitle_style))

# Parse transactions
transactions = ${transactionsJSON}

# Calculate totals
total_income = sum(tx['amount'] for tx in transactions if tx['type'] == 'Income')
total_expense = sum(tx['amount'] for tx in transactions if tx['type'] == 'Expense')

# Table header (NO Actions column)
header = [
    Paragraph('<b>No</b>', table_header_style),
    Paragraph('<b>Tanggal</b>', table_header_style),
    Paragraph('<b>Project</b>', table_header_style),
    Paragraph('<b>Tipe</b>', table_header_style),
    Paragraph('<b>Kategori</b>', table_header_style),
    Paragraph('<b>Deskripsi</b>', table_header_style),
    Paragraph('<b>Jumlah</b>', table_header_style),
]

data = [header]

# Table rows (NO Actions column)
for idx, tx in enumerate(transactions, 1):
    amount_str = ('+' if tx['type'] == 'Income' else '-') + f"Rp {tx['amount']:,.0f}".replace(',', '.')
    
    row = [
        Paragraph(str(idx), table_cell_center),
        Paragraph(tx['date'], table_cell_center),
        Paragraph(tx['project'], table_cell_style),
        Paragraph(tx['type'], table_cell_center),
        Paragraph(tx['category'], table_cell_center),
        Paragraph(tx['description'], table_cell_style),
        Paragraph(amount_str, table_cell_right),
    ]
    data.append(row)

# Totals row
total_row = [
    Paragraph('', table_cell_style),
    Paragraph('', table_cell_style),
    Paragraph('', table_cell_style),
    Paragraph('', table_cell_style),
    Paragraph('', table_cell_style),
    Paragraph('<b>Total Penerimaan</b>', table_cell_style),
    Paragraph(f"<b>+ Rp {total_income:,.0f}</b>".replace(',', '.'), table_cell_right),
]
data.append(total_row)

total_row2 = [
    Paragraph('', table_cell_style),
    Paragraph('', table_cell_style),
    Paragraph('', table_cell_style),
    Paragraph('', table_cell_style),
    Paragraph('', table_cell_style),
    Paragraph('<b>Total Pengeluaran</b>', table_cell_style),
    Paragraph(f"<b>- Rp {total_expense:,.0f}</b>".replace(',', '.'), table_cell_right),
]
data.append(total_row2)

net_total = total_income - total_expense
net_str = ('+' if net_total >= 0 else '') + f"Rp {net_total:,.0f}".replace(',', '.')
total_row3 = [
    Paragraph('', table_cell_style),
    Paragraph('', table_cell_style),
    Paragraph('', table_cell_style),
    Paragraph('', table_cell_style),
    Paragraph('', table_cell_style),
    Paragraph('<b>Saldo Akhir</b>', table_cell_style),
    Paragraph(f"<b>{net_str}</b>", table_cell_right),
]
data.append(total_row3)

# Create table with column widths
col_widths = [1*cm, 2.5*cm, 3*cm, 1.8*cm, 2.5*cm, 4*cm, 3.5*cm]
table = Table(data, colWidths=col_widths)

table.setStyle(TableStyle([
    # Header styling
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F4E79')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
    ('FONTNAME', (0, 0), (-1, 0), 'Times New Roman'),
    ('FONTSIZE', (0, 0), (-1, 0), 9),
    ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
    ('TOPPADDING', (0, 0), (-1, 0), 8),
    
    # Body styling
    ('FONTNAME', (0, 1), (-1, -1), 'Times New Roman'),
    ('FONTSIZE', (0, 1), (-1, -1), 9),
    ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
    ('TOPPADDING', (0, 1), (-1, -1), 6),
    
    # Alternating row colors
    ('BACKGROUND', (0, 1), (-1, 1), colors.white),
    ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 3), (-1, 3), colors.white),
    ('BACKGROUND', (0, 4), (-1, 4), colors.HexColor('#F5F5F5')),
    ('BACKGROUND', (0, 5), (-1, 5), colors.white),
    
    # Total rows styling
    ('BACKGROUND', (0, -3), (-1, -3), colors.HexColor('#E8F4E8')),
    ('BACKGROUND', (0, -2), (-1, -2), colors.HexColor('#FCE8E8')),
    ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#E0E0E0')),
    
    # Grid
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    
    # Left/Right padding for cells
    ('LEFTPADDING', (0, 0), (-1, -1), 4),
    ('RIGHTPADDING', (0, 0), (-1, -1), 4),
]))

# Apply alternating colors dynamically
for i in range(1, len(data) - 3):
    if i % 2 == 0:
        table.setStyle(TableStyle([('BACKGROUND', (0, i), (-1, i), colors.HexColor('#F5F5F5'))]))

story.append(table)
story.append(Spacer(1, 30))

# Signature section
signature_style = ParagraphStyle(
    'SignatureStyle',
    fontName='Times New Roman',
    fontSize=10,
    alignment=TA_CENTER
)

story.append(Spacer(1, 40))
story.append(Paragraph("Mengetahui,", signature_style))
story.append(Spacer(1, 50))
story.append(Paragraph("_________________________", signature_style))
story.append(Paragraph("<b>Manager Keuangan</b>", signature_style))

# Build document
doc.build(story)
print("PDF created successfully at ${outputPath}")
`;
}
