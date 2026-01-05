import { useState, useEffect, useRef } from 'react'
import FontSelector from '../components/FontSelector'

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

  // Ref pour savoir si l'utilisateur est en train de taper dans le textarea
  const isTypingInTextareaRef = useRef(false);

  useEffect(() => {
    if (customText.trim()) {
      setText(customText);
    } else {
      setText('Start typing your custom text here...');
    }
    // Ne réinitialiser l'input que si on n'est pas en train de taper dans le textarea
    if (!isTypingInTextareaRef.current) {
      setInput('');
    }
  }, [customText]);

  useEffect(() => {
    // Ne voler le focus que si on n'est pas en train de taper dans le textarea
    if (inputRef.current && !isTypingInTextareaRef.current) {
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
        {/* Sélecteur de police */}
        <div className="flex items-center gap-1">
          <FontSelector />
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
              <div className="space-y-6">
                {/* Presets de couleurs - Design amélioré */}
                <div>
                  <label className="block text-text-primary text-sm mb-4 font-semibold">Color Presets</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {colorPresets.map((preset) => {
                      const isActive = 
                        settings.textColor === preset.text &&
                        settings.correctColor === preset.correct &&
                        settings.incorrectColor === preset.incorrect &&
                        settings.currentColor === preset.current &&
                        settings.pendingColor === preset.pending;
                      
                      return (
                        <button
                          key={preset.name}
                          onClick={() => applyPreset(preset)}
                          className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                            isActive
                              ? 'border-accent-primary bg-accent-primary/10'
                              : 'border-border-secondary/30 bg-bg-primary/30 hover:border-accent-primary/50 hover:bg-bg-primary/50'
                          }`}
                          title={preset.name}
                        >
                          <div className="text-xs font-medium text-text-primary mb-2">{preset.name}</div>
                          <div className="flex items-center gap-2">
                            {/* Aperçu de la palette */}
                            <div className="flex-1 grid grid-cols-4 gap-1">
                              <div 
                                className="h-6 rounded" 
                                style={{ backgroundColor: preset.text }}
                                title="Text"
                              />
                              <div 
                                className="h-6 rounded" 
                                style={{ backgroundColor: preset.correct }}
                                title="Correct"
                              />
                              <div 
                                className="h-6 rounded" 
                                style={{ backgroundColor: preset.incorrect }}
                                title="Incorrect"
                              />
                              <div 
                                className="h-6 rounded" 
                                style={{ backgroundColor: preset.current }}
                                title="Current"
                              />
                            </div>
                            {isActive && (
                              <svg className="w-4 h-4 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Aperçu de la palette actuelle */}
                <div className="pt-2 border-t border-border-secondary/20">
                  <label className="block text-text-primary text-sm mb-3 font-semibold">Current Palette</label>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-bg-primary/20 border border-border-secondary/20">
                    <div className="flex-1 grid grid-cols-5 gap-2">
                      {[
                        { key: 'textColor', label: 'Text', color: settings.textColor },
                        { key: 'correctColor', label: 'Correct', color: settings.correctColor },
                        { key: 'incorrectColor', label: 'Incorrect', color: settings.incorrectColor },
                        { key: 'currentColor', label: 'Current', color: settings.currentColor },
                        { key: 'pendingColor', label: 'Pending', color: settings.pendingColor },
                      ].map(({ key, label, color }) => (
                        <div key={key} className="text-center">
                          <div 
                            className="w-full h-8 rounded mb-1 border border-border-secondary/30"
                            style={{ backgroundColor: color }}
                          />
                          <div className="text-[10px] text-text-secondary/70">{label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sélecteurs de couleurs individuels - Design amélioré */}
                <div className="pt-2 border-t border-border-secondary/20">
                  <label className="block text-text-primary text-sm mb-4 font-semibold">Customize Colors</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { key: 'textColor', label: 'Text', description: 'Untyped text' },
                      { key: 'correctColor', label: 'Correct', description: 'Correctly typed' },
                      { key: 'incorrectColor', label: 'Incorrect', description: 'Mistakes' },
                      { key: 'currentColor', label: 'Current', description: 'Current character' },
                      { key: 'pendingColor', label: 'Pending', description: 'Upcoming text' },
                    ].map(({ key, label, description }) => (
                      <div key={key} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="block text-text-primary text-xs font-medium">{label}</label>
                          <span className="text-[10px] text-text-secondary/60">{description}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={settings[key]}
                            onChange={(e) => handleSettingChange(key, e.target.value)}
                            className="w-12 h-12 rounded-lg cursor-pointer flex-shrink-0"
                            title={`Select ${label} color`}
                          />
                          <div className="flex-1 flex flex-col gap-1">
                            <input
                              type="text"
                              value={settings[key]}
                              onChange={(e) => handleSettingChange(key, e.target.value)}
                              className="w-full px-2 py-1.5 border border-border-secondary/30 rounded text-text-primary text-xs font-mono focus:outline-none focus:ring-2 focus:ring-accent-primary/30 focus:border-accent-primary/50 transition-all"
                              placeholder="#000000"
                              style={{
                                backgroundColor: 'rgba(10, 14, 26, 0.4)'
                              }}
                              onFocus={(e) => {
                                e.target.style.backgroundColor = 'rgba(10, 14, 26, 0.6)';
                              }}
                              onBlur={(e) => {
                                e.target.style.backgroundColor = 'rgba(10, 14, 26, 0.4)';
                              }}
                            />
                            <div 
                              className="w-full h-2 rounded border border-border-secondary/20"
                              style={{ backgroundColor: settings[key] }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
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
        <label className="block text-text-primary text-xs mb-2 font-medium">Custom Text</label>
        <textarea
          value={customText}
          onChange={(e) => {
            isTypingInTextareaRef.current = true;
            setCustomText(e.target.value);
          }}
          onFocus={(e) => {
            isTypingInTextareaRef.current = true;
            e.target.style.backgroundColor = 'rgba(10, 14, 26, 0.6)';
          }}
          onBlur={(e) => {
            // Attendre un peu avant de réinitialiser pour éviter les conflits
            setTimeout(() => {
              isTypingInTextareaRef.current = false;
            }, 100);
            e.target.style.backgroundColor = 'rgba(10, 14, 26, 0.4)';
          }}
          placeholder="Enter your custom text here or type directly above..."
          className="w-full p-4 backdrop-blur-sm border border-border-secondary/30 rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary/30 focus:border-accent-primary/50 transition-all resize-none custom-scrollbar"
          rows={4}
          style={{
            fontFamily: 'var(--typing-font, "JetBrains Mono", monospace)',
            backgroundColor: 'rgba(10, 14, 26, 0.4)'
          }}
        />
      </div>
    </div>
  )
}
