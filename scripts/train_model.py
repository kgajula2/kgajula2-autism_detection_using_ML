import pandas as pd
import numpy as np
import json
import os
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, precision_score, recall_score, f1_score

# Paths
DATASET_PATH = r'DATASETS/asd_children.csv'
OUTPUT_DIR = r'public/models'
OUTPUT_FILE = os.path.join(OUTPUT_DIR, 'model_weights.json')
REPORT_FILE = os.path.join(OUTPUT_DIR, 'model_performance_report.txt')
CM_PLOT_FILE = os.path.join(OUTPUT_DIR, 'confusion_matrix.png')

# -------------------------------------------------------------------------
# PHASE 1: DATA PIPELINE
# -------------------------------------------------------------------------

def load_and_preprocess():
    dfs = []
    
    # 1. Load Primary Dataset (Children)
    print(f"Loading primary data from {DATASET_PATH}...")
    try:
        df1 = pd.read_csv(DATASET_PATH)
        # Standardize df1 columns
        df1.columns = [c.strip() for c in df1.columns]
        dfs.append(df1)
    except Exception as e:
        print(f"Error reading primary CSV: {e}")

    # 2. Load Combined Dataset (if exists)
    COMBINED_PATH = r'DATASETS/Autism_Screening_Data_Combined.csv'
    if os.path.exists(COMBINED_PATH):
        print(f"Loading combined data from {COMBINED_PATH}...")
        try:
            df2 = pd.read_csv(COMBINED_PATH)
            df2.columns = [c.strip() for c in df2.columns]
            
            # Map simplified names (A1 -> A1_Score) if needed, or normalize target
            # Checking header from inspection: A1, A2... -> We want A1_Score
            rename_map = {}
            for i in range(1, 11):
                rename_map[f'A{i}'] = f'A{i}_Score'
            
            # Common variations
            if 'Class/ASD' not in df2.columns and 'Class' in df2.columns:
                rename_map['Class'] = 'Class/ASD'
            if 'jaundice' in df2.columns:
                rename_map['jaundice'] = 'jundice' # match our weird target spelling if needed or fix both later
            
            df2.rename(columns=rename_map, inplace=True)
            dfs.append(df2)
        except Exception as e:
            print(f"Error reading combined CSV: {e}")

    if not dfs:
        return None, None

    # Merge
    print(f"Merging {len(dfs)} datasets...")
    df = pd.concat(dfs, ignore_index=True)
    
    # Drop duplicates just in case
    df.drop_duplicates(inplace=True)
    print(f"Total Combined Rows: {len(df)}")
    
    # Clean Data
    df['age'] = pd.to_numeric(df['age'], errors='coerce')
    df['age'].fillna(df['age'].mean(), inplace=True)

    for i in range(1, 11):
        col = f'A{i}_Score'
        # If column missing (e.g. from one dataset), fill 0 or drop? 
        # Better to fill 0 for robust training if mostly present.
        if col not in df.columns:
            df[col] = 0
        else:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

    # Binary Mapping
    mapping = {'m': 1, 'f': 0, 'yes': 1, 'no': 0, 'YES': 1, 'NO': 0, '?': 0, '1': 1, '0': 0, 1: 1, 0: 0}
    def clean_binary(x):
        return mapping.get(str(x).lower().strip(), 0)

    if 'gender' in df.columns: df['gender'] = df['gender'].apply(clean_binary)
    if 'jundice' in df.columns: df['jundice'] = df['jundice'].apply(clean_binary)
    
    # Family History can be 'austim' or 'Family_ASD'
    if 'austim' in df.columns: 
        df['austim'] = df['austim'].apply(clean_binary)
    elif 'Family_ASD' in df.columns:
        df['austim'] = df['Family_ASD'].apply(clean_binary)
    else:
        df['austim'] = 0

    # Target Mapping
    target_col = 'Class/ASD'
    if target_col not in df.columns:
        possible = [c for c in df.columns if 'class' in c.lower() or 'asd' in c.lower()]
        target_col = possible[-1] if possible else None
    
    if target_col:
        y = df[target_col].apply(clean_binary)
    else:
        print("Target column not found!")
        return None, None

    # ---------------------------------------------------------------------
    # FEATURE MAPPING (Simulating Multi-Game Data from Static Dataset)
    # ---------------------------------------------------------------------
    # Game 1: Color Focus (Attention/Impulsivity) -> A1, A2, A8
    # Game 2: Routine Sequencer (Sequencing/Patterns) -> A3, A4
    # Game 3: Emotion Mirror (Social/Facial) -> A5, A6, A9
    # Game 4: Object Hunt (Visual/Detail) -> A7, A10
    # Context Features (Global) -> Age, Gender, Jaundice, Family_History
    
    # Ensure all required columns exist
    required_cols = [f'A{i}_Score' for i in range(1, 11)] + ['age', 'gender', 'jundice', 'austim']
    for c in required_cols:
        if c not in df.columns:
            df[c] = 0
            
    X = df[required_cols].copy()
    
    return X, y

