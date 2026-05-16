import React, { useState, useMemo } from 'react';
import { 
  Briefcase, GraduationCap, Users, FileText, Settings, 
  ChevronRight, Wrench, Building2, ClipboardList, 
  BarChart3, Calendar, Clock, AlertCircle, ArrowLeftRight,
  Plus, Search, Building, User, Calendar as CalendarIcon, CheckCircle2,
  Trash2, ArrowLeft, Heart, Star, UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SchoolClass, Student, Internship, SchoolEvent, InventoryItem, InventoryMovement, TechnicalProject } from './types';
import { INITIAL_FIELDS, ADMIN_KEY } from './constants';
import { db } from './firebaseConfig';

interface ChefTravauxModuleProps {
  onClose: () => void;
  onOpenInventory: () => void;
  onOpenAddEvent: () => void;
  onOpenManageEvents: () => void;
  events: SchoolEvent[];
  inventory: InventoryItem[];
  movements: InventoryMovement[];
  classes: SchoolClass[];
  students: Student[];
  technicalProjects?: TechnicalProject[];
  onUpdateStudent: (student: Student) => Promise<void>;
  userRole?: string;
  userName?: string;
}

export const ChefTravauxModule: React.FC<ChefTravauxModuleProps> = ({ 
  onClose, onOpenInventory, onOpenAddEvent, onOpenManageEvents, 
  events, inventory, movements, classes, students, technicalProjects = [], onUpdateStudent, 
  userRole, userName 
}) => {
  const [activeSection, setActiveSection] = useState<'overview' | 'sections' | 'internships' | 'projects'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingInternship, setIsAddingInternship] = useState(false);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newInternship, setNewInternship] = useState<Partial<Internship>>({
    companyName: '',
    tutorName: '',
    startDate: '',
    endDate: '',
    status: 'A venir'
  });
  const [newProject, setNewProject] = useState<Partial<TechnicalProject>>({
    title: '',
    description: '',
    studentNames: [],
    classId: '',
    imageUrl: '',
    featured: false
  });
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [projectStudentName, setProjectStudentName] = useState('');

  const filieresData = useMemo(() => {
    return INITIAL_FIELDS.map(f => {
      const fieldClasses = classes.filter(c => c.field === f);
      return {
        name: f,
        classesCount: fieldClasses.length
      };
    }).filter(f => f.classesCount > 0); 
  }, [classes]);

  const allInternships = useMemo(() => {
    const list: (Internship & { studentName: string, className: string })[] = [];
    students.forEach(s => {
      if (s.internships) {
        const className = classes.find(c => c.id === s.classId)?.name || 'N/A';
        s.internships.forEach(i => {
          list.push({ ...i, studentName: `${s.firstName} ${s.name}`, className });
        });
      }
    });
    return list.sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [students, classes]);

  const filteredInternships = allInternships.filter(i => 
    i.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.companyName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredProjects = technicalProjects.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.studentNames.some(sn => sn.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const stats = [
    { label: 'Ateliers Actifs', val: events.filter(e => e.type === 'Atelier').length.toString(), icon: Wrench, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Classes Techniques', val: filieresData.reduce((acc, f) => acc + f.classesCount, 0).toString(), icon: Building2, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { label: 'Stages en cours', val: allInternships.filter(i => i.status === 'En cours').length.toString(), icon: GraduationCap, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Mur de Fierté', val: technicalProjects.length.toString(), icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
  ];

  const handleAddInternship = async () => {
    if (!selectedStudentId || !newInternship.companyName || !newInternship.startDate || !newInternship.endDate) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    const student = students.find(s => s.id === selectedStudentId);
    if (!student) return;

    const internship: Internship = {
      id: Math.random().toString(36).substr(2, 9),
      studentId: selectedStudentId,
      companyName: newInternship.companyName!,
      tutorName: newInternship.tutorName || 'N/A',
      startDate: newInternship.startDate!,
      endDate: newInternship.endDate!,
      status: newInternship.status as any,
      adminKey: ADMIN_KEY
    };

    const updatedStudent = {
      ...student,
      internships: [internship, ...(student.internships || [])]
    };

    try {
      await onUpdateStudent(updatedStudent);
      setIsAddingInternship(false);
      setNewInternship({
        companyName: '',
        tutorName: '',
        startDate: '',
        endDate: '',
        status: 'A venir'
      });
      setSelectedStudentId('');
    } catch (e) {
      alert("Erreur lors de l'ajout du stage.");
    }
  };

  const handleAddProject = async () => {
    if (!newProject.title || !newProject.description || !newProject.classId || newProject.studentNames!.length === 0) {
      alert("Veuillez remplir les informations du projet.");
      return;
    }

    const project: TechnicalProject = {
      id: Math.random().toString(36).substr(2, 9),
      title: newProject.title!,
      description: newProject.description!,
      studentNames: newProject.studentNames!,
      classId: newProject.classId!,
      imageUrl: newProject.imageUrl,
      date: new Date().toISOString(),
      votes: 0,
      featured: newProject.featured || false,
      adminKey: ADMIN_KEY
    };

    try {
      await db.collection('technicalProjects').doc(project.id).set(project);
      setIsAddingProject(false);
      setNewProject({
        title: '',
        description: '',
        studentNames: [],
        classId: '',
        imageUrl: '',
        featured: false
      });
    } catch (e) {
      alert("Erreur lors de l'ajout du projet.");
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("Supprimer ce projet du mur de fierté ?")) return;
    await db.collection('technicalProjects').doc(id).delete();
  };

  const handleDeleteInternship = async (studentId: string, internshipId: string) => {
    if (!window.confirm("Supprimer ce stage ?")) return;
    
    const student = students.find(s => s.id === studentId);
    if (!student || !student.internships) return;

    const updatedStudent = {
      ...student,
      internships: student.internships.filter(i => i.id !== internshipId)
    };

    await onUpdateStudent(updatedStudent);
  };

  const handleTransmitReport = async (type: string, title: string, content: string) => {
    try {
      await db.collection('reports').add({
        title,
        content,
        type,
        status: 'PENDING',
        author: userName || 'Chef des Travaux',
        authorRole: 'CT',
        date: new Date().toISOString(),
        timestamp: new Date()
      });
      alert("Demande transmise au Proviseur.");
    } catch (e) {
      alert("Erreur lors de la transmission.");
    }
  };

  return (
    <div className="fixed inset-0 z-[700] bg-slate-50 dark:bg-slate-950 flex flex-col font-sans overflow-hidden text-slate-900 dark:text-slate-100">
      {/* HEADER */}
      <div className="bg-white dark:bg-slate-900 border-b border-black/5 dark:border-white/5 px-8 py-6 shrink-0 z-10 shadow-sm">
        <div className="flex items-center justify-between mx-auto max-w-7xl">
          <div className="flex items-center gap-6">
            <button 
              onClick={activeSection === 'overview' ? onClose : () => setActiveSection('overview')} 
              className="p-3 bg-slate-100 dark:bg-white/5 rounded-2xl text-slate-500 hover:text-indigo-600 transition-all"
            >
              <ArrowLeft className={activeSection === 'overview' ? 'rotate-90' : ''} size={20} />
            </button>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white font-display tracking-tight uppercase">
                {activeSection === 'overview' ? 'Espace Chef des Travaux' : 
                 activeSection === 'internships' ? 'Suivi des Stages' : 'Mur de Fierté Technique'}
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Coordination Technique & Professionnelle • {userName}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="px-5 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
               <p className="text-[10px] font-black text-amber-600 uppercase tracking-wider flex items-center gap-2">
                 <Settings size={14} className="animate-spin-slow" /> Mode Gestion Technique
               </p>
             </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full custom-scrollbar">
        <AnimatePresence mode="wait">
          {activeSection === 'overview' ? (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {/* STATS */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {stats.map((s, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="glass p-6 rounded-3xl border border-black/5 dark:border-white/5 bg-white dark:bg-white/5 shadow-sm"
                  >
                    <div className={`h-12 w-12 ${s.bg} ${s.color} rounded-2xl flex items-center justify-center mb-4`}>
                      <s.icon size={24} />
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white font-display mb-1">{s.val}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
                  </motion.div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* MAIN ACTIONS */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="glass p-8 rounded-[2.5rem] bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 shadow-xl">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white font-display mb-8 flex items-center gap-3 lowercase">
                      <Briefcase className="text-indigo-600" /> Actions prioritaires
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        { title: 'Plannings d\'Atelier', desc: 'Gestion de l\'occupation des salles techniques', icon: Calendar, color: 'indigo', action: onOpenManageEvents },
                        { title: 'Suivi des Stages', desc: 'Conventions et évaluations en entreprise', icon: GraduationCap, color: 'emerald', action: () => setActiveSection('internships') },
                        { title: 'Mur de Fierté', desc: 'Mettre en avant les chefs-d\'œuvre élèves', icon: Star, color: 'amber', action: () => setActiveSection('projects') },
                        { title: 'Maintenance Préventive', desc: 'Calendrier d\'entretien des machines', icon: Settings, color: 'blue', action: onOpenAddEvent },
                        { title: 'Commandes Matières', desc: 'Besoins pour les travaux pratiques', icon: ClipboardList, color: 'amber', action: onOpenInventory },
                      ].map((item, i) => (
                        <button 
                          key={i} 
                          onClick={item.action}
                          className="flex flex-col items-start p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-black/5 dark:border-white/5 hover:border-indigo-500/30 transition-all text-left group"
                        >
                          <div className={`h-10 w-10 bg-${item.color}-500/10 text-${item.color}-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                            <item.icon size={20} />
                          </div>
                          <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase mb-1 tracking-tight">{item.title}</h4>
                          <p className="text-[10px] font-medium text-slate-400 uppercase leading-relaxed">{item.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="glass p-8 rounded-[2.5rem] bg-white dark:bg-white/5 border border-black/5 dark:border-white/5">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xl font-black text-slate-900 dark:text-white font-display lowercase">Filières Techniques</h3>
                      <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Voir détails →</button>
                    </div>
                    <div className="space-y-3">
                      {filieresData.length > 0 ? (
                        filieresData.map((fil, i) => (
                          <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/10">
                            <div className="flex items-center gap-4">
                              <div className="h-8 w-8 bg-white dark:bg-slate-900 rounded-lg flex items-center justify-center text-xs font-black text-indigo-600 shadow-sm">{i+1}</div>
                              <span className="text-sm font-bold text-slate-900 dark:text-white">{fil.name}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-[10px] font-bold text-slate-400">{fil.classesCount} {fil.classesCount > 1 ? 'CLASSES' : 'CLASSE'}</span>
                              <ChevronRight size={16} className="text-slate-300" />
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center bg-slate-50 dark:bg-white/5 rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Aucune filière configurée</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* SIDEBAR / ALERTS */}
                <div className="space-y-6">
                  <div className="glass p-8 rounded-[2.5rem] bg-slate-900 text-white shadow-2xl">
                      <div className="h-14 w-14 bg-amber-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-amber-500/20">
                        <AlertCircle size={28} />
                      </div>
                      <h3 className="text-xl font-black font-display mb-4">Urgences Ateliers</h3>
                      <p className="text-xs text-slate-400 font-medium leading-relaxed mb-6">3 machines sont actuellement en attente de maintenance critique dans la section Mécanique.</p>
                      <div className="space-y-2">
                        <button 
                          onClick={onOpenAddEvent}
                          className="w-full bg-white text-slate-900 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 hover:text-white transition-all shadow-xl"
                        >
                          Plannifier Maintenance
                        </button>
                        <button 
                          onClick={() => handleTransmitReport('TECHNIQUE', 'Urgence Maintenance Ateliers', 'Maintenance critique requise: 3 machines HS en Mécanique. Devis estimatif: 450.000 FCFA.')}
                          className="w-full bg-amber-600/20 text-amber-500 border border-amber-500/30 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 hover:text-white transition-all"
                        >
                          Demander Budget au Proviseur
                        </button>
                      </div>
                  </div>

                  <div className="glass p-8 rounded-[2.5rem] bg-white dark:bg-white/5 border border-black/5 dark:border-white/5">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Mouvements récents</h4>
                      <div className="space-y-6">
                        {movements.length > 0 ? (
                          movements.slice(0, 5).map((m, i) => {
                            const item = inventory.find(ti => ti.id === m.itemId);
                            return (
                              <div key={m.id} className="flex gap-4 relative">
                                  {i < Math.min(movements.length, 5) - 1 && <div className="absolute left-[11px] top-6 bottom-[-24px] w-[2px] bg-slate-100 dark:bg-white/5" />}
                                  <div className={`h-6 w-6 rounded-full ${m.type === 'IN' ? 'bg-emerald-500' : 'bg-amber-500'} border-4 border-white dark:border-slate-800 z-10 shrink-0`} />
                                  <div>
                                    <p className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                                      {m.type === 'IN' ? 'Entrée' : 'Sortie'}: {item?.designation || 'Article inconnu'}
                                    </p>
                                    <p className="text-[9px] text-slate-400 font-medium uppercase">
                                      {new Date(m.timestamp?.seconds ? m.timestamp.seconds * 1000 : m.timestamp).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit' })} • {item?.location || 'Lieu inconnu'}
                                    </p>
                                  </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="py-10 text-center opacity-30">
                            <ArrowLeftRight size={24} className="mx-auto mb-2" />
                            <p className="text-[9px] font-black uppercase tracking-widest">Aucun mouvement</p>
                          </div>
                        )}
                      </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : activeSection === 'internships' ? (
            <motion.div
              key="internships"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-white/5 p-6 rounded-[2rem] border border-black/5 dark:border-white/10 shadow-sm">
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Rechercher un élève ou une entreprise..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-2xl py-3 pl-12 pr-4 text-sm font-medium outline-none focus:ring-2 ring-indigo-500/20 transition-all"
                  />
                </div>
                <button 
                  onClick={() => setIsAddingInternship(true)}
                  className="w-full md:w-auto bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
                >
                  <Plus size={16} /> Nouvelle Convention
                </button>
              </div>

              {isAddingInternship && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white dark:bg-white/5 border border-indigo-500/30 p-8 rounded-[2.5rem] shadow-2xl relative"
                >
                  <button onClick={() => setIsAddingInternship(false)} className="absolute top-6 right-6 text-slate-400 hover:text-rose-500 transition-colors">
                    <ArrowLeft size={20} className="rotate-90" />
                  </button>
                  <h3 className="text-xl font-black font-display mb-8 lowercase flex items-center gap-3">
                    <GraduationCap className="text-indigo-600" /> Émettre une convention
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Élève</label>
                       <select 
                         value={selectedStudentId}
                         onChange={(e) => setSelectedStudentId(e.target.value)}
                         className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-2xl p-4 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-indigo-500/20 transition-all"
                       >
                         <option value="">Sélectionner un élève</option>
                         {students.map(s => (
                           <option key={s.id} value={s.id}>{s.firstName} {s.name} ({classes.find(c => c.id === s.classId)?.name})</option>
                         ))}
                       </select>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Entreprise</label>
                       <div className="relative">
                         <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                         <input 
                           type="text" 
                           placeholder="Nom de l'entreprise"
                           value={newInternship.companyName}
                           onChange={(e) => setNewInternship({...newInternship, companyName: e.target.value})}
                           className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-indigo-500/20 transition-all"
                         />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Maitre de Stage</label>
                       <div className="relative">
                         <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                         <input 
                           type="text" 
                           placeholder="Nom du tuteur"
                           value={newInternship.tutorName}
                           onChange={(e) => setNewInternship({...newInternship, tutorName: e.target.value})}
                           className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-indigo-500/20 transition-all"
                         />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Date début</label>
                       <div className="relative">
                         <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                         <input 
                           type="date" 
                           value={newInternship.startDate}
                           onChange={(e) => setNewInternship({...newInternship, startDate: e.target.value})}
                           className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-indigo-500/20 transition-all"
                         />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Date fin</label>
                       <div className="relative">
                         <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                         <input 
                           type="date" 
                           value={newInternship.endDate}
                           onChange={(e) => setNewInternship({...newInternship, endDate: e.target.value})}
                           className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-indigo-500/20 transition-all"
                         />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Statut initial</label>
                       <select 
                         value={newInternship.status}
                         onChange={(e) => setNewInternship({...newInternship, status: e.target.value as any})}
                         className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-2xl p-4 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-indigo-500/20 transition-all"
                       >
                         <option value="A venir">A venir</option>
                         <option value="En cours">En cours</option>
                         <option value="Terminé">Terminé</option>
                       </select>
                    </div>
                  </div>

                  <button 
                    onClick={handleAddInternship}
                    className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20"
                  >
                    Valider la convention technique
                  </button>
                </motion.div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredInternships.length > 0 ? (
                  filteredInternships.map((intern) => (
                    <div key={intern.id} className="glass p-6 rounded-[2rem] bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 shadow-sm hover:border-indigo-500/30 transition-all group">
                       <div className="flex justify-between items-start mb-6">
                          <div className="h-12 w-12 bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 rounded-2xl flex items-center justify-center">
                            <Building size={24} />
                          </div>
                          <div className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                            intern.status === 'En cours' ? 'bg-emerald-100 text-emerald-600' :
                            intern.status === 'Terminé' ? 'bg-slate-100 text-slate-500' :
                            'bg-amber-100 text-amber-600'
                          }`}>
                            {intern.status}
                          </div>
                       </div>

                       <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase mb-1">{intern.companyName}</h4>
                       <p className="text-[10px] font-bold text-slate-400 mb-6 flex items-center gap-2 italic lowercase text-slate-500">
                         par {intern.studentName} <span className="h-1 w-1 rounded-full bg-slate-300" /> {intern.className}
                       </p>

                       <div className="space-y-3 pt-6 border-t border-black/5 dark:border-white/5">
                          <div className="flex items-center gap-3 text-[10px]">
                             <Clock className="text-slate-400" size={14} />
                             <span className="font-bold text-slate-600 dark:text-slate-400">Du {new Date(intern.startDate).toLocaleDateString()} au {new Date(intern.endDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-3 text-[10px]">
                             <User className="text-slate-400" size={14} />
                             <span className="font-bold text-slate-600 dark:text-slate-400">Tuteur: {intern.tutorName}</span>
                          </div>
                       </div>

                       <div className="mt-6 flex items-center gap-2 pt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleDeleteInternship(intern.studentId, intern.id)}
                            className="flex-1 bg-rose-500/10 text-rose-600 py-3 rounded-xl text-[9px] font-black uppercase tracking-tighter hover:bg-rose-600 hover:text-white transition-all"
                          >
                            Résilier
                          </button>
                          <button className="flex-1 bg-slate-900 text-white py-3 rounded-xl text-[9px] font-black uppercase tracking-tighter hover:bg-indigo-600 transition-all">
                            Détails
                          </button>
                       </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center glass rounded-[2.5rem] border border-dashed border-slate-200 dark:border-white/10">
                     <GraduationCap size={48} className="mx-auto mb-4 text-slate-200" />
                     <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Aucun stage trouvé</p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : activeSection === 'projects' ? (
            <motion.div
              key="projects"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-white/5 p-6 rounded-[2rem] border border-black/5 dark:border-white/10 shadow-sm">
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Chercher un projet ou un élève..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-2xl py-3 pl-12 pr-4 text-sm font-medium outline-none focus:ring-2 ring-indigo-500/20 transition-all"
                  />
                </div>
                <button 
                  onClick={() => setIsAddingProject(true)}
                  className="w-full md:w-auto bg-amber-500 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20"
                >
                  <Plus size={16} /> Nouveau Chef-d'œuvre
                </button>
              </div>

              {isAddingProject && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-white/5 border border-amber-500/30 p-8 rounded-[2.5rem] shadow-2xl relative"
                >
                   <button onClick={() => setIsAddingProject(false)} className="absolute top-6 right-6 text-slate-400 hover:text-rose-500 transition-colors">
                    <ArrowLeft size={20} className="rotate-90" />
                  </button>
                  <h3 className="text-xl font-black font-display mb-8 lowercase flex items-center gap-3">
                    <Star className="text-amber-500" /> Publier une fierté technique
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Titre du Projet</label>
                        <input 
                          type="text" 
                          placeholder="Ex: Drone de surveillance agricole"
                          value={newProject.title}
                          onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                          className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-2xl p-4 text-sm font-bold outline-none"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Classe Responsable</label>
                        <select 
                          value={newProject.classId}
                          onChange={(e) => setNewProject({...newProject, classId: e.target.value})}
                          className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-2xl p-4 text-sm font-bold outline-none"
                        >
                          <option value="">Sélectionner la classe</option>
                          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                     </div>
                     <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Description / Histoire du succès</label>
                        <textarea 
                          rows={3}
                          placeholder="Décrivez les défis techniques et la réussite de ce projet..."
                          value={newProject.description}
                          onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                          className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-2xl p-4 text-sm font-bold outline-none resize-none"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">URL Image du projet</label>
                        <input 
                          type="text" 
                          placeholder="https://..."
                          value={newProject.imageUrl}
                          onChange={(e) => setNewProject({...newProject, imageUrl: e.target.value})}
                          className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-2xl p-4 text-sm font-bold outline-none"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Ajouter des Étudiants</label>
                        <div className="flex gap-2">
                           <input 
                             type="text" 
                             placeholder="Nom de l'élève"
                             value={projectStudentName}
                             onChange={(e) => setProjectStudentName(e.target.value)}
                             onKeyPress={(e) => {
                               if (e.key === 'Enter' && projectStudentName.trim()) {
                                 setNewProject({...newProject, studentNames: [...(newProject.studentNames || []), projectStudentName.trim()]});
                                 setProjectStudentName('');
                               }
                             }}
                             className="flex-1 bg-slate-100 dark:bg-slate-900 border-none rounded-2xl p-4 text-sm font-bold outline-none"
                           />
                           <button 
                             onClick={() => {
                               if (projectStudentName.trim()) {
                                 setNewProject({...newProject, studentNames: [...(newProject.studentNames || []), projectStudentName.trim()]});
                                 setProjectStudentName('');
                               }
                             }}
                             className="p-4 bg-indigo-600 text-white rounded-2xl"
                           >
                             <Plus size={20} />
                           </button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                           {newProject.studentNames?.map((sn, i) => (
                             <span key={i} className="px-3 py-1 bg-indigo-500/10 text-indigo-600 rounded-full text-[10px] font-black flex items-center gap-2">
                               {sn}
                               <Trash2 size={12} className="cursor-pointer hover:text-rose-500" onClick={() => setNewProject({...newProject, studentNames: newProject.studentNames?.filter((_, idx) => idx !== i)})} />
                             </span>
                           ))}
                        </div>
                     </div>
                  </div>

                  <button 
                    onClick={handleAddProject}
                    className="w-full bg-amber-500 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-amber-600 transition-all shadow-xl shadow-amber-500/20"
                  >
                    Exposer sur le Mur de Fierté
                  </button>
                </motion.div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.length > 0 ? (
                  filteredProjects.map((proj) => (
                    <div key={proj.id} className="glass p-2 rounded-[2rem] bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 overflow-hidden group">
                       <div className="aspect-video relative rounded-[1.8rem] overflow-hidden mb-6">
                          {proj.imageUrl ? (
                            <img src={proj.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={proj.title} />
                          ) : (
                            <div className="w-full h-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                              <Wrench size={40} className="text-slate-300" />
                            </div>
                          )}
                          <div className="absolute top-4 left-4">
                             <span className="px-3 py-1 bg-amber-500 text-white rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg">FIERTÉ</span>
                          </div>
                       </div>
                       <div className="p-4">
                          <h4 className="text-md font-black text-slate-900 dark:text-white uppercase mb-2 leading-tight">{proj.title}</h4>
                          <p className="text-[10px] text-slate-500 mb-6 line-clamp-2">{proj.description}</p>
                          
                          <div className="flex flex-wrap gap-1 mb-6">
                             {proj.studentNames.map((sn, i) => (
                               <span key={i} className="text-[8px] font-black text-slate-400 border border-slate-200 dark:border-white/5 px-2 py-0.5 rounded-lg uppercase">{sn}</span>
                             ))}
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-black/5 dark:border-white/5">
                             <div className="flex items-center gap-2 text-rose-500 font-black text-xs">
                               <Heart size={14} fill="currentColor" /> {proj.votes}
                             </div>
                             <button onClick={() => handleDeleteProject(proj.id)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
                                <Trash2 size={16} />
                             </button>
                          </div>
                       </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center glass rounded-[2.5rem] border border-dashed border-slate-200 dark:border-white/10">
                     <Star size={48} className="mx-auto mb-4 text-slate-200" />
                     <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Aucun projet au tableau d'honneur</p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
};
