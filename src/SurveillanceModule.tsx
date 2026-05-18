import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  Clock, 
  AlertTriangle, 
  Search, 
  Plus, 
  Filter, 
  Calendar as CalendarIcon,
  LayoutGrid,
  MapPin,
  ClipboardCheck,
  Zap,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Settings,
  ArrowRight,
  Package,
  Wrench,
  Monitor,
  Flame,
  User as UserIcon,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from  'framer-motion';
import { 
  Room, 
  Workshop, 
  RoomAssignment, 
  SchoolClass, 
  Student,
  Teacher, 
  Role, 
  User,
  RoomType,
  RoomStatus,
  Subject
} from './types';
import { db } from './firebaseConfig';
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, where } from 'firebase/firestore';
import { toPlainObject } from './utils';
import { INITIAL_FIELDS } from './constants';

interface SurveillanceModuleProps {
  onClose: () => void;
  classes: SchoolClass[];
  students: Student[];
  teachers: Teacher[];
  allStaff: User[];
  subjects: Subject[];
  currentUser: User;
}

export const SurveillanceModule: React.FC<SurveillanceModuleProps> = ({ 
  onClose, classes, students, teachers, allStaff, subjects, currentUser 
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'rooms' | 'planning' | 'workshops'>('dashboard');
  const [planningView, setPlanningView] = useState<'rooms' | 'classes' | 'teachers'>('rooms');
  const [selectedField, setSelectedField] = useState<string>('TOUS');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [assignments, setAssignments] = useState<RoomAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showAddAssignment, setShowAddAssignment] = useState(false);
  const [showAddWorkshop, setShowAddWorkshop] = useState(false);

  // Real-time subscriptions
  useEffect(() => {
    const unsubRooms = onSnapshot(collection(db, 'rooms'), (snap) => {
      setRooms(snap.docs.map(d => ({ id: d.id, ...d.data() } as Room)));
    });
    const unsubWorkshops = onSnapshot(collection(db, 'workshops'), (snap) => {
      setWorkshops(snap.docs.map(d => ({ id: d.id, ...d.data() } as Workshop)));
    });
    const unsubAssignments = onSnapshot(collection(db, 'roomAssignments'), (snap) => {
      setAssignments(snap.docs.map(d => ({ id: d.id, ...d.data() } as RoomAssignment)));
    });

    setLoading(false);
    return () => {
      unsubRooms();
      unsubWorkshops();
      unsubAssignments();
    };
  }, []);

  const canManage = currentUser.role === 'ADMIN' || currentUser.role === 'SG' || currentUser.role === 'DE';

  const getStatusColor = (status: RoomStatus) => {
    switch (status) {
      case 'FREE': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'OCCUPIED': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'MAINTENANCE': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  const getRoomTypeIcon = (type: RoomType) => {
    switch (type) {
      case 'NORMALE': return <Building2 size={18} />;
      case 'ATELIER': return <Wrench size={18} />;
      case 'HALL_TP': return <Package size={18} />;
      case 'SPECIALISEE': return <Monitor size={18} />;
    }
  };

  // Logic to determine current occupation
  const now = new Date();
  const currentDay = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][now.getDay()] as any;
  const currentTimeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

  const getOccupiedRooms = () => {
    return assignments.filter(a => {
      if (a.day !== currentDay) return false;
      return currentTimeStr >= a.startTime && currentTimeStr <= a.endTime;
    });
  };

  const currentOccupations = getOccupiedRooms();

  const handleTeacherPresence = async (teacherId: string, isPresent: boolean) => {
    await updateDoc(doc(db, 'teachers', teacherId), { isPresent });
  };

  const getConflicts = () => {
    const conflicts: any[] = [];
    const grouped = assignments.reduce((acc, a) => {
      const key = `${a.day}-${a.startTime}-${a.roomId}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(a);
      return acc;
    }, {} as any);

    Object.values(grouped).forEach((group: any) => {
      if (group.length > 1) {
        conflicts.push({
          type: 'ROOM_CONFLICT',
          roomName: rooms.find(r => r.id === group[0].roomId)?.name,
          assignments: group
        });
      }
    });

    return conflicts;
  };

  const conflicts = getConflicts();
  
  const studentAbsences = classes.flatMap(c => 
    (students || []).filter(s => s.classId === c.id && !s.isPresent)
  );

  const teacherAbsences = teachers.filter(t => t.isPresent === false);

  const recentIncidents = (students || []).flatMap(s => 
    (s.incidents || []).map(i => ({ ...i, studentName: `${s.firstName} ${s.name}`, studentClass: classes.find(c => c.id === s.classId)?.name }))
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-0 z-[60] bg-slate-950 flex flex-col pt-20"
    >
      {/* Header Bar */}
      <div className="px-8 py-6 border-b border-white/5 bg-slate-900/50 backdrop-blur-xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-indigo-600/20 rounded-2xl flex items-center justify-center text-indigo-400">
            <ClipboardCheck size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tighter">Affectation Salles</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Surveillance & Logistique Pédagogique</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-4 px-4 py-2 bg-white/5 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-emerald-400 uppercase">{rooms.filter(r => r.status === 'FREE').length} Libres</span>
            </div>
            <div className="h-4 w-[1px] bg-white/10" />
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-[10px] font-black text-amber-400 uppercase">{rooms.filter(r => r.status === 'OCCUPIED').length} Occupées</span>
            </div>
          </div>
          <button onClick={onClose} className="h-12 w-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <XCircle size={24} />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="px-8 py-4 border-b border-white/5 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'dashboard', label: 'Surveillance', icon: Zap },
          { id: 'planning', label: 'Planning Global', icon: LayoutGrid },
          { id: 'rooms', label: 'Gestion des Salles', icon: Building2 },
          { id: 'workshops', label: 'Ateliers & TP', icon: Flame },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 ring-2 ring-indigo-600/20' 
                : 'text-slate-400 hover:bg-white/5'
            }`}
          >
            <tab.icon size={18} />
            <span className="text-xs font-black uppercase tracking-widest">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dash"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >
              {/* Surveillance Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                 {[
                   { label: 'Salles Occupées', value: currentOccupations.length, color: 'indigo', icon: MapPin },
                   { label: 'Ateliers Actifs', value: workshops.length, color: 'amber', icon: Flame },
                   { label: 'Classes en TP', value: currentOccupations.filter(a => a.type === 'TP').length, color: 'emerald', icon: Zap },
                   { label: 'Alertes Maintenance', value: rooms.filter(r => r.status === 'MAINTENANCE').length, color: 'rose', icon: AlertTriangle },
                 ].map((stat, i) => (
                   <motion.div 
                     key={i}
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: i * 0.1 }}
                     className="glass p-6 rounded-[2.5rem] border border-white/5"
                   >
                     <div className={`h-12 w-12 bg-${stat.color}-500/10 rounded-2xl flex items-center justify-center text-${stat.color}-400 mb-4`}>
                       <stat.icon size={24} />
                     </div>
                     <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{stat.label}</p>
                     <h3 className="text-3xl font-black text-white mt-1">{stat.value}</h3>
                   </motion.div>
                 ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Real-time map/grid of rooms */}
                <div className="lg:col-span-2 glass rounded-[3rem] border border-white/5 flex flex-col overflow-hidden">
                  <div className="p-8 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-black text-white uppercase tracking-tighter italic">Occupation en Direct</h3>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{currentDay}, {currentTimeStr}</p>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-black text-slate-500 uppercase">Filtre Rapide:</span>
                       <div className="flex bg-slate-800/50 rounded-xl p-1">
                          {['TOUS', 'TP', 'COURS'].map(f => (
                            <button key={f} className="px-3 py-1.5 text-[8px] font-black uppercase text-slate-400 hover:text-white transition-colors">{f}</button>
                          ))}
                       </div>
                    </div>
                  </div>
                  
                  <div className="p-8 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {rooms.map(room => {
                      const occ = currentOccupations.find(o => o.roomId === room.id);
                      return (
                        <motion.div 
                          key={room.id}
                          layoutId={room.id}
                          className={`relative group h-32 rounded-3xl border transition-all flex flex-col justify-between p-4 ${
                            occ 
                              ? 'bg-indigo-600/20 border-indigo-500/30 ring-1 ring-indigo-500/20' 
                              : room.status === 'MAINTENANCE' 
                                ? 'bg-rose-500/10 border-rose-500/30'
                                : 'bg-white/5 border-white/5 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-black text-white">{room.name}</span>
                            <div className={`p-1.5 rounded-lg ${occ ? 'bg-indigo-500 text-white' : 'bg-white/10 text-slate-400'}`}>
                              {getRoomTypeIcon(room.type)}
                            </div>
                          </div>
                          
                          {occ ? (
                            <div className="space-y-0.5">
                              <p className="text-[9px] font-black text-indigo-400 uppercase truncate">{occ.className}</p>
                              <p className="text-[8px] font-bold text-slate-400 truncate flex items-center gap-1">
                                <UserIcon size={8} /> {occ.teacherName}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
                                  <div className="h-full bg-indigo-500 animate-shimmer" style={{ width: '60%' }} />
                                </div>
                                <span className="text-[7px] text-slate-500 font-black">{occ.endTime}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1">
                              <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full w-fit ${
                                room.status === 'MAINTENANCE' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                              }`}>
                                {room.status === 'MAINTENANCE' ? 'Réparation' : 'Libre'}
                              </span>
                              <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">{room.building}</p>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Supervisor Sidebar */}
                <div className="space-y-6">
                  {/* Quick Actions */}
                  <div className="glass p-8 rounded-[3rem] border border-white/5 bg-indigo-600">
                    <h3 className="text-xl font-black text-white leading-tight">Action Rapide<br />Surveillant</h3>
                    <p className="text-xs text-indigo-100/60 mt-2 font-medium">Affectez une classe en un clic pour une séance imprévue.</p>
                    <button 
                      onClick={() => setShowAddAssignment(true)}
                      className="w-full mt-6 bg-white text-indigo-600 py-4 rounded-2xl text-xs font-black uppercase flex items-center justify-center gap-3 shadow-xl hover:scale-105 active:scale-95 transition-all"
                    >
                      <Plus size={18} /> Nouvelle Affectation
                    </button>
                  </div>

                  {/* Activity Feed */}
                  <div className="glass rounded-[3rem] border border-white/5 flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                       <h4 className="text-xs font-black text-white uppercase tracking-widest">Derniers Mouvements</h4>
                       <MoreVertical size={14} className="text-slate-500" />
                    </div>
                    <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto no-scrollbar">
                      {currentOccupations.map((occ, idx) => (
                        <div key={idx} className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                          <div className="h-10 w-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 shrink-0">
                            <ArrowRight size={18} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-black text-white uppercase truncate">{occ.className} → {occ.subjectName}</p>
                            <p className="text-[9px] text-slate-400 mt-0.5">Sallle {rooms.find(r => r.id === occ.roomId)?.name} • {occ.startTime}</p>
                          </div>
                        </div>
                      ))}
                      {currentOccupations.length === 0 && (
                        <div className="py-12 flex flex-col items-center justify-center text-center opacity-50">
                           <LayoutGrid size={32} className="text-slate-600 mb-4" />
                           <p className="text-[10px] font-black text-slate-500 uppercase">Aucun mouvement actif</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Surveillance Insights */}
                  <div className="glass rounded-[3rem] border border-white/5 overflow-hidden">
                    <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                       <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                         <AlertTriangle size={14} className="text-amber-500" /> Points d'Attention
                       </h4>
                    </div>
                    <div className="p-6 space-y-4">
                       {conflicts.length > 0 && (
                         <div className="p-4 bg-rose-500/10 rounded-2xl border border-rose-500/20">
                            <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2">Conflits d'Occupation</p>
                            {conflicts.map((c, i) => (
                              <p key={i} className="text-[9px] text-white font-bold opacity-80">
                                ⚠️ Salle {c.roomName} : {c.assignments.length} classes affectées simultanément.
                              </p>
                            ))}
                         </div>
                       )}

                       <div className="flex gap-4">
                         <div className="flex-1 p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                            <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">Absences Profs</p>
                            <p className="text-xl font-black text-white">{teacherAbsences.length}</p>
                         </div>
                         <div className="flex-1 p-4 bg-slate-500/10 rounded-2xl border border-white/5">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Retards Élèves</p>
                            <p className="text-xl font-black text-white">{studentAbsences.length}</p>
                         </div>
                       </div>

                       {recentIncidents.length > 0 && (
                         <div className="space-y-2">
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Alertes Disciplinaires Récentes</p>
                            {recentIncidents.map((inc, idx) => (
                              <div key={idx} className="flex items-center justify-between text-[8px] py-1 border-b border-white/5 last:border-0">
                                <span className="text-white font-bold max-w-[100px] truncate">{inc.studentName} ({inc.studentClass})</span>
                                <span className="text-slate-500 italic">{inc.description.slice(0, 20)}...</span>
                              </div>
                            ))}
                         </div>
                       )}

                       <div className="pt-4 border-t border-white/5">
                          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-3">Appel Professeurs (Direct)</p>
                          <div className="space-y-2 max-h-[200px] overflow-y-auto no-scrollbar">
                             {teachers.map(t => (
                               <div key={t.id} className="flex items-center justify-between p-2 bg-white/5 rounded-xl border border-white/5">
                                  <span className="text-[9px] font-black text-white truncate max-w-[120px]">{t.firstName} {t.name}</span>
                                   <div className="flex bg-slate-900 rounded-lg p-0.5">
                                     <button 
                                      onClick={() => canManage && handleTeacherPresence(t.id, true)}
                                      disabled={!canManage}
                                      className={`px-2 py-1 rounded-md text-[7px] font-black uppercase transition-all ${t.isPresent !== false ? 'bg-emerald-500 text-white' : 'text-slate-500 hover:text-white'} ${!canManage ? 'opacity-50 cursor-not-allowed' : ''}`}
                                     >
                                       P
                                     </button>
                                     <button 
                                      onClick={() => canManage && handleTeacherPresence(t.id, false)}
                                      disabled={!canManage}
                                      className={`px-2 py-1 rounded-md text-[7px] font-black uppercase transition-all ${t.isPresent === false ? 'bg-rose-500 text-white' : 'text-slate-500 hover:text-white'} ${!canManage ? 'opacity-50 cursor-not-allowed' : ''}`}
                                     >
                                       A
                                     </button>
                                  </div>
                               </div>
                             ))}
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'rooms' && (
            <motion.div 
              key="rooms"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                   <input 
                    type="text" 
                    placeholder="Filtrer les salles (Nom, Bâtiment...)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-white rounded-2xl py-4 pl-12 pr-6 outline-none focus:border-indigo-600 transition-all font-display text-sm"
                   />
                </div>
                {canManage && (
                  <button 
                    onClick={() => setShowAddRoom(true)}
                    className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-3 shadow-xl hover:scale-105 active:scale-95 transition-all"
                  >
                    <Plus size={18} /> Ajouter une Salle
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {rooms.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.building.toLowerCase().includes(searchTerm.toLowerCase())).map(room => (
                  <motion.div 
                    key={room.id}
                    layout
                    className="glass rounded-[2rem] border border-white/5 overflow-hidden group hover:border-indigo-500/30 transition-all"
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className={`h-12 w-12 ${getStatusColor(room.status).split(' ')[0]} rounded-2xl flex items-center justify-center ${getStatusColor(room.status).split(' ')[1]} transition-colors`}>
                          {getRoomTypeIcon(room.type)}
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border ${getStatusColor(room.status)}`}>
                          {room.status}
                        </div>
                      </div>
                      
                      <h4 className="text-xl font-black text-white">{room.name}</h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Bâtiment {room.building}</p>
                      
                      <div className="mt-6 space-y-3">
                         <div className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-500 font-black uppercase">Capacité</span>
                            <span className="text-white font-black">{room.capacity} Élèves</span>
                         </div>
                         <div className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-500 font-black uppercase">Type</span>
                            <span className="text-indigo-400 font-bold truncate max-w-[100px]">{room.type}</span>
                         </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
                       <button className="text-[10px] font-black text-slate-500 uppercase hover:text-white transition-colors">Historique</button>
                       {canManage && (
                         <div className="flex items-center gap-2">
                           <button onClick={async () => {
                             const newStatus = room.status === 'FREE' ? 'MAINTENANCE' : 'FREE';
                             await updateDoc(doc(db, 'rooms', room.id), { status: newStatus, lastUpdate: new Date().toISOString() });
                           }} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400">
                             <Settings size={14} />
                           </button>
                           <button onClick={async () => {
                             if(confirm('Supprimer cette salle ?')) await deleteDoc(doc(db, 'rooms', room.id));
                           }} className="p-2 hover:bg-rose-500/10 rounded-lg transition-colors text-rose-500">
                             <XCircle size={14} />
                           </button>
                         </div>
                       )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'planning' && (
            <motion.div 
              key="planning"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
               {/* Planning Tools */}
               <div className="glass p-8 rounded-[3rem] border border-white/5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
                       {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'].map(d => (
                         <button key={d} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${currentDay === d ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
                           {d}
                         </button>
                       ))}
                    </div>
                    <div className="flex items-center gap-4">
                      <select 
                        value={selectedField}
                        onChange={(e) => setSelectedField(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[10px] font-black uppercase text-white outline-none"
                      >
                         <option value="TOUS">Toutes Filières</option>
                         {INITIAL_FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                      <div className="bg-slate-800/50 p-1 rounded-xl flex">
                        <button 
                          onClick={() => setPlanningView('rooms')}
                          className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${planningView === 'rooms' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}`}
                        >
                          Salles
                        </button>
                        <button 
                          onClick={() => setPlanningView('classes')}
                          className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${planningView === 'classes' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}`}
                        >
                          Classes
                        </button>
                        <button 
                          onClick={() => setPlanningView('teachers')}
                          className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${planningView === 'teachers' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}`}
                        >
                          Profs
                        </button>
                      </div>
                      {canManage && (
                        <button 
                          onClick={() => setShowAddAssignment(true)}
                          className="bg-emerald-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2 shadow-lg"
                        >
                          <CalendarIcon size={14} /> Affecter
                        </button>
                      )}
                    </div>
                 </div>

                 {/* Grid Planning */}
                 <div className="mt-8 overflow-x-auto custom-scrollbar">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="p-4 text-left border-b border-white/5 text-[10px] font-black text-slate-500 uppercase sticky left-0 bg-slate-900 z-10 w-40">
                            {planningView === 'rooms' ? 'Salle' : planningView === 'classes' ? 'Classe' : 'Professeur'} / Heure
                          </th>
                          {['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'].map(h => (
                            <th key={h} className="p-4 border-b border-white/5 text-[10px] font-black text-slate-500 uppercase min-w-[150px]">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(planningView === 'rooms' 
                          ? rooms.filter(r => selectedField === 'TOUS' || (r.type === 'NORMALE' || r.type === 'ATELIER')) 
                          : planningView === 'classes' 
                            ? classes.filter(c => selectedField === 'TOUS' || c.field === selectedField)
                            : teachers
                        ).map((entity: any) => (
                          <tr key={entity.id} className="hover:bg-white/[0.02] transition-colors border-b border-white/5">
                            <td className="p-4 sticky left-0 bg-slate-900/80 backdrop-blur-md z-10">
                              <div className="flex items-center gap-3">
                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${planningView === 'rooms' ? getStatusColor((entity as Room).status).split(' ')[0] : 'bg-white/5'} ${planningView === 'rooms' ? getStatusColor((entity as Room).status).split(' ')[1] : 'text-slate-400'}`}>
                                  {planningView === 'rooms' ? getRoomTypeIcon((entity as Room).type) : planningView === 'classes' ? <Users size={14} /> : <UserIcon size={14} />}
                                </div>
                                <span className="text-xs font-black text-white">{entity.name || `${entity.firstName} ${entity.name}`}</span>
                              </div>
                            </td>
                            {['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'].map(h => {
                              const slot = assignments.find(a => {
                                if (a.day !== currentDay) return false;
                                if (planningView === 'rooms') return a.roomId === entity.id && h >= a.startTime && h < a.endTime;
                                if (planningView === 'classes') return a.classId === entity.id && h >= a.startTime && h < a.endTime;
                                if (planningView === 'teachers') return a.teacherId === entity.id && h >= a.startTime && h < a.endTime;
                                return false;
                              });
                              return (
                                <td key={h} className="p-2">
                                  {slot ? (
                                    <div className={`p-3 rounded-xl border ${slot.type === 'TP' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-indigo-500/10 border-indigo-500/20'} h-full flex flex-col justify-center`}>
                                      <span className="text-[9px] font-black text-white uppercase truncate">
                                        {planningView === 'rooms' ? slot.className : planningView === 'classes' ? rooms.find(r => r.id === slot.roomId)?.name : slot.className}
                                      </span>
                                      <span className="text-[7px] text-slate-500 font-bold uppercase truncate">
                                        {planningView === 'teachers' ? rooms.find(r => r.id === slot.roomId)?.name : slot.teacherName}
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="h-12 border border-dashed border-white/5 rounded-xl flex items-center justify-center opacity-20 hover:opacity-100 transition-opacity cursor-pointer group">
                                       <Plus size={12} className="text-slate-500 group-hover:text-emerald-500" />
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                 </div>
               </div>
            </motion.div>
          )}

          {activeTab === 'workshops' && (
            <motion.div 
              key="work"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
               <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">Gestion des Ateliers</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Configuration des Halls TP et Salles Pédagogiques liées</p>
                  </div>
                  {canManage && (
                    <button 
                      onClick={() => setShowAddWorkshop(true)}
                      className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs flex items-center justify-center gap-3 shadow-xl"
                    >
                      <Zap size={18} /> Créer un Atelier
                    </button>
                  )}
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {workshops.map(workshop => (
                    <div key={workshop.id} className="glass p-8 rounded-[3rem] border border-white/5 flex flex-col gap-6 relative overflow-hidden group">
                       <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                         <Flame size={120} className="text-indigo-500" />
                       </div>
                       
                       <div className="flex items-center gap-4 relative">
                          <div className="h-14 w-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                            <Wrench size={24} />
                          </div>
                          <div>
                             <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter">{workshop.name}</h4>
                             <p className="text-xs text-slate-500 font-medium">{workshop.description || "Unité technique spécialisée"}</p>
                          </div>
                       </div>

                       <div className="grid grid-cols-3 gap-4 relative">
                          <div className="col-span-1 glass p-4 rounded-2xl border border-white/5 bg-white/[0.03]">
                             <p className="text-[8px] font-black text-slate-500 uppercase mb-2 flex items-center gap-1">
                               <MapPin size={8} /> Hall Principal
                             </p>
                             <div className="h-16 flex items-center justify-center text-center">
                                <span className="text-xs font-black text-white">
                                  {rooms.find(r => r.id === workshop.hallTpId)?.name || "Non assigné"}
                                </span>
                             </div>
                          </div>
                          <div className="col-span-2 glass p-4 rounded-2xl border border-white/5 bg-white/[0.03] grid grid-cols-2 gap-4">
                             <p className="col-span-2 text-[8px] font-black text-slate-500 uppercase mb-2 flex items-center gap-1">
                               <LayoutGrid size={8} /> Salles Pédagogiques
                             </p>
                             {workshop.pedagogicRoomIds.map((rid, idx) => (
                               <div key={idx} className="h-16 flex items-center justify-center text-center border border-dashed border-white/10 rounded-xl">
                                  <span className="text-xs font-black text-slate-400">
                                    {rooms.find(r => r.id === rid)?.name || "---"}
                                  </span>
                               </div>
                             ))}
                          </div>
                       </div>

                       <div className="flex items-center justify-between pt-4 border-t border-white/5 relative">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500" />
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Opérationnel</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <button className="text-xs font-black text-indigo-400 uppercase hover:text-white transition-colors">Modifier</button>
                            <button onClick={async () => {
                               if(confirm('Supprimer cet atelier ?')) await deleteDoc(doc(db, 'workshops', workshop.id));
                            }} className="text-xs font-black text-rose-500/50 uppercase hover:text-rose-500 transition-colors">Supprimer</button>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* MODALS */}
      {showAddRoom && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowAddRoom(false)} />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md glass p-8 rounded-[3rem] border border-white/10 shadow-2xl relative"
          >
            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mb-6">Nouvelle Salle</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              const newRoom = {
                name: data.get('name') as string,
                type: data.get('type') as RoomType,
                capacity: parseInt(data.get('capacity') as string),
                building: data.get('building') as string,
                status: 'FREE' as RoomStatus,
                lastUpdate: new Date().toISOString()
              };
              await addDoc(collection(db, 'rooms'), toPlainObject(newRoom));
              setShowAddRoom(false);
            }} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Nom de la salle</label>
                <input required name="name" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm focus:border-indigo-600 outline-none transition-all" placeholder="Ex: Salle A104" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Type</label>
                  <select name="type" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm focus:border-indigo-600 outline-none transition-all font-display">
                    <option value="NORMALE">Normale</option>
                    <option value="ATELIER">Atelier</option>
                    <option value="HALL_TP">Hall TP</option>
                    <option value="SPECIALISEE">Spécialisée</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Capacité</label>
                  <input required name="capacity" type="number" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm focus:border-indigo-600 outline-none transition-all" placeholder="30" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Bâtiment / Zone</label>
                <input required name="building" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm focus:border-indigo-600 outline-none transition-all" placeholder="Ex: Bâtiment Technique" />
              </div>
              <button className="w-full bg-indigo-600 text-white py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-600/20 active:scale-95 transition-all mt-6">Enregistrer Salles</button>
            </form>
          </motion.div>
        </div>
      )}

      {showAddAssignment && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowAddAssignment(false)} />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-xl glass p-8 rounded-[3rem] border border-white/10 shadow-2xl relative"
          >
            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mb-6">Affectation Pédagogique</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              const room = rooms.find(r => r.id === data.get('roomId'));
              const cls = classes.find(c => c.id === data.get('classId'));
              const teacher = teachers.find(t => t.id === data.get('teacherId'));
              const sub = subjects.find(s => s.id === data.get('subjectId'));

              const newAssignment = {
                roomId: data.get('roomId') as string,
                classId: data.get('classId') as string,
                className: cls?.name || "",
                teacherId: data.get('teacherId') as string,
                teacherName: `${teacher?.firstName} ${teacher?.name}` || "",
                subjectId: data.get('subjectId') as string,
                subjectName: sub?.name || "",
                day: data.get('day') as any,
                startTime: data.get('startTime') as string,
                endTime: data.get('endTime') as string,
                type: data.get('type') as any,
                repetitive: true
              };
              
              const includeFullWorkshop = data.get('fullWorkshop') === 'on';
              const workshop = workshops.find(w => w.hallTpId === newAssignment.roomId || w.pedagogicRoomIds.includes(newAssignment.roomId));

              if (includeFullWorkshop && workshop) {
                const roomIds = [workshop.hallTpId, ...workshop.pedagogicRoomIds];
                for (const rid of roomIds) {
                  await addDoc(collection(db, 'roomAssignments'), toPlainObject({ ...newAssignment, roomId: rid }));
                  if (newAssignment.day === currentDay && currentTimeStr >= newAssignment.startTime && currentTimeStr <= newAssignment.endTime) {
                    await updateDoc(doc(db, 'rooms', rid), { 
                      status: 'OCCUPIED', 
                      currentClassId: newAssignment.classId,
                      currentTeacherId: newAssignment.teacherId,
                      lastUpdate: new Date().toISOString()
                    });
                  }
                }
              } else {
                await addDoc(collection(db, 'roomAssignments'), toPlainObject(newAssignment));
                if (newAssignment.day === currentDay && currentTimeStr >= newAssignment.startTime && currentTimeStr <= newAssignment.endTime) {
                  await updateDoc(doc(db, 'rooms', newAssignment.roomId), { 
                    status: 'OCCUPIED', 
                    currentClassId: newAssignment.classId,
                    currentTeacherId: newAssignment.teacherId,
                    lastUpdate: new Date().toISOString()
                  });
                }
              }

              setShowAddAssignment(false);
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Salle</label>
                    <select name="roomId" required className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm focus:border-indigo-600 outline-none transition-all font-display">
                      {rooms.map(r => <option key={r.id} value={r.id}>{r.name} ({r.building})</option>)}
                    </select>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Type Affectation</label>
                    <select name="type" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm focus:border-indigo-600 outline-none transition-all font-display">
                      <option value="COURS">Cours Normal</option>
                      <option value="TP">Travaux Pratiques (Atelier)</option>
                      <option value="EXAMEN">Examen / Devoir</option>
                      <option value="REUNION">Réunion</option>
                    </select>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Classe</label>
                    <select name="classId" required className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm focus:border-indigo-600 outline-none transition-all font-display">
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Professeur</label>
                    <select name="teacherId" required className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm focus:border-indigo-600 outline-none transition-all font-display">
                       {teachers.map(t => <option key={t.id} value={t.id}>{t.firstName} {t.name}</option>)}
                    </select>
                 </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Matière</label>
                <select name="subjectId" required className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm focus:border-indigo-600 outline-none transition-all font-display">
                   {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.category})</option>)}
                </select>
              </div>

              <div className="flex items-center gap-3 p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                <input type="checkbox" name="fullWorkshop" id="fullWorkshop" className="accent-indigo-500 h-4 w-4" />
                <label htmlFor="fullWorkshop" className="text-[10px] font-black text-indigo-400 uppercase cursor-pointer">
                  Inclure tout l'Atelier lié (Hall TP + Salles Pédagogiques)
                </label>
              </div>

              <div className="grid grid-cols-3 gap-4">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Jour</label>
                    <select name="day" className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white text-[10px] focus:border-indigo-600 outline-none font-display">
                      {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Début</label>
                    <input name="startTime" type="time" required className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white text-[10px] focus:border-indigo-600 outline-none font-display" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Fin</label>
                    <input name="endTime" type="time" required className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white text-[10px] focus:border-indigo-600 outline-none font-display" />
                 </div>
              </div>
              <button className="w-full bg-emerald-600 text-white py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-600/20 active:scale-95 transition-all mt-6">Confirmer l'Affectation</button>
            </form>
          </motion.div>
        </div>
      )}

      {showAddWorkshop && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowAddWorkshop(false)} />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md glass p-8 rounded-[3rem] border border-white/10 shadow-2xl relative"
          >
            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mb-6">Configuration Atelier</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              const pRooms = data.getAll('pedagogicRoomIds') as string[];
              
              const newWorkshop = {
                name: data.get('name') as string,
                hallTpId: data.get('hallTpId') as string,
                pedagogicRoomIds: pRooms,
                description: data.get('description') as string
              };
              
              await addDoc(collection(db, 'workshops'), toPlainObject(newWorkshop));
              setShowAddWorkshop(false);
            }} className="space-y-4">
               <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Nom de l'atelier</label>
                <input required name="name" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm focus:border-indigo-600 outline-none transition-all font-display" placeholder="Ex: Atelier Électrotechnique" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Hall de TP Associé</label>
                <select name="hallTpId" required className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm focus:border-indigo-600 outline-none transition-all font-display">
                  {rooms.filter(r => r.type === 'HALL_TP').map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Salles Pédagogiques (2 max)</label>
                <select multiple name="pedagogicRoomIds" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm focus:border-indigo-600 outline-none transition-all font-display h-32">
                  {rooms.filter(r => r.type === 'NORMALE' || r.type === 'ATELIER').map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <p className="text-[8px] text-slate-500 mt-1 uppercase italic">* Maintenez Cmd/Ctrl pour sélectionner 2 salles</p>
              </div>
              <button className="w-full bg-indigo-600 text-white py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl mt-6">Finaliser l'Atelier</button>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
