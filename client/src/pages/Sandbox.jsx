import { useState, useEffect, useRef } from 'react'
import ThemeSelector from '../components/ThemeSelector'
import FontSelector from '../components/FontSelector'
import SmoothnessSelector from '../components/SmoothnessSelector'

const colorPresets = [
  { name: 'Default', text: '#9ca3b8', correct: '#e8ecf3', incorrect: '#f472b6', current: '#fbbf24', pending: '#9ca3b8' },
  { name: 'Monkeytype', text: '#646669', correct: '#e8ecf3', incorrect: '#ca4754', current: '#e2b714', pending: '#646669' },
  { name: 'Ocean', text: '#4a90e2', correct: '#7ed4e6', incorrect: '#ff6b6b', current: '#ffd93d', pending: '#4a90e2' },
  { name: 'Forest', text: '#6bcf7f', correct: '#a8e6cf', incorrect: '#ff6b6b', current: '#ffd93d', pending: '#6bcf7f' },
  { name: 'Sunset', text: '#ff8c42', correct: '#ffd93d', incorrect: '#ff6b6b', current: '#ff8c42', pending: '#ff8c42' },
  { name: 'Neon', text: '#00f5ff', correct: '#ffffff', incorrect: '#ff00ff', current: '#ffff00', pending: '#00f5ff' },
]

