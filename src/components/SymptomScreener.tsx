import React, { useState } from 'react';
import { Sparkles, ArrowRight, RotateCcw, ClipboardCheck } from 'lucide-react';

interface SymptomScreenerProps {
  onOpenBooking: (prefillCondition?: string) => void;
}

type ScreenerCategory =
  | 'adhd'
  | 'anxiety'
  | 'depression'
  | 'bipolar'
  | 'ptsd'
  | 'ocd'
  | 'substance'
  | 'neurodevelopmental';

interface CategoryConfig {
  id: ScreenerCategory;
  label: string;
  fullName: string;
  clinicalScaleNote: string;
  questions: string[];
}

const SCREENER_CATEGORIES: CategoryConfig[] = [
  {
    id: 'adhd',
    label: 'ADHD',
    fullName: 'ADHD (Attention-Deficit / Hyperactivity Disorder)',
    clinicalScaleNote: 'Based on DSM-5-TR Inattentive, Hyperactive-Impulsive, and Adult ASRS-v1.1 Executive Functioning Criteria (20 Clinical Indicators)',
    questions: [
      'Trouble wrapping up the final details of a project once the challenging parts are done?',
      'Difficulty getting things in order when you have to do a task that requires organization?',
      'Problems remembering appointments, obligations, deadlines, or daily responsibilities?',
      'Avoiding or delaying getting started on a task that requires a lot of mental effort and thought?',
      'Fidgeting or squirming with your hands or feet when you have to sit down for a long time?',
      'Feeling overly active and compelled to do things, as if driven by an internal motor?',
      'Making careless mistakes when you have to work on a boring, repetitive, or difficult project?',
      'Difficulty keeping your attention when you are doing boring, lengthy, or repetitive work?',
      'Difficulty concentrating on what people say to you, even when they are speaking to you directly?',
      'Misplacing or having difficulty finding essential items at home or at work (keys, phone, wallet, documents)?',
      'Being easily distracted by extraneous activity, background noise, or your own unrelated thoughts?',
      'Leaving your seat in meetings or other situations in which you are expected to remain seated?',
      'Feeling physically restless, jittery, or mentally racing during quiet or unstructured moments?',
      'Difficulty unwinding, relaxing, or quieting your mind when you have time to yourself?',
      'Talking too much or feeling pressured to keep speaking in social or professional conversations?',
      'Finishing other people’s sentences before they can finish them themselves?',
      'Difficulty waiting your turn in lines, traffic, or group situations where turn-taking is required?',
      'Interrupting or intruding on others when they are busy or in the middle of a conversation?',
      'Chronic "time blindness"—underestimating how long tasks take or running late despite trying hard?',
      'Experiencing intense emotional frustration, overwhelm, or rapid mood shifts when overstimulated or criticized?'
    ]
  },
  {
    id: 'anxiety',
    label: 'Anxiety & Panic',
    fullName: 'Anxiety, Panic & Stress Disorders',
    clinicalScaleNote: 'Based on DSM-5-TR Generalized Anxiety (GAD), Panic Disorder, Somatic Autonomic, and Social Anxiety Criteria (20 Clinical Indicators)',
    questions: [
      'Feeling nervous, anxious, keyed up, or constantly on edge?',
      'Not being able to stop or control worrying once a worry thought begins?',
      'Worrying excessively about many different areas of life (work, health, family, finances, safety)?',
      'Having trouble relaxing your body or mind even in a safe environment?',
      'Being so physically restless that it is hard to sit still comfortably?',
      'Becoming easily annoyed, snappy, or irritable when stressed or overwhelmed?',
      'Feeling afraid or having a sense of impending doom, as if something awful might happen?',
      'Experiencing sudden surges of intense panic or fear that peak within minutes?',
      'Noticing a pounding, racing, or skipping heartbeat (palpitations) when anxious?',
      'Experiencing shortness of breath, air hunger, or feeling like your chest is tight?',
      'Suffering from chronic muscle tension, jaw clenching, neck stiffness, or tension headaches?',
      'Experiencing stomach upset, nausea, abdominal cramping, or stress-related digestive distress?',
      'Feeling dizzy, lightheaded, unsteady, or faint during moments of high stress?',
      'Experiencing sweating, hot flashes, chills, or trembling/shaking hands when nervous?',
      'Difficulty falling asleep or staying asleep because your mind is racing with "what-if" scenarios?',
      'Intense fear of being judged, embarrassed, or scrutinized in social or performance situations?',
      'Avoiding social gatherings, phone calls, or public places to prevent triggering anxiety?',
      'Having difficulty concentrating or feeling like your mind goes blank when under pressure?',
      'Constantly seeking reassurance from loved ones or repeatedly checking health/safety concerns?',
      'Fear of losing control, "going crazy," or having a medical emergency during an anxiety wave?'
    ]
  },
  {
    id: 'depression',
    label: 'Depression',
    fullName: 'Depression & Depressive Disorders',
    clinicalScaleNote: 'Based on DSM-5-TR Major Depressive Disorder (MDD), PHQ-9, Beck Depression, and Persistent Depressive Criteria (20 Clinical Indicators)',
    questions: [
      'Little interest or pleasure in doing hobbies, activities, or passions you usually enjoy (anhedonia)?',
      'Feeling down, sad, depressed, empty, or hopeless most of the day?',
      'Trouble falling asleep, waking up repeatedly at night, or waking up too early and unable to return to sleep?',
      'Sleeping excessively (hypersomnia) or struggling to get out of bed in the morning?',
      'Feeling tired, heavy, or having very little physical energy even without strenuous activity?',
      'Significant decrease in appetite or unintentional weight loss?',
      'Increased cravings for carbohydrates/comfort foods or unintentional weight gain?',
      'Feeling bad about yourself—or that you are a failure or have let yourself or your family down?',
      'Experiencing excessive, inappropriate, or overwhelming feelings of guilt over past events?',
      'Trouble concentrating on reading, work tasks, conversations, or watching television?',
      'Indecisiveness—finding everyday choices exhausting or impossible to make?',
      'Moving or speaking so slowly that other people could have noticed—or feeling agitated and restless?',
      'Feeling emotionally numb, flat, or disconnected from people you love?',
      'Withdrawing socially—ignoring texts, calls, or cancelling plans with friends and family?',
      'Frequent tearfulness or crying spells without an obvious immediate trigger?',
      'Feeling that basic daily self-care (showering, cooking, cleaning) requires monumental effort?',
      'Experiencing worse mood, heaviness, or dread in the morning hours upon waking?',
      'Loss of libido or significantly reduced interest in physical intimacy?',
      'Persistent pessimistic outlook—believing that things will never improve in the future?',
      'Thoughts that you would be better off dead, or passive/active thoughts of hurting yourself?'
    ]
  },
  {
    id: 'bipolar',
    label: 'Bipolar & Mood',
    fullName: 'Bipolar & Mood Spectrum Disorders',
    clinicalScaleNote: 'Based on DSM-5-TR Bipolar I/II, Cyclothymic, and Mood Disorder Questionnaire (MDQ) Criteria (20 Clinical Indicators)',
    questions: [
      'Periods where you felt so energized or "wired" that others thought you were not your normal self?',
      'Episodes of needing far less sleep than usual (e.g., 3–4 hours) and still not feeling tired the next day?',
      'Finding that your thoughts were racing so fast through your mind that you could not slow them down?',
      'Talking much faster or louder than usual, or feeling pressured to keep talking uninterrupted?',
      'Periods of unusually high self-confidence, grandiosity, or feeling like you had special abilities?',
      'Starting multiple ambitious projects at once (late at night or impulsively) with intense drive?',
      'Being much more easily distracted than usual, jumping rapidly from one idea or activity to another?',
      'Periods of extreme irritability, agitation, or explosive arguments over minor frustrations?',
      'Impulsive spending sprees, risky financial decisions, or giving away money during elevated moods?',
      'Engaging in uncharacteristic risky behaviors (reckless driving, sudden travel, or impulsive decisions)?',
      'Heightened social outgoingness, calling people at odd hours, or increased hypersexuality during "up" phases?',
      'Experiencing sharp "crashes" from high energy into deep, heavy depression and exhaustion?',
      'Having "mixed states"—feeling agitated, restless, and wired while simultaneously feeling deeply depressed?',
      'Noticing seasonal or cyclical patterns in your mood, energy levels, and sleep needs?',
      'History of antidepressant medications making you feel overly jittery, irritable, or rapid-cycling?',
      'Extreme fluctuations in productivity—going from superhuman output to being unable to function?',
      'Feeling like your emotional reactions are much more intense than the situation warrants?',
      'Difficulty maintaining consistent work routines or relationships due to unpredictable mood shifts?',
      'Periods of severe depressive withdrawal where you isolate completely after an energetic period?',
      'Family history of bipolar disorder, manic episodes, or severe recurrent mood instability?'
    ]
  },
  {
    id: 'ptsd',
    label: 'PTSD & Trauma',
    fullName: 'Trauma & PTSD (Post-Traumatic Stress Disorder)',
    clinicalScaleNote: 'Based on DSM-5-TR PTSD and PCL-5 Posttraumatic Stress Disorder Checklist Criteria (20 Clinical Indicators)',
    questions: [
      'Repeated, disturbing, and unwanted memories of a stressful or traumatic experience?',
      'Repeated, distressing dreams or nightmares related to past trauma or feeling trapped/unsafe?',
      'Suddenly feeling or acting as if the stressful experience were actually happening again (flashbacks)?',
      'Feeling intense emotional distress when something reminds you of the traumatic experience?',
      'Having strong physical reactions when reminded of the event (pounding heart, sweating, trouble breathing)?',
      'Avoiding internal memories, thoughts, or feelings related to the stressful experience?',
      'Avoiding external reminders of the trauma (certain people, places, conversations, activities, or situations)?',
      'Trouble remembering important parts of the stressful or traumatic experience?',
      'Having strong negative beliefs about yourself, other people, or the world ("I am bad," "No one can be trusted")?',
      'Blaming yourself or someone else excessively for the traumatic event or what happened afterward?',
      'Having persistent strong negative emotions such as fear, horror, anger, guilt, or shame?',
      'Loss of interest in activities that you used to enjoy before the trauma occurred?',
      'Feeling distant, detached, or cut off from other people around you?',
      'Trouble experiencing positive feelings (such as being unable to feel happiness, joy, or loving feelings)?',
      'Feeling irritable, having angry outbursts, or acting aggressively with little provocation?',
      'Taking too many risks or doing things that could cause you harm?',
      'Being "superalert," watchful, hypervigilant, or constantly scanning your environment for exits/threats?',
      'Feeling jumpy or being easily startled by sudden noises, movement, or someone approaching you?',
      'Having difficulty concentrating, staying present, or experiencing episodes of dissociation ("spacing out")?',
      'Trouble falling or staying asleep due to feeling unsafe or on guard at night?'
    ]
  },
  {
    id: 'ocd',
    label: 'OCD',
    fullName: 'Obsessive-Compulsive Disorder (OCD)',
    clinicalScaleNote: 'Based on DSM-5-TR Obsessive-Compulsive Disorder and Y-BOCS Symptom Dimensions (20 Clinical Indicators)',
    questions: [
      'Experiencing unwanted, intrusive thoughts, images, or urges that repeatedly enter your mind against your will?',
      'Intense fear of contamination from germs, dirt, chemicals, illness, or bodily fluids?',
      'Excessive, repetitive hand-washing, showering, or cleaning rituals to feel "clean" or safe?',
      'Intrusive fears of accidentally harming yourself or loved ones (e.g., leaving the stove on, hitting someone while driving)?',
      'Repeatedly checking locks, appliances, doors, switches, or messages to prevent a feared catastrophe?',
      'Distressing taboo, violent, religious (scrupulosity), or sexual intrusive thoughts that go against your values?',
      'Strong need for items to be arranged symmetrically, evenly, or in a specific "just right" order?',
      'Repeating routine actions (walking through doorways, touching objects, rereading, rewriting) until it feels right?',
      'Performing silent mental rituals (counting, praying, repeating safe words, or mentally reviewing past events)?',
      'Constantly seeking reassurance from family, friends, or the internet to calm an intrusive doubt?',
      'Intense intolerance of uncertainty—feeling you must know 100% for sure that nothing bad will happen?',
      'Fear that simply thinking a bad thought makes it morally equivalent to doing it or makes it come true?',
      'Spending more than 1 hour per day caught in obsessive thoughts or compulsive behaviors?',
      'Feeling overwhelming anxiety, dread, or panic if you are prevented from completing a ritual?',
      'Avoiding specific objects, numbers, words, places, or knives/sharp items that trigger intrusive thoughts?',
      'Hoarding or having extreme difficulty throwing away items out of fear of losing something important?',
      'Excessive preoccupation with a perceived flaw in your physical appearance or body sensations?',
      'Repetitive body-focused behaviors such as skin picking (excoriation) or hair pulling (trichotillomania)?',
      'Recognizing that your fears or rituals may be excessive, yet feeling powerless to stop the cycle?',
      'Significant interference in your work, studies, sleep, or relationships due to obsessive-compulsive cycles?'
    ]
  },
  {
    id: 'substance',
    label: 'Substance Use',
    fullName: 'Substance Abuse and Addiction',
    clinicalScaleNote: 'Based on DSM-5-TR Substance Use Disorder and Dual-Diagnosis Psychiatric Criteria (20 Clinical Indicators)',
    questions: [
      'Using alcohol, prescription medications, or substances in larger amounts or over a longer period than intended?',
      'Persistent desire or unsuccessful efforts to cut down, control, or stop substance or alcohol use?',
      'Spending a great deal of time obtaining, using, or recovering from the effects of a substance?',
      'Experiencing strong cravings, urges, or mental preoccupation with using the substance?',
      'Using substances to self-medicate underlying anxiety, panic, insomnia, trauma, or depression?',
      'Recurrent use resulting in difficulty fulfilling major obligations at work, school, or home?',
      'Continuing substance use despite it causing persistent tension or arguments with family or loved ones?',
      'Giving up or reducing important social, occupational, or recreational activities because of substance use?',
      'Using alcohol or substances in situations where it is physically hazardous?',
      'Continuing to use despite knowing that a physical or psychological condition (like depression or anxiety) is worsened by it?',
      'Developing tolerance—needing noticeably increased amounts to achieve the desired effect?',
      'Experiencing physical or emotional withdrawal symptoms (shaking, sweating, nausea, severe anxiety, insomnia) when cutting back?',
      'Using a substance or alcohol specifically to relieve or avoid withdrawal discomfort?',
      'Experiencing blackouts, memory gaps, or regret over behaviors that occurred while using?',
      'Hiding or minimizing the amount or frequency of substance use from family members or healthcare providers?',
      'Feeling guilt, shame, or hopelessness about your relationship with alcohol or substances?',
      'Noticing increased mood swings, irritability, or emotional numbness between uses?',
      'Relying on substances every evening in order to fall asleep or quiet racing thoughts?',
      'Previous attempts at sobriety that were derailed by untreated psychiatric symptoms (anxiety, ADHD, trauma)?',
      'Feeling ready or curious about exploring safe, judgment-free medical support to regain control?'
    ]
  },
  {
    id: 'neurodevelopmental',
    label: 'ASD & IDD',
    fullName: 'Neurodevelopmental Disorders (ASD & Intellectual Developmental Disorder)',
    clinicalScaleNote: 'Based on DSM-5-TR Autism Spectrum Disorder (ASD) and Neurodevelopmental Adaptive Functioning Indicators (20 Clinical Indicators)',
    questions: [
      'Persistent differences in initiating or sustaining back-and-forth social conversation?',
      'Difficulty reading subtle nonverbal social cues such as facial expressions, tone of voice, or body language?',
      'Finding eye contact uncomfortable, overwhelming, or unnatural during conversations?',
      'Challenges developing, maintaining, or understanding social relationships and unspoken social rules?',
      'Exhaustion or burnout from "masking" or rehearsing scripts to fit in during social or work interactions?',
      'Strong preference for predictable daily routines and sameness, with distress over unexpected changes?',
      'Difficulty transitioning between activities or adapting when plans change suddenly?',
      'Deep, highly focused special interests or passions that absorb significant time and attention?',
      'Repetitive movements, self-soothing behaviors ("stimming" such as hand-flapping, rocking, pacing, or vocalizing)?',
      'Heightened sensory sensitivity to loud noises, bright/fluorescent lights, crowds, or background hums?',
      'Strong sensory aversions to specific clothing tags, fabrics, food textures, or smells?',
      'Experiencing sensory overload that leads to emotional meltdowns or complete shutdowns (going non-verbal)?',
      'Literal interpretation of language—sometimes missing sarcasm, idioms, or implied meanings?',
      'Challenges with adaptive daily living skills (managing finances, complex scheduling, or multi-step household tasks)?',
      'Differences in cognitive processing speed, abstract reasoning, or learning new complex skills?',
      'Difficulty identifying or describing your own internal emotions or physical body states (interoception/alexithymia)?',
      'Chronic co-occurring anxiety, social dread, or perfectionism in school, work, or home settings?',
      'Long-standing difficulties falling or staying asleep since childhood?',
      'Feeling misunderstood by previous providers who overlooked neurodevelopmental traits?',
      'Seeking a neurodiversity-affirming psychiatric evaluation to support emotional regulation and daily thriving?'
    ]
  }
];

