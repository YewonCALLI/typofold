// src/types/three.d.ts

import * as THREE from 'three';

export interface FaceGroup {
  faces: number[];
  normal: THREE.Vector3;
  type: 'top' | 'bottom' | 'side' | null;
  center: THREE.Vector3;
  vertices: THREE.Vector3[];
  connectedGroups: ConnectedGroup[];
  boundingBox?: THREE.Box3;
  size?: number;
}

export interface ConnectedGroup {
  group: FaceGroup;
  edge: SharedEdge;
}

export interface SharedEdge {
  start: THREE.Vector3;
  end: THREE.Vector3;
  normal1: THREE.Vector3;
  normal2: THREE.Vector3;
}

export interface AlphabetModel {
  type: string;
  path: string;
}

export interface GroupMeshInfo {
  mesh: THREE.Mesh;
  center: THREE.Vector3;
  originalVertices: number[];
}

export interface MeshUserData {
  isBaseMesh?: boolean;
  connections?: Array<{
    childMesh: THREE.Mesh;
    foldAxis: THREE.Vector3;
    foldAngle: number;
  }>;
  originalPosition?: THREE.Vector3 | { x: number; y: number; z: number };
  originalRotation?: THREE.Euler | { x: number; y: number; z: number };
  originalQuaternion?: THREE.Quaternion;
  groupType?: 'top' | 'bottom' | 'side';
  foldAxis?: THREE.Vector3;
  foldAngle?: number;
  parentMesh?: THREE.Mesh;
  objectType?: 'group' | 'mesh';
  isTemporaryGroupMesh?: boolean;
}

declare module 'three' {
  interface Mesh {
    userData: MeshUserData;
    groupCenter?: THREE.Vector3;
  }
  
  interface Group {
    userData: MeshUserData;
  }
}