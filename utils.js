/**
 * utils.js - Utility functions for text analysis and similarity detection
 * Contains tools for Levenshtein distance, cosine similarity, and pattern detection
 */

class TextAnalysisUtils {

  /**
   * Calculate Levenshtein distance between two strings
   * Returns the minimum number of edits needed to transform s1 into s2
   */
  static levenshteinDistance(s1, s2) {
    // Input validation
    if (!s1 || !s2 || typeof s1 !== 'string' || typeof s2 !== 'string') {
      return 0;
    }

    const len1 = s1.length;
    const len2 = s2.length;

    // Handle edge cases
    if (len1 === 0) return len2;
    if (len2 === 0) return len1;

    const matrix = [];

    // Initialize matrix
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,      // deletion
          matrix[i][j - 1] + 1,      // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }

    return matrix[len1][len2];
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
   * Detect language (simple pattern matching)
   */
  static detectLanguage(text) {
    const lowerText = text.toLowerCase();
    const tokens = this.tokenize(text);

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

    let maxScore = 0;
    let detectedLang = 'en';

    for (const [lang, words] of Object.entries(patterns)) {
      const score = words.filter(w => tokens.includes(w)).length;
      if (score > maxScore) {
        maxScore = score;
        detectedLang = lang;
      }
    }

    return maxScore > 0 ? detectedLang : 'en';
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
    const MAX_SENTENCES_TO_COMPARE = 50;
    const sentencesToAnalyze = sentences.slice(0, MAX_SENTENCES_TO_COMPARE);

    let totalSimilarity = 0;
    let comparisons = 0;

    // Further optimization: sample comparisons for very large texts
    if (sentencesToAnalyze.length > 20) {
      // For large texts, only compare each sentence with next 3 sentences
      for (let i = 0; i < sentencesToAnalyze.length - 1; i++) {
        const maxJ = Math.min(i + 4, sentencesToAnalyze.length);
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
      indicators.averageSentenceLength = variance < 20 ? 0.7 : 0.3;
    }

    // Check for overly formal language patterns
    const formalWords = ['furthermore', 'moreover', 'therefore', 'consequently', 'additionally', 'specifically'];
    const tokens = this.tokenize(text);
    const formalCount = tokens.filter(t => formalWords.includes(t)).length;
    indicators.formalityScore = Math.min(formalCount / tokens.length * 20, 1);

    // Calculate overall AI likelihood score
    const weights = {
      buzzwordDensity: 0.3,
      repetitiveness: 0.3,
      averageSentenceLength: 0.2,
      formalityScore: 0.2
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
    const MAX_COMMENTS_TO_COMPARE = 100;
    const commentsToAnalyze = comments.slice(0, MAX_COMMENTS_TO_COMPARE);

    // Further optimization: for large sets, sample comparisons
    if (commentsToAnalyze.length > 50) {
      // For large sets, only compare each comment with next 10 comments
      for (let i = 0; i < commentsToAnalyze.length - 1; i++) {
        const maxJ = Math.min(i + 11, commentsToAnalyze.length);
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

    return {
      isSpam: matches.length > 0,
      matchCount: matches.length,
      confidence: Math.min(matches.length * 0.3, 1)
    };
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  window.TextAnalysisUtils = TextAnalysisUtils;
}