# -------------------------------------------------------------------------
# PHASE 2: LEVEL-1 MODELS (GAME SPECIFIC)
# -------------------------------------------------------------------------

def train_level_1_models(X_train, y_train, X_test, y_test): # Added y_test argument
    """
    Trains 4 independent models, one for each game's feature subset.
    Returns:
        - models: Dictionary of trained models
        - scalers: Dictionary of fitted scalers
        - level_1_train_preds: DataFrame of probabilities for the training set (to train L2)
        - level_1_test_preds: DataFrame of probabilities for the test set (to evaluate L2)
        - metrics: Dictionary of performance metrics for each game
    """
    
    # Definition of Inputs for each Game
    game_features = {
        'color_focus': {
            'features': ['A1_Score', 'A2_Score', 'A8_Score'],
            'model_type': 'rf', # Random Forest for complex interactions in attention
            'name': 'Color Focus'
        },
        'routine_sequencer': {
            'features': ['A3_Score', 'A4_Score'],
            'model_type': 'lr', # Logistic Regression for simpler linear dependency
            'name': 'Routine Sequencer'
        },
        'emotion_mirror': {
            'features': ['A5_Score', 'A6_Score', 'A9_Score'],
            'model_type': 'rf', # Random Forest for social nuance
            'name': 'Emotion Mirror'
        },
        'object_hunt': {
            'features': ['A7_Score', 'A10_Score'],
            'model_type': 'lr',
            'name': 'Object Hunt'
        }
    }

    trained_models = {}
    scalers = {}
    metrics = {}
    
    # Containers for Level 2 Input
    l1_train_preds = pd.DataFrame(index=X_train.index)
    l1_test_preds = pd.DataFrame(index=X_test.index)

    print("\n--- Training Level 1 (Game) Models ---")

    for game_id, config in game_features.items():
        cols = config['features']
        print(f"Training {config['name']} using {cols}...")
        
        # Sub-select data
        X_tr_sub = X_train[cols]
        X_te_sub = X_test[cols]
        
        # Scale
        scaler = StandardScaler()
        X_tr_scaled = scaler.fit_transform(X_tr_sub)
        X_te_scaled = scaler.transform(X_te_sub)
        scalers[game_id] = scaler
        
        # Initialize Model
        if config['model_type'] == 'rf':
            model = RandomForestClassifier(n_estimators=50, max_depth=5, random_state=42)
        else:
            model = LogisticRegression(random_state=42)
            
        # Train
        model.fit(X_tr_scaled, y_train)
        trained_models[game_id] = model
        
        # Predict Probabilities (Risk Scores for that game)
        # Class 1 is 'Risk', so we take prob of class 1
        conf_train = model.predict_proba(X_tr_scaled)[:, 1]
        conf_test = model.predict_proba(X_te_scaled)[:, 1]
        
        # Store for Level 2
        l1_train_preds[f'{game_id}_risk'] = conf_train
        l1_test_preds[f'{game_id}_risk'] = conf_test
        
        # Calculate isolated metrics (Just for reporting)
        y_pred_sub = model.predict(X_te_scaled)
        metrics[game_id] = {
            'accuracy': round(accuracy_score(y_test, y_pred_sub), 4),
            'precision': round(precision_score(y_test, y_pred_sub, zero_division=0), 4),
            'recall': round(recall_score(y_test, y_pred_sub, zero_division=0), 4)
        }
        print(f"  > Acc: {metrics[game_id]['accuracy']} | Prec: {metrics[game_id]['precision']} | Rec: {metrics[game_id]['recall']}")

    # Add Context Features to Level 2 Input (Age, Gender, etc.)
    # Level 2 sees: [Game1_Risk, Game2_Risk, Game3_Risk, Game4_Risk] + [Age, Gender...]
    context_cols = ['age', 'gender', 'jundice', 'austim']
    
    # We concatenate risk scores with original context data
    l1_train_final = pd.concat([l1_train_preds, X_train[context_cols]], axis=1)
    l1_test_final = pd.concat([l1_test_preds, X_test[context_cols]], axis=1)
    
    return trained_models, scalers, metrics, l1_train_final, l1_test_final

