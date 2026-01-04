import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { generateText, languages } from '../data/languages'
import { generateNumbers } from '../data/numbers'
import LanguageSelector from '../components/LanguageSelector'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts'

const TIME_LIMIT = 60; // 60 secondes

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function Solo() {
  const [selectedLang, setSelectedLang] = useState('en');
  const [mode, setMode] = useState('words'); // 'words' or 'numbers'
  const [text, setText] = useState('');
  const [input, setInput] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [stats, setStats] = useState({ wpm: 0, accuracy: 100, time: 0, chars: 0 });
  const [finished, setFinished] = useState(false);
  const [errors, setErrors] = useState(0);
  const [timeSeries, setTimeSeries] = useState([]); // Pour les graphiques
  const [totalWords, setTotalWords] = useState(0);
  const inputRef = useRef(null);
  const intervalRef = useRef(null);
  const textContainerRef = useRef(null);
  const matchRecordedRef = useRef(false); // Pour éviter d'enregistrer plusieurs fois

  useEffect(() => {
    if (mode === 'numbers') {
      setText(generateNumbers(200));
    } else {
      setText(generateText(selectedLang, 200)); // Plus de texte pour 60 secondes
    }
    setInput('');
    setStartTime(null);
    setStats({ wpm: 0, accuracy: 100, time: 0, chars: 0 });
    setFinished(false);
    setErrors(0);
    setTimeLeft(TIME_LIMIT);
    setTimeSeries([]);
    setTotalWords(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [selectedLang, mode]);

  useEffect(() => {
    if (inputRef.current && !finished && timeLeft === TIME_LIMIT) {
      inputRef.current.focus();
    }
  }, [finished, text, timeLeft]);

  // Timer pour les 60 secondes
  useEffect(() => {
    if (startTime && !finished && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setFinished(true);
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [startTime, finished, timeLeft]);

  // Enregistrer le match solo quand c'est terminé
  useEffect(() => {
    if (finished && !matchRecordedRef.current && stats.wpm > 0) {
      matchRecordedRef.current = true;
      const token = localStorage.getItem('token');
      if (token) {
        // Enregistrer le match solo (seulement en mode words pour avoir une langue)
        if (mode === 'words') {
          fetch(`${API_URL}/api/matches/solo`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              wpm: stats.wpm,
              accuracy: stats.accuracy,
              language: selectedLang
            })
          }).catch(error => {
            console.error('Error recording solo match:', error);
          });
        }
      }
    }
  }, [finished, stats.wpm, stats.accuracy, selectedLang, mode]);

  const handleInputChange = (e) => {
    if (finished) return;
    
    const value = e.target.value;
    
    if (!startTime && value.length > 0) {
      setStartTime(Date.now());
    }

    // Générer plus de texte si nécessaire
    if (value.length >= text.length - 50) {
      const additionalText = mode === 'numbers' ? generateNumbers(50) : generateText(selectedLang, 50);
      setText(text + ' ' + additionalText);
    }

    if (value.length <= text.length) {
      setInput(value);
      
      // Calculer les erreurs
      let errorCount = 0;
      for (let i = 0; i < value.length; i++) {
        if (value[i] !== text[i]) {
          errorCount++;
        }
      }
      setErrors(errorCount);

      // Calculer les stats
      if (startTime) {
        const timeElapsed = (TIME_LIMIT - timeLeft) / 60; // en minutes
        
        // Calcul du WPM standard : (caractères tapés / 5) / temps en minutes
        // Cette méthode est plus stable et ne diminue pas quand on fait des erreurs
        // On compte tous les caractères tapés (y compris les erreurs)
        const charactersTyped = value.length;
        const wpm = timeElapsed > 0 ? Math.round((charactersTyped / 5) / timeElapsed) : 0;
        
        // Compter les mots pour l'affichage (utilisé pour totalWords)
        // On compte les mots complétés correctement pour l'affichage final
        let wordsTyped = 0;
        const textWords = text.trim().split(/\s+/).filter(w => w.length > 0);
        let correctChars = 0;
        
        // Compter les caractères corrects tapés
        for (let i = 0; i < Math.min(value.length, text.length); i++) {
          if (value[i] === text[i]) {
            correctChars++;
          }
        }
        
        // Estimer les mots complétés basés sur les caractères corrects
        // En moyenne, un mot fait 5 caractères, donc on divise par 5
        wordsTyped = Math.floor(correctChars / 5);
        const accuracy = value.length > 0 
          ? Math.round(((value.length - errorCount) / value.length) * 100)
          : 100;
        
        setStats({ 
          wpm, 
          accuracy, 
          time: TIME_LIMIT - timeLeft, 
          chars: value.length 
        });
        setTotalWords(wordsTyped);

        // Enregistrer les stats chaque seconde pour le graphique
        const currentSecond = TIME_LIMIT - timeLeft;
        setTimeSeries((prev) => {
          const existing = prev.findIndex((item) => item.second === currentSecond);
          const newData = { second: currentSecond, wpm, accuracy };
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = newData;
            return updated;
          }
          return [...prev, newData].sort((a, b) => a.second - b.second);
        });

        // Auto-scroll pour suivre la position de frappe
        if (textContainerRef.current) {
          const container = textContainerRef.current;
          const currentCharElement = container.querySelector(`span:nth-child(${value.length + 1})`);
          if (currentCharElement) {
            const containerRect = container.getBoundingClientRect();
            const charRect = currentCharElement.getBoundingClientRect();
            const charTop = charRect.top - containerRect.top + container.scrollTop;
            const charBottom = charTop + charRect.height;
            
            // Scroll si le caractère courant est en dehors de la zone visible
            if (charTop < container.scrollTop + 50) {
              container.scrollTop = Math.max(0, charTop - 50);
            } else if (charBottom > container.scrollTop + container.clientHeight - 50) {
              container.scrollTop = charBottom - container.clientHeight + 50;
            }
          }
        }
      }
    }
  };

  const reset = () => {
    setInput('');
    setStartTime(null);
    setStats({ wpm: 0, accuracy: 100, time: 0, chars: 0 });
    setFinished(false);
    setErrors(0);
    setTimeLeft(TIME_LIMIT);
    setTimeSeries([]);
    setTotalWords(0);
    matchRecordedRef.current = false; // Réinitialiser pour le prochain match
    if (mode === 'numbers') {
      setText(generateNumbers(200));
    } else {
      setText(generateText(selectedLang, 200));
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const renderText = () => {
    return text.split('').map((char, index) => {
      if (index < input.length) {
        const isCorrect = input[index] === char;
        return (
          <span key={index} className={isCorrect ? 'char-correct' : 'char-incorrect'}>
            {char}
          </span>
        );
      } else if (index === input.length) {
        return (
          <span key={index} className="char-current">
            {char}
          </span>
        );
      } else {
        return (
          <span key={index} className="char-pending">
            {char}
          </span>
        );
      }
    });
  };

  // Préparer les données pour le graphique
  const chartData = timeSeries.map((item) => ({
    time: item.second,
    wpm: item.wpm,
    accuracy: item.accuracy
  }));

  const averageWpm = timeSeries.length > 0 
    ? Math.round(timeSeries.reduce((sum, item) => sum + item.wpm, 0) / timeSeries.length)
    : 0;

  const averageAccuracy = timeSeries.length > 0
    ? Math.round(timeSeries.reduce((sum, item) => sum + item.accuracy, 0) / timeSeries.length)
    : 100;

  return (
    <div className="solo-container px-6 py-12 flex flex-col items-center">
      {/* Controls bar - Style minimaliste */}
      <div className="flex justify-center items-center gap-4 mb-12">
        <div className="flex gap-2 bg-bg-secondary rounded-lg p-1 border border-border-secondary">
          <button
            onClick={() => setMode('words')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === 'words'
                ? 'bg-accent-primary text-bg-primary'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Words
          </button>
          <button
            onClick={() => setMode('numbers')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === 'numbers'
                ? 'bg-accent-primary text-bg-primary'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Numbers
          </button>
        </div>
        {mode === 'words' && (
          <LanguageSelector selectedLang={selectedLang} onLanguageChange={setSelectedLang} />
        )}
      </div>

      {!finished ? (
          <div className="space-y-10 w-full">
            {/* Stats - Centré et compact (style Monkeytype) */}
            <div className="flex justify-center gap-12 text-text-primary">
              <div className="text-center">
                <div className="text-4xl font-bold mb-1" style={{ fontFamily: 'JetBrains Mono' }}>
                  {timeLeft}
                </div>
                <div className="text-text-secondary text-xs uppercase tracking-wider">seconds</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-1" style={{ fontFamily: 'JetBrains Mono' }}>{stats.wpm}</div>
                <div className="text-text-secondary text-xs uppercase tracking-wider">wpm</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-1" style={{ fontFamily: 'JetBrains Mono' }}>{stats.accuracy}%</div>
                <div className="text-text-secondary text-xs uppercase tracking-wider">accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-1" style={{ fontFamily: 'JetBrains Mono' }}>{totalWords}</div>
                <div className="text-text-secondary text-xs uppercase tracking-wider">words</div>
              </div>
            </div>

            {/* Text area - Plus grande et centrée */}
            <div 
              ref={textContainerRef}
              className="typing-text bg-bg-card p-10 sm:p-12 rounded-xl border border-border-secondary mb-6 w-full" 
              style={{ minHeight: '220px', maxHeight: '350px', overflowY: 'auto', scrollBehavior: 'smooth' }}
            >
              {renderText()}
            </div>

            {/* Input - Style minimaliste mais fonctionnel */}
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleInputChange}
              disabled={finished}
              className="w-full p-5 bg-bg-secondary/50 border border-border-secondary/50 rounded-lg text-text-primary text-xl focus:outline-none focus:border-accent-primary/50 disabled:opacity-50 placeholder:text-text-secondary/30"
              placeholder="Start typing..."
              style={{ fontFamily: 'JetBrains Mono' }}
              autoFocus
            />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Résultats finaux */}
            <div className="bg-bg-secondary rounded-lg p-10 border border-text-secondary/20 shadow-lg">
              <h2 className="text-3xl font-bold text-text-primary mb-8 text-center" style={{ fontFamily: 'Inter' }}>Test Complete</h2>
              <div className="grid grid-cols-4 gap-8 text-center">
                <div>
                  <div className="text-3xl font-bold text-text-primary mb-2" style={{ fontFamily: 'JetBrains Mono' }}>
                    {stats.wpm}
                  </div>
                  <div className="text-text-secondary text-sm">wpm</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-text-primary mb-2" style={{ fontFamily: 'JetBrains Mono' }}>
                    {averageWpm}
                  </div>
                  <div className="text-text-secondary text-sm">avg wpm</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-text-primary mb-2" style={{ fontFamily: 'JetBrains Mono' }}>
                    {stats.accuracy}%
                  </div>
                  <div className="text-text-secondary text-sm">accuracy</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-text-primary mb-2" style={{ fontFamily: 'JetBrains Mono' }}>
                    {totalWords}
                  </div>
                  <div className="text-text-secondary text-sm">words</div>
                </div>
              </div>
            </div>

            {/* Graphiques */}
            {chartData.length > 0 && (
              <div className="bg-bg-secondary rounded-lg p-10 border border-text-secondary/10 shadow-lg">
                <h3 className="text-2xl font-bold text-text-primary mb-8" style={{ fontFamily: 'Inter', letterSpacing: '-0.02em' }}>Performance Chart</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorWpm" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2188ff" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#2188ff" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#e6edf3" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#e6edf3" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#8b949e" opacity={0.2} />
                    <XAxis 
                      dataKey="time" 
                      stroke="#8b949e"
                      tick={{ fill: '#8b949e', fontSize: 12 }}
                      label={{ value: 'Time (seconds)', position: 'insideBottom', offset: -5, fill: '#8b949e', style: { fontSize: '12px' } }}
                    />
                    <YAxis 
                      yAxisId="left"
                      stroke="#2188ff"
                      tick={{ fill: '#2188ff', fontSize: 12 }}
                      label={{ value: 'WPM', angle: -90, position: 'insideLeft', fill: '#2188ff', style: { fontSize: '12px' } }}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      stroke="#e6edf3"
                      domain={[0, 100]}
                      tick={{ fill: '#e6edf3', fontSize: 12 }}
                      label={{ value: 'Accuracy (%)', angle: 90, position: 'insideRight', fill: '#e6edf3', style: { fontSize: '12px' } }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#161b22', 
                        border: '1px solid #8b949e',
                        borderRadius: '8px',
                        color: '#e6edf3',
                        padding: '12px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
                      }}
                      labelStyle={{ color: '#8b949e', marginBottom: '8px', fontSize: '12px' }}
                      itemStyle={{ padding: '4px 0', fontSize: '14px' }}
                      formatter={(value, name) => {
                        if (name === 'wpm') return [value, 'WPM'];
                        if (name === 'accuracy') return [`${value}%`, 'Accuracy'];
                        return value;
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="line"
                      formatter={(value) => <span style={{ color: '#e6edf3', fontSize: '14px' }}>{value}</span>}
                    />
                    <Area 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="wpm" 
                      stroke="#2188ff" 
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorWpm)"
                      name="WPM"
                      dot={false}
                      activeDot={{ r: 5, fill: '#2188ff', strokeWidth: 2, stroke: '#0d1117' }}
                    />
                    <Area 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="accuracy" 
                      stroke="#e6edf3" 
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorAccuracy)"
                      name="Accuracy"
                      dot={false}
                      activeDot={{ r: 5, fill: '#e6edf3', strokeWidth: 2, stroke: '#0d1117' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="text-center">
              <button
                onClick={reset}
                className="bg-accent-primary hover:bg-accent-hover text-bg-primary font-semibold py-3 px-8 rounded transition-colors"
              >
                test again
              </button>
            </div>
          </div>
        )}
    </div>
  )
}
