'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

// Deep comparison utility function
const isDeepEqual = (obj1: any, obj2: any): boolean => {
  if (obj1 === obj2) return true
  if (obj1 == null || obj2 == null) return obj1 === obj2
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return obj1 === obj2
  
  const keys1 = Object.keys(obj1)
  const keys2 = Object.keys(obj2)
  
  if (keys1.length !== keys2.length) return false
  
  for (const key of keys1) {
    if (!keys2.includes(key)) return false
    if (!isDeepEqual(obj1[key], obj2[key])) return false
  }
  
  return true
}

interface FieldConfig {
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'date' | 'hidden' | 'text-with-button' | 'conditional'
  label: string
  placeholder?: string
  required?: boolean
  options?: string[]
  buttonText?: string
  onButtonClick?: () => string
  validation?: {
    min?: number
    max?: number
    pattern?: RegExp
    custom?: (value: string) => string | null
  }
  // For conditional fields
  dependsOn?: string
  showWhen?: (formData: Record<string, any>) => boolean
  conditionalOptions?: (formData: Record<string, any>) => string[]
}

interface AutoFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Record<string, any>) => void
  editingData?: Record<string, any> | null
  title?: string
  description?: string
  fields: Record<string, FieldConfig>
  excludeFields?: string[]
  onFormDataChange?: (formData: Record<string, any>) => void
}

