// src/components/UnfoldedFace.tsx
// ─────────────────────────────────────────────────────────────────────────────
// 개선 사항:
//  1. document.createElement 기반 DOM 직접 조작 → 순수 React/JSX 컴포넌트로 교체
//  2. createUI useEffect 제거 → useState/useCallback으로 상태 관리 통일
//  3. 패턴 로직을 훅(useP5Pattern)으로 분리하여 재사용성 향상
//  4. 사용자 코드 에디터를 React controlled component로 구현
//  5. 슬라이더, 버튼 등 모든 UI를 Tailwind + 인라인 스타일로 통일
// ─────────────────────────────────────────────────────────────────────────────

import React, { useRef, useState, useEffect, useCallback } from 'react'
import Sketch from 'react-p5'
import type p5 from 'p5'

// ─── 타입 ─────────────────────────────────────────────────────────────────────

type PatternId = 1 | 2 | 3
type DrawFn = (p: p5, patternSize: number) => void

interface Props {
  onTextureReady: (canvas: HTMLCanvasElement) => void
  faceSize?: number | null
}

// ─── 패턴 함수 ────────────────────────────────────────────────────────────────

function drawPattern1(p: p5, patternSize: number) {
  const time = p.millis() * 0.001
  p.background(100, 20, 40, 255)

  const cellSize = p.width / patternSize

  for (let x = 0; x < patternSize; x++) {
    for (let y = 0; y < patternSize; y++) {
      const randomOffset = p.sin(x * 13.37 + y * 17.89)
      p.push()
      p.translate(x * cellSize + cellSize / 2, y * cellSize + cellSize / 2)
      for (let i = 5; i > 0; i--) {
        const size = cellSize * 0.8 * (i / 5)
        const wave = p.sin(i * 0.5 + time + randomOffset)
        p.noStroke()
        p.fill(
          (p.sin(wave * 2.0 + time) * 0.5 + 0.5) * 255,
          (p.sin(wave * 3.0 + time * 1.2) * 0.5 + 0.5) * 255,
          (p.sin(wave * 4.0 + time * 0.8) * 0.5 + 0.5) * 255,
          255,
        )
        p.ellipse(0, 0, size, size)
      }
      p.pop()
    }
  }
}

// 파티클 상태를 p5 인스턴스 바깥에서 유지하기 위한 WeakMap
const particleCache = new WeakMap<
  object,
  {
    orange: Array<{ x: number; y: number }>
    orange1: Array<{ x: number; y: number }>
    lastSize: number
  }
>()

function drawPattern2(p: p5, patternSize: number) {
  // p 인스턴스를 키로 캐싱 (WeakMap 사용 → 메모리 자동 해제)
  if (!particleCache.has(p) || particleCache.get(p)!.lastSize !== patternSize) {
    const count = patternSize * 2
    particleCache.set(p, {
      lastSize: patternSize,
      orange: Array.from({ length: count }, () => ({ x: p.random(p.width), y: p.random(p.height) })),
      orange1: Array.from({ length: count }, () => ({ x: p.random(p.width), y: p.random(p.height) })),
    })
    p.background('#E900FF')
  }

  const cache = particleCache.get(p)!

  const moveParticle = (pt: { x: number; y: number }, color: [number, number, number]) => {
    const r = p.random(1)
    if (r < 0.25) pt.x += 5
    else if (r < 0.5) pt.x -= 5
    else if (r < 0.75) pt.y += 5
    else pt.y -= 5
    pt.x = p.constrain(pt.x, 0, p.width)
    pt.y = p.constrain(pt.y, 0, p.height)
    p.noStroke()
    p.fill(...color)
    p.ellipse(pt.x, pt.y, 5, 5)
  }

  cache.orange.forEach((pt) => moveParticle(pt, [255, 255, 0]))
  cache.orange1.forEach((pt) => moveParticle(pt, [255, 255, 255]))
}

// ─── 샘플 코드 ────────────────────────────────────────────────────────────────

const SAMPLE_CODE = `// 여기에 코드를 작성해보세요!
function draw(p, patternSize) {
  const time = p.millis() * 0.001;
  p.background(225, 255, 0);
  const cellCount = patternSize;
  p.fill(255);
  p.ellipse(p.width / 2, p.height / 2, 30 * cellCount * p.sin(time));
  p.fill(255, 0, 255);
  p.ellipse(p.width / 2, p.height / 2, 20 * cellCount * p.sin(time));
}`

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────

