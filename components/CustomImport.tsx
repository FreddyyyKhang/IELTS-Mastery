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

const CustomImport: React.FC<CustomImportProps> = ({ savedSets, onImport, onDeleteSet, onApplySet, onCancel }) => {
  const [method, setMethod] = useState<'MANUAL' | 'VAULT'>('MANUAL');
  const [setName, setSetName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [bulkText, setBulkText] = useState('');

  const handleGenerate = async () => {
    if (!setName.trim() || !bulkText.trim()) {
      alert("Please provide both a name and text.");
      return;
    }

    setIsLoading(true);
    setLoadingStep('Connecting to Academic Engine...');

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key missing. Check Vercel Environment Variables.");

      const genAI = new GoogleGenerativeAI(apiKey);
      // FIXED: Use the specific, stable version to avoid 404
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b" });
      
      const prompt = `Act as an IELTS Band 9 tutor. Extract high-impact vocabulary from: "${bulkText.substring(0, 8000)}". 
      Return ONLY a JSON array of objects with: term, vietnameseTranslation, definition, example, bandLevel, collocations.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const cleanJson = text.replace(/```json|```/g, "").trim();
      
      const generatedWords = JSON.parse(cleanJson).map((w: any) => ({
        ...w,
        id: Math.random().toString(36).substr(2, 9)
      }));

      onImport(generatedWords, setName);
    } catch (error: any) {
      console.error("AI Error:", error);
      alert(`Connection Error: ${error.message}. Ensure your API key is active.`);
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white border-2 border-[#C5A059]/30 rounded-3xl shadow-2xl">
      <h2 className="text-3xl font-bold serif text-center mb-8">The Academic Vault</h2>
      <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
        <button onClick={() => setMethod('MANUAL')} className={`flex-1 py-3 text-xs font-bold rounded-xl ${method === 'MANUAL' ? 'bg-white shadow-md' : ''}`}>✍️ Manual</button>
        <button onClick={() => setMethod('VAULT')} className={`flex-1 py-3 text-xs font-bold rounded-xl ${method === 'VAULT' ? 'bg-white shadow-md' : ''}`}>🏛️ Vault</button>
      </div>

      {method === 'MANUAL' ? (
        <div className="space-y-6">
          <input type="text" className="w-full p-4 bg-slate-50 border rounded-xl" placeholder="Archive Name" value={setName} onChange={(e) => setSetName(e.target.value)} />
          <textarea className="w-full h-48 p-4 bg-slate-50 border rounded-xl resize-none" placeholder="Paste IELTS text here..." value={bulkText} onChange={(e) => setBulkText(e.target.value)} />
        </div>
      ) : (
        <div className="space-y-4">
          {savedSets.length === 0 ? <p className="text-center text-slate-400 py-10">Vault is empty.</p> : savedSets.map(set => (
            <div key={set.id} className="p-4 border rounded-xl flex justify-between items-center">
              <span className="font-bold serif">{set.name}</span>
              <button onClick={() => onApplySet(set.words)} className="px-4 py-2 bg-[#C5A059] text-white text-xs rounded-lg font-bold">Study</button>
            </div>
          ))}
        </div>
      )}

      {isLoading && <p className="text-center text-[#C5A059] font-bold italic mt-4 animate-pulse">{loadingStep}</p>}

      <div className="flex gap-4 mt-8">
        <button onClick={onCancel} className="flex-1 py-4 border rounded-xl uppercase text-[10px] font-bold">Back</button>
        {method === 'MANUAL' && (
          <button onClick={handleGenerate} disabled={isLoading} className="flex-[2] py-4 bg-slate-900 text-[#C5A059] rounded-xl font-bold uppercase text-[10px]">Import with AI</button>
        )}
      </div>
    </div>
  );
};

export default CustomImport;
