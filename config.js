/**
 * config.js - Centralized configuration for AI Troll Detector
 * Contains all thresholds, limits, and settings
 */

const CONFIG = {
  // Detection thresholds
  THRESHOLDS: {
    BUZZWORD_DENSITY: 0.15,        // 15% buzzword density is suspicious
    AI_PATTERN_SCORE: 0.6,          // 60% AI likelihood threshold
    REPETITION_SCORE: 0.4,          // 40% similarity between posts
    SUSPICION_SCORE: 0.4,           // General suspicion threshold
    SIMILARITY: 0.7,                // 70% similarity for coordinated comments
    EXTREME_SENTIMENT_RATIO: 0.5,   // 50% posts with extreme sentiment
    POSTING_SIMILARITY: 0.7,        // 70% similarity between posts
    MIN_POSTS_FOR_ANALYSIS: 3,      // Need at least 3 posts for pattern analysis
    SENTENCE_VARIANCE: 20,          // Low variance threshold for AI detection
    SPAM_CONFIDENCE: 0.3,           // Spam pattern confidence multiplier
    USERNAME_SUSPICION: 0.3,        // Username suspicion threshold
    LANGUAGE_CONFIDENCE: 0.3,       // Minimum confidence for language detection
    MIN_TOKENS_FOR_LANG_DETECT: 10  // Minimum tokens needed for language detection
  },

  // Performance limits
  PERFORMANCE: {
    MAX_POSTS_TO_ANALYZE: 50,       // Limit posts to analyze for performance
    MAX_SENTENCES_TO_COMPARE: 50,   // Limit sentences in repetition detection
    MAX_COMMENTS_TO_COMPARE: 100,   // Limit comments for coordinated detection
    MUTATION_DEBOUNCE_MS: 2000,     // Debounce time for DOM mutations
    MAX_ELEMENT_COUNT: 5000,        // Skip auto-analysis if page has too many elements
    MAX_TEXT_LENGTH: 1000,          // Maximum text length for algorithms
    ANALYSIS_TIMEOUT_MS: 30000,     // Timeout for manual analysis
    COMPARISON_WINDOW_LARGE: 6,     // Window size for large dataset comparisons
    COMPARISON_WINDOW_SMALL: 4,     // Window size for smaller comparisons
    LARGE_DATASET_THRESHOLD: 20,    // Threshold to switch to optimized algorithms
    COORDINATED_COMPARE_WINDOW: 11  // Window for coordinated comment detection
  },

  // UI settings
  UI: {
    SUSPICION_HIGH_THRESHOLD: 30,   // % for high suspicion (red)
    SUSPICION_MED_THRESHOLD: 10,    // % for medium suspicion (yellow)
    MIN_PERCENT_TO_SHOW: 10,        // Minimum % to show text in sentiment bars
    BADGE_HIGH_COUNT: 5             // Count threshold for red badge
  },

  // Algorithm weights
  WEIGHTS: {
    AI_DETECTION: {
      BUZZWORD_DENSITY: 0.3,
      REPETITIVENESS: 0.3,
      SENTENCE_LENGTH: 0.2,
      FORMALITY_SCORE: 0.2
    },
    PROFILE_ANALYSIS: {
      BIO_AI_PATTERNS: 0.2,
      BIO_BUZZWORDS: 0.15,
      POST_REPETITION: 0.25,
      EXTREME_SENTIMENT: 0.2,
      POST_AI_PATTERNS: 0.25,
      POSTING_FREQUENCY: 0.15,
      USERNAME: 0.1
    }
  },

  // Text analysis settings
  TEXT_ANALYSIS: {
    MIN_COMMENT_LENGTH: 5,          // Minimum length for comment analysis
    MIN_POST_LENGTH: 10,            // Minimum length for post analysis
    MAX_POST_LENGTH: 5000,          // Maximum length for generic posts
    EXCLAMATION_BOOST: 0.292,       // Sentiment boost from exclamation marks
    QUESTION_NEUTRAL: 0.18          // Sentiment adjustment for questions
  },

  // Sentiment analysis
  SENTIMENT: {
    NEGATIVE_THRESHOLD: -0.05,
    POSITIVE_THRESHOLD: 0.05,
    EXTREME_THRESHOLD: 0.5
  },

  // Debugging
  DEBUG: {
    ENABLED: true,                 // Enable debug logging true/false
    LOG_ANALYSIS: true,            // Log individual analysis results
    LOG_PERFORMANCE: false          // Log performance metrics
  }
};

// Make available globally
if (typeof window !== 'undefined') {
  window.CONFIG = CONFIG;
}

// For Node.js environments (if needed for testing)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
