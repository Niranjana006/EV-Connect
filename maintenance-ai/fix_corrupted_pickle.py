# Extract Clean Model from Corrupted Pickle File
# Run this script to fix your corrupted pickle

import pickle
import pandas as pd
import numpy as np
import os

# Your corrupted pickle file path
corrupted_file = 'E:\\EVConnectProject\\EVConnectProject\\evconnect\\maintenance-ai\\ev_ai4i_model.pkl'
clean_file = 'E:\\EVConnectProject\\EVConnectProject\\evconnect\\maintenance-ai\\ev_ai4i_model_clean.pkl'

print("🔧 Extracting clean model from corrupted pickle...")

# Method 1: Try to load with custom unpickler
try:
    class SafeUnpickler(pickle.Unpickler):
        def find_class(self, module, name):
            # Skip problematic functions
            if name in ['predict_ev_failure', 'create_ai4i_style_features']:
                return lambda x: None
            try:
                return super().find_class(module, name)
            except AttributeError:
                # Return dummy function for missing attributes
                return lambda x: None

    with open(corrupted_file, 'rb') as f:
        package = SafeUnpickler(f).load()
    
    print("✅ Successfully loaded with SafeUnpickler")
    
except Exception as e1:
    print(f"Method 1 failed: {e1}")
    
    # Method 2: Try with joblib
    try:
        import joblib
        package = joblib.load(corrupted_file)
        print("✅ Successfully loaded with joblib")
        
    except Exception as e2:
        print(f"Method 2 failed: {e2}")
        
        # Method 3: Partial loading approach
        try:
            import pickle
            
            # Try to load by manually handling the problematic parts
            with open(corrupted_file, 'rb') as f:
                # Load the raw pickle data
                data = f.read()
                
            # Replace problematic function references
            data_fixed = data.replace(b'predict_ev_failure', b'dummy_function')
            
            # Try to unpickle the fixed data
            package = pickle.loads(data_fixed)
            print("✅ Successfully loaded with data replacement")
            
        except Exception as e3:
            print(f"All methods failed: {e3}")
            print("❌ Cannot extract model. You need to retrain.")
            exit(1)

# Extract essential components
print("📦 Extracting essential components...")

try:
    model = package['model']
    print(f"✅ Model: {type(model)}")
except:
    print("❌ No model found")
    exit(1)

try:
    scaler = package['scaler']
    print(f"✅ Scaler: {type(scaler)}")
except:
    print("❌ No scaler found")
    exit(1)

try:
    features = package['features']
    print(f"✅ Features: {len(features)} features")
except:
    print("⚠️ No features found, using model feature names")
    if hasattr(model, 'feature_names_in_'):
        features = model.feature_names_in_.tolist()
    else:
        features = [f'feature_{i}' for i in range(model.n_features_)]

try:
    accuracy = package.get('accuracy', 'Unknown')
    print(f"✅ Accuracy: {accuracy}")
except:
    accuracy = 'Unknown'

# Create clean package (NO FUNCTIONS!)
clean_package = {
    'model': model,
    'scaler': scaler,
    'features': features,
    'accuracy': accuracy,
    'model_type': str(type(model)),
    'feature_count': len(features)
}

# Save clean version
print("💾 Saving clean model...")
with open(clean_file, 'wb') as f:
    pickle.dump(clean_package, f)

print(f"✅ Clean model saved to: {clean_file}")
print(f"📊 Components saved:")
print(f"   - Model: {type(model)}")
print(f"   - Scaler: {type(scaler)}")
print(f"   - Features: {len(features)}")
print(f"   - Accuracy: {accuracy}")

# Test loading the clean model
print("🧪 Testing clean model...")
try:
    with open(clean_file, 'rb') as f:
        test_package = pickle.load(f)
    
    test_model = test_package['model']
    test_scaler = test_package['scaler']
    test_features = test_package['features']
    
    print("✅ Clean model loads successfully!")
    print(f"   Model type: {type(test_model)}")
    print(f"   Features: {len(test_features)}")
    
    # Quick prediction test
    dummy_input = np.random.random((1, len(test_features)))
    scaled_input = test_scaler.transform(dummy_input)
    prediction = test_model.predict(scaled_input)
    
    print(f"✅ Prediction test successful: {prediction}")
    
except Exception as e:
    print(f"❌ Clean model test failed: {e}")

print("🎉 Model cleaning complete!")
print(f"📁 Use this file in your Flask app: {clean_file}")
print("🔧 Update your app.py to use 'ev_ai4i_model_clean.pkl'")