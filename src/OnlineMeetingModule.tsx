import React, { useState, useEffect } from 'react';
import { 
  Video, Calendar, Clock, Link as LinkIcon, 
  Plus, X, Users, Globe, ExternalLink, Trash2,
  AlertCircle, CheckCircle2, Monitor
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { OnlineMeeting } from './types';
import { db } from './firebaseConfig';

interface OnlineMeetingModuleProps {
  onClose: () => void;
  userName: string;
  userRole: string;
}

export const OnlineMeetingModule: React.FC<OnlineMeetingModuleProps> = ({ 
  onClose, userName, userRole 
}) => {
  const [meetings, setMeetings] = useState<OnlineMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    duration: 60,
    participants: ['TOUS'] // Default to all staff
  });

  const isAdminLtp = userRole === 'ADMIN';

  useEffect(() => {
    const unsubscribe = db.collection('meetings')
      .orderBy('date', 'asc')
      .onSnapshot((snapshot) => {
        setMeetings(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as OnlineMeeting)));
        setLoading(false);
      });
    return () => unsubscribe();
  }, []);

  const handleCreateMeeting = async () => {
    if (!newMeeting.title) return;

    try {
      // Generate a random Jitsi room name
      const roomName = `LTP_Fatick_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      const link = `https://meet.jit.si/${roomName}`;

      await db.collection('meetings').add({
        ...newMeeting,
        roomName,
        link,
        status: 'UPCOMING',
        organizerId: 'admin_ltp', // Or real current user ID
        organizerName: userName,
        createdAt: new Date().toISOString()
      });

      setShowAddModal(false);
      setNewMeeting({
        title: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '10:00',
        duration: 60,
        participants: ['TOUS']
      });
    } catch (error) {
      console.error("Error creating meeting:", error);
      alert("Erreur lors de la création de la réunion.");
    }
  };

  const handleDeleteMeeting = async (id: string) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette réunion ?")) return;
    try {
      await db.collection('meetings').doc(id).delete();
    } catch (error) {
       alert("Erreur lors de la suppression.");
    }
  };

  return (
    <div className="fixed inset-0 z-[800] bg-slate-50 dark:bg-slate-950 flex flex-col font-sans overflow-hidden">
      {/* HEADER */}
      <div className="bg-white dark:bg-slate-900 border-b border-black/5 dark:border-white/5 px-8 py-6 shrink-0 z-10 shadow-sm">
        <div className="flex items-center justify-between mx-auto max-w-7xl">
          <div className="flex items-center gap-6">
            <button 
              onClick={onClose} 
              className="p-3 bg-slate-100 dark:bg-white/5 rounded-2xl text-slate-500 hover:text-indigo-600 transition-all shadow-sm"
            >
              <X size={20} />
            </button>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white font-display tracking-tight uppercase flex items-center gap-3">
                <Video className="text-indigo-600" /> Réunions en Ligne
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Module de Visio-Conférence LTP Fatick</p>
            </div>
          </div>
          
          {isAdminLtp && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
            >
              <Plus size={14} /> Programmer une réunion
            </button>
          )}
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
        <div className="mx-auto max-w-7xl">
          {loading ? (
            <div className="py-20 text-center uppercase text-[10px] font-black tracking-widest text-slate-400">
               Initialisation de l'espace virtuel...
            </div>
          ) : meetings.length === 0 ? (
            <div className="glass p-20 rounded-[3rem] bg-white dark:bg-white/5 border-2 border-dashed border-slate-200 dark:border-white/10 text-center">
              <Monitor size={64} className="mx-auto mb-6 text-slate-200" />
              <h3 className="text-xl font-black text-slate-900 dark:text-white font-display mb-2 uppercase">Aucune réunion prévue</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Utilisez le bouton "Programmer" pour lancer une session</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence>
                {meetings.map((meeting) => (
                  <motion.div 
                    key={meeting.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass group p-8 rounded-[3rem] bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 shadow-xl hover:shadow-2xl transition-all relative overflow-hidden"
                  >
                    <div className="relative z-10 space-y-6">
                       <div className="flex justify-between items-start">
                          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${meeting.status === 'LIVE' ? 'bg-rose-600 animate-pulse' : 'bg-indigo-600'}`}>
                             <Video size={24} />
                          </div>
                          {isAdminLtp && (
                            <button 
                              onClick={() => handleDeleteMeeting(meeting.id)}
                              className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                       </div>

                       <div>
                          <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase leading-tight mb-2 group-hover:text-indigo-600 transition-colors">{meeting.title}</h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed">{meeting.description || 'Session de travail administrative.'}</p>
                       </div>

                       <div className="space-y-3">
                          <div className="flex items-center gap-3 text-slate-500">
                             <Calendar size={14} className="text-indigo-500" />
                             <span className="text-[10px] font-black uppercase tracking-wider">{new Date(meeting.date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-3 text-slate-500">
                             <Clock size={14} className="text-indigo-500" />
                             <span className="text-[10px] font-black uppercase tracking-wider">{meeting.startTime} ({meeting.duration} min)</span>
                          </div>
                          <div className="flex items-center gap-3 text-slate-500">
                             <Users size={14} className="text-indigo-500" />
                             <span className="text-[10px] font-black uppercase tracking-wider">Destinataire: {meeting.participants?.join(', ')}</span>
                          </div>
                       </div>

                       <div className="pt-6 border-t border-black/5 flex items-center justify-between">
                          <div className="flex -space-x-2">
                             {[1,2,3].map(i => (
                               <div key={i} className="h-8 w-8 rounded-full bg-slate-100 border-2 border-white dark:border-slate-800 flex items-center justify-center text-[10px] font-black">
                                  {meeting.organizerName?.[0]}
                               </div>
                             ))}
                          </div>
                          <a 
                            href={meeting.link}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg"
                          >
                             <Globe size={14} /> Rejoindre
                          </a>
                       </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* MODAL AJOUT */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[900] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass bg-white dark:bg-slate-900 rounded-[3rem] p-10 max-w-xl w-full shadow-2xl border border-black/5 space-y-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white font-display uppercase tracking-tight">Programmer Session</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Configuration de la salle virtuelle</p>
                </div>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-3 bg-slate-100 dark:bg-white/5 rounded-2xl text-slate-400 hover:text-rose-500 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Sujet de la réunion</label>
                   <input 
                    type="text"
                    value={newMeeting.title}
                    onChange={(e) => setNewMeeting({...newMeeting, title: e.target.value})}
                    placeholder="ex: Conseil de Coordination"
                    className="w-full p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-black/5 dark:text-white text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                   />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Date</label>
                    <input 
                      type="date"
                      value={newMeeting.date}
                      onChange={(e) => setNewMeeting({...newMeeting, date: e.target.value})}
                      className="w-full p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-black/5 dark:text-white text-sm font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Heure</label>
                    <input 
                      type="time"
                      value={newMeeting.startTime}
                      onChange={(e) => setNewMeeting({...newMeeting, startTime: e.target.value})}
                      className="w-full p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-black/5 dark:text-white text-sm font-bold"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Détails (Optionnel)</label>
                   <textarea 
                    value={newMeeting.description}
                    onChange={(e) => setNewMeeting({...newMeeting, description: e.target.value})}
                    placeholder="Points de l'ordre du jour..."
                    className="w-full p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-black/5 dark:text-white text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none h-24 no-scrollbar"
                   />
                </div>
              </div>

              <div className="bg-indigo-50 dark:bg-indigo-500/10 p-6 rounded-[2rem] flex items-start gap-4">
                 <AlertCircle className="text-indigo-600 shrink-0 mt-1" size={20} />
                 <p className="text-[10px] font-bold text-indigo-900/60 dark:text-indigo-300 leading-relaxed uppercase">
                   Le lien Jitsi Meet sera généré automatiquement. La salle sera sécurisée par le domaine LTP Fatick.
                 </p>
              </div>

              <button 
                onClick={handleCreateMeeting}
                className="w-full py-5 bg-slate-900 text-white rounded-3xl text-[10px] font-black uppercase tracking-[0.3em] hover:bg-indigo-600 transition-all shadow-xl shadow-black/10"
              >
                Générer la salle & Planifier
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
