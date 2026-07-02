'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface UseVirtualizationOptions {
  itemCount: number
  itemHeight: number
  containerHeight: number
  overscan?: number
}

interface UseVirtualizationReturn {
  visibleItems: { index: number; offsetTop: number }[]
  totalHeight: number
  scrollToIndex: (index: number) => void
  containerRef: React.RefObject<HTMLDivElement | null>
}

export function useVirtualization({
  itemCount,
  itemHeight,
  containerHeight,
  overscan = 5,
}: UseVirtualizationOptions): UseVirtualizationReturn {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const totalHeight = itemCount * itemHeight

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    itemCount - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  )

  const visibleItems = []
  for (let i = startIndex; i <= endIndex; i++) {
    visibleItems.push({
      index: i,
      offsetTop: i * itemHeight,
    })
  }

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop)
    }
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

  const scrollToIndex = useCallback(
    (index: number) => {
      if (containerRef.current) {
        const scrollTop = index * itemHeight
        containerRef.current.scrollTop = scrollTop
      }
    },
    [itemHeight]
  )

  return {
    visibleItems,
    totalHeight,
    scrollToIndex,
    containerRef,
  }
}

interface VirtualListProps<T> {
  items: T[]
  itemHeight: number
  containerHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  keyExtractor: (item: T, index: number) => string
  className?: string
}

export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  keyExtractor,
  className = '',
}: VirtualListProps<T>) {
  const { visibleItems, totalHeight, containerRef } = useVirtualization({
    itemCount: items.length,
    itemHeight,
    containerHeight,
  })

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ index, offsetTop }) => (
          <div
            key={keyExtractor(items[index], index)}
            style={{
              position: 'absolute',
              top: offsetTop,
              left: 0,
              right: 0,
              height: itemHeight,
            }}
          >
            {renderItem(items[index], index)}
          </div>
        ))}
      </div>
    </div>
  )
}