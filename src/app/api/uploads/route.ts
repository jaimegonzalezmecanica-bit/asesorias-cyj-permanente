import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No se encontró ningún archivo.' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const filename = `${Date.now()}-${file.name.replace(/ /g, '_')}`
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    const filePath = path.join(uploadDir, filename)

    // Ensure the upload directory exists
    // This is a simplified example, in a real app you'd handle directory creation more robustly
    // and potentially use a cloud storage solution like Vercel Blob, AWS S3, etc.
    // For now, we'll assume 'public/uploads' exists or can be created.
    // In a serverless environment like Vercel, writing to the filesystem directly is not persistent
    // and should only be used for temporary storage or during build time.
    // For production, a dedicated file storage service is required.
    
    await writeFile(filePath, buffer)

    const fileUrl = `/uploads/${filename}`
    return NextResponse.json({ url: fileUrl }, { status: 200 })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json({ error: 'Error al subir el archivo.' }, { status: 500 })
  }
}
