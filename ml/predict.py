import os
import math
import numpy as np
import joblib

ML_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(ML_DIR, "models")

MODEL_PATH = os.path.join(MODELS_DIR, "linear_regression_model.pkl")
SCALER_PATH = os.path.join(MODELS_DIR, "scaler.pkl")
ENC_PATH = os.path.join(MODELS_DIR, "building_target_enc_map.pkl")

# EXPLICIT FEATURE ORDER REQUIRED FOR PREDICTION
FEATURE_ORDER = [
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

class EnergyPredictor:
    """
    Production-ready Linear Regression predictor for Educational Building Energy Consumption.
    Includes log-bounding logic [0, max_train_log + 0.5] before exponential conversion to prevent unphysical spikes.
    """
    def __init__(self):
        if not os.path.exists(MODEL_PATH) or not os.path.exists(SCALER_PATH):
            raise FileNotFoundError("Trained model or scaler artifact missing.")
            
        self.model = joblib.load(MODEL_PATH)
        self.scaler = joblib.load(SCALER_PATH)
        
        enc_data = joblib.load(ENC_PATH)
        self.b_enc_map = enc_data['b_map']
        self.global_log_mean = enc_data['global_mean']
        
        # Max training log value from training set (ln(1 + 79,769.0) = 11.286903)
        self.max_train_log = float(enc_data.get('max_train_log', 11.286903))
        self.upper_log_bound = float(self.max_train_log + 0.5)

    def get_building_target_encoding(self, building_id):
        return self.b_enc_map.get(int(building_id), self.global_log_mean)

    def _bound_and_convert(self, pred_log_raw):
        """
        Applies lower bound (0.0) and upper bound (max_train_log + 0.5) to predicted log value
        BEFORE converting back to kWh via exp(pred_log) - 1.
        """
        # 1. Lower bound of 0
        pred_log = max(0.0, float(pred_log_raw))
        
        # 2. Upper bound of max_train_log + 0.5
        pred_log = min(pred_log, self.upper_log_bound)
        
        # 3. Convert to kWh: exp(pred_log) - 1
        pred_kwh = max(0.0, math.exp(pred_log) - 1.0)
        
        return pred_log, pred_kwh

    def predict_single(self, input_features):
        """
        Accepts dict or list of input features.
        Returns: (predicted_log_consumption, predicted_kWh)
        """
        if isinstance(input_features, dict):
            if "building_target_enc" not in input_features and "building_id" in input_features:
                input_features["building_target_enc"] = self.get_building_target_encoding(input_features["building_id"])
                
            feat_vector = [float(input_features[col]) for col in FEATURE_ORDER]
        else:
            feat_vector = [float(v) for v in input_features]
            
        X = np.array([feat_vector], dtype=np.float64)
        X_scaled = self.scaler.transform(X)
        
        pred_log_raw = self.model.predict(X_scaled)[0]
        return self._bound_and_convert(pred_log_raw)

    def predict_batch(self, feature_rows):
        """
        Accepts list of dicts or list of feature vectors.
        Returns array of (predicted_log, predicted_kWh).
        """
        X_list = []
        for row in feature_rows:
            if isinstance(row, dict):
                if "building_target_enc" not in row and "building_id" in row:
                    row["building_target_enc"] = self.get_building_target_encoding(row["building_id"])
                vec = [float(row[col]) for col in FEATURE_ORDER]
            else:
                vec = [float(v) for v in row]
            X_list.append(vec)
            
        X = np.array(X_list, dtype=np.float64)
        X_scaled = self.scaler.transform(X)
        
        preds_log_raw = self.model.predict(X_scaled)
        results = []
        for p_raw in preds_log_raw:
            p_log, p_kwh = self._bound_and_convert(p_raw)
            results.append((p_log, p_kwh))
            
        return results

_predictor_instance = None

def get_predictor():
    global _predictor_instance
    if _predictor_instance is None:
        _predictor_instance = EnergyPredictor()
    return _predictor_instance

def predict_energy_consumption(input_data):
    """
    Convenience entrypoint for external callers / backend endpoints.
    """
    predictor = get_predictor()
    if isinstance(input_data, list) and len(input_data) > 0 and isinstance(input_data[0], (dict, list)):
        return predictor.predict_batch(input_data)
    else:
        return predictor.predict_single(input_data)

if __name__ == "__main__":
    predictor = get_predictor()
    print("==================================================")
    print("PREDICTION LOG-BOUNDING VERIFICATION & TEST")
    print("==================================================")
    print(f"Max Train Log:      {predictor.max_train_log:.6f}")
    print(f"Upper Log Bound:    {predictor.upper_log_bound:.6f}")
    print(f"Max Bounded kWh:    {math.exp(predictor.upper_log_bound) - 1.0:,.2f} kWh")
    print("==================================================")
