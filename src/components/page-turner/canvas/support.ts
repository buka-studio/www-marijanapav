/**
 * Whether this browser can draw elements into a canvas, which the curling renderer is built on. False on a server,
 * so the first HTML is always the plain one. A book whose canvas can't be drawn to after all goes back to folding.
 */
function canCurl(): boolean {
  return (
    typeof HTMLCanvasElement !== 'undefined' &&
    'requestPaint' in HTMLCanvasElement.prototype &&
    typeof WebGL2RenderingContext !== 'undefined' &&
    'texElementSubImage2D' in WebGL2RenderingContext.prototype
  );
}

export { canCurl };
