import { useEffect, useRef } from 'react';
import gsap from 'gsap';

const INTERACTIVE = 'a, button, [role="button"], input[type="radio"], input[type="checkbox"], select, label, .card, summary';
const TEXT_INPUT = 'input[type="text"], input[type="url"], input[type="search"], textarea';

/**
 * CursorFX — "target lock" crosshair cursor.
 * A viewfinder with four corner brackets trails the pointer and
 * locks onto interactive elements. Fades out over text inputs so
 * the native caret takes over. Fine pointers + motion allowed only.
 */
export default function CursorFX() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const rootEl = root;

    const finePointer = window.matchMedia('(pointer: fine)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!finePointer || reducedMotion) return;

    document.documentElement.classList.add('has-cursor-fx');
    gsap.set(root, { xPercent: -50, yPercent: -50, opacity: 0 });

    const xTo = gsap.quickTo(root, 'x', { duration: 0.16, ease: 'power3.out' });
    const yTo = gsap.quickTo(root, 'y', { duration: 0.16, ease: 'power3.out' });

    let visible = false;
    let hovered: Element | null = null;

    function onMove(e: MouseEvent) {
      if (!visible) {
        visible = true;
        gsap.to(rootEl, { opacity: 1, duration: 0.25 });
      }
      xTo(e.clientX);
      yTo(e.clientY);
    }

    function onOver(e: MouseEvent) {
      const el = e.target as Element | null;
      const target = el?.closest?.(INTERACTIVE) ?? null;
      const isText = !!(el?.closest?.(TEXT_INPUT));

      document.documentElement.classList.toggle('cursor-text', isText);
      gsap.to(rootEl, { opacity: isText ? 0 : 1, duration: 0.18 });
      if (isText) { hovered = null; return; }

      if (target === hovered) return;
      hovered = target;
      const locked = !!target;
      rootEl.classList.toggle('cursor-locked', locked);

      // Snap animation: brackets spring outward on lock
      gsap.to(rootEl, {
        scale: locked ? 1.35 : 1,
        rotate: locked ? '+=90' : 0,
        duration: 0.35,
        ease: locked ? 'back.out(2)' : 'power2.out',
      });
    }

    function onPress() {
      gsap.fromTo(rootEl, { scale: (rootEl.classList.contains('cursor-locked') ? 1.35 : 1) * 0.8 }, {
        scale: rootEl.classList.contains('cursor-locked') ? 1.35 : 1,
        duration: 0.3,
        ease: 'elastic.out(1, 0.5)',
      });
    }

    function onLeaveWindow() {
      visible = false;
      gsap.to(rootEl, { opacity: 0, duration: 0.2 });
    }

    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseover', onOver, { passive: true });
    window.addEventListener('mousedown', onPress);
    document.documentElement.addEventListener('mouseleave', onLeaveWindow);

    return () => {
      document.documentElement.classList.remove('has-cursor-fx', 'cursor-text');
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
      window.removeEventListener('mousedown', onPress);
      document.documentElement.removeEventListener('mouseleave', onLeaveWindow);
      gsap.killTweensOf(root);
    };
  }, []);

  return (
    <div ref={rootRef} className="crosshair" aria-hidden="true">
      <span className="crosshair__corner crosshair__corner--tl" />
      <span className="crosshair__corner crosshair__corner--tr" />
      <span className="crosshair__corner crosshair__corner--bl" />
      <span className="crosshair__corner crosshair__corner--br" />
      <span className="crosshair__dot" />
    </div>
  );
}
