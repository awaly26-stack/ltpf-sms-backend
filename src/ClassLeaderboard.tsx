
import React, { useMemo } from 'react';
import { Trophy, Medal, TrendingUp, TrendingDown, Users, Award, ChevronRight } from 'lucide-react';
import { Student, SchoolClass } from './types';

interface ClassLeaderboardProps {
  students: Student[];
  classes: SchoolClass[];
  userClassId?: string;
}

interface ClassPerformance {
  classId: string;
  className: string;
  score: number;
  avgAbsences: number;
  studentCount: number;
  rank: number;
  trend: 'up' | 'down' | 'stable';
}

export const ClassLeaderboard: React.FC<ClassLeaderboardProps> = ({ students, classes, userClassId }) => {
  const leaderboardData = useMemo(() => {
    const data: ClassPerformance[] = classes.map(cls => {
      const classStudents = students.filter(s => s.classId === cls.id);
      const studentCount = classStudents.length;
      
      if (studentCount === 0) {
        return {
          classId: cls.id,
          className: cls.name,
          score: 0,
          avgAbsences: 0,
          studentCount: 0,
          rank: 0,
          trend: 'stable' as const
        };
      }

      const totalAbsences = classStudents.reduce((sum, s) => sum + (s.unjustifiedAbsences || 0), 0);
      const avgAbsences = totalAbsences / studentCount;
      
      // Score de discipline : 100% de base, -5% par heure d'absence moyenne
      const score = Math.max(0, Math.min(100, 100 - (avgAbsences * 5)));
      
      // Simulation de tendance basée sur l'ID pour le visuel
      const trendValue = cls.id.charCodeAt(0) % 3;
      const trend = trendValue === 0 ? 'up' : trendValue === 1 ? 'down' : 'stable' as const;

      return {
        classId: cls.id,
        className: cls.name,
        score,
        avgAbsences,
        studentCount,
        rank: 0,
        trend
      };
    });

    // Tri par score décroissant
    return data
      .filter(d => d.studentCount > 0)
      .sort((a, b) => b.score - a.score)
      .map((item, index) => ({ ...item, rank: index + 1 }));
  }, [students, classes]);

  const topThree = leaderboardData.slice(0, 3);
  const others = leaderboardData.slice(3);
  const isUserOnPodium = topThree.some(t => t.classId === userClassId);

  if (leaderboardData.length === 0) return null;

  return (
    <div className="space-y-8 animate-in slide-up duration-700">
      <div className="flex items-center justify-between px-2">
        <h4 className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.3em] flex items-center gap-2">
          <Trophy size={16} /> Leaderboard des Classes
        </h4>
        <span className="text-[8px] font-bold text-slate-500 uppercase">Discipline & Assiduité</span>
      </div>

      {/* Podium Visuel */}
      <div className="grid grid-cols-3 gap-2 items-end px-2 pt-4">
        {/* 2nd Place */}
        {topThree[1] && (
          <div className="flex flex-col items-center space-y-3 group">
            <div className="relative">
              <div className="h-16 w-16 glass rounded-2xl flex items-center justify-center border-slate-400/30 group-hover:scale-105 transition-transform">
                <Medal size={28} className="text-slate-400" />
              </div>
              <div className="absolute -top-2 -right-2 h-6 w-6 bg-slate-400 text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-lg">2</div>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black uppercase text-white truncate w-24">{topThree[1].className}</p>
              <p className="text-[8px] font-bold text-emerald-500">{topThree[1].score.toFixed(1)}%</p>
            </div>
            <div className="w-full h-16 glass rounded-t-2xl border-b-0 bg-slate-400/10"></div>
          </div>
        )}

        {/* 1st Place */}
        {topThree[0] && (
          <div className="flex flex-col items-center space-y-3 group z-10 scale-110">
            <div className="relative">
              <div className="h-20 w-20 glass rounded-3xl flex items-center justify-center border-indigo-500/40 bg-indigo-500/10 shadow-2xl shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <Trophy size={36} className="text-indigo-500 animate-bounce" />
              </div>
              <div className="absolute -top-2 -right-2 h-8 w-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-black shadow-xl ring-4 ring-[#1e293b]">1</div>
            </div>
            <div className="text-center">
              <p className="text-xs font-black uppercase text-white truncate w-28">{topThree[0].className}</p>
              <p className="text-[9px] font-black text-indigo-400">{topThree[0].score.toFixed(1)}%</p>
            </div>
            <div className="w-full h-24 glass rounded-t-3xl border-b-0 bg-indigo-500/20"></div>
          </div>
        )}

        {/* 3rd Place */}
        {topThree[2] && (
          <div className="flex flex-col items-center space-y-3 group">
            <div className="relative">
              <div className="h-16 w-16 glass rounded-2xl flex items-center justify-center border-amber-700/30 group-hover:scale-105 transition-transform">
                <Medal size={28} className="text-amber-700" />
              </div>
              <div className="absolute -top-2 -right-2 h-6 w-6 bg-amber-700 text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-lg">3</div>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black uppercase text-white truncate w-24">{topThree[2].className}</p>
              <p className="text-[8px] font-bold text-emerald-500">{topThree[2].score.toFixed(1)}%</p>
            </div>
            <div className="w-full h-12 glass rounded-t-2xl border-b-0 bg-amber-700/10"></div>
          </div>
        )}
      </div>

      {/* Message Spécial Podium */}
      {isUserOnPodium && (
        <div className="mx-2 glass p-4 rounded-2xl bg-indigo-600/10 border-indigo-500/30 flex items-center gap-4 animate-pulse">
          <Award className="text-indigo-500" size={24} />
          <p className="text-[10px] font-black uppercase text-white tracking-tight">Félicitations ! Votre classe est sur le podium ! 🏆</p>
        </div>
      )}

      {/* Liste Complète */}
      <div className="glass rounded-[3rem] p-6 border border-white/5 space-y-2">
        {leaderboardData.slice(0, 10).map((cls) => (
          <div key={cls.classId} className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${cls.classId === userClassId ? 'bg-indigo-600/20 border border-indigo-500/30' : 'hover:bg-white/5'}`}>
            <span className="w-6 text-[10px] font-black text-slate-500 text-center">{cls.rank}</span>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1.5">
                <p className="text-[11px] font-black uppercase text-white flex items-center gap-2">
                  {cls.className}
                  {cls.trend === 'up' && <TrendingUp size={12} className="text-emerald-500" />}
                  {cls.trend === 'down' && <TrendingDown size={12} className="text-rose-500" />}
                </p>
                <p className="text-[10px] font-black text-indigo-400">{cls.score.toFixed(0)}%</p>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${cls.score > 80 ? 'bg-emerald-500' : cls.score > 50 ? 'bg-indigo-500' : 'bg-rose-500'}`}
                  style={{ width: `${cls.score}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default ClassLeaderboard;