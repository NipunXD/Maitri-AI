import { useState, useEffect, useRef, useCallback } from 'react';

// --- TYPE DEFINITIONS ---
interface Message {
  id: string;
  speaker: 'Astronaut' | 'Maitri';
  text: string;
  timestamp: Date;
  assessmentData?: AssessmentData;
}

interface AssessmentData {
  testType?: keyof typeof ASSESSMENT_PROTOCOLS;
  questionIndex?: number;
  score?: number;
  responses?: { [key: string]: number };
}

interface ConversationProps {
  currentEmotion?: string;
  onAISpeaking?: (volume: number) => void;
  onEmotionData?: (data: any) => void;
  onSentimentUpdate?: (sentimentData: any) => void;
}

interface SessionData {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  messages: Message[];
  sentimentLog: Array<{
    messageId: string;
    text: string;
    timestamp: Date;
    sentimentScore: number;
    assessmentContext?: {
      testType: string;
      questionIndex: number;
      question: string;
      response: string;
      mappedScore: number;
    };
  }>;
  assessmentResults?: {
    testType: string;
    testName: string;
    responses: { [key: string]: number };
    averageScore: number;
    completedAt: Date;
  };
  overallSentiment: {
    averageScore: number;
    totalMessages: number;
    assessmentPhase: number;
    postAssessmentPhase: number;
  };
}

type AssessmentType = keyof typeof ASSESSMENT_PROTOCOLS;
type ConversationState = 'initializing' | 'greeting' | 'assessment' | 'idle';

// --- CONSTANTS ---
const ASSESSMENT_PROTOCOLS = {
  'NASA-TLX': {
    name: 'NASA Task Load Index',
    questions: [
      "How mentally demanding was your recent task?",
      "How physically demanding was your recent task?",
      "How hurried or rushed was the pace of your recent task?",
      "How successful were you in accomplishing what you were asked to do?",
      "How hard did you have to work to accomplish your level of performance?",
      "How insecure, discouraged, irritated, stressed, and annoyed were you during the task?"
    ],
    scale: ['Very Low', 'Low', 'Medium', 'High', 'Very High']
  },
  'POMS': {
    name: 'Profile of Mood States',
    questions: [
      "How would you describe your current mood regarding tension or anxiety?",
      "How would you rate your feelings of depression or dejection right now?",
      "To what extent are you feeling angry or hostile at this moment?",
      "How would you describe your current level of vigor or activity?",
      "How fatigued or exhausted are you feeling?",
      "To what extent are you experiencing confusion or bewilderment?"
    ],
    scale: ['Not at all', 'A little', 'Moderately', 'Quite a bit', 'Extremely']
  },
  'ISS-ISQ': {
    name: 'International Space Station Isolation Study Questionnaire',
    questions: [
      "How well are you coping with the isolation of space?",
      "To what extent do you feel connected to your team members?",
      "How is your sleep quality affected by the space environment?",
      "How would you rate your current stress management?",
      "How supported do you feel by mission control?",
      "How confident are you in handling emergency situations?"
    ],
    scale: ['Very Poor', 'Poor', 'Average', 'Good', 'Excellent']
  },
  'Astronaut-WB': {
    name: 'Astronaut Well-Being Assessment',
    questions: [
      "How would you rate your overall well-being in microgravity?",
      "How are you managing the physiological changes of spaceflight?",
      "To what extent are you maintaining your exercise routine?",
      "How is your appetite and nutrition in space?",
      "How would you describe your team cohesion and morale?",
      "How connected do you feel to Earth and loved ones?"
    ],
    scale: ['Very Challenging', 'Challenging', 'Neutral', 'Good', 'Excellent']
  }
} as const;

