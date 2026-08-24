import { useEffect, useRef } from 'react';

type Props = { active: boolean };

export function FieldCursor({ active }: Props) {
  const cursorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const move = (event: PointerEvent) => {
      cursorRef.current?.style.setProperty('transform', `translate3d(${event.clientX}px, ${event.clientY}px, 0) translate(-50%, -50%)`);
    };
    window.addEventListener('pointermove', move, { passive: true });
    return () => window.removeEventListener('pointermove', move);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('has-field-cursor', active);
    return () => document.documentElement.classList.remove('has-field-cursor');
  }, [active]);

  return <div ref={cursorRef} className={`field-cursor ${active ? 'is-active' : ''}`} aria-hidden="true"><span>VIEW</span></div>;
}
