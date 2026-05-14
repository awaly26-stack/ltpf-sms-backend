import React, { useState, useEffect } from 'react';
import { 
  BookOpen, FilePlus, Calendar, Download, 
  Search, Plus, FileText, CheckCircle2, 
  Clock, X, Layers, Users, GraduationCap,
  ArrowRight, Landmark, Upload, Link, Filter,
  BookMarked, Presentation, ClipboardList, PenTool
} from 'lucide-react';
import { db } from './firebaseConfig';
import { collection, onSnapshot, addDoc, query, orderBy, limit, deleteDoc, doc } from 'firebase/firestore';
import { LessonLog, ResourceFile, ExamSchedule, Student, SchoolClass, Subject, Role } from './types';
import { toPlainObject } from './utils';
import { motion, AnimatePresence } from 'framer-motion';

interface PedagogyModuleProps {
  onClose: () => void;
  classes: SchoolClass[];
  subjects: Subject[];
  currentUser: { id: string; name: string; role: Role };
}

export const PedagogyModule: React.FC<PedagogyModuleProps> = ({ onClose, classes, subjects, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'logbook' | 'resources' | 'exams'>('logbook');
  const [logs, setLogs] = useState<LessonLog[]>([]);
  const [resources, setResources] = useState<ResourceFile[]>([]);
  const [exams, setExams] = useState<ExamSchedule[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddLog, setShowAddLog] = useState(false);
  const [showAddResource, setShowAddResource] = useState(false);
  const [showAddExam, setShowAddExam] = useState(false);

  useEffect(() => {
    const unsubLogs = onSnapshot(query(collection(db, 'lessonLogs'), orderBy('date', 'desc')), (snapshot) => {
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LessonLog)));
    });
    const unsubResources = onSnapshot(collection(db, 'resources'), (snapshot) => {
      setResources(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ResourceFile)));
    });
    const unsubExams = onSnapshot(query(collection(db, 'exams'), orderBy('date', 'asc')), (snapshot) => {
      setExams(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExamSchedule)));
    });
    return () => {
      unsubLogs();
      unsubResources();
      unsubExams();
    };
  }, []);

  const handleAddLog = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const subject = subjects.find(s => s.id === formData.get('subjectId'));
    const classObj = classes.find(c => c.id === formData.get('classId'));
    
    if (!subject || !classObj) return;

    const log = {
      teacherId: currentUser.id,
      teacherName: currentUser.name,
      classId: classObj.id,
      subjectId: subject.id,
      subjectName: subject.name,
      date: formData.get('date') as string,
      duration: parseInt(formData.get('duration') as string),
      topic: formData.get('topic') as string,
      content: formData.get('content') as string,
      homework: formData.get('homework') as string,
    };
    await addDoc(collection(db, 'lessonLogs'), toPlainObject(log));
    setShowAddLog(false);
  };

  const handleAddResource = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const resource = {
      title: formData.get('title') as string,
      type: formData.get('type') as any,
      url: formData.get('url') as string,
      classId: formData.get('classId') as string,
      subjectId: formData.get('subjectId') as string,
      uploadedBy: currentUser.name,
      uploadDate: new Date().toISOString(),
    };
    await addDoc(collection(db, 'resources'), toPlainObject(resource));
    setShowAddResource(false);
  };

  const isManagement = currentUser.role === 'ADMIN' || currentUser.role === 'DE' || currentUser.role === 'PROVISEUR';
  const isTeacher = currentUser.role === 'TEACHER';

  return (
    <div className="fixed inset-0 z-[600] bg-slate-950 flex flex-col md:flex-row animate-in fade-in duration-300 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-80 bg-slate-900/40 backdrop-blur-3xl border-r border-white/5 p-8 flex flex-col gap-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
             <div className="h-10 w-10 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20">
                <BookMarked className="text-indigo-400" size={20} />
             </div>
             <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">Pédagogie</h2>
          </div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-13">Directeur des Études</p>
        </div>

        <nav className="flex-1 space-y-2">
           {[
             { id: 'logbook', label: 'Cahier de Texte', icon: PenTool },
             { id: 'resources', label: 'Hub Ressources', icon: Layers },
             { id: 'exams', label: 'Planning Examens', icon: Calendar }
           ].map((tab) => (
             <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center gap-4 p-5 rounded-[2rem] text-xs font-black uppercase tracking-wider transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 scale-105' : 'text-slate-500 hover:bg-white/5'}`}
             >
               <tab.icon size={18} />
               {tab.label}
             </button>
           ))}
        </nav>

        <button 
          onClick={onClose}
          className="p-5 rounded-[2rem] bg-white/5 text-slate-400 border border-white/5 text-[10px] font-black uppercase tracking-widest hover:text-white transition-all flex items-center justify-center gap-3"
        >
          <X size={16} /> Quitter
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-8 md:p-14 bg-slate-950 custom-scrollbar">
         <div className="max-w-6xl mx-auto space-y-12">
            
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
               <div>
                  <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">
                    {activeTab === 'logbook' && "Cahier de <Texte>"}
                    {activeTab === 'resources' && "Hub <Pédagogique>"}
                    {activeTab === 'exams' && "Contrôles & <Examens>"}
                  </h1>
                  <div className="flex items-center gap-3 mt-4">
                    <div className="h-6 w-6 rounded-full bg-indigo-500/10 flex items-center justify-center">
                       <Landmark size={12} className="text-indigo-400" />
                    </div>
                    <p className="text-slate-500 font-bold uppercase text-[9px] tracking-widest">LTP de Fatick — Direction des Études</p>
                  </div>
               </div>
               
               <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input 
                      type="text" 
                      placeholder="Rechercher..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-slate-900 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-[10px] font-bold text-white uppercase outline-none focus:border-indigo-500 md:w-64"
                    />
                  </div>
                  {activeTab === 'logbook' && (isTeacher || currentUser.role === 'ADMIN') && (
                    <button onClick={() => setShowAddLog(true)} className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-600/20 hover:scale-110 active:scale-95 transition-all">
                      <Plus size={20} />
                    </button>
                  )}
                  {activeTab === 'resources' && (isTeacher || isManagement) && (
                    <button onClick={() => setShowAddResource(true)} className="p-4 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-600/20 hover:scale-110 active:scale-95 transition-all">
                      <Upload size={20} />
                    </button>
                  )}
               </div>
            </header>

            <AnimatePresence mode="wait">
               {activeTab === 'logbook' && (
                 <motion.div 
                  key="logbook"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                 >
                    {logs.filter(l => l.topic.toLowerCase().includes(searchQuery.toLowerCase()) || l.teacherName.toLowerCase().includes(searchQuery.toLowerCase())).map((log) => (
                      <div key={log.id} className="glass p-8 rounded-[2.5rem] border border-white/5 hover:border-indigo-500/30 transition-all group">
                         <div className="flex flex-col md:flex-row gap-8">
                            <div className="md:w-48 shrink-0">
                               <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">{new Date(log.date).toLocaleDateString()} — {log.duration}min</p>
                               <p className="text-sm font-black text-white uppercase italic">{log.teacherName}</p>
                               <div className="flex items-center gap-2 mt-4 text-[9px] font-bold text-slate-500 uppercase">
                                  <Users size={12} /> {classes.find(c => c.id === log.classId)?.name}
                               </div>
                               <div className="flex items-center gap-2 mt-1 text-[9px] font-bold text-slate-500 uppercase">
                                  <BookOpen size={12} /> {log.subjectName}
                               </div>
                            </div>
                            
                            <div className="flex-1 space-y-4">
                               <h3 className="text-xl font-black text-white uppercase tracking-tight">{log.topic}</h3>
                               <p className="text-sm text-slate-400 leading-relaxed font-medium bg-white/5 p-6 rounded-2xl italic">"{log.content}"</p>
                               {log.homework && (
                                 <div className="flex items-start gap-3 p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10">
                                    <ClipboardList size={16} className="text-amber-500 shrink-0 mt-1" />
                                    <div>
                                       <p className="text-[9px] font-black text-amber-500 uppercase mb-1">Travail à faire</p>
                                       <p className="text-[11px] font-bold text-slate-300">{log.homework}</p>
                                    </div>
                                 </div>
                               )}
                            </div>
                         </div>
                      </div>
                    ))}
                 </motion.div>
               )}

               {activeTab === 'resources' && (
                 <motion.div 
                  key="resources"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                 >
                    {resources.map((res) => (
                      <div key={res.id} className="glass p-8 rounded-[3rem] border border-white/5 group hover:border-emerald-500/30 transition-all">
                         <div className="flex justify-between items-start mb-6">
                            <div className="h-12 w-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                               {res.type === 'VIDEO' ? <Presentation size={24} /> : <FileText size={24} />}
                            </div>
                            <span className="text-[8px] font-black bg-white/5 px-3 py-1 rounded-full text-slate-500 uppercase">{res.type}</span>
                         </div>
                         
                         <h3 className="text-lg font-black text-white uppercase italic leading-none mb-2">{res.title}</h3>
                         <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{subjects.find(s => s.id === res.subjectId)?.name}</p>
                         
                         <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                               <div className="h-6 w-6 rounded-full bg-slate-800 flex items-center justify-center text-[8px] font-black">{res.uploadedBy[0]}</div>
                               <p className="text-[9px] font-bold text-slate-500 uppercase">{res.uploadedBy}</p>
                            </div>
                            <a href={res.url} target="_blank" rel="noopener noreferrer" className="h-10 w-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-all">
                               <Download size={18} />
                            </a>
                         </div>
                      </div>
                    ))}
                 </motion.div>
               )}

               {activeTab === 'exams' && (
                 <motion.div 
                  key="exams"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                 >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                       {exams.map((ex) => (
                         <div key={ex.id} className="glass p-8 rounded-[2.5rem] border border-white/5 flex gap-8">
                            <div className="flex flex-col items-center justify-center bg-indigo-600/10 border border-indigo-500/20 rounded-3xl p-6 min-w-24">
                               <span className="text-[10px] font-black text-indigo-400 uppercase">{new Date(ex.date).toLocaleString('default', { month: 'short' })}</span>
                               <span className="text-3xl font-black text-white">{new Date(ex.date).getDate()}</span>
                            </div>
                            <div className="flex-1 space-y-4">
                               <div className="flex justify-between items-start">
                                  <div>
                                     <h4 className="text-lg font-black text-white uppercase italic">{ex.title}</h4>
                                     <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1">{ex.subjectName}</p>
                                  </div>
                                  <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${ex.type === 'COMPOSITION' ? 'bg-rose-500/10 text-rose-500' : 'bg-sky-500/10 text-sky-500'}`}>{ex.type}</span>
                               </div>
                               <div className="flex items-center gap-6">
                                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                     <Clock size={12} /> {ex.startTime} - {ex.endTime}
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                     <Landmark size={12} /> Salle {ex.room}
                                  </div>
                               </div>
                               <div className="pt-2">
                                  <p className="text-[10px] font-black text-slate-500 uppercase">Classe: {classes.find(c => c.id === ex.classId)?.name}</p>
                               </div>
                            </div>
                         </div>
                       ))}
                    </div>
                 </motion.div>
               )}
            </AnimatePresence>
         </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
         {showAddLog && (
           <div className="fixed inset-0 z-[700] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-900 w-full max-w-lg rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden">
                  <form onSubmit={handleAddLog}>
                    <div className="p-8 border-b border-white/5 flex items-center justify-between">
                       <h3 className="text-xl font-black text-white uppercase italic">Saisir une<br/><span className="text-indigo-400">Séance de Cours</span></h3>
                       <button type="button" onClick={() => setShowAddLog(false)} className="p-3 bg-white/5 rounded-2xl text-slate-400"><X size={20} /></button>
                    </div>
                    <div className="p-8 space-y-4">
                       <div className="grid grid-cols-2 gap-4">
                          <select name="classId" className="w-full bg-slate-800 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white" required>
                             <option value="">Classe</option>
                             {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                          <select name="subjectId" className="w-full bg-slate-800 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white" required>
                             <option value="">Matière</option>
                             {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <input name="date" type="date" className="w-full bg-slate-800 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white" required />
                          <input name="duration" type="number" placeholder="Durée (min)" className="w-full bg-slate-800 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white" required />
                       </div>
                       <input name="topic" placeholder="Titre de la leçon / chapitre" className="w-full bg-slate-800 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white" required />
                       <textarea name="content" placeholder="Contenu résumé de la séance..." className="w-full bg-slate-800 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white h-32" required />
                       <input name="homework" placeholder="Exercices / Devoirs à faire" className="w-full bg-slate-800 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white" />
                       <button type="submit" className="w-full bg-indigo-600 text-white py-6 rounded-[2rem] font-black uppercase text-[10px] shadow-xl shadow-indigo-600/20 mt-4">Enregistrer dans le Cahier de Texte</button>
                    </div>
                  </form>
              </motion.div>
           </div>
         )}

         {showAddResource && (
           <div className="fixed inset-0 z-[700] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-900 w-full max-w-lg rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden">
                  <form onSubmit={handleAddResource}>
                    <div className="p-8 border-b border-white/5 flex items-center justify-between">
                       <h3 className="text-xl font-black text-white uppercase italic">Partager une<br/><span className="text-emerald-500">Ressource</span></h3>
                       <button type="button" onClick={() => setShowAddResource(false)} className="p-3 bg-white/5 rounded-2xl text-slate-400"><X size={20} /></button>
                    </div>
                    <div className="p-8 space-y-4">
                       <input name="title" placeholder="Titre de la ressource" className="w-full bg-slate-800 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white" required />
                       <div className="grid grid-cols-2 gap-4">
                          <select name="type" className="w-full bg-slate-800 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white" required>
                             <option value="PDF">PDF</option>
                             <option value="VIDEO">VIDEO</option>
                             <option value="IMAGE">IMAGE</option>
                             <option value="DOCUMENT">DOC</option>
                          </select>
                          <select name="classId" className="w-full bg-slate-800 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white" required>
                             <option value="">Pour la classe...</option>
                             {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                       </div>
                       <select name="subjectId" className="w-full bg-slate-800 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white" required>
                          <option value="">Sélectionner la matière</option>
                          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                       </select>
                       <input name="url" placeholder="Lien de la ressource (Drive, Cloud, etc.)" className="w-full bg-slate-800 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white" required />
                       <button type="submit" className="w-full bg-emerald-600 text-white py-6 rounded-[2rem] font-black uppercase text-[10px] shadow-xl shadow-emerald-600/20 mt-4">Mettre à disposition</button>
                    </div>
                  </form>
              </motion.div>
           </div>
         )}
      </AnimatePresence>
    </div>
  );
};
