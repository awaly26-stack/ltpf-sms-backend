
import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, X, Plus, Trash2, FileDown, GraduationCap as GradIcon, 
  BookMarked as SubjectIcon, Building2, Settings2, CheckCircle2,
  Phone, User as UserIcon, Calendar, PhoneCall, Wallet
} from 'lucide-react';
import { jsPDF } from "jspdf";
import { Teacher, Subject, SchoolClass, AbsenceLog, AbsenceMotif, PrivateOvertimeLog } from './types';
import { ADMIN_KEY, MOTIFS_OPTIONS } from './constants';
import { PrivateOvertime } from './PrivateOvertime';
import { useAuth } from './AuthContext';
import { PrivateMailbox } from './PrivateMailbox';
import { Mail } from 'lucide-react';

export const TeacherDetail = ({ teacher, subjects, classes, onUpdate, onDelete, onClose }: { 
  teacher: Teacher; subjects: Subject[]; classes: SchoolClass[]; onUpdate: (t: Teacher) => void; onDelete: (id: string) => void; onClose: () => void 
}) => {
   const { currentUser, isSuperAdmin, isSG, isTeacher } = useAuth();
  const isMe = currentUser?.id === teacher.id;
  
  // High management permissions
  const canManageTeachers = isSuperAdmin || isSG || currentUser?.role === 'PROVISEUR' || currentUser?.role === 'DE' || currentUser?.role === 'CT';
  const isSurveillantOfTeacher = currentUser?.role === 'SURVEILLANT' && teacher.classIds?.some(cid => currentUser?.assignedClassIds?.includes(cid));
  const canEditAbsences = canManageTeachers || isSurveillantOfTeacher; // Teachers cannot edit their own absences

  const availableClassesForAbsence = useMemo(() => {
    const tClasses = teacher.classIds || [];
    if (canManageTeachers) return tClasses;
    if (currentUser?.role === 'SURVEILLANT') {
      return tClasses.filter(cid => currentUser?.assignedClassIds?.includes(cid));
    }
    return tClasses;
  }, [teacher.classIds, canManageTeachers, currentUser]);

  const [localTeacher, setLocalTeacher] = useState<Teacher>({
    ...teacher,
    subjectIds: teacher.subjectIds || [],
    classIds: teacher.classIds || [],
    absenceLogs: teacher.absenceLogs || [],
    privateOvertimeLogs: teacher.privateOvertimeLogs || []
  });
  
  const [showLogForm, setShowLogForm] = useState(false);
  const [showEditAssignments, setShowEditAssignments] = useState(false);
  const [showEditInfo, setShowEditInfo] = useState(false);
  const [showWeeklyExport, setShowWeeklyExport] = useState(false);
  const [selectedWeekDate, setSelectedWeekDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [newLog, setNewLog] = useState<{ hours: number; classId: string; motif: AbsenceMotif }>({
    hours: 1, 
    classId: (localTeacher.classIds && localTeacher.classIds.length > 0) ? localTeacher.classIds[0] : (classes[0]?.id || ''), 
    motif: 'Inconnu'
  });

  const teacherSubjects = useMemo(() => {
    return (localTeacher.subjectIds || [])
      .map(sid => subjects.find(s => s.id === sid)?.name)
      .filter((name): name is string => Boolean(name));
  }, [localTeacher.subjectIds, subjects]);

  const teacherClasses = useMemo(() => {
    return (localTeacher.classIds || [])
      .map(cid => classes.find(c => c.id === cid)?.name)
      .filter((name): name is string => Boolean(name));
  }, [localTeacher.classIds, classes]);

  const addAbsenceLog = () => {
    const log: AbsenceLog = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      ...newLog,
      adminKey: ADMIN_KEY
    };
    const updated = { ...localTeacher, absenceLogs: [log, ...(localTeacher.absenceLogs || [])] };
    setLocalTeacher(updated);
    setShowLogForm(false);
  };

  const handleAddPrivateOvertime = (newOvertime: PrivateOvertimeLog) => {
    const updated = {
      ...localTeacher,
      privateOvertimeLogs: [newOvertime, ...(localTeacher.privateOvertimeLogs || [])]
    };
    setLocalTeacher(updated);
    onUpdate(updated); // Persistance immédiate
  };

  const handleDeletePrivateOvertime = (id: string) => {
    const updated = {
      ...localTeacher,
      privateOvertimeLogs: (localTeacher.privateOvertimeLogs || []).filter(l => l.id !== id)
    };
    setLocalTeacher(updated);
    onUpdate(updated); // Persistance immédiate
  };

  const toggleSubject = (sid: string) => {
    const current = [...(localTeacher.subjectIds || [])];
    const idx = current.indexOf(sid);
    if(idx >= 0) current.splice(idx, 1);
    else current.push(sid);
    setLocalTeacher({...localTeacher, subjectIds: current});
  };

  const toggleClass = (cid: string) => {
    const current = [...(localTeacher.classIds || [])];
    const idx = current.indexOf(cid);
    if(idx >= 0) current.splice(idx, 1);
    else current.push(cid);
    setLocalTeacher({...localTeacher, classIds: current});
  };

  const deleteLog = (id: string) => {
    if(!window.confirm("Supprimer cette entrée ?")) return;
    const updated = { ...localTeacher, absenceLogs: (localTeacher.absenceLogs || []).filter(l => l.id !== id) };
    setLocalTeacher(updated);
  };

  const getWeekRange = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDay();
    const diffToMonday = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diffToMonday));
    const saturday = new Date(new Date(monday).setDate(monday.getDate() + 5));
    return { monday, saturday };
  };

  const exportWeeklyPDF = () => {
    const { monday, saturday } = getWeekRange(selectedWeekDate);
    const doc = new jsPDF();
    const t = localTeacher;
    let y = 20;
    const formatDate = (d: Date) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

    doc.setFontSize(10).setFont("helvetica", "normal").text("RÉPUBLIQUE DU SÉNÉGAL", 105, y, { align: 'center' });
    y += 5;
    doc.text("MINISTÈRE DE LA FORMATION PROFESSIONNELLE", 105, y, { align: 'center' });
    y += 5;
    doc.setFont("helvetica", "bold").text("LYCÉE TECHNIQUE ET PROFESSIONNEL DE FATICK (LTP)", 105, y, { align: 'center' });
    y += 15;

    doc.setFontSize(16).setFont("helvetica", "bold").text("RAPPORT HEBDOMADAIRE D'ABSENCES", 105, y, { align: 'center' });
    y += 8;
    doc.setFontSize(10).setFont("helvetica", "italic").text(`Période du : ${formatDate(monday)} au ${formatDate(saturday)}`, 105, y, { align: 'center' });
    y += 15;

    doc.setFontSize(12).setFont("helvetica", "bold").text(`PROFESSEUR : ${t.firstName.toUpperCase()} ${t.name.toUpperCase()}`, 20, y);
    y += 15;

    const weeklyLogs = (t.absenceLogs || []).filter(l => {
        const logDate = new Date(l.date);
        return logDate >= monday && logDate <= new Date(saturday.getTime() + 86400000);
    });

    doc.setFontSize(10).setFont("helvetica", "bold").text("DÉTAIL DES ABSENCES DE LA SEMAINE", 20, y);
    y += 8;
    doc.line(20, y, 190, y);
    y += 8;

    doc.setFont("helvetica", "normal");
    if(weeklyLogs.length === 0) {
        doc.text("Aucune absence signalée pour cette semaine.", 20, y);
    } else {
        weeklyLogs.forEach(l => {
            const className = classes.find(c => c.id === l.classId)?.name || "N/A";
            const dateStr = new Date(l.date).toLocaleDateString('fr-FR');
            doc.text(`${dateStr} - ${l.hours}H - CLASSE : ${className.toUpperCase()}`, 20, y);
            doc.setFont("helvetica", "italic").text(`Motif : ${l.motif}`, 150, y);
            doc.setFont("helvetica", "normal");
            y += 7;
            if(y > 270) { doc.addPage(); y = 20; }
        });
    }

    y += 15;
    const totalWeekly = weeklyLogs.reduce((acc, curr) => acc + curr.hours, 0);
    doc.setFont("helvetica", "bold").text(`TOTAL HEBDOMADAIRE : ${totalWeekly} HEURES`, 20, y);

    doc.save(`Rapport_Hebdo_${t.name}_${selectedWeekDate}.pdf`);
    setShowWeeklyExport(false);
  };

    const exportTeacherPDF = () => {
    const doc = new jsPDF();
    const t = localTeacher;
    let y = 20;
    const currentMonth = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

    // En-tête institutionnel
    doc.setFontSize(10).setFont("helvetica", "normal").text("RÉPUBLIQUE DU SÉNÉGAL", 105, y, { align: 'center' });
    y += 5;
    doc.text("MINISTÈRE DE LA FORMATION PROFESSIONNELLE", 105, y, { align: 'center' });
    y += 5;
    doc.setFont("helvetica", "bold").text("LYCÉE TECHNIQUE ET PROFESSIONNEL DE FATICK (LTP)", 105, y, { align: 'center' });
    y += 15;

    // Titre du rapport
    doc.setFontSize(16).setFont("helvetica", "bold").text("BILAN COMPLET DES ABSENCES (MOIS EN COURS)", 105, y, { align: 'center' });
    y += 8;
    doc.setFontSize(11).setFont("helvetica", "bold").text(`MOIS DE : ${currentMonth.toUpperCase()}`, 105, y, { align: 'center' });
    y += 12;

    // Info Professeur
    doc.setFontSize(12).setFont("helvetica", "bold").text(`PROFESSEUR : ${(t.firstName || '').toUpperCase()} ${(t.name || '').toUpperCase()}`, 20, y);
    y += 8;
    doc.setFontSize(10).setFont("helvetica", "normal").text(`Matières : ${teacherSubjects.join(', ')}`, 20, y);
    y += 15;

    // Tableau des absences
    doc.setFont("helvetica", "bold").text("DATE D'ENREGISTREMENT", 20, y);
    doc.text("CLASSE", 75, y);
    doc.text("DURÉE", 130, y);
    doc.text("MOTIF", 160, y);
    y += 4;
    doc.line(20, y, 190, y);
    y += 8;

    doc.setFont("helvetica", "normal").setFontSize(10);
    const sortedLogs = [...(t.absenceLogs || [])].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    sortedLogs.forEach(l => {
        const className = classes.find(c => c.id === l.classId)?.name || "N/A";
        const logDate = new Date(l.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        
        doc.text(logDate, 20, y);
        doc.text(className.toUpperCase(), 75, y);
        doc.text(`${l.hours}H`, 130, y);
        doc.setFont("helvetica", "italic").text(l.motif, 160, y).setFont("helvetica", "normal");
        
        y += 8;
        if(y > 275) { doc.addPage(); y = 20; }
    });

    y += 10;
    const totalHours = (t.absenceLogs || []).reduce((acc, curr) => acc + curr.hours, 0);
    doc.setFontSize(12).setFont("helvetica", "bold").text(`CUMUL TOTAL DU MOIS : ${totalHours} HEURES`, 20, y);

    doc.save(`Bilan_Absences_${t.name}_${currentMonth.replace(' ', '_')}.pdf`);
  };

 return (
    <div className="fixed inset-0 z-[600] bg-white dark:bg-slate-950 flex flex-col min-h-screen animate-in slide-in-from-right duration-300 overflow-y-auto">
      <div className="px-6 py-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-20">
        <button onClick={onClose} className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-2xl active:scale-90 transition-transform"><ArrowLeft size={20} /></button>
        <div className="text-center">
          <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
            {canManageTeachers ? 'Fiche Professeur' : isMe ? 'Mon Profil' : 'Profil Collègue'}
          </h3>
          <p className="font-mono font-black text-amber-600 uppercase tracking-tight truncate max-w-[150px]">{localTeacher.firstName} {localTeacher.name}</p>
        </div>
        <div className="flex items-center gap-2">
          {(canManageTeachers || isMe) && (
            <button 
              onClick={() => setShowMailbox(true)} 
              className={`p-3 rounded-2xl text-white shadow-lg active:scale-95 transition-all relative ${isMe ? 'bg-indigo-600 shadow-indigo-500/20' : 'bg-slate-800'}`}
              title={isMe ? "Mon Courrier" : "Lui envoyer un courrier"}
            >
              <Mail size={18} />
              {isMe && <div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 border-2 border-white dark:border-slate-900 rounded-full animate-pulse" />}
            </button>
          )}
          {(canManageTeachers || isMe) && (
            <button onClick={() => { onUpdate(localTeacher); onClose(); }} className="bg-amber-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase shadow-lg active:scale-95 transition-all">Sauver</button>
          )}
        </div>
      </div>

      <div className="flex-1 p-6 space-y-8 pb-32">
        <div className="bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] p-8 flex flex-col items-center shadow-inner relative overflow-hidden group">
          <div className="h-24 w-24 rounded-[2rem] bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center font-black text-3xl text-amber-600 z-10 shadow-lg">
            {(localTeacher.firstName || 'P')[0]}
          </div>
          <p className="text-lg font-black uppercase mt-4 dark:text-white z-10 tracking-tight">{localTeacher.firstName} {localTeacher.name}</p>
          
          <div className="flex items-center gap-3 mt-2 z-10">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{localTeacher.phone || "Aucun numéro"}</p>
            {localTeacher.phone && (
              <a 
                href={`tel:${localTeacher.phone}`} 
                className="h-9 w-9 bg-amber-600 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 hover:scale-105 transition-all"
                title="Appeler l'enseignant"
              >
                <PhoneCall size={16} />
              </a>
            )}
          </div>
          
          {(canManageTeachers || isMe) && (
            <button onClick={() => setShowEditInfo(!showEditInfo)} className="absolute top-6 right-6 z-20 p-2 bg-white/50 dark:bg-slate-800/50 rounded-xl text-amber-600 shadow-sm"><Settings2 size={18} /></button>
          )}
        </div>

        {showEditInfo && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-amber-200 dark:border-amber-900/30 space-y-4 animate-in slide-in-from-top duration-300">
             {(isSuperAdmin || isMe) && (
               <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase ml-2 flex items-center gap-1"><Wallet size={10} /> Matricule d'accès</label>
                  <input type="text" value={localTeacher.matricule || ''} onChange={e => setLocalTeacher({...localTeacher, matricule: e.target.value.toUpperCase()})} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-[11px] font-bold dark:text-white outline-none border border-transparent focus:border-amber-500" />
               </div>
             )}
             <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-2 flex items-center gap-1"><UserIcon size={10} /> Prénom</label>
                <input type="text" value={localTeacher.firstName || ''} onChange={e => setLocalTeacher({...localTeacher, firstName: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-[11px] font-bold dark:text-white outline-none border border-transparent focus:border-amber-500" />
             </div>
             <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-2 flex items-center gap-1"><UserIcon size={10} /> Nom</label>
                <input type="text" value={localTeacher.name || ''} onChange={e => setLocalTeacher({...localTeacher, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-[11px] font-bold dark:text-white outline-none border border-transparent focus:border-amber-500" />
             </div>
             <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase ml-2 flex items-center gap-1"><Phone size={10} /> Téléphone (Direct)</label>
                <input type="text" value={localTeacher.phone || ''} onChange={e => setLocalTeacher({...localTeacher, phone: e.target.value})} placeholder="77 000 00 00" className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-[11px] font-bold dark:text-white outline-none border border-transparent focus:border-amber-500" />
             </div>
          </div>
        )}

        <div className="space-y-4">
           <div className="flex justify-between items-center px-2">
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Assignations Pédagogiques</h4>
              {canManageTeachers && (
                <button onClick={() => setShowEditAssignments(!showEditAssignments)} className={`p-2 rounded-xl border flex items-center gap-2 transition-all ${showEditAssignments ? 'bg-amber-600 text-white border-amber-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 border-slate-200'}`}>
                  {showEditAssignments ? <CheckCircle2 size={16} /> : <Settings2 size={16} />}
                </button>
              )}
           </div>

           {showEditAssignments ? (
             <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-[2rem] border border-amber-200 dark:border-amber-900/30 space-y-6">
                <div className="space-y-3">
                   <p className="text-[9px] font-black uppercase text-amber-600 ml-2 tracking-widest">Matières</p>
                   <div className="flex flex-wrap gap-2">
                      {subjects.map(s => {
                        const isSelected = (localTeacher.subjectIds || []).includes(s.id);
                        return <button key={s.id} onClick={() => toggleSubject(s.id)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase border transition-all ${isSelected ? 'bg-amber-600 text-white border-amber-500' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-800'}`}>{s.name}</button>;
                      })}
                   </div>
                </div>
                <div className="space-y-3">
                   <p className="text-[9px] font-black uppercase text-violet-600 ml-2 tracking-widest">Classes</p>
                   <div className="flex flex-wrap gap-2">
                      {classes.map(c => {
                        const isSelected = (localTeacher.classIds || []).includes(c.id);
                        return <button key={c.id} onClick={() => toggleClass(c.id)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase border transition-all ${isSelected ? 'bg-violet-600 text-white border-violet-500' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-800'}`}>{c.name}</button>;
                      })}
                   </div>
                </div>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
                  <div className="flex items-center gap-3 text-amber-600"><SubjectIcon size={18} /><h4 className="text-[10px] font-black uppercase tracking-widest">Matières</h4></div>
                  <div className="flex flex-wrap gap-2">
                    {teacherSubjects.length > 0 ? teacherSubjects.map(s => <span key={s} className="bg-amber-50 dark:bg-amber-900/20 text-amber-600 text-[9px] font-black px-4 py-2 rounded-xl uppercase">{s}</span>) : <p className="text-[10px] text-slate-400 italic">Aucune matière</p>}
                  </div>
               </div>
               <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
                  <div className="flex items-center gap-3 text-violet-600"><Building2 size={18} /><h4 className="text-[10px] font-black uppercase tracking-widest">Classes</h4></div>
                  <div className="flex flex-wrap gap-2">
                    {teacherClasses.length > 0 ? teacherClasses.map(c => <span key={c} className="bg-violet-50 dark:bg-violet-900/20 text-violet-600 text-[9px] font-black px-4 py-2 rounded-xl uppercase">{c}</span>) : <p className="text-[10px] text-slate-400 italic">Aucune classe</p>}
                  </div>
               </div>
            </div>
           )}
        </div>

        {(canManageTeachers || isMe) && (
          <PrivateOvertime 
            logs={localTeacher.privateOvertimeLogs || []} 
            classes={classes} 
            onAdd={handleAddPrivateOvertime} 
            onDelete={handleDeletePrivateOvertime} 
          />
        )}

        {(canManageTeachers || isMe || canEditAbsences) && (
          <div className="space-y-4">
             <div className="flex justify-between items-center px-2">
               <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Suivi des Absences</h4>
               {canEditAbsences && (
                 <button onClick={() => setShowLogForm(!showLogForm)} className={`p-2 rounded-xl transition-all shadow-md ${showLogForm ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'}`}>{showLogForm ? <X size={16} /> : <Plus size={16} />}</button>
               )}
             </div>
             {showLogForm && (
               <div className="bg-slate-100 dark:bg-slate-900 p-6 rounded-3xl space-y-4 animate-in slide-in-from-top duration-300 shadow-inner">
                 <div className="grid grid-cols-2 gap-3">
                   <input type="number" value={newLog.hours} onChange={e => setNewLog({...newLog, hours: parseInt(e.target.value) || 0})} className="bg-white dark:bg-slate-800 p-4 rounded-xl text-sm font-black dark:text-white outline-none" placeholder="Heures" />
                   <select value={newLog.classId} onChange={e => setNewLog({...newLog, classId: e.target.value})} className="bg-white dark:bg-slate-800 p-4 rounded-xl text-[10px] font-black uppercase dark:text-white outline-none">
                      {availableClassesForAbsence.map(cid => <option key={cid} value={cid}>{classes.find(c => c.id === cid)?.name || cid}</option>)}
                   </select>
                 </div>
                 <select value={newLog.motif} onChange={e => setNewLog({...newLog, motif: e.target.value as AbsenceMotif})} className="w-full bg-white dark:bg-slate-800 p-4 rounded-xl text-[10px] font-black uppercase dark:text-white outline-none">
                   {MOTIFS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                 </select>
                 <button onClick={addAbsenceLog} className="w-full bg-slate-900 text-white py-4 rounded-xl font-black uppercase text-[10px] shadow-lg">Enregistrer l'absence</button>
               </div>
             )}
             <div className="space-y-2">
               {(localTeacher.absenceLogs || []).length > 0 ? (localTeacher.absenceLogs || []).map(l => (
                 <div key={l.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl flex items-center justify-between border border-slate-50 dark:border-slate-800 shadow-sm">
                   <div>
                     <p className="text-[8px] font-black text-slate-400 uppercase">{new Date(l.date).toLocaleDateString()}</p>
                     <p className="text-[10px] font-black uppercase dark:text-white">{classes.find(c => c.id === l.classId)?.name} • {l.motif}</p>
                   </div>
                   <div className="flex items-center gap-4">
                     <span className="font-black text-sm dark:text-white">{l.hours}H</span>
                     {canEditAbsences && (
                       <button onClick={() => deleteLog(l.id)} className="text-red-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                     )}
                   </div>
                 </div>
               )) : !showLogForm && (
                 <p className="text-[10px] text-slate-400 font-bold italic text-center py-6">Aucun log enregistré.</p>
               )}
             </div>
          </div>
        )}

        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
          <div className="grid grid-cols-1 gap-3">
             {(canManageTeachers || isMe) && (
               <>
                 <button onClick={() => setShowWeeklyExport(!showWeeklyExport)} className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-6 rounded-3xl font-black uppercase text-[10px] flex items-center justify-center gap-4 active:scale-95 transition-all shadow-sm">
                    <Calendar size={20} /> Rapport Hebdomadaire
                 </button>
                 
                 {showWeeklyExport && (
                   <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-900/30 space-y-4 animate-in slide-in-from-top duration-300 shadow-lg">
                      <div className="space-y-2">
                         <p className="text-[9px] font-black uppercase text-indigo-600 ml-2">Choisir une date de référence</p>
                         <input type="date" value={selectedWeekDate} onChange={e => setSelectedWeekDate(e.target.value)} className="w-full bg-white dark:bg-slate-800 p-4 rounded-xl text-[11px] font-bold dark:text-white outline-none border border-slate-100 dark:border-slate-800" />
                      </div>
                      <button onClick={exportWeeklyPDF} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black uppercase text-[10px] shadow-lg shadow-indigo-500/20">Télécharger PDF (Semaine)</button>
                   </div>
                 )}

                 <button onClick={exportTeacherPDF} className="w-full bg-amber-600 text-white py-6 rounded-3xl font-black uppercase text-[11px] flex items-center justify-center gap-4 shadow-xl shadow-amber-500/20 active:scale-95 transition-all">
                    <FileDown size={22} /> Exporter Bilan Complet
                 </button>
               </>
             )}
          </div>

          {canManageTeachers && (
            <button onClick={() => { if(window.confirm(`Supprimer définitivement ${localTeacher.firstName} ${localTeacher.name} du système ?`)) { onDelete(localTeacher.id); onClose(); } }} className="w-full bg-red-50 text-red-600 py-6 rounded-3xl font-black uppercase text-[10px] flex items-center justify-center gap-4 active:scale-95 transition-all">
               <Trash2 size={20} /> Supprimer l'Enseignant
            </button>
          )}
        </div>
      </div>
      {showMailbox && (
        <PrivateMailbox targetUser={teacher} onClose={() => setShowMailbox(false)} />
      )}
    </div>
  );
};
