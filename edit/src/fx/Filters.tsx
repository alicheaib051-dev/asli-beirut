import React from "react";

/**
 * Channel-isolating filters used by <RGBSplit>. Mounted once at the root so the
 * ids are available to every scene.
 */
export const FilterDefs: React.FC = () => (
  <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
    <defs>
      <filter id="chan-r" colorInterpolationFilters="sRGB">
        <feColorMatrix
          type="matrix"
          values="1 0 0 0 0
                  0 0 0 0 0
                  0 0 0 0 0
                  0 0 0 1 0"
        />
      </filter>
      <filter id="chan-g" colorInterpolationFilters="sRGB">
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0
                  0 1 0 0 0
                  0 0 0 0 0
                  0 0 0 1 0"
        />
      </filter>
      <filter id="chan-b" colorInterpolationFilters="sRGB">
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0
                  0 0 0 0 0
                  0 0 1 0 0
                  0 0 0 1 0"
        />
      </filter>
      <filter id="grain-noise" colorInterpolationFilters="linearRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.5
                  0 0 0 0 0.5
                  0 0 0 0 0.5
                  0 0 0 0.6 0"
        />
      </filter>
    </defs>
  </svg>
);
