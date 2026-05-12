
import React, { useState } from 'react';
import { 
  ArrowLeft, ShieldCheck, User as UserIcon, Building, 
  Trash2, Save, CheckCircle, XCircle, Info, Lock
} from 'lucide-react';
import { User, SchoolClass } from './types';
import { useAuth } from './AuthContext';
import { PrivateMailbox } from './PrivateMailbox';
import { Mail } from 'lucide-react';


export const StaffDetail = ({ 
  staff, 
  classes, 
  isSuperAdmin,
   isSG,
  onUpdate, 
  onDelete, 
  onClose 
}: { 
  staff: User; 
  classes: SchoolClass[]; 
  isSuperAdmin: boolean;
  isSG?: boolean;
  onUpdate: (u: User) => void; 
  onDelete: (id: string) => void; 
  onClose: () => void 
}) => {
  const { currentUser } = useAuth();
  const isMe = currentUser?.id === staff.id;
  const canManage = isSuperAdmin || isSG;
  const canSendMail = isSuperAdmin || isSG || ['PROVISEUR', 'DE', 'CT'].includes(currentUser?.role || '');

  const [localStaff, setLocalStaff] = useState<User>({
    ...staff,
    assignedClassIds: staff.assignedClassIds || []
  });
  const [showMailbox, setShowMailbox] = useState(false);

  const toggleClass = (classId: string) => {
    if (!canManage) return;
    const current = [...(localStaff.assignedClassIds || [])];
    const index = current.indexOf(classId);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(classId);
    }
    setLocalStaff({ ...localStaff, assignedClassIds: current });
  };

 return (
    <div className="fixed inset-0 z-[600] bg-slate-950 flex flex-col min-h-screen animate-in slide-in-from-right duration-300 overflow-y-auto">
      <div className="px-6 py-5 flex items-center justify-between border-b border-white/5 shrink-0 bg-slate-900/80 backdrop-blur-md sticky top-0 z-20">
        <button onClick={onClose} className="p-3 glass rounded-2xl text-slate-400 active:scale-90"><ArrowLeft size={20} /></button>
        <div className="text-center">
          <h3 className="text-[9px] font-black uppercase text-slate-500 tracking-widest">
            {canManage ? 'Configuration Accès' : 'Consultation Profil'}
          </h3>
          <p className="font-black text-indigo-400 uppercase leading-none text-sm">{localStaff.name}</p>
        </div>
        <div className="flex items-center gap-2">
           {(canSendMail || isMe) && (
            <button 
              onClick={() => setShowMailbox(true)} 
              className={`p-3 glass rounded-2xl text-white active:scale-90 relative ${isMe ? 'bg-indigo-600 shadow-indigo-500/20 shadow-lg' : 'text-slate-400'}`}
              title={isMe ? "Mon Courrier" : "Lui envoyer un courrier"}
            >
              <Mail size={18} />
              {isMe && <div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 border-2 border-slate-900 rounded-full animate-pulse" />}
            </button>
          )}
          {canManage ? (
            <button 
              onClick={() => { onUpdate(localStaff); onClose(); }}
              className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
            >
              Appliquer
            </button>
          ) : (
            <div className="w-4" />
          )}
        </div>
      </div>

      <div className="flex-1 p-6 space-y-8 max-w-2xl mx-auto w-full pb-32">
        <div className="glass rounded-[3rem] p-10 flex flex-col items-center relative overflow-hidden border border-white/5 shadow-2xl">
          <div className="h-28 w-28 rounded-[2.5rem] bg-indigo-500/10 border-4 border-white/5 flex items-center justify-center font-black text-4xl text-indigo-400 shadow-inner mb-6">
            {(localStaff.name || '?')[0]}
          </div>
          <div className="text-center">
            <h2 className="text-xl font-black uppercase text-white tracking-tight leading-tight">{localStaff.name}</h2>
            <div className="mt-3 flex flex-col items-center gap-2">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-600/20 border border-indigo-500/30 rounded-full">
                <ShieldCheck size={14} className="text-indigo-400" />
                <span className="text-[9px] font-black uppercase text-indigo-400 tracking-widest">{localStaff.role}</span>
              </div>
              {(isSuperAdmin || isMe) && localStaff.matricule && (
                <p className="text-[10px] font-mono font-bold text-slate-500 tracking-tighter">ID: {localStaff.matricule}</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
              <ShieldCheck size={14} /> Rôle & Privilèges
            </h4>
          </div>

          <div className="relative">
            <select 
              value={localStaff.role} 
              disabled={!isSuperAdmin}
              onChange={e => setLocalStaff({...localStaff, role: e.target.value as any})}
              className="w-full bg-white/5 border border-white/10 p-5 rounded-3xl text-xs font-black uppercase text-white outline-none focus:border-indigo-500 transition-all appearance-none"
            >
              <option value="SURVEILLANT">Surveillant</option>
              <option value="SG">Surveillant Général</option>
              <option value="CT">Chef des Travaux</option>
              <option value="DE">Directeur des Études</option>
              <option value="PROVISEUR">Proviseur</option>
              <option value="ADMIN">ADMIN LTP</option>
              <option value="COMPTABLE_MATIERE">Comptable Matière</option>
            </select>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
              <ShieldCheck size={16} className="text-indigo-400" />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
              <Building size={14} /> Périmètre assigné
            </h4>
            {!canManage && (
              <span className="text-[7px] font-black text-amber-500 uppercase flex items-center gap-1">
                <Lock size={10} /> Modification réservée à l'ADMIN/SG
              </span>
            )}
          </div>

          <div className="bg-white/5 rounded-[2.5rem] p-2 grid grid-cols-1 gap-1 border border-white/5 shadow-inner">
            {classes.length > 0 ? classes.map(cls => {
              const isSelected = localStaff.assignedClassIds?.includes(cls.id);
              return (
                <button 
                  key={cls.id}
                  onClick={() => toggleClass(cls.id)}
                  disabled={!canManage}
                  className={`flex items-center justify-between p-5 rounded-[2rem] transition-all group ${isSelected ? 'bg-indigo-600 text-white shadow-xl' : 'hover:bg-white/5 text-slate-400'} ${!canManage && 'cursor-default'}`}
                >
                  <div className="flex items-center gap-4 text-left">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-black text-xs ${isSelected ? 'bg-white/20' : 'bg-slate-800'}`}>
                      {(cls.name || '??').substring(0, 2)}
                    </div>
                    <div>
                      <p className={`text-xs font-black uppercase leading-none ${isSelected ? 'text-white' : 'text-slate-300'}`}>{cls.name}</p>
                      <p className={`text-[8px] font-bold uppercase mt-1 ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>{cls.level} • {cls.field}</p>
                    </div>
                  </div>
                  {isSelected ? <CheckCircle size={20} /> : <div className="h-5 w-5 rounded-full border-2 border-slate-800"></div>}
                </button>
              );
            }) : (
              <div className="py-12 text-center opacity-20">
                <Info size={40} className="mx-auto mb-4" />
                <p className="text-[10px] font-black uppercase">Aucune classe disponible</p>
              </div>
            )}
          </div>
        </div>

        {isSuperAdmin && (
          <div className="pt-8 border-t border-white/5">
            <button 
              onClick={() => { if(window.confirm('Supprimer définitivement ce compte de la direction ?')) { onDelete(localStaff.id); onClose(); } }}
              className="w-full bg-rose-500/10 text-rose-500 border border-rose-500/20 py-6 rounded-[2.5rem] font-black uppercase text-[10px] flex items-center justify-center gap-4 hover:bg-rose-500 hover:text-white transition-all active:scale-95 shadow-lg"
            >
              <Trash2 size={20} /> Supprimer le compte direction
            </button>
          </div>
        )}
      </div>
      {showMailbox && (
        <PrivateMailbox targetUser={staff} onClose={() => setShowMailbox(false)} />
      )}
    </div>
  );
};
