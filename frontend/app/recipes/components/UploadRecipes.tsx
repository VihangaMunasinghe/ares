"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { MdClose, MdUpload, MdCheckCircle, MdError } from "react-icons/md"
import type { RecipeGridData } from "@/types/recipe"

interface UploadRecipesProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (data: RecipeGridData) => void
}

export function UploadRecipes({ isOpen, onClose, onUpload }: UploadRecipesProps) {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  if (!isOpen) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setStatus("idle")
      setErrorMessage("")
    }
  }

  const handleUpload = async () => {
    if (!file) return

    try {
      const text = await file.text()
      let data: RecipeGridData

      if (file.name.endsWith(".json")) {
        data = JSON.parse(text)
      } else if (file.name.endsWith(".csv")) {
        // Simple CSV parsing (in real app, use a proper CSV parser)
        setErrorMessage("CSV parsing not yet implemented. Please use JSON format.")
        setStatus("error")
        return
      } else {
        setErrorMessage("Unsupported file format. Please use JSON or CSV.")
        setStatus("error")
        return
      }

      // Basic validation
      if (!data.materials || !data.methods || !data.recipes) {
        setErrorMessage("Invalid data structure. Missing required fields.")
        setStatus("error")
        return
      }

      setStatus("success")
      setTimeout(() => {
        onUpload(data)
      }, 1000)
    } catch (error) {
      setErrorMessage("Failed to parse file. Please check the format.")
      setStatus("error")
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50">
        <Card className="p-6">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Upload Recipes</h2>
              <Button size="icon" variant="ghost" onClick={onClose}>
                <MdClose className="w-5 h-5" />
              </Button>
            </div>

            {/* File Input */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-foreground">Select CSV or JSON file</label>
              <input
                type="file"
                accept=".csv,.json"
                onChange={handleFileChange}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-primary-foreground file:cursor-pointer hover:file:bg-primary/90"
              />
              {file && <p className="text-sm text-muted-foreground">Selected: {file.name}</p>}
            </div>

            {/* Status Messages */}
            {status === "success" && (
              <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/50 rounded-lg">
                <MdCheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-sm text-green-400">File uploaded successfully!</span>
              </div>
            )}

            {status === "error" && (
              <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                <MdError className="w-5 h-5 text-red-400 mt-0.5" />
                <span className="text-sm text-red-400">{errorMessage}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button onClick={handleUpload} disabled={!file || status === "success"} className="flex-1 gap-2">
                <MdUpload className="w-4 h-4" />
                Upload
              </Button>
              <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </>
  )
}
