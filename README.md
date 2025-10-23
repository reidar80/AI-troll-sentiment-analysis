# 🛡️ AI Troll Detector - Chrome Extension

A powerful Chrome extension that detects AI-generated content and coordinated troll activity in comment sections and user profiles. Specializes in LinkedIn analysis but works across multiple platforms including YouTube, Reddit, and other websites.

## 🎯 Features

### Core Detection Capabilities
- **Sentiment Analysis**: Real-time sentiment scoring using VADER-inspired algorithms
- **AI Pattern Detection**: Identifies AI-generated text using multiple heuristics
- **Similarity Detection**: Flags repetitive or coordinated comments using Levenshtein distance and cosine similarity
- **Buzzword Analysis**: Detects excessive corporate jargon and AI-typical language patterns
- **Spam Detection**: Identifies common spam patterns and suspicious links
- **Profile Analysis**: Comprehensive LinkedIn profile assessment for AI/troll behavior

### Platform Support
✅ **LinkedIn** (Primary focus)
- Profile analysis with AI detection
- Feed post and comment analysis
- Bio/headline buzzword detection
- Posting pattern analysis

✅ **YouTube**
- Comment section analysis
- Sentiment distribution tracking

✅ **Reddit**
- Comment thread analysis
- Coordinated activity detection

✅ **Generic Websites**
- Universal comment detection
- Adaptable analysis for any website with comments

### Visual Indicators
- 🤖 **AI-Generated**: High likelihood of AI authorship
- ⚠️ **Suspicious**: Unusual patterns detected
- 🚫 **Spam**: Spam patterns identified
- 😍 **Extreme Positive**: Unusually positive sentiment
- 😡 **Extreme Negative**: Unusually negative sentiment

## 📦 Installation

### Step 1: Generate Icons

Before loading the extension, you need to generate the icon files:

1. Open `icons/generate-icons.html` in your web browser
2. Click "Generate All Icons"
3. Move the downloaded PNG files to the `icons/` directory

Alternatively, see `icons/README_ICONS.md` for other icon generation methods.

### Step 2: Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the extension directory (`AI-troll-sentiment-analysis`)
5. The extension icon should appear in your browser toolbar

### Step 3: Start Using

1. Navigate to LinkedIn, YouTube, Reddit, or any website with comments
2. Click the extension icon to view analysis results
3. Suspicious content will be automatically flagged with visual indicators
4. Adjust settings in the popup as needed

## 🚀 Usage

### Automatic Analysis

By default, the extension automatically analyzes pages as you browse:

1. Visit any supported website
2. Scroll through comments or profiles
3. Watch for indicator badges appearing on suspicious content
4. Click the extension icon to see overall statistics

### Manual Analysis

You can trigger analysis manually:

1. Click the extension icon in your toolbar
2. Click the "🔍 Analyze Page Now" button
3. Wait for analysis to complete
4. Review results in the popup

### Reading Results

The popup displays:
- **Total Analyzed**: Number of comments/posts analyzed
- **Suspicious Count**: Items flagged as potentially AI-generated or troll content
- **Sentiment Distribution**: Breakdown of positive, negative, and neutral content
- **Settings**: Configure detection sensitivity and display options

### LinkedIn Profile Analysis

When viewing a LinkedIn profile:

1. The extension automatically analyzes:
   - Profile headline and bio
   - About section
   - Recent posts (up to 10)
   - Language patterns and buzzwords

2. If suspicious patterns are detected, a warning badge appears at the top of the profile showing:
   - Risk classification (High Risk, Suspicious, etc.)
   - Overall AI/troll score
   - Specific flags that were triggered

## ⚙️ Configuration

### Settings (Available in Popup)

#### Auto-analyze
- **Default**: ON
- **Description**: Automatically analyze pages as you browse
- **Recommendation**: Keep enabled for continuous monitoring

#### Show Indicators
- **Default**: ON
- **Description**: Display visual badges on suspicious content
- **Recommendation**: Keep enabled to see flagged content

