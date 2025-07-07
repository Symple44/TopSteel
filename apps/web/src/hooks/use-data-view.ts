'use client'

import { useState, useCallback } from 'react'

type DataView = 'grid' | 'table'

export function useDataView(defaultView: DataView = 'grid') {
  const [dataView, setDataView] = useState<DataView>(defaultView)

  const _toggleView = useCallback(() => {
    setDataView(prev => prev === 'grid' ? 'table' : 'grid')
  }, [])

  const _setView = useCallback((view: DataView) => {
    setDataView(view)
  }, [])

  return {
    dataView,
    setDataView: setView,
    toggleView
  }
}

