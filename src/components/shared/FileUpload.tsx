'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { UploadCloud, FileText, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  onFileSelected?: (file: File | null) => void
  onFileUpload?: (file: File) => Promise<string | null>
  onFileRemove?: (url: string) => Promise<boolean>
  currentFiles?: string[]
  maxFiles?: number
  accept?: Record<string, string[]>
  label?: string
  description?: string
}

export default function FileUpload(props: FileUploadProps) {
  const {
    onFileSelected,
    onFileUpload,
    onFileRemove,
    currentFiles = [],
    maxFiles = 1,
    accept,
    label,
    description = 'Arrastra y suelta archivos aquí, o haz click para seleccionar',
  } = props

  const [uploading, setUploading] = useState(false)
  const [displayFiles, setDisplayFiles] = useState<string[]>(currentFiles)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setDisplayFiles(currentFiles)
  }, [currentFiles])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) {
      setError('Tipo de archivo no soportado.')
      return
    }
    if (displayFiles.length + acceptedFiles.length > maxFiles) {
      setError(`Solo se permiten ${maxFiles} archivo(s).`)
      return
    }

    setError(null)

    if (onFileSelected) {
      const file = acceptedFiles[0]
      onFileSelected(file)
      setDisplayFiles([file.name])
      return
    }

    if (onFileUpload) {
      setUploading(true)
      const uploadedUrls: string[] = []
      for (const file of acceptedFiles) {
        try {
          const url = await onFileUpload(file)
          if (url) {
            uploadedUrls.push(url)
          } else {
            setError(`Error al subir ${file.name}.`)
          }
        } catch (err) {
          console.error('Error uploading file:', err)
          setError(`Error al subir ${file.name}.`)
        }
      }
      setDisplayFiles(prev => [...prev, ...uploadedUrls])
      setUploading(false)
    }
  }, [onFileSelected, onFileUpload, displayFiles.length, maxFiles])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles: maxFiles - displayFiles.length,
    disabled: uploading || displayFiles.length >= maxFiles,
  })

  const handleRemoveFile = async (fileIdentifier: string) => {
    if (onFileSelected) {
      onFileSelected(null)
      setDisplayFiles([])
      return
    }

    if (onFileRemove) {
      try {
        const success = await onFileRemove(fileIdentifier)
        if (success) {
          setDisplayFiles(prev => prev.filter(f => f !== fileIdentifier))
        } else {
          setError('Error al eliminar el archivo.')
        }
      } catch (err) {
        console.error('Error removing file:', err)
        setError('Error al eliminar el archivo.')
      }
    } else {
      // Fallback for removing from local state if onFileRemove is not provided
      setDisplayFiles(prev => prev.filter(f => f !== fileIdentifier))
    }
  }

  return (
    <div className="space-y-3">
      {label && <p className="text-sm font-medium text-slate-700">{label}</p>}
      
      <div
        {...getRootProps()}
        className={cn(
          "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors",
          "cursor-pointer",
          isDragActive ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-slate-50 hover:border-slate-400",
          (uploading || displayFiles.length >= maxFiles) && "cursor-not-allowed opacity-60"
        )}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        ) : (
          <UploadCloud className="h-8 w-8 text-slate-400" />
        )}
        <p className="mt-2 text-sm text-slate-600">
          {isDragActive ? 'Suelta los archivos aquí...' : description}
        </p>
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      </div>

      {displayFiles.length > 0 && (
        <div className="space-y-2">
          {displayFiles.map((fileIdentifier, index) => (
            <div key={index} className="flex items-center justify-between rounded-md bg-slate-100 p-3">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-slate-500" />
                <span className="text-sm font-medium text-slate-700 truncate">
                  {onFileSelected ? fileIdentifier : fileIdentifier.split('/').pop()}
                </span>
              </div>
              <button 
                onClick={() => handleRemoveFile(fileIdentifier)}
                className="text-slate-400 hover:text-red-500 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
