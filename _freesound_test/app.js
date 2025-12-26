
document.getElementById("loginBtn").onclick = () => {

  window.location.href =
    `/oauth/login`;
}


document.getElementById("downloadBtn").onclick = async () => {
  const id = document.getElementById("soundId").value;

  const res = await fetch(`/download/${id}`, { method: "POST" });
  alert(res.ok ? "Download started" : "Not authorized");
};
