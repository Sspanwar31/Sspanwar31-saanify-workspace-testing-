import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { writeFile, mkdir } from 'fs/promises'

interface FileUploadResponse {
  success: boolean
  message: string
  filePath?: string
  fileName?: string
  size?: number
  error?: string
}

interface FileDownloadResponse {
  success: boolean
  message: string
  content?: string
  fileName?: string
  size?: number
  encoding?: string
  error?: string
}

interface FileListResponse {
  success: boolean
  message: string
  files?: Array<{
    name: string
    path: string
    size: number
    isDirectory: boolean
    lastModified: string
  }>
  error?: string
}

// Allowed file extensions for security
const ALLOWED_EXTENSIONS = [
  '.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.txt', '.yml', '.yaml',
  '.css', '.scss', '.less', '.html', '.xml', '.svg', '.png', '.jpg', '.jpeg',
  '.gif', '.ico', '.pdf', '.doc', '.docx', '.xls', '.xlsx'
]

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024

// Validate file extension
function validateFileExtension(fileName: string): boolean {
  const ext = path.extname(fileName).toLowerCase()
  return ALLOWED_EXTENSIONS.includes(ext)
}

// Sanitize file path to prevent directory traversal
function sanitizeFilePath(filePath: string): string {
  // Remove any .. or absolute paths
  return path.normalize(filePath).replace(/^(\.\.[\/\\])+/, '')
}

// Get file stats
async function getFileStats(filePath: string): Promise<{
  size: number
  isDirectory: boolean
  lastModified: string
} | null> {
  try {
    const stats = await fs.stat(filePath)
    return {
      size: stats.size,
      isDirectory: stats.isDirectory(),
      lastModified: stats.mtime.toISOString()
    }
  } catch {
    return null
  }
}

// List files in a directory
async function listFiles(dirPath: string, recursive: boolean = false): Promise<FileListResponse> {
  try {
    const sanitizedPath = sanitizeFilePath(dirPath)
    const fullPath = path.join(process.cwd(), sanitizedPath)
    
    // Check if path exists and is a directory
    const stats = await fs.stat(fullPath)
    if (!stats.isDirectory()) {
      return {
        success: false,
        message: 'Path is not a directory',
        error: 'Not a directory'
      }
    }

    const files = await fs.readdir(fullPath)
    const fileList: Array<{
      name: string
      path: string
      size: number
      isDirectory: boolean
      lastModified: string
    }> = []

    for (const file of files) {
      const filePath = path.join(fullPath, file)
      const relativePath = path.join(sanitizedPath, file)
      const fileStats = await getFileStats(filePath)
      
      if (fileStats) {
        fileList.push({
          name: file,
          path: relativePath,
          size: fileStats.size,
          isDirectory: fileStats.isDirectory,
          lastModified: fileStats.lastModified
        })

        // Recursively list subdirectories if requested
        if (recursive && fileStats.isDirectory) {
          const subFiles = await listFiles(relativePath, true)
          if (subFiles.success && subFiles.files) {
            fileList.push(...subFiles.files)
          }
        }
      }
    }

    return {
      success: true,
      message: `Found ${fileList.length} items`,
      files: fileList.sort((a, b) => {
        // Directories first, then files
        if (a.isDirectory && !b.isDirectory) return -1
        if (!a.isDirectory && b.isDirectory) return 1
        return a.name.localeCompare(b.name)
      })
    }

  } catch (error) {
    console.error('Error listing files:', error)
    return {
      success: false,
      message: 'Failed to list files',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Upload a file
async function uploadFile(fileName: string, content: string, filePath?: string): Promise<FileUploadResponse> {
  try {
    // Validate file extension
    if (!validateFileExtension(fileName)) {
      return {
        success: false,
        message: 'File type not allowed',
        error: 'Invalid file extension'
      }
    }

    // Check file size
    const size = Buffer.byteLength(content, 'base64')
    if (size > MAX_FILE_SIZE) {
      return {
        success: false,
        message: 'File too large',
        error: 'File size exceeds maximum limit'
      }
    }

    // Sanitize and construct file path
    const sanitizedFileName = sanitizeFilePath(fileName)
    const sanitizedPath = filePath ? sanitizeFilePath(filePath) : ''
    const fullPath = path.join(process.cwd(), sanitizedPath, sanitizedFileName)

    // Create directory if it doesn't exist
    const directory = path.dirname(fullPath)
    await mkdir(directory, { recursive: true })

    // Decode and write file
    const fileContent = Buffer.from(content, 'base64')
    await writeFile(fullPath, fileContent)

    return {
      success: true,
      message: 'File uploaded successfully',
      filePath: path.join(sanitizedPath, sanitizedFileName),
      fileName: sanitizedFileName,
      size
    }

  } catch (error) {
    console.error('Error uploading file:', error)
    return {
      success: false,
      message: 'Failed to upload file',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Download a file
async function downloadFile(filePath: string): Promise<FileDownloadResponse> {
  try {
    // Sanitize file path
    const sanitizedPath = sanitizeFilePath(filePath)
    const fullPath = path.join(process.cwd(), sanitizedPath)

    // Check if file exists
    const stats = await fs.stat(fullPath)
    if (stats.isDirectory()) {
      return {
        success: false,
        message: 'Cannot download a directory',
        error: 'Path is a directory'
      }
    }

    // Read file content
    const content = await fs.readFile(fullPath)
    const base64Content = content.toString('base64')

    return {
      success: true,
      message: 'File downloaded successfully',
      content: base64Content,
      fileName: path.basename(fullPath),
      size: stats.size,
      encoding: 'base64'
    }

  } catch (error) {
    console.error('Error downloading file:', error)
    return {
      success: false,
      message: 'Failed to download file',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Main API handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, fileName, content, filePath, recursive } = body

    switch (action) {
      case 'upload':
        if (!fileName || !content) {
          return NextResponse.json(
            { error: 'fileName and content are required for upload' },
            { status: 400 }
          )
        }
        const uploadResult = await uploadFile(fileName, content, filePath)
        return NextResponse.json(uploadResult)

      case 'download':
        if (!filePath) {
          return NextResponse.json(
            { error: 'filePath is required for download' },
            { status: 400 }
          )
        }
        const downloadResult = await downloadFile(filePath)
        return NextResponse.json(downloadResult)

      case 'list':
        const listResult = await listFiles(filePath || '', recursive || false)
        return NextResponse.json(listResult)

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: upload, download, list' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('File API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint for file information
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const filePath = searchParams.get('path') || ''

    switch (action) {
      case 'list':
        const recursive = searchParams.get('recursive') === 'true'
        const listResult = await listFiles(filePath, recursive)
        return NextResponse.json(listResult)

      case 'info':
        const sanitizedPath = sanitizeFilePath(filePath)
        const fullPath = path.join(process.cwd(), sanitizedPath)
        const stats = await getFileStats(fullPath)
        
        if (!stats) {
          return NextResponse.json(
            { error: 'File not found' },
            { status: 404 }
          )
        }

        return NextResponse.json({
          success: true,
          file: {
            name: path.basename(fullPath),
            path: sanitizedPath,
            size: stats.size,
            isDirectory: stats.isDirectory,
            lastModified: stats.lastModified
          }
        })

      default:
        return NextResponse.json({
          message: 'File API endpoint',
          actions: ['upload', 'download', 'list', 'info'],
          parameters: {
            upload: ['fileName', 'content', 'filePath?'],
            download: ['filePath'],
            list: ['filePath?', 'recursive?'],
            info: ['path']
          }
        })
    }

  } catch (error) {
    console.error('File API GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}