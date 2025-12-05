
import { FOUL_WORDS_LIST, OBFUSCATION_PATTERNS, TOXIC_PHRASES_REGEX } from './foulWordList';

/**
 * Validates text content against foul language and toxic patterns.
 * @param {string} text - The text to validate.
 * @returns {object} - { isValid: boolean, violations: string[] }
 */
export const validateText = (text) => {
    if (!text || typeof text !== 'string') {
        return { isValid: true, violations: [] };
    }

    const lowerText = text.toLowerCase();
    const violations = new Set();

    // 1. Check Standard Keyword List
    FOUL_WORDS_LIST.forEach(word => {
        // Use word boundary check for short words to avoid false positives (e.g., "class" contains "ass")
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        if (regex.test(lowerText) || (word.length > 4 && lowerText.includes(word))) {
             // For longer phrases in the list, simple inclusion is often enough
             if (lowerText.includes(word)) {
                 violations.add(word);
             }
        }
    });

    // 2. Check Obfuscation Patterns
    OBFUSCATION_PATTERNS.forEach(pattern => {
        if (pattern.test(lowerText)) {
            violations.add("Obfuscated Profanity");
        }
    });

    // 3. Check Toxic Phrases Regex
    TOXIC_PHRASES_REGEX.forEach(pattern => {
        if (pattern.test(lowerText)) {
            violations.add("Toxic Language");
        }
    });

    const violationsArray = Array.from(violations);

    return {
        isValid: violationsArray.length === 0,
        violations: violationsArray
    };
};
