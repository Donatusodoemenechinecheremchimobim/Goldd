import React, { useState } from 'react';
import { Sparkles, ArrowRight, RotateCcw, CheckCircle2 } from 'lucide-react';

interface SymptomScreenerProps {
  onOpenBooking: (prefillCondition?: string) => void;
}

export const SymptomScreener: React.FC<SymptomScreenerProps> = ({ onOpenBooking }) => {
  const [currentCategory, setCurrentCategory] = useState<'adhd' | 'anxiety' | 'depression'>('anxiety');
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [evaluated, setEvaluated] = useState(false);

  const questionsMap = {
    anxiety: [
      'Feeling nervous, anxious, on edge, or unable to stop worrying?',
      'Trouble relaxing, feeling restless, or constant muscle tightness?',
      'Sudden surges of panic, rapid heart rate, or fear of losing control?',
      'Worrying too much about different things (work, health, finances)?',
    ],
    depression: [
      'Little interest or pleasure in doing things you usually enjoy?',
      'Feeling down, depressed, emotionally numb, or hopeless?',
      'Trouble falling or staying asleep, or sleeping excessively?',
      'Feeling tired, drained of energy, or like everyday tasks take massive effort?',
    ],
    adhd: [
      'Trouble wrapping up final details of a project once the challenging parts are done?',
      'Difficulty getting things in order when you have to do a task requiring organization?',
      'Problems remembering appointments, obligations, or misplacing everyday items?',
      'Feeling overly restless, squirmy, or driven by an internal motor?',
    ]
  };

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

  const getResult = () => {
    if (totalScore <= 3) {
      return {
        level: 'Minimal to Mild Symptoms',
        description: 'Your responses suggest low to mild nervous system strain. Mild fluctuations in mood or focus are common during stress, but preventative mental hygiene can keep you thriving.',
        conditionName: currentCategory === 'adhd' ? 'ADHD' : currentCategory === 'anxiety' ? 'Anxiety & Stress' : 'Depression',
      };
    } else if (totalScore <= 7) {
      return {
        level: 'Moderate Symptoms Observed',
        description: 'You are experiencing noticeable symptom burden that may be impacting your productivity, relationships, or emotional peace. A professional evaluation with Brenda Hobyani can provide clarity and relief.',
        conditionName: currentCategory === 'adhd' ? 'ADHD (Attention-Deficit / Hyperactivity Disorder)' : currentCategory === 'anxiety' ? 'Anxiety, Panic & Stress Disorders' : 'Depression & Depressive Disorders',
      };
    } else {
      return {
        level: 'Significant Clinical Symptom Elevation',
        description: 'Your responses indicate elevated distress that warrants clinical psychiatric attention. You do not have to struggle alone—targeted evidence-based medication and lifestyle support can dramatically lift this burden.',
        conditionName: currentCategory === 'adhd' ? 'ADHD (Attention-Deficit / Hyperactivity Disorder)' : currentCategory === 'anxiety' ? 'Anxiety, Panic & Stress Disorders' : 'Depression & Depressive Disorders',
      };
    }
  };

  const result = getResult();

  return (
    <div className="p-6 md:p-8 rounded-3xl bg-white border border-stone-200 shadow-sm text-[#1C1917]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-stone-200">
        <div>
          <span className="text-[11px] font-semibold tracking-wider text-[#9E7206] uppercase">
            Confidential Self-Check Tool
          </span>
          <h3 className="text-xl md:text-2xl font-serif text-[#1C1917] font-bold mt-0.5">
            Preliminary Symptom Screener
          </h3>
        </div>

        {/* Category Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-[#FAF8F5] rounded-xl border border-stone-200">
          <button
            onClick={() => { setCurrentCategory('anxiety'); handleReset(); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              currentCategory === 'anxiety' ? 'bg-[#D4AF37] text-[#1C1917] shadow-xs' : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            Anxiety
          </button>
          <button
            onClick={() => { setCurrentCategory('depression'); handleReset(); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              currentCategory === 'depression' ? 'bg-[#D4AF37] text-[#1C1917] shadow-xs' : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            Depression
          </button>
          <button
            onClick={() => { setCurrentCategory('adhd'); handleReset(); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              currentCategory === 'adhd' ? 'bg-[#D4AF37] text-[#1C1917] shadow-xs' : 'text-[#78716C] hover:text-[#1C1917]'
            }`}
          >
            ADHD
          </button>
        </div>
      </div>

      {!evaluated ? (
        <div className="space-y-6">
          <p className="text-xs text-[#78716C]">
            Over the past 2 weeks, how often have you been bothered by the following problems?
          </p>

          <div className="space-y-4">
            {questionsMap[currentCategory].map((q, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200/90">
                <p className="text-xs sm:text-sm font-semibold text-[#1C1917] mb-3">
                  {idx + 1}. {q}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {[
                    { label: 'Not at all', score: 0 },
                    { label: 'Several days', score: 1 },
                    { label: 'More than half', score: 2 },
                    { label: 'Nearly every day', score: 3 },
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

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-[#78716C] font-medium">
              Answered {Object.keys(answers).length} of 4 questions
            </span>
            <button
              disabled={Object.keys(answers).length < 4}
              onClick={handleCalculate}
              className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                Object.keys(answers).length === 4
                  ? 'bg-gold-gradient text-[#1C1917] hover:shadow-[0_4px_16px_rgba(212,175,55,0.4)] shadow-xs'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
            >
              <span>View Clinical Interpretation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5 animate-in fade-in duration-300">
          <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-stone-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#9E7206] font-bold uppercase tracking-wider">
                Result Overview
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#FAF6EA] border border-[#D4AF37]/30 text-[#9E7206] font-bold">
                Score: {totalScore} / 12
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
            *Disclaimer: This screener is a self-assessment reference based on clinical scales and is not a formal medical diagnosis. An initial psychiatric evaluation is required to confirm diagnostic criteria.
          </p>
        </div>
      )}
    </div>
  );
};
