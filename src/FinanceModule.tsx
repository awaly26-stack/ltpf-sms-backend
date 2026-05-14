
import React, { useState, useEffect } from 'react';
import { 
  CreditCard, TrendingUp, TrendingDown, Clock, Search, 
  Filter, Plus, Download, CheckCircle, AlertCircle,
  FileText, User, LayoutGrid, List, Landmark
} from 'lucide-react';
import { db } from './firebaseConfig';
import { collection, query, onSnapshot, addDoc, updateDoc, doc, deleteDoc, orderBy, where } from 'firebase/firestore';
import { Payment, Student, SchoolClass, PaymentType, PaymentStatus, Role } from './types';
import { toPlainObject } from './utils';

interface FinanceModuleProps {
  onClose: () => void;
  students: Student[];
  classes: SchoolClass[];
  currentUser: { id: string; name: string; role: Role };
}

export const FinanceModule: React.FC<FinanceModuleProps> = ({ onClose, students, classes, currentUser }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // New Payment Form State
  const [newPayment, setNewPayment] = useState({
    studentId: '',
    type: 'INSCRIPTION' as PaymentType,
    amount: 0,
    totalDue: 0,
    reference: '',
  });

  useEffect(() => {
    const q = query(collection(db, 'payments'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
      setPayments(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddPayment = async () => {
    if (!newPayment.studentId || newPayment.amount <= 0) return;
    
    const student = students.find(s => s.id === newPayment.studentId);
    if (!student) return;

    const paymentData: Omit<Payment, 'id'> = {
      studentId: student.id,
      studentName: `${student.firstName} ${student.name}`,
      classId: student.classId,
      amount: newPayment.amount,
      totalDue: newPayment.totalDue || newPayment.amount,
      type: newPayment.type,
      status: newPayment.amount >= (newPayment.totalDue || newPayment.amount) ? 'COMPLETE' : 'PARTIEL',
      date: new Date().toISOString(),
      reference: newPayment.reference || `PAY-${Date.now().toString().slice(-6)}`,
      receivedBy: currentUser.id,
      receivedByName: currentUser.name
    };

    try {
      await addDoc(collection(db, 'payments'), toPlainObject(paymentData));
      setShowAddForm(false);
      setNewPayment({ studentId: '', type: 'INSCRIPTION', amount: 0, totalDue: 0, reference: '' });
      alert("Paiement enregistré avec succès");
    } catch (e) {
      console.error(e);
      alert("Erreur lors de l'enregistrement");
    }
  };

  const filteredPayments = payments.filter(p => {
    const matchesSearch = p.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.reference.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'pending' && p.status === 'PARTIEL') ||
                      (activeTab === 'completed' && p.status === 'COMPLETE');
    return matchesSearch && matchesTab;
  });

  const totalRevenue = payments.reduce((acc, p) => acc + p.amount, 0);
  const pendingAmount = payments.reduce((acc, p) => acc + (p.totalDue - p.amount), 0);

  return (
    <div className="fixed inset-0 z-[600] bg-slate-950 flex flex-col animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-slate-900/50 backdrop-blur-xl border-b border-white/5 p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
            <Landmark className="text-emerald-500" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-black uppercase text-white tracking-tight">Gestion Trésorerie</h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">LTP Fatick Fintech</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 bg-emerald-500/5 px-4 py-2 rounded-xl border border-emerald-500/10">
            <TrendingUp size={14} className="text-emerald-500" />
            <span className="text-[10px] font-black text-emerald-500 uppercase">Total: {totalRevenue.toLocaleString()} FCFA</span>
          </div>
          <button onClick={onClose} className="p-2.5 bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all">
            <Plus size={20} className="rotate-45" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 custom-scrollbar">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             <div className="glass p-6 rounded-[2rem] border border-white/5 space-y-2">
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Recouvrement Total</p>
                <p className="text-2xl font-black text-white">{totalRevenue.toLocaleString()} <span className="text-xs text-slate-400">FCFA</span></p>
             </div>
             <div className="glass p-6 rounded-[2rem] border border-white/5 space-y-2">
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Reliquats (Attente)</p>
                <p className="text-2xl font-black text-amber-500">{pendingAmount.toLocaleString()} <span className="text-xs text-slate-400">FCFA</span></p>
             </div>
             <div className="glass p-6 rounded-[2rem] border border-white/5 space-y-2">
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Transactions</p>
                <p className="text-2xl font-black text-indigo-500">{payments.length}</p>
             </div>
             <div className="glass p-6 rounded-[2rem] border border-emerald-500/20 bg-emerald-500/5 space-y-2">
                <p className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Taux de Recouvrement</p>
                <p className="text-2xl font-black text-emerald-500">
                  {totalRevenue > 0 ? Math.round((totalRevenue / (totalRevenue + pendingAmount)) * 100) : 0}%
                </p>
             </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex bg-slate-900 p-1.5 rounded-2xl w-full md:w-auto">
              <button 
                onClick={() => setActiveTab('all')}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'all' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Tous
              </button>
              <button 
                onClick={() => setActiveTab('pending')}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'pending' ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                En Attente
              </button>
              <button 
                onClick={() => setActiveTab('completed')}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'completed' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Complétés
              </button>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
               <div className="relative flex-1 md:w-64">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                 <input 
                  type="text" 
                  placeholder="Rechercher élève ou réf..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-xs font-bold text-white outline-none focus:border-indigo-500 transition-all shadow-inner"
                 />
               </div>
               <button 
                onClick={() => setShowAddForm(true)}
                className="p-3.5 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-600/20 hover:scale-105 active:scale-95 transition-all"
               >
                 <Plus size={20} />
               </button>
            </div>
          </div>

          {/* Table */}
          <div className="glass rounded-[2.5rem] border border-white/5 overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="bg-slate-900/50 border-b border-white/5">
                         <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-500 tracking-widest">Date / Réf</th>
                         <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-500 tracking-widest">Élève</th>
                         <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-500 tracking-widest">Nature</th>
                         <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-500 tracking-widest">Montant</th>
                         <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-500 tracking-widest">Statut</th>
                         <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-500 tracking-widest">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                      {filteredPayments.map(p => (
                        <tr key={p.id} className="hover:bg-white/5 transition-all group">
                           <td className="px-6 py-5">
                              <p className="text-[10px] font-bold text-white mb-1">{new Date(p.date).toLocaleDateString()} {new Date(p.date).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</p>
                              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{p.reference}</span>
                           </td>
                           <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                 <div className="h-8 w-8 bg-indigo-500 rounded-lg flex items-center justify-center font-black text-white text-[10px]">
                                    {p.studentName[0]}
                                 </div>
                                 <div>
                                    <p className="text-[11px] font-black text-white uppercase">{p.studentName}</p>
                                    <p className="text-[9px] font-bold text-slate-500 uppercase">{classes.find(c => c.id === p.classId)?.name || "N/A"}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-6 py-5">
                              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                                {p.type}
                              </span>
                           </td>
                           <td className="px-6 py-5">
                              <p className="text-xs font-black text-white tracking-widest">{p.amount.toLocaleString()} FCFA</p>
                              {p.totalDue > p.amount && (
                                <p className="text-[9px] font-bold text-amber-500 uppercase tracking-tighter mt-1">Reste: {(p.totalDue - p.amount).toLocaleString()} FCFA</p>
                              )}
                           </td>
                           <td className="px-6 py-5">
                              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase ${p.status === 'COMPLETE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                {p.status === 'COMPLETE' ? <CheckCircle size={10} /> : <Clock size={10} />}
                                {p.status === 'COMPLETE' ? "Payé" : "Reliquat"}
                              </div>
                           </td>
                           <td className="px-6 py-5">
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button className="p-2 bg-indigo-600 rounded-lg text-white hover:scale-110 transition-transform"><FileText size={14} /></button>
                                 <button className="p-2 bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all"><Download size={14} /></button>
                              </div>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
             {filteredPayments.length === 0 && (
               <div className="p-20 flex flex-col items-center justify-center text-center space-y-4">
                  <Landmark size={48} className="text-slate-800" />
                  <div>
                    <h3 className="text-sm font-black text-white uppercase">Aucune transaction</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase max-w-xs mt-2">Prêt à encaisser les paiements du LTP de Fatick ? Cliquez sur le + pour commencer.</p>
                  </div>
               </div>
             )}
          </div>
        </div>

        {/* Form Modal Overlay */}
        {showAddForm && (
          <div className="fixed inset-0 z-[700] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
             <div className="bg-slate-900 w-full max-w-lg rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                   <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">Nouveau<br/><span className="text-emerald-500">Encaissement</span></h3>
                   <button onClick={() => setShowAddForm(false)} className="p-3 bg-white/5 rounded-2xl text-slate-400"><Plus size={24} className="rotate-45" /></button>
                </div>
                <div className="p-8 space-y-6">
                   <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Élève Payeur</label>
                        <select 
                          value={newPayment.studentId}
                          onChange={(e) => setNewPayment({...newPayment, studentId: e.target.value})}
                          className="w-full bg-slate-800 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white outline-none focus:border-indigo-500 transition-all"
                        >
                          <option value="">Sélectionner un élève</option>
                          {students.sort((a,b) => a.firstName.localeCompare(b.firstName)).map(s => (
                            <option key={s.id} value={s.id}>{s.firstName} {s.name} - {classes.find(c => c.id === s.classId)?.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Type</label>
                            <select 
                              value={newPayment.type}
                              onChange={(e) => setNewPayment({...newPayment, type: e.target.value as PaymentType})}
                              className="w-full bg-slate-800 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white outline-none focus:border-indigo-500 transition-all"
                            >
                              <option value="INSCRIPTION">Inscription</option>
                              <option value="SCOLARITE">Scolarité</option>
                              <option value="EXAMEN">Examen</option>
                              <option value="AUTRE">Autre</option>
                            </select>
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Référence</label>
                            <input 
                              type="text"
                              placeholder="Ex: CHÈQUE-001"
                              value={newPayment.reference}
                              onChange={(e) => setNewPayment({...newPayment, reference: e.target.value})}
                              className="w-full bg-slate-800 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white outline-none focus:border-indigo-500 transition-all"
                            />
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Montant Versé (FCFA)</label>
                            <input 
                              type="number"
                              value={newPayment.amount}
                              onChange={(e) => setNewPayment({...newPayment, amount: Number(e.target.value)})}
                              className="w-full bg-slate-800 border border-white/10 rounded-2xl py-4 px-6 text-sm font-black text-emerald-500 outline-none focus:border-emerald-500 transition-all"
                            />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase ml-2 tracking-widest">Total Dû (FCFA)</label>
                            <input 
                              type="number"
                              value={newPayment.totalDue}
                              placeholder="Si différent du versé"
                              onChange={(e) => setNewPayment({...newPayment, totalDue: Number(e.target.value)})}
                              className="w-full bg-slate-800 border border-white/10 rounded-2xl py-4 px-6 text-sm font-black text-white outline-none focus:border-indigo-500 transition-all opacity-60 focus:opacity-100"
                            />
                         </div>
                      </div>
                   </div>

                   <button 
                    onClick={handleAddPayment}
                    className="w-full bg-emerald-600 text-white py-6 rounded-[2rem] font-black uppercase text-xs shadow-xl shadow-emerald-600/20 hover:scale-105 active:scale-95 transition-all mt-4"
                   >
                     Valider l'Encaissement
                   </button>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
