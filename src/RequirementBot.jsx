import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, Loader } from 'lucide-react';

const RequirementGatheringBot = () => {
  const [projectName, setProjectName] = useState('');
  const [projectCreated, setProjectCreated] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [ambiguities, setAmbiguities] = useState([]);
  const [contradictions, setContradictions] = useState([]);
  const [requirementsCount, setRequirementsCount] = useState(0);
  const [requirements, setRequirements] = useState([]);
  const [conversationState, setConversationState] = useState('idle');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const ambiguousTerms = [
    'fast', 'slow', 'easy', 'hard', 'good', 'bad', 'simple', 'complex',
    'reliable', 'robust', 'scalable', 'efficient', 'user-friendly', 'responsive',
    'better', 'worse', 'modern', 'clean', 'nice', 'smooth'
  ];

  // ✅ FIX 1: Add API key to headers
  const callClaudeAPI = async (prompt) => {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      console.error('API key not configured. Add VITE_ANTHROPIC_API_KEY to .env file');
      return null;
    }

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return data.content[0].text;
    } catch (error) {
      console.error('Claude API Error:', error);
      return null;
    }
  };

  const detectAmbiguity = (text) => {
    const lowerText = text.toLowerCase();
    const foundTerms = ambiguousTerms.filter(term => lowerText.includes(term));
    return foundTerms.length > 0 ? foundTerms : null;
  };

  const checkContradictions = (newRequirement) => {
    const newLower = newRequirement.toLowerCase();
    const contradictionPairs = [
      { a: 'offline', b: 'real-time sync' },
      { a: 'low budget', b: 'enterprise scale' },
      { a: 'mobile only', b: 'desktop' },
      { a: 'zero latency', b: 'high security' }
    ];

    for (let i = 0; i < contradictionPairs.length; i += 1) {
      const pair = contradictionPairs[i];
      if ((newLower.includes(pair.a) || newLower.includes(pair.b))) {
        for (let j = 0; j < requirements.length; j += 1) {
          const req = requirements[j];
          const reqLower = req.toLowerCase();
          if ((newLower.includes(pair.a) && reqLower.includes(pair.b)) ||
              (newLower.includes(pair.b) && reqLower.includes(pair.a))) {
            return pair;
          }
        }
      }
    }
    return null;
  };

  const conversations = {
    idle: {
      intro: "Hello! I'm your Requirements Gathering Assistant. I'll guide you through capturing all your project requirements in a structured way. Let's start with your project name.",
      nextState: 'features'
    },
    features: {
      question: "Great! Now, what are the main FEATURES or FUNCTIONALITIES your system should have?",
      nextState: 'users',
      validation: (text) => text.length > 5
    },
    users: {
      question: "Excellent! WHO will use this system? (e.g., customers, employees, admins)",
      nextState: 'performance',
      validation: (text) => text.length > 3
    },
    performance: {
      question: "What are your PERFORMANCE requirements? (e.g., response time, uptime, concurrent users)",
      nextState: 'security',
      validation: (text) => true
    },
    security: {
      question: "What are your SECURITY and COMPLIANCE requirements? (e.g., encryption, data privacy, industry standards)",
      nextState: 'timeline',
      validation: (text) => true
    },
    timeline: {
      question: "What is your PROJECT TIMELINE? (e.g., 3 months, 6 weeks)",
      nextState: 'budget',
      validation: (text) => true
    },
    budget: {
      question: "What is your BUDGET for this project?",
      nextState: 'constraints',
      validation: (text) => true
    },
    constraints: {
      question: "Any other CONSTRAINTS or TECHNICAL PREFERENCES we should know about?",
      nextState: 'complete',
      validation: (text) => true
    }
  };

  const createProject = () => {
    if (!projectName.trim()) {
      alert('Please enter a project name');
      return;
    }
    setProjectCreated(true);
    setConversationState('idle');
    const greeting = conversations.idle.intro;
    setMessages([
      {
        id: 1,
        sender: 'bot',
        text: greeting,
        timestamp: new Date()
      }
    ]);
  };

  // ✅ FIX 2: Move requirement addition after validation
  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      sender: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Check for ambiguities BEFORE adding requirement
    const ambiguityTerms = detectAmbiguity(input);
    if (ambiguityTerms) {
      const ambiguity = {
        id: ambiguities.length + 1,
        requirement: input,
        terms: ambiguityTerms,
        resolved: false
      };
      setAmbiguities(prev => [...prev, ambiguity]);

      await new Promise(resolve => setTimeout(resolve, 500));

      const botMessage = {
        id: messages.length + 2,
        sender: 'bot',
        text: `⚠️ AMBIGUITY DETECTED: The terms "${ambiguityTerms.join('", "')}" are subjective and unmeasurable. 
        
Can you clarify with specific metrics or examples? For instance:
- Instead of "${ambiguityTerms[0]}", specify: "response time < 2 seconds" or "load time < 3 seconds"
- Who are the users? What's the context?`,
        isAlert: true,
        type: 'ambiguity',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
      setLoading(false);
      return;
    }

    // Check for contradictions BEFORE adding requirement
    const contradiction = checkContradictions(input);
    if (contradiction) {
      const conflictItem = {
        id: contradictions.length + 1,
        requirement1: contradiction.a,
        requirement2: contradiction.b,
        resolved: false
      };
      setContradictions(prev => [...prev, conflictItem]);

      await new Promise(resolve => setTimeout(resolve, 500));

      const botMessage = {
        id: messages.length + 2,
        sender: 'bot',
        text: `🔴 CONTRADICTION DETECTED: You mentioned "${contradiction.b}" but earlier stated "${contradiction.a}".
        
These conflict with each other. Which takes priority? Please clarify your actual requirement.`,
        isAlert: true,
        type: 'contradiction',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
      setLoading(false);
      return;
    }

    // NOW add requirement to list (after validation)
    setRequirements(prev => [...prev, input]);
    setRequirementsCount(prev => prev + 1);

    // Normal conversation flow
    let nextState = conversationState;
    let botResponse = '';

    if (conversationState === 'idle') {
      nextState = 'features';
      botResponse = `✓ Project "${input}" created successfully!\n\n${conversations.features.question}`;
    } else if (conversationState in conversations && conversationState !== 'complete') {
      const currentConv = conversations[conversationState];
      nextState = currentConv.nextState;
      
      if (nextState === 'complete') {
        botResponse = `✓ Perfect! I've gathered all your requirements.\n\nYou have:\n• ${requirementsCount} Requirements Captured\n• ${ambiguities.filter(a => !a.resolved).length} Ambiguities to Resolve\n• ${contradictions.filter(c => !c.resolved).length} Contradictions to Resolve\n\nWould you like to export your SRS document now? Click the "Export Requirements" button.`;
      } else {
        botResponse = `✓ Understood!\n\n${conversations[nextState].question}`;
      }
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    const botMsg = {
      id: messages.length + 2,
      sender: 'bot',
      text: botResponse,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, botMsg]);
    setConversationState(nextState);
    setLoading(false);
  };

  const exportSRS = async () => {
    if (requirementsCount === 0) {
      alert('Please add at least one requirement before exporting');
      return;
    }

    setLoading(true);

    let ieeeSRS = `
================================================================================
                   SOFTWARE REQUIREMENTS SPECIFICATION
                              FOR
                           ${projectName.toUpperCase()}
                              Version 1.0
================================================================================

Prepared by: AI Requirements Engineering Assistant
Date: ${new Date().toLocaleDateString()}
Status: Draft

================================================================================
TABLE OF CONTENTS
================================================================================

1. Introduction
2. Overall Description
3. Specific Requirements
4. Analysis & Issues
5. Appendices

================================================================================
1. INTRODUCTION
================================================================================

1.1 Purpose
This Software Requirements Specification (SRS) specifies the requirements for 
${projectName}. This document was generated using the AI Requirements Gathering 
Assistant and contains functional requirements, non-functional requirements, and 
identified constraints.

1.2 Document Conventions
- REQ-[NUMBER]: Functional requirement identifier
- REQ-NFR-[NUMBER]: Non-functional requirement identifier
- [ASSUMPTION]: Indicates an assumption
- [CONSTRAINT]: Indicates a constraint

1.3 Intended Audience
- Project Managers
- Business Analysts
- Software Developers
- Quality Assurance Engineers
- Product Owners

1.4 Product Scope
${projectName} is designed to meet the requirements captured during the 
automated requirements gathering session.

================================================================================
2. OVERALL DESCRIPTION
================================================================================

2.1 Product Perspective
${projectName} is a new software product designed to address the business needs 
identified during requirements elicitation.

2.2 Product Functions
The system shall perform the following major functions:
${requirements.slice(0, Math.min(5, requirements.length)).map((req) => `  - ${req}`).join('\n')}
${requirementsCount > 5 ? `  - [${requirementsCount - 5} additional requirements captured below]` : ''}

2.3 User Characteristics
Users of this system include:
  - End Users
  - System Administrators
  - Technical Support Staff
  - Business Stakeholders

2.4 Operating Environment
  - Hardware: Standard computing devices (PC, Mac, or Linux)
  - Software: Modern web browsers or native applications
  - Network: Stable internet connection recommended

2.5 Constraints
  - Project Scope: As defined by captured requirements
  - Timeline: To be determined based on feasibility analysis
  - Budget: To be determined by project stakeholders
  - Technology Stack: Open-source components preferred

================================================================================
3. SPECIFIC REQUIREMENTS
================================================================================

3.1 FUNCTIONAL REQUIREMENTS
`;

    // ✅ FIX 3: Truncate long requirements
    let reqCounter = 1;
    for (let i = 0; i < requirements.length; i += 1) {
      const req = requirements[i];
      const truncatedReq = req.length > 80 ? `${req.substring(0, 77)}...` : req;
      ieeeSRS += `
REQ-${reqCounter.toString().padStart(3, '0')}: ${truncatedReq}
  Priority: Medium
  Status: Captured
  Description: ${req}
`;
      reqCounter += 1;
    }

    ieeeSRS += `

3.2 NON-FUNCTIONAL REQUIREMENTS

REQ-NFR-001: Performance
  The system shall respond to user interactions within 2 seconds.

REQ-NFR-002: Security
  All data transmission shall be encrypted using HTTPS/TLS 1.2 or higher.

REQ-NFR-003: Availability
  The system shall maintain 99% uptime during operational hours.

REQ-NFR-004: Scalability
  The system shall support concurrent users as specified during feasibility analysis.

REQ-NFR-005: Usability
  The system shall achieve a System Usability Scale (SUS) score of >80.

================================================================================
4. ANALYSIS & ISSUES
================================================================================

4.1 AMBIGUITIES DETECTED (${ambiguities.length})
`;

    if (ambiguities.length === 0) {
      ieeeSRS += `
No ambiguities detected in captured requirements.
`;
    } else {
      for (let i = 0; i < ambiguities.length; i += 1) {
        const amb = ambiguities[i];
        ieeeSRS += `
AMBIGUITY-${i + 1}:
  Requirement: "${amb.requirement}"
  Ambiguous Terms: ${amb.terms.join(', ')}
  Status: ${amb.resolved ? 'RESOLVED' : 'PENDING RESOLUTION'}
  Recommendation: Clarify with stakeholders using specific metrics or examples.
`;
      }
    }

    ieeeSRS += `

4.2 CONTRADICTIONS DETECTED (${contradictions.length})
`;

    if (contradictions.length === 0) {
      ieeeSRS += `
No contradictions detected in captured requirements.
`;
    } else {
      for (let i = 0; i < contradictions.length; i += 1) {
        const cont = contradictions[i];
        ieeeSRS += `
CONTRADICTION-${i + 1}:
  Conflicting Elements: "${cont.requirement1}" vs "${cont.requirement2}"
  Status: ${cont.resolved ? 'RESOLVED' : 'PENDING RESOLUTION'}
  Recommendation: Prioritize requirements with stakeholders and document decision.
`;
      }
    }

    ieeeSRS += `

4.3 FEASIBILITY ASSESSMENT
  Total Requirements Captured: ${requirementsCount}
  Ambiguities to Resolve: ${ambiguities.filter(a => !a.resolved).length}
  Contradictions to Resolve: ${contradictions.filter(c => !c.resolved).length}
  
  Status: PRELIMINARY DRAFT
  Recommendation: Requirements must be reviewed and validated by human 
  professionals before proceeding with development.

================================================================================
5. APPENDICES
================================================================================

APPENDIX A: GLOSSARY
- SRS: Software Requirements Specification
- REQ: Requirement
- NFR: Non-Functional Requirement
- IEEE 830: IEEE Recommended Practice for Software Requirements Specifications

APPENDIX B: CONVERSATION HISTORY
${messages.map((msg, idx) => `
[${idx + 1}] ${msg.sender.toUpperCase()}: 
${msg.text}
`).join('\n')}

APPENDIX C: DISCLAIMER
================================================================================
IMPORTANT DISCLAIMER

This Software Requirements Specification was generated using artificial 
intelligence. While the AI system has been designed to capture and structure 
requirements accurately, the following important points must be noted:

1. HUMAN REVIEW REQUIRED: All requirements in this document MUST be reviewed, 
   validated, and approved by qualified human professionals (Business Analysts, 
   Product Managers, or System Architects) before use in development.

2. AI LIMITATIONS: The AI system may:
   - Misinterpret user intent or context
   - Miss implicit or domain-specific requirements
   - Misclassify requirements by type
   - Fail to detect all ambiguities or contradictions

3. QUALITY ASSURANCE: This document should be considered a PRELIMINARY DRAFT
   and a starting point for manual requirements refinement, not a final 
   specification ready for development.

4. ACCURACY: While the system targets 80%+ accuracy in ambiguity and 
   contradiction detection, no guarantee of 100% accuracy is provided.

5. LIABILITY: The authors and developers of this AI system are not liable for 
   any issues, delays, or failures in development projects that use this 
   specification without proper human review and validation.

For questions or clarifications regarding any requirement, please contact the 
project stakeholders and domain experts directly.

================================================================================
Generated: ${new Date().toLocaleString()}
System: Requirements Gathering Bot v1.0 (IEEE 830-1998 Compliant)
================================================================================
`;

    // Create blob and download
    const blob = new Blob([ieeeSRS], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SRS_${projectName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setLoading(false);
  };

  const resetProject = () => {
    setProjectName('');
    setProjectCreated(false);
    setMessages([]);
    setInput('');
    setAmbiguities([]);
    setContradictions([]);
    setRequirementsCount(0);
    setRequirements([]);
    setConversationState('idle');
  };

  // ✅ FIX 4: Add null check for root element
  if (!document.getElementById('root')) {
    return null;
  }

  if (!projectCreated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-500 to-purple-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Requirements Gathering Assistant</h1>
          <p className="text-gray-600 mb-6">Create a new project to begin capturing requirements</p>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && createProject()}
            placeholder="Enter project name"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg mb-4 focus:outline-none focus:border-purple-500"
          />
          <button
            onClick={createProject}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition"
          >
            <Plus className="inline mr-2" size={20} />
            Create Project
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📊 Project Summary</h2>
          <div className="space-y-3">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Project</p>
              <p className="font-semibold text-gray-800">{projectName}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Requirements Captured</p>
              <p className="text-2xl font-bold text-blue-600">{requirementsCount}</p>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Ambiguities Detected</p>
              <p className="text-2xl font-bold text-yellow-600">{ambiguities.length}</p>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Contradictions Detected</p>
              <p className="text-2xl font-bold text-red-600">{contradictions.length}</p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="font-semibold text-gray-800 mb-3">💡 Tips</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>✓ Be specific when describing requirements</li>
            <li>✓ Mention constraints early (budget, timeline)</li>
            <li>✓ Answer clarification questions honestly</li>
            <li>✓ Review detected ambiguities and contradictions</li>
          </ul>
        </div>

        <button
          onClick={resetProject}
          className="w-full bg-gray-200 text-gray-800 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
        >
          <Plus size={18} className="inline mr-2" />
          New Project
        </button>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 shadow">
          <h1 className="text-2xl font-bold">Requirements Gathering Assistant</h1>
          <p className="text-purple-100">{projectName}</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xl rounded-lg p-4 ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
                    : msg.isAlert && msg.type === 'ambiguity'
                    ? 'bg-yellow-50 border-2 border-yellow-400'
                    : msg.isAlert && msg.type === 'contradiction'
                    ? 'bg-red-50 border-2 border-red-400'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>
                <p className={`text-xs mt-2 ${msg.sender === 'user' ? 'text-purple-100' : 'text-gray-500'}`}>
                  {msg.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-4 flex items-center gap-2">
                <Loader size={18} className="animate-spin" />
                <span className="text-gray-600">Processing...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              placeholder="Type your requirement or response..."
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
              disabled={loading}
            />
            <button
              onClick={handleSendMessage}
              disabled={loading || !input.trim()}
              className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
            >
              <Send size={20} />
            </button>
            <button
              onClick={exportSRS}
              disabled={requirementsCount === 0}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
            >
              📥 Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequirementGatheringBot;