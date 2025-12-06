"use client"

import { useState, useMemo } from "react"

export interface FilterConfig<T> {
  searchFields?: (keyof T)[]
  filters?: {
    [key: string]: {
      field: keyof T
      value: string | number | boolean
      match?: (item: T, value: any) => boolean
    }
  }
  customFilter?: (item: T) => boolean
}

/**
 * Hook para gerenciar filtros e busca em listas
 */
export function useFilters<T extends Record<string, any>>(
  items: T[],
  config?: FilterConfig<T>
) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState<Record<string, string>>({})

  const setFilter = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const clearFilters = () => {
    setSearchTerm("")
    setFilters({})
  }

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Busca por texto
      if (searchTerm && config?.searchFields) {
        const matchesSearch = config.searchFields.some((field) => {
          const value = item[field]
          if (typeof value === "string") {
            return value.toLowerCase().includes(searchTerm.toLowerCase())
          }
          if (Array.isArray(value)) {
            return value.some((v) =>
              String(v).toLowerCase().includes(searchTerm.toLowerCase())
            )
          }
          return false
        })
        if (!matchesSearch) return false
      }

      // Filtros específicos
      if (config?.filters) {
        for (const [key, filterConfig] of Object.entries(config.filters)) {
          const filterValue = filters[key]
          if (filterValue && filterValue !== "all") {
            if (filterConfig.match) {
              if (!filterConfig.match(item, filterValue)) return false
            } else {
              const itemValue = item[filterConfig.field]
              if (String(itemValue) !== String(filterValue)) return false
            }
          }
        }
      }

      // Filtro customizado
      if (config?.customFilter) {
        if (!config.customFilter(item)) return false
      }

      return true
    })
  }, [items, searchTerm, filters, config])

  return {
    searchTerm,
    setSearchTerm,
    filters,
    setFilter,
    clearFilters,
    filteredItems,
  }
}

