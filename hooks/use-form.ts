"use client"

import { useState, useCallback } from "react"

interface UseFormOptions<T> {
  initialValues: T
  onSubmit?: (values: T) => Promise<void> | void
  validate?: (values: T) => Partial<Record<keyof T, string>>
}

/**
 * Hook para gerenciamento de formulários
 */
export function useForm<T extends Record<string, any>>(options: UseFormOptions<T>) {
  const { initialValues, onSubmit, validate } = options
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const setValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }))
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }, [errors])

  const setFieldValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValue(field, value)
    setTouched((prev) => ({ ...prev, [field]: true }))
  }, [setValue])

  const handleChange = useCallback(
    <K extends keyof T>(field: K) => (value: T[K]) => {
      setFieldValue(field, value)
    },
    [setFieldValue]
  )

  const handleBlur = useCallback(<K extends keyof T>(field: K) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    if (validate) {
      const fieldErrors = validate(values)
      if (fieldErrors[field]) {
        setErrors((prev) => ({ ...prev, [field]: fieldErrors[field] }))
      }
    }
  }, [values, validate])

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
  }, [initialValues])

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault()

      // Validação
      if (validate) {
        const validationErrors = validate(values)
        if (Object.keys(validationErrors).length > 0) {
          setErrors(validationErrors)
          setTouched(
            Object.keys(validationErrors).reduce(
              (acc, key) => ({ ...acc, [key]: true }),
              {} as Partial<Record<keyof T, boolean>>
            )
          )
          return
        }
      }

      if (!onSubmit) return

      setIsSubmitting(true)
      setErrors({})

      try {
        await onSubmit(values)
      } catch (error) {
        console.error("Erro ao submeter formulário:", error)
        setErrors({
          _form: error instanceof Error ? error.message : "Erro ao submeter formulário",
        } as Partial<Record<keyof T, string>>)
      } finally {
        setIsSubmitting(false)
      }
    },
    [values, validate, onSubmit]
  )

  return {
    values,
    errors,
    touched,
    isSubmitting,
    setValue,
    setFieldValue,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
  }
}

