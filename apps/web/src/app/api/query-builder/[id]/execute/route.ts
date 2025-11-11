import { type NextRequest, NextResponse } from 'next/server'
import { callBackendFromApi } from '../../../../../utils/backend-api'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await request?.json()
    const { id } = await params

    const response = await callBackendFromApi(request, `query-builder/${id}/execute`, {
      method: 'POST',
      body: JSON.stringify(body),
    })

    if (response?.ok) {
      const responseData = await response?.json()
      const actualData = responseData?.data || responseData
      return NextResponse?.json(actualData)
    } else {
      return NextResponse?.json(
        { error: `Backend responded with ${response?.status}: ${response?.statusText}` },
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