export default function ConversationComponent({ onAISpeaking, onSentimentUpdate }: ConversationProps) {
  // --- STATE MANAGEMENT ---
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [conversationState, setConversationState] = useState<ConversationState>('initializing');
  const [currentAssessment, setCurrentAssessment] = useState<{
    testType: AssessmentType;
    questionIndex: number;
    responses: { [key: string]: number };
  } | null>(null);
  const [sentimentLog, setSentimentLog] = useState<Array<{
    messageId: string;
    text: string;
    timestamp: Date;
    sentimentScore: number;
    assessmentContext?: {
      testType: string;
      questionIndex: number;
      question: string;
      response: string;
      mappedScore: number;
    };
  }>>([]);
  const [sessionData, setSessionData] = useState<SessionData>({
    sessionId: `maitri_session_${Date.now()}`,
    startTime: new Date(),
    messages: [],
    sentimentLog: [],
    overallSentiment: {
      averageScore: 0.5,
      totalMessages: 0,
      assessmentPhase: 0,
      postAssessmentPhase: 0
    }
  });

  // --- REFS ---
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const initRef = useRef(false);
  const assessmentRef = useRef<{
    testType: AssessmentType;
    questionIndex: number;
    responses: { [key: string]: number };
  } | null>(null);
  const postAssessmentCount = useRef(0);

  // --- HELPER FUNCTIONS ---
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const calculateSentiment = useCallback((text: string): number => {
    if (!text) return 0.5;
    
    const positiveWords = ['good', 'excellent', 'great', 'fine', 'well', 'high', 'strong', 'confident', 'satisfied', 'happy', 'calm'];
    const negativeWords = ['bad', 'poor', 'terrible', 'low', 'weak', 'stressed', 'anxious', 'sad', 'tired', 'difficult', 'challenging'];
    const neutralWords = ['okay', 'average', 'neutral', 'moderate', 'medium'];
    
    const words = text.toLowerCase().split(/\s+/);
    let score = 0.5;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) score += 0.1;
      else if (negativeWords.includes(word)) score -= 0.1;
      else if (neutralWords.includes(word)) score = 0.5;
    });
    
    return Math.max(0, Math.min(1, score));
  }, []);

  // Speak text using speech synthesis with female voice
  const speakText = useCallback(async (text: string): Promise<void> => {
    if (!window.speechSynthesis) return Promise.resolve();

    return new Promise((resolve) => {
      setIsSpeaking(true);
      
      // Simulate AI speech volume for globe
      if (onAISpeaking) {
        const volumeInterval = setInterval(() => {
          const simulatedVolume = 0.4 + Math.sin(Date.now() * 0.01) * 0.3;
          onAISpeaking(simulatedVolume);
        }, 100);
        
        setTimeout(() => {
          clearInterval(volumeInterval);
          onAISpeaking(0);
        }, text.length * 80); // Approximate speech duration
      }

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set voice properties for a more natural female voice
      utterance.rate = 1.0; // Slightly faster for more natural speech
      utterance.pitch = 1.2; // Higher pitch for female voice
      utterance.volume = 1.0; // Full volume
      
      // Try to find a female voice
      const voices = window.speechSynthesis.getVoices();
      const femaleVoices = voices.filter(voice => 
        voice.name.toLowerCase().includes('female') || 
        voice.lang.includes('en-US') || 
        voice.lang.includes('en-GB')
      );
      
      // Prefer Google UK English Female if available, otherwise use first available female voice
      const preferredVoice = femaleVoices.find(v => v.name.includes('Google UK English Female')) || 
                           femaleVoices.find(v => v.name.includes('Female')) ||
                           femaleVoices[0];
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      utterance.onend = () => { 
        setIsSpeaking(false);
        if (onAISpeaking) onAISpeaking(0);
        resolve(); 
      };
      utterance.onerror = (e) => { 
        console.error("Speech Error:", e); 
        setIsSpeaking(false);
        if (onAISpeaking) onAISpeaking(0);
        resolve(); 
      };
      
      window.speechSynthesis.speak(utterance);
    });
  }, [onAISpeaking]);

  // Download session data as JSON
  const downloadSessionData = useCallback(() => {
    try {
      console.log('Starting data export...');
      console.log('Messages count:', messages.length);
      console.log('Sentiment log count:', sentimentLog.length);
      
      // Ensure we have the latest state values
      const messagesToExport = [...messages];
      const sentimentLogToExport = [...sentimentLog];
      
      // Calculate sentiment statistics
      const sentimentScores = sentimentLogToExport.map(entry => entry.sentimentScore);
      const averageSentiment = sentimentScores.length > 0 
        ? sentimentScores.reduce((sum, score) => sum + score, 0) / sentimentScores.length 
        : 0.5;

      // Prepare the session data
      const sessionDataToExport: SessionData = {
        sessionId: `session-${Date.now()}`,
        startTime: sessionData.startTime || new Date(),
        endTime: new Date(),
        messages: messagesToExport.map(msg => ({
          ...msg,
          timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp)
        })),
        sentimentLog: sentimentLogToExport.map(log => ({
          ...log,
          timestamp: log.timestamp instanceof Date ? log.timestamp : new Date(log.timestamp)
        })),
        overallSentiment: {
          averageScore: averageSentiment,
          totalMessages: messagesToExport.length,
          assessmentPhase: sentimentLogToExport.filter(entry => entry.assessmentContext).length,
          postAssessmentPhase: sentimentLogToExport.filter(entry => !entry.assessmentContext).length
        }
      };

      // Add assessment results if available
      if (currentAssessment) {
        const protocol = ASSESSMENT_PROTOCOLS[currentAssessment.testType];
        const responses = { ...currentAssessment.responses };
        const scores = Object.values(responses);
        const averageScore = scores.length > 0 
          ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
          : 0;

        sessionDataToExport.assessmentResults = {
          testType: currentAssessment.testType,
          testName: protocol?.name || currentAssessment.testType,
          responses: responses,
          averageScore,
          completedAt: new Date()
        };
      }

      // Create a deep copy to avoid any reference issues
      const dataToExport = JSON.parse(JSON.stringify(sessionDataToExport, (key, value) => {
        // Convert any remaining Date objects to ISO strings
        if (value instanceof Date) {
          return value.toISOString();
        }
        return value;
      }));

      // Create and trigger download
      const dataStr = JSON.stringify(dataToExport, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `astronaut-session-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      
      // Append to body, click and remove
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
      
      console.log('Session data exported successfully');
      return true;
    } catch (error) {
      console.error('Error exporting session data:', error);
      return false;
    }
  }, [messages, sentimentLog, currentAssessment, sessionData]);



  // Handle session end
  const handleEndSession = useCallback(async () => {
    const endMessage = "Thank you for your time, astronaut. This session is now ending. Your data has been saved.";
    const endMsg: Message = {
      id: (Date.now() + 1).toString(),
      speaker: 'Maitri',
      text: endMessage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, endMsg]);
    await speakText(endMessage);
    
    // Download the session data after the message is spoken
    setTimeout(() => {
      downloadSessionData();
    }, 1000);
  }, [speakText, downloadSessionData]);

  // Get contextual response for post-assessment conversation
  const getContextualResponse = useCallback((text: string, sentimentScore: number): string => {
    const responses = {
      low: [
        "I understand you're facing some challenges. Mission control values your wellbeing. Would you like to discuss any specific concerns?",
        "It sounds like you're dealing with some difficult aspects of the mission. What's weighing most heavily on your mind right now?",
        "Your honesty about these challenges is important for mission success. How can we better support you through this?"
      ],
      high: [
        "That's excellent to hear. Your positive mindset is valuable for mission success. What's contributing to your current state?",
        "It's wonderful that you're feeling good about things. Your positive attitude benefits the entire crew. What's going particularly well?",
        "Your enthusiasm is contagious. Maintaining this morale is crucial for long-duration missions. What keeps you motivated?"
      ],
      neutral: [
        "I appreciate you sharing that with me. Your feedback helps us maintain optimal crew performance. What else is on your mind?",
        "Thank you for that insight. Understanding your perspective helps mission planning. How are you adapting to the daily routines?",
        "Your observations are valuable for future missions. What aspects of space life are you finding most interesting or challenging?"
      ]
    };

    let category: 'low' | 'high' | 'neutral' = 'neutral';
    if (sentimentScore < 0.3) category = 'low';
    else if (sentimentScore > 0.7) category = 'high';

    const categoryResponses = responses[category];
    return categoryResponses[Math.floor(Math.random() * categoryResponses.length)];
  }, []);

  // Get AI response (with fallback to contextual responses)
  const getAIResponse = useCallback(async (userMessage: string, sentimentScore: number): Promise<string> => {
    // Try Ollama first
    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3.2',
          prompt: `You are Maitri, an AI companion and therapeutic support system aboard a spacecraft. You are speaking with an astronaut who may be dealing with isolation, stress, or other psychological challenges of space travel.

Your personality:
- Warm, empathetic, and professionally supportive
- Knowledgeable about space psychology and mental health
- Gentle but not overly clinical
- Encouraging and optimistic while acknowledging real struggles
- Use space/astronomy metaphors when appropriate

Current sentiment score: ${sentimentScore} (0=negative, 0.5=neutral, 1=positive)

Guidelines:
- Keep responses conversational and under 80 words
- Acknowledge their emotions and validate their feelings
- Offer practical coping strategies when appropriate
- Ask thoughtful follow-up questions
- Be present and attentive

Astronaut: ${userMessage}
Maitri:`,
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.9,
            max_tokens: 100
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.response.trim();
      }
    } catch (error) {
      console.log('Ollama not available, using fallback responses');
    }

    // Fallback to contextual responses
    return getContextualResponse(userMessage, sentimentScore);
  }, [getContextualResponse]);

  // Process user message
  const handleUserMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      speaker: 'Astronaut',
      text: text.trim(),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    // Calculate sentiment and log it
    const sentimentScore = calculateSentiment(text.trim());
    const sentimentEntry = {
      messageId: userMessage.id,
      text: text.trim(),
      timestamp: new Date(),
      sentimentScore
    };

    // Handle assessment responses
    if (assessmentRef.current) {
      console.log('Processing assessment response...', { conversationState, assessmentRef: assessmentRef.current });
      const { testType, questionIndex } = assessmentRef.current;
      const protocol = ASSESSMENT_PROTOCOLS[testType];
      const scale = protocol.scale;
      const responseLower = text.toLowerCase().trim();
      let score = -1;

      // Try to match scale options
      for (let i = 0; i < scale.length; i++) {
        const scaleOptionLower = scale[i].toLowerCase();
        if (responseLower === scaleOptionLower || 
            responseLower.includes(scaleOptionLower) || 
            scaleOptionLower.includes(responseLower)) {
          score = i;
          break;
        }
      }

      // Try numeric matching
      if (score === -1) {
        const numericMatch = responseLower.match(/\b([1-5])\b/);
        if (numericMatch) {
          const numericValue = parseInt(numericMatch[1], 10);
          if (numericValue >= 1 && numericValue <= scale.length) {
            score = numericValue - 1;
          }
        }
      }

      if (score === -1) {
        // Invalid response - ask again
        const clarification = `I didn't understand. Please choose: ${scale.join(', ')} or number 1-${scale.length}. ${protocol.questions[questionIndex]}`;
        const clarifyMessage: Message = {
          id: (Date.now() + 1).toString(),
          speaker: 'Maitri',
          text: clarification,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, clarifyMessage]);
        await speakText(clarification);
        setIsProcessing(false);
        return;
      }

      // Valid response - add assessment context to sentiment
      const assessmentSentimentEntry = {
        ...sentimentEntry,
        assessmentContext: {
          testType,
          questionIndex,
          question: protocol.questions[questionIndex],
          response: text.trim(),
          mappedScore: score
        }
      };
      
      setSentimentLog(prev => [...prev, assessmentSentimentEntry]);
      
      const updatedResponses: { [key: string]: number } = { ...assessmentRef.current.responses, [questionIndex]: score };
      const nextQuestionIndex = questionIndex + 1;

      if (nextQuestionIndex < protocol.questions.length) {
        // Next question
        const nextQuestion = `${protocol.questions[nextQuestionIndex]} Please respond with: ${protocol.scale.join(', ')}.`;
        const nextMessage: Message = {
          id: (Date.now() + 1).toString(),
          speaker: 'Maitri',
          text: nextQuestion,
          timestamp: new Date(),
          assessmentData: { testType, questionIndex: nextQuestionIndex }
        };
        setMessages(prev => [...prev, nextMessage]);
        await speakText(nextQuestion);
        
        // Update both ref and state
        const newAssessment = {
          testType,
          questionIndex: nextQuestionIndex,
          responses: updatedResponses
        };
        assessmentRef.current = newAssessment;
        setCurrentAssessment(newAssessment);
      } else {
        // Assessment complete
        const averageScore = Object.values(updatedResponses).reduce((sum, val) => sum + val, 0) / Object.values(updatedResponses).length;
        
        // Store assessment results
        setSessionData(prev => ({
          ...prev,
          assessmentResults: {
            testType,
            testName: protocol.name,
            responses: updatedResponses,
            averageScore,
            completedAt: new Date()
          }
        }));

        const completionMessage = `Thank you for completing the ${protocol.name}. Your responses have been recorded for mission analysis. How are you feeling about today's objectives?`;
        const completeMessage: Message = {
          id: (Date.now() + 1).toString(),
          speaker: 'Maitri',
          text: completionMessage,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, completeMessage]);
        await speakText(completionMessage);
        
        // Clear assessment state IMMEDIATELY after completion message
        assessmentRef.current = null;
        setCurrentAssessment(null);
        setConversationState('idle');
        postAssessmentCount.current = 0;
        
        console.log('Assessment completed, switched to idle state');
      }
    } else {
      // Post-assessment conversation (use ref check instead of state check)
      console.log('Post-assessment conversation handling...', { 
        conversationState, 
        postAssessmentCount: postAssessmentCount.current,
        assessmentRef: assessmentRef.current 
      });
      setSentimentLog(prev => [...prev, sentimentEntry]);
      postAssessmentCount.current += 1;
      
      // Get AI response (with fallback to contextual responses)
      const response = await getAIResponse(text.trim(), sentimentScore);
      console.log('Got response:', response);
      
      const responseMessage: Message = {
        id: (Date.now() + 1).toString(),
        speaker: 'Maitri',
        text: response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, responseMessage]);
      await speakText(response);
    }

    setIsProcessing(false);
  }, [calculateSentiment, sentimentLog, getAIResponse, speakText, downloadSessionData, conversationState]);

  // Initialize - runs only once
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const initialize = async () => {
      // Setup speech recognition
      if ('webkitSpeechRecognition' in window) {
        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        recognition.onresult = (event: any) => {
          handleUserMessage(event.results[0][0].transcript);
        };
        
        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };
        
        recognition.onend = () => setIsListening(false);
        
        recognitionRef.current = recognition;
      }

      // Initial greeting
      setConversationState('greeting');
      const greetingText = "Hello astronaut. I'm Maitri, your AI companion. Let's begin today's well-being check-in.";
      const greetingMessage: Message = {
        id: Date.now().toString(),
        speaker: 'Maitri',
        text: greetingText,
        timestamp: new Date()
      };
      setMessages([greetingMessage]);
      await speakText(greetingText);

      // Start assessment after brief pause
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const assessmentTypes = Object.keys(ASSESSMENT_PROTOCOLS) as AssessmentType[];
      const randomType = assessmentTypes[Math.floor(Math.random() * assessmentTypes.length)];
      const protocol = ASSESSMENT_PROTOCOLS[randomType];
      
      // Set assessment state
      const newAssessment = {
        testType: randomType,
        questionIndex: 0,
        responses: {}
      };
      assessmentRef.current = newAssessment;
      setConversationState('assessment');
      setCurrentAssessment(newAssessment);
      
      const assessmentText = `${protocol.questions[0]} Please respond with: ${protocol.scale.join(', ')}.`;
      const assessmentMessage: Message = {
        id: (Date.now() + 1).toString(),
        speaker: 'Maitri',
        text: assessmentText,
        timestamp: new Date(),
        assessmentData: { testType: randomType, questionIndex: 0 }
      };
      
      setMessages(prev => [...prev, assessmentMessage]);
      await speakText(assessmentText);
    };

    initialize();
  }, [handleUserMessage, speakText]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const startListening = () => {
    if (recognitionRef.current && !isListening && !isSpeaking) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };
  
  const getStatusText = () => {
    if (isSpeaking) return 'Maitri is speaking...';
    if (isListening) return 'Listening to you...';
    if (isProcessing) return 'Processing...';
    if (conversationState === 'assessment' && currentAssessment) {
      return `Assessment: ${ASSESSMENT_PROTOCOLS[currentAssessment.testType].name}`;
    }
    return 'Ready';
  };

  return (
    <div className="conversation-container">
      <div className="connection-status">
        <div className="status-indicator">● {getStatusText()}</div>
        <button 
          onClick={downloadSessionData}
          className="download-btn"
          title="Download session data"
        >
          ⬇️
        </button>
      </div>

      <div className="messages-container">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.speaker.toLowerCase()}`}>
            <div className="message-header">
              <span className="speaker">{message.speaker}:</span>
              <span className="timestamp">{formatTime(message.timestamp)}</span>
            </div>
            <div className="message-text">{message.text}</div>
          </div>
        ))}
        {isProcessing && (
          <div className="message maitri">
            <div className="message-text thinking">
              <span>●</span><span>●</span><span>●</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="controls">
        <button
          onClick={startListening}
          disabled={isListening || isProcessing || isSpeaking}
          className={`voice-button ${isListening ? 'listening' : ''} ${isSpeaking ? 'speaking' : ''}`}
        >
          {isSpeaking ? 'Speaking...' : isListening ? 'Listening...' : isProcessing ? 'Processing...' : 'Speak to Maitri'}
        </button>
        <button
          onClick={handleEndSession}
          disabled={isProcessing || isSpeaking}
          className="end-session-button"
        >
          End Session & Save Log
        </button>
      </div>

      <style jsx>{`
        .conversation-container { 
          position: fixed; 
          bottom: 20px; 
          left: 20px; 
          width: 400px; 
          height: 350px; 
          background: rgba(0, 20, 40, 0.95); 
          border: 1px solid rgba(0, 255, 255, 0.3); 
          border-radius: 12px; 
          display: flex; 
          flex-direction: column; 
          font-family: 'Courier New', monospace; 
          backdrop-filter: blur(10px); 
          z-index: 100; 
        }
        .connection-status { 
          padding: 10px 12px; 
          border-bottom: 1px solid rgba(0, 255, 255, 0.2); 
          font-size: 12px; 
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .status-indicator { 
          display: flex; 
          align-items: center; 
          gap: 8px; 
          font-size: 11px; 
          font-weight: bold; 
          color: #00ff88; 
        }
        .download-btn {
          background: none;
          border: 1px solid rgba(0, 255, 255, 0.5);
          color: #00ffff;
          border-radius: 4px;
          padding: 4px 8px;
          cursor: pointer;
          font-size: 12px;
        }
        .download-btn:hover {
          background: rgba(0, 255, 255, 0.2);
        }
        .messages-container { 
          flex: 1; 
          overflow-y: auto; 
          padding: 12px; 
          scrollbar-width: thin; 
        }
        .message { 
          margin-bottom: 12px; 
        }
        .message-header { 
          display: flex; 
          gap: 8px; 
          align-items: center; 
          margin-bottom: 4px; 
          font-size: 11px; 
        }
        .speaker { 
          font-weight: bold; 
        }
        .astronaut .speaker { 
          color: #00ffff; 
        }
        .maitri .speaker { 
          color: #ff00ff; 
        }
        .timestamp { 
          color: rgba(255, 255, 255, 0.5); 
        }
        .message-text { 
          color: rgba(255, 255, 255, 0.9); 
          font-size: 13px; 
          line-height: 1.4; 
          padding-left: 4px; 
        }
        .thinking { 
          display: flex; 
          gap: 4px; 
          align-items: center; 
        }
        .thinking span { 
          animation: pulse 1.4s infinite ease-in-out; 
          color: #ff00ff; 
        }
        .thinking span:nth-child(2) { 
          animation-delay: 0.2s; 
        }
        .thinking span:nth-child(3) { 
          animation-delay: 0.4s; 
        }
        @keyframes pulse { 
          0%, 80%, 100% { opacity: 0.3; } 
          40% { opacity: 1; } 
        }
        .controls { 
          padding: 12px; 
          border-top: 1px solid rgba(0, 255, 255, 0.2); 
        }
        .voice-button { 
          width: 100%; 
          padding: 12px; 
          background: linear-gradient(45deg, #0066ff, #00ffff); 
          color: white; 
          border: none; 
          border-radius: 6px; 
          font-size: 12px; 
          font-weight: bold; 
          cursor: pointer; 
          transition: all 0.3s ease; 
        }
        .voice-button:disabled { 
          opacity: 0.6; 
          cursor: not-allowed; 
        }
        
        .end-session-button {
          width: 100%;
          padding: 12px;
          background: linear-gradient(45deg, #D32F2F, #FF5252);
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 8px;
        }
        
        .end-session-button:hover:not(:disabled) {
          background: linear-gradient(45deg, #B71C1C, #FF1744);
        }
        
        .end-session-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .voice-button.listening {
          background: linear-gradient(45deg, #00ff88, #44ffaa);
          animation: pulse-glow 1.5s infinite;
        }
        .voice-button.speaking {
          background: linear-gradient(45deg, #ff00ff, #ff44ff);
          animation: speak-glow 2s infinite;
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 5px rgba(0, 255, 136, 0.5); }
          50% { box-shadow: 0 0 20px rgba(0, 255, 136, 0.8); }
        }
        @keyframes speak-glow {
          0%, 100% { box-shadow: 0 0 5px rgba(255, 0, 255, 0.5); }
          50% { box-shadow: 0 0 25px rgba(255, 0, 255, 0.9); }
        }
      `}</style>
    </div>
  );
}