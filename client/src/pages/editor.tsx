// pages/editor.tsx

import Head from 'next/head'
import dynamic from 'next/dynamic'

// Canvas/Three.js 코드는 SSR 불가 → client-only 로드
const EditorScene = dynamic(() => import('@/components/EditorScene'), { ssr: false })

export default function Editor() {
  return (
    <>
      <Head>
        <title>TypoFold - SVG Extrude Editor</title>
        <meta name='description' content='Extrude SVG fills into 3D shapes' />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
      </Head>
      <div className='relative w-screen h-screen'>
        <EditorScene />
      </div>
    </>
  )
}
