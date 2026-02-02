

import { ML_FEATURE_MAPPING } from '../config/gameConfig';
import { getGeminiModel } from './firebase';

let modelData = null;


const sigmoid = (z) => 1 / (1 + Math.exp(-z));


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


export const predictRisk = async (gameRisks, demographics = {}) => {
    if (!modelData) {
        console.warn("Model not loaded, attempting load...");
        const loaded = await loadModel();
        if (!loaded) return 0.15;
    }

    const { coefficients, intercept, scaler_mean, scaler_scale, feature_names } = modelData.level_2_model;


    const features = feature_names.map(name => {
        if (name.includes('_risk')) {

            const gameKey = name.replace('_risk', '');
            return gameRisks[gameKey] ?? 0.3;
        }

        switch (name) {
            case 'age': return demographics.age || 5;
            case 'gender': return demographics.gender === 'm' ? 1 : 0;
            case 'jundice': return demographics.jaundice ? 1 : 0;
            case 'austim': return demographics.familyAsd ? 1 : 0;
            default: return 0;
        }
    });


    const scaledFeatures = features.map((val, i) => {
        const mean = scaler_mean[i] || 0;
        const scale = scaler_scale[i] || 1;
        return (val - mean) / scale;
    });


    const z = scaledFeatures.reduce((sum, x, i) => sum + x * coefficients[i], intercept);


    const probability = sigmoid(z);

    return probability;
};


