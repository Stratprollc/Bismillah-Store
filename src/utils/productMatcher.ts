// Bengali to English numeral converter
export const bengaliToEnglishDigits = (text: string): string => {
  const map: { [key: string]: string } = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
  };
  return text.split('').map(char => map[char] || char).join('');
};

// Normalizes Bengali characters to resolve common spelling/phonetic differences (e.g., Unicode য় vs য়, শ vs ষ, etc.)
export const normalizeBengaliPhonetic = (text: string): string => {
  if (!text) return "";
  let norm = text.toLowerCase().trim();
  
  // Standardize Unicode composition differences for yya (য + ় vs য়)
  norm = norm.replace(/\u09AF\u09BC/g, 'য'); // য with dot -> য
  norm = norm.replace(/\u09DF/g, 'য');       // য় -> য
  norm = norm.replace(/য়/g, 'য');            // literal combining য় -> য
  norm = norm.replace(/য়/g, 'য');            // literal য় -> য
  
  // Normalize dental/palatal/retroflex sibilants
  norm = norm.replace(/[শষস]/g, 'স');        // শ, ষ, স -> স
  
  // Normalize retroflex r
  norm = norm.replace(/[ড়ঢ়র]/g, 'র');        // ড়, ঢ়, র -> র
  
  // Normalize nasal consonants
  norm = norm.replace(/[ণনঁং]/g, 'ন');       // ণ, ন, ঁ, ং -> ন
  
  // Normalize vowel markings for simplified matching
  norm = norm.replace(/[ীি]/g, 'ি');          // ী, ি -> ি
  norm = norm.replace(/[ূু]/g, 'ু');          // ূ, ু -> ু
  norm = norm.replace(/[েৈ]/g, 'ে');          // ে, ৈ -> ে
  norm = norm.replace(/[োৗ]/g, 'ো');         // ো, ৗ -> ো

  return norm;
};

