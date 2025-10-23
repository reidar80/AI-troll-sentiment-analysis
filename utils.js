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
    const len1 = s1.length;
    const len2 = s2.length;
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
    const tokens1 = this.tokenize(text1);
    const tokens2 = this.tokenize(text2);

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
   * Detect AI-generated buzzwords and corporate jargon
   * Returns count and list of detected buzzwords
   */
  static detectBuzzwords(text) {
    const buzzwords = [
      'synergy', 'synergies', 'leverage', 'leveraging', 'paradigm',
      'disruptive', 'innovative', 'game-changer', 'revolutionary',
      'cutting-edge', 'next-generation', 'world-class', 'best-in-class',
      'transformational', 'empower', 'empowering', 'holistic',
      'thought leader', 'thought leadership', 'deep dive', 'circle back',
      'touch base', 'move the needle', 'low-hanging fruit', 'win-win',
      'value-add', 'deliverables', 'bandwidth', 'ecosystem',
      'scalable', 'actionable', 'seamless', 'robust', 'optimize',
      'maximize', 'streamline', 'proactive', 'agile', 'dynamic'
    ];

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
      density: found.length / this.tokenize(text).length
    };
  }

  /**
   * Detect repetitive patterns in text
   * Returns true if text contains suspicious repetition
   */
  static detectRepetition(text, threshold = 0.3) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

    if (sentences.length < 2) return { isRepetitive: false, score: 0 };

    let totalSimilarity = 0;
    let comparisons = 0;

    for (let i = 0; i < sentences.length - 1; i++) {
      for (let j = i + 1; j < sentences.length; j++) {
        const similarity = this.cosineSimilarity(sentences[i], sentences[j]);
        totalSimilarity += similarity;
        comparisons++;
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
    const suspicious = [];

    for (let i = 0; i < comments.length - 1; i++) {
      for (let j = i + 1; j < comments.length; j++) {
        const similarity = this.cosineSimilarity(comments[i].text, comments[j].text);

        if (similarity > threshold) {
          suspicious.push({
            index1: i,
            index2: j,
            similarity,
            text1: comments[i].text.substring(0, 100),
            text2: comments[j].text.substring(0, 100)
          });
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
