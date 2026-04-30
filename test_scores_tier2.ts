import { parseVoiceCommandQuantity, standardizeBn, toPhonetic } from './src/utils/voiceUtils';

const calculateScore = (targetText: string, searchStr: string, phoneticSearch: string, sWords: string[]) => {
      let score = 0;
      const tName = standardizeBn(targetText);
      const phoneticTName = toPhonetic(tName);
      
      if (tName === searchStr) score += 100;
      if (phoneticTName === phoneticSearch && phoneticSearch.length > 2) score += 90;
      if (tName.includes(searchStr)) score += 50;
      if (phoneticTName.includes(phoneticSearch) && phoneticSearch.length > 3) score += 40;
      
      const wordsMatch = sWords.filter((w: string) => tName.includes(w)).length;
      score += wordsMatch * 10;
      
      const tWords = tName.split(/\s+/).filter((w: string) => w.length > 0);
      const phoneticWordsMatch = sWords.filter((w: string) => {
          const phW = toPhonetic(w);
          return phW.length > 0 && tWords.some((pw: string) => {
              const phT = toPhonetic(pw);
              return phT === phW || phT.includes(phW) || (phW.length > 2 && phW.includes(phT));
          });
      }).length;
      score += phoneticWordsMatch * 8;
      
      return score;
};

const texts = [
  "মিষ্টান নুডুল ৪ প্যাকেটের ১০ পিস",
  "মিস্টার নুর 10 প্যাকেট 8 পিস",
  "মিস্টার নুর দশ প্যাকেটের আট পিস",
  "মিস্টার নুডুল চার প্যাকেটের দশ পিস"
];

const products = [
  "মিস্টার নুডুলস ৪ প্যাকেট",
  "মিস্টার নুডুলস ৮ প্যাকেট",
  "মিস্টার নুডুলস ১০ প্যাকেট",
  "মিস্টার নুডুলস ১২ প্যাকেট"
];

for (const rawText of texts) {
  console.log('----- COMMAND:', rawText);
  const parsed = parseVoiceCommandQuantity(rawText);
  const searchName = parsed.searchName || parsed.originalText;
  const stdSearchName = standardizeBn(searchName);
  const phSearchName = toPhonetic(stdSearchName);
  const searchWords = stdSearchName.split(/\s+/).filter(w => w.length > 0);
  
  const parsedMatches = products.map(p => ({
     product: p,
     score: calculateScore(p, stdSearchName, phSearchName, searchWords)
  }));
  
  parsedMatches.sort((a,b) => b.score - a.score);
  console.log('Tier 2 Match:', parsedMatches[0]);
}