export default function Sandbox() {
  const [customText, setCustomText] = useState('');
  const [text, setText] = useState('');
  const [input, setInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('colors'); // 'colors', 'typography', 'layout'
  const [settings, setSettings] = useState({
    fontSize: 1.5,
    lineHeight: 1.8,
    letterSpacing: 0.02,
    wordSpacing: 0.25,
    textColor: '#9ca3b8',
    correctColor: '#e8ecf3',
    incorrectColor: '#f472b6',
    currentColor: '#fbbf24',
    pendingColor: '#9ca3b8',
    caretStyle: 'line', // 'line', 'block', 'underline'
    smoothCaret: true,
    showTimer: false,
    showWpm: false,
    showAccuracy: false,
  });
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);
  const textContainerRef = useRef(null);
  const previousCursorPosition = useRef(0); // Pour suivre la position précédente du curseur

  useEffect(() => {
    if (customText.trim()) {
      setText(customText);
    } else {
      setText('Start typing your custom text here...');
    }
    setInput('');
  }, [customText]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [text]);

  // Gérer le focus/blur pour l'indicateur visuel
  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  // Empêcher le menu contextuel (clic droit) et la sélection du texte - style Monkeytype
  const handleContextMenu = (e) => {
    e.preventDefault();
    return false;
  };

  // Empêcher la sélection du texte avec un clic long ou un glisser-déposer
  const handleSelectStart = (e) => {
    e.preventDefault();
    return false;
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    
    if (value.length <= text.length) {
      setInput(value);
    } else {
      const additionalText = value.slice(text.length);
      setText(text + additionalText);
      setInput(value);
    }

    // Auto-scroll pour suivre la position de frappe
    if (textContainerRef.current) {
      const container = textContainerRef.current;
      const currentCharElement = container.querySelector(`span:nth-child(${value.length + 1})`);
      if (currentCharElement) {
        const containerRect = container.getBoundingClientRect();
        const charRect = currentCharElement.getBoundingClientRect();
        const charTop = charRect.top - containerRect.top + container.scrollTop;
        const charBottom = charTop + charRect.height;
        
        if (charTop < container.scrollTop + 50) {
          container.scrollTop = Math.max(0, charTop - 50);
        } else if (charBottom > container.scrollTop + container.clientHeight - 50) {
          container.scrollTop = charBottom - container.clientHeight + 50;
        }
      }
    }
  };

  const reset = () => {
    setInput('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const applyPreset = (preset) => {
    setSettings(prev => ({
      ...prev,
      textColor: preset.text,
      correctColor: preset.correct,
      incorrectColor: preset.incorrect,
      currentColor: preset.current,
      pendingColor: preset.pending,
    }));
  };

  const renderText = () => {
    const currentPosition = input.length;
    const isCursorMoving = previousCursorPosition.current !== currentPosition;
    
    // Mettre à jour la position précédente après le rendu
    if (isCursorMoving) {
      setTimeout(() => {
        previousCursorPosition.current = currentPosition;
      }, 0);
    }

    return text.split('').map((char, index) => {
      // Remplacer les espaces par des espaces insécables pour qu'ils soient visibles
      const displayChar = char === ' ' ? '\u00A0' : char;
      
      if (index < input.length) {
        const isCorrect = input[index] === char;
        return (
          <span 
            key={index} 
            className="transition-all"
            style={{ 
              color: isCorrect ? settings.correctColor : settings.incorrectColor,
              backgroundColor: !isCorrect ? `${settings.incorrectColor}26` : 'transparent',
              borderBottom: !isCorrect ? `2px solid ${settings.incorrectColor}` : 'none',
              textShadow: !isCorrect ? `0 0 8px ${settings.incorrectColor}80` : 'none',
              transitionDuration: `var(--typing-transition-duration, 200ms)`
            }}
          >
            {displayChar}
          </span>
        );
      } else if (index === input.length) {
        const caretStyle = settings.caretStyle === 'block' 
          ? { 
              background: `linear-gradient(135deg, ${settings.currentColor} 0%, ${settings.currentColor}dd 100%)`,
              color: '#0a0e1a',
              textShadow: `0 0 10px ${settings.currentColor}99`,
              boxShadow: `0 0 15px ${settings.currentColor}66`
            }
          : settings.caretStyle === 'underline'
          ? {
              color: settings.currentColor,
              borderBottom: `3px solid ${settings.currentColor}`,
              textShadow: `0 0 8px ${settings.currentColor}80`
            }
          : {
              background: `linear-gradient(135deg, ${settings.currentColor} 0%, ${settings.currentColor}dd 100%)`,
              color: '#0a0e1a',
              textShadow: `0 0 10px ${settings.currentColor}99`,
              boxShadow: `0 0 15px ${settings.currentColor}66`,
              borderLeft: settings.smoothCaret ? '2px solid transparent' : '2px solid ' + settings.currentColor
            };
        
        // Ajouter la classe caret-moving si le curseur vient de se déplacer
        const caretClass = isCursorMoving 
          ? `transition-all caret-moving ${settings.smoothCaret ? 'animate-pulse' : ''}`
          : `transition-all ${settings.smoothCaret ? 'animate-pulse' : ''}`;
        
        return (
          <span 
            key={index} 
            className={caretClass}
            style={{
              ...caretStyle,
              transitionDuration: `var(--typing-transition-duration, 200ms)`,
              position: 'relative',
              display: 'inline-block'
            }}
          >
            {displayChar}
          </span>
        );
      } else {
        return (
          <span 
            key={index} 
            className="transition-colors"
            style={{ 
              color: settings.pendingColor,
              transitionDuration: `var(--typing-transition-duration, 200ms)`
            }}
          >
            {displayChar}
          </span>
        );
      }
    });
  };

  return (
    <div className="w-full h-full max-w-6xl mx-auto flex flex-col items-center justify-center overflow-hidden py-4 sm:py-8 animate-fade-in">
      {/* Controls bar - Style Monkeytype minimaliste et élégant */}
      <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 mb-4 sm:mb-6 w-full">
        {/* Sélecteurs de thème, police et smoothness */}
        <div className="flex items-center gap-1">
          <ThemeSelector />
          <FontSelector />
          <SmoothnessSelector />
        </div>
        
        {/* Bouton Settings avec indicateur visuel */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-2 text-text-secondary/60 hover:text-text-primary transition-all duration-200 ${
            showSettings ? 'opacity-100 text-accent-primary' : 'opacity-60 hover:opacity-100'
          }`}
          aria-label="Settings"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        {/* Bouton Reset */}
        <button
          onClick={reset}
          className="p-2 text-text-secondary/60 hover:text-text-primary transition-all duration-200 opacity-60 hover:opacity-100"
          aria-label="Reset"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Panneau de settings amélioré avec onglets */}
      {showSettings && (
        <div className="w-full max-w-3xl mb-4 rounded-lg overflow-hidden animate-fade-in"
          style={{
            background: 'rgba(19, 24, 37, 0.6)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)'
          }}
        >
          {/* Onglets */}
          <div className="flex border-b border-text-secondary/10">
            {['colors', 'typography', 'layout'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-medium transition-all duration-200 capitalize ${
                  activeTab === tab
                    ? 'text-accent-primary border-b-2 border-accent-primary'
                    : 'text-text-secondary/60 hover:text-text-primary'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Contenu des onglets */}
          <div className="p-4 sm:p-6">
            {activeTab === 'colors' && (
              <div className="space-y-4">
                {/* Presets de couleurs */}
                <div>
                  <label className="block text-text-secondary/70 text-xs mb-3 font-medium">Color Presets</label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {colorPresets.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => applyPreset(preset)}
                        className="p-2 rounded-lg bg-bg-primary/30 hover:bg-bg-primary/50 transition-all duration-200 text-xs font-medium text-text-secondary/70 hover:text-text-primary"
                        title={preset.name}
                      >
                        <div className="flex gap-1 justify-center mb-1">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.text }} />
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.correct }} />
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: preset.current }} />
                        </div>
                        <div className="text-[10px]">{preset.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sélecteurs de couleurs individuels */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-2">
                  {[
                    { key: 'textColor', label: 'Text' },
                    { key: 'correctColor', label: 'Correct' },
                    { key: 'incorrectColor', label: 'Incorrect' },
                    { key: 'currentColor', label: 'Current' },
                    { key: 'pendingColor', label: 'Pending' },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-text-secondary/70 text-xs mb-2 font-medium">{label}</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={settings[key]}
                          onChange={(e) => handleSettingChange(key, e.target.value)}
                          className="w-10 h-10 rounded-lg cursor-pointer border-none"
                          style={{ 
                            backgroundColor: settings[key],
                            WebkitAppearance: 'none',
                            appearance: 'none'
                          }}
                        />
                        <input
                          type="text"
                          value={settings[key]}
                          onChange={(e) => handleSettingChange(key, e.target.value)}
                          className="flex-1 px-2 py-1.5 bg-bg-primary/30 rounded text-text-primary text-xs font-mono focus:outline-none focus:bg-bg-primary/50 transition-all"
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'typography' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {/* Font Size */}
                  <div>
                    <label className="block text-text-secondary/70 text-xs mb-2 font-medium">Font Size</label>
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="0.8"
                        max="3"
                        step="0.1"
                        value={settings.fontSize}
                        onChange={(e) => handleSettingChange('fontSize', parseFloat(e.target.value))}
                        className="w-full accent-accent-primary"
                      />
                      <div className="text-text-secondary text-xs font-mono text-center">{settings.fontSize}rem</div>
                    </div>
                  </div>

                  {/* Line Height */}
                  <div>
                    <label className="block text-text-secondary/70 text-xs mb-2 font-medium">Line Height</label>
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="1"
                        max="3"
                        step="0.1"
                        value={settings.lineHeight}
                        onChange={(e) => handleSettingChange('lineHeight', parseFloat(e.target.value))}
                        className="w-full accent-accent-primary"
                      />
                      <div className="text-text-secondary text-xs font-mono text-center">{settings.lineHeight}</div>
                    </div>
                  </div>

                  {/* Letter Spacing */}
                  <div>
                    <label className="block text-text-secondary/70 text-xs mb-2 font-medium">Letter Spacing</label>
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="0"
                        max="0.1"
                        step="0.01"
                        value={settings.letterSpacing}
                        onChange={(e) => handleSettingChange('letterSpacing', parseFloat(e.target.value))}
                        className="w-full accent-accent-primary"
                      />
                      <div className="text-text-secondary text-xs font-mono text-center">{settings.letterSpacing}em</div>
                    </div>
                  </div>

                  {/* Word Spacing */}
                  <div>
                    <label className="block text-text-secondary/70 text-xs mb-2 font-medium">Word Spacing</label>
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={settings.wordSpacing}
                        onChange={(e) => handleSettingChange('wordSpacing', parseFloat(e.target.value))}
                        className="w-full accent-accent-primary"
                      />
                      <div className="text-text-secondary text-xs font-mono text-center">{settings.wordSpacing}em</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'layout' && (
              <div className="space-y-4">
                {/* Caret Style */}
                <div>
                  <label className="block text-text-secondary/70 text-xs mb-3 font-medium">Caret Style</label>
                  <div className="flex gap-2">
                    {['line', 'block', 'underline'].map((style) => (
                      <button
                        key={style}
                        onClick={() => handleSettingChange('caretStyle', style)}
                        className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 capitalize ${
                          settings.caretStyle === style
                            ? 'bg-accent-primary/20 text-accent-primary'
                            : 'bg-bg-primary/30 text-text-secondary/70 hover:text-text-primary hover:bg-bg-primary/50'
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Options supplémentaires */}
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={settings.smoothCaret}
                      onChange={(e) => handleSettingChange('smoothCaret', e.target.checked)}
                      className="w-4 h-4 rounded accent-accent-primary cursor-pointer"
                    />
                    <span className="text-text-secondary/70 text-xs group-hover:text-text-primary transition-colors">Smooth Caret Animation</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Zone de texte personnalisable avec effet visuel amélioré */}
      <div className="space-y-4 sm:space-y-6 w-full max-w-4xl flex flex-col items-center">
        {/* Text area avec styles personnalisables et effets visuels */}
        <div 
          ref={textContainerRef}
          onClick={() => inputRef.current?.focus()}
          onContextMenu={handleContextMenu}
          onSelectStart={handleSelectStart}
          onDragStart={(e) => e.preventDefault()}
          className={`bg-transparent p-6 sm:p-8 rounded-lg w-full overflow-y-auto cursor-text transition-all duration-300 custom-scrollbar relative ${
            isFocused ? 'typing-area-focused' : 'typing-area-unfocused'
          }`}
          style={{ 
            maxHeight: '450px',
            minHeight: '250px',
            scrollBehavior: 'smooth',
            fontFamily: 'var(--typing-font, "JetBrains Mono", monospace)',
            fontSize: `${settings.fontSize}rem`,
            lineHeight: settings.lineHeight,
            letterSpacing: `${settings.letterSpacing}em`,
            wordSpacing: `${settings.wordSpacing}em`,
            color: settings.textColor,
            textAlign: 'center'
          }}
        >
          {renderText()}
        </div>

        {/* Input invisible */}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="absolute opacity-0 pointer-events-none"
          placeholder=""
          style={{ fontFamily: 'var(--typing-font, "JetBrains Mono", monospace)' }}
          autoFocus
        />
      </div>

      {/* Zone de texte personnalisée (en bas) - Style amélioré */}
      <div className="w-full max-w-3xl mt-6">
        <label className="block text-text-secondary/70 text-xs mb-2 font-medium">Custom Text</label>
        <textarea
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          placeholder="Enter your custom text here or type directly above..."
          className="w-full p-4 bg-bg-secondary/20 backdrop-blur-sm border-none rounded-lg text-text-primary text-sm focus:outline-none focus:bg-bg-secondary/40 focus:ring-2 focus:ring-accent-primary/20 transition-all resize-none custom-scrollbar"
          rows={4}
          style={{
            fontFamily: 'var(--typing-font, "JetBrains Mono", monospace)'
          }}
        />
      </div>
    </div>
  )
}
