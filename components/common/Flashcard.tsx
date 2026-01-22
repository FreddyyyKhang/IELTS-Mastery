
import React, { useState } from 'react';
import { IELTSWord } from '../../types';

interface FlashcardProps {
  word: IELTSWord;
  onKnown?: () => void;
  onLearning?: () => void;
  showActions?: boolean;
}

const Flashcard: React.FC<FlashcardProps> = ({ word, onKnown, onLearning, showActions = true }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto">
      <div 
        className="w-full aspect-[4/3] perspective-1000 cursor-pointer group"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className={`relative w-full h-full text-center transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          
          {/* Front Side */}
          <div className="absolute inset-0 backface-hidden flex flex-col items-center justify-center p-8 bg-white border-2 border-[#C5A059]/30 rounded-2xl shadow-xl">
            <span className="text-xs uppercase tracking-widest text-slate-400 mb-2">IELTS Band {word.bandLevel}</span>
            <h2 className="text-4xl font-bold text-slate-800 mb-2 serif tracking-tight">{word.term}</h2>
            <div className="mt-8 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 text-sm">
              Click to flip for meaning
            </div>
          </div>

          {/* Back Side */}
          <div className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col items-center justify-start p-8 bg-[#FAF8F4] border-2 border-[#C5A059]/60 rounded-2xl shadow-xl overflow-y-auto">
            <div className="w-full text-center mb-4">
              <h2 className="text-2xl font-bold text-slate-800 serif">{word.term}</h2>
              <p className="text-[#C5A059] font-medium text-lg mt-1 italic">{word.vietnameseTranslation}</p>
            </div>

            <div className="w-full border-t border-[#C5A059]/10 pt-4 mb-4">
              <h3 className="text-slate-400 uppercase tracking-widest text-[10px] font-bold mb-1">English Definition</h3>
              <p className="text-slate-700 text-sm leading-relaxed">{word.definition}</p>
            </div>
            
            <div className="w-full mb-4">
              <h3 className="text-slate-400 uppercase tracking-widest text-[10px] font-bold mb-1">Contextual Example</h3>
              <p className="text-slate-800 italic text-sm leading-relaxed bg-white/50 p-3 rounded-lg border border-slate-100">
                "{word.example}"
              </p>
            </div>

            <div className="w-full">
              <h3 className="text-slate-400 uppercase tracking-widest text-[10px] font-bold mb-2">Academic Collocations</h3>
              <div className="flex flex-wrap gap-1.5">
                {word.collocations.map((col, idx) => (
                  <span key={idx} className="px-2 py-0.5 bg-white border border-[#C5A059]/20 text-[10px] text-slate-500 rounded-md font-medium">
                    {col}
                  </span>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {showActions && (
        <div className="flex gap-4 w-full">
          <button 
            onClick={(e) => { e.stopPropagation(); onLearning?.(); }}
            className="flex-1 py-3 px-6 rounded-xl border-2 border-orange-200 text-orange-700 font-semibold hover:bg-orange-50 transition-colors bg-white shadow-sm"
          >
            Needs Practice
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onKnown?.(); }}
            className="flex-1 py-3 px-6 rounded-xl border-2 border-emerald-200 text-emerald-700 font-semibold hover:bg-emerald-50 transition-colors bg-white shadow-sm"
          >
            I Know This
          </button>
        </div>
      )}
    </div>
  );
};

export default Flashcard;
