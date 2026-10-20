export interface Condition {
  id: string;
  name: string;
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
