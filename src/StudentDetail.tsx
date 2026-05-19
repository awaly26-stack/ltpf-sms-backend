import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, Plus, Trash2, Camera, MapPin, Phone, 
  Calendar, ShieldAlert, GraduationCap, UserRound, 
  CheckCircle2, Clock, PhoneCall, Building, FileSignature, 
  FileText as FileIcon, AlertTriangle, Gavel, ShieldX, X, 
  ClipboardList, ShieldCheck, UserPlus, Globe, Briefcase as CaseIcon,
  History, QrCode, Home, PhoneForwarded, Briefcase, 
  ChevronRight, Star, AlertOctagon, Info, FileDown, FileText,
  MessageSquare, Landmark, Send
} from 'lucide-react';
import { jsPDF } from "jspdf";
import { Student, SchoolClass, Subject, User, Incident, Internship, AbsenceLog,  ChatMessage, Company  } from './types';
import { db } from './firebaseConfig';
import { AVAILABLE_BADGES, ADMIN_KEY } from './constants';
import { QRCodeDisplay } from './components';
import { sendSMS, sendAbsenceSMS, toPlainObject } from './utils';
import { useAuth } from './AuthContext';

export const StudentDetail = ({ student, classes, subjects, currentUser, onUpdate, onDelete, onClose, onOpenChat }: { 
  student: Student; classes: SchoolClass[]; subjects: Subject[]; currentUser: User; onUpdate: (s: Student) => void; onDelete: (id: string) => void; onClose: () => void; onOpenChat?: (id: string) => void
}) => {
const { isSuperAdmin, isSG, isTeacher } = useAuth();
  
  const isHighManagement = isSuperAdmin || isSG || currentUser.role === 'PROVISEUR' || currentUser.role === 'DE' || currentUser.role === 'CT' || currentUser.role === 'SURVEILLANT';
  const isStaff = currentUser.role !== 'ELEVE';
  const isOwnProfile = currentUser.id === student.id;
  
  // Restriction d'accès
  const isAssignedTeacher = isTeacher && currentUser.assignedClassIds?.includes(student.classId);
  
  // Le professeur ne peut que LIRE les élèves de ses classes. 
  // Il ne peut RIEN modifier (absence, incident, badges).
  // Seul le surveillant et la direction ont ces droits.
  const canSeeFullAccess = isStaff || isOwnProfile;
  const canEditPersonalInfo = (isHighManagement && !isTeacher) || isOwnProfile;
  const canManageAttendance = (isHighManagement && !isTeacher);
  const canManageIncidents = (isHighManagement && !isTeacher);
  const canManageBadges = (isHighManagement && !isTeacher);
  const showMatricule = isSuperAdmin || isOwnProfile || (currentUser.role === 'SURVEILLANT' && currentUser.assignedClassIds?.includes(student.classId));

  // Blocage explicite pour les profs sur les élèves hors de leurs classes
  if (isTeacher && !isAssignedTeacher && !isHighManagement) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl max-w-sm w-full text-center space-y-4">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <AlertOctagon size={32} />
          </div>
          <h2 className="text-xl font-black dark:text-white uppercase tracking-tight">Accès Restreint</h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold leading-relaxed">
            En tant qu'enseignant, vous n'êtes autorisé à consulter que les profils des élèves inscrits dans vos classes assignées.
          </p>
          <button onClick={onClose} className="w-full bg-slate-100 dark:bg-slate-800 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest dark:text-white">Fermer</button>
        </div>
      </div>
    );
  }

  const [localStudent, setLocalStudent] = useState<Student>(student);
  const [activeTab, setActiveTab] = useState<'vie' | 'profil' | 'qr'  | 'conseil'>('vie');
   const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showAbsenceForm, setShowAbsenceForm] = useState(false);
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [showInternshipForm, setShowInternshipForm] = useState(false);
  const [internshipsFromCollection, setInternshipsFromCollection] = useState<Internship[]>([]);
  const [availableCompanies, setAvailableCompanies] = useState<Company[]>([]);
  const [absenceHoursToAdd, setAbsenceHoursToAdd] = useState(1);
  const [newIncident, setNewIncident] = useState<Partial<Incident>>({
    description: '',
    severity: 'low'
  });
   useEffect(() => {
    if (activeTab === 'conseil') {
      const conversationId = student.id;
      const unsubscribe = db.collection("conseils")
        .where("conversationId", "==", conversationId)
        .onSnapshot((snap) => {
          const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage));
          msgs.sort((a, b) => (a.timestamp?.toMillis ? a.timestamp.toMillis() : new Date(a.timestamp).getTime()) - (b.timestamp?.toMillis ? b.timestamp.toMillis() : new Date(b.timestamp).getTime()));
          setMessages(msgs);
          
          // Marquer comme lu si applicable
          snap.docs.forEach(d => {
            const data = d.data();
            if (data.receiverId === currentUser.id && !data.read) {
              db.collection("conseils").doc(d.id).update({ read: true });
            }
          });
        });
      return () => unsubscribe();
    }
  }, [activeTab, student.id, currentUser.id]);

   useEffect(() => {
    const unsubInternships = db.collection('internships')
      .where('studentId', '==', student.id)
      .onSnapshot(snap => {
        setInternshipsFromCollection(snap.docs.map(d => ({ id: d.id, ...d.data() } as Internship)));
      });
    
    const unsubCompanies = db.collection('companies')
      .onSnapshot(snap => {
        setAvailableCompanies(snap.docs.map(d => ({ id: d.id, ...d.data() } as Company)));
      });

    return () => {
      unsubInternships();
      unsubCompanies();
    };
  }, [student.id]);

  useEffect(() => {
    if (activeTab === 'conseil') {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const msgData = {
      conversationId: student.id,
      senderId: currentUser.id,
      receiverId: currentUser.role === 'ELEVE' ? 'SURVEILLANT_OFFICE' : student.id,
      text: newMessage.trim(),
      timestamp: new Date(),
      read: false,
      senderName: currentUser.name
    };

    setNewMessage('');
    await db.collection("conseils").add(msgData);
  };
  const [newInternship, setNewInternship] = useState<Partial<Internship>>({
    companyName: '',
    tutorName: '',
    startDate: '',
    endDate: '',
    status: 'A venir'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!canSeeFullAccess && activeTab !== 'vie') {
      setActiveTab('vie');
    }
  }, [activeTab, canSeeFullAccess]);

  const handleChange = (field: keyof Student, value: any) => {
    const updated = { ...localStudent, [field]: value };
    setLocalStudent(updated);
  };

  const [absenceMotif, setAbsenceMotif] = useState('');
  
  const handleAddAbsence = async () => {
    if (!isStaff) return;
    const currentTotal = localStudent.unjustifiedAbsences || 0;
    
    const newLog: AbsenceLog = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      classId: localStudent.classId,
      hours: absenceHoursToAdd,
      motif: (absenceMotif as any) || 'Inconnu',
      adminKey: ADMIN_KEY
    };

    const updatedLogs = [newLog, ...(localStudent.absenceLogs || [])];
    const updated = { 
      ...localStudent, 
      unjustifiedAbsences: currentTotal + absenceHoursToAdd,
      absenceLogs: updatedLogs,
       isPresent: false // On marque comme absent si on ajoute une absence
    };
    
    // Envoi automatique du SMS aux parents avec Orange API
    if (localStudent.emergencyPhone) {
      await sendAbsenceSMS(localStudent.emergencyPhone, `${localStudent.firstName} ${localStudent.name}`);
    }
    
    setLocalStudent(updated);
    setAbsenceHoursToAdd(1);
    setAbsenceMotif('');
    setShowAbsenceForm(false);
  };

  const handleDeleteAbsenceLog = (logId: string) => {
    if (!isStaff || !window.confirm("Voulez-vous supprimer cette entrée d'absence ?")) return;
    
    const logToDelete = localStudent.absenceLogs?.find(l => l.id === logId);
    if (!logToDelete) return;

    const updatedLogs = localStudent.absenceLogs?.filter(l => l.id !== logId) || [];
    const updatedTotal = Math.max(0, (localStudent.unjustifiedAbsences || 0) - logToDelete.hours);

    const updated = { 
      ...localStudent, 
      unjustifiedAbsences: updatedTotal,
      absenceLogs: updatedLogs
    };
    
    setLocalStudent(updated);
  };

  const handleAddIncident = () => {
    if (!isStaff || !newIncident.description) return;
    const incident: Incident = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      description: newIncident.description!,
      severity: newIncident.severity as any || 'low'
    };
    const updatedIncidents = [incident, ...(localStudent.incidents || [])];
    const updated = { ...localStudent, incidents: updatedIncidents };
    setLocalStudent(updated);
    setNewIncident({ description: '', severity: 'low' });
    setShowIncidentForm(false);
  };

  const handleDeleteIncident = (incidentId: string) => {
    if (!isStaff || !window.confirm("Supprimer définitivement cette incidence du dossier ?")) return;
    const updated = { 
      ...localStudent, 
      incidents: (localStudent.incidents || []).filter(i => i.id !== incidentId) 
    };
    setLocalStudent(updated);
  };

  const handleAddInternship = async () => {
    if (!canEditPersonalInfo) return;
    if (!newInternship.companyName || !newInternship.startDate) return;
    
    const selectedCompany = availableCompanies.find(c => c.name === newInternship.companyName);

    const internshipData = {
      studentId: localStudent.id,
      studentName: `${localStudent.firstName} ${localStudent.name}`,
      classId: localStudent.classId,
      companyId: selectedCompany?.id || '',
      companyName: newInternship.companyName,
      tutorName: newInternship.tutorName || 'À préciser',
      startDate: newInternship.startDate,
      endDate: newInternship.endDate || '',
      status: newInternship.status || 'A venir',
      adminKey: ADMIN_KEY,
      createdAt: new Date().toISOString()
    };

    await db.collection('internships').add(toPlainObject(internshipData));
    
    setNewInternship({ companyName: '', tutorName: '', startDate: '', endDate: '', status: 'A venir' });
    setShowInternshipForm(false);
  };

  const handleDeleteInternship = async (internshipId: string) => {
    if (!canEditPersonalInfo || !window.confirm("Voulez-vous supprimer ce stage ?")) return;
    await db.collection('internships').doc(internshipId).delete();
  };

  const toggleBadge = (badgeLabel: string) => {
    if (!isStaff) return;
    const currentBadges = localStudent.badges || [];
    const updatedBadges = currentBadges.includes(badgeLabel)
      ? currentBadges.filter(b => b !== badgeLabel)
      : [...currentBadges, badgeLabel];
    handleChange('badges', updatedBadges);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("La photo est trop lourde (max 2Mo)");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      handleChange('avatar', reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const disciplinaryStatus = useMemo(() => {
    const abs = localStudent.unjustifiedAbsences || 0;
    if (abs >= 21) return { label: 'Exclusion', color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20', icon: ShieldX, desc: 'Seuil d\'exclusion définitive atteint.' };
    if (abs >= 16) return { label: 'Blâme', color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: Gavel, desc: 'Blâme officiel inscrit au dossier.' };
    if (abs >= 11) return { label: 'Avertissement', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: AlertTriangle, desc: 'Avertissement de conduite.' };
    if (abs >= 6) return { label: 'Convocation', color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', icon: PhoneCall, desc: 'Convocation parent / tuteur requise.' };
    return { label: 'Situation Normale', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: CheckCircle2, desc: 'Aucune sanction disciplinaire.' };
  }, [localStudent.unjustifiedAbsences]);

  const generateSocialBilanReport = () => {
    if (!canSeeFullAccess) return;
    const doc = new jsPDF();
    const s = localStudent;
    const c = classes.find(cl => cl.id === s.classId);
    let y = 20;

    doc.setFontSize(10).setFont("helvetica", "normal").text("RÉPUBLIQUE DU SÉNÉGAL", 105, y, { align: 'center' });
    y += 5; doc.text("MINISTÈRE DE LA FORMATION PROFESSIONNELLE", 105, y, { align: 'center' });
    y += 5; doc.setFont("helvetica", "bold").text("LYCÉE TECHNIQUE ET PROFESSIONNEL DE FATICK", 105, y, { align: 'center' });
    y += 15;

    doc.setFontSize(18).text("BILAN DE VIE SCOLAIRE & SOCIALE", 105, y, { align: 'center' });
    y += 15;

    doc.setFontSize(12).setFont("helvetica", "bold").text("1. IDENTITÉ DE L'ÉLÈVE", 20, y);
    y += 8;
    doc.setFontSize(11).setFont("helvetica", "normal");
    doc.text(`Nom Complet : ${s.firstName} ${s.name}`, 25, y); y += 7;
    doc.text(`Matricule : ${s.matricule}`, 25, y); y += 7;
    doc.text(`Classe : ${c?.name || 'N/A'}`, 25, y); y += 15;

    doc.setFontSize(12).setFont("helvetica", "bold").text("2. DISCIPLINE & ALERTES", 20, y);
    y += 8;
    doc.setFontSize(11).setFont("helvetica", "normal");
    doc.text(`Cumul des Absences Injustifiées : ${s.unjustifiedAbsences} Heures`, 25, y); y += 7;
    doc.setFont("helvetica", "bold").text(`Statut Disciplinaire Actuel : ${disciplinaryStatus.label.toUpperCase()}`, 25, y); y += 7;
    doc.setFontSize(10).setFont("helvetica", "italic").text(`Note : ${disciplinaryStatus.desc}`, 25, y); y += 15;

    doc.setFontSize(12).setFont("helvetica", "bold").text("3. JOURNAL DES INCIDENCES", 20, y);
    y += 8;
    if (s.incidents && s.incidents.length > 0) {
      s.incidents.forEach((inc) => {
        doc.setFontSize(10).setFont("helvetica", "bold").text(`${new Date(inc.date).toLocaleDateString()} - SÉVÉRITÉ : ${inc.severity.toUpperCase()}`, 25, y);
        y += 5;
        doc.setFont("helvetica", "normal").text(`${inc.description}`, 30, y, { maxWidth: 160 });
        y += 10;
        if (y > 270) { doc.addPage(); y = 20; }
      });
    } else {
      doc.setFontSize(11).setFont("helvetica", "italic").text("Aucune incidence signalée au dossier.", 25, y);
      y += 15;
    }

    doc.setFontSize(12).setFont("helvetica", "bold").text("4. MÉRITES & GAMIFICATION", 20, y);
    y += 8;
    if (s.badges && s.badges.length > 0) {
      doc.setFontSize(11).setFont("helvetica", "normal").text(`Prix et Mérites obtenus : ${s.badges.join(' | ')}`, 25, y);
      y += 10;
    } else {
      doc.setFontSize(11).setFont("helvetica", "italic").text("Aucun mérite particulier pour le moment.", 25, y);
      y += 10;
    }

    y = 260;
    doc.setFontSize(10).setFont("helvetica", "bold");
    doc.text("Cachet de la Surveillance", 30, y);
    doc.text("Le Proviseur / DE", 140, y);

    doc.save(`Bilan_Social_LTPF_${s.name}.pdf`);
  };

  const generateFullStudentDossier = () => {
    if (!canSeeFullAccess) return;
    const doc = new jsPDF();
    const s = localStudent;
    const c = classes.find(cl => cl.id === s.classId);
    let y = 20;

    doc.setFontSize(10).setFont("helvetica", "normal").text("RÉPUBLIQUE DU SÉNÉGAL", 105, y, { align: 'center' });
    y += 5; doc.text("MINISTÈRE DE LA FORMATION PROFESSIONNELLE", 105, y, { align: 'center' });
    y += 5; doc.setFont("helvetica", "bold").text("LYCÉE TECHNIQUE ET PROFESSIONNEL DE FATICK", 105, y, { align: 'center' });
    y += 15;

    doc.setFontSize(18).text("DOSSIER ADMINISTRATIF DE L'ÉLÈVE", 105, y, { align: 'center' });
    y += 15;

    doc.setFontSize(12).setFont("helvetica", "bold").text("1. ÉTAT CIVIL & SCOLARITÉ", 20, y);
    y += 8;
    doc.setFontSize(11).setFont("helvetica", "normal");
    doc.text(`Prénom & Nom : ${s.firstName} ${s.name}`, 25, y); y += 7;
    doc.text(`Matricule : ${s.matricule}`, 25, y); y += 7;
    doc.text(`Classe : ${c?.name || 'N/A'}`, 25, y); y += 7;
    doc.text(`Né(e) le : ${s.birthDate || 'N/A'}`, 25, y); y += 7;
    doc.text(`À : ${s.birthPlace || 'N/A'}`, 25, y); y += 7;
    doc.text(`Secteur : ${s.sector || 'Public'}`, 25, y); y += 15;

    doc.setFontSize(12).setFont("helvetica", "bold").text("2. COORDONNÉES PERSONNELLES", 20, y);
    y += 8;
    doc.setFontSize(11).setFont("helvetica", "normal");
    doc.text(`Adresse : ${s.address || 'N/A'}`, 25, y); y += 7;
    doc.text(`Téléphone : ${s.phone || 'N/A'}`, 25, y); y += 15;

    doc.setFontSize(12).setFont("helvetica", "bold").text("3. TUTEUR & URGENCE", 20, y);
    y += 8;
    doc.setFontSize(11).setFont("helvetica", "normal");
    doc.text(`Nom du Tuteur : ${s.parentName || 'N/A'}`, 25, y); y += 7;
    doc.text(`Contact d'Urgence : ${s.emergencyPhone || 'N/A'}`, 25, y); y += 15;

    doc.setFontSize(9).setFont("helvetica", "italic").text("Ce document est une fiche officielle issue du système Silicon Campus LTP Fatick.", 105, 280, { align: 'center' });

    doc.save(`Dossier_Administratif_LTPF_${s.name}.pdf`);
  };

  const tabs = [
    { id: 'vie', icon: History, label: 'Social', visible: true },
      { id: 'conseil', icon: MessageSquare, label: 'Conseil', visible: isStaff || isOwnProfile },
    { id: 'profil', icon: UserRound, label: 'Profil', visible: canSeeFullAccess },
    { id: 'qr', icon: QrCode, label: 'Pass', visible: canSeeFullAccess }
  ].filter(t => t.visible);

  return (
    <div className="fixed inset-0 z-[500] bg-[#1e293b] flex flex-col min-h-screen animate-in slide-in-from-right duration-300 overflow-y-auto">
      <div className="px-6 py-5 flex items-center justify-between border-b border-white/5 shrink-0 bg-[#1e293b]/80 backdrop-blur-md sticky top-0 z-20">
        <button onClick={onClose} className="p-3 glass text-slate-400 rounded-2xl active:scale-90 transition-transform"><ArrowLeft size={20} /></button>
        <div className="text-center">
          <h3 className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] mb-0.5">{canSeeFullAccess ? 'Dossier Académique' : 'Profil Public'}</h3>
          <p className="font-black text-indigo-400 uppercase leading-none text-sm truncate max-w-[150px]">{localStudent.firstName} {localStudent.name}</p>
        </div>
        <div className="flex items-center gap-2">
            {(isStaff || isOwnProfile) && onOpenChat && (
                <button 
                  onClick={() => onOpenChat(localStudent.id)} 
                  className={`p-3 glass rounded-2xl active:scale-90 transition-transform ${isOwnProfile ? 'text-amber-400 border-amber-500/30' : 'text-emerald-400 border-emerald-500/30'}`}
                  title={isOwnProfile ? "Contacter la Vie Scolaire" : "Contacter l'élève"}
                >
                  <MessageSquare size={20} />
                </button>
            )}
            {canEditPersonalInfo ? (
            <button onClick={() => { onUpdate(localStudent); onClose(); }} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-indigo-500/20 active:scale-95 transition-all">Sauver</button>
            ) : <div className="w-12"></div>}
        </div>
      </div>

      <div className="flex-1 overscroll-contain pb-32 max-w-2xl mx-auto w-full">
        <section className="px-6 pt-8 pb-4">
           <div className="glass rounded-[3.5rem] p-8 flex flex-col items-center relative overflow-hidden border border-white/5 shadow-inner">
              <div className="absolute -bottom-4 -right-4 opacity-5 rotate-12 text-white"><GraduationCap size={120} /></div>
              <div className="relative">
                 <div className="h-32 w-32 rounded-[2.5rem] bg-white/5 border-4 border-white/10 flex items-center justify-center font-black text-4xl text-indigo-400 overflow-hidden shadow-2xl">
                    {localStudent.avatar ? <img src={localStudent.avatar} className="h-full w-full object-cover" alt="Avatar" /> : localStudent.firstName?.[0]}
                 </div>
                 {canEditPersonalInfo && <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 -right-2 p-3 bg-indigo-600 text-white rounded-2xl shadow-xl active:scale-90"><Camera size={18} /></button>}
                 <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange}/>
              </div>
              <div className="text-center mt-5">
                <h2 className="text-xl font-black uppercase text-white tracking-tight leading-tight">{localStudent.firstName} <br/> {localStudent.name}</h2>
                <div className="flex flex-wrap justify-center gap-2 mt-3">
                   <span className="px-3 py-1.5 bg-indigo-600 text-white rounded-full text-[8px] font-black uppercase">{classes.find(c => c.id === localStudent.classId)?.name || 'N/A'}</span>
                   {canSeeFullAccess && <span className="px-3 py-1.5 glass text-slate-400 rounded-full text-[8px] font-black uppercase tracking-tighter border border-white/5">MAT: {localStudent.matricule}</span>}
                </div>
              </div>
           </div>
        </section>

        {canSeeFullAccess && (
          <section className="px-6 sticky top-24 z-10">
            <div className="flex glass p-1.5 rounded-[2rem] gap-1 backdrop-blur-xl border border-white/10 shadow-xl overflow-x-auto hide-scrollbar">
               {tabs.map(tab => (
                 <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl text-[9px] font-black uppercase transition-all shrink-0 ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500'}`}><tab.icon size={14} /> {tab.label}</button>
               ))}
            </div>
          </section>
        )}

        <div className="p-6">
          {activeTab === 'vie' && (
            <div className="space-y-8 animate-slide-up">
               {canSeeFullAccess && (
                 <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                      <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><ShieldAlert size={14} /> Surveillance Disciplinaire</h4>
                      {isStaff && (
                        <div className="flex gap-2">
                          <button onClick={() => setShowAbsenceForm(!showAbsenceForm)} className={`p-2 rounded-xl transition-all ${showAbsenceForm ? 'bg-indigo-600 text-white shadow-lg' : 'glass text-indigo-400'}`}><Plus size={16} /></button>
                          <button onClick={() => setShowIncidentForm(!showIncidentForm)} className={`p-2 rounded-xl transition-all ${showIncidentForm ? 'bg-amber-600 text-white shadow-lg' : 'glass text-amber-400'}`}><ShieldAlert size={16} /></button>
                        </div>
                      )}
                    </div>

                   {showAbsenceForm && canManageAttendance && (
                      <div className="glass p-6 rounded-[2.5rem] border-indigo-500/20 space-y-4 animate-slide-up shadow-xl">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-black text-white uppercase">Heures à ajouter</p>
                          <div className="flex items-center gap-4">
                            <button onClick={() => setAbsenceHoursToAdd(Math.max(1, absenceHoursToAdd - 1))} className="w-8 h-8 glass rounded-lg text-white font-black">-</button>
                            <span className="text-xl font-black text-indigo-400">{absenceHoursToAdd}H</span>
                            <button onClick={() => setAbsenceHoursToAdd(absenceHoursToAdd + 1)} className="w-8 h-8 glass rounded-lg text-white font-black">+</button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-indigo-400 uppercase ml-2 tracking-widest">Motif de l'absence</label>
                          <div className="relative">
                            <input 
                              type="text"
                              placeholder="Ex: Raisons médicales..."
                              value={absenceMotif}
                              onChange={(e) => setAbsenceMotif(e.target.value)}
                              className="w-full bg-white/5 p-4 rounded-2xl text-[11px] font-bold text-white outline-none border border-white/5 focus:border-indigo-500/50 transition-all placeholder:text-slate-600" 
                            />
                            <FileSignature className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                          </div>
                        </div>
                        <button onClick={handleAddAbsence} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] shadow-lg active:scale-95 transition-all">
                          Enregistrer l'Absence
                        </button>
                      </div>
                    )}

                    {canManageAttendance && localStudent.absenceLogs && localStudent.absenceLogs.length > 0 && (
                      <div className="space-y-3 mt-6">
                        <div className="flex items-center justify-between px-2">
                          <h4 className="text-[9px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2"><History size={12}/> Historique Récent</h4>
                        </div>
                        <div className="space-y-2">
                          {localStudent.absenceLogs.map((log) => (
                            <div key={log.id} className="glass p-4 rounded-2xl flex items-center justify-between group border border-white/5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-indigo-400 text-xs font-black italic">{log.hours}H</div>
                                <div>
                                  <p className="text-[9px] font-black text-white uppercase">{new Date(log.date).toLocaleDateString()}</p>
                                  <p className="text-[7px] font-bold text-slate-500 uppercase">Motif: {log.motif}</p>
                                </div>
                              </div>
                              <button onClick={() => handleDeleteAbsenceLog(log.id)} className="p-2 text-rose-500/50 hover:text-rose-500 transition-colors active:scale-90"><Trash2 size={16}/></button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {showIncidentForm && canManageIncidents && (
                      <div className="glass p-6 rounded-[2.5rem] border-amber-500/20 space-y-4 animate-slide-up shadow-2xl relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12"><AlertOctagon size={60} className="text-amber-500" /></div>
                         <div className="space-y-2">
                           <label className="text-[10px] font-black text-amber-500 uppercase ml-2 tracking-widest">Description de l'incidence</label>
                           <textarea 
                             placeholder="Ex: Retard répété..." 
                             value={newIncident.description} 
                             onChange={e => setNewIncident({...newIncident, description: e.target.value})} 
                             className="w-full bg-white/5 p-4 rounded-2xl text-[11px] font-bold text-white outline-none border border-white/5 min-h-[100px] focus:border-amber-500/50 transition-all placeholder:text-slate-700"
                           />
                         </div>
                         <div className="grid grid-cols-3 gap-2">
                            {['low', 'medium', 'high'].map(lvl => (
                              <button 
                                key={lvl} 
                                onClick={() => setNewIncident({...newIncident, severity: lvl as any})} 
                                className={`py-3 rounded-xl text-[8px] font-black uppercase transition-all ${newIncident.severity === lvl ? 'bg-amber-600 text-white shadow-lg' : 'bg-white/5 text-slate-500'}`}
                              >
                                {lvl === 'low' ? 'Mineur' : lvl === 'medium' ? 'Moyen' : 'Grave'}
                              </button>
                            ))}
                         </div>
                         <button onClick={handleAddIncident} className="w-full bg-amber-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] shadow-lg active:scale-95 transition-all">Soumettre le Rapport</button>
                      </div>
                    )}

                    <div className={`glass p-6 rounded-[2.5rem] border ${disciplinaryStatus.border} ${disciplinaryStatus.bg} flex items-center gap-6 relative overflow-hidden transition-all duration-500`}>
                       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${disciplinaryStatus.color} bg-white/5 shadow-inner`}><disciplinaryStatus.icon size={28} /></div>
                       <div className="flex-1">
                          <p className={`text-lg font-black uppercase italic ${disciplinaryStatus.color}`}>{disciplinaryStatus.label}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 leading-tight">{disciplinaryStatus.desc}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-2xl font-black text-white">{localStudent.unjustifiedAbsences}H</p>
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Absences</p>
                       </div>
                    </div>
                    
                    {canManageAttendance && localStudent.emergencyPhone && (
                      <button 
                        onClick={async () => {
                          const msg = ` Bonjour votre enfant ${localStudent.firstName} ${localStudent.name} est absent aujourd'hui. Merci de contacter la surveillance.`;
                          const success = await sendSMS(localStudent.emergencyPhone!, msg);
                          if (success) {
                            alert("SMS de rappel envoyé au parent.");
                          } else {
                            alert("Échec de l'envoi du SMS. Veuillez vérifier la configuration Orange.");
                          }
                        }}
                        className="w-full bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 py-4 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2 active:scale-95 transition-all"
                      >
                        <PhoneForwarded size={16} /> Envoyer SMS de rappel au Parent
                      </button>
                    )}
                    {localStudent.incidents?.length > 0 && (
                      <div className="space-y-3 pt-4">
                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-2 flex items-center gap-2"><ClipboardList size={14} /> Journal de Conduite</h4>
                        <div className="space-y-3">
                          {localStudent.incidents.map((inc) => (
                            <div key={inc.id} className="glass p-5 rounded-[2rem] border-white/5 flex gap-4 hover:bg-white/5 transition-all group items-center">
                              <div className={`w-1 h-12 rounded-full shrink-0 ${inc.severity === 'high' ? 'bg-rose-500' : inc.severity === 'medium' ? 'bg-amber-500' : 'bg-indigo-500'}`}></div>
                              <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                  <p className="text-[8px] font-black text-slate-500 uppercase">{new Date(inc.date).toLocaleDateString()}</p>
                                  <span className={`text-[7px] font-black uppercase ${inc.severity === 'high' ? 'text-rose-500' : inc.severity === 'medium' ? 'text-amber-500' : 'text-indigo-400'}`}>{inc.severity}</span>
                                </div>
                                <p className="text-[11px] font-medium text-slate-300 leading-snug">{inc.description}</p>
                              </div>
                              {/* Bouton supprimer incidence ajouté ici */}
                              {isStaff && (
                                <button 
                                  onClick={() => handleDeleteIncident(inc.id)}
                                  className="p-3 text-rose-500/40 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all active:scale-90 shrink-0"
                                  title="Supprimer l'incidence"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <button onClick={generateSocialBilanReport} className="w-full bg-indigo-600 text-white py-6 rounded-[2rem] text-[11px] font-black uppercase flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-indigo-500/20">
                      <FileDown size={20} /> Exporter Bilan Social & Gamification PDF
                    </button>
                 </div>
               )}

               <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><Star size={14} className="text-amber-500" /> Mérites & Gamification</h4>
                    {canManageBadges && <span className="text-[7px] font-black text-indigo-400 uppercase italic">Cliquer pour décerner</span>}
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-4 hide-scrollbar">
                    {AVAILABLE_BADGES.map(badge => {
                      const isOwned = localStudent.badges?.includes(badge.label);
                      return (
                        <button key={badge.id} onClick={() => toggleBadge(badge.label)} disabled={!isStaff} className={`shrink-0 h-24 w-24 rounded-3xl flex flex-col items-center justify-center gap-1 border-2 transition-all ${isOwned ? 'glass border-indigo-500 shadow-lg scale-105 bg-indigo-500/10' : 'bg-white/5 border-transparent opacity-20 hover:opacity-40'}`}>
                           <span className="text-2xl">{badge.icon}</span>
                           <span className="text-[7px] font-black uppercase text-white">{badge.label}</span>
                        </button>
                      );
                    })}
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'profil' && canSeeFullAccess && (
            <div className="space-y-10 animate-slide-up pb-12">
               <div className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest flex items-center gap-2"><UserPlus size={14}/> Dossier Personnel</h4>
                  <div className="grid grid-cols-1 gap-4">
                     <div className="glass p-5 rounded-[2rem] border-white/5 group focus-within:border-indigo-500/50 transition-all">
                        <div className="flex items-center gap-5">
                          <Landmark size={20} className="text-slate-500 group-focus-within:text-indigo-400 transition-colors shrink-0" />
                          <div className="flex-1">
                             <label className="text-[8px] font-black text-slate-500 uppercase leading-none mb-2 block tracking-widest">Secteur</label>
                             <select value={localStudent.sector || 'Public'} onChange={(e) => handleChange('sector', e.target.value)} disabled={!canEditPersonalInfo} className="w-full bg-transparent text-xs font-black text-white outline-none border-none appearance-none">
                               <option value="Public" className="bg-slate-900 text-white">Public</option>
                               <option value="Privé" className="bg-slate-900 text-white">Privé</option>
                             </select>
                          </div>
                        </div>
                     </div>
                     {[
                       { id: 'birthDate', label: 'Date de Naissance', value: localStudent.birthDate, icon: Calendar, type: 'date' },
                       { id: 'birthPlace', label: 'Lieu de Naissance', value: localStudent.birthPlace, icon: MapPin, type: 'text' },
                       { id: 'address', label: 'Adresse Actuelle', value: localStudent.address, icon: Home, type: 'text' },
                       { id: 'phone', label: 'Téléphone', value: localStudent.phone, icon: Phone, type: 'tel' },
                       { id: 'parentName', label: 'Tuteur Légal', value: localStudent.parentName, icon: UserRound, type: 'text' },
                       { id: 'emergencyPhone', label: 'Urgence (Parent)', value: localStudent.emergencyPhone, icon: PhoneForwarded, type: 'tel' }
                     ].map((field) => (
                       <div key={field.id} className="glass p-5 rounded-[2rem] border-white/5 group focus-within:border-indigo-500/50 transition-all">
                          <div className="flex items-center gap-5">
                            <field.icon size={20} className="text-slate-500 group-focus-within:text-indigo-400 transition-colors shrink-0" />
                            <div className="flex-1">
                               <label className="text-[8px] font-black text-slate-500 uppercase leading-none mb-2 block tracking-widest">{field.label}</label>
                               <input type={field.type} value={field.value || ''} onChange={(e) => handleChange(field.id as keyof Student, e.target.value)} disabled={!canEditPersonalInfo} className="w-full bg-transparent text-xs font-black text-white outline-none border-none placeholder:text-slate-800" />
                            </div>
                          </div>
                       </div>
                     ))}
                  </div>
                  <button onClick={generateFullStudentDossier} className="w-full bg-white/5 border border-indigo-500/20 text-indigo-400 py-6 rounded-[2rem] text-[11px] font-black uppercase flex items-center justify-center gap-3 active:scale-95 transition-all shadow-lg mt-4">
                    <FileText size={20} /> Exporter Dossier Administratif PDF
                  </button>
               </div>
               <div className="space-y-6">
                   <div className="flex items-center justify-between px-2">
                     <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2"><CaseIcon size={14}/> Parcours en Entreprise</h4>
                     {canEditPersonalInfo && (
                       <button 
                        onClick={() => setShowInternshipForm(!showInternshipForm)} 
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all shadow-lg ${showInternshipForm ? 'bg-rose-500/10 text-rose-500' : 'bg-indigo-600 text-white'}`}
                       >
                         {showInternshipForm ? <X size={14}/> : <Plus size={14} />} {showInternshipForm ? 'Annuler' : 'Ajouter un Stage'}
                       </button>
                     )}
                   </div>
                   {showInternshipForm && (
                     <div className="glass p-6 rounded-[2.5rem] border-indigo-500/20 space-y-4 animate-slide-up shadow-2xl">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-indigo-400 uppercase ml-2 tracking-widest">Entreprise d'accueil</label>
                           <select 
                             value={newInternship.companyName} 
                             onChange={e => setNewInternship({...newInternship, companyName: e.target.value})} 
                             className="w-full bg-white/5 p-4 rounded-2xl text-xs font-black text-white outline-none border border-white/5"
                           >
                             <option value="" className="bg-slate-900 text-slate-500 italic">-- Choisir une entreprise --</option>
                             {availableCompanies.map(c => (
                               <option key={c.id} value={c.name} className="bg-slate-900 text-white font-bold uppercase">{c.name}</option>
                             ))}
                             <option value="Autre" className="bg-slate-900 text-amber-500 font-bold uppercase">-- Autre (entrer manuellement) --</option>
                           </select>
                        </div>

                        {(newInternship.companyName === 'Autre' || !availableCompanies.some(c => c.name === newInternship.companyName)) && newInternship.companyName !== '' && (
                          <input 
                           type="text" 
                           placeholder="Nom de l'entreprise..." 
                           onChange={e => setNewInternship({...newInternship, companyName: e.target.value})} 
                           className="w-full bg-white/5 p-4 rounded-2xl text-xs font-black text-white outline-none border border-amber-500/30" 
                          />
                        )}

                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                             <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Date Début</label>
                             <input type="date" value={newInternship.startDate} onChange={e => setNewInternship({...newInternship, startDate: e.target.value})} className="w-full bg-white/5 p-4 rounded-2xl text-xs font-black text-white outline-none border border-white/5" />
                           </div>
                           <div className="space-y-2">
                             <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Date Fin</label>
                             <input type="date" value={newInternship.endDate} onChange={e => setNewInternship({...newInternship, endDate: e.target.value})} className="w-full bg-white/5 p-4 rounded-2xl text-xs font-black text-white outline-none border border-white/5" />
                           </div>
                        </div>

                        <div className="space-y-2">
                           <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Tuteur industriel</label>
                           <input type="text" placeholder="Prénom Nom du tuteur..." value={newInternship.tutorName} onChange={e => setNewInternship({...newInternship, tutorName: e.target.value})} className="w-full bg-white/5 p-4 rounded-2xl text-xs font-black text-white outline-none border border-white/5" />
                        </div>

                        <button onClick={handleAddInternship} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] shadow-lg shadow-indigo-600/20 active:scale-95 transition-all">Inscrire le Stage</button>
                     </div>
                   )}
                   <div className="grid grid-cols-1 gap-4">
                      {internshipsFromCollection.length ? internshipsFromCollection.map(intern => (
                        <div key={intern.id} className="glass p-6 rounded-[2.5rem] border-white/5 space-y-4 hover:bg-white/5 transition-all group">
                           <div className="flex justify-between items-start">
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600/10 transition-all"><Building size={20} /></div>
                                 <div>
                                    <p className="text-sm font-black text-white uppercase leading-none">{intern.companyName}</p>
                                    <p className="text-[9px] font-bold text-slate-500 uppercase mt-1 italic">Tuteur : {intern.tutorName}</p>
                                 </div>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                 <span className={`px-3 py-1 rounded-full text-[7px] font-black uppercase ${intern.status === 'TERMINÉ' || intern.status === 'Terminé' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500'}`}>{intern.status}</span>
                                 {canEditPersonalInfo && (
                                   <button onClick={() => handleDeleteInternship(intern.id)} className="p-2 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity active:scale-90"><Trash2 size={14}/></button>
                                 )}
                              </div>
                           </div>
                           <div className="flex items-center gap-3 px-1">
                              <div className="flex flex-col">
                                 <span className="text-[8px] font-black text-slate-600 uppercase">Période</span>
                                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{intern.startDate} {"→"} {intern.endDate || '...'}</span>
                              </div>
                           </div>
                        </div>
                      )) : <div className="py-8 text-center glass rounded-[2rem] border-dashed border-white/10 opacity-30"><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Aucun stage répertorié</p></div>}
                   </div>
                </div>
            </div>
          )}

          {activeTab === 'conseil' && (isStaff || isOwnProfile) && (
            <div className="flex flex-col h-[500px] glass rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl animate-slide-up">
              <div className="p-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest pl-2">Espace de Discussion Privé</span>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-[8px] font-black uppercase text-emerald-500">Sécurisé</span>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-900/10">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-20 space-y-4">
                    <MessageSquare size={48} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-center">Aucun message pour le moment.<br/>Engagez la discussion.</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = msg.senderId === currentUser.id;
                    return (
                      <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                        <div className={`max-w-[85%] space-y-1`}>
                          <div className={`px-5 py-3 rounded-2xl text-[12px] font-medium leading-relaxed shadow-lg ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white/5 text-slate-200 rounded-tl-none border border-white/5'}`}>{msg.text}</div>
                          <p className={`text-[8px] font-bold text-slate-600 uppercase px-2 ${isMe ? 'text-right' : 'text-left'}`}>
                            {msg.timestamp?.toMillis ? new Date(msg.timestamp.toMillis()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Maintenant'}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={scrollRef} />
              </div>

              <form onSubmit={handleSendMessage} className="p-4 bg-slate-900/50 border-t border-white/5">
                <div className="flex gap-2 bg-white/5 p-1.5 rounded-[1.8rem] border border-white/5 focus-within:border-indigo-500/50 transition-all">
                  <input 
                    type="text" 
                    value={newMessage} 
                    onChange={e => setNewMessage(e.target.value)} 
                    placeholder="Conseil, convention..." 
                    className="flex-1 bg-transparent px-5 text-[11px] font-medium text-white outline-none placeholder:text-slate-600" 
                  />
                  <button 
                    type="submit" 
                    disabled={!newMessage.trim()} 
                    className="h-10 w-10 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 disabled:opacity-30 transition-all"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </form>
            </div>
          )}

           {activeTab === 'conseil' && (isStaff || isOwnProfile) && (
            <div className="flex flex-col h-[500px] glass rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl animate-slide-up">
              <div className="p-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest pl-2">Espace de Discussion Privé</span>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-[8px] font-black uppercase text-emerald-500">Sécurisé</span>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-900/10">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-20 space-y-4">
                    <MessageSquare size={48} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-center">Aucun message pour le moment.<br/>Engagez la discussion.</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = msg.senderId === currentUser.id;
                    return (
                      <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                        <div className={`max-w-[85%] space-y-1`}>
                          <div className={`px-5 py-3 rounded-2xl text-[12px] font-medium leading-relaxed shadow-lg ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white/5 text-slate-200 rounded-tl-none border border-white/5'}`}>{msg.text}</div>
                          <p className={`text-[8px] font-bold text-slate-600 uppercase px-2 ${isMe ? 'text-right' : 'text-left'}`}>
                            {msg.timestamp?.toMillis ? new Date(msg.timestamp.toMillis()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Maintenant'}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={scrollRef} />
              </div>

              <form onSubmit={handleSendMessage} className="p-4 bg-slate-900/50 border-t border-white/5">
                <div className="flex gap-2 bg-white/5 p-1.5 rounded-[1.8rem] border border-white/5 focus-within:border-indigo-500/50 transition-all">
                  <input 
                    type="text" 
                    value={newMessage} 
                    onChange={e => setNewMessage(e.target.value)} 
                    placeholder="Conseil, convention..." 
                    className="flex-1 bg-transparent px-5 text-[11px] font-medium text-white outline-none placeholder:text-slate-600" 
                  />
                  <button 
                    type="submit" 
                    disabled={!newMessage.trim()} 
                    className="h-10 w-10 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 disabled:opacity-30 transition-all"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'qr' && canSeeFullAccess && (
            <div className="flex flex-col items-center gap-10 py-12 animate-slide-up">
               <div className="glass p-10 rounded-[4rem] border-white/10 shadow-3xl relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500/40 animate-pulse"></div>
                  <QRCodeDisplay text={`LTPF-STUDENT-${localStudent.id}`} />
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
