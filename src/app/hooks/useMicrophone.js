import { useEffect, useState } from "react";

export default function useMicrophone() {
  const [volume, setVolume] = useState(0);

  useEffect(() => {
    let audioContext;
    let analyser;
    let dataArray;

    async function init() {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = audioContext.createMediaStreamSource(stream);

      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      dataArray = new Uint8Array(analyser.frequencyBinCount);

      source.connect(analyser);

      function tick() {
        analyser.getByteFrequencyData(dataArray);
        let avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setVolume(avg / 256); // normalize between 0–1
        requestAnimationFrame(tick);
      }
      tick();
    }

    init();

    return () => {
      if (audioContext) audioContext.close();
    };
  }, []);

  return volume;
}
