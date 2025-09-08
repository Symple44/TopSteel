'use client'

export const dynamic = 'force-dynamic'

import { Loader2 } from 'lucide-react'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { QueryBuilderInterface } from '@/components/query-builder/query-builder-interface'
import { callClientApi } from '@/utils/backend-api'

export default function QueryBuilderDetailPage() {
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [queryBuilder, setQueryBuilder] = useState(null)

  const fetchQueryBuilder = useCallback(async (id: string) => {
    try {
      const response = await callClientApi(`query-builder/${id}`)
      if (response?.ok) {
        const data = await response?.json()
        setQueryBuilder(data)
      }
    } catch (_error) {
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (params?.id && params?.id !== 'new') {
      fetchQueryBuilder(params?.id as string)
    } else {
      setLoading(false)
    }
  }, [params?.id, fetchQueryBuilder])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return <QueryBuilderInterface queryBuilderId={params?.id as string} initialData={queryBuilder} />
}
