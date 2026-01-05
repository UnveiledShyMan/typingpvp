import { useReducer, useEffect, useRef, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { generateText, languages } from '../data/languages'
import { generateNumbers } from '../data/numbers'
import LanguageSelector from '../components/LanguageSelector'
import ThemeSelector from '../components/ThemeSelector'
import FontSelector from '../components/FontSelector'
import SmoothnessSelector from '../components/SmoothnessSelector'
import WordsIcon from '../components/icons/WordsIcon'
import NumbersIcon from '../components/icons/NumbersIcon'
import { getDefaultLanguage } from '../utils/languageDetection'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts'

import { post } from '../services/apiService';
import { TIME_LIMIT, CHARS_PER_WORD, MIN_TEXT_LENGTH, ADDITIONAL_TEXT_LENGTH, TEXT_GENERATION_THRESHOLD } from '../config/constants';
import { soloReducer, SOLO_ACTIONS, initialState } from '../reducers/soloReducer';

export default function Solo() {
  // Utiliser useReducer pour regrouper tous les états liés et réduire les re-renders
  const [state, dispatch] = useReducer(soloReducer, {
    ...initialState,
    selectedLang: getDefaultLanguage()
  });
  
  // Extraire les valeurs de l'état pour faciliter l'utilisation
  const { selectedLang, mode, text, input, startTime, timeLeft, stats, finished, errors, timeSeries, totalWords, isFocused } = state;
  
  const inputRef = useRef(null);
  const intervalRef = useRef(null);
  const textContainerRef = useRef(null);
  const matchRecordedRef = useRef(false); // Pour éviter d'enregistrer plusieurs fois

  useEffect(() => {
    // Générer le texte initial
    const initialText = mode === 'numbers' 
      ? generateNumbers(MIN_TEXT_LENGTH)
      : generateText(selectedLang, MIN_TEXT_LENGTH);
    
    // Réinitialiser l'état avec le reducer
    dispatch({ type: SOLO_ACTIONS.SET_TEXT, payload: initialText });
    dispatch({ type: SOLO_ACTIONS.SET_INPUT, payload: '' });
    dispatch({ type: SOLO_ACTIONS.SET_START_TIME, payload: null });
    dispatch({ type: SOLO_ACTIONS.SET_STATS, payload: { wpm: 0, accuracy: 100, time: 0, chars: 0 } });
    dispatch({ type: SOLO_ACTIONS.SET_FINISHED, payload: false });
    dispatch({ type: SOLO_ACTIONS.SET_ERRORS, payload: 0 });
    dispatch({ type: SOLO_ACTIONS.SET_TIME_LEFT, payload: TIME_LIMIT });
    dispatch({ type: SOLO_ACTIONS.ADD_TIME_SERIES, payload: { second: 0, wpm: 0, accuracy: 100 } }); // Reset timeSeries
    dispatch({ type: SOLO_ACTIONS.SET_TOTAL_WORDS, payload: 0 });
    matchRecordedRef.current = false;
    
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

  // Gérer le focus/blur pour l'indicateur visuel - optimisé avec useCallback
  const handleFocus = useCallback(() => {
    dispatch({ type: SOLO_ACTIONS.SET_FOCUSED, payload: true });
  }, []);

  const handleBlur = useCallback(() => {
    dispatch({ type: SOLO_ACTIONS.SET_FOCUSED, payload: false });
  }, []);

  // Empêcher le menu contextuel (clic droit) et la sélection du texte - style Monkeytype
  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    return false;
  }, []);

  // Empêcher la sélection du texte avec un clic long ou un glisser-déposer
  // Utiliser useEffect pour ajouter l'événement natif onselectstart
  useEffect(() => {
    if (textContainerRef.current) {
      const element = textContainerRef.current;
      const handleSelectStart = (e) => {
        e.preventDefault();
        return false;
      };
      
      // Utiliser l'événement natif HTML
      element.addEventListener('selectstart', handleSelectStart);
      
      return () => {
        element.removeEventListener('selectstart', handleSelectStart);
      };
    }
  }, []);

  // Timer pour les 60 secondes
  useEffect(() => {
    if (startTime && !finished && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        const newTimeLeft = timeLeft - 1;
        if (newTimeLeft <= 0) {
          dispatch({ type: SOLO_ACTIONS.SET_FINISHED, payload: true });
          dispatch({ type: SOLO_ACTIONS.SET_TIME_LEFT, payload: 0 });
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        } else {
          dispatch({ type: SOLO_ACTIONS.SET_TIME_LEFT, payload: newTimeLeft });
        }
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
          post('/api/matches/solo', {
            wpm: stats.wpm,
            accuracy: stats.accuracy,
            language: selectedLang
          }).catch(() => {
            // Erreur silencieuse - le match n'est pas critique pour le solo
          });
        }
      }
    }
  }, [finished, stats.wpm, stats.accuracy, selectedLang, mode]);

  // Sauvegarder la langue quand elle change - optimisé avec useCallback
  const handleLanguageChange = useCallback((langCode) => {
    dispatch({ type: SOLO_ACTIONS.SET_LANG, payload: langCode });
    localStorage.setItem('typingLanguage', langCode);
  }, []);

  // Ref pour throttler les calculs de stats
  const statsUpdateRef = useRef(null);
  const scrollUpdateRef = useRef(null);
  const lastErrorCountRef = useRef(0);

  const handleInputChange = useCallback((e) => {
    if (finished) return;
    
    const value = e.target.value;
    
    // Mise à jour immédiate de l'input pour réduire l'input lag
    if (value.length <= text.length) {
      dispatch({ type: SOLO_ACTIONS.SET_INPUT, payload: value });
    }
    
    if (!startTime && value.length > 0) {
      dispatch({ type: SOLO_ACTIONS.SET_START_TIME, payload: Date.now() });
    }

    // Générer plus de texte si nécessaire (déféré pour ne pas bloquer)
    if (value.length >= text.length - TEXT_GENERATION_THRESHOLD) {
      requestAnimationFrame(() => {
        const additionalText = mode === 'numbers' ? generateNumbers(ADDITIONAL_TEXT_LENGTH) : generateText(selectedLang, ADDITIONAL_TEXT_LENGTH);
        // Les espaces sont déjà inclus dans le texte généré (avant les mots)
        dispatch({ type: SOLO_ACTIONS.APPEND_TEXT, payload: additionalText });
      });
    }

    if (value.length <= text.length) {
      // Calculer les erreurs de manière optimisée (seulement les nouveaux caractères)
      let errorCount = lastErrorCountRef.current;
      if (value.length > input.length) {
        // Nouveau caractère ajouté - vérifier seulement les nouveaux
        for (let i = input.length; i < value.length; i++) {
          if (value[i] !== text[i]) {
            errorCount++;
          }
        }
        // Vérifier les corrections dans la partie déjà tapée (si l'utilisateur corrige)
        for (let i = 0; i < input.length; i++) {
          if (input[i] !== text[i] && value[i] === text[i]) {
            // Une erreur a été corrigée
            errorCount = Math.max(0, errorCount - 1);
          }
        }
      } else if (value.length < input.length) {
        // Caractère supprimé - recalculer depuis le début (rare mais nécessaire)
        errorCount = 0;
        for (let i = 0; i < value.length; i++) {
          if (value[i] !== text[i]) {
            errorCount++;
          }
        }
      }
      lastErrorCountRef.current = errorCount;
      dispatch({ type: SOLO_ACTIONS.SET_ERRORS, payload: errorCount });

      // Calculer les stats de manière throttlée (pas à chaque frappe)
      if (startTime) {
        // Annuler le calcul précédent s'il existe
        if (statsUpdateRef.current) {
          cancelAnimationFrame(statsUpdateRef.current);
        }
        
        // Déférer les calculs de stats pour ne pas bloquer l'input
        statsUpdateRef.current = requestAnimationFrame(() => {
          const timeElapsed = (TIME_LIMIT - timeLeft) / 60;
          
          // Calcul optimisé des caractères corrects : utiliser errorCount déjà calculé
          // correctChars = total - erreurs (plus efficace qu'une boucle)
          const correctChars = value.length - errorCount;
          
          // WPM basé uniquement sur les caractères corrects - empêche le spam du clavier
          // Un mot = 5 caractères, donc on divise les caractères corrects par 5
          const wordsTyped = correctChars / CHARS_PER_WORD;
          const wpm = timeElapsed > 0 ? Math.round(wordsTyped / timeElapsed) : 0;
          
          // Accuracy : (caractères corrects / total) * 100
          const accuracy = value.length > 0 
            ? Math.round((correctChars / value.length) * 100)
            : 100;
          
          dispatch({ 
            type: SOLO_ACTIONS.SET_STATS, 
            payload: { 
              wpm, 
              accuracy, 
              time: TIME_LIMIT - timeLeft, 
              chars: value.length 
            }
          });
          dispatch({ type: SOLO_ACTIONS.SET_TOTAL_WORDS, payload: Math.floor(wordsTyped) });

          // Enregistrer les stats chaque seconde pour le graphique (throttlé)
          const currentSecond = TIME_LIMIT - timeLeft;
          dispatch({ 
            type: SOLO_ACTIONS.ADD_TIME_SERIES, 
            payload: { second: currentSecond, wpm, accuracy } 
          });
        });

        // Scroll simple et fluide : suivre le curseur
        if (scrollUpdateRef.current) {
          cancelAnimationFrame(scrollUpdateRef.current);
        }
        
        scrollUpdateRef.current = requestAnimationFrame(() => {
          if (textContainerRef.current) {
            const container = textContainerRef.current;
            const currentCharElement = container.querySelector('.char-current');
            
            if (currentCharElement) {
              // Scroll simple : centrer le curseur dans la zone visible
              currentCharElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'nearest'
              });
            }
          }
        });
      }
    }
  }, [finished, text, startTime, timeLeft, mode, selectedLang, input]);

  const reset = () => {
    // Utiliser le reducer pour réinitialiser
    dispatch({ type: SOLO_ACTIONS.RESET });
    
    // Générer le nouveau texte
    const newText = mode === 'numbers' 
      ? generateNumbers(MIN_TEXT_LENGTH)
      : generateText(selectedLang, MIN_TEXT_LENGTH);
    dispatch({ type: SOLO_ACTIONS.SET_TEXT, payload: newText });
    
    matchRecordedRef.current = false; // Réinitialiser pour le prochain match
    lastErrorCountRef.current = 0; // Réinitialiser le compteur d'erreurs
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Rendu simple caractère par caractère - comme avant
  const renderText = useMemo(() => {
    return text.split('').map((char, index) => {
      if (index < input.length) {
        // Caractère déjà tapé
        const isCorrect = input[index] === char;
        return (
          <span 
            key={index} 
            className={isCorrect ? 'char-correct' : 'char-incorrect'}
          >
            {char}
          </span>
        );
      } else if (index === input.length) {
        // Curseur sur ce caractère
        return (
          <span 
            key={index} 
            className="char-current"
          >
            {char}
          </span>
        );
      } else {
        // Caractère à venir
        return (
          <span 
            key={index} 
            className="char-pending"
          >
            {char}
          </span>
        );
      }
    });
  }, [text, input]);

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
    <div className="w-full h-full max-w-4xl mx-auto flex flex-col items-center justify-center overflow-hidden py-4 sm:py-8">
      {/* Controls bar - Style Monkeytype minimaliste et discret avec icônes cohérentes */}
      <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 mb-4 sm:mb-6 w-full">
        {/* Boutons mode avec icônes */}
        <div className="flex gap-1">
          <button
            onClick={() => dispatch({ type: SOLO_ACTIONS.SET_MODE, payload: 'words' })}
            className={`p-2 rounded-md transition-all duration-200 ${
              mode === 'words'
                ? 'bg-accent-primary/20 text-accent-primary opacity-100'
                : 'bg-bg-secondary/20 text-text-secondary/60 hover:text-text-primary hover:bg-bg-secondary/40 opacity-60 hover:opacity-100'
            }`}
            aria-label="Words mode"
          >
            <WordsIcon className="w-4 h-4" stroke="currentColor" />
          </button>
          <button
            onClick={() => dispatch({ type: SOLO_ACTIONS.SET_MODE, payload: 'numbers' })}
            className={`p-2 rounded-md transition-all duration-200 ${
              mode === 'numbers'
                ? 'bg-accent-primary/20 text-accent-primary opacity-100'
                : 'bg-bg-secondary/20 text-text-secondary/60 hover:text-text-primary hover:bg-bg-secondary/40 opacity-60 hover:opacity-100'
            }`}
            aria-label="Numbers mode"
            title="Numbers mode"
          >
            <NumbersIcon className="w-4 h-4" stroke="currentColor" />
          </button>
        </div>
        {/* Sélecteur de langue - Affiche le code langue (FR, ENG, etc.) */}
        {mode === 'words' && (
          <LanguageSelector selectedLang={selectedLang} onLanguageChange={handleLanguageChange} />
        )}
        {/* Sélecteurs de thème, police et smoothness */}
        <div className="flex items-center gap-1">
          <ThemeSelector />
          <FontSelector />
          <SmoothnessSelector />
        </div>
      </div>

      {!finished ? (
          <div className="space-y-4 sm:space-y-6 w-full max-w-3xl flex flex-col items-center">
            {/* Stats - Style Monkeytype compact avec animation de fondu */}
            <div className="flex justify-center gap-4 sm:gap-6 text-text-primary animate-fade-in">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold mb-0.5 stats-number">
                  {timeLeft}
                </div>
                <div className="text-text-secondary/50 text-[10px] uppercase tracking-wider">time</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold mb-0.5 stats-number">{stats.wpm}</div>
                <div className="text-text-secondary/50 text-[10px] uppercase tracking-wider">wpm</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold mb-0.5 stats-number">{stats.accuracy}%</div>
                <div className="text-text-secondary/50 text-[10px] uppercase tracking-wider">acc</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold mb-0.5 stats-number">{totalWords}</div>
                <div className="text-text-secondary/50 text-[10px] uppercase tracking-wider">words</div>
              </div>
            </div>

            {/* Text area - Style Monkeytype compact et centré avec indicateur de focus */}
            <div 
              ref={textContainerRef}
              onClick={() => inputRef.current?.focus()}
              onContextMenu={handleContextMenu}
              onDragStart={(e) => e.preventDefault()}
              className={`typing-text bg-transparent rounded-lg w-full overflow-y-auto cursor-text relative transition-all duration-300 ${
                isFocused ? 'typing-area-focused' : 'typing-area-unfocused'
              }`}
              style={{ 
                // Hauteur exacte pour 3 lignes complètes : line-height 1.8 * font-size 1.5rem * 3 lignes
                // Ajout d'un petit buffer pour s'assurer que la troisième ligne n'est pas coupée
                // Le line-height inclut déjà l'espace entre les lignes, donc on multiplie par 3
                height: 'calc(1.5rem * 1.8 * 3)',
                scrollBehavior: 'smooth',
                // Assurer que le contenu peut revenir à la ligne
                width: '100%',
                maxWidth: '100%',
                // Masquer la scrollbar mais permettre le scroll
                overflowY: 'auto',
                // Pas de padding pour un affichage précis
                padding: 0
              }}
            >
              {renderText}
            </div>

            {/* Input invisible - Style Monkeytype (on tape directement sur le texte) */}
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleInputChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              disabled={finished}
              className="absolute opacity-0 pointer-events-none"
              placeholder=""
              style={{ fontFamily: 'JetBrains Mono' }}
              autoFocus
            />
          </div>
        ) : (
          <div className="w-full h-full flex flex-col justify-center space-y-4 sm:space-y-6 overflow-hidden">
            {/* Résultats finaux */}
            <div className="bg-bg-secondary rounded-lg p-6 sm:p-8 border border-text-secondary/20 shadow-lg">
              <h2 className="text-2xl sm:text-3xl font-bold text-text-primary mb-4 sm:mb-6 text-center" style={{ fontFamily: 'Inter' }}>Test Complete</h2>
              <div className="grid grid-cols-4 gap-4 sm:gap-6 text-center">
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
              <div className="bg-bg-secondary rounded-lg p-4 sm:p-6 border border-text-secondary/10 shadow-lg flex-1 flex flex-col min-h-0">
                <h3 className="text-xl sm:text-2xl font-bold text-text-primary mb-4 sm:mb-6" style={{ fontFamily: 'Inter', letterSpacing: '-0.02em' }}>Performance Chart</h3>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
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
              </div>
            )}

            <div className="text-center pt-2">
              <button
                onClick={reset}
                className="bg-accent-primary hover:bg-accent-hover text-bg-primary font-semibold py-2 px-6 sm:py-3 sm:px-8 rounded transition-colors text-sm sm:text-base"
              >
                test again
              </button>
            </div>
          </div>
        )}
    </div>
  )
}
