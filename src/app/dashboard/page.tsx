"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface CrewMember {
  id: string;
  name: string;
  callSign: string;
  rank: string;
  specialization: string;
  faceImagePath: string;
  sessions: number;
  lastSession?: Date;
  avatar: string;
}

interface DashboardProps {
  onStartSession?: (crewMember: CrewMember) => void;
  onViewProfile?: (crewMember: CrewMember) => void;
}

export default function AstronautDashboard({
  onStartSession,
  onViewProfile,
}: DashboardProps) {
  const router = useRouter();

  const [currentView, setCurrentView] = useState<
    "dashboard" | "scanning" | "profile"
  >("dashboard");

  const [myProfile] = useState<CrewMember>({
    id: "crew_user",
    name: "Nipun Arora",
    callSign: "USER-1",
    rank: "Mission Specialist",
    specialization: "Psychological Testing",
    faceImagePath: "/crew/nipun/user_profile.jpg",
    sessions: 0,
    avatar: "👨‍🚀",
  });

  const [recognizedCrew, setRecognizedCrew] = useState<CrewMember | null>(
    null
  );
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sessionFiles, setSessionFiles] = useState<string[]>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const referenceImageRef = useRef<HTMLImageElement | null>(null);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load session file list
  useEffect(() => {
    const loadSessionFiles = async () => {
      try {
        const resp = await fetch("/api/sessions");
        if (resp.ok) {
          const files = await resp.json();
          setSessionFiles(Array.isArray(files) ? files : []);
        } else {
          console.warn("Couldn't fetch sessions list - server returned error");
          setSessionFiles([]);
        }
      } catch (err) {
        console.error("Error fetching sessions list", err);
        setSessionFiles([]);
      }
    };
    loadSessionFiles();
  }, []);

  // mission time formatter
  const formatMissionTime = useCallback(() => {
    const missionStart = new Date("2024-01-01T00:00:00Z");
    const elapsed = currentTime.getTime() - missionStart.getTime();
    const days = Math.floor(elapsed / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (elapsed % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
    return `SOL ${days} - ${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  }, [currentTime]);

  // start camera
  const startCamera = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      return true;
    } catch (err) {
      console.error("Camera permission error:", err);
      alert(
        "Camera access required for face recognition. Please allow camera permissions."
      );
      return false;
    }
  }, []);

  // stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      try {
        // @ts-ignore safe clear
        videoRef.current.srcObject = null;
      } catch (e) {}
    }
  }, []);

  // wait for video to be ready (with fallback timeout)
  const waitForVideoReady = useCallback(
    (video: HTMLVideoElement, timeout = 3000) =>
      new Promise<void>((resolve) => {
        if (video.readyState >= 2) {
          resolve();
          return;
        }
        const onLoaded = () => {
          video.removeEventListener("loadeddata", onLoaded);
          resolve();
        };
        video.addEventListener("loadeddata", onLoaded);
        setTimeout(() => {
          video.removeEventListener("loadeddata", onLoaded);
          resolve();
        }, timeout);
      }),
    []
  );

  // Basic pixel-based comparison (very approximate)
  const compareImages = useCallback(
    async (videoElement: HTMLVideoElement): Promise<number> => {
      return new Promise((resolve) => {
        if (!referenceImageRef.current) return resolve(0);

        // draw video frame
        const canvasV = document.createElement("canvas");
        const ctxV = canvasV.getContext("2d");
        canvasV.width = 300;
        canvasV.height = 300;
        ctxV?.drawImage(videoElement, 0, 0, 300, 300);
        const curr = ctxV?.getImageData(0, 0, 300, 300);

        // draw ref image
        const canvasR = document.createElement("canvas");
        const ctxR = canvasR.getContext("2d");
        canvasR.width = 300;
        canvasR.height = 300;
        ctxR?.drawImage(referenceImageRef.current!, 0, 0, 300, 300);
        const ref = ctxR?.getImageData(0, 0, 300, 300);

        if (!curr || !ref) return resolve(0);

        let matches = 0;
        const total = curr.data.length / 4;

        for (let i = 0; i < curr.data.length; i += 4) {
          const rd = Math.abs(curr.data[i] - ref.data[i]);
          const gd = Math.abs(curr.data[i + 1] - ref.data[i + 1]);
          const bd = Math.abs(curr.data[i + 2] - ref.data[i + 2]);
          const avg = (rd + gd + bd) / 3;
          if (avg < 80) matches++;
        }

        resolve(matches / total);
      });
    },
    []
  );

  // Face recognition process
  const performFaceRecognition = useCallback(async (): Promise<CrewMember | null> => {
    setIsScanning(true);
    setScanProgress(0);

    if (!referenceImageRef.current) {
      setIsScanning(false);
      alert("Reference image element not available.");
      return null;
    }

    // Ensure reference image points to file
    referenceImageRef.current.src = myProfile.faceImagePath;

    return new Promise((resolve) => {
      referenceImageRef.current!.onload = async () => {
        // progress simulation
        for (let p = 0; p <= 90; p += 10) {
          setScanProgress(p);
          // small pause
          // eslint-disable-next-line no-await-in-loop
          await new Promise((r) => setTimeout(r, 180));
        }

        let similarity = 0;
        if (videoRef.current) {
          try {
            similarity = await compareImages(videoRef.current);
            console.log("Similarity score:", similarity);
          } catch (err) {
            console.error("Compare error:", err);
          }
        } else {
          console.warn("Video element not found for compareImages");
        }

        setScanProgress(100);
        setIsScanning(false);

        // threshold (tunable)
        const threshold = 0.6;

        if (similarity > threshold) {
          setRecognizedCrew(myProfile);
          resolve(myProfile);
        } else {
          resolve(null);
        }
      };

      referenceImageRef.current!.onerror = () => {
        console.error("Failed loading reference image");
        setIsScanning(false);
        alert("Reference image missing or not accessible. Upload to public/crew_faces/");
        resolve(null);
      };
    });
  }, [compareImages, myProfile]);

  // Start scan flow
  const handleStartFaceScan = useCallback(async () => {
    setCurrentView("scanning");
    const started = await startCamera();
    if (!started) return;

    const vid = videoRef.current!;
    await waitForVideoReady(vid, 4000);

    const recognized = await performFaceRecognition();

    if (recognized) {
      // small success display then redirect to /maitri
      setTimeout(() => {
        stopCamera();
        onStartSession?.(recognized);
        // include crew id in query for maitri route
        router.push(`/maitri?crew=${encodeURIComponent(recognized.id)}`);
      }, 900);
    } else {
      // not recognized - show alert and return to dashboard
      setTimeout(() => {
        stopCamera();
        setCurrentView("dashboard");
        setRecognizedCrew(null);
        setScanProgress(0);
        alert("Face not recognized. Try again or use manual Start Session.");
      }, 700);
    }
  }, [startCamera, performFaceRecognition, stopCamera, onStartSession, router, waitForVideoReady]);

  // Handle manual actions: start session OR view analytics
  const handleManualSelection = useCallback((action: "session" | "profile") => {
    if (action === "session") {
      // call callback then redirect to /maitri
      onStartSession?.(myProfile);
      router.push(`/maitri?crew=${encodeURIComponent(myProfile.id)}`);
    } else if (action === "profile") {
      // redirect to crew-dashboard (you said you'll create it later)
      onViewProfile?.(myProfile);
      router.push(`/crew-dashboard?crew=${encodeURIComponent(myProfile.id)}`);
    }
  }, [onStartSession, onViewProfile, myProfile, router]);

  // cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <div className="dashboard-container">
      {/* Hidden reference image used for pixel-compare */}
      <img ref={referenceImageRef} style={{ display: "none" }} alt="reference" />

      {/* Header */}
      <div className="header">
        <div className="mission-info">
          <h1>🚀 MAITRI PSYCHOLOGICAL SUPPORT SYSTEM</h1>
          <div className="mission-details">
            <span className="mission-time">{formatMissionTime()}</span>
            <span className="earth-time">{currentTime.toLocaleTimeString()}</span>
          </div>
        </div>
        <div className="status-indicators">
          <div className="status-item"><span className="status-dot online" /> AI SYSTEM ONLINE</div>
          <div className="status-item"><span className="status-dot ready" /> READY FOR SESSION</div>
        </div>
      </div>

      {/* Dashboard main */}
      {currentView === "dashboard" && (
        <div className="main-content">
          {/* Profile */}
          <div className="profile-section">
            <h2>👤 YOUR PROFILE</h2>
            <div className="profile-card">
              <div className="profile-avatar">{myProfile.avatar}</div>
              <div className="profile-info">
                <h3>{myProfile.name}</h3>
                <p className="call-sign">{myProfile.callSign}</p>
                <p className="rank">{myProfile.rank} • {myProfile.specialization}</p>
                <div className="profile-stats">
                  <span>Sessions: {sessionFiles.length}</span>
                  <span>Data Files: {sessionFiles.length}</span>
                </div>
              </div>
              <div className="profile-actions">
                <button className="action-button primary" onClick={() => handleManualSelection("session")}>Start Session</button>
                <button className="action-button secondary" onClick={() => handleManualSelection("profile")}>View Analytics</button>
              </div>
            </div>

            <div className="data-folder-info">
              📁 Data Location: <code>data/crew_sessions/{myProfile.callSign.toLowerCase()}/</code>
              <div className="session-files">
                {sessionFiles.map(f => <div key={f} className="session-file">📄 {f}</div>)}
              </div>
            </div>
          </div>

          {/* Face recognition card */}
          <div className="face-recognition-section">
            <h2>🔍 FACIAL RECOGNITION LOGIN</h2>
            <div className="face-scan-card">
              <div className="scan-icon">📷</div>
              <h3>Automated Identity Verification</h3>
              <p>Use your webcam to automatically verify your identity and start a session</p>
              <div className="face-setup-info">
                <p>Reference Image: <code>{myProfile.faceImagePath}</code></p>
                <small>Ensure your face image is uploaded to the public/crew_faces/ folder</small>
              </div>
              <button className="scan-button" onClick={handleStartFaceScan}>Start Face Recognition</button>
            </div>
          </div>

          {/* Stats */}
          <div className="stats-section">
            <h2>📊 SESSION STATISTICS</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">{sessionFiles.length}</div>
                <div className="stat-label">Total Sessions</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">1</div>
                <div className="stat-label">Active User</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">100%</div>
                <div className="stat-label">System Ready</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scanning view */}
      {currentView === "scanning" && (
        <div className="scanning-view">
          <div className="scan-container">
            <h2>🔍 VERIFYING IDENTITY</h2>
            <div className="camera-container">
              <video ref={videoRef} autoPlay playsInline muted className="camera-feed" />
              <canvas ref={canvasRef} className="detection-overlay" />
            </div>

            {isScanning ? (
              <div className="scanning-status">
                <div className="scan-progress">
                  <div className="scan-progress-bar" style={{ width: `${scanProgress}%` }} />
                </div>
                <p>Analyzing facial features... {scanProgress}%</p>
                <small>Comparing with reference image: {myProfile.faceImagePath}</small>
              </div>
            ) : recognizedCrew ? (
              <div className="recognition-result">
                <div className="recognized-crew">
                  <div className="crew-avatar-large">{recognizedCrew.avatar}</div>
                  <h3>✅ IDENTITY VERIFIED</h3>
                  <p><strong>{recognizedCrew.name}</strong></p>
                  <p>Call Sign: {recognizedCrew.callSign}</p>
                  <p>Starting your session...</p>
                </div>
              </div>
            ) : (
              <div className="scanning-status">
                <p>Waiting for video...</p>
              </div>
            )}

            <button className="cancel-scan-button" onClick={() => {
              stopCamera();
              setCurrentView("dashboard");
              setIsScanning(false);
              setRecognizedCrew(null);
              setScanProgress(0);
            }}>Cancel Scan</button>
          </div>
        </div>
      )}

      {/* Styles (kept same style you used) */}
      <style jsx>{`
        .dashboard-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
          color: #ffffff;
          font-family: 'Courier New', monospace;
          padding: 20px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          background: rgba(0,20,40,0.8);
          border: 1px solid rgba(0,255,255,0.3);
          border-radius: 12px;
          margin-bottom: 20px;
          backdrop-filter: blur(10px);
        }
        .mission-info h1 { margin: 0; font-size: 24px; color: #00ffff; text-shadow: 0 0 10px rgba(0,255,255,0.5); }
        .mission-details { margin-top: 8px; display:flex; gap: 20px; }
        .mission-time, .earth-time { font-size: 14px; color: #00ff88; font-weight: bold; }
        .status-indicators { display:flex; flex-direction: column; gap: 8px; }
        .status-item { display:flex; gap: 8px; align-items:center; font-size:12px; }
        .status-dot { width:8px; height:8px; border-radius:50%; display:inline-block; }
        .status-dot.online { background:#00ff88; box-shadow:0 0 5px rgba(0,255,136,0.8); }
        .status-dot.ready { background:#ffaa00; box-shadow:0 0 5px rgba(255,170,0,0.8); }

        .main-content { display:grid; gap:20px; grid-template-columns: 1fr; }
        .profile-section h2, .face-recognition-section h2, .stats-section h2 { color: #ff00ff; margin-bottom:16px; font-size:18px; }
        .profile-card {
          background: rgba(0,20,40,0.8);
          border: 1px solid rgba(0,255,255,0.3);
          border-radius: 12px;
          padding: 20px;
          display:grid;
          grid-template-columns: auto 1fr auto;
          gap:20px;
          align-items:center;
          backdrop-filter: blur(10px);
        }
        .profile-avatar { font-size:64px; }
        .profile-info h3 { margin:0; color:#00ffff; font-size:24px; }
        .call-sign { color:#ffaa00; font-weight:bold; margin:4px 0; font-size:16px; }
        .rank { color:#cccccc; margin:4px 0; }
        .profile-stats { display:flex; gap:20px; font-size:14px; color:#00ff88; margin-top:8px; }
        .profile-actions { display:flex; flex-direction:column; gap:10px; }
        .action-button { padding:12px 20px; border:none; border-radius:6px; font-size:14px; font-weight:bold; cursor:pointer; transition:all 0.3s ease; }
        .action-button.primary { background:linear-gradient(45deg,#00ff88,#44ffaa); color:white; }
        .action-button.secondary { background:linear-gradient(45deg,#0066ff,#00ffff); color:white; }
        .action-button:hover { transform: translateY(-1px); box-shadow: 0 4px 15px rgba(0,255,255,0.3); }

        .data-folder-info { background: rgba(0,0,0,0.3); border:1px solid rgba(0,255,136,0.3); border-radius:8px; padding:15px; margin-top:16px; font-size:12px; color:#00ff88; }
        .data-folder-info code { background: rgba(0,255,136,0.2); padding: 2px 6px; border-radius:4px; font-family: 'Courier New', monospace; }
        .session-files { margin-top: 10px; display:grid; grid-template-columns: repeat(auto-fit, minmax(200px,1fr)); gap:8px; }
        .session-file { background: rgba(0,255,136,0.1); padding:4px 8px; border-radius:4px; font-size:11px; }

        .face-scan-card { background: rgba(0,20,40,0.8); border:1px solid rgba(255,0,255,0.3); border-radius:12px; padding:30px; text-align:center; backdrop-filter: blur(10px); }
        .scan-icon { font-size:64px; margin-bottom:16px; }
        .face-setup-info { background: rgba(255,0,255,0.1); border:1px solid rgba(255,0,255,0.3); border-radius:6px; padding:12px; margin:16px 0; }
        .scan-button { background: linear-gradient(45deg,#ff00ff,#ff44ff); color:white; border:none; border-radius:6px; padding:12px 24px; font-size:14px; font-weight:bold; cursor:pointer; transition:all 0.3s ease; }
        .scan-button:hover { box-shadow: 0 4px 15px rgba(255,0,255,0.4); transform: translateY(-1px); }

        .stats-section { margin-top: 20px; }
        .stats-grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(200px,1fr)); gap:16px; }
        .stat-card { background: rgba(0,20,40,0.8); border:1px solid rgba(0,255,136,0.3); border-radius:12px; padding:20px; text-align:center; backdrop-filter: blur(10px); }
        .stat-number { font-size:32px; font-weight:bold; color:#00ff88; margin-bottom:8px; }
        .stat-label { color:#cccccc; font-size:14px; }

        .scanning-view { display:flex; justify-content:center; align-items:center; min-height:80vh; }
        .scan-container { background: rgba(0,20,40,0.9); border:1px solid rgba(0,255,255,0.3); border-radius:12px; padding:30px; text-align:center; max-width:600px; width:100%; backdrop-filter: blur(10px); }
        .camera-container { position:relative; margin-bottom:20px; }
        .camera-feed { width:100%; max-width:400px; height:300px; border-radius:8px; border:2px solid rgba(0,255,255,0.5); }
        .detection-overlay { position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; }

        .scanning-status { margin:20px 0; }
        .scan-progress { width:100%; height:4px; background: rgba(255,255,255,0.2); border-radius:2px; overflow:hidden; margin-bottom:10px; }
        .scan-progress-bar { height:100%; background: linear-gradient(90deg,#00ffff,#ff00ff); transition: width 0.1s ease; }

        .recognized-crew { background: rgba(0,255,136,0.1); border:1px solid rgba(0,255,136,0.3); border-radius:8px; padding:20px; }
        .crew-avatar-large { font-size:64px; margin-bottom:12px; }
        .cancel-scan-button { background: rgba(255,0,0,0.2); color:#ff4444; border:1px solid rgba(255,68,68,0.5); border-radius:6px; padding:10px 20px; cursor:pointer; transition:all 0.3s ease; }
        .cancel-scan-button:hover { background: rgba(255,0,0,0.3); }
      `}</style>
    </div>
  );
}
