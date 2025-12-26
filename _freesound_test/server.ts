import express from "express";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { pipeline } from "stream";
import { promisify } from "util";

const streamPipeline = promisify(pipeline);

const app = express();
const PORT = 5500;

const FREESOUND_TOKEN = "scJebMYbA7dfuN2KUJqEoxzg7iWWRp6lqYlzapte";
const SOUNDS_DIR = path.resolve("./sounds");

if (!fs.existsSync(SOUNDS_DIR)) {
  fs.mkdirSync(SOUNDS_DIR, { recursive: true });
}

app.get("/api/freesound/download/:id", async (req, res) => {
  const soundId = req.params.id;
  const url = `https://freesound.org/apiv2/sounds/${soundId}/download/`;
  console.log(url);
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${FREESOUND_TOKEN}`,
      },
    });

    if (!response.ok || !response.body) {
      const text = await response.text();
      res.status(response.status).send(text);
      return;
    }

    // Try to extract filename from Content-Disposition
    const disposition = response.headers.get("content-disposition");
    let filename = `freesound_${soundId}`;

    if (disposition) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match) filename = match[1];
    }

    const filePath = path.join(SOUNDS_DIR, filename);
    const fileStream = fs.createWriteStream(filePath);

    // Write to disk
    await streamPipeline(response.body, fileStream);

    res.json({
      status: "ok",
      soundId,
      savedAs: filename,
      path: filePath,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Download failed");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
