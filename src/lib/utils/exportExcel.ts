import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

export async function exportToExcel(filename: string, rows: Record<string, unknown>[]): Promise<void> {
  if (rows.length === 0) return

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Bindu Premium Tracker'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet('Export Data', {
    views: [{ state: 'frozen', ySplit: 1 }] // Freeze the top row
  })

  // Extract headers
  const columns = Object.keys(rows[0]).map(key => ({
    header: key,
    key: key,
    width: Math.max(key.length + 5, 12) // Minimum width of 12 or slightly larger than header name
  }))
  
  sheet.columns = columns

  // Add Data
  rows.forEach(row => {
    sheet.addRow(row)
  })

  // Style Header Row
  const headerRow = sheet.getRow(1)
  headerRow.height = 24
  headerRow.eachCell(cell => {
    cell.font = {
      bold: true,
      color: { argb: 'FFFFFFFF' },
      size: 11
    }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1A3557' } // Bindu Premium Dark Blue
    }
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center'
    }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    }
  })

  // Auto-fit column widths based on content
  sheet.columns.forEach(column => {
    let maxLength = column.header ? column.header.length : 10
    column.eachCell?.({ includeEmpty: true }, cell => {
      const columnLength = cell.value ? cell.value.toString().length : 10
      if (columnLength > maxLength) {
        maxLength = columnLength
      }
    })
    column.width = Math.min(maxLength + 2, 40) // Cap width at 40
  })

  // Generate File
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  saveAs(blob, `${filename}.xlsx`)
}
