// app.ts
const button = document.getElementById("downloadBtn");
const input = document.getElementById("soundId");

button.onclick = async () => {
  const id = input.value;
  if (!id) return;
  console.log
  const response = await fetch(`/api/freesound/download/${id}`);
  if (!response.ok) {
    alert("Download failed");
    return;
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `freesound_${id}`;
  document.body.appendChild(a);
  a.click();

  URL.revokeObjectURL(url);
  a.remove();
};
