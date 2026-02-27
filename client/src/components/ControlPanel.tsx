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
    // cameraControl: absolute right-5 bottom-5 flex flex-col bg-white text-black p-[10px] z-[100]
    <div className="absolute right-5 bottom-5 flex flex-col bg-white text-black p-[10px] z-[100]">
      {/* cameraDirection: flex flex-col justify-center items-end w-full gap-[10px] */}
      <div className="flex flex-col justify-center items-end w-full gap-[10px]">
        {/* Button 1 — Fold (3D): purple */}
        <button
          className={`flex justify-center items-center w-[110px] h-fit px-4 py-2 bg-white cursor-pointer text-[16px] font-light rounded-[30px] border border-[#4c00ff] text-[#4c00ff] hover:bg-[#4c00ff] hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
            cameraDirection === 'perspective' ? 'bg-[#4c00ff] !text-white' : ''
          }`}
          onClick={onHandlePerspective}
          disabled={isAnimating}
        >
          Fold (3D)
        </button>

        {/* Button 2 — Unfold (2D): blue */}
        <button
          className={`flex justify-center items-center w-[110px] h-fit px-4 py-2 bg-white cursor-pointer text-[16px] font-light rounded-[30px] border border-[#00aaff] text-[#00aaff] hover:bg-[#00aaff] hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
            cameraDirection === 'front' ? 'bg-[#00aaff] !text-white' : ''
          }`}
          onClick={onHandleFront}
          disabled={isAnimating}
        >
          Unfold (2D)
        </button>

        {/* Button 3 — Fold Animation: pink (optional) */}
        {onHandleFold && (
          <button
            className={`flex justify-center items-center w-[110px] h-fit px-4 py-2 bg-white cursor-pointer text-[16px] font-light rounded-[30px] border border-[#ff00f2] text-[#ff00f2] hover:bg-[#ff00f2] hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              isAnimating ? 'bg-[#ff00f2] !text-white' : ''
            }`}
            onClick={onHandleFold}
            disabled={isAnimating}
          >
            {foldingState === '3d' || foldingState === 'folding'
              ? 'Unfold Animation'
              : 'Fold Animation'}
          </button>
        )}

        {/* children (e.g. Print button) */}
        {children}
      </div>
    </div>
  );
}