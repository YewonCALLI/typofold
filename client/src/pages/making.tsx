// src/pages/making.tsx

import dynamic from 'next/dynamic';
import Head from 'next/head';

// Three.js 컴포넌트는 SSR 비활성화
const Making = dynamic(() => import('@/components/Making'), {
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
      Loading Making Tool...
    </div>
  ),
});

export default function MakingPage() {
  return (
    <>
      <Head>
        <title>Making - TypoFold</title>
        <meta name="description" content="Create your 3D typography" />
      </Head>
      <Making />
    </>
  );
}