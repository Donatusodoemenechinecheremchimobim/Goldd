import React, { useEffect, ReactNode } from 'react';
import Lenis from 'lenis';
import { motion, useScroll, useSpring } from 'motion/react';

interface SmoothScrollEngineProps {
  pageKey: string;
}

/**
 * 21st.dev-inspired Global Smooth Scroll & Viewport Reveal Engine:
 * - Buttery Lenis inertia wheel scrolling (disabled automatically for modals, inner scroll containers, and reduced-motion users)
 * - Spring-damped top gold reading progress bar
 * - Automatic GPU-composited BlurFade section reveals across every public page
 */
export const SmoothScrollEngine: React.FC<SmoothScrollEngineProps> = ({ pageKey }) => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 180,
    damping: 28,
    restDelta: 0.001,
  });

  // 1. Initialize Lenis smooth inertia scrolling across the site
  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) return;

    const lenis = new Lenis({
      lerp: 0.095,
      smoothWheel: true,
      wheelMultiplier: 0.95,
      prevent: (node) =>
        Boolean(
          node.closest(
            '[role="dialog"], [data-lenis-prevent], .overflow-y-auto, .overflow-auto, textarea, select'
          )
        ),
    });

    (window as Window & { __lenis?: Lenis }).__lenis = lenis;

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = window.requestAnimationFrame(raf);
    };
    rafId = window.requestAnimationFrame(raf);

    return () => {
      window.cancelAnimationFrame(rafId);
      lenis.destroy();
      delete (window as Window & { __lenis?: Lenis }).__lenis;
    };
  }, []);

  // 2. Smooth reset to top & attach GPU BlurFade scroll reveals on every page navigation
  useEffect(() => {
    const winWithLenis = window as Window & { __lenis?: Lenis };
    if (winWithLenis.__lenis) {
      winWithLenis.__lenis.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || pageKey.startsWith('portal')) {
      return;
    }

    const mainEl = document.querySelector('main');
    if (!mainEl) return;

    const sections = Array.from(mainEl.querySelectorAll('section'));
    // Keep the initial hero section immediately visible; smoothly reveal all sections & grids below the fold
    const heroSection = sections[0] || null;
    const gridCards = Array.from(
      mainEl.querySelectorAll('.grid > div, .grid > button')
    ).filter((el) => {
      if (heroSection && heroSection.contains(el)) return false;
      if (el.closest('[role="dialog"]')) return false;
      return true;
    });

    const belowFoldSections = sections.slice(1);
    const allTargets = Array.from(new Set([...belowFoldSections, ...gridCards]));
    const tracked: HTMLElement[] = [];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement;
            target.classList.add('gmp-scroll-revealed');
            target.classList.remove('gmp-scroll-pending');
            observer.unobserve(target);
          }
        });
      },
      {
        threshold: 0.01,
        rootMargin: '0px 0px -20px 0px',
      }
    );

    allTargets.forEach((el, idx) => {
      const htmlEl = el as HTMLElement;
      const isCard = htmlEl.tagName !== 'SECTION';
      const rect = htmlEl.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.96) {
        htmlEl.classList.add('gmp-scroll-revealed');
        htmlEl.classList.remove('gmp-scroll-pending');
      } else {
        if (isCard) {
          htmlEl.style.transitionDelay = `${(idx % 4) * 70}ms`;
        }
        htmlEl.classList.add('gmp-scroll-pending');
        htmlEl.classList.remove('gmp-scroll-revealed');
        observer.observe(htmlEl);
        tracked.push(htmlEl);
      }
    });

    return () => {
      observer.disconnect();
      tracked.forEach((el) => {
        el.classList.remove('gmp-scroll-pending');
        el.style.transitionDelay = '';
      });
    };
  }, [pageKey]);

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX }}
      className="fixed top-0 left-0 right-0 h-[2.5px] z-50 origin-left pointer-events-none bg-gradient-to-r from-[#B8860B] via-[#FFF4BE] to-[#D4AF37]"
    />
  );
};

interface BlurFadeProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  yOffset?: number;
  blur?: string;
}

/**
 * 21st.dev BlurFade Component (Motion-powered viewport reveal with soft blur-to-crisp focus)
 */
export const BlurFade: React.FC<BlurFadeProps> = ({
  children,
  className = '',
  delay = 0,
  duration = 0.55,
  yOffset = 18,
  blur = '6px',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset, filter: `blur(${blur})` }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{
        duration,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
