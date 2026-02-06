"use client";

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, AreaChart, Area, ScatterChart, Scatter, Cell, PieChart, Pie } from 'recharts';

interface SessionData {
  sessionId: string;
  startTime: string;
  endTime: string;
  totalMessages: number;
  overallSentiment: {
    averageScore: number;
    totalMessages: number;
    assessmentPhase: number;
    postAssessmentPhase: number;
  };
  assessmentResults?: {
    testType: string;
    testName: string;
    responses: { [key: string]: number };
    averageScore: number;
    completedAt: string;
  };
  sentimentLog: Array<{
    messageId: string;
    text: string;
    timestamp: string;
    sentimentScore: number;
    assessmentContext?: {
      testType: string;
      questionIndex: number;
      question: string;
      response: string;
      mappedScore: number;
    };
  }>;
}

interface CrewMember {
  id: string;
  name: string;
  callSign: string;
  rank: string;
  specialization: string;
  joinDate: string;
  avatar: string;
}

export default function SpaceCrewDashboard() {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [selectedSession, setSelectedSession] = useState<SessionData | null>(null);
  const [currentView, setCurrentView] = useState<'overview' | 'assessments' | 'mood' | 'performance'>('overview');
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [useMockData, setUseMockData] = useState(false); // Toggle for mock vs real data

  const crewMember: CrewMember = {
    id: "crew_user",
    name: "Nipun Arora",
    callSign: "ASTRO-1",
    rank: "Mission Commander",
    specialization: "Psychological Analysis",
    joinDate: "2024-01-01",
    avatar: "👨‍🚀"
  };

  // Update time every second for space theme
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Mission time formatter
  const formatMissionTime = () => {
    const missionStart = new Date('2024-01-01T00:00:00Z');
    const elapsed = currentTime.getTime() - missionStart.getTime();
    const days = Math.floor(elapsed / (1000 * 60 * 60 * 24));
    const hours = Math.floor((elapsed % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `SOL ${days} - ${hours.toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')}`;
  };

  // Comprehensive mock session data for demonstration
  const getMockSessionData = (): SessionData[] => [
    {
      sessionId: "session-2024-01-20",
      startTime: "2024-01-20T08:00:00.000Z",
      endTime: "2024-01-20T08:30:00.000Z",
      totalMessages: 18,
      overallSentiment: { averageScore: 0.75, totalMessages: 8, assessmentPhase: 6, postAssessmentPhase: 2 },
      assessmentResults: {
        testType: "NASA-TLX",
        testName: "NASA Task Load Index",
        responses: { "0": 1, "1": 2, "2": 0, "3": 3, "4": 2, "5": 1 },
        averageScore: 1.5,
        completedAt: "2024-01-20T08:15:00.000Z"
      },
      sentimentLog: [
        { messageId: "1", text: "low", timestamp: "2024-01-20T08:05:00.000Z", sentimentScore: 0.3, assessmentContext: { testType: "NASA-TLX", questionIndex: 0, question: "How mentally demanding was your recent task?", response: "low", mappedScore: 1 } },
        { messageId: "2", text: "medium", timestamp: "2024-01-20T08:06:00.000Z", sentimentScore: 0.5, assessmentContext: { testType: "NASA-TLX", questionIndex: 1, question: "How physically demanding was your recent task?", response: "medium", mappedScore: 2 } },
        { messageId: "3", text: "very low", timestamp: "2024-01-20T08:07:00.000Z", sentimentScore: 0.2, assessmentContext: { testType: "NASA-TLX", questionIndex: 2, question: "How hurried or rushed was the pace?", response: "very low", mappedScore: 0 } },
        { messageId: "4", text: "high", timestamp: "2024-01-20T08:08:00.000Z", sentimentScore: 0.8, assessmentContext: { testType: "NASA-TLX", questionIndex: 3, question: "How successful were you?", response: "high", mappedScore: 3 } },
        { messageId: "5", text: "medium", timestamp: "2024-01-20T08:09:00.000Z", sentimentScore: 0.5, assessmentContext: { testType: "NASA-TLX", questionIndex: 4, question: "How hard did you work?", response: "medium", mappedScore: 2 } },
        { messageId: "6", text: "low", timestamp: "2024-01-20T08:10:00.000Z", sentimentScore: 0.3, assessmentContext: { testType: "NASA-TLX", questionIndex: 5, question: "How frustrated were you?", response: "low", mappedScore: 1 } },
        { messageId: "7", text: "I feel great about today's mission objectives", timestamp: "2024-01-20T08:20:00.000Z", sentimentScore: 0.9 },
        { messageId: "8", text: "The EVA went smoothly and I'm confident about tomorrow", timestamp: "2024-01-20T08:25:00.000Z", sentimentScore: 0.85 }
      ]
    },
    {
      sessionId: "session-2024-01-19",
      startTime: "2024-01-19T09:00:00.000Z",
      endTime: "2024-01-19T09:25:00.000Z",
      totalMessages: 16,
      overallSentiment: { averageScore: 0.62, totalMessages: 9, assessmentPhase: 6, postAssessmentPhase: 3 },
      assessmentResults: {
        testType: "POMS",
        testName: "Profile of Mood States",
        responses: { "0": 2, "1": 1, "2": 3, "3": 3, "4": 2, "5": 1 },
        averageScore: 2.0,
        completedAt: "2024-01-19T09:15:00.000Z"
      },
      sentimentLog: [
        { messageId: "9", text: "a little", timestamp: "2024-01-19T09:03:00.000Z", sentimentScore: 0.4, assessmentContext: { testType: "POMS", questionIndex: 0, question: "Current mood regarding tension?", response: "a little", mappedScore: 2 } },
        { messageId: "10", text: "not at all", timestamp: "2024-01-19T09:04:00.000Z", sentimentScore: 0.7, assessmentContext: { testType: "POMS", questionIndex: 1, question: "Feelings of depression?", response: "not at all", mappedScore: 1 } },
        { messageId: "11", text: "moderately", timestamp: "2024-01-19T09:05:00.000Z", sentimentScore: 0.5, assessmentContext: { testType: "POMS", questionIndex: 2, question: "Feeling angry or hostile?", response: "moderately", mappedScore: 3 } },
        { messageId: "12", text: "quite a bit", timestamp: "2024-01-19T09:06:00.000Z", sentimentScore: 0.8, assessmentContext: { testType: "POMS", questionIndex: 3, question: "Level of vigor?", response: "quite a bit", mappedScore: 3 } },
        { messageId: "13", text: "a little", timestamp: "2024-01-19T09:07:00.000Z", sentimentScore: 0.4, assessmentContext: { testType: "POMS", questionIndex: 4, question: "How fatigued?", response: "a little", mappedScore: 2 } },
        { messageId: "14", text: "not at all", timestamp: "2024-01-19T09:08:00.000Z", sentimentScore: 0.7, assessmentContext: { testType: "POMS", questionIndex: 5, question: "Experiencing confusion?", response: "not at all", mappedScore: 1 } },
        { messageId: "15", text: "Some concerns about the upcoming spacewalk", timestamp: "2024-01-19T09:18:00.000Z", sentimentScore: 0.35 },
        { messageId: "16", text: "But I trust the team and feel prepared", timestamp: "2024-01-19T09:20:00.000Z", sentimentScore: 0.75 },
        { messageId: "17", text: "Looking forward to the research experiments", timestamp: "2024-01-19T09:22:00.000Z", sentimentScore: 0.8 }
      ]
    },
    {
      sessionId: "session-2024-01-18",
      startTime: "2024-01-18T10:00:00.000Z",
      endTime: "2024-01-18T10:35:00.000Z",
      totalMessages: 20,
      overallSentiment: { averageScore: 0.45, totalMessages: 11, assessmentPhase: 6, postAssessmentPhase: 5 },
      assessmentResults: {
        testType: "ISS-ISQ",
        testName: "ISS Isolation Study Questionnaire",
        responses: { "0": 2, "1": 3, "2": 1, "3": 2, "4": 4, "5": 3 },
        averageScore: 2.5,
        completedAt: "2024-01-18T10:15:00.000Z"
      },
      sentimentLog: [
        { messageId: "18", text: "average", timestamp: "2024-01-18T10:03:00.000Z", sentimentScore: 0.5, assessmentContext: { testType: "ISS-ISQ", questionIndex: 0, question: "Coping with isolation?", response: "average", mappedScore: 2 } },
        { messageId: "19", text: "good", timestamp: "2024-01-18T10:04:00.000Z", sentimentScore: 0.7, assessmentContext: { testType: "ISS-ISQ", questionIndex: 1, question: "Connection to team?", response: "good", mappedScore: 3 } },
        { messageId: "20", text: "poor", timestamp: "2024-01-18T10:05:00.000Z", sentimentScore: 0.2, assessmentContext: { testType: "ISS-ISQ", questionIndex: 2, question: "Sleep quality?", response: "poor", mappedScore: 1 } },
        { messageId: "21", text: "average", timestamp: "2024-01-18T10:06:00.000Z", sentimentScore: 0.5, assessmentContext: { testType: "ISS-ISQ", questionIndex: 3, question: "Stress management?", response: "average", mappedScore: 2 } },
        { messageId: "22", text: "excellent", timestamp: "2024-01-18T10:07:00.000Z", sentimentScore: 0.9, assessmentContext: { testType: "ISS-ISQ", questionIndex: 4, question: "Support from mission control?", response: "excellent", mappedScore: 4 } },
        { messageId: "23", text: "good", timestamp: "2024-01-18T10:08:00.000Z", sentimentScore: 0.7, assessmentContext: { testType: "ISS-ISQ", questionIndex: 5, question: "Confidence in emergencies?", response: "good", mappedScore: 3 } },
        { messageId: "24", text: "Sleep has been challenging with the noise", timestamp: "2024-01-18T10:20:00.000Z", sentimentScore: 0.25 },
        { messageId: "25", text: "Missing family more than usual today", timestamp: "2024-01-18T10:23:00.000Z", sentimentScore: 0.3 },
        { messageId: "26", text: "The Earth views help with homesickness", timestamp: "2024-01-18T10:25:00.000Z", sentimentScore: 0.6 },
        { messageId: "27", text: "Grateful for the incredible opportunity", timestamp: "2024-01-18T10:28:00.000Z", sentimentScore: 0.8 },
        { messageId: "28", text: "Ready to focus on tomorrow's objectives", timestamp: "2024-01-18T10:32:00.000Z", sentimentScore: 0.7 }
      ]
    },
    {
      sessionId: "session-2024-01-17",
      startTime: "2024-01-17T07:30:00.000Z",
      endTime: "2024-01-17T08:00:00.000Z",
      totalMessages: 14,
      overallSentiment: { averageScore: 0.68, totalMessages: 8, assessmentPhase: 6, postAssessmentPhase: 2 },
      assessmentResults: {
        testType: "Astronaut-WB",
        testName: "Astronaut Well-Being Assessment",
        responses: { "0": 3, "1": 2, "2": 4, "3": 3, "4": 4, "5": 2 },
        averageScore: 3.0,
        completedAt: "2024-01-17T07:45:00.000Z"
      },
      sentimentLog: [
        { messageId: "29", text: "good", timestamp: "2024-01-17T07:35:00.000Z", sentimentScore: 0.75, assessmentContext: { testType: "Astronaut-WB", questionIndex: 0, question: "Overall well-being?", response: "good", mappedScore: 3 } },
        { messageId: "30", text: "challenging", timestamp: "2024-01-17T07:36:00.000Z", sentimentScore: 0.4, assessmentContext: { testType: "Astronaut-WB", questionIndex: 1, question: "Managing physiological changes?", response: "challenging", mappedScore: 2 } },
        { messageId: "31", text: "excellent", timestamp: "2024-01-17T07:37:00.000Z", sentimentScore: 0.9, assessmentContext: { testType: "Astronaut-WB", questionIndex: 2, question: "Exercise routine?", response: "excellent", mappedScore: 4 } },
        { messageId: "32", text: "good", timestamp: "2024-01-17T07:38:00.000Z", sentimentScore: 0.75, assessmentContext: { testType: "Astronaut-WB", questionIndex: 3, question: "Appetite and nutrition?", response: "good", mappedScore: 3 } },
        { messageId: "33", text: "excellent", timestamp: "2024-01-17T07:39:00.000Z", sentimentScore: 0.9, assessmentContext: { testType: "Astronaut-WB", questionIndex: 4, question: "Team cohesion?", response: "excellent", mappedScore: 4 } },
        { messageId: "34", text: "challenging", timestamp: "2024-01-17T07:40:00.000Z", sentimentScore: 0.4, assessmentContext: { testType: "Astronaut-WB", questionIndex: 5, question: "Connection to Earth?", response: "challenging", mappedScore: 2 } },
        { messageId: "35", text: "The crew dynamics are fantastic", timestamp: "2024-01-17T07:52:00.000Z", sentimentScore: 0.85 },
        { messageId: "36", text: "Feeling strong and healthy", timestamp: "2024-01-17T07:55:00.000Z", sentimentScore: 0.8 }
      ]
    },
    {
      sessionId: "session-2024-01-16",
      startTime: "2024-01-16T14:00:00.000Z",
      endTime: "2024-01-16T14:40:00.000Z",
      totalMessages: 22,
      overallSentiment: { averageScore: 0.58, totalMessages: 12, assessmentPhase: 6, postAssessmentPhase: 6 },
      assessmentResults: {
        testType: "NASA-TLX",
        testName: "NASA Task Load Index",
        responses: { "0": 3, "1": 2, "2": 4, "3": 2, "4": 3, "5": 2 },
        averageScore: 2.67,
        completedAt: "2024-01-16T14:20:00.000Z"
      },
      sentimentLog: [
        { messageId: "37", text: "high", timestamp: "2024-01-16T14:05:00.000Z", sentimentScore: 0.8, assessmentContext: { testType: "NASA-TLX", questionIndex: 0, question: "Mental demand", response: "high", mappedScore: 3 } },
        { messageId: "38", text: "medium", timestamp: "2024-01-16T14:06:00.000Z", sentimentScore: 0.5, assessmentContext: { testType: "NASA-TLX", questionIndex: 1, question: "Physical demand", response: "medium", mappedScore: 2 } },
        { messageId: "39", text: "very high", timestamp: "2024-01-16T14:07:00.000Z", sentimentScore: 0.3, assessmentContext: { testType: "NASA-TLX", questionIndex: 2, question: "Temporal demand", response: "very high", mappedScore: 4 } },
        { messageId: "40", text: "medium", timestamp: "2024-01-16T14:08:00.000Z", sentimentScore: 0.5, assessmentContext: { testType: "NASA-TLX", questionIndex: 3, question: "Performance", response: "medium", mappedScore: 2 } },
        { messageId: "41", text: "high", timestamp: "2024-01-16T14:09:00.000Z", sentimentScore: 0.4, assessmentContext: { testType: "NASA-TLX", questionIndex: 4, question: "Effort", response: "high", mappedScore: 3 } },
        { messageId: "42", text: "medium", timestamp: "2024-01-16T14:10:00.000Z", sentimentScore: 0.5, assessmentContext: { testType: "NASA-TLX", questionIndex: 5, question: "Frustration", response: "medium", mappedScore: 2 } },
        { messageId: "43", text: "Today was particularly demanding", timestamp: "2024-01-16T14:25:00.000Z", sentimentScore: 0.3 },
        { messageId: "44", text: "Multiple system checks took longer than expected", timestamp: "2024-01-16T14:28:00.000Z", sentimentScore: 0.4 },
        { messageId: "45", text: "But we completed all critical tasks", timestamp: "2024-01-16T14:30:00.000Z", sentimentScore: 0.7 },
        { messageId: "46", text: "Looking forward to some downtime", timestamp: "2024-01-16T14:33:00.000Z", sentimentScore: 0.65 },
        { messageId: "47", text: "The team worked well under pressure", timestamp: "2024-01-16T14:35:00.000Z", sentimentScore: 0.8 },
        { messageId: "48", text: "Proud of what we accomplished today", timestamp: "2024-01-16T14:38:00.000Z", sentimentScore: 0.85 }
      ]
    }
  ];

  // Load session data based on toggle
  useEffect(() => {
    const loadAllSessions = async () => {
      try {
        setLoading(true);
        
        if (useMockData) {
          // Use rich mock data
          const mockSessions = getMockSessionData();
          setSessions(mockSessions);
          setSelectedSession(mockSessions[0]);
        } else {
          // Load real data from API
          const response = await fetch('/api/crew/sessions');
          if (!response.ok) {
            throw new Error('Failed to load sessions');
          }
          const sessionData = await response.json();
          
          // Transform the data to match expected format
          const transformedSessions: SessionData[] = sessionData.map((session: any) => ({
            sessionId: session.sessionId,
            startTime: session.startTime,
            endTime: session.endTime,
            totalMessages: session.messages?.length || 0,
            overallSentiment: session.overallSentiment || {
              averageScore: 0.5,
              totalMessages: session.sentimentLog?.length || 0,
              assessmentPhase: session.sentimentLog?.filter((log: any) => log.assessmentContext).length || 0,
              postAssessmentPhase: session.sentimentLog?.filter((log: any) => !log.assessmentContext).length || 0
            },
            assessmentResults: session.assessmentResults ? {
              testType: session.assessmentResults.testType,
              testName: session.assessmentResults.testName,
              responses: session.assessmentResults.responses,
              averageScore: session.assessmentResults.averageScore,
              completedAt: session.assessmentResults.completedAt
            } : extractAssessmentFromSentimentLog(session.sentimentLog),
            sentimentLog: session.sentimentLog || []
          }));

          // Sort by start time (newest first)
          transformedSessions.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
          
          setSessions(transformedSessions);
          setSelectedSession(transformedSessions[0] || null);
        }
      } catch (error) {
        console.error('Error loading sessions:', error);
        setSessions([]);
      } finally {
        setLoading(false);
      }
    };

    loadAllSessions();
  }, [useMockData]); // Reload when toggle changes

  // Helper function to extract assessment results from sentiment log if not available
  const extractAssessmentFromSentimentLog = (sentimentLog: any[]) => {
    if (!sentimentLog || sentimentLog.length === 0) return undefined;
    
    const assessmentEntries = sentimentLog.filter(log => log.assessmentContext);
    if (assessmentEntries.length === 0) return undefined;
    
    const firstEntry = assessmentEntries[0];
    const testType = firstEntry.assessmentContext.testType;
    
    // Extract responses from sentiment log
    const responses: { [key: string]: number } = {};
    assessmentEntries.forEach(entry => {
      if (entry.assessmentContext) {
        responses[entry.assessmentContext.questionIndex.toString()] = entry.assessmentContext.mappedScore;
      }
    });
    
    // Calculate average score
    const scores = Object.values(responses);
    const averageScore = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
    
    // Map test type to full name
    const testNames: { [key: string]: string } = {
      'NASA-TLX': 'NASA Task Load Index',
      'POMS': 'Profile of Mood States',
      'ISS-ISQ': 'International Space Station Isolation Study Questionnaire',
      'Astronaut-WB': 'Astronaut Well-Being Assessment'
    };
    
    return {
      testType,
      testName: testNames[testType] || testType,
      responses,
      averageScore,
      completedAt: assessmentEntries[assessmentEntries.length - 1]?.timestamp || new Date().toISOString()
    };
  };

  // Enhanced data for real session analysis
  const sentimentTrendData = sessions.map((session, index) => ({
    date: new Date(session.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    fullDate: new Date(session.startTime).toLocaleDateString(),
    sentiment: Number(session.overallSentiment.averageScore.toFixed(3)),
    messages: session.overallSentiment.totalMessages,
    assessmentScore: session.assessmentResults?.averageScore || 0,
    sessionDuration: session.endTime ? 
      Math.round((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 60000) : 0,
    sessionIndex: sessions.length - index // Reverse index for chronological order
  }));

  // Detailed conversation analysis
  const conversationFlowData = selectedSession ? selectedSession.sentimentLog.map((entry, index) => ({
    messageIndex: index + 1,
    sentiment: entry.sentimentScore,
    text: entry.text.substring(0, 30) + (entry.text.length > 30 ? '...' : ''),
    time: new Date(entry.timestamp).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    isAssessment: !!entry.assessmentContext,
    assessmentScore: entry.assessmentContext?.mappedScore
  })) : [];

  // Real-time session statistics
  const sessionStats = {
    totalSessions: sessions.length,
    averageSentiment: sessions.length > 0 ? 
      (sessions.reduce((sum, s) => sum + s.overallSentiment.averageScore, 0) / sessions.length) : 0,
    totalMessages: sessions.reduce((sum, s) => sum + s.overallSentiment.totalMessages, 0),
    completedAssessments: sessions.filter(s => s.assessmentResults).length,
    averageSessionDuration: sessions.length > 0 ? 
      sessions.reduce((sum, s) => {
        if (s.endTime) {
          return sum + (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 60000;
        }
        return sum;
      }, 0) / sessions.length : 0,
    latestSession: sessions[0] ? new Date(sessions[0].startTime) : null,
    sentimentTrend: sessions.length > 1 ? 
      (sessions[0].overallSentiment.averageScore - sessions[1].overallSentiment.averageScore) : 0
  };

  // Assessment type distribution
  const assessmentTypeData = sessions.reduce((acc, session) => {
    if (session.assessmentResults) {
      const testType = session.assessmentResults.testType;
      if (!acc[testType]) {
        acc[testType] = { count: 0, avgScore: 0, totalScore: 0 };
      }
      acc[testType].count += 1;
      acc[testType].totalScore += session.assessmentResults.averageScore;
      acc[testType].avgScore = acc[testType].totalScore / acc[testType].count;
    }
    return acc;
  }, {} as { [key: string]: { count: number; avgScore: number; totalScore: number } });

  const assessmentDistributionData = Object.entries(assessmentTypeData).map(([type, data]) => ({
    name: type,
    count: data.count,
    avgScore: Number(data.avgScore.toFixed(2)),
    color: {
      'NASA-TLX': '#ff00ff',
      'POMS': '#00ff88', 
      'ISS-ISQ': '#ffaa00',
      'Astronaut-WB': '#00ffff'
    }[type] || '#ffffff'
  }));

  // Consolidated radar chart data for all assessments
  const getAllAssessmentRadarData = () => {
    const assessmentTypes = ['NASA-TLX', 'POMS', 'ISS-ISQ', 'Astronaut-WB'];
    const labels = {
      'NASA-TLX': ['Mental', 'Physical', 'Temporal', 'Performance', 'Effort', 'Frustration'],
      'POMS': ['Tension', 'Depression', 'Anger', 'Vigor', 'Fatigue', 'Confusion'],
      'ISS-ISQ': ['Isolation Coping', 'Team Connection', 'Sleep Quality', 'Stress Mgmt', 'Support', 'Confidence'],
      'Astronaut-WB': ['Well-being', 'Physiology', 'Exercise', 'Nutrition', 'Team Morale', 'Earth Connection']
    };

    return assessmentTypes.map(type => {
      const latestSession = sessions
        .filter(s => s.assessmentResults?.testType === type)
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())[0];

      if (!latestSession?.assessmentResults) return null;

      return {
        testType: type,
        testName: latestSession.assessmentResults.testName,
        data: Object.keys(latestSession.assessmentResults.responses).map((key, index) => ({
          subject: labels[type as keyof typeof labels]?.[index] || `Q${index + 1}`,
          value: latestSession.assessmentResults!.responses[key],
          fullMark: 4
        }))
      };
    }).filter(Boolean);
  };

  const assessmentRadarData = getAllAssessmentRadarData();

  // Mood distribution data
  const moodDistributionData = [
    { name: 'Positive', value: sessions.filter(s => s.overallSentiment.averageScore > 0.6).length, color: '#00ff88' },
    { name: 'Neutral', value: sessions.filter(s => s.overallSentiment.averageScore >= 0.4 && s.overallSentiment.averageScore <= 0.6).length, color: '#ffaa00' },
    { name: 'Negative', value: sessions.filter(s => s.overallSentiment.averageScore < 0.4).length, color: '#ff4444' }
  ];

  // Performance metrics over time
  const performanceData = sessions.map(session => ({
    date: new Date(session.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    efficiency: session.overallSentiment.averageScore * 100,
    engagement: (session.overallSentiment.totalMessages / 20) * 100,
    completion: session.assessmentResults ? 100 : 0
  }));

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading psychological profile data...</p>
      </div>
    );
  }

  return (
    <div className="space-dashboard">
      {/* Space-themed Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <button className="back-nav" onClick={() => window.history.back()}>
            ← Mission Control
          </button>
          <div className="crew-identification">
            <div className="crew-avatar-header">{crewMember.avatar}</div>
            <div className="crew-details-header">
              <h1 className="crew-name">{crewMember.name}</h1>
              <div className="crew-meta">
                <span className="call-sign">{crewMember.callSign}</span>
                <span className="rank">{crewMember.rank}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mission-status">
          <div className="time-display">
            <div className="mission-time">{formatMissionTime()}</div>
            <div className="earth-time">{currentTime.toLocaleTimeString()}</div>
          </div>
          <div className="status-indicators">
            <div className="status-light online">PSYCH-SYS</div>
            <div className="status-light ready">ANALYSIS</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="nav-control">
        <div className="nav-tabs-left">
          {[
            { key: 'overview', label: 'OVERVIEW', icon: '📊' },
            { key: 'assessments', label: 'ASSESSMENTS', icon: '🧠' },
            { key: 'mood', label: 'MOOD ANALYSIS', icon: '💭' },
            { key: 'performance', label: 'PERFORMANCE', icon: '⚡' }
          ].map(tab => (
            <button
              key={tab.key}
              className={`nav-tab ${currentView === tab.key ? 'active' : ''}`}
              onClick={() => setCurrentView(tab.key as any)}
            >
              <span className="tab-icon">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
        
        <div className="data-toggle">
          <span className="toggle-label">Data Source:</span>
          <div className="toggle-switch">
            <input
              type="checkbox"
              id="dataToggle"
              checked={useMockData}
              onChange={(e) => setUseMockData(e.target.checked)}
              className="toggle-input"
            />
            <label htmlFor="dataToggle" className="toggle-slider">
              <span className="toggle-option left">REAL</span>
              <span className="toggle-option right">DEMO</span>
            </label>
          </div>
          <div className="data-status">
            {useMockData ? (
              <span className="status-demo">🎭 Demonstration Mode</span>
            ) : (
              <span className="status-real">📡 Live Data</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="dashboard-content">
        {currentView === 'overview' && (
          <div className="overview-layout">
            <div className="metrics-grid">
              <div className="metric-card primary">
                <h3>PSYCHOLOGICAL STATUS</h3>
                <div className="metric-value">
                  {sessionStats.averageSentiment.toFixed(3)}
                </div>
                <div className="metric-label">Average Sentiment Score</div>
                <div className="metric-trend">
                  {sessionStats.sentimentTrend > 0 ? '↗ Improving' : 
                   sessionStats.sentimentTrend < 0 ? '↘ Declining' : '→ Stable'}
                  {sessionStats.sentimentTrend !== 0 && ` (${sessionStats.sentimentTrend > 0 ? '+' : ''}${sessionStats.sentimentTrend.toFixed(3)})`}
                </div>
              </div>

              <div className="metric-card secondary">
                <h3>MISSION ENGAGEMENT</h3>
                <div className="metric-value">{sessionStats.totalSessions}</div>
                <div className="metric-label">Total Sessions</div>
                <div className="metric-sublabel">
                  {sessionStats.totalMessages} total interactions
                  <br />
                  Avg duration: {sessionStats.averageSessionDuration.toFixed(1)} min
                </div>
              </div>

              <div className="metric-card tertiary">
                <h3>ASSESSMENT STATUS</h3>
                <div className="metric-value">{sessionStats.completedAssessments}</div>
                <div className="metric-label">Completed Assessments</div>
                <div className="metric-sublabel">
                  {sessionStats.latestSession ? 
                    `Last session: ${sessionStats.latestSession.toLocaleDateString()}` : 
                    'No sessions yet'
                  }
                </div>
              </div>
            </div>

            <div className="charts-layout">
              <div className="chart-panel large">
                <h3>PSYCHOLOGICAL TREND ANALYSIS</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={sentimentTrendData}>
                    <defs>
                      <linearGradient id="sentimentGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00ffff" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#00ffff" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 255, 255, 0.2)" />
                    <XAxis dataKey="date" stroke="#00ffff" fontSize={12} />
                    <YAxis domain={[0, 1]} stroke="#00ffff" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0, 20, 40, 0.95)', 
                        border: '1px solid #00ffff',
                        borderRadius: '8px',
                        color: '#ffffff'
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="sentiment" 
                      stroke="#00ffff" 
                      fillOpacity={1} 
                      fill="url(#sentimentGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-panel medium">
                <h3>MOOD DISTRIBUTION</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={moodDistributionData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {moodDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0, 20, 40, 0.95)', 
                        border: '1px solid #00ffff'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {currentView === 'assessments' && (
          <div className="assessments-layout">
            <h2>COMPREHENSIVE ASSESSMENT ANALYSIS</h2>
            <div className="radar-grid">
              {assessmentRadarData.map((assessment, index) => (
                <div key={assessment?.testType} className="radar-panel">
                  <h3>{assessment?.testName}</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={assessment?.data}>
                      <PolarGrid stroke="rgba(255, 255, 255, 0.2)" />
                      <PolarAngleAxis 
                        dataKey="subject" 
                        tick={{ fill: '#ffffff', fontSize: 11 }}
                        className="radar-labels"
                      />
                      <PolarRadiusAxis 
                        angle={90} 
                        domain={[0, 4]} 
                        tick={{ fill: '#888888', fontSize: 10 }}
                      />
                      <Radar
                        name={assessment?.testType}
                        dataKey="value"
                        stroke={['#ff00ff', '#00ff88', '#ffaa00', '#00ffff'][index % 4]}
                        fill={['#ff00ff', '#00ff88', '#ffaa00', '#00ffff'][index % 4]}
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(0, 20, 40, 0.95)', 
                          border: '1px solid #00ffff'
                        }} 
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentView === 'mood' && (
          <div className="mood-layout">
            <h2>PSYCHOLOGICAL STATE MONITORING</h2>
            <div className="mood-analysis">
              <div className="chart-panel full-width">
                <h3>SENTIMENT CORRELATION MATRIX</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <ScatterChart data={sessions.map(s => ({ 
                    x: s.overallSentiment.averageScore, 
                    y: s.assessmentResults?.averageScore || 0,
                    size: s.overallSentiment.totalMessages * 3, // Scale up for visibility
                    name: new Date(s.startTime).toLocaleDateString(),
                    duration: s.endTime ? 
                      Math.round((new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 60000) : 0
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis 
                      type="number" 
                      dataKey="x" 
                      name="Sentiment Score"
                      domain={[0, 1]}
                      stroke="#00ffff"
                    />
                    <YAxis 
                      type="number" 
                      dataKey="y" 
                      name="Assessment Score"
                      domain={[0, 'dataMax']}
                      stroke="#00ffff"
                    />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      contentStyle={{ 
                        backgroundColor: 'rgba(0, 20, 40, 0.95)', 
                        border: '1px solid #00ffff'
                      }}
                      formatter={(value: number | string | number[], name: string) => [
                        name === 'size' ? `${Math.round(Number(value) / 3)} messages` : value,
                        name === 'x' ? 'Sentiment' : name === 'y' ? 'Assessment' : name
                      ]}
                    />
                    <Scatter dataKey="size" fill="#ff00ff" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>

              {/* Conversation Flow Analysis */}
              {selectedSession && (
                <div className="conversation-flow">
                  <h3>CONVERSATION FLOW ANALYSIS</h3>
                  <div className="session-selector">
                    <select 
                      value={selectedSession.sessionId}
                      onChange={(e) => setSelectedSession(sessions.find(s => s.sessionId === e.target.value) || null)}
                      className="session-select"
                    >
                      {sessions.map(session => (
                        <option key={session.sessionId} value={session.sessionId}>
                          {new Date(session.startTime).toLocaleDateString()} - {session.assessmentResults?.testName || 'Session'}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="conversation-timeline">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={conversationFlowData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                        <XAxis 
                          dataKey="messageIndex" 
                          stroke="#00ffff"
                          label={{ value: 'Message #', position: 'insideBottom', offset: -10, style: { fill: '#00ffff' } }}
                        />
                        <YAxis 
                          domain={[0, 1]}
                          stroke="#00ffff"
                          label={{ value: 'Sentiment', angle: -90, position: 'insideLeft', style: { fill: '#00ffff' } }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(0, 20, 40, 0.95)', 
                            border: '1px solid #00ffff'
                          }}
                          formatter={(value, name, props) => [
                            name === 'sentiment' ? Number(value).toFixed(3) : value,
                            name === 'sentiment' ? 'Sentiment Score' : name
                          ]}
                          labelFormatter={(label) => `Message ${label}`}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="sentiment" 
                          stroke="#ff00ff" 
                          strokeWidth={2}
                          dot={(props) => (
                            <circle 
                              cx={props.cx} 
                              cy={props.cy} 
                              r={conversationFlowData[props.index]?.isAssessment ? 6 : 3}
                              fill={conversationFlowData[props.index]?.isAssessment ? "#00ff88" : "#ff00ff"}
                              stroke={conversationFlowData[props.index]?.isAssessment ? "#ffffff" : "transparent"}
                              strokeWidth={1}
                            />
                          )}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                    <div className="timeline-legend">
                      <div className="legend-item">
                        <div className="legend-dot assessment"></div>
                        <span>Assessment Response</span>
                      </div>
                      <div className="legend-item">
                        <div className="legend-dot conversation"></div>
                        <span>General Conversation</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === 'performance' && (
          <div className="performance-layout">
            <h2>MISSION PERFORMANCE METRICS</h2>
            <div className="performance-grid">
              <div className="chart-panel">
                <h3>EFFICIENCY TRACKING</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis dataKey="date" stroke="#00ffff" />
                    <YAxis stroke="#00ffff" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0, 20, 40, 0.95)', 
                        border: '1px solid #00ffff'
                      }} 
                    />
                    <Bar dataKey="efficiency" fill="#00ff88" />
                    <Bar dataKey="engagement" fill="#ffaa00" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="performance-summary">
                <h3>PERFORMANCE INDICATORS</h3>
                <div className="indicators">
                  <div className="indicator">
                    <div className="indicator-value">
                      {sessions.length > 0 ? Math.round((sessions.reduce((sum, s) => sum + s.overallSentiment.averageScore, 0) / sessions.length) * 100) : 0}%
                    </div>
                    <div className="indicator-label">Psychological Efficiency</div>
                  </div>
                  <div className="indicator">
                    <div className="indicator-value">
                      {Math.round((sessions.filter(s => s.assessmentResults).length / sessions.length) * 100) || 0}%
                    </div>
                    <div className="indicator-label">Assessment Completion</div>
                  </div>
                  <div className="indicator">
                    <div className="indicator-value">
                      {sessions.reduce((sum, s) => sum + s.totalMessages, 0)}
                    </div>
                    <div className="indicator-label">Total Interactions</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .space-dashboard {
          min-height: 100vh;
          background: linear-gradient(135deg, #000 0%, #001122 25%, #002244 50%, #001133 75%, #000 100%);
          color: #ffffff;
          font-family: 'Courier New', monospace;
          position: relative;
          overflow-x: hidden;
        }

        .space-dashboard::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(2px 2px at 20px 30px, #ffffff, transparent),
                      radial-gradient(2px 2px at 40px 70px, rgba(255,255,255,0.8), transparent),
                      radial-gradient(1px 1px at 90px 40px, rgba(255,255,255,0.6), transparent),
                      radial-gradient(1px 1px at 130px 80px, rgba(255,255,255,0.4), transparent),
                      radial-gradient(2px 2px at 160px 30px, rgba(255,255,255,0.7), transparent);
          background-repeat: repeat;
          background-size: 200px 100px;
          opacity: 0.3;
          pointer-events: none;
          z-index: 0;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          background: rgba(0, 20, 40, 0.9);
          border-bottom: 2px solid #00ffff;
          backdrop-filter: blur(15px);
          position: relative;
          z-index: 10;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .back-nav {
          background: rgba(0, 255, 255, 0.2);
          border: 1px solid #00ffff;
          color: #00ffff;
          padding: 10px 15px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: 'Courier New', monospace;
        }

        .back-nav:hover {
          background: rgba(0, 255, 255, 0.4);
          box-shadow: 0 0 15px rgba(0, 255, 255, 0.5);
        }

        .crew-identification {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .crew-avatar-header {
          font-size: 48px;
          filter: drop-shadow(0 0 10px #00ffff);
        }

        .crew-name {
          font-size: 28px;
          margin: 0;
          color: #00ffff;
          text-shadow: 0 0 10px rgba(0, 255, 255, 0.8);
        }

        .crew-meta {
          display: flex;
          gap: 15px;
          margin-top: 5px;
        }

        .call-sign {
          color: #ff00ff;
          font-weight: bold;
          background: rgba(255, 0, 255, 0.2);
          padding: 2px 8px;
          border-radius: 4px;
        }

        .rank {
          color: #ffaa00;
          font-weight: bold;
        }

        .mission-status {
          text-align: right;
        }

        .time-display {
          margin-bottom: 10px;
        }

        .mission-time {
          font-size: 18px;
          color: #00ff88;
          font-weight: bold;
          text-shadow: 0 0 8px rgba(0, 255, 136, 0.8);
        }

        .earth-time {
          font-size: 14px;
          color: #888;
        }

        .status-indicators {
          display: flex;
          gap: 10px;
        }

        .status-light {
          background: rgba(0, 255, 136, 0.2);
          border: 1px solid #00ff88;
          color: #00ff88;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          animation: pulse-glow 2s infinite ease-in-out;
        }

        .status-light.ready {
          background: rgba(255, 170, 0, 0.2);
          border-color: #ffaa00;
          color: #ffaa00;
        }

        @keyframes pulse-glow {
          0%, 100% { opacity: 1; box-shadow: 0 0 5px currentColor; }
          50% { opacity: 0.7; box-shadow: 0 0 20px currentColor; }
        }

        .nav-control {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(0, 10, 20, 0.9);
          border-bottom: 1px solid rgba(0, 255, 255, 0.3);
          position: relative;
          z-index: 10;
          padding: 0 20px;
        }

        .nav-tabs-left {
          display: flex;
        }

        .data-toggle {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .toggle-label {
          color: #cccccc;
          font-size: 12px;
          font-weight: bold;
        }

        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 120px;
          height: 32px;
        }

        .toggle-input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, #0066ff, #00ffff);
          border-radius: 16px;
          transition: 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 4px;
          font-size: 10px;
          font-weight: bold;
          color: #ffffff;
        }

        .toggle-input:checked + .toggle-slider {
          background: linear-gradient(45deg, #ff00ff, #ff44ff);
        }

        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 24px;
          width: 56px;
          left: 4px;
          bottom: 4px;
          background-color: rgba(255, 255, 255, 0.9);
          border-radius: 12px;
          transition: 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .toggle-input:checked + .toggle-slider:before {
          transform: translateX(56px);
        }

        .toggle-option {
          position: relative;
          z-index: 2;
          padding: 0 8px;
          transition: all 0.3s ease;
        }

        .toggle-input:not(:checked) + .toggle-slider .toggle-option.left {
          color: #000000;
          font-weight: bold;
        }

        .toggle-input:checked + .toggle-slider .toggle-option.right {
          color: #000000;
          font-weight: bold;
        }

        .data-status {
          display: flex;
          align-items: center;
          font-size: 11px;
        }

        .status-demo {
          color: #ff00ff;
          background: rgba(255, 0, 255, 0.2);
          padding: 4px 8px;
          border-radius: 4px;
          border: 1px solid rgba(255, 0, 255, 0.3);
        }

        .status-real {
          color: #00ffff;
          background: rgba(0, 255, 255, 0.2);
          padding: 4px 8px;
          border-radius: 4px;
          border: 1px solid rgba(0, 255, 255, 0.3);
        }10;
        }

        .nav-tab {
          background: none;
          border: none;
          color: #888;
          padding: 15px 25px;
          cursor: pointer;
          border-bottom: 3px solid transparent;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'Courier New', monospace;
          font-weight: bold;
        }

        .nav-tab:hover {
          color: #00ffff;
          background: rgba(0, 255, 255, 0.1);
        }

        .nav-tab.active {
          color: #00ffff;
          border-bottom-color: #00ffff;
          background: rgba(0, 255, 255, 0.2);
          box-shadow: 0 -3px 10px rgba(0, 255, 255, 0.3);
        }

        .tab-icon {
          font-size: 16px;
        }

        .dashboard-content {
          padding: 25px;
          position: relative;
          z-index: 5;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          color: #00ffff;
        }

        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 3px solid rgba(0, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: #00ffff;
          animation: spin 1s ease-in-out infinite;
          margin-bottom: 20px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .overview-layout {
          display: grid;
          gap: 25px;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin-bottom: 25px;
        }

        .metric-card {
          background: rgba(0, 20, 40, 0.8);
          border-radius: 12px;
          padding: 20px;
          backdrop-filter: blur(10px);
          position: relative;
          overflow: hidden;
        }

        .metric-card.primary {
          border: 2px solid #00ffff;
          box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
        }

        .metric-card.secondary {
          border: 2px solid #00ff88;
          box-shadow: 0 0 20px rgba(0, 255, 136, 0.3);
        }

        .metric-card.tertiary {
          border: 2px solid #ff00ff;
          box-shadow: 0 0 20px rgba(255, 0, 255, 0.3);
        }

        .metric-card h3 {
          color: #ffffff;
          margin: 0 0 15px 0;
          font-size: 14px;
          font-weight: bold;
          opacity: 0.9;
        }

        .metric-value {
          font-size: 36px;
          font-weight: bold;
          margin-bottom: 8px;
        }

        .metric-card.primary .metric-value {
          color: #00ffff;
          text-shadow: 0 0 15px rgba(0, 255, 255, 0.8);
        }

        .metric-card.secondary .metric-value {
          color: #00ff88;
          text-shadow: 0 0 15px rgba(0, 255, 136, 0.8);
        }

        .metric-card.tertiary .metric-value {
          color: #ff00ff;
          text-shadow: 0 0 15px rgba(255, 0, 255, 0.8);
        }

        .metric-label {
          color: #cccccc;
          font-size: 14px;
          margin-bottom: 5px;
        }

        .metric-trend {
          color: #00ff88;
          font-size: 12px;
          font-weight: bold;
        }

        .metric-sublabel {
          color: #888;
          font-size: 12px;
        }

        .charts-layout {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 20px;
        }

        .chart-panel {
          background: rgba(0, 20, 40, 0.8);
          border: 1px solid rgba(0, 255, 255, 0.3);
          border-radius: 12px;
          padding: 20px;
          backdrop-filter: blur(10px);
        }

        .chart-panel h3 {
          color: #00ffff;
          margin: 0 0 20px 0;
          font-size: 16px;
          font-weight: bold;
          text-align: center;
        }

        .chart-panel.large {
          grid-column: span 1;
        }

        .chart-panel.medium {
          background: rgba(0, 20, 40, 0.8);
          border: 1px solid rgba(255, 0, 255, 0.3);
        }

        .chart-panel.medium h3 {
          color: #ff00ff;
        }

        .chart-panel.full-width {
          grid-column: span 2;
        }

        .assessments-layout h2,
        .mood-layout h2,
        .performance-layout h2 {
          color: #00ffff;
          text-align: center;
          margin-bottom: 30px;
          font-size: 24px;
          text-shadow: 0 0 15px rgba(0, 255, 255, 0.6);
        }

        .radar-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 25px;
        }

        .radar-panel {
          background: rgba(0, 20, 40, 0.8);
          border: 1px solid rgba(0, 255, 255, 0.3);
          border-radius: 12px;
          padding: 20px;
          backdrop-filter: blur(10px);
        }

        .radar-panel h3 {
          color: #ffffff;
          text-align: center;
          margin-bottom: 15px;
          font-size: 16px;
        }

        .radar-labels {
          font-size: 11px;
        }

        .mood-analysis {
          margin-top: 20px;
        }

        .performance-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 25px;
          margin-top: 20px;
        }

        .performance-summary {
          background: rgba(0, 20, 40, 0.8);
          border: 1px solid rgba(0, 255, 136, 0.3);
          border-radius: 12px;
          padding: 20px;
          backdrop-filter: blur(10px);
        }

        .performance-summary h3 {
          color: #00ff88;
          text-align: center;
          margin-bottom: 20px;
        }

        .indicators {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .indicator {
          text-align: center;
          padding: 15px;
          background: rgba(0, 255, 136, 0.1);
          border: 1px solid rgba(0, 255, 136, 0.3);
          border-radius: 8px;
        }

        .indicator-value {
          font-size: 32px;
          font-weight: bold;
          color: #00ff88;
          margin-bottom: 5px;
          text-shadow: 0 0 10px rgba(0, 255, 136, 0.8);
        }

        .indicator-label {
          color: #cccccc;
          font-size: 12px;
        }

        @media (max-width: 768px) {
          .dashboard-header {
            flex-direction: column;
            gap: 15px;
            text-align: center;
          }

          .header-left {
            flex-direction: column;
            gap: 15px;
          }

          .charts-layout {
            grid-template-columns: 1fr;
          }

          .radar-grid {
            grid-template-columns: 1fr;
          }

          .performance-grid {
            grid-template-columns: 1fr;
          }

          .nav-tab {
            padding: 12px 15px;
            font-size: 12px;
          }

        .conversation-flow {
          margin-top: 25px;
          background: rgba(0, 20, 40, 0.8);
          border: 1px solid rgba(0, 255, 255, 0.3);
          border-radius: 12px;
          padding: 20px;
          backdrop-filter: blur(10px);
        }

        .conversation-flow h3 {
          color: #00ffff;
          text-align: center;
          margin-bottom: 20px;
        }

        .session-selector {
          margin-bottom: 20px;
          text-align: center;
        }

        .session-select {
          background: rgba(0, 20, 40, 0.9);
          border: 1px solid #00ffff;
          color: #ffffff;
          padding: 8px 15px;
          border-radius: 6px;
          font-family: 'Courier New', monospace;
          font-size: 12px;
          min-width: 300px;
        }

        .session-select:focus {
          outline: none;
          box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
        }

        .conversation-timeline {
          position: relative;
        }

        .timeline-legend {
          display: flex;
          justify-content: center;
          gap: 30px;
          margin-top: 15px;
          padding: 10px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 6px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #cccccc;
        }

        .legend-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid #ffffff;
        }

        .legend-dot.assessment {
          background: #00ff88;
        }

        .legend-dot.conversation {
          background: #ff00ff;
          border: none;
        }
      `}</style>
    </div>
  );
}