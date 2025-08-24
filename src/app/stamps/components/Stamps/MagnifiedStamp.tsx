import { clamp, motion, useAnimation, useDragControls } from 'framer-motion';
import Image from 'next/image';
import { CSSProperties, useEffect, useRef, useState } from 'react';

import useMatchMedia from '~/src/hooks/useMatchMedia';
import { remap } from '~/src/math';
import { cn } from '~/src/util';

import { Stamp } from '../../models';
import { useZoomStore } from '../zoomStore';
import { Magnify, MagnifyInput, MagnifyOutput } from './Magnify';
import RadialDial from './RadialDial';
import ReflectionArc from './ReflectionArc';

type Point = {
  x: number;
  y: number;
};

function getPointerLocalCoords(point: Point, constraint?: HTMLElement | null) {
  if (!constraint) return { x: 0, y: 0 };

  const rect = constraint.getBoundingClientRect();
  return {
    x: point.x - rect.left,
    y: point.y - rect.top,
  };
}

function getPointerOffsetFromCenter(point: Point, element?: HTMLElement | null) {
  if (!element) return { x: 0, y: 0 };

  // Get the element's bounding rectangle
  const rect = element.getBoundingClientRect();

  // Calculate the center coordinates relative to the viewport
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  // Get the mouse click coordinates
  const clickX = point.x;
  const clickY = point.y;

  // Calculate offset from the center
  const offsetX = clickX - centerX;
  const offsetY = clickY - centerY;

  return { x: offsetX, y: offsetY };
}

function calculateReflectionAngle(point: Point, element?: HTMLElement | null) {
  if (!element) return 0;

  const rect = element.getBoundingClientRect();

  // Parent's center in local coordinates
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;

  // dx, dy from magnifier to center (inverted so angle 0 is on the right side)
  const dx = centerX - point.x;
  const dy = centerY - point.y;

  // Convert from radians to degrees
  const angleRadians = Math.atan2(dy, dx);
  const angleDegrees = (angleRadians * 180) / Math.PI;

  return angleDegrees;
}

function getShadowOffset(angle: number, distance: number) {
  // Convert angle to radians with offsetAngle = 180 - angle
  const offsetAngleDeg = 180 - angle;
  const offsetAngleRad = (offsetAngleDeg * Math.PI) / 180;

  const x = distance * Math.cos(offsetAngleRad);
  const y = distance * Math.sin(offsetAngleRad);
  return { x, y };
}

interface Props {
  selectedStamp?: Stamp | null;
  dragConstraints?: React.RefObject<HTMLDivElement> | null;
}

