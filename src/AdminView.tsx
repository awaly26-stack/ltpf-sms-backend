
import React, { useMemo } from 'react';
import { 
  Shield, ShieldHalf, Plus, Layers, UserCog, Activity, UserPlus, 
  Hammer, Landmark, Gavel, Briefcase, GraduationCap, 
  ShieldCheck, Users, FileDown, ClipboardList, ChevronRight,
  PieChart, BarChart3, TrendingUp, Clock, AlertCircle, RotateCcw, UserMinus, BookOpen, Megaphone, Settings, Share2, BookMarked, Video
} from 'lucide-react';
import { User, Role, Student, Teacher, AbsenceMotif } from './types';
import { useAuth } from './AuthContext';

interface AdminViewProps {
  isSuperAdmin: boolean;
  allStaff: User[];
  students: Student[];
  teachers: Teacher[];
  onSelectStaff: (id: string) => void;
  onOpenAddStaff: () => void;
  onOpenAddStudent: () => void;
  onOpenAddTeacher: () => void;
  onOpenAddEvent: () => void;
  onOpenManageEvents: () => void;
  onOpenManageClasses: () => void;
  onOpenManageSubjects: () => void;
  onOpenInventory: () => void;
  onOpenChefTravaux: () => void;
  onOpenDirecteurEtudes: () => void;
  onOpenProviseur: () => void;
  onOpenMedia: () => void;
  onOpenExportAbsences: () => void;
  onOpenExportTeacherAbsences: () => void;
  onOpenExportWeeklyTeacherAbsences: () => void;
  onOpenManageStaff: () => void;
  onOpenManageTeachers: () => void; 
  onResetCounters?: () => void;
  onResetTeacherCounters?: () => void;
  onFixTeacherMatricules?: () => void;
 //onOpenIntendant: () => void;
  onOpenInternship: () => void;
  onOpenPedagogy: () => void;
  onOpenMeetings: () => void;
   onOpenSurveillance: () => void;
}

const ROLE_CONFIG: Record<string, { label: string, icon: any, color: string }> = {
  'ADMIN': { label: 'ADMIN LTP', icon: ShieldHalf, color: 'text-indigo-500 bg-indigo-500/10' },
  'PROVISEUR': { label: 'Proviseur', icon: Gavel, color: 'text-rose-500 bg-rose-500/10' },
  'DE': { label: 'Dir. des Études', icon: GraduationCap, color: 'text-violet-500 bg-violet-500/10' },
  'CT': { label: 'Chef des Travaux', icon: Briefcase, color: 'text-amber-500 bg-amber-500/10' },
  'SG': { label: 'Surveillant Gén.', icon: Landmark, color: 'text-emerald-500 bg-emerald-500/10' },
  'COMPTABLE_MATIERE': { label: 'Comptable Matière', icon: Hammer, color: 'text-sky-500 bg-sky-500/10' },
  // 'INTENDANT': { label: 'Intendant', icon: Briefcase, color: 'text-emerald-500 bg-emerald-500/10' },
  'SURVEILLANT': { label: 'Surveillant', icon: ShieldCheck, color: 'text-slate-400 bg-slate-400/10' }
};

