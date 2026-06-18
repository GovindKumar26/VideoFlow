// src/features/upload/hooks/useScreenRecorder.js
import { useState, useRef } from "react";
import { toast } from "sonner";

export const useScreenRecorder = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [recordedFile, setRecordedFile] = useState(null);
    
    const mediaRecorderRef = useRef(null);
    const streamRef = useRef(null);
    const chunksRef = useRef([]);
    const timerRef = useRef(null);

    const startRecording = async () => {
        chunksRef.current = [];
        setRecordedFile(null);
        setRecordingTime(0);

        try {
            // 📡 1. Request raw display access configurations from the browser chassis
            const displayStream = await navigator.mediaDevices.getDisplayMedia({
                video: { frameRate: { ideal: 30, max: 60 } },
                audio: true // Captures internal tab/system audio if shared by the user
            });

            // 🎙️ 2. Optional: Combine with user microphone audio lane
            let combinedTracks = [...displayStream.getVideoTracks()];
            try {
                const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                combinedTracks.push(micStream.getAudioTracks()[0]);
            } catch (e) {
                console.log("🎤 No microphone permissions given; recording system audio only.");
            }

            // 🎛️ 3. Initialize the global stream track array pipeline
            const stream = new MediaStream(combinedTracks);
            streamRef.current = stream;

            // 🚀 4. Bind the media stream to the native MediaRecorder container
            const options = { mimeType: "video/webm;codecs=vp8,opus" };
            const recorder = new MediaRecorder(stream, options);
            
            mediaRecorderRef.current = recorder;

            // 📥 Accumulate streaming raw binary packets as they become available
            recorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            // 🏁 Handle the stream finalization teardown handshake
            recorder.onstop = () => {
                if (timerRef.current) clearInterval(timerRef.current);
                
                // Pack arrays into a single binary Blob document archetype
                const blob = new Blob(chunksRef.current, { type: "video/webm" });
                const file = new File([blob], `recording-${Date.now()}.webm`, { type: "video/webm" });
                
                setRecordedFile(file);
                setIsRecording(false);
                
                // Turn off active user device hardware camera/mic indicators
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                }
                toast.success("🎬 Capture complete! Video ready for processing.");
            };

            // Handle edge case: user clicks the native browser "Stop Sharing" bubble directly
            displayStream.getVideoTracks()[0].onended = () => {
                if (recorder.state !== "inactive") recorder.stop();
            };

            // ⏱️ Trigger metrics counting clocks state
            recorder.start(1000); // Fragment recording chunk passes every second
            setIsRecording(true);
            timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
            
            toast.success("⏺️ Recording started successfully.");
        } catch (err) {
            toast.error("❌ Failed to initialize browser display media contexts.");
            console.error(err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
        }
    };

    return { 
        isRecording, 
        recordingTime, 
        recordedFile, 
        startRecording, 
        stopRecording, 
        setRecordedFile 
    };
};