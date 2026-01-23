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

      // THE FIX: Access the API key using Vite's environment variable system
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
        - term: The English word
        - vietnameseTranslation: Accurate Vietnamese equivalent
        - definition: High-level academic English definition
        - example: Sophisticated sentence showing usage
        - bandLevel: (e.g., Band 7.5)
        - collocations: (Array of 3 common academic word partners)

        Return ONLY the JSON array.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Clean the response in case the AI wraps it in markdown code blocks
      const cleanJson = text.replace(/```json|```/g, "").trim();
      const generatedWords = JSON.parse(cleanJson).map((w: any) => ({
        ...w,
        id: w.id || Math.random().toString(36).substr(2, 9)
      }));

      if (generatedWords.length === 0) throw new Error("No academic terms detected.");
      
      onImport(generatedWords, setName);
    } catch (error: any) {
