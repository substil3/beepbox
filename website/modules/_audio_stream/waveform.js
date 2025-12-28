const select = document.getElementById("soundSelect");

const canvas = document.getElementById("waveform");
const ctx = canvas.getContext("2d");

const audioCtx = new AudioContext();

// Populate select box
fetch("/api/sounds")
  .then(res => res.json())
  .then(files => {
    files.forEach(file => {
      const option = document.createElement("option");
      option.value = file;
      option.textContent = file;
      select.appendChild(option);
    });
  });

select.onchange = async () => {
  const file = select.value;
  if (!file) return;

  const response = await fetch(`/sounds/${file}`);
  const arrayBuffer = await response.arrayBuffer();

  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  drawWaveform(audioBuffer);
};

function drawWaveform(audioBuffer) {
  const channelData = audioBuffer.getChannelData(0); // mono or left channel
  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);
  ctx.beginPath();
  ctx.strokeStyle = "#000";

  const step = Math.floor(channelData.length / width);
  const midY = height / 2;

  for (let x = 0; x < width; x++) {
    const sample = channelData[x * step];
    const y = midY - sample * midY;

    if (x === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.stroke();
}
