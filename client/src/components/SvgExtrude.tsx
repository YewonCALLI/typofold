// components/SvgExtrude.tsx
// SVG의 fill된 path를 ExtrudeGeometry로 3D Extrude하는 컴포넌트

import { useMemo } from 'react'
import { useLoader } from '@react-three/fiber'
import * as THREE from 'three'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js'

// SVGLoader.parse() 반환 타입 (three.js 내부 타입과 동일)
type SVGData = ReturnType<SVGLoader['parse']>

interface SharedProps {
  depth?: number
  /** geometry 전체 균등 스케일 (GLTF export 시 실제 버텍스 크기에 반영됨) */
  scale?: number
  /** fill 색상 오버라이드. 없으면 SVG 원본 fill 색상 사용 */
  color?: string
  bevelEnabled?: boolean
  bevelThickness?: number
  bevelSize?: number
  bevelSegments?: number
  metalness?: number
  roughness?: number
  wireframe?: boolean
}

export interface SvgExtrudeProps extends SharedProps {
  /** SVG 파일 경로 (public 폴더 기준). src 또는 svgString 중 하나 필수 */
  src?: string
  /** SVG 마크업 문자열. 제공 시 src보다 우선 */
  svgString?: string
}

// ─── 공통 렌더러 ────────────────────────────────────────────────────────────

interface ExtrudeRendererProps extends SharedProps {
  svgData: SVGData
}

function ExtrudeRenderer({
  svgData,
  depth = 4,
  scale = 1,
  color,
  bevelEnabled = false,
  bevelThickness = 0.3,
  bevelSize = 0.15,
  bevelSegments = 4,
  metalness = 0.1,
  roughness = 0.4,
  wireframe = false,
}: ExtrudeRendererProps) {
  const { meshDefs, center } = useMemo(() => {
    const meshDefs: { geometry: THREE.ExtrudeGeometry; color: THREE.Color }[] = []
    const totalBox = new THREE.Box3()

    // SVG Y↓ 보정(scale Y -1) 후 XZ 평면에 눕히기(X축 -90° 회전) + 균등 스케일을 geometry에 bake-in
    // 결과: face가 XZ 평면, extrude 방향이 Y축(위), 버텍스 크기가 GLTF에 그대로 반영
    const flipY = new THREE.Matrix4().makeScale(scale, -scale, scale)
    const rotX = new THREE.Matrix4().makeRotationX(-Math.PI / 2)
    const bakeMatrix = new THREE.Matrix4().multiplyMatrices(rotX, flipY)

    svgData.paths.forEach((path) => {
      const rawFill = path.userData?.style?.fill as string | undefined
      if (!rawFill || rawFill === 'none') return

      const fillColor =
        color != null
          ? new THREE.Color(color)
          : rawFill === 'currentColor'
          ? new THREE.Color('#ffffff')
          : new THREE.Color(rawFill)

      SVGLoader.createShapes(path).forEach((shape) => {
        const geometry = new THREE.ExtrudeGeometry(shape, {
          depth,
          bevelEnabled,
          bevelThickness,
          bevelSize,
          bevelSegments,
        })
        geometry.applyMatrix4(bakeMatrix)
        geometry.computeBoundingBox()
        if (geometry.boundingBox) totalBox.union(geometry.boundingBox)
        meshDefs.push({ geometry, color: fillColor })
      })
    })

    const center = new THREE.Vector3()
    if (!totalBox.isEmpty()) totalBox.getCenter(center)

    return { meshDefs, center }
  }, [svgData, depth, scale, color, bevelEnabled, bevelThickness, bevelSize, bevelSegments])

  return (
    <group position={[-center.x, -center.y, -center.z]}>
      {meshDefs.map(({ geometry, color: meshColor }, i) => (
        <mesh key={i} geometry={geometry} castShadow receiveShadow>
          <meshStandardMaterial
            color={meshColor}
            metalness={metalness}
            roughness={roughness}
            side={THREE.DoubleSide}
            wireframe={wireframe}
          />
        </mesh>
      ))}
    </group>
  )
}

// ─── URL 로딩 (Suspense 필요) ────────────────────────────────────────────────

function SvgExtrudeFromUrl({ src, ...rest }: SharedProps & { src: string }) {
  const svgData = useLoader(SVGLoader as Parameters<typeof useLoader>[0], src) as SVGData
  return <ExtrudeRenderer svgData={svgData} {...rest} />
}

// ─── SVG 문자열 파싱 (Suspense 불필요) ──────────────────────────────────────

function SvgExtrudeFromString({ svgString, ...rest }: SharedProps & { svgString: string }) {
  const svgData = useMemo(() => {
    const loader = new SVGLoader()
    return loader.parse(svgString)
  }, [svgString])

  return <ExtrudeRenderer svgData={svgData} {...rest} />
}

// ─── 공개 API ────────────────────────────────────────────────────────────────

export default function SvgExtrude({ src, svgString, ...rest }: SvgExtrudeProps) {
  if (svgString) return <SvgExtrudeFromString svgString={svgString} {...rest} />
  if (src) return <SvgExtrudeFromUrl src={src} {...rest} />
  return null
}
