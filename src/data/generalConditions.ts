export interface SubCondition {
  id: string;
  name: string;
  shortDesc: string;
  targetConditionId: string;
}

export interface GeneralConditionCategory {
  id: string;
  name: string;
  image?: string;
  tagline: string;
  overview: string;
  mainConditionId: string;
  subConditions: SubCondition[];
}

export const generalConditionsList: GeneralConditionCategory[] = [
  {
    id: 'depression-spectrum',
    name: 'Depression & Mood Disorders',
    tagline: 'Gentle, personalized psychopharmacology to lift emotional heaviness and restore vitality.',
    overview: 'Clinical depression is not a personal shortcoming. It is a biological, emotional, and neurochemical state affecting mood, energy, and executive function. We provide personalized care tailored to the specific depressive subtype.',
    mainConditionId: 'depression',
    subConditions: [
      {
        id: 'mdd',
        name: 'Major Depressive Disorder (MDD)',
        shortDesc: 'Persistent low mood, profound fatigue, emotional numbness, and loss of pleasure in daily life.',
        targetConditionId: 'depression',
      },
      {
        id: 'dysthymia',
        name: 'Persistent Depressive Disorder (Dysthymia)',
        shortDesc: 'Chronic, low-grade depression lasting two or more years that impacts daily baseline resilience.',
        targetConditionId: 'depression',
      },
      {
        id: 'postpartum-depression',
        name: 'Perinatal & Postpartum Depression',
        shortDesc: 'Hormonal and emotional vulnerability during pregnancy and following childbirth.',
        targetConditionId: 'depression',
      },
      {
        id: 'sad',
        name: 'Seasonal Affective Disorder (SAD)',
        shortDesc: 'Circadian and light-dependent depressive episodes that recur in late autumn and winter months.',
        targetConditionId: 'depression',
      },
      {
        id: 'trd',
        name: 'Treatment-Resistant Depression',
        shortDesc: 'Depression that has not satisfactorily responded to initial medication trials.',
        targetConditionId: 'depression',
      },
    ],
  },
  {
    id: 'anxiety-panic-spectrum',
    name: 'Anxiety, Stress & Panic Disorders',
    tagline: 'Calming the sympathetic nervous system through precision medicine and somatic resilience.',
    overview: 'Chronic anxiety is characterized by an overactive fight-or-flight response, hypervigilance, and physical tension. Our personalized clinical protocols restore calm and cognitive flexibility.',
    mainConditionId: 'anxiety-stress',
    subConditions: [
      {
        id: 'gad',
        name: 'Generalized Anxiety Disorder (GAD)',
        shortDesc: 'Persistent, excessive worry about everyday scenarios, muscle tension, and restlessness.',
        targetConditionId: 'anxiety-stress',
      },
      {
        id: 'panic-disorder',
        name: 'Panic Disorder & Panic Attacks',
        shortDesc: 'Sudden rushes of acute terror accompanied by racing heart, chest tightness, and shortness of breath.',
        targetConditionId: 'anxiety-stress',
      },
      {
        id: 'social-anxiety',
        name: 'Social Anxiety Disorder',
        shortDesc: 'Intense, paralyzing fear of judgment, scrutiny, or embarrassment in social or work settings.',
        targetConditionId: 'anxiety-stress',
      },
      {
        id: 'acute-stress',
        name: 'Acute Stress & Burnout',
        shortDesc: 'Severe physical and cognitive exhaustion driven by chronic workplace, academic, or caregiving stress.',
        targetConditionId: 'anxiety-stress',
      },
      {
        id: 'health-anxiety',
        name: 'Health & Somatosensory Anxiety',
        shortDesc: 'Persistent catastrophic interpretation of normal physiological sensations.',
        targetConditionId: 'anxiety-stress',
      },
    ],
  },
  {
    id: 'adhd-spectrum',
    name: 'ADHD & Executive Functioning',
    tagline: 'Precision testing and tailored neuro-stimulant or non-stimulant management for clear focus.',
    overview: 'Attention-Deficit / Hyperactivity Disorder reflects differences in frontal lobe dopamine and norepinephrine transmission. Proper care restores focus, organization, and emotional equilibrium.',
    mainConditionId: 'adhd',
    subConditions: [
      {
        id: 'adult-adhd',
        name: 'Adult ADHD',
        shortDesc: 'Executive paralysis, chronic procrastination, memory gaps, and difficulty completing complex tasks.',
        targetConditionId: 'adhd',
      },
      {
        id: 'inattentive-adhd',
        name: 'Inattentive Type ADHD (ADD)',
        shortDesc: 'Quiet daydreaming, internal distractibility, time blindness, and mental fatigue without physical hyperactivity.',
        targetConditionId: 'adhd',
      },
      {
        id: 'hyperactive-adhd',
        name: 'Hyperactive / Impulsive ADHD',
        shortDesc: 'Internal restlessness, rapid speech, difficulty waiting, and impulsive decision-making.',
        targetConditionId: 'adhd',
      },
      {
        id: 'combined-adhd',
        name: 'Combined Presentation ADHD',
        shortDesc: 'Both significant inattention and physical/emotional impulsivity impairing multiple domains.',
        targetConditionId: 'adhd',
      },
      {
        id: 'executive-dysfunction',
        name: 'Executive Dysfunction & Organization',
        shortDesc: 'Struggles with task prioritization, emotional regulation, and working memory management.',
        targetConditionId: 'adhd',
      },
    ],
  },
  {
    id: 'trauma-ptsd-spectrum',
    name: 'Trauma & Stressor-Related Disorders (PTSD)',
    tagline: 'Gentle, trauma-informed stabilization to soothe an overworked alarm system.',
    overview: 'Trauma leaves a lingering imprint on the amygdala, nervous system, and sleep architecture. We utilize targeted psychiatric medications to dampen hyperarousal and nightmares.',
    mainConditionId: 'trauma-ptsd',
    subConditions: [
      {
        id: 'ptsd-classic',
        name: 'Post-Traumatic Stress Disorder (PTSD)',
        shortDesc: 'Intrusive flashbacks, night terrors, avoidance behaviors, and emotional numbing following trauma.',
        targetConditionId: 'trauma-ptsd',
      },
      {
        id: 'c-ptsd',
        name: 'Complex PTSD (C-PTSD)',
        shortDesc: 'Arising from repeated or prolonged interpersonal trauma, impacting self-worth and emotional safety.',
        targetConditionId: 'trauma-ptsd',
      },
      {
        id: 'acute-trauma',
        name: 'Acute Trauma & Crisis Reaction',
        shortDesc: 'Severe emotional distress, shock, and insomnia in the immediate aftermath of a distressing event.',
        targetConditionId: 'trauma-ptsd',
      },
      {
        id: 'trauma-sleep',
        name: 'Trauma-Related Nightmares & Sleep Fragmentation',
        shortDesc: 'Prazosin and sleep stabilization protocols to extinguish adrenaline-driven nocturnal awakenings.',
        targetConditionId: 'trauma-ptsd',
      },
    ],
  },
  {
    id: 'bipolar-spectrum',
    name: 'Bipolar & Mood Spectrum Disorders',
    tagline: 'Stabilizing mood swings and safeguarding neurochemical balance for lifelong clarity.',
    overview: 'Bipolar spectrum conditions require specialized, conservative pharmacotherapy focused on mood stabilization, avoiding antidepressant-induced mania, and restoring regular circadian cycles.',
    mainConditionId: 'bipolar-disorder',
    subConditions: [
      {
        id: 'bipolar-1',
        name: 'Bipolar I Disorder',
        shortDesc: 'Episodes of severe mania with elevated energy, decreased need for sleep, followed by deep depression.',
        targetConditionId: 'bipolar-disorder',
      },
      {
        id: 'bipolar-2',
        name: 'Bipolar II Disorder',
        shortDesc: 'Episodes of hypomania paired with debilitating depressive crashes, often misdiagnosed as unipolar depression.',
        targetConditionId: 'bipolar-disorder',
      },
      {
        id: 'cyclothymia',
        name: 'Cyclothymic Disorder',
        shortDesc: 'Chronic, fluctuating mood instability with sub-threshold hypomanic and depressive periods.',
        targetConditionId: 'bipolar-disorder',
      },
      {
        id: 'mood-dysregulation',
        name: 'Emotional Dysregulation & Irritability',
        shortDesc: 'Rapid shifts in mood, emotional reactivity, and sensitivity to circadian disruptions.',
        targetConditionId: 'bipolar-disorder',
      },
    ],
  },
  {
    id: 'womens-health-spectrum',
    name: 'Women’s Mental Health & Reproductive Psychiatry',
    image: '/womens_mental_health.jpg',
    tagline: 'Specialized psychiatric support honoring hormonal transitions throughout womanhood.',
    overview: 'Hormonal fluctuations across menstrual cycles, pregnancy, postpartum, and perimenopause deeply influence neurotransmitter function. Brenda Hobyani offers gentle, safe psychiatric guidance.',
    mainConditionId: 'womens-mental-health',
    subConditions: [
      {
        id: 'pmdd',
        name: 'Premenstrual Dysphoric Disorder (PMDD)',
        shortDesc: 'Severe luteal-phase depression, panic, irritability, and despair resolving with menstruation onset.',
        targetConditionId: 'womens-mental-health',
      },
      {
        id: 'perinatal-anxiety',
        name: 'Perinatal Anxiety & Postpartum OCD',
        shortDesc: 'Intrusive catastrophic worries, hypervigilance, and insomnia during pregnancy and early parenthood.',
        targetConditionId: 'womens-mental-health',
      },
      {
        id: 'postpartum-depression-women',
        name: 'Postpartum Mood Disorders (PPD)',
        shortDesc: 'Feelings of isolation, detachment, guilt, and tearfulness in the weeks and months after birth.',
        targetConditionId: 'womens-mental-health',
      },
      {
        id: 'perimenopause',
        name: 'Perimenopausal & Menopausal Mood Shifts',
        shortDesc: 'Anxiety surges, sleep disruption, brain fog, and depressive changes linked to fluctuating estrogen levels.',
        targetConditionId: 'womens-mental-health',
      },
    ],
  },
  {
    id: 'ocd-spectrum',
    name: 'Obsessive-Compulsive & Related Disorders (OCD)',
    tagline: 'Targeted SSRI optimization and cognitive defusion to break the compulsive loop.',
    overview: 'OCD involves intrusive, distressing thoughts (obsessions) that trigger repetitive mental or behavioral rituals (compulsions). We utilize targeted pharmacotherapy to quiet intrusive thought loops.',
    mainConditionId: 'ocd',
    subConditions: [
      {
        id: 'contamination-ocd',
        name: 'Contamination & Washing OCD',
        shortDesc: 'Excessive fears of germs, illness, toxic substances, accompanied by compulsive washing or avoiding.',
        targetConditionId: 'ocd',
      },
      {
        id: 'pure-o',
        name: 'Pure O (Intrusive Harm & Taboo Thoughts)',
        shortDesc: 'Distressing mental obsessions without obvious outward physical rituals, managed with internal checking.',
        targetConditionId: 'ocd',
      },
      {
        id: 'symmetry-ordering',
        name: 'Symmetry, Ordering & Checking OCD',
        shortDesc: 'Urgent sensations that items must feel "just right," repetitive door/stove checking and counting.',
        targetConditionId: 'ocd',
      },
      {
        id: 'scrupulosity',
        name: 'Scrupulosity & Moral Obsessions',
        shortDesc: 'Compulsive fears of moral failure, religious blasphemy, or violating ethical integrity.',
        targetConditionId: 'ocd',
      },
    ],
  },
  {
    id: 'sleep-insomnia-spectrum',
    name: 'Insomnia & Sleep Architecture Disorders',
    tagline: 'Targeted medical support and circadian realignment for deep restorative rest.',
    overview: 'Sleep is the brain’s cleansing and restorative phase. Chronic insomnia fuels mood instability and cognitive decline. We address sleep onset, night awakenings, and circadian disruptions.',
    mainConditionId: 'insomnia-sleep',
    subConditions: [
      {
        id: 'sleep-onset',
        name: 'Chronic Sleep Onset Insomnia',
        shortDesc: 'Inability to fall asleep within 30 minutes due to hyper-arousal, racing thoughts, or evening dread.',
        targetConditionId: 'insomnia-sleep',
      },
      {
        id: 'sleep-maintenance',
        name: 'Middle-of-the-Night Awakening (Maintenance Insomnia)',
        shortDesc: 'Waking up at 2:00 or 3:00 AM with racing pulse and unable to return to sleep for hours.',
        targetConditionId: 'insomnia-sleep',
      },
      {
        id: 'circadian-delay',
        name: 'Circadian Rhythm Phase Delay',
        shortDesc: 'Night-owl sleep cycles conflicting with professional, academic, or social morning obligations.',
        targetConditionId: 'insomnia-sleep',
      },
      {
        id: 'anxiety-insomnia',
        name: 'Anxiety-Driven Nocturnal Hypervigilance',
        shortDesc: 'Physical panic symptoms or anticipatory dread triggered when getting into bed.',
        targetConditionId: 'insomnia-sleep',
      },
    ],
  },
  {
    id: 'child-adolescent-spectrum',
    name: 'Child & Adolescent Behavioral Health',
    image: '/child_adolescent.jpg',
    tagline: 'Family-centered, conservative psychiatric care supporting youth development and resilience.',
    overview: 'Young minds undergo rapid emotional and hormonal maturation. Brenda Hobyani partners closely with parents and schools to provide conservative, low-dose, compassionate psychiatric care.',
    mainConditionId: 'child-adolescent',
    subConditions: [
      {
        id: 'teen-anxiety',
        name: 'Adolescent Anxiety & School Avoidance',
        shortDesc: 'Debilitating social anxiety, test panic, somatic morning stomachaches, and school refusal.',
        targetConditionId: 'child-adolescent',
      },
      {
        id: 'teen-depression',
        name: 'Teen Depression & Emotional Withdrawal',
        shortDesc: 'Irritability, sudden drop in academic performance, social isolation, and low self-worth in youths.',
        targetConditionId: 'child-adolescent',
      },
      {
        id: 'pediatric-adhd',
        name: 'Childhood & School ADHD',
        shortDesc: 'Classroom distractions, homework meltdowns, disorganization, and peer communication friction.',
        targetConditionId: 'child-adolescent',
      },
      {
        id: 'family-coregulation',
        name: 'Behavioral Dysregulation & Co-Regulation',
        shortDesc: 'Intense emotional temper outbursts, oppositional friction, and sensory overload in youth.',
        targetConditionId: 'child-adolescent',
      },
    ],
  },
  {
    id: 'holistic-integrative-spectrum',
    name: 'Holistic & Integrative Psychiatry',
    tagline: 'Treating the whole person through gut-brain science, targeted micronutrients, and lifestyle balance.',
    overview: 'Mental wellness is fundamentally intertwined with metabolic health, inflammatory balance, gut microbiome signaling, and nervous system regulation. We offer personalized integrative medicine.',
    mainConditionId: 'holistic-integrative',
    subConditions: [
      {
        id: 'gut-brain',
        name: 'Gut-Brain Axis & Nutritional Psychiatry',
        shortDesc: 'Exploring microbiome balance, systemic inflammation, and dietary precursors for serotonin and dopamine.',
        targetConditionId: 'holistic-integrative',
      },
      {
        id: 'vitamin-testing',
        name: 'Micronutrient & Vitamin Deficiency Correction',
        shortDesc: 'Clinical evaluation of Vitamin D, B12, Folate, Iron, and Magnesium to correct psychiatric masqueraders.',
        targetConditionId: 'holistic-integrative',
      },
      {
        id: 'circadian-light',
        name: 'Circadian Light & Phototherapy Protocols',
        shortDesc: 'Synchronizing biological clocks and melatonin secretion through natural morning light exposure.',
        targetConditionId: 'holistic-integrative',
      },
      {
        id: 'vagal-regulation',
        name: 'Vagal Tone & Somatic Nervous System Regulation',
        shortDesc: 'Breathwork, vagal nerve pacing, and somatic methods to reset chronic fight-or-flight states.',
        targetConditionId: 'holistic-integrative',
      },
    ],
  },
];
