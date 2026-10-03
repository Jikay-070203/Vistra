import type { SVGProps } from 'react';
import styles from './landing-editorial-motif.module.css';

export type EditorialMotifVariant = 'sunrise' | 'route' | 'terrain';

export interface LandingEditorialMotifProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  variant: EditorialMotifVariant;
  className?: string;
  width?: number | string;
  height?: number | string;
}

/**
 * Editorial Motif: Sunrise
 * Reference B travel poster aesthetic: geometric sun arch, radiating rays, horizon line.
 */
function SunriseMotif() {
  return (
    <>
      {/* Decorative dashed outer halo arch */}
      <path
        d="M20 74 A50 50 0 0 1 120 74"
        fill="none"
        stroke="var(--vistra-aqua, #9DD8E2)"
        strokeWidth="1.5"
        strokeDasharray="4 4"
      />

      {/* Radiating geometric rays */}
      <line x1="70" y1="12" x2="70" y2="22" stroke="var(--vistra-navy, #0E1D4F)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="42" y1="24" x2="49" y2="31" stroke="var(--vistra-royal-blue, #205BD6)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="98" y1="24" x2="91" y2="31" stroke="var(--vistra-royal-blue, #205BD6)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="24" y1="46" x2="33" y2="50" stroke="var(--vistra-turquoise, #08B3C6)" strokeWidth="2" strokeLinecap="round" />
      <line x1="116" y1="46" x2="107" y2="50" stroke="var(--vistra-turquoise, #08B3C6)" strokeWidth="2" strokeLinecap="round" />

      {/* Outer sun body */}
      <path
        d="M36 74 A34 34 0 0 1 104 74 Z"
        fill="var(--vistra-yellow, #E7AD2E)"
        stroke="var(--vistra-navy, #0E1D4F)"
        strokeWidth="2"
      />

      {/* Graphic stripe texture inside sun */}
      <line x1="42" y1="58" x2="98" y2="58" stroke="var(--vistra-navy, #0E1D4F)" strokeWidth="1.5" strokeDasharray="3 3" />
      <line x1="46" y1="65" x2="94" y2="65" stroke="var(--vistra-navy, #0E1D4F)" strokeWidth="1.5" />

      {/* Inner architectural arch */}
      <path
        d="M52 74 A18 18 0 0 1 88 74 Z"
        fill="var(--vistra-warm-neutral, #EBF1F0)"
        stroke="var(--vistra-navy, #0E1D4F)"
        strokeWidth="2"
      />

      {/* Focal dot */}
      <circle cx="70" cy="46" r="3" fill="var(--vistra-navy, #0E1D4F)" />

      {/* Horizon base line */}
      <line
        x1="10"
        y1="74"
        x2="130"
        y2="74"
        stroke="var(--vistra-navy, #0E1D4F)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Secondary accent baseline */}
      <line
        x1="22"
        y1="78"
        x2="118"
        y2="78"
        stroke="var(--vistra-turquoise, #08B3C6)"
        strokeWidth="1.5"
        strokeDasharray="2 4"
      />
    </>
  );
}

/**
 * Editorial Motif: Route
 * Geometric travel waypoints, smooth connecting curve, dashed alternate segment and indicator.
 */
function RouteMotif() {
  return (
    <>
      {/* Elevation / coordinate reference baseline */}
      <line
        x1="14"
        y1="74"
        x2="126"
        y2="74"
        stroke="var(--vistra-navy, #0E1D4F)"
        strokeWidth="1.5"
        strokeDasharray="3 3"
        opacity="0.4"
      />

      {/* Primary segment (solid royal blue) */}
      <path
        d="M24 58 C 36 28, 48 24, 66 26"
        fill="none"
        stroke="var(--vistra-royal-blue, #205BD6)"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Secondary planned segment (dashed navy) */}
      <path
        d="M66 26 C 86 28, 98 54, 116 52"
        fill="none"
        stroke="var(--vistra-navy, #0E1D4F)"
        strokeWidth="2.5"
        strokeDasharray="5 4"
        strokeLinecap="round"
      />

      {/* Waypoint 1: Origin */}
      <circle
        cx="24"
        cy="58"
        r="7"
        fill="var(--vistra-aqua, #9DD8E2)"
        stroke="var(--vistra-navy, #0E1D4F)"
        strokeWidth="2"
      />
      <circle cx="24" cy="58" r="2.5" fill="var(--vistra-royal-blue, #205BD6)" />

      {/* Waypoint 2: Milestone / Focal Hub */}
      <rect
        x="58"
        y="18"
        width="16"
        height="16"
        rx="4"
        transform="rotate(45 66 26)"
        fill="var(--vistra-yellow, #E7AD2E)"
        stroke="var(--vistra-navy, #0E1D4F)"
        strokeWidth="2"
      />
      <circle cx="66" cy="26" r="2.5" fill="var(--vistra-navy, #0E1D4F)" />

      {/* Waypoint 3: Destination Pin */}
      <circle
        cx="116"
        cy="52"
        r="8"
        fill="var(--vistra-turquoise, #08B3C6)"
        stroke="var(--vistra-navy, #0E1D4F)"
        strokeWidth="2"
      />
      <circle cx="116" cy="52" r="3" fill="var(--vistra-warm-neutral, #EBF1F0)" />

      {/* Direction indicator chevron */}
      <path
        d="M90 36 L97 40 L90 44"
        fill="none"
        stroke="var(--vistra-turquoise, #08B3C6)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Distance ticks */}
      <circle cx="24" cy="74" r="2" fill="var(--vistra-navy, #0E1D4F)" />
      <circle cx="66" cy="74" r="2" fill="var(--vistra-navy, #0E1D4F)" />
      <circle cx="116" cy="74" r="2" fill="var(--vistra-navy, #0E1D4F)" />
    </>
  );
}

