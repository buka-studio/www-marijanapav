import './SketchbookPocket.css';

const stickers = [
  { name: 'ticket', src: '/stickers/Zet.svg', width: 286, height: 295 },
  { name: 'key', src: '/stickers/Cmd-key.svg', width: 148, height: 153 },
  { name: 'stamp', src: '/stickers/Stamp1.svg', width: 165, height: 212 },
  { name: 'mark', src: '/stickers/Copyright.svg', width: 116, height: 136 },
];

export default function SketchbookPocket() {
  return (
    <div className="sketchbook-pocket" aria-hidden="true">
      <div className="sketchbook-pocket-inside" />
      {stickers.map(({ name, ...image }) => (
        // eslint-disable-next-line @next/next/no-img-element -- an SVG, which next/image doesn't optimise
        <img
          key={name}
          {...image}
          alt=""
          draggable={false}
          className={`sketchbook-pocket-slip sketchbook-pocket-${name}`}
        />
      ))}
      <div className="sketchbook-pocket-front">
        <div />
      </div>
    </div>
  );
}