# -------------------------------------------------------------------------
# PHASE 3: LEVEL-2 MODEL (GLOBAL AGGREGATOR)
# -------------------------------------------------------------------------

def train_level_2_model(X_train_l2, y_train, X_test_l2, y_test):
    print("\n--- Training Level 2 (Global) Model ---")
    
    # Scale Level 2 Inputs
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train_l2)
    X_test_scaled = scaler.transform(X_test_l2)
    
    # Interpretable Model: Logistic Regression
    # We want to know coefficients: Which game contributes most to risk?
    model = LogisticRegression(random_state=42, C=1.0)
    model.fit(X_train_scaled, y_train)
    
    # Predictions
    y_pred = model.predict(X_test_scaled)
    y_prob = model.predict_proba(X_test_scaled)[:, 1]
    
    # Metrics
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred)
    rec = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    
    print(f"Global Accuracy: {acc:.4f}")
    print(f"Global F1 Score: {f1:.4f}")
    
    metrics = {
        'accuracy': round(acc, 4),
        'precision': round(prec, 4),
        'recall': round(rec, 4),
        'f1_score': round(f1, 4)
    }
    
    return model, scaler, metrics, y_pred

# -------------------------------------------------------------------------
# MAIN EXECUTION FLOW
# -------------------------------------------------------------------------

def main():
    # 1. Load Data
    X, y = load_and_preprocess()
    if X is None: return

    # 2. Split Data (Stratified)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)
    
    # 3. Train Level 1
    l1_models, l1_scalers, l1_metrics, X_train_l2, X_test_l2 = train_level_1_models(X_train, y_train, X_test, y_test)
    
    # 4. Train Level 2
    l2_model, l2_scaler, l2_metrics, y_pred_final = train_level_2_model(X_train_l2, y_train, X_test_l2, y_test)
    
    # 5. Export Artifacts
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # --- Classification Report ---
    report = classification_report(y_test, y_pred_final, target_names=['No Risk', 'Risk Identified'])
    with open(REPORT_FILE, 'w') as f:
        f.write("NeuroStep Hierarchical Model System Report\n")
        f.write("==========================================\n\n")
        f.write("System Architecture:\n")
        f.write("1. Level-1: Independent Game Models (RF/LR) -> Behavioral Feature Subsets\n")
        f.write("2. Level-2: Global Aggregator (LR) -> Game Risks + Demographics\n\n")
        
        f.write("GLOBAL PERFORMANCE (Level 2):\n")
        f.write(report)
        f.write("\n\n------------------------------------------------\n")
        f.write("LEVEL 1 COMPONENT PERFORMANCE:\n")
        for game, m in l1_metrics.items():
            f.write(f"{game.upper()}: Acc={m['accuracy']}, Prec={m['precision']}, Rec={m['recall']}\n")

    print(f"📄 Report saved to {REPORT_FILE}")

    # --- Confusion Matrix ---
    cm = confusion_matrix(y_test, y_pred_final)
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                xticklabels=['No Risk', 'Risk'], yticklabels=['No Risk', 'Risk'])
    plt.title('Confusion Matrix - Hierarchical NeuroStep Model')
    plt.ylabel('True Label')
    plt.xlabel('Predicted Label')
    plt.savefig(CM_PLOT_FILE)
    print(f"📊 Confusion Matrix saved to {CM_PLOT_FILE}")

    # --- JSON Export for Frontend ---
    # Structure:
    # {
    #   level_2_global: { metrics, weights (coefs), bias },
    #   level_1_games: { 
    #       game_id: { type, metrics, scaler_mean, scaler_scale }
    #   }
    # }
    
    # Feature names for Level 2 (Interpretation)
    l2_feature_names = list(X_train_l2.columns) # [color_focus_risk, routine..., age, gender...]
    
    export_data = {
        "global_metrics": l2_metrics,
        "level_2_model": {
            "coefficients": l2_model.coef_[0].tolist(),
            "intercept": l2_model.intercept_[0],
            "feature_names": l2_feature_names,
            "scaler_mean": l2_scaler.mean_.tolist(),
            "scaler_scale": l2_scaler.scale_.tolist()
        },
        "level_1_models": l1_metrics # Frontend mostly needs metrics to show robustness? 
        # Actually frontend visualization needs to know input mappings if we want to be fancy, 
        # but for now let's just send metrics and maybe 'feature importance' of level 2 is enough.
    }
    
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(export_data, f, indent=2)
    print(f"💾 Model weights and architecture saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
