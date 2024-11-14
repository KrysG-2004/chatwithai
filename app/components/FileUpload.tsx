'use client'

import { useState, useRef } from 'react'

interface FileUploadProps {
  onFileSelect: (file: File) => void
}

export default function FileUpload({ onFileSelect }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    setShowUpload(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0])
      setShowUpload(false)
    }
  }

  const handleUploadClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // 直接触发文件选择
    fileInputRef.current?.click()
  }

  return (
    <div className="relative">
      {/* 加号按钮 */}
      <button
        onClick={() => setShowUpload(!showUpload)}
        className="p-2 hover:bg-indigo-500/10 rounded-lg transition-colors"
      >
        <svg 
          className="w-5 h-5 text-indigo-300" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 4v16m8-8H4" 
          />
        </svg>
      </button>

      {/* 上传区域 */}
      {showUpload && (
        <div className="absolute bottom-full left-0 mb-2 w-64 z-50">
          <div
            className={`
              border-2 border-dashed rounded-lg p-4 text-center
              transition-all duration-200 backdrop-blur-xl
              ${dragActive 
                ? 'border-indigo-500 bg-indigo-500/10' 
                : 'border-indigo-500/30 hover:border-indigo-500/50'
              }
              bg-black/60
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleChange}
              accept=".pdf,.doc,.docx,.txt"
            />
            <button
              onClick={handleUploadClick}
              className="w-full h-full text-indigo-300 cursor-pointer"
            >
              <svg 
                className="w-8 h-8 mx-auto mb-2" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                />
              </svg>
              <p className="text-sm">拖放文件到这里，或点击上传</p>
              <p className="text-xs text-indigo-300/70 mt-1">支持 PDF, DOC, TXT 等格式</p>
            </button>
          </div>
        </div>
      )}

      {/* 点击外部关闭上传区域 */}
      {showUpload && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setShowUpload(false)}
        />
      )}
    </div>
  )
} 