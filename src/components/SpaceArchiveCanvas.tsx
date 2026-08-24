import { useEffect, useRef, useState } from 'react';
import type { CatalogPayload, RenderDiagnostics, RenderQuality } from '../types/catalog';
import { ArchiveRenderer } from '../webgl/ArchiveRenderer';

type Props = {
  atlas: CatalogPayload['atlas'];
  itemCount: number;
  visibleIndices: Set<number> | null;
  onHoverIndex: (index: number | null) => void;
  onSelectIndex: (index: number) => void;
  onReady: () => void;
  onProgress: (progress: number) => void;
  onQualityChange: (quality: RenderQuality) => void;
  onError: () => void;
  onDiagnostics: (diagnostics: RenderDiagnostics) => void;
  diagnosticsEnabled: boolean;
};

export function SpaceArchiveCanvas({
  atlas,
  itemCount,
  visibleIndices,
  onHoverIndex,
  onSelectIndex,
  onReady,
  onProgress,
  onQualityChange,
  onError, onDiagnostics, diagnosticsEnabled,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<ArchiveRenderer | null>(null);
  const hoverRef = useRef<number | null>(null);
  const keyboardIndexRef = useRef<number | null>(null);
  const callbacksRef = useRef({ onHoverIndex, onSelectIndex, onReady, onProgress, onQualityChange, onError });
  const [failed, setFailed] = useState(false);

  callbacksRef.current = { onHoverIndex, onSelectIndex, onReady, onProgress, onQualityChange, onError };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer: ArchiveRenderer;
    try {
      renderer = new ArchiveRenderer({
        canvas,
        atlasUrl: atlas.url,
        atlasColumns: atlas.columns,
        atlasRows: atlas.rows,
        atlasWidth: atlas.columns * atlas.tileWidth,
        atlasHeight: atlas.rows * atlas.tileHeight,
        itemCount,
        onReady: () => callbacksRef.current.onReady(),
        onProgress: (progress) => callbacksRef.current.onProgress(progress),
        onQualityChange: (quality) => callbacksRef.current.onQualityChange(quality),
        onError: () => {
          setFailed(true);
          callbacksRef.current.onError();
        },
      });
    } catch (error) {
      console.error('WebGL initialization failed', error);
      setFailed(true);
      callbacksRef.current.onError();
      return;
    }

    rendererRef.current = renderer;

    const setHover = (index: number | null) => {
      if (hoverRef.current === index) return;
      hoverRef.current = index;
      callbacksRef.current.onHoverIndex(index);
    };

    const onPointerMove = (event: PointerEvent) => {
      keyboardIndexRef.current = null;
      renderer.setPointer(event.clientX, event.clientY);
      setHover(renderer.getIndexAtPointer(event.clientX, event.clientY));
    };

    const onPointerLeave = () => {
      renderer.clearPointer();
      setHover(null);
    };

    const onClick = (event: MouseEvent) => {
      const index = renderer.getIndexAtPointer(event.clientX, event.clientY);
      if (index == null) return;
      renderer.triggerRipple(event.clientX, event.clientY);
      callbacksRef.current.onSelectIndex(index);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      let index = keyboardIndexRef.current ?? hoverRef.current ?? 0;
      let handled = true;

      switch (event.key) {
        case 'ArrowLeft': index = renderer.getAdjacentIndex(index, -1, 0); break;
        case 'ArrowRight': index = renderer.getAdjacentIndex(index, 1, 0); break;
        case 'ArrowUp': index = renderer.getAdjacentIndex(index, 0, -1); break;
        case 'ArrowDown': index = renderer.getAdjacentIndex(index, 0, 1); break;
        case 'Home': index = renderer.getBoundaryIndex(false); break;
        case 'End': index = renderer.getBoundaryIndex(true); break;
        case 'Enter':
        case ' ':
          callbacksRef.current.onSelectIndex(index);
          break;
        case 'Escape':
          keyboardIndexRef.current = null;
          renderer.setFocusIndex(null);
          setHover(null);
          return;
        default:
          handled = false;
      }

      if (!handled) return;
      event.preventDefault();
      keyboardIndexRef.current = index;
      renderer.setFocusIndex(index);
      setHover(index);
    };

    const onContextLost = (event: Event) => {
      event.preventDefault();
      setFailed(true);
      callbacksRef.current.onError();
    };

    canvas.addEventListener('pointermove', onPointerMove, { passive: true });
    canvas.addEventListener('pointerleave', onPointerLeave);
    canvas.addEventListener('click', onClick);
    canvas.addEventListener('keydown', onKeyDown);
    canvas.addEventListener('webglcontextlost', onContextLost);

    return () => {
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('click', onClick);
      canvas.removeEventListener('keydown', onKeyDown);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      renderer.dispose();
      rendererRef.current = null;
    };
  }, [atlas.url, atlas.columns, atlas.rows, atlas.tileWidth, atlas.tileHeight, itemCount]);

  useEffect(() => {
    rendererRef.current?.setVisibleIndices(visibleIndices);
  }, [visibleIndices]);

  useEffect(() => {
    if (!diagnosticsEnabled) return;
    const timer = window.setInterval(() => {
      const diagnostics = rendererRef.current?.getDiagnostics();
      if (diagnostics) onDiagnostics(diagnostics);
    }, 500);
    return () => window.clearInterval(timer);
  }, [diagnosticsEnabled, onDiagnostics]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className={`archive-canvas ${failed ? 'archive-canvas--failed' : ''}`}
        aria-label="Interactive astronomical image archive. Use arrow keys to browse and Enter for details."
        tabIndex={0}
      />
      {failed && (
        <div
          className="archive-fallback"
          style={{ backgroundImage: `url(${atlas.url})` }}
          role="img"
          aria-label="Static astronomical archive fallback"
        />
      )}
    </>
  );
}
