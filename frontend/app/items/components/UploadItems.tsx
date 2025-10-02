"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { MdUpload, MdCheckCircle, MdError } from "react-icons/md"

interface UploadItemsProps {
  open: boolean
  onClose: () => void
  onUpload: (items: any[]) => void
}

export function UploadItems({ open, onClose, onUpload }: UploadItemsProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<any[]>([])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      // Mock preview
      setPreview([
        { name: "Sample Item 1", status: "valid" },
        { name: "Sample Item 2", status: "warning" },
      ])
    }
  }

  const handleUpload = () => {
    onUpload(preview)
    onClose()
    setFile(null)
    setPreview([])
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Items</DialogTitle>
          <DialogDescription>Upload a CSV or JSON file to import multiple items at once</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <MdUpload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <input type="file" accept=".csv,.json" onChange={handleFileChange} className="hidden" id="file-upload" />
            <label htmlFor="file-upload">
              <Button variant="outline" className="cursor-pointer bg-transparent" asChild>
                <span>Choose File</span>
              </Button>
            </label>
            {file && <p className="text-sm text-muted-foreground mt-2">{file.name}</p>}
          </div>

          {preview.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Preview ({preview.length} items)</h3>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {preview.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-secondary rounded">
                    <span className="text-sm">{item.name}</span>
                    {item.status === "valid" ? (
                      <MdCheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <MdError className="w-4 h-4 text-yellow-400" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={!file}>
              Import Items
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
