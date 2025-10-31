/**
 * utils.js - Utility functions for text analysis and similarity detection
 * Contains tools for Levenshtein distance, cosine similarity, and pattern detection
 */

class TextAnalysisUtils {

  /**
   * Calculate Levenshtein distance between two strings
   * Returns the minimum number of edits needed to transform s1 into s2
   * Space-optimized version: O(min(n,m)) space instead of O(n*m)
   */
  static levenshteinDistance(s1, s2) {
    // Input validation
    if (!s1 || !s2 || typeof s1 !== 'string' || typeof s2 !== 'string') {
      return 0;
    }

    // Optimization: limit string length to prevent memory issues
    const config = typeof CONFIG !== 'undefined' ? CONFIG : { PERFORMANCE: { MAX_TEXT_LENGTH: 1000 } };
    const maxLength = config.PERFORMANCE.MAX_TEXT_LENGTH;
    s1 = s1.substring(0, maxLength);
    s2 = s2.substring(0, maxLength);

    // Handle edge cases
    if (s1.length === 0) return s2.length;
    if (s2.length === 0) return s1.length;

    // Use single array instead of matrix (space optimization)
    let prev = Array.from({length: s2.length + 1}, (_, i) => i);

    for (let i = 0; i < s1.length; i++) {
      let curr = [i + 1];
      for (let j = 0; j < s2.length; j++) {
        const cost = s1[i] === s2[j] ? 0 : 1;
        curr[j + 1] = Math.min(
          curr[j] + 1,      // insertion
          prev[j + 1] + 1,  // deletion
          prev[j] + cost    // substitution
        );
      }
      prev = curr;
    }

    return prev[s2.length];
  }

