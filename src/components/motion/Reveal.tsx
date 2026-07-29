'use client';

import { useEffect } from 'react';

/**
 * Scroll choreography.
 *
 * Elements marked `data-reveal` fade and rise as they enter view. The hiding
 * class is added to the document by this component rather than living in the
 * stylesheet, so if JavaScript never runs the content simply stays visible.
 * A CSS-only approach would leave the whole page blank in that case.
 *
 * Honours prefers-reduced-motion by never arming at all.
 */
export function Reveal() {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const root = document.documentElement;
    root.classList.add('reveal-ready');

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('in');
          // Reveal once. Re-animating on every scroll past is the kind of
          // fidgeting that makes a page feel cheap.
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
    );

    const targets = document.querySelectorAll('[data-reveal]');
    for (const el of targets) observer.observe(el);

    return () => {
      observer.disconnect();
      root.classList.remove('reveal-ready');
    };
  }, []);

  return null;
}

/**
 * Parallax on the hero figure.
 *
 * Driven by rAF against scrollY rather than a scroll event handler, so it
 * cannot fire more often than the compositor can paint.
 */
export function Parallax({
  selector,
  strength = 0.12,
}: {
  selector: string;
  strength?: number;
}) {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const el = document.querySelector<HTMLElement>(selector);
    if (!el) return;

    let frame = 0;
    let latest = window.scrollY;

    const apply = () => {
      frame = 0;
      el.style.transform = `translate3d(0, ${latest * strength}px, 0)`;
    };

    const onScroll = () => {
      latest = window.scrollY;
      if (!frame) frame = requestAnimationFrame(apply);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    apply();

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
      el.style.transform = '';
    };
  }, [selector, strength]);

  return null;
}
