'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * Calculates animated value with optional full wave oscillation.
 * When oscillate is true (especially for small values / percentages < 50%),
 * it sweeps forward to a visible peak (50-65%), dips smoothly, and settles at target.
 */
export function calculateAnimatedValue(target, progress, oscillate = false) {
  if (target === 0) return 0;
  if (!oscillate) {
    // Cubic ease out (fast start, silky deceleration)
    const ease = 1 - Math.pow(1 - progress, 3);
    return ease * target;
  }

  // Full wave oscillation for small values (< 50%)
  const peak = Math.max(50, Math.min(65, target * 2.5 + 30));
  const trough = Math.max(0, target - Math.max(2, target * 0.15));

  if (progress < 0.45) {
    // Phase 1: Smooth rise from 0 to prominent peak (0% -> ~50-65%)
    const t = progress / 0.45;
    const ease = 1 - Math.pow(1 - t, 3);
    return ease * peak;
  } else if (progress < 0.75) {
    // Phase 2: Pullback from peak through trough (cosine ease)
    const t = (progress - 0.45) / 0.3;
    const cosEase = (1 - Math.cos(t * Math.PI)) / 2;
    return peak - (peak - trough) * cosEase;
  } else {
    // Phase 3: Settle from trough to exact target
    const t = (progress - 0.75) / 0.25;
    const ease = 1 - Math.pow(1 - t, 2);
    return trough + (target - trough) * ease;
  }
}

/**
 * Custom hook to animate numbers smoothly from 0 to a target value.
 * @param {number} target - The final target number
 * @param {object} options - Configuration options
 * @returns {number} The current animated value
 */
export function useCountUp(target, options = {}) {
  const {
    duration = 1200,
    decimals = 0,
    oscillate = false,
    delay = 0,
  } = options;

  const [currentVal, setCurrentVal] = useState(0);
  const startTimeRef = useRef(null);
  const rafRef = useRef(null);
  const startTimeoutRef = useRef(null);

  useEffect(() => {
    const finalVal = Number(target) || 0;
    if (finalVal === 0) {
      setCurrentVal(0);
      return;
    }

    // Reset when target changes
    startTimeRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (startTimeoutRef.current) clearTimeout(startTimeoutRef.current);

    const startAnimation = () => {
      const animate = (timestamp) => {
        if (!startTimeRef.current) startTimeRef.current = timestamp;
        const elapsed = timestamp - startTimeRef.current;
        const progress = Math.min(1, elapsed / duration);

        const val = calculateAnimatedValue(finalVal, progress, oscillate);
        setCurrentVal(decimals > 0 ? parseFloat(val.toFixed(decimals)) : Math.round(val));

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(animate);
        } else {
          setCurrentVal(decimals > 0 ? parseFloat(finalVal.toFixed(decimals)) : Math.round(finalVal));
        }
      };

      rafRef.current = requestAnimationFrame(animate);
    };

    if (delay > 0) {
      startTimeoutRef.current = setTimeout(startAnimation, delay);
    } else {
      startAnimation();
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (startTimeoutRef.current) clearTimeout(startTimeoutRef.current);
    };
  }, [target, duration, decimals, oscillate, delay]);

  return currentVal;
}

/**
 * Custom hook to animate progress bar width percentages.
 * Automatically performs one full visible oscillation if target percentage is < 50%.
 * @param {number} targetPercentage - The final target percentage (0-100)
 * @param {object} options - Configuration options
 * @returns {number} The current animated progress percentage
 */
export function useAnimatedProgress(targetPercentage, options = {}) {
  const finalTarget = Math.max(0, Math.min(100, Number(targetPercentage) || 0));
  const shouldOscillate = options.oscillate !== undefined 
    ? options.oscillate 
    : (finalTarget > 0 && finalTarget < 50);

  return useCountUp(finalTarget, {
    duration: options.duration || 1350,
    decimals: 1,
    oscillate: shouldOscillate,
    delay: options.delay || 0,
  });
}