export default function AutoForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  editingData, 
  title,
  description,
  fields,
  excludeFields = ['id', 'createdAt', 'updatedAt'],
  onFormDataChange
}: AutoFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Refs to track previous values for deep comparison
  const prevEditingDataRef = useRef<Record<string, any> | null>(null)
  const prevFieldsRef = useRef<Record<string, FieldConfig>>({})
  const prevExcludeFieldsRef = useRef<string[]>([])
  const isInitializingRef = useRef(false)

  // Initialize form data with deep comparison to prevent infinite loops
  useEffect(() => {
    // Prevent recursive initialization
    if (isInitializingRef.current) return
    
    // Deep comparison checks to prevent unnecessary re-initialization
    const editingDataChanged = !isDeepEqual(editingData, prevEditingDataRef.current)
    const fieldsChanged = !isDeepEqual(fields, prevFieldsRef.current)
    const excludeFieldsChanged = !isDeepEqual(excludeFields, prevExcludeFieldsRef.current)
    
    // Only proceed if something actually changed
    if (!editingDataChanged && !fieldsChanged && !excludeFieldsChanged) {
      return
    }
    
    isInitializingRef.current = true
    
    try {
      if (editingData) {
        const filteredData = { ...editingData }
        excludeFields.forEach(field => delete filteredData[field])
        
        // Only update form data if it actually changed
        if (!isDeepEqual(filteredData, formData)) {
          setFormData(filteredData)
        }
      } else {
        const initialData: Record<string, any> = {}
        Object.keys(fields).forEach(key => {
          if (!excludeFields.includes(key)) {
            const field = fields[key]
            if (field.type === 'select') {
              initialData[key] = field.options?.[0] || ''
            } else if (field.type === 'date') {
              initialData[key] = new Date().toISOString().split('T')[0]
            } else {
              initialData[key] = ''
            }
          }
        })
        
        // Only update form data if it actually changed
        if (!isDeepEqual(initialData, formData)) {
          setFormData(initialData)
        }
      }
      
      // Only clear errors if they exist
      if (Object.keys(errors).length > 0) {
        setErrors({})
      }
      
      // Update refs for next comparison
      prevEditingDataRef.current = editingData
      prevFieldsRef.current = { ...fields }
      prevExcludeFieldsRef.current = [...excludeFields]
    } finally {
      isInitializingRef.current = false
    }
  }, [editingData, isOpen, fields, excludeFields, formData, errors])

  const validateField = (key: string, value: string): string | null => {
    const field = fields[key]
    if (!field) return null

    // Required validation
    if (field.required && (!value || value.trim() === '')) {
      return `${field.label} is required`
    }

    // Skip validation for empty optional fields
    if (!value || value.trim() === '') {
      return null
    }

    // Length validation
    if (field.validation?.min && value.length < field.validation.min) {
      return `${field.label} must be at least ${field.validation.min} characters`
    }

    if (field.validation?.max && value.length > field.validation.max) {
      return `${field.label} must be no more than ${field.validation.max} characters`
    }

    // Pattern validation
    if (field.validation?.pattern && !field.validation.pattern.test(value)) {
      return `Please enter a valid ${field.label.toLowerCase()}`
    }

    // Custom validation
    if (field.validation?.custom) {
      return field.validation.custom(value)
    }

    return null
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key])
      if (error) {
        newErrors[key] = error
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('⚠️ Validation Error', {
        description: 'Please fix errors in the form',
        duration: 3000
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      onSubmit(formData)
      onClose()
      
      toast.success(editingData ? '✅ Updated Successfully' : '✅ Added Successfully', {
        description: `Item has been ${editingData ? 'updated' : 'added'} successfully`,
        duration: 3000
      })
    } catch (error) {
      toast.error('❌ Error', {
        description: 'Failed to save. Please try again.',
        duration: 3000
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = useCallback((key: string, value: string) => {
    setFormData(prevFormData => {
      const newFormData = { ...prevFormData, [key]: value }
      
      // Only call parent callback if value actually changed
      if (onFormDataChange && !isDeepEqual(prevFormData[key], value)) {
        // Use setTimeout to break the synchronous update cycle
        setTimeout(() => {
          onFormDataChange(newFormData)
        }, 0)
      }
      
      // Clear error for this field if it exists
      if (errors[key]) {
        setErrors(prev => ({ ...prev, [key]: '' }))
      }
      
      return newFormData
    })
  }, [onFormDataChange, errors])

  const renderField = (key: string, field: FieldConfig) => {
    const value = formData[key] || ''
    const error = errors[key]

    // Hidden fields
    if (field.type === 'hidden') {
      return null
    }

    // Conditional fields - check if should be shown
    if (field.type === 'conditional' || field.dependsOn) {
      const shouldShow = field.showWhen ? field.showWhen(formData) : true
      if (!shouldShow) {
        return null
      }
    }

    // Get options for conditional fields
    let fieldOptions = field.options
    if (field.conditionalOptions && field.type === 'select') {
      fieldOptions = field.conditionalOptions(formData)
    }

    return (
      <div key={key} className="space-y-2">
        <Label htmlFor={key} className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </Label>

        {field.type === 'textarea' && (
          <Textarea
            id={key}
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleInputChange(key, e.target.value)}
            rows={3}
            className={error ? 'border-red-500' : ''}
          />
        )}

        {(field.type === 'select' || field.type === 'conditional') && (
          <Select value={value} onValueChange={(value) => handleInputChange(key, value)}>
            <SelectTrigger className={error ? 'border-red-500' : ''}>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {fieldOptions?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {(field.type === 'text' || field.type === 'email' || field.type === 'tel' || field.type === 'date') && (
          <Input
            id={key}
            type={field.type}
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleInputChange(key, e.target.value)}
            className={error ? 'border-red-500' : ''}
          />
        )}

        {field.type === 'text-with-button' && (
          <div className="flex gap-2">
            <Input
              id={key}
              type="text"
              placeholder={field.placeholder}
              value={value}
              onChange={(e) => handleInputChange(key, e.target.value)}
              className={error ? 'border-red-500' : ''}
            />
            {field.buttonText && field.onButtonClick && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const generatedValue = field.onButtonClick?.()
                  if (generatedValue) {
                    handleInputChange(key, generatedValue)
                  }
                }}
                className="px-3"
              >
                {field.buttonText}
              </Button>
            )}
          </div>
        )}

        {error && (
          <p className="text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {error}
          </p>
        )}
      </div>
    )
  }

  // Filter out excluded fields
  const visibleFields = Object.keys(fields).filter(key => !excludeFields.includes(key))

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  {editingData ? '✏️' : '➕'}
                </div>
                {title || (editingData ? 'Edit Item' : 'Add New Item')}
              </DialogTitle>
              <DialogDescription>
                {description || (editingData 
                  ? 'Update the information below' 
                  : 'Fill in the details to add a new item'
                )}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visibleFields.map(key => renderField(key, fields[key]))}
              </div>

              {/* Form Data Preview */}
              {(Object.keys(formData).length > 0) && (
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    Preview
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {Object.entries(formData).map(([key, value]) => {
                      if (fields[key]?.type === 'hidden') return null
                      return (
                        <div key={key}>
                          <span className="text-slate-500 dark:text-slate-400">
                            {fields[key]?.label || key}:
                          </span>
                          <p className="font-medium text-slate-900 dark:text-white truncate">
                            {value || 'Not provided'}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {editingData ? 'Updating...' : 'Adding...'}
                    </>
                  ) : (
                    <>
                      {editingData ? 'Update' : 'Add'}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  )
}