  /**
   * Calculate similarity ratio between two strings (0-1 scale)
   * 1 = identical, 0 = completely different
   */
  static similarityRatio(s1, s2) {
    // Input validation
    if (!s1 || !s2 || typeof s1 !== 'string' || typeof s2 !== 'string') {
      return 0;
    }

    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;

    if (longer.length === 0) return 1.0;

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Tokenize text into words, removing punctuation and converting to lowercase
   */
  static tokenize(text) {
    // Input validation
    if (!text || typeof text !== 'string') {
      return [];
    }

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  /**
   * Calculate cosine similarity between two text strings
   * Returns value between 0 and 1
   */
  static cosineSimilarity(text1, text2) {
    // Input validation
    if (!text1 || !text2 || typeof text1 !== 'string' || typeof text2 !== 'string') {
      return 0;
    }

    const tokens1 = this.tokenize(text1);
    const tokens2 = this.tokenize(text2);

    // Handle empty tokens
    if (tokens1.length === 0 || tokens2.length === 0) {
      return 0;
    }

    // Build frequency maps
    const freq1 = {};
    const freq2 = {};
    const allWords = new Set([...tokens1, ...tokens2]);

    tokens1.forEach(word => freq1[word] = (freq1[word] || 0) + 1);
    tokens2.forEach(word => freq2[word] = (freq2[word] || 0) + 1);

    // Calculate dot product and magnitudes
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    allWords.forEach(word => {
      const f1 = freq1[word] || 0;
      const f2 = freq2[word] || 0;
      dotProduct += f1 * f2;
      magnitude1 += f1 * f1;
      magnitude2 += f2 * f2;
    });

    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);

    if (magnitude1 === 0 || magnitude2 === 0) return 0;

    return dotProduct / (magnitude1 * magnitude2);
  }

  /**
   * Detect language with confidence scoring
   * Improved to handle short texts and avoid false positives
   */
  static detectLanguage(text) {
    const tokens = this.tokenize(text);
    const config = typeof CONFIG !== 'undefined' ? CONFIG : {
      THRESHOLDS: { MIN_TOKENS_FOR_LANG_DETECT: 10, LANGUAGE_CONFIDENCE: 0.3 }
    };

    // Require minimum tokens for reliable detection
    if (tokens.length < config.THRESHOLDS.MIN_TOKENS_FOR_LANG_DETECT) {
      return 'en'; // Default to English for short texts
    }

    const patterns = {
      no: ['og', 'er', 'jeg', 'det', 'ikke'],
      de: ['und', 'der', 'die', 'das', 'ist'],
      es: ['que', 'de', 'el', 'la', 'es'],
      fr: ['que', 'de', 'le', 'la', 'est'],
      pt: ['que', 'de', 'o', 'a', 'é'],
      sv: ['och', 'är', 'jag', 'det', 'inte'],
      da: ['og', 'er', 'jeg', 'det', 'ikke'],
      ru: ['и', 'в', 'не', 'на', 'я'],
      pl: ['i', 'w', 'nie', 'na', 'jest']
    };

    // Calculate confidence scores for each language
    const scores = {};
    for (const [lang, words] of Object.entries(patterns)) {
      const matches = words.filter(w => tokens.includes(w));
      const uniqueMatches = new Set(matches).size;
      // Score based on unique matches (prevents common words from dominating)
      scores[lang] = uniqueMatches / words.length;
    }

    // Find language with highest confidence
    const entries = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const [bestLang, confidence] = entries[0] || ['en', 0];

    // Only use detected language if confidence is above threshold
    return confidence > config.THRESHOLDS.LANGUAGE_CONFIDENCE ? bestLang : 'en';
  }

  /**
   * Detect AI-generated buzzwords and corporate jargon (multilingual)
   * Returns count and list of detected buzzwords
   */
  static detectBuzzwords(text) {
    const lang = this.detectLanguage(text);

    const buzzwordsByLanguage = {
      en: [
        'synergy', 'synergies', 'leverage', 'leveraging', 'paradigm',
        'disruptive', 'innovative', 'game-changer', 'revolutionary',
        'cutting-edge', 'next-generation', 'world-class', 'best-in-class',
        'transformational', 'empower', 'empowering', 'holistic',
        'thought leader', 'thought leadership', 'deep dive', 'circle back',
        'touch base', 'move the needle', 'low-hanging fruit', 'win-win',
        'value-add', 'deliverables', 'bandwidth', 'ecosystem',
        'scalable', 'actionable', 'seamless', 'robust', 'optimize',
        'maximize', 'streamline', 'proactive', 'agile', 'dynamic'
      ],
      no: [
        'synergi', 'synergier', 'utnytte', 'paradigme', 'disruptiv',
        'innovativ', 'banebrytende', 'revolusjonerende', 'bærekraftig',
        'transformasjon', 'bemyndigende', 'helhetlig', 'tankeleder',
        'verdiøkende', 'leveranse', 'økosystem', 'skalerbar',
        'sømløs', 'robust', 'optimalisere', 'maksimere', 'strømlinjeforme',
        'proaktiv', 'smidig', 'dynamisk'
      ],
      de: [
        'synergie', 'synergien', 'hebeln', 'paradigma', 'disruptiv',
        'innovativ', 'bahnbrechend', 'revolutionär', 'nachhaltig',
        'transformation', 'ermächtigung', 'ganzheitlich', 'vordenker',
        'mehrwert', 'liefergegenstand', 'ökosystem', 'skalierbar',
        'nahtlos', 'robust', 'optimieren', 'maximieren', 'rationalisieren',
        'proaktiv', 'agil', 'dynamisch'
      ],
      es: [
        'sinergia', 'sinergias', 'apalancamiento', 'paradigma', 'disruptivo',
        'innovador', 'revolucionario', 'vanguardia', 'sostenible',
        'transformacional', 'empoderamiento', 'holístico', 'líder de opinión',
        'valor agregado', 'entregables', 'ecosistema', 'escalable',
        'sin fisuras', 'robusto', 'optimizar', 'maximizar', 'racionalizar',
        'proactivo', 'ágil', 'dinámico'
      ],
      fr: [
        'synergie', 'synergies', 'levier', 'paradigme', 'disruptif',
        'innovant', 'révolutionnaire', 'avant-garde', 'durable',
        'transformationnel', 'autonomisation', 'holistique', 'leader d\'opinion',
        'valeur ajoutée', 'livrables', 'écosystème', 'évolutif',
        'transparent', 'robuste', 'optimiser', 'maximiser', 'rationaliser',
        'proactif', 'agile', 'dynamique'
      ],
      pt: [
        'sinergia', 'sinergias', 'alavancagem', 'paradigma', 'disruptivo',
        'inovador', 'revolucionário', 'vanguarda', 'sustentável',
        'transformacional', 'empoderamento', 'holístico', 'líder de pensamento',
        'valor agregado', 'entregas', 'ecossistema', 'escalável',
        'perfeito', 'robusto', 'otimizar', 'maximizar', 'simplificar',
        'proativo', 'ágil', 'dinâmico'
      ],
      sv: [
        'synergi', 'synergier', 'hävstång', 'paradigm', 'disruptiv',
        'innovativ', 'banbrytande', 'revolutionerande', 'hållbar',
        'transformerande', 'bemyndigande', 'holistisk', 'tankeledar',
        'mervärde', 'leveranser', 'ekosystem', 'skalbar',
        'sömlös', 'robust', 'optimera', 'maximera', 'effektivisera',
        'proaktiv', 'smidig', 'dynamisk'
      ],
      da: [
        'synergi', 'synergier', 'løftestang', 'paradigme', 'disruptiv',
        'innovativ', 'banebrydende', 'revolutionerende', 'bæredygtig',
        'transformerende', 'bemyndigende', 'holistisk', 'tankeleder',
        'merværdi', 'leverancer', 'økosystem', 'skalerbar',
        'problemfri', 'robust', 'optimere', 'maksimere', 'strømline',
        'proaktiv', 'smidig', 'dynamisk'
      ],
      ru: [
        'синергия', 'рычаг', 'парадигма', 'инновационный', 'прорывной',
        'революционный', 'передовой', 'устойчивый', 'трансформация',
        'расширение возможностей', 'целостный', 'лидер мнений',
        'добавленная стоимость', 'экосистема', 'масштабируемый',
        'оптимизировать', 'максимизировать', 'проактивный', 'гибкий', 'динамичный'
      ],
      pl: [
        'synergia', 'dźwignia', 'paradygmat', 'innowacyjny', 'przełomowy',
        'rewolucyjny', 'awangardowy', 'zrównoważony', 'transformacja',
        'upodmiotowienie', 'holistyczny', 'lider myśli', 'wartość dodana',
        'ekosystem', 'skalowalny', 'optymalizować', 'maksymalizować',
        'proaktywny', 'zwinny', 'dynamiczny'
      ]
    };

    const buzzwords = buzzwordsByLanguage[lang] || buzzwordsByLanguage.en;
    const lowerText = text.toLowerCase();
    const found = [];

    buzzwords.forEach(buzzword => {
      if (lowerText.includes(buzzword)) {
        found.push(buzzword);
      }
    });

    return {
      count: found.length,
      buzzwords: found,
      density: found.length / this.tokenize(text).length,
      detectedLanguage: lang
    };
  }

  /**
   * Detect repetitive patterns in text
   * Returns true if text contains suspicious repetition
   */
  static detectRepetition(text, threshold = 0.3) {
    // Input validation
    if (!text || typeof text !== 'string') {
      return { isRepetitive: false, score: 0 };
    }

    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

    if (sentences.length < 2) return { isRepetitive: false, score: 0 };

    // Performance optimization: limit comparisons for large texts
    const config = typeof CONFIG !== 'undefined' ? CONFIG : { PERFORMANCE: { MAX_SENTENCES_TO_COMPARE: 50 } };
    const sentencesToAnalyze = sentences.slice(0, config.PERFORMANCE.MAX_SENTENCES_TO_COMPARE);

    let totalSimilarity = 0;
    let comparisons = 0;

    // Further optimization: sample comparisons for very large texts
    const threshold = config.PERFORMANCE?.LARGE_DATASET_THRESHOLD || 20;
    const windowSize = config.PERFORMANCE?.COMPARISON_WINDOW_SMALL || 4;

    if (sentencesToAnalyze.length > threshold) {
      // For large texts, only compare each sentence with next few sentences
      for (let i = 0; i < sentencesToAnalyze.length - 1; i++) {
        const maxJ = Math.min(i + windowSize, sentencesToAnalyze.length);
        for (let j = i + 1; j < maxJ; j++) {
          const similarity = this.cosineSimilarity(sentencesToAnalyze[i], sentencesToAnalyze[j]);
          totalSimilarity += similarity;
          comparisons++;
        }
      }
    } else {
      // For smaller texts, compare all pairs
      for (let i = 0; i < sentencesToAnalyze.length - 1; i++) {
        for (let j = i + 1; j < sentencesToAnalyze.length; j++) {
          const similarity = this.cosineSimilarity(sentencesToAnalyze[i], sentencesToAnalyze[j]);
          totalSimilarity += similarity;
          comparisons++;
        }
      }
    }

    const avgSimilarity = comparisons > 0 ? totalSimilarity / comparisons : 0;

    return {
      isRepetitive: avgSimilarity > threshold,
      score: avgSimilarity
    };
  }

  /**
   * Detect AI-like writing patterns
   * Returns a score from 0-1 indicating likelihood of AI generation
   */
  static detectAIPatterns(text) {
    const indicators = {
      buzzwordDensity: 0,
      repetitiveness: 0,
      averageSentenceLength: 0,
      formalityScore: 0
    };

    // Check buzzword density
    const buzzwordAnalysis = this.detectBuzzwords(text);
    indicators.buzzwordDensity = Math.min(buzzwordAnalysis.density * 10, 1);

    // Check repetitiveness
    const repetitionAnalysis = this.detectRepetition(text);
    indicators.repetitiveness = repetitionAnalysis.score;

    // Check sentence length (AI tends to have more uniform sentence lengths)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length > 0) {
      const lengths = sentences.map(s => s.trim().split(/\s+/).length);
      const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
      const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / lengths.length;

      // Low variance suggests AI (more uniform)
      const config = typeof CONFIG !== 'undefined' ? CONFIG : { THRESHOLDS: { SENTENCE_VARIANCE: 20 } };
      indicators.averageSentenceLength = variance < config.THRESHOLDS.SENTENCE_VARIANCE ? 0.7 : 0.3;
    }

    // Check for overly formal language patterns
    const formalWords = ['furthermore', 'moreover', 'therefore', 'consequently', 'additionally', 'specifically'];
    const tokens = this.tokenize(text);
    const formalCount = tokens.filter(t => formalWords.includes(t)).length;
    indicators.formalityScore = Math.min(formalCount / tokens.length * 20, 1);

    // Calculate overall AI likelihood score
    const config = typeof CONFIG !== 'undefined' ? CONFIG : {
      WEIGHTS: {
        AI_DETECTION: {
          BUZZWORD_DENSITY: 0.3,
          REPETITIVENESS: 0.3,
          SENTENCE_LENGTH: 0.2,
          FORMALITY_SCORE: 0.2
        }
      },
      THRESHOLDS: { SENTENCE_VARIANCE: 20 }
    };

    const weights = {
      buzzwordDensity: config.WEIGHTS.AI_DETECTION.BUZZWORD_DENSITY,
      repetitiveness: config.WEIGHTS.AI_DETECTION.REPETITIVENESS,
      averageSentenceLength: config.WEIGHTS.AI_DETECTION.SENTENCE_LENGTH,
      formalityScore: config.WEIGHTS.AI_DETECTION.FORMALITY_SCORE
    };

    const aiScore = Object.keys(indicators).reduce((score, key) => {
      return score + (indicators[key] * weights[key]);
    }, 0);

    return {
      score: aiScore,
      indicators,
      isLikelyAI: aiScore > 0.6
    };
  }

