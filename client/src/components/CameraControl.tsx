// src/components/CameraControl.tsx

import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';

interface CameraControlProps {
  cameraDirection: 'perspective' | 'front';
}

export default function CameraControl({ cameraDirection }: CameraControlProps) {
  const { camera } = useThree();

  useEffect(() => {
    const distance = 10;

    switch (cameraDirection) {
      case 'perspective':
        camera.position.set(distance, distance, distance);
        camera.up.set(0, 1, 0);
        break;
      case 'front':
        camera.position.set(0, 0, distance * 1.5);
        camera.rotation.set(0, 0, 0);
        camera.up.set(0, 1, 1);
        break;
      default:
        camera.position.set(distance, distance, distance);
        camera.up.set(0, 1, 0);
        break;
    }

    camera.updateProjectionMatrix();
  }, [camera, cameraDirection]);

  return null;
}