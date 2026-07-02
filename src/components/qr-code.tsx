'use client'

import { useRef, useEffect } from 'react'

interface QRCodeProps {
  value: string
  size?: number
  bgColor?: string
  fgColor?: string
  className?: string
}

export function QRCode({ value, size = 200, bgColor = '#ffffff', fgColor = '#000000', className = '' }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = size
    canvas.height = size
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, size, size)

    const modules = generateQRMatrix(value)
    const moduleSize = size / modules.length

    ctx.fillStyle = fgColor
    for (let row = 0; row < modules.length; row++) {
      for (let col = 0; col < modules[row].length; col++) {
        if (modules[row][col]) {
          ctx.fillRect(col * moduleSize, row * moduleSize, moduleSize, moduleSize)
        }
      }
    }
  }, [value, size, bgColor, fgColor])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: size, height: size }}
    />
  )
}

function generateQRMatrix(text: string): boolean[][] {
  const size = 21
  const matrix: boolean[][] = Array(size).fill(null).map(() => Array(size).fill(false))

  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 7; col++) {
      if (row === 0 || row === 6 || col === 0 || col === 6 || (row >= 2 && row <= 4 && col >= 2 && col <= 4)) {
        matrix[row][col] = true
      }
    }
  }

  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 7; col++) {
      if (row === 0 || row === 6 || col === 0 || col === 6 || (row >= 2 && row <= 4 && col >= 2 && col <= 4)) {
        matrix[size - 7 + row][col] = true
      }
    }
  }

  const hash = simpleHash(text)
  for (let i = 0; i < 30; i++) {
    const row = (hash + i * 7) % size
    const col = (hash + i * 13) % size
    if (row >= 8 && col >= 8) {
      matrix[row][col] = !matrix[row][col]
    }
  }

  return matrix
}

function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash) % 21
}