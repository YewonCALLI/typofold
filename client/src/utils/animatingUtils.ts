// src/utils/animatingUtils.ts

import * as THREE from 'three';
import { GroupMeshInfo } from '@/types/three';

export const createAnimationMeshes = (
  originalMesh: THREE.Mesh,
  groups: any[]
): GroupMeshInfo[] => {
  return groups.map(group => {
    const groupGeometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const originalVertices: number[] = [];
    const indices: number[] = [];
    let vertexIndex = 0;

    const uniqueVertices = new Set<string>();
    const center = new THREE.Vector3();
    
    group.faces.forEach((faceIndex: number) => {
      for (let i = 0; i < 3; i++) {
        const idx = faceIndex * 3 + i;
        const vertex = new THREE.Vector3().fromBufferAttribute(
          originalMesh.geometry.attributes.position,
          idx
        );
        const vertexKey = `${vertex.x},${vertex.y},${vertex.z}`;
        if (!uniqueVertices.has(vertexKey)) {
          uniqueVertices.add(vertexKey);
          center.add(vertex);
        }
      }
    });
    center.divideScalar(uniqueVertices.size);

    const startOffset = group.type === 'side' ? 1 : 2;

    group.faces.forEach((faceIndex: number) => {
      for (let i = 0; i < 3; i++) {
        const idx = faceIndex * 3 + i;
        const vertex = new THREE.Vector3().fromBufferAttribute(
          originalMesh.geometry.attributes.position,
          idx
        );

        originalVertices.push(vertex.x, vertex.y, vertex.z);

        const toCenter = vertex.clone().sub(center);
        const direction = toCenter.normalize();
        const startPos = center.clone().add(direction.multiplyScalar(startOffset));

        vertices.push(startPos.x, startPos.y, startPos.z);
        indices.push(vertexIndex);
        vertexIndex++;
      }
    });

    groupGeometry.setAttribute('position', 
      new THREE.Float32BufferAttribute(vertices, 3));
    groupGeometry.setAttribute('originalPosition', 
      new THREE.Float32BufferAttribute(originalVertices, 3));
    groupGeometry.setIndex(indices);

    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(Math.random(), Math.random(), Math.random()),
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(groupGeometry, material);
    mesh.groupCenter = center;
    mesh.userData.isTemporaryGroupMesh = true;

    if (originalMesh.parent) {
      originalMesh.parent.add(mesh);
    }
    
    return {
      mesh,
      center,
      originalVertices: originalVertices
    };
  });
};

export const animateToOriginal = (
  groupMeshes: GroupMeshInfo[],
  duration: number = 1.0
): Promise<void> => {
  return new Promise((resolve) => {
    const startTime = performance.now();

    const animate = () => {
      const currentTime = performance.now();
      const elapsed = (currentTime - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      
      const eased = 1 - Math.pow(1 - progress, 3);

      groupMeshes.forEach(({ mesh, center }) => {
        const positions = mesh.geometry.attributes.position;
        const originalPositions = mesh.geometry.attributes.originalPosition;

        const scale = 1 - eased;
        
        for (let i = 0; i < positions.count; i++) {
          const originalPos = new THREE.Vector3(
            originalPositions.getX(i),
            originalPositions.getY(i),
            originalPositions.getZ(i)
          );

          const toOriginal = originalPos.clone().sub(center);
          const direction = toOriginal.normalize();
          
          const currentPos = center.clone().add(toOriginal.multiplyScalar(scale + 1));
          
          positions.setXYZ(i, currentPos.x, currentPos.y, currentPos.z);
        }
        
        positions.needsUpdate = true;
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        groupMeshes.forEach(({ mesh }) => {
          if (mesh.parent) {
            mesh.parent.remove(mesh);
          }
          mesh.geometry.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach(m => m.dispose());
          } else {
            mesh.material.dispose();
          }
        });
        resolve();
      }
    };

    animate();
  });
};