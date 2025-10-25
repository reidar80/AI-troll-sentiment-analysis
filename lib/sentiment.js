/**
 * sentiment.js - Multilingual sentiment analysis library
 * VADER-inspired sentiment analysis supporting 14 languages
 *
 * Supported languages:
 * - English, Norwegian, German, Spanish, French, Portuguese
 * - Swedish, Danish, Sami, Russian, Latvian, Estonian, Lithuanian, Polish
 */

class SentimentAnalyzer {
  constructor() {
    // Initialize all language lexicons
    this.initializeLexicons();

    // Current language (auto-detected or default to English)
    this.currentLanguage = 'en';

    // Emoji sentiment (universal across languages)
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
   * Initialize lexicons for all supported languages
   */
  initializeLexicons() {
    this.lexicons = {
      // English
      en: {
        positive: {
          'amazing': 0.9, 'awesome': 0.9, 'excellent': 0.8, 'fantastic': 0.9,
          'wonderful': 0.8, 'great': 0.7, 'good': 0.6, 'nice': 0.5,
          'love': 0.8, 'loved': 0.8, 'loving': 0.8, 'like': 0.5,
          'best': 0.8, 'brilliant': 0.8, 'perfect': 0.9, 'outstanding': 0.9,
          'superb': 0.8, 'impressive': 0.7, 'beautiful': 0.7, 'incredible': 0.8,
          'happy': 0.7, 'delighted': 0.8, 'pleased': 0.6, 'excited': 0.7,
          'inspiring': 0.7, 'innovative': 0.6, 'powerful': 0.6, 'strong': 0.5,
          'helpful': 0.6, 'useful': 0.5, 'valuable': 0.6, 'appreciate': 0.6,
          'thanks': 0.5, 'thank': 0.5, 'grateful': 0.7, 'gratitude': 0.7,
          'yes': 0.3, 'agree': 0.4, 'correct': 0.4, 'true': 0.3
        },
        negative: {
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
          'sad': -0.6, 'unhappy': -0.6, 'depressed': -0.8, 'depressing': -0.7
        },
        boosters: {
          'very': 0.3, 'really': 0.3, 'extremely': 0.4, 'incredibly': 0.4,
          'absolutely': 0.4, 'completely': 0.3, 'totally': 0.3, 'highly': 0.3,
          'so': 0.2, 'too': 0.2, 'quite': 0.2, 'pretty': 0.2
        },
        dampeners: {
          'barely': -0.3, 'hardly': -0.3, 'slightly': -0.2, 'somewhat': -0.2,
          'kind of': -0.2, 'sort of': -0.2, 'a bit': -0.2, 'a little': -0.2
        },
        negations: ['not', 'no', 'never', 'none', 'nobody', 'nothing', 'neither',
                   'nowhere', 'cannot', "can't", "won't", "wouldn't", "shouldn't",
                   "didn't", "doesn't", "don't", "isn't", "aren't", "wasn't", "weren't"]
      },

      // Norwegian (Norsk)
      no: {
        positive: {
          'fantastisk': 0.9, 'utmerket': 0.8, 'flott': 0.7, 'bra': 0.6, 'fin': 0.5,
          'elsker': 0.8, 'glad': 0.7, 'lykkelig': 0.7, 'fornøyd': 0.6,
          'takk': 0.5, 'perfekt': 0.9, 'vakker': 0.7, 'herlig': 0.8,
          'interessant': 0.6, 'nyttig': 0.5, 'verdifull': 0.6, 'positiv': 0.6,
          'enig': 0.4, 'riktig': 0.4, 'ja': 0.3, 'best': 0.8
        },
        negative: {
          'forferdelig': -0.9, 'elendig': -0.9, 'dårlig': -0.7, 'vondt': -0.7,
          'hater': -0.9, 'lei': -0.6, 'sur': -0.6, 'sint': -0.8,
          'trist': -0.6, 'kjedelig': -0.5, 'dum': -0.7, 'stygg': -0.7,
          'falsk': -0.7, 'løgn': -0.7, 'svindel': -0.9, 'skuffet': -0.7,
          'irriterende': -0.6, 'grusom': -0.8, 'verst': -0.9
        },
        boosters: {
          'veldig': 0.3, 'ekstremt': 0.4, 'svært': 0.3, 'helt': 0.3,
          'så': 0.2, 'for': 0.2, 'virkelig': 0.3
        },
        dampeners: {
          'knapt': -0.3, 'nesten ikke': -0.3, 'litt': -0.2, 'noe': -0.2
        },
        negations: ['ikke', 'ingen', 'aldri', 'ingenting', 'ikkeno', 'nei']
      },

      // German (Deutsch)
      de: {
        positive: {
          'fantastisch': 0.9, 'ausgezeichnet': 0.8, 'hervorragend': 0.8, 'großartig': 0.7,
          'gut': 0.6, 'schön': 0.7, 'perfekt': 0.9, 'wunderbar': 0.8,
          'liebe': 0.8, 'lieben': 0.8, 'glücklich': 0.7, 'erfreut': 0.6,
          'danke': 0.5, 'dankbar': 0.7, 'beste': 0.8, 'brillant': 0.8,
          'nützlich': 0.5, 'hilfreich': 0.6, 'positiv': 0.6, 'ja': 0.3
        },
        negative: {
          'schrecklich': -0.9, 'furchtbar': -0.9, 'schlecht': -0.7, 'böse': -0.7,
          'hassen': -0.9, 'hass': -0.9, 'wütend': -0.8, 'ärgerlich': -0.6,
          'traurig': -0.6, 'langweilig': -0.5, 'dumm': -0.7, 'falsch': -0.7,
          'lüge': -0.7, 'betrug': -0.9, 'enttäuscht': -0.7, 'schlimmste': -0.9
        },
        boosters: {
          'sehr': 0.3, 'extrem': 0.4, 'äußerst': 0.4, 'völlig': 0.3,
          'so': 0.2, 'zu': 0.2, 'wirklich': 0.3
        },
        dampeners: {
          'kaum': -0.3, 'etwas': -0.2, 'ein bisschen': -0.2, 'leicht': -0.2
        },
        negations: ['nicht', 'kein', 'keine', 'niemals', 'nie', 'nichts', 'nein']
      },

      // Spanish (Español)
      es: {
        positive: {
          'fantástico': 0.9, 'excelente': 0.8, 'maravilloso': 0.8, 'genial': 0.7,
          'bueno': 0.6, 'bonito': 0.7, 'perfecto': 0.9, 'increíble': 0.8,
          'amor': 0.8, 'amar': 0.8, 'feliz': 0.7, 'contento': 0.6,
          'gracias': 0.5, 'agradecido': 0.7, 'mejor': 0.8, 'brillante': 0.8,
          'útil': 0.5, 'valioso': 0.6, 'positivo': 0.6, 'sí': 0.3
        },
        negative: {
          'terrible': -0.9, 'horrible': -0.9, 'malo': -0.7, 'pésimo': -0.9,
          'odio': -0.9, 'odiar': -0.9, 'enojado': -0.8, 'molesto': -0.6,
          'triste': -0.6, 'aburrido': -0.5, 'estúpido': -0.8, 'falso': -0.7,
          'mentira': -0.7, 'fraude': -0.9, 'decepcionado': -0.7, 'peor': -0.9
        },
        boosters: {
          'muy': 0.3, 'extremadamente': 0.4, 'sumamente': 0.4, 'totalmente': 0.3,
          'tan': 0.2, 'demasiado': 0.2, 'realmente': 0.3
        },
        dampeners: {
          'apenas': -0.3, 'poco': -0.2, 'un poco': -0.2, 'levemente': -0.2
        },
        negations: ['no', 'nunca', 'jamás', 'nada', 'nadie', 'ninguno', 'tampoco']
      },

      // French (Français)
      fr: {
        positive: {
          'fantastique': 0.9, 'excellent': 0.8, 'merveilleux': 0.8, 'génial': 0.7,
          'bon': 0.6, 'beau': 0.7, 'parfait': 0.9, 'incroyable': 0.8,
          'amour': 0.8, 'aimer': 0.8, 'heureux': 0.7, 'content': 0.6,
          'merci': 0.5, 'reconnaissant': 0.7, 'meilleur': 0.8, 'brillant': 0.8,
          'utile': 0.5, 'précieux': 0.6, 'positif': 0.6, 'oui': 0.3
        },
        negative: {
          'terrible': -0.9, 'horrible': -0.9, 'mauvais': -0.7, 'affreux': -0.9,
          'haine': -0.9, 'détester': -0.9, 'en colère': -0.8, 'ennuyeux': -0.6,
          'triste': -0.6, 'ennuyant': -0.5, 'stupide': -0.8, 'faux': -0.7,
          'mensonge': -0.7, 'fraude': -0.9, 'déçu': -0.7, 'pire': -0.9
        },
        boosters: {
          'très': 0.3, 'extrêmement': 0.4, 'vraiment': 0.3, 'totalement': 0.3,
          'si': 0.2, 'tellement': 0.2, 'absolument': 0.4
        },
        dampeners: {
          'à peine': -0.3, 'un peu': -0.2, 'légèrement': -0.2, 'peu': -0.2
        },
        negations: ['ne', 'pas', 'non', 'jamais', 'rien', 'personne', 'aucun']
      },

      // Portuguese (Português)
      pt: {
        positive: {
          'fantástico': 0.9, 'excelente': 0.8, 'maravilhoso': 0.8, 'ótimo': 0.7,
          'bom': 0.6, 'bonito': 0.7, 'perfeito': 0.9, 'incrível': 0.8,
          'amor': 0.8, 'amar': 0.8, 'feliz': 0.7, 'contente': 0.6,
          'obrigado': 0.5, 'grato': 0.7, 'melhor': 0.8, 'brilhante': 0.8,
          'útil': 0.5, 'valioso': 0.6, 'positivo': 0.6, 'sim': 0.3
        },
        negative: {
          'terrível': -0.9, 'horrível': -0.9, 'mau': -0.7, 'péssimo': -0.9,
          'ódio': -0.9, 'odiar': -0.9, 'zangado': -0.8, 'chato': -0.6,
          'triste': -0.6, 'aborrecido': -0.5, 'estúpido': -0.8, 'falso': -0.7,
          'mentira': -0.7, 'fraude': -0.9, 'decepcionado': -0.7, 'pior': -0.9
        },
        boosters: {
          'muito': 0.3, 'extremamente': 0.4, 'bastante': 0.3, 'totalmente': 0.3,
          'tão': 0.2, 'demais': 0.2, 'realmente': 0.3
        },
        dampeners: {
          'mal': -0.3, 'pouco': -0.2, 'um pouco': -0.2, 'levemente': -0.2
        },
        negations: ['não', 'nunca', 'jamais', 'nada', 'ninguém', 'nenhum', 'nem']
      },

      // Swedish (Svenska)
      sv: {
        positive: {
          'fantastisk': 0.9, 'utmärkt': 0.8, 'underbar': 0.8, 'toppen': 0.7,
          'bra': 0.6, 'fin': 0.5, 'perfekt': 0.9, 'härlig': 0.8,
          'älskar': 0.8, 'glad': 0.7, 'lycklig': 0.7, 'nöjd': 0.6,
          'tack': 0.5, 'tacksam': 0.7, 'bäst': 0.8, 'briljant': 0.8,
          'användbar': 0.5, 'värdefull': 0.6, 'positiv': 0.6, 'ja': 0.3
        },
        negative: {
          'förfärlig': -0.9, 'hemsk': -0.9, 'dålig': -0.7, 'usel': -0.9,
          'hatar': -0.9, 'arg': -0.8, 'irriterad': -0.6, 'ledsen': -0.6,
          'tråkig': -0.5, 'dum': -0.7, 'falsk': -0.7, 'lögn': -0.7,
          'bedrägeri': -0.9, 'besviken': -0.7, 'värst': -0.9
        },
        boosters: {
          'mycket': 0.3, 'extremt': 0.4, 'väldigt': 0.3, 'helt': 0.3,
          'så': 0.2, 'för': 0.2, 'verkligen': 0.3
        },
        dampeners: {
          'knappt': -0.3, 'lite': -0.2, 'något': -0.2, 'ganska': -0.2
        },
        negations: ['inte', 'ingen', 'aldrig', 'inget', 'nej']
      },

      // Danish (Dansk)
      da: {
        positive: {
          'fantastisk': 0.9, 'fremragende': 0.8, 'vidunderlig': 0.8, 'fed': 0.7,
          'god': 0.6, 'fin': 0.5, 'perfekt': 0.9, 'dejlig': 0.8,
          'elsker': 0.8, 'glad': 0.7, 'lykkelig': 0.7, 'tilfreds': 0.6,
          'tak': 0.5, 'taknemlig': 0.7, 'bedst': 0.8, 'brilliant': 0.8,
          'nyttig': 0.5, 'værdifuld': 0.6, 'positiv': 0.6, 'ja': 0.3
        },
        negative: {
          'forfærdelig': -0.9, 'frygtelig': -0.9, 'dårlig': -0.7, 'elendig': -0.9,
          'hader': -0.9, 'vred': -0.8, 'irriteret': -0.6, 'ked af': -0.6,
          'kedelig': -0.5, 'dum': -0.7, 'falsk': -0.7, 'løgn': -0.7,
          'svindel': -0.9, 'skuffet': -0.7, 'værst': -0.9
        },
        boosters: {
          'meget': 0.3, 'ekstremt': 0.4, 'virkelig': 0.3, 'helt': 0.3,
          'så': 0.2, 'for': 0.2, 'rigtig': 0.3
        },
        dampeners: {
          'knap': -0.3, 'lidt': -0.2, 'noget': -0.2, 'ret': -0.2
        },
        negations: ['ikke', 'ingen', 'aldrig', 'intet', 'nej']
      },

      // Sami (Davvisámegiella - Northern Sami)
      se: {
        positive: {
          'buorre': 0.6, 'čáppa': 0.7, 'hirbmat': 0.8, 'álki': 0.5,
          'ilus': 0.7, 'suohtas': 0.6, 'váibbi': 0.8, 'movt': 0.3,
          'giitu': 0.5, 'buorit': 0.7
        },
        negative: {
          'bahá': -0.7, 'heahkka': -0.8, 'váivi': -0.7, 'galbma': -0.6,
          'boasta': -0.8, 'váimmut': -0.6
        },
        boosters: {
          'oalle': 0.3, 'hui': 0.3, 'áibbas': 0.4
        },
        dampeners: {
          'veaháš': -0.2, 'unnán': -0.2
        },
        negations: ['ii', 'eai', 'eaba', 'inge']
      },

      // Russian (Русский)
      ru: {
        positive: {
          'фантастический': 0.9, 'отличный': 0.8, 'прекрасный': 0.8, 'замечательный': 0.7,
          'хороший': 0.6, 'красивый': 0.7, 'совершенный': 0.9, 'невероятный': 0.8,
          'любовь': 0.8, 'любить': 0.8, 'счастливый': 0.7, 'довольный': 0.6,
          'спасибо': 0.5, 'благодарный': 0.7, 'лучший': 0.8, 'блестящий': 0.8,
          'полезный': 0.5, 'ценный': 0.6, 'положительный': 0.6, 'да': 0.3
        },
        negative: {
          'ужасный': -0.9, 'страшный': -0.9, 'плохой': -0.7, 'отвратительный': -0.9,
          'ненависть': -0.9, 'ненавидеть': -0.9, 'злой': -0.8, 'скучный': -0.6,
          'грустный': -0.6, 'глупый': -0.7, 'ложный': -0.7, 'ложь': -0.7,
          'мошенничество': -0.9, 'разочарованный': -0.7, 'худший': -0.9
        },
        boosters: {
          'очень': 0.3, 'крайне': 0.4, 'весьма': 0.3, 'совершенно': 0.3,
          'так': 0.2, 'слишком': 0.2, 'действительно': 0.3
        },
        dampeners: {
          'едва': -0.3, 'немного': -0.2, 'слегка': -0.2, 'чуть': -0.2
        },
        negations: ['не', 'нет', 'никогда', 'ничто', 'никто', 'ни']
      },

      // Latvian (Latviešu)
      lv: {
        positive: {
          'fantastisks': 0.9, 'lielisks': 0.8, 'brīnišķīgs': 0.8, 'labs': 0.6,
          'skaists': 0.7, 'ideāls': 0.9, 'paldies': 0.5, 'laimīgs': 0.7,
          'priecīgs': 0.7, 'mīlestība': 0.8, 'patīkams': 0.6, 'noderīgs': 0.5,
          'vērtīgs': 0.6, 'pozitīvs': 0.6, 'jā': 0.3
        },
        negative: {
          'briesmīgs': -0.9, 'šausmīgs': -0.9, 'slikts': -0.7, 'ļauns': -0.8,
          'naids': -0.9, 'dusmīgs': -0.8, 'garlaicīgs': -0.5, 'skumjš': -0.6,
          'muļķīgs': -0.7, 'viltus': -0.7, 'melīgs': -0.7, 'krāpniecība': -0.9
        },
        boosters: {
          'ļoti': 0.3, 'ārkārtīgi': 0.4, 'patiesi': 0.3, 'pilnīgi': 0.3
        },
        dampeners: {
          'nedaudz': -0.2, 'mazliet': -0.2, 'gandrīz': -0.2
        },
        negations: ['ne', 'nē', 'nekad', 'nekas', 'neviens']
      },

      // Estonian (Eesti)
      et: {
        positive: {
          'fantastiline': 0.9, 'suurepärane': 0.8, 'imeline': 0.8, 'hea': 0.6,
          'ilus': 0.7, 'täiuslik': 0.9, 'aitäh': 0.5, 'õnnelik': 0.7,
          'rõõmus': 0.7, 'armastus': 0.8, 'meeldiv': 0.6, 'kasulik': 0.5,
          'väärtuslik': 0.6, 'positiivne': 0.6, 'jah': 0.3
        },
        negative: {
          'kohutav': -0.9, 'õudne': -0.9, 'halb': -0.7, 'paha': -0.7,
          'viha': -0.9, 'vihane': -0.8, 'igav': -0.5, 'kurb': -0.6,
          'rumal': -0.7, 'vale': -0.7, 'vale': -0.7, 'pettus': -0.9
        },
        boosters: {
          'väga': 0.3, 'äärmiselt': 0.4, 'tõesti': 0.3, 'täiesti': 0.3
        },
        dampeners: {
          'natuke': -0.2, 'veidi': -0.2, 'pisut': -0.2
        },
        negations: ['ei', 'mitte', 'kunagi', 'miski', 'keegi']
      },

      // Lithuanian (Lietuvių)
      lt: {
        positive: {
          'fantastiškas': 0.9, 'puikus': 0.8, 'nuostabus': 0.8, 'geras': 0.6,
          'gražus': 0.7, 'tobulas': 0.9, 'ačiū': 0.5, 'laimingas': 0.7,
          'linksmas': 0.7, 'meilė': 0.8, 'malonus': 0.6, 'naudingas': 0.5,
          'vertingas': 0.6, 'teigiamas': 0.6, 'taip': 0.3
        },
        negative: {
          'baisus': -0.9, 'siaubingas': -0.9, 'blogas': -0.7, 'piktas': -0.8,
          'neapykanta': -0.9, 'piktas': -0.8, 'nuobodus': -0.5, 'liūdnas': -0.6,
          'kvailas': -0.7, 'netikras': -0.7, 'melas': -0.7, 'sukčiavimas': -0.9
        },
        boosters: {
          'labai': 0.3, 'ypač': 0.4, 'tikrai': 0.3, 'visiškai': 0.3
        },
        dampeners: {
          'šiek tiek': -0.2, 'kiek': -0.2, 'truputį': -0.2
        },
        negations: ['ne', 'nė', 'niekada', 'niekas', 'nei']
      },

      // Polish (Polski)
      pl: {
        positive: {
          'fantastyczny': 0.9, 'doskonały': 0.8, 'wspaniały': 0.8, 'dobry': 0.6,
          'piękny': 0.7, 'idealny': 0.9, 'dziękuję': 0.5, 'szczęśliwy': 0.7,
          'zadowolony': 0.7, 'miłość': 0.8, 'przyjemny': 0.6, 'użyteczny': 0.5,
          'cenny': 0.6, 'pozytywny': 0.6, 'tak': 0.3
        },
        negative: {
          'okropny': -0.9, 'straszny': -0.9, 'zły': -0.7, 'brzydki': -0.7,
          'nienawiść': -0.9, 'zły': -0.8, 'nudny': -0.5, 'smutny': -0.6,
          'głupi': -0.7, 'fałszywy': -0.7, 'kłamstwo': -0.7, 'oszustwo': -0.9
        },
        boosters: {
          'bardzo': 0.3, 'niezwykle': 0.4, 'naprawdę': 0.3, 'całkowicie': 0.3
        },
        dampeners: {
          'trochę': -0.2, 'nieco': -0.2, 'lekko': -0.2
        },
        negations: ['nie', 'nigdy', 'nic', 'nikt', 'żaden']
      }
    };

    // Language detection patterns
    this.languagePatterns = {
      en: ['the', 'and', 'is', 'are', 'you', 'this', 'that', 'with', 'for', 'not', 'but', 'have', 'will', 'from', 'love', 'hate'],
      no: ['og', 'er', 'jeg', 'det', 'ikke', 'en', 'for', 'på'],
      de: ['und', 'der', 'die', 'das', 'ist', 'ich', 'nicht', 'mit'],
      es: ['que', 'de', 'el', 'la', 'es', 'en', 'para', 'con'],
      fr: ['que', 'de', 'le', 'la', 'est', 'dans', 'pour', 'avec'],
      pt: ['que', 'de', 'o', 'a', 'é', 'em', 'para', 'com'],
      sv: ['och', 'är', 'jag', 'det', 'inte', 'en', 'för', 'på'],
      da: ['og', 'er', 'jeg', 'det', 'ikke', 'en', 'for', 'på'],
      se: ['lea', 'go', 'ja', 'ii', 'mii', 'gii'],
      ru: ['и', 'в', 'не', 'на', 'я', 'что', 'он', 'с'],
      lv: ['un', 'ir', 'es', 'tas', 'nav', 'uz'],
      et: ['ja', 'on', 'ei', 'ma', 'see', 'et'],
      lt: ['ir', 'yra', 'ne', 'aš', 'tai', 'kad'],
      pl: ['i', 'w', 'nie', 'na', 'jest', 'że', 'do']
    };
  }

  /**
   * Detect language from text
   */
  detectLanguage(text) {
    const lowerText = text.toLowerCase();
    const tokens = this.tokenize(text);
    const scores = {};

    // Score each language based on common words found
    for (const [lang, patterns] of Object.entries(this.languagePatterns)) {
      let score = 0;
      for (const pattern of patterns) {
        if (tokens.includes(pattern)) {
          score += pattern.length <= 2 ? 0.5 : 1;
        }
      }
      scores[lang] = score;
    }

    // Start with English as baseline preference
    let detectedLang = 'en';
    let maxScore = scores.en || 0;

    for (const [lang, score] of Object.entries(scores)) {
      if (lang === 'en') continue;
      if (score > maxScore) {
        maxScore = score;
        detectedLang = lang;
      }
    }

    // Require stronger evidence before switching away from English
    if (detectedLang !== 'en' && maxScore < 2) {
      return 'en';
    }

    return maxScore > 0 ? detectedLang : 'en';
  }

  /**
   * Get combined lexicon for a language
   */
  getLexicon(lang) {
    const langData = this.lexicons[lang] || this.lexicons.en;
    return { ...langData.positive, ...langData.negative };
  }

  /**
   * Tokenize text into words and clean
   */
  tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^\p{L}\s!?]/gu, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  /**
   * Check if word is in negation window (3 words before)
   */
  isNegated(tokens, index, lang) {
    const langData = this.lexicons[lang] || this.lexicons.en;
    const negations = langData.negations;
    const window = 3;

    for (let i = Math.max(0, index - window); i < index; i++) {
      if (negations.includes(tokens[i])) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get booster/dampener value in window before word
   */
  getModifier(tokens, index, lang) {
    const langData = this.lexicons[lang] || this.lexicons.en;
    const boosters = langData.boosters;
    const dampeners = langData.dampeners;
    let modifier = 0;
    const window = 2;

    for (let i = Math.max(0, index - window); i < index; i++) {
      const token = tokens[i];
      if (boosters[token]) {
        modifier += boosters[token];
      } else if (dampeners[token]) {
        modifier += dampeners[token];
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
   * Analyze sentiment of text (with auto language detection)
   */
  analyze(text) {
    if (!text || text.trim().length === 0) {
      return this.getDefaultResult();
    }

    // Detect language
    const lang = this.detectLanguage(text);
    const lexicon = this.getLexicon(lang);

    const tokens = this.tokenize(text);
    const punctuation = this.countPunctuation(text);
    const emojiData = this.scoreEmojis(text);

    let sentimentScore = 0;
    let positiveCount = 0;
    let negativeCount = 0;
    const sentimentWords = [];

    // Analyze each token
    tokens.forEach((token, index) => {
      if (lexicon[token]) {
        let score = lexicon[token];
        const isNeg = this.isNegated(tokens, index, lang);
        const modifier = this.getModifier(tokens, index, lang);

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
      exclamationCount: punctuation.exclamations,
      detectedLanguage: lang
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
      exclamationCount: 0,
      detectedLanguage: 'en'
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

    // Count detected languages
    const languages = {};
    analyses.forEach(a => {
      languages[a.detectedLanguage] = (languages[a.detectedLanguage] || 0) + 1;
    });

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
      averageCompound: avgCompound,
      languages
    };
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  window.SentimentAnalyzer = SentimentAnalyzer;
}
