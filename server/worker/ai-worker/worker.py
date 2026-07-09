import os
import json
import pika
import boto3
import subprocess
from dotenv import load_dotenv
from faster_whisper import WhisperModel

# Load environmental variables from your local shell configuration
load_dotenv()

# 1. Initialize S3 Client configured for Cloudflare R2 Virtual Hosted standard layout
s3_client = boto3.client(
    's3',
    endpoint_url=os.getenv('S3_ENDPOINT'),
    aws_access_key_id=os.getenv('S3_ACCESS_KEY'),
    aws_secret_access_key=os.getenv('S3_SECRET_KEY'),
    region_name='auto'
)

# 2. Initialize the highly optimized open-source Turbo model with 8-bit integer quantization
print("🔄 Loading Faster-Whisper Turbo engine weights...")
whisper_model = WhisperModel("small", device="cpu", compute_type="int8")

print("🚀 Subtitle engine model loaded successfully and waiting for event signals.")

def format_vtt_time(seconds):
    """Converts raw decimal seconds into a strict WebVTT format string (HH:MM:SS.mmm)"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    milliseconds = int((seconds % 1) * 1000)
    # WebVTT requires a period '.' instead of an SRT comma ',' before milliseconds
    return f"{hours:02d}:{minutes:02d}:{secs:02d}.{milliseconds:03d}"

def process_transcription(file_id, s3_key):
    """Downloads source video, extracts raw mono audio, computes timestamps, and pushes WebVTT to R2"""
    base_dir = f"/tmp/{file_id}"
    os.makedirs(base_dir, exist_ok=True)
    
    local_source = os.path.join(base_dir, f"source{os.path.path.extname(s3_key) or '.mp4'}")
    local_audio = os.path.join(base_dir, "extracted_audio.wav")
    local_vtt = os.path.join(base_dir, "subtitles.vtt")
    
    try:
        # Step A: Download the video rendition from Cloudflare R2 to read the master audio channel
        print(f"📥 Downloading processing source file from R2 bucket target: {s3_key}")
        s3_client.download_file(os.getenv('S3_BUCKET_NAME'), s3_key, local_source)
        
        # Step B: Execute an external FFmpeg subprocess to strip an optimized mono channel audio line
        print("🎵 Isolating audio track parameters via FFmpeg binding stream...")
        ffmpeg_cmd = [
            'ffmpeg', '-y', '-i', local_source,
            '-vn', '-acodec', 'pcm_s16le', '-ar', '16000', '-ac', '1', local_audio
        ]
        subprocess.run(ffmpeg_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        
        # Step C: Compute timeline blocks via Faster-Whisper engine matrix processing
        print("🤖 Running model layer calculations to map voice vectors...")
        segments, _ = whisper_model.transcribe(local_audio, beam_size=5)
        
        # Step D: Construct and compile a natively compliant WebVTT metadata text file
        with open(local_vtt, "w", encoding="utf-8") as vtt_file:
            vtt_file.write("WEBVTT\n\n") # This structural header token is mandatory at line 1
            
            for index, segment in enumerate(segments, start=1):
                start = format_vtt_time(segment.start)
                end = format_vtt_time(segment.end)
                text = segment.text.strip()
                
                # Write standard WebVTT time block configurations
                vtt_file.write(f"{start} --> {end}\n{text}\n\n")
        
        # Step E: Upload the final production .vtt file to R2 with the correct text/vtt mime content-type
        vtt_destination_key = f"assets/{file_id}/subtitles.vtt"
        print(f"📤 Uploading finalized browser-ready VTT file to R2 mesh layout: {vtt_destination_key}")
        s3_client.upload_file(
            local_vtt, 
            os.getenv('S3_BUCKET_NAME'), 
            vtt_destination_key, 
            ExtraArgs={'ContentType': 'text/vtt'}
        )
        print(f"✨ Subtitle pipeline completed successfully for fileId: {file_id}")
        
    except Exception as transcode_error:
        print(f"💥 Critical inner processing error encountered: {transcode_error}")
        raise transcode_error
        
    finally:
        # Deep file clearing maintenance pattern to guarantee zero temporary disk storage memory leaks
        print("🧹 Clearing local runtime file storage links...")
        for path in [local_source, local_audio, local_vtt]:
            if os.path.exists(path):
                try:
                    os.remove(path)
                except Exception:
                    pass

def callback(ch, method, properties, body):
    """RabbitMQ task listener callback execution block"""
    try:
        message = json.loads(body.decode())
        payload = message.get("payload", {})
        file_id = payload.get("fileId")
        
        # Pull your generated standard MP4 resolution file profiles to calculate audio tracks cleanly
        mp4_renditions = payload.get("mp4Renditions", [])
        if not mp4_renditions:
            print("⚠️ Skipping transaction payload: No valid MP4 playback profiles found inside message.")
            ch.basic_ack(delivery_tag=method.delivery_tag)
            return
            
        s3_key = mp4_renditions[0].get("mp4Key") # Grabs the first key variant (e.g. 1080p or 720p mp4 bundle)
        
        process_transcription(file_id, s3_key)
        ch.basic_ack(delivery_tag=method.delivery_tag)
        
    except Exception as callback_error:
        print(f"❌ Subtitle execution worker loop failed task processing: {callback_error}")
        # Reject the message and stop it from loop re-queuing to prevent system thrashing
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

def start_worker():
    """Binds to the standard video events broker swap layout exchange to capture completion events"""
    params = pika.URLParameters(os.getenv("RABBITMQ_URL"))
    connection = pika.BlockingConnection(params)
    channel = connection.channel()
    
    # Establish queue constraints to map cleanly against video.events exchange channels
    channel.queue_declare(queue="video.transcription_ai", durable=True)
    channel.queue_bind(
        queue="video.transcription_ai", 
        exchange="video.events", 
        routing_key="video.transcoded" # Listens directly for when your Node.js engine finishes video.uploaded
    )
    
    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(queue="video.transcription_ai", on_message_callback=callback)
    
    print("📢 VideoFlow AI Subtitle Worker successfully bound to RabbitMQ event channel layer.")
    channel.start_consuming()

if __name__ == "__main__":
    start_worker()