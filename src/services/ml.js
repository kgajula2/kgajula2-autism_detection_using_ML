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
        console.log("✅ ML Model loaded successfully", modelData.global_metrics);
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
        if (!loaded) return null;
    }

    const { coefficients, intercept, scaler_mean, scaler_scale, feature_names } = modelData.level_2_model;

    // Build feature vector in the order expected by the model
    const features = feature_names.map(name => {
        if (name.includes('_risk')) {
            // Game risk feature (e.g., "color_focus_risk")
            const gameKey = name.replace('_risk', '');
            return gameRisks[gameKey] || 0;
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
    return sigmoid(z);
};

/**
 * Calculate per-game risk scores based on performance metrics
 * These scores are inputs to the Level-2 global model
 */
export const calculateGameRisks = (gamesData) => {
    const gameRisks = {
        color_focus: 0,
        routine_sequencer: 0,
        emotion_mirror: 0,
        object_hunt: 0,
    };
    const insights = [];

    // --- Color Focus ---
    if (gamesData['color-focus']) {
        const { score, errors } = gamesData['color-focus'];
        const config = ML_FEATURE_MAPPING['color-focus'].thresholds;

        let risk = 0;
        if (score < config.lowScore) {
            risk += 0.5;
            insights.push("Color Focus: Low score suggests attention challenges.");
        }
        if (errors > config.highErrors) {
            risk += 0.5;
            insights.push("Color Focus: High errors indicate impulsive responses.");
        }
        if (risk === 0) {
            insights.push("Color Focus: Good attention and impulse control.");
        }
        gameRisks.color_focus = Math.min(risk, 1);
    }

    // --- Routine Sequencer ---
    if (gamesData['routine-sequencer']) {
        const { mistakes, completed } = gamesData['routine-sequencer'];
        const config = ML_FEATURE_MAPPING['routine-sequencer'].thresholds;

        if (mistakes > config.highMistakes) {
            gameRisks.routine_sequencer = 0.7;
            insights.push("Routine Sequencer: Difficulty with sequential steps.");
        } else if (completed) {
            insights.push("Routine Sequencer: Strong sequencing ability.");
        }
    }

    // --- Emotion Mirror ---
    if (gamesData['emotion-mirror']) {
        const { score, attempts } = gamesData['emotion-mirror'];
        const config = ML_FEATURE_MAPPING['emotion-mirror'].thresholds;

        if (score < config.lowScore) {
            gameRisks.emotion_mirror = 0.8;
            insights.push("Emotion Mirror: Challenges with expression recognition.");
        } else {
            insights.push("Emotion Mirror: Excellent facial expression mirroring.");
        }
    }

    // --- Object ID (Hunt) ---
    if (gamesData['object-id']) {
        const { correct, wrong } = gamesData['object-id'];
        const config = ML_FEATURE_MAPPING['object-id'].thresholds;

        if (wrong > config.highWrong) {
            gameRisks.object_hunt = 0.6;
            insights.push("Object ID: Struggles with visual discrimination.");
        } else if (correct > config.highCorrect && wrong < config.lowWrong) {
            insights.push("Object ID: High precision in visual identification.");
        }
    }

    return { gameRisks, insights };
};

/**
 * Main analysis function - processes game data and returns risk assessment
 */
export const analyzeUserPerformance = async (gamesData, demographics = {}) => {
    // Step 1: Calculate game-level risks
    const { gameRisks, insights } = calculateGameRisks(gamesData);

    // Step 2: Get global risk score from Level-2 model
    const riskScore = await predictRisk(gameRisks, demographics);

    // Step 3: Generate AI insights (optional, may fail gracefully)
    let aiInsights = null;
    try {
        aiInsights = await generateGeminiInsights(gamesData, riskScore);
    } catch (e) {
        console.error("Gemini Insight Generation Failed:", e);
        aiInsights = `AI Analysis unavailable: ${e.message}`;
    }

    return {
        riskScore,
        insights,
        gameRisks,
        aiInsights,
    };
};

/**
 * Generate narrative insights using Gemini AI
 */
export const generateGeminiInsights = async (gamesData, riskScore) => {
    try {
        const model = getGeminiModel();
        if (!model) {
            return "AI model not configured.";
        }

        const prompt = `
        You are an expert child behavioral analyst. Analyze the following game performance metrics for a child (approx 4-6 years old) screened for autism risk.
        
        Current Risk Probability (ML Model): ${((riskScore || 0) * 100).toFixed(1)}%
        
        Game Data:
        ${JSON.stringify(gamesData, null, 2)}
        
        Provide a gentle, supportive, and professional summary for the parent. 
        Focus on:
        1. Observable strengths (e.g., "fast reaction time", "high accuracy")
        2. Areas that might need attention (e.g., "impulsive clicking", "difficulty with patterns")
        3. A soft recommendation based on the risk score (e.g., "Suggest consulting a specialist" if high, or "Keep monitoring" if low).
        
        Keep it under 3-4 sentences. Use a warm tone.
        `;

        const result = await model.generateContent(prompt);
        const response = result.response;
        return response.text();
    } catch (error) {
        console.error("Error calling Gemini:", error);

        if (error.message?.includes('Quota') || error.message?.includes('429')) {
            return "Our AI is currently experiencing high traffic. Please try again later for detailed insights.";
        }

        return "Detailed AI narrative is temporarily unavailable. Please refer to the visual risk score.";
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
