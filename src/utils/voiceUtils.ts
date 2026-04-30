export const standardizeBn = (str: string) => {
  const bnToEn: Record<string, string> = { 
    '১':'1', '২':'2', '৩':'3', '৪':'4', '৫':'5', '৬':'6', '৭':'7', '৮':'8', '৯':'9', '০':'0'
  };
  return str.normalize('NFC')
     .replace(/\u09AF\u09BC/g, '\u09DF')
     .replace(/\u09A1\u09BC/g, '\u09DC')
     .replace(/\u09A2\u09BC/g, '\u09DD')
     .replace(/[০-৯]/g, (m) => bnToEn[m])
     .toLowerCase();
};

export const translateNumbers = (str: string) => {
  let text = str;
  const bnToEn: Record<string, string> = { 
      '১':'1', '২':'2', '৩':'3', '৪':'4', '৫':'5', '৬':'6', '৭':'7', '৮':'8', '৯':'9', '০':'0'
  };
  const wordNumbers: Record<string, string> = {
      'এক':'1', 'দুই':'2', 'তিন':'3', 'চার':'4', 'পাঁচ':'5', 'ছয়':'6', 'সাত':'7', 'আট':'8', 'নয়':'9', 'দশ':'10',
      'এগারো':'11', 'বারো':'12', 'তেরো':'13', 'চোদ্দ':'14', 'পনেরো':'15', 'ষোল':'16', 'সতেরো':'17', 'আঠারো':'18', 'উনিশ':'19', 'কুড়ি':'20', 'বিশ':'20'
  };
  text = text.replace(/[০-৯]/g, (m) => bnToEn[m]);
  
  // Replace word numbers when they are at the start of a word, possibly followed by typical unit suffixes
  Object.keys(wordNumbers).forEach(key => {
     // Allow standard unit suffixes directly attached to the number word
     const regex = new RegExp(`(^|\\s)${key}(টা|টি|পিস|প্যাকেট|কেজি|গ্রাম|লিটার|মিলি|kg|g|gm|ml)?(\\s|$)`, 'g');
     text = text.replace(regex, (match, prefix, suffix, postfix) => {
        return `${prefix}${wordNumbers[key]} ${suffix || ''}${postfix}`;
     });
     
     // Also try replacing it if it appears right before a suffix word without space
     const regex2 = new RegExp(`(^|\\s)${key}(প্যাকেটের|কেজির|গ্রামের|লিটারের|পিসের)?(\\s|$)`, 'g');
     text = text.replace(regex2, (match, prefix, suffix, postfix) => {
        return `${prefix}${wordNumbers[key]} ${suffix || ''}${postfix}`;
     });
  });
  
  // Clean up extra spaces
  return text.replace(/\s+/g, ' ').trim();
};

export const toPhonetic = (str: string) => {
  let s = str.toLowerCase();
  
  // Custom substitution map
  const charMap: Record<string, string> = {
    'ph':'f', 'v':'b', 'z':'j', 'sh':'s', 'ch':'c', 'ck':'k', 'c':'k', 'q':'k', 'w':'u', 'x':'ks', 'y':'i',
    'ক':'k','খ':'k','গ':'g','ঘ':'g','ঙ':'ng',
    'চ':'c','ছ':'c','জ':'j','ঝ':'j','ঞ':'n',
    'ট':'t','ঠ':'t','ড':'d','ঢ':'d','ণ':'n',
    'ত':'t','থ':'t','দ':'d','ধ':'d','ন':'n',
    'প':'p','ফ':'f','ব':'b','ভ':'b','ম':'m',
    'য':'j','র':'r','ল':'l','শ':'s','ষ':'s','স':'s','হ':'h',
    'ড়':'r','ঢ়':'r','য়':'i','ৎ':'t','ং':'ng','ঃ':'h','ঁ':'',
    'অ':'a', 'আ':'a', 'ই':'i', 'ঈ':'i', 'উ':'u', 'ঊ':'u', 
    'ঋ':'ri', 'এ':'e', 'ঐ':'oi', 'ও':'o', 'ঔ':'ou',
    'া':'a', 'ি':'i', 'ী':'i', 'ু':'u', 'ূ':'u', 'ৃ':'ri', 'ে':'e', 'ৈ':'oi', 'ো':'o', 'ৌ':'ou',
    '্':''
  };

  s = s.replace(/ph/g, 'f').replace(/sh/g, 's').replace(/ch/g, 'c').replace(/ck/g, 'k');
  
  let mapped = '';
  for (let i = 0; i < s.length; i++) {
    const char = s[i];
    if (charMap[char] !== undefined) mapped += charMap[char];
    else if (char >= 'a' && char <= 'z') mapped += charMap[char] || char; // fallback if already mapped above or keeps it
    else if (char >= '0' && char <= '9') mapped += char;
    else if (char === ' ') mapped += ' ';
  }
  
  // Remove vowels and common semi-vowels to make matching more fuzzy
  mapped = mapped.replace(/[aeiouhwjy]+/g, ''); 
  mapped = mapped.replace(/(.)\1+/g, '$1'); 
  return mapped.trim();
};

