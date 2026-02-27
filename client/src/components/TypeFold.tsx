// src/components/TypeFold.tsx

import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import {
  PerspectiveCamera,
  OrbitControls,
  MapControls,
} from '@react-three/drei';
import * as THREE from 'three';
import { useRouter } from 'next/router';

import Model from './Model';
import UnfoldedFace from './UnfoldedFace';
import useModelLoader from '@/hooks/useModelLoader';
import { unfoldModelWithEdges, createFaceGroups } from '@/utils/geometryUtils';
import CameraControl from './CameraControl';
import ControlPanel from './ControlPanel';
import { AlphabetModel, FaceGroup } from '@/types/three';

export default function TypeFold() {
  const router = useRouter();
  const [cameraDirection, setCameraDirection] = useState<'perspective' | 'front'>('perspective');
  const [faceGroups, setFaceGroups] = useState<FaceGroup[] | null>(null);
  const [groupedGeometry, setGroupedGeometry] = useState<THREE.BufferGeometry | null>(null);

  const alphabets: AlphabetModel[] = [
    { type: 'A', path: '/models/a.gltf' },
    { type: 'B', path: '/models/b.gltf' },
    { type: 'C', path: '/models/c.gltf' },
    { type: 'D', path: '/models/d.gltf' },
    { type: 'E', path: '/models/e.gltf' },
    { type: 'F', path: '/models/f.gltf' },
    { type: 'G', path: '/models/g.gltf' },
    { type: 'H', path: '/models/h.gltf' },
    { type: 'I', path: '/models/i.gltf' },
    { type: 'J', path: '/models/j.gltf' },
    { type: 'K', path: '/models/k.gltf' },
    { type: 'L', path: '/models/l.gltf' },
    { type: 'M', path: '/models/m.gltf' },
    { type: 'N', path: '/models/n.gltf' },
    { type: 'O', path: '/models/o.gltf' },
    { type: 'P', path: '/models/p.gltf' },
    { type: 'Q', path: '/models/q.gltf' },
    { type: 'R', path: '/models/r.gltf' },
    { type: 'S', path: '/models/s.gltf' },
    { type: 'T', path: '/models/t.gltf' },
    { type: 'U', path: '/models/u.gltf' },
    { type: 'V', path: '/models/v.gltf' },
    { type: 'W', path: '/models/w.gltf' },
    { type: 'X', path: '/models/x.gltf' },
    { type: 'Y', path: '/models/y.gltf' },
    { type: 'Z', path: '/models/z.gltf' },
  ];

  const [unfoldedTexture, setUnfoldedTexture] = useState<THREE.CanvasTexture | null>(null);
  const [fileURL, setFileURL] = useState<string | null>(null);
  const [currentType, setCurrentType] = useState<AlphabetModel | null>(null);

  const faceMeshesRef = useRef<THREE.Mesh[]>([]);
  const gltf = useModelLoader(fileURL);

  const [unfoldCount, setUnfoldCount] = useState(0);

  const handleUnfold = () => {
    if (unfoldCount < 1) {
      if (gltf) {
        faceMeshesRef.current = [];
        gltf.scene.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            unfoldModelWithEdges(child as THREE.Mesh, faceMeshesRef, unfoldedTexture);
            setCameraDirection('front');
          }
        });
        setUnfoldCount(unfoldCount + 1);
      }
    } else {
      faceMeshesRef.current.forEach((mesh) => {
        if (mesh.material && (mesh.material as THREE.MeshBasicMaterial).map !== unfoldedTexture) {
          (mesh.material as THREE.MeshBasicMaterial).map = unfoldedTexture;
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((mat) => (mat.needsUpdate = true));
          } else {
            mesh.material.needsUpdate = true;
          }
        }
      });
    }
  };

  const handleTextureReady = (canvas: HTMLCanvasElement) => {
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    setUnfoldedTexture(texture);
  };

  useEffect(() => {
    if (gltf && unfoldedTexture) {
      gltf.scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          const { faceGroups: groups, geometry } = createFaceGroups(mesh);
          setFaceGroups(groups);
          setGroupedGeometry(geometry);

          mesh.geometry = geometry;
          mesh.material = new THREE.MeshBasicMaterial({
            map: unfoldedTexture,
            side: THREE.DoubleSide,
          });

          mesh.material.needsUpdate = true;
        }
      });
    }
  }, [gltf, unfoldedTexture]);

  const resetMeshes = () => {
    faceMeshesRef.current.forEach((mesh) => {
      if (mesh.parent) {
        mesh.parent.remove(mesh);
      }
    });
    faceMeshesRef.current = [];
  };

  const handleResetToInitialState = () => {
    if (!fileURL) return;

    faceMeshesRef.current.forEach((mesh) => {
      if (mesh.parent) {
        mesh.parent.remove(mesh);
      }
    });
    faceMeshesRef.current = [];

    setUnfoldCount(0);
    setUnfoldedTexture(null);
    setCameraDirection('perspective');

    setFileURL(null);
    setTimeout(() => {
      const alphabet = alphabets.find((a) => a.type === currentType?.type);
      if (alphabet) {
        setFileURL(alphabet.path);
      }
    }, 0);
  };

  useEffect(() => {
    if (fileURL) {
      resetMeshes();
      setCameraDirection('perspective');
      setUnfoldCount(0);
    }
  }, [fileURL]);

  return (
    // container: relative flex flex-row w-screen h-screen
    <div className="relative flex flex-row w-screen h-screen">
      {/* header: fixed top-0 left-0 w-full px-[30px] py-[15px] flex flex-row justify-between items-center z-[100] */}
      <div className="fixed top-0 left-0 w-full px-[30px] py-[15px] flex flex-row justify-between items-center z-[100]">
        <button
          className="w-fit h-[50px] font-light text-center text-[40px] bg-black"
          style={{ WebkitTextFillColor: 'transparent', WebkitBackgroundClip: 'text' }}
          onClick={() => router.push('/')}
        >
          TypoFold
        </button>
        <button
          className="flex justify-center items-center w-fit h-fit py-2 cursor-pointer text-[20px] font-light hover:opacity-50 transition-opacity"
          onClick={() => router.push('/about')}
        >
          About Project
        </button>
      </div>

      {/* canvasContainer: flex-1 relative */}
      <div className="flex-1 relative">
        {/* controlContainer: absolute left-5 bottom-5 text-black p-[10px] z-[100] */}
        <div className="absolute left-5 bottom-5 text-black p-[10px] z-[100]">
          <div className="text-[16px] text-center font-extralight pb-[15px]">
            Choose an alphabet!
          </div>
          <div className="flex w-[200px] flex-wrap justify-center items-center gap-[10px]">
            {alphabets.map((alphabet) => (
              <button
                key={alphabet.type}
                style={
                  fileURL === alphabet.path
                    ? { backgroundColor: '#000', color: '#fff' }
                    : {}
                }
                className="flex justify-center items-center w-[35px] h-[35px] px-[13px] py-2 border border-black text-black cursor-pointer text-[18px] font-light rounded-[60px] hover:bg-black hover:text-white transition-colors"
                onClick={() => {
                  if (currentType?.type === alphabet.type) {
                    setFileURL(null);
                    setTimeout(() => setFileURL(alphabet.path), 0);
                  } else {
                    setCurrentType(alphabet);
                    setFileURL(alphabet.path);
                  }
                }}
              >
                {alphabet.type}
              </button>
            ))}
          </div>
        </div>

        <ControlPanel
          cameraDirection={cameraDirection}
          onHandlePerspective={handleResetToInitialState}
          onHandleFront={() => {
            setCameraDirection('front');
            handleUnfold();
          }}
        >
          <button id="captureButton" className="flex justify-center items-center w-[110px] h-fit px-4 py-2 bg-white cursor-pointer text-[16px] font-light rounded-[30px] border border-[#ff00f2] text-[#ff00f2] hover:bg-[#ff00f2] hover:text-white transition-colors">
            Print 🖨️
          </button>
        </ControlPanel>

        <Canvas
          style={{ width: '100%', height: '100%' }}
          gl={{
            preserveDrawingBuffer: true,
            antialias: true,
            alpha: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 0.8,
          }}
        >
          <PerspectiveCamera makeDefault position={[10, 10, 10]} fov={10} />
          <CameraControl cameraDirection={cameraDirection} />
          <ambientLight intensity={0.7} color="#e0e0ff" />
          <spotLight
            position={[10, 10, 10]}
            angle={0.15}
            penumbra={1}
            intensity={7.6}
            color="#fff9f0"
          />
          <pointLight position={[0, 0, 0]} intensity={0.4} color="#e0f0ff" />

          <Scene gltf={gltf} />
          {cameraDirection === 'perspective' ? (
            <OrbitControls />
          ) : (
            <MapControls enableDamping={false} enableRotate={false} />
          )}
        </Canvas>
      </div>

      {/* unfoldedCanvas: flex-1 relative bg-[#f5f5f5] */}
      {/* On mobile: absolute top-5 right-5 w-[50vw] h-[50vw] overflow-hidden */}
      <div
        id="unfoldedCanvas"
        className="flex-1 relative bg-[#f5f5f5] max-md:absolute max-md:top-5 max-md:right-5 max-md:w-[50vw] max-md:h-[50vw] max-md:overflow-hidden"
      >
        <UnfoldedFace
          onTextureReady={handleTextureReady}
          faceSize={faceGroups ? faceGroups[0].size : null}
        />
      </div>
    </div>
  );
}

interface SceneProps {
  gltf: ReturnType<typeof useModelLoader>;
}

const Scene: React.FC<SceneProps> = ({ gltf }) => {
  const { gl } = useThree();

  useEffect(() => {
    const printButton = document.getElementById('captureButton');

    const handlePrint = () => {
      const link = document.createElement('a');
      link.setAttribute('download', 'canvas.png');
      link.setAttribute(
        'href',
        gl.domElement
          .toDataURL('image/png')
          .replace('image/png', 'image/octet-stream'),
      );
      link.click();
    };

    if (printButton) {
      printButton.addEventListener('click', handlePrint);
      return () => {
        printButton.removeEventListener('click', handlePrint);
      };
    }
  }, [gl]);

  return <>{gltf && <Model gltf={gltf} />}</>;
};