// components/EditorScene.tsx

import { Suspense, useRef, useState } from 'react'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import SvgExtrude from './SvgExtrude'
import { useTextToSvgString } from '@/hooks/useTextToSvgString'

export default function EditorScene() {
  const [wireframe, setWireframe] = useState(false)
  const [text, setText] = useState('Hello')
  const exportGroupRef = useRef<THREE.Group>(null)

  const handleExportGLTF = (binary: boolean) => {
    if (!exportGroupRef.current) return

    const exporter = new GLTFExporter()
    exporter.parse(
      exportGroupRef.current,
      (result) => {
        const [blob, filename] =
          result instanceof ArrayBuffer
            ? [new Blob([result], { type: 'model/gltf-binary' }), `${text || 'model'}.glb`]
            : [new Blob([JSON.stringify(result)], { type: 'model/gltf+json' }), `${text || 'model'}.gltf`]

        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.click()
        URL.revokeObjectURL(url)
      },
      (_error) => {
        /* export failed silently */
      },
      { binary },
    )
  }

  // 텍스트 → SVG 문자열 변환 (opentype.js, 클라이언트 전용)
  const svgString = useTextToSvgString(text, {
    fontUrl: '/fonts/Pretendard-Bold.otf',
    fontSize: 72,
    fill: 'white',
  })

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* 텍스트 입력 UI */}
      <div
        style={{
          position: 'absolute',
          bottom: 32,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          display: 'flex',
          gap: 8,
        }}>
        <input
          type='checkbox'
          id='wireframe-toggle'
          className='hidden'
          onChange={(e) => setWireframe(e.target.checked)}
        />
        <label
          htmlFor='wireframe-toggle'
          className='text-black text-sm px-3 py-1 border cursor-pointer select-none flex justify-center items-center'>
          {wireframe ? 'Wireframe On' : 'Wireframe Off'}
        </label>

        <input
          type='text'
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='Type something...'
          className='text-white text-lg px-5 py-2 placeholder:text-white/50 bg-black/30 focus:outline-none focus:bg-black/50'
        />
        <button
          onClick={() => setText('')}
          className='text-white text-lg px-4 py-2 bg-red-500 hover:bg-red-600 focus:outline-none'>
          Clear
        </button>
        <button
          onClick={() => handleExportGLTF(false)}
          className='bg-blue-400 px-4 py-2 text-lg text-white hover:bg-blue-500 focus:outline-none'>
          Export GLTF
        </button>
      </div>

      {/* Three.js Canvas */}
      <Canvas
        style={{ width: '100%', height: '100%' }}
        gl={{
          preserveDrawingBuffer: true,
          antialias: true,
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.8,
        }}
        shadows>
        <PerspectiveCamera makeDefault position={[5, 5, 5]} fov={30} />
        <ambientLight intensity={0.5} color='#ffffff' />
        <spotLight position={[300, 300, 300]} angle={0.2} penumbra={1} intensity={8} color='#fff9f0' castShadow />
        <pointLight position={[-200, -150, 150]} intensity={2} color='#e0f0ff' />

        {/* svgString이 준비되면 즉시 렌더 (Suspense 불필요) */}
        <group ref={exportGroupRef}>
          {svgString && (
            <SvgExtrude
              svgString={svgString}
              depth={10}
              scale={0.01} // SVG 원본 크기가 너무 크므로 균등 스케일링 적용
              color='#ffffff'
              bevelEnabled={false}
              metalness={0.15}
              roughness={0.35}
              wireframe={wireframe}
            />
          )}
        </group>
        <OrbitControls makeDefault />
      </Canvas>
    </div>
  )
}
