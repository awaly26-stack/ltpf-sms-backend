
export type Role = 'ADMIN' | 'PROVISEUR' | 'DE' | 'CT' | 'SG' | 'SURVEILLANT' | 'ELEVE' | 'COMPTABLE_MATIERE' | 'PROFESSEUR' | 'INTENDANT';
export type EventType = 'PROVISEUR' | 'GOUVERNEMENT' | 'CLUB_ENV' | 'CLUB_SCI' | 'DE_CT' | 'SURVEILLANT_GEN' | 'Atelier' | 'Examen' | 'MEDIA_NEWS';
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

export type InventoryCategory = 'FOURNITURES' | 'INFORMATIQUE' | 'MOBILIER' | 'ENTRETIEN' | 'SPORT' | 'CONSOMMABLES' | 'AUTRES';
export type InventoryStatus = 'ENTREE' | 'ATTENTE' | 'SERVICE' | 'SORTIE';

export interface InventoryItem {
  id: string;
  ref: string;
  designation: string;
  category: InventoryCategory;
  quantity: number;
  initialQuantity: number;
  entryDate: any;
  status: InventoryStatus;
  location: string;
  responsible: string;
  observations: string;
  updatedAt: any;
  createdBy: string;
}

export interface InventoryMovement {
  id: string;
  itemId: string;
  type: 'IN' | 'OUT' | 'STATUS_CHANGE';
  quantityChange: number;
  previousStatus: InventoryStatus;
  newStatus: InventoryStatus;
  userId: string;
  userName: string;
  timestamp: any;
  reason: string;
}

export interface Teacher {
  id: string;
  firstName: string;
  name: string;
  phone?: string;
  matricule?: string;
  role: Role;
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

export interface PrivateMail {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: Role;
  recipientId: string;
  subject: string;
  content: string;
  date: string;
  read: boolean;
  attachments?: { name: string; url: string; type: MediaType }[];
}

export type PaymentType = 'INSCRIPTION' | 'SCOLARITE' | 'EXAMEN' | 'AUTRE';
export type PaymentStatus = 'COMPLETE' | 'PARTIEL' | 'ATTENTE' | 'ANNULE';

export interface Payment {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  amount: number;
  totalDue: number;
  type: PaymentType;
  status: PaymentStatus;
  date: string;
  reference: string;
  receivedBy: string;
  receivedByName: string;
  receiptUrl?: string;
}

export type CertificateType = 'SCOLARITE' | 'REUSSITE' | 'BONNE_CONDUITE' | 'ASSIDUITE';

export interface IssuedCertificate {
  id: string;
  studentId: string;
  studentName: string;
  type: CertificateType;
  issueDate: string;
  expiryDate?: string;
  issuerId: string;
  issuerName: string;
  issuerRole: Role;
  uniqueCode: string; // For QR verification
  status: 'VALIDE' | 'EXPIRE' | 'REVOQUE';
}

export interface Company {
  id: string;
  name: string;
  sector: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  description?: string;
  isPartner: boolean;
}

export interface Internship {
  id: string;
  studentId: string;
  studentName?: string;
  classId?: string;
  companyId?: string;
  companyName: string;
  startDate: string;
  endDate: string;
  status: 'PROPOSÉ' | 'CONVENTIONNÉ' | 'EN_COURS' | 'TERMINÉ' | 'ANNULÉ' | 'A venir' | 'En cours' | 'Terminé';
  tutorName: string;
  tutorPhone?: string;
  logbookUrl?: string;
  finalReportUrl?: string;
  grade?: number;
  comments?: string;
  adminKey: string;
}

export interface AlumniRecord {
  id: string;
  studentId: string;
  studentName: string;
  graduationYear: number;
  lastKnownStatus: 'ÉTUDES_SUP' | 'SALARIE' | 'ENTREPRENEUR' | 'RECHERCHE_EMPLOI';
  currentCompany?: string;
  currentField?: string;
  email: string;
  linkedinUrl?: string;
}

export interface LessonLog {
  id: string;
  teacherId: string;
  teacherName: string;
  classId: string;
  subjectId: string;
  subjectName: string;
  date: string;
  duration: number; // in minutes
  topic: string;
  content: string;
  homework?: string;
  materialsUsed?: string[];
}

export interface ResourceFile {
  id: string;
  title: string;
  description?: string;
  url: string;
  type: 'PDF' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  classId: string; // Linked to a specific class
  subjectId: string;
  uploadedBy: string;
  uploadDate: string;
}

export interface ExamSchedule {
  id: string;
  title: string;
  classId: string;
  subjectId: string;
  subjectName: string;
  date: string;
  startTime: string;
  endTime: string;
  room: string;
  type: 'DEVOIR' | 'COMPOSITION' | 'BLANC';
}

export interface TechnicalProject {
  id: string;
  title: string;
  description: string;
  studentNames: string[];
  classId: string;
  imageUrl?: string;
  date: string;
  votes: number;
  featured: boolean;
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

export type MediaCategory = 'RAPPORT' | 'ACTUALITE' | 'DOCUMENT_PEDAGOGIQUE' | 'ADMINISTRATION' | 'PROJECTS';
export type MediaType = 'AUDIO' | 'PDF' | 'DOC' | 'XLS' | 'IMAGE' | 'AUTRE';

export interface MediaFile {
  id: string;
  name: string;
  url: string;
  type: MediaType;
  category: MediaCategory;
  senderId: string;
  senderName: string;
  senderRole: Role;
  date: string;
  description?: string;
  adminKey: string;
}
