import { useEffect, useMemo, useRef } from 'react';
import './DepthText.css';

const MAX_LAYERS = 64;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getLayerColor = (faceColor, depthColor, index, total) => {
  const progress = total <= 1 ? 1 : index / total;
  const depthPercent = Math.round(Math.pow(progress, 0.72) * 82 + 18);
  return `color-mix(in srgb, ${depthColor} ${depthPercent}%, ${faceColor})`;
};

const getTransform = (rotateX, rotateY) => `rotateX(${rotateX.toFixed(3)}deg) rotateY(${rotateY.toFixed(3)}deg)`;

const DepthText = ({
  text = 'Elevate',
  layers = 34,
  depth = 2.4,
  faceColor = '#f8fafc',
  depthColor = '#7c3aed',
  tilt = 7.5,
  pointerTracking = true,
  smoothing = 0.14,
  perspective = 900,
  autoOrbit = true,
  orbitSpeed = 0.35,
  fontSize = 'clamp(3rem, 12vw, 7rem)',
  fontWeight = 900,
  fontFamily = 'inherit',
  letterSpacing = 'inherit',
  lineHeight = 'inherit',
  shadow = true,
  className = '',
  style = {}
}) => {
  const rootRef = useRef(null);
  const stageRef = useRef(null);

  const safeLayers = clamp(Math.round(Number(layers) || 1), 2, MAX_LAYERS);
  const safeDepth = clamp(Number(depth) || 0, 0, 12);
  const safeTilt = clamp(Number(tilt) || 0, 0, 12);
  const safeSmoothing = clamp(Number(smoothing) || 0.14, 0.02, 0.35);
  const safePerspective = clamp(Number(perspective) || 900, 300, 2000);
  const safeOrbitSpeed = clamp(Number(orbitSpeed) || 0, 0, 2);

  const baseRotation = useMemo(() => ({ x: -safeTilt * 0.45, y: safeTilt * 0.85 }), [safeTilt]);

  const depthLayers = useMemo(() =>
    Array.from({ length: safeLayers }, (_, layerIndex) => {
      const index = safeLayers - layerIndex;
      return {
        index,
        color: getLayerColor(faceColor, depthColor, index, safeLayers)
      };
    }), [safeLayers, faceColor, depthColor]);

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage || typeof window === 'undefined') return undefined;

    const reducedMotion =
      typeof window.matchMedia === 'function'
        ? Boolean(window.matchMedia('(prefers-reduced-motion: reduce)')?.matches)
        : false;
    const finePointer =
      typeof window.matchMedia === 'function'
        ? Boolean(window.matchMedia('(hover: hover) and (pointer: fine)')?.matches)
        : true;
    const canTrackPointer = pointerTracking && finePointer && !reducedMotion;

    let frameId = 0;
    let activePointer = false;
    let startTime = performance.now();
    const current = { ...baseRotation };
    const target = { ...baseRotation };

    let currentDepth = safeDepth;
    let targetDepth = safeDepth;

    const applyTransform = () => {
      stage.style.transform = getTransform(current.x, current.y);
      stage.style.setProperty('--depth-step', `${currentDepth.toFixed(3)}px`);
    };

    if (reducedMotion) {
      stage.style.transform = getTransform(baseRotation.x, baseRotation.y);
      stage.style.setProperty('--depth-step', `${safeDepth}px`);
      return undefined;
    }

    const handlePointerMove = event => {
      const rect = root.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      activePointer = true;
      const x = clamp((event.clientX - (rect.left + rect.width / 2)) / (rect.width * 0.8), -1, 1);
      const y = clamp(
        (event.clientY - (rect.top + rect.height / 2)) / (rect.height * 0.8),
        -1,
        1
      );

      target.x = baseRotation.x - y * safeTilt;
      target.y = baseRotation.y + x * safeTilt;
    };

    const handlePointerLeave = () => {
      activePointer = false;
      target.x = baseRotation.x;
      target.y = baseRotation.y;
    };

    if (canTrackPointer) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerleave', handlePointerLeave);
      window.addEventListener('blur', handlePointerLeave);
    }

    const tick = now => {
      const elapsed = (now - startTime) / 1000;
      if ((!canTrackPointer || !activePointer) && autoOrbit) {
        const orbit = elapsed * safeOrbitSpeed * Math.PI * 2;
        const fallbackAmount = canTrackPointer ? 0.18 : 0.55;
        target.x = baseRotation.x + Math.sin(orbit) * safeTilt * fallbackAmount;
        target.y = baseRotation.y + Math.cos(orbit * 0.85) * safeTilt * fallbackAmount;
        targetDepth = safeDepth * (1 + Math.sin(orbit * 0.75) * 0.22);
      } else if (activePointer) {
        targetDepth = safeDepth * 1.35;
      } else {
        targetDepth = safeDepth;
      }

      current.x += (target.x - current.x) * safeSmoothing;
      current.y += (target.y - current.y) * safeSmoothing;
      currentDepth += (targetDepth - currentDepth) * safeSmoothing;
      applyTransform();
      frameId = requestAnimationFrame(tick);
    };

    applyTransform();
    frameId = requestAnimationFrame(tick);

    return () => {
      if (canTrackPointer) {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerleave', handlePointerLeave);
        window.removeEventListener('blur', handlePointerLeave);
      }
      cancelAnimationFrame(frameId);
      startTime = 0;
    };
  }, [autoOrbit, baseRotation, pointerTracking, safeDepth, safeOrbitSpeed, safeSmoothing, safeTilt]);

  const rootStyle = {
    ...style,
    '--depth-step': `${safeDepth}px`,
    '--depth-text-perspective': `${safePerspective}px`,
    '--depth-text-font-size': fontSize,
    '--depth-text-font-weight': fontWeight,
    '--depth-text-font-family': fontFamily,
    '--depth-text-letter-spacing': letterSpacing,
    '--depth-text-line-height': lineHeight,
    '--depth-text-face-color': faceColor,
    '--depth-text-depth-color': depthColor,
    '--depth-text-shadow': typeof shadow === 'string'
      ? shadow
      : shadow
      ? `0 ${Math.max(2, Math.round(safeDepth * safeLayers * 0.4))}px ${Math.max(4, Math.round(safeDepth * safeLayers * 0.8))}px rgba(0, 0, 0, 0.12)`
      : 'none'
  };

  return (
    <span
      ref={rootRef}
      className={`depth-text ${className}`.trim()}
      style={rootStyle}>
      <span ref={stageRef} className="depth-text__stage">
        {depthLayers.map(layer => (
          <span
            aria-hidden="true"
            className="depth-text__layer"
            key={layer.index}
            style={{
              color: layer.color,
              transform: `translateZ(calc(-1 * ${layer.index} * var(--depth-step, ${safeDepth}px)))`
            }}>
            {text}
          </span>
        ))}
        <span className="depth-text__face">{text}</span>
      </span>
    </span>
  );
};

export default DepthText;
