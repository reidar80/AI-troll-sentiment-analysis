/**
 * profileAnalyzer.js - Detects AI-generated or troll profiles
 * Specialized for LinkedIn but extensible to other platforms
 */

class ProfileAnalyzer {
  constructor() {
    this.sentimentAnalyzer = new SentimentAnalyzer();
    this.utils = TextAnalysisUtils;

    // Thresholds for detection
    this.thresholds = {
      buzzwordDensity: 0.15,        // 15% buzzwords is suspicious
      aiPatternScore: 0.6,           // 60% AI likelihood
      repetitionScore: 0.4,          // 40% similarity between posts
      extremeSentimentRatio: 0.5,    // 50% posts with extreme sentiment
      postingSimilarity: 0.7,        // 70% similarity between posts
      minPostsForAnalysis: 3         // Need at least 3 posts
    };
  }

  /**
   * Analyze a user profile for signs of AI generation or troll behavior
   * @param {Object} profileData - Contains bio, posts, and metadata
   * @returns {Object} Analysis results with scores and flags
   */
  analyzeProfile(profileData) {
    const {
      bio = '',
      posts = [],
      headline = '',
      about = '',
      username = '',
      metadata = {}
    } = profileData;

    const results = {
      overallScore: 0,
      isLikelySuspicious: false,
      isTroll: false,
      isAIGenerated: false,
      confidence: 0,
      flags: [],
      details: {}
    };

    // Combine all text for comprehensive analysis
    const allText = [bio, headline, about, ...posts.map(p => p.text || p)].join(' ');

    if (allText.trim().length === 0) {
      results.flags.push('No content to analyze');
      return results;
    }

    // 1. Analyze bio/headline for AI patterns
    const bioAnalysis = this.analyzeBioText(bio + ' ' + headline + ' ' + about);
    results.details.bioAnalysis = bioAnalysis;

    if (bioAnalysis.aiScore > this.thresholds.aiPatternScore) {
      results.flags.push('Bio shows AI-generated patterns');
      results.overallScore += 0.2;
    }

    if (bioAnalysis.buzzwordDensity > this.thresholds.buzzwordDensity) {
      results.flags.push('Excessive buzzwords in bio');
      results.overallScore += 0.15;
    }

    // 2. Analyze posts for patterns
    if (posts.length >= this.thresholds.minPostsForAnalysis) {
      const postAnalysis = this.analyzePostPatterns(posts);
      results.details.postAnalysis = postAnalysis;

      // Check for repetitive posting
      if (postAnalysis.repetitionScore > this.thresholds.repetitionScore) {
        results.flags.push('Posts are suspiciously similar');
        results.overallScore += 0.25;
      }

      // Check for coordinated sentiment (troll behavior)
      if (postAnalysis.extremeSentimentRatio > this.thresholds.extremeSentimentRatio) {
        results.flags.push('Unusual sentiment patterns detected');
        results.overallScore += 0.2;
        results.isTroll = true;
      }

      // Check for AI writing patterns
      if (postAnalysis.avgAIScore > this.thresholds.aiPatternScore) {
        results.flags.push('Posts show AI-like writing patterns');
        results.overallScore += 0.25;
        results.isAIGenerated = true;
      }

      // Check posting frequency patterns
      const frequencyAnalysis = this.analyzePostingFrequency(posts);
      results.details.frequencyAnalysis = frequencyAnalysis;

      if (frequencyAnalysis.isSuspicious) {
        results.flags.push(frequencyAnalysis.reason);
        results.overallScore += 0.15;
      }
    } else {
      results.flags.push('Insufficient posts for pattern analysis');
    }

    // 3. Username analysis
    const usernameAnalysis = this.analyzeUsername(username);
    results.details.usernameAnalysis = usernameAnalysis;

    if (usernameAnalysis.isSuspicious) {
      results.flags.push('Suspicious username pattern');
      results.overallScore += 0.1;
    }

    // 4. Overall classification
    results.overallScore = Math.min(results.overallScore, 1);
    results.confidence = results.overallScore;
    results.isLikelySuspicious = results.overallScore > 0.5;

    // Determine primary classification
    if (results.overallScore > 0.7) {
      results.classification = 'High Risk';
    } else if (results.overallScore > 0.5) {
      results.classification = 'Suspicious';
    } else if (results.overallScore > 0.3) {
      results.classification = 'Potentially Suspicious';
    } else {
      results.classification = 'Likely Genuine';
    }

    return results;
  }

