/**
 * File Upload Utilities
 * Handles file uploads with proper validation and storage
 */

import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

/**
 * Configuration for file uploads
 */
export const UPLOAD_CONFIG = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  uploadsDir: join(process.cwd(), 'public', 'uploads'),
  publicPath: '/uploads',
} as const

/**
 * Validate uploaded file
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > UPLOAD_CONFIG.maxFileSize) {
    return {
      valid: false,
      error: `File size must be less than ${UPLOAD_CONFIG.maxFileSize / (1024 * 1024)}MB`
    }
  }

  // Check file type
  if (!UPLOAD_CONFIG.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} not allowed. Allowed types: ${UPLOAD_CONFIG.allowedTypes.join(', ')}`
    }
  }

  return { valid: true }
}

/**
 * Generate unique filename to prevent conflicts
 */
export function generateFileName(originalName: string): string {
  const timestamp = Date.now()
  const randomNum = Math.floor(Math.random() * 1000)
  const extension = originalName.split('.').pop()
  const nameWithoutExt = originalName.split('.').slice(0, -1).join('.')

  // Clean the filename
  const cleanName = nameWithoutExt
    .replace(/[^a-zA-Z0-9]/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50)

  return `${cleanName}-${timestamp}-${randomNum}.${extension}`
}

/**
 * Save uploaded file to disk
 */
export async function saveUploadedFile(file: File, subfolder: string = ''): Promise<{ success: boolean; filePath?: string; publicUrl?: string; error?: string }> {
  try {
    // Validate file
    const validation = validateFile(file)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    // Ensure uploads directory exists
    const targetDir = subfolder
      ? join(UPLOAD_CONFIG.uploadsDir, subfolder)
      : UPLOAD_CONFIG.uploadsDir

    if (!existsSync(targetDir)) {
      await mkdir(targetDir, { recursive: true })
    }

    // Generate unique filename
    const fileName = generateFileName(file.name)
    const filePath = join(targetDir, fileName)

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    await writeFile(filePath, buffer)

    // Generate public URL
    const publicUrl = subfolder
      ? `${UPLOAD_CONFIG.publicPath}/${subfolder}/${fileName}`
      : `${UPLOAD_CONFIG.publicPath}/${fileName}`

    return {
      success: true,
      filePath,
      publicUrl
    }
  } catch (error) {
    console.error('File upload error:', error)
    return {
      success: false,
      error: 'Failed to save uploaded file'
    }
  }
}

/**
 * Delete uploaded file
 */
export async function deleteUploadedFile(publicUrl: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!publicUrl.startsWith(UPLOAD_CONFIG.publicPath)) {
      return { success: false, error: 'Invalid file path' }
    }

    const relativePath = publicUrl.replace(UPLOAD_CONFIG.publicPath, '')
    const filePath = join(UPLOAD_CONFIG.uploadsDir, relativePath)

    if (existsSync(filePath)) {
      const { unlink } = await import('fs/promises')
      await unlink(filePath)
    }

    return { success: true }
  } catch (error) {
    console.error('File deletion error:', error)
    return {
      success: false,
      error: 'Failed to delete file'
    }
  }
}