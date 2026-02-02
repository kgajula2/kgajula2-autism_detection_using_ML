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


DATASET_PATH = r'DATASETS/asd_children.csv'
OUTPUT_DIR = r'public/models'
OUTPUT_FILE = os.path.join(OUTPUT_DIR, 'model_weights.json')
REPORT_FILE = os.path.join(OUTPUT_DIR, 'model_performance_report.txt')
CM_PLOT_FILE = os.path.join(OUTPUT_DIR, 'confusion_matrix.png')





def load_and_preprocess():
    dfs = []
    
    
    print(f"Loading primary data from {DATASET_PATH}...")
    try:
        df1 = pd.read_csv(DATASET_PATH)
        
        df1.columns = [c.strip() for c in df1.columns]
        dfs.append(df1)
    except Exception as e:
        print(f"Error reading primary CSV: {e}")

    
    COMBINED_PATH = r'DATASETS/Autism_Screening_Data_Combined.csv'
    if os.path.exists(COMBINED_PATH):
        print(f"Loading combined data from {COMBINED_PATH}...")
        try:
            df2 = pd.read_csv(COMBINED_PATH)
            df2.columns = [c.strip() for c in df2.columns]
            
            
            
            rename_map = {}
            for i in range(1, 11):
                rename_map[f'A{i}'] = f'A{i}_Score'
            
            
            if 'Class/ASD' not in df2.columns and 'Class' in df2.columns:
                rename_map['Class'] = 'Class/ASD'
            if 'jaundice' in df2.columns:
                rename_map['jaundice'] = 'jundice' 
            
            df2.rename(columns=rename_map, inplace=True)
            dfs.append(df2)
        except Exception as e:
            print(f"Error reading combined CSV: {e}")

    if not dfs:
        return None, None

    
    print(f"Merging {len(dfs)} datasets...")
    df = pd.concat(dfs, ignore_index=True)
    
    
    df.drop_duplicates(inplace=True)
    print(f"Total Combined Rows: {len(df)}")
    
    
    df['age'] = pd.to_numeric(df['age'], errors='coerce')
    df['age'].fillna(df['age'].mean(), inplace=True)

    for i in range(1, 11):
        col = f'A{i}_Score'
        
        
        if col not in df.columns:
            df[col] = 0
        else:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

    
    mapping = {'m': 1, 'f': 0, 'yes': 1, 'no': 0, 'YES': 1, 'NO': 0, '?': 0, '1': 1, '0': 0, 1: 1, 0: 0}
    def clean_binary(x):
        return mapping.get(str(x).lower().strip(), 0)

    if 'gender' in df.columns: df['gender'] = df['gender'].apply(clean_binary)
    if 'jundice' in df.columns: df['jundice'] = df['jundice'].apply(clean_binary)
    
    
    if 'austim' in df.columns: 
        df['austim'] = df['austim'].apply(clean_binary)
    elif 'Family_ASD' in df.columns:
        df['austim'] = df['Family_ASD'].apply(clean_binary)
    else:
        df['austim'] = 0

    
    target_col = 'Class/ASD'
    if target_col not in df.columns:
        possible = [c for c in df.columns if 'class' in c.lower() or 'asd' in c.lower()]
        target_col = possible[-1] if possible else None
    
    if target_col:
        y = df[target_col].apply(clean_binary)
    else:
        print("Target column not found!")
        return None, None

    
    
    
    
    
    
    
    
    
    
    required_cols = [f'A{i}_Score' for i in range(1, 11)] + ['age', 'gender', 'jundice', 'austim']
    for c in required_cols:
        if c not in df.columns:
            df[c] = 0
            
    X = df[required_cols].copy()
    
    return X, y





