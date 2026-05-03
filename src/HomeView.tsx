
import React from 'react';
import { Landmark, Star, Award, UserCheck, Wrench, Flame, Loader2, Sparkles, ShieldCheck, GraduationCap, Users, UserCircle, Heart, MessageSquare } from 'lucide-react';
import { SchoolEvent, Student, EventType, SchoolClass } from './types';
import  ClassLeaderboard  from './ClassLeaderboard';
import  WeeklyChallenge  from './WeeklyChallenge';


const EVENT_TYPE_LABELS: Record<EventType, { label: string, icon: any, color: string }> = {
  'PROVISEUR': { label: 'Proviseur', icon: Landmark, color: 'bg-indigo-600' },
  'DE_CT': { label: 'DE / Chef des Travaux', icon: GraduationCap, color: 'bg-violet-600' },
  'SURVEILLANT_GEN': { label: 'Surveillance Générale', icon: ShieldCheck, color: 'bg-amber-600' },
  'CLUB_ENV': { label: 'Clubs & Environnement', icon: Users, color: 'bg-emerald-600' },
  'CLUB_SCI': { label: 'Clubs Scientifiques', icon: Users, color: 'bg-emerald-600' },
  'GOUVERNEMENT': { label: 'Gouvernement Scolaire', icon: Star, color: 'bg-blue-600' },
  'Atelier': { label: 'Chef d\'Atelier', icon: Wrench, color: 'bg-slate-600' },
  'Examen': { label: 'Service Examens', icon: Award, color: 'bg-rose-600' }
};

