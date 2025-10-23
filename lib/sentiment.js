/**
 * sentiment.js - Lightweight sentiment analysis library
 * VADER-inspired sentiment analysis for browser-based text analysis
 */

class SentimentAnalyzer {
  constructor() {
    // Sentiment lexicon with scores from -1 (negative) to +1 (positive)
    this.lexicon = {
      // Positive words
      'amazing': 0.9, 'awesome': 0.9, 'excellent': 0.8, 'fantastic': 0.9,
      'wonderful': 0.8, 'great': 0.7, 'good': 0.6, 'nice': 0.5,
      'love': 0.8, 'loved': 0.8, 'loving': 0.8, 'like': 0.5,
      'best': 0.8, 'brilliant': 0.8, 'perfect': 0.9, 'outstanding': 0.9,
      'superb': 0.8, 'impressive': 0.7, 'beautiful': 0.7, 'incredible': 0.8,
      'happy': 0.7, 'delighted': 0.8, 'pleased': 0.6, 'excited': 0.7,
      'inspiring': 0.7, 'innovative': 0.6, 'powerful': 0.6, 'strong': 0.5,
      'helpful': 0.6, 'useful': 0.5, 'valuable': 0.6, 'appreciate': 0.6,
      'thanks': 0.5, 'thank': 0.5, 'grateful': 0.7, 'gratitude': 0.7,
      'yes': 0.3, 'agree': 0.4, 'correct': 0.4, 'true': 0.3,

      // Negative words
      'terrible': -0.9, 'awful': -0.9, 'horrible': -0.9, 'bad': -0.7,
      'worst': -0.9, 'poor': -0.6, 'disappointing': -0.7, 'disappointed': -0.7,
      'hate': -0.9, 'hated': -0.9, 'hating': -0.9, 'dislike': -0.6,
      'disgusting': -0.8, 'gross': -0.7, 'nasty': -0.7, 'annoying': -0.6,
      'annoyed': -0.6, 'angry': -0.8, 'mad': -0.7, 'furious': -0.9,
      'stupid': -0.8, 'dumb': -0.7, 'idiotic': -0.8, 'ridiculous': -0.6,
      'useless': -0.7, 'worthless': -0.8, 'pathetic': -0.8, 'trash': -0.8,
      'garbage': -0.7, 'sucks': -0.8, 'fail': -0.6, 'failed': -0.6,
      'wrong': -0.5, 'false': -0.4, 'lie': -0.7, 'lying': -0.7,
      'scam': -0.9, 'fraud': -0.9, 'fake': -0.7, 'boring': -0.5,
      'sad': -0.6, 'unhappy': -0.6, 'depressed': -0.8, 'depressing': -0.7,

      // Neutral/context
      'ok': 0.1, 'okay': 0.1, 'fine': 0.2, 'alright': 0.2,
      'maybe': 0, 'perhaps': 0, 'possibly': 0
    };

    // Intensifiers (boosters)
    this.boosters = {
      'very': 0.3, 'really': 0.3, 'extremely': 0.4, 'incredibly': 0.4,
      'absolutely': 0.4, 'completely': 0.3, 'totally': 0.3, 'highly': 0.3,
      'so': 0.2, 'too': 0.2, 'quite': 0.2, 'pretty': 0.2,
      'exceptionally': 0.4, 'particularly': 0.3, 'especially': 0.3
    };

    // Dampeners (reducers)
    this.dampeners = {
      'barely': -0.3, 'hardly': -0.3, 'slightly': -0.2, 'somewhat': -0.2,
      'kind of': -0.2, 'sort of': -0.2, 'a bit': -0.2, 'a little': -0.2
    };

    // Negations
    this.negations = [
      'not', 'no', 'never', 'none', 'nobody', 'nothing', 'neither',
      'nowhere', 'cannot', "can't", "won't", "wouldn't", "shouldn't",
      "didn't", "doesn't", "don't", "isn't", "aren't", "wasn't", "weren't"
    ];

    // Emoji sentiment
    this.emojiSentiment = {
      '😊': 0.6, '😃': 0.7, '😄': 0.7, '😁': 0.7, '😆': 0.6,
      '😍': 0.8, '🥰': 0.8, '😘': 0.7, '❤️': 0.8, '💕': 0.7,
      '👍': 0.5, '👏': 0.6, '🎉': 0.7, '✨': 0.5, '💯': 0.7,
      '😢': -0.6, '😭': -0.7, '😞': -0.6, '😔': -0.6, '😟': -0.6,
      '😠': -0.7, '😡': -0.8, '🤬': -0.9, '💔': -0.7, '👎': -0.6,
      '😐': 0, '😑': 0, '😶': 0, '🤔': 0, '🤷': 0
    };

    // Punctuation impact
    this.exclamationBoost = 0.292;
    this.questionNeutral = 0.18;
  }

