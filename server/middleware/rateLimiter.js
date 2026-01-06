/**
 * Rate Limiting Middleware
 * Protection contre les abus et les attaques par déni de service
 * 
 * Différentes limites selon le type d'endpoint :
 * - Auth (login/register) : strict pour éviter les attaques par force brute
 * - API général : modéré
 * - Socket.io : géré séparément dans index.js
 */

import rateLimit from 'express-rate-limit';

/**
 * Rate limiter pour les endpoints d'authentification
 * 5 tentatives par 15 minutes par IP
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives max
  message: {
    error: 'Too many authentication attempts',
    message: 'Too many login/register attempts from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true, // Retourne rate limit info dans les headers `RateLimit-*`
  legacyHeaders: false, // Désactive les headers `X-RateLimit-*`
  // Skip successful requests (ne compte que les échecs)
  skipSuccessfulRequests: false,
  // Skip failed requests (ne compte que les succès) - NON, on veut limiter les échecs
  skipFailedRequests: false,
});

/**
 * Rate limiter pour les endpoints de recherche (friends, users)
 * 20 requêtes par minute par IP
 */
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requêtes max
  message: {
    error: 'Too many search requests',
    message: 'Too many search requests from this IP, please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter pour les endpoints généraux de l'API
 * 100 requêtes par 15 minutes par IP
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes max
  message: {
    error: 'Too many requests',
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter strict pour les endpoints critiques (upload, update profile)
 * 10 requêtes par heure par IP
 */
export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 10, // 10 requêtes max
  message: {
    error: 'Too many requests',
    message: 'Too many requests to this endpoint, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

