import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { ObservationMap } from "../types/editorial";
import { observationKindLabel, useI18n, type Locale } from "../i18n";

type Props = { map: ObservationMap; itemId: number; locale: Locale };

function cellId(column: number, row: number) {
  return `${String.fromCharCode(65 + column)}-${String(row + 1).padStart(2, "0")}`;
}

export function ObservationGrid({ map, itemId, locale }: Props) {
  const { text } = useI18n();
  const [activeIndex, setActiveIndex] = useState(0);
  const [guideCollapsed, setGuideCollapsed] = useState(false);
  const cells = useMemo(
    () =>
      Array.from({ length: map.columns * map.rows }, (_, index) =>
        cellId(index % map.columns, Math.floor(index / map.columns)),
      ),
    [map.columns, map.rows],
  );

  useEffect(() => {
    setActiveIndex(0);
    setGuideCollapsed(false);
  }, [itemId]);

  const activeFeature = map.features[activeIndex];
  const selectFeature = (direction: -1 | 1) => {
    setActiveIndex(
      (current) =>
        (current + direction + map.features.length) % map.features.length,
    );
  };

  return (
    <div
      className="observation-grid"
      style={
        {
          "--observation-columns": map.columns,
          "--observation-rows": map.rows,
        } as CSSProperties
      }
      role="region"
      aria-label={text.visualGuideRegion(map.features.length)}
    >
      <div className="observation-grid__status">
        <span>{text.visualGuide}</span>
        <span>{text.approximateEditorialAreas}</span>
      </div>
      <div className="observation-grid__coordinate" aria-hidden="true">
        {String(activeIndex + 1).padStart(2, "0")} /{" "}
        {String(map.features.length).padStart(2, "0")}
      </div>
      <div className="observation-grid__cells" aria-hidden="true">
        {cells.map((cell) => (
          <i
            key={cell}
            className={activeFeature?.cells.includes(cell) ? "is-active" : ""}
          />
        ))}
      </div>

      {activeFeature && !guideCollapsed && (
        <div className="observation-grid__finding" aria-live="polite">
          <div className="observation-grid__finding-head">
            <span>{observationKindLabel(activeFeature.kind, locale)}</span>
            <div
              className="observation-grid__finding-nav"
              aria-label={text.visualGuideControls}
            >
              <button
                type="button"
                aria-label={text.previousGuidedArea}
                onClick={() => selectFeature(-1)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m14 7-5 5 5 5" />
                </svg>
              </button>
              <span aria-hidden="true">
                {activeIndex + 1}/{map.features.length}
              </span>
              <button
                type="button"
                aria-label={text.nextGuidedArea}
                onClick={() => selectFeature(1)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m10 7 5 5-5 5" />
                </svg>
              </button>
              <button
                type="button"
                aria-label={text.collapseVisualGuide}
                onClick={() => setGuideCollapsed(true)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m8 8 8 8M16 8l-8 8" />
                </svg>
              </button>
            </div>
          </div>
          <strong>{activeFeature.label}</strong>
          <p>{activeFeature.description}</p>
        </div>
      )}

      {activeFeature && guideCollapsed && (
        <button
          className="observation-grid__finding-open"
          type="button"
          aria-label={text.openVisualGuide}
          title={text.openVisualGuide}
          onClick={() => setGuideCollapsed(false)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="8" />
            <path d="M12 10.5v6M12 7.5h.01" />
          </svg>
        </button>
      )}
    </div>
  );
}
