require("dotenv").config();

const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo");

const { connectDb } = require("./config/db");
const passport = require("./config/passport");
const authRoutes = require("./routes/auth");
const pageRoutes = require("./routes/pages");
const memberRoutes = require("./routes/members");
const structureRoutes = require("./routes/structure");
const statsRoutes = require("./routes/stats");
const { ensureMember } = require("./middleware/ensureMember");

const PORT = process.env.PORT || 4000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

async function main() {
  await connectDb();

  const app = express();
  app.set("trust proxy", 1);

  app.use(cors({ origin: CLIENT_URL, credentials: true }));
  app.use(express.json());

  app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 14, // 14 days
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  app.use("/auth", authRoutes);

  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  app.use("/api", pageRoutes);
  app.use("/api/members", memberRoutes);
  app.use("/api", structureRoutes);
  app.use("/api", statsRoutes);

  // An unmatched /api/* must not fall through to the SPA fallback below —
  // fetch() would then parse index.html as JSON and fail with a syntax error
  // that says nothing about the real problem (a wrong path).
  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Unknown API route." });
  });

  // In production the built React app is served from this same origin, so the
  // session cookie is first-party on every request. (Split domains would need
  // sameSite:"none", which browsers only honour over HTTPS.) Locally this is
  // skipped — Vite serves the client on its own port instead.
  const clientDist = path.join(__dirname, "../../client/dist");
  if (fs.existsSync(path.join(clientDist, "index.html"))) {
    app.use(express.static(clientDist));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(clientDist, "index.html"));
    });
  }

  // Routes hand errors here via next(err). Without this Express replies with
  // an HTML stack trace, which leaks internals and breaks any client that
  // expects JSON.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, _next) => {
    // A malformed :id is the caller's mistake, not a server failure.
    if (err.name === "CastError") {
      return res.status(400).json({ error: "Malformed id." });
    }
    if (err.name === "ValidationError") {
      return res.status(400).json({ error: err.message });
    }
    console.error(`${req.method} ${req.originalUrl} failed:`, err);
    res.status(500).json({ error: "Something went wrong." });
  });

  app.listen(PORT, () => {
    console.log(`AI Hub auth server listening on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
