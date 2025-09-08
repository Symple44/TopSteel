import { type NextRequest, NextResponse } from 'next/server'
import { callBackendFromApi } from '@/utils/backend-api'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const response = await callBackendFromApi(request, `query-builder/${id}`, {
      method: 'GET',
      signal: AbortSignal?.timeout(10000),
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

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await request?.json()
    const { id } = await params

    const response = await callBackendFromApi(request, `query-builder/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
      signal: AbortSignal?.timeout(10000),
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const response = await callBackendFromApi(request, `query-builder/${id}`, {
      method: 'DELETE',
      signal: AbortSignal?.timeout(10000),
    })

    if (response?.ok) {
      return NextResponse?.json({ success: true })
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