export const calculateGameRisks = (gamesData) => {
    const gameRisks = {
        color_focus: 0.3,
        routine_sequencer: 0.3,
        emotion_mirror: 0.3,
        object_hunt: 0.3,
        free_toy_tap: 0.3,
        shape_switch: 0.3,
        attention_call: 0.3,
    };
    const insights = [];


    if (gamesData['color-focus']) {
        const { score, errors } = gamesData['color-focus'];

        const colorConfig = ML_FEATURE_MAPPING['color-focus'].thresholds;



        let risk = 0.3;

        if (score < colorConfig.lowScore) {
            risk += 0.3;
            insights.push("🎯 Color Focus: Attention patterns show room for improvement.");
        } else if (score > 80) {
            risk -= 0.15;
            insights.push("🌟 Color Focus: Excellent attention span demonstrated!");
        }

        if (errors > colorConfig.highErrors) {
            risk += 0.2;
            insights.push("⚡ Color Focus: Quick reactions noted - working on precision.");
        } else if (errors < 2) {
            risk -= 0.1;
            insights.push("✨ Color Focus: Great impulse control!");
        }

        gameRisks.color_focus = Math.max(0.05, Math.min(0.95, risk));
    }


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


    if (gamesData['emotion-mirror']) {
        const { score, attempts } = gamesData['emotion-mirror'];

        let risk = 0.3;


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


    if (gamesData['free-toy-tap']) {
        const { objectFixationEntropy, repetitionRate, switchFrequency, totalTaps } = gamesData['free-toy-tap'];
        const config = ML_FEATURE_MAPPING['free-toy-tap']?.thresholds || { lowEntropy: 1.0, highRepetition: 0.5, lowSwitchFreq: 0.15 };

        let risk = 0.3;


        if (objectFixationEntropy !== undefined && objectFixationEntropy < config.lowEntropy) {
            risk += 0.3;
            insights.push("🧸 Toy Box: Focused play on specific toys observed.");
        } else if (objectFixationEntropy > 1.5) {
            risk -= 0.15;
            insights.push("🌟 Toy Box: Great exploration of multiple toys!");
        }


        if (repetitionRate !== undefined && repetitionRate > config.highRepetition) {
            risk += 0.25;
            insights.push("🔄 Toy Box: Repetitive tapping patterns noted.");
        }


        if (switchFrequency !== undefined && switchFrequency < config.lowSwitchFreq) {
            risk += 0.2;
            insights.push("👆 Toy Box: Focused attention on preferred toys.");
        }


        if (totalTaps !== undefined && totalTaps < 10) {
            risk += 0.15;
            insights.push("💤 Toy Box: Limited engagement observed.");
        }

        gameRisks.free_toy_tap = Math.max(0.05, Math.min(0.95, risk));
    }


    if (gamesData['shape-switch']) {
        const { avgConfusionDuration, totalWrongAfterSwitch, adaptationSpeed, totalSwitches } = gamesData['shape-switch'];
        const config = ML_FEATURE_MAPPING['shape-switch']?.thresholds || { highConfusion: 5000, highPerseveration: 3 };

        let risk = 0.3;


        if (avgConfusionDuration !== undefined && avgConfusionDuration > config.highConfusion) {
            risk += 0.35;
            insights.push("🔄 Shape Play: Takes time to adapt to rule changes.");
        } else if (avgConfusionDuration !== undefined && avgConfusionDuration < 2000) {
            risk -= 0.2;
            insights.push("🌟 Shape Play: Quick adaptation to new rules!");
        }


        if (totalWrongAfterSwitch !== undefined && totalWrongAfterSwitch > config.highPerseveration) {
            risk += 0.3;
            insights.push("🔷 Shape Play: Preference for familiar patterns observed.");
        }


        if (adaptationSpeed !== undefined && totalSwitches && adaptationSpeed >= totalSwitches * 0.7) {
            risk -= 0.15;
            insights.push("✨ Shape Play: Good cognitive flexibility demonstrated!");
        }

        gameRisks.shape_switch = Math.max(0.05, Math.min(0.95, risk));
    }


    if (gamesData['attention-call']) {
        const { responseRate, avgResponseTime, totalResponses, totalCalls } = gamesData['attention-call'];
        const config = ML_FEATURE_MAPPING['attention-call']?.thresholds || { lowResponseRate: 0.33, highLatency: 3000 };

        let risk = 0.3;


        if (responseRate !== undefined && responseRate < config.lowResponseRate) {
            risk += 0.4;
            insights.push("🔔 Hi There: Limited response to name calls observed.");
        } else if (responseRate !== undefined && responseRate > 0.8) {
            risk -= 0.25;
            insights.push("🌟 Hi There: Excellent attention to name!");
        }


        if (avgResponseTime !== undefined && avgResponseTime > config.highLatency) {
            risk += 0.2;
            insights.push("⏱️ Hi There: Delayed response time noted.");
        } else if (avgResponseTime !== undefined && avgResponseTime < 1500) {
            risk -= 0.1;
            insights.push("✨ Hi There: Quick response to name calls!");
        }


        if (totalResponses === 0 && totalCalls > 0) {
            risk += 0.3;
            insights.push("👂 Hi There: May benefit from name recognition activities.");
        }

        gameRisks.attention_call = Math.max(0.05, Math.min(0.95, risk));
    }

    return { gameRisks, insights };
};

// --- Screening Validation Configuration ---
export const SCREENING_REQUIREMENTS = {
    MANDATORY_GAMES: ['free-toy-tap', 'attention-call'],
    MIN_TOTAL_GAMES: 3,
};

// --- Helper: Validate Screening Requirements ---
export const validateScreening = (gamesData) => {
    const playedGames = Object.keys(gamesData).filter(gameId => {
        const game = gamesData[gameId];
        return game?.score > 0 || game?.correct > 0 || game?.attempts > 0 || game?.totalTaps > 0 || game?.totalResponses !== undefined;
    });

    const { MANDATORY_GAMES, MIN_TOTAL_GAMES } = SCREENING_REQUIREMENTS;
    const mandatoryPlayed = MANDATORY_GAMES.filter(g => playedGames.includes(g));
    const hasBothMandatory = mandatoryPlayed.length === MANDATORY_GAMES.length;
    const hasEnoughGames = playedGames.length >= MIN_TOTAL_GAMES;
    const isValid = hasBothMandatory && hasEnoughGames;

    return {
        isValid,
        playedGames,
        mandatoryPlayed,
        missingMandatory: MANDATORY_GAMES.filter(g => !playedGames.includes(g)),
        totalPlayed: playedGames.length,
        remainingGames: Math.max(0, MIN_TOTAL_GAMES - playedGames.length),
    };
};

// --- Main Analysis Entry Point ---
export const analyzeUserPerformance = async (gamesData, demographics = {}) => {
    // Load model if not loaded
    if (!modelData) {
        await loadModel();
    }

    // Check if user has played any games
    const hasPlayed = Object.values(gamesData).some(game => {
        const score = game?.score || 0;
        const correct = game?.correct || 0;
        const attempts = game?.attempts || 0;
        return score > 0 || correct > 0 || attempts > 0;
    });

    // No games played at all
    if (!hasPlayed) {
        return {
            riskScore: null,
            notPlayed: true,
            screeningValid: false,
            insights: [],
            gameRisks: {},
            aiInsights: "No game activity detected. Please play the game to get your analysis!",
        };
    }

    // Validate screening requirements
    const screeningValidation = validateScreening(gamesData);

    // If screening requirements not met, return partial result
    if (!screeningValidation.isValid) {
        const { gameRisks, insights } = calculateGameRisks(gamesData);

        let message = "To get a complete analysis, please:\n";
        if (screeningValidation.missingMandatory.length > 0) {
            const gameNames = {
                'free-toy-tap': 'Toy Box',
                'attention-call': 'Hi There!',
            };
            const missing = screeningValidation.missingMandatory.map(g => gameNames[g] || g).join(' and ');
            message += `• Play the required game(s): ${missing}\n`;
        }
        if (screeningValidation.remainingGames > 0) {
            message += `• Play at least ${screeningValidation.remainingGames} more game(s) (your choice)`;
        }

        return {
            riskScore: null,
            notPlayed: false,
            screeningValid: false,
            insights,
            gameRisks,
            aiInsights: message,
            screeningStatus: screeningValidation,
        };
    }

    // --- Valid Screening: Proceed with Full Analysis ---
    const { gameRisks, insights } = calculateGameRisks(gamesData);

    // --- Intelligent Imputation for Unplayed Choice Games ---
    // Instead of using a hardcoded 0.3 for missing games, use the average
    // risk of the games that were actually played.
    const playedGameRisks = Object.entries(gameRisks)
        .filter(([key]) => {
            // Map internal key to gameId
            const gameIdMap = {
                color_focus: 'color-focus',
                routine_sequencer: 'routine-sequencer',
                emotion_mirror: 'emotion-mirror',
                object_hunt: 'object-id',
                free_toy_tap: 'free-toy-tap',
                shape_switch: 'shape-switch',
                attention_call: 'attention-call',
            };
            const gameId = gameIdMap[key];
            return gamesData[gameId] && Object.keys(gamesData[gameId]).length > 0;
        })
        .map(([, risk]) => risk);

    const averagePlayedRisk = playedGameRisks.length > 0
        ? playedGameRisks.reduce((a, b) => a + b, 0) / playedGameRisks.length
        : 0.3;

    // Impute missing games with average risk
    const imputedGameRisks = { ...gameRisks };
    const gameIdToKey = {
        'color-focus': 'color_focus',
        'routine-sequencer': 'routine_sequencer',
        'emotion-mirror': 'emotion_mirror',
        'object-id': 'object_hunt',
        'free-toy-tap': 'free_toy_tap',
        'shape-switch': 'shape_switch',
        'attention-call': 'attention_call',
    };

    Object.keys(gameIdToKey).forEach(gameId => {
        const key = gameIdToKey[gameId];
        if (!gamesData[gameId] || Object.keys(gamesData[gameId] || {}).length === 0) {
            // This game wasn't played - impute with average risk
            imputedGameRisks[key] = averagePlayedRisk;
        }
    });

    // Predict final risk with imputed values
    const riskScore = await predictRisk(imputedGameRisks, demographics);

    // Generate AI insights
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
        screeningValid: true,
        insights,
        gameRisks: imputedGameRisks,
        aiInsights,
        screeningStatus: screeningValidation,
    };
};


export const generateGeminiInsights = async (gamesData, riskScore, ruleBasedInsights = []) => {
    try {
        const model = getGeminiModel();
        if (!model) {

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


        return ruleBasedInsights.length > 0
            ? ruleBasedInsights.join(' ')
            : "Great progress today! Regular practice helps develop important skills.";
    }
};


export const getModelMetrics = () => {
    if (!modelData) return null;
    return {
        global: modelData.global_metrics,
        perGame: modelData.level_1_models,
    };
};
