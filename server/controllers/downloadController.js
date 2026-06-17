import path from "node:path"; // 🎯 FIXED: Missing core module import to prevent server crashes
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3Client from "../config/s3.js";
import File from "../models/File.js";

export const generateSecureDownload = async (req, res) => {
  const { id } = req.params; // 🎯 SYNCHRONIZED: Matches your structural /:id route param convention
  const { key } = req.query; // Send target key via query param: ?key=mp4/abc/edited.mp4

  if (!key) {
    return res.status(400).json({ message: "Target object storage key is required." });
  }

  try {
    // 🔒 Core Security Ownership Validation Check
    const file = await File.findOne({ _id: id, owner: req.user._id || req.user.id });
    if (!file) {
      return res.status(403).json({ message: "Unauthorized asset access request." });
    }

    // 💡 Double check: Ensure the requested key actually belongs to this video document
    // This stops a user from passing a key to another user's private S3 assets!
    const dynamicKeyStr = String(key);
    const isInitialRendition = file.mp4Renditions?.some(r => r.mp4Key === dynamicKeyStr);
    const isStudioExport = file.exports?.some(e => e.masterKey === dynamicKeyStr);

    if (!isInitialRendition && !isStudioExport && file.storedName !== dynamicKeyStr) {
      return res.status(400).json({ message: "Requested key does not match any known assets for this project." });
    }

    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      // Forces the browser to pop up a native local "Save As" file dialog instead of playing inline
      ResponseContentDisposition: `attachment; filename="${path.basename(key)}"`
    });

    // Generate link token valid for 15 minutes (900 seconds)
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });
    
    res.status(200).json({ downloadUrl: signedUrl });
  } catch (error) {
    console.error("⛔ [Download Engine] Presigning execution loop failure:", error);
    res.status(500).json({ message: "Failed generating download token link.", error: error.message });
  }
};