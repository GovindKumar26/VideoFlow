import os
import json
import pika
import boto3
import subprocess
from dotenv import load_dotenv
from faster_whisper import WhisperModel

load_dotenv()

s3_client = boto3.client(
    's3',
    endpoint_url=os.getenv('S3_ENDPOINT'),
    aws_access_key_id=os.getenv('S3_ACCESS_KEY'),
    aws_secret_access_key=os.getenv('S3_SECRET_KEY'),
    region_name='auto'
)

print("🔄 Loading Faster-Whisper Small engine weights...")
whisper_model = WhisperModel("small", device="cpu", compute_type="int8")
print("🚀 Subtitle engine model loaded successfully.")

def format_vtt_time(seconds):
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    milliseconds = int((seconds % 1) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d}.{milliseconds:03d}"

def process_transcription(file_id, s3_key, channel):
    """Processes audio extraction, transcription, and publishes the ready event"""
    base_dir = f"/tmp/{file_id}"
    os.makedirs(base_dir, exist_ok=True)
    
    # 🎯 FIX: Corrected path extension handling syntax
    _, ext = os.path.splitext(s3_key)
    if not ext:
        ext = '.mp4'
        
    local_source = os.path.join(base_dir, f"source{ext}")
    local_audio = os.path.join(base_dir, "extracted_audio.wav")
    local_vtt = os.path.join(base_dir, "subtitles.vtt")
    
    try:
        print(f"📥 Downloading processing source file from R2: {s3_key}")
        s3_client.download_file(os.getenv('S3_BUCKET_NAME'), s3_key, local_source)
        
        print("🎵 Isolating audio track parameters via FFmpeg...")
        ffmpeg_cmd = [
            'ffmpeg', '-y', '-i', local_source,
            '-vn', '-acodec', 'pcm_s16le', '-ar', '16000', '-ac', '1', local_audio
        ]
        subprocess.run(ffmpeg_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        
        print("🤖 Running model layer calculations...")
        segments, _ = whisper_model.transcribe(local_audio, beam_size=5)
        
        with open(local_vtt, "w", encoding="utf-8") as vtt_file:
            vtt_file.write("WEBVTT\n\n")
            for index, segment in enumerate(segments, start=1):
                start = format_vtt_time(segment.start)
                end = format_vtt_time(segment.end)
                text = segment.text.strip()
                vtt_file.write(f"{start} --> {end}\n{text}\n\n")
        
        vtt_destination_key = f"assets/{file_id}/subtitles.vtt"
        print(f"📤 Uploading WebVTT asset to R2: {vtt_destination_key}")
        s3_client.upload_file(
            local_vtt, 
            os.getenv('S3_BUCKET_NAME'), 
            vtt_destination_key, 
            ExtraArgs={'ContentType': 'text/vtt'}
        )
        
        # 🎯 OPTION 2: Publish completion message right back to RabbitMQ broker
        subtitle_payload = {
            "type": "video.subtitles_ready",
            "payload": {
                "fileId": file_id,
                "subtitles": [
                    {
                        "lang": "en",
                        "format": "vtt",
                        "key": vtt_destination_key,
                        "label": "English AI Generated"
                    }
                ]
            }
        }
        
        print(f"📢 Publishing video.subtitles_ready event to exchange for fileId: {file_id}")
        channel.basic_publish(
            exchange="video.events",
            routing_key="video.subtitles_ready",
            body=json.dumps(subtitle_payload),
            properties=pika.BasicProperties(delivery_mode=2) # Persistent message
        )
        print("✨ Event loop completed successfully.")
        
    except Exception as transcode_error:
        print(f"💥 Critical inner processing error encountered: {transcode_error}")
        raise transcode_error
        
    finally:
        print("🧹 Clearing local runtime file storage links...")
        for path in [local_source, local_audio, local_vtt]:
            if os.path.exists(path):
                try: os.remove(path)
                except Exception: pass

def callback(ch, method, properties, body):
    try:
        message = json.loads(body.decode())
        payload = message.get("payload", {})
        file_id = payload.get("fileId")
        
        mp4_renditions = payload.get("mp4Renditions", [])
        if not mp4_renditions:
            print("⚠️ Skipping transaction payload: No valid MP4 playback profiles found.")
            ch.basic_ack(delivery_tag=method.delivery_tag)
            return
            
        s3_key = mp4_renditions[0].get("mp4Key")
        
        # Pass the channel down so the script can publish its response
        process_transcription(file_id, s3_key, ch)
        ch.basic_ack(delivery_tag=method.delivery_tag)
        
    except Exception as callback_error:
        print(f"❌ Subtitle execution worker loop failed task processing: {callback_error}")
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

def start_worker():
    params = pika.URLParameters(os.getenv("RABBITMQ_URL"))
    connection = pika.BlockingConnection(params)
    channel = connection.channel()
    
    channel.queue_declare(queue="video.transcription_ai", durable=True)
    channel.queue_bind(
        queue="video.transcription_ai", 
        exchange="video.events", 
        routing_key="video.transcoded"
    )
    
    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(queue="video.transcription_ai", on_message_callback=callback)
    
    print("📢 VideoFlow AI Subtitle Worker successfully bound to RabbitMQ event channel layer.")
    channel.start_consuming()

if __name__ == "__main__":
    start_worker()