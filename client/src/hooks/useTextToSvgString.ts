// hooks/useTextToSvgString.ts
// opentype.js를 사용해 텍스트를 SVG 마크업 문자열로 변환

import { useState, useEffect } from 'react'

interface Options {
  fontUrl?: string
  fontSize?: number
  fill?: string
}

/**
 * 입력된 텍스트를 opentype.js로 파싱해 SVG 문자열을 반환한다.
 * 폰트 로딩 및 변환은 클라이언트에서만 실행된다.
 */
export function useTextToSvgString(text: string, options: Options = {}) {
  const { fontUrl = '/fonts/kenpixel.ttf', fontSize = 72, fill = 'white' } = options

  const [svgString, setSvgString] = useState<string | null>(null)

  useEffect(() => {
    if (!text.trim()) {
      setSvgString(null)
      return
    }

    let cancelled = false

    async function generate() {
      try {
        // opentype.js는 클라이언트 전용 dynamic import
        const opentype = await import('opentype.js')

        const buffer = await fetch(fontUrl).then((r) => r.arrayBuffer())
        const font = (opentype as any).parse(buffer)

        const path = font.getPath(text, 0, 0, fontSize)
        const bbox = path.getBoundingBox()

        // 유효한 path가 없으면 null 유지
        if (bbox.x1 === Infinity) return

        const pad = fontSize * 0.05
        const x1 = bbox.x1 - pad
        const y1 = bbox.y1 - pad
        const w = bbox.x2 - bbox.x1 + pad * 2
        const h = bbox.y2 - bbox.y1 + pad * 2

        const svg = [
          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x1} ${y1} ${w} ${h}">`,
          `  <path d="${path.toPathData(4)}" fill="${fill}"/>`,
          `</svg>`,
        ].join('\n')

        if (!cancelled) setSvgString(svg)
      } catch (e) {
        console.error('[useTextToSvgString]', e)
      }
    }

    generate()
    return () => {
      cancelled = true
    }
  }, [text, fontUrl, fontSize, fill])

  return svgString
}
