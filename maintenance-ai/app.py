# Enhanced Flask backend with detailed risk proof
from flask import Flask, request, jsonify
import pickle
import pandas as pd
import numpy as np
from flask_cors import CORS
import os
import warnings
warnings.filterwarnings('ignore')

app = Flask(__name__)
CORS(app, resources={
    r"/predict": {"origins": "http://localhost:3001"},
    r"/simulate": {"origins": "http://localhost:3001"}
})

base_path = 'E:\\EVConnectProject\\EVConnectProject\\evconnect\\maintenance-ai\\'
model_file = os.path.join(base_path, 'ev_ai4i_model_clean.pkl')
if not os.path.exists(model_file):
    raise FileNotFoundError(f"Model file {model_file} not found.")

# Load model components
print(f"Loading clean model from {model_file}...")
with open(model_file, 'rb') as f:
    package = pickle.load(f)

model = package['model']
scaler = package['scaler']
final_features = package['features']
accuracy = package.get('accuracy', 'Unknown')

# Handle feature importance
try:
    if hasattr(model, 'feature_importances_'):
        feature_importance = final_features
        feature_weights = model.feature_importances_.tolist()
    else:
        feature_importance = final_features
        feature_weights = [1.0] * len(final_features)
except:
    feature_importance = final_features[:10]
    feature_weights = [0.1] * 10

print(f"✅ Model loaded successfully!")
print(f"   Accuracy: {accuracy}")
print(f"   Features: {len(final_features)}")

def create_ai4i_style_features(df):
    """Create domain-specific features"""
    df_eng = df.copy()

    # Temperature difference
    if 'Battery_Temperature' in df_eng.columns and 'Ambient_Temperature' in df_eng.columns:
        df_eng['Temperature_Difference'] = df_eng['Battery_Temperature'] - df_eng['Ambient_Temperature']

    # Mechanical power
    if 'Motor_Torque' in df_eng.columns and 'Motor_RPM' in df_eng.columns:
        df_eng['Mechanical_Power_W'] = np.round(
            df_eng['Motor_Torque'] * df_eng['Motor_RPM'] * 2 * np.pi / 60, 4
        )

    # Battery power
    if 'Battery_Voltage' in df_eng.columns and 'Battery_Current' in df_eng.columns:
        df_eng['Battery_Power_W'] = df_eng['Battery_Voltage'] * df_eng['Battery_Current']

    # Efficiency ratio
    if 'Mechanical_Power_W' in df_eng.columns and 'Power_Consumption' in df_eng.columns:
        df_eng['Power_Efficiency'] = df_eng['Mechanical_Power_W'] / df_eng['Power_Consumption'].clip(0.1, None)

    # Degradation rate
    if 'SoH' in df_eng.columns and 'Charge_Cycles' in df_eng.columns:
        df_eng['Degradation_Rate'] = (100 - df_eng['SoH']) / df_eng['Charge_Cycles'].clip(1, None)
    elif 'Battery_Voltage' in df_eng.columns and 'Charge_Cycles' in df_eng.columns:
        voltage_normalized = df_eng['Battery_Voltage'] / 4.2
        df_eng['Degradation_Rate'] = (1 - voltage_normalized) / df_eng['Charge_Cycles'].clip(1, None)

    # Add missing features with default values
    for feature in final_features:
        if feature not in df_eng.columns:
            df_eng[feature] = 0.0

    return df_eng

def analyze_sensor_risk(sensor_name, value):
    """Analyze individual sensor risk contribution"""
    # Define risk thresholds for EV sensors
    risk_thresholds = {
        'Battery_Voltage': {'critical': 3.4, 'warning': 3.6, 'optimal': [3.7, 4.1]},
        'Battery_Temperature': {'critical': 45, 'warning': 35, 'optimal': [20, 30]},
        'Motor_Temperature': {'critical': 80, 'warning': 60, 'optimal': [20, 50]},
        'Motor_Vibration': {'critical': 5, 'warning': 2, 'optimal': [0, 1.5]},
        'Charge_Cycles': {'critical': 1500, 'warning': 1000, 'optimal': [0, 800]},
        'Brake_Pad_Wear': {'critical': 15, 'warning': 10, 'optimal': [0, 5]},
        'SoH': {'critical': 60, 'warning': 75, 'optimal': [85, 100]},
        'SoC': {'critical': 20, 'warning': 30, 'optimal': [40, 90]}
    }
    
    if sensor_name not in risk_thresholds:
        return 'unknown', 'No risk data available'
    
    thresholds = risk_thresholds[sensor_name]
    
    # Check if sensor has optimal range
    if 'optimal' in thresholds:
        optimal_range = thresholds['optimal']
        if optimal_range[0] <= value <= optimal_range[1]:
            return 'good', f'Within optimal range ({optimal_range[0]}-{optimal_range[1]})'
    
    # Check critical and warning levels
    if 'critical' in thresholds:
        if (sensor_name in ['SoH'] and value <= thresholds['critical']) or \
           (sensor_name not in ['SoH'] and value >= thresholds['critical']):
            return 'critical', f'Critical level reached (threshold: {thresholds["critical"]})'
    
    if 'warning' in thresholds:
        if (sensor_name in ['SoH'] and value <= thresholds['warning']) or \
           (sensor_name not in ['SoH'] and value >= thresholds['warning']):
            return 'warning', f'Warning level (threshold: {thresholds["warning"]})'
    
    return 'good', 'Normal operation'

