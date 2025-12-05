
// Comprehensive list of foul words, phrases, and patterns for content moderation.
// This list includes standard profanity, toxic sentiment, and regex patterns for obfuscation.

export const FOUL_WORDS_LIST = [
    // Standard Profanity (Mild to Severe)
    "fuck", "shit", "bitch", "asshole", "bastard", "damn", "crap", "piss", "dick", "cock", "pussy", "slut", "whore",
    "faggot", "nigger", "nigga", "retard", "spic", "kike", "chink", "dyke", "cunt", "motherfucker", "wanker", "bollocks",
    "twat", "bugger", "prick", "bullshit", "jackass", "douchebag",
    
    // Local/Regional Variants (Ethiopian context implied by CNCS/AAU)
    "shemuta", "shinta", "gim", "legeba", "fendata", "neftegna", "galla", // Examples of potential local slurs (placeholders)
    
    // Toxic Sentiment / Harassment Phrases
    "stupid", "dumb", "useless", "hate", "kill", "die", "ugly", "fat", "crazy", "insane",
    "you are stupid",
    "you are dumb",
    "worst instructor ever",
    "go to hell",
    "i hate you",
    "you should quit",
    "kill yourself",
    "you are useless",
    "you suck",
    "idiot",
    "moron",
    "imbecile",
    "shut up",
    "trash teacher",
    "garbage",
    "fail your course",
    "waste of time"
];

export const OBFUSCATION_PATTERNS = [
    // Regex patterns to detect masked words
    /f[\W_]*u[\W_]*c[\W_]*k/i,       // f*ck, f.u.c.k, f@ck
    /s[\W_]*h[\W_]*i[\W_]*t/i,       // sh!t, s.h.i.t
    /b[\W_]*i[\W_]*t[\W_]*c[\W_]*h/i,// b!tch
    /a[\W_]*s[\W_]*s/i,              // @ss
    /d[\W_]*i[\W_]*c[\W_]*k/i,       // d!ck
    /1[\W_]*d[\W_]*i[\W_]*0[\W_]*t/i // 1di0t
];

export const TOXIC_PHRASES_REGEX = [
    /you\s+are\s+(stupid|dumb|idiot|moron|useless)/i,
    /worst\s+(teacher|instructor|professor)\s+ever/i,
    /go\s+to\s+hell/i,
    /i\s+hate\s+you/i,
    /you\s+should\s+(quit|die|leave)/i
];
