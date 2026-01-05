/**
 * Composant de champ de formulaire avec validation et feedback visuel
 * Affiche des indicateurs visuels (✓/✗) et des messages d'erreur
 */

import { useState, useEffect } from 'react';

export default function FormField({
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  required = false,
  validation,
  placeholder = '',
  className = '',
  autoComplete = 'off'
}) {
  const [touched, setTouched] = useState(false);
  const [localError, setLocalError] = useState('');
  const [isValid, setIsValid] = useState(null); // null = pas validé, true = valide, false = invalide

  // Validation en temps réel
  useEffect(() => {
    if (touched && value) {
      if (validation) {
        const validationResult = validation(value);
        if (validationResult === true) {
          setIsValid(true);
          setLocalError('');
        } else {
          setIsValid(false);
          setLocalError(typeof validationResult === 'string' ? validationResult : 'Invalid value');
        }
      } else {
        // Validation basique
        if (type === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (emailRegex.test(value)) {
            setIsValid(true);
            setLocalError('');
          } else {
            setIsValid(false);
            setLocalError('Invalid email address');
          }
        } else if (type === 'password') {
          if (value.length >= 6) {
            setIsValid(true);
            setLocalError('');
          } else {
            setIsValid(false);
            setLocalError('Password must be at least 6 characters');
          }
        } else {
          setIsValid(value.length > 0);
          setLocalError('');
        }
      }
    } else if (touched && !value && required) {
      setIsValid(false);
      setLocalError('This field is required');
    } else {
      setIsValid(null);
      setLocalError('');
    }
  }, [value, touched, validation, type, required]);

  const handleBlur = (e) => {
    setTouched(true);
    if (onBlur) {
      onBlur(e);
    }
  };

  const displayError = error || (touched && localError);

  return (
    <div className={className}>
      <label className="block text-text-primary mb-2 text-sm font-medium">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={onChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          className={`input-modern w-full pr-10 ${
            touched && isValid === false
              ? 'border-red-500/50 focus:border-red-500'
              : touched && isValid === true
              ? 'border-green-500/50 focus:border-green-500'
              : ''
          }`}
          aria-invalid={touched && isValid === false}
          aria-describedby={displayError ? `${label}-error` : undefined}
        />
        {/* Indicateur visuel */}
        {touched && value && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isValid === true ? (
              <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : isValid === false ? (
              <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : null}
          </div>
        )}
      </div>
      {/* Message d'erreur */}
      {displayError && (
        <p
          id={`${label}-error`}
          className="mt-1 text-sm text-red-400"
          role="alert"
        >
          {displayError}
        </p>
      )}
    </div>
  );
}