  /**
   * Check if multiple comments are suspiciously similar (coordinated behavior)
   */
  static detectCoordinatedComments(comments, threshold = 0.7) {
    // Input validation
    if (!comments || !Array.isArray(comments) || comments.length < 2) {
      return {
        hasSuspiciousPatterns: false,
        matches: []
      };
    }

    const suspicious = [];

    // Performance optimization: limit comparisons for large comment sets
    const config = typeof CONFIG !== 'undefined' ? CONFIG : {
      PERFORMANCE: {
        MAX_COMMENTS_TO_COMPARE: 100,
        COORDINATED_COMPARE_WINDOW: 11,
        LARGE_DATASET_THRESHOLD: 50
      }
    };
    const commentsToAnalyze = comments.slice(0, config.PERFORMANCE.MAX_COMMENTS_TO_COMPARE);

    // Further optimization: for large sets, sample comparisons
    if (commentsToAnalyze.length > config.PERFORMANCE.LARGE_DATASET_THRESHOLD) {
      // For large sets, only compare each comment with next few comments
      for (let i = 0; i < commentsToAnalyze.length - 1; i++) {
        const maxJ = Math.min(i + config.PERFORMANCE.COORDINATED_COMPARE_WINDOW, commentsToAnalyze.length);
        for (let j = i + 1; j < maxJ; j++) {
          if (!commentsToAnalyze[i].text || !commentsToAnalyze[j].text) continue;

          const similarity = this.cosineSimilarity(commentsToAnalyze[i].text, commentsToAnalyze[j].text);

          if (similarity > threshold) {
            suspicious.push({
              index1: i,
              index2: j,
              similarity,
              text1: commentsToAnalyze[i].text.substring(0, 100),
              text2: commentsToAnalyze[j].text.substring(0, 100)
            });
          }
        }
      }
    } else {
      // For smaller sets, compare all pairs
      for (let i = 0; i < commentsToAnalyze.length - 1; i++) {
        for (let j = i + 1; j < commentsToAnalyze.length; j++) {
          if (!commentsToAnalyze[i].text || !commentsToAnalyze[j].text) continue;

          const similarity = this.cosineSimilarity(commentsToAnalyze[i].text, commentsToAnalyze[j].text);

          if (similarity > threshold) {
            suspicious.push({
              index1: i,
              index2: j,
              similarity,
              text1: commentsToAnalyze[i].text.substring(0, 100),
              text2: commentsToAnalyze[j].text.substring(0, 100)
            });
          }
        }
      }
    }

    return {
      hasSuspiciousPatterns: suspicious.length > 0,
      matches: suspicious
    };
  }

