// src/types/components.d.ts

import type p5 from 'p5';
import * as THREE from 'three';

// p5 관련 타입 확장
export interface ExtendedP5 extends p5 {
  orange?: Array<{
    x: number;
    y: number;
    move: () => void;
  }>;
  orange1?: Array<{
    x: number;
    y: number;
    move: () => void;
  }>;
  x3?: number;
  y3?: number;
  lastPatternSize?: number;
  [key: string]: any;
}

// 공통 컴포넌트 Props
export type CameraDirection = 'perspective' | 'front';

export interface CameraControlProps {
  cameraDirection: CameraDirection;
  zoomLevel?: number;
}

export interface ControlPanelProps {
  cameraDirection: CameraDirection;
  onHandlePerspective: () => void;
  onHandleFront: () => void;
  onHandleFold?: () => void;
  foldingState?: '3d' | '2d' | 'folding' | 'unfolding';
  children?: React.ReactNode;
}

export interface ModelProps {
  gltf: import('three/examples/jsm/loaders/GLTFLoader').GLTF;
}

// Texture Editor Props
export interface TextureEditorProps {
  onTextureReady: (canvas: HTMLCanvasElement) => void;
  faceSize?: number | null;
}

// Custom Draw Function Type
export type CustomDrawFunction = (p: ExtendedP5, patternSize: number) => void;

// Export Button Props
export interface ExportButtonProps {
  sceneRef: React.RefObject<THREE.Group>;
}

// Interaction Handler Props
export interface InteractionHandlerProps {
  setSelectedFace: (intersect: THREE.Intersection | null) => void;
  setHoveredFace: (intersect: THREE.Intersection | null) => void;
}