def train_level_1_models(X_train, y_train, X_test, y_test): 
    """
    Trains 4 independent models, one for each game's feature subset.
    Returns:
        - models: Dictionary of trained models
        - scalers: Dictionary of fitted scalers
        - level_1_train_preds: DataFrame of probabilities for the training set (to train L2)
        - level_1_test_preds: DataFrame of probabilities for the test set (to evaluate L2)
        - metrics: Dictionary of performance metrics for each game
    """
    
    
    game_features = {
        'color_focus': {
            'features': ['A1_Score', 'A2_Score', 'A8_Score'],
            'model_type': 'rf', 
            'name': 'Color Focus'
        },
        'routine_sequencer': {
            'features': ['A3_Score', 'A4_Score'],
            'model_type': 'lr', 
            'name': 'Routine Sequencer'
        },
        'emotion_mirror': {
            'features': ['A5_Score', 'A6_Score', 'A9_Score'],
            'model_type': 'rf', 
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
    
    
    l1_train_preds = pd.DataFrame(index=X_train.index)
    l1_test_preds = pd.DataFrame(index=X_test.index)

    print("\n--- Training Level 1 (Game) Models ---")

    for game_id, config in game_features.items():
        cols = config['features']
        print(f"Training {config['name']} using {cols}...")
        
        
        X_tr_sub = X_train[cols]
        X_te_sub = X_test[cols]
        
        
        scaler = StandardScaler()
        X_tr_scaled = scaler.fit_transform(X_tr_sub)
        X_te_scaled = scaler.transform(X_te_sub)
        scalers[game_id] = scaler
        
        
        if config['model_type'] == 'rf':
            model = RandomForestClassifier(n_estimators=50, max_depth=5, random_state=42)
        else:
            model = LogisticRegression(random_state=42)
            
        
        model.fit(X_tr_scaled, y_train)
        trained_models[game_id] = model
        
        
        
        conf_train = model.predict_proba(X_tr_scaled)[:, 1]
        conf_test = model.predict_proba(X_te_scaled)[:, 1]
        
        
        l1_train_preds[f'{game_id}_risk'] = conf_train
        l1_test_preds[f'{game_id}_risk'] = conf_test
        
        
        y_pred_sub = model.predict(X_te_scaled)
        metrics[game_id] = {
            'accuracy': round(accuracy_score(y_test, y_pred_sub), 4),
            'precision': round(precision_score(y_test, y_pred_sub, zero_division=0), 4),
            'recall': round(recall_score(y_test, y_pred_sub, zero_division=0), 4)
        }
        print(f"  > Acc: {metrics[game_id]['accuracy']} | Prec: {metrics[game_id]['precision']} | Rec: {metrics[game_id]['recall']}")

    
    
    context_cols = ['age', 'gender', 'jundice', 'austim']
    
    
    l1_train_final = pd.concat([l1_train_preds, X_train[context_cols]], axis=1)
    l1_test_final = pd.concat([l1_test_preds, X_test[context_cols]], axis=1)
    
    return trained_models, scalers, metrics, l1_train_final, l1_test_final





def train_level_2_model(X_train_l2, y_train, X_test_l2, y_test):
    print("\n--- Training Level 2 (Global) Model ---")
    
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train_l2)
    X_test_scaled = scaler.transform(X_test_l2)
    
    
    
    model = LogisticRegression(random_state=42, C=1.0)
    model.fit(X_train_scaled, y_train)
    
    
    y_pred = model.predict(X_test_scaled)
    y_prob = model.predict_proba(X_test_scaled)[:, 1]
    
    
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





def main():
    
    X, y = load_and_preprocess()
    if X is None: return

    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)
    
    
    l1_models, l1_scalers, l1_metrics, X_train_l2, X_test_l2 = train_level_1_models(X_train, y_train, X_test, y_test)
    
    
    l2_model, l2_scaler, l2_metrics, y_pred_final = train_level_2_model(X_train_l2, y_train, X_test_l2, y_test)
    
    
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    
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

    
    cm = confusion_matrix(y_test, y_pred_final)
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                xticklabels=['No Risk', 'Risk'], yticklabels=['No Risk', 'Risk'])
    plt.title('Confusion Matrix - Hierarchical NeuroStep Model')
    plt.ylabel('True Label')
    plt.xlabel('Predicted Label')
    plt.savefig(CM_PLOT_FILE)
    print(f"📊 Confusion Matrix saved to {CM_PLOT_FILE}")

    
    
    
    
    
    
    
    
    
    
    l2_feature_names = list(X_train_l2.columns) 
    
    export_data = {
        "global_metrics": l2_metrics,
        "level_2_model": {
            "coefficients": l2_model.coef_[0].tolist(),
            "intercept": l2_model.intercept_[0],
            "feature_names": l2_feature_names,
            "scaler_mean": l2_scaler.mean_.tolist(),
            "scaler_scale": l2_scaler.scale_.tolist()
        },
        "level_1_models": l1_metrics 
        
        
    }
    
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(export_data, f, indent=2)
    print(f"💾 Model weights and architecture saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