def get_risk_explanation(failure_prob, risk_level, top_factors):
    """Generate detailed risk explanation"""
    explanations = {
        'HIGH': {
            'summary': 'Multiple critical factors detected requiring immediate attention',
            'action': 'Schedule emergency maintenance within 24 hours',
            'timeframe': 'Immediate action required'
        },
        'MEDIUM': {
            'summary': 'Several warning indicators suggest developing issues',
            'action': 'Plan preventive maintenance within 1-2 weeks',
            'timeframe': 'Monitor closely, schedule maintenance soon'
        },
        'LOW': {
            'summary': 'All systems operating within normal parameters',
            'action': 'Continue regular monitoring and scheduled maintenance',
            'timeframe': 'Follow standard maintenance schedule'
        }
    }
    
    explanation = explanations.get(risk_level, explanations['LOW'])
    
    # Add specific factor warnings
    critical_factors = [f for f in top_factors if f.get('risk_level') == 'critical']
    warning_factors = [f for f in top_factors if f.get('risk_level') == 'warning']
    
    specific_issues = []
    if critical_factors:
        specific_issues.append(f"{len(critical_factors)} critical sensors need immediate attention")
    if warning_factors:
        specific_issues.append(f"{len(warning_factors)} sensors showing warning signs")
    
    return {
        **explanation,
        'specific_issues': specific_issues,
        'failure_probability': f"{failure_prob:.1%}",
        'confidence_level': 'High' if failure_prob > 0.8 or failure_prob < 0.2 else 'Medium'
    }

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        
        # Map sensors to input data
        input_data = {
            'Battery_Voltage': float(data.get('Battery_Voltage', 3.7)),
            'Battery_Current': float(data.get('Battery_Current', 1.0)),
            'Battery_Temperature': float(data.get('Battery_Temperature', 25.0)),
            'Charge_Cycles': float(data.get('Charge_Cycles', 100)),
            'Motor_Temperature': float(data.get('Motor_Temperature', 25.0)),
            'Motor_Vibration': float(data.get('Motor_Vibration', 1.0)),
            'Motor_Torque': float(data.get('Motor_Torque', 100.0)),
            'Motor_RPM': float(data.get('Motor_RPM', 1000)),
            'Power_Consumption': float(data.get('Power_Consumption', 10.0)),
            'Brake_Pad_Wear': float(data.get('Brake_Pad_Wear', 1.0)),
            'Brake_Pressure': float(data.get('Brake_Pressure', 50.0)),
            'Regenerative_Braking_Efficiency': float(data.get('Regenerative_Braking_Efficiency', 0.8)),
            'Tire_Pressure': float(data.get('Tire_Pressure', 32.0)),
            'Tire_Temperature': float(data.get('Tire_Temperature', 25.0)),
            'Suspension_Load': float(data.get('Suspension_Load', 500.0)),
            'Ambient_Temperature': float(data.get('Ambient_Temperature', 20.0)),
            'Ambient_Humidity': float(data.get('Ambient_Humidity', 50.0)),
            'Load_Weight': float(data.get('Load_Weight', 400.0)),
            'Driving_Speed': float(data.get('Driving_Speed', 50.0)),
            'Distance_Traveled': float(data.get('Distance_Traveled', 10000.0)),
            'Idle_Time': float(data.get('Idle_Time', 5.0)),
            'Route_Roughness': float(data.get('Route_Roughness', 3.0)),
            'SoC': float(data.get('SoC', 80.0)),
            'SoH': float(data.get('SoH', 90.0))
        }
        
        # Convert to DataFrame and apply feature engineering
        input_df = pd.DataFrame([input_data])
        input_engineered = create_ai4i_style_features(input_df)

        # Ensure all features are present
        for feature in final_features:
            if feature not in input_engineered.columns:
                input_engineered[feature] = 0.0

        # Select features in correct order
        input_features = input_engineered[final_features]
        
        # Scale features
        input_scaled = scaler.transform(input_features)

        # Make prediction
        prediction = model.predict(input_scaled)[0]
        probability = model.predict_proba(input_scaled)[0]
        
        failure_prob = float(probability[1]) if len(probability) > 1 else float(probability[0])
        confidence = float(max(probability))

        # Determine risk level and maintenance type
        if failure_prob > 0.7:
            risk_level = 'HIGH'
            maintenance_type = 3
        elif failure_prob > 0.3:
            risk_level = 'MEDIUM'
            maintenance_type = 1
        else:
            risk_level = 'LOW'
            maintenance_type = 0

        # Calculate RUL
        rul = max(10, 200 * (1 - failure_prob))

        # ENHANCED Contributing factors with risk analysis
        contributing_factors = []
        for i, (feature, weight) in enumerate(zip(feature_importance[:15], feature_weights[:15])):
            # Get actual input value
            feature_clean = feature.replace('_', ' ').replace('Temperature Difference', 'Battery Temperature')
            
            # Map feature to original input
            value = 0
            for input_key, input_val in input_data.items():
                if input_key.replace('_', ' ').lower() == feature_clean.lower() or \
                   input_key == feature:
                    value = input_val
                    break
            
            # If feature not found in input, try engineered features
            if value == 0 and feature in input_engineered.columns:
                value = input_engineered[feature].iloc[0]
            
            # Analyze sensor risk
            risk_status, risk_explanation = analyze_sensor_risk(feature, value)
            
            # Calculate risk contribution
            risk_contribution = weight * (failure_prob if risk_status != 'good' else 0.1)
            
            contributing_factors.append({
                'name': feature.replace('_', ' ').title(),
                'value': float(value),
                'importance': float(weight),
                'impact': f'{"High" if weight > 0.05 else "Medium" if weight > 0.03 else "Low"} Impact ({weight*100:.1f}%)',
                'risk_level': risk_status,
                'risk_explanation': risk_explanation,
                'risk_contribution': float(risk_contribution),
                'status': risk_status
            })

        # Sort by importance
        contributing_factors = sorted(contributing_factors, key=lambda x: x['importance'], reverse=True)
        
        # Get detailed risk explanation
        risk_explanation = get_risk_explanation(failure_prob, risk_level, contributing_factors)

        response = {
            'success': True,
            'rul': float(rul),
            'failure_prob': float(failure_prob),
            'maintenance_type': int(maintenance_type),
            'risk_level': risk_level,
            'failure_prediction': 'Failure Risk' if prediction == 1 else 'No Risk',
            'confidence': confidence,
            'prediction_value': int(prediction),
            'contributing_factors': contributing_factors[:15],  # Top 15
            'risk_explanation': risk_explanation,
            'model_accuracy': accuracy,
            'sensor_input_summary': {
                'total_sensors': len(input_data),
                'critical_sensors': len([f for f in contributing_factors if f['risk_level'] == 'critical']),
                'warning_sensors': len([f for f in contributing_factors if f['risk_level'] == 'warning']),
                'normal_sensors': len([f for f in contributing_factors if f['risk_level'] == 'good'])
            }
        }
        
        return jsonify(response)
        
    except Exception as e:
        print(f"API Error: {e}")
        import traceback
        traceback.print_exc()
        
        return jsonify({
            'success': False,
            'error': str(e),
            'rul': 100.0,
            'failure_prob': 0.1,
            'maintenance_type': 0,
            'risk_level': 'LOW',
            'failure_prediction': 'Error in prediction',
            'confidence': 0.0,
            'contributing_factors': []
        }), 500

