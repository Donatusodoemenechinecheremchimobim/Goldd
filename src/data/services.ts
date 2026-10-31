import { Service } from '../types';

export const servicesData: Service[] = [
  {
    id: 'psychiatric-evaluations',
    name: 'Comprehensive Psychiatric Evaluations',
    shortDesc: 'In-depth diagnostic interviews exploring biological, psychological, and medical factors.',
    serviceCategory: 'Initial Diagnostic Consultation',
    iconName: 'ClipboardCheck',
    details: 'A thorough diagnostic intake where Brenda Hobyani, PMHNP-BC explores your medical history, current symptoms, sleep patterns, family history, and personal goals. We rule out underlying physical contributors and establish a clear, accurate diagnosis.',
    benefits: [
      'Detailed DSM-5 diagnostic assessment with validated clinical rating scales',
      'Evaluation of medical lab work (thyroid, vitamins, inflammatory markers)',
      'Clear, collaborative discussion of diagnosis and options with zero rush',
      'Personalized treatment roadmap tailored to your timeline and preferences'
    ]
  },
  {
    id: 'medication-management',
    name: 'Medication Management & Optimization',
    shortDesc: 'Thoughtful, conservative psychopharmacology focused on symptom relief with minimal side effects.',
    serviceCategory: 'Ongoing Pharmacotherapy',
    iconName: 'Pill',
    details: 'Ongoing follow-up visits to monitor your therapeutic response, optimize dosing, evaluate tolerability, and fine-tune your regimen. We believe in prescribing with precision and avoiding unnecessary polypharmacy.',
    benefits: [
      'Careful titration of psychiatric and habit-forming medications with close monitoring',
      'Close monitoring of emotional vitality, sleep, appetite, and energy',
      'E-prescribing sent instantly to your preferred local or mail-order pharmacy',
      'GeneSight pharmacogenomic testing integration when appropriate'
    ]
  },
  {
    id: 'telepsychiatry',
    name: 'Telepsychiatry & Virtual Visits (Adults, Teens & Children)',
    shortDesc: '100% virtual psychiatric care for everyone—adults, teens, and children—from the comfort of home (no in-person visits at this time).',
    serviceCategory: '100% Virtual Care • All Ages',
    iconName: 'Video',
    details: 'Golden Mind Psychiatry PLLC currently offers 100% telehealth care only (no in-person visits for now). Telehealth is for everyone—adults, teens, and children alike. Receive comprehensive psychiatric evaluations and medication management via our encrypted HIPAA-compliant video portal without traveling, traffic, or waiting rooms.',
    benefits: [
      'For everyone: serving Adults (18+), Teens (13–17), and Children (6–12) across Texas',
      '100% telehealth-only practice—all evaluations and follow-ups conducted virtually',
      '100% confidential and secure HIPAA-compliant video technology',
      'Seamless digital intake and direct electronic prescriptions to your pharmacy'
    ]
  },
  {
    id: 'holistic-integrative',
    name: 'Integrative & Lifestyle Psychiatry',
    shortDesc: 'Mind-body interventions addressing sleep architecture, functional nutrition, and nervous system regulation.',
    serviceCategory: 'Whole-Person Protocol',
    iconName: 'HeartHandshake',
    details: 'Personalized lifestyle prescriptions that work synergistically with medical treatment. We address gut-brain health, circadian light entrainment, targeted nutraceuticals, and stress reduction.',
    benefits: [
      'Guidance on clinical-grade psychiatric supplements (Omega-3s, L-Methylfolate, Magnesium)',
      'Circadian rhythm stabilization protocols for deeper, restorative sleep',
      'Vagal nerve regulation and somatic breathwork coaching',
      'Nutritional psychiatry guidance for metabolic and neurotransmitter health'
    ]
  },
  {
    id: 'womens-mental-health',
    name: 'Women’s Perinatal & Reproductive Psychiatry',
    tagline: 'Specialized psychiatric care honoring womanhood transitions.',
    shortDesc: 'Gentle, informed care for PMDD, pregnancy, postpartum mood shifts, and perimenopause.',
    serviceCategory: 'Maternal & Hormonal Support',
    iconName: 'HeartHandshake',
    details: 'Dedicated psychiatric care navigating hormonal transitions, pregnancy planning, postpartum recovery, and PMDD. We offer safe, scientifically grounded medication guidance during reproductive years.',
    benefits: [
      'Preconception psychiatric medication planning and safety reviews',
      'Postpartum depression, anxiety, and intrusive thought treatment',
      'Luteal-phase intermittent dosing protocols for PMDD',
      'Compassionate, destigmatized maternal mental health support'
    ]
  },
  {
    id: 'child-adolescent-care',
    name: 'Child & Adolescent Psychiatric Care',
    shortDesc: 'Conservative, family-centered behavioral health evaluations for youth ages 6 to 18.',
    serviceCategory: 'Youth & Family Care',
    iconName: 'Smile',
    details: 'Supporting children, pre-teens, and teens through emotional dysregulation, ADHD, academic distress, and anxiety. We work hand-in-hand with parents to foster resilience and confidence.',
    benefits: [
      'Developmentally sensitive evaluations balancing youth and parent input',
      'Conservative, low-dose medication strategies only when strictly necessary',
      'Coordination with pediatricians and school accommodation teams (504/IEP)',
      'Practical parental co-regulation guidance'
    ]
  },
  {
    id: 'substance-abuse-addiction',
    name: 'Substance Abuse and Addiction',
    shortDesc: 'Compassionate, non-judgmental psychiatric care and dual-diagnosis support for substance use recovery.',
    serviceCategory: 'Addiction & Recovery Care',
    iconName: 'Shield',
    details: 'Comprehensive outpatient psychiatric evaluations and personalized clinical treatment for individuals navigating substance abuse, alcohol use, and co-occurring mental health conditions. We address both the neurobiological drivers of addiction and underlying mood, trauma, or anxiety disorders in a dignified, confidential telehealth setting.',
    benefits: [
      'Dual-diagnosis evaluation addressing co-occurring depression, anxiety, PTSD, or bipolar disorder',
      'Targeted pharmacotherapy—including habit-forming medications when clinically indicated—to help reduce cravings and support relapse prevention',
      'Stigma-free, confidential 100% telehealth follow-ups across Texas',
      'Integrated recovery planning supporting long-term emotional and neurological stability'
    ]
  },
  {
    id: 'neurodevelopmental-disorders',
    name: 'Neurodevelopmental Disorders (ASD & Intellectual Developmental Disorder)',
    shortDesc: 'Specialized psychiatric evaluations and supportive care for Autism Spectrum Disorders (ASD) and Intellectual Developmental Disorder.',
    serviceCategory: 'Neurodevelopmental Care',
    iconName: 'Brain',
    details: 'Individualized, neurodiversity-affirming psychiatric evaluations and symptom management for Neurodevelopmental Disorders such as Autism Spectrum Disorders (ASD) and Intellectual Developmental Disorder. We partner closely with patients, families, and caregivers to support emotional regulation, sensory distress, sleep, and co-occurring psychiatric symptoms.',
    benefits: [
      'Comprehensive evaluation for Autism Spectrum Disorders (ASD) and Intellectual Developmental Disorder',
      'Targeted, conservative medication management for irritability, anxiety, sleep challenges, and focus',
      'Collaborative care planning with families, caregivers, and educational or support teams',
      'Compassionate telehealth appointments from the familiar comfort of home'
    ]
  },
  {
    id: 'pharmacogenomic-testing',
    name: 'Pharmacogenomic Testing',
    shortDesc: 'DNA-guided genetic analysis to personalize psychiatric medication selection and reduce trial and error.',
    serviceCategory: 'Precision DNA Testing',
    iconName: 'Dna',
    details: 'Pharmacogenomic testing analyzes a patient’s DNA to identify genetic variations that may influence responses to psychiatric medications used to treat depression, anxiety, ADHD, bipolar disorder, schizophrenia, epilepsy, and other neurological conditions.\n\nBy identifying how the body may metabolize certain medications, testing can help guide personalized treatment decisions, support medication selection, and reduce trial and error to promote safer, more effective care.',
    benefits: [
      'Analyzes DNA genetic variations influencing responses to psychiatric and neurological medications',
      'Supports personalized treatment for depression, anxiety, ADHD, bipolar disorder, schizophrenia, and epilepsy',
      'Identifies how your body metabolizes specific medications to minimize side effects',
      'Reduces medication trial and error to promote safer, more effective care'
    ]
  }
];
