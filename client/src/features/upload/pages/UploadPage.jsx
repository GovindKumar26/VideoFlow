import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UploadCloud, FileVideo, CheckCircle2 } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { useDispatch } from "react-redux";
import { uploadFile } from "../uploadSlice";

function UploadPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const inputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false); 
  const [dragging, setDragging] = useState(false);

  const handleFileSelect = async (selectedFile) => {
    if (!selectedFile) return;

    // 1. Validate Extension
    const validExtensions = [".mp4", ".mov", ".mkv"];
    const isValid = validExtensions.some((ext) =>
      selectedFile.name.toLowerCase().endsWith(ext)
    );

    if (!isValid) {
      alert("Please upload MP4, MOV, or MKV files.");
      return;
    }

    // 2. 🎯 Fix: Set the local file state so the layout changes to the progress panel
    setFile(selectedFile);
    setProgress(0);
    setDone(false);

    // 3. Assemble Binary Payload
    const formData = new FormData();
    formData.append("video", selectedFile);

    try {
      // 4. Dispatch Thunk, passing the data along with a real-time progress hook callback
      await dispatch(uploadFile({ 
        formData, 
        onProgress: (percent) => setProgress(percent) 
      })).unwrap();

      // Upload finished completely at the network stack
      setDone(true);

      // Smooth UX redirect gap
      setTimeout(() => {
        navigate("/videos");
      }, 1500);

    } catch (error) {
      console.error("Upload failed in component:", error);
      alert("Upload failed. Please try again.");
      setFile(null); // Reset layout back to dropzone on crash
    }
  };

  return (
    <AppShell>
      <div className="min-h-screen bg-background text-foreground">
        <header className="border-b border-border">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <h1 className="font-display text-2xl tracking-tighter uppercase text-primary">
              Videoflow
            </h1>
            <button
              onClick={() => navigate("/dashboard")}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Back to Dashboard
            </button>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-6 py-12">
          <div className="mb-8">
            <p className="text-primary text-[10px] uppercase tracking-widest font-mono mb-3">
              Upload
            </p>
            <h1 className="font-display text-5xl uppercase tracking-tighter mb-3">
              Upload Video
            </h1>
            <p className="text-muted-foreground">
              Drag and drop a file or choose one from your device.
            </p>
          </div>

          {!file && (
            <>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  const droppedFile = e.dataTransfer.files?.[0];
                  handleFileSelect(droppedFile);
                }}
                className={`border-2 border-dashed rounded-xl p-16 text-center transition-colors ${
                  dragging ? "border-primary bg-primary/5" : "border-border bg-card"
                }`}
              >
                <UploadCloud className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-xl font-medium mb-2">Drag & Drop Your Video</h2>
                <p className="text-muted-foreground mb-6">MP4, MOV, or MKV</p>
                <button
                  onClick={() => inputRef.current?.click()}
                  className="px-5 py-3 rounded-lg bg-primary text-primary-foreground font-medium"
                >
                  Choose File
                </button>
                <input
                  ref={inputRef}
                  type="file"
                  className="hidden"
                  accept=".mp4,.mov,.mkv"
                  onChange={(e) => handleFileSelect(e.target.files?.[0])}
                />
              </div>
              <p className="text-center text-xs uppercase tracking-widest text-muted-foreground mt-4">
                Supported Formats • MP4 • MOV • MKV
              </p>
            </>
          )}

          {file && (
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-3 mb-5">
                <FileVideo className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="font-medium truncate">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                {done && <CheckCircle2 className="h-5 w-5 text-green-400" />}
              </div>

              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <p className="mt-4 text-sm text-muted-foreground">
                {done
                  ? "Upload complete. Redirecting..."
                  : `Uploading... ${Math.floor(progress)}%`}
              </p>
            </div>
          )}
        </main>
      </div>
    </AppShell>
  );
}

export default UploadPage;