#### Detection Threshold
- **Default**: 50%
- **Range**: 0-100%
- **Description**: Minimum suspicion score to flag content
- **Higher values**: Fewer false positives, may miss some suspicious content
- **Lower values**: Catch more suspicious content, but more false positives

## 🔍 Detection Methodology

### AI Pattern Detection

The extension uses multiple indicators to detect AI-generated content:

1. **Buzzword Density**: Excessive use of corporate jargon
   - "synergy", "leverage", "paradigm shift", etc.
   - Threshold: >15% buzzword density

2. **Sentence Uniformity**: AI tends to produce uniform sentence lengths
   - Calculates variance in sentence length
   - Low variance suggests AI generation

3. **Formality Score**: Overuse of formal transition words
   - "furthermore", "moreover", "consequently", etc.

4. **Repetition Detection**: Unusual similarity between posts/comments
   - Uses cosine similarity
   - Threshold: >70% similarity

### Sentiment Analysis

VADER-inspired sentiment analysis with:
- Lexicon-based scoring
- Negation handling
- Booster/dampener detection
- Emoji sentiment
- Punctuation emphasis

### Spam Detection

Pattern matching for common spam indicators:
- Shortened URLs (bit.ly, tinyurl)
- "Click here", "Buy now" phrases
- Suspicious contact requests (Telegram, WhatsApp)
- Phone number patterns

## 📊 Technical Architecture

### Files Structure

```
AI-troll-sentiment-analysis/
├── manifest.json              # Extension configuration (Manifest V3)
├── background.js              # Background service worker
├── contentScript.js           # Main analysis engine (runs on pages)
├── profileAnalyzer.js         # Profile analysis logic
├── utils.js                   # Text analysis utilities
├── popup.html                 # Popup interface
├── popup.js                   # Popup logic
├── styles.css                 # Visual indicator styles
├── lib/
│   └── sentiment.js           # Sentiment analysis library
├── icons/
│   ├── icon16.png            # 16x16 icon
│   ├── icon48.png            # 48x48 icon
│   ├── icon128.png           # 128x128 icon
│   └── generate-icons.html   # Icon generator tool
└── README.md                  # This file
```

### Key Components

#### `utils.js` - Text Analysis Utilities
- Levenshtein distance calculation
- Cosine similarity
- Buzzword detection
- AI pattern recognition
- Spam pattern matching

#### `lib/sentiment.js` - Sentiment Analyzer
- VADER-inspired algorithm
- Lexicon-based sentiment scoring
- Context-aware analysis (negation, boosters)
- Emoji and punctuation handling

#### `profileAnalyzer.js` - Profile Analysis
- LinkedIn profile scraping
- Multi-post pattern detection
- Username analysis
- Posting frequency analysis
- Comprehensive scoring system

#### `contentScript.js` - Content Script
- Platform detection
- DOM monitoring for dynamic content
- Comment/post extraction
- Visual indicator injection
- Message passing with popup

## 🎨 Customization

### Adjusting Thresholds

Edit `profileAnalyzer.js` to modify detection thresholds:

```javascript
this.thresholds = {
  buzzwordDensity: 0.15,        // 15% buzzwords is suspicious
  aiPatternScore: 0.6,           // 60% AI likelihood
  repetitionScore: 0.4,          // 40% similarity between posts
  extremeSentimentRatio: 0.5,    // 50% posts with extreme sentiment
  postingSimilarity: 0.7,        // 70% similarity between posts
  minPostsForAnalysis: 3         // Need at least 3 posts
};
```

### Adding New Buzzwords

Edit `utils.js` to add new buzzwords to detect:

```javascript
const buzzwords = [
  'synergy', 'leverage', 'paradigm',
  // Add your custom buzzwords here
  'your-buzzword-here'
];
```

### Adding New Platforms

To add support for a new platform, edit `contentScript.js`:

1. Add platform detection in `detectPlatform()`
2. Create a new analysis method (e.g., `analyzeNewPlatform()`)
3. Add CSS selectors for comment extraction
4. Update `manifest.json` to include the new domain

## 🔒 Privacy & Security

### Data Handling
- ✅ **All processing is local** - No data sent to external servers
- ✅ **No tracking** - Extension doesn't log or collect user data
- ✅ **No network requests** - Completely offline analysis
- ✅ **Minimal permissions** - Only requests necessary permissions

