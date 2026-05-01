
export type Role = 'ADMIN' | 'PROVISEUR' | 'DE' | 'CT' | 'SG' | 'SURVEILLANT' | 'ELEVE';
export type EventType = 'PROVISEUR' | 'GOUVERNEMENT' | 'CLUB_ENV' | 'CLUB_SCI' | 'DE_CT' | 'SURVEILLANT_GEN' | 'Atelier' | 'Examen';
export type AbsenceMotif = 'Maladie' | 'Mission' | 'Permission' | 'Inconnu';
export type SubjectCategory = 'GENERAL' | 'TECHNIQUE' | 'PROFESSIONNEL';
export type Trimester = 1 | 2 | 3;

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  date: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: any;
  read: boolean;
  conversationId: string;
  senderName?: string;
}

export interface Grade {
  id: string;
  subjectId: string;
  value: number;
  weight: number; 
  trimester: Trimester;
  date: string;
  title: string; 
}

export interface Incident {
  id: string;
  date: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export interface AbsenceLog {
  id: string;
  date: string; 
  classId: string;
  hours: number;
  motif: AbsenceMotif;
  adminKey: string;
  isExported?: boolean; 
}

export interface PrivateOvertimeLog {
  id: string;
  date: string;
  hours: number;
  classId: string;
  comment?: string;
}

export interface ChallengeAction {
  id: string;
  date: string;
  proof: string;
  challengeId: string;
}

export interface Student {
  id: string;
  firstName: string;
  name: string;
  matricule: string;
  classId: string;
  isPresent: boolean;
  unjustifiedAbsences: number;
  absenceLogs?: AbsenceLog[];
  badges: string[];
  incidents: Incident[];
  avatar?: string;
  parentName?: string;
  emergencyPhone?: string;
  grades: Grade[];
  adminKey: string;
  birthDate?: string;
  birthPlace?: string;
  address?: string;
  phone?: string;
  lastDiploma?: string;
  entryDate?: string;
  lastSchool?: string;
  isRedoublant?: boolean;
  sector?: 'Public' | 'Privé';
  internships?: Internship[];
  challengeActions?: ChallengeAction[];
}

export interface Teacher {
  id: string;
  firstName: string;
  name: string;
  phone?: string;
  subjectIds: string[];
  classIds: string[];
  absenceLogs: AbsenceLog[];
  privateOvertimeLogs?: PrivateOvertimeLog[];
  adminKey: string;
  isPresent?: boolean;
}

export interface SchoolClass {
  id: string;
  name: string;
  level: string;
  diploma: string;
  field: string;
  adminKey: string;
  mainTeacherId?: string;
}

export interface Subject {
  id: string;
  name: string;
  category: SubjectCategory;
  coefficient: number;
  adminKey: string;
}

export interface SchoolEvent {
  id: string;
  title: string;
  date: string;
  description: string;
  type: EventType;
  adminKey: string;
  isUrgent?: boolean;
  targetClassId?: string;
  expiresAt?: string;
  comments?: Comment[];
  views?: number;
  likes?: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  status: 'opérationnel' | 'en panne' | 'en maintenance';
  quantity: number;
  threshold?: number;
  location?: string;
  lastMaintenance?: string;
  adminKey: string;
}

export interface Internship {
  id: string;
  studentId: string;
  companyName: string;
  tutorName: string;
  startDate: string;
  endDate: string;
  status: 'A venir' | 'En cours' | 'Terminé';
  adminKey: string;
}

export interface User {
  id: string;
  name: string;
  role: Role;
  classId?: string;
  assignedClassIds?: string[];
  firebaseUid?: string;
  matricule?: string;
}
