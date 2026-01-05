/**
 * Reducer pour gérer l'état du mode Solo
 * Regroupe tous les états liés pour réduire les re-renders
 */

const TIME_LIMIT = 60;

// État initial
export const initialState = {
  selectedLang: null, // Sera initialisé avec getDefaultLanguage()
  mode: 'words',
  text: '',
  input: '',
  startTime: null,
  timeLeft: TIME_LIMIT,
  stats: { wpm: 0, accuracy: 100, time: 0, chars: 0 },
  finished: false,
  errors: 0,
  timeSeries: [],
  totalWords: 0,
  isFocused: false,
};

// Actions
export const SOLO_ACTIONS = {
  SET_LANG: 'SET_LANG',
  SET_MODE: 'SET_MODE',
  SET_TEXT: 'SET_TEXT',
  APPEND_TEXT: 'APPEND_TEXT',
  SET_INPUT: 'SET_INPUT',
  SET_START_TIME: 'SET_START_TIME',
  SET_TIME_LEFT: 'SET_TIME_LEFT',
  SET_STATS: 'SET_STATS',
  SET_FINISHED: 'SET_FINISHED',
  SET_ERRORS: 'SET_ERRORS',
  ADD_TIME_SERIES: 'ADD_TIME_SERIES',
  SET_TOTAL_WORDS: 'SET_TOTAL_WORDS',
  SET_FOCUSED: 'SET_FOCUSED',
  RESET: 'RESET',
};

/**
 * Reducer pour le mode Solo
 * Optimisé pour minimiser les re-renders en groupant les mises à jour
 */
export function soloReducer(state, action) {
  switch (action.type) {
    case SOLO_ACTIONS.SET_LANG:
      return { ...state, selectedLang: action.payload };
    
    case SOLO_ACTIONS.SET_MODE:
      return { ...state, mode: action.payload };
    
    case SOLO_ACTIONS.SET_TEXT:
      return { ...state, text: action.payload };
    
    case SOLO_ACTIONS.APPEND_TEXT:
      return { ...state, text: state.text + action.payload };
    
    case SOLO_ACTIONS.SET_INPUT:
      return { ...state, input: action.payload };
    
    case SOLO_ACTIONS.SET_START_TIME:
      return { ...state, startTime: action.payload };
    
    case SOLO_ACTIONS.SET_TIME_LEFT:
      return { ...state, timeLeft: action.payload };
    
    case SOLO_ACTIONS.SET_STATS:
      return { ...state, stats: action.payload };
    
    case SOLO_ACTIONS.SET_FINISHED:
      return { ...state, finished: action.payload };
    
    case SOLO_ACTIONS.SET_ERRORS:
      return { ...state, errors: action.payload };
    
    case SOLO_ACTIONS.ADD_TIME_SERIES:
      const { second, wpm, accuracy } = action.payload;
      const existing = state.timeSeries.findIndex((item) => item.second === second);
      const newData = { second, wpm, accuracy };
      
      if (existing >= 0) {
        const updated = [...state.timeSeries];
        updated[existing] = newData;
        return { ...state, timeSeries: updated.sort((a, b) => a.second - b.second) };
      }
      // Éviter les doublons et limiter la taille pour performance
      const newTimeSeries = [...state.timeSeries, newData]
        .sort((a, b) => a.second - b.second)
        .slice(-TIME_LIMIT); // Garder seulement les 60 dernières secondes
      return { 
        ...state, 
        timeSeries: newTimeSeries
      };
    
    case SOLO_ACTIONS.SET_TOTAL_WORDS:
      return { ...state, totalWords: action.payload };
    
    case SOLO_ACTIONS.SET_FOCUSED:
      return { ...state, isFocused: action.payload };
    
    case SOLO_ACTIONS.RESET:
      return {
        ...initialState,
        selectedLang: state.selectedLang, // Conserver la langue
        mode: state.mode, // Conserver le mode
        timeSeries: [], // Réinitialiser timeSeries
      };
    
    default:
      return state;
  }
}

