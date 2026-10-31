import { API } from '../constants/api'
import {
  IconFile,
  IconFilePdf,
  IconFileArchive,
  IconFileCode,
  IconFileSpreadsheet,
} from '../components/ui/Icons'

export const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']
export const PDF_EXTENSIONS = ['.pdf']
export const ARCHIVE_EXTENSIONS = ['.zip', '.rar', '.7z', '.tar', '.gz']
export const CODE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.c', '.cpp', '.json', '.html', '.css', '.sql', '.sh']
export const SPREADSHEET_EXTENSIONS = ['.xls', '.xlsx', '.csv']

export function getExtension(filename) {
  const idx = filename.lastIndexOf('.')
  return idx === -1 ? '' : filename.slice(idx).toLowerCase()
}

export function getDisplayName(filename) {
  return filename.split('/').pop()
}

export function getFileIcon(extension, size) {
  if (PDF_EXTENSIONS.includes(extension)) return <IconFilePdf size={size} />
  if (ARCHIVE_EXTENSIONS.includes(extension)) return <IconFileArchive size={size} />
  if (CODE_EXTENSIONS.includes(extension)) return <IconFileCode size={size} />
  if (SPREADSHEET_EXTENSIONS.includes(extension)) return <IconFileSpreadsheet size={size} />
  return <IconFile size={size} />
}

export function getAttachmentUrl(postId, filename) {
  return `${import.meta.env.VITE_API_URL}${API.POSTS.ATTACHMENT(postId, filename)}`
}
