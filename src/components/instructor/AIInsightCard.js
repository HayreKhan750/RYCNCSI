import React from 'react';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAIInsights } from '../../store/slices/instructorSlice';
import useInstructorProfile from '../../hooks/useInstructorProfile';

const ConfidenceMeter = ({ score }) => (
    <div className="confidence-meter">
        <div className="cm-label-row">
            <span>AI Confidence</span>
            <span>{score}%</span>
        </div>
        <div className="cm-track">
            <div className="cm-fill" style={{width: `${score}%`}}></div>
        </div>
    </div>
);

const AIInsightCard = (props) => {
    const dispatch = useDispatch();
    const { profile } = useInstructorProfile();
    const { activeProfile } = useSelector(state => state.instructors);
    
    // Use Redux state or fallback to initial "Waiting" state
    const { aiInsights, aiStatus } = activeProfile;
    const isLoading = aiStatus === 'loading';

    const handleRequestAnalysis = () => {
        if (profile?.id) {
            dispatch(fetchAIInsights(profile.id));
        }
    };

    // Use passed topTraits if available, otherwise fallback to AI data or default
    const strengths = props.topTraits && props.topTraits.length > 0 ? props.topTraits : (aiInsights?.strengths || ["Waiting for data..."]);

    const displayData = aiInsights || {
        summary: "I'm analyzing your initial teaching patterns. Collect 5+ reviews to unlock deep insights.",
        strengths: strengths,
        improvements: ["Encourage students to review"],
        confidence: 45
    };

    // Override strengths if topTraits provided even if AI insights exist
    if (props.topTraits && props.topTraits.length > 0) {
        displayData.strengths = props.topTraits;
    }

    return (
        <motion.div 
            whileHover={{ y: -2 }}
            className="ai-card-premium"
        >
            {isLoading && (
                <div className="ai-loading-overlay">
                    <div className="ai-spinner"></div>
                    <span>Analyzing Patterns...</span>
                </div>
            )}

            <div className="ai-header-premium">
                <div className="ai-icon-pulse">✨</div>
                <h3 className="ai-title-premium">AI Teaching Analysis</h3>
                <span className="premium-badge">PRO</span>
            </div>

            <p className="ai-summary-text">
                "{displayData.summary}"
            </p>

            <div className="ai-details-grid">
                <div className="ai-col">
                    <h4 className="ai-subtitle text-emerald-400">Strengths</h4>
                    <ul className="ai-list">
                        {displayData.strengths?.map((s, i) => <li key={i}>✓ {s}</li>)}
                    </ul>
                </div>
                <div className="ai-col">
                    <h4 className="ai-subtitle text-amber-400">Focus Area</h4>
                    <ul className="ai-list">
                        {displayData.improvements?.map((s, i) => <li key={i}>→ {s}</li>)}
                    </ul>
                </div>
            </div>

            <div className="ai-footer-premium">
                <ConfidenceMeter score={displayData.confidence} />
                <button 
                    className="btn-ai-action" 
                    onClick={handleRequestAnalysis}
                    disabled={isLoading}
                >
                    {isLoading ? 'Analyzing...' : 'Request Deep Analysis'}
                </button>
            </div>
        </motion.div>
    );
};

export default AIInsightCard;
