import express from "express";
import fetch from "node-fetch";
import "dotenv/config";
import downloadToDisk from "./_freesound_test/freesoundDownload.js";
import session from "express-session";
import fs from "fs";
import path from "path";

const app = express();

app.use(
  session({
    name: "freesound.sid",
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false
  })
);

const ROOT_DIR = path.join("./");
const INDEX_HTML = path.join(ROOT_DIR, "index.html");
const PUBLIC_DIR = "./";
const SOUNDS_DIR = path.join(ROOT_DIR, "sounds");


/* Step 1: Redirect user to Freesound */
app.get("/oauth/login", (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.FREESOUND_CLIENT_ID,
    response_type: "code",
    state: "xyz"
  });

  res.redirect(
    `https://freesound.org/apiv2/oauth2/authorize/?${params}`
  );
});

/* Step 2: Receive authorization code */
/* OAuth callback */
app.get("/oauth/callback", async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send("Missing authorization code");
  }

  const tokenResponse = await fetch(
    "https://freesound.org/apiv2/oauth2/access_token/",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        client_id: process.env.FREESOUND_CLIENT_ID,
        client_secret: process.env.FREESOUND_CLIENT_SECRET,
        grant_type: "authorization_code",
        code: code
      })
    }
  );

  if (!tokenResponse.ok) {
    const errText = await tokenResponse.text();
    return res.status(500).send(errText);
  }

  const tokenData = await tokenResponse.json();

  /*
    tokenData contains:
    - access_token
    - token_type
    - expires_in
    - refresh_token (if enabled)
  */

  console.log("ACCESS TOKEN:", tokenData.access_token);

  req.session.accessToken = tokenData.access_token;
  res.send("Authorization successful. You may close this page.");

});


app.get("/download/", async (req, res) => {
  try {
    const id = req.query.id;
    const accessToken = req.session.accessToken;

    if (!id) {
      return res.status(400).send("Missing sound ID");
    }

    if (!accessToken) {
      return res.status(401).send("Not authenticated");
    }

    const filePath = await downloadToDisk(id, accessToken);

    res.json({
      success: true,
      file: filePath
    });
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

app.get("/api/sounds", (_req, res) => {
  fs.readdir(SOUNDS_DIR, (err, files) => {
    if (err) {
      res.status(500).json({ error: "Failed to read sounds directory" });
      return;
    }

    const soundFiles = files.filter(f =>
      /\.(wav|mp3|ogg|flac)$/i.test(f)
    );

    res.json(soundFiles);
  });
});

app.get("/", (req, res) => {
    const dirs = fs.readdirSync(PUBLIC_DIR, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);

    dirs.forEach(dir => {
        app.use(`/${dir}`, express.static(path.join(PUBLIC_DIR, dir)));
    });

    const html = fs.readFileSync(INDEX_HTML, "utf8")
        .replace(
            "{{DIRECTORY_LIST}}",
            dirs.map(d => `<li><a href="/${d}/">${d}</a></li>`).join("")
        );

    res.send(html);
});

app.listen(3000, () => {
  console.log("http://localhost:3000");
});


