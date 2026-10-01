const mongoose = require("mongoose");

// An image pasted or uploaded into a page, stored in the database so the hub
// needs no separate file storage. Kept small (see MAX_BYTES in routes/media).
const imageSchema = new mongoose.Schema(
  {
    data: { type: Buffer, required: true },
    contentType: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedBy: { type: String, required: true },
    slug: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Image", imageSchema);
