export interface Condition {
  id: string;
  name: string;
  image?: string;
  shortDescription: string;
  tagline: string;
  overview: string;
  symptoms: string[];
  causesAndTriggers: string[];
  treatmentApproach: {
    title: string;
    description: string;
  }[];
  medicationInfo: string;
  holisticSupport: string[];
  faqs: {
    question: string;
    answer: string;
  }[];
}

export interface Service {
  id: string;
  name: string;
  shortDesc: string;
  tagline?: string;
  serviceCategory?: string;
  iconName: string;
  details: string;
  benefits: string[];
}

export interface ProviderProfile {
  name: string;
  credentials: string;
  title: string;
  role: string;
  image?: string;
  bio: string[];
  specialties: string[];
  certifications: string[];
  education: string[];
  philosophy: string;
  quote: string;
}

export interface AppointmentFormData {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  serviceType: string;
  conditionReason: string;
  visitPreference: 'telehealth' | 'in-person';
  preferredDate: string;
  preferredTime: string;
  insuranceProvider: string;
  notes: string;
}

// ============================================================================
// Client Portal & Provider Clinical Dashboard Types
// ============================================================================

export type UserRole = 'patient' | 'provider';

export interface PortalUser {
  uid: string;
  email: string;
  fullName: string;
  phone?: string;
  dateOfBirth?: string;
  role: UserRole;
  insuranceProvider?: string;
  insuranceMemberId?: string;
  insuranceGroupNumber?: string;
  preferredPharmacy?: string;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AppointmentStatus = 'requested' | 'confirmed' | 'completed' | 'cancelled';

export interface AppointmentRecord {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone?: string;
  dateOfBirth?: string;
  serviceType: string;
  conditionReason: string;
  preferredDate: string;
  preferredTime: string;
  insuranceProvider?: string;
  status: AppointmentStatus;
  telehealthUrl: string;
  preVisitScreenerCompleted: boolean;
  notes?: string;
  providerNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export type IntakeFormType =
  | 'comprehensive-psychiatric-intake'
  | 'telehealth-consent'
  | 'medical-history';

export interface IntakeRecord {
  id: string;
  patientId: string;
  patientName: string;
  formType: IntakeFormType;
  title: string;
  status: 'pending' | 'completed';
  responses?: Record<string, string>;
  assignedAt: string;
  completedAt?: string;
}

export type AssessmentType = 'PHQ-9' | 'GAD-7' | 'DAILY-MOOD';

export type ClinicalSeverity =
  | 'Minimal'
  | 'Mild'
  | 'Moderate'
  | 'Moderately Severe'
  | 'Severe'
  | 'Optimal'
  | 'Balanced'
  | 'Low';

export interface AssessmentRecord {
  id: string;
  patientId: string;
  patientName: string;
  type: AssessmentType;
  totalScore: number;
  severity: ClinicalSeverity;
  sleepHours?: number;
  energyLevel?: number;
  medicationTaken?: boolean;
  notes?: string;
  answers?: number[];
  createdAt: string;
}

export type RefillStatus = 'active' | 'refill_requested' | 'approved_sent' | 'denied';

export interface MedicationRecord {
  id: string;
  patientId: string;
  patientName: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  instructions?: string;
  pharmacy: string;
  refillsRemaining: number;
  refillStatus: RefillStatus;
  lastRefillRequestedAt?: string;
  prescribedBy: string;
  updatedAt: string;
}

export interface MessageRecord {
  id: string;
  patientId: string;
  patientName: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  subject: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export interface InvoiceRecord {
  id: string;
  patientId: string;
  patientName: string;
  description: string;
  serviceDate: string;
  amount: number;
  insuranceCoveredAmount: number;
  patientResponsibility: number;
  status: 'paid' | 'due' | 'processing';
  paidAt?: string;
  createdAt: string;
}
