
import { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { openFoulModal } from '../store/slices/uiSlice';
import { validateText } from '../utils/textValidation';
import { aiSpellCorrect } from '../utils/aiSpellCorrect';

/**
 * Hook to handle content moderation (Foul language check + AI Spelling).
 * @returns {object} - { validateAndSubmit, isChecking, suggestion, applySuggestion, dismissSuggestion }
 */
export default function useContentModeration() {
    const dispatch = useDispatch();
    const [isChecking, setIsChecking] = useState(false);
    const [suggestion, setSuggestion] = useState(null); // { original, corrected }

    const validateContent = useCallback((text) => {
        const { isValid, violations } = validateText(text);
        if (!isValid) {
            dispatch(openFoulModal(violations));
            return false;
        }
        return true;
    }, [dispatch]);

    const checkSpelling = useCallback(async (text) => {
        setIsChecking(true);
        try {
            const corrected = await aiSpellCorrect(text);
            if (corrected && corrected !== text) {
                setSuggestion({ original: text, corrected });
                setIsChecking(false);
                return true; // Found suggestion
            }
        } catch (error) {
            console.error("AI Check Failed:", error);
        }
        setIsChecking(false);
        return false; // No suggestion
    }, []);

    const applySuggestion = () => {
        const result = suggestion?.corrected;
        setSuggestion(null);
        return result;
    };

    const dismissSuggestion = () => {
        setSuggestion(null);
    };

    return {
        validateContent,
        checkSpelling,
        isChecking,
        suggestion,
        applySuggestion,
        dismissSuggestion
    };
}
