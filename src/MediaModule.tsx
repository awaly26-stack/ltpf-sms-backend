import React, { useState, useRef } from 'react';
import { 
  FileText, Music, Image as ImageIcon, File, 
  Upload, Trash2, Search, Filter, 
  CheckCircle2, AlertCircle, X, Download,
  FileSpreadsheet, FileCode, Paperclip, Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MediaFile, MediaType, MediaCategory, Role, User } from './types';
import { INITIAL_FIELDS } from './constants';

interface MediaModuleProps {
  onClose: () => void;
  mediaFiles: MediaFile[];
  onUpload: (fileData: Omit<MediaFile, 'id' | 'date' | 'adminKey'>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  currentUser?: User;
}

export const MediaModule: React.FC<MediaModuleProps> = ({ 
  onClose, mediaFiles, onUpload, onDelete, currentUser 
}) => {
  const [activeCategory, setActiveCategory] = useState<MediaCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState<string | null>(null);

  // Upload Form State
  const [newFile, setNewFile] = useState<{
    name: string;
    description: string;
    category: MediaCategory;
    fileContent: string | null;
    fileType: MediaType;
  }>({
    name: '',
    description: '',
    category: 'RAPPORT',
    fileContent: null,
    fileType: 'AUTRE'
  });

  const filteredFiles = mediaFiles.filter(f => 
    (activeCategory === 'ALL' || f.category === activeCategory) &&
    (f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     f.senderName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800000) { // ~800KB limit for Firestore compatibility
        setError("Le fichier est trop volumineux (max 800 Ko pour le moment)");
        return;
      }
      setError(null);
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        
        // Determine MediaType from filename/mime
        let type: MediaType = 'AUTRE';
        if (file.type.startsWith('image/')) type = 'IMAGE';
        else if (file.type.startsWith('audio/')) type = 'AUDIO';
        else if (file.type === 'application/pdf') type = 'PDF';
        else if (file.type.includes('word') || file.name.endsWith('.doc') || file.name.endsWith('.docx')) type = 'DOC';
        else if (file.type.includes('excel') || file.type.includes('spreadsheet') || file.name.endsWith('.xls') || file.name.endsWith('.xlsx')) type = 'XLS';

        setNewFile(prev => ({
          ...prev,
          name: prev.name || file.name,
          fileContent: content,
          fileType: type
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!newFile.fileContent || !currentUser) return;
    
    setIsUploading(true);
    try {
      await onUpload({
        name: newFile.name,
        url: newFile.fileContent,
        type: newFile.fileType,
        category: newFile.category,
        description: newFile.description,
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderRole: currentUser.role
      });
      setShowUploadModal(false);
      setNewFile({
        name: '',
        description: '',
        category: 'RAPPORT',
        fileContent: null,
        fileType: 'AUTRE'
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = (type: MediaType) => {
    switch (type) {
      case 'IMAGE': return <ImageIcon className="text-emerald-500" />;
      case 'AUDIO': return <Music className="text-amber-500" />;
      case 'PDF': return <FileText className="text-rose-500" />;
      case 'DOC': return <File className="text-blue-500" />;
      case 'XLS': return <FileSpreadsheet className="text-green-600" />;
      default: return <File className="text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[800] bg-slate-50 dark:bg-slate-950 flex flex-col font-sans overflow-hidden">
      {/* HEADER */}
      <div className="bg-white dark:bg-slate-900 border-b border-black/5 dark:border-white/5 px-8 py-6 shrink-0 z-10">
        <div className="flex items-center justify-between mx-auto max-w-7xl">
          <div className="flex items-center gap-6">
            <button 
              onClick={onClose} 
              className="p-3 bg-slate-100 dark:bg-white/5 rounded-2xl text-slate-500 hover:text-indigo-600 transition-all font-bold"
            >
              <X size={20} />
            </button>
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white font-display tracking-tight uppercase italic">Médiathèque & Rapports</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Centre de partage de ressources • {currentUser?.name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <button 
               onClick={() => setShowUploadModal(true)}
               className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
             >
               <Upload size={14} /> Nouveau Fichier
             </button>
          </div>
        </div>
      </div>

      {/* FILTERS & SEARCH */}
      <div className="bg-white/50 dark:bg-white/2 border-b border-black/5 dark:border-white/5 p-4 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-between">
           <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto no-scrollbar">
              {(['ALL', 'RAPPORT', 'ACTUALITE', 'DOCUMENT_PEDAGOGIQUE', 'ADMINISTRATION'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                    activeCategory === cat 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                    : 'bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {cat === 'ALL' ? 'Tout' : cat.replace('_', ' ')}
                </button>
              ))}
           </div>
           
           <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Rechercher par nom ou auteur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium outline-none focus:ring-2 ring-indigo-500/20"
              />
           </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
         <div className="max-w-7xl mx-auto">
            {filteredFiles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence>
                  {filteredFiles.map((file) => (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="glass bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-[2rem] overflow-hidden flex flex-col group hover:border-indigo-500/30 transition-all shadow-sm"
                    >
                      <div className="h-40 bg-slate-50 dark:bg-white/2 flex items-center justify-center relative group">
                        {file.type === 'IMAGE' ? (
                          <img src={file.url} alt={file.name} className="w-full h-full object-contain bg-slate-100 dark:bg-slate-900" />
                        ) : (
                          <div className="p-8 bg-white dark:bg-slate-800 rounded-3xl shadow-xl transform group-hover:scale-110 transition-transform">
                            {React.cloneElement(getFileIcon(file.type) as React.ReactElement, { size: 48 })}
                          </div>
                        )}
                        <div className="absolute top-4 right-4">
                           <span className="px-3 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-full text-[8px] font-black uppercase text-slate-600 dark:text-slate-300 shadow-sm border border-black/5 dark:border-white/5">
                             {file.type}
                           </span>
                        </div>
                      </div>
                      
                      <div className="p-6 flex-1 flex flex-col">
                        <div className="mb-4">
                           <h4 className="text-sm font-black text-slate-900 dark:text-white line-clamp-1 mb-1 lowercase">{file.name}</h4>
                           <p className="text-[10px] text-slate-400 font-bold uppercase">{file.category.replace('_', ' ')}</p>
                        </div>
                        
                        <div className="mt-auto pt-4 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                           <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-[10px] font-black text-indigo-600">
                                {file.senderName.charAt(0)}
                              </div>
                              <span className="text-[9px] font-bold text-slate-500 uppercase">{file.senderName.split(' ')[0]}</span>
                           </div>
                           
                           <div className="flex items-center gap-1">
                              <a 
                                href={file.url} 
                                download={file.name}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-white/5 rounded-lg transition-all"
                              >
                                <Download size={14} />
                              </a>
                              {(currentUser?.id === file.senderId || currentUser?.role === 'ADMIN') && (
                                <button 
                                  onClick={() => onDelete(file.id)}
                                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-white/5 rounded-lg transition-all"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                           </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-40 text-center opacity-20">
                <Paperclip size={80} className="mb-6" />
                <h3 className="text-2xl font-black font-display uppercase italic">Aucun document</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest mt-2">Commencez par importer un fichier</p>
              </div>
            )}
         </div>
      </div>

      {/* UPLOAD MODAL */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-[900] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10"
            >
              <div className="p-10">
                <div className="flex items-center justify-between mb-8">
                   <h3 className="text-xl font-black text-slate-900 dark:text-white font-display uppercase italic">Importation Fichier</h3>
                   <button onClick={() => setShowUploadModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl text-slate-400">
                     <X size={20} />
                   </button>
                </div>

                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fichier</label>
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all ${
                          newFile.fileContent 
                          ? 'border-emerald-500/50 bg-emerald-500/5' 
                          : 'border-slate-200 dark:border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/5'
                        }`}
                      >
                         <input 
                           type="file" 
                           ref={fileInputRef} 
                           onChange={handleFileChange} 
                           className="hidden" 
                           accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.mp3,.wav"
                         />
                         {newFile.fileContent ? (
                           <div className="flex flex-col items-center">
                             {newFile.fileType === 'IMAGE' ? (
                               <img src={newFile.fileContent} alt="Preview" className="h-24 w-24 object-cover rounded-xl mb-4 shadow-lg" />
                             ) : (
                               <CheckCircle2 className="text-emerald-500 mb-4" size={32} />
                             )}
                             <p className="text-xs font-bold text-slate-900 dark:text-white uppercase line-clamp-1">{newFile.name}</p>
                           </div>
                         ) : (
                           <>
                             <Upload className="text-slate-300 mb-4" size={32} />
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Cliquez pour choisir un fichier</p>
                             <p className="text-[8px] text-slate-300 uppercase mt-2 font-bold italic">PDF, Word, Excel, Images, Audio</p>
                           </>
                         )}
                      </div>
                      {error && (
                        <p className="text-[10px] text-rose-500 font-bold uppercase mt-2 text-center animate-pulse">{error}</p>
                      )}
                   </div>

                   <div className="flex gap-4">
                      <div className="flex-1 space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Catégorie</label>
                        <select 
                          value={newFile.category}
                          onChange={(e) => setNewFile(prev => ({ ...prev, category: e.target.value as MediaCategory }))}
                          className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-2xl p-4 text-xs font-bold outline-none ring-2 ring-transparent focus:ring-indigo-500/20"
                        >
                           <option value="RAPPORT">Rapport Administratif</option>
                           <option value="ACTUALITE">Actualité / Flash Info</option>
                           <option value="DOCUMENT_PEDAGOGIQUE">Document Pédagogique</option>
                           <option value="ADMINISTRATION">Administration Générale</option>
                        </select>
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Légende / Description</label>
                      <textarea 
                        value={newFile.description}
                        onChange={(e) => setNewFile(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-2xl p-4 text-xs font-bold outline-none ring-2 ring-transparent focus:ring-indigo-500/20 min-h-[100px] resize-none"
                        placeholder="Détails optionnels..."
                      />
                   </div>

                   <button 
                     disabled={!newFile.fileContent || isUploading}
                     onClick={handleSubmit}
                     className="w-full bg-indigo-600 disabled:opacity-30 text-white py-5 rounded-3xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3"
                   >
                     {isUploading ? (
                       <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                     ) : (
                       <>Importer & Partager</>
                     )}
                   </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
