// src/components/Making.tsx

import React, { useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  PerspectiveCamera,
  OrbitControls,
  Center,
  Text3D,
} from '@react-three/drei';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';

import CameraControl from './CameraControl';

import '@/styles/TypeFold.css';

type CameraDirection = 'perspective' | 'front';

export default function Making() {
  const [cameraDirection, setCameraDirection] = useState<CameraDirection>('perspective');
  const [zoomLevel, setZoomLevel] = useState<number>(0);

  const sceneRef = useRef<THREE.Group>(null);

  return (
    <div className="container">
      <div className="canvasContainer">
        <ExportButton sceneRef={sceneRef} />
        <Canvas
          style={{ width: '100%', height: '100%' }}
          gl={{ preserveDrawingBuffer: true }}
        >
          <PerspectiveCamera makeDefault position={[10, 10, 10]} fov={10} />
          <CameraControl
            cameraDirection={cameraDirection}
          />
          <ambientLight intensity={2} />
          <spotLight
            position={[10, 10, 10]}
            angle={0.15}
            penumbra={1}
            intensity={1}
          />
          <pointLight position={[-10, -10, -10]} />
          
          <group ref={sceneRef}>
            <TextScene />
          </group>
          <OrbitControls />
        </Canvas>
      </div>
    </div>
  );
}

interface ExportButtonProps {
  sceneRef: React.RefObject<THREE.Group>;
}

const ExportButton: React.FC<ExportButtonProps> = ({ sceneRef }) => {
  const exportScene = () => {
    if (!sceneRef.current) return;

    const exporter = new GLTFExporter();
    exporter.parse(
      sceneRef.current,
      (gltf) => {
        const blob = new Blob([JSON.stringify(gltf)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = 'scene.gltf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        console.log('GLTF Export Complete');
      },
      (error) => {
        console.error('Export error:', error);
      },
      { binary: false }
    );
  };

  return (
    <button
      onClick={exportScene}
      style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 100 }}
    >
      Export GLTF
    </button>
  );
};

function TextScene() {
  const meshRef = useRef<THREE.Mesh>(null);

  return (
    <Center scale={[1, 1, 1]}>
      <Text3D
        position={[0, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[1, 1, 1]}
        ref={meshRef}
        size={1}
        font="/inter.json"
        curveSegments={24}
        bevelEnabled
        bevelSize={0}
        bevelThickness={0}
        height={0.5}
        lineHeight={0}
        letterSpacing={0}
      >
        {`A`}
      </Text3D>
    </Center>
  );
}