export default function MagnifiedStamp({ selectedStamp, dragConstraints }: Props) {
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [angle, setAngle] = useState<number>(0);
  const scale = remap(clamp(0, 360, angle), 0, 360, 1.5, 3);

  const isMobile = useMatchMedia('(max-width: 768px)');

  const lensSize = isMobile ? 250 : 350;
  const dialSize = isMobile ? 350 : 450;
  const arcSize = isMobile ? 250 : 350;

  const zoom = useZoomStore();
  const dialDragControls = useDragControls();

  const draggingMagnifier = useRef(false);
  const draggingMagnifierRefOffset = useRef<{ x: number; y: number } | null>({ x: 0, y: 0 });

  const magnifierControls = useAnimation();
  // const { coords, setCoords } = useCoordinatesStore();

  const reflectionAngle = calculateReflectionAngle(
    { x: coords?.x ?? 0, y: coords?.y ?? 0 },
    dragConstraints?.current,
  );

  const shadowOffset = getShadowOffset(reflectionAngle, 10);

  useEffect(() => {
    if (!dragConstraints?.current) return;

    if (zoom.zoomed) {
      setCoords({
        x: dragConstraints.current.offsetWidth / 2,
        y: dragConstraints.current.offsetHeight / 2,
      });

      magnifierControls
        .start({
          x: dragConstraints.current.offsetWidth / 2 - 225,
          y: dragConstraints.current.offsetHeight / 2 - 225,
          transition: {
            duration: 0,
          },
        })
        .then(() => {
          magnifierControls.start({
            opacity: 1,

            filter: 'blur(0px)',
          });
        });
    } else {
      magnifierControls.start({
        opacity: 0,
        filter: 'blur(10px)',
      });
    }
  }, [zoom.zoomed, magnifierControls, setCoords]);

  return (
    <Magnify hover={false}>
      <MagnifyInput className="pointer-events-none absolute inset-0 z-50 cursor-default select-none">
        <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-black/5 opacity-0">
          {selectedStamp && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <motion.div
                initial={{
                  filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.15))',
                }}
                animate={{
                  filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.15))',
                }}
              >
                <Image
                  src={selectedStamp.srcLg}
                  alt=""
                  width={220}
                  height={284}
                  className="scale-150"
                />{' '}
              </motion.div>
            </div>
          )}
        </div>
      </MagnifyInput>
      <motion.div
        drag
        initial={{
          opacity: 0,
        }}
        dragElastic={0.1}
        dragListener={false}
        dragControls={dialDragControls}
        dragMomentum={false}
        dragConstraints={dragConstraints!}
        animate={magnifierControls}
        style={
          {
            '--lens-size': `${lensSize}px`,
            '--dial-size': `${dialSize}px`,
          } as CSSProperties
        }
        // style={
        //   {
        //     '--x': `${shadowOffset.x}px`,
        //     '--y': `${-shadowOffset.y}px`,
        //   } as CSSProperties
        // }
        className={cn(
          'magnifier pointer-events-auto absolute z-[100] flex aspect-square w-[var(--dial-size)] items-center justify-center rounded-full bg-stone-300  shadow-black/30 outline outline-1 outline-[rgba(255,255,255,0.1)]',
          'shadow-[var(--x)_var(--y)_10px_2px_rgba(0,0,0,0.1)] shadow-lg',
          {
            'pointer-events-none': !zoom.zoomed,
          },
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 flex select-none items-center
          justify-center rounded-full [box-shadow:0px_0px_10px_10px_inset_rgba(255,255,255,0.3)]
          "
        >
          <MagnifyOutput
            lensWidth={lensSize}
            lensHeight={lensSize}
            scale={scale}
            coords={coords}
            className="static rounded-full bg-stone-200 [&_.magnified-plane>*]:overflow-visible [&_.magnified-plane>*]:opacity-100"
          />

          <div
            className={cn(
              'pointer-events-auto absolute inset-0 left-1/2 top-1/2 z-[100] aspect-square w-[var(--lens-size)] -translate-x-1/2 -translate-y-1/2 touch-none rounded-full',
              {
                'pointer-events-none': !zoom.zoomed,
              },
            )}
            onPointerDown={(event) => {
              draggingMagnifier.current = true;
              dialDragControls.start(event);

              const draggableCoords = getPointerOffsetFromCenter(
                {
                  x: event.clientX,
                  y: event.clientY,
                },
                event.currentTarget,
              );

              draggingMagnifierRefOffset.current = {
                x: draggableCoords.x,
                y: draggableCoords.y,
              };
            }}
            onPointerMove={(event) => {
              const localCoords = getPointerLocalCoords(
                {
                  x: event.clientX,
                  y: event.clientY,
                },
                dragConstraints?.current!,
              );

              if (draggingMagnifier.current) {
                const coords = {
                  x: localCoords.x - (draggingMagnifierRefOffset.current?.x ?? 0),
                  y: localCoords.y - (draggingMagnifierRefOffset.current?.y ?? 0),
                };

                setCoords(coords);
              }
            }}
            onPointerUp={() => {
              draggingMagnifier.current = false;
            }}
          />
        </div>

        <div className="pointer-events-none absolute z-50 grid items-center justify-center">
          <div className="absolute inset-0 rounded-full backdrop-blur-[100px] [mask-image:radial-gradient(circle,transparent_61%,black_70%)]" />
          <ReflectionArc
            rotation={reflectionAngle}
            size={arcSize}
            width={2}
            blur={2}
            color="white"
            className="[grid-area:1/1]"
            arcRadians={Math.PI / 1.5}
          />
          <ReflectionArc
            rotation={reflectionAngle}
            size={arcSize - 20}
            width={4}
            blur={8}
            color="white"
            className="justify-self-center opacity-80 [grid-area:1/1]"
            arcRadians={Math.PI / 1.5}
          />
        </div>

        <RadialDial
          key={isMobile ? 'mobile' : 'desktop'}
          className="pointer-events-none absolute inset-0 z-50"
          inscription="1.5x - 2x Lens Zoom Magnifier"
          size={dialSize}
          lineCount={180}
          lineLength={8}
          lineWidth={1}
          lineColor="rgba(255, 255, 255, 0.7)"
          snapAngle={10}
          stiffness={500}
          damping={50}
          onChangeAngle={setAngle}
          minAngle={0}
          maxAngle={360}
        />
      </motion.div>
    </Magnify>
  );
}
