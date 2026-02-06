export function startWSRecorder(onAudioResponse: (url: string) => void) {
    const socket = new WebSocket("ws://localhost:8000/ws");
  
    socket.onopen = () => {
      console.log("Connected to server");
  
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        const recorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
  
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
            socket.send(event.data); // send mic chunk to backend
          }
        };
  
        recorder.start(250); // send every 250ms
      });
    };
  
    socket.onmessage = (event) => {
      const blob = new Blob([event.data], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      onAudioResponse(url); // pass to callback for playback
    };
  }  