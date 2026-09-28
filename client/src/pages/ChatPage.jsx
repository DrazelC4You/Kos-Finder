import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  MessageSquare, Send, ArrowLeft, Building,
  Check, CheckCheck, Search, Shield, Phone, Loader2, Sparkles
} from 'lucide-react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatRupiah } from '../components/KosCard.jsx';

export default function ChatPage() {
  const { user, isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeConvIdFromQuery = searchParams.get('id');

  // State
  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [activeConversation, setActiveConversation] = useState(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. Fetch all conversations for current user
  const fetchConversations = async (keepActive = true) => {
    try {
      const res = await api.get('/chat/conversations');
      if (res.data.success) {
        const list = res.data.data || [];
        setConversations(list);

        // Jika ada id di URL query, pilih itu
        if (activeConvIdFromQuery && !activeConversation) {
          loadConversationDetails(activeConvIdFromQuery);
        } else if (!keepActive && list.length > 0 && !activeConversation) {
          loadConversationDetails(list[0].id);
        }
      }
    } catch (err) {
      console.error('Fetch conversations error:', err);
    } finally {
      setLoadingConversations(false);
    }
  };

  // 2. Fetch messages in active conversation
  const loadConversationDetails = async (convId) => {
    try {
      setLoadingMessages(true);
      const res = await api.get(`/chat/conversations/${convId}`);
      if (res.data.success) {
        setActiveConversation(res.data.data);
        setSearchParams({ id: convId });
        setTimeout(scrollToBottom, 100);
      }
    } catch (err) {
      console.error('Load conversation error:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  // 3. Send a new message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeConversation || sending) return;

    const textToSend = messageInput.trim();
    setMessageInput('');

    try {
      setSending(true);
      const res = await api.post(`/chat/conversations/${activeConversation.id}/messages`, {
        message: textToSend
      });

      if (res.data.success) {
        // Optimistic / direct append
        setActiveConversation(prev => ({
          ...prev,
          messages: [...(prev?.messages || []), res.data.data]
        }));
        setTimeout(scrollToBottom, 50);
        // Refresh conversation list to update lastMessage
        fetchConversations(true);
      }
    } catch (err) {
      console.error('Send message error:', err);
      // restore input on error
      setMessageInput(textToSend);
    } finally {
      setSending(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations(false);
    }
  }, [isAuthenticated]);

  // Polling update every 5 seconds to simulate live chat without socket disconnection issues
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      if (activeConversation?.id) {
        api.get(`/chat/conversations/${activeConversation.id}`)
          .then(res => {
            if (res.data.success) {
              setActiveConversation(res.data.data);
            }
          })
          .catch(() => {});
      }
      fetchConversations(true);
    }, 4500);

    return () => clearInterval(interval);
  }, [isAuthenticated, activeConversation?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages]);

  const filteredConversations = conversations.filter(c => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    const partnerName = c.partner?.name?.toLowerCase() || '';
    const kosName = c.kos?.nama?.toLowerCase() || '';
    return partnerName.includes(q) || kosName.includes(q);
  });

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-heading font-bold text-slate-900 mb-2">Silakan Masuk Terlebih Dahulu</h2>
        <p className="text-xs text-slate-500 mb-6">
          Fitur obrolan langsung membutuhkan akun penyewa atau pemilik yang terdaftar.
        </p>
        <Link
          to="/login?redirect=/chat"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
        >
          Masuk ke Akun Anda
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Container Box */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row h-[calc(100vh-140px)] min-h-[560px]">
        
        {/* SIDEBAR: CONVERSATION LIST */}
        <div className={`w-full md:w-80 lg:w-96 border-r border-slate-200 flex flex-col ${
          activeConversation ? 'hidden md:flex' : 'flex'
        }`}>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-slate-900 text-base leading-tight">Pesan & Obrolan</h2>
                <p className="text-[11px] text-slate-400">Komunikasi langsung real-time</p>
              </div>
            </div>
            <span className="text-[11px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">
              {conversations.length} Chat
            </span>
          </div>

          {/* Search bar */}
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari lawan bicara atau nama kos..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Conversation List Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loadingConversations ? (
              <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center">
                <Loader2 className="w-6 h-6 animate-spin mb-2 text-emerald-600" />
                <span>Memuat daftar obrolan...</span>
              </div>
            ) : filteredConversations.length > 0 ? (
              filteredConversations.map((c) => {
                const isSelected = activeConversation?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => loadConversationDetails(c.id)}
                    className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                      isSelected ? 'bg-emerald-50/70 border-l-4 border-emerald-600' : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <img
                        src={c.partner?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.partner?.id || 'User'}`}
                        alt={c.partner?.name || 'User'}
                        className="w-11 h-11 rounded-2xl object-cover border border-slate-200 bg-slate-100"
                      />
                      {c.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-heading font-bold text-xs text-slate-900 truncate">
                          {c.partner?.name || 'Pengguna'}
                        </span>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                          {c.lastMessage?.createdAt
                            ? new Date(c.lastMessage.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                            : ''}
                        </span>
                      </div>

                      {/* Tag Kos */}
                      <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold truncate mb-1">
                        <Building className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{c.kos?.nama || 'Properti Kos'}</span>
                      </div>

                      {/* Last Message Snippet */}
                      <p className={`text-xs truncate ${
                        c.unreadCount > 0 ? 'font-bold text-slate-800' : 'text-slate-500'
                      }`}>
                        {c.lastMessage?.message || 'Percakapan baru dimulai'}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                <MessageSquare className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="font-semibold text-slate-600 mb-1">Belum Ada Obrolan</p>
                <p className="text-[11px] text-slate-400">
                  Kirim pesan ke pemilik properti langsung dari halaman detail kos.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* MAIN PANEL: ACTIVE CONVERSATION */}
        <div className={`flex-1 flex flex-col bg-slate-50/50 ${
          !activeConversation ? 'hidden md:flex' : 'flex'
        }`}>
          {activeConversation ? (
            <>
              {/* Active Header */}
              <div className="p-3.5 px-4 bg-white border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveConversation(null)}
                    className="md:hidden text-slate-500 hover:text-slate-700 p-1"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <img
                    src={activeConversation.partner?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeConversation.partner?.id}`}
                    alt={activeConversation.partner?.name}
                    className="w-10 h-10 rounded-2xl object-cover border border-slate-200 bg-slate-100"
                  />

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading font-bold text-sm text-slate-900">
                        {activeConversation.partner?.name}
                      </h3>
                      <span className="text-[10px] px-2 py-0.2 rounded-full font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                        {activeConversation.partner?.role === 'OWNER' ? 'Pemilik Kos' : 'Calon Penyewa'}
                      </span>
                    </div>

                    {activeConversation.kos && (
                      <Link
                        to={`/kos/${activeConversation.kos.id}`}
                        className="text-xs text-slate-500 hover:text-emerald-700 flex items-center gap-1 mt-0.5"
                      >
                        <span>Topik: <strong>{activeConversation.kos.nama}</strong></span>
                        {activeConversation.kos.hargaBulanan && (
                          <span className="text-emerald-700 font-semibold">
                            ({formatRupiah(activeConversation.kos.hargaBulanan)}/bln)
                          </span>
                        )}
                      </Link>
                    )}
                  </div>
                </div>

                {/* Direct Action */}
                {activeConversation.partner?.phone && (
                  <a
                    href={`https://wa.me/${activeConversation.partner.phone.replace(/^0/, '62').replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-200 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp</span>
                  </a>
                )}
              </div>

              {/* Chat Thread Messages */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {/* Notice Banner */}
                <div className="max-w-md mx-auto bg-slate-100/80 border border-slate-200/80 rounded-2xl p-3 text-center text-[11px] text-slate-500">
                  <Shield className="w-4 h-4 text-emerald-600 inline-block mr-1.5 -mt-0.5" />
                  Gunakan obrolan ini untuk konfirmasi ketersediaan kamar, jadwal survei lokasi, dan tanya jawab aturan kos.
                </div>

                {loadingMessages ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                    <span>Memuat pesan...</span>
                  </div>
                ) : activeConversation.messages?.length > 0 ? (
                  activeConversation.messages.map((m) => {
                    const isMe = m.senderId === user?.id;
                    return (
                      <div
                        key={m.id}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm text-xs leading-relaxed ${
                            isMe
                              ? 'bg-emerald-600 text-white rounded-br-none'
                              : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{m.message}</p>
                          <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                            isMe ? 'text-emerald-100' : 'text-slate-400'
                          }`}>
                            <span>
                              {new Date(m.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isMe && (
                              m.isRead ? <CheckCheck className="w-3.5 h-3.5 text-emerald-200" /> : <Check className="w-3.5 h-3.5 text-emerald-300" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    <Sparkles className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600 mb-1">Mulai Obrolan Baru</p>
                    <p className="text-[11px]">Tanyakan ketersediaan kamar atau jadwalkan survei langsung ke pemilik.</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <form onSubmit={handleSendMessage} className="p-3.5 bg-white border-t border-slate-200 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Ketik pesan Anda di sini..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="flex-1 text-xs px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-emerald-600"
                />
                <button
                  type="submit"
                  disabled={sending || !messageInput.trim()}
                  className="p-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl shadow-sm transition-all flex items-center justify-center"
                  title="Kirim Pesan"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="font-heading font-bold text-slate-700 text-sm mb-1">Pilih Obrolan untuk Memulai</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Pilih salah satu percakapan di kolom kiri untuk melihat pesan atau menjawab pertanyaan penyewa.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
