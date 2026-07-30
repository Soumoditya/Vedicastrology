'use client';

import { useEffect } from 'react';

/**
 * Scroll choreography.
 *
 * Elements marked `data-reveal` fade and rise as they enter view. The hiding
 * class is added to the document by this component rather than living in the
 * stylesheet, so if JavaScript never runs the content simply stays visible.
 *
 * That last guarantee was not enough. It covers JavaScript never running at
 * all, but not the case that actually bit: the effect runs, everything below
 * the fold is hidden, and then the observer fails to deliver for some of the
 * targets. On a phone a tool page stacks into one narrow column, so most of it
 * starts below the fold, and the page reads as empty. Reported from a real
 * phone, where a reload or desktop mode fixed it, which is the signature of a
 * page whose content depends on a callback arriving.
 *
 * So visibility no longer depends on the observer succeeding. Three layers,
 * in order of how much they are trusted:
 *
 *   1. Anything at or near the first screen is revealed the moment the observer
 *      is armed, without waiting for a callback. A page therefore never opens
 *      blank, which was the complaint.
 *   2. Anything beyond that reveals on intersection, as before, which is the
 *      effect worth having.
 *   3. A timer reveals whatever is still hidden regardless. If the observer is
 *      throttled, dropped on a restore from the back cache, or simply never
 *      fires, the reading is a little less choreographed and completely
 *      readable. Content is never permanently hidden.
 *
 * Honours prefers-reduced-motion by never arming at all.
 */
export function Reveal() {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const root = document.documentElement;
    const targets = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (targets.length === 0) return;

    root.classList.add('reveal-ready');

    const show = (el: Element) => el.classList.add('in');

    /*
      Layer 1. Everything within the first screen and a half is shown at once.

      Deliberately generous. The animation is worth having for a section a
      reader scrolls down to; it is worth nothing for a section that is already
      on screen, and hiding those is all downside.
    */
    const eager = window.innerHeight * 1.5;
    const deferred: HTMLElement[] = [];

    for (const el of targets) {
      if (el.getBoundingClientRect().top < eager) show(el);
      else deferred.push(el);
    }

    // Layer 2. Threshold zero, so any overlap at all counts. A section taller
    // than about twelve screens can never reach a fractional threshold, and on
    // a phone that is a reachable height.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          show(entry.target);
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0 },
    );

    for (const el of deferred) observer.observe(el);

    // Layer 3. The safety net. Long enough that a normal scroll animates
    // first, short enough that nobody sits looking at a blank panel.
    const net = window.setTimeout(() => {
      for (const el of deferred) show(el);
      observer.disconnect();
    }, 2500);

    /*
      Restoring from the back cache re-shows a page without remounting this
      component, and a phone browser may not redeliver observations for it. The
      symptom is a page that was fine, navigated away from, and returns blank.
    */
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) for (const el of targets) show(el);
    };
    window.addEventListener('pageshow', onPageShow);

    return () => {
      window.clearTimeout(net);
      window.removeEventListener('pageshow', onPageShow);
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
