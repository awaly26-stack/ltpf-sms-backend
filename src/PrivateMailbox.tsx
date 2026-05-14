
import React, { useState, useEffect } from 'react';
import { Mail, Send, Inbox, ChevronRight, ArrowLeft, Trash2, X, Clock, Paperclip, Image as ImageIcon, FileText, Download, CornerUpLeft } from 'lucide-react';
import { db } from './firebaseConfig';
import { PrivateMail, User, Teacher, MediaType } from './types';
import { useAuth } from './AuthContext';
import { toPlainObject } from './utils';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc, orderBy } from 'firebase/firestore';

interface PrivateMailboxProps {
  targetUser: User | Teacher;
  onClose: () => void;
}

export const PrivateMailbox: React.FC<PrivateMailboxProps> = ({ targetUser, onClose }) => {
  const { currentUser } = useAuth();
  const [mails, setMails] = useState<PrivateMail[]>([]);
  const [view, setView] = useState<'INBOX' | 'COMPOSE'>('INBOX');
  const [selectedMail, setSelectedMail] = useState<PrivateMail | null>(null);
  
  // Compose state
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [attachments, setAttachments] = useState<{name: string; url: string; type: MediaType}[]>([]);
  const [composeRecipient, setComposeRecipient] = useState<User | Teacher>(targetUser);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const isMe = currentUser?.id === targetUser.id;
  const canSendMail = ['ADMIN', 'PROVISEUR', 'DE', 'CT', 'SG', 'SURVEILLANT', 'PROFESSEUR'].includes(currentUser?.role || '');

  // Effect to reset compose recipient when targetUser changes or view changes
  useEffect(() => {
    if (view === 'COMPOSE' && !selectedMail) {
      setComposeRecipient(targetUser);
    }
  }, [view, targetUser, selectedMail]);

  // Effect to force view if not me
  useEffect(() => {
    if (!isMe) {
      setView('COMPOSE');
    } else {
      setView('INBOX');
    }
  }, [isMe]);

  useEffect(() => {
    if (!targetUser.id || !isMe) return;
    
    const q = query(
      collection(db, 'private_mail'), 
      where('recipientId', '==', targetUser.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PrivateMail));
      // Trier en mémoire pour éviter de demander un index composite
      docs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setMails(docs);
    }, (err) => {
      console.error("Mail subscription error:", err);
    });

    return () => unsubscribe();
  }, [targetUser.id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800000) {
        alert("Le fichier est trop volumineux (max 800 Ko)");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        let type: MediaType = 'AUTRE';
        if (file.type.startsWith('image/')) type = 'IMAGE';
        else if (file.type === 'application/pdf') type = 'PDF';
        else if (file.type.includes('word')) type = 'DOC';
        else if (file.type.includes('excel')) type = 'XLS';

        setAttachments(prev => [...prev, { name: file.name, url, type }]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if (!subject || !content || !currentUser) return;
    setSending(true);
    try {
      const newMail: Omit<PrivateMail, 'id'> = {
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderRole: currentUser.role,
        recipientId: composeRecipient.id,
        subject,
        content,
        date: new Date().toISOString(),
        read: false,
        attachments: attachments.length > 0 ? attachments : undefined
      };
      await addDoc(collection(db, 'private_mail'), toPlainObject(newMail));
      setView('INBOX');
      setSubject('');
      setContent('');
      setAttachments([]);
      setSelectedMail(null);
      alert("Courrier envoyé avec succès");
    } catch (e) {
      console.error(e);
      alert("Erreur lors de l'envoi");
    } finally {
      setSending(false);
    }
  };

  const handleReply = (mail: PrivateMail) => {
    setComposeRecipient({
      id: mail.senderId,
      name: mail.senderName,
      role: mail.senderRole
    } as User);
    setSubject(`Re: ${mail.subject}`);
    setContent(`\n\n--- En réponse à ---\n${mail.content}`);
    setView('COMPOSE');
  };

  const markAsRead = async (mail: PrivateMail) => {
    if (!mail.read && isMe) {
      try {
        await updateDoc(doc(db, 'private_mail', mail.id), { read: true });
      } catch (e) { console.error(e); }
    }
    setSelectedMail(mail);
  };

  const deleteMail = async (id: string) => {
    if (window.confirm("Supprimer ce courrier ?")) {
      try {
        await deleteDoc(doc(db, 'private_mail', id));
        setSelectedMail(null);
      } catch (e) { console.error(e); }
    }
  };

  return (
    <div className="fixed inset-0 z-[700] bg-white dark:bg-slate-950 flex flex-col animate-in slide-in-from-bottom duration-300">
      <div className="px-6 py-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-10 font-display">
        <button onClick={onClose} className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-2xl active:scale-90"><ArrowLeft size={20} /></button>
        <div className="text-center">
          <h3 className="text-[10px] font-black uppercase text-indigo-500 tracking-widest">Courrier Confidentiel</h3>
          <p className="font-bold text-slate-800 dark:text-white uppercase text-[10px] truncate max-w-[150px]">{targetUser.name || (targetUser as any).firstName + " " + (targetUser as any).name}</p>
        </div>
        <div className="w-12" />
      </div>

      <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
        {view === 'COMPOSE' ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-top duration-300">
            <div className="flex items-center justify-between px-2">
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 italic">Destinataire: {composeRecipient.name}</h4>
              {isMe && view === 'COMPOSE' && (
                <button onClick={() => { setView('INBOX'); setAttachments([]); setSubject(''); setContent(''); }} className="text-[10px] font-black text-rose-500 uppercase">Annuler</button>
              )}
            </div>
            <div className="space-y-4 bg-slate-50 dark:bg-slate-900 p-6 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/20 shadow-inner">
               <div className="space-y-1">
                 <label className="text-[10px] font-black text-indigo-500 uppercase ml-2">Objet du courrier</label>
                 <input 
                   type="text" 
                   value={subject}
                   onChange={e => setSubject(e.target.value)}
                   placeholder="Ex: Convocation, Information administrative..."
                   className="w-full bg-white dark:bg-slate-800 p-5 rounded-2xl text-xs font-bold dark:text-white outline-none border border-transparent focus:border-indigo-500 transition-all"
                 />
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-black text-indigo-500 uppercase ml-2">Message</label>
                 <textarea 
                   rows={8}
                   value={content}
                   onChange={e => setContent(e.target.value)}
                   placeholder="Écrivez votre message confidentiel ici..."
                   className="w-full bg-white dark:bg-slate-800 p-5 rounded-2xl text-xs font-medium dark:text-white outline-none border border-transparent focus:border-indigo-500 transition-all resize-none"
                 />
               </div>

               {/* Attachments Section */}
               <div className="space-y-3">
                 <div className="flex items-center justify-between px-2">
                   <label className="text-[10px] font-black text-indigo-500 uppercase">Pièces jointes</label>
                   <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-xl hover:scale-105 active:scale-95 transition-all"
                   >
                     <Paperclip size={16} />
                   </button>
                   <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx" 
                   />
                 </div>
                 
                 {attachments.length > 0 && (
                   <div className="flex flex-wrap gap-2">
                     {attachments.map((file, idx) => (
                       <div key={idx} className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border border-indigo-100 dark:border-indigo-900/20 shadow-sm animate-in zoom-in duration-200">
                         {file.type === 'IMAGE' ? <ImageIcon size={12} className="text-emerald-500" /> : <FileText size={12} className="text-rose-500" />}
                         <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300 truncate max-w-[80px]">{file.name}</span>
                         <button onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))} className="text-rose-500 p-1"><X size={12} /></button>
                       </div>
                     ))}
                   </div>
                 )}
               </div>

               <button 
                onClick={handleSend}
                disabled={sending || !subject || !content}
                className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-3 shadow-xl shadow-indigo-500/30 active:scale-95 transition-all disabled:opacity-50"
               >
                 {sending ? "Envoi en cours..." : <><Send size={18} /> Envoyer le courrier</>}
               </button>
            </div>
          </div>
        ) : selectedMail ? (
          <div className="space-y-6 animate-in fade-in duration-300">
             <div className="flex items-center justify-between">
               <button onClick={() => setSelectedMail(null)} className="flex items-center gap-2 text-indigo-500 font-black text-[10px] uppercase tracking-widest bg-indigo-500/5 px-6 py-3 rounded-2xl">
                 <ArrowLeft size={14} /> Retour
               </button>
               {isMe && (
                 <button 
                  onClick={() => handleReply(selectedMail)}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                 >
                   <CornerUpLeft size={14} /> Répondre
                 </button>
               )}
             </div>
             
             <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-xl space-y-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Clock size={12}/> {new Date(selectedMail.date).toLocaleString('fr-FR')}</p>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight font-display">{selectedMail.subject}</h2>
                  </div>
                  {(isMe || ['ADMIN','PROVISEUR','SG'].includes(currentUser?.role || '')) && (
                    <button onClick={() => deleteMail(selectedMail.id)} className="p-3 text-rose-500 hover:bg-rose-50 rounded-2xl transition-colors"><Trash2 size={20} /></button>
                  )}
                </div>

                <div className="flex items-center gap-4 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-700">
                  <div className="h-12 w-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-lg shadow-indigo-500/20">{selectedMail.senderName[0]}</div>
                  <div>
                    <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">{selectedMail.senderName}</p>
                    <p className="text-[8px] font-black text-indigo-500 uppercase tracking-[0.2em] mt-1">{selectedMail.senderRole}</p>
                  </div>
                </div>

                <div className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap border-t border-slate-50 dark:border-slate-800 pt-8 font-medium">
                  {selectedMail.content}
                </div>

                {selectedMail.attachments && selectedMail.attachments.length > 0 && (
                  <div className="pt-6 border-t border-slate-50 dark:border-slate-800">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Pièces jointes ({selectedMail.attachments.length})</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedMail.attachments.map((file, idx) => (
                        <div key={idx} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl flex items-center justify-between group">
                          <div className="flex items-center gap-3 truncate">
                            <div className="h-10 w-10 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm">
                              {file.type === 'IMAGE' ? <ImageIcon size={18} className="text-emerald-500" /> : <FileText size={18} className="text-rose-500" />}
                            </div>
                            <div className="truncate">
                              <p className="text-[10px] font-bold text-slate-900 dark:text-white truncate">{file.name}</p>
                              <p className="text-[8px] font-black text-slate-400 uppercase">{file.type}</p>
                            </div>
                          </div>
                          <a 
                            href={file.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="p-2 bg-white dark:bg-slate-700 text-indigo-600 rounded-xl shadow-sm hover:scale-110 transition-transform"
                          >
                            <Download size={14} />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
             </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><Inbox size={14} /> Courriers Reçus ({mails.length})</h4>
              {isMe && mails.some(m => !m.read) && <span className="bg-rose-500 text-white text-[8px] font-black px-2 py-1 rounded-full animate-pulse">NOUVEAU</span>}
            </div>

            {mails.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {mails.map(mail => (
                  <button 
                    key={mail.id}
                    onClick={() => markAsRead(mail)}
                    className={`p-6 rounded-[2rem] flex items-center justify-between group transition-all text-left ${mail.read ? 'bg-slate-50 dark:bg-slate-900/50 text-slate-400' : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xl ring-1 ring-indigo-500/20'}`}
                  >
                    <div className="flex items-center gap-5 flex-1 truncate">
                      <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${mail.read ? 'bg-slate-200 dark:bg-slate-800' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'}`}>
                        <Mail size={22} className={!mail.read ? 'animate-pulse' : ''} />
                      </div>
                      <div className="truncate space-y-1">
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{new Date(mail.date).toLocaleDateString()}</p>
                        <p className="text-[11px] font-black uppercase truncate tracking-tight group-hover:text-indigo-500 transition-colors">{mail.subject}</p>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">De: <span className="text-indigo-500 font-black">{mail.senderName}</span></p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 px-8 text-center opacity-40">
                <div className="h-24 w-24 bg-slate-100 dark:bg-slate-800/50 rounded-[3rem] flex items-center justify-center mb-6 text-slate-400 shadow-inner">
                  <Inbox size={48} />
                </div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Boîte de courrier vide</p>
                <p className="text-[10px] font-medium text-slate-400 mt-3 max-w-[200px] leading-relaxed">Les messages confidentiels de l'administration apparaîtront ici.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
