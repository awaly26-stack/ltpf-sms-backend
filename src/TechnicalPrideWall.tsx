import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Wrench, Smartphone, Cpu, 
  Lightbulb, Heart, ChevronRight, ChevronLeft,
  Users, Calendar, Rocket, Sparkles
} from 'lucide-react';
import { TechnicalProject, SchoolClass } from './types';
import { db } from './firebaseConfig';
import { collection, onSnapshot, query, orderBy, limit, doc, updateDoc, increment } from 'firebase/firestore';

interface TechnicalPrideWallProps {
  classes: SchoolClass[];
}

export const TechnicalPrideWall: React.FC<TechnicalPrideWallProps> = ({ classes }) => {
  const [projects, setProjects] = useState<TechnicalProject[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const q = query(
      collection(db, 'technicalProjects'),
      orderBy('date', 'desc'),
      limit(10)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as TechnicalProject));
      setProjects(projectsData);
    });

    return () => unsub();
  }, []);

  const handleVote = async (projectId: string) => {
    const projectRef = doc(db, 'technicalProjects', projectId);
    await updateDoc(projectRef, {
      votes: increment(1)
    });
  };

  const nextProject = () => {
    setCurrentIndex((prev) => (prev + 1) % projects.length);
  };

  const prevProject = () => {
    setCurrentIndex((prev) => (prev - 1 + projects.length) % projects.length);
  };

  if (projects.length === 0) {
    return (
      <section className="glass rounded-[3.5rem] p-12 bg-gradient-to-br from-slate-900 to-black border border-white/5 relative overflow-hidden">
        <div className="flex flex-col items-center text-center space-y-6">
           <div className="h-20 w-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
              <Cpu size={40} className="animate-pulse" />
           </div>
           <div>
              <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Mur de Fierté Technique</h2>
              <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-2 max-w-sm">Les chefs-d'œuvre de nos élèves arrivent bientôt. Préparez vos projets !</p>
           </div>
        </div>
      </section>
    );
  }

  const currentProject = projects[currentIndex];
  const projectClass = classes.find(c => c.id === currentProject.classId);

  return (
    <section className="glass rounded-[3.5rem] p-1 shadow-2xl border border-white/5 overflow-hidden">
      <div className="bg-gradient-to-br from-indigo-950 via-slate-950 to-black rounded-[3.3rem] p-8 md:p-12 relative">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Trophy size={180} />
        </div>

        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
             <div className="h-12 w-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-500/20">
                <Rocket size={24} />
             </div>
             <div>
                <h2 className="text-xl font-black text-white uppercase italic tracking-tight">Fierté <span className="text-amber-500">Technique</span></h2>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">Excellence Métier LTP Fatick</p>
             </div>
          </div>

          <div className="flex gap-2">
             <button onClick={prevProject} className="h-10 w-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-all"><ChevronLeft size={20} /></button>
             <button onClick={nextProject} className="h-10 w-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-all"><ChevronRight size={20} /></button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
           <AnimatePresence mode="wait">
             <motion.div 
               key={currentProject.id}
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: 20 }}
               className="space-y-8"
             >
                <div>
                   <div className="flex items-center gap-3 mb-4">
                      <span className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[8px] font-black uppercase tracking-widest border border-amber-500/20">Projet à l'Honneur</span>
                      <span className="text-slate-500 text-[10px] font-bold uppercase">{projectClass?.name || 'Technique'}</span>
                   </div>
                   <h3 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter leading-none mb-6">{currentProject.title}</h3>
                   <p className="text-lg text-slate-400 font-medium leading-relaxed max-w-xl italic">"{currentProject.description}"</p>
                </div>

                <div className="flex flex-wrap gap-4">
                   {currentProject.studentNames.map((name, i) => (
                     <div key={i} className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-2xl border border-white/5">
                        <div className="h-6 w-6 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-black text-white">{name[0]}</div>
                        <span className="text-[10px] font-black text-slate-300 uppercase">{name}</span>
                     </div>
                   ))}
                </div>

                <div className="flex items-center gap-8 pt-4">
                   <button 
                     onClick={() => handleVote(currentProject.id)}
                     className="flex items-center gap-3 group transition-all active:scale-95 bg-white/5 hover:bg-rose-500/10 px-6 py-4 rounded-3xl border border-white/10"
                   >
                     <Heart size={20} className="text-slate-500 group-hover:text-rose-500 transition-all fill-none group-hover:fill-rose-500" />
                     <div className="text-left">
                        <p className="text-[9px] font-black text-slate-500 uppercase leading-none mb-1">Encourager</p>
                        <p className="text-xl font-black text-white leading-none">{currentProject.votes}</p>
                     </div>
                   </button>

                   <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase mb-1 flex items-center gap-2"><Calendar size={12} /> Présenté le</p>
                      <p className="text-sm font-black text-white uppercase italic">{new Date(currentProject.date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p>
                   </div>
                </div>
             </motion.div>
           </AnimatePresence>

           <AnimatePresence mode="wait">
             <motion.div 
               key={currentProject.id + "_img"}
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 1.05 }}
               className="relative aspect-square md:aspect-video rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl group"
             >
                {currentProject.imageUrl ? (
                   <img src={currentProject.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={currentProject.title} />
                ) : (
                   <div className="w-full h-full bg-slate-900 flex items-center justify-center p-12">
                      <Wrench size={100} className="text-indigo-500/20" />
                   </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-12">
                   <p className="text-xs font-bold text-white leading-relaxed max-w-xs uppercase tracking-wider">Un chef-d'œuvre conçu au sein de nos ateliers par la promotion spécialisée.</p>
                </div>
             </motion.div>
           </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
