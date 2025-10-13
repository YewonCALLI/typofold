// src/components/UnfoldedFace.tsx

import React, { useRef, useState, useEffect } from 'react';
import Sketch from 'react-p5';
import type p5 from 'p5';

interface P5TextureEditorProps {
  onTextureReady: (canvas: HTMLCanvasElement) => void;
  faceSize?: number | null;
}

// 사용자 정의 draw 함수 타입
type CustomDrawFunction = (p: p5, patternSize: number) => void;

export default function P5TextureEditor({ onTextureReady }: P5TextureEditorProps) {
  const p5Ref = useRef<p5 | null>(null);
  const sketchRef = useRef<CustomDrawFunction | null>(null);
  const [currentPattern, setCurrentPattern] = useState<number>(1);
  const [editorVisible, setEditorVisible] = useState<boolean>(false);
  const [editorCode, setEditorCode] = useState<string>('');
  const [patternSize, setPatternSize] = useState<number>(10);
  
  const drawPattern1 = (p5: p5) => {
    const time = p5.millis() * 0.001;
    
    p5.background(20, 20, 40, 255);
    
    const scale = patternSize;
    const cellSize = p5.width / scale;
    
    for (let x = 0; x < scale; x++) {
      for (let y = 0; y < scale; y++) {
        const posX = x * cellSize;
        const posY = y * cellSize;
        
        const randomOffset = p5.sin(x * 13.37 + y * 17.89);
        
        p5.push();
        p5.translate(posX + cellSize/2, posY + cellSize/2, 0);
        
        for (let i = 5; i > 0; i--) {
          const size = (cellSize * 0.8) * (i / 5);
          
          const wavePhase = p5.sin(i * 0.5 + time + randomOffset);
          
          const r = p5.sin(wavePhase * 2.0 + time) * 0.5 + 0.5;
          const g = p5.sin(wavePhase * 3.0 + time * 1.2) * 0.5 + 0.5;
          const b = p5.sin(wavePhase * 4.0 + time * 0.8) * 0.5 + 0.5;
          
          p5.noStroke();
          p5.fill(r * 255, g * 255, b * 255,1);
          p5.ellipse(0, 0, size, size);
        }
        
        p5.pop();
      }
    }
  };

  const drawPattern2 = (p5Instance: p5) => {
    const extP5 = p5Instance as any;
    
    if (!extP5.orange || extP5.lastPatternSize !== patternSize) {
      extP5.orange = [];
      extP5.orange1 = [];
      extP5.x3 = p5Instance.random(400);
      extP5.y3 = p5Instance.random(400);
      extP5.lastPatternSize = patternSize;
      
      const particleCount = patternSize * 2;
      
      for (let i = 0; i < particleCount; i++) {
        extP5.orange[i] = {
          x: p5Instance.random(0, p5Instance.width),
          y: p5Instance.random(0, p5Instance.height),
          move: function(this: { x: number; y: number }) {
            const r = p5Instance.random(1);
            
            if (r < 0.25) {
              this.x = this.x + 5;
            } else if (r < 0.5) {
              this.x = this.x - 5;
            } else if (r < 0.75) {
              this.y = this.y + 5;
            } else {
              this.y = this.y - 5;
            }
            
            this.x = p5Instance.constrain(this.x, 0, p5Instance.width);
            this.y = p5Instance.constrain(this.y, 0, p5Instance.height);
            
            p5Instance.noStroke();
            p5Instance.fill(255, 255, 0);
            p5Instance.ellipse(this.x, this.y, 5, 5);
          }
        };
      }
      
      for (let i = 0; i < particleCount; i++) {
        extP5.orange1[i] = {
          x: p5Instance.random(0, p5Instance.width),
          y: p5Instance.random(0, p5Instance.height),
          move: function(this: { x: number; y: number }) {
            const r = p5Instance.random(1);
            
            if (r < 0.25) {
              this.x = this.x + 5;
            } else if (r < 0.5) {
              this.x = this.x - 5;
            } else if (r < 0.75) {
              this.y = this.y + 5;
            } else {
              this.y = this.y - 5;
            }
            
            this.x = p5Instance.constrain(this.x, 0, p5Instance.width);
            this.y = p5Instance.constrain(this.y, 0, p5Instance.height);
            
            p5Instance.noStroke();
            p5Instance.fill(255);
            p5Instance.ellipse(this.x, this.y, 5);
          }
        };
      }
      
      p5Instance.background('#E900FF');
    }
    
    if (extP5.orange) {
      for (let i = 0; i < extP5.orange.length; i++) {
        extP5.orange[i].move();
      }
    }
    
    if (extP5.orange1) {
      for (let i = 0; i < extP5.orange1.length; i++) {
        extP5.orange1[i].move();
      }
    }
  };

  const sampleCustomCode = `// 여기에 코드를 작성해 보세요!
function draw(p, patternSize) {
  const time = p.millis() * 0.001;
  p.background(225, 255, 0);
  const cellCount = patternSize;
  p.fill(255);

  p.ellipse(p.width/2, p.height/2, 30*cellCount * p.sin(time));

  p.fill(255, 0, 255);

  p.ellipse(p.width/2, p.height/2, 20*cellCount * p.sin(time));
}`;

  useEffect(() => {
    setEditorCode(sampleCustomCode);
  }, []);

  const setup = (p5: p5, canvasParentRef: Element) => {
    const canvas = p5.createCanvas(512, 512);
    canvas.parent(canvasParentRef as any);
    p5.pixelDensity(2);
    p5Ref.current = p5;
    
    createUI();
  };

  const draw = (p5: p5) => {
    if (currentPattern === 1) {
      drawPattern1(p5);
    } else if (currentPattern === 2) {
      drawPattern2(p5);
    } else if (currentPattern === 3 && sketchRef.current) {
      try {
        sketchRef.current(p5, patternSize);
      } catch (e) {
        console.error('사용자 코드 실행 오류:', e);
        p5.background(255, 0, 0, 30);
        p5.fill(255);
        p5.textSize(16);
        p5.textAlign(p5.CENTER, p5.CENTER);
        p5.text('코드 오류가 발생했습니다', p5.width/2, p5.height/2);
      }
    }
    
    if (onTextureReady) {
      const canvas = (p5 as any).canvas as HTMLCanvasElement;
      if (canvas instanceof HTMLCanvasElement) {
        onTextureReady(canvas);
      }
    }
  };
  
  const createUI = () => {
    const existingUI = document.getElementById('p5EditorUI');
    if (existingUI) {
      existingUI.remove();
    }
    
    const container = document.createElement('div');
    container.id = 'p5EditorUI';
    container.style.cssText = `
      position: absolute;
      right: 10px;
      bottom: 10px;
      width: 750px;
      background-color: rgba(255, 255, 255, 0.95);
      padding: 10px;
      border-radius: 5px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      z-index: 100;
      transition: width 0.3s ease;
      font-family: sans-serif;
    `;
    
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      border-bottom: 1px solid #ccc;
      padding-bottom: 10px;
    `;
    
    const toggleButton = document.createElement('button');
    toggleButton.textContent = editorVisible ? 'Close Editor' : 'Open Editor';
    toggleButton.style.cssText = `
      padding: 5px 10px;
      background-color: #333;
      color: white;
      border: none;
      border-radius: 3px;
      cursor: pointer;
      font-size: 12px;
    `;
    toggleButton.onclick = () => {
      setEditorVisible(!editorVisible);
    };
    
    header.appendChild(toggleButton);
    container.appendChild(header);
    
    const patternContainer = document.createElement('div');
    patternContainer.style.cssText = `
      display: flex;
      gap: 10px;
      margin-bottom: 10px;
    `;
    
    const createPatternButton = (label: string, patternNumber: number): HTMLButtonElement => {
      const button = document.createElement('button');
      button.textContent = label;
      button.style.cssText = `
        flex: 1;
        padding: 8px;
        font-size: 14px;
        background-color: ${currentPattern === patternNumber ? '#000' : '#fff'};
        color: ${currentPattern === patternNumber ? '#fff' : '#000'};
        border: 1px solid #000;
        border-radius: 3px;
        cursor: pointer;
      `;
      button.onclick = () => {
        setCurrentPattern(patternNumber);
      };
      return button;
    };
    
    const pattern1Button = createPatternButton('Pattern 1', 1);
    const pattern2Button = createPatternButton('Pattern 2', 2);
    const customCodeButton = createPatternButton('Edit here', 3);
    
    patternContainer.appendChild(pattern1Button);
    patternContainer.appendChild(pattern2Button);
    patternContainer.appendChild(customCodeButton);
    container.appendChild(patternContainer);
    
    const sliderContainer = document.createElement('div');
    sliderContainer.style.cssText = `
      margin-bottom: 15px;
    `;
    
    const sliderLabel = document.createElement('div');
    sliderLabel.textContent = 'Pattern Size: ' + patternSize;
    sliderLabel.style.cssText = `
      margin-bottom: 5px;
      font-size: 14px;
    `;
    
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '3';
    slider.max = '30';
    slider.step = '0.01';
    slider.value = patternSize.toString();
    slider.style.cssText = `
      width: 100%;
      height: 10px;
    `;
    
    slider.oninput = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const newSize = parseInt(target.value, 10);
      setPatternSize(newSize);
      sliderLabel.textContent = 'Pattern Size: ' + newSize;
    };
    
    sliderContainer.appendChild(sliderLabel);
    sliderContainer.appendChild(slider);
    container.appendChild(sliderContainer);
    
    if (editorVisible) {
      const editorArea = document.createElement('div');
      
      const textArea = document.createElement('textarea');
      textArea.value = editorCode;
      textArea.style.cssText = `
        width: 100%;
        height: 300px;
        font-family: monospace;
        font-size: 12px;
        padding: 8px;
        margin-bottom: 10px;
        border-radius: 3px;
        border: 1px solid #ccc;
        resize: vertical;
      `;
      
      const applyButton = document.createElement('button');
      applyButton.textContent = '코드 적용';
      applyButton.style.cssText = `
        width: 100%;
        padding: 8px;
        font-size: 14px;
        background-color: #0CFF69;
        color: black;
        border: none;
        border-radius: 3px;
        cursor: pointer;
        margin-bottom: 10px;
      `;
      
      applyButton.onclick = () => {
        try {
          const code = textArea.value;
          setEditorCode(code);
          
          const fn = new Function('p', 'patternSize', `
            try {
              ${code}
              return typeof draw === 'function' ? draw : null;
            } catch(e) {
              console.error("코드 컴파일 오류:", e);
              return null;
            }
          `);
          
          const drawFunction = fn(null, patternSize) as CustomDrawFunction | null;
          
          if (typeof drawFunction === 'function') {
            sketchRef.current = drawFunction;
            setCurrentPattern(3); 
          } else {
            alert('draw 함수를 찾을 수 없습니다. 코드에 유효한 draw 함수가 포함되어 있는지 확인하세요.');
          } 
        } catch (e) {
          console.error('코드 적용 오류:', e);
          alert(`코드 오류: ${(e as Error).message}`);
        }
      };
      
      const helpText = document.createElement('div');
      helpText.innerHTML = `
        <div style="margin-top: 10px; font-size: 12px; color: #666;">
          <p><strong>도움말:</strong> draw 함수 안에서 <code>patternSize</code> 변수를 사용하여 패턴 크기를 조절할 수 있습니다.</p>
          <p>예: <code>const cellCount = patternSize;</code></p>
        </div>
      `;
      
      editorArea.appendChild(textArea);
      editorArea.appendChild(applyButton);
      editorArea.appendChild(helpText);
      container.appendChild(editorArea);
    }
    
    const unfoldedCanvas = document.getElementById('unfoldedCanvas');
    if (unfoldedCanvas) {
      unfoldedCanvas.appendChild(container);
    }
  };
  
  useEffect(() => {
    createUI();
  }, [editorVisible, currentPattern, patternSize]);

  return <Sketch setup={setup} draw={draw} />;
}