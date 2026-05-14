
import React from 'react';
import { 
  X, Briefcase, FileText, Send, Mail, PieChart, 
  ArrowRight, ShieldCheck, Download, ExternalLink,
  MessageSquare, User, Landmark, FileCheck
} from 'lucide-react';
import { SchoolClass, Student, Teacher, SchoolEvent, InventoryItem, User as Staff, MediaFile, PrivateMail } from './types';
import { PrivateMailbox } from './PrivateMailbox';
import { FinanceModule } from './FinanceModule';
import { CertificateModule } from './CertificateModule';

interface IntendantModuleProps {
  onClose: () => void;
  onOpenInventory: () => void;
  onOpenMedia: () => void;
  classes: SchoolClass[];
  students: Student[];
  teachers: Teacher[];
  allStaff: Staff[];
  mediaFiles: MediaFile[];
  userName?: string;
  currentUser: Staff;
}

export const IntendantModule: React.FC<IntendantModuleProps> = ({ 
  onClose, 
  onOpenInventory,
  onOpenMedia,
  classes, 
  students, 
  teachers, 
  allStaff,
  mediaFiles,
  userName,
  currentUser
}) => {
  const [activeView, setActiveView] = React.useState<'dashboard' | 'reports'>('dashboard');
  const [showMailbox, setShowMailbox] = React.useState(false);
  const [mailboxTarget, setMailboxTarget] = React.useState<Staff | null>(null);
  const [isFinanceOpen, setIsFinanceOpen] = React.useState(false);
  const [isCertificatesOpen, setIsCertificatesOpen] = React.useState(false);

  const proviseur = allStaff.find(s => s.role === 'PROVISEUR');
  const comptableMatiere = allStaff.find(s => s.role === 'COMPTABLE_MATIERE');

  const openMailbox = (target: Staff | null = null) => {
    setMailboxTarget(target || currentUser);
    setShowMailbox(true);
  };

  return (
    <div className="fixed inset-0 z-[500] bg-slate-950 flex flex-col md:flex-row animate-in fade-in duration-300">
      {/* Sidebar navigation */}
      <div className="w-full md:w-80 bg-slate-900/50 backdrop-blur-xl border-r border-white/5 p-8 flex flex-col shrink-0">
        <div className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
              <Briefcase className="text-emerald-500" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase text-white leading-none">Intendance</h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Espace de Gestion</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-white/5 rounded-2xl text-slate-400 hover:text-white transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-2 flex-1">
          <button 
            onClick={() => setActiveView('dashboard')}
            className={`w-full flex items-center gap-4 p-5 rounded-[2rem] transition-all group ${activeView === 'dashboard' ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-600/20' : 'text-slate-400 hover:bg-white/5'}`}
          >
            <PieChart size={20} />
            <span className="text-xs font-black uppercase tracking-wider">Tableau de bord</span>
            <ArrowRight size={14} className={`ml-auto transition-transform ${activeView === 'dashboard' ? 'translate-x-0' : '-translate-x-2 opacity-0'}`} />
          </button>

          <button 
            onClick={() => setIsFinanceOpen(true)}
            className="w-full flex items-center gap-4 p-5 rounded-[2rem] text-slate-400 hover:bg-white/5 transition-all text-left"
          >
            <Landmark size={20} className="text-emerald-500" />
            <span className="text-xs font-black uppercase tracking-wider">Trésorerie</span>
          </button>

          <button 
            onClick={() => setIsCertificatesOpen(true)}
            className="w-full flex items-center gap-4 p-5 rounded-[2rem] text-slate-400 hover:bg-white/5 transition-all text-left"
          >
            <FileCheck size={20} className="text-indigo-400" />
            <span className="text-xs font-black uppercase tracking-wider">Certificats</span>
          </button>

          <button 
            onClick={() => setActiveView('reports')}
            className={`w-full flex items-center gap-4 p-5 rounded-[2rem] transition-all group ${activeView === 'reports' ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-600/20' : 'text-slate-400 hover:bg-white/5'}`}
          >
            <FileText size={20} />
            <span className="text-xs font-black uppercase tracking-wider">Mes Rapports</span>
          </button>

          <button 
            onClick={onOpenInventory}
            className="w-full flex items-center gap-4 p-5 rounded-[2rem] text-slate-400 hover:bg-white/5 transition-all text-left"
          >
            <Briefcase size={20} />
            <span className="text-xs font-black uppercase tracking-wider">Inventaire</span>
          </button>

          <button 
            onClick={onOpenMedia}
            className="w-full flex items-center gap-4 p-5 rounded-[2rem] text-slate-400 hover:bg-white/5 transition-all text-left"
          >
            <ShieldCheck size={20} />
            <span className="text-xs font-black uppercase tracking-wider">Médiathèque</span>
          </button>
        </div>


        <div className="pt-8 border-t border-white/5">
          <div className="bg-slate-800/40 rounded-3xl p-6 border border-white/5">
             <div className="flex items-center gap-4 mb-4">
                <div className="h-10 w-10 bg-indigo-500 rounded-xl flex items-center justify-center font-black text-white shadow-lg">
                   {(userName || "I")[0]}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-white truncate max-w-[120px]">{userName}</p>
                  <p className="text-[8px] font-bold text-slate-500 uppercase">Intendant LTP</p>
                </div>
             </div>
             <button 
              onClick={() => openMailbox()} 
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
             >
               <Mail size={16} /> Courrier Privé
             </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto bg-slate-950 p-8 md:p-12 custom-scrollbar">
        <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
           {activeView === 'dashboard' ? (
             <div className="space-y-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div>
                    <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">Gestion<br/><span className="text-emerald-500">Intendance</span></h1>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-4 ml-1">Lycée Technique et Professionnel de Fatick</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                   <div className="glass p-8 rounded-[3rem] border border-white/5 space-y-4 hover:bg-white/5 transition-all cursor-pointer group" onClick={() => setIsFinanceOpen(true)}>
                      <div className="h-12 w-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                        <Landmark size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Trésorerie</p>
                        <p className="text-3xl font-black text-white mt-1">Paye</p>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">Suivi des encaissements et reliquats scolarité.</p>
                   </div>

                   <div className="glass p-8 rounded-[3rem] border border-white/5 space-y-4 hover:bg-white/5 transition-all cursor-pointer group" onClick={() => setIsCertificatesOpen(true)}>
                      <div className="h-12 w-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                        <FileCheck size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Certificats</p>
                        <p className="text-3xl font-black text-white mt-1">Titres</p>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">Génération de documents sécurisés avec QR Code.</p>
                   </div>

                   <div className="glass p-8 rounded-[3rem] border border-white/5 space-y-4">
                      <div className="h-12 w-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400">
                        <Briefcase size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Patrimoine</p>
                        <p className="text-3xl font-black text-white mt-1">Matériel</p>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">Gestion des immobilisations et consommables.</p>
                   </div>

                   <div className="glass p-8 rounded-[3rem] border border-white/5 space-y-4">
                      <div className="h-12 w-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400">
                        <MessageSquare size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Liaison</p>
                        <p className="text-3xl font-black text-white mt-1">Direction</p>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">Communication directe avec les services.</p>
                   </div>
                </div>

                <div className="space-y-6">
                   <h3 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-3">
                     <FileText size={18} className="text-emerald-500" /> Documents de Gestion
                   </h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {mediaFiles.filter(f => f.category === 'ADMINISTRATION').slice(0, 6).map(file => (
                        <div key={file.id} className="glass p-5 rounded-3xl border border-white/5 hover:bg-white/5 transition-all flex items-center justify-between group">
                           <div className="flex items-center gap-4">
                              <div className="h-10 w-10 bg-white/5 rounded-xl flex items-center justify-center text-emerald-400">
                                <FileText size={20} />
                              </div>
                              <div className="truncate max-w-[150px]">
                                <p className="text-[10px] font-black uppercase text-white truncate">{file.name}</p>
                                <p className="text-[8px] font-bold text-slate-500 uppercase">{new Date(file.date).toLocaleDateString()}</p>
                              </div>
                           </div>
                           <a href={file.url} target="_blank" rel="noopener noreferrer" className="p-2 opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-600 rounded-lg text-white">
                              <ExternalLink size={14} />
                           </a>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
           ) : (
             <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                   <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Transmission de <span className="text-emerald-500">Rapports</span></h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="glass p-10 rounded-[3rem] border border-white/5 space-y-6">
                      <div className="h-16 w-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400">
                        <User size={32} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black uppercase text-white">Le Proviseur</h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Rapport de gestion global</p>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed font-medium">Envoyez vos rapports d'activités, bilans financiers et notes de service au Proviseur via le courrier sécurisé.</p>
                      {proviseur ? (
                        <button 
                          onClick={() => openMailbox(proviseur)}
                          className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                        >
                          <Send size={16} /> Envoyer au Proviseur
                        </button>
                      ) : (
                        <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl text-[9px] font-bold text-rose-500 uppercase text-center">Proviseur non configuré</div>
                      )}
                   </div>

                   <div className="glass p-10 rounded-[3rem] border border-white/5 space-y-6">
                      <div className="h-16 w-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400">
                        <Briefcase size={32} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black uppercase text-white">Comptable Matière</h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Suivi du matériel</p>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed font-medium">Transmettez les états de stock, les besoins en matériel et les inventaires au comptable matière.</p>
                      {comptableMatiere ? (
                        <button 
                          onClick={() => openMailbox(comptableMatiere)}
                          className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                        >
                          <Send size={16} /> Envoyer au Comptable
                        </button>
                      ) : (
                        <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl text-[9px] font-bold text-rose-500 uppercase text-center">Comptable non configuré</div>
                      )}
                   </div>
                </div>

                <div className="glass p-8 rounded-[3rem] border border-white/5">
                   <div className="flex items-center gap-4 mb-6">
                      <div className="h-10 w-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
                        <Download size={20} />
                      </div>
                      <h4 className="text-xs font-black uppercase text-white tracking-widest">Derniers exports de gestion</h4>
                   </div>
                   <div className="space-y-2">
                      <p className="text-[10px] text-slate-500 font-bold uppercase italic text-center py-10 opacity-30 tracking-widest">Historique des exports vide</p>
                   </div>
                </div>
             </div>
           )}
        </div>
      </div>

      {showMailbox && (
        <PrivateMailbox targetUser={mailboxTarget || currentUser} onClose={() => setShowMailbox(false)} />
      )}

      {isFinanceOpen && (
        <FinanceModule 
          onClose={() => setIsFinanceOpen(false)} 
          students={students} 
          classes={classes} 
          currentUser={{ id: currentUser.id, name: currentUser.name, role: currentUser.role }} 
        />
      )}

      {isCertificatesOpen && (
        <CertificateModule 
          onClose={() => setIsCertificatesOpen(false)} 
          students={students} 
          classes={classes} 
          currentUser={{ id: currentUser.id, name: currentUser.name, role: currentUser.role }} 
        />
      )}
    </div>
  );
};
