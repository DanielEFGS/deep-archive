import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { CatalogItem, CatalogPayload } from '../types/catalog';
import type { EducationalContent, EditorialTrail } from '../types/editorial';
import { useDialogFocus } from '../hooks/useDialogFocus';

type Props = {
  trail: EditorialTrail | null;
  item: CatalogItem | null;
  content: EducationalContent | null;
  atlas: CatalogPayload['atlas'];
  step: number;
  started: boolean;
  loading: boolean;
  error: boolean;
  onStart: () => void;
  onRetry: () => void;
  onNavigate: (direction: -1 | 1) => void;
  onSelectStep: (step: number) => void;
  onClose: () => void;
};

function atlasPosition(id: number, columns: number, rows: number) {
  const index = id - 1;
  const column = index % columns;
  const row = Math.floor(index / columns);
  const x = columns <= 1 ? 0 : (column / (columns - 1)) * 100;
  const y = rows <= 1 ? 0 : (row / (rows - 1)) * 100;
  return `${x}% ${y}%`;
}

export function TrailPanel({ trail, item, content, atlas, step, started, loading, error, onStart, onRetry, onNavigate, onSelectStep, onClose }: Props) {
  const panelRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  useDialogFocus(panelRef, onClose, closeRef);

  useEffect(() => {
    setRevealed(false);
    setImageLoaded(false);
    setImageFailed(false);
    setLinkCopied(false);
  }, [item?.id]);

  useEffect(() => {
    if (!started || !trail) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' && step > 0) onNavigate(-1);
      if (event.key === 'ArrowRight' && step < trail.steps.length - 1) onNavigate(1);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onNavigate, started, step, trail]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
    } catch {
      setLinkCopied(false);
    }
  };

  const previewStyle = item ? {
    backgroundImage: `url(${atlas.url})`,
    backgroundSize: `${atlas.columns * 100}% ${atlas.rows * 100}%`,
    backgroundPosition: atlasPosition(item.id, atlas.columns, atlas.rows),
  } : undefined;

  return (
    <div className="trail-backdrop" role="dialog" aria-modal="true" aria-labelledby="trail-title" onMouseDown={onClose}>
      <section ref={panelRef} className={`trail-panel ${started ? 'is-started' : 'is-intro'}`} tabIndex={-1} onMouseDown={(event) => event.stopPropagation()}>
        <button ref={closeRef} className="panel-close" type="button" onClick={onClose}>ESC / CLOSE</button>

        {!trail && loading && (
          <div className="trail-state" aria-live="polite">
            <span className="boot-mark" />
            <p>LOADING TRAIL</p>
          </div>
        )}

        {!trail && error && (
          <div className="trail-state" role="alert">
            <h1 id="trail-title">Trail unavailable</h1>
            <p>The editorial path could not be loaded. Your position in the archive has not changed.</p>
            <button type="button" onClick={onRetry}>RETRY TRAIL</button>
          </div>
        )}

        {trail && !started && (
          <div className="trail-intro">
            <div className="trail-intro__signal" aria-hidden="true">
              {trail.steps.map((trailStep, index) => <i key={trailStep.catalogId} style={{ '--trail-index': index } as CSSProperties} />)}
            </div>
            <div className="trail-intro__copy">
              <h1 id="trail-title">{trail.title}</h1>
              <p className="trail-intro__dek">{trail.dek}</p>
              <p className="trail-intro__objective">{trail.learningObjective}</p>
              <dl>
                <div><dt>Images</dt><dd>{trail.steps.length}</dd></div>
                <div><dt>Time</dt><dd>{trail.estimatedMinutes} min</dd></div>
                <div><dt>Language</dt><dd>{trail.locale.toUpperCase()}</dd></div>
                <div><dt>Review</dt><dd>Source-checked</dd></div>
              </dl>
              <button className="trail-primary-action" type="button" onClick={onStart}>BEGIN WITH THE IMAGE <span>→</span></button>
            </div>
          </div>
        )}

        {trail && started && item && (
          <>
            <div className={`trail-visual ${item.fullImageUrl && !imageLoaded && !imageFailed ? 'is-resolving' : ''}`} style={previewStyle}>
              {item.fullImageUrl && !imageFailed && <img className={imageLoaded ? 'is-loaded' : ''} src={item.fullImageUrl} alt={item.title} decoding="async" onLoad={() => setImageLoaded(true)} onError={() => setImageFailed(true)} />}
              {item.fullImageUrl && !imageLoaded && !imageFailed && <span className="trail-visual__loading">RESOLVING FULL IMAGE</span>}
              <span className="trail-visual__number">{String(item.id).padStart(3, '0')}</span>
              <span className="trail-visual__credit">{item.credit ?? item.subtitle}</span>
            </div>

            <div className="trail-copy" aria-busy={loading}>
              <div className="trail-copy__position">{String(step + 1).padStart(2, '0')} / {String(trail.steps.length).padStart(2, '0')} · {trail.steps[step]?.chapter}</div>
              <h1 id="trail-title">{item.title}</h1>

              <div className="trail-observe">
                <p>{trail.steps[step]?.prompt}</p>
                {content?.observe && <ul>{content.observe.map((prompt) => <li key={prompt}>{prompt}</li>)}</ul>}
              </div>

              {!revealed && (!error || content) && (
                <button className="trail-reveal" type="button" disabled={!content} onClick={() => setRevealed(true)}>
                  {content ? 'REVEAL CONTEXT' : 'LOADING CONTEXT'}
                </button>
              )}

              {error && !content && (
                <div className="trail-inline-error" role="alert">
                  <p>This step could not be fully loaded.</p>
                  <button type="button" onClick={onRetry}>RETRY STEP</button>
                </div>
              )}

              {content && revealed && (
                <div className="trail-explanation">
                  <p className="trail-explanation__intro">{content.introduction}</p>
                  <section><h2>What this view shows</h2><p>{content.explanation}</p></section>
                  <section><h2>How to read the color</h2><p>{content.colorMethod}</p></section>
                  <section><h2>Why it matters</h2><p>{content.whyItMatters}</p></section>
                  <div className="trail-explanation__source">
                    <span>{content.status.toUpperCase()}</span>
                    {content.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label} ↗</a>)}
                  </div>
                </div>
              )}
            </div>

            <nav className="trail-progress" aria-label="Trail progress">
              {trail.steps.map((trailStep, index) => (
                <button key={trailStep.catalogId} type="button" className={index === step ? 'is-current' : index < step ? 'is-visited' : ''} onClick={() => onSelectStep(index)} aria-label={`Go to step ${index + 1}: ${trailStep.chapter}`} aria-current={index === step ? 'step' : undefined}><span /></button>
              ))}
            </nav>
          </>
        )}
      </section>

      {trail && started && (
        <nav className="trail-floating-nav" aria-label="Navigate Trail" onMouseDown={(event) => event.stopPropagation()}>
          <button type="button" onClick={() => onNavigate(-1)} disabled={step === 0}><span>←</span> PREVIOUS</button>
          <button type="button" onClick={copyLink}>{linkCopied ? 'LINK COPIED' : 'COPY STEP LINK'}</button>
          {step < trail.steps.length - 1
            ? <button type="button" onClick={() => onNavigate(1)}>NEXT <span>→</span></button>
            : <button type="button" onClick={onClose}>FINISH <span>→</span></button>}
        </nav>
      )}
    </div>
  );
}
