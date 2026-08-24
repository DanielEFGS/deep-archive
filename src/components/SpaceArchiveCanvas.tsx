import { useEffect, useRef, useState } from "react";
import type {
  CatalogPayload,
  RenderDiagnostics,
  RenderQuality,
} from "../types/catalog";
import type { ArchiveRenderer } from "../webgl/ArchiveRenderer";
import { useI18n } from "../i18n";

type Props = {
  atlas: CatalogPayload["atlas"];
  itemCount: number;
  visibleIndices: Set<number> | null;
  onHoverIndex: (index: number | null) => void;
  onSelectIndex: (index: number) => void;
  onReady: () => void;
  onQualityChange: (quality: RenderQuality) => void;
  onError: () => void;
  onDiagnostics: (diagnostics: RenderDiagnostics) => void;
  diagnosticsEnabled: boolean;
  onSectorChange?: (direction: -1 | 1) => void;
};

export function SpaceArchiveCanvas({
  atlas,
  itemCount,
  visibleIndices,
  onHoverIndex,
  onSelectIndex,
  onReady,
  onQualityChange,
  onError,
  onDiagnostics,
  diagnosticsEnabled,
  onSectorChange,
}: Props) {
  const { locale } = useI18n();
  const es = locale === "es";
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<ArchiveRenderer | null>(null);
  const hoverRef = useRef<number | null>(null);
  const keyboardIndexRef = useRef<number | null>(null);
  const callbacksRef = useRef({
    onHoverIndex,
    onSelectIndex,
    onReady,
    onQualityChange,
    onError,
    onSectorChange,
  });
  const [failed, setFailed] = useState(false);

  callbacksRef.current = {
    onHoverIndex,
    onSelectIndex,
    onReady,
    onQualityChange,
    onError,
    onSectorChange,
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer: ArchiveRenderer | null = null;
    let disposed = false;
    let removeListeners = () => {};

    const initialize = async () => {
      try {
        const { ArchiveRenderer: Renderer } =
          await import("../webgl/ArchiveRenderer");
        if (disposed) return;
        renderer = new Renderer({
          canvas,
          atlasUrl: atlas.url,
          atlasColumns: atlas.columns,
          atlasRows: atlas.rows,
          atlasWidth: atlas.columns * atlas.tileWidth,
          atlasHeight: atlas.rows * atlas.tileHeight,
          itemCount,
          onReady: () => callbacksRef.current.onReady(),
          onQualityChange: (quality) =>
            callbacksRef.current.onQualityChange(quality),
          onError: () => {
            setFailed(true);
            callbacksRef.current.onError();
          },
        });
      } catch (error) {
        if (disposed) return;
        console.error("WebGL initialization failed", error);
        setFailed(true);
        callbacksRef.current.onError();
        return;
      }

      const activeRenderer = renderer;
      rendererRef.current = activeRenderer;
      let activeTouchPointerId: number | null = null;
      let suppressClickUntil = 0;
      let selectionTimer: number | null = null;
      let wheelDelta = 0;
      let lastSectorChangeAt = 0;
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      const selectAfterRipple = (
        index: number,
        clientX: number,
        clientY: number,
      ) => {
        if (selectionTimer != null) window.clearTimeout(selectionTimer);
        activeRenderer.triggerRipple(clientX, clientY);

        if (reducedMotion) {
          callbacksRef.current.onSelectIndex(index);
          return;
        }

        selectionTimer = window.setTimeout(() => {
          selectionTimer = null;
          callbacksRef.current.onSelectIndex(index);
        }, 220);
      };

      const setHover = (index: number | null) => {
        if (hoverRef.current === index) return;
        hoverRef.current = index;
        callbacksRef.current.onHoverIndex(index);
      };

      const onPointerMove = (event: PointerEvent) => {
        keyboardIndexRef.current = null;
        activeRenderer.setPointer(event.clientX, event.clientY);
        setHover(
          activeRenderer.getIndexAtPointer(event.clientX, event.clientY),
        );
      };

      const onPointerDown = (event: PointerEvent) => {
        if (event.pointerType !== "touch") return;
        activeTouchPointerId = event.pointerId;
        canvas.setPointerCapture(event.pointerId);
        keyboardIndexRef.current = null;
        activeRenderer.setPointer(event.clientX, event.clientY);
        setHover(
          activeRenderer.getIndexAtPointer(event.clientX, event.clientY),
        );
      };

      const finishTouch = (event: PointerEvent, openFocusedTile: boolean) => {
        if (
          event.pointerType !== "touch" ||
          event.pointerId !== activeTouchPointerId
        )
          return;
        event.preventDefault();

        activeRenderer.setPointer(event.clientX, event.clientY);
        setHover(
          activeRenderer.getIndexAtPointer(event.clientX, event.clientY),
        );
        const index = hoverRef.current;
        suppressClickUntil = performance.now() + 700;

        if (canvas.hasPointerCapture(event.pointerId))
          canvas.releasePointerCapture(event.pointerId);
        activeTouchPointerId = null;
        activeRenderer.clearPointer();
        setHover(null);

        if (openFocusedTile && index != null) {
          selectAfterRipple(index, event.clientX, event.clientY);
        }
      };

      const onPointerUp = (event: PointerEvent) => finishTouch(event, true);
      const onPointerCancel = (event: PointerEvent) =>
        finishTouch(event, false);

      const onPointerLeave = () => {
        if (activeTouchPointerId != null) return;
        activeRenderer.clearPointer();
        setHover(null);
      };

      const onClick = (event: MouseEvent) => {
        if (performance.now() < suppressClickUntil) return;
        const index = activeRenderer.getIndexAtPointer(
          event.clientX,
          event.clientY,
        );
        if (index == null) return;
        selectAfterRipple(index, event.clientX, event.clientY);
      };

      const onWheel = (event: WheelEvent) => {
        if (!callbacksRef.current.onSectorChange || Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;
        event.preventDefault();
        wheelDelta += event.deltaY;
        const now = performance.now();
        if (Math.abs(wheelDelta) < 120 || now - lastSectorChangeAt < 650) return;
        callbacksRef.current.onSectorChange(wheelDelta > 0 ? 1 : -1);
        wheelDelta = 0;
        lastSectorChangeAt = now;
      };

      const onKeyDown = (event: KeyboardEvent) => {
        let index = keyboardIndexRef.current ?? hoverRef.current ?? 0;
        let handled = true;

        switch (event.key) {
          case "ArrowLeft":
            index = activeRenderer.getAdjacentIndex(index, -1, 0);
            break;
          case "ArrowRight":
            index = activeRenderer.getAdjacentIndex(index, 1, 0);
            break;
          case "ArrowUp":
            index = activeRenderer.getAdjacentIndex(index, 0, -1);
            break;
          case "ArrowDown":
            index = activeRenderer.getAdjacentIndex(index, 0, 1);
            break;
          case "Home":
            index = activeRenderer.getBoundaryIndex(false);
            break;
          case "End":
            index = activeRenderer.getBoundaryIndex(true);
            break;
          case "PageUp":
            callbacksRef.current.onSectorChange?.(-1);
            return;
          case "PageDown":
            callbacksRef.current.onSectorChange?.(1);
            return;
          case "Enter":
          case " ":
            callbacksRef.current.onSelectIndex(index);
            break;
          case "Escape":
            keyboardIndexRef.current = null;
            activeRenderer.setFocusIndex(null);
            setHover(null);
            return;
          default:
            handled = false;
        }

        if (!handled) return;
        event.preventDefault();
        keyboardIndexRef.current = index;
        activeRenderer.setFocusIndex(index);
        setHover(index);
      };

      const onContextLost = (event: Event) => {
        event.preventDefault();
        setFailed(true);
        callbacksRef.current.onError();
      };

      canvas.addEventListener("pointerdown", onPointerDown);
      canvas.addEventListener("pointermove", onPointerMove, { passive: true });
      canvas.addEventListener("pointerup", onPointerUp);
      canvas.addEventListener("pointercancel", onPointerCancel);
      canvas.addEventListener("pointerleave", onPointerLeave);
      canvas.addEventListener("click", onClick);
      canvas.addEventListener("wheel", onWheel, { passive: false });
      canvas.addEventListener("keydown", onKeyDown);
      canvas.addEventListener("webglcontextlost", onContextLost);

      removeListeners = () => {
        if (selectionTimer != null) window.clearTimeout(selectionTimer);
        canvas.removeEventListener("pointerdown", onPointerDown);
        canvas.removeEventListener("pointermove", onPointerMove);
        canvas.removeEventListener("pointerup", onPointerUp);
        canvas.removeEventListener("pointercancel", onPointerCancel);
        canvas.removeEventListener("pointerleave", onPointerLeave);
        canvas.removeEventListener("click", onClick);
        canvas.removeEventListener("wheel", onWheel);
        canvas.removeEventListener("keydown", onKeyDown);
        canvas.removeEventListener("webglcontextlost", onContextLost);
      };
    };

    void initialize();

    return () => {
      disposed = true;
      removeListeners();
      renderer?.dispose();
      rendererRef.current = null;
    };
  }, [
    atlas.url,
    atlas.columns,
    atlas.rows,
    atlas.tileWidth,
    atlas.tileHeight,
    itemCount,
  ]);

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
        className={`archive-canvas ${failed ? "archive-canvas--failed" : ""}`}
        aria-label={
          es
            ? "Archivo interactivo de imágenes astronómicas. Usa las flechas para explorar y Enter para abrir los detalles."
            : "Interactive astronomical image archive. Use arrow keys to browse and Enter for details."
        }
        tabIndex={0}
      />
      {failed && (
        <div
          className="archive-fallback"
          style={{ backgroundImage: `url(${atlas.url})` }}
          role="img"
          aria-label={
            es
              ? "Vista estática alternativa del archivo astronómico"
              : "Static astronomical archive fallback"
          }
        />
      )}
    </>
  );
}