  /**
   * Tokenize text into words and clean
   */
  tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s!?]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  /**
   * Check if word is in negation window (3 words before)
   */
  isNegated(tokens, index) {
    const window = 3;
    for (let i = Math.max(0, index - window); i < index; i++) {
      if (this.negations.includes(tokens[i])) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get booster/dampener value in window before word
   */
  getModifier(tokens, index) {
    let modifier = 0;
    const window = 2;

    for (let i = Math.max(0, index - window); i < index; i++) {
      const token = tokens[i];
      if (this.boosters[token]) {
        modifier += this.boosters[token];
      } else if (this.dampeners[token]) {
        modifier += this.dampeners[token];
      }
    }

    return modifier;
  }

  /**
   * Count punctuation emphasis
   */
  countPunctuation(text) {
    const exclamations = (text.match(/!/g) || []).length;
    const questions = (text.match(/\?/g) || []).length;

    return {
      exclamations,
      questions,
      emphasisBoost: Math.min(exclamations * this.exclamationBoost, 1)
    };
  }

  /**
   * Extract and score emojis
   */
  scoreEmojis(text) {
    let emojiScore = 0;
    let emojiCount = 0;

    for (const [emoji, score] of Object.entries(this.emojiSentiment)) {
      const count = (text.match(new RegExp(emoji, 'g')) || []).length;
      if (count > 0) {
        emojiScore += score * count;
        emojiCount += count;
      }
    }

    return { emojiScore, emojiCount };
  }

  /**
   * Analyze sentiment of text
   * Returns detailed sentiment analysis
   */
  analyze(text) {
    if (!text || text.trim().length === 0) {
      return this.getDefaultResult();
    }

    const tokens = this.tokenize(text);
    const punctuation = this.countPunctuation(text);
    const emojiData = this.scoreEmojis(text);

    let sentimentScore = 0;
    let positiveCount = 0;
    let negativeCount = 0;
    const sentimentWords = [];

    // Analyze each token
    tokens.forEach((token, index) => {
      if (this.lexicon[token]) {
        let score = this.lexicon[token];
        const isNeg = this.isNegated(tokens, index);
        const modifier = this.getModifier(tokens, index);

        // Apply negation (flip and dampen)
        if (isNeg) {
          score *= -0.74;
        }

        // Apply booster/dampener
        if (modifier !== 0) {
          if (score > 0) {
            score += modifier;
          } else {
            score -= modifier;
          }
        }

        // Clamp between -1 and 1
        score = Math.max(-1, Math.min(1, score));

        sentimentScore += score;
        sentimentWords.push({ word: token, score });

        if (score > 0) positiveCount++;
        if (score < 0) negativeCount++;
      }
    });

    // Add emoji sentiment
    sentimentScore += emojiData.emojiScore;

    // Apply punctuation emphasis
    if (sentimentScore > 0) {
      sentimentScore += punctuation.emphasisBoost;
    } else if (sentimentScore < 0) {
      sentimentScore -= punctuation.emphasisBoost;
    }

    // Normalize score to -1 to 1 range
    const wordCount = tokens.length || 1;
    const normalizedScore = sentimentScore / Math.sqrt(wordCount);
    const finalScore = Math.max(-1, Math.min(1, normalizedScore));

    // Calculate compound score (VADER-style)
    const alpha = 15;
    const compound = finalScore / Math.sqrt((finalScore * finalScore) + alpha);

    // Determine classification
    let classification = 'neutral';
    if (compound >= 0.05) {
      classification = 'positive';
    } else if (compound <= -0.05) {
      classification = 'negative';
    }

    // Detect extreme sentiment
    const isExtreme = Math.abs(compound) > 0.7;

    return {
      score: finalScore,
      compound,
      classification,
      isExtreme,
      positive: positiveCount,
      negative: negativeCount,
      neutral: wordCount - positiveCount - negativeCount,
      wordCount,
      sentimentWords,
      emojiCount: emojiData.emojiCount,
      exclamationCount: punctuation.exclamations
    };
  }

  /**
   * Get default result for empty text
   */
  getDefaultResult() {
    return {
      score: 0,
      compound: 0,
      classification: 'neutral',
      isExtreme: false,
      positive: 0,
      negative: 0,
      neutral: 0,
      wordCount: 0,
      sentimentWords: [],
      emojiCount: 0,
      exclamationCount: 0
    };
  }

  /**
   * Batch analyze multiple texts
   */
  analyzeMultiple(texts) {
    return texts.map(text => this.analyze(text));
  }

  /**
   * Get aggregate statistics for multiple texts
   */
  getAggregateStats(texts) {
    const analyses = this.analyzeMultiple(texts);

    const total = analyses.length;
    const positive = analyses.filter(a => a.classification === 'positive').length;
    const negative = analyses.filter(a => a.classification === 'negative').length;
    const neutral = analyses.filter(a => a.classification === 'neutral').length;
    const extreme = analyses.filter(a => a.isExtreme).length;

    const avgCompound = analyses.reduce((sum, a) => sum + a.compound, 0) / total;

    return {
      total,
      positive,
      negative,
      neutral,
      extreme,
      positivePercent: (positive / total) * 100,
      negativePercent: (negative / total) * 100,
      neutralPercent: (neutral / total) * 100,
      extremePercent: (extreme / total) * 100,
      averageCompound: avgCompound
    };
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  window.SentimentAnalyzer = SentimentAnalyzer;
}
