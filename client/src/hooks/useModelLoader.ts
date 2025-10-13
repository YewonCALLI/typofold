// src/hooks/useModelLoader.ts

import { useEffect, useState } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';

export default function useModelLoader(fileURL: string | null): GLTF | null {
  const [gltf, setGltf] = useState<GLTF | null>(null);

  useEffect(() => {
    if (!fileURL) {
      setGltf(null);
      return;
    }

    const loader = new GLTFLoader();
    loader.load(
      fileURL,
      (loadedGltf) => {
        setGltf(loadedGltf);
      },
      undefined,
      (error) => {
        console.error('Error loading model:', error);
        setGltf(null);
      }
    );
  }, [fileURL]);

  return gltf;
}