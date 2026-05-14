
import React, { useState, useEffect } from 'react';
import { 
  Building2, Briefcase, GraduationCap, MapPin, 
  ExternalLink, Search, Plus, FileText, CheckCircle2, 
  Clock, X, Mail, Phone, Users, TrendingUp, Award,
  ArrowRight, Landmark, Linkedin, Filter, Download
} from 'lucide-react';
import { db } from './firebaseConfig';
import { collection, query, onSnapshot, addDoc, updateDoc, doc, deleteDoc, orderBy, where } from 'firebase/firestore';
import { Company, Internship, AlumniRecord, Student, SchoolClass, Role } from './types';
import { toPlainObject } from './utils';
import { motion, AnimatePresence } from 'framer-motion';

interface InternshipModuleProps {
  onClose: () => void;
  students: Student[];
  classes: SchoolClass[];
  currentUser: { id: string; name: string; role: Role };
}

export const InternshipModule: React.FC<InternshipModuleProps> = ({ onClose, students, classes, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'companies' | 'internships' | 'alumni'>('internships');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [internships, setInternships] = useState<Internship[]>([]);
  const [alumni, setAlumni] = useState<AlumniRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [showAddInternship, setShowAddInternship] = useState(false);

  useEffect(() => {
    const unsubCompanies = onSnapshot(collection(db, 'companies'), (snapshot) => {
      setCompanies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company)));
    });
    const unsubInternships = onSnapshot(collection(db, 'internships'), (snapshot) => {
      setInternships(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Internship)));
    });
    const unsubAlumni = onSnapshot(collection(db, 'alumni'), (snapshot) => {
      setAlumni(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AlumniRecord)));
    });
    return () => {
      unsubCompanies();
      unsubInternships();
      unsubAlumni();
    };
  }, []);

  const handleAddCompany = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const company = {
      name: formData.get('name') as string,
      sector: formData.get('sector') as string,
      contactName: formData.get('contact') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      address: formData.get('address') as string,
      isPartner: true,
    };
    await addDoc(collection(db, 'companies'), toPlainObject(company));
    setShowAddCompany(false);
  };

  const handleAddInternship = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const student = students.find(s => s.id === formData.get('studentId'));
    const company = companies.find(c => c.id === formData.get('companyId'));
    
    if (!student || !company) return;

    const internship = {
      studentId: student.id,
      studentName: `${student.firstName} ${student.name}`,
      classId: student.classId,
      companyId: company.id,
      companyName: company.name,
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string,
      status: 'CONVENTIONNÉ',
      tutorName: formData.get('tutor') as string,
    };
    await addDoc(collection(db, 'internships'), toPlainObject(internship));
    setShowAddInternship(false);
  };

  return (
    <div className="fixed inset-0 z-[600] bg-slate-950 flex flex-col md:flex-row animate-in fade-in duration-300 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-80 bg-slate-900/40 backdrop-blur-3xl border-r border-white/5 p-8 flex flex-col gap-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
             <div className="h-10 w-10 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20">
                <Briefcase className="text-indigo-400" size={20} />
             </div>
             <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">Stages & Pro</h2>
          </div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-13">Insertion Professionnelle</p>
        </div>

        <nav className="flex-1 space-y-2">
           {[
             { id: 'internships', label: 'Suivi des Stages', icon: Clock },
             { id: 'companies', label: 'Base Entreprises', icon: Building2 },
             { id: 'alumni', label: 'Espace Alumni', icon: GraduationCap }
           ].map((tab) => (
             <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center gap-4 p-5 rounded-[2rem] text-xs font-black uppercase tracking-wider transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 scale-105' : 'text-slate-500 hover:bg-white/5'}`}
             >
               <tab.icon size={18} />
               {tab.label}
             </button>
           ))}
        </nav>

        <button 
          onClick={onClose}
          className="p-5 rounded-[2rem] bg-white/5 text-slate-400 border border-white/5 text-[10px] font-black uppercase tracking-widest hover:text-white transition-all flex items-center justify-center gap-3"
        >
          <X size={16} /> Fermer l'Espace
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-8 md:p-14 bg-slate-950 custom-scrollbar">
         <div className="max-w-6xl mx-auto space-y-12">
            
            {/* Context Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
               <div>
                  <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">
                    {activeTab === 'internships' && "Suivi des <Stages>"}
                    {activeTab === 'companies' && "Partenaires <Industriels>"}
                    {activeTab === 'alumni' && "Insertion <Alumni>"}
                  </h1>
                  <div className="flex items-center gap-3 mt-4">
                    <div className="h-6 w-6 rounded-full bg-indigo-500/10 flex items-center justify-center">
                       <Landmark size={12} className="text-indigo-400" />
                    </div>
                    <p className="text-slate-500 font-bold uppercase text-[9px] tracking-widest">Lycée Technique de Fatick — Bureau des Relations avec les Entreprises</p>
                  </div>
               </div>
               
               <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input 
                      type="text" 
                      placeholder="Filtrer la vue..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-slate-900 border border-white/5 rounded-2xl py-4 pl-12 pr-6 text-[10px] font-bold text-white uppercase outline-none focus:border-indigo-500 md:w-64"
                    />
                  </div>
                  {activeTab === 'companies' && (
                    <button onClick={() => setShowAddCompany(true)} className="p-4 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-600/20 hover:scale-110 active:scale-95 transition-all">
                      <Plus size={20} />
                    </button>
                  )}
                  {activeTab === 'internships' && (
                    <button onClick={() => setShowAddInternship(true)} className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-600/20 hover:scale-110 active:scale-95 transition-all">
                      <Plus size={20} />
                    </button>
                  )}
               </div>
            </header>

            {/* Content Switcher */}
            <AnimatePresence mode="wait">
               {activeTab === 'internships' && (
                 <motion.div 
                  key="internships"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                 >
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                       {[
                         { label: 'En cours', val: internships.filter(i => i.status === 'EN_COURS').length, color: 'text-indigo-400' },
                         { label: 'Conventionnés', val: internships.filter(i => i.status === 'CONVENTIONNÉ').length, color: 'text-sky-400' },
                         { label: 'Terminés', val: internships.filter(i => i.status === 'TERMINÉ').length, color: 'text-emerald-400' },
                         { label: 'Total Année', val: internships.length, color: 'text-slate-400' }
                       ].map((s, idx) => (
                         <div key={idx} className="glass p-6 rounded-3xl border border-white/5">
                            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{s.label}</p>
                            <p className={`text-3xl font-black mt-1 ${s.color}`}>{s.val}</p>
                         </div>
                       ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                       {internships.filter(i => i.studentName.toLowerCase().includes(searchQuery.toLowerCase())).map((intern) => (
                         <div key={intern.id} className="glass rounded-[2.5rem] border border-white/5 overflow-hidden group hover:border-indigo-500/30 transition-all">
                            <div className="p-8 space-y-6">
                               <div className="flex justify-between items-start">
                                  <div className="flex items-center gap-4">
                                     <div className="h-14 w-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                                        <Users size={24} />
                                     </div>
                                     <div>
                                        <h4 className="text-lg font-black text-white uppercase italic">{intern.studentName}</h4>
                                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]">{classes.find(c => c.id === intern.classId)?.name}</p>
                                     </div>
                                  </div>
                                  <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase ${intern.status === 'EN_COURS' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'}`}>
                                     {intern.status}
                                  </div>
                               </div>

                               <div className="grid grid-cols-2 gap-4 bg-slate-900/40 p-6 rounded-3xl border border-white/5">
                                  <div>
                                     <p className="text-[9px] font-black text-slate-500 uppercase flex items-center gap-2 mb-2"><Building2 size={12} /> Entreprise</p>
                                     <p className="text-xs font-black text-white uppercase">{intern.companyName}</p>
                                  </div>
                                  <div>
                                     <p className="text-[9px] font-black text-slate-500 uppercase flex items-center gap-2 mb-2"><Award size={12} /> Tuteur</p>
                                     <p className="text-xs font-black text-white uppercase">{intern.tutorName}</p>
                                  </div>
                               </div>

                               <div className="flex items-center justify-between pt-4">
                                  <div className="flex items-center gap-3">
                                     <div className="flex flex-col">
                                        <span className="text-[9px] font-bold text-slate-500 uppercase">Début</span>
                                        <span className="text-[10px] font-black text-white">{new Date(intern.startDate).toLocaleDateString()}</span>
                                     </div>
                                     <ArrowRight size={14} className="text-slate-700" />
                                     <div className="flex flex-col">
                                        <span className="text-[9px] font-bold text-slate-500 uppercase">Fin</span>
                                        <span className="text-[10px] font-black text-white">{new Date(intern.endDate).toLocaleDateString()}</span>
                                     </div>
                                  </div>
                                  
                                  <div className="flex gap-2">
                                     <button className="h-10 w-10 flex items-center justify-center bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all"><FileText size={18} /></button>
                                     <button className="h-10 w-10 flex items-center justify-center bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-600/20"><CheckCircle2 size={18} /></button>
                                  </div>
                               </div>
                            </div>
                         </div>
                       ))}
                    </div>
                 </motion.div>
               )}

               {activeTab === 'companies' && (
                 <motion.div 
                  key="companies"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                 >
                    {companies.map((co) => (
                      <div key={co.id} className="glass p-8 rounded-[3rem] border border-white/5 relative overflow-hidden group">
                         <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Landmark size={80} />
                         </div>
                         
                         <div className="space-y-6 relative z-10">
                            <div className="h-12 w-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                               <Building2 size={24} />
                            </div>
                            
                            <div>
                               <h3 className="text-xl font-black text-white uppercase italic leading-none">{co.name}</h3>
                               <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-2">{co.sector}</p>
                            </div>

                            <div className="space-y-3">
                               <div className="flex items-center gap-3 group/item">
                                  <div className="h-8 w-8 bg-white/5 rounded-lg flex items-center justify-center text-slate-500 group-hover/item:text-indigo-400 transition-colors">
                                     <Users size={14} />
                                  </div>
                                  <p className="text-[10px] font-bold text-slate-300">{co.contactName}</p>
                               </div>
                               <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 bg-white/5 rounded-lg flex items-center justify-center text-slate-500">
                                     <Mail size={14} />
                                  </div>
                                  <p className="text-[10px] font-bold text-slate-300">{co.email}</p>
                               </div>
                               <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 bg-white/5 rounded-lg flex items-center justify-center text-slate-500">
                                     <Phone size={14} />
                                  </div>
                                  <p className="text-[10px] font-bold text-slate-300">{co.phone}</p>
                               </div>
                            </div>

                            <div className="pt-2">
                               <button className="w-full py-4 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-black uppercase text-slate-400 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2">
                                  <ExternalLink size={14} /> Profil Partenaire
                               </button>
                            </div>
                         </div>
                      </div>
                    ))}
                 </motion.div>
               )}

               {activeTab === 'alumni' && (
                 <motion.div 
                  key="alumni"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-12"
                 >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="glass p-10 rounded-[3rem] border border-indigo-500/20 bg-indigo-500/5 flex flex-col items-center text-center space-y-6">
                           <div className="h-20 w-20 bg-indigo-500 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-indigo-500/40">
                              <TrendingUp size={40} />
                           </div>
                           <div>
                              <h3 className="text-2xl font-black text-white uppercase italic">Insertion Directe</h3>
                              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-2">Plus de 65% de nos diplômés en emploi dès la 1ère année</p>
                           </div>
                           <div className="flex gap-4">
                              <div className="bg-white/5 px-6 py-3 rounded-2xl border border-white/10">
                                 <p className="text-xl font-black text-white">42</p>
                                 <p className="text-[8px] font-black text-slate-500 uppercase">CDI/CDD</p>
                              </div>
                              <div className="bg-white/5 px-6 py-3 rounded-2xl border border-white/10">
                                 <p className="text-xl font-black text-white">18</p>
                                 <p className="text-[8px] font-black text-slate-500 uppercase">Projet Sup</p>
                              </div>
                           </div>
                       </div>

                       <div className="glass p-10 rounded-[3rem] border border-white/5 flex flex-col justify-center space-y-8">
                          <h4 className="text-xl font-black text-white uppercase italic leading-tight">Le Réseau<br/><span className="text-indigo-400">LTP Fatick Connect</span></h4>
                          <p className="text-sm text-slate-400 leading-relaxed font-medium">Suivez le parcours de vos anciens élèves et construisez une passerelle solide entre l'école et le monde du travail.</p>
                          <div className="flex items-center gap-4">
                             <div className="flex -space-x-3">
                                {[1,2,3,4].map(n => <div key={n} className="h-10 w-10 bg-slate-800 border-2 border-slate-950 rounded-full flex items-center justify-center text-[10px] font-black">{n}</div>)}
                                <div className="h-10 w-10 bg-indigo-600 border-2 border-slate-950 rounded-full flex items-center justify-center text-[10px] font-black text-white">+8</div>
                             </div>
                             <p className="text-[10px] font-black text-slate-500 uppercase">Inscrits cette semaine</p>
                          </div>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {alumni.map(a => (
                         <div key={a.id} className="glass p-6 rounded-[2.5rem] border border-white/5 flex items-center gap-6">
                            <div className="h-14 w-14 bg-white/5 rounded-2xl flex items-center justify-center font-black text-white text-lg">
                               {a.studentName[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                               <h5 className="text-sm font-black text-white uppercase italic truncate">{a.studentName}</h5>
                               <p className="text-[9px] font-black text-indigo-400 uppercase mt-0.5">Promo {a.graduationYear}</p>
                               <div className="flex items-center gap-3 mt-3">
                                  <div className="px-3 py-1 bg-white/5 rounded-full text-[8px] font-black text-slate-400 uppercase">{a.lastKnownStatus}</div>
                                  <button className="text-sky-500 hover:text-white transition-colors"><Linkedin size={14} /></button>
                               </div>
                            </div>
                         </div>
                       ))}
                    </div>
                 </motion.div>
               )}
            </AnimatePresence>
         </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
         {showAddCompany && (
           <div className="fixed inset-0 z-[700] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
              <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="bg-slate-900 w-full max-w-lg rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden"
              >
                  <form onSubmit={handleAddCompany}>
                    <div className="p-8 border-b border-white/5 flex items-center justify-between">
                       <h3 className="text-xl font-black text-white uppercase italic">Nouveau<br/><span className="text-emerald-500">Partenariat</span></h3>
                       <button type="button" onClick={() => setShowAddCompany(false)} className="p-3 bg-white/5 rounded-2xl text-slate-400"><X size={20} /></button>
                    </div>
                    <div className="p-8 space-y-4">
                       <input name="name" placeholder="Nom de l'entreprise" className="w-full bg-slate-800 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white" required />
                       <input name="sector" placeholder="Secteur d'activité" className="w-full bg-slate-800 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white" required />
                       <input name="contact" placeholder="Contact Principal" className="w-full bg-slate-800 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white" required />
                       <div className="grid grid-cols-2 gap-4">
                          <input name="email" type="email" placeholder="Email" className="w-full bg-slate-800 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white" required />
                          <input name="phone" placeholder="Téléphone" className="w-full bg-slate-800 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white" required />
                       </div>
                       <input name="address" placeholder="Siège / Adresse" className="w-full bg-slate-800 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white" required />
                       <button type="submit" className="w-full bg-emerald-600 text-white py-6 rounded-[2rem] font-black uppercase text-[10px] shadow-xl shadow-emerald-600/20 mt-4">Enregistrer Partenaire</button>
                    </div>
                  </form>
              </motion.div>
           </div>
         )}

         {showAddInternship && (
           <div className="fixed inset-0 z-[700] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
              <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="bg-slate-900 w-full max-w-lg rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden"
              >
                  <form onSubmit={handleAddInternship}>
                    <div className="p-8 border-b border-white/5 flex items-center justify-between">
                       <h3 className="text-xl font-black text-white uppercase italic">Émission de<br/><span className="text-indigo-400">Convention</span></h3>
                       <button type="button" onClick={() => setShowAddInternship(false)} className="p-3 bg-white/5 rounded-2xl text-slate-400"><X size={20} /></button>
                    </div>
                    <div className="p-8 space-y-4">
                       <select name="studentId" className="w-full bg-slate-800 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white" required>
                          <option value="">Sélectionner l'élève</option>
                          {students.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.name} - {classes.find(c => c.id === s.classId)?.name}</option>)}
                       </select>
                       <select name="companyId" className="w-full bg-slate-800 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white" required>
                          <option value="">Sélectionner l'entreprise</option>
                          {companies.map(c => <option key={c.id} value={c.id}>{c.name} ({c.sector})</option>)}
                       </select>
                       <div className="grid grid-cols-2 gap-4">
                          <input name="startDate" type="date" className="w-full bg-slate-800 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white" required />
                          <input name="endDate" type="date" className="w-full bg-slate-800 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white" required />
                       </div>
                       <input name="tutor" placeholder="Nom du tuteur industriel" className="w-full bg-slate-800 border border-white/10 rounded-2xl py-4 px-6 text-sm text-white" required />
                       <p className="text-[9px] font-bold text-slate-500 uppercase px-4 italic leading-relaxed">En validant cet enregistrement, une convention de stage numérique sera générée et les parties prenantes seront notifiées.</p>
                       <button type="submit" className="w-full bg-indigo-600 text-white py-6 rounded-[2rem] font-black uppercase text-[10px] shadow-xl shadow-indigo-600/20 mt-4">Générer la Convention</button>
                    </div>
                  </form>
              </motion.div>
           </div>
         )}
      </AnimatePresence>
    </div>
  );
};
