import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function GET() {
  try {
    // Ler o package.json para obter a versão
    const packageJsonPath = join(process.cwd(), 'package.json')
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
    
    const version = packageJson.version || '0.0.0'
    
    return NextResponse.json({
      ok: true,
      version: version,
      tag: `v${version}`
    })
  } catch (error) {
    console.error('Erro ao ler versão:', error)
    return NextResponse.json(
      {
        ok: false,
        version: '0.0.0',
        tag: 'v0.0.0',
        error: 'Não foi possível ler a versão'
      },
      { status: 500 }
    )
  }
}