interface HomeViewProps {
  events: SchoolEvent[];
  students: Student[];
  classes: SchoolClass[];
  studentStats: { presenceRate: number; totalStudents: number; topStudent: Student | null };
  aiSummary: string | null;
  isAiLoading: boolean;
  onGenerateAi: () => void;
  isStaff: boolean;
  onNavigateToAdmin: () => void;
  currentStudent?: Student | null;
  onOpenStudentProfile?: (id: string) => void;
  onUpdateStudent?: (updated: Student) => void;
  onLikeEvent: (eventId: string, currentLikes: number) => void;
  onOpenComments: (event: SchoolEvent) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ 
  events, students, classes, studentStats, aiSummary, isAiLoading, onGenerateAi, isStaff, onNavigateToAdmin, currentStudent, onOpenStudentProfile, onUpdateStudent, onLikeEvent, onOpenComments
}) => {
  const topStudent = studentStats.topStudent;
  const topStudentClass = classes.find(c => c.id === topStudent?.classId);

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <div className="space-y-6">
        <section className="glass rounded-[3.5rem] p-10 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-5"><Landmark size={150} /></div>
          
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><Star size={24} /></div>
              <h3 className="text-sm font-black uppercase text-indigo-600">Mot du Proviseur M.MBAGNICK FAYE</h3>
            </div>
            
            {/* Bouton Mon Profil pour les élèves */}
            {!isStaff && currentStudent && onOpenStudentProfile && (
               <button 
                 onClick={() => onOpenStudentProfile(currentStudent.id)}
                 className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl border border-white/10 transition-all active:scale-95"
               >
                 <UserCircle size={18} className="text-indigo-400" />
                 <span className="text-[9px] font-black uppercase text-white tracking-widest">Mon Pass</span>
               </button>
            )}
          </div>
          
          <p className="text-[18px] font-bold italic text-slate-700 dark:text-slate-200 leading-relaxed">"L'excellence par la technique et la rigueur. Bienvenue sur votre plateforme de gestion LTPF Campus."</p>
        </section>

        {/* Citation générée par l'IA */}
        <AIGeneratedQuote />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* BLOC GAINDÉ DE LA SEMAINE (MISE À JOUR) */}
        <div className="col-span-2 glass rounded-[3.5rem] p-8 flex items-center gap-8 bg-gradient-to-br from-indigo-700 via-indigo-900 to-black text-white shadow-2xl border border-white/10 relative overflow-hidden">
          {/* Décoration Lions en background */}
          <div className="absolute -right-10 -bottom-10 opacity-10 rotate-12">
            <Award size={200} />
          </div>
          
          {/* Photo de profil du Gaïndé avec Halo */}
          <div className="relative shrink-0">
            <div className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-full animate-pulse"></div>
            <div className="h-28 w-28 rounded-[2.5rem] border-4 border-amber-500/30 p-1 relative z-10 bg-slate-900 shadow-2xl">
              <div className="h-full w-full rounded-[2rem] overflow-hidden flex items-center justify-center bg-indigo-600 font-black text-3xl">
                {topStudent?.avatar ? (
                  <img src={topStudent.avatar} className="h-full w-full object-cover" alt="Gaïndé" />
                ) : (
                  (topStudent?.firstName || 'A')[0].toUpperCase()
                )}
              </div>
              {/* Badge Lion */}
              <div className="absolute -bottom-2 -right-2 h-10 w-10 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg border-4 border-[#1e293b] text-slate-900 animate-bounce">
                <span className="text-lg">🦁</span>
              </div>
            </div>
          </div>

          {/* Infos de l'élève à l'honneur */}
          <div className="flex-1 relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-amber-400">Gaïndé de la semaine</p>
              <div className="h-px flex-1 bg-amber-500/20"></div>
            </div>
            
            <h3 className="text-2xl font-black uppercase leading-tight">
              {topStudent?.firstName || 'Avenir'} <br/> 
              <span className="text-amber-500">{topStudent?.name || 'Proche'}</span>
            </h3>
            
            <div className="flex items-center gap-3 mt-4">
              <div className="px-3 py-1 bg-white/10 rounded-full border border-white/5 flex items-center gap-2">
                <Users size={12} className="text-indigo-400" />
                <span className="text-[8px] font-black uppercase tracking-widest">{topStudentClass?.name || 'Excellence'}</span>
              </div>
              <div className="px-3 py-1 bg-amber-500/20 rounded-full border border-amber-500/20 flex items-center gap-2">
                <Award size={12} className="text-amber-500" />
                <span className="text-[8px] font-black uppercase tracking-widest">Major</span>
              </div>
            </div>
          </div>
        </div>

       

        {/* Défi Hebdomadaire */}
        <div className="col-span-2">
          <WeeklyChallenge 
            student={currentStudent || topStudent || {} as Student} 
            onUpdateStudent={onUpdateStudent}
          />
        </div>
      </div>

      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h4 className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-2"><Flame size={16} className="text-orange-500" /> Fil d'Activité</h4>
          <button onClick={onGenerateAi} disabled={isAiLoading} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase flex items-center gap-2 shadow-lg disabled:opacity-50">
            {isAiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} IA Assistant
          </button>
        </div>

        {aiSummary && <div className="glass rounded-3xl p-6 bg-indigo-500/5 border-indigo-500/20 text-xs italic text-slate-600 dark:text-slate-300">"{aiSummary}"</div>}
        <div className="grid grid-cols-1 gap-6">
          {events.length > 0 ? events.map(ev => {
            const LabelConfig = EVENT_TYPE_LABELS[ev.type] || EVENT_TYPE_LABELS['PROVISEUR'];
            return (
              <div key={ev.id} className={`glass p-8 rounded-[3rem] space-y-4 shadow-xl border border-white/5 hover:scale-[1.01] transition-all ${ev.isUrgent ? 'border-rose-500/30 ring-1 ring-rose-500/10' : ''}`}>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-white ${LabelConfig.color}`}>
                      <LabelConfig.icon size={20} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase text-slate-900 dark:text-white leading-none">{LabelConfig.label}</p>
                      <span className="text-[7px] font-bold text-slate-500 uppercase tracking-tighter">{new Date(ev.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {ev.isUrgent && <span className="px-3 py-1 bg-rose-600 text-white rounded-full text-[6px] font-black uppercase animate-pulse">Urgent</span>}
                </div>
                <h3 className="text-lg font-black uppercase italic text-slate-900 dark:text-white leading-tight">{ev.title}</h3>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{ev.description}</p>
                
                <div className="flex items-center gap-6 pt-4 border-t border-white/5 mt-auto">
                  <button 
                    onClick={() => onLikeEvent(ev.id, ev.likes || 0)}
                    className="flex items-center gap-2 group/like transition-all active:scale-90"
                  >
                    <Heart size={16} className={`transition-all ${ev.likes && ev.likes > 0 ? 'text-rose-500 fill-rose-500' : 'text-slate-500 group-hover/like:text-rose-500'}`} />
                    <span className="text-[10px] font-black text-slate-500 group-hover/like:text-white">{ev.likes || 0}</span>
                  </button>
                  <button 
                    onClick={() => onOpenComments(ev)}
                    className="flex items-center gap-2 group/comment transition-all active:scale-90"
                  >
                    <MessageSquare size={16} className="text-slate-500 group-hover/comment:text-indigo-400 group-hover/comment:fill-indigo-400/20 transition-all" />
                    <span className="text-[10px] font-black text-slate-500 group-hover/comment:text-white">{ev.comments?.length || 0}</span>
                  </button>
                </div>
              </div>
            );
          }) : (
            <div className="py-12 text-center opacity-30">
               <Flame size={40} className="mx-auto mb-3" />
               <p className="text-[10px] font-black uppercase">Aucune actualité récente</p>
            </div>
          )}
        </div>
      </section>

      {/* Leaderboard des Classes */}
      <ClassLeaderboard 
        students={students} 
        classes={classes} 
        userClassId={currentStudent?.classId} 
      />

      <div className="h-20" /> {/* Spacer bottom */}
    </div>
  );
};
