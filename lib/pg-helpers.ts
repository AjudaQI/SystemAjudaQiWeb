// Helper functions for PostgreSQL queries
// PostgreSQL retorna nomes de colunas em minúsculas por padrão

export function mapColumnsToUpperCase<T extends Record<string, any>>(obj: T): any {
  const result: any = {}
  for (const [key, value] of Object.entries(obj)) {
    // Converter para uppercase para manter compatibilidade com código existente
    result[key.toUpperCase()] = value
  }
  return result
}

export function toCamelCaseKeys<T extends Record<string, any>>(obj: T): any {
  const result: any = {}
  for (const [key, value] of Object.entries(obj)) {
    // Converter para uppercase para manter compatibilidade com código existente
    result[key.toUpperCase()] = value
  }
  return result
}

export function mapRows<T>(rows: any[]): T[] {
  return rows.map(row => toCamelCaseKeys(row)) as T[]
}

