import mongoose from "mongoose";

const fileSchema = new mongoose.Schema({
    originalName: String,
    storedName: String,
    mimeType: String,
    size: Number,
    path: String,
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        enum: ["uploaded", "transcoded", "failed", "pending"],
        default: "uploaded"
    },
    processingAt: Date,
    transcodedAt: Date,
    renditions: [
        {
            name: String,
            playlistKey: String,
            resolution: String
        }
    ],
    mp4Renditions: [
        {
            name: String,
            mp4Key: String,
            resolution: String
        }
    ],
    masterKey: String,
    thumbnailKey: String,
    previewKey: String,
    subtitles: [
        {
            lang: String,
            key: String,
            format: String
        }
    ],
    visibility: {
        type: String,
        enum: ["public", "unlisted", "private"],
        default: "public"
    },
    allowedDomains: {
        type: [String], 
        default: [] // e.g., ["notion.so", "canvas.instructure.com", "my-blog.com"]
    },
    lastError: String,
    uploadDate: {
        type: Date,
        default: Date.now
    }, 

    exports: [
        {
            title: String,      // e.g., "July Lecture (Trimmed Clip)"
            status: { type: String, enum: ["processing", "completed", "failed"] },
            cropRatio: String,  // e.g., "9:16"
            masterKey: String,  // e.g., "mp4/6a2ab7e1e.../edited_source.mp4"
            createdAt: { type: Date, default: Date.now }
        }
    ], 
    allowedDomains: {
        type: [String], 
        default: [] // e.g., ["notion.so", "canvas.instructure.com", "my-blog.com"]
    }
});

const File = mongoose.model("File", fileSchema);

export default File;