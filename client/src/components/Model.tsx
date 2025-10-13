// src/components/Model.tsx

import { useRef } from 'react';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import * as THREE from 'three';

interface ModelProps {
  gltf: GLTF;
}

export default function Model({ gltf }: ModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  return <primitive ref={groupRef} object={gltf.scene} />;
}