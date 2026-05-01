
import { AbsenceMotif } from './types';

export const ADMIN_KEY = "LTP_FATICK_2026";

// Filières regroupant l'enseignement professionnel et les séries techniques
export const INITIAL_FIELDS = [
  // Enseignement Professionnel (EP)
  "Mécanique Automobile", 
  "Froid et Climatisation", 
  "Structure Métallique", 
  "Électricité", 
  "Génie Civil", 
  "Secrétariat Bureautique", 
  "Comptabilité",
  // Enseignement Technique (Séries)
  "STEG  ", 
  "STEG A ", 
  "STEG B ", 
  "STIDD  ", 
  "STIDD M ", 
  "STIDD E "
];

// Matières indispensables pour un LTP
export const INITIAL_SUBJECTS_LIST = [
  "Français",
  "Mathématiques",
  "Anglais",
  "Physique-Chimie",
  "Dessin Technique",
  "Informatique (TIC)",
  "Économie & Gestion",
  "Éducation Physique et Sportive (EPS)",
  "Technologie de Spécialité",
  " Travaux Pratiques",
  "Hygiène, Sécurité et Environnement (HSE)",
  "Construction et Études Techniques",
  "Philosophie"
];

// Niveaux adaptés aux deux types d'enseignement
export const INITIAL_LEVELS = [
  "2nde", "1ère", "Terminale", // Technique
  "1ère Année", "2ème Année", "3ème Année" // Professionnel (BEP/BT/BTS)
];

// Diplômes officiels
export const INITIAL_DIPLOMAS = [
  "Bac Technique", 
  "BEP (Brevet d'Études Pro)", 
  "BT (Brevet de Technicien)", 
  "BTS (Brevet de Technicien Supérieur)"
];

export const AVAILABLE_BADGES = [
  { id: 'rigueur', label: 'Rigueur', icon: '🎯', color: 'indigo' },
  { id: 'discipline', label: 'Discipline', icon: '⚖️', color: 'emerald' },
  { id: 'assiduite', label: 'Assiduité', icon: '📅', color: 'amber' }
];

export const MOTIFS_OPTIONS: { label: string; value: AbsenceMotif; type: 'justified' | 'unjustified' }[] = [
  { label: 'Maladie (Justifié)', value: 'Maladie', type: 'justified' },
  { label: 'Mission (Justifié)', value: 'Mission', type: 'justified' },
  { label: 'Permission (Justifié)', value: 'Permission', type: 'justified' },
  { label: 'Inconnu (Injustifié)', value: 'Inconnu', type: 'unjustified' }
];

// Défis hebdomadaires
export interface WeeklyChallengeData {
  id: string;
  title: string;
  description: string;
  reward: string;
  rewardIcon: string;
  type: 'attendance' | 'merit' | 'cleanup';
}

export const CURRENT_WEEKLY_CHALLENGE: WeeklyChallengeData = {
  id: 'ch-01-2026',
  title: "Opération Zéro Retard",
  description: "Ne cumule aucune absence injustifiée durant toute cette semaine de cours.",
  reward: "Badge Étoile d'Or",
  rewardIcon: "⭐️",
  type: 'attendance'
};