/**
 * Editorial Motif: Terrain
 * Layered geometric mountains, architectural contour curves, graphic sun disk, ground baseline.
 */
function TerrainMotif() {
  return (
    <>
      {/* Sun disk in sky */}
      <circle
        cx="106"
        cy="24"
        r="11"
        fill="var(--vistra-yellow, #E7AD2E)"
        stroke="var(--vistra-navy, #0E1D4F)"
        strokeWidth="2"
      />

      {/* Distant mountain ridge (Mint atmosphere) */}
      <polygon
        points="14,74 48,22 84,74"
        fill="var(--vistra-mint, #9FEFC7)"
        stroke="var(--vistra-navy, #0E1D4F)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Distant ridge facet shadow */}
      <polygon
        points="48,22 84,74 48,74"
        fill="var(--vistra-cyan, #10E4D0)"
        opacity="0.35"
      />
      {/* Ridge accent line */}
      <line x1="48" y1="22" x2="48" y2="74" stroke="var(--vistra-navy, #0E1D4F)" strokeWidth="1.5" />

      {/* Midground mountain ridge (Turquoise) */}
      <polygon
        points="60,74 92,34 126,74"
        fill="var(--vistra-turquoise, #08B3C6)"
        stroke="var(--vistra-navy, #0E1D4F)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <polygon
        points="92,34 126,74 92,74"
        fill="var(--vistra-royal-blue, #205BD6)"
        opacity="0.25"
      />
      <line x1="92" y1="34" x2="92" y2="74" stroke="var(--vistra-navy, #0E1D4F)" strokeWidth="1.5" />

      {/* Foreground rolling hill / architectural arch curve */}
      <path
        d="M8 74 C 28 54, 52 54, 76 74 Z"
        fill="var(--vistra-aqua, #9DD8E2)"
        stroke="var(--vistra-navy, #0E1D4F)"
        strokeWidth="2"
      />

      {/* Ground baseline */}
      <line
        x1="6"
        y1="74"
        x2="134"
        y2="74"
        stroke="var(--vistra-navy, #0E1D4F)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </>
  );
}

/**
 * LandingEditorialMotif
 * Shared decoration component for Vistra Landing (Reference B geometric travel).
 * Accessible: aria-hidden="true", focusable="false".
 */
export function LandingEditorialMotif({
  variant,
  className,
  width = 140,
  height = 84,
  style,
  ...props
}: LandingEditorialMotifProps) {
  return (
    <span className={`${styles.motifWrapper} ${className ?? ''}`} style={{ width, height, ...style }}>
      <svg
        aria-hidden="true"
        focusable="false"
        role="presentation"
        viewBox="0 0 140 84"
        width={width}
        height={height}
        className={styles.motifSvg}
        {...props}
      >
        {variant === 'sunrise' && <SunriseMotif />}
        {variant === 'route' && <RouteMotif />}
        {variant === 'terrain' && <TerrainMotif />}
      </svg>
    </span>
  );
}

export default LandingEditorialMotif;
