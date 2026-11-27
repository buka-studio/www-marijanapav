/**
 * Gives a canvas's WebGL context back once the canvas has left the page. A browser keeps only so many, and takes
 * the oldest away to make another: left to itself, a context goes only when its canvas is collected, which a book
 * mounted over and over, as one in a dialog is, gets ahead of.
 */
function releaseWhenGone(canvas: HTMLCanvasElement, gl: WebGL2RenderingContext) {
  // Not at once: the same canvas may be bound again, as React's strict mode does, and wants its context still.
  setTimeout(() => {
    if (!canvas.isConnected && !gl.isContextLost()) {
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
  });
}

export { releaseWhenGone };
