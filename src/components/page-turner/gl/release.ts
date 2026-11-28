function releaseWhenGone(canvas: HTMLCanvasElement, gl: WebGL2RenderingContext) {
  setTimeout(() => {
    if (!canvas.isConnected && !gl.isContextLost()) {
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
  });
}

export { releaseWhenGone };
