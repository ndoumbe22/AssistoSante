import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  FaPaperPlane,
  FaRobot,
  FaUserMd,
  FaUserTie,
  FaUserCircle,
  FaHistory,
  FaPlus,
  FaSearch,
  FaRedoAlt,
} from "react-icons/fa";
import { FiLogOut } from "react-icons/fi";
import Layout from "./Layout";

function Chatbot({ onClose }) {
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const userFirstName = storedUser?.first_name || "";
  const userLastName = storedUser?.last_name || "";
  const userRole = storedUser?.role || "visiteur";
  const userPhoto = storedUser?.photo || null;

  const fullName =
    userFirstName && userLastName
      ? `${userLastName} ${userFirstName}`
      : userFirstName || userLastName || storedUser?.username || "Utilisateur";

  const userKey = storedUser
    ? `chatbot_conversations_${storedUser.username}`
    : "chatbot_conversations_guest";

  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [config, setConfig] = useState(null);

  const messagesEndRef = useRef(null);

  // Charger la config dynamique depuis Django
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:8000/api/chatbot/config/");

        setConfig(response.data);
      } catch (error) {
        console.error("Erreur chargement configuration chatbot :", error);
      }
    };
    fetchConfig();
  }, []);

  // Charger conversations au démarrage, attendre config
  useEffect(() => {
    if (config === null) return; // attend config

    const savedConversations = JSON.parse(localStorage.getItem(userKey)) || [];
    setConversations(savedConversations);

    if (savedConversations.length > 0) {
      const lastConv = savedConversations[savedConversations.length - 1];
      setMessages(Array.isArray(lastConv.messages) ? lastConv.messages : []);
    } else {
      // Message de bienvenue personnalisé
      const welcomeText = config?.welcome_message
        ? config.welcome_message.replace("{user}", fullName)
        : `Bonjour ${fullName}! 👋 Je suis votre assistant virtuel. Comment puis-je vous aider aujourd'hui ?`;

      setMessages([
        {
          id: 1,
          text: welcomeText,
          sender: "bot",
          timestamp: new Date(),
        },
      ]);
    }
  }, [userKey, fullName, config]);

  // Scroll automatique
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // Envoi d'un message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: messages.length + 1,
      text: inputMessage,
      sender: "user",
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await axios.post("http://127.0.0.1:8000/api/chatbot/", {
        message: userMessage.text,
      });

      const botResponses = response.data.responses || [];
      const botMessages = botResponses.map((res, idx) => ({
        id: newMessages.length + 1 + idx,
        text:
          res.confidence && config && res.confidence < config.confidence_threshold
            ? config.fallback_message || "Désolé, je n’ai pas compris."
            : res.text || "Désolé, je n’ai pas compris.",
        sender: "bot",
        timestamp: new Date(),
      }));

      const updatedMessages = [...newMessages, ...botMessages];

      // Mettre à jour la dernière conversation
      let updatedConversations = [...conversations];
      if (updatedConversations.length === 0) {
        updatedConversations.push({
          id: "conv_" + Date.now(),
          titre:
            userMessage.text.slice(0, 25) +
            (userMessage.text.length > 25 ? "..." : ""),
          messages: updatedMessages,
        });
      } else {
        const lastConv = updatedConversations[updatedConversations.length - 1];
        const newLastConv = {
          ...lastConv,
          messages: updatedMessages,
          titre:
            lastConv.titre.includes("Nouvelle conversation") || !lastConv.titre
              ? updatedMessages[0]?.text.slice(0, 25) +
                (updatedMessages[0]?.text.length > 25 ? "..." : "")
              : lastConv.titre,
        };
        updatedConversations[updatedConversations.length - 1] = newLastConv;
      }

      setConversations(updatedConversations);
      localStorage.setItem(userKey, JSON.stringify(updatedConversations));
      setMessages(updatedMessages);
    } catch (error) {
      console.error("Erreur chatbot :", error);
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          text: "❌ Une erreur est survenue. Veuillez réessayer.",
          sender: "bot",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Nouvelle conversation
  const handleNewConversation = () => {
    if (!config) return; // attend config

    const newConv = {
      id: "conv_" + Date.now(),
      titre: `Nouvelle conversation`,
      messages: [
        {
          id: 1,
          text: config?.welcome_message
            ? config.welcome_message.replace("{user}", fullName)
            : `Nouvelle conversation démarrée ! Comment puis-je vous aider, ${fullName} ?`,
          sender: "bot",
          timestamp: new Date(),
        },
      ],
    };
    const updatedConversations = [...conversations, newConv];
    setConversations(updatedConversations);
    setMessages(newConv.messages);
    localStorage.setItem(userKey, JSON.stringify(updatedConversations));
  };

  const handleShowHistory = () => setShowHistory(!showHistory);

  const handleSelectConversation = (conv) => {
    setMessages(conv.messages);
    setShowHistory(false);
  };

  const handleReformulate = () => {
    const lastUserMsg = messages.filter((m) => m.sender === "user").slice(-1)[0];
    if (lastUserMsg) {
      setInputMessage(`Peux-tu reformuler : "${lastUserMsg.text}"`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/connecter";
  };

  const filteredMessages = searchTerm
    ? messages.filter((m) => m.text.toLowerCase().includes(searchTerm.toLowerCase()))
    : messages;

  const getRoleIcon = () => {
    switch (userRole.toLowerCase()) {
      case "medecin":
        return <FaUserMd size={30} style={{ color: "#687365ff", marginBottom: "-15px" }} />;
      case "patient":
        return <FaUserTie size={30} style={{ marginBottom: "-15px" }} />;
      default:
        return <FaUserCircle size={40} className="text-gray-400" />;
    }
  };

  const primaryColor = config?.primary_color || "#22c55e";

  return (
    <div className="fixed inset-0 flex z-50 bg-gray-100">
      {/* Sidebar gauche */}
      <div className="w-64 bg-gray-900 text-white flex flex-col justify-between p-4">
        <div>
          <h2 className="text-lg font-semibold mb-4 border-b border-gray-700 pb-2">
            <FaRobot className="inline-block mr-2 text-green-400" /> ChatAssitoSante
          </h2>

          <button
            onClick={handleNewConversation}
            className="w-full bg-gray-800 hover:bg-gray-700 text-left px-4 py-2 rounded-md flex items-center mb-2"
          >
            <FaPlus className="mr-2" /> Nouvelle conversation
          </button>

          <button
            onClick={handleShowHistory}
            className="w-full bg-gray-800 hover:bg-gray-700 text-left px-4 py-2 rounded-md flex items-center mb-2"
          >
            <FaHistory className="mr-2" /> Chats récents
          </button>

          {showHistory && (
            <div className="bg-gray-800 p-2 rounded-md mb-2 max-h-60 overflow-y-auto">
              {conversations.length === 0 ? (
                <p className="text-gray-400 text-sm">Aucune conversation enregistrée.</p>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className="text-sm text-gray-300 hover:text-green-400 cursor-pointer border-b border-gray-700 py-1"
                    onClick={() => handleSelectConversation(conv)}
                  >
                    {conv.titre}
                  </div>
                ))
              )}
            </div>
          )}

          <button
            onClick={handleReformulate}
            className="w-full bg-gray-800 hover:bg-gray-700 text-left px-4 py-2 rounded-md flex items-center mb-2"
          >
            <FaRedoAlt className="mr-2" /> Reformuler texte
          </button>
        </div>

        {/* Profil utilisateur */}
        <div className="border-t border-gray-700 pt-4">
          <div className="flex items-center mb-2">
            {userPhoto ? (
              <img
                src={userPhoto}
                alt="profil"
                className="w-10 h-10 rounded-full object-cover mr-2 border-2 border-green-400"
              />
            ) : (
              getRoleIcon()
            )}
            <div>
              <p className="text-sm font-semibold text-gray-300 capitalize">{userRole}</p>
              <p className="text-green-400 text-sm font-medium">{fullName}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center text-sm text-gray-400 hover:text-white transition"
          >
            <FiLogOut className="mr-2" /> Se déconnecter
          </button>
        </div>
      </div>

      {/* Zone principale */}
      <div className="flex-1 flex flex-col bg-white">
        <div className="flex justify-between items-center p-4 border-b bg-gray-50">
          <h3 className="font-semibold text-gray-800 flex items-center">
            <FaRobot className="text-green-600 mr-2" /> Assistant Virtuel
          </h3>
          <div className="relative flex items-center">
            <FaSearch className="absolute left-3 text-gray-400" />
            <input
              type="text"
              placeholder={config?.placeholder_text || "Rechercher..."}
              className="bg-white border border-gray-300 rounded-full pl-8 pr-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {filteredMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.sender === "bot" ? (
                <div className="flex items-start space-x-2">
                  <div className="bg-green-100 p-2 rounded-full">
                    <FaRobot className="text-green-600" />
                  </div>
                  <div className="bg-gray-100 rounded-lg p-3 shadow-sm max-w-md">
                    <p className="text-gray-800">{msg.text}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatTime(msg.timestamp)}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start space-x-2">
                  <div className="bg-green-600 text-white rounded-lg p-3 shadow-sm max-w-md">
                    <p>{msg.text}</p>
                    <p className="text-xs text-green-200 mt-1">{formatTime(msg.timestamp)}</p>
                  </div>
                  <div className="bg-gray-200 p-2 rounded-full">
                    <span className="text-gray-700 font-semibold">
                      {userFirstName?.charAt(0).toUpperCase() || "U"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center space-x-2">
              <div className="bg-green-100 p-2 rounded-full">
                <FaRobot className="text-green-600" />
              </div>
              <div className="bg-gray-100 rounded-lg p-3 max-w-xs shadow-sm flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="p-4 border-t bg-gray-50 flex items-center space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={config?.input_placeholder || "Écrivez un message ici..."}
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            style={{ backgroundColor: primaryColor }}
            className="text-white p-2 rounded-full hover:opacity-90 disabled:opacity-50"
          >
            <FaPaperPlane />
          </button>
        </form>
      </div>
    </div>
  );
}

export default Chatbot;
