import { Condition } from '../types';

export const conditionsData: Condition[] = [
  {
    id: 'adhd',
    name: 'ADHD (Attention-Deficit / Hyperactivity Disorder)',
    tagline: 'Regain focus, mental clarity, and executive functioning through precision care.',
    shortDescription: 'Comprehensive diagnostic assessments and individualized medication management for adults and adolescents managing inattention, hyperactivity, and executive dysfunction.',
    overview: 'Attention-Deficit/Hyperactivity Disorder (ADHD) is a neurodevelopmental condition affecting the brain’s executive functioning networks—the systems responsible for attention regulation, impulse control, working memory, and organization. At Golden Mind Psychiatric, Brenda Hobyani, PMHNP-BC conducts thorough clinical evaluations to distinguish ADHD from anxiety, mood disorders, or sleep disruptions, crafting targeted care plans that restore daily capability without judgment.',
    symptoms: [
      'Chronic difficulty initiating, sustaining, or organizing work or personal tasks',
      'Frequent forgetfulness, misplacing essential items, and time blindness',
      'Internal restlessness or mental overdrive even during quiet moments',
      'Impulsive decision-making, difficulty waiting turns, or interrupting conversations',
      'Executive dysfunction, chronic procrastination, and overwhelm from complex steps',
      'Hyperfocus on stimulating activities while struggling to shift focus to mundane tasks',
    ],
    causesAndTriggers: [
      'Dopamine and norepinephrine neurotransmitter dysregulation',
      'Genetic predisposition with strong familial inheritance patterns',
      'Heightened environmental stress, sleep deprivation, and cognitive overload',
      'Major life transitions (college, career advancements, parenthood) unmasking compensation mechanisms',
    ],
    treatmentApproach: [
      {
        title: 'Diagnostic Precision & Clinical History',
        description: 'Comprehensive DSM-5 clinical interviews, behavioral rating scales (ASRS), and developmental history to establish an accurate, objective diagnosis.'
      },
      {
        title: 'Personalized Medication Management',
        description: 'Carefully titrated stimulant and non-stimulant pharmacotherapy chosen to optimize focus and working memory while minimizing side effects such as appetite or sleep disruption.'
      },
      {
        title: 'Executive Functioning & Behavioral Strategies',
        description: 'Collaborative coaching on time-chunking, visual organizational frameworks, and habit design to empower your day-to-day routine.'
      }
    ],
    medicationInfo: 'Medication options include first-line stimulant medications (methylphenidate and amphetamine formulations) and proven non-stimulant alternatives (such as atomoxetine, viloxazine, guanfacine, and clonidine), individually tailored to your unique cardiovascular and neurological profile.',
    holisticSupport: [
      'Sleep hygiene optimization to support prefrontal cortex restoration',
      'Targeted nutrition, protein pacing, and micronutrient supplementation (Omega-3s, Zinc, Magnesium)',
      'Aerobic exercise protocols proven to elevate brain-derived neurotrophic factor (BDNF)',
      'Mindfulness-based cognitive strategies for emotional self-regulation'
    ],
    faqs: [
      {
        question: 'Can ADHD be diagnosed and treated in adulthood?',
        answer: 'Yes. Many adults—particularly women and high-achieving professionals—were never diagnosed in childhood because they developed coping mechanisms. When life demands increase, these mechanisms may break down. We specialize in comprehensive adult ADHD evaluations.'
      },
      {
        question: 'Will I have to stay on medication forever?',
        answer: 'Not necessarily. Medication is a valuable tool to stabilize neurological pathways. Some patients utilize medication long-term, while others use it while establishing executive functioning habits. Brenda Hobyani conducts regular follow-up reviews to assess your ongoing needs.'
      },
      {
        question: 'Can ADHD evaluations be done via Telehealth?',
        answer: 'Yes, our state-of-the-art secure HIPAA-compliant telehealth platform allows full diagnostic evaluations, rating scale reviews, and regular medication management visits from the privacy of your home.'
      }
    ]
  },
  {
    id: 'depression',
    name: 'Depression & Depressive Disorders',
    tagline: 'Gentle, compassionate pathways to lift the fog, restore energy, and rediscover hope.',
    shortDescription: 'Evidence-based psychiatric treatment for Major Depressive Disorder, Persistent Depression (Dysthymia), and Treatment-Resistant Depression.',
    overview: 'Clinical depression is not a personal failure, lack of willpower, or simple sadness. It is a biological, emotional, and neurochemical state that affects how you feel, think, and handle daily activities. Brenda Hobyani, PMHNP-BC approaches depression with deep empathy and scientific rigor, identifying biological drivers, hormonal influences, and psychological stressors to design an integrated treatment roadmap.',
    symptoms: [
      'Persistent feelings of sadness, emotional emptiness, numbness, or tearfulness',
      'Loss of interest or pleasure in once-enjoyed hobbies and social connections (anhedonia)',
      'Severe mental and physical exhaustion where even simple tasks feel insurmountable',
      'Changes in sleep architecture—insomnia, early morning awakenings, or hypersomnia',
      'Feelings of worthlessness, unwarranted guilt, or feeling like a burden to others',
      'Cognitive slowing, brain fog, and difficulty making everyday decisions',
    ],
    causesAndTriggers: [
      'Neurotransmitter imbalances involving serotonin, norepinephrine, and dopamine pathways',
      'Chronic unmanaged psychological stress and dysregulated hypothalamic-pituitary-adrenal (HPA) axis',
      'Systemic inflammation and neuroinflammation affecting neural plasticity',
      'Hormonal shifts (thyroid dysfunction, postpartum changes, perimenopause)',
    ],
    treatmentApproach: [
      {
        title: 'Thorough Medical & Psychiatric Workup',
        description: 'Exclusion of secondary medical contributors (vitamin D, B12, thyroid panels) and detailed symptom severity tracking (PHQ-9).'
      },
      {
        title: 'Modern Antidepressant Optimization',
        description: 'Targeted selection from SSRIs, SNRIs, atypicals (such as bupropion or mirtazapine), and multi-modal agents tailored to your energy levels, sleep, and metabolic profile.'
      },
      {
        title: 'Pharmacogenomic Insights (GeneSight)',
        description: 'DNA testing when appropriate to identify how your liver enzymes and brain receptors metabolize medications, avoiding months of trial-and-error.'
      }
    ],
    medicationInfo: 'We prioritize modern, well-tolerated medications with favorable side-effect profiles, avoiding unnecessary polypharmacy and closely monitoring your emotional vitality at 2- to 4-week intervals.',
    holisticSupport: [
      'Circadian rhythm stabilization with morning sunlight exposure and light therapy',
      'Anti-inflammatory nutritional protocols supporting the gut-brain axis',
      'Gradual behavioral activation and physical movement routines',
      'Collaborative alignment with your psychotherapist or counselor'
    ],
    faqs: [
      {
        question: 'How long does it take for antidepressant medication to work?',
        answer: 'Most patients begin noticing improvements in sleep, energy, and appetite within 1 to 2 weeks. Full mood elevation and cognitive clarity typically emerge between weeks 4 and 6. We maintain close communication during titration.'
      },
      {
        question: 'Will antidepressant medications change my personality?',
        answer: 'No. The goal of properly chosen psychiatric treatment is to remove the heavy emotional weight of depression so that your authentic personality, humor, and drive can shine through.'
      }
    ]
  },
  {
    id: 'anxiety-stress',
    name: 'Anxiety, Panic & Stress Disorders',
    tagline: 'Quiet the racing thoughts, calm the nervous system, and restore inner peace.',
    shortDescription: 'Personalized clinical care for Generalized Anxiety Disorder (GAD), Panic Disorder, Social Anxiety, and chronic nervous system dysregulation.',
    overview: 'Anxiety disorders occur when the body’s innate sympathetic nervous system ("fight-or-flight") response becomes chronically activated in the absence of real physical danger. Physical sensations like chest tightness, racing pulse, and shallow breathing combine with intrusive worry loops. Brenda Hobyani, PMHNP-BC utilizes evidence-based psychiatric tools to downregulate your nervous system and re-establish emotional equilibrium.',
    symptoms: [
      'Persistent, uncontrollable worry about everyday events, health, family, or work',
      'Sudden surges of intense panic accompanied by heart palpitations, sweating, and dizziness',
      'Constant muscle tension, jaw clenching, and physical restlessness',
      'Difficulty falling asleep due to an overactive, racing mind at night',
      'Social avoidance, fear of judgment, or overwhelming dread in public settings',
      'Gastrointestinal distress, nausea, and stress-induced physical exhaustion',
    ],
    causesAndTriggers: [
      'GABAergic and serotonergic pathway hyperexcitability',
      'Dysregulated autonomic nervous system with elevated cortisol levels',
      'Genetic predisposition and heightened innate neurosensory sensitivity',
      'Past relational trauma, burnout, and sensory/workplace overload',
    ],
    treatmentApproach: [
      {
        title: 'Somatic & Autonomic Stabilization',
        description: 'First addressing the physical triggers of panic and adrenaline surges through safe, non-habit-forming medications and somatic downregulation.'
      },
      {
        title: 'Maintenance Pharmacotherapy',
        description: 'Evidence-based SSRIs, SNRIs, buspirone, and targeted non-addictive adjunctive agents that build long-term neurological resilience against panic.'
      },
      {
        title: 'Cognitive & Physiological Reconditioning',
        description: 'Equipping you with diaphragmatic breathing, polyvagal techniques, and thought reframing exercises to de-escalate anxiety in real time.'
      }
    ],
    medicationInfo: 'We emphasize non-habit-forming, sustainable psychiatric medications including SSRIs, SNRIs, buspirone, beta-blockers (propranolol for somatic/performance anxiety), and hydroxyzine, avoiding dependency while achieving durable relief.',
    holisticSupport: [
      'Caffeine and stimulant tapering guidance with soothing adaptogenic alternatives',
      'Magnesium glycinate, L-theanine, and neuro-supportive botanical co-factors',
      'Vagus nerve stimulation techniques (physiological sighs, cold exposure therapy)',
      'Regular restorative sleep hygiene protocols'
    ],
    faqs: [
      {
        question: 'Do you prescribe habit-forming anxiety medications?',
        answer: 'Our practice adheres to conservative, responsible prescribing standards. We specialize in effective, non-addictive medications that treat the root neurological cause of anxiety without the tolerance, dependency, and rebound anxiety associated with benzodiazepines.'
      },
      {
        question: 'How quickly can I experience relief from panic attacks?',
        answer: 'Targeted acute non-sedating options like beta-blockers can provide physical calm within 30 to 60 minutes for specific triggers, while daily maintenance medications significantly decrease the frequency and intensity of panic within 2 to 4 weeks.'
      }
    ]
  },
  {
    id: 'trauma-ptsd',
    name: 'Trauma & PTSD (Post-Traumatic Stress Disorder)',
    tagline: 'A trauma-informed sanctuary for healing deep wounds and reclaiming safety.',
    shortDescription: 'Gentle, scientifically grounded care for acute trauma, developmental/complex PTSD, nightmares, hypervigilance, and emotional flashbacks.',
    overview: 'Trauma changes the biological wiring of the brain, causing the amygdala to perceive danger long after the traumatic event has ended. Whether arising from childhood adversity, medical trauma, sudden loss, or interpersonal violence, PTSD is a profound neurobiological injury. Brenda Hobyani, PMHNP-BC offers a deeply respectful, compassionate clinical environment where you set the pace.',
    symptoms: [
      'Intrusive memories, vivid flashbacks, or distressing recurring nightmares',
      'Persistent hypervigilance, feeling constantly on guard, and exaggerated startle responses',
      'Active avoidance of people, places, thoughts, or situations connected to the trauma',
      'Emotional detachment, feeling numb or unable to experience loving emotions',
      'Intense physiological reactions (rapid heartbeat, sweating) when triggered',
      'Profound negative beliefs about oneself ("I am damaged") or the world ("no one is safe")',
    ],
    causesAndTriggers: [
      'Single-event shock trauma (accidents, assaults, natural disasters, medical crises)',
      'Complex developmental trauma (chronic emotional neglect, prolonged domestic abuse)',
      'Prolonged nervous system overwhelm that exceeded the capacity to process at the time',
    ],
    treatmentApproach: [
      {
        title: 'Trauma-Informed Neuro-Stabilization',
        description: 'Careful pharmacological intervention to calm severe hyperarousal, reduce adrenaline spikes, and suppress traumatic nightmares.'
      },
      {
        title: 'Sleep & Nightmare Targeted Therapy',
        description: 'Targeted alpha-1 adrenergic antagonists (such as prazosin) to inhibit nocturnal norepinephrine surges and restore restorative REM sleep.'
      },
      {
        title: 'Integrative Collaborative Care',
        description: 'Close coordination with specialized EMDR, Somatic Experiencing, or trauma-focused cognitive therapists to support deep processing.'
      }
    ],
    medicationInfo: 'Evidence-based medications including FDA-approved SSRIs (sertraline, paroxetine), alpha-blockers for nightmare suppression, and mood stabilizers when indicated for emotional dysregulation.',
    holisticSupport: [
      'Somatic grounding exercises to re-anchor awareness in the present moment',
      'Safety-oriented nervous system regulation rituals',
      'Acupressure and bilateral stimulation integration',
      'Pacing boundaries to prevent emotional retraumatization'
    ],
    faqs: [
      {
        question: 'Will I have to recount every detail of my trauma during my visit?',
        answer: 'No. Trauma-informed psychiatric care does not require you to describe graphic details of traumatic experiences. We focus on evaluating your current symptoms, nervous system responses, and daily functional impacts to provide immediate medical relief.'
      },
      {
        question: 'Can trauma-related nightmares really be stopped?',
        answer: 'Yes. Modern psychiatric medicine offers specialized medications like prazosin that block excessive adrenaline in the brain during sleep, allowing patients to experience peaceful, nightmare-free rest.'
      }
    ]
  },
  {
    id: 'womens-mental-health',
    name: 'Women\'s Mental Health & Perinatal Psychiatry',
    tagline: 'Specialized psychiatric care honoring the hormonal and emotional transitions of womanhood.',
    shortDescription: 'Expert care for Pre-Menstrual Dysphoric Disorder (PMDD), pregnancy and postpartum depression/anxiety, perimenopause, and hormonal mood shifts.',
    overview: 'Women experience distinct neuroendocrine milestones that profoundly impact brain chemistry. Fluctuations in estrogen, progesterone, and neurosteroids can trigger debilitating mood and anxiety episodes during the menstrual cycle, perinatal window, and menopausal transition. Brenda Hobyani, PMHNP-BC has specialized expertise in perinatal mental health, helping women make safe, informed psychiatric decisions with confidence.',
    symptoms: [
      'Severe mood swings, irritability, and despair in the luteal phase before menstruation (PMDD)',
      'Overwhelming worry, intrusive thoughts, or weeping episodes during pregnancy or postpartum',
      'Postpartum anxiety, terrifying "what-if" thoughts, and insomnia despite extreme exhaustion',
      'Brain fog, sudden panic, and emotional volatility during perimenopausal transitions',
      'Guilt, shame, and isolation surrounding maternal mental health struggles',
    ],
    causesAndTriggers: [
      'Altered sensitivity of GABA-A receptors to allopregnanolone fluctuations',
      'Rapid estrogen and progesterone withdrawal following childbirth',
      'Sleep deprivation and high psychosocial stress during reproductive transitions',
      'Thyroid dysregulation commonly unmasked during the postpartum period',
    ],
    treatmentApproach: [
      {
        title: 'Reproductive Life Cycle Assessment',
        description: 'Tracking symptoms in direct correlation with your menstrual cycle, fertility treatments, pregnancy, or perimenopausal changes.'
      },
      {
        title: 'Perinatal Medication Safety Guidance',
        description: 'Evidence-based risk-benefit analysis evaluating infant exposure vs. untreated maternal illness, using the latest reproductive toxicology databases.'
      },
      {
        title: 'Luteal-Phase & Targeted Dosing',
        description: 'Innovative intermittent dosing strategies for PMDD that deliver fast relief with minimal medication burden.'
      }
    ],
    medicationInfo: 'Careful selection of medications with established safety profiles in pregnancy and lactation, as well as cycle-specific intermittent dosing for PMDD.',
    holisticSupport: [
      'Nutritional support for hormonal balance (Vitamin B6, Calcium, Magnesium)',
      'Postpartum partner communication and nighttime sleep protection plans',
      'Mind-body support for fertility struggles and reproductive grief',
      'Thyroid and nutritional lab monitoring'
    ],
    faqs: [
      {
        question: 'Is it safe to take psychiatric medication while pregnant or breastfeeding?',
        answer: 'Many psychiatric medications have reassuring, well-researched safety profiles in pregnancy and lactation. Untreated maternal depression or severe anxiety also carries documented risks to both mother and baby. We conduct a nuanced, individualized risk-benefit discussion.'
      },
      {
        question: 'How is PMDD different from regular PMS?',
        answer: 'PMS involves mild physical and emotional symptoms. PMDD is a recognized clinical neuroendocrine condition characterized by severe mood swings, intense anger, hopelessness, and functional impairment during the 7-10 days before your period.'
      }
    ]
  },
  {
    id: 'bipolar-disorder',
    name: 'Bipolar & Mood Spectrum Disorders',
    tagline: 'Restoring steady ground, preventing relapses, and cultivating lifelong emotional stability.',
    shortDescription: 'Accurate differentiation and long-term stabilization for Bipolar I, Bipolar II, Cyclothymia, and mixed mood states.',
    overview: 'Bipolar spectrum disorders are often misdiagnosed as simple depression or ADHD, leading to ineffective or even destabilizing treatments. Experiencing cycling episodes of debilitating lows (depression) alongside highs or irritability (mania or hypomania) requires nuanced, specialized psychiatric oversight. Brenda Hobyani, PMHNP-BC brings deep clinical diagnostic acumen to anchor your mood without dampening your creativity or joy.',
    symptoms: [
      'Periods of heightened energy, decreased need for sleep without fatigue, and racing thoughts (hypomania/mania)',
      'Pressured speech, multitasking grandiosity, or impulsive spending and risk-taking',
      'Severe subsequent depressive crashes characterized by heavy lethargy and despair',
      'Rapid irritability, agitation, and mixed emotional states',
      'Difficulty maintaining stable occupational and interpersonal consistency due to mood swings',
    ],
    causesAndTriggers: [
      'Circadian rhythm and sleep-wake cycle disruptions',
      'Dopaminergic and intracellular signal transduction dysregulation',
      'Strong polygenic biological inheritance',
      'Antidepressant-induced mood destabilization when prescribed without mood stabilizers',
    ],
    treatmentApproach: [
      {
        title: 'Differential Diagnosis & Mood Timeline',
        description: 'Detailed lifetime timeline analysis to distinguish unipolar depression from bipolar spectrum conditions.'
      },
      {
        title: 'Gold-Standard Mood Stabilization',
        description: 'Evidence-based second-generation atypical antipsychotics, lithium, and anticonvulsant mood stabilizers (such as lamotrigine) chosen to maintain stability.'
      },
      {
        title: 'Social Rhythm & Relapse Prevention',
        description: 'Collaborative development of an early-warning relapse signature plan and circadian rhythm protection protocols.'
      }
    ],
    medicationInfo: 'Precision prescribing utilizing mood stabilizers and modern atypical antipsychotics with careful metabolic monitoring (weight, lipid, and blood glucose oversight).',
    holisticSupport: [
      'Social Rhythm Therapy (strict consistency in wake times, meal times, and activity)',
      'Dark therapy and blue-light blocking for hypomanic prodromes',
      'Stress inoculation and sensory management protocols',
      'Family and support-system education'
    ],
    faqs: [
      {
        question: 'What is the difference between Bipolar I and Bipolar II?',
        answer: 'Bipolar I involves at least one full manic episode that may cause severe functional impairment. Bipolar II involves hypomanic episodes (elevated energy, productivity, or irritability) combined with severe, recurrent depressive episodes.'
      },
      {
        question: 'Can I take antidepressants if I have bipolar disorder?',
        answer: 'Antidepressants alone can trigger hypomania, mania, or rapid cycling in individuals with bipolar disorder. However, when paired with an effective mood stabilizer, certain treatments can be safely utilized under close psychiatric supervision.'
      }
    ]
  },
  {
    id: 'insomnia-sleep',
    name: 'Insomnia & Sleep-Wake Disorders',
    tagline: 'Rebuilding natural restorative sleep architecture for vibrant daytime vitality.',
    shortDescription: 'Targeted medical treatment for chronic sleep onset insomnia, sleep maintenance disruption, and circadian rhythm disorders.',
    overview: 'Quality sleep is the fundamental biological pillar of all psychiatric health. When sleep breaks down, emotional regulation, cognitive focus, memory consolidation, and immune defense rapidly deteriorate. Rather than prescribing habit-forming sedative sleeping pills that suppress restorative deep sleep, Brenda Hobyani, PMHNP-BC addresses the biological and psychological engines of chronic insomnia.',
    symptoms: [
      'Lying awake for hours unable to quiet the mind despite feeling exhausted',
      'Frequent nighttime awakenings and inability to fall back asleep',
      'Early morning awakening with an abrupt surge of anxious alertness',
      'Non-restorative sleep, waking up feeling drained and mentally foggy',
      'Daytime cognitive fatigue, irritability, and reliance on excessive caffeine',
      'Conditioned bedtime anxiety—dreading going to bed out of fear of not sleeping',
    ],
    causesAndTriggers: [
      'Hyperarousal of the central nervous system and elevated nocturnal cortisol',
      'Underlying psychiatric conditions (anxiety, depression, PTSD, ADHD)',
      'Circadian misalignment, irregular schedules, and artificial blue light exposure',
      'Restless legs, hormonal fluctuations, or secondary medication side effects',
    ],
    treatmentApproach: [
      {
        title: 'Sleep Architecture Assessment',
        description: 'Detailed review of sleep history, chronotype, sleep environment, and screening for obstructive sleep apnea.'
      },
      {
        title: 'Non-Habit-Forming Sleep Pharmacotherapy',
        description: 'Prescribing medications that preserve natural REM and slow-wave sleep without tolerance, dependency, or morning grogginess.'
      },
      {
        title: 'Cognitive Behavioral Insights for Insomnia (CBT-I)',
        description: 'Breaking the conditioned association between your bed and frustration through stimulus control and sleep pressure management.'
      }
    ],
    medicationInfo: 'We emphasize modern, restorative sleep agents such as low-dose trazodone, doxepin, mirtazapine, orexin receptor antagonists (DORAs), and melatonin receptor agonists.',
    holisticSupport: [
      'Circadian entrainment with morning lux light and evening dimming',
      'Bedroom temperature and acoustic optimization',
      'Magnesium L-threonate, glycine, and calming botanical sleep formulations',
      'Worry-journaling and autonomic down-regulation before bed'
    ],
    faqs: [
      {
        question: 'Are sleeping pills addictive?',
        answer: 'Traditional sedative-hypnotics (like zolpidem or benzodiazepines) carry risks of tolerance, dependence, and rebound insomnia. At Golden Mind Psychiatric, we deliberately prescribe non-habit-forming medications that preserve healthy sleep architecture.'
      },
      {
        question: 'How quickly can I fix my sleep schedule?',
        answer: 'With proper psychiatric sleep medication combined with circadian alignment protocols, most patients experience significant sleep stabilization within 3 to 7 days.'
      }
    ]
  },
  {
    id: 'ocd',
    name: 'Obsessive-Compulsive Disorder (OCD)',
    tagline: 'Freedom from intrusive thoughts and exhausting mental or behavioral rituals.',
    shortDescription: 'Evidence-based psychiatric pharmacotherapy and supportive strategies for OCD, intrusive thoughts, and related anxiety disorders.',
    overview: 'Obsessive-Compulsive Disorder (OCD) is characterized by distressing, unwanted, intrusive thoughts, images, or urges (obsessions) that provoke intense anxiety, leading to repetitive mental or physical actions (compulsions) performed to neutralize the distress. Brenda Hobyani, PMHNP-BC provides compassionate, shame-free psychiatric care to lower the neurological volume of intrusive thoughts.',
    symptoms: [
      'Recurrent intrusive thoughts about contamination, harm, symmetry, or taboo fears',
      'Repetitive physical rituals (checking locks, hand-washing, ordering, tapping)',
      'Exhausting mental rituals (mental reviewing, counting, seeking reassurance, repeating phrases)',
      'Severe distress when rituals are interrupted or routines cannot be performed "just right"',
      'Significant time lost each day to compulsions, causing professional or social disruption',
    ],
    causesAndTriggers: [
      'Hyperactivity in the cortico-striato-thalamo-cortical (CSTC) brain circuitry',
      'Serotonergic neurotransmitter signaling dysfunction',
      'High genetic overlap in first-degree relatives',
      'Stressful life events triggering baseline vulnerability into active flare-ups',
    ],
    treatmentApproach: [
      {
        title: 'Comprehensive Diagnostic Clarification',
        description: 'Distinguishing true OCD from generalized anxiety, health anxiety, or trauma intrusions using validated clinical rating scales (Y-BOCS).'
      },
      {
        title: 'High-Dose Serotonergic Optimization',
        description: 'OCD typically requires higher doses of selective serotonin reuptake inhibitors than depression; we carefully titrate medications to clinical efficacy while managing tolerability.'
      },
      {
        title: 'Glutamatergic & Multi-Modal Augmentation',
        description: 'When standard therapies yield partial response, utilizing evidence-backed augmenting agents (such as memantine, NAC, or low-dose second-generation agents).'
      }
    ],
    medicationInfo: 'First-line medications include high-dose SSRIs (fluvoxamine, sertraline, fluoxetine, escitalopram) and clomipramine, supplemented with targeted glutamatergic modulators when needed.',
    holisticSupport: [
      'Collaboration with ERP (Exposure and Response Prevention) behavioral therapists',
      'N-Acetylcysteine (NAC) supplementation for glutamate regulation',
      'Mindfulness-based detachment from intrusive thought content',
      'Tolerating uncertainty exercises and self-compassion practices'
    ],
    faqs: [
      {
        question: 'Why do OCD medications take longer to work than depression treatments?',
        answer: 'OCD involves deep CSTC brain circuits that require sustained serotonergic receptor down-regulation. Improvement typically begins between weeks 8 and 12 at therapeutic doses. We guide and support you closely throughout this period.'
      },
      {
        question: 'Will I be judged for taboo intrusive thoughts?',
        answer: 'Never. Intrusive thoughts in OCD are egodystonic—meaning they are the exact opposite of what you desire or value. In our clinical practice, we have heard every subtype of OCD and provide an entirely judgment-free space.'
      }
    ]
  },
  {
    id: 'child-adolescent',
    name: 'Child & Adolescent Psychiatric Care',
    tagline: 'Supportive, family-centered mental healthcare for young minds finding their way.',
    shortDescription: 'Gentle, thorough psychiatric evaluations and conservative treatment for children, pre-teens, and adolescents (ages 6–18).',
    overview: 'Young brains undergo rapid neurodevelopment, and emotional or behavioral struggles during childhood and teenage years can dramatically impact school, friendships, and family life. Brenda Hobyani, PMHNP-BC works collaboratively with parents, pediatricians, and schools, prioritizing conservative, developmentally tailored interventions that protect developing minds.',
    symptoms: [
      'Sudden drop in academic performance, school refusal, or extreme homework distress',
      'Severe emotional dysregulation, explosive anger, or frequent crying spells',
      'Intense social withdrawal, isolating from peers, and giving up beloved sports or hobbies',
      'Chronic somatic complaints (headaches, stomachaches) before school or social events',
      'Self-critical talk, expressions of hopelessness, or changes in eating and sleeping habits',
      'Attention difficulties, impulsivity, or defiance that strain the home environment',
    ],
    causesAndTriggers: [
      'Neurodevelopmental differences (ADHD, learning differences, sensory processing)',
      'Social media pressures, cyberbullying, and academic expectations',
      'Biological family history of mood or anxiety disorders',
      'Family transitions (divorce, relocation, loss) and peer relational dynamics',
    ],
    treatmentApproach: [
      {
        title: 'Dual-Perspective Evaluation',
        description: 'Listening both to the child’s personal voice and the parents’ observations, alongside school feedback, to understand the complete picture.'
      },
      {
        title: 'Conservative, Judicious Pharmacotherapy',
        description: 'Only recommending medications when symptoms cause substantial functional impairment, using low doses and careful safety monitoring.'
      },
      {
        title: 'Parental Guidance & Collaborative Strategy',
        description: 'Empowering parents with actionable emotional co-regulation and boundary-setting strategies for home and school success.'
      }
    ],
    medicationInfo: 'Strict adherence to pediatric psychiatric guidelines, utilizing FDA-approved medications for pediatric indications with conservative dosing schedules and frequent check-ins.',
    holisticSupport: [
      'Digital screen boundaries and sleep hygiene restoration',
      'Nutritional support for brain growth and steady energy',
      'Coordination with school counselors for 504 plans and IEP accommodations',
      'Creative, athletic, and expressive emotional outlets'
    ],
    faqs: [
      {
        question: 'At what age can a child be evaluated at Golden Mind?',
        answer: 'We evaluate and treat children and adolescents ages 6 and older, providing age-appropriate assessments tailored to their stage of emotional development.'
      },
      {
        question: 'Are parents included in the psychiatric appointment?',
        answer: 'Yes. For children and younger teens, parents are heavily involved throughout the evaluation. For older adolescents, we balance confidential teen conversation with collaborative parent summaries and alignment.'
      }
    ]
  },
  {
    id: 'holistic-integrative',
    name: 'Holistic & Integrative Psychiatry',
    tagline: 'Treating the whole person—mind, body, biology, and lifestyle.',
    shortDescription: 'Bridging modern psychopharmacology with functional nutrition, gut-brain health, circadian science, and targeted supplementation.',
    overview: 'True mental health does not exist in isolation from physical health. The brain is intimately connected to gut microbiome health, systemic inflammation, metabolic function, sleep quality, and lifestyle habits. Brenda Hobyani, PMHNP-BC practices integrative psychiatry—blending the best of conventional evidence-based medication with functional wellness protocols for comprehensive, enduring healing.',
    symptoms: [
      'Mental health symptoms paired with chronic fatigue, digestive issues, or brain fog',
      'Suboptimal response to standard psychiatric medications alone',
      'Desire to minimize medication doses through supportive lifestyle optimization',
      'Feeling that standard medical appointments only address symptoms rather than root causes',
    ],
    causesAndTriggers: [
      'Gut dysbiosis and impaired gut-brain axis serotonin production',
      'Nutritional deficiencies (Vitamin D, B-vitamins, Iron, Magnesium, Zinc)',
      'Chronic low-grade systemic inflammation and metabolic resistance',
      'Mitochondrial dysfunction and oxidative cellular stress',
    ],
    treatmentApproach: [
      {
        title: 'Comprehensive Functional Lab Review',
        description: 'Reviewing complete blood counts, thyroid panels, inflammatory markers, and nutritional biomarker levels.'
      },
      {
        title: 'Synergistic Medication & Nutraceutical Plan',
        description: 'Combining pharmaceutical treatments with clinical-grade supplements (Omega-3 fatty acids, L-methylfolate, magnesium) that have robust psychiatric clinical data.'
      },
      {
        title: 'Lifestyle Medicine Prescription',
        description: 'Targeted prescriptions for sleep timing, light exposure, stress management, and nervous system nourishment.'
      }
    ],
    medicationInfo: 'Conventional psychiatric medications integrated judiciously with pharmaceutical-grade medical foods (such as L-methylfolate for MTHFR gene variants) and targeted nutraceuticals.',
    holisticSupport: [
      'Anti-inflammatory dietary guidance emphasizing brain-nourishing whole foods',
      'Gut microbiome restoration protocols to support neurochemical synthesis',
      'Somatic breathwork and heart rate variability (HRV) biofeedback coaching',
      'Nature connection and restorative movement practices'
    ],
    faqs: [
      {
        question: 'Does integrative psychiatry mean you do not prescribe medication?',
        answer: 'Not at all. Brenda Hobyani is a board-certified psychiatric nurse practitioner who actively prescribes psychiatric medications. Integrative psychiatry means we combine prescription medicine with lifestyle, nutrition, and biological root-cause investigation for optimal results.'
      },
      {
        question: 'Can lifestyle changes reduce the amount of medication I need?',
        answer: 'Frequently, yes. When sleep, gut health, nutrient status, and stress resilience improve, many patients find they require lower medication dosages or experience fewer side effects.'
      }
    ]
  },
  {
    id: 'substance-abuse-addiction',
    name: 'Substance Abuse and Addiction',
    tagline: 'Compassionate, judgment-free psychiatric care supporting lasting recovery and emotional stability.',
    shortDescription: 'Evidence-based dual-diagnosis psychiatric evaluations and medication management for substance use disorders and co-occurring mental health conditions.',
    overview: 'Substance abuse and addiction are complex neurobiological and emotional conditions—often deeply intertwined with underlying anxiety, depression, trauma, or untreated ADHD. At Golden Mind Psychiatry PLLC, Brenda Hobyani, PMHNP-BC provides a safe, stigma-free telehealth environment where patients receive comprehensive dual-diagnosis care that treats both the addiction and the root mental health drivers simultaneously.',
    symptoms: [
      'Difficulty cutting back or controlling substance or alcohol use despite wanting to stop',
      'Using substances to self-medicate chronic anxiety, insomnia, trauma, or emotional pain',
      'Experiencing cravings, tolerance shifts, or mood instability between uses',
      'Disruptions in work, family relationships, or daily responsibilities',
      'Co-occurring symptoms of depression, panic, irritability, or emotional exhaustion'
    ],
    causesAndTriggers: [
      'Neurochemical changes in the brain’s dopamine reward and prefrontal impulse-control pathways',
      'Unaddressed trauma, PTSD, or chronic emotional stress',
      'Underlying mood, anxiety, or neurodevelopmental conditions leading to self-medication',
      'Genetic and familial vulnerability to substance use disorders'
    ],
    treatmentApproach: [
      {
        title: 'Comprehensive Dual-Diagnosis Evaluation',
        description: 'Thorough assessment of both substance use patterns and co-occurring psychiatric conditions such as depression, bipolar disorder, PTSD, or ADHD.'
      },
      {
        title: 'Targeted Pharmacotherapy & Craving Support',
        description: 'Evidence-based non-addictive medications to help reduce cravings, stabilize mood, restore sleep architecture, and support relapse prevention.'
      },
      {
        title: 'Ongoing Compassionate Telehealth Follow-Up',
        description: 'Consistent, confidential virtual check-ins across Texas to monitor recovery progress, adjust treatment, and celebrate milestones.'
      }
    ],
    medicationInfo: 'We utilize safe, non-habit-forming psychiatric medications tailored to stabilize mood and anxiety while offering evidence-based pharmacotherapy options that reduce cravings and support sustained recovery.',
    holisticSupport: [
      'Relapse prevention planning and trigger identification strategies',
      'Sleep and nutritional restoration protocols to support brain recovery',
      'Collaborative coordination with addiction counselors, therapists, and recovery groups',
      'Stress regulation and nervous system grounding practices'
    ],
    faqs: [
      {
        question: 'What is dual-diagnosis psychiatric care?',
        answer: 'Dual-diagnosis care treats both a substance use disorder and a co-occurring mental health condition (like depression, anxiety, or PTSD) at the same time, which significantly improves long-term recovery outcomes.'
      },
      {
        question: 'Are substance abuse consultations confidential?',
        answer: 'Yes. All evaluations and follow-up visits are conducted via our encrypted, HIPAA-compliant telehealth platform from the privacy of your home.'
      }
    ]
  },
  {
    id: 'neurodevelopmental-disorders',
    name: 'Neurodevelopmental Disorders (ASD & Intellectual Developmental Disorder)',
    tagline: 'Affirming, individualized psychiatric care for Autism Spectrum Disorders (ASD) and Intellectual Developmental Disorder.',
    shortDescription: 'Specialized psychiatric evaluations and supportive symptom management for Autism Spectrum Disorders (ASD) and Intellectual Developmental Disorder.',
    overview: 'Neurodevelopmental disorders—including Autism Spectrum Disorders (ASD) and Intellectual Developmental Disorder (IDD)—involve unique patterns of brain development that shape communication, sensory processing, social interaction, and adaptive functioning. Brenda Hobyani, PMHNP-BC delivers patient-centered, respectful care focused on enhancing quality of life, easing sensory or emotional overwhelm, and treating co-occurring anxiety, mood shifts, or sleep difficulties.',
    symptoms: [
      'Differences in social communication, non-verbal cues, and interpersonal connection',
      'Heightened sensory sensitivities to sound, light, textures, or routine changes',
      'Emotional dysregulation, meltdowns, or severe irritability when overwhelmed',
      'Adaptive functioning or cognitive processing challenges requiring tailored support',
      'Co-occurring anxiety, repetitive behaviors, ADHD symptoms, or chronic sleep disturbances'
    ],
    causesAndTriggers: [
      'Complex genetic and neurobiological variations in early brain connectivity',
      'Sensory overload and abrupt transitions in daily environments',
      'Unrecognized medical, communication, or emotional frustrations',
      'Co-occurring neurotransmitter imbalances affecting sleep and anxiety pathways'
    ],
    treatmentApproach: [
      {
        title: 'Neurodiversity-Affirming Psychiatric Assessment',
        description: 'Comprehensive evaluation involving both the patient and their family or caregivers to understand strengths, sensory needs, and specific clinical challenges.'
      },
      {
        title: 'Conservative, Targeted Symptom Management',
        description: 'Careful, low-dose pharmacotherapy when indicated to help ease severe irritability, anxiety, hyperactivity, or sleep difficulties while respecting the individual’s baseline personality.'
      },
      {
        title: 'Family & Caregiver Partnership',
        description: 'Ongoing collaboration with parents, families, and support networks to create predictable, supportive routines at home and school.'
      }
    ],
    medicationInfo: 'While medication does not treat the core identity of autism or intellectual developmental disorders, FDA-approved and evidence-based medications can safely relieve co-occurring symptoms such as severe irritability, anxiety, attentional difficulties, and insomnia.',
    holisticSupport: [
      'Sensory-friendly daily routine structuring and transition support',
      'Sleep architecture and circadian rhythm stabilization strategies',
      'Coordination with behavioral therapists, speech/occupational therapy, and school IEP teams',
      'Nutritional and gut-brain support tailored to sensory food preferences'
    ],
    faqs: [
      {
        question: 'Why is telehealth beneficial for patients with ASD or neurodevelopmental disorders?',
        answer: 'Telehealth allows patients to be evaluated in their own familiar, sensory-safe home environment without the stress of unfamiliar waiting rooms, bright lights, or travel.'
      },
      {
        question: 'Do you work with both youth and adults with ASD and Intellectual Developmental Disorder?',
        answer: 'Yes. We provide compassionate evaluations and ongoing medication management for children, adolescents, and adults across the neurodevelopmental spectrum.'
      }
    ]
  },
  {
    id: 'pharmacogenomic-testing',
    name: 'Pharmacogenomic Testing',
    tagline: 'DNA-guided precision psychiatry to reduce trial and error and promote safer, more effective care.',
    shortDescription: 'Pharmacogenomic testing analyzes a patient’s DNA to identify genetic variations that may influence responses to psychiatric medications.',
    overview: 'Pharmacogenomic testing analyzes a patient’s DNA to identify genetic variations that may influence responses to psychiatric medications used to treat depression, anxiety, ADHD, bipolar disorder, schizophrenia, epilepsy, and other neurological conditions. By identifying how the body may metabolize certain medications, testing can help guide personalized treatment decisions, support medication selection, and reduce trial and error to promote safer, more effective care.',
    symptoms: [
      'History of experiencing unwanted side effects from standard psychiatric medication doses',
      'Previous antidepressants, anxiety medications, or ADHD treatments feeling ineffective',
      'Desire to avoid months of medication trial and error before finding relief',
      'Complex treatment history across depression, anxiety, bipolar disorder, or neurological conditions',
      'Sensitivity to medication dose changes or concerns about drug-gene interactions'
    ],
    causesAndTriggers: [
      'Inherited variations in liver cytochrome P450 (CYP450) metabolic enzymes',
      'Genetic differences in neurotransmitter receptor sensitivity and transporter proteins',
      'Ultra-rapid, intermediate, or poor metabolizer genetic profiles affecting blood medication levels',
      'Variations in folic acid conversion pathways (such as MTHFR gene variants)'
    ],
    treatmentApproach: [
      {
        title: 'Simple At-Home DNA Cheek Swab',
        description: 'A painless, non-invasive buccal cheek swab kit can be shipped directly to your home anywhere in Texas and returned in a prepaid mailer.'
      },
      {
        title: 'Comprehensive Genetic & Metabolic Analysis',
        description: 'Analyzes key pharmacokinetic and pharmacodynamic genes that influence how your body processes medications for depression, anxiety, ADHD, bipolar disorder, schizophrenia, and epilepsy.'
      },
      {
        title: 'Personalized Medication Roadmap Review',
        description: 'Brenda Hobyani, PMHNP-BC reviews your detailed genetic report with you during a telehealth consultation to select medications aligned with your unique DNA profile.'
      }
    ],
    medicationInfo: 'Your pharmacogenomic report categorizes psychiatric and neurological medications into clear green, yellow, and red tiers based on your gene-drug interactions, helping guide precise dosing and safer medication selection.',
    holisticSupport: [
      'Identification of MTHFR gene variations to guide targeted L-methylfolate supplementation',
      'Long-term genetic reference report that remains valid for your lifetime',
      'Reduced risk of adverse medication reactions and faster time to symptom stabilization',
      'Empowered, transparent shared decision-making in your psychiatric care'
    ],
    faqs: [
      {
        question: 'How is pharmacogenomic testing performed via telehealth?',
        answer: 'After your telehealth visit with Brenda Hobyani, PMHNP-BC, a sterile cheek-swab DNA collection kit is mailed directly to your home. You simply swab the inside of your cheek, place it in the prepaid return envelope, and we review the results together at your follow-up video visit.'
      },
      {
        question: 'Which conditions can pharmacogenomic testing help with?',
        answer: 'Pharmacogenomic testing helps guide medication decisions for depression, anxiety, ADHD, bipolar disorder, schizophrenia, epilepsy, and other psychiatric and neurological conditions.'
      }
    ]
  }
];

