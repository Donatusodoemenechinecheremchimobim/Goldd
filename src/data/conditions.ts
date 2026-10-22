import { Condition } from '../types';

export const conditionsData: Condition[] = [
  {
    id: 'adhd',
    name: 'ADHD (Attention-Deficit / Hyperactivity Disorder)',
    tagline: 'Regain focus, mental clarity, and executive functioning through precision care.',
    shortDescription: 'Comprehensive diagnostic assessments and individualized medication management for adults and adolescents managing inattention, hyperactivity, and executive dysfunction.',
    overview: 'Attention-Deficit/Hyperactivity Disorder (ADHD) is a neurodevelopmental condition affecting the brain’s executive functioning networks—the systems responsible for attention regulation, impulse control, working memory, and organization. At Golden Mind Psychiatric, Brenda Hobyani, PMHNP-BC conducts thorough clinical evaluations to distinguish ADHD from anxiety, mood disorders, or sleep disruptions, crafting targeted care plans that restore daily capability without judgment.',
    symptoms: [
      'Chronic difficulty initiating, sustaining, or organizing work, school, or household tasks',
      'Frequent forgetfulness in daily activities, appointments, obligations, and deadlines',
      'Regularly misplacing essential everyday items (keys, phone, wallet, important documents)',
      'Trouble wrapping up the final details of a project once the challenging parts are done',
      'Making careless mistakes or overlooking details when working on repetitive or complex tasks',
      'Difficulty sustaining attention during lectures, lengthy reading, or extended conversations',
      'Appearing not to listen or mind wandering even when spoken to directly',
      'Avoiding or procrastinating on tasks that require sustained mental effort and concentration',
      'Being easily distracted by background noises, visual activity, or internal racing thoughts',
      'Chronic "time blindness"—underestimating how long tasks take and struggling with punctuality',
      'Fidgeting, tapping hands or feet, or squirming when seated for extended periods',
      'Internal restlessness, mental overdrive, or feeling driven by an "internal motor"',
      'Difficulty remaining seated in meetings, classrooms, or structured environments',
      'Inability to unwind, relax, or engage in leisure activities quietly without feeling restless',
      'Talking excessively or feeling pressured to voice thoughts immediately',
      'Blurting out answers, finishing others’ sentences, or interrupting conversations unintentionally',
      'Difficulty waiting your turn in lines, traffic, or group discussions',
      'Hyperfocusing intensely on stimulating tasks while unable to shift attention to routine priorities',
      'Executive dysfunction and paralysis when faced with multi-step decisions or clutter',
      'Emotional dysregulation, low frustration tolerance, and rejection sensitive dysphoria (RSD)',
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
    image: '/depression_care.jpg',
    tagline: 'Gentle, compassionate pathways to lift the fog, restore energy, and rediscover hope.',
    shortDescription: 'Personalized psychiatric treatment for Major Depressive Disorder, Persistent Depression (Dysthymia), and Treatment-Resistant Depression.',
    overview: 'Clinical depression is not a personal failure, lack of willpower, or simple sadness. It is a biological, emotional, and neurochemical state that affects how you feel, think, and handle daily activities. Brenda Hobyani, PMHNP-BC approaches depression with deep empathy and scientific rigor, identifying biological drivers, hormonal influences, and psychological stressors to design an integrated treatment roadmap.',
    symptoms: [
      'Persistent feelings of sadness, tearfulness, emptiness, or hopelessness most of the day',
      'Marked loss of interest or pleasure in hobbies, passions, and social activities (anhedonia)',
      'Severe physical and mental fatigue where even small tasks feel exhausting',
      'Insomnia—difficulty falling asleep, frequent nighttime awakenings, or waking too early',
      'Hypersomnia—sleeping excessively long hours yet still waking up unrefreshed',
      'Significant decrease in appetite and unintentional weight loss',
      'Increased cravings for carbohydrates/comfort foods and unintentional weight gain',
      'Feelings of worthlessness, inadequacy, or believing you are a burden to loved ones',
      'Excessive, inappropriate, or ruminative guilt over past events or perceived shortcomings',
      'Cognitive slowing, "brain fog," and difficulty sustaining concentration at work or school',
      'Marked indecisiveness—feeling overwhelmed by simple everyday choices',
      'Psychomotor retardation (moving or speaking noticeably slower) or restless agitation',
      'Emotional numbness, flatness, or feeling disconnected from family and friends',
      'Social withdrawal—ignoring messages, cancelling plans, and isolating at home',
      'Morning mood dip (diurnal variation)—feeling heaviest and most dreadful upon waking',
      'Neglect of personal self-care, hygiene, or household upkeep due to low motivation',
      'Heightened irritability, frustration, or low tolerance for minor daily stressors',
      'Unexplained physical aches, headaches, back pain, or digestive complaints',
      'Significantly diminished sex drive or loss of interest in physical intimacy',
      'Recurrent pessimistic thoughts about the future or passive/active thoughts of self-harm',
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
    overview: 'Anxiety disorders occur when the body’s innate sympathetic nervous system ("fight-or-flight") response becomes chronically activated in the absence of real physical danger. Physical sensations like chest tightness, racing pulse, and shallow breathing combine with intrusive worry loops. Brenda Hobyani, PMHNP-BC utilizes targeted psychiatric tools to downregulate your nervous system and re-establish emotional equilibrium.',
    symptoms: [
      'Persistent, excessive, and uncontrollable worry about everyday matters (health, work, family, finances)',
      'Feeling constantly nervous, keyed up, anxious, or on edge',
      'Sudden surges of intense panic or overwhelming fear that peak within minutes',
      'Racing, pounding, or fluttering heartbeat (palpitations) during stress or at rest',
      'Shortness of breath, shallow breathing, air hunger, or chest tightness',
      'Chronic muscle tension, jaw clenching (bruxism), shoulder stiffness, or tension headaches',
      'Physical restlessness and inability to sit still or relax comfortably',
      'Difficulty falling asleep or staying asleep due to a racing, overactive mind',
      'Catastrophic "what-if" thinking and constantly anticipating worst-case scenarios',
      'Gastrointestinal distress—nausea, stomach cramping, butterflies, or irritable bowel symptoms',
      'Dizziness, lightheadedness, unsteadiness, or feeling faint when anxious',
      'Sweating, hot flashes, cold chills, or trembling and shaky hands',
      'Numbness or tingling sensations (paresthesias) in the fingers, lips, or extremities',
      'Fear of losing control, "going crazy," or fainting during a panic episode',
      'Intense fear of being judged, scrutinized, or embarrassed in social or performance settings',
      'Avoidance of social events, crowded places, driving, or situations where escape feels difficult',
      'Difficulty concentrating or feeling like your mind suddenly goes blank under pressure',
      'Heightened startle response—feeling jumpy at sudden noises or unexpected changes',
      'Compulsive reassurance-seeking from loved ones or repeated checking of symptoms',
      'Emotional and physical burnout from maintaining a constant state of high alert',
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
        description: 'First addressing the physical triggers of panic and adrenaline surges through targeted medications—noting that some acute anxiety medications are habit-forming and are prescribed with close clinical monitoring—alongside somatic downregulation.'
      },
      {
        title: 'Maintenance & Acute Pharmacotherapy',
        description: 'Targeted SSRIs, SNRIs, buspirone, and fast-acting habit-forming medications when clinically appropriate to provide both acute relief and long-term neurological resilience.'
      },
      {
        title: 'Cognitive & Physiological Reconditioning',
        description: 'Equipping you with diaphragmatic breathing, polyvagal techniques, and thought reframing exercises to de-escalate anxiety in real time.'
      }
    ],
    medicationInfo: 'We utilize habit-forming and daily maintenance psychiatric medications tailored to stabilize anxiety and panic, including SSRIs, SNRIs, buspirone, beta-blockers, hydroxyzine, and habit-forming anxiety medications (such as benzodiazepines) when clinically appropriate and closely monitored.',
    holisticSupport: [
      'Caffeine and stimulant tapering guidance with soothing adaptogenic alternatives',
      'Magnesium glycinate, L-theanine, and neuro-supportive botanical co-factors',
      'Vagus nerve stimulation techniques (physiological sighs, cold exposure therapy)',
      'Regular restorative sleep hygiene protocols'
    ],
    faqs: [
      {
        question: 'Are some anxiety medications habit-forming?',
        answer: 'Yes, some medications used to treat anxiety and acute panic are habit-forming. When clinically appropriate, we prescribe them judiciously based on a thorough clinical evaluation, paired with responsible dosing and regular follow-up monitoring.'
      },
      {
        question: 'How quickly can I experience relief from panic attacks?',
        answer: 'Targeted acute options—including fast-acting habit-forming medications or beta-blockers when indicated—can provide relief within 30 to 60 minutes, while daily maintenance medications decrease the frequency and intensity of panic within 2 to 4 weeks.'
      }
    ]
  },
  {
    id: 'trauma-ptsd',
    name: 'Trauma & PTSD (Post-Traumatic Stress Disorder)',
    image: '/ptsd_care.jpg',
    tagline: 'A trauma-informed sanctuary for healing deep wounds and reclaiming safety.',
    shortDescription: 'Gentle, scientifically grounded care for acute trauma, developmental/complex PTSD, nightmares, hypervigilance, and emotional flashbacks.',
    overview: 'Trauma changes the biological wiring of the brain, causing the amygdala to perceive danger long after the traumatic event has ended. Whether arising from childhood adversity, medical trauma, sudden loss, or interpersonal violence, PTSD is a profound neurobiological injury. Brenda Hobyani, PMHNP-BC offers a deeply respectful, compassionate clinical environment where you set the pace.',
    symptoms: [
      'Recurrent, involuntary, and intrusive distressing memories of traumatic events',
      'Vivid, disturbing nightmares related to past trauma or themes of threat and helplessness',
      'Dissociative reactions or flashbacks—feeling as if the traumatic event is happening right now',
      'Intense psychological distress when exposed to internal or external cues resembling the trauma',
      'Marked physiological reactivity (racing heart, sweating, shaking, nausea) when triggered',
      'Active avoidance of distressing memories, thoughts, or emotions associated with the trauma',
      'Avoidance of external reminders—specific people, places, conversations, objects, or situations',
      'Inability to recall important aspects of the traumatic experience (dissociative amnesia)',
      'Persistent, exaggerated negative beliefs about oneself ("I am broken") or the world ("No one is safe")',
      'Distorted self-blame or blaming others for the cause or consequences of the trauma',
      'Persistent negative emotional state—chronic fear, horror, anger, guilt, or deep shame',
      'Markedly diminished interest or participation in significant life activities',
      'Feelings of detachment, alienation, or estrangement from friends and family',
      'Persistent inability to experience positive emotions such as joy, satisfaction, or loving closeness',
      'Hypervigilance—constantly scanning rooms, crowds, and exits for potential threats',
      'Exaggerated startle response—jumping or freezing at loud noises or unexpected touch',
      'Irritable behavior and angry outbursts with little or no provocation',
      'Episodes of depersonalization or derealization—feeling detached from your body or surroundings',
      'Severe difficulty concentrating, completing tasks, or staying grounded in the present moment',
      'Chronic sleep disturbance—fear of the dark, nighttime panic, or inability to stay asleep',
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
    medicationInfo: 'Targeted psychiatric medications including FDA-approved SSRIs (sertraline, paroxetine), alpha-blockers for nightmare suppression, and mood stabilizers or closely monitored habit-forming medications when indicated for acute distress.',
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
    image: '/womens_mental_health.jpg',
    tagline: 'Specialized psychiatric care honoring the hormonal and emotional transitions of womanhood.',
    shortDescription: 'Expert care for Pre-Menstrual Dysphoric Disorder (PMDD), pregnancy and postpartum depression/anxiety, perimenopause, and hormonal mood shifts.',
    overview: 'Women experience distinct neuroendocrine milestones that profoundly impact brain chemistry. Fluctuations in estrogen, progesterone, and neurosteroids can trigger debilitating mood and anxiety episodes during the menstrual cycle, perinatal window, and menopausal transition. Brenda Hobyani, PMHNP-BC has specialized expertise in perinatal mental health, helping women make safe, informed psychiatric decisions with confidence.',
    symptoms: [
      'Severe luteal-phase mood swings, despair, or rage in the 7–10 days before menstruation (PMDD)',
      'Marked premenstrual anxiety, tension, or feeling completely overwhelmed and out of control',
      'Persistent sadness, tearfulness, or emotional numbness during pregnancy or postpartum',
      'Postpartum anxiety—relentless, racing "what-if" worries about infant health and safety',
      'Distressing, ego-dystonic intrusive thoughts or images during the perinatal or postpartum period',
      'Inability to sleep even when the baby is sleeping due to hypervigilance and nocturnal dread',
      'Difficulty bonding with the newborn or feeling emotionally detached and robotic',
      'Intense maternal guilt, shame, or feeling like an inadequate mother',
      'Sudden panic attacks, heart palpitations, or chest tightness during hormonal shifts',
      'Perimenopausal mood volatility, uncharacteristic anger, or sudden weeping spells',
      'Cognitive "brain fog," word-finding difficulties, and memory slips during hormonal transitions',
      'Severe physical exhaustion and leaden fatigue not relieved by rest',
      'Hot flashes and night sweats that fragment deep restorative sleep architecture',
      'Loss of interest in activities, socializing, or self-care routines',
      'Heightened sensory sensitivity—feeling touched-out, overstimulated, or easily startled',
      'Appetite fluctuations, intense carbohydrate cravings, or loss of appetite',
      'Cyclical worsening of underlying ADHD, OCD, or migraine symptoms around menstruation',
      'Emotional grief, anxiety, and mood strain associated with fertility treatments or pregnancy loss',
      'Physical premenstrual symptoms (bloating, breast tenderness, joint pain) paired with severe mood drops',
      'Diminished libido and emotional strain within intimate partnerships',
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
        description: 'Comprehensive clinical risk-benefit analysis evaluating infant exposure vs. untreated maternal illness, using the latest reproductive toxicology databases.'
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
      'Distinct periods of abnormally and persistently elevated, expansive, or irritable mood',
      'Decreased need for sleep—feeling energized after only 2 to 4 hours of rest',
      'Flight of ideas or subjective experience that thoughts are racing uncontrollably',
      'Pressured speech—talking rapidly, loudly, or feeling unable to stop speaking',
      'Inflated self-esteem, grandiosity, or unshakeable confidence in ambitious plans',
      'Surge in goal-directed activity—starting multiple projects late at night simultaneously',
      'Psychomotor agitation—pacing, restlessness, and inability to sit still',
      'Heightened distractibility—attention easily pulled toward unimportant external stimuli',
      'Impulsive spending sprees, risky business ventures, or reckless financial decisions',
      'Uncharacteristic risk-taking behaviors, impulsive travel, or hypersexuality',
      'Severe depressive crashes following elevated periods, marked by heavy exhaustion and despair',
      'Mixed affective states—feeling wired, agitated, and racing while deeply depressed',
      'Rapid mood cycling or extreme emotional reactivity to interpersonal stressors',
      'Periods of intense social outgoingness followed by weeks of complete social withdrawal',
      'Atypical depressive features such as leaden paralysis (heavy limbs) and hypersomnia',
      'History of standard antidepressants triggering agitation, insomnia, or hypomania',
      'Seasonal mood shifts—experiencing energy spikes in spring/summer and depression in autumn/winter',
      'Cognitive difficulties with memory, planning, and focus during both manic and depressive phases',
      'Strained relationships or occupational instability caused by unpredictable energy cycles',
      'Chronic circadian rhythm sensitivity where a single missed night of sleep destabilizes mood',
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
        description: 'Targeted second-generation atypical antipsychotics, lithium, and anticonvulsant mood stabilizers (such as lamotrigine) chosen to maintain stability.'
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
    image: '/sleep_care.jpg',
    tagline: 'Rebuilding natural restorative sleep architecture for vibrant daytime vitality.',
    shortDescription: 'Targeted medical treatment for chronic sleep onset insomnia, sleep maintenance disruption, and circadian rhythm disorders.',
    overview: 'Quality sleep is the fundamental biological pillar of all psychiatric health. When sleep breaks down, emotional regulation, cognitive focus, memory consolidation, and immune defense rapidly deteriorate. Brenda Hobyani, PMHNP-BC addresses the biological and psychological engines of chronic insomnia using individualized sleep pharmacotherapy and circadian alignment protocols.',
    symptoms: [
      'Chronic difficulty initiating sleep—lying awake for 30+ minutes to hours at night (sleep-onset insomnia)',
      'Frequent nocturnal awakenings and struggling to return to sleep (sleep-maintenance insomnia)',
      'Early morning awakening (e.g., 3:00–4:30 AM) with an inability to fall back asleep',
      'Conditioned bedtime hyperarousal—feeling exhausted on the couch but wide awake in bed',
      'Racing thoughts, mental replay of the day, and clock-watching throughout the night',
      'Non-restorative, light, or fragmented sleep that leaves you feeling unrefreshed',
      'Severe daytime fatigue, low physical stamina, and afternoon energy crashes',
      'Cognitive impairment—poor concentration, short-term memory slips, and slower reaction times',
      'Heightened daytime irritability, emotional reactivity, and reduced stress tolerance',
      'Persistent worry and anticipatory dread about bedtime and whether you will sleep tonight',
      'Delayed sleep phase—inability to fall asleep until very late at night with difficulty waking for work/school',
      'Physical tension, elevated heart rate, or night sweats when trying to rest',
      'Reliance on high doses of caffeine or energy drinks to function during the day',
      'Unsuccessful reliance on over-the-counter sleep aids, antihistamines, or alcohol to fall asleep',
      'Tension headaches, eye strain, or gastrointestinal discomfort following poor sleep',
      'Micro-sleeps or involuntary drowsiness during quiet daytime tasks or meetings',
      'Worsening of co-occurring anxiety, depression, or ADHD symptoms after nights of poor sleep',
      'Disrupted dream architecture or frequent vivid, stressful awakenings',
      'Social and occupational strain from chronic exhaustion and reduced productivity',
      'Sensitivity to minor environmental noises, light, or temperature changes during the night',
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
        title: 'Personalized Sleep Pharmacotherapy',
        description: 'Prescribing targeted sleep medications tailored to your specific sleep architecture to help you fall asleep, stay asleep, and wake feeling restored.'
      },
      {
        title: 'Cognitive Behavioral Insights for Insomnia (CBT-I)',
        description: 'Breaking the conditioned association between your bed and frustration through stimulus control and sleep pressure management.'
      }
    ],
    medicationInfo: 'We utilize individualized sleep pharmacotherapy—including restorative sleep agents (trazodone, doxepin, mirtazapine, orexin receptor antagonists) as well as habit-forming sedative-hypnotics when clinically indicated and closely supervised to restore your sleep cycle.',
    holisticSupport: [
      'Circadian entrainment with morning lux light and evening dimming',
      'Bedroom temperature and acoustic optimization',
      'Magnesium L-threonate, glycine, and calming botanical sleep formulations',
      'Worry-journaling and autonomic down-regulation before bed'
    ],
    faqs: [
      {
        question: 'How do you choose the right sleep medication for my insomnia?',
        answer: 'We evaluate whether you struggle with falling asleep, staying asleep, early morning awakenings, or underlying anxiety, and select a targeted medication regimen with careful dosing and regular follow-up monitoring.'
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
    image: '/ocd_care.jpg',
    shortDescription: 'Targeted psychiatric pharmacotherapy and supportive strategies for OCD, intrusive thoughts, and related anxiety disorders.',
    overview: 'Obsessive-Compulsive Disorder (OCD) is characterized by distressing, unwanted, intrusive thoughts, images, or urges (obsessions) that provoke intense anxiety, leading to repetitive mental or physical actions (compulsions) performed to neutralize the distress. Brenda Hobyani, PMHNP-BC provides compassionate, shame-free psychiatric care to lower the neurological volume of intrusive thoughts.',
    symptoms: [
      'Recurrent, unwanted, intrusive thoughts, urges, or mental images that trigger intense distress',
      'Contamination obsessions—intense fear of germs, illness, dirt, chemicals, or environmental toxins',
      'Compulsive washing rituals—excessive hand-washing, showering, or sanitizing until skin is raw',
      'Harm obsessions—terrifying intrusive fears of accidentally or impulsively harming oneself or loved ones',
      'Compulsive checking—repeatedly verifying locks, stoves, appliances, brakes, or sent messages',
      'Symmetry and "just right" obsessions—intense discomfort when objects are uneven or out of order',
      'Ordering, arranging, or repeating actions (touching, tapping, stepping through doorways) a set number of times',
      'Unwanted taboo thoughts—ego-dystonic intrusive thoughts involving religion (scrupulosity), morality, or sexuality',
      'Purely mental compulsions—silent counting, praying, repeating safe phrases, or mentally reviewing conversations',
      'Compulsive reassurance-seeking—repeatedly asking loved ones or searching online to neutralize doubt',
      'Pathological doubt and intolerance of uncertainty—needing 100% guarantee of safety or perfection',
      'Thought-action fusion—believing that having an unwanted thought is as bad as acting on it',
      'Fear of accidentally making a catastrophic mistake at work, in finances, or in daily life',
      'Rereading or rewriting sentences, emails, or forms repeatedly to ensure no error occurred',
      'Confessing minor perceived mistakes or thoughts to others to relieve overwhelming guilt',
      'Avoidance of triggers—staying away from sharp objects, certain numbers, places, or news stories',
      'Hoarding behaviors—difficulty discarding worn-out items out of fear that something bad will happen',
      'Somatic obsessions—hyper-awareness of breathing, blinking, swallowing, or heartbeat',
      'Spending more than an hour (often several hours) daily trapped in obsessive-compulsive loops',
      'Profound mental exhaustion, shame, and interference with work, school, and relationships',
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
        description: 'When standard therapies yield partial response, utilizing targeted augmenting agents (such as memantine, NAC, or low-dose second-generation agents).'
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
    image: '/child_adolescent.jpg',
    tagline: 'Supportive, family-centered mental healthcare for young minds finding their way.',
    shortDescription: 'Gentle, thorough psychiatric evaluations and conservative treatment for children, pre-teens, and adolescents (ages 6–18).',
    overview: 'Young brains undergo rapid neurodevelopment, and emotional or behavioral struggles during childhood and teenage years can dramatically impact school, friendships, and family life. Brenda Hobyani, PMHNP-BC works collaboratively with parents, pediatricians, and schools, prioritizing conservative, developmentally tailored interventions that protect developing minds.',
    symptoms: [
      'Sudden or progressive decline in grades, missing assignments, or academic overwhelm',
      'School refusal, morning tearfulness, or intense anxiety about separating from parents',
      'Frequent somatic complaints—stomachaches, headaches, or nausea before school or social events',
      'Severe emotional dysregulation, explosive temper outbursts, or prolonged meltdowns',
      'Chronic irritability, crankiness, or oppositional defiance at home or school',
      'Social withdrawal—isolating in their bedroom and pulling away from friends and family',
      'Loss of interest in sports, gaming, art, or activities they previously loved',
      'Difficulty sustaining attention, following multi-step instructions, or sitting still in class',
      'Impulsivity—acting without thinking, interrupting teachers, or struggling with peer boundaries',
      'Excessive perfectionism—erasing homework repeatedly or crying over minor mistakes',
      'Persistent worries about family safety, peer acceptance, future events, or health',
      'Changes in sleep habits—nightmares, fear of sleeping alone, insomnia, or sleeping excessively',
      'Noticeable shifts in appetite, picky eating, or sudden weight changes',
      'Low self-esteem—calling themselves "stupid," "bad," or expressing feelings of worthlessness',
      'Heightened sensitivity to peer rejection, bullying, or social media comparisons',
      'Sensory overload—distress from loud cafeterias, crowded hallways, or scratchy clothing',
      'Restlessness, nail-biting, skin-picking, or fidgeting when stressed',
      'Difficulty transitioning between activities (e.g., turning off screens or starting homework)',
      'Frequent crying spells, emotional sensitivity, or feeling misunderstood',
      'Expressions of hopelessness, dark thoughts, or signs of self-injurious behavior',
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
    overview: 'True mental health does not exist in isolation from physical health. The brain is intimately connected to gut microbiome health, systemic inflammation, metabolic function, sleep quality, and lifestyle habits. Brenda Hobyani, PMHNP-BC practices integrative psychiatry—blending the best of conventional psychiatric medication with functional wellness protocols for comprehensive, enduring healing.',
    symptoms: [
      'Persistent depressed mood or anxiety paired with chronic physical fatigue and low vitality',
      'Cognitive "brain fog," sluggish mental processing, and poor short-term memory',
      'Gut-brain symptoms—bloating, IBS, food sensitivities, or digestive distress alongside mood shifts',
      'Incomplete or partial response to conventional psychiatric medications alone',
      'High sensitivity to standard medication dosages or frequent medication side effects',
      'Afternoon energy crashes, blood sugar swings, and intense cravings for sugar or caffeine',
      'Chronic low-grade inflammation, joint aches, or unexplained physical tension',
      'Circadian rhythm disruption—feeling wired at night and exhausted in the morning',
      'Stress-induced burnout and dysregulated cortisol ("wired but tired" nervous system state)',
      'Symptoms linked to micronutrient deficiencies (low Vitamin D, B12, Folate/MTHFR, Iron/Ferritin, Magnesium, Zinc)',
      'Mood and energy fluctuations tied to subclinical thyroid or hormonal imbalances',
      'Heightened nervous system reactivity, poor heart-rate variability, and slow recovery from stress',
      'Sleep maintenance difficulties and waking up feeling unrefreshed despite 7–8 hours in bed',
      'Seasonal dips in mood, motivation, and energy during low-sunlight months',
      'Emotional flatness or blunting from over-medication without root-cause lifestyle support',
      'Difficulty sustaining focus and mental stamina throughout the workday',
      'Headaches, migraines, or jaw tension exacerbated by psychological stress',
      'Immune vulnerability—catching frequent colds or feeling run down during stressful periods',
      'Desire for a personalized clinical plan combining precision prescribing with targeted nutraceuticals',
      'Seeking a holistic psychiatrist who evaluates lab biomarkers, nutrition, sleep, and mind-body balance',
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
    image: '/substance_abuse.jpg',
    tagline: 'Compassionate, judgment-free psychiatric care supporting lasting recovery and emotional stability.',
    shortDescription: 'Comprehensive dual-diagnosis psychiatric evaluations and medication management for substance use disorders and co-occurring mental health conditions.',
    overview: 'Substance abuse and addiction are complex neurobiological and emotional conditions—often deeply intertwined with underlying anxiety, depression, trauma, or untreated ADHD. At Golden Mind Psychiatry PLLC, Brenda Hobyani, PMHNP-BC provides a safe, stigma-free telehealth environment where patients receive comprehensive dual-diagnosis care that treats both the addiction and the root mental health drivers simultaneously.',
    symptoms: [
      'Consuming alcohol, prescription medications, or substances in larger amounts or longer than intended',
      'Persistent desire or repeated unsuccessful attempts to cut down or stop substance use',
      'Strong daily or situational cravings and intense mental preoccupation with using',
      'Using alcohol or substances to self-medicate underlying anxiety, panic, trauma, or depression',
      'Relying on substances at night to quiet racing thoughts or fall asleep',
      'Developing tolerance—needing higher amounts to achieve relief or the same effect',
      'Experiencing physical withdrawal symptoms (tremors, sweating, nausea, racing heart) when stopping',
      'Experiencing psychological withdrawal (severe rebound anxiety, irritability, insomnia, depression)',
      'Spending significant time obtaining, using, or recovering from the effects of substances',
      'Difficulty fulfilling major responsibilities at work, school, or home due to use',
      'Continued use despite interpersonal conflict or strain with a partner, family, or friends',
      'Giving up once-enjoyed hobbies, exercise, or social activities in favor of substance use',
      'Using substances in physically hazardous situations or taking uncharacteristic risks',
      'Continuing use despite knowing it is worsening depression, panic attacks, or physical health',
      'Experiencing memory blackouts, cognitive fog, or intense morning-after guilt and shame ("hangxiety")',
      'Hiding, minimizing, or feeling secretive about the frequency or quantity of consumption',
      'Marked mood swings, emotional numbness, or low frustration tolerance between uses',
      'Co-occurring untreated ADHD or impulsivity driving dopamine-seeking substance patterns',
      'History of relapse when trying to quit without medical craving support or psychiatric stabilization',
      'Readiness to explore confidential, judgment-free dual-diagnosis psychiatric treatment',
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
        description: 'Targeted pharmacotherapy—including habit-forming medications when clinically indicated and closely supervised—to help manage withdrawal, reduce cravings, stabilize mood, and support relapse prevention.'
      },
      {
        title: 'Ongoing Compassionate Telehealth Follow-Up',
        description: 'Consistent, confidential virtual check-ins across Texas to monitor recovery progress, adjust treatment, and celebrate milestones.'
      }
    ],
    medicationInfo: 'We utilize habit-forming and targeted psychiatric medications when clinically indicated and closely monitored to stabilize mood and anxiety while offering pharmacotherapy options that reduce cravings and support sustained recovery.',
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
    image: '/autism_care.jpg',
    tagline: 'Affirming, individualized psychiatric care for Autism Spectrum Disorders (ASD) and Intellectual Developmental Disorder.',
    shortDescription: 'Specialized psychiatric evaluations and supportive symptom management for Autism Spectrum Disorders (ASD) and Intellectual Developmental Disorder.',
    overview: 'Neurodevelopmental disorders—including Autism Spectrum Disorders (ASD) and Intellectual Developmental Disorder (IDD)—involve unique patterns of brain development that shape communication, sensory processing, social interaction, and adaptive functioning. Brenda Hobyani, PMHNP-BC delivers patient-centered, respectful care focused on enhancing quality of life, easing sensory or emotional overwhelm, and treating co-occurring anxiety, mood shifts, or sleep difficulties.',
    symptoms: [
      'Differences in social-emotional reciprocity and navigating back-and-forth conversation',
      'Challenges interpreting nonverbal communication (facial expressions, eye contact, tone of voice)',
      'Difficulty developing, maintaining, and understanding peer or adult social relationships',
      'Chronic mental exhaustion and autistic burnout from "masking" or camouflaging in social settings',
      'Strong need for predictability, sameness, and structured daily routines',
      'Significant distress, anxiety, or overwhelm during unexpected schedule changes or transitions',
      'Highly focused, passionate special interests with deep knowledge or intense engagement',
      'Repetitive motor movements, use of objects, or self-regulatory stimming (rocking, hand-flapping, pacing)',
      'Sensory hypersensitivity to loud noises, fluorescent lighting, crowded rooms, or strong smells',
      'Tactile and food texture sensitivities—distress from clothing tags, seams, or specific foods',
      'Sensory overload leading to acute emotional meltdowns or autonomic shutdowns (going non-verbal)',
      'Literal interpretation of language—difficulty picking up sarcasm, idioms, or implied subtext',
      'Challenges with executive functioning—planning, organizing, initiating, and switching tasks',
      'Differences in adaptive daily living skills (personal care, money management, independent navigation)',
      'Intellectual or cognitive processing differences requiring individualized pacing and clear communication',
      'Alexithymia or interoceptive differences—difficulty recognizing internal hunger, thirst, pain, or emotions',
      'Co-occurring generalized anxiety, social anxiety, or obsessive-compulsive tendencies',
      'Co-occurring ADHD traits—inattention, hyperactivity, or impulse control challenges',
      'Chronic circadian sleep-wake difficulties—trouble falling asleep or frequent nighttime waking',
      'Episodes of severe irritability, frustration, or self-injurious behavior when overwhelmed or misunderstood',
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
    medicationInfo: 'While medication does not treat the core identity of autism or intellectual developmental disorders, FDA-approved psychiatric medications can safely relieve co-occurring symptoms such as severe irritability, anxiety, attentional difficulties, and insomnia.',
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
    image: '/pharmacogenetic_testing.jpg',
    tagline: 'DNA-guided precision psychiatry to reduce trial and error and promote safer, more effective care.',
    shortDescription: 'Pharmacogenomic testing analyzes a patient’s DNA to identify genetic variations that may influence responses to psychiatric medications.',
    overview: 'Pharmacogenomic testing analyzes a patient’s DNA to identify genetic variations that may influence responses to psychiatric medications used to treat depression, anxiety, ADHD, bipolar disorder, schizophrenia, epilepsy, and other neurological conditions. By identifying how the body may metabolize certain medications, testing can help guide personalized treatment decisions, support medication selection, and reduce trial and error to promote safer, more effective care.',
    symptoms: [
      'History of experiencing uncomfortable side effects from standard doses of antidepressants or anxiety medications',
      'Previous trials of two or more psychiatric medications with minimal or no symptom relief',
      'Developing jitteriness, agitation, or insomnia when starting SSRIs or SNRIs',
      'Experiencing severe sedation, drowsiness, or cognitive blunting from low medication doses',
      'Unwanted metabolic side effects—rapid weight gain or appetite changes on prior treatments',
      'ADHD medications wearing off too quickly (ultra-rapid metabolism) or lasting too long into the night',
      'Desire to avoid months of frustrating trial-and-error prescribing before finding the right medication',
      'Complex or treatment-resistant depression, generalized anxiety, bipolar disorder, or OCD',
      'Co-occurring neurological conditions (such as epilepsy or migraine) requiring multi-medication coordination',
      'Concerns about drug-gene or drug-drug interactions when taking multiple prescriptions',
      'Family history of relatives reacting poorly or unusually to specific psychiatric medications',
      'Suspected MTHFR gene variation affecting folate conversion and neurotransmitter synthesis',
      'Sensitivity to cytochrome P450 (CYP2D6, CYP2C19, CYP3A4) liver enzyme metabolism differences',
      'Experiencing emotional flattening or sexual side effects on previous serotonergic medications',
      'Anxiety or hesitation about starting psychiatric medication without objective biological guidance',
      'Pediatric, adolescent, or sensitive adult patients where precision low-risk dosing is paramount',
      'History of paradoxical reactions (medications causing the opposite of their intended effect)',
      'Need for objective genetic data to guide safe titration speed and target dosage',
      'Seeking personalized medicine tailored to your DNA for depression, anxiety, ADHD, bipolar, or schizophrenia',
      'Desire for a lifetime genetic pharmacotherapy report to share across your healthcare team',
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

