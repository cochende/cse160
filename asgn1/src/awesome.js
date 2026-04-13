function playShapeSound(type, color, size) {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const ctx = new AudioCtx();

  // assign audio types to different shapes
  let wave = "square";
  if (type === "triangle") wave = "triangle";
  if (type === "circle") wave = "sine";
  if (type === "point") wave = "square";

  // assign freq based on color
  const freq = 100 + 1000 * (0.3 * color[0] + 0.6 * color[1] + 0.1 * color[2]);

  // assign duration based on size
  const duration = 0.1 + 0.4 * ((size - 5) / 35);

  const osc = ctx.createOscillator();
  osc.type = wave;
  osc.frequency.value = freq;

  const gain = ctx.createGain();
  gain.gain.value = 0.2;

  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);

  osc.onended = () => ctx.close();
}
