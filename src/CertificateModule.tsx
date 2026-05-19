
import React, { useState, useEffect } from 'react';
import { 
  FileCheck, Shield, QrCode, Download, Printer, 
  Search, Plus, Eye, CheckCircle, Trash2, X,
  Clock, Award, GraduationCap, History
} from 'lucide-react';
import { db } from './firebaseConfig';
import { collection, query, onSnapshot, addDoc, updateDoc, doc, deleteDoc, orderBy, where } from 'firebase/firestore';
import { IssuedCertificate, Student, SchoolClass, CertificateType, Role, User } from './types';
import { toPlainObject } from './utils';

interface CertificateModuleProps {
  onClose: () => void;
  students: Student[];
  classes: SchoolClass[];
 currentUser: { id: string; name: string; role: Role };
}

export const CertificateModule: React.FC<CertificateModuleProps> = ({ onClose, students, classes, currentUser, }: CertificateModuleProps) => {
  const [issuedCertificates, setIssuedCertificates] = useState<IssuedCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [previewCert, setPreviewCert] = useState<IssuedCertificate | null>(null);
  const safeUser = currentUser ?? {
  id: '',
  name: 'Unknown',
  role: 'ADMIN'
};

  // New Certificate Form State
  const [newCert, setNewCert] = useState({
    studentId: '',
    type: 'SCOLARITE' as CertificateType,
    expiryDate: '',
  });

  useEffect(() => {
    const q = query(collection(db, 'certificates'), orderBy('issueDate', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as IssuedCertificate));
      setIssuedCertificates(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleIssueCertificate = async () => {
    if (!newCert.studentId) return;
    
    const student = students.find(s => s.id === newCert.studentId);
    if (!student) return;

    const uniqueCode = `LTPF-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`;

    const certData: Omit<IssuedCertificate, 'id'> = {
  studentId: student.id,
  studentName: `${student.firstName} ${student.name}`,
  type: newCert.type,
  issueDate: new Date().toISOString(),
  expiryDate: newCert.expiryDate || undefined,

  issuerId: safeUser.id,
  issuerName: safeUser.name,
  issuerRole: safeUser.role,

  uniqueCode,
  status: 'VALIDE'
};

    try {
      await addDoc(collection(db, 'certificates'), toPlainObject(certData));
      setShowIssueForm(false);
      setNewCert({ studentId: '', type: 'SCOLARITE', expiryDate: '' });
      alert("Certificat généré avec succès");
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la génération");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Voulez-vous révoquer ce certificat ?")) {
      await deleteDoc(doc(db, 'certificates', id));
    }
  };

  const filteredCerts = issuedCertificates.filter(c => 
    c.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.uniqueCode.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div className="fixed inset-0 z-[600] bg-slate-950 flex flex-col animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-slate-900/50 backdrop-blur-xl border-b border-white/5 p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20">
            <FileCheck className="text-indigo-400" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-black uppercase text-white tracking-tight">Certification Scolaire</h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">SaaS de vérification sécurisée</p>
          </div>
        </div>
        
        <button onClick={onClose} className="p-2.5 bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all">
          <Plus size={20} className="rotate-45" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 custom-scrollbar">
          
          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="glass p-8 rounded-[2.5rem] border border-white/5 flex items-center gap-6">
                <div className="h-14 w-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                   <Shield size={28} />
                </div>
                <div>
                   <p className="text-2xl font-black text-white">{issuedCertificates.length}</p>
                   <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mt-1">Titres Certifiés</p>
                </div>
             </div>
             <div className="glass p-8 rounded-[2.5rem] border border-white/5 flex items-center gap-6">
                <div className="h-14 w-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400">
                   <QrCode size={28} />
                </div>
                <div>
                   <p className="text-2xl font-black text-white">{issuedCertificates.filter(c => c.type === 'SCOLARITE').length}</p>
                   <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mt-1">Scolarités Émises</p>
                </div>
             </div>
             <button 
              onClick={() => setShowIssueForm(true)}
              className="bg-indigo-600 p-8 rounded-[2.5rem] flex items-center justify-center gap-4 group hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-600/20"
             >
                <Plus size={24} className="text-white bg-white/20 rounded-lg p-1" />
                <span className="text-sm font-black uppercase text-white tracking-widest">Éditer un Document</span>
             </button>
          </div>

          <div className="space-y-6">
             <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase text-white tracking-widest flex items-center gap-3 italic">
                  <History size={16} className="text-emerald-500" /> Historique de délivrance
                </h3>
                <div className="relative w-full md:w-64">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                   <input 
                    type="text" 
                    placeholder="Filtrer les certificats..."
                    className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-[10px] font-bold text-white outline-none focus:border-emerald-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                   />
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCerts.map(cert => (
                  <div key={cert.id} className="glass rounded-[2rem] border border-white/5 overflow-hidden group hover:border-emerald-500/30 transition-all">
                    <div className="p-6 space-y-4">
                       <div className="flex justify-between items-start">
                          <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${cert.type === 'REUSSITE' ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                            {cert.type}
                          </div>
                          <p className="text-[9px] font-black text-slate-500 tracking-tighter">{cert.uniqueCode}</p>
                       </div>
                       
                       <div className="space-y-1">
                          <h4 className="text-sm font-black text-white uppercase italic truncate">{cert.studentName}</h4>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Délivré le {new Date(cert.issueDate).toLocaleDateString()}</p>
                       </div>

                       <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                          <div className="h-8 w-8 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-400">
                             <Shield size={16} />
                          </div>
                          <div className="flex-1">
                             <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Signataire</p>
                             <p className="text-[10px] font-bold text-white truncate">{cert.issuerName} <span className="opacity-40">({cert.issuerRole})</span></p>
                          </div>
                       </div>

                       <div className="flex items-center gap-2 pt-2">
                          <button className="flex-1 bg-white/5 text-white py-3 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all">
                             <Download size={14} /> Télécharger
                          </button>
                          <button onClick={() => handleDelete(cert.id)} className="p-3 bg-white/5 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all">
                             <Trash2 size={14} />
                          </button>
                       </div>
                    </div>
                  </div>
                ))}
             </div>
          </div>
      </div>

      {/* New Cert Form */}
      {showIssueForm && (
        <div className="fixed inset-0 z-[700] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
           <div className="bg-slate-900 w-full max-w-lg rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400">
                    <FileCheck size={24} />
                  </div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter">Édition <span className="text-indigo-400">Certificat</span></h3>
                </div>
                <button onClick={() => setShowIssueForm(false)} className="p-3 bg-white/5 rounded-2xl text-slate-400"><X size={20} /></button>
              </div>
              <div className="p-8 space-y-6">
                 <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Élève Bénéficiaire</label>
                      <select 
                        value={newCert.studentId}
                        onChange={(e) => setNewCert({...newCert, studentId: e.target.value})}
                        className="w-full bg-slate-800 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white outline-none focus:border-indigo-500 transition-all"
                      >
                        <option value="">Sélectionner un élève</option>
                        {students.map(s => (
                          <option key={s.id} value={s.id}>{s.firstName} {s.name} - {classes.find(c => c.id === s.classId)?.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Type de document</label>
                          <select 
                            value={newCert.type}
                            onChange={(e) => setNewCert({...newCert, type: e.target.value as CertificateType})}
                            className="w-full bg-slate-800 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white outline-none focus:border-indigo-500 transition-all"
                          >
                            <option value="SCOLARITE">Certificat Scolarité</option>
                            <option value="REUSSITE">Certificat Réussite</option>
                            <option value="BONNE_CONDUITE">Certificat Conduite</option>
                            <option value="ASSIDUITE">Certificat Assiduité</option>
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Date Expiration (Optionnel)</label>
                          <input 
                            type="date"
                            value={newCert.expiryDate}
                            onChange={(e) => setNewCert({...newCert, expiryDate: e.target.value})}
                            className="w-full bg-slate-800 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white outline-none focus:border-indigo-500"
                          />
                       </div>
                    </div>
                 </div>

                 <div className="bg-emerald-500/5 border border-emerald-500/10 p-6 rounded-3xl flex items-center gap-4">
                    <Shield className="text-emerald-500 shrink-0" size={24} />
                    <p className="text-[10px] font-bold text-slate-400">Le document inclura un <span className="text-white font-black">QR Code UNIQUE</span> de vérification infalsifiable lié à notre base de données.</p>
                 </div>

                 <button 
                  onClick={handleIssueCertificate}
                  className="w-full bg-indigo-600 text-white py-6 rounded-[2rem] font-black uppercase text-xs shadow-xl shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all mt-4"
                 >
                   Générer & Signer
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
