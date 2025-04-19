import express, { json } from "express";
import "dotenv/config";
import axios from "axios";

const app = express();

const PORT = process.env.PORT || 6001;

app.use(json({ extended: false }));

app.get("/api/oauth", async (req, res) => {
  try {
    // Backend Oauth Logic Here
    const code = req.query.code;

    const url = "https://oauth2.googleapis.com/token";

    const options = {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URL,
      grant_type: "authorization_code",
    };

    const queryString = new URLSearchParams(options);

    const { id_token, access_token } = (
      await axios.post(url, queryString.toString(), {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      })
    ).data;

    const googleUser = (
      await axios.get(
        `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`,
        {
          headers: {
            Authorization: `Bearer ${id_token}`,
          },
        }
      )
    ).data;

    res.cookie("username", googleUser.given_name);

    res.redirect("http://localhost:3000");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/redirectUrl", async (req, res) => {
  const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
  console.log(process.env.GOOGLE_CLIENT_ID);

  const options = {
    redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URL,
    client_id: process.env.GOOGLE_CLIENT_ID,
    access_type: "online",
    response_type: "code",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ].join(" "),
  };

  const queryString = new URLSearchParams(options).toString();

  const url = `${rootUrl}?${queryString.toString()}`;

  res.send(url);
});

const startUp = async () => {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
};

startUp();
