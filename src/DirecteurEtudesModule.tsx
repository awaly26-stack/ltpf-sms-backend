import React, { useState, useMemo } from 'react';
import { 
  BookOpen, Users, Calendar, ClipboardList, 
  ChevronRight, ArrowLeft, Search, Plus,
  UserCheck, Layout, Clock, GraduationCap,
  ArrowLeftRight, Settings, ExternalLink,
  Save, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SchoolClass, Teacher } from './types';

interface DirecteurEtudesModuleProps {
  onClose: () => void;
  classes: SchoolClass[];
  teachers: Teacher[];
  userName?: string;
  onUpdateClass?: (cls: SchoolClass) => Promise<void>;
  onUpdateTeacher?: (teacher: Teacher) => Promise<void>;
}

export const DirecteurEtudesModule: React.FC<DirecteurEtudesModuleProps> = ({ 
  onClose, classes, teachers, userName, onUpdateClass, onUpdateTeacher
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'assignments' | 'schedules'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  const stats = [
    { label: 'Professeurs', val: teachers.length.toString(), icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Classes', val: classes.length.toString(), icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Emplois du temps', val: '100%', icon: Calendar, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Heures / Semaine', val: '420', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.firstName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAssignTeacher = async (classId: string, teacherName: string) => {
    // Logic to assign primary teacher would go here if specialized in type
    console.log(`Assigning ${teacherName} to ${classId}`);
    // This is a simplified demo of assignment
  };

  return (
    <div className="fixed inset-0 z-[700] bg-slate-50 dark:bg-slate-950 flex flex-col font-sans overflow-hidden">
      {/* HEADER */}
      <div className="bg-white dark:bg-slate-900 border-b border-black/5 dark:border-white/5 px-8 py-6 shrink-0 z-10 shadow-sm">
        <div className="flex items-center justify-between mx-auto max-w-7xl">
          <div className="flex items-center gap-6">
            <button 
              onClick={activeTab === 'overview' ? onClose : () => setActiveTab('overview')} 
              className="p-3 bg-slate-100 dark:bg-white/5 rounded-2xl text-slate-500 hover:text-indigo-600 transition-all font-bold"
            >
              <ArrowLeft className={activeTab === 'overview' ? 'rotate-90' : ''} size={20} />
            </button>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white font-display tracking-tight uppercase">
                {activeTab === 'overview' ? 'Direction des Études' : 
                 activeTab === 'assignments' ? 'Affectation des Professeurs' : 'Planification Scolaire'}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Coordination Pédagogique • {userName}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20">
               <Download size={14} /> Exporter
             </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full custom-scrollbar">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' ? (
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
                    <h3 className="text-xl font-black text-slate-900 dark:text-white font-display mb-8 lowercase flex items-center gap-3">
                      <Layout className="text-indigo-600" /> Actions rapides
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { title: 'Affectations', desc: 'Gérer les profs par classe', icon: UserCheck, color: 'indigo', action: () => setActiveTab('assignments') },
                        { title: 'Emplois du Temps', desc: 'Planning hebdomadaire', icon: Calendar, color: 'emerald', action: () => setActiveTab('schedules') },
                        { title: 'Conseils de Classe', desc: 'PV et délibérations', icon: ClipboardList, color: 'blue', action: () => {} },
                        { title: 'Suivi de Progression', desc: 'Avancement des programmes', icon: Settings, color: 'amber', action: () => {} },
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
                      <div className="p-4 bg-white/10 rounded-2xl border border-white/10">
                        <p className="text-xs font-bold mb-1">Manque de professeurs</p>
                        <p className="text-[10px] text-white/60 uppercase">Section Génie Civil • 3 classes sans prof principal</p>
                      </div>
                      <div className="p-4 bg-white/10 rounded-2xl border border-white/10">
                        <p className="text-xs font-bold mb-1">Chevauchement horaire</p>
                        <p className="text-[10px] text-white/60 uppercase">Salle B12 • Lundi 08:00 - 10:00</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : activeTab === 'assignments' ? (
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
          ) : activeTab === 'schedules' ? (
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
                      <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Générateur d'emplois du temps</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase italic">Statut: Validé • Année 2024-2025</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-2">
                    <button className="px-6 py-3 bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest border border-black/5 dark:border-white/10">
                      Configuration
                    </button>
                    <button className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20">
                      Nouveau Tableau
                    </button>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 {classes.map(cls => (
                   <button 
                     key={cls.id}
                     className="glass p-6 rounded-[2rem] bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 hover:border-emerald-500/30 transition-all text-left flex flex-col justify-between group"
                   >
                     <div>
                       <div className="flex justify-between items-start mb-4">
                          <h4 className="text-xl font-black text-slate-900 dark:text-white font-display mb-1">{cls.name}</h4>
                          <span className="h-3 w-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20" title="Actif" />
                       </div>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 italic">{cls.field}</p>
                     </div>
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Clock size={12} />
                          <span className="text-[10px] font-bold">28h réelles</span>
                        </div>
                        <ChevronRight className="text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" size={16} />
                     </div>
                   </button>
                 ))}
              </div>

              <div className="glass p-12 rounded-[3.5rem] bg-slate-900 text-white text-center flex flex-col items-center border border-white/5">
                 <div className="h-20 w-20 bg-white/10 rounded-3xl flex items-center justify-center mb-8 rotate-3 shadow-2xl border border-white/20">
                   <Clock className="text-emerald-400" size={40} />
                 </div>
                 <h3 className="text-2xl font-black font-display mb-4 lowercase">Visualisation globale de l'occupation</h3>
                 <p className="max-w-md text-sm text-white/40 mb-10 leading-relaxed font-medium">L'outil de visualisation matricielle vous permet de détecter les conflits de salles et de professeurs en temps réel.</p>
                 <button className="px-12 py-5 bg-white text-slate-900 rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] hover:bg-emerald-400 hover:text-white transition-all shadow-2xl">
                   Ouvrir la matrice de planification
                 </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
};
