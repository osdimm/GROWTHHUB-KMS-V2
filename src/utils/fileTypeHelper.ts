export function autoDetectFileType(fileName?: string): 'PDF' | 'DOCX' | 'XLSX' | 'PPTX' | 'E-Book' | 'Video' | 'Artikel' | 'LINK' {
  if (!fileName) return 'Artikel';
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'PDF';
  if (['docx', 'doc'].includes(ext || '')) return 'DOCX';
  if (['xlsx', 'xls', 'csv'].includes(ext || '')) return 'XLSX';
  if (['pptx', 'ppt'].includes(ext || '')) return 'PPTX';
  if (['epub', 'mobi'].includes(ext || '')) return 'E-Book';
  if (['mp4', 'mov', 'avi', 'mkv'].includes(ext || '')) return 'Video';
  return 'Artikel';
}

export function isLinkDocument(doc: { fileType?: string; contentType?: string; fileUrl?: string; linkUrl?: string }): boolean {
  // If there's an actual file uploaded (fileUrl exists), it is NOT a link-only document!
  if (doc.fileUrl && doc.fileUrl.trim().length > 0) {
    return false;
  }
  return doc.fileType === 'LINK' || doc.contentType === 'link' || Boolean(doc.linkUrl && doc.linkUrl.trim().length > 0);
}

export function getEffectiveFileType(doc: { fileType?: string; fileUrl?: string; title?: string }): string {
  if (doc.fileType && doc.fileType !== 'LINK') {
    return doc.fileType;
  }
  if (doc.fileUrl) {
    const url = doc.fileUrl.toLowerCase();
    if (url.includes('.xlsx') || url.includes('.xls') || url.includes('.csv')) return 'XLSX';
    if (url.includes('.pdf')) return 'PDF';
    if (url.includes('.docx') || url.includes('.doc')) return 'DOCX';
    if (url.includes('.pptx') || url.includes('.ppt')) return 'PPTX';
  }
  if (doc.title) {
    const titleLower = doc.title.toLowerCase();
    if (titleLower.endsWith('.xlsx') || titleLower.endsWith('.xls') || titleLower.endsWith('.csv')) return 'XLSX';
    if (titleLower.endsWith('.pdf')) return 'PDF';
    if (titleLower.endsWith('.docx') || titleLower.endsWith('.doc')) return 'DOCX';
    if (titleLower.endsWith('.pptx') || titleLower.endsWith('.ppt')) return 'PPTX';
  }
  return doc.fileType || 'PDF';
}

export function isSpreadsheetFile(fileType?: string, fileUrl?: string): boolean {
  const typeUpper = (fileType || '').toUpperCase();
  if (typeUpper === 'XLSX' || typeUpper === 'XLS' || typeUpper === 'CSV' || typeUpper === 'SPREADSHEET') {
    return true;
  }
  if (fileUrl) {
    const urlLower = fileUrl.toLowerCase();
    if (
      urlLower.endsWith('.xlsx') ||
      urlLower.endsWith('.xls') ||
      urlLower.endsWith('.csv') ||
      urlLower.includes('.xlsx?') ||
      urlLower.includes('.xls?') ||
      urlLower.includes('.csv?') ||
      urlLower.startsWith('data:application/vnd') ||
      urlLower.startsWith('data:text/csv')
    ) {
      return true;
    }
  }
  return false;
}

export function isPdfFile(fileType?: string, fileUrl?: string): boolean {
  const typeUpper = (fileType || '').toUpperCase();
  if (typeUpper === 'PDF') {
    return true;
  }
  if (fileUrl) {
    const urlLower = fileUrl.toLowerCase();
    if (
      urlLower.endsWith('.pdf') ||
      urlLower.includes('.pdf?') ||
      urlLower.startsWith('data:application/pdf')
    ) {
      return true;
    }
  }
  return false;
}

export function isImageFile(fileType?: string, fileUrl?: string): boolean {
  const typeUpper = (fileType || '').toUpperCase();
  if (typeUpper === 'IMAGE' || typeUpper === 'GAMBAR' || typeUpper === 'PNG' || typeUpper === 'JPG') {
    return true;
  }
  if (fileUrl) {
    const urlLower = fileUrl.toLowerCase();
    if (
      urlLower.startsWith('data:image/') ||
      urlLower.endsWith('.png') ||
      urlLower.endsWith('.jpg') ||
      urlLower.endsWith('.jpeg') ||
      urlLower.endsWith('.webp') ||
      urlLower.endsWith('.gif') ||
      urlLower.endsWith('.svg') ||
      urlLower.includes('.png?') ||
      urlLower.includes('.jpg?') ||
      urlLower.includes('.jpeg?') ||
      urlLower.includes('.webp?')
    ) {
      return true;
    }
  }
  return false;
}
