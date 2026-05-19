import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart3, Users, BookOpen, GraduationCap, 
  FileText, Bell, Shield, ArrowLeft, Search, ChevronRight,
  TrendingUp, AlertTriangle, CheckCircle2,
  PieChart, Calendar, Briefcase, Settings, Landmark,
  Package, Activity, Wallet, FileCheck, ExternalLink,
  Lock, Download,
  Stamp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from "jspdf";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { SchoolClass, Student, Teacher, SchoolEvent, InventoryItem, User, MediaFile, Payment, IssuedCertificate } from './types';
import { db } from './firebaseConfig';
import { CertificateModule } from './CertificateModule';

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
  currentUser: User;
  onOpenInventory?: () => void;
  onOpenSurveillance: () => void;
}

export const ProviseurModule: React.FC<ProviseurModuleProps> = ({ 
  onClose, classes, students, teachers, events, inventory, allStaff, mediaFiles, userName,onOpenInventory, currentUser, onOpenSurveillance
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'budget' | 'performance' | 'certificates'>('overview');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSignModal, setShowSignModal] = useState<string | null>(null);
  const [isCertificatesOpen, setIsCertificatesOpen] = useState(false);
  const [selectedSender, setSelectedSender] = useState<string | null>(null);

  useEffect(() => {
    const unsubPayments = db.collection('payments')
      .orderBy('date', 'desc')
      .onSnapshot((snapshot) => {
        setPayments(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Payment)));
      });

    const unsubReports = db.collection('reports')
      .orderBy('date', 'desc')
      .onSnapshot((snapshot) => {
        setReports(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      });

    return () => {
      unsubPayments();
      unsubReports();
    };
  }, []);

  const handleSignReport = async (reportId: string) => {
    try {
      const signatureId = `SIG-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      await db.collection('reports').doc(reportId).update({
        status: 'APPROVED',
        signedAt: new Date().toISOString(),
        signatureId,
        signedBy: userName || 'Le Proviseur'
      });
      setShowSignModal(null);
    } catch (e) {
      alert("Erreur lors de la signature.");
    }
  };

  const incomingReports = useMemo(() => {
    return mediaFiles.filter(m => m.category === 'RAPPORT');
  }, [mediaFiles]);

  const financialStats = useMemo(() => {
    const total = payments.reduce((sum, p) => sum + p.amount, 0);
    const pending = payments.reduce((sum, p) => sum + (p.totalDue - p.amount), 0);
    return { total, pending };
  }, [payments]);

  const stats = [
    { label: 'Effectif Global', val: students.length.toString(), icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Corps Enseignant', val: teachers.length.toString(), icon: GraduationCap, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Ressources (Immo)', val: inventory.length.toString(), icon: Package, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Occupation Salles', val: 'Surveillance', icon: Activity, color: 'text-rose-600', bg: 'bg-rose-50', action: onOpenSurveillance },
    { label: 'Budget Recouvré', val: financialStats.total.toLocaleString() + ' F', icon: Landmark, color: 'text-amber-600', bg: 'bg-amber-50' },
    {
  label: 'Inventaire Central',
  val: 'Ouvrir',
  icon: Package,
  color: 'text-cyan-600',
  bg: 'bg-cyan-50',
  action: onOpenInventory
},
{
  label: 'Certifications',
  val: 'Ouvrir',
  icon: FileCheck,
  color: 'text-violet-600',
  bg: 'bg-violet-50',
  action: () => setActiveTab('certificates')
},
  ];

 const handleExportFinance = () => {
  const rows = payments.map((p) => ({
    Élève: p.studentName,
    Référence: p.reference,
    Type: p.type,
    Montant: p.amount,
    Statut: p.status,
    Date: new Date(p.date).toLocaleDateString(),
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    'Finances'
  );

  const excelBuffer = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
  });

  const data = new Blob(
    [excelBuffer],
    {
      type:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    }
  );

  saveAs(
    data,
    `Finances_${new Date().toISOString()}.xlsx`
  );
};



const downloadReport = (report: any) => {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text(report.title, 20, 20);

  doc.setFontSize(12);
  doc.text(report.content || "Aucun contenu", 20, 40, {
    maxWidth: 170
  });

  doc.save(`${report.title}.pdf`);
};




const handleOpenSenderReports = (sender: string) => {
  setSelectedSender(sender);
  setActiveTab('reports');
};;

const handleOpenEvent = (event: SchoolEvent) => {
  alert(`Événement : ${event.title}`);
};
if (loading) {
  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center text-white">
      <div className="space-y-4 text-center">
        <Activity className="animate-pulse mx-auto text-indigo-500" size={40} />
        <p className="text-xs font-black uppercase tracking-widest">
          Chargement du Cabinet du Proviseur...
        </p>
      </div>
    </div>
  );
}
  return (
    <div className="fixed inset-0 z-[700] bg-slate-50 dark:bg-slate-950 flex flex-col font-sans overflow-hidden">
      {/* HEADER */}
      <div className="bg-white dark:bg-slate-900 border-b border-black/5 dark:border-white/5 px-8 pt-8 pb-0 shrink-0 z-10 shadow-sm">
        <div className="flex items-center justify-between mx-auto max-w-7xl mb-6">
          <div className="flex items-center gap-6">
            <button 
              onClick={activeTab === 'overview' ? onClose : () => setActiveTab('overview')} 
              className="p-3 bg-slate-100 dark:bg-white/5 rounded-2xl text-slate-500 hover:text-indigo-600 transition-all shadow-sm"
            >
              <ArrowLeft className={activeTab === 'overview' ? '' : ''} size={20} />
            </button>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white font-display tracking-tight uppercase">Cabinet du Proviseur</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                <Shield className="text-indigo-500" size={10} /> Haute Direction • {userName}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="hidden md:flex items-center gap-4 bg-slate-100 dark:bg-white/5 px-6 py-3 rounded-2xl border border-black/5">
                <Activity size={16} className="text-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">Système Opérationnel</span>
             </div>
             <button 
             onClick={() => setActiveTab('reports')}
             className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-black/10">
               <Stamp size={14} /> Signature Numérique
             </button>
          </div>
        </div>

        {/* TOP NAV */}
        <div className="flex gap-8 mx-auto max-w-7xl overflow-x-auto no-scrollbar">
           {[
             { id: 'overview', label: 'Vue d\'ensemble', icon: PieChart },
             { id: 'budget', label: 'Budget & Finance', icon: Wallet },
             { id: 'performance', label: 'KPI & Performance', icon: Activity },
             { id: 'reports', label: 'Rapports & Archives', icon: FileText },
             { id: 'certificates', label: 'Certificats', icon: FileCheck }
           ].map(tab => (
             <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-4 px-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] border-b-2 transition-all ${activeTab === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
             >
               <tab.icon size={14} />
               {tab.label}
             </button>
           ))}
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
              className="space-y-10"
            >
              {/* STATS */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {stats.map((s, i) => (
                  <div key={i} onClick={(s as any).action} className={`glass group p-6 rounded-[2.5rem] bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 shadow-sm hover:shadow-xl transition-all ${(s as any).action ? 'cursor-pointer' : ''}`}>
                    <div className={`h-12 w-12 ${s.bg} ${s.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                      <s.icon size={24} />
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white font-display mb-1">{s.val}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* DECISION FLOW */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="glass p-8 rounded-[3rem] bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white font-display lowercase flex items-center gap-3">
                          <Bell className="text-amber-500" /> Flux de décisions
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Actions requérant votre approbation</p>
                      </div>
                      <button 
                        onClick={() => setActiveTab('reports')}
                        className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-4 py-2 rounded-xl"
                      >
                        Archives →
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {reports.filter(r => r.status === 'PENDING').slice(0, 5).map((report) => (
                        <div key={report.id} className="flex items-center justify-between p-6 bg-slate-50 dark:bg-white/10 rounded-3xl border border-black/5 dark:border-white/5 group hover:border-indigo-500/30 transition-all">
                          <div className="flex items-center gap-5">
                            <div className="h-12 w-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform">
                              <FileText size={24} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase leading-none">{report.title}</h4>
                                <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase ${report.type === 'TECHNIQUE' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>{report.type}</span>
                              </div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">
                                <span className="text-indigo-500">{report.authorRole}</span> • {report.author} • {new Date(report.date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                             <button 
                              onClick={() => setShowSignModal(report.id)}
                              className="px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-emerald-600 transition-all shadow-lg flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                             >
                               <Stamp size={16} /> Signer
                             </button>
                          </div>
                        </div>
                      ))}
                      {reports.filter(r => r.status === 'PENDING').length === 0 && (
                        <div className="py-20 text-center opacity-30 bg-slate-50 dark:bg-white/5 rounded-3xl border-2 border-dashed border-slate-200 dark:border-white/10">
                           <FileCheck size={48} className="mx-auto mb-4 text-slate-300" />
                           <p className="text-[10px] font-black uppercase tracking-widest">Aucune décision majeure en attente</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* QUICK INSIGHTS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass p-8 rounded-[3rem] bg-indigo-600 text-white shadow-2xl relative overflow-hidden group">
                      <TrendingUp className="text-white/20 absolute -right-4 -bottom-4 rotate-12 transition-transform group-hover:scale-110" size={120} />
                      <div className="relative z-10 space-y-6">
                         <div className="flex justify-between items-start">
                            <h4 className="text-sm font-black uppercase tracking-wide">Assiduité<br/>Élèves</h4>
                            <span className="text-2xl font-black">94%</span>
                         </div>
                         <div className="space-y-2">
                            <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                               <div className="h-full bg-white w-[94%]" />
                            </div>
                            <p className="text-[8px] font-bold uppercase opacity-60">+2% vs mois dernier</p>
                         </div>
                      </div>
                    </div>
                    <div className="glass p-8 rounded-[3rem] bg-emerald-600 text-white shadow-2xl relative overflow-hidden group">
                      <Landmark className="text-white/20 absolute -right-4 -bottom-4 -rotate-12 transition-transform group-hover:scale-110" size={120} />
                      <div className="relative z-10 space-y-6">
                         <div className="flex justify-between items-start">
                            <h4 className="text-sm font-black uppercase tracking-wide">Budget<br/>Recouvré</h4>
                            <span className="text-2xl font-black">88%</span>
                         </div>
                         <div className="space-y-2">
                            <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                               <div className="h-full bg-white w-[88%]" />
                            </div>
                            <p className="text-[8px] font-bold uppercase opacity-60">Objectif: 95% fin Mai</p>
                         </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* KPI SIDEBAR */}
                <div className="space-y-6">
                  {/* CALENDAR MINI */}
                  <div className="glass p-8 rounded-[3rem] bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 shadow-sm">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center justify-between">
                       Calendrier VIP <Calendar size={14} className="text-indigo-500" />
                    </h4>
                    <div className="space-y-6">
                       {events.filter(e => e.type === 'PROVISEUR' || e.isUrgent).slice(0, 3).map((e, i) => (
                         <div key={i} 
                          onClick={() => handleOpenEvent(e)}
                         className="flex gap-4 group cursor-pointer">
                           <div className="h-10 w-10 shrink-0 bg-slate-100 dark:bg-white/10 rounded-xl flex flex-col items-center justify-center border border-black/5 group-hover:border-indigo-500/50 transition-all">
                             <span className="text-[10px] font-black text-indigo-600">{new Date(e.date).getDate()}</span>
                             <span className="text-[8px] font-bold text-slate-400 uppercase">{new Date(e.date).toLocaleString('default', { month: 'short' })}</span>
                           </div>
                           <div className="flex-1">
                             <p className="text-xs font-black text-slate-900 dark:text-white leading-tight mb-1 group-hover:text-indigo-600 transition-colors">{e.title}</p>
                             <p className="text-[8px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                {e.isUrgent && <AlertTriangle size={8} className="text-rose-500" />} {e.type}
                             </p>
                           </div>
                         </div>
                       ))}
                       {events.filter(e => e.type === 'PROVISEUR' || e.isUrgent).length === 0 && (
                         <p className="text-[8px] font-bold text-slate-400 uppercase italic text-center py-4">Agenda dégagé</p>
                       )}
                    </div>
                  </div>

                  {/* STAFF HEALTH */}
                  <div className="glass p-8 rounded-[3rem] bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 shadow-sm space-y-6">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-between">
                       Disponibilité Staff <Users size={14} className="text-emerald-500" />
                    </h4>
                    <div className="space-y-5">
                       <div className="flex justify-between items-end">
                          <span className="text-[9px] font-black text-slate-600 uppercase">Professeurs</span>
                          <span className="text-sm font-black text-slate-900 dark:text-white">{teachers.filter(t => t.isPresent).length}/{teachers.length}</span>
                       </div>
                       <div className="h-1.5 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${(teachers.filter(t => t.isPresent).length / (teachers.length || 1)) * 100}%` }} />
                       </div>

                       <div className="flex justify-between items-end">
                          <span className="text-[9px] font-black text-slate-600 uppercase">Administration</span>
                          <span className="text-sm font-black text-slate-900 dark:text-white">{allStaff.length} Actifs</span>
                       </div>
                       <div className="h-1.5 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 w-[100%]" />
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : activeTab === 'budget' ? (
            <motion.div
              key="budget"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="glass p-8 rounded-[3rem] bg-white dark:bg-white/5 border border-black/5 dark:border-white/5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Total Recouvré</p>
                    <div className="flex items-baseline gap-2">
                       <h3 className="text-4xl font-black text-emerald-600 font-display">{financialStats.total.toLocaleString()}</h3>
                       <span className="text-xs font-black text-slate-400">FCFA</span>
                    </div>
                 </div>
                 <div className="glass p-8 rounded-[3rem] bg-white dark:bg-white/5 border border-black/5 dark:border-white/5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">En Attente (Reliquats)</p>
                    <div className="flex items-baseline gap-2">
                       <h3 className="text-4xl font-black text-amber-500 font-display">{financialStats.pending.toLocaleString()}</h3>
                       <span className="text-xs font-black text-slate-400">FCFA</span>
                    </div>
                 </div>
                 <div className="glass p-8 rounded-[3rem] bg-white dark:bg-white/5 border border-black/5 dark:border-white/5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Prévisionnel Global</p>
                    <div className="flex items-baseline gap-2">
                       <h3 className="text-4xl font-black text-slate-900 dark:text-white font-display">{(financialStats.total + financialStats.pending).toLocaleString()}</h3>
                       <span className="text-xs font-black text-slate-400">FCFA</span>
                    </div>
                 </div>
              </div>

              <div className="glass p-10 rounded-[3rem] bg-white dark:bg-white/5 border border-black/5 dark:border-white/5">
                 <div className="flex items-center justify-between mb-10">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white font-display lowercase flex items-center gap-3">
                       <Activity className="text-indigo-600" /> Historique Financier
                    </h3>
                    <div className="flex gap-2">
                       <button 
                       onClick={handleExportFinance}
                       className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[8px] font-black uppercase tracking-widest flex items-center gap-2">
                          <ExternalLink size={14} /> Export XLS
                       </button>
                    </div>
                 </div>

                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead>
                          <tr className="border-b border-black/5">
                             <th className="pb-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Élève</th>
                             <th className="pb-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nature</th>
                             <th className="pb-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Montant</th>
                             <th className="pb-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                             <th className="pb-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Statut</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-black/5">
                          {payments.slice(0, 10).map((p) => (
                            <tr key={p.id} className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                               <td className="py-5">
                                  <p className="text-xs font-black text-slate-900 dark:text-white uppercase">{p.studentName}</p>
                                  <p className="text-[8px] font-black text-indigo-500 uppercase">{p.reference}</p>
                               </td>
                               <td className="py-5">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase">{p.type}</span>
                               </td>
                               <td className="py-5">
                                  <p className="text-xs font-black text-slate-900 dark:text-white">{p.amount.toLocaleString()} F</p>
                               </td>
                               <td className="py-5">
                                  <p className="text-[9px] font-bold text-slate-400 uppercase">{new Date(p.date).toLocaleDateString()}</p>
                               </td>
                               <td className="py-5 text-right">
                                  <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${p.status === 'COMPLETE' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                                     {p.status}
                                  </span>
                               </td>
                            </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
            </motion.div>
          ) : activeTab === 'performance' ? (
            <motion.div
              key="performance"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-10"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="glass p-10 rounded-[3rem] bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 shadow-sm space-y-8">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white font-display lowercase flex items-center gap-3">
                       <GraduationCap className="text-indigo-600" /> Taux de Réussite Prévisionnel
                    </h3>
                    <div className="space-y-6">
                       {classes.slice(0, 5).map((cls, i) => (
                         <div key={i} className="space-y-2">
                            <div className="flex justify-between items-end">
                               <span className="text-[10px] font-black text-slate-700 dark:text-white uppercase">{cls.name}</span>
                               <span className="text-xs font-black text-indigo-600">{(65 + i * 4)}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                               <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${65 + i * 4}%` }} />
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>

                 <div className="glass p-10 rounded-[3rem] bg-slate-900 text-white shadow-2xl space-y-8 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-10 opacity-5">
                       <BarChart3 size={120} />
                    </div>
                    <div className="relative z-10 space-y-8">
                       <h3 className="text-xl font-black font-display lowercase flex items-center gap-3 italic">
                          <Activity className="text-emerald-400" /> Dynamique de Croissance
                       </h3>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-2">
                             <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Nouveaux Inscrits</p>
                             <p className="text-3xl font-black">+12%</p>
                             <div className="h-1 w-full bg-white/10 rounded-full">
                                <div className="h-full bg-emerald-400 w-[70%]" />
                             </div>
                          </div>
                          <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-2">
                             <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Taux Rétention</p>
                             <p className="text-3xl font-black">98.5%</p>
                             <div className="h-1 w-full bg-white/10 rounded-full">
                                <div className="h-full bg-indigo-400 w-[95%]" />
                             </div>
                          </div>
                          <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-2">
                             <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Placement Stage</p>
                             <p className="text-3xl font-black">74%</p>
                             <div className="h-1 w-full bg-white/10 rounded-full">
                                <div className="h-full bg-amber-400 w-[74%]" />
                             </div>
                          </div>
                          <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-2">
                             <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Satisfaction Staff</p>
                             <p className="text-3xl font-black">4.2/5</p>
                             <div className="h-1 w-full bg-white/10 rounded-full">
                                <div className="h-full bg-rose-400 w-[84%]" />
                             </div>
                          </div>
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
                {['Directeur des Études', 'Chef des Travaux', 'Surveillant Général', 'Intendant'].map((sender, i) => (
                  <button
                   key={i} 
                   onClick={() => handleOpenSenderReports(sender)}
                   className="glass p-8 rounded-[2.5rem] bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 text-left hover:border-indigo-500/30 transition-all group shadow-sm hover:shadow-xl">
                     <div className="h-12 w-12 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-6 text-slate-500 group-hover:text-indigo-600 transition-colors shadow-inner">
                       <Briefcase size={24} />
                     </div>
                     <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase mb-1">{sender}</h4>
                     <p className="text-[10px] font-bold text-slate-400 uppercase">
                        {mediaFiles.filter(m => m.category === 'RAPPORT' && (m.senderRole?.includes(sender) || sender.includes(m.senderRole || ''))).length} Rapports
                     </p>
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between">
  <div>
    <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase">
      Archives Directionnelles
    </h3>

    {selectedSender && (
      <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">
        Filtre actif : {selectedSender}
      </p>
    )}
  </div>

  {selectedSender && (
    <button
      onClick={() => setSelectedSender(null)}
      className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
    >
      Réinitialiser
    </button>
  )}
</div>
              <div className="bg-white dark:bg-white/5 rounded-[3rem] border border-black/5 dark:border-white/10 overflow-hidden shadow-2xl">
                 <table className="w-full">
                    <thead>
                       <tr className="bg-slate-50 dark:bg-white/5">
                          <th className="px-10 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Archive Rapport</th>
                          <th className="px-10 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Émetteur</th>
                          <th className="px-10 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Date Émission</th>
                          <th className="px-10 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Titre Approbation</th>
                          <th className="px-10 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Intégrité</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 dark:divide-white/5">
                       {reports.filter(r => r.status === 'APPROVED').map((r) => (
                         <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                            <td className="px-10 py-6">
                               <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 btn-indigo rounded-xl flex items-center justify-center text-white">
                                     <FileText size={20} />
                                  </div>
                                  <div>
                                    <p className="text-xs font-black text-slate-900 dark:text-white uppercase">{r.title}</p>
                                    <p className="text-[8px] font-black text-indigo-500 uppercase italic">Signature : {r.signatureId}</p>
                                  </div>
                               </div>
                            </td>
                            <td className="px-10 py-6">
                               <p className="text-[10px] font-bold text-slate-500 uppercase">{r.authorRole}</p>
                               <p className="text-[9px] text-slate-400">{r.author}</p>
                            </td>
                            <td className="px-10 py-6 text-[10px] text-slate-400 font-bold uppercase">{new Date(r.date).toLocaleDateString()}</td>
                            <td className="px-10 py-6">
                               <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-2 w-fit border border-emerald-500/20">
                                 <Stamp size={10} className="text-emerald-500" /> Signé par le Proviseur
                               </span>
                            </td>
                            <td className="px-10 py-6 text-right">
                               <button
                               onClick={() => downloadReport(r)}
                                className="h-10 w-10 bg-slate-100 dark:bg-white/10 text-slate-500 rounded-xl inline-flex items-center justify-center hover:scale-110 transition-transform border border-black/5">
                                 <Download size={18} />
                               </button>
                            </td>
                         </tr>
                       ))}
                       {reports.filter(r => r.status === 'APPROVED').length === 0 && (
                         <tr>
                            <td colSpan={5} className="py-20 text-center">
                               <Lock className="mx-auto mb-4 text-slate-200" size={48} />
                               <p className="text-[10px] font-black text-slate-400 uppercase">Aucun rapport dans les archives directionnelles</p>
                            </td>
                         </tr>
                       )}
                    </tbody>
                 </table>
              </div>
            </motion.div>
          ) : activeTab === 'certificates' ? (
            <motion.div
              key="certificates"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="h-full"
            >
              <CertificateModule 
                onClose={() => setActiveTab('overview')} 
                students={students} 
                classes={classes} 
                currentUser={{ id: currentUser.id, name: currentUser.name, role: currentUser.role }} 
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
      <div className="glass p-8 rounded-[3rem] bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 shadow-sm space-y-6">
  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
    Infrastructure <Package size={14} className="text-cyan-500" />
  </h4>

  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-black uppercase text-slate-600">
        Ressources
      </span>

      <span className="text-xs font-black text-slate-900 dark:text-white">
        {inventory.length}
      </span>
    </div>

    <div className="flex items-center justify-between">
      <span className="text-[10px] font-black uppercase text-slate-600">
        Salles Actives
      </span>

      <span className="text-xs font-black text-emerald-500">
        {classes.length}
      </span>
    </div>

    <button
      onClick={onOpenInventory}
      className="w-full py-3 rounded-2xl bg-cyan-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-cyan-700 transition-all"
    >
      Ouvrir Inventaire
    </button>
  </div>
</div>

      {/* SIGNATURE MODAL Overlay (Global) */}
      <AnimatePresence>
        {showSignModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[800] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass bg-white dark:bg-slate-900 rounded-[3rem] p-10 max-w-lg w-full shadow-2xl border border-black/5"
            >
              <div className="text-center mb-8">
                <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Stamp size={32} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white font-display uppercase tracking-tight">Sceau Officiel</h3>
                <p className="text-xs text-slate-400 font-bold uppercase mt-2">Signature numérique de la Haute Direction</p>
              </div>

              <div className="bg-slate-50 dark:bg-white/5 border border-black/5 p-6 rounded-3xl mb-8">
                 <p className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest text-center">Contenu du document</p>
                 <div className="max-h-32 overflow-y-auto no-scrollbar">
                   <p className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-relaxed italic">
                     "{reports.find(r => r.id === showSignModal)?.title}"
                     <br/><br/>
                     {reports.find(r => r.id === showSignModal)?.content}
                   </p>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setShowSignModal(null)}
                  className="py-4 bg-slate-100 dark:bg-white/5 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all border border-black/5"
                >
                  Annuler
                </button>
                <button 
                  onClick={() => handleSignReport(showSignModal)}
                  className="py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
                >
                  Apposer le Sceau
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