export const AdminView: React.FC<AdminViewProps> = ({
   allStaff, students, teachers, onSelectStaff, onOpenAddStaff, onOpenAddStudent, onOpenAddTeacher, onOpenAddEvent, onOpenManageEvents, onOpenManageClasses, onOpenManageSubjects, onOpenInventory,onOpenChefTravaux, onOpenDirecteurEtudes, onOpenProviseur, onOpenMedia, onOpenExportAbsences, onOpenExportTeacherAbsences, onOpenExportWeeklyTeacherAbsences, onOpenManageStaff, onOpenManageTeachers, onResetCounters, onResetTeacherCounters, onFixTeacherMatricules, onOpenInternship, onOpenPedagogy, onOpenMeetings,  onOpenSurveillance
}) => {
  const { isSuperAdmin, isSG, currentUser } = useAuth();
   const isTeacher = (currentUser as any)?.role === 'PROFESSEUR';

  const topManagement = useMemo(() => {
    const roles = ['ADMIN', 'PROVISEUR', 'DE', 'CT', 'SG'];
    return allStaff.filter(s => roles.includes(s.role));
  }, [allStaff]);

  const stats = useMemo(() => {
  const totalStudents = students.length;
  const publicStudents = students.filter(s => s.sector === 'Public').length;
  const privateStudents = students.filter(s => s.sector === 'Privé').length;
  
  // Ajout du "|| 0" et protection sur absenceLogs
  const studentAbsenceTotal = students.reduce((acc, s) => acc + (s.unjustifiedAbsences || 0), 0);
  
  const studentMotifs: Record<string, number> = {};
  students.forEach(s => {
    // Protection ici : on ajoute ?. avant le filter
    s.absenceLogs?.filter(l => !l.isExported).forEach(log => {
      studentMotifs[log.motif] = (studentMotifs[log.motif] || 0) + log.hours;
    });
  });

  const totalTeachers = teachers.length;
  
  // Correction majeure ici pour les enseignants
  const teacherAbsenceTotal = teachers.reduce((acc, t) => {
    const activeAbsences = t.absenceLogs?.filter(l => !l.isExported)
                            .reduce((sum, l) => sum + l.hours, 0) || 0;
    return acc + activeAbsences;
  }, 0);
  
  const teacherMotifs: Record<string, number> = {};
  teachers.forEach(t => {
    // Protection ici aussi
    t.absenceLogs?.filter(l => !l.isExported).forEach(log => {
      teacherMotifs[log.motif] = (teacherMotifs[log.motif] || 0) + log.hours;
    });
  });

  return {
    students: { total: totalStudents, public: publicStudents, private: privateStudents, absences: studentAbsenceTotal, motifs: studentMotifs },
    teachers: { total: totalTeachers, absences: teacherAbsenceTotal, motifs: teacherMotifs }
  };
}, [students, teachers]);

  return (
    <div className="space-y-12 pb-32 animate-in slide-in-from-bottom duration-700">
      
      {/* DASHBOARD DE SUPERVISION */}
      <section className="space-y-6">
        <h4 className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.3em] px-2 flex items-center gap-2">
          <PieChart size={16} /> Dashboard de Supervision (Cycle Actif)
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass p-8 rounded-[3rem] border border-white/5 space-y-6 bg-gradient-to-br from-indigo-500/5 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white"><Users size={20} /></div>
                <h5 className="text-sm font-black uppercase text-white">Apprenants</h5>
              </div>
              <span className="text-2xl font-black text-indigo-400">{stats.students.total}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Public</p>
                <p className="text-lg font-black text-white">{stats.students.public}</p>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Privé</p>
                <p className="text-lg font-black text-white">{stats.students.private}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <p className="text-[9px] font-black text-slate-400 uppercase">Absences Actives</p>
                <p className="text-sm font-black text-rose-500">{stats.students.absences} Heures</p>
              </div>
            </div>
          </div>

           <div className="glass p-8 rounded-3xl border border-black/5 dark:border-white/5 space-y-6 bg-white dark:bg-white/5 shadow-lg relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-amber-500/10 rounded-full blur-3xl opacity-50"></div>
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-amber-600 rounded-xl flex items-center justify-center text-white shadow-md"><GraduationCap size={20} /></div>
                <h5 className="text-sm font-bold uppercase dark:text-white text-slate-800 font-display">Enseignants</h5>
              </div>
              <div className="flex items-center gap-2">
                {isSuperAdmin && onFixTeacherMatricules && (
                  <button onClick={onFixTeacherMatricules} title="Générer les matricules manquants" className="p-2 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg hover:scale-110 active:scale-95 transition-all">
                    <ShieldCheck size={14} />
                  </button>
                )}
                <span className="text-2xl font-black text-amber-500 font-display">{stats.teachers.total}</span>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-black/5 dark:border-white/5 flex items-center justify-between relative z-10">
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-display">Absences Actives</p>
                <p className="text-xl font-bold dark:text-white text-slate-900 font-display">{stats.teachers.absences} H</p>
              </div>
              <div className="flex items-center gap-2">
                <button title="Bilan Hebdomadaire" onClick={onOpenExportWeeklyTeacherAbsences} className="p-2.5 bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white rounded-xl hover:bg-slate-200 dark:hover:bg-white/20 transition-all border border-black/5 dark:border-white/5 flex items-center gap-1.5 shadow-sm">
                  <span className="text-[9px] font-bold uppercase tracking-wider font-display">Hebdo</span>
                  <FileDown size={14} />
                </button>
                <button title="Bilan Mensuel" onClick={onOpenExportTeacherAbsences} className="p-2.5 bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl hover:bg-amber-200 dark:hover:bg-amber-500/20 transition-all border border-amber-500/20 flex items-center gap-1.5 shadow-sm">
                  <span className="text-[9px] font-bold uppercase tracking-wider font-display">Mensuel</span>
                  <FileDown size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION HAUTE DIRECTION */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h4 className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.3em] flex items-center gap-2">
            <ShieldHalf size={16} /> Haute Direction LTP
          </h4>
          {(isSuperAdmin || isSG) && (
            <button onClick={onOpenAddStaff} className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg active:scale-90 transition-transform"><Plus size={16} /></button>
          )}
        </div>
        
        <div className="grid grid-cols-1 gap-4">
           {topManagement.map(staff => {
             const config = ROLE_CONFIG[staff.role] || ROLE_CONFIG['SURVEILLANT'];
             return (
               <div key={staff.id} onClick={() => onSelectStaff(staff.id)} className="glass p-6 rounded-[2.5rem] flex items-center justify-between border border-white/5 hover:bg-white/5 transition-all cursor-pointer">
                  <div className="flex items-center gap-5">
                    <div className={`h-14 w-14 rounded-2xl flex items-center justify-center font-black text-xl ${config.color}`}><config.icon size={24} /></div>
                    <div>
                      <p className="text-[9px] font-black uppercase text-slate-500 leading-none mb-1">{config.label}</p>
                      <p className="text-sm font-black uppercase dark:text-white leading-tight">{staff.name}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-600" />
               </div>
             );
           })}
        </div>
      </section>

      {/* ACTIONS ADMINISTRATION CAMPUS */}
      <section className="space-y-6">
        <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] px-2 flex items-center gap-2"><Activity size={16} /> Administration Campus</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

           <button 
            onClick={onOpenMeetings}
            className="glass p-8 rounded-3xl flex items-center gap-6 border border-indigo-500/10 bg-gradient-to-br from-indigo-600/5 to-transparent group hover:bg-white dark:hover:bg-white/5 transition-all shadow-md text-left"
          >
            <div className="h-14 w-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><Video size={24} /></div>
            <div>
              <p className="text-sm font-bold uppercase text-slate-900 dark:text-white font-display italic">Visio-Conférence</p>
              <p className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mt-1">Réunions & Co-working</p>
            </div>
          </button>
           <button 
            onClick={() => {
              const userRole = (currentUser as any)?.role;
              if (userRole === 'ADMIN' || userRole === 'DE' || userRole === 'PROVISEUR' || userRole === 'PROFESSEUR') {
                onOpenPedagogy();
              } else {
                alert("Accès réservé au personnel pédagogique.");
              }
            }} 
            className="glass p-8 rounded-3xl flex items-center gap-6 border border-black/5 dark:border-white/5 bg-white dark:bg-white/5 group hover:bg-emerald-50 dark:hover:bg-white/10 transition-all shadow-md text-left"
          >
            <div className="h-14 w-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><BookMarked size={24} /></div>
            <div>
              <p className="text-sm font-bold uppercase text-slate-900 dark:text-white font-display italic">Pédagogie</p>
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">Cahier de texte & Ressources</p>
            </div>
          </button>
           <button 
            onClick={() => {
              const userRole = (currentUser as any)?.role;
              const authorized = ['ADMIN', 'PROVISEUR', 'DE', 'CT', 'SG', 'COMPTABLE_MATIERE','PROFESSEUR','SURVEILLANT'];
              if (authorized.includes(userRole)) {
                onOpenMedia();
              } else {
                alert("Accès réservé à l'administration.");
              }
            }} 
            className="glass p-8 rounded-3xl flex items-center gap-6 border border-black/5 dark:border-white/5 bg-white dark:bg-white/5 group hover:bg-slate-50 dark:hover:bg-white/10 transition-all shadow-md text-left"
          >
            <div className="h-14 w-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><Share2 size={24} /></div>
            <div>
               <p className="text-sm font-bold uppercase text-slate-900 dark:text-white font-display">Médiathèque & Rapports</p>
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 font-display">Partage de documents</p>
            </div>
          </button>
          
          <button 
            onClick={onOpenSurveillance}
            className="glass p-8 rounded-3xl flex items-center gap-6 border border-indigo-500/10 bg-gradient-to-br from-indigo-500/10 to-transparent group hover:bg-white dark:hover:bg-white/5 transition-all shadow-md text-left"
          >
            <div className="h-14 w-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><Activity size={24} /></div>
            <div>
              <p className="text-sm font-bold uppercase text-slate-900 dark:text-white font-display italic">Surveillance & Salles</p>
              <p className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mt-1">Affectations & Occupation</p>
            </div>
          </button>

            {!isTeacher && (
            <>
          <button onClick={onOpenAddStudent} className="glass p-8 rounded-[3rem] flex items-center gap-6 border border-white/5 group hover:bg-white/5 transition-all shadow-xl text-left">
            <div className="h-14 w-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><UserPlus size={24} /></div>
            <p className="text-sm font-black uppercase dark:text-white">Inscrire Élève</p>
          </button>
          
          <button onClick={onOpenManageTeachers} className="glass p-8 rounded-[3rem] flex items-center gap-6 border border-white/5 group hover:bg-white/5 transition-all shadow-xl text-left border-amber-500/10">
            <div className="h-14 w-14 bg-amber-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><GraduationCap size={24} /></div>
            <div>
               <p className="text-sm font-black uppercase dark:text-white">Gérer Profs</p>
               <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">Saisie & Absences</p>
            </div>
          </button>

          {(isSuperAdmin || isSG) && (
            <button onClick={onOpenManageStaff} className="glass p-8 rounded-[3rem] flex items-center gap-6 border border-white/5 group hover:bg-white/5 transition-all shadow-xl text-left border-emerald-500/10">
              <div className="h-14 w-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><ShieldCheck size={24} /></div>
              <div>
                 <p className="text-sm font-black uppercase dark:text-white">Gérer Surveillants</p>
                 <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">Accès & Périmètres</p>
              </div>
            </button>
          )}

          <button onClick={onOpenExportAbsences} className="glass p-8 rounded-[3rem] flex items-center gap-6 border border-white/5 group bg-gradient-to-br from-indigo-600/10 to-rose-600/10 hover:from-indigo-600/20 hover:to-rose-600/20 transition-all shadow-xl text-left border-indigo-500/20">
            <div className="h-14 w-14 bg-gradient-to-br from-indigo-600 to-rose-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><FileDown size={24} /></div>
            <div>
               <p className="text-sm font-black uppercase dark:text-white">Exporter Bilan</p>
               <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">Vie Scolaire Active</p>
            </div>
          </button>

          {isSuperAdmin && onResetCounters && (
            <button onClick={onResetCounters} className="glass p-8 rounded-[3rem] flex items-center gap-6 border-rose-500/20 bg-rose-500/5 group hover:bg-rose-500/10 transition-all shadow-xl text-left">
              <div className="h-14 w-14 bg-rose-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><RotateCcw size={24} /></div>
              <div>
                 <p className="text-sm font-black uppercase text-rose-500">Reset Élèves</p>
                 <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1 italic">Clôturer le cycle élèves</p>
              </div>
            </button>
          )}

          {isSuperAdmin && onResetTeacherCounters && (
            <button onClick={onResetTeacherCounters} className="glass p-8 rounded-[3rem] flex items-center gap-6 border-amber-500/20 bg-amber-500/5 group hover:bg-amber-500/10 transition-all shadow-xl text-left">
              <div className="h-14 w-14 bg-amber-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><UserMinus size={24} /></div>
              <div>
                 <p className="text-sm font-black uppercase text-amber-500">Reset Professeurs</p>
                 <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1 italic">Clôturer le cycle profs</p>
              </div>
            </button>
          )}

          <button onClick={onOpenManageClasses} className="glass p-8 rounded-[3rem] flex items-center gap-6 border border-white/5 group hover:bg-white/5 transition-all shadow-xl text-left">
            <div className="h-14 w-14 bg-violet-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><Layers size={24} /></div>
            <p className="text-sm font-black uppercase dark:text-white">Gérer Classes</p>
          </button>
          
          <button onClick={onOpenManageSubjects} className="glass p-8 rounded-[3rem] flex items-center gap-6 border border-white/5 group hover:bg-white/5 transition-all shadow-xl text-left border-teal-500/10">
            <div className="h-14 w-14 bg-teal-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><BookOpen size={24} /></div>
            <div>
               <p className="text-sm font-black uppercase dark:text-white">Gérer Matières</p>
               <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">Coefficients & Catégories</p>
            </div>
          </button>

          <button onClick={onOpenAddEvent} className="glass p-8 rounded-[3rem] flex items-center gap-6 border-indigo-500/20 bg-gradient-to-br from-indigo-600/10 to-transparent group hover:bg-white/5 transition-all shadow-xl text-left">
            <div className="h-14 w-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><Megaphone size={24} /></div>
            <div>
               <p className="text-sm font-black uppercase dark:text-white">Publier Actualité</p>
               <p className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest mt-1">Fil d'actualité LTPF</p>
            </div>
          </button>
          
           <button onClick={onOpenManageEvents} className="glass p-8 rounded-[3rem] flex items-center gap-6 border border-white/5 group hover:bg-white/5 transition-all shadow-xl text-left border-violet-500/20">
            <div className="h-14 w-14 bg-violet-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><Settings size={24} /></div>
            <div>
               <p className="text-sm font-black uppercase dark:text-white">Gérer Actus</p>
               <p className="text-[8px] font-bold text-violet-400 uppercase tracking-widest mt-1">Modifier/Supprimer</p>
            </div>
          </button>
           <button 
            onClick={() => {
              const userRole = (currentUser as any)?.role;
              if (userRole === 'ADMIN' || userRole === 'PROVISEUR') {
                onOpenProviseur();
              } else {
                alert("Accès réservé au Proviseur et à l'Admin LTP.");
              }
            }} 
            className="glass p-8 rounded-3xl flex items-center gap-6 border border-black/5 dark:border-white/5 bg-white dark:bg-white/5 group hover:bg-slate-900 group-hover:text-white transition-all shadow-md text-left"
          >
            <div className="h-14 w-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg border border-white/10"><Shield size={24} /></div>
            <div>
              <p className="text-sm font-bold uppercase text-slate-900 dark:text-white font-display group-hover:text-white">Cabinet du Proviseur</p>
              {((currentUser as any)?.role !== 'ADMIN' && (currentUser as any)?.role !== 'PROVISEUR') && (
                <p className="text-[8px] font-bold text-rose-500 uppercase tracking-widest mt-1">Accès Restreint</p>
              )}
            </div>
          </button>

           <button 
            onClick={() => {
              const userRole = (currentUser as any)?.role;
              if (userRole === 'ADMIN' || userRole === 'DE') {
                onOpenDirecteurEtudes();
              } else {
                alert("Accès réservé au Directeur des Études et à l'Admin LTP.");
              }
            }} 
            className="glass p-8 rounded-3xl flex items-center gap-6 border border-black/5 dark:border-white/5 bg-white dark:bg-white/5 group hover:bg-violet-50 dark:hover:bg-white/10 transition-all shadow-md text-left"
          >
            <div className="h-14 w-14 bg-violet-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><GraduationCap size={24} /></div>
            <div>
              <p className="text-sm font-bold uppercase text-slate-900 dark:text-white font-display">Direction des Études</p>
              {((currentUser as any)?.role !== 'ADMIN' && (currentUser as any)?.role !== 'DE') && (
                <p className="text-[8px] font-bold text-rose-500 uppercase tracking-widest mt-1">Accès Restreint</p>
              )}
            </div>
          </button>
           <button 
            onClick={() => {
              const userRole = (currentUser as any)?.role;
              if (userRole === 'ADMIN' || userRole === 'CT') {
                onOpenChefTravaux();
              } else {
                alert("Accès réservé au Chef des Travaux et à l'Admin LTP.");
              }
            }} 
            className="glass p-8 rounded-3xl flex items-center gap-6 border border-black/5 dark:border-white/5 bg-white dark:bg-white/5 group hover:bg-amber-50 dark:hover:bg-white/10 transition-all shadow-md text-left"
          >
            <div className="h-14 w-14 bg-amber-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><Briefcase size={24} /></div>
            <div>
              <p className="text-sm font-bold uppercase text-slate-900 dark:text-white font-display">Chef des Travaux</p>
              {((currentUser as any)?.role !== 'ADMIN' && (currentUser as any)?.role !== 'CT') && (
                <p className="text-[8px] font-bold text-rose-500 uppercase tracking-widest mt-1">Accès Restreint</p>
              )}
            </div>
          </button>

          <button 
            onClick={() => {
              const userRole = (currentUser as any)?.role;
              if (userRole === 'ADMIN' || userRole === 'CT') {
                onOpenInternship();
              } else {
                alert("Accès réservé au Chef des Travaux et à l'Admin LTP.");
              }
            }} 
            className="glass p-8 rounded-3xl flex items-center gap-6 border border-black/5 dark:border-white/5 bg-white dark:bg-white/5 group hover:bg-indigo-50 dark:hover:bg-white/10 transition-all shadow-md text-left"
          >
            <div className="h-14 w-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><Briefcase size={24} /></div>
            <div>
              <p className="text-sm font-bold uppercase text-slate-900 dark:text-white font-display italic">Stages / Pro</p>
              {((currentUser as any)?.role !== 'ADMIN' && (currentUser as any)?.role !== 'CT') && (
                <p className="text-[8px] font-bold text-rose-500 uppercase tracking-widest mt-1">Accès Restreint</p>
              )}
            </div>
          </button>
          
         
          
          <button 
            onClick={() => {
              const userRole = (currentUser as any)?.role;
              if (userRole === 'ADMIN' || userRole === 'COMPTABLE_MATIERE') {
                onOpenInventory();
              } else {
                alert("Accès réservé au Comptable Matière et à l'Admin LTP.");
              }
            }} 
            className="glass p-8 rounded-3xl flex items-center gap-6 border border-black/5 dark:border-white/5 bg-white dark:bg-white/5 group hover:bg-sky-50 dark:hover:bg-white/10 transition-all shadow-md text-left"
          >
            <div className="h-14 w-14 bg-sky-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><Hammer size={24} /></div>
            <div>
              <p className="text-sm font-bold uppercase text-slate-900 dark:text-white font-display">Logistique</p>
              {((currentUser as any)?.role !== 'ADMIN' && (currentUser as any)?.role !== 'COMPTABLE_MATIERE') && (
                <p className="text-[8px] font-bold text-rose-500 uppercase tracking-widest mt-1">Accès Restreint</p>
              )}
            </div>
          </button>
           </>
           )}
          
        </div>
      </section>
    </div>
  );
};
