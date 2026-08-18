'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Scroll choreography.
 *
 * Elements marked `data-reveal` fade and rise as they enter view.
 *
 * The ordering here is the whole design, and it took two goes to get right.
 *
 * The obvious way, and the way this was written twice, is to hide everything
 * first and then reveal it as it scrolls into view. That is backwards. It means
 * a page is blank by default and depends on JavaScript running, an
 * IntersectionObserver delivering, and a timer firing, to become readable. Any
 * one of those failing on a phone leaves somebody looking at empty space, which
 * is what happened: reported twice from a real phone, on the tool pages and
 * then on the consultations page, fixed by a reload or by desktop mode, both of
 * which simply force a fresh load.
 *
 * So nothing is hidden until the observer has proved it works.
 *
 *   1. The page renders visible. No class, no inline style, nothing hidden.
 *   2. The observer is armed. It always delivers an initial callback for every
 *      target it is given, so that first callback is proof of life.
 *   3. Only then, inside that callback, is anything hidden, and only the
 *      elements that are currently off screen. Whatever is already on screen is
 *      never touched, because animating something the reader is already looking
 *      at gains nothing.
 *   4. Those hidden elements reveal as they come into view, and a timer reveals
 *      any stragglers regardless.
 *
 * If the observer never fires, step three never happens and the page is simply
 * readable with no animation. A failure now costs the effect rather than the
 * content, which is the right way round.
 *
 * Honours prefers-reduced-motion by never arming at all.
 *
 * Re-arms on every navigation, and that is not a nicety. Submitting the
 * compatibility form pushes to the *same* path with different search params, so
 * the page does not unmount and this effect used to not run again. The
 * `reveal-ready` class stayed on the document from the previous arming, the new
 * content arrived carrying `data-reveal` and no `in`, and the rule that hides
 * unrevealed elements applied to all of it — with no observer watching it and the
 * safety timer long since fired. The result was a page that was blank until you
 * reloaded it, which is exactly what was reported. Depending on the location
 * means each navigation gets its own observer, its own timer and its own clean
 * slate.
 */
export function Reveal() {
  const pathname = usePathname();
  const search = useSearchParams().toString();

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const targets = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (targets.length === 0) return;

    let armed = false;
    const pending = new Set<HTMLElement>();

    const show = (el: HTMLElement) => {
      pending.delete(el);
      el.classList.add('in');
    };

    const observer = new IntersectionObserver(
      (entries) => {
        /*
          The first callback is the proof. Until it arrives nothing has been
          hidden, so there is no state to unwind if it never does.
        */
        if (!armed) {
          armed = true;
          document.documentElement.classList.add('reveal-ready');

          for (const entry of entries) {
            const el = entry.target as HTMLElement;

            /*
              Judged against the real viewport, not against the observer's
              verdict. The observer applies a negative bottom margin so things
              reveal slightly before they arrive, which means an element peeking
              into the last few percent of the screen is reported as not
              intersecting. Trusting that hid an element the reader could see.
            */
            const box = el.getBoundingClientRect();
            const onScreen = box.top < window.innerHeight && box.bottom > 0;

            if (onScreen) {
              show(el);
              observer.unobserve(el);
            } else {
              pending.add(el);
            }
          }
          return;
        }

        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          show(entry.target as HTMLElement);
          observer.unobserve(entry.target);
        }
      },
      // Threshold zero, so any overlap counts. A section taller than about
      // twelve screens can never reach a fractional threshold, and on a phone
      // that height is reachable.
      { rootMargin: '0px 0px -8% 0px', threshold: 0 },
    );

    for (const el of targets) observer.observe(el);

    // The net. Long enough for a normal scroll to animate first, short enough
    // that nobody sits looking at a blank panel.
    const net = window.setTimeout(() => {
      for (const el of Array.from(pending)) show(el);
      observer.disconnect();
    }, 2500);

    /*
      Restoring from the back cache re-shows a page without remounting this
      component, and a phone browser may not redeliver observations for it. The
      symptom is a page that was fine, navigated away from, and comes back blank.
    */
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) for (const el of targets) show(el);
    };
    window.addEventListener('pageshow', onPageShow);

    return () => {
      window.clearTimeout(net);
      window.removeEventListener('pageshow', onPageShow);
      observer.disconnect();
      document.documentElement.classList.remove('reveal-ready');
    };
  }, [pathname, search]);

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