  /**
   * Extract key statistics from text
   */
  static getTextStats(text) {
    const words = this.tokenize(text);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const characters = text.replace(/\s/g, '').length;

    return {
      wordCount: words.length,
      sentenceCount: sentences.length,
      characterCount: characters,
      averageWordLength: words.reduce((sum, w) => sum + w.length, 0) / words.length || 0,
      averageSentenceLength: words.length / sentences.length || 0
    };
  }

  /**
   * Normalize text for comparison (remove extra spaces, lowercase, etc.)
   */
  static normalizeText(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '');
  }

  /**
   * Check if text matches common spam patterns
   */
  static detectSpamPatterns(text) {
    const spamPatterns = [
      /click here/i,
      /buy now/i,
      /limited time/i,
      /act now/i,
      /free money/i,
      /earn \$\d+/i,
      /work from home/i,
      /http[s]?:\/\/bit\.ly/i,
      /http[s]?:\/\/tinyurl/i,
      /\d{10,}/,  // Long numbers (phone numbers)
      /(telegram|whatsapp|dm me)/i
    ];

    const matches = spamPatterns.filter(pattern => pattern.test(text));

    const config = typeof CONFIG !== 'undefined' ? CONFIG : { THRESHOLDS: { SPAM_CONFIDENCE: 0.3 } };

    return {
      isSpam: matches.length > 0,
      matchCount: matches.length,
      confidence: Math.min(matches.length * config.THRESHOLDS.SPAM_CONFIDENCE, 1)
    };
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  window.TextAnalysisUtils = TextAnalysisUtils;
}
