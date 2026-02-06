"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

const textRotations = [
  { text: "मैत्री", lang: "hi" },      // Devanagari
  { text: "মৈত্রী", lang: "bn" },      // Bengali
  { text: "મૈત્રી", lang: "gu" },      // Gujarati
  { text: "ਮੈਤਰੀ", lang: "pa" },      // Gurmukhi
  { text: "ಮೈತ್ರೀ", lang: "kn" },      // Kannada
  { text: "மைத்திரி", lang: "ta" },   // Tamil
  { text: "మైత్రి", lang: "te" },     // Telugu
  { text: "മൈത്രി", lang: "ml" },     // Malayalam
  { text: "MAITRI", lang: "en" }      // English
] as const;

export default function HomePage() {
  const [textIndex, setTextIndex] = useState(-1); // Start empty
  const router = useRouter();
  
  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const rotateText = (index: number) => {
      if (!isMounted) return;

      // Stop at last text (English MAITRI)
      if (index >= textRotations.length) return;

      setTextIndex(index);

      // Schedule next rotation
      timeoutId = setTimeout(() => rotateText(index + 1), 800);
    };

    // Start rotation
    rotateText(0);

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const handleStart = () => {
    router.push("/maitri");
  };

  const handleDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <main className={styles.landing}>
      {/* Space Background Elements */}
      <div className={styles.stars}></div>
      
      <div className={styles.center}>
        {textIndex >= 0 && (
          <div>
            <h1 
              className={styles.maitri}
              lang={textRotations[textIndex].lang}
              aria-label="Maitri"
            >
              {textRotations[textIndex].text}
            </h1>
            <h2 className={styles.subtitle}>AI Assitant for Psychological and Physical Well-being of Astronauts</h2>
          </div>
        )}

        {textIndex === textRotations.length - 1 && (
          <div className={styles.buttonContainer}>
            <button
              type="button"
              className={styles.startButton}
              onClick={handleStart}
              aria-label="Start Maitri"
            >
              Start Maitri
            </button>
            <button
              type="button"
              className={styles.startButton}
              onClick={handleDashboard}
              aria-label="Go to Dashboard"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