export const SymptomScreener: React.FC<SymptomScreenerProps> = ({ onOpenBooking }) => {
  const [currentCategory, setCurrentCategory] = useState<ScreenerCategory>('adhd');
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [evaluated, setEvaluated] = useState(false);

  const activeCategoryConfig =
    SCREENER_CATEGORIES.find((c) => c.id === currentCategory) || SCREENER_CATEGORIES[0];
  const questions = activeCategoryConfig.questions;
  const totalQuestions = questions.length; // 20 questions per condition
  const maxPossibleScore = totalQuestions * 3; // 60 points max
  const answeredCount = Object.keys(answers).length;

  const handleSelectScore = (questionIndex: number, score: number) => {
    setAnswers((prev) => ({ ...prev, [questionIndex]: score }));
  };

  const handleCalculate = () => {
    setEvaluated(true);
  };

  const handleReset = () => {
    setAnswers({});
    setEvaluated(false);
  };

  const totalScore = Object.values(answers).reduce((a, b) => a + b, 0);
  // Calculate normalized percentage based on questions answered (or out of 60 if all 20 answered)
  const effectiveMax = answeredCount > 0 ? answeredCount * 3 : maxPossibleScore;
  const scoreRatio = effectiveMax > 0 ? totalScore / effectiveMax : 0;

  const getResult = () => {
    if (scoreRatio <= 0.25) {
      return {
        level: 'Minimal to Mild Symptom Presentation',
        description:
          'Your responses suggest mild symptom levels across the evaluated clinical indicators. Mild fluctuations in focus, mood, or nervous system tension can occur during high stress, and proactive care can help maintain optimal stability.',
        conditionName: activeCategoryConfig.fullName
      };
    } else if (scoreRatio <= 0.55) {
      return {
        level: 'Moderate Clinical Symptom Burden',
        description:
          'Your responses indicate a moderate cluster of symptoms that may be interfering with your daily focus, emotional equilibrium, sleep, or relationships. A comprehensive diagnostic evaluation with Brenda Hobyani, PMHNP-BC can clarify your diagnosis and provide targeted relief.',
        conditionName: activeCategoryConfig.fullName
      };
    } else {
      return {
        level: 'Significant Clinical Symptom Elevation',
        description:
          'Your responses reflect a high frequency and breadth of clinical symptoms across multiple DSM-5 domains. You do not have to carry this alone—compassionate psychiatric care and personalized medication management can make a transformative difference.',
        conditionName: activeCategoryConfig.fullName
      };
    }
  };

  const result = getResult();

  return (
    <div className="p-6 md:p-8 rounded-3xl bg-white border border-stone-200 shadow-sm text-[#1C1917]">
      <div className="space-y-4 mb-6 pb-5 border-b border-stone-200">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-semibold tracking-wider text-[#9E7206] uppercase">
              Confidential Self-Check Tool
            </span>
            <h3 className="text-xl md:text-2xl font-serif text-[#1C1917] font-bold mt-0.5">
              Comprehensive Psychiatric Symptom Screener
            </h3>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF6EA] border border-[#D4AF37]/40 text-[11px] font-bold text-[#9E7206]">
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>20 DSM-5 Aligned Questions</span>
          </span>
        </div>

        {/* Category Switcher Tabs for All Conditions */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-[#FAF8F5] rounded-2xl border border-stone-200">
          {SCREENER_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setCurrentCategory(cat.id);
                handleReset();
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                currentCategory === cat.id
                  ? 'bg-[#D4AF37] text-[#1C1917] shadow-xs font-bold'
                  : 'text-[#57534E] hover:text-[#1C1917] hover:bg-white/70'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="p-3 rounded-xl bg-[#FAF8F2] border border-[#D4AF37]/30 text-[11px] text-[#57534E] flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <span className="font-semibold text-[#1C1917]">{activeCategoryConfig.fullName}</span>
          <span className="text-[#78716C]">{activeCategoryConfig.clinicalScaleNote}</span>
        </div>
      </div>

      {!evaluated ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <p className="text-xs text-[#57534E]">
              Over the past 2–4 weeks, how often have you experienced the following <strong>20 clinical symptoms</strong>?
            </p>
            <span className="text-xs font-semibold text-[#9E7206] shrink-0">
              Progress: {answeredCount} / {totalQuestions} answered
            </span>
          </div>

          {/* All 20 Clinical Questions */}
          <div className="space-y-3.5 max-h-[640px] overflow-y-auto pr-1">
            {questions.map((q, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border transition-colors ${
                  answers[idx] !== undefined
                    ? 'bg-[#FFFDF9] border-[#D4AF37]/50'
                    : 'bg-[#FAF8F5] border-stone-200/90'
                }`}
              >
                <p className="text-xs sm:text-sm font-semibold text-[#1C1917] mb-3">
                  {idx + 1}. {q}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {[
                    { label: 'Not at all', score: 0 },
                    { label: 'Several days', score: 1 },
                    { label: 'More than half', score: 2 },
                    { label: 'Nearly every day', score: 3 }
                  ].map((opt) => (
                    <button
                      key={opt.score}
                      type="button"
                      onClick={() => handleSelectScore(idx, opt.score)}
                      className={`p-2 rounded-xl text-center border transition-all cursor-pointer ${
                        answers[idx] === opt.score
                          ? 'bg-[#FAF6EA] border-[#D4AF37] text-[#9E7206] font-bold shadow-xs'
                          : 'bg-white border-stone-200 text-[#57534E] hover:border-stone-300'
                      }`}
                    >
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-stone-200">
            <span className="text-xs text-[#78716C] font-medium">
              Answered {answeredCount} of {totalQuestions} clinical questions
              {answeredCount > 0 && answeredCount < totalQuestions
                ? ' (You may view interpretation now or complete all 20)'
                : ''}
            </span>
            <button
              disabled={answeredCount === 0}
              onClick={handleCalculate}
              className={`w-full sm:w-auto px-6 py-3 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                answeredCount > 0
                  ? 'bg-gold-gradient text-[#1C1917] hover:shadow-[0_4px_16px_rgba(212,175,55,0.4)] shadow-xs'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
            >
              <span>View Clinical Interpretation ({answeredCount}/{totalQuestions})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5 animate-in fade-in duration-300">
          <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-stone-200 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-[#9E7206] font-bold uppercase tracking-wider">
                Clinical Screening Summary — {activeCategoryConfig.label}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#FAF6EA] border border-[#D4AF37]/30 text-[#9E7206] font-bold">
                Score: {totalScore} / {answeredCount * 3} ({answeredCount} of {totalQuestions} items)
              </span>
            </div>
            <h4 className="text-lg font-serif font-bold text-[#1C1917]">
              {result.level}
            </h4>
            <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed">
              {result.description}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={() => onOpenBooking(result.conditionName)}
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-gold-gradient text-[#1C1917] font-bold text-xs sm:text-sm hover:shadow-[0_4px_20px_rgba(212,175,55,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-[#1C1917]" />
              <span>Discuss Results with Brenda Hobyani, PMHNP-BC</span>
            </button>

            <button
              onClick={handleReset}
              className="w-full sm:w-auto px-5 py-3 rounded-full border border-stone-300 bg-white text-xs font-semibold text-[#57534E] hover:text-[#1C1917] hover:bg-stone-50 transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#B8860B]" />
              <span>Retake Screener</span>
            </button>
          </div>

          <p className="text-[10px] text-[#78716C] italic">
            *Disclaimer: This 20-item clinical screener is an educational self-assessment reference modeled on DSM-5-TR diagnostic criteria and validated psychiatric rating scales (ASRS-v1.1, GAD-7/BAI, PHQ-9/BDI, MDQ, PCL-5, Y-BOCS). It does not replace a formal medical diagnosis.
          </p>
        </div>
      )}
    </div>
  );
};
