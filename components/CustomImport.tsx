import React, { useState } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
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

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("API Key not found. Please add VITE_GEMINI_API_KEY to your Vercel Environment Variables.");
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = `You are an elite IELTS tutor. I have a list or text: "${contentToProcess.substring(0, 15000)}".
        TASK:
        1. Smart Scan: If the text contains pairs like "mitigate: giảm nhẹ", extract them exactly.
        2. Contextual Enrichment: If the text is raw sentences, identify the most critical IELTS Band 7.0+ terms and translate them to Vietnamese.
        
        For each entry, generate a complete academic card in JSON format:
        - term, vietnameseTranslation, definition, example, bandLevel, collocations (Array of 3).
        Return ONLY the JSON array.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const cleanJson = text.replace(/```json|```/g, "").trim();
      const generatedWords = JSON.parse(cleanJson).map((w: any) => ({
        ...w,
        id: w.id || Math.random().toString(36).substr(2, 9)
      }));

      onImport(generatedWords, setName);
    } catch (error: any) {
      console.error("AI Error:", error);
      alert(error.message || "Failed to process entry.");
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white border-2 border-[#C5A059]/30 rounded-3xl shadow-2xl">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold serif text-slate-900">The Academic Vault</h2>
        <p className="text-slate-500">Manual lexical entries and saved archives.</p>
      </div>

      <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
        <button onClick={() => setMethod('MANUAL')} className={`flex-1 py-3 text-xs font-bold rounded-xl ${method === 'MANUAL' ? 'bg-white text-[#C5A059] shadow-md' : 'text-slate-500'}`}>✍️ Manual Entry</button>
        <button onClick={() => setMethod('VAULT')} className={`flex-1 py-3 text-xs font-bold rounded-xl ${method === 'VAULT' ? 'bg-white text-[#C5A059] shadow-md' : 'text-slate-500'}`}>🏛️ Vault</button>
      </div>

      <div className="mb-10">
        {method === 'VAULT' ? (
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {savedSets.length === 0 ? <p className="text-center text-slate-400">Your vault is empty.</p> : savedSets.map((set) => (
              <div key={set.id} className="p-4 bg-white border rounded-xl flex items-center justify-between">
                <div><h3 className="font-bold serif">{set.name}</h3><p className="text-[10px] text-slate-400">{set.words.length} words</p></div>
                <button onClick={() => onApplySet(set.words)} className="px-4 py-2 bg-[#C5A059] text-white text-xs font-bold rounded-lg">Study</button>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <input type="text" className="w-full p-4 bg-slate-50 border rounded-xl" placeholder="Archive Name" value={setName} onChange={(e) => setSetName(e.target.value)} />
            <textarea className="w-full h-48 p-4 bg-slate-50 border rounded-xl" placeholder="Paste words here..." value={bulkText} onChange={(e) => setBulkText(e.target.value)} />
          </div>
        )}
      </div>

      {isLoading && <p className="text-center text-[#C5A059] animate-pulse mb-4">{loadingStep}</p>}

      <div className="flex gap-4">
        <button onClick={onCancel} className="flex-1 py-4 border rounded-xl text-slate-400 font-bold uppercase text-[10px]">Back</button>
        <button onClick={handleGenerate} disabled={isLoading} className="flex-[2] py-4 bg-slate-900 text-[#C5A059] font-bold rounded-xl uppercase text-[10px]">Import with AI</button>
      </div>
    </div>
  );
};

export default CustomImport;
