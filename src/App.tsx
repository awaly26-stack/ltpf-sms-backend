
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Loader2, Plus, Trash2, Edit, Megaphone, AlertCircle, Send, Heart, Settings, MessageSquare, UserPlus, ChevronRight, Printer, FileDown
} from 'lucide-react';
import { jsPDF } from "jspdf";

import { db, auth } from './firebaseConfig';
import { Student, Teacher, SchoolClass, Subject, SchoolEvent, User, Role, InventoryItem, InventoryMovement, EventType, Comment, AbsenceLog, MediaFile, TechnicalProject  } from './types';
import { ADMIN_KEY, INITIAL_LEVELS, INITIAL_FIELDS, INITIAL_DIPLOMAS } from './constants';
import { Modal } from './components';
import { StudentDetail } from './StudentDetail';
import { TeacherDetail } from './TeacherDetail';
import { StaffDetail } from './StaffDetail';
import { Messaging } from './messaging';
import { generateMatricule, toPlainObject, sendSMS, sendAbsenceSMS, fetchWithRetry } from './utils';

import { HomeView } from './HomeView';
import { CampusView } from './CampusView';
import { AdminView } from './AdminView';
import { InventoryModule } from './InventoryModule';
import { ChefTravauxModule } from './ChefTravauxModule';
import { DirecteurEtudesModule } from './DirecteurEtudesModule';
import { ProviseurModule } from './ProviseurModule';
import { MediaModule } from './MediaModule';
//import { IntendantModule } from './IntendantModule';
import { InternshipModule } from './InternshipModule';
import { PedagogyModule } from './PedagogyModule';

import { useAuth } from './AuthContext';
import { Header } from './Header';
import { Login } from './Login';
import { Navigation, TabType } from './Navigation';

