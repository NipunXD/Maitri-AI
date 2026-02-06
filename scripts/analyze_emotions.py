# emotion_analyzer.py
import cv2
import numpy as np
from deepface import DeepFace
import json
from datetime import datetime
import os
import sys

class VideoEmotionAnalyzer:
    def __init__(self):
        self.emotions_timeline = []
        
    def analyze_video(self, video_path, output_path=None):
        """
        Analyze emotions from video file frame by frame
        """
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            print(f"Error: Cannot open video file {video_path}")
            return []

        fps = cap.get(cv2.CAP_PROP_FPS)
        if fps == 0:  # prevent division by zero
            fps = 30
        frame_count = 0
        
        emotions_data = []

        print(f"Processing video: {video_path}")
        print(f"Output JSON will be: {output_path}")

        while True:
            ret, frame = cap.read()
            if not ret:
                break
                
            # Analyze every second (skip frames based on FPS)
            if frame_count % int(fps) == 0:
                timestamp = frame_count / fps
                try:
                    result = DeepFace.analyze(
                        frame, 
                        actions=['emotion'], 
                        enforce_detection=False
                    )
                    
                    emotion_data = {
                        'timestamp': timestamp,
                        'dominant_emotion': result[0]['dominant_emotion'],
                        'emotions': result[0]['emotion'],
                        'confidence': max(result[0]['emotion'].values())
                    }
                    emotions_data.append(emotion_data)
                    
                except Exception as e:
                    print(f"Error analyzing frame at {timestamp}s: {e}")
                    
            frame_count += 1
            
        cap.release()
        
        # Ensure output directory exists
        if output_path:
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            with open(output_path, 'w') as f:
                json.dump({
                    'session_id': os.path.basename(video_path).split('.')[0],
                    'video_duration': frame_count / fps,
                    'analysis_timestamp': datetime.now().isoformat(),
                    'emotions_timeline': emotions_data
                }, f, indent=2)
            print(f"Emotion JSON saved to {output_path}")
                
        return emotions_data

# Command-line entrypoint
if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python emotion_analyzer.py <video_path> <output_json_path>")
        sys.exit(1)

    video_path = sys.argv[1]
    output_path = sys.argv[2]

    analyzer = VideoEmotionAnalyzer()
    analyzer.analyze_video(video_path, output_path)
