
document.getElementById("loginBtn").onclick = () => {

  window.location.href =
    `/oauth/login`;
}

document.getElementById("downloadBtn").onclick = async () => {
  const id = document.getElementById("soundId").value;

  const res = fetch(`/download?id=${id}`, { method: "GET" });

  console.log(res)  
};