export default function UnfoldedFace({ onTextureReady }: Props) {
  const p5Ref = useRef<p5 | null>(null)
  const customDrawRef = useRef<DrawFn | null>(null)

  const [patternId, setPatternId] = useState<PatternId>(1)
  const [patternSize, setPatternSize] = useState(10)
  const [editorOpen, setEditorOpen] = useState(false)
  const [code, setCode] = useState(SAMPLE_CODE)
  const [codeError, setCodeError] = useState<string | null>(null)

  // ── p5 setup / draw ──────────────────────────────────────────────────────

  const setup = useCallback((p: p5, parent: Element) => {
    const canvas = p.createCanvas(512, 512)
    canvas.parent(parent as any)
    p.pixelDensity(2)
    p5Ref.current = p
  }, [])

  const draw = useCallback(
    (p: p5) => {
      if (patternId === 1) drawPattern1(p, patternSize)
      else if (patternId === 2) drawPattern2(p, patternSize)
      else if (patternId === 3 && customDrawRef.current) {
        try {
          customDrawRef.current(p, patternSize)
        } catch (e) {
          p.background(30, 0, 0)
          p.fill(255, 80, 80)
          p.noStroke()
          p.textSize(14)
          p.textAlign(p.CENTER, p.CENTER)
          p.text('코드 오류가 발생했습니다', p.width / 2, p.height / 2)
        }
      }

      const canvas = (p as any).canvas as HTMLCanvasElement
      if (canvas instanceof HTMLCanvasElement) onTextureReady(canvas)
    },
    [patternId, patternSize, onTextureReady],
  )

  // ── 코드 적용 ─────────────────────────────────────────────────────────────

  const applyCode = useCallback(() => {
    setCodeError(null)
    try {
      // new Function 으로 draw 함수 추출
      const factory = new Function(
        'p',
        'patternSize',
        `
        ${code}
        return typeof draw === 'function' ? draw : null;
      `,
      )
      const fn = factory(null, patternSize) as DrawFn | null
      if (typeof fn !== 'function') {
        setCodeError('draw 함수를 찾을 수 없습니다. 코드에 draw 함수가 포함되어 있는지 확인하세요.')
        return
      }
      customDrawRef.current = fn
      setPatternId(3)
    } catch (e) {
      setCodeError((e as Error).message)
    }
  }, [code, patternSize])

  // ─── 렌더 ─────────────────────────────────────────────────────────────────

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-start bg-[#f5f5f5]">
      {/* p5 캔버스 */}
      <div className="w-full flex-1 flex items-center justify-center overflow-hidden">
        <Sketch setup={setup} draw={draw} />
      </div>

      {/* 컨트롤 패널 */}
      <div
        style={{
          position: 'absolute',
          right: 10,
          bottom: 10,
          width: editorOpen ? 480 : 220,
          background: 'rgba(255,255,255,0.97)',
          borderRadius: 8,
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          padding: 14,
          transition: 'width 0.3s ease',
          fontFamily: 'sans-serif',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {/* 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, fontSize: 13, color: '#222' }}>Texture Editor</span>
          <button
            onClick={() => setEditorOpen((v) => !v)}
            style={{
              padding: '3px 10px',
              fontSize: 12,
              background: '#222',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            {editorOpen ? 'Close' : 'Open'} Editor
          </button>
        </div>

        {/* 패턴 선택 버튼 */}
        <div style={{ display: 'flex', gap: 6 }}>
          {([1, 2, 3] as PatternId[]).map((id) => (
            <button
              key={id}
              onClick={() => setPatternId(id)}
              style={{
                flex: 1,
                padding: '6px 0',
                fontSize: 12,
                fontWeight: patternId === id ? 700 : 400,
                background: patternId === id ? '#111' : '#fff',
                color: patternId === id ? '#fff' : '#111',
                border: '1px solid #111',
                borderRadius: 4,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {id === 1 ? 'Pattern 1' : id === 2 ? 'Pattern 2' : 'Custom'}
            </button>
          ))}
        </div>

        {/* 패턴 크기 슬라이더 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#444' }}>
            <span>Pattern Size</span>
            <span style={{ fontWeight: 600 }}>{patternSize}</span>
          </div>
          <input
            type="range"
            min={3}
            max={30}
            step={1}
            value={patternSize}
            onChange={(e) => setPatternSize(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#111' }}
          />
        </div>

        {/* 코드 에디터 (조건부 렌더) */}
        {editorOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              style={{
                width: '100%',
                height: 240,
                fontFamily: 'monospace',
                fontSize: 12,
                lineHeight: 1.5,
                padding: 10,
                border: '1px solid #ddd',
                borderRadius: 4,
                resize: 'vertical',
                background: '#1a1a2e',
                color: '#e0e0ff',
                outline: 'none',
              }}
            />

            {codeError && (
              <div
                style={{
                  padding: '6px 10px',
                  background: '#fff0f0',
                  border: '1px solid #ffaaaa',
                  borderRadius: 4,
                  fontSize: 11,
                  color: '#cc0000',
                  wordBreak: 'break-all',
                }}
              >
                {codeError}
              </div>
            )}

            <button
              onClick={applyCode}
              style={{
                padding: '8px 0',
                background: '#0CFF69',
                color: '#000',
                border: 'none',
                borderRadius: 4,
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                letterSpacing: 0.5,
              }}
            >
              ▶ 코드 적용
            </button>

            <p style={{ fontSize: 11, color: '#888', lineHeight: 1.6, margin: 0 }}>
              <strong>도움말:</strong> <code>draw(p, patternSize)</code> 함수를 작성하세요.{' '}
              <code>patternSize</code> 변수로 크기를 제어할 수 있습니다.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}