  /**
   * Analyze bio/headline text for AI patterns
   */
  analyzeBioText(text) {
    if (!text || text.trim().length === 0) {
      return { aiScore: 0, buzzwordDensity: 0, flags: [] };
    }

    const aiAnalysis = this.utils.detectAIPatterns(text);
    const buzzwords = this.utils.detectBuzzwords(text);
    const sentiment = this.sentimentAnalyzer.analyze(text);

    const flags = [];

    // Check for generic AI-generated bio phrases
    const genericPhrases = [
      /passionate about/i,
      /helping (companies|organizations|businesses)/i,
      /drive results/i,
      /proven track record/i,
      /results-driven/i,
      /detail-oriented/i,
      /team player/i,
      /think outside the box/i,
      /go-getter/i
    ];

    const genericMatches = genericPhrases.filter(phrase => phrase.test(text)).length;

    if (genericMatches > 2) {
      flags.push('Contains multiple generic phrases');
    }

    return {
      aiScore: aiAnalysis.score,
      buzzwordDensity: buzzwords.density,
      buzzwordCount: buzzwords.count,
      genericPhraseCount: genericMatches,
      sentiment: sentiment.classification,
      flags
    };
  }

  /**
   * Analyze patterns across multiple posts
   */
  analyzePostPatterns(posts) {
    if (!posts || posts.length === 0) {
      return { repetitionScore: 0, avgAIScore: 0, extremeSentimentRatio: 0 };
    }

    const postTexts = posts.map(p => typeof p === 'string' ? p : p.text || '');
    const validTexts = postTexts.filter(t => t.trim().length > 0);

    if (validTexts.length === 0) {
      return { repetitionScore: 0, avgAIScore: 0, extremeSentimentRatio: 0 };
    }

    // Performance optimization: limit posts analyzed
    const MAX_POSTS_TO_ANALYZE = 50;
    const textsToAnalyze = validTexts.slice(0, MAX_POSTS_TO_ANALYZE);

    // Check similarity between posts
    let totalSimilarity = 0;
    let comparisons = 0;

    // Optimize O(n²) comparison
    if (textsToAnalyze.length > 20) {
      // For many posts, only compare each with next 5 posts
      for (let i = 0; i < textsToAnalyze.length - 1; i++) {
        const maxJ = Math.min(i + 6, textsToAnalyze.length);
        for (let j = i + 1; j < maxJ; j++) {
          const similarity = this.utils.cosineSimilarity(textsToAnalyze[i], textsToAnalyze[j]);
          totalSimilarity += similarity;
          comparisons++;
        }
      }
    } else {
      // For fewer posts, compare all pairs
      for (let i = 0; i < textsToAnalyze.length - 1; i++) {
        for (let j = i + 1; j < textsToAnalyze.length; j++) {
          const similarity = this.utils.cosineSimilarity(textsToAnalyze[i], textsToAnalyze[j]);
          totalSimilarity += similarity;
          comparisons++;
        }
      }
    }

    const repetitionScore = comparisons > 0 ? totalSimilarity / comparisons : 0;

    // Analyze AI patterns in each post
    const aiScores = textsToAnalyze.map(text => this.utils.detectAIPatterns(text).score);
    const avgAIScore = aiScores.reduce((sum, score) => sum + score, 0) / aiScores.length;

    // Analyze sentiment distribution
    const sentiments = textsToAnalyze.map(text => this.sentimentAnalyzer.analyze(text));
    const extremeCount = sentiments.filter(s => s.isExtreme).length;
    const extremeSentimentRatio = extremeCount / sentiments.length;

    // Check for sentiment manipulation (all positive or all negative)
    const positiveCount = sentiments.filter(s => s.classification === 'positive').length;
    const negativeCount = sentiments.filter(s => s.classification === 'negative').length;

    const isUniformSentiment = (positiveCount / textsToAnalyze.length > 0.8) ||
                               (negativeCount / textsToAnalyze.length > 0.8);

    return {
      repetitionScore,
      avgAIScore,
      extremeSentimentRatio,
      isUniformSentiment,
      sentimentDistribution: {
        positive: positiveCount,
        negative: negativeCount,
        neutral: sentiments.filter(s => s.classification === 'neutral').length
      }
    };
  }

