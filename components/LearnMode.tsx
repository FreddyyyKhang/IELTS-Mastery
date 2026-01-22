
import React, { useState, useEffect, useMemo } from 'react';
import { IELTSWord } from '../types';

interface LearnModeProps {
  words: IELTSWord[];
  onComplete: (score: number) => void;
}

type QuestionType = 'MCQ' | 'WRITTEN';

interface Question {
  id: string;
  word: IELTSWord;
  type: QuestionType;
  options?: string[];
}

const normalizeString = (str: string) => {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();
};

const LearnMode: React.FC<LearnModeProps> = ({ words, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<'CORRECT' | 'WRONG' | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const questions = useMemo(() => {
    const qList: Question[] = [];
    words.forEach((word) => {
      // 1. Multiple Choice Question
      const others = words.filter(w => w.id !== word.id);
      const distractors = [...others]
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(w => w.vietnameseTranslation);
      
      const options = [...distractors, word.vietnameseTranslation].sort(() => Math.random() - 0.5);
      
      qList.push({ id: `${word.id}-mcq`, word, type: 'MCQ', options });
      
      // 2. Written Question
      qList.push({ id: `${word.id}-written`, word, type: 'WRITTEN' });
    });
    return qList.sort(() => Math.random() - 0.5);
  }, [words]);

  const currentQuestion = questions[currentIndex];

  const handleAnswer = (answer: string) => {
    if (feedback) return;

    const correctValue = currentQuestion.word.vietnameseTranslation;
    const isCorrect = normalizeString(answer) === normalizeString(correctValue);

    if (isCorrect) {
      setFeedback('CORRECT');
      setScore(s => s + 1);
    } else {
      setFeedback('WRONG');
    }

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(c => c + 1);
        setUserInput('');
        setFeedback(null);
      } else {
        setIsFinished(true);
      }
    }, isCorrect ? 1000 : 2500);
  };

  if (isFinished) {
    return (
      <div className="max-w-2xl mx-auto p-12 bg-white border-2 border-[#C5A059]/30 rounded-3xl shadow-xl text-center animate-in zoom-in duration-500">
        <div className="w-24 h-24 bg-[#C5A059]/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">🏆</span>
        </div>
        <h2 className="text-4xl font-bold serif text-slate-900 mb-4">Training Complete</h2>
        <div className="text-7xl font-bold text-[#C5A059] mb-4">
          {score} <span className="text-3xl text-slate-300">/ {questions.length}</span>
        </div>
        <p className="text-slate-500 mb-10 text-lg">Your academic performance has been recorded.</p>
        <button 
          onClick={() => onComplete(score)}
          className="w-full py-5 bg-slate-900 text-[#C5A059] font-bold rounded-2xl shadow-xl hover:bg-slate-800 transition-all border border-[#C5A059]/50"
        >
          Return to Atelier
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Visual Score Bar at the Top */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#C5A059]/10">
        <div className="flex justify-between items-center mb-2 px-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#C5A059]">Accuracy Score</span>
          <span className="text-sm font-bold text-slate-800">{score} Points</span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-[#C5A059] to-[#D4AF37] shadow-[0_0_10px_rgba(197,160,89,0.4)] transition-all duration-700 ease-out" 
            style={{ width: `${(score / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Progress Info */}
      <div className="flex justify-between items-center px-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-[#C5A059] rounded-full animate-pulse"></span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Question {currentIndex + 1} of {questions.length}</span>
        </div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          Module: {currentQuestion.type === 'MCQ' ? 'Lexical Recognition' : 'Written Recall'}
        </div>
      </div>

      <div className={`relative p-10 bg-white border-2 rounded-3xl shadow-xl transition-all duration-300 ${feedback === 'CORRECT' ? 'border-emerald-500 shadow-emerald-50 bg-emerald-50/5' : feedback === 'WRONG' ? 'border-rose-500 shadow-rose-50 bg-rose-50/5' : 'border-[#C5A059]/20'}`}>
        
        {/* Instant Feedback Overlay Icons */}
        {feedback === 'CORRECT' && (
          <div className="absolute top-4 right-4 text-emerald-500 text-2xl animate-bounce">✓</div>
        )}
        {feedback === 'WRONG' && (
          <div className="absolute top-4 right-4 text-rose-500 text-2xl animate-pulse">✕</div>
        )}

        <div className="text-center mb-10">
          <h2 className="text-5xl font-bold serif text-slate-800 mb-3 tracking-tight">{currentQuestion.word.term}</h2>
          <div className="inline-block px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold uppercase tracking-tighter text-slate-500">
             Band {currentQuestion.word.bandLevel}
          </div>
        </div>

        {currentQuestion.type === 'MCQ' ? (
          <div className="grid grid-cols-1 gap-3">
            {currentQuestion.options?.map((opt, idx) => (
              <button
                key={idx}
                disabled={!!feedback}
                onClick={() => handleAnswer(opt)}
                className={`group p-5 rounded-xl border-2 text-left transition-all font-medium text-lg relative overflow-hidden
                  ${feedback 
                    ? (opt === currentQuestion.word.vietnameseTranslation 
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                      : (feedback === 'WRONG' && normalizeString(opt) === normalizeString(userInput) ? 'bg-rose-50 border-rose-500 text-rose-700' : 'bg-white border-slate-100 opacity-40')) 
                    : 'border-slate-100 bg-white hover:border-[#C5A059] hover:bg-[#FAF8F4] text-slate-700 active:scale-[0.98]'}
                `}
              >
                <div className="flex justify-between items-center relative z-10">
                  <span>{opt}</span>
                  {!feedback && <span className="text-slate-200 group-hover:text-[#C5A059] transition-colors">→</span>}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                autoFocus
                disabled={!!feedback}
                className={`w-full p-6 text-2xl font-serif text-center bg-slate-50 rounded-2xl border-2 outline-none transition-all
                  ${feedback === 'CORRECT' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : feedback === 'WRONG' ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-100 focus:border-[#C5A059] focus:bg-white'}
                `}
                placeholder="Type translation..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAnswer(userInput)}
              />
            </div>
            {feedback === 'WRONG' && (
              <div className="text-center animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-rose-600 font-bold mb-1">Lexical Error</p>
                <p className="text-slate-500">Accurate translation: <span className="text-emerald-600 font-bold underline decoration-[#C5A059]/30 underline-offset-4">{currentQuestion.word.vietnameseTranslation}</span></p>
              </div>
            )}
            {!feedback && (
              <p className="text-center text-[10px] text-slate-300 uppercase font-bold tracking-[0.2em] animate-pulse">Press Enter to Validate</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LearnMode;
