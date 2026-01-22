
import React, { useState, useEffect } from 'react';
import { STUDY_SET } from './data/studySet';
import { StudyMode, UserStats, IELTSWord, WordSet } from './types';
import Flashcard from './components/common/Flashcard';
import LearnMode from './components/LearnMode';
import CustomImport from './components/CustomImport';

const App: React.FC = () => {
  const [mode, setMode] = useState<StudyMode>('DASHBOARD');
  const [activeWords, setActiveWords] = useState<IELTSWord[] | null>(null);
  const [savedSets, setSavedSets] = useState<WordSet[]>([]);
  const [stats, setStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('ielts_stats');
    return saved ? JSON.parse(saved) : {
      gold: 500,
      masteredCount: 0,
      learningCount: 0,
      lastScore: null
    };
  });

  const [currentIndex, setCurrentIndex] = useState(0);

  // Load saved sets from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('ielts_vault');
    if (saved) {
      setSavedSets(JSON.parse(saved));
    }
    
    // Auto-load last active words if they exist
    const lastActive = localStorage.getItem('ielts_active_words');
    if (lastActive) {
      const words = JSON.parse(lastActive);
      setActiveWords(words);
      setStats(prev => ({ ...prev, learningCount: words.length }));
    }
  }, []);

  // Persist stats and active words
  useEffect(() => {
    localStorage.setItem('ielts_stats', JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    if (activeWords) {
      localStorage.setItem('ielts_active_words', JSON.stringify(activeWords));
    }
  }, [activeWords]);

  const handleImport = (newWords: IELTSWord[], setName?: string) => {
    const finalName = setName || `Imported Set ${new Date().toLocaleDateString()}`;
    const newSet: WordSet = {
      id: Date.now().toString(),
      name: finalName,
      words: newWords,
      createdAt: Date.now()
    };

    const updatedSets = [newSet, ...savedSets];
    setSavedSets(updatedSets);
    localStorage.setItem('ielts_vault', JSON.stringify(updatedSets));
    
    setActiveWords(newWords);
    setStats(prev => ({ ...prev, learningCount: newWords.length, masteredCount: 0 }));
    setCurrentIndex(0);
    setMode('FLASHCARDS');
  };

  const handleDeleteSet = (id: string) => {
    const updatedSets = savedSets.filter(s => s.id !== id);
    setSavedSets(updatedSets);
    localStorage.setItem('ielts_vault', JSON.stringify(updatedSets));
  };

  const handleApplySet = (words: IELTSWord[]) => {
    setActiveWords(words);
    setStats(prev => ({ ...prev, learningCount: words.length, masteredCount: 0 }));
    setCurrentIndex(0);
    setMode('FLASHCARDS');
  };

  const handleLearnComplete = (score: number) => {
    setStats(prev => ({ 
      ...prev, 
      lastScore: score,
      gold: prev.gold + (score * 10) 
    }));
    setMode('DASHBOARD');
  };

  const renderContent = () => {
    switch (mode) {
      case 'CUSTOM_IMPORT':
        return (
          <CustomImport 
            savedSets={savedSets}
            onImport={handleImport} 
            onDeleteSet={handleDeleteSet}
            onApplySet={handleApplySet}
            onCancel={() => setMode('DASHBOARD')} 
          />
        );
      case 'LEARN':
        if (!activeWords || activeWords.length === 0) {
          return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-3xl">⚠️</div>
              <h2 className="text-2xl font-bold serif text-slate-800">No Vocabulary Loaded</h2>
              <p className="text-slate-500 max-w-sm">Please import a document or use a sample set to begin training.</p>
              <div className="flex gap-4">
                 <button onClick={() => handleApplySet(STUDY_SET)} className="px-6 py-3 bg-[#C5A059] text-white font-bold rounded-xl shadow-lg">Use Sample Set</button>
                 <button onClick={() => setMode('CUSTOM_IMPORT')} className="px-6 py-3 bg-white text-slate-800 border-2 border-slate-100 font-bold rounded-xl">Go to Vault</button>
              </div>
            </div>
          );
        }
        return <LearnMode words={activeWords} onComplete={handleLearnComplete} />;
      case 'FLASHCARDS':
        if (!activeWords || activeWords.length === 0) {
          return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-3xl">🎴</div>
              <h2 className="text-2xl font-bold serif text-slate-800">Empty Flashcard Deck</h2>
              <p className="text-slate-500 max-w-sm">How would you like to populate your study session?</p>
              <div className="flex flex-col sm:flex-row gap-4">
                 <button 
                  onClick={() => handleApplySet(STUDY_SET)} 
                  className="px-6 py-4 bg-[#C5A059] text-white font-bold rounded-2xl shadow-lg hover:-translate-y-1 transition-transform"
                >
                  ✨ Random Sample Words
                </button>
                 <button 
                  onClick={() => setMode('CUSTOM_IMPORT')} 
                  className="px-6 py-4 bg-white text-slate-800 border-2 border-[#C5A059]/30 font-bold rounded-2xl hover:shadow-xl transition-all"
                >
                  📂 Import My Documents
                </button>
              </div>
            </div>
          );
        }
        return (
          <div className="py-12">
            <div className="flex items-center justify-between mb-8 max-w-md mx-auto">
              <button 
                onClick={() => setMode('CUSTOM_IMPORT')}
                className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#C5A059] border border-[#C5A059]/30 rounded-full hover:bg-[#C5A059]/5 transition-colors"
              >
                + Vault / Import
              </button>
              <button 
                onClick={() => { setActiveWords(STUDY_SET); setCurrentIndex(0); }}
                className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
              >
                Sample Set
              </button>
            </div>
            <div className="flex items-center justify-between mb-12 max-w-md mx-auto">
              <button 
                onClick={() => setCurrentIndex(c => Math.max(0, c - 1))}
                className="p-3 bg-white rounded-full shadow-md hover:bg-slate-50 disabled:opacity-30"
                disabled={currentIndex === 0}
              >
                ←
              </button>
              <span className="text-slate-400 font-medium">Card {currentIndex + 1} of {activeWords.length}</span>
              <button 
                onClick={() => setCurrentIndex(c => Math.min(activeWords.length - 1, c + 1))}
                className="p-3 bg-white rounded-full shadow-md hover:bg-slate-50 disabled:opacity-30"
                disabled={currentIndex === activeWords.length - 1}
              >
                →
              </button>
            </div>
            <Flashcard 
              word={activeWords[currentIndex]} 
              onKnown={() => {
                setStats(s => ({ ...s, masteredCount: s.masteredCount + 1, learningCount: Math.max(0, s.learningCount - 1) }));
                if (currentIndex < activeWords.length - 1) setCurrentIndex(c => c + 1);
              }}
              onLearning={() => {
                if (currentIndex < activeWords.length - 1) setCurrentIndex(c => c + 1);
              }}
            />
          </div>
        );
      case 'DASHBOARD':
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <header className="col-span-full mb-8">
              <h1 className="text-5xl font-bold serif text-slate-900 mb-2">IELTS Mastery</h1>
              <p className="text-slate-500 text-lg">Your premier academic vocabulary atelier.</p>
            </header>

            <div className="col-span-full lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
               {[
                 { id: 'FLASHCARDS', title: 'Review Cards', desc: 'Browse your vocabulary with 3D flashcards.', icon: '🎴' },
                 { id: 'LEARN', title: 'Interactive Training', desc: 'Assess your knowledge with smart quizzes.', icon: '🧠' },
                 { id: 'CUSTOM_IMPORT', title: 'Document Vault', desc: 'Manage saved sets and extract new ones.', icon: '📄' },
               ].map((m) => (
                 <button 
                  key={m.id}
                  onClick={() => setMode(m.id as StudyMode)}
                  className={`group p-6 rounded-2xl border-2 transition-all text-left flex flex-col justify-between h-48 border-[#C5A059]/20 bg-white hover:border-[#C5A059] hover:shadow-xl hover:-translate-y-1`}
                 >
                   <span className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{m.icon}</span>
                   <div>
                     <h3 className="text-xl font-bold text-slate-800 serif">{m.title}</h3>
                     <p className="text-sm text-slate-500">{m.desc}</p>
                   </div>
                 </button>
               ))}
               <div className="p-6 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col justify-center items-center text-center">
                  <span className="text-slate-300 text-3xl mb-2">⚓</span>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Active Words: {activeWords ? activeWords.length : 0}</p>
               </div>
            </div>

            <aside className="space-y-6">
              <div className="bg-[#FAF8F4] p-6 rounded-2xl border-2 border-dashed border-[#C5A059]/40 shadow-sm">
                <h3 className="serif text-xl mb-4 text-slate-800 flex items-center gap-2">
                   <span className="text-[#C5A059]">⚖️</span> Academic Counsel
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed italic">
                  "Precision in translation and contextual use are the hallmarks of a Band 8.0 scholar. Use the Vault to curate high-impact terminology."
                </p>
                <div className="mt-6 pt-6 border-t border-[#C5A059]/10">
                   <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C5A059]">Active Session Stats</p>
                   <div className="flex justify-between mt-2">
                      <span className="text-xs text-slate-400">Total Terms</span>
                      <span className="text-xs font-bold text-slate-700">{activeWords ? activeWords.length : 0}</span>
                   </div>
                </div>
              </div>
            </aside>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F8F5F0]">
      {/* Sidebar */}
      <nav className="w-20 md:w-64 bg-slate-900 flex-shrink-0 flex flex-col border-r border-[#C5A059]/20">
        <div className="p-6">
          <div className="w-12 h-12 bg-[#C5A059] rounded-xl flex items-center justify-center text-white text-2xl font-bold mb-8">IM</div>
        </div>
        <div className="flex-1 px-4 space-y-4">
          {[
            { id: 'DASHBOARD', icon: '🏠', label: 'Dashboard' },
            { id: 'FLASHCARDS', icon: '🎴', label: 'Flashcards' },
            { id: 'LEARN', icon: '🧠', label: 'Training' },
            { id: 'CUSTOM_IMPORT', icon: '📄', label: 'Vault' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setMode(item.id as StudyMode)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl transition-colors ${mode === item.id ? 'bg-[#C5A059] text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="hidden md:block font-medium">{item.label}</span>
            </button>
          ))}
        </div>
        <div className="p-6 border-t border-slate-800 mt-auto">
           <div className="hidden md:block">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Scholar Profile</p>
              <p className="text-slate-200 font-semibold truncate">Academic User</p>
           </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto p-8 md:p-12">
        <div className="max-w-6xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
