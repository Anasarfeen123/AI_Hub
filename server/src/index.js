require("dotenv").config();

const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const mongoose = require("mongoose");

const { connectDb } = require("./config/db");
const passport = require("./config/passport");
const authRoutes = require("./routes/auth");
const pageRoutes = require("./routes/pages");
const memberRoutes = require("./routes/members");
const structureRoutes = require("./routes/structure");
const statsRoutes = require("./routes/stats");
const libraryRoutes = require("./routes/library");
const commentRoutes = require("./routes/comments");
const adminRoutes = require("./routes/admin");
const { ensureMember } = require("./middleware/ensureMember");

const PORT = process.env.PORT || 4000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

async function main() {
  await connectDb();

  const app = express();
  app.set("trust proxy", 1);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          // React sets style attributes (progress bar widths and the like).
          styleSrc: ["'self'", "'unsafe-inline'"],
          // Page content embeds images from anywhere on the web.
          imgSrc: ["'self'", "data:", "https:"],
          fontSrc: ["'self'", "data:"],
          connectSrc: ["'self'"],
          frameAncestors: ["'none'"],
          formAction: ["'self'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          // Production is HTTPS-only; locally the built app is served over
          // plain http, where upgrading every request would break it.
          upgradeInsecureRequests: process.env.NODE_ENV === "production" ? [] : null,
        },
      },
      // Google's sign-in redirect needs the referrer origin.
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    })
  );
  app.use(compression());
  app.use(cors({ origin: CLIENT_URL, credentials: true }));
  // Long pages are well past the 100 KB default.
  app.use(express.json({ limit: "1mb" }));

  app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      // Reuse Mongoose's connection rather than opening a second pool.
      store: MongoStore.create({ client: mongoose.connection.getClient() }),
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

  // Limits are per member, not per IP: a whole campus can sit behind one
  // address, and one person's burst shouldn't lock out their classmates.
  const keyGenerator = (req) => req.user?.email || ipKeyGenerator(req.ip);
  // Off locally, where test runs and hot reloads would trip them constantly.
  const skipInDev = () => process.env.NODE_ENV === "development";
  // Only the sign-in steps themselves. /auth/me runs on every page load, and
  // limiting it would make an active member look signed out.
  app.use(
    ["/auth/google", "/auth/dev-login"],
    rateLimit({ windowMs: 15 * 60 * 1000, limit: 60, keyGenerator, skip: skipInDev, standardHeaders: "draft-8", legacyHeaders: false })
  );
  app.use(
    "/api",
    rateLimit({
      windowMs: 60 * 1000,
      limit: 300,
      keyGenerator,
      skip: skipInDev,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: { error: "Too many requests — wait a minute and try again." },
    })
  );
  // Writes get a tighter budget, which is what actually stops a script from
  // flooding comments or revisions.
  app.use(
    "/api",
    rateLimit({
      windowMs: 10 * 60 * 1000,
      limit: 120,
      keyGenerator,
      skip: (req) => req.method === "GET" || skipInDev(),
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: { error: "You're saving very quickly — wait a few minutes and try again." },
    })
  );

  app.use("/auth", authRoutes);

  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  // The only data the signed-out landing page sees: counts, never content.
  // Cached briefly, since every visitor asks for the same three numbers.
  let publicStats = { at: 0, body: null };
  app.get("/api/public/stats", async (_req, res, next) => {
    try {
      if (!publicStats.body || Date.now() - publicStats.at > 5 * 60 * 1000) {
        const Page = require("./models/Page");
        const RoadmapStage = require("./models/RoadmapStage");
        const [pages, topics, stages] = await Promise.all([
          Page.countDocuments({ hidden: false }),
          Page.countDocuments({ hidden: false, roadmapStage: { $ne: "" } }),
          RoadmapStage.countDocuments(),
        ]);
        publicStats = { at: Date.now(), body: { pages, topics, stages } };
      }
      res.json(publicStats.body);
    } catch (err) {
      next(err);
    }
  });

  app.use("/api", pageRoutes);
  app.use("/api/members", memberRoutes);
  app.use("/api", structureRoutes);
  app.use("/api", statsRoutes);
  app.use("/api", libraryRoutes);
  app.use("/api", commentRoutes);
  app.use("/api", adminRoutes);

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
    // Vite fingerprints everything under /assets, so those can be cached
    // forever; index.html must always be revalidated or a deploy wouldn't
    // reach anyone with the old copy cached.
    app.use(
      "/assets",
      express.static(path.join(clientDist, "assets"), { immutable: true, maxAge: "1y", index: false })
    );
    app.use(express.static(clientDist, { maxAge: "1h", index: false }));
    app.get("*", (_req, res) => {
      res.set("Cache-Control", "no-cache");
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
    if (err.type === "entity.too.large") {
      return res.status(413).json({ error: "That's too large to save." });
    }
    if (err.type === "entity.parse.failed") {
      return res.status(400).json({ error: "Malformed request body." });
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
