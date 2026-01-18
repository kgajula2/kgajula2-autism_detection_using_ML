/**
 * ML Service - Logistic Regression Inference Engine
 * 
 * This module implements a pure JavaScript Logistic Regression model
 * that matches the Python training script's output format.
 * No TensorFlow.js dependency required.
 */

import { ML_FEATURE_MAPPING } from '../config/gameConfig';
import { getGeminiModel } from './firebase';

let modelData = null;

/**
 * Sigmoid activation function
 */
const sigmoid = (z) => 1 / (1 + Math.exp(-z));

/**
 * Load the trained model weights from the JSON file
 */
export const loadModel = async () => {
    try {
        const response = await fetch('/models/model_weights.json');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Failed to fetch model`);
        }
        modelData = await response.json();
        return true;
    } catch (err) {
        console.error("❌ Failed to load ML model:", err);
        return false;
    }
};

/**
 * Predict risk score using Logistic Regression
 * 
 * Formula: P(y=1) = sigmoid(X * coefficients + intercept)
 * 
 * @param {Object} gameRisks - Object with risk scores from each game
 * @param {Object} demographics - { age, gender, jaundice, familyAsd }
 * @returns {number} Risk probability between 0 and 1
 */
export const predictRisk = async (gameRisks, demographics = {}) => {
    if (!modelData) {
        console.warn("Model not loaded, attempting load...");
        const loaded = await loadModel();
        if (!loaded) return 0.15; // Return a baseline instead of null
    }

    const { coefficients, intercept, scaler_mean, scaler_scale, feature_names } = modelData.level_2_model;

    // Build feature vector in the order expected by the model
    const features = feature_names.map(name => {
        if (name.includes('_risk')) {
            // Game risk feature (e.g., "color_focus_risk")
            const gameKey = name.replace('_risk', '');
            return gameRisks[gameKey] ?? 0.3; // Default to 0.3 (baseline risk) if not played
        }
        // Demographic features
        switch (name) {
            case 'age': return demographics.age || 5;
            case 'gender': return demographics.gender === 'm' ? 1 : 0;
            case 'jundice': return demographics.jaundice ? 1 : 0;
            case 'austim': return demographics.familyAsd ? 1 : 0;
            default: return 0;
        }
    });

    // Apply StandardScaler transformation
    const scaledFeatures = features.map((val, i) => {
        const mean = scaler_mean[i] || 0;
        const scale = scaler_scale[i] || 1;
        return (val - mean) / scale;
    });

    // Linear combination: z = X * coefficients + intercept
    const z = scaledFeatures.reduce((sum, x, i) => sum + x * coefficients[i], intercept);

    // Apply sigmoid for probability
    const probability = sigmoid(z);

    return probability;
};

/**
 * Calculate per-game risk scores based on performance metrics
 * These scores are continuous values from 0.0 (excellent) to 1.0 (concerning)
 */
export const calculateGameRisks = (gamesData) => {
    const gameRisks = {
        color_focus: 0.3,      // Baseline - will be adjusted based on performance
        routine_sequencer: 0.3,
        emotion_mirror: 0.3,
        object_hunt: 0.3,
        free_toy_tap: 0.3,     // NEW: Exploration/Fixation patterns
        shape_switch: 0.3,     // NEW: Resistance to change
        attention_call: 0.3,   // NEW: Name response/Social attention
    };
    const insights = [];

    // --- Color Focus ---
    if (gamesData['color-focus']) {
        const { score, errors } = gamesData['color-focus'];

        const colorConfig = ML_FEATURE_MAPPING['color-focus'].thresholds;

        // Calculate risk as continuous value based on performance
        // Higher score = lower risk, more errors = higher risk
        let risk = 0.3; // baseline

        if (score < colorConfig.lowScore) {
            risk += 0.3; // Low score increases risk
            insights.push("🎯 Color Focus: Attention patterns show room for improvement.");
        } else if (score > 80) {
            risk -= 0.15; // High score decreases risk
            insights.push("🌟 Color Focus: Excellent attention span demonstrated!");
        }

        if (errors > colorConfig.highErrors) {
            risk += 0.2; // Many errors increase risk
            insights.push("⚡ Color Focus: Quick reactions noted - working on precision.");
        } else if (errors < 2) {
            risk -= 0.1;
            insights.push("✨ Color Focus: Great impulse control!");
        }

        gameRisks.color_focus = Math.max(0.05, Math.min(0.95, risk)); // Clamp between 0.05-0.95
    }

    // --- Routine Sequencer ---
    if (gamesData['routine-sequencer']) {
        const { mistakes, completed } = gamesData['routine-sequencer'];
        const routineConfig = ML_FEATURE_MAPPING['routine-sequencer'].thresholds;

        let risk = 0.3;

        if (mistakes > routineConfig.highMistakes) {
            risk += 0.35;
            insights.push("🧩 Routine Sequencer: Sequential ordering is being developed.");
        } else if (mistakes === 0 && completed) {
            risk -= 0.2;
            insights.push("🌟 Routine Sequencer: Perfect sequence recognition!");
        } else if (completed) {
            risk -= 0.1;
            insights.push("✨ Routine Sequencer: Good understanding of daily routines.");
        }

        gameRisks.routine_sequencer = Math.max(0.05, Math.min(0.95, risk));
    }

    // --- Emotion Mirror ---
    if (gamesData['emotion-mirror']) {
        const { score, attempts } = gamesData['emotion-mirror'];

        let risk = 0.3;

        // Calculate accuracy
        const accuracy = attempts > 0 ? (score / (attempts * 15)) * 100 : 0;

        if (accuracy < 40) {
            risk += 0.4;
            insights.push("🪞 Emotion Mirror: Facial expression recognition is developing.");
        } else if (accuracy > 80) {
            risk -= 0.2;
            insights.push("🌟 Emotion Mirror: Excellent expression mirroring ability!");
        } else {
            insights.push("✨ Emotion Mirror: Good emotional recognition skills.");
        }

        gameRisks.emotion_mirror = Math.max(0.05, Math.min(0.95, risk));
    }

    // --- Object ID (Hunt) ---
    if (gamesData['object-id']) {
        const { correct, wrong } = gamesData['object-id'];
        const total = correct + wrong;

        let risk = 0.3;

        if (total > 0) {
            const accuracy = correct / total;

            if (accuracy < 0.5) {
                risk += 0.3;
                insights.push("🔍 Object ID: Visual discrimination is being strengthened.");
            } else if (accuracy > 0.9) {
                risk -= 0.2;
                insights.push("🌟 Object ID: Excellent visual identification skills!");
            } else {
                insights.push("✨ Object ID: Good object recognition ability.");
            }
        }

        gameRisks.object_hunt = Math.max(0.05, Math.min(0.95, risk));
    }

    // --- Free Toy Tap (Exploration/Fixation) ---
    if (gamesData['free-toy-tap']) {
        const { objectFixationEntropy, repetitionRate, switchFrequency, totalTaps } = gamesData['free-toy-tap'];
        const config = ML_FEATURE_MAPPING['free-toy-tap']?.thresholds || { lowEntropy: 1.0, highRepetition: 0.5, lowSwitchFreq: 0.15 };

        let risk = 0.3;

        // Low entropy = child fixates on few toys (concerning for ASD)
        if (objectFixationEntropy !== undefined && objectFixationEntropy < config.lowEntropy) {
            risk += 0.3;
            insights.push("🧸 Toy Box: Focused play on specific toys observed.");
        } else if (objectFixationEntropy > 1.5) {
            risk -= 0.15;
            insights.push("🌟 Toy Box: Great exploration of multiple toys!");
        }

        // High repetition = repetitive behavior pattern
        if (repetitionRate !== undefined && repetitionRate > config.highRepetition) {
            risk += 0.25;
            insights.push("🔄 Toy Box: Repetitive tapping patterns noted.");
        }

        // Low switch frequency = restricted exploration
        if (switchFrequency !== undefined && switchFrequency < config.lowSwitchFreq) {
            risk += 0.2;
            insights.push("👆 Toy Box: Focused attention on preferred toys.");
        }

        // Low engagement
        if (totalTaps !== undefined && totalTaps < 10) {
            risk += 0.15;
            insights.push("💤 Toy Box: Limited engagement observed.");
        }

        gameRisks.free_toy_tap = Math.max(0.05, Math.min(0.95, risk));
    }

    // --- Shape Switch (Resistance to Change) ---
    if (gamesData['shape-switch']) {
        const { avgConfusionDuration, totalWrongAfterSwitch, adaptationSpeed, totalSwitches } = gamesData['shape-switch'];
        const config = ML_FEATURE_MAPPING['shape-switch']?.thresholds || { highConfusion: 5000, highPerseveration: 3 };

        let risk = 0.3;

        // Long confusion duration = difficulty adapting to change
        if (avgConfusionDuration !== undefined && avgConfusionDuration > config.highConfusion) {
            risk += 0.35;
            insights.push("🔄 Shape Play: Takes time to adapt to rule changes.");
        } else if (avgConfusionDuration !== undefined && avgConfusionDuration < 2000) {
            risk -= 0.2;
            insights.push("🌟 Shape Play: Quick adaptation to new rules!");
        }

        // High perseveration = stuck on old rule
        if (totalWrongAfterSwitch !== undefined && totalWrongAfterSwitch > config.highPerseveration) {
            risk += 0.3;
            insights.push("🔷 Shape Play: Preference for familiar patterns observed.");
        }

        // Good adaptation speed
        if (adaptationSpeed !== undefined && totalSwitches && adaptationSpeed >= totalSwitches * 0.7) {
            risk -= 0.15;
            insights.push("✨ Shape Play: Good cognitive flexibility demonstrated!");
        }

        gameRisks.shape_switch = Math.max(0.05, Math.min(0.95, risk));
    }

    // --- Attention Call (Name Response) ---
    if (gamesData['attention-call']) {
        const { responseRate, avgResponseTime, totalResponses, totalCalls } = gamesData['attention-call'];
        const config = ML_FEATURE_MAPPING['attention-call']?.thresholds || { lowResponseRate: 0.33, highLatency: 3000 };

        let risk = 0.3;

        // Low response rate = potential concern
        if (responseRate !== undefined && responseRate < config.lowResponseRate) {
            risk += 0.4;
            insights.push("🔔 Hi There: Limited response to name calls observed.");
        } else if (responseRate !== undefined && responseRate > 0.8) {
            risk -= 0.25;
            insights.push("🌟 Hi There: Excellent attention to name!");
        }

        // High response latency = slow social orienting
        if (avgResponseTime !== undefined && avgResponseTime > config.highLatency) {
            risk += 0.2;
            insights.push("⏱️ Hi There: Delayed response time noted.");
        } else if (avgResponseTime !== undefined && avgResponseTime < 1500) {
            risk -= 0.1;
            insights.push("✨ Hi There: Quick response to name calls!");
        }

        // No responses at all = significant concern
        if (totalResponses === 0 && totalCalls > 0) {
            risk += 0.3;
            insights.push("👂 Hi There: May benefit from name recognition activities.");
        }

        gameRisks.attention_call = Math.max(0.05, Math.min(0.95, risk));
    }

    return { gameRisks, insights };
};

/**
 * Main analysis function - processes game data and returns risk assessment
 */
export const analyzeUserPerformance = async (gamesData, demographics = {}) => {
    // Ensure model is loaded
    if (!modelData) {
        await loadModel();
    }

    // Check if player actually played (has any meaningful score or interactions)
    const hasPlayed = Object.values(gamesData).some(game => {
        const score = game?.score || 0;
        const correct = game?.correct || 0;
        const attempts = game?.attempts || 0;
        return score > 0 || correct > 0 || attempts > 0;
    });

    // If player didn't actually play, return special "not played" result
    if (!hasPlayed) {
        return {
            riskScore: null,  // null indicates not played
            notPlayed: true,
            insights: [],
            gameRisks: {},
            aiInsights: "No game activity detected. Please play the game to get your analysis!",
        };
    }

    // Step 1: Calculate game-level risks
    const { gameRisks, insights } = calculateGameRisks(gamesData);

    // Step 2: Get global risk score from Level-2 model
    const riskScore = await predictRisk(gameRisks, demographics);

    // Step 3: Generate AI insights (optional, may fail gracefully)
    let aiInsights = null;
    try {
        aiInsights = await generateGeminiInsights(gamesData, riskScore, insights);
    } catch (e) {
        console.error("Gemini Insight Generation Failed:", e);
        // Fallback to rule-based insights
        aiInsights = insights.length > 0
            ? insights.join(' ')
            : "Great job completing the game! Keep practicing to improve your skills.";
    }

    return {
        riskScore,
        notPlayed: false,
        insights,
        gameRisks,
        aiInsights,
    };
};

/**
 * Generate narrative insights using Gemini AI
 */
export const generateGeminiInsights = async (gamesData, riskScore, ruleBasedInsights = []) => {
    try {
        const model = getGeminiModel();
        if (!model) {
            // Return rule-based insights if AI not available
            return ruleBasedInsights.length > 0
                ? ruleBasedInsights.join(' ')
                : "Good effort! Continue playing to track progress over time.";
        }

        const prompt = `
        You are an expert child behavioral analyst. Analyze the following game performance metrics for a child (approx 4-6 years old) screened for autism risk.
        
        Current Risk Probability (ML Model): ${((riskScore || 0) * 100).toFixed(1)}%
        
        Game Data:
        ${JSON.stringify(gamesData, null, 2)}
        
        Rule-based observations:
        ${ruleBasedInsights.join('\n')}
        
        Provide a gentle, supportive, and professional summary for the parent. 
        Focus on:
        1. Observable strengths (e.g., "fast reaction time", "high accuracy")
        2. Areas that might need attention (e.g., "impulsive clicking", "difficulty with patterns")
        3. A soft recommendation based on the risk score (e.g., "Suggest consulting a specialist" if high, or "Keep monitoring" if low).
        
        Keep it under 3-4 sentences. Use a warm, encouraging tone that celebrates effort.
        `;

        const result = await model.generateContent(prompt);
        const response = result.response;
        return response.text();
    } catch (error) {
        console.error("Error calling Gemini:", error);

        // Fallback to rule-based insights
        return ruleBasedInsights.length > 0
            ? ruleBasedInsights.join(' ')
            : "Great progress today! Regular practice helps develop important skills.";
    }
};

/**
 * Get model performance metrics for display in dashboard
 */
export const getModelMetrics = () => {
    if (!modelData) return null;
    return {
        global: modelData.global_metrics,
        perGame: modelData.level_1_models,
    };
};