  /**
   * Analyze posting frequency and timing patterns
   */
  analyzePostingFrequency(posts) {
    if (!posts || posts.length < 3) {
      return { isSuspicious: false, reason: '' };
    }

    // If posts have timestamps, analyze them
    const postsWithTime = posts.filter(p => p.timestamp || p.date);

    if (postsWithTime.length >= 3) {
      const timestamps = postsWithTime.map(p => {
        const time = p.timestamp || p.date;
        return typeof time === 'number' ? time : new Date(time).getTime();
      }).sort();

      // Calculate intervals between posts
      const intervals = [];
      for (let i = 1; i < timestamps.length; i++) {
        intervals.push(timestamps[i] - timestamps[i - 1]);
      }

      // Check for suspiciously regular intervals (bot behavior)
      const avgInterval = intervals.reduce((sum, i) => sum + i, 0) / intervals.length;
      const variance = intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / intervals.length;
      const stdDev = Math.sqrt(variance);

      // Very low variance suggests automated posting
      if (stdDev < avgInterval * 0.1 && intervals.length > 5) {
        return {
          isSuspicious: true,
          reason: 'Posts made at suspiciously regular intervals'
        };
      }

      // Check for burst posting (many posts in short time)
      const recentPosts = timestamps.filter(t => {
        const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
        return t > dayAgo;
      });

      if (recentPosts.length > 10) {
        return {
          isSuspicious: true,
          reason: 'Unusual posting frequency detected'
        };
      }
    }

    return { isSuspicious: false, reason: '' };
  }

  /**
   * Analyze username for suspicious patterns
   */
  analyzeUsername(username) {
    if (!username) {
      return { isSuspicious: false, flags: [] };
    }

    const flags = [];
    let suspicionScore = 0;

    // Check for random character patterns
    const randomPattern = /^[a-z]+\d{4,}$/i;  // name followed by many numbers
    if (randomPattern.test(username)) {
      flags.push('Username follows random pattern (name + numbers)');
      suspicionScore += 0.3;
    }

    // Check for excessive numbers
    const numberCount = (username.match(/\d/g) || []).length;
    if (numberCount > username.length * 0.4) {
      flags.push('Excessive numbers in username');
      suspicionScore += 0.2;
    }

    // Check for generic names
    const genericNames = ['user', 'guest', 'admin', 'test', 'demo', 'account'];
    const hasGeneric = genericNames.some(name => username.toLowerCase().includes(name));
    if (hasGeneric) {
      flags.push('Contains generic username pattern');
      suspicionScore += 0.3;
    }

    // Check for randomly generated appearance
    const hasVowels = /[aeiou]/i.test(username);
    const consonantRuns = username.match(/[bcdfghjklmnpqrstvwxyz]{4,}/gi);
    if (!hasVowels || consonantRuns) {
      flags.push('Username appears randomly generated');
      suspicionScore += 0.2;
    }

    return {
      isSuspicious: suspicionScore > 0.3,
      suspicionScore,
      flags
    };
  }

  /**
   * Quick check for a single piece of content (comment/post)
   */
  analyzeContent(text) {
    const sentiment = this.sentimentAnalyzer.analyze(text);
    const aiPatterns = this.utils.detectAIPatterns(text);
    const buzzwords = this.utils.detectBuzzwords(text);
    const spam = this.utils.detectSpamPatterns(text);

    let suspicionScore = 0;
    const flags = [];

    if (aiPatterns.isLikelyAI) {
      flags.push('AI-like writing detected');
      suspicionScore += 0.3;
    }

    if (sentiment.isExtreme) {
      flags.push('Extreme sentiment detected');
      suspicionScore += 0.2;
    }

    if (buzzwords.density > 0.2) {
      flags.push('High buzzword density');
      suspicionScore += 0.2;
    }

    if (spam.isSpam) {
      flags.push('Spam patterns detected');
      suspicionScore += 0.4;
    }

    return {
      suspicionScore,
      isSuspicious: suspicionScore > 0.4,
      flags,
      sentiment: sentiment.classification,
      aiScore: aiPatterns.score,
      details: {
        sentiment,
        aiPatterns,
        buzzwords,
        spam
      }
    };
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  window.ProfileAnalyzer = ProfileAnalyzer;
}
