import React, { useState, useMemo, useEffect } from 'react';
import { 
  BookOpen, Users, Calendar, ClipboardList, 
  ChevronRight, ArrowLeft, Search, Plus,
  UserCheck, Layout, Clock, GraduationCap,
  ArrowLeftRight, Settings, ExternalLink,
  Save, Download, Trash2, X, PlusCircle
} from 'lucide-react';
import { motion, AnimatePresence } from'framer-motion';
import { SchoolClass, Teacher, Subject, ScheduleSlot, ClassCouncil, ProgressionLog } from './types';
import { db } from './firebaseConfig';
import { toPlainObject } from './utils';

interface DirecteurEtudesModuleProps {
  onClose: () => void;
  classes: SchoolClass[];
  teachers: Teacher[];
  subjects: Subject[];
  userName?: string;
  onUpdateClass?: (cls: SchoolClass) => Promise<void>;
  onUpdateTeacher?: (teacher: Teacher) => Promise<void>;
}

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'] as const;
const HOURS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', 
  '14:00', '15:00', '16:00', '17:00' ,'18:00' ,'19:00'
];

export const DirecteurEtudesModule: React.FC<DirecteurEtudesModuleProps> = ({ 
  onClose, classes, teachers, subjects, userName, onUpdateClass, onUpdateTeacher
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'assignments' | 'schedules' | 'councils' | 'progression' | 'pedagogy'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [allSlots, setAllSlots] = useState<ScheduleSlot[]>([]);
  const [councils, setCouncils] = useState<ClassCouncil[]>([]);
  const [progressionLogs, setProgressionLogs] = useState<ProgressionLog[]>([]);
  
  const [lessonLogs, setLessonLogs] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);

  const [showAddSlot, setShowAddSlot] = useState(false);
  const [showAddCouncil, setShowAddCouncil] = useState(false);
  const [showAddProgression, setShowAddProgression] = useState(false);

  const [newSlot, setNewSlot] = useState<Partial<ScheduleSlot>>({
    day: 'Lundi',
    startTime: '08:00',
    endTime: '10:00',
    room: ''
  });

  const [newCouncil, setNewCouncil] = useState<Partial<ClassCouncil>>({
    date: new Date().toISOString().split('T')[0],
    period: '1er Semestre',
    decisions: ['']
  });

  const [newProgression, setNewProgression] = useState<Partial<ProgressionLog>>({
    percentage: 0,
    chapterTitle: ''
  });

  // Fetch all data
  useEffect(() => {
    const unsubSlots = db.collection('schedules').onSnapshot(snap => {
      setAllSlots(snap.docs.map(d => ({ id: d.id, ...d.data() } as ScheduleSlot)));
    });
    const unsubCouncils = db.collection('councils').onSnapshot(snap => {
      setCouncils(snap.docs.map(d => ({ id: d.id, ...d.data() } as ClassCouncil)));
    });
    const unsubProg = db.collection('progression').onSnapshot(snap => {
      setProgressionLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as ProgressionLog)));
    });
    const unsubLogs = db.collection('lessonLogs').onSnapshot(snap => {
      setLessonLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubExams = db.collection('exams').onSnapshot(snap => {
      setExams(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubRes = db.collection('resources').onSnapshot(snap => {
      setResources(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubSlots();
      unsubCouncils();
      unsubProg();
      unsubLogs();
      unsubExams();
      unsubRes();
    };
  }, []);

  const stats = useMemo(() => [
    { label: 'Professeurs', val: teachers.length.toString(), icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Classes', val: classes.length.toString(), icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
    { 
      label: 'Emplois du temps', 
      val: `${Math.round((classes.filter(c => allSlots.some(s => s.classId === c.id)).length / (classes.length || 1)) * 100)}%`, 
      icon: Calendar, color: 'text-emerald-600', bg: 'bg-emerald-50' 
    },
    { 
      label: 'Heures / Semaine', 
      val: allSlots.reduce((sum, s) => {
        const start = parseInt(s.startTime.split(':')[0]);
        const end = parseInt(s.endTime.split(':')[0]);
        return sum + (end - start);
      }, 0).toString(), 
      icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' 
    },
  ], [teachers, classes, allSlots]);

  const selectedClassSlots = useMemo(() => 
    allSlots.filter(s => s.classId === selectedClassId)
  , [allSlots, selectedClassId]);

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !newSlot.subjectId || !newSlot.teacherId) return;

    const subject = subjects.find(s => s.id === newSlot.subjectId);
    const teacher = teachers.find(t => t.id === newSlot.teacherId);

    const slotData = {
      ...newSlot,
      classId: selectedClassId,
      subjectName: subject?.name || '?',
      teacherName: `${teacher?.firstName} ${teacher?.name}` || '?',
    };

    await db.collection('schedules').add(toPlainObject(slotData));
    setShowAddSlot(false);
  };

  const handleDeleteSlot = async (id: string) => {
    if (window.confirm("Supprimer ce créneau ?")) {
      await db.collection('schedules').doc(id).delete();
    }
  };

  const handleTransmitReport = async (type: string, title: string, content: string) => {
    try {
      await db.collection('reports').add({
        title,
        content,
        type,
        status: 'PENDING',
        author: userName || 'Directeur des Études',
        authorRole: 'DE',
        date: new Date().toISOString(),
        timestamp: new Date()
      });
      alert("Rapport transmis au Proviseur avec succès.");
    } catch (e) {
      alert("Erreur lors de la transmission du rapport.");
    }
  };

  return (
    <div className="fixed inset-0 z-[700] bg-slate-50 dark:bg-slate-950 flex flex-col font-sans overflow-hidden">
      {/* HEADER */}
      <div className="bg-white dark:bg-slate-900 border-b border-black/5 dark:border-white/5 px-8 py-6 shrink-0 z-10 shadow-sm">
        <div className="flex items-center justify-between mx-auto max-w-7xl">
          <div className="flex items-center gap-6">
            <button 
              onClick={selectedClassId ? () => setSelectedClassId(null) : (activeTab === 'overview' ? onClose : () => setActiveTab('overview'))} 
              className="p-3 bg-slate-100 dark:bg-white/5 rounded-2xl text-slate-500 hover:text-indigo-600 transition-all font-bold"
            >
              <ArrowLeft className={(activeTab === 'overview' && !selectedClassId) ? 'rotate-90' : ''} size={20} />
            </button>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white font-display tracking-tight uppercase">
                {selectedClassId ? `Emploi du Temps : ${classes.find(c => c.id === selectedClassId)?.name}` : 
                 activeTab === 'overview' ? 'Direction des Études' : 
                 activeTab === 'assignments' ? 'Affectation des Professeurs' : 'Planification Scolaire'}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Coordination Pédagogique • {userName}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             {selectedClassId && (
               <button 
                onClick={() => setShowAddSlot(true)}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20"
               >
                 <Plus size={14} /> Ajouter un créneau
               </button>
             )}
             <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20">
               <Download size={14} /> Exporter
             </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full custom-scrollbar">
        <AnimatePresence mode="wait">
          {!selectedClassId && activeTab === 'overview' ? (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {stats.map((s, i) => (
                  <div key={i} className="glass p-6 rounded-3xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/5">
                    <div className={`h-12 w-12 ${s.bg} ${s.color} rounded-2xl flex items-center justify-center mb-4`}>
                      <s.icon size={24} />
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white font-display mb-1">{s.val}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="glass p-8 rounded-[2.5rem] bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 shadow-sm">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white font-display mb-8 flex items-center gap-3">
                      <Layout className="text-indigo-600" /> Actions rapides
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { title: 'Affectations', desc: 'Gérer les profs par classe', icon: UserCheck, color: 'indigo', action: () => setActiveTab('assignments') },
                        { title: 'Emplois du Temps', desc: 'Planning hebdomadaire', icon: Calendar, color: 'emerald', action: () => setActiveTab('schedules') },
                        { title: 'Conseils de Classe', desc: 'PV et délibérations', icon: ClipboardList, color: 'blue', action: () => setActiveTab('councils') },
                        { title: 'Suivi de Progression', desc: 'Avancement des programmes', icon: Settings, color: 'amber', action: () => setActiveTab('progression') },
                        { title: 'Suivi Pédagogique', desc: 'Cahiers de texte & Hub', icon: BookOpen, color: 'rose', action: () => setActiveTab('pedagogy') },
                      ].map((item, i) => (
                        <button 
                          key={i}
                          onClick={item.action}
                          className="flex flex-col items-start p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-black/5 dark:border-white/5 hover:border-indigo-500/30 transition-all text-left group"
                        >
                          <div className={`h-10 w-10 bg-${item.color}-500/10 text-${item.color}-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                            <item.icon size={20} />
                          </div>
                          <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase mb-1">{item.title}</h4>
                          <p className="text-[10px] font-medium text-slate-400 uppercase">{item.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="glass p-8 rounded-[2.5rem] bg-indigo-600 text-white shadow-2xl">
                    <h4 className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-6 leading-relaxed">Alertes pédagogiques</h4>
                    <div className="space-y-4">
                      {lessonLogs.length === 0 && (
                        <div className="p-4 bg-white/10 rounded-2xl border border-white/10">
                          <p className="text-xs font-bold mb-1">Cahiers de texte vides</p>
                          <p className="text-[10px] text-white/60 uppercase">Aucune séance saisie cette semaine</p>
                        </div>
                      )}
                      {progressionLogs.some(p => p.percentage < 20) && (
                        <div className="p-4 bg-white/10 rounded-2xl border border-white/10">
                          <p className="text-xs font-bold mb-1">Retard de progression</p>
                          <p className="text-[10px] text-white/60 uppercase">Plusieurs matières sous les 20%</p>
                        </div>
                      )}
                      <div className="p-4 bg-white/10 rounded-2xl border border-white/10">
                        <p className="text-xs font-bold mb-1">Examens à venir</p>
                        <p className="text-[10px] text-white/60 uppercase">{exams.length} compositions programmées</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : activeTab === 'pedagogy' ? (
            <motion.div
              key="pedagogy"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Column 1: Lesson Logs Summary */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="glass p-8 rounded-[2.5rem] bg-white dark:bg-white/5 border border-black/5 dark:border-white/5">
                    <div className="flex items-center justify-between mb-8">
                       <h3 className="text-xl font-black text-slate-900 dark:text-white font-display uppercase flex items-center gap-3">
                         <ClipboardList className="text-indigo-600" /> Cahiers de Texte (Dernières séances)
                       </h3>
                    </div>
                    <div className="space-y-4">
                       {lessonLogs.slice(0, 5).map(log => (
                         <div key={log.id} className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5">
                           <div className="flex justify-between items-start mb-2">
                             <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase">{log.topic}</h4>
                             <span className="text-[8px] font-black bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded uppercase">{log.subjectName}</span>
                           </div>
                           <p className="text-[10px] text-slate-500 font-bold uppercase">{log.teacherName} • {classes.find(c => c.id === log.classId)?.name}</p>
                         </div>
                       ))}
                       {lessonLogs.length === 0 && <p className="text-center text-slate-400 py-8 text-[10px] uppercase font-bold">Aucune séance enregistrée</p>}
                    </div>
                  </div>

                  <div className="glass p-8 rounded-[2.5rem] bg-white dark:bg-white/5 border border-black/5 dark:border-white/5">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white font-display uppercase mb-8 flex items-center gap-3">
                      <GraduationCap className="text-emerald-600" /> Examens & Contrôles
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {exams.map(ex => (
                         <div key={ex.id} className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5">
                            <p className="text-[10px] font-black text-emerald-600 uppercase mb-1">{ex.date}</p>
                            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase mb-2">{ex.title}</h4>
                            <div className="flex justify-between items-center text-[8px] font-bold text-slate-400 uppercase">
                              <span>{ex.subjectName}</span>
                              <span className="bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded">{ex.type}</span>
                            </div>
                         </div>
                       ))}
                    </div>
                  </div>
                </div>

                {/* Column 2: Resources & Assets */}
                <div className="space-y-6">
                  <div className="glass p-8 rounded-[2.5rem] bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 h-full">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white font-display uppercase mb-8 flex items-center gap-3">
                      <Download className="text-blue-600" /> Hub Ressources
                    </h3>
                    <div className="space-y-4">
                       {resources.slice(0, 10).map(res => (
                         <div key={res.id} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl group border border-black/5 dark:border-white/5">
                            <div className="h-10 w-10 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                               <BookOpen size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                               <p className="text-xs font-black text-slate-900 dark:text-white uppercase truncate">{res.title}</p>
                               <p className="text-[9px] font-bold text-slate-400 uppercase">{res.uploadedBy}</p>
                            </div>
                         </div>
                       ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : !selectedClassId && activeTab === 'assignments' ? (
            <motion.div
              key="assignments"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between bg-white dark:bg-white/5 p-6 rounded-[2rem] border border-black/5 dark:border-white/10">
                <div className="relative w-96">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                   <input 
                     type="text" 
                     placeholder="Rechercher un professeur..."
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-2xl py-3 pl-12 pr-4 text-sm font-medium outline-none focus:ring-2 ring-indigo-500/20 transition-all"
                   />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.map(cls => (
                  <div key={cls.id} className="glass p-8 rounded-[2.5rem] bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 hover:border-indigo-500/30 transition-all group">
                     <div className="flex justify-between items-start mb-6">
                        <div className="h-14 w-14 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-xl">
                          {cls.name.substring(0, 2)}
                        </div>
                        <div className="px-3 py-1 bg-slate-100 dark:bg-white/5 rounded-full text-[8px] font-black uppercase text-slate-500">
                          {cls.field}
                        </div>
                     </div>
                     <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase mb-2">{cls.name}</h4>
                     <p className="text-[10px] text-slate-400 font-bold uppercase mb-8">{cls.level}</p>
                     
                     <div className="space-y-4">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">Professeur Principal</label>
                        <select 
                          value={cls.mainTeacherId || ''}
                          onChange={async (e) => {
                            if (onUpdateClass) {
                              await onUpdateClass({ ...cls, mainTeacherId: e.target.value });
                            }
                          }}
                          className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-2xl p-4 text-xs font-bold outline-none focus:ring-2 ring-indigo-500/20 transition-all"
                        >
                           <option value="">Non assigné</option>
                           {teachers.map(t => (
                             <option key={t.id} value={t.id}>{t.firstName} {t.name}</option>
                           ))}
                        </select>
                     </div>

                     <div className="mt-8 pt-6 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                        <div className="flex -space-x-3">
                           {[1, 2, 3].map(i => (
                             <div key={i} className="h-8 w-8 rounded-full bg-slate-200 border-2 border-white dark:border-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500">
                               P{i}
                             </div>
                           ))}
                           <div className="h-8 w-8 rounded-full bg-indigo-600 border-2 border-white dark:border-slate-800 flex items-center justify-center text-[10px] font-bold text-white">
                             +
                           </div>
                        </div>
                        <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:translate-x-1 transition-transform">
                          Détails →
                        </button>
                     </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : !selectedClassId && activeTab === 'schedules' ? (
            <motion.div
              key="schedules"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-white/5 p-6 rounded-[2rem] border border-black/5 dark:border-white/10">
                 <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                      <Calendar size={24} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Gestion des emplois du temps</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase italic text-emerald-500">Mode Édition Actif</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-2">
                    <button className="px-6 py-3 bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest border border-black/5 dark:border-white/10">
                      Configuration
                    </button>
                    <button className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20">
                      Vue Globale
                    </button>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 {classes.map(cls => {
                   const classSlotsCount = allSlots.filter(s => s.classId === cls.id).length;
                   return (
                    <button 
                      key={cls.id}
                      onClick={() => setSelectedClassId(cls.id)}
                      className="glass p-6 rounded-[2rem] bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 hover:border-emerald-500/30 transition-all text-left flex flex-col justify-between group h-48"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-4">
                           <h4 className="text-xl font-black text-slate-900 dark:text-white font-display mb-1">{cls.name}</h4>
                           <span className={`h-3 w-3 rounded-full ${classSlotsCount > 0 ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-slate-300'} shadow-lg`} />
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 italic">{cls.field}</p>
                      </div>
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2 text-slate-400">
                           <Clock size={12} />
                           <span className="text-[10px] font-bold">{classSlotsCount} séances</span>
                         </div>
                         <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all">
                           <ChevronRight size={16} />
                         </div>
                      </div>
                    </button>
                   );
                 })}
              </div>
            </motion.div>
          ) : activeTab === 'councils' ? (
            <motion.div
              key="councils"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between bg-white dark:bg-white/5 p-6 rounded-[2rem] border border-black/5 dark:border-white/10">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest pl-2">Historique des Conseils de Classe</h3>
                <button 
                  onClick={() => setShowAddCouncil(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20"
                >
                  Nouveau Procès-Verbal
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {councils.map(c => (
                  <div key={c.id} className="glass p-8 rounded-[2.5rem] bg-white dark:bg-white/5 border border-black/5 dark:border-white/5">
                    <div className="flex justify-between items-start mb-6">
                       <div>
                         <h4 className="text-xl font-black text-slate-900 dark:text-white font-display uppercase">{c.className}</h4>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{c.period} • {c.date}</p>
                       </div>
                       <div className="h-12 w-12 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-2xl flex items-center justify-center font-black text-sm">
                         {c.averageGrade}
                       </div>
                    </div>
                    <div className="space-y-4 mb-8">
                       <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">{c.minutes}</p>
                       <div className="flex flex-wrap gap-2">
                         {c.decisions.map((d, i) => (
                           <span key={i} className="px-3 py-1 bg-slate-100 dark:bg-white/5 rounded-full text-[8px] font-black uppercase text-slate-500 border border-black/5 dark:border-white/10">
                             {d}
                           </span>
                         ))}
                       </div>
                    </div>
                    <div className="pt-6 border-t border-black/5 dark:border-white/5 flex justify-between items-center">
                       <div className="flex items-center gap-2">
                         <p className="text-[9px] font-bold text-slate-400 uppercase italic">Présidé par : {c.president}</p>
                         <button 
                          onClick={() => handleTransmitReport('PÉDAGOGIQUE', `PV Conseil : ${c.className} (${c.period})`, `Conseil de classe du ${c.date}.\nMoyenne: ${c.averageGrade}\nDécisions: ${c.decisions.join(', ')}\n\nPV: ${c.minutes}`)}
                          className="px-2 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded text-[8px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all ml-4"
                         >
                           Transmettre au Proviseur
                         </button>
                       </div>
                       <button 
                         onClick={async () => {
                           if (window.confirm("Supprimer ce PV ?")) {
                             await db.collection('councils').doc(c.id).delete();
                           }
                         }}
                         className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                       >
                         <Trash2 size={16} />
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : activeTab === 'progression' ? (
            <motion.div
              key="progression"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between bg-white dark:bg-white/5 p-6 rounded-[2rem] border border-black/5 dark:border-white/10">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest pl-2">Avancement des Programmes</h3>
                <button 
                  onClick={() => setShowAddProgression(true)}
                  className="px-6 py-3 bg-amber-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20"
                >
                  Mise à jour Progression
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {progressionLogs.sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated)).map(log => (
                  <div key={log.id} className="glass p-6 rounded-[2rem] bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center justify-between gap-8 group">
                    <div className="flex items-center gap-6 flex-1">
                      <div className="h-14 w-14 bg-amber-50 dark:bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center font-black text-sm">
                        {log.percentage}%
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase truncate max-w-sm">{log.chapterTitle}</h4>
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-white/5 rounded text-[8px] font-black uppercase text-slate-400">
                            {classes.find(c => c.id === log.classId)?.name}
                          </span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {log.subjectName} • {log.teacherName}
                        </p>
                      </div>
                    </div>
                    
                    <div className="hidden md:block w-48">
                       <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden mb-2">
                         <div className="h-full bg-amber-500 rounded-full" style={{ width: `${log.percentage}%` }} />
                       </div>
                       <p className="text-[8px] font-black text-slate-400 uppercase text-right tracking-[0.2em]">Dernière MAJ: {log.lastUpdated}</p>
                    </div>

                    <button 
                      onClick={async () => {
                        if (window.confirm("Supprimer ce log ?")) {
                          await db.collection('progression').doc(log.id).delete();
                        }
                      }}
                      className="p-3 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : selectedClassId ? (
            <motion.div
              key="schedule-detail"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6 pb-20"
            >
              {/* TIMETABLE GRID */}
              <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 border border-black/5 dark:border-white/5 overflow-x-auto shadow-2xl">
                <table className="w-full border-collapse min-w-[800px]">
                  <thead>
                    <tr>
                      <th className="p-4 border-b border-black/5 dark:border-white/10 w-24"></th>
                      {DAYS.map(day => (
                        <th key={day} className="p-4 border-b border-black/5 dark:border-white/10 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {HOURS.map((hour, hourIdx) => (
                      <tr key={hour}>
                        <td className="p-4 border-r border-black/5 dark:border-white/10 text-[10px] font-black text-slate-400 uppercase text-right pr-6">
                          {hour}
                        </td>
                        {DAYS.map(day => {
                          const slot = selectedClassSlots.find(s => s.day === day && s.startTime === hour);
                          return (
                            <td key={day} className="p-2 border border-black/5 dark:border-white/5 w-1/7 min-h-[80px]">
                              {slot ? (
                                <div className="group relative bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 p-3 rounded-2xl h-full min-h-[60px] animate-in zoom-in-95">
                                   <button 
                                    onClick={() => handleDeleteSlot(slot.id)}
                                    className="absolute -top-2 -right-2 h-6 w-6 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                   >
                                     <X size={12} />
                                   </button>
                                   <p className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase truncate mb-1">
                                     {slot.subjectName}
                                   </p>
                                   <p className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase truncate">
                                     {slot.teacherName}
                                   </p>
                                   <div className="mt-2 text-[7px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                                     <Layout size={8} /> {slot.room || 'Salle ?'}
                                   </div>
                                </div>
                              ) : (
                                <button 
                                  onClick={() => {
                                    setNewSlot({ ...newSlot, day, startTime: hour });
                                    setShowAddSlot(true);
                                  }}
                                  className="w-full h-full min-h-[60px] rounded-2xl border-2 border-dashed border-slate-100 dark:border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all flex items-center justify-center text-slate-200 dark:text-white/5"
                                >
                                  <Plus size={16} />
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {/* ADD SLOT MODAL */}
      <AnimatePresence>
        {showAddCouncil && (
          <div className="fixed inset-0 z-[800] flex items-center justify-center p-6 sm:p-12">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddCouncil(false)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[3.5rem] shadow-3xl overflow-hidden border border-white/10 p-10 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white font-display uppercase tracking-tight">Nouveau Procès-Verbal</h3>
                <button onClick={() => setShowAddCouncil(false)} className="p-3 bg-slate-100 dark:bg-white/5 rounded-2xl text-slate-400 hover:text-rose-500 transition-all font-bold"><X size={20} /></button>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!newCouncil.classId) return;
                const cls = classes.find(c => c.id === newCouncil.classId);
                await db.collection('councils').add(toPlainObject({
                  ...newCouncil,
                  className: cls?.name || '?',
                  lastUpdated: new Date().toLocaleDateString()
                }));
                setShowAddCouncil(false);
              }} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Classe</label>
                    <select value={newCouncil.classId || ''} onChange={e => setNewCouncil({...newCouncil, classId: e.target.value})} className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-2xl p-5 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 ring-blue-500/20" required>
                      <option value="">Sélectionner</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Période</label>
                    <select value={newCouncil.period} onChange={e => setNewCouncil({...newCouncil, period: e.target.value})} className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-2xl p-5 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 ring-blue-500/20">
                      <option value="1er Semestre">1er Semestre</option>
                      <option value="2ème Semestre">2ème Semestre</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Moyenne Générale</label>
                    <input type="number" step="0.01" value={newCouncil.averageGrade || ''} onChange={e => setNewCouncil({...newCouncil, averageGrade: parseFloat(e.target.value)})} className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-2xl p-5 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 ring-blue-500/20" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Président</label>
                    <input type="text" value={newCouncil.president || ''} onChange={e => setNewCouncil({...newCouncil, president: e.target.value})} className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-2xl p-5 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 ring-blue-500/20" placeholder="Nom du président" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Procès-verbal (Compte rendu)</label>
                  <textarea value={newCouncil.minutes || ''} onChange={e => setNewCouncil({...newCouncil, minutes: e.target.value})} className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-2xl p-5 text-sm font-medium text-slate-900 dark:text-white outline-none focus:ring-2 ring-blue-500/20 min-h-[150px]" placeholder="Détails du conseil..." required />
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white py-6 rounded-[2rem] font-black uppercase text-[11px] shadow-2xl shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all mt-4">Enregistrer le PV</button>
              </form>
            </motion.div>
          </div>
        )}

        {showAddProgression && (
          <div className="fixed inset-0 z-[800] flex items-center justify-center p-6 sm:p-12">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddProgression(false)} className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[3.5rem] shadow-3xl overflow-hidden border border-white/10 p-10">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white font-display uppercase tracking-tight">Avancement Programme</h3>
                <button onClick={() => setShowAddProgression(false)} className="p-3 bg-slate-100 dark:bg-white/5 rounded-2xl text-slate-400 hover:text-rose-500 transition-all font-bold"><X size={20} /></button>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!newProgression.classId || !newProgression.teacherId || !newProgression.subjectId) return;
                const teacher = teachers.find(t => t.id === newProgression.teacherId);
                const subj = subjects.find(s => s.id === newProgression.subjectId);
                await db.collection('progression').add(toPlainObject({
                  ...newProgression,
                  teacherName: `${teacher?.firstName} ${teacher?.name}`,
                  subjectName: subj?.name,
                  lastUpdated: new Date().toLocaleDateString()
                }));
                setShowAddProgression(false);
              }} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Chapitre / Leçon</label>
                  <input type="text" value={newProgression.chapterTitle || ''} onChange={e => setNewProgression({...newProgression, chapterTitle: e.target.value})} className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-2xl p-5 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 ring-amber-500/20" placeholder="Titre de la leçon..." required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Professeur</label>
                    <select value={newProgression.teacherId || ''} onChange={e => setNewProgression({...newProgression, teacherId: e.target.value})} className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-2xl p-5 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 ring-amber-500/20" required>
                      <option value="">Sélectionner</option>
                      {teachers.map(t => <option key={t.id} value={t.id}>{t.firstName} {t.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Classe</label>
                    <select value={newProgression.classId || ''} onChange={e => setNewProgression({...newProgression, classId: e.target.value})} className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-2xl p-5 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 ring-amber-500/20" required>
                      <option value="">Sélectionner</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Matière</label>
                    <select value={newProgression.subjectId || ''} onChange={e => setNewProgression({...newProgression, subjectId: e.target.value})} className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-2xl p-5 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 ring-amber-500/20" required>
                      <option value="">Sélectionner</option>
                      {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Pourcentage (%)</label>
                    <input type="number" min="0" max="100" value={newProgression.percentage || 0} onChange={e => setNewProgression({...newProgression, percentage: parseInt(e.target.value)})} className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-2xl p-5 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 ring-amber-500/20" required />
                  </div>
                </div>
                <button type="submit" className="w-full bg-amber-600 text-white py-6 rounded-[2rem] font-black uppercase text-[11px] shadow-2xl shadow-amber-500/20 hover:bg-amber-700 active:scale-95 transition-all mt-4">Mettre à jour l'avancement</button>
              </form>
            </motion.div>
          </div>
        )}

        {showAddSlot && (
          <div className="fixed inset-0 z-[800] flex items-center justify-center p-6 sm:p-12">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowAddSlot(false)}
               className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[3.5rem] shadow-3xl overflow-hidden border border-white/10"
             >
                <div className="p-10">
                   <div className="flex justify-between items-center mb-8">
                      <div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white font-display uppercase tracking-tight">Ajouter un cours</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{newSlot.day} • {newSlot.startTime}</p>
                      </div>
                      <button 
                        onClick={() => setShowAddSlot(false)}
                        className="p-3 bg-slate-100 dark:bg-white/5 rounded-2xl text-slate-400 hover:text-rose-500 transition-all font-bold"
                      >
                        <X size={20} />
                      </button>
                   </div>

                   <form onSubmit={handleAddSlot} className="space-y-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Matière</label>
                         <select 
                           value={newSlot.subjectId || ''} 
                           onChange={e => setNewSlot({...newSlot, subjectId: e.target.value})}
                           className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-2xl p-5 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 ring-emerald-500/20"
                           required
                         >
                           <option value="">Sélectionner la matière</option>
                           {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.category})</option>)}
                         </select>
                      </div>

                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Professeur</label>
                         <select 
                           value={newSlot.teacherId || ''} 
                           onChange={e => setNewSlot({...newSlot, teacherId: e.target.value})}
                           className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-2xl p-5 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 ring-emerald-500/20"
                           required
                         >
                           <option value="">Sélectionner le professeur</option>
                           {teachers.map(t => <option key={t.id} value={t.id}>{t.firstName} {t.name}</option>)}
                         </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Heure de fin</label>
                           <select 
                             value={newSlot.endTime} 
                             onChange={e => setNewSlot({...newSlot, endTime: e.target.value})}
                             className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-2xl p-5 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 ring-emerald-500/20"
                           >
                             {HOURS.filter(h => h > (newSlot.startTime || '00:00')).map(h => <option key={h} value={h}>{h}</option>)}
                             <option value="18:00">18:00</option>
                           </select>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Salle</label>
                           <input 
                             type="text" 
                             placeholder="Ex: B12" 
                             value={newSlot.room} 
                             onChange={e => setNewSlot({...newSlot, room: e.target.value})}
                             className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-2xl p-5 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 ring-emerald-500/20"
                             required
                           />
                        </div>
                      </div>

                      <button 
                        type="submit"
                        className="w-full bg-emerald-600 text-white py-6 rounded-[2rem] font-black uppercase text-[11px] shadow-2xl shadow-emerald-500/20 hover:bg-emerald-700 active:scale-95 transition-all mt-4"
                      >
                        Valider la programmation
                      </button>
                   </form>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
