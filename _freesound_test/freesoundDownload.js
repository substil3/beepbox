import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";

export default async function downloadToDisk(
  id,
  accessToken
) {

  console.log("download sound : " + id);
  const download_url = `https://freesound.org/apiv2/sounds/${id}/download/`;

  const response = await fetch(download_url, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok || !response.body) {
    throw new Error(`Freesound API error: ${response.status}`);
  }


  const meta_url = `https://freesound.org/apiv2/sounds/${id}`;
  const meta_response = await fetch(meta_url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
  const metadata = await meta_response.json();
  const fileName = metadata.name


  const soundsDir = path.resolve("./sounds");
  await fs.promises.mkdir(soundsDir, { recursive: true });

  const filePath = path.join(soundsDir, `${fileName}`);
  const writeStream = fs.createWriteStream(filePath);

  await pipeline(response.body, writeStream);

  return filePath;
}