const App: React.FC = () => {
  const { currentUser, loading, isAuthReady, isStaff, isSuperAdmin, isTeacher } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
    }
    return 'dark';
  });

  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [allStaff, setAllStaff] = useState<User[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
   const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>([]);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [technicalProjects, setTechnicalProjects] = useState<TechnicalProject[]>([]);

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [chatWithStudentId, setChatWithStudentId] = useState<string | null>(null);
  const [selectedEventForComments, setSelectedEventForComments] = useState<SchoolEvent | null>(null);
  
  
  const [searchQuery, setSearchQuery] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  
  // Modals States
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [isManageStaffOpen, setIsManageStaffOpen] = useState(false);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isAddTeacherOpen, setIsAddTeacherOpen] = useState(false);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [isManageEventsOpen, setIsManageEventsOpen] = useState(false); 
  const [editingEvent, setEditingEvent] = useState<SchoolEvent | null>(null); 
  const [isManageTeachersOpen, setIsManageTeachersOpen] = useState(false);
  const [isManageClassesOpen, setIsManageClassesOpen] = useState(false);
  const [isManageSubjectsOpen, setIsManageSubjectsOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isChefTravauxOpen, setIsChefTravauxOpen] = useState(false);
  const [isDirecteurEtudesOpen, setIsDirecteurEtudesOpen] = useState(false);
  const [isProviseurOpen, setIsProviseurOpen] = useState(false);
  const [isMediaOpen, setIsMediaOpen] = useState(false);
 //const [isIntendantOpen, setIsIntendantOpen] = useState(false);
  const [isInternshipOpen, setIsInternshipOpen] = useState(false);
  const [isPedagogyOpen, setIsPedagogyOpen] = useState(false);
  const [isExportAbsencesOpen, setIsExportAbsencesOpen] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(false);

  // Form States
  const [newStaff, setNewStaff] = useState<{firstName: string, name: string, role: Role, matricule?: string}>({ firstName: '', name: '', role: 'SURVEILLANT' });
  const [newStudent, setNewStudent] = useState<Partial<Student>>({ firstName: '', name: '', matricule: '', classId: '' });
  const [newTeacher, setNewTeacher] = useState<Partial<Teacher>>({ firstName: '', name: '', phone: '', subjectIds: [], classIds: [], role: 'PROFESSEUR', matricule: ''  });
  const [newClass, setNewClass] = useState<Partial<SchoolClass>>({ 
    name: '', 
    level: INITIAL_LEVELS[0], 
    field: INITIAL_FIELDS[0], 
    diploma: INITIAL_DIPLOMAS[0] 
  });
  const [newSubject, setNewSubject] = useState<Partial<Subject>>({ name: '', category: 'GENERAL', coefficient: 1 });
  const [newEvent, setNewEvent] = useState<Partial<SchoolEvent>>({ title: '', description: '', type: 'SURVEILLANT_GEN', isUrgent: false });
  // const [newItem, setNewItem] = useState<Partial<InventoryItem>>({ name: '', category: 'Atelier', status: 'opérationnel', quantity: 1 });

 
  const studentStats = useMemo(() => {
    const total = students.length || 1;
    const presentCount = students.filter(s => s.isPresent).length;
    
    let allGrades: number[] = [];
    students.forEach(s => {
      if (s.grades && s.grades.length > 0) {
        allGrades.push(...s.grades.map(g => g.value));
      }
    });

    const sortedForTrophy = [...students].sort((a, b) => {
      // 1. Priorité à l'assiduité (Moins d'absences injustifiées)
      if ((a.unjustifiedAbsences || 0) !== (b.unjustifiedAbsences || 0)) {
        return (a.unjustifiedAbsences || 0) - (b.unjustifiedAbsences || 0);
      }
      // 2. Priorité au mérite (Plus de badges/prix)
      if ((b.badges?.length || 0) !== (a.badges?.length || 0)) {
        return (b.badges?.length || 0) - (a.badges?.length || 0);
      }
      // 3. Priorité à l'engagement (Plus de défis complétés)
      return (b.challengeActions?.length || 0) - (a.challengeActions?.length || 0);
    });

    return {
      presenceRate: Math.round((presentCount / total) * 100),
      totalStudents: students.length,
      topStudent: sortedForTrophy[0] || null
    };
  }, [students]);

  const filteredStudents = useMemo(() => {
    let res = students;
    if (selectedClassFilter !== 'all') res = res.filter(s => s.classId === selectedClassFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      res = res.filter(s => {
        const fn = s.firstName || "";
        const n = s.name || "";
        const m = s.matricule || "";
        const nameMatch = (fn + " " + n).toLowerCase().includes(q);
        const matriculeMatch = !isTeacher && m.toLowerCase().includes(q);
        return nameMatch || matriculeMatch;
      });
    }
    return res;
  }, [students, selectedClassFilter, searchQuery, isTeacher ]);


  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  useEffect(() => {
    if (!isAuthReady || !currentUser || !auth.currentUser) return;

    const unsubStudents = db.collection("students").onSnapshot((snap) => {
      const fetchedStudents = snap.docs.map(d => {
        const data = d.data() as Student;
        const activeCount = (data.absenceLogs || [])
          .filter(log => !log.isExported)
          .reduce((sum, log) => sum + log.hours, 0);
        return { id: d.id, ...data, unjustifiedAbsences: activeCount } as Student;
      });
      setStudents(fetchedStudents);
    });

    const unsubTeachers = db.collection("teachers").onSnapshot((snap) => setTeachers(snap.docs.map(d => ({ id: d.id, ...d.data() } as Teacher))));
    const unsubClasses = db.collection("classes").onSnapshot((snap) => setClasses(snap.docs.map(d => ({ id: d.id, ...d.data() } as SchoolClass))));
    const unsubSubjects = db.collection("subjects").onSnapshot((snap) => setSubjects(snap.docs.map(d => ({ id: d.id, ...d.data() } as Subject))));
    const unsubEvents = db.collection("events").onSnapshot((snap) => {
      const evs = snap.docs.map(d => ({ id: d.id, ...d.data() } as SchoolEvent));
      evs.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setEvents(evs);
    });
    const unsubStaff = db.collection("users").onSnapshot((snap) => setAllStaff(snap.docs.filter(d => d.data().role !== 'ELEVE').map(d => ({ id: d.id, ...d.data() } as User))));
    const unsubInventory = db.collection("inventory").onSnapshot((snap) => setInventory(snap.docs.map(d => ({ id: d.id, ...d.data() } as InventoryItem))));
    const unsubMovements = db.collection("inventoryMovements").onSnapshot((snap) => setInventoryMovements(snap.docs.map(d => ({ id: d.id, ...d.data() } as InventoryMovement))));
    const unsubMedia = db.collection("media").onSnapshot((snap) => {
      const files = snap.docs.map(d => ({ id: d.id, ...d.data() } as MediaFile));
      files.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setMediaFiles(files);
    });
    const unsubProjects = db.collection("technicalProjects").onSnapshot((snap) => setTechnicalProjects(snap.docs.map(d => ({ id: d.id, ...d.data() } as TechnicalProject))));

    return () => { unsubStudents(); unsubTeachers(); unsubClasses(); unsubSubjects(); unsubEvents(); unsubStaff(); unsubInventory(); unsubMovements(); unsubMedia(); };
  }, [isAuthReady, currentUser]);

  const handleUpdateStudent = async (s: Student) => {
    const {id, ...data} = toPlainObject(s);
    await db.collection("students").doc(id).update(data);
  };

  const handlePresence = async (student: Student, isPresent: boolean) => {
    if (!isStaff) return;
    
    try {
      const updatedStudent = { ...student, isPresent };
      
      // Si c'est une absence, on ajoute un log d'absence automatique (1h par défaut)
      if (!isPresent) {
        const newLog: AbsenceLog = {
          id: Math.random().toString(36).substr(2, 9),
          date: new Date().toISOString(),
          classId: student.classId,
          hours: 1,
          motif: 'Inconnu',
          adminKey: ADMIN_KEY
        };
        
        updatedStudent.absenceLogs = [newLog, ...(student.absenceLogs || [])];
        updatedStudent.unjustifiedAbsences = (student.unjustifiedAbsences || 0) + 1;
        
        // Envoi automatique du SMS aux parents avec Orange API
        if (student.emergencyPhone) {
          const smsSuccess = await sendAbsenceSMS(student.emergencyPhone, `${student.firstName} ${student.name}`);
          if (!smsSuccess) {
            alert("⚠️ L'absence a été enregistrée mais le SMS n'a pas pu être envoyé (Vérifiez la configuration Orange).");
          }
        }
      }
      
      const { id, ...data } = toPlainObject(updatedStudent);
      await db.collection("students").doc(id).update(data);
    } catch (e) {
      console.error("Erreur lors de la mise à jour de la présence:", e);
    }
  };

  const handleLikeEvent = async (eventId: string, currentLikes: number) => {
    await db.collection("events").doc(eventId).update({ likes: (currentLikes || 0) + 1 });
  };

  const handleAddComment = async () => {
    if (!selectedEventForComments || !newCommentText.trim() || !currentUser) return;
    const newComment: Comment = {
      id: Math.random().toString(36).substr(2, 9),
      userId: currentUser.id,
      userName: currentUser.name,
      text: newCommentText.trim(),
      date: new Date().toISOString()
    };
    const updatedComments = [...(selectedEventForComments.comments || []), newComment];
    await db.collection("events").doc(selectedEventForComments.id).update({ comments: updatedComments });
    setNewCommentText('');
    // Mise à jour de la modal locale pour un rendu immédiat si besoin
    setSelectedEventForComments({...selectedEventForComments, comments: updatedComments});
  };


  const handleAddEvent = async () => {
    if (!newEvent.title || !newEvent.description) {
      alert("Titre et description requis.");
      return;
    }
    setIsAppLoading(true);
    try {
      await db.collection("events").add(toPlainObject({
        ...newEvent,
        date: new Date().toISOString(),
        likes: 0,
        comments: [],
        adminKey: ADMIN_KEY
      }));
      setIsAddEventOpen(false);
      setNewEvent({ title: '', description: '', type: 'SURVEILLANT_GEN', isUrgent: false });
    } catch (e) { alert("Erreur lors de la publication."); } finally { setIsAppLoading(false); }
  };

  const handleUpdateEvent = async () => {
    if (!editingEvent || !editingEvent.title || !editingEvent.description) return;
    setIsAppLoading(true);
    try {
      const {id, ...data} = toPlainObject(editingEvent);
      await db.collection("events").doc(id).update(data);
      setEditingEvent(null);
    } catch (e) { alert("Erreur lors de la mise à jour."); } finally { setIsAppLoading(false); }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm("Supprimer définitivement cette actualité ?")) return;
    setIsAppLoading(true);
    try {
      await db.collection("events").doc(id).delete();
    } catch (e) { alert("Erreur lors de la suppression."); } finally { setIsAppLoading(false); }
  };

  const handleAddStaff = async () => {
    if (!newStaff.name || !newStaff.firstName) return;
    const matricule = (newStaff.matricule?.trim() || generateMatricule()).toUpperCase();
    await db.collection("users").add(toPlainObject({ ...newStaff, name: `${newStaff.firstName} ${newStaff.name}`, matricule, assignedClassIds: [] }));
    setIsAddStaffOpen(false);
    setNewStaff({ firstName: '', name: '', role: 'SURVEILLANT' });
  };

  const handleAddStudent = async () => {
    if (!newStudent.name) return;
    const matricule = (newStudent.matricule?.trim() || generateMatricule()).toUpperCase();
    await db.collection("students").add(toPlainObject({ ...newStudent, matricule, isPresent: true, unjustifiedAbsences: 0, absenceLogs: [], incidents: [], badges: [], grades: [], challengeActions: [], adminKey: ADMIN_KEY }));
    setIsAddStudentOpen(false);
    setNewStudent({ firstName: '', name: '', matricule: '', classId: '' });
  };

 const handleAddTeacher = async () => {
    if (!newTeacher.name || !newTeacher.firstName) return;
    const matricule = (newTeacher.matricule?.trim() || generateMatricule()).toUpperCase();
    await db.collection("teachers").add(toPlainObject({ ...newTeacher, matricule, role: 'PROFESSEUR', absenceLogs: [], isPresent: true, adminKey: ADMIN_KEY }));
    setIsAddTeacherOpen(false);
    setNewTeacher({ firstName: '', name: '', phone: '', subjectIds: [], classIds: [], role: 'PROFESSEUR', matricule: '' });
  };
   const handleFixTeacherMatricules = async () => {
    setIsAppLoading(true);
    try {
      const teachersToFix = teachers.filter(t => !t.matricule || t.matricule.trim() === "");
      if (teachersToFix.length === 0) {
        alert("Tous les professeurs ont déjà un matricule.");
        return;
      }

      for (const t of teachersToFix) {
        const newMatricule = generateMatricule();
        await db.collection("teachers").doc(t.id).update({ matricule: newMatricule });
      }
      alert(`${teachersToFix.length} matricules générés avec succès.`);
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la génération des matricules.");
    } finally {
      setIsAppLoading(false);
    }
  };

  const handleAddClass = async () => {
    if (!newClass.name) return;
    await db.collection("classes").add(toPlainObject({ ...newClass, adminKey: ADMIN_KEY }));
    setIsManageClassesOpen(false);
  };

  const handleAddSubject = async () => {
    if (!newSubject.name) return;
    await db.collection("subjects").add(toPlainObject({ ...newSubject, adminKey: ADMIN_KEY }));
    setNewSubject({ name: '', category: 'GENERAL', coefficient: 1 });
  };

   const handleCreateInventoryItem = async (item: any) => {
    setIsAppLoading(true);
    try {
      await db.collection("inventory").add(toPlainObject({
        ...item,
        entryDate: new Date(),
        updatedAt: new Date(),
        createdBy: currentUser?.name || 'Système',
        adminKey: ADMIN_KEY
      }));
    } finally { setIsAppLoading(false); }
  };

  const handleUpdateInventoryItem = async (id: string, updates: any) => {
    await db.collection("inventory").doc(id).update(toPlainObject(updates));
  };

  const handleDeleteInventoryItem = async (id: string) => {
    if (window.confirm("Supprimer cet article ?")) {
      await db.collection("inventory").doc(id).delete();
    }
  };

  const handleAddInventoryMovement = async (movement: any) => {
    await db.collection("inventoryMovements").add(toPlainObject({
      ...movement,
      userId: currentUser?.id,
      userName: currentUser?.name,
      timestamp: new Date(),
      adminKey: ADMIN_KEY
    }));
  };

  const generateClassBilanPDF = (classId?: string) => {
    const doc = new jsPDF();
    let y = 20;
    const now = new Date();
    const currentMonthNum = now.getMonth();
    const currentYear = now.getFullYear();
    const currentMonth = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    const targetClass = classId ? classes.find(c => c.id === classId) : null;
    const filteredStudents = classId ? students.filter(s => s.classId === classId) : students;

    doc.setFontSize(10).text("RÉPUBLIQUE DU SÉNÉGAL", 105, y, { align: 'center' });
    y += 5;
    doc.text("MINISTÈRE DE LA FORMATION PROFESSIONNELLE", 105, y, { align: 'center' });
    y += 5;
    doc.setFont("helvetica", "bold").text("LYCÉE TECHNIQUE ET PROFESSIONNEL DE FATICK (LTP)", 105, y, { align: 'center' });
    y += 15;

    doc.setFontSize(16).text(targetClass ? `BILAN MENSUEL DES ABSENCES - ${targetClass.name.toUpperCase()}` : "BILAN MENSUEL DES ABSENCES ÉLÈVES", 105, y, { align: 'center' });
    y += 8;
    doc.setFontSize(11).text(`MOIS DE : ${currentMonth.toUpperCase()}`, 105, y, { align: 'center' });
    y += 15;

    doc.setFontSize(10).setFont("helvetica", "bold");
    doc.text("ÉLÈVE", 20, y);
    doc.text("DATE ENREG.", 70, y);
    doc.text("CLASSE", 110, y);
    doc.text("MOTIF", 150, y);
    doc.text("DURÉE", 185, y, { align: 'right' });
    y += 4;
    doc.line(20, y, 190, y);
    y += 8;

    doc.setFont("helvetica", "normal").setFontSize(9);

    filteredStudents.forEach(s => {
      const activeLogs = (s.absenceLogs || []).filter(l => {
        const logDate = new Date(l.date);
        return !l.isExported && 
               logDate.getMonth() === currentMonthNum && 
               logDate.getFullYear() === currentYear;
      });

      if (activeLogs.length > 0) {
        // Group by date
        const groupedLogs: Record<string, { date: string, classes: Set<string>, motifs: Set<string>, totalHours: number }> = {};
        
        activeLogs.forEach(l => {
          const d = new Date(l.date);
          const dateKey = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
          const className = classes.find(c => c.id === l.classId)?.name || "N/A";
          
          if (!groupedLogs[dateKey]) {
            groupedLogs[dateKey] = { date: dateKey, classes: new Set(), motifs: new Set(), totalHours: 0 };
          }
          groupedLogs[dateKey].classes.add(className);
          groupedLogs[dateKey].motifs.add(l.motif);
          groupedLogs[dateKey].totalHours += l.hours;
        });

        // Sort by date key for cleaner report
        Object.values(groupedLogs).sort((a,b) => a.date.localeCompare(b.date)).forEach(g => {
          doc.setFont("helvetica", "bold").text(`${s.firstName} ${s.name}`, 20, y);
          doc.setFont("helvetica", "normal").text(g.date, 70, y);
          doc.text(Array.from(g.classes).join(", "), 110, y);
          doc.text(Array.from(g.motifs).join(", "), 150, y);
          doc.text(`${g.totalHours}H`, 185, y, { align: 'right' });
          
          y += 7;
          if (y > 275) { doc.addPage(); y = 20; }
        });
      }
    });

    y += 20;
    if (y > 270) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "bold").setFontSize(10);
    doc.text("Le Surveillant", 40, y);
    doc.text("Le Surveillant Général", 130, y);

    const fileName = targetClass 
      ? `Bilan_Absences_${targetClass.name}_${currentMonth.replace(' ', '_')}.pdf`
      : `Bilan_Global_Absences_${currentMonth.replace(' ', '_')}.pdf`;
    doc.save(fileName);
  };

 const generateWeeklyTeachersBilanPDF = () => {
    const doc = new jsPDF({ orientation: 'l' });
    let y = 20;

    // Calcul de la semaine (Lundi à Samedi)
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
    monday.setHours(0, 0, 0, 0);

    const saturday = new Date(monday);
    saturday.setDate(monday.getDate() + 5);
    saturday.setHours(23, 59, 59, 999);

    const dateRangeStr = `DU ${monday.toLocaleDateString('fr-FR')} AU ${saturday.toLocaleDateString('fr-FR')}`;

    // En-tête officiel
    doc.setFontSize(10).setFont("helvetica", "normal").text("RÉPUBLIQUE DU SÉNÉGAL", 148.5, y, { align: 'center' });
    y += 5;
    doc.text("MINISTÈRE DE LA FORMATION PROFESSIONNELLE", 148.5, y, { align: 'center' });
    y += 5;
    doc.setFont("helvetica", "bold").text("LYCÉE TECHNIQUE ET PROFESSIONNEL DE FATICK (LTP)", 148.5, y, { align: 'center' });
    y += 15;

    // Titre
    doc.setFontSize(16).text("BILAN HEBDOMADAIRE DES ABSENCES PROFESSEURS", 148.5, y, { align: 'center' });
    y += 8;
    doc.setFontSize(11).text(`SEMAINE ${dateRangeStr}`, 148.5, y, { align: 'center' });
    y += 15;

    // Tableau - En-têtes (Format Paysage)
    // Colonnes : Prof | Matière | Date | Classe | Motif | Durée
    doc.setFontSize(10).setFont("helvetica", "bold");
    doc.text("PROFESSEUR", 20, y);
    doc.text("MATIÈRE(S)", 75, y);
    doc.text("DATE ENREG.", 130, y);
    doc.text("CLASSE", 165, y);
    doc.text("MOTIF", 205, y);
    doc.text("DURÉE", 270, y, { align: 'right' });
    y += 4;
    doc.line(20, y, 277, y);
    y += 8;

    doc.setFont("helvetica", "normal").setFontSize(9);

    teachers.forEach(t => {
      const weeklyLogs = (t.absenceLogs || []).filter(l => {
        const logDate = new Date(l.date);
        return logDate >= monday && logDate <= saturday;
      });

      if (weeklyLogs.length > 0) {
        const teacherSubjects = t.subjectIds.map(id => subjects.find(s => s.id === id)?.name).filter(Boolean).join(", ");
        let teacherTotal = 0;
        
        weeklyLogs.forEach(l => {
          teacherTotal += l.hours;
          const className = classes.find(c => c.id === l.classId)?.name || "N/A";
          const dateStr = new Date(l.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
          
          doc.setFont("helvetica", "bold").text(`${t.firstName} ${t.name}`, 20, y);
          doc.setFont("helvetica", "normal").text(teacherSubjects, 75, y, { maxWidth: 50 });
          doc.text(dateStr, 130, y);
          doc.text(className, 165, y);
          doc.text(l.motif, 205, y, { maxWidth: 60 });
          doc.text(`${l.hours}H`, 270, y, { align: 'right' });
          
          y += 10; // Plus d'espace pour le maxWidth
          if (y > 185) { doc.addPage(); y = 20; }
        });

        // Ligne de total par professeur
        doc.setFont("helvetica", "bold").setFontSize(9);
        doc.text(`TOTAL ${t.name.toUpperCase()} :`, 205, y);
        doc.text(`${teacherTotal}H`, 270, y, { align: 'right' });
        y += 10;
        doc.line(205, y - 8, 277, y - 8);
        if (y > 185) { doc.addPage(); y = 20; }
        doc.setFont("helvetica", "normal");
      }
    });

    y += 20;
    if (y > 180) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "bold").setFontSize(10);
    doc.text("Le Surveillant", 60, y);
    doc.text("Le Surveillant Général", 200, y);

    doc.save(`Bilan_Hebdo_Profs_${dateRangeStr.replace(/ /g, '_')}.pdf`);
  };

  const generateTeachersBilanPDF = () => {
    const doc = new jsPDF();
    let y = 20;
    const now = new Date();
    const currentMonthNum = now.getMonth();
    const currentYear = now.getFullYear();
    const currentMonth = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

    doc.setFontSize(10).text("RÉPUBLIQUE DU SÉNÉGAL", 105, y, { align: 'center' });
    y += 5;
    doc.text("MINISTÈRE DE LA FORMATION PROFESSIONNELLE", 105, y, { align: 'center' });
    y += 5;
    doc.setFont("helvetica", "bold").text("LYCÉE TECHNIQUE ET PROFESSIONNEL DE FATICK (LTP)", 105, y, { align: 'center' });
    y += 15;

    doc.setFontSize(16).text(`BILAN MENSUEL DES ABSENCES PROFESSEURS`, 105, y, { align: 'center' });
    y += 8;
    doc.setFontSize(11).text(`MOIS DE : ${currentMonth.toUpperCase()}`, 105, y, { align: 'center' });
    y += 15;

    doc.setFontSize(10).setFont("helvetica", "bold");
    doc.text("PROFESSEUR", 20, y);
    doc.text("DATE ENREG.", 70, y);
    doc.text("CLASSE", 110, y);
    doc.text("MOTIF", 150, y);
    doc.text("DURÉE", 185, y, { align: 'right' });
    y += 4;
    doc.line(20, y, 190, y);
    y += 8;

    doc.setFont("helvetica", "normal").setFontSize(9);

    teachers.forEach(t => {
      const activeLogs = (t.absenceLogs || []).filter(l => {
        const logDate = new Date(l.date);
        return !l.isExported && 
               logDate.getMonth() === currentMonthNum && 
               logDate.getFullYear() === currentYear;
      });

      if (activeLogs.length > 0) {
        // Group by date
        const groupedLogs: Record<string, { date: string, classes: Set<string>, motifs: Set<string>, totalHours: number }> = {};
        let teacherTotal = 0;

        activeLogs.forEach(l => {
          teacherTotal += l.hours;
          const d = new Date(l.date);
          const dateKey = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
          const className = classes.find(c => c.id === l.classId)?.name || "N/A";

          if (!groupedLogs[dateKey]) {
            groupedLogs[dateKey] = { date: dateKey, classes: new Set(), motifs: new Set(), totalHours: 0 };
          }
          groupedLogs[dateKey].classes.add(className);
          groupedLogs[dateKey].motifs.add(l.motif);
          groupedLogs[dateKey].totalHours += l.hours;
        });

        Object.values(groupedLogs).sort((a,b) => a.date.localeCompare(b.date)).forEach(g => {
          doc.setFont("helvetica", "bold").text(`${t.firstName} ${t.name}`, 20, y);
          doc.setFont("helvetica", "normal").text(g.date, 70, y);
          doc.text(Array.from(g.classes).join(", "), 110, y);
          doc.text(Array.from(g.motifs).join(", "), 150, y);
          doc.text(`${g.totalHours}H`, 185, y, { align: 'right' });
          
          y += 7;
          if (y > 275) { doc.addPage(); y = 20; }
        });

        // Ligne de total par professeur
        doc.setFont("helvetica", "bold").setFontSize(9);
        doc.text(`TOTAL ${t.name.toUpperCase()} :`, 150, y);
        doc.text(`${teacherTotal}H`, 185, y, { align: 'right' });
        y += 10;
        doc.line(150, y - 8, 190, y - 8);
        if (y > 275) { doc.addPage(); y = 20; }
        doc.setFont("helvetica", "normal");
      }
    });

    y += 20;
    if (y > 270) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "bold").setFontSize(10);
    doc.text("Le Surveillant", 40, y);
    doc.text("Le Surveillant Général", 130, y);

    doc.save(`Bilan_Mensuel_Profs_${currentMonth.replace(' ', '_')}.pdf`);
  };

  const handleResetAllAbsences = async () => {
    if (!window.confirm("Remettre les compteurs des élèves à zéro ?")) return;
    setIsAppLoading(true);
    try {
      const batch = db.batch();
      students.forEach(s => {
        const studentRef = db.collection("students").doc(s.id);
        batch.update(studentRef, { absenceLogs: (s.absenceLogs || []).map(l => ({...l, isExported: true})), unjustifiedAbsences: 0 });
      });
      await batch.commit();
    } catch (e) { alert("Erreur."); } finally { setIsAppLoading(false); }
  };

  const handleResetTeacherAbsences = async () => {
    if (!window.confirm("Remettre les compteurs des professeurs à zéro ?")) return;
    setIsAppLoading(true);
    try {
      const batch = db.batch();
      teachers.forEach(t => {
        const teacherRef = db.collection("teachers").doc(t.id);
        batch.update(teacherRef, { 
          absenceLogs: (t.absenceLogs || []).map(l => ({...l, isExported: true}))
        });
      });
      await batch.commit();
    } catch (e) { alert("Erreur."); } finally { setIsAppLoading(false); }
  };


  if (loading || isAppLoading || !isAuthReady) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-indigo-500">
      <Loader2 className="animate-spin" size={48} />
    </div>
  );
  const handleUploadMedia = async (fileData: Omit<MediaFile, 'id' | 'date' | 'adminKey'>) => {
    await db.collection("media").add(toPlainObject({
      ...fileData,
      date: new Date().toISOString(),
      adminKey: ADMIN_KEY
    }));
  };

  const handleDeleteMedia = async (id: string) => {
    if (window.confirm("Supprimer ce fichier ?")) {
      await db.collection("media").doc(id).delete();
    }
  };

   if (loading ||  !isAuthReady) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-indigo-600 dark:text-indigo-400">
      <Loader2 className="animate-spin" size={48} />
    </div>
  );

  if (!currentUser) return <Login />;

  return (
 <div className="h-full w-full flex flex-col bg-[#f8fafc] dark:bg-[#020617] overflow-hidden transition-colors duration-500">
      <div className="mesh-bg opacity-50 dark:opacity-100"></div>
      <Header theme={theme} toggleTheme={toggleTheme} />


         <main className="flex-1 overflow-y-auto px-6 pb-32">
        {activeTab === 'home' && <HomeView events={events} mediaFiles={mediaFiles} students={students} classes={classes} studentStats={studentStats} onNavigateToAdmin={() => setActiveTab('admin')} onOpenStudentProfile={setSelectedStudentId} onOpenTeacherProfile={setSelectedTeacherId} onOpenStaffProfile={setSelectedStaffId} onUpdateStudent={handleUpdateStudent} onLikeEvent={handleLikeEvent} onOpenComments={setSelectedEventForComments} />}
        {activeTab === 'list' && <CampusView students={filteredStudents} teachers={teachers} classes={classes} allStaff={allStaff} searchQuery={searchQuery} setSearchQuery={setSearchQuery} selectedClassFilter={selectedClassFilter} setSelectedClassFilter={setSelectedClassFilter} onSelectStudent={setSelectedStudentId} onSelectTeacher={setSelectedTeacherId} onSelectStaff={setSelectedStaffId} onPresenceChange={handlePresence} />}
        {activeTab === 'admin' && isStaff && !isTeacher && <AdminView allStaff={allStaff} students={students} teachers={teachers} onSelectStaff={setSelectedStaffId} onOpenAddStaff={() => setIsAddStaffOpen(true)} onOpenAddStudent={() => setIsAddStudentOpen(true)} onOpenAddTeacher={() => setIsAddTeacherOpen(true)} onOpenAddEvent={() => setIsAddEventOpen(true)} onOpenManageEvents={() => setIsManageEventsOpen(true)} onOpenManageClasses={() => setIsManageClassesOpen(true)} onOpenManageSubjects={() => setIsManageSubjectsOpen(true)} onOpenInventory={() => setIsInventoryOpen(true)} onOpenChefTravaux={() => setIsChefTravauxOpen(true)} onOpenDirecteurEtudes={() => setIsDirecteurEtudesOpen(true)} onOpenProviseur={() => setIsProviseurOpen(true)} onOpenMedia={() => setIsMediaOpen(true)}  onOpenInternship={() => setIsInternshipOpen(true)} onOpenPedagogy={() => setIsPedagogyOpen(true)} onOpenExportAbsences={() => setIsExportAbsencesOpen(true)} onOpenExportTeacherAbsences={generateTeachersBilanPDF} onOpenExportWeeklyTeacherAbsences={generateWeeklyTeachersBilanPDF} onOpenManageStaff={() => setIsManageStaffOpen(true)} onOpenManageTeachers={() => setIsManageTeachersOpen(true)} onFixTeacherMatricules={handleFixTeacherMatricules} onResetCounters={handleResetAllAbsences} onResetTeacherCounters={handleResetTeacherAbsences} />}
        {activeTab === 'chat' && <Messaging currentUser={currentUser} students={students} targetStudentId={chatWithStudentId} onClose={() => setActiveTab('home')} />}
      </main>

      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* MODAL COMMENTAIRES ACTUALITÉ */}
      <Modal isOpen={!!selectedEventForComments} onClose={() => setSelectedEventForComments(null)} title="Discussion Campus">
         <div className="space-y-6">
            <div className="bg-white/5 p-5 rounded-3xl border border-white/5">
               <h4 className="text-xs font-black uppercase text-indigo-400 mb-1">{selectedEventForComments?.title}</h4>
               <p className="text-[11px] text-slate-400 leading-snug">{selectedEventForComments?.description}</p>
            </div>
            
            <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
               {selectedEventForComments?.comments && selectedEventForComments.comments.length > 0 ? (
                 selectedEventForComments.comments.map(comment => (
                   <div key={comment.id} className="glass p-4 rounded-[1.8rem] border border-white/5 space-y-1">
                      <div className="flex justify-between items-center">
                         <span className="text-[9px] font-black uppercase text-indigo-400">{comment.userName}</span>
                         <span className="text-[7px] font-bold text-slate-500">{new Date(comment.date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-[11px] text-slate-200 leading-relaxed">{comment.text}</p>
                   </div>
                 ))
               ) : (
                 <div className="py-10 text-center opacity-20">
                    <MessageSquare size={32} className="mx-auto mb-2" />
                    <p className="text-[10px] font-black uppercase">Aucun commentaire. Soyez le premier !</p>
                 </div>
               )}
            </div>

            <div className="flex gap-3 bg-slate-900 p-2 rounded-[2rem] border border-white/5 focus-within:border-indigo-500/50 transition-all">
               <input 
                 type="text" 
                 value={newCommentText} 
                 onChange={e => setNewCommentText(e.target.value)} 
                 placeholder="Ajouter un commentaire..." 
                 className="flex-1 bg-transparent px-5 text-xs font-medium text-white outline-none" 
               />
               <button 
                 onClick={handleAddComment}
                 disabled={!newCommentText.trim()}
                 className="h-12 w-12 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 disabled:opacity-30"
               >
                 <Send size={18} />
               </button>
            </div>
         </div>
      </Modal>

      {/* MODAL GESTION ACTUS */}
      <Modal isOpen={isManageEventsOpen} onClose={() => setIsManageEventsOpen(false)} title="Gérer le Fil d'Actualité">
        <div className="space-y-4">
          <button onClick={() => { setIsManageEventsOpen(false); setIsAddEventOpen(true); }} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
            <Plus size={16} /> Nouvelle Publication
          </button>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
            {events.length > 0 ? events.map(ev => (
              <div key={ev.id} className="glass p-5 rounded-[2rem] border border-white/5 space-y-3 hover:bg-white/5 transition-all">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-indigo-400 uppercase leading-none mb-1">{ev.type}</p>
                    <h4 className="text-xs font-black uppercase text-white truncate max-w-[200px]">{ev.title}</h4>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => setEditingEvent(ev)} className="p-2.5 glass text-amber-500 rounded-xl hover:bg-amber-500 hover:text-white transition-all"><Edit size={16} /></button>
                    <button onClick={() => handleDeleteEvent(ev.id)} className="p-2.5 glass text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={16} /></button>
                  </div>
                </div>
                <p className="text-[9px] text-slate-500 line-clamp-2 italic">"{ev.description}"</p>
                <div className="flex items-center gap-3 pt-2">
                   <span className="text-[7px] font-bold text-slate-600 uppercase">{new Date(ev.date).toLocaleDateString()}</span>
                   <div className="flex items-center gap-1">
                      <Heart size={10} className="text-rose-500" />
                      <span className="text-[7px] font-black text-slate-500">{ev.likes || 0}</span>
                   </div>
                </div>
              </div>
            )) : (
              <div className="py-20 text-center opacity-20">
                <Megaphone size={40} className="mx-auto mb-4" />
                <p className="text-[10px] font-black uppercase">Aucune actualité publiée</p>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* MODAL MODIFIER ACTUALITÉ */}
      <Modal isOpen={!!editingEvent} onClose={() => setEditingEvent(null)} title="Modifier Publication">
        <div className="space-y-4">
          <div className="space-y-1">
             <label className="text-[8px] font-black text-slate-500 uppercase ml-2 tracking-widest">Titre</label>
             <input type="text" value={editingEvent?.title || ''} onChange={e => editingEvent && setEditingEvent({...editingEvent, title: e.target.value})} className="w-full bg-slate-900 p-5 rounded-2xl text-white font-bold outline-none border border-white/5 focus:border-indigo-500" />
          </div>
          <div className="space-y-1">
             <label className="text-[8px] font-black text-slate-500 uppercase ml-2 tracking-widest">Description</label>
             <textarea rows={4} value={editingEvent?.description || ''} onChange={e => editingEvent && setEditingEvent({...editingEvent, description: e.target.value})} className="w-full bg-slate-900 p-5 rounded-2xl text-white font-medium outline-none border border-white/5 focus:border-indigo-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
             <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-500 uppercase ml-2 tracking-widest">Émetteur</label>
                <select value={editingEvent?.type} onChange={e => editingEvent && setEditingEvent({...editingEvent, type: e.target.value as EventType})} className="w-full bg-slate-900 p-5 rounded-2xl text-[10px] font-black uppercase text-white outline-none">
                  <option value="PROVISEUR">Proviseur</option>
                  <option value="DE_CT">DE / CT</option>
                  <option value="SURVEILLANT_GEN">Surveillance Gén.</option>
                  <option value="GOUVERNEMENT">Gouvernement Scol.</option>
                </select>
             </div>
             <div className="flex flex-col justify-end">
                <button onClick={() => editingEvent && setEditingEvent({...editingEvent, isUrgent: !editingEvent.isUrgent})} className={`flex items-center justify-center gap-2 p-5 rounded-2xl text-[9px] font-black uppercase transition-all ${editingEvent?.isUrgent ? 'bg-rose-600 text-white' : 'bg-slate-900 text-slate-500'}`}>
                   Urgent ?
                </button>
             </div>
          </div>
          <button onClick={handleUpdateEvent} className="w-full bg-amber-600 text-white py-6 rounded-2xl font-black uppercase text-[11px] mt-2 shadow-xl active:scale-95 transition-all">
            Mettre à jour l'information
          </button>
        </div>
      </Modal>

      {/* MODAL PUBLIER ACTUALITÉ */}
      <Modal isOpen={isAddEventOpen} onClose={() => setIsAddEventOpen(false)} title="Publier Actualité">
        <div className="space-y-4">
          <div className="space-y-1">
             <label className="text-[8px] font-black text-slate-500 uppercase ml-2 tracking-widest">Titre de l'info</label>
             <input type="text" placeholder="Ex: Report des examens..." value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} className="w-full bg-slate-900 p-5 rounded-2xl text-white font-bold outline-none border border-white/5 focus:border-indigo-500" />
          </div>
          <div className="space-y-1">
             <label className="text-[8px] font-black text-slate-500 uppercase ml-2 tracking-widest">Description complète</label>
             <textarea rows={4} placeholder="Détaillez l'actualité ici..." value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} className="w-full bg-slate-900 p-5 rounded-2xl text-white font-medium outline-none border border-white/5 focus:border-indigo-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
             <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-500 uppercase ml-2 tracking-widest">Émetteur</label>
                <select value={newEvent.type} onChange={e => setNewEvent({...newEvent, type: e.target.value as EventType})} className="w-full bg-slate-900 p-5 rounded-2xl text-[10px] font-black uppercase text-white outline-none border border-white/5">
                  <option value="PROVISEUR">Proviseur</option>
                  <option value="DE_CT">DE / CT</option>
                  <option value="SURVEILLANT_GEN">Surveillance Gén.</option>
                  <option value="GOUVERNEMENT">Gouvernement Scol.</option>
                </select>
             </div>
             <div className="flex flex-col justify-end">
                <button onClick={() => setNewEvent({...newEvent, isUrgent: !newEvent.isUrgent})} className={`flex items-center justify-center gap-2 p-5 rounded-2xl text-[9px] font-black uppercase transition-all ${newEvent.isUrgent ? 'bg-rose-600 text-white shadow-lg' : 'bg-slate-900 text-slate-500'}`}>
                  <AlertCircle size={14} /> Urgent ?
                </button>
             </div>
          </div>
          <button onClick={handleAddEvent} className="w-full bg-indigo-600 text-white py-6 rounded-2xl font-black uppercase text-[11px] mt-2 shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">
            <Megaphone size={18} /> Diffuser sur le campus
          </button>
        </div>
      </Modal>

      {/* MODAL GESTION SURVEILLANTS */}
      <Modal isOpen={isManageStaffOpen} onClose={() => setIsManageStaffOpen(false)} title="Surveillants">
        <div className="space-y-6">
          <button onClick={() => { setIsManageStaffOpen(false); setIsAddStaffOpen(true); }} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
            <UserPlus size={16} /> Nouveau Surveillant
          </button>
          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
            {allStaff.filter(s => s.role === 'SURVEILLANT').map(staff => (
              <div key={staff.id} onClick={() => { setSelectedStaffId(staff.id); setIsManageStaffOpen(false); }} className="glass p-5 rounded-3xl flex items-center justify-between group cursor-pointer border border-white/5 hover:bg-white/5 transition-all">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 font-black text-xs uppercase">{(staff.name || '?')[0]}</div>
                  <div>
                    <p className="text-xs font-black uppercase text-white leading-none">{staff.name}</p>
                    <p className="text-[7px] font-bold text-slate-500 uppercase tracking-widest mt-1">ID: {staff.matricule || 'Sans ID'}</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-600 group-hover:text-emerald-500 transition-colors" />
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* MODAL AJOUT SURVEILLANT */}
      <Modal isOpen={isAddStaffOpen} onClose={() => setIsAddStaffOpen(false)} title="Créer Compte Staff">
        <div className="space-y-4">
          <input type="text" placeholder="Prénom" value={newStaff.firstName} onChange={e => setNewStaff({...newStaff, firstName: e.target.value})} className="w-full bg-slate-900 p-5 rounded-2xl text-white font-bold outline-none border border-white/5" />
          <input type="text" placeholder="NOM" value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} className="w-full bg-slate-900 p-5 rounded-2xl text-white font-bold outline-none border border-white/5" />
          <select value={newStaff.role} onChange={e => setNewStaff({...newStaff, role: e.target.value as Role})} className="w-full bg-slate-900 p-5 rounded-2xl text-[10px] font-black uppercase text-white outline-none">
            <option value="SURVEILLANT">Surveillant</option>
            <option value="SG">Surveillant Général</option>
            <option value="CT">Chef des Travaux</option>
            <option value="DE">Dir. Études</option>
            <option value="PROVISEUR">Proviseur</option>
          </select>
          <button onClick={handleAddStaff} className="w-full bg-emerald-600 text-white py-6 rounded-2xl font-black uppercase text-[11px] shadow-xl">Valider la création</button>
        </div>
      </Modal>
      
        {/* MODAL GESTION PROFESSEURS */}
      <Modal isOpen={isManageTeachersOpen} onClose={() => setIsManageTeachersOpen(false)} title="Professeurs">
        <div className="space-y-6">
          <button onClick={() => { setIsManageTeachersOpen(false); setIsAddTeacherOpen(true); }} className="w-full bg-amber-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
            <Plus size={16} /> Ajouter Professeur
          </button>
          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
            {teachers.map(teacher => (
              <div key={teacher.id} onClick={() => { setSelectedTeacherId(teacher.id); setIsManageTeachersOpen(false); }} className="glass p-5 rounded-3xl flex items-center justify-between group cursor-pointer border border-white/5 hover:bg-white/5">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 font-black text-xs uppercase">{(teacher.firstName || '?')[0]}</div>
                  <div>
                    <p className="text-xs font-black uppercase text-white leading-none">{teacher.firstName} {teacher.name}</p>
                    <p className="text-[7px] font-bold text-slate-500 uppercase mt-1">{teacher.phone || 'Sans numéro'}</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-600 group-hover:text-amber-500 transition-colors" />
              </div>
            ))}
          </div>
        </div>
      </Modal>
      
      {/* MODAL AJOUT PROFESSEUR */}
      <Modal isOpen={isAddTeacherOpen} onClose={() => setIsAddTeacherOpen(false)} title="Nouveau Professeur">
        <div className="space-y-4">
          <input type="text" placeholder="Prénom" value={newTeacher.firstName} onChange={e => setNewTeacher({...newTeacher, firstName: e.target.value})} className="w-full bg-slate-900 p-5 rounded-2xl text-white font-bold outline-none" />
          <input type="text" placeholder="NOM" value={newTeacher.name} onChange={e => setNewTeacher({...newTeacher, name: e.target.value})} className="w-full bg-slate-900 p-5 rounded-2xl text-white font-bold outline-none" />
          <input type="text" placeholder="Matricule (Optionnel)" value={newTeacher.matricule} onChange={e => setNewTeacher({...newTeacher, matricule: e.target.value})} className="w-full bg-slate-900 p-5 rounded-2xl text-white font-bold outline-none" />
          <p className="text-[9px] text-slate-500 italic ml-2 px-2">* Laissé vide, un matricule sera généré automatiquement.</p>
          <input type="tel" placeholder="Téléphone" value={newTeacher.phone} onChange={e => setNewTeacher({...newTeacher, phone: e.target.value})} className="w-full bg-slate-900 p-5 rounded-2xl text-white font-bold outline-none" />
          <button onClick={handleAddTeacher} className="w-full bg-amber-600 text-white py-6 rounded-2xl font-black uppercase text-[11px] shadow-xl">Inscrire l'Enseignant</button>
        </div>
      </Modal>

    

      <Modal isOpen={isManageClassesOpen} onClose={() => setIsManageClassesOpen(false)} title="Gestion Classes">
        <div className="space-y-6">
          <div className="glass p-6 rounded-[2.5rem] border border-indigo-500/20 space-y-4 shadow-xl">
             <input type="text" placeholder="Nom de la classe..." value={newClass.name} onChange={e => setNewClass({...newClass, name: e.target.value})} className="w-full bg-slate-900/50 p-4 rounded-xl text-white font-bold outline-none" />
             <div className="grid grid-cols-2 gap-3">
                <select value={newClass.level} onChange={e => setNewClass({...newClass, level: e.target.value})} className="w-full bg-slate-900/50 p-4 rounded-xl text-[10px] font-black uppercase text-white outline-none">{INITIAL_LEVELS.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}</select>
                <select value={newClass.diploma} onChange={e => setNewClass({...newClass, diploma: e.target.value})} className="w-full bg-slate-900/50 p-4 rounded-xl text-[10px] font-black uppercase text-white outline-none">{INITIAL_DIPLOMAS.map(dip => <option key={dip} value={dip}>{dip}</option>)}</select>
             </div>
             <select value={newClass.field} onChange={e => setNewClass({...newClass, field: e.target.value})} className="w-full bg-slate-900/50 p-4 rounded-xl text-[10px] font-black uppercase text-white outline-none">{INITIAL_FIELDS.map(f => <option key={f} value={f}>{f}</option>)}</select>
             <button onClick={handleAddClass} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-2xl font-black uppercase text-[11px] shadow-lg flex items-center justify-center gap-2">Créer la Classe</button>
          </div>
          <div className="grid grid-cols-1 gap-2 max-h-[40vh] overflow-y-auto custom-scrollbar pr-1">
             {classes.map(cls => (
               <div key={cls.id} className="glass p-5 rounded-3xl flex items-center justify-between border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 font-black text-xs uppercase">{(cls.name || '??').substring(0, 2)}</div>
                    <div>
                      <p className="text-xs font-black uppercase text-slate-700 dark:text-white">{cls.name}</p>
                      <p className="text-[7px] font-bold text-slate-500 uppercase tracking-widest mt-1">{cls.level}</p>
                    </div>
                  </div>
                  <button onClick={() => { if(window.confirm(`Supprimer ${cls.name} ?`)) db.collection("classes").doc(cls.id).delete(); }} className="p-2 text-rose-500/30 hover:text-rose-500"><Trash2 size={18} /></button>
               </div>
             ))}
          </div>
        </div>
      </Modal>

      <Modal isOpen={isManageSubjectsOpen} onClose={() => setIsManageSubjectsOpen(false)} title="Gestion Matières">
        <div className="space-y-6">
          <div className="glass p-6 rounded-[2.5rem] border border-teal-500/20 space-y-4 shadow-xl">
             <input type="text" placeholder="Nom de la matière..." value={newSubject.name} onChange={e => setNewSubject({...newSubject, name: e.target.value})} className="w-full bg-slate-900/50 p-4 rounded-xl text-white font-bold outline-none" />
             <div className="grid grid-cols-2 gap-3">
                <select value={newSubject.category} onChange={e => setNewSubject({...newSubject, category: e.target.value as any})} className="w-full bg-slate-900/50 p-4 rounded-xl text-[10px] font-black uppercase text-white outline-none">
                  <option value="GENERAL">Général</option>
                  <option value="TECHNIQUE">Technique</option>
                  <option value="PROFESSIONNEL">Professionnel</option>
                </select>
                <input type="number" min="1" max="10" value={newSubject.coefficient} onChange={e => setNewSubject({...newSubject, coefficient: parseInt(e.target.value) || 1})} className="w-full bg-slate-900/50 p-4 rounded-xl text-xs font-black text-white outline-none" />
             </div>
             <button onClick={handleAddSubject} className="w-full bg-teal-600 hover:bg-teal-700 text-white py-5 rounded-2xl font-black uppercase text-[11px] shadow-lg flex items-center justify-center gap-2">Ajouter Matière</button>
          </div>
          <div className="grid grid-cols-1 gap-2 max-h-[40vh] overflow-y-auto custom-scrollbar pr-1">
             {subjects.map(subj => (
               <div key={subj.id} className="glass p-5 rounded-3xl flex items-center justify-between border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-teal-500/10 rounded-xl flex items-center justify-center text-teal-400 font-black text-xs uppercase">{(subj.name || '??').substring(0, 2)}</div>
                    <div><p className="text-xs font-black uppercase text-slate-700 dark:text-white">{subj.name}</p></div>
                  </div>
                  <button onClick={() => { if(window.confirm(`Supprimer ${subj.name} ?`)) db.collection("subjects").doc(subj.id).delete(); }} className="p-2 text-rose-500/30 hover:text-rose-500"><Trash2 size={18} /></button>
               </div>
             ))}
          </div>
        </div>
      </Modal>

       {isProviseurOpen && (
        <ProviseurModule 
          onClose={() => setIsProviseurOpen(false)}
          classes={classes}
          students={students}
          teachers={teachers}
          events={events}
          inventory={inventory}
          allStaff={allStaff}
          mediaFiles={mediaFiles}
          userName={currentUser?.name}
        />
      )}
       {isInventoryOpen && (
        <InventoryModule 
          items={inventory}
          movements={inventoryMovements}
          onAddItem={handleCreateInventoryItem}
          onUpdateItem={handleUpdateInventoryItem}
          onDeleteItem={handleDeleteInventoryItem}
          onAddMovement={handleAddInventoryMovement}
          isStaff={isStaff}
          userRole={currentUser?.role}
          onClose={() => setIsInventoryOpen(false)}
        />
      )}

      {isChefTravauxOpen && (
        <ChefTravauxModule 
          onClose={() => setIsChefTravauxOpen(false)}
          onOpenInventory={() => setIsInventoryOpen(true)}
          onOpenAddEvent={() => setIsAddEventOpen(true)}
          onOpenManageEvents={() => setIsManageEventsOpen(true)}
          classes={classes}
          students={students}
          events={events}
          inventory={inventory}
          movements={inventoryMovements}
          onUpdateStudent={handleUpdateStudent}
          userRole={currentUser?.role}
          userName={currentUser?.name}
        />
      )}

       {isInternshipOpen && (
        <InternshipModule 
          onClose={() => setIsInternshipOpen(false)}
          students={students}
          classes={classes}
          currentUser={currentUser!}
        />
      )}

      {isPedagogyOpen && (
        <PedagogyModule 
          onClose={() => setIsPedagogyOpen(false)}
          classes={classes}
          subjects={subjects}
          currentUser={currentUser!}
        />
      )}
      
      {isDirecteurEtudesOpen && (
        <DirecteurEtudesModule 
          onClose={() => setIsDirecteurEtudesOpen(false)}
          classes={classes}
          teachers={teachers}
          userName={currentUser?.name}
          onUpdateClass={async (c) => {
            const {id, ...data} = toPlainObject(c);
            await db.collection("classes").doc(id).update(data);
          }}
          onUpdateTeacher={async (t) => {
            const {id, ...data} = toPlainObject(t);
            await db.collection("teachers").doc(id).update(data);
          }}
        />
      )}
      
      {isMediaOpen && (
        <MediaModule 
          onClose={() => setIsMediaOpen(false)}
          mediaFiles={mediaFiles}
          onUpload={handleUploadMedia}
          onDelete={handleDeleteMedia}
          currentUser={currentUser}
        />
      )}

      <Modal isOpen={isExportAbsencesOpen} onClose={() => setIsExportAbsencesOpen(false)} title="Export Rapports">
        <div className="space-y-4">
           <button onClick={() => generateClassBilanPDF()} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-transform"><Printer size={20} /> PDF Global</button>
           <div className="grid grid-cols-1 gap-2 pt-4 max-h-[50vh] overflow-y-auto custom-scrollbar pr-1">
              {classes.map(cls => (
                <button key={cls.id} onClick={() => generateClassBilanPDF(cls.id)} className="glass p-5 rounded-2xl flex items-center justify-between hover:bg-indigo-600/5 transition-colors group">
                   <span className="text-xs font-black uppercase text-slate-700 dark:text-white group-hover:text-indigo-600 transition-colors">{cls.name}</span>
                   <FileDown size={18} className="text-indigo-500" />
                </button>
              ))}
           </div>
        </div>
      </Modal>

      <Modal isOpen={isAddStudentOpen} onClose={() => setIsAddStudentOpen(false)} title="Inscription Élève">
        <div className="space-y-4">
          <input type="text" placeholder="Prénom" value={newStudent.firstName} onChange={e => setNewStudent({...newStudent, firstName: e.target.value})} className="w-full bg-slate-900 p-5 rounded-2xl text-white font-bold outline-none" />
          <input type="text" placeholder="NOM" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} className="w-full bg-slate-900 p-5 rounded-2xl text-white font-bold outline-none" />
          <input type="text" placeholder="Matricule" value={newStudent.matricule} onChange={e => setNewStudent({...newStudent, matricule: e.target.value})} className="w-full bg-slate-900 p-5 rounded-2xl text-white font-bold outline-none" />
          <select value={newStudent.classId} onChange={e => setNewStudent({...newStudent, classId: e.target.value})} className="w-full bg-slate-900 p-5 rounded-2xl text-white font-bold outline-none"><option value="">Choisir Classe</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <button onClick={handleAddStudent} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase">Valider Inscription</button>
        </div>
      </Modal>

      {selectedStudentId && <StudentDetail student={students.find(s => s.id === selectedStudentId)!} classes={classes} subjects={subjects} currentUser={currentUser} onUpdate={handleUpdateStudent} onDelete={id => db.collection("students").doc(id).delete()} onClose={() => setSelectedStudentId(null)} onOpenChat={id => { setChatWithStudentId(id); setActiveTab('chat'); setSelectedStudentId(null); }} />}
      {selectedTeacherId && <TeacherDetail teacher={teachers.find(t => t.id === selectedTeacherId)!} subjects={subjects} classes={classes} onUpdate={async t => { const {id, ...d} = toPlainObject(t); await db.collection("teachers").doc(id).update(d); }} onDelete={id => db.collection("teachers").doc(id).delete()} onClose={() => setSelectedTeacherId(null)} />}
      {selectedStaffId && <StaffDetail staff={allStaff.find(s => s.id === selectedStaffId)!} classes={classes} isSuperAdmin={isSuperAdmin} onUpdate={u => { const {id, ...d} = toPlainObject(u); db.collection("users").doc(id).update(d); }} onDelete={id => db.collection("users").doc(id).delete()} onClose={() => setSelectedStaffId(null)} />}
    </div>
  );
};

export default App;
