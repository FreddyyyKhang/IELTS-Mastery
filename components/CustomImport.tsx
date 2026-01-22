
import React, { useState, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { IELTSWord, WordSet } from '../types';

interface CustomImportProps {
  savedSets: WordSet[];
  onImport: (words: IELTSWord[], name: string) => void;
  onDeleteSet: (id: string) => void;
  onApplySet: (words: IELTSWord[]) => void;
  onCancel: () => void;
}

type ImportMethod = 'MANUAL' | 'VAULT';

const CustomImport: React.FC<CustomImportProps> = ({ savedSets, onImport, onDeleteSet, onApplySet, onCancel }) => {
  const [method, setMethod] = useState<ImportMethod>('MANUAL');
  const [setName, setSetName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [manualMode, setManualMode] = useState<'BULK' | 'SINGLE'>('BULK');
  
  const [bulkText, setBulkText] = useState('');
  const [singleWord, setSingleWord] = useState({ term: '', translation: '' });

  const handleGenerate = async () => {
    if (!setName.trim()) {
      alert("Please provide a name for this scholarly archive.");
      return;
    }

    setIsLoading(true);
    let contentToProcess = "";

    try {
      if (manualMode === 'BULK') {
        if (!bulkText.trim()) throw new Error("Please provide vocabulary text.");
        contentToProcess = bulkText;
      } else {
        if (!singleWord.term.trim()) throw new Error("Please provide a term.");
        contentToProcess = `WORD: ${singleWord.term} | TRANS: ${singleWord.translation}`;
      }

      setLoadingStep('Gemini AI is analyzing your lexical data...');
      const ai = new GoogleGenAI({ apiKey: (process.env as any).API_KEY });
      
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: `You are an elite IELTS tutor. I have a list or text: "${contentToProcess.substring(0, 15000)}".
        
        TASK:
        1. Smart Scan: If the text contains pairs like "mitigate: giảm nhẹ", extract them exactly.
        2. Contextual Enrichment: If the text is raw sentences, identify the most critical IELTS Band 7.0+ terms and translate them to Vietnamese.
        
        For each entry, generate a complete academic card:
        - term: The English word
        - vietnameseTranslation: Accurate Vietnamese equivalent
        - definition: High-level academic English definition
        - example: Sophisticated sentence showing usage
        - bandLevel: (e.g., Band 7.5)
        - collocations: (Array of 3 common academic word partners)

        Return purely as a JSON array.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                term: { type: Type.STRING },
                vietnameseTranslation: { type: Type.STRING },
                definition: { type: Type.STRING },
                example: { type: Type.STRING },
                bandLevel: { type: Type.STRING },
                collocations: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ["term", "vietnameseTranslation", "definition", "example", "bandLevel", "collocations"],
            },
          },
        },
      });

      const generatedWords = JSON.parse(response.text || "[]").map((w: any) => ({
        ...w,
        id: w.id || Math.random().toString(36).substr(2, 9)
      }));

      if (generatedWords.length === 0) throw new Error("No academic terms detected.");
      
      onImport(generatedWords, setName);
    } catch (error: any) {
      console.error("AI Processing Error:", error);
      alert(error.message || "Failed to process entry.");
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white border-2 border-[#C5A059]/30 rounded-3xl shadow-2xl animate-in fade-in duration-500">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold serif text-slate-900 mb-2">The Academic Vault</h2>
        <p className="text-slate-500">A refined repository for manual lexical entries and saved academic sets.</p>
      </div>

      <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
        <button 
          onClick={() => setMethod('MANUAL')}
          className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${method === 'MANUAL' ? 'bg-white text-[#C5A059] shadow-md' : 'text-slate-500'}`}
        >
          ✍️ Manual Entry
        </button>
        <button 
          onClick={() => setMethod('VAULT')}
          className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${method === 'VAULT' ? 'bg-white text-[#C5A059] shadow-md' : 'text-slate-500'}`}
        >
          🏛️ Saved Archives
        </button>
      </div>

      <div className="mb-10 min-h-[350px]">
        {method === 'VAULT' ? (
          <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2">
            {savedSets.length === 0 ? (
              <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                <span className="text-5xl block mb-4 opacity-20">🏺</span>
                <p className="text-slate-400 font-medium italic">Your vault is currently empty.</p>
              </div>
            ) : (
              savedSets.map((set) => (
                <div key={set.id} className="p-5 bg-white border border-[#C5A059]/20 rounded-2xl flex items-center justify-between hover:border-[#C5A059] transition-all shadow-sm group">
                  <div>
                    <h3 className="font-bold text-slate-800 serif text-lg">{set.name}</h3>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1">
                      {set.words.length} Vocabulary Items • {new Date(set.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onApplySet(set.words)}
                      className="px-5 py-2.5 bg-[#C5A059] text-white text-xs font-bold rounded-xl hover:bg-[#B38D45] active:scale-95 transition-transform"
                    >
                      Study Set
                    </button>
                    <button 
                      onClick={() => onDeleteSet(set.id)}
                      className="p-2.5 text-rose-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#C5A059] ml-1">Archive Identifier</label>
              <input
                type="text"
                className="w-full p-4 bg-slate-50 border-2 border-[#C5A059]/10 rounded-xl focus:border-[#C5A059] focus:bg-white outline-none transition-all text-slate-700 font-medium"
                placeholder="e.g. Cambridge 18 Reading Vocabulary"
                value={setName}
                onChange={(e) => setSetName(e.target.value)}
              />
            </div>

            <div className="space-y-6">
              <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
                 <button onClick={() => setManualMode('BULK')} className={`px-4 py-2 text-[10px] font-bold uppercase rounded-lg transition-all ${manualMode === 'BULK' ? 'bg-white text-[#C5A059] shadow-sm' : 'text-slate-400'}`}>Bulk List</button>
                 <button onClick={() => setManualMode('SINGLE')} className={`px-4 py-2 text-[10px] font-bold uppercase rounded-lg transition-all ${manualMode === 'SINGLE' ? 'bg-white text-[#C5A059] shadow-sm' : 'text-slate-400'}`}>Individual</button>
              </div>
              
              {manualMode === 'BULK' ? (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Paste your list or article text below</label>
                  <textarea
                    className="w-full h-56 p-5 bg-slate-50 border-2 border-[#C5A059]/10 rounded-2xl focus:border-[#C5A059] outline-none transition-all resize-none text-slate-700 font-serif leading-relaxed"
                    placeholder="Copy and paste a list of words with Vietnamese translation and let AI rearrange it for you&#10;&#10;If you want a more accurate result, follow this format:&#10;Apple: Quả táo&#10;Banana: Quả chuối"
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">English Term</label>
                    <input
                      type="text"
                      className="w-full p-4 bg-slate-50 border-2 border-[#C5A059]/10 rounded-xl outline-none focus:border-[#C5A059]"
                      placeholder="e.g. Scrutinize"
                      value={singleWord.term}
                      onChange={(e) => setSingleWord({...singleWord, term: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Vietnamese Translation (Optional)</label>
                    <input
                      type="text"
                      className="w-full p-4 bg-slate-50 border-2 border-[#C5A059]/10 rounded-xl outline-none focus:border-[#C5A059]"
                      placeholder="e.g. Xem xét kỹ lưỡng"
                      value={singleWord.translation}
                      onChange={(e) => setSingleWord({...singleWord, translation: e.target.value})}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {isLoading && (
        <div className="mb-8 text-center animate-in zoom-in">
          <div className="inline-block w-10 h-10 border-4 border-[#C5A059] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-[#C5A059] font-bold serif italic text-lg tracking-wide">{loadingStep}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={onCancel}
          className="flex-1 py-4 rounded-2xl border-2 border-slate-100 text-slate-400 font-bold hover:bg-slate-50 transition-all uppercase text-[10px] tracking-widest"
          disabled={isLoading}
        >
          Return to Dashboard
        </button>
        {method !== 'VAULT' && (
          <button
            onClick={handleGenerate}
            disabled={isLoading || (manualMode === 'BULK' ? !bulkText.trim() : !singleWord.term.trim())}
            className="flex-[2] py-4 rounded-2xl bg-slate-900 text-[#C5A059] font-bold shadow-xl hover:bg-slate-800 transition-all disabled:opacity-30 uppercase text-[10px] tracking-widest border border-[#C5A059]/40"
          >
            Authenticate & Archive
          </button>
        )}
      </div>
    </div>
  );
};

export default CustomImport;
