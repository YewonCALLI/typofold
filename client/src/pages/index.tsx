// src/pages/index.tsx

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import Head from 'next/head';

// Three.js 컴포넌트는 SSR 비활성화
const TypeFold = dynamic(() => import('@/components/TypeFold'), {
  ssr: false,
  loading: () => (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '18px',
      fontFamily: 'sans-serif'
    }}>
      Loading TypoFold...
    </div>
  ),
});

export default function Home() {
  return (
    <>
      <Head>
        <title>TypoFold - 3D Typography Unfolding Tool</title>
        <meta name="description" content="Create 3D typography unfold patterns" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Suspense fallback={<div>Loading...</div>}>
        <TypeFold />
      </Suspense>
    </>
  );
}