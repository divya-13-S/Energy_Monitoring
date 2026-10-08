import os
import sys
import time
import json
import math
import csv
import numpy as np

import joblib
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

# Paths
BASE_DIR = r"C:\Energy Monitoring System\Energy_Monitoring"
DATA_PATH = os.path.join(BASE_DIR, "data", "processed_ashrae_education.csv")

ML_DIR = os.path.join(BASE_DIR, "ml")
MODELS_DIR = os.path.join(ML_DIR, "models")
OUTPUTS_DIR = os.path.join(ML_DIR, "outputs")

os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(OUTPUTS_DIR, exist_ok=True)

FEATURE_COLS = [
    "sin_hour",
    "cos_hour",
    "sin_day_of_week",
    "cos_day_of_week",
    "is_weekend",
    "month",
    "day_of_year",
    "square_feet",
    "air_temperature",
    "dew_temperature",
    "wind_speed",
    "lag_1h",
    "lag_24h",
    "rolling_mean_24h",
    "building_target_enc"
]

def print_flush(text=""):
    print(text)
    sys.stdout.flush()

def load_data_and_prepare_features():
    print_flush("==================================================")
    print_flush("1. LOADING DATASET & COMPUTING BUILDING ENCODING")
    print_flush("==================================================")
    print_flush(f"Reading dataset: {DATA_PATH}")
    
    building_log_sums = {}
    building_log_counts = {}
    
    total_rows = 0
    with open(DATA_PATH, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
        
        b_idx = header.index("building_id")
        t_idx = header.index("timestamp")
        log_r_idx = header.index("log_meter_reading")
        
        for r in reader:
            total_rows += 1
            b_id = int(r[b_idx])
            ts = r[t_idx]
            log_r = float(r[log_r_idx])
            
            if ts < "2016-11-01 00:00:00":
                building_log_sums[b_id] = building_log_sums.get(b_id, 0.0) + log_r
                building_log_counts[b_id] = building_log_counts.get(b_id, 0) + 1
                
    global_train_log_mean = sum(building_log_sums.values()) / sum(building_log_counts.values())
    building_target_enc_map = {
        b: building_log_sums[b] / building_log_counts[b] for b in building_log_sums
    }
    
    print_flush(f"Total Rows Loaded: {total_rows:,}")
    print_flush(f"Target Encoding Map Computed for {len(building_target_enc_map)} Education Buildings (Training Global Log Mean = {global_train_log_mean:.4f})")
    
    X_train_list, y_train_log_list, y_train_kwh_list = [], [], []
    X_test_list, y_test_log_list, y_test_kwh_list = [], [], []
    test_meta_list = []
    
    f_indices = [header.index(col) for col in FEATURE_COLS if col != "building_target_enc"]
    b_idx = header.index("building_id")
    t_idx = header.index("timestamp")
    m_idx = header.index("month")
    wk_idx = header.index("is_weekend")
    r_idx = header.index("meter_reading")
    log_r_idx = header.index("log_meter_reading")
    
    with open(DATA_PATH, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        _ = next(reader)
        
        for r in reader:
            b_id = int(r[b_idx])
            ts = r[t_idx]
            month = int(r[m_idx])
            is_wk = int(r[wk_idx])
            kwh = float(r[r_idx])
            log_kwh = float(r[log_r_idx])
            
            row_feats = [float(r[idx]) for idx in f_indices]
            b_enc = building_target_enc_map.get(b_id, global_train_log_mean)
            row_feats.append(b_enc)
            
            if ts < "2016-11-01 00:00:00":
                X_train_list.append(row_feats)
                y_train_log_list.append(log_kwh)
                y_train_kwh_list.append(kwh)
            else:
                X_test_list.append(row_feats)
                y_test_log_list.append(log_kwh)
                y_test_kwh_list.append(kwh)
                test_meta_list.append((b_id, ts, month, is_wk))
                
    X_train = np.array(X_train_list, dtype=np.float64)
    y_train_log = np.array(y_train_log_list, dtype=np.float64)
    
    X_test = np.array(X_test_list, dtype=np.float64)
    y_test_log = np.array(y_test_log_list, dtype=np.float64)
    y_test_kwh = np.array(y_test_kwh_list, dtype=np.float64)
    
    print_flush(f"X_train Shape: {X_train.shape} | y_train Shape: {y_train_log.shape}")
    print_flush(f"X_test Shape:  {X_test.shape}  | y_test Shape:  {y_test_log.shape}")
    
    return X_train, y_train_log, X_test, y_test_log, y_test_kwh, test_meta_list, building_target_enc_map, global_train_log_mean

def train_and_evaluate():
    X_train, y_train_log, X_test, y_test_log, y_test_kwh, test_meta, b_enc_map, g_mean = load_data_and_prepare_features()
    
    print_flush("\n==================================================")
    print_flush("2. FEATURE SCALING (StandardScaler)")
    print_flush("==================================================")
    scaler = StandardScaler()
    scaler.fit(X_train)
    
    X_train_scaled = scaler.transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    scaler_file = os.path.join(MODELS_DIR, "scaler.pkl")
    joblib.dump(scaler, scaler_file)
    print_flush(f"Saved fitted StandardScaler to: {scaler_file}")
    
    enc_file = os.path.join(MODELS_DIR, "building_target_enc_map.pkl")
    joblib.dump({'b_map': b_enc_map, 'global_mean': g_mean}, enc_file)
    print_flush(f"Saved Building Target Encoding map to: {enc_file}")
    
    print_flush("\n==================================================")
    print_flush("3. MODEL TRAINING (Linear Regression)")
    print_flush("==================================================")
    model = LinearRegression(fit_intercept=True)
    
    t_start = time.time()
    model.fit(X_train_scaled, y_train_log)
    t_train = time.time() - t_start
    print_flush(f"Linear Regression model trained in {t_train:.3f} seconds.")
    
    model_file = os.path.join(MODELS_DIR, "linear_regression_model.pkl")
    joblib.dump(model, model_file)
    print_flush(f"Saved trained Linear Regression model to: {model_file}")
    
    print_flush("\n==================================================")
    print_flush("4. MODEL PREDICTION & EVALUATION")
    print_flush("==================================================")
    t_pred_start = time.time()
    y_test_pred_log_raw = model.predict(X_test_scaled)
    t_pred = time.time() - t_pred_start
    
    max_train_log = float(np.max(y_train_log))
    y_test_pred_log = np.clip(y_test_pred_log_raw, 0.0, max_train_log + 1.0)
    
    y_test_pred_kwh = np.maximum(0.0, np.expm1(y_test_pred_log))
    
    mae = float(mean_absolute_error(y_test_kwh, y_test_pred_kwh))
    rmse = float(np.sqrt(mean_squared_error(y_test_kwh, y_test_pred_kwh)))
    r2 = float(r2_score(y_test_kwh, y_test_pred_kwh))
    rmsle = float(np.sqrt(mean_squared_error(y_test_log, y_test_pred_log)))
    
    mean_actual = float(np.mean(y_test_kwh))
    mean_pred = float(np.mean(y_test_pred_kwh))
    min_actual = float(np.min(y_test_kwh))
    max_actual = float(np.max(y_test_kwh))
    min_pred = float(np.min(y_test_pred_kwh))
    max_pred = float(np.max(y_test_pred_kwh))
    
    print_flush(f"Test Evaluation Results:")
    print_flush(f"  - MAE (Mean Absolute Error):      {mae:,.4f} kWh")
    print_flush(f"  - RMSE (Root Mean Squared Error):  {rmse:,.4f} kWh")
    print_flush(f"  - R^2 Score:                       {r2:.6f}")
    print_flush(f"  - RMSLE (Root Mean Log Error):    {rmsle:.6f}")
    print_flush(f"  - Mean Actual kWh:                 {mean_actual:,.2f} kWh")
    print_flush(f"  - Mean Predicted kWh:              {mean_pred:,.2f} kWh")
    print_flush(f"  - Min / Max Actual kWh:            {min_actual:.2f} / {max_actual:,.2f} kWh")
    print_flush(f"  - Min / Max Predicted kWh:         {min_pred:.2f} / {max_pred:,.2f} kWh")
    print_flush(f"  - Test Prediction Time:            {t_pred:.3f} seconds")
    
    print_flush("\n==================================================")
    print_flush("5. MODEL COEFFICIENTS & INTERPRETABILITY")
    print_flush("==================================================")
    coefficients = model.coef_
    intercept = float(model.intercept_)
    
    coef_list = []
    for feat, coef in zip(FEATURE_COLS, coefficients):
        coef_list.append({
            "feature": feat,
            "coefficient": float(coef),
            "abs_coefficient": float(abs(coef))
        })
        
    coef_list.sort(key=lambda x: x["abs_coefficient"], reverse=True)
    
    print_flush(f"Model Intercept (beta_0): {intercept:.6f}")
    print_flush("Sorted Feature Coefficients (by impact magnitude):")
    for item in coef_list:
        direction = "Positive" if item["coefficient"] > 0 else "Negative"
        print_flush(f"  - {item['feature']:<20}: {item['coefficient']:+10.6f} ({direction} influence)")
        
    coef_file = os.path.join(OUTPUTS_DIR, "feature_coefficients.csv")
    with open(coef_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=["feature", "coefficient", "abs_coefficient"])
        writer.writeheader()
        writer.writerows(coef_list)
    print_flush(f"Saved feature coefficients CSV to: {coef_file}")
    
    # Save Metrics JSON
    metrics_data = {
        "model_name": "Linear Regression",
        "dataset": "ASHRAE Great Energy Predictor III (Educational Subset)",
        "target": "log_meter_reading",
        "evaluation_metrics": {
            "MAE_kWh": round(mae, 4),
            "RMSE_kWh": round(rmse, 4),
            "R2_score": round(r2, 6),
            "RMSLE": round(rmsle, 6),
            "mean_actual_kWh": round(mean_actual, 2),
            "mean_predicted_kWh": round(mean_pred, 2),
            "min_actual_kWh": round(min_actual, 2),
            "max_actual_kWh": round(max_actual, 2),
            "min_predicted_kWh": round(min_pred, 2),
            "max_predicted_kWh": round(max_pred, 2)
        },
        "performance": {
            "training_time_seconds": round(t_train, 4),
            "prediction_time_seconds": round(t_pred, 4)
        }
    }
    
    metrics_file = os.path.join(OUTPUTS_DIR, "metrics.json")
    with open(metrics_file, 'w', encoding='utf-8') as f:
        json.dump(metrics_data, f, indent=4)
    print_flush(f"Saved metrics JSON to: {metrics_file}")
    
    # Save Model Metadata JSON
    metadata_data = {
        "model_name": "Linear Regression",
        "dataset": "ASHRAE Great Energy Predictor III",
        "domain": "Educational Institutions",
        "meter": "Electricity (meter=0)",
        "target": "log_meter_reading",
        "training_period": "2016-01-02 to 2016-10-31",
        "testing_period": "2016-11-01 to 2016-12-31",
        "number_of_training_rows": len(y_train_log),
        "number_of_testing_rows": len(y_test_log),
        "number_of_features": len(FEATURE_COLS),
        "features_used": FEATURE_COLS,
        "MAE": round(mae, 4),
        "RMSE": round(rmse, 4),
        "R2": round(r2, 6),
        "RMSLE": round(rmsle, 6),
        "model_training_timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
    }
    
    meta_file = os.path.join(OUTPUTS_DIR, "model_metadata.json")
    with open(meta_file, 'w', encoding='utf-8') as f:
        json.dump(metadata_data, f, indent=4)
    print_flush(f"Saved model metadata JSON to: {meta_file}")
    
    # Save Test Predictions CSV
    pred_file = os.path.join(OUTPUTS_DIR, "predictions.csv")
    with open(pred_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(["building_id", "timestamp", "actual_kWh", "predicted_log", "predicted_kWh", "residual_error"])
        for i in range(min(10000, len(y_test_kwh))):
            b_id, ts, _, _ = test_meta[i]
            act_kwh = y_test_kwh[i]
            p_log = y_test_pred_log[i]
            p_kwh = y_test_pred_kwh[i]
            err = act_kwh - p_kwh
            writer.writerow([b_id, ts, round(act_kwh, 4), round(p_log, 6), round(p_kwh, 4), round(err, 4)])
    print_flush(f"Saved sample test predictions CSV to: {pred_file}")
    
    print_flush("\n==================================================")
    print_flush("6. GENERATING DIAGNOSTIC VISUALIZATIONS")
    print_flush("==================================================")
    try:
        fig, axes = plt.subplots(2, 2, figsize=(14, 10))
        fig.suptitle("Linear Regression Model Evaluation — Educational Institutions Energy System", fontsize=13, fontweight='bold')
        
        np.random.seed(42)
        sample_indices = np.random.choice(len(y_test_kwh), size=min(5000, len(y_test_kwh)), replace=False)
        
        # Subplot 1
        ax1 = axes[0, 0]
        ax1.scatter(y_test_kwh[sample_indices], y_test_pred_kwh[sample_indices], alpha=0.3, color='crimson', s=8)
        max_val = max(np.percentile(y_test_kwh, 99.0), np.percentile(y_test_pred_kwh, 99.0))
        ax1.plot([0, max_val], [0, max_val], 'k--', linewidth=1.5, label="Ideal (y = x)")
        ax1.set_title(f"Actual vs Predicted kWh (Sample, R^2 = {r2:.4f})")
        ax1.set_xlabel("Actual kWh")
        ax1.set_ylabel("Predicted kWh")
        ax1.set_xlim(0, max_val)
        ax1.set_ylim(0, max_val)
        ax1.legend()
        ax1.grid(True, alpha=0.3)
        
        # Subplot 2
        ax2 = axes[0, 1]
        residuals = y_test_kwh - y_test_pred_kwh
        res_sample = residuals[sample_indices]
        ax2.hist(res_sample, bins=40, color='royalblue', edgecolor='black', alpha=0.7)
        ax2.set_title(f"Prediction Error Distribution (MAE = {mae:.2f} kWh)")
        ax2.set_xlabel("Residual Error (Actual - Predicted kWh)")
        ax2.set_ylabel("Frequency")
        ax2.grid(True, alpha=0.3)
        
        # Subplot 3
        ax3 = axes[1, 0]
        feats_sorted = [x["feature"] for x in coef_list]
        coefs_sorted = [x["coefficient"] for x in coef_list]
        colors = ['forestgreen' if c > 0 else 'firebrick' for c in coefs_sorted]
        ax3.barh(feats_sorted[::-1], coefs_sorted[::-1], color=colors[::-1])
        ax3.set_title("Standardized Feature Coefficients")
        ax3.set_xlabel("Coefficient Weight")
        ax3.grid(True, alpha=0.3)
        
        # Subplot 4
        ax4 = axes[1, 1]
        sample_b0_mask = np.array([m[0] == list(set(m[0] for m in test_meta))[0] for m in test_meta])
        b0_actual = y_test_kwh[sample_b0_mask][:168]
        b0_pred = y_test_pred_kwh[sample_b0_mask][:168]
        hours = np.arange(len(b0_actual))
        ax4.plot(hours, b0_actual, label="Actual kWh", color='black', linewidth=1.5)
        ax4.plot(hours, b0_pred, label="Predicted kWh", color='darkorange', linestyle='--', linewidth=1.5)
        ax4.set_title("1-Week Hourly Forecast (Sample Building)")
        ax4.set_xlabel("Hour")
        ax4.set_ylabel("kWh")
        ax4.legend()
        ax4.grid(True, alpha=0.3)
        
        plt.tight_layout(rect=[0, 0, 1, 0.95])
        plot_file = os.path.join(OUTPUTS_DIR, "model_evaluation.png")
        plt.savefig(plot_file, dpi=120)
        plt.close()
        print_flush(f"Saved multi-panel evaluation plot to: {plot_file}")
    except Exception as e:
        print_flush(f"Warning: Plot generation encountered an error: {e}")
        
    print_flush("\n==================================================")
    print_flush("ML TRAINING PIPELINE COMPLETE SUCCESS!")
    print_flush("==================================================")

if __name__ == "__main__":
    train_and_evaluate()
