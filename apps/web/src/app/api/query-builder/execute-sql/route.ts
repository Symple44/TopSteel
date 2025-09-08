import { type NextRequest, NextResponse } from 'next/server'
import { callBackendFromApi } from '@/utils/backend-api'

export async function POST(request: NextRequest) {
  try {
    const body = await request?.json()
    const { sql, limit = 100 } = body || {}

    if (!sql) {
      return NextResponse?.json({ error: 'SQL query is required' }, { status: 400 })
    }

    // 🔒 Validation SQL basique pour éviter les accès inter-tenant
    const _sqlLower = sql?.toLowerCase().trim()

    const forbiddenPatterns = [
      /\btopsteel_auth\./i,
      /\buser_societes\b/i,
      /\bsocietes\b/i,
      /\busers\b/i,
      /\binformation_schema\b/i,
      /\bpg_/i,
      /\bdrop\b/i,
      /\bdelete\b/i,
      /\bupdate\b/i,
      /\binsert\b/i,
      /\balter\b/i,
      /\bcreate\b/i,
      /\btruncate\b/i,
    ]

    for (const pattern of forbiddenPatterns) {
      if (pattern?.test(sql)) {
        return NextResponse?.json(
          { error: 'Query contains forbidden operations or system tables' },
          { status: 400 }
        )
      }
    }

    // Appel au backend via l'utilitaire centralisé
    const response = await callBackendFromApi(request, 'query-builder/execute-sql', {
      method: 'POST',
      body: JSON.stringify({ sql, limit }),
    })

    if (response?.ok) {
      const responseData = await response?.json()
      const actualData = responseData?.data || responseData?.rows || responseData
      return NextResponse?.json(actualData)
    } else {
      const errorText = await response?.text()
      return NextResponse?.json(
        { error: `Backend responded with ${response?.status}: ${errorText}` },
        { status: response.status }
      )
    }
  } catch (error) {
    return NextResponse?.json(
      { error: error instanceof Error ? error.message : 'Connection failed' },
      { status: 503 }
    )
  }
}
