import { useEffect, useMemo, useRef } from "react";
import type { AtlasConfig, CatalogItem } from "../types/catalog";
import { useI18n } from "../i18n";
import { atlasPosition } from "../utils/atlas";

type Props = {
  active: boolean;
  atlas: AtlasConfig;
  item: CatalogItem | null;
  atlasIndex: number | null;
};

const PREVIEW_WIDTH = 120;
const PREVIEW_HEIGHT = 90;
const FINGER_GAP = 58;
const EDGE_GAP = 12;

export function TouchPreview({ active, atlas, item, atlasIndex }: Props) {
  const { locale } = useI18n();
  const previewRef = useRef<HTMLDivElement | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const canDisplayRef = useRef(active && item != null);

  canDisplayRef.current = active && item != null;

  const imageStyle = useMemo(
    () => ({
      backgroundImage: `url(${atlas.url})`,
      backgroundPosition: item && atlasIndex != null
        ? atlasPosition(atlasIndex, atlas.columns, atlas.rows)
        : "0 0",
      backgroundSize: `${atlas.columns * 100}% ${atlas.rows * 100}%`,
    }),
    [atlas.columns, atlas.rows, atlas.url, atlasIndex, item],
  );

  useEffect(() => {
    const preview = previewRef.current;
    if (!preview) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const current = { x: -200, y: -200 };
    const target = { x: -200, y: -200 };
    let positioned = false;
    let animationFrame = 0;

    const renderPosition = () => {
      preview.style.transform = `translate3d(${current.x.toFixed(1)}px, ${current.y.toFixed(1)}px, 0)`;
    };

    const followTarget = () => {
      animationFrame = 0;
      const deltaX = target.x - current.x;
      const deltaY = target.y - current.y;

      current.x += deltaX * 0.24;
      current.y += deltaY * 0.24;

      if (Math.abs(deltaX) < 0.35 && Math.abs(deltaY) < 0.35) {
        current.x = target.x;
        current.y = target.y;
        renderPosition();
        return;
      }

      renderPosition();
      animationFrame = window.requestAnimationFrame(followTarget);
    };

    const animateToTarget = () => {
      if (reducedMotion.matches || !positioned) {
        current.x = target.x;
        current.y = target.y;
        positioned = true;
        renderPosition();
        return;
      }

      if (!animationFrame) {
        animationFrame = window.requestAnimationFrame(followTarget);
      }
    };

    const place = (event: PointerEvent) => {
      const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
      const viewportHeight =
        window.visualViewport?.height ?? window.innerHeight;
      const mobileTop = viewportWidth <= 700 ? 144 : EDGE_GAP;
      const mobileBottom = viewportWidth <= 700 ? 70 : EDGE_GAP;

      let left = event.clientX + FINGER_GAP;
      if (left + PREVIEW_WIDTH > viewportWidth - EDGE_GAP) {
        left = event.clientX - FINGER_GAP - PREVIEW_WIDTH;
      }

      let top = event.clientY - FINGER_GAP - PREVIEW_HEIGHT;
      if (top < mobileTop) top = event.clientY + FINGER_GAP;

      left = Math.min(
        viewportWidth - PREVIEW_WIDTH - EDGE_GAP,
        Math.max(EDGE_GAP, left),
      );
      top = Math.min(
        viewportHeight - PREVIEW_HEIGHT - mobileBottom,
        Math.max(mobileTop, top),
      );

      target.x = Math.round(left);
      target.y = Math.round(top);
      animateToTarget();
    };

    const show = (event: PointerEvent) => {
      if (
        event.pointerType !== "touch" ||
        !(event.target instanceof HTMLCanvasElement) ||
        !event.target.classList.contains("archive-canvas")
      ) {
        return;
      }
      pointerIdRef.current = event.pointerId;
      place(event);
      preview.classList.toggle("is-active", canDisplayRef.current);
    };

    const move = (event: PointerEvent) => {
      if (event.pointerId !== pointerIdRef.current) return;
      place(event);
      preview.classList.toggle("is-active", canDisplayRef.current);
    };

    const hide = (event: PointerEvent) => {
      if (event.pointerId !== pointerIdRef.current) return;
      pointerIdRef.current = null;
      preview.classList.remove("is-active");
      positioned = false;
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      }
    };

    window.addEventListener("pointerdown", show, { passive: true });
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerup", hide, { passive: true });
    window.addEventListener("pointercancel", hide, { passive: true });
    return () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("pointerdown", show);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", hide);
      window.removeEventListener("pointercancel", hide);
    };
  }, []);

  useEffect(() => {
    const preview = previewRef.current;
    if (!preview || pointerIdRef.current == null) return;
    preview.classList.toggle("is-active", active && item != null);
  }, [active, item]);

  return (
    <div ref={previewRef} className="touch-preview" aria-hidden="true">
      <div className="touch-preview__image" style={imageStyle} />
      <span className="touch-preview__reticle" />
      <span className="touch-preview__label">
        {item ? String(item.id).padStart(3, "0") : "---"} /{" "}
        {locale === "es" ? "FOCO" : "FOCUS"}
      </span>
    </div>
  );
}
