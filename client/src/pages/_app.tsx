// src/pages/_app.tsx

import { useRef } from 'react';
import type { AppProps } from 'next/app';
import Header from '@/config';
import Frame from '@/components/dom/Frame';
import '@/styles/index.css';
import '@/styles/TypeFold.css';  // ✅ 추가

interface CustomPageProps {
  title?: string;
}

export default function App({ 
  Component, 
  pageProps 
}: AppProps<CustomPageProps>) {
  const ref = useRef<HTMLDivElement>(null);
  
  return (
    <>
      <Header title={pageProps?.title || 'Home'} />

      <Frame ref={ref}>
        <Component {...pageProps} />
      </Frame>
    </>
  );
}