import React, { useState, useEffect, useRef } from "react";
import { FaComments, FaTimes, FaPaperPlane, FaRobot, FaHistory, FaCog, FaQuestionCircle } from "react-icons/fa";
import chatbotService from "../services/chatbotService";
import { useAuth } from "../context/AuthContext";

function EnhancedChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Bonjour ! Je suis votre assistant médical virtuel. Comment puis-je vous aider aujourd'hui ?",
      sender: "bot",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [knowledgeBase, setKnowledgeBase] = useState([]);
  const [newResponse, setNewResponse] = useState({ keyword: "", response: "" });
  const messagesEndRef = useRef(null);
  const { user } = useAuth();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversation history for authenticated users
  useEffect(() => {
    if (user && isOpen) {
      loadHistory();
    }
  }, [user, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen && user) {
      loadHistory();
    }
  };

  const loadHistory = async () => {
    if (!user) return;
    
    try {
      const historyData = await chatbotService.getHistory();
      setHistory(historyData);
    } catch (error) {
      console.error("Erreur lors du chargement de l'historique:", error);
    }
  };

  const sendMessage = async (messageText = inputMessage) => {
    if (!messageText.trim() || isLoading) return;

    // Add user message to chat
    const userMessage = {
      id: Date.now(),
      text: messageText,
      sender: "user",
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // Call the real chatbot API
      const response = await chatbotService.sendMessage(messageText);
      
      // Extract bot response from Rasa response
      let botResponse = "Désolé, je n'ai pas compris.";
      if (response.responses && response.responses.length > 0) {
        botResponse = response.responses[0].text || botResponse;
      }
      
      const botMessage = {
        id: Date.now() + 1,
        text: botResponse,
        sender: "bot",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
      setIsLoading(false);
      
      // Reload history to include the new conversation
      if (user) {
        loadHistory();
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi du message au chatbot :", error);
      
      // Add error message to chat
      const errorMessage = {
        id: Date.now() + 1,
        text: "Désolé, une erreur s'est produite. Veuillez réessayer.",
        sender: "bot",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Quick replies for common questions
  const quickReplies = [
    "J'ai mal à la tête",
    "J'ai de la fièvre",
    "Comment prendre rendez-vous ?",
    "Quels sont vos services ?"
  ];

  const handleQuickReply = (message) => {
    setInputMessage(message);
    sendMessage(message);
  };

  // Admin functions
  const addKnowledgeBaseEntry = () => {
    if (newResponse.keyword && newResponse.response) {
      setKnowledgeBase(prev => [...prev, newResponse]);
      setNewResponse({ keyword: "", response: "" });
      alert("Réponse ajoutée à la base de connaissances");
    }
  };

  const isAdmin = user && user.role === "admin";

  return (
    <>
      {/* Floating chat button */}
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition-all duration-300 z-50"
        style={{ width: "60px", height: "60px", bottom: "20px" }}
      >
        {isOpen ? <FaTimes size={24} /> : <FaComments size={24} />}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-full max-w-md h-[500px] bg-white rounded-lg shadow-xl z-50 flex flex-col border border-gray-200"
           style={{ bottom: "100px" }}>
          {/* Chat header */}
          <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
            <div className="flex items-center">
              <FaRobot className="mr-2" />
              <h3 className="font-semibold">Assistant Médical</h3>
            </div>
            <div className="flex space-x-2">
              {user && (
                <button 
                  onClick={() => setShowHistory(!showHistory)}
                  className="text-white hover:text-gray-200"
                  title="Historique"
                >
                  <FaHistory />
                </button>
              )}
              {isAdmin && (
                <button 
                  onClick={() => setShowAdminPanel(!showAdminPanel)}
                  className="text-white hover:text-gray-200"
                  title="Paramètres"
                >
                  <FaCog />
                </button>
              )}
              <button 
                onClick={toggleChat}
                className="text-white hover:text-gray-200"
              >
                <FaTimes />
              </button>
            </div>
          </div>

          {/* Messages container */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 relative">
            {showHistory ? (
              // History view
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-700 mb-2">Historique des conversations</h4>
                {history.length === 0 ? (
                  <p className="text-gray-500 text-center">Aucun historique disponible</p>
                ) : (
                  history.map((conv) => (
                    <div key={conv.id} className="bg-white p-3 rounded-lg shadow-sm">
                      <div className="text-sm font-medium text-blue-600">Vous: {conv.message_user}</div>
                      <div className="text-sm mt-1">Assistant: {conv.message_bot}</div>
                      <div className="text-xs text-gray-500 mt-2">
                        {new Date(conv.timestamp).toLocaleString('fr-FR')}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : showAdminPanel ? (
              // Admin panel
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-700 mb-2">Gestion de la base de connaissances</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mot-clé</label>
                    <input
                      type="text"
                      value={newResponse.keyword}
                      onChange={(e) => setNewResponse({...newResponse, keyword: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Entrez un mot-clé"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Réponse</label>
                    <textarea
                      value={newResponse.response}
                      onChange={(e) => setNewResponse({...newResponse, response: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      rows="3"
                      placeholder="Entrez la réponse associée"
                    ></textarea>
                  </div>
                  <button
                    onClick={addKnowledgeBaseEntry}
                    className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
                  >
                    Ajouter à la base de connaissances
                  </button>
                </div>
                
                <div className="mt-4">
                  <h5 className="font-medium text-gray-700 mb-2">Questions fréquentes</h5>
                  <div className="space-y-2">
                    {knowledgeBase.map((entry, index) => (
                      <div key={index} className="bg-white p-2 rounded border">
                        <div className="font-medium text-sm">{entry.keyword}</div>
                        <div className="text-xs text-gray-600">{entry.response}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              // Chat view
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex mb-4 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.sender === "bot" && (
                      <div className="flex items-start">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2 flex-shrink-0">
                          <FaRobot size={16} className="text-blue-600" />
                        </div>
                        <div className="bg-white rounded-lg rounded-tl-none p-3 max-w-xs shadow-sm">
                          <p className="text-gray-800">{message.text}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatTime(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {message.sender === "user" && (
                      <div className="flex items-start">
                        <div className="bg-blue-100 rounded-lg rounded-tr-none p-3 max-w-xs shadow-sm">
                          <p className="text-gray-800">{message.text}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatTime(message.timestamp)}
                          </p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center ml-2 flex-shrink-0">
                          <span className="text-gray-700 font-semibold">
                            {user ? user.first_name.charAt(0) : "U"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex mb-4 justify-start">
                    <div className="flex items-start">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2 flex-shrink-0">
                        <FaRobot size={16} className="text-blue-600" />
                      </div>
                      <div className="bg-white rounded-lg rounded-tl-none p-3 max-w-xs shadow-sm">
                        <div className="flex space-x-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Quick replies */}
          {!showHistory && !showAdminPanel && messages.length === 1 && (
            <div className="px-4 py-2 bg-gray-100 border-t border-gray-200">
              <p className="text-xs text-gray-500 mb-2">Suggestions rapides :</p>
              <div className="flex flex-wrap gap-2">
                {quickReplies.map((reply, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickReply(reply)}
                    className="text-xs bg-white border border-gray-300 rounded-full px-3 py-1 hover:bg-gray-100 transition-colors"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input area */}
          {!showHistory && !showAdminPanel && (
            <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
              <div className="flex">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Tapez votre message..."
                  className="flex-1 border border-gray-300 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputMessage.trim()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <FaPaperPlane />
                </button>
              </div>
            </form>
          )}

          {/* Footer for history/admin views */}
          {(showHistory || showAdminPanel) && (
            <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
              <button
                onClick={() => { setShowHistory(false); setShowAdminPanel(false); }}
                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
              >
                Retour au chat
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default EnhancedChatbot;