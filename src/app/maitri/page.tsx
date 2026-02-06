"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import styles from "../page.module.css";
import { startWSRecorder } from "../utils/client-ws-recorder";
import ConversationComponent from "../components/ConversationComponent";

// Lazy load GlobeVisualizer
const GlobeVisualizer = dynamic(() => import("../components/GlobeVisualiser"), { ssr: false });

export default function MaitriPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<string>('neutral');
  const [cameraError, setCameraError] = useState<string>("");
  const [cameraReady, setCameraReady] = useState(false);
  const [aiSpeechVolume, setAiSpeechVolume] = useState(0); // New state for AI speech volume

  // Handle AI speech volume for globe visualization
  const handleAISpeaking = (volume: number) => {
    setAiSpeechVolume(volume);
  };

  useEffect(() => {
    startWSRecorder((url) => {
      const audio = new Audio(url);
      audio.play();
    });
    
    const startCameraAndRecording = async () => {
      try {
        console.log("Requesting camera access...");
        
        // Request camera with fallback constraints
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: 'user'
            }, 
            audio: true 
          });
        } catch (err) {
          console.log("High quality failed, trying basic constraints...");
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: true 
          });
        }

        streamRef.current = stream;
        console.log("Camera stream obtained:", stream);

        // Setup video element
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          
          // Wait for video to load
          videoRef.current.onloadedmetadata = () => {
            console.log("Video metadata loaded");
            setCameraReady(true);
            if (videoRef.current) {
              videoRef.current.play().then(() => {
                console.log("Video playing");
              }).catch(err => {
                console.error("Video play error:", err);
                setCameraError("Failed to start video preview");
              });
            }
          };

          videoRef.current.onerror = (err) => {
            console.error("Video element error:", err);
            setCameraError("Video element error");
          };
        }

        // Setup recording with fallback codecs
        let recorder: MediaRecorder;
        try {
          if (MediaRecorder.isTypeSupported("video/webm; codecs=vp9")) {
            recorder = new MediaRecorder(stream, { mimeType: "video/webm; codecs=vp9" });
          } else if (MediaRecorder.isTypeSupported("video/webm; codecs=vp8")) {
            recorder = new MediaRecorder(stream, { mimeType: "video/webm; codecs=vp8" });
          } else if (MediaRecorder.isTypeSupported("video/webm")) {
            recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
          } else {
            recorder = new MediaRecorder(stream);
          }
        } catch (err) {
          recorder = new MediaRecorder(stream);
        }

        mediaRecorderRef.current = recorder;
        recordedChunksRef.current = [];

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
        };

        recorder.onerror = (event) => {
          console.error("MediaRecorder error:", event);
          setCameraError("Recording error");
        };

        recorder.start();
        setStreaming(true);
        console.log("Recording started");

      } catch (err: any) {
        console.error("Camera access error:", err);
        let errorMessage = "Camera access failed";
        
        if (err.name === "NotAllowedError") {
          errorMessage = "Camera permission denied. Please allow camera access and refresh.";
        } else if (err.name === "NotFoundError") {
          errorMessage = "No camera found. Please connect a camera and refresh.";
        } else if (err.name === "NotReadableError") {
          errorMessage = "Camera is already in use by another application.";
        } else if (err.name === "NotSupportedError") {
          errorMessage = "Camera not supported. Try using HTTPS or a different browser.";
        }
        
        setCameraError(errorMessage);
      }
    };

    startCameraAndRecording();

    return () => {
      console.log("Cleaning up camera resources...");
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
          console.log(`Stopped ${track.kind} track`);
        });
      }
      if (mediaRecorderRef.current?.state && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  // Mock emotion updates (replace with real emotion detection)
  useEffect(() => {
    const emotions = ['happy', 'sad', 'neutral', 'angry', 'surprised'];
    const interval = setInterval(() => {
      setCurrentEmotion(emotions[Math.floor(Math.random() * emotions.length)]);
    }, 5000);

    // Cleanup function to stop all media tracks when component unmounts
    return () => {
      clearInterval(interval);
      
      // Stop all media tracks when component unmounts
      stopAllMediaTracks();
      
      // Stop any active media recorder
      if (mediaRecorderRef.current?.state !== 'inactive') {
        try {
          mediaRecorderRef.current?.stop();
        } catch (e) {
          console.log('Error stopping media recorder on unmount:', e);
        }
      }
      
      // Clear the recorded chunks
      recordedChunksRef.current = [];
    };
  }, []);

  const stopAllMediaTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      streamRef.current = null;
    }
  };

  const handleEnd = () => {
    console.log("Ending session...");
    
    // Stop recording if active
    const mediaRecorder = mediaRecorderRef.current;
    if (mediaRecorder?.state && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    } else {
      // If there's no active recording, stop tracks and navigate immediately
      stopAllMediaTracks();
      router.push("/");
      return;
    }

    // Set up the onstop handler if it's not already set
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);

        // Download the recording
        const a = document.createElement("a");
        a.href = url;
        a.download = "maitri_session.webm";
        a.click();
        URL.revokeObjectURL(url);

        // Stop all media tracks before navigating
        stopAllMediaTracks();
        
        // Clear the recorded chunks
        recordedChunksRef.current = [];
        
        // Navigate to home
        router.push("/");
      };
    }
  };

  return (
    <div className={styles.maitriPage}>
      {/* Space Background Elements */}
      <div className={styles.stars}></div>
      
      <div className={styles.visualizerWrapper}>
        <GlobeVisualizer aiSpeechVolume={aiSpeechVolume} />
      </div>

      {cameraError ? (
        <div className={styles.errorMessage}>
          <h3>Camera Error</h3>
          <p>{cameraError}</p>
          <button onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      ) : (
        <>
          <video 
            ref={videoRef} 
            className={styles.liveVideo} 
            muted 
            autoPlay 
            playsInline
            style={{
              width: '200px',
              height: '150px',
              position: 'fixed',
              top: '20px',
              right: '20px',
              border: '2px solid #00ffff',
              borderRadius: '8px',
              zIndex: 10,
              background: '#000'
            }}
          />
          
          {!cameraReady && (
            <div className={styles.loadingMessage}>
              Initializing camera...
            </div>
          )}
        </>
      )}

      {streaming && (
        <button className={styles.endButton} onClick={handleEnd}>
          END SESSION
        </button>
      )}

      <ConversationComponent
        currentEmotion={currentEmotion}
        onAISpeaking={handleAISpeaking}
      />
    </div>
  );
}