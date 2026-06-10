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
        enum: ["uploaded", "transcoded", "failed"],
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
    lastError: String,
    uploadDate: {
        type: Date,
        default: Date.now
    }
});

const File = mongoose.model("File", fileSchema);

export default File;