export const fuzzyMatchProduct = (productsList: any[], requestedName: string): any => {
  if (!requestedName) return undefined;
  
  const reqClean = requestedName.toLowerCase().trim();
  
  // --- 1. MATCH BY SERIAL NUMBER OR INDEX ---
  // If the query contains digits (in English or Bengali) and words indicating sequence/rank like "number", "serial", "নম্বর", "সিরিয়াল"
  const reqCleanE = bengaliToEnglishDigits(reqClean);
  const numberMatch = reqCleanE.match(/\d+/);
  
  const hasSerialIndicator = /serial|no|number|sku|id|নম্বর|সিরিয়াল|সিরিয়াল|নম্বরর|কোড/.test(reqClean) || /^\s*\d+\s*$/.test(reqCleanE);
  
  if (numberMatch && hasSerialIndicator) {
    const serialIndex = parseInt(numberMatch[0], 10);
    
    // First, try matching directly on p.serialNumber
    let foundBySerial = productsList.find(p => p.serialNumber === serialIndex);
    if (foundBySerial) {
      return foundBySerial;
    }
    
    // Also check if index matches (1-based index)
    if (serialIndex >= 1 && serialIndex <= productsList.length) {
      return productsList[serialIndex - 1]; // e.g. serial 11 is productsList[10]
    }
  }

  // --- 2. EXACT OR CLEAR SUBSTRING OVERLAP MATCH (Pre-normalization) ---
  let found = productsList.find(p => {
    const pName = p.name.toLowerCase();
    return pName === reqClean || pName.includes(reqClean) || reqClean.includes(pName);
  });
  if (found) return found;

  // --- 3. BILINGUAL SYNONYMS AND COLLOQUIAL MAPPINGS ---
  const synonymMap: { [bengaliKey: string]: string[] } = {
    'ময়দা': ['flour', 'maida', 'wheat', 'ata', 'আটা', 'ময়দা', 'ময়দা ১ কেজি', 'ময়দা ১ কেজি'],
    'ময়দা': ['flour', 'maida', 'wheat', 'ata', 'আটা', 'ময়দা', 'ময়দা ১ কেজি', 'ময়দা ১ কেজি'],
    'আটা': ['flour', 'ata', 'maida', 'wheat', 'ময়দা', 'ময়দা', 'আটা ১ কেজি'],
    'আলু': ['potato', 'potatoes', 'alu', 'আলু ৫ কেজি', 'আলু ১০ কেজি'],
    'ভুষি': ['bran', 'wheat bran', 'gomer', 'bhusi', 'vusi', 'ভুসি', 'ভূষি', 'গমের', 'gomer bhusi', 'গমের ভুষি', 'গমের ভুসি'],
    'ভুসি': ['bran', 'wheat bran', 'gomer', 'bhusi', 'vusi', 'ভুষি', 'ভূষি', 'গমের', 'gomer bhusi', 'গমের ভুষি', 'গমের ভুসি'],
    'ভূষি': ['bran', 'wheat bran', 'gomer', 'bhusi', 'vusi', 'ভুসি', 'ভুষি', 'গমের', 'gomer bhusi', 'গমের ভুষি', 'গমের ভুসি'],
    'গমের ভুসি': ['bran', 'wheat bran', 'gomer', 'bhusi', 'vusi', 'ভুসি', 'ভুষি', 'ভূষি', 'gomer bhusi', 'গমের ভুষি'],
    'গমের ভুষি': ['bran', 'wheat bran', 'gomer', 'bhusi', 'vusi', 'ভুসি', 'ভুষি', 'ভূষি', 'gomer bhusi', 'গমের ভুসি'],
    'তেল': ['oil', 'soyabean', 'soybean', 'mustard', 'shorisha', 'tel', 'সয়াবিন', 'সয়াবিন'],
    'সয়াবিন': ['oil', 'soyabean', 'soybean', 'tel', 'সয়াবিন', 'তেল'],
    'সয়াবিন': ['oil', 'soyabean', 'soybean', 'tel', 'সয়াবিন', 'তেল'],
    'চাল': ['rice', 'chal', 'miniket', 'najirshail', 'চালের'],
    'চিনি': ['sugar', 'chini', 'চিনি ১ কেজি'],
    'লবণ': ['salt', 'lobon', 'লবন', 'লবণ ১ কেজি'],
    'লবন': ['salt', 'lobon', 'লবণ', 'লবণ ১ কেজি'],
    'ডাল': ['dal', 'lentil', 'lentils', 'mushur', 'ডাল ১ কেজি'],
    'পেঁয়াজ': ['onion', 'onions', 'piaj', 'peaj', 'পিয়াজ'],
    'পিয়াজ': ['onion', 'onions', 'piaj', 'peaj', 'পেঁয়াজ'],
    'রসুন': ['garlic', 'rosun'],
    'আদা': ['ginger', 'ada'],
    'ডিম': ['egg', 'eggs', 'dim', 'ডিম এক ডজন'],
    'দুধ': ['milk', 'dudh', 'cow milk'],
    'চা': ['tea', 'cha', 'pata cha'],
    'সাবান': ['soap', 'saban', 'lux'],
  };

  for (const [bnKey, synonyms] of Object.entries(synonymMap)) {
    const isReqMatchingKey = reqClean.includes(bnKey) || synonyms.some(syn => reqClean.includes(syn));
    if (isReqMatchingKey) {
      found = productsList.find(p => {
        const pName = p.name.toLowerCase();
        return pName.includes(bnKey) || synonyms.some(syn => pName.includes(syn)) || pName.split(/\s+/).some(w => synonyms.includes(w));
      });
      if (found) return found;
    }
  }

  // --- 4. PHONETIC NORMALIZED MATCH (Resilient to spelling typos/vowels) ---
  const reqNorm = normalizeBengaliPhonetic(reqClean);
  let bestPhoneticMatch = undefined;
  let highestSequenceOverlap = 0;
  
  for (const p of productsList) {
    const pNorm = normalizeBengaliPhonetic(p.name);
    if (pNorm === reqNorm || pNorm.includes(reqNorm) || reqNorm.includes(pNorm)) {
      return p;
    }
    
    // Compute character matching score for proximity
    let commonLen = 0;
    const minLen = Math.min(pNorm.length, reqNorm.length);
    for (let i = 0; i < minLen; i++) {
      if (pNorm[i] === reqNorm[i]) commonLen++;
    }
    if (commonLen > highestSequenceOverlap && commonLen > 2) {
      highestSequenceOverlap = commonLen;
      bestPhoneticMatch = p;
    }
  }
  if (bestPhoneticMatch && highestSequenceOverlap > (reqNorm.length * 0.7)) {
    return bestPhoneticMatch;
  }

  // --- 5. TOKENIZED WORD OVERLAP FALLBACK ---
  const ignoreWords = ['kg', 'g', 'gm', 'pcs', 'unit', 'কেজি', 'গ্রাম', 'পিস', 'টি', 'নম্বর', 'সিরিয়াল', 'সিরিয়াল', 'প্রোডাক্ট', 'আইটেম'];
  const reqWords = reqClean.split(/\s+/).filter(w => w.length > 1 && !ignoreWords.includes(w));
  if (reqWords.length > 0) {
    let bestProduct = undefined;
    let maxOverlapCount = 0;
    
    for (const p of productsList) {
      const pName = p.name.toLowerCase();
      const pNorm = normalizeBengaliPhonetic(pName);
      let overlap = 0;
      for (const word of reqWords) {
        const wordNorm = normalizeBengaliPhonetic(word);
        if (pName.includes(word) || pNorm.includes(wordNorm)) {
          overlap++;
        }
      }
      if (overlap > maxOverlapCount) {
        maxOverlapCount = overlap;
        bestProduct = p;
      }
    }
    
    if (maxOverlapCount > 0) {
      return bestProduct;
    }
  }

  return undefined;
};
