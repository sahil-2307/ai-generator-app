'use client'

import { useState, useRef } from 'react'

export default function MediaUpload() {
  const [files, setFiles] = useState<File[]>([])
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = (fileList: FileList | null) => {
    if (fileList) {
      const newFiles = Array.from(fileList).filter(file =>
        file.type.startsWith('image/') || file.type.startsWith('video/')
      )
      setFiles(prev => [...prev, ...newFiles])
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleFiles(e.dataTransfer.files)
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Media Upload</h2>
        <p className="text-muted-foreground mb-6">
          Upload images or videos to use as context for text generation or reference for video creation.
        </p>

        {/* Upload Area */}
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${dragActive
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={(e) => handleFiles(e.target.files)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          <div className="space-y-2">
            <div className="text-4xl">📁</div>
            <div className="text-lg font-medium">
              Drop files here or click to upload
            </div>
            <div className="text-sm text-muted-foreground">
              Supports images and videos (JPG, PNG, MP4, MOV, etc.)
            </div>
            <button
              onClick={() => inputRef.current?.click()}
              className="mt-4 bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Choose Files
            </button>
          </div>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-4">Uploaded Files ({files.length})</h3>
            <div className="space-y-3">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/30"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">
                      {file.type.startsWith('image/') ? '🖼️' : '🎬'}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-foreground">{file.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatFileSize(file.size)} • {file.type}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {files.length > 0 && (
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={() => setFiles([])}
                  className="bg-muted text-muted-foreground py-2 px-4 rounded-md hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  Clear All
                </button>
                <button
                  className="bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  onClick={() => {
                    // This would typically upload files to a server
                    alert(`Ready to process ${files.length} files. In a real app, these would be uploaded to your server.`)
                  }}
                >
                  Process Files
                </button>
              </div>
            )}
          </div>
        )}

        {/* Usage Tips */}
        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
          <h4 className="font-medium mb-2">💡 Usage Tips</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Images can be used as context for text generation with vision models</li>
            <li>• Videos can serve as reference material for style and composition</li>
            <li>• Supported formats: JPG, PNG, GIF for images; MP4, MOV, AVI for videos</li>
            <li>• Maximum file size: 10MB per file</li>
          </ul>
        </div>
      </div>
    </div>
  )
}