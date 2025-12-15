import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
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

const AIInsightCard = () => {
    const { stats, chartData } = useInstructorProfile();
    
    // Improved Mock AI Generation
    const insight = useMemo(() => {
        const rating = Number(stats?.avgRating || 0);
        const count = stats?.reviewCount || 0;
        
        if (count < 5) return {
            summary: "I'm analyzing your initial teaching patterns. Collect 5+ reviews to unlock deep insights.",
            strengths: ["Waiting for data..."],
            improvements: ["Encourage students to review"],
            confidence: 45
        };

        if (rating >= 4.5) return {
            summary: "Your teaching style is highly effective. Students particularly appreciate your clarity and real-world examples.",
            strengths: ["Clear Explanations", "Engaging Lectures", "Availability"],
            improvements: ["Pacing can be slightly adjusted for complex topics"],
            confidence: 92
        };

        return {
            summary: "Students find your material valuable but engage less with the current delivery format.",
            strengths: ["Deep Subject Knowledge", "Fair Grading"],
            improvements: ["Increase interactivity", "Use more visual aids"],
            confidence: 85
        };
    }, [stats]);

    return (
        <motion.div 
            whileHover={{ y: -2 }}
            className="ai-card-premium"
        >
            <div className="ai-header-premium">
                <div className="ai-icon-pulse">✨</div>
                <h3 className="ai-title-premium">AI Teaching Analysis</h3>
                <span className="premium-badge">PRO</span>
            </div>

            <p className="ai-summary-text">
                "{insight.summary}"
            </p>

            <div className="ai-details-grid">
                <div className="ai-col">
                    <h4 className="ai-subtitle text-emerald-400">Strengths</h4>
                    <ul className="ai-list">
                        {insight.strengths.map((s, i) => <li key={i}>✓ {s}</li>)}
                    </ul>
                </div>
                <div className="ai-col">
                    <h4 className="ai-subtitle text-amber-400">Focus Area</h4>
                    <ul className="ai-list">
                        {insight.improvements.map((s, i) => <li key={i}>→ {s}</li>)}
                    </ul>
                </div>
            </div>

            <div className="ai-footer-premium">
                <ConfidenceMeter score={insight.confidence} />
                <button className="btn-ai-action">
                    Request Deep Analysis
                </button>
            </div>
        </motion.div>
    );
};

export default AIInsightCard;
