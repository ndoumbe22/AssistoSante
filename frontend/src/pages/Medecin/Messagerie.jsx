import React, { useState, useEffect, useRef } from "react";
import { messageAPI, userAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { toast } from 'react-toastify';
import {
  Search,
  Send,
  User,
  Clock,
  CheckCheck,
  MessageCircle,
  Plus,
  Users
} from 'lucide-react';

const Messagerie = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [patients, setPatients] = useState([]);

  const messagesEndRef = useRef(null);
  const pollingIntervalRef = useRef(null);

  useEffect(() => {
    loadConversations();
    loadUnreadCount();
    loadPatients(); // Charger la liste des patients pour nouvelle conversation
    startPolling();

    return () => stopPolling();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await messageAPI.getConversations();
      setConversations(response.data);
    } catch (error) {
      console.error("Erreur chargement conversations:", error);
      toast.error("Impossible de charger les conversations");
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      const response = await messageAPI.getMessages(conversationId);
      setMessages(response.data);
      loadConversations();
      loadUnreadCount();
    } catch (error) {
      console.error("Erreur chargement messages:", error);
      toast.error("Impossible de charger les messages");
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await messageAPI.getUnreadCount();
      setUnreadCount(response.data.unread_count);
    } catch (error) {
      console.error("Erreur comptage messages non lus:", error);
    }
  };

  const loadPatients = async () => {
    try {
      // Adapter selon votre API - récupérer la liste des patients
      const response = await userAPI.getPatients();
      setPatients(response.data);
    } catch (error) {
      console.error("Erreur chargement patients:", error);
    }
  };

  const handleCreateConversation = async (patientId) => {
    try {
      const response = await messageAPI.createConversation(patientId);

      if (response.data.conversation) {
        toast.success(response.data.message);
        setShowNewConversation(false);
        loadConversations();
        setSelectedConversation(response.data.conversation);
      }
    } catch (error) {
      console.error("Erreur création conversation:", error);
      const errorMsg = error.response?.data?.error || "Erreur lors de la création";
      toast.error(errorMsg);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() || !selectedConversation) return;

    try {
      setSending(true);

      const response = await messageAPI.sendMessage(
        selectedConversation.id,
        newMessage.trim()
      );

      setMessages(prev => [...prev, response.data.data]);
      setNewMessage('');
      loadConversations();

    } catch (error) {
      console.error("Erreur envoi message:", error);
      const errorMsg = error.response?.data?.error || "Erreur lors de l'envoi";
      toast.error(errorMsg);
    } finally {
      setSending(false);
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    setMessages([]);
    setShowNewConversation(false);
  };

  const startPolling = () => {
    pollingIntervalRef.current = setInterval(() => {
      if (selectedConversation) {
        loadMessages(selectedConversation.id);
      }
      loadUnreadCount();
    }, 5000);
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const participantName = conv.participant_info
      ? `${conv.participant_info.first_name} ${conv.participant_info.last_name}`.toLowerCase()
      : '';
    return participantName.includes(searchQuery.toLowerCase());
  });

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Hier';
    } else {
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    }
  };

  return (
    <div className="messagerie-container" style={{ height: 'calc(100vh - 100px)', display: 'flex' }}>

      {/* SIDEBAR - Liste des conversations */}
      <div className="conversations-sidebar" style={{
        width: '350px',
        borderRight: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column'
      }}>

        {/* Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '600', margin: 0 }}>
              Messages
              {unreadCount > 0 && (
                <span style={{
                  marginLeft: '10px',
                  background: '#ef4444',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '14px'
                }}>
                  {unreadCount}
                </span>
              )}
            </h2>

            {/* Bouton nouvelle conversation */}
            <button
              onClick={() => setShowNewConversation(!showNewConversation)}
              style={{
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
            >
              <Plus size={24} />
            </button>
          </div>

          {/* Barre de recherche */}
          <div style={{ position: 'relative' }}>
            <Search
              size={20}
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}
            />
            <input
              type="text"
              placeholder="Rechercher une conversation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 10px 10px 40px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>
        </div>

        {/* Liste des conversations */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              Chargement...
            </div>
          ) : filteredConversations.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>
              <MessageCircle size={48} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
              <p>Aucune conversation</p>
            </div>
          ) : (
            filteredConversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => handleSelectConversation(conv)}
                style={{
                  padding: '15px',
                  borderBottom: '1px solid #f3f4f6',
                  cursor: 'pointer',
                  backgroundColor: selectedConversation?.id === conv.id ? '#f0f9ff' : 'white',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                onMouseLeave={(e) => {
                  if (selectedConversation?.id !== conv.id) {
                    e.currentTarget.style.backgroundColor = 'white';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {/* Avatar */}
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: '#3b82f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '600',
                    flexShrink: 0
                  }}>
                    {conv.participant_info?.first_name?.[0] || 'U'}
                  </div>

                  {/* Infos */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {conv.participant_info?.first_name} {conv.participant_info?.last_name}
                      </h3>
                      <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                        {formatTime(conv.last_message_time)}
                      </span>
                    </div>

                    <p style={{
                      margin: '4px 0 0',
                      fontSize: '14px',
                      color: '#6b7280',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {conv.last_message?.content || 'Aucun message'}
                    </p>
                  </div>

                  {/* Badge non lu */}
                  {conv.unread_count > 0 && (
                    <div style={{
                      background: '#ef4444',
                      color: 'white',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {conv.unread_count}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ZONE DE MESSAGES */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

        {selectedConversation ? (
          <>
            {/* Header conversation */}
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: '600'
              }}>
                {selectedConversation.participant_info?.first_name?.[0] || 'U'}
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>
                  {selectedConversation.participant_info?.first_name} {selectedConversation.participant_info?.last_name}
                  {selectedConversation.is_urgent && (
                    <span className="badge bg-warning ms-2">Urgent</span>
                  )}
                </h3>
                <p style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>
                  {selectedConversation.participant_info?.role}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px',
              backgroundColor: '#f9fafb'
            }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#9ca3af', marginTop: '50px' }}>
                  <MessageCircle size={64} style={{ margin: '0 auto 10px', opacity: 0.2 }} />
                  <p>Aucun message dans cette conversation</p>
                  <p style={{ fontSize: '14px' }}>Envoyez le premier message !</p>
                </div>
              ) : (
                messages.map(msg => (
                  <div
                    key={msg.id}
                    style={{
                      marginBottom: '16px',
                      display: 'flex',
                      justifyContent: msg.is_mine ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <div style={{
                      maxWidth: '70%',
                      background: msg.is_mine ? '#3b82f6' : 'white',
                      color: msg.is_mine ? 'white' : '#1f2937',
                      padding: '12px 16px',
                      borderRadius: '16px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }}>
                      <p style={{ margin: 0, fontSize: '15px', lineHeight: '1.5' }}>
                        {msg.content}
                      </p>
                      <div style={{
                        marginTop: '6px',
                        fontSize: '12px',
                        opacity: 0.7,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: '4px'
                      }}>
                        <Clock size={12} />
                        {formatTime(msg.created_at)}
                        {msg.is_mine && msg.is_read && <CheckCheck size={14} />}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Formulaire d'envoi */}
            <form
              onSubmit={handleSendMessage}
              style={{
                padding: '20px',
                borderTop: '1px solid #e5e7eb',
                backgroundColor: 'white'
              }}
            >
              <div style={{ display: 'flex', gap: '12px' }}>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Écrivez votre message..."
                  disabled={sending}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '24px',
                    fontSize: '15px',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  style={{
                    padding: '12px 24px',
                    background: !newMessage.trim() || sending ? '#e5e7eb' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '24px',
                    cursor: !newMessage.trim() || sending ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: '600',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (newMessage.trim() && !sending) {
                      e.currentTarget.style.background = '#2563eb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (newMessage.trim() && !sending) {
                      e.currentTarget.style.background = '#3b82f6';
                    }
                  }}
                >
                  <Send size={18} />
                  {sending ? 'Envoi...' : 'Envoyer'}
                </button>
              </div>
            </form>
          </>
        ) : (
          // État vide : aucune conversation sélectionnée
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            color: '#9ca3af'
          }}>
            <MessageCircle size={80} style={{ opacity: 0.2, marginBottom: '20px' }} />
            <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Messagerie Médecin</h3>
            <p style={{ fontSize: '14px' }}>Sélectionnez une conversation pour commencer</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messagerie;