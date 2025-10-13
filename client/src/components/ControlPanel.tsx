// src/components/ControlPanel.tsx

import { ReactNode } from 'react';

interface ControlPanelProps {
  cameraDirection: 'perspective' | 'front';
  onHandlePerspective: () => void;
  onHandleFront: () => void;
  onHandleFold?: () => void;
  foldingState?: '3d' | '2d' | 'folding' | 'unfolding';
  children?: ReactNode;
}

export default function ControlPanel({
  cameraDirection,
  onHandlePerspective,
  onHandleFront,
  onHandleFold,
  foldingState,
  children,
}: ControlPanelProps) {
  const isAnimating = foldingState === 'folding' || foldingState === 'unfolding';

  return (
    <div className="cameraControl">
      <div className="cameraDirection">
        <button
          className={`controlButton ${cameraDirection === 'perspective' ? 'active' : ''}`}
          onClick={onHandlePerspective}
          disabled={isAnimating}
        >
          Fold (3D)
        </button>

        <button
          className={`controlButton ${cameraDirection === 'front' ? 'active' : ''}`}
          onClick={onHandleFront}
          disabled={isAnimating}
        >
          Unfold (2D)
        </button>

        {onHandleFold && (
          <button
            className={`controlButton ${isAnimating ? 'active' : ''}`}
            onClick={onHandleFold}
            disabled={isAnimating}
          >
            {foldingState === '3d' || foldingState === 'folding'
              ? 'Unfold Animation'
              : 'Fold Animation'}
          </button>
        )}

        {children}
      </div>
    </div>
  );
}