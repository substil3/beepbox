import fs from "fs";
import fetch from "node-fetch";

export default async function downloadToDisk(id, accessToken) {
  const url = `https://freesound.org/apiv2/sounds/${id}/download/`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`Freesound error: ${response.status}`);
  }

  const out = fs.createWriteStream(`./sounds/freesound_${id}.wav`);
  response.body.pipe(out);

  return new Promise((res, rej) => {
    out.on("finish", res);
    out.on("error", rej);
  });
}