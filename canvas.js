export function setupCanvas(canvasEl, { onStrokeEnd } = {}) {
  const ctx = canvasEl.getContext('2d');
  let drawing = false;
  let hasStrokes = false;

  function resize() {
    canvasEl.width = window.innerWidth;
    canvasEl.height = window.innerHeight;
    clearCanvas();
  }

  function clearCanvas() {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvasEl.width, canvasEl.height);
    hasStrokes = false;
  }

  function getPos(e) {
    const rect = canvasEl.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  function startStroke(e) {
    e.preventDefault();
    drawing = true;
    hasStrokes = true;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.strokeStyle = '#2d1b4e';
    ctx.lineWidth = Math.max(8, canvasEl.width / 25);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }

  function moveStroke(e) {
    if (!drawing) return;
    e.preventDefault();
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  function endStroke(e) {
    if (!drawing) return;
    e.preventDefault();
    drawing = false;
    if (hasStrokes && onStrokeEnd) {
      onStrokeEnd();
    }
  }

  // Use pointer events for unified touch/mouse support
  canvasEl.addEventListener('pointerdown', startStroke);
  canvasEl.addEventListener('pointermove', moveStroke);
  canvasEl.addEventListener('pointerup', endStroke);
  canvasEl.addEventListener('pointerleave', endStroke);
  canvasEl.addEventListener('pointercancel', endStroke);

  window.addEventListener('resize', resize);
  resize();

  return {
    clear: clearCanvas,
    resize,
    getImageData: () => {
      if (!hasStrokes) return null;
      return ctx.getImageData(0, 0, canvasEl.width, canvasEl.height);
    },
  };
}
