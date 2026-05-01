
import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, ArrowLeft, User, Clock, CheckCheck, 
  Search, MessageSquare, ShieldCheck, UserCircle
} from 'lucide-react';
import { 
  collection, query, where, onSnapshot, 
  addDoc, serverTimestamp, updateDoc, doc, getDocs, limit, QuerySnapshot 
} from "firebase/firestore";
import { db, auth } from './firebaseConfig';
import { ChatMessage, User as AppUser, Student } from './types';

export const Messaging = ({ 
  currentUser, 
  targetStudentId, 
  students, 
  onClose 
}: { 
  currentUser: AppUser; 
  targetStudentId?: string | null; 
  students: Student[]; 
  onClose: () => void 
}) => {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(targetStudentId || null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Correction: isStaff doit inclure l'ADMIN
  const isStaff = currentUser.role !== 'ELEVE';

  const [conversations, setConversations] = useState<{ student: Student; lastMessage?: ChatMessage; unreadCount: number }[]>([]);

  useEffect(() => {
    if (!activeConversationId || !auth.currentUser) return;

    const q = query(
      collection(db, "messages"),
      where("conversationId", "==", isStaff ? activeConversationId : currentUser.id)
    );

    const unsubscribe = onSnapshot(q, (snap: QuerySnapshot) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage));
      msgs.sort((a, b) => (a.timestamp?.toMillis() || 0) - (b.timestamp?.toMillis() || 0));
      setMessages(msgs);
      
      snap.docs.forEach(d => {
        const data = d.data();
        if (data.receiverId === currentUser.id && !data.read) {
          updateDoc(doc(db, "messages", d.id), { read: true });
        }
      });
    });

    return () => unsubscribe();
  }, [activeConversationId, currentUser.id, isStaff]);

  useEffect(() => {
    if (!isStaff || !auth.currentUser) {
      if (!isStaff) setActiveConversationId(currentUser.id);
      return;
    }

    const q = query(collection(db, "messages"));
    const unsubscribe = onSnapshot(q, (snap: QuerySnapshot) => {
      const allMsgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage));
      allMsgs.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));

      const convMap = new Map();
      students.forEach(s => {
        const studentMsgs = allMsgs.filter(m => m.conversationId === s.id);
        const lastMsg = studentMsgs[0];
        const unread = studentMsgs.filter(m => m.receiverId === currentUser.id && !m.read).length;
        
        if (studentMsgs.length > 0 || s.id === targetStudentId) {
          convMap.set(s.id, { student: s, lastMessage: lastMsg, unreadCount: unread });
        }
      });
      
      setConversations(Array.from(convMap.values()).sort((a, b) => (b.lastMessage?.timestamp?.toMillis() || 0) - (a.lastMessage?.timestamp?.toMillis() || 0)));
    });

    return () => unsubscribe();
  }, [isStaff, students, currentUser.id, targetStudentId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversationId) return;

    const msgData = {
      conversationId: isStaff ? activeConversationId : currentUser.id,
      senderId: currentUser.id,
      receiverId: isStaff ? activeConversationId : 'SURVEILLANT_OFFICE', 
      text: newMessage.trim(),
      timestamp: serverTimestamp(),
      read: false,
      senderName: currentUser.name
    };

    setNewMessage('');
    await addDoc(collection(db, "messages"), msgData);
  };

  const activeStudent = students.find(s => s.id === activeConversationId);

  return (
    <div className="fixed inset-0 z-[700] bg-slate-950 flex flex-col animate-in fade-in duration-300">
      <div className="px-6 py-5 flex items-center gap-4 border-b border-white/5 bg-slate-900/50 backdrop-blur-xl">
        <button onClick={onClose} className="p-3 glass rounded-2xl text-slate-400 active:scale-90 transition-transform"><ArrowLeft size={20} /></button>
        <div className="flex-1">
          <h3 className="text-sm font-black text-white uppercase tracking-tight">
            {isStaff ? (activeConversationId ? `Chat avec ${activeStudent?.firstName || 'Élève'}` : 'Messagerie Campus') : 'Contact Vie Scolaire'}
          </h3>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {isStaff && (!activeConversationId || window.innerWidth > 768) && (
          <div className={`w-full md:w-80 border-r border-white/5 flex flex-col bg-slate-900/20 ${activeConversationId ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4">
               <input type="text" placeholder="Chercher..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-slate-800/50 rounded-xl py-3 px-4 text-[10px] font-bold text-white outline-none border border-transparent focus:border-indigo-500" />
            </div>
            <div className="flex-1 overflow-y-auto px-2 space-y-1">
               {conversations.filter(c => `${c.student.firstName} ${c.student.name}`.toLowerCase().includes(searchQuery.toLowerCase())).map((conv) => (
                 <button key={conv.student.id} onClick={() => setActiveConversationId(conv.student.id)} className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all ${activeConversationId === conv.student.id ? 'bg-indigo-600 shadow-lg' : 'hover:bg-white/5'}`}>
                   <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center font-black text-white shrink-0">{(conv.student.firstName || '?')[0].toUpperCase()}</div>
                   <div className="flex-1 text-left truncate">
                     <p className="text-[10px] font-black text-white uppercase truncate">{conv.student.firstName} {conv.student.name}</p>
                     <p className={`text-[9px] truncate ${activeConversationId === conv.student.id ? 'text-indigo-100' : 'text-slate-500'}`}>{conv.lastMessage?.text || 'Démarrer...'}</p>
                   </div>
                   {conv.unreadCount > 0 && <div className="h-5 w-5 bg-rose-500 rounded-full flex items-center justify-center text-[8px] font-black text-white">{conv.unreadCount}</div>}
                 </button>
               ))}
            </div>
          </div>
        )}
        <div className={`flex-1 flex flex-col bg-slate-950 ${isStaff && !activeConversationId ? 'hidden md:flex items-center justify-center opacity-20' : 'flex'}`}>
          {!activeConversationId ? (
            <div className="text-center space-y-4">
               <MessageSquare size={64} className="mx-auto" />
               <p className="text-[10px] font-black uppercase tracking-widest">Sélectionnez une discussion</p>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((msg, idx) => {
                  const isMe = msg.senderId === currentUser.id;
                  return (
                    <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                      <div className={`max-w-[80%] space-y-1`}>
                        <div className={`px-5 py-3.5 rounded-[1.8rem] text-sm font-medium shadow-xl ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none'}`}>{msg.text}</div>
                        <p className="text-[8px] font-black text-slate-600 uppercase px-2">{msg.timestamp?.toMillis() ? new Date(msg.timestamp.toMillis()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '...'}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={scrollRef} />
              </div>
              <form onSubmit={handleSendMessage} className="p-6 bg-slate-900/30 border-t border-white/5">
                <div className="flex gap-3 bg-slate-800/50 p-2 rounded-[2rem] border border-white/5 focus-within:border-indigo-500/50 transition-all">
                  <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Tapez votre message..." className="flex-1 bg-transparent px-6 text-sm font-medium text-white outline-none" />
                  <button type="submit" disabled={!newMessage.trim()} className="h-14 w-14 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 disabled:opacity-50"><Send size={20} /></button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
