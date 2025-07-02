import { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'
import './App.css'

interface Message {
  id: string;
  content: string;
  type: 'user' | 'bot';
  timestamp: Date;
  suggestions?: string[];
}

interface ContextData {
  travel: string;
  core: string;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [contextData, setContextData] = useState<ContextData | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Load context data on component mount
  useEffect(() => {
    const loadContextData = async () => {
      try {
        const [travelResponse, coreResponse] = await Promise.all([
          fetch('/context/GWI_TRAVEL_context.txt'),
          fetch('/context/GWI_CORE_context.txt')
        ]);

        const contextData: ContextData = {
          travel: await travelResponse.text(),
          core: await coreResponse.text()
        };

        setContextData(contextData);
        console.log('Travel context data loaded successfully');
      } catch (error) {
        console.error('Error loading context data:', error);
      }
    };

    loadContextData();
  }, []);

  // Improved auto scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end'
        });
      };
      
      const timeoutId = setTimeout(scrollToBottom, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [messages]);

  // Additional scroll effect for loading state
  useEffect(() => {
    if (isLoading && messagesEndRef.current) {
      const timeoutId = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end'
        });
      }, 200);
      return () => clearTimeout(timeoutId);
    }
  }, [isLoading]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  // Handle suggestion clicks
  const handleFeatureClick = (feature: string) => {
    const prompts = {
      'travel-segmentation': 'Analyze millennial travel preferences and behaviors',
      'destination-trends': 'Show destination trends for luxury travelers',
      'adventure-analysis': 'Help segment adventure travel enthusiasts',
      'travel-insights': 'Explore post-pandemic travel behavior changes'
    };
    
    setInputMessage(prompts[feature as keyof typeof prompts]);
    setTimeout(() => {
      const input = document.querySelector('.input-field') as HTMLTextAreaElement;
      if (input) input.focus();
    }, 100);
  };

  const processMessage = async (userInput: string) => {
    setIsLoading(true);
    
    try {
      const userQuestion = userInput.toLowerCase();
      let responseText = '';
      let suggestions: string[] = [];

      // Use context data if available for more accurate responses
      if (contextData) {
        // Search through travel context data for relevant information
        const searchContext = (query: string): string => {
          const lowerQuery = query.toLowerCase();
          let relevantContext = '';
          
          // Search in travel context first
          if (contextData.travel.toLowerCase().includes(lowerQuery)) {
            const lines = contextData.travel.split('\n');
            const relevantLines = lines.filter(line => 
              line.toLowerCase().includes(lowerQuery) || 
              (lines.indexOf(line) > 0 && lines[lines.indexOf(line) - 1].toLowerCase().includes(lowerQuery))
            );
            relevantContext += relevantLines.slice(0, 8).join('\n') + '\n';
          }
          
          return relevantContext;
        };

        // Try to find context-based response
        const contextInfo = searchContext(userQuestion);
        if (contextInfo.trim()) {
          responseText = `Based on GWI Travel Insights data:\n\n${contextInfo}\n\nWould you like me to help you analyze specific travel behavior patterns or segment this audience further?`;
          suggestions = [
            "Analyze travel booking patterns",
            "Show accommodation preferences", 
            "Explore destination trends",
            "Map travel audience segments"
          ];
        }
      }

      // Fallback responses for common travel queries
      if (!responseText && (userQuestion.includes('millennial') && userQuestion.includes('travel'))) {
        responseText = `Based on GWI Travel data, millennial travel behavior shows distinct patterns:

**Key Travel Characteristics:**
• Mobile-first booking behavior
• Experience-driven destination choices
• Social media influence on travel decisions
• Sustainability considerations
• Flexible travel planning approach

**Booking Preferences:**
• App-based reservations preferred
• Last-minute booking capability valued
• Price comparison across platforms
• Direct booking with hotels/airlines

**Destination Factors:**
• Instagram-worthy locations
• Unique cultural experiences
• Adventure and outdoor activities
• Local authentic experiences

This data can help target millennial travelers effectively.`;

        suggestions = [
          "Show millennial accommodation preferences",
          "Analyze millennial transport choices",
          "Explore social media travel influence",
          "Map millennial destination preferences"
        ];
      }
      else if (!responseText && (userQuestion.includes('luxury') || userQuestion.includes('premium'))) {
        responseText = `GWI Travel insights on luxury travel segments:

**Luxury Travel Characteristics:**
• Premium accommodation preferences
• First-class and business travel
• Exclusive destination choices
• High-value service expectations
• Brand loyalty in travel choices

**Booking Behavior:**
• Direct booking with luxury brands
• Concierge and travel advisor usage
• Advanced booking timeframes
• Flexible cancellation requirements

**Experience Priorities:**
• Personalized service delivery
• Exclusive access and amenities
• Fine dining and spa services
• Private transportation options

Perfect for targeting high-value travel segments.`;

        suggestions = [
          "Analyze luxury accommodation brands",
          "Show premium travel booking patterns",
          "Explore luxury destination trends",
          "Map high-value traveler segments"
        ];
      }
      else if (!responseText) {
        responseText = `I'm your GWI Travel Assistant, specialized in tourism insights and travel behavior analysis. I can help you understand:

**Travel Segmentation:**
• Demographic travel patterns
• Behavioral travel segments
• Destination preferences by audience
• Booking behavior analysis

**Tourism Analytics:**
• Market opportunity assessment
• Travel trend identification
• Seasonal pattern analysis
• Competitive landscape insights

**Consumer Behavior:**
• Travel decision-making processes
• Platform and booking preferences
• Price sensitivity analysis
• Travel motivation factors

What specific travel insight would you like me to analyze?`;

        suggestions = [
          "Analyze adventure travel segments",
          "Show family travel preferences", 
          "Explore business travel patterns",
          "Map destination booking trends"
        ];
      }

      // Add bot response
      const botMessage: Message = {
        id: 'msg-' + Date.now().toString(),
        content: responseText,
        type: 'bot',
        timestamp: new Date(),
        suggestions: suggestions
      };

      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error('Error processing message:', error);
      
      const errorMessage: Message = {
        id: 'error-' + Date.now().toString(),
        content: "I apologize, but I encountered an error processing your travel inquiry. Please try again or rephrase your question about travel insights and tourism data.",
        type: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    // Hide welcome section
    setShowWelcome(false);

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      type: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');

    // Reset textarea height
    const textarea = document.querySelector('.input-field') as HTMLTextAreaElement;
    if (textarea) {
      textarea.style.height = 'auto';
    }

    // Process the message
    await processMessage(inputMessage);
  };

  return (
    <div className="app">
      <header className="header">
        <div className="left-section">
          <div className="robot-section">
            <img 
              src="/images/3D_AI_front_view.png" 
              alt="GWI Travel Bot" 
              className="robot-image"
            />
            <div className="status-section">
              <div className="status-dot"></div>
              <span>Online</span>
            </div>
          </div>
          <div className="divider"></div>
          <div className="tbwa-section">
            <img src="/logo_tbwa_white.svg" alt="TBWA Logo" className="tbwa-logo" />
          </div>
        </div>
        <div className="gwi-section">
          <img 
            src="https://cdn.brandfetch.io/idB_IK0frl/w/1280/h/960/theme/dark/logo.png?c=1dxbfHSJFAPEGdCLU4o5B"
            alt="GWI Logo"
            className="gwi-logo"
          />
          <div>
            <div className="gwi-title">Travel Insights</div>
            <div className="core-subtitle">Tourism Analytics Assistant</div>
          </div>
        </div>
      </header>

      <div className="main-container">
        <div className="chat-container" ref={chatContainerRef}>
          {showWelcome && messages.length === 0 && (
            <div className="welcome-section">
              <h2 className="welcome-title">Welcome to GWI Travel Insights</h2>
              <p className="welcome-subtitle" style={{color: '#ff6b35'}}>Tourism Analytics & Travel Behavior Specialist</p>
              <p className="welcome-description">
                I help brands understand travel consumer segments using GWI Travel data. Ask me about travel behavior patterns, destination analytics, and tourism industry insights.
              </p>
              
              <div className="features-grid">
                <div className="feature-card" onClick={() => handleFeatureClick('travel-segmentation')} style={{borderLeft: '3px solid #ff6b35'}}>
                  <div className="feature-title">Travel Segmentation</div>
                  <div className="feature-description">Analyze millennial travel preferences and behaviors</div>
                </div>
                <div className="feature-card" onClick={() => handleFeatureClick('destination-trends')} style={{borderLeft: '3px solid #ff6b35'}}>
                  <div className="feature-title">Destination Trends</div>
                  <div className="feature-description">Show destination trends for luxury travelers</div>
                </div>
                <div className="feature-card" onClick={() => handleFeatureClick('adventure-analysis')} style={{borderLeft: '3px solid #ff6b35'}}>
                  <div className="feature-title">Adventure Analysis</div>
                  <div className="feature-description">Help segment adventure travel enthusiasts</div>
                </div>
                <div className="feature-card" onClick={() => handleFeatureClick('travel-insights')} style={{borderLeft: '3px solid #ff6b35'}}>
                  <div className="feature-title">Travel Insights</div>
                  <div className="feature-description">Explore post-pandemic travel behavior changes</div>
                </div>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={`message ${message.type}`}>
              <div className="message-content">
                {message.content}
              </div>
              <div className="message-timestamp">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              {message.suggestions && message.suggestions.length > 0 && (
                <div className="suggestions-container">
                  {message.suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => setInputMessage(suggestion)}
                      className="suggestion-chip"
                      style={{borderColor: '#ff6b35', color: '#ff6b35'}}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="loading-indicator">
              <div className="loading-dots">
                <div className="loading-dot" style={{backgroundColor: '#ff6b35'}}></div>
                <div className="loading-dot" style={{backgroundColor: '#ff6b35'}}></div>
                <div className="loading-dot" style={{backgroundColor: '#ff6b35'}}></div>
              </div>
              <div className="loading-text">Analyzing travel data...</div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="input-container">
          <div className="input-area">
            <div className="input-wrapper">
              <textarea
                value={inputMessage}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask about travel trends, tourist behavior, destination insights, or travel market segments..."
                className="input-field"
                rows={1}
              />
              <div className="input-actions">
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || isLoading}
                  className="send-button"
                  style={{backgroundColor: '#ff6b35', borderColor: '#ff6b35'}}
                >
                  <Send size={16} />
                  Send
                </button>
              </div>
            </div>
            
            <div className="input-robot-section">
              <img 
                src="/images/3D_AI_front_view.png" 
                alt="GWI Travel Bot" 
                className="input-robot-image"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
