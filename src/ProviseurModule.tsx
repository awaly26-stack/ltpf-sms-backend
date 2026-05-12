import React, { useState, useMemo } from 'react';
import { 
  BarChart3, Users, BookOpen, GraduationCap, 
  FileText, Bell, Shield, ArrowLeft, Search, ChevronRight,
  TrendingUp, AlertTriangle, CheckCircle2,
  PieChart, Calendar, Briefcase, Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SchoolClass, Student, Teacher, SchoolEvent, InventoryItem, User, MediaFile } from './types';

interface ProviseurModuleProps {
  onClose: () => void;
  classes: SchoolClass[];
  students: Student[];
  teachers: Teacher[];
  events: SchoolEvent[];
  inventory: InventoryItem[];
  allStaff: User[];
  mediaFiles: MediaFile[];
  userName?: string;
}

export const ProviseurModule: React.FC<ProviseurModuleProps> = ({ 
  onClose, classes, students, teachers, events, inventory, allStaff, mediaFiles, userName 
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'analytics'>('overview');

  const incomingReports = useMemo(() => {
    return mediaFiles.filter(m => m.category === 'RAPPORT');
  }, [mediaFiles]);

  const stats = [
    { label: 'Effectif Global', val: students.length.toString(), icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Corps Enseignant', val: teachers.length.toString(), icon: GraduationCap, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Personnel Admin', val: allStaff.length.toString(), icon: Shield, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Événements', val: events.length.toString(), icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  const reports = [
    { from: 'ADMIN LTP', title: 'Rapport technique mensuel', date: 'Aujourd\'hui', priority: 'Haute' },
    { from: 'DE', title: 'Affectations du 2nd semestre', date: 'Hier', priority: 'Moyenne' },
    { from: 'Chef des Travaux', title: 'Inventaire ateliers - Mai', date: '10 Mai', priority: 'Normale' },
    { from: 'Surveillant Général', title: 'Bilan absences hebdomadaire', date: '09 Mai', priority: 'Haute' },
  ];

  return (
    <div className="fixed inset-0 z-[700] bg-slate-50 dark:bg-slate-950 flex flex-col font-sans overflow-hidden">
      {/* HEADER */}
      <div className="bg-white dark:bg-slate-900 border-b border-black/5 dark:border-white/5 px-8 py-6 shrink-0 z-10 shadow-sm">
        <div className="flex items-center justify-between mx-auto max-w-7xl">
          <div className="flex items-center gap-6">
            <button 
              onClick={activeTab === 'overview' ? onClose : () => setActiveTab('overview')} 
              className="p-3 bg-slate-100 dark:bg-white/5 rounded-2xl text-slate-500 hover:text-indigo-600 transition-all"
            >
              <ArrowLeft className={activeTab === 'overview' ? 'rotate-90' : ''} size={20} />
            </button>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white font-display tracking-tight uppercase">Cabinet du Proviseur</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Haute Direction • {userName}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">
               <FileText size={14} /> Rapports Stratégiques
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
              {/* STATS */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {stats.map((s, i) => (
                  <div key={i} className="glass p-6 rounded-3xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 shadow-sm">
                    <div className={`h-12 w-12 ${s.bg} ${s.color} rounded-2xl flex items-center justify-center mb-4`}>
                      <s.icon size={24} />
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white font-display mb-1">{s.val}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* REPORTS FEED */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="glass p-8 rounded-[2.5rem] bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xl font-black text-slate-900 dark:text-white font-display lowercase flex items-center gap-3">
                        <Bell className="text-amber-500" /> Flux de décisions
                      </h3>
                      <button 
                        onClick={() => setActiveTab('reports')}
                        className="text-[10px] font-black text-indigo-600 uppercase tracking-widest"
                      >
                        Tout voir →
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {incomingReports.slice(0, 5).map((report, i) => (
                        <a key={report.id} href={report.url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-black/5 dark:border-white/5 group hover:border-indigo-500/30 transition-all cursor-pointer">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 btn-indigo rounded-xl flex items-center justify-center text-white">
                              <FileText size={20} />
                            </div>
                            <div>
                              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase mb-0.5">{report.name}</h4>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">De: {report.senderName} • {new Date(report.date).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <ChevronRight size={20} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                        </a>
                      ))}
                      {incomingReports.length === 0 && (
                        <div className="py-10 text-center opacity-30">
                           <FileText className="mx-auto mb-2" />
                           <p className="text-[10px] font-black uppercase">Aucun rapport reçu</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* KPI SIDEBAR */}
                <div className="space-y-6">
                  <div className="glass p-8 rounded-[2.5rem] bg-slate-900 text-white shadow-2xl">
                    <TrendingUp className="text-emerald-400 mb-6" size={32} />
                    <h3 className="text-xl font-black font-display mb-2">Performance Globale</h3>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest mb-8">Taux de présence enseignants</p>
                    <div className="relative h-4 w-full bg-white/10 rounded-full overflow-hidden mb-4">
                       <div className="absolute inset-0 bg-emerald-500 w-[94%]" />
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                       <span>Objectif: 90%</span>
                       <span className="text-emerald-400">Actuel: 94%</span>
                    </div>
                  </div>

                  <div className="glass p-8 rounded-[2.5rem] bg-white dark:bg-white/5 border border-black/5 dark:border-white/5">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Prochains Événements</h4>
                    <div className="space-y-6">
                       {events.slice(0, 3).map((e, i) => (
                         <div key={i} className="flex gap-4">
                           <div className="h-10 w-10 shrink-0 bg-indigo-50 dark:bg-white/5 rounded-xl flex flex-col items-center justify-center border border-black/5">
                             <span className="text-[10px] font-black text-indigo-600">{new Date(e.date).getDate()}</span>
                             <span className="text-[8px] font-bold text-slate-400 uppercase">{new Date(e.date).toLocaleString('default', { month: 'short' })}</span>
                           </div>
                           <div>
                             <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight mb-1">{e.title}</p>
                             <p className="text-[8px] font-bold text-slate-400 uppercase">{e.location}</p>
                           </div>
                         </div>
                       ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : activeTab === 'reports' ? (
            <motion.div
              key="reports"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {['ADMIN LTP', 'Directeur des Études', 'Chef des Travaux', 'Surveillant Général'].map((sender, i) => (
                  <button key={i} className="glass p-8 rounded-[2.5rem] bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 text-left hover:border-indigo-500/30 transition-all group">
                     <div className="h-12 w-12 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-6 text-slate-500 group-hover:text-indigo-600 transition-colors">
                       <Briefcase size={24} />
                     </div>
                     <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase mb-1">{sender}</h4>
                     <p className="text-[10px] font-bold text-slate-400 uppercase">3 rapports en attente</p>
                  </button>
                ))}
              </div>

              <div className="bg-white dark:bg-white/5 rounded-[2.5rem] border border-black/5 dark:border-white/10 overflow-hidden shadow-xl">
                 <table className="w-full">
                    <thead>
                       <tr className="bg-slate-50 dark:bg-white/5">
                          <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Rapport</th>
                          <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Source</th>
                          <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                          <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Priorité</th>
                          <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 dark:divide-white/5">
                       {incomingReports.map((r, i) => (
                         <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                            <td className="px-8 py-6 font-bold text-slate-900 dark:text-white text-sm">{r.name}</td>
                            <td className="px-8 py-6 text-xs text-slate-400 font-bold uppercase">{r.senderRole} - {r.senderName}</td>
                            <td className="px-8 py-6 text-xs text-slate-400 font-bold uppercase">{new Date(r.date).toLocaleDateString()}</td>
                            <td className="px-8 py-6">
                               <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[8px] font-black uppercase tracking-widest">
                                 {r.type}
                               </span>
                            </td>
                            <td className="px-8 py-6 text-right">
                               <a href={r.url} target="_blank" rel="noreferrer" className="h-8 w-8 bg-indigo-600 text-white rounded-lg inline-flex items-center justify-center hover:scale-110 transition-transform shadow-lg shadow-indigo-500/20">
                                 <Search size={14} />
                               </a>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
};