export const parseVoiceCommandQuantity = (rawText: string) => {
  let text = translateNumbers(rawText.trim());

  const fractionMap: Record<string, string> = {
    'দেড়': '1.5',
    'আড়াই': '2.5',
    'আড়াই': '2.5',
    'হাফ': '0.5',
    'সিকি': '0.25'
  };
  
  for (const [key, val] of Object.entries(fractionMap)) {
    text = text.replace(new RegExp(key, 'g'), val);
  }
  
  text = text.replace(/সোয়া\s*(\d+(\.\d+)?)/g, (match, n) => (parseFloat(n) + 0.25).toString());
  text = text.replace(/সা[ড়ড]়?ে\s*(\d+(\.\d+)?)/g, (match, n) => (parseFloat(n) + 0.5).toString());
  text = text.replace(/পৌনে\s*(\d+(\.\d+)?)/g, (match, n) => (parseFloat(n) - 0.25).toString());

  text = text.trim();

  // Try extracting from prefix
  const qtyPrefixRegex = /^(\d+(\.\d+)?)\s*(কেজি|কিলো|গ্রাম|লিটার|মিলি|পিস|টি|টা|kg|g|gm|liter|ml|pcs|piece)?\s+/i;
  // Try extracting from suffix
  const qtySuffixRegex = /\s+(\d+(\.\d+)?)\s*(কেজি|কিলো|গ্রাম|লিটার|মিলি|পিস|টি|টা|kg|g|gm|liter|ml|pcs|piece)?$/i;
  
  let quantity = 1;
  let searchName = text;
  let matchFound = false;

  const prefixMatch = text.match(qtyPrefixRegex);
  const suffixMatch = text.match(qtySuffixRegex);
  
  const parseMatch = (match: RegExpMatchArray) => {
    let parsedNum = parseFloat(match[1]);
    const unit = match[3]?.trim().toLowerCase() || '';
    if (['গ্রাম', 'g', 'gm', 'মিলি', 'ml'].includes(unit)) {
        if (parsedNum >= 50) {
           parsedNum = parsedNum / 1000;
        }
    }
    return Math.max(0.1, parsedNum);
  };

  if (prefixMatch) {
    quantity = parseMatch(prefixMatch);
    searchName = text.substring(prefixMatch[0].length).trim();
    matchFound = true;
  } else if (suffixMatch) {
    quantity = parseMatch(suffixMatch);
    searchName = text.substring(0, text.length - suffixMatch[0].length).trim();
    matchFound = true;
  }

  // If no prefix/suffix match, we can optionally test everywhere but it might break products with numbers
  // So we just return matchFound = false and quantity = 1
  return { 
     originalText: text, // Normalized text before extraction
     searchName,         // Text after quantity extraction
     quantity, 
     matchFound 
  };
};

export const isPhoneticMatch = (text: string | null | undefined, query: string) => {
  if (!text || !query) return false;
  const stdQuery = query.toLowerCase();
  const stdText = text.toLowerCase();
  if (stdText.includes(stdQuery)) return true;
  
  const stdBnQuery = standardizeBn(query);
  const stdBnText = standardizeBn(text);
  if (stdBnText.includes(stdBnQuery)) return true;
  
  const phQuery = toPhonetic(stdBnQuery);
  const phText = toPhonetic(stdBnText);
  if (phQuery.length > 1 && phText.includes(phQuery)) return true;
  
  // Word by word matching
  const queryWords = stdBnQuery.split(/\s+/).filter(w => w.length > 0);
  const textWordsPhonetic = stdBnText.split(/\s+/).map(w => toPhonetic(w)).filter(w => w.length > 0);
  
  if (queryWords.length > 0) {
    const allWordsMatch = queryWords.every(qw => {
      const phQw = toPhonetic(qw);
      // a word matches if it's substring of any target word phonetically
      return textWordsPhonetic.some(tw => tw.includes(phQw) || (phQw.length > 2 && phQw.includes(tw)));
    });
    if (allWordsMatch) return true;
  }
  
  return false;
};