### Permissions Used
- `storage`: Save user settings and analysis results locally
- `activeTab`: Access current tab for analysis
- `host_permissions`: Run on specified websites (LinkedIn, YouTube, etc.)

### Storage
- Settings stored in `chrome.storage.sync` (syncs across devices)
- Analysis results stored in `chrome.storage.local` (local only)
- No personal data collected or stored

## 🐛 Troubleshooting

### Extension Not Working

1. **Check if extension is enabled**
   - Go to `chrome://extensions/`
   - Ensure the extension is enabled

2. **Reload the extension**
   - Click the refresh icon on the extension card
   - Reload the webpage you're analyzing

3. **Check console for errors**
   - Right-click on the page → Inspect
   - Check Console tab for errors
   - Look for messages starting with `[AI Troll Detector]`

### No Indicators Appearing

1. **Check settings**
   - Click extension icon
   - Ensure "Show indicators" is enabled
   - Ensure "Auto-analyze" is enabled

2. **Try manual analysis**
   - Click "Analyze Page Now" button
   - Wait a few seconds for analysis to complete

3. **Check if content is being detected**
   - Open browser console
   - Look for analysis messages
   - Verify DOM selectors match the website's structure

### Icons Not Showing

1. **Generate icons**
   - Follow instructions in `icons/README_ICONS.md`
   - Ensure PNG files are in the `icons/` directory

2. **Check file names**
   - Files must be named exactly: `icon16.png`, `icon48.png`, `icon128.png`

## 🚧 Known Limitations

- **Dynamic Content**: Some dynamically loaded content may require manual analysis
- **Platform Changes**: Website updates may break DOM selectors (requires extension update)
- **False Positives**: Detection algorithms may occasionally flag legitimate content
- **Performance**: Analyzing very large comment sections may be slow
- **Language**: Currently optimized for English-language content

## 🔮 Future Enhancements

### Planned Features
- [ ] Support for more languages
- [ ] Machine learning-based detection (optional)
- [ ] Coordinated account detection across profiles
- [ ] Export analysis reports
- [ ] Whitelist/blacklist functionality
- [ ] Custom detection rules
- [ ] More platform support (Twitter/X, Facebook, etc.)
- [ ] Network graph visualization for coordinated activity

### Improvements
- [ ] Better performance for large comment sections
- [ ] More accurate AI detection models
- [ ] Enhanced UI with detailed analysis breakdowns
- [ ] Historical tracking of flagged accounts
- [ ] Collaborative filtering (opt-in community reporting)

## 📄 License

This project is provided as-is for educational and defensive security purposes. Feel free to modify and extend it for your needs.

## 🤝 Contributing

Contributions are welcome! Areas that need improvement:

1. **Platform Support**: Add selectors for new websites
2. **Detection Algorithms**: Improve AI/troll detection accuracy
3. **UI/UX**: Enhance visual indicators and popup interface
4. **Performance**: Optimize analysis for large pages
5. **Testing**: Add test cases for detection algorithms

## 📞 Support

If you encounter issues:

1. Check the Troubleshooting section above
2. Review browser console for error messages
3. Verify the extension is up to date
4. Try disabling other extensions that might conflict

## 🙏 Acknowledgments

- Sentiment analysis inspired by VADER (Valence Aware Dictionary and sEntiment Reasoner)
- Built with Chrome Extension Manifest V3
- Uses pure JavaScript - no external dependencies for core functionality

---

**Version**: 1.0.0
**Last Updated**: 2025
**Manifest Version**: 3
**Minimum Chrome Version**: 88+

---

### Quick Start Checklist

- [ ] Generate extension icons (use `icons/generate-icons.html`)
- [ ] Load extension in Chrome (`chrome://extensions/`)
- [ ] Enable Developer Mode
- [ ] Visit LinkedIn, YouTube, or Reddit
- [ ] Click extension icon to view results
- [ ] Adjust settings as needed
- [ ] Report any issues or bugs

**Ready to detect AI trolls! 🛡️🤖**
