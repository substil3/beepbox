import express from "express";
import fetch from "node-fetch";
import "dotenv/config";
import downloadToDisk from "./freesoundDownload.js";
import session from "express-session";

const app = express();

app.use(
  session({
    name: "freesound.sid",
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false
  })
);

app.use(express.static("."))

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


app.listen(3000, () => {
  console.log("http://localhost:3000");
});