# Keep your existing simulate, health, and features endpoints unchanged...
@app.route('/simulate', methods=['POST'])
def simulate():
    try:
        data = request.json
        voltage = float(data.get('Battery_Voltage', 3.7))
        current = float(data.get('Battery_Current', 1.0))
        temp = float(data.get('Battery_Temperature', 25.0))
        cycles = int(data.get('Charge_Cycles', 100))
        
        cycles = max(10, min(cycles, 1000))
        t = np.linspace(0, cycles, cycles)
        
        # Voltage degradation
        voltage_decay = 0.001 * current * temp / 25
        voltage_profile = voltage * np.exp(-voltage_decay * t / 100)
        
        # SOH degradation
        soh_initial = 100.0
        soh_decay_rate = 0.1 + (temp - 25) * 0.01 + current * 0.05
        soh_trend = soh_initial * np.exp(-soh_decay_rate * t / 1000)
        
        return jsonify({
            'success': True,
            'voltage_profile': voltage_profile.tolist(),
            'soh_trend': soh_trend.tolist(),
            'cycles': cycles,
            'initial_voltage': float(voltage),
            'final_voltage': float(voltage_profile[-1]),
            'initial_soh': float(soh_initial),
            'final_soh': float(soh_trend[-1])
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'voltage_profile': [3.7],
            'soh_trend': [100.0]
        }), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'features_count': len(final_features),
        'model_accuracy': accuracy
    })

@app.route('/features', methods=['GET'])
def get_features():
    return jsonify({
        'required_features': final_features,
        'feature_count': len(final_features),
        'feature_importance': [
            {'feature': feat, 'importance': weight} 
            for feat, weight in zip(feature_importance[:15], feature_weights[:15])
        ]
    })

if __name__ == '__main__':
    print("🚗 EV Predictive Maintenance API with Risk Proof")
    print(f"📊 Model Features: {len(final_features)}")
    print(f"📈 Model Accuracy: {accuracy}")
    print("🚀 Starting server on http://localhost:5001")
    app.run(debug=True, port=5001)