
import React, { useState } from 'react';
import { Search, ChevronRight, Users, ShieldCheck, GraduationCap, User,  ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';
import { Student, SchoolClass, User as AppUser, Teacher } from './types';
import { useAuth } from './AuthContext';

interface CampusViewProps {
  students: Student[];
  teachers: Teacher[];
  classes: SchoolClass[];
  allStaff: AppUser[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedClassFilter: string;
  setSelectedClassFilter: (id: string) => void;
  onSelectStudent: (id: string) => void;
  onSelectTeacher: (id: string) => void;
  onSelectStaff: (id: string) => void;
  onPresenceChange?: (student: Student, isPresent: boolean) => void;
}

type CampusCategory = 'students' | 'teachers' | 'staff';

export const CampusView: React.FC<CampusViewProps> = ({
  students, teachers, classes, allStaff, searchQuery, setSearchQuery, selectedClassFilter, setSelectedClassFilter, onSelectStudent, onSelectTeacher, onSelectStaff,   onPresenceChange
}) => {
  const { isStaff } = useAuth();
  const [activeCategory, setActiveCategory] = useState<CampusCategory>('students');
   const [isSurveillanceMode, setIsSurveillanceMode] = useState(false);

  const filteredStaff = React.useMemo(() => {
    const q = (searchQuery || "").toLowerCase();
    return allStaff
      .filter(s => s.role === 'SURVEILLANT' || s.role === 'SG')
      .filter(s => (s.name || "").toLowerCase().includes(q));
  }, [allStaff, searchQuery]);

  const filteredTeachers = React.useMemo(() => {
    const q = (searchQuery || "").toLowerCase();
    return teachers.filter(t => 
      `${t.firstName || ""} ${t.name || ""}`.toLowerCase().includes(q)
    );
  }, [teachers, searchQuery]);

  const renderCategoryTabs = () => {
    // Si l'utilisateur n'est pas un membre du personnel, on n'affiche pas les onglets de sélection
    if (!isStaff) return null;

    return (
      <div className="flex p-1.5 glass rounded-[2.5rem] border border-white/5 mb-8">
        <button 
          onClick={() => setActiveCategory('students')}
          className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-[2rem] text-[10px] font-black uppercase transition-all ${activeCategory === 'students' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Users size={16} /> Élèves
        </button>
        <button 
          onClick={() => setActiveCategory('teachers')}
          className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-[2rem] text-[10px] font-black uppercase transition-all ${activeCategory === 'teachers' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <GraduationCap size={16} /> Profs
        </button>
        <button 
          onClick={() => setActiveCategory('staff')}
          className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-[2rem] text-[10px] font-black uppercase transition-all ${activeCategory === 'staff' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <ShieldCheck size={16} /> Surveillants
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-32 animate-in slide-in-from-bottom duration-500">
      {/* Sélecteur de catégorie principal */}
      {renderCategoryTabs()}

      {/* Barre de recherche contextuelle */}
      <div className="relative group">
        <Search className={`absolute left-6 top-1/2 -translate-y-1/2 transition-colors ${
          activeCategory === 'students' ? 'text-indigo-500' : 
          activeCategory === 'teachers' ? 'text-amber-500' : 'text-emerald-500'
        }`} size={20} />
        <input 
          type="text" 
          value={searchQuery} 
          onChange={e => setSearchQuery(e.target.value)} 
          placeholder={`Chercher un ${activeCategory === 'students' ? 'apprenant' : activeCategory === 'teachers' ? 'professeur' : 'surveillant'}...`} 
          className="w-full glass rounded-[2.5rem] py-6 pl-16 pr-8 text-lg font-black dark:text-white outline-none border border-white/5 focus:ring-2 focus:ring-opacity-20 transition-all shadow-2xl" 
        />
      </div>

       {isStaff && activeCategory === 'students' && (
          <button 
            onClick={() => setIsSurveillanceMode(!isSurveillanceMode)}
            className={`flex items-center justify-center gap-3 py-4 rounded-2xl text-[10px] font-black uppercase transition-all border ${isSurveillanceMode ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-500/20' : 'glass text-slate-400 border-white/5'}`}
          >
            <ShieldAlert size={16} />
            {isSurveillanceMode ? 'Quitter Mode Surveillance' : 'Activer Mode Surveillance (Appel)'}
          </button>
        )}
       

      {/* Filtres de classes (toujours visibles pour les élèves car ils ne voient que les élèves) */}
      {activeCategory === 'students' && (
        <div className="flex gap-3 overflow-x-auto pb-4 hide-scrollbar px-1">
          <button 
            onClick={() => setSelectedClassFilter('all')} 
            className={`shrink-0 px-6 py-3 rounded-2xl text-[9px] font-black uppercase transition-all whitespace-nowrap ${selectedClassFilter === 'all' ? 'bg-indigo-600 text-white shadow-lg' : 'glass text-slate-500'}`}
          >
            Tous les élèves
          </button>
          {classes.map(cls => (
            <button 
              key={cls.id} 
              onClick={() => setSelectedClassFilter(cls.id)} 
              className={`shrink-0 px-6 py-3 rounded-2xl text-[9px] font-black uppercase transition-all whitespace-nowrap ${selectedClassFilter === cls.id ? 'bg-indigo-600 text-white shadow-lg' : 'glass text-slate-500'}`}
            >
              {cls.name}
            </button>
          ))}
        </div>
      )}

      {/* Liste dynamique */}
      <div className="grid grid-cols-1 gap-4">
        {activeCategory === 'students' && students.map(item => (
          <div key={item.id} onClick={() => onSelectStudent(item.id)} className="glass p-5 rounded-[2.5rem] flex items-center gap-6 group hover:scale-[1.02] active:scale-95 transition-all cursor-pointer shadow-xl relative overflow-hidden border border-white/5">
            <div className="h-16 w-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center font-black text-2xl text-indigo-400">
              {(item.firstName || '?')[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="text-sm font-black uppercase dark:text-white">{item.firstName || ""} {item.name || ""}</p>
              <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                {classes.find(c => c.id === item.classId)?.name || 'N/A'} • {item.matricule}
              </p>
            </div>
             {isSurveillanceMode ? (
              <div className="flex gap-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); onPresenceChange?.(item, true); }}
                  className={`p-4 rounded-2xl transition-all ${item.isPresent ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white/5 text-slate-600'}`}
                >
                  <CheckCircle2 size={20} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onPresenceChange?.(item, false); }}
                  className={`p-4 rounded-2xl transition-all ${!item.isPresent ? 'bg-rose-600 text-white shadow-lg' : 'bg-white/5 text-slate-600'}`}
                >
                  <XCircle size={20} />
                </button>
              </div>
            ) : (
            <ChevronRight size={18} className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
            )}
          </div>
        ))}

        {isStaff && activeCategory === 'teachers' && filteredTeachers.map(item => (
          <div key={item.id} onClick={() => onSelectTeacher(item.id)} className="glass p-5 rounded-[2.5rem] flex items-center gap-6 group hover:scale-[1.02] active:scale-95 transition-all cursor-pointer shadow-xl relative overflow-hidden border border-white/5">
            <div className="h-16 w-16 rounded-2xl bg-amber-500/10 flex items-center justify-center font-black text-2xl text-amber-400">
              {(item.firstName || '?')[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="text-sm font-black uppercase dark:text-white">{item.firstName || ""} {item.name || ""}</p>
              <div className="flex gap-2 mt-1">
                {item.subjectIds?.slice(0, 2).map(sid => (
                  <span key={sid} className="text-[7px] font-black bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                    {sid.substring(0, 8)}
                  </span>
                ))}
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-600 group-hover:text-amber-400 transition-colors" />
          </div>
        ))}

        {isStaff && activeCategory === 'staff' && filteredStaff.map(item => (
          <div key={item.id} onClick={() => onSelectStaff(item.id)} className="glass p-5 rounded-[2.5rem] flex items-center gap-6 group hover:scale-[1.02] active:scale-95 transition-all cursor-pointer shadow-xl relative overflow-hidden border border-white/5">
            <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center font-black text-2xl text-emerald-400">
              {(item.name || '?')[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="text-sm font-black uppercase dark:text-white">{item.name || ""}</p>
              <p className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest">
                {item.role} • {item.matricule || 'ID-TEMP'} • {item.assignedClassIds?.length || 0} Classes
              </p>
            </div>
            <ChevronRight size={18} className="text-slate-600 group-hover:text-emerald-400 transition-colors" />
          </div>
        ))}

        {((activeCategory === 'students' && students.length === 0) || 
          (activeCategory === 'teachers' && filteredTeachers.length === 0) ||
          (activeCategory === 'staff' && filteredStaff.length === 0)) && (
          <div className="py-20 text-center opacity-30">
            <Users size={60} className="mx-auto mb-4" />
            <p className="text-[10px] font-black uppercase">Aucun résultat dans cette catégorie</p>
          </div>
        )}
      </div>
    </div>
  );
};
