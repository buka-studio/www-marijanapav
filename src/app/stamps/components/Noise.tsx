import { cn } from '~/src/util';

export default function Noise({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={cn(className)}>
      <filter id="noiseFilter">
        <feTurbulence
          className="turbulence"
          type="fractalNoise"
          baseFrequency="1.45"
          numOctaves="3"
          stitchTiles="stitch"
        />
      </filter>

      <filter id="paperFilter" x="0%" y="0%" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" result="noise" numOctaves="5" />

        <feDiffuseLighting in="noise" lightingColor="white" surfaceScale="2">
          <feDistantLight azimuth="45" elevation="60" />
        </feDiffuseLighting>
      </filter>

      <filter id="grainyDistortFilter" filterUnits="userSpaceOnUse">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.75"
          numOctaves="2"
          stitchTiles="stitch"
          result="noise"
        />
        <feColorMatrix in="SourceGraphic" type="saturate" values="0" result="desat" />
        <feDisplacementMap
          in="desat"
          in2="noise"
          scale="7"
          xChannelSelector="R"
          yChannelSelector="G"
          result="distort"
        />
        <feBlend in="distort" in2="noise" mode="multiply" />
      </filter>


      <filter id="distortFilter" x="0%" y="0%" width="100%" height="100%">
              {/* Generate the fractal noise */}
              <feTurbulence 
                type="fractalNoise"
                baseFrequency="0.03" // Low frequency for large, wobbly distortions
                numOctaves="4"
                seed="1" // A fixed seed for consistent look
                result="noise"
              />
              {/* Apply the noise to displace the graphics (SourceGraphic) */}
              <feDisplacementMap 
                in="SourceGraphic"
                in2="noise"
                scale="30" // Intensity of the distortion (Higher = more wobbly)
                xChannelSelector="R" // Use the Red channel of the noise for X displacement
                yChannelSelector="R" // Use the Red channel of the noise for Y displacement
              />
            </filter>
    </svg>
  );
}
