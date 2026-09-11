import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend } from 'chart.js';
import { messaging, onMessage, getToken } from '../services/firebase';
import { db } from '../services/firebase';
import { collection, onSnapshot, addDoc } from 'firebase/firestore';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend);

interface ContributingFactor {
  name: string;
  value: number;
  importance: number;
  impact: string;
  risk_contribution: number;
  status: string;
}

const Maintenance: React.FC = () => {
  const { user } = useAuth();
  const [sensors, setSensors] = useState({
    Battery_Voltage: 3.7, Battery_Current: 1.0, Battery_Temperature: 25.0,
    Charge_Cycles: 100, Motor_Temperature: 30.0, Motor_Vibration: 0.5, Motor_Torque: 100.0,
    Motor_RPM: 5000, Power_Consumption: 50.0, Brake_Pad_Wear: 0.9, Brake_Pressure: 10.0,
    Regenerative_Braking_Efficiency: 0.7, Tire_Pressure: 2.5, Tire_Temperature: 35.0,
    Suspension_Load: 1000.0, Ambient_Temperature: 20.0, Ambient_Humidity: 60.0, Load_Weight: 500.0
  });
  
  // Prediction results
  const [batteryLifeLeft, setBatteryLifeLeft] = useState(0.0);
  const [failureRisk, setFailureRisk] = useState(0.0);
  const [maintenanceType, setMaintenanceType] = useState(0);
  const [riskLevel, setRiskLevel] = useState('LOW');
  const [confidence, setConfidence] = useState(0.0);
  const [contributingFactors, setContributingFactors] = useState<ContributingFactor[]>([]);
  
  // Simulation results
  const [voltageProfile, setVoltageProfile] = useState<number[]>([]);
  const [sohTrend, setSohTrend] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  
  // UI state
  const [showProof, setShowProof] = useState(false);
  const [predictionMade, setPredictionMade] = useState(false);

  // Real-time sensor data listener
  useEffect(() => {
    if (user) {
      const unsubscribe = onSnapshot(collection(db, `sensors/${user.uid}/data`), (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            setSensors(prevSensors => ({
              ...prevSensors,
              Battery_Voltage: data.Battery_Voltage || prevSensors.Battery_Voltage,
              Battery_Current: data.Battery_Current || prevSensors.Battery_Current,
              Battery_Temperature: data.Battery_Temperature || prevSensors.Battery_Temperature,
              Charge_Cycles: data.Charge_Cycles || prevSensors.Charge_Cycles,
              Motor_Temperature: data.Motor_Temperature || prevSensors.Motor_Temperature,
              Motor_Vibration: data.Motor_Vibration || prevSensors.Motor_Vibration,
              Motor_Torque: data.Motor_Torque || prevSensors.Motor_Torque,
              Motor_RPM: data.Motor_RPM || prevSensors.Motor_RPM,
              Power_Consumption: data.Power_Consumption || prevSensors.Power_Consumption,
              Brake_Pad_Wear: data.Brake_Pad_Wear || prevSensors.Brake_Pad_Wear,
              Brake_Pressure: data.Brake_Pressure || prevSensors.Brake_Pressure,
              Regenerative_Braking_Efficiency: data.Regenerative_Braking_Efficiency || prevSensors.Regenerative_Braking_Efficiency,
              Tire_Pressure: data.Tire_Pressure || prevSensors.Tire_Pressure,
              Tire_Temperature: data.Tire_Temperature || prevSensors.Tire_Temperature,
              Suspension_Load: data.Suspension_Load || prevSensors.Suspension_Load,
              Ambient_Temperature: data.Ambient_Temperature || prevSensors.Ambient_Temperature,
              Ambient_Humidity: data.Ambient_Humidity || prevSensors.Ambient_Humidity,
              Load_Weight: data.Load_Weight || prevSensors.Load_Weight
            }));
          }
        });
      });
      return () => unsubscribe();
    }
  }, [user]);

  // FCM setup for alerts
  useEffect(() => {
    getToken(messaging, { vapidKey: 'BDE2ACImMUIsOlf4sKwrv9w_d89x2frQezRiON3SLY4xnkXBKf7qOK3BMCe5xIUSlk_SGg-eiPf8-L3YAixuFzY' }).then((token: string) => {
      console.log('FCM Token:', token);
    }).catch((err: Error) => console.error('FCM Error:', err));
    onMessage(messaging, (payload) => {
      console.log('Message received:', payload);
      alert(payload.notification?.body || 'Maintenance alert!');
    });
  }, []);

  const saveSensorData = async () => {
    if (user) {
      try {
        await addDoc(collection(db, `sensors/${user.uid}/data`), {
          ...sensors,
          timestamp: new Date().toISOString()
        });
        console.log(`Sensor data saved for user ${user.uid}`);
      } catch (error) {
        console.error('Error saving sensor data:', error);
      }
    }
  };

  const predictMaintenance = async () => {
    setLoading(true);
    try {
      await saveSensorData();
      const response = await fetch('http://localhost:5001/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sensors)
      });
      const data = await response.json();
      
      // Set prediction results
      setBatteryLifeLeft(data.rul);
      setFailureRisk(data.failure_prob);
      setMaintenanceType(data.maintenance_type);
      setRiskLevel(data.risk_level);
      setConfidence(data.confidence);
      setContributingFactors(data.contributing_factors || []);
      setPredictionMade(true);
      
      if (data.risk_level === 'HIGH') {
        alert('High Risk! Schedule maintenance now.');
      }
    } catch (error) {
      console.error('Prediction error:', error);
    }
    setLoading(false);
  };

  const simulateTwin = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5001/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...sensors, cycles: 100 })
      });
      const data = await response.json();
      setVoltageProfile(data.voltage_profile);
      setSohTrend(data.soh_trend);
    } catch (error) {
      console.error('Simulation error:', error);
    }
    setLoading(false);
  };

  // Dynamic risk style with tooltip
  const getRiskStyle = () => {
    switch (riskLevel) {
      case 'HIGH': return { bg: 'bg-red-500', text: 'Very High Risk - Act Now!', color: 'text-red-100', border: 'border-red-400' };
      case 'MEDIUM': return { bg: 'bg-yellow-500', text: 'Moderate Risk - Check Soon', color: 'text-yellow-100', border: 'border-yellow-400' };
      case 'LOW': return { bg: 'bg-green-500', text: 'Low Risk - All Good', color: 'text-green-100', border: 'border-green-400' };
      default: return { bg: 'bg-gray-500', text: 'Unknown Risk', color: 'text-gray-100', border: 'border-gray-400' };
    }
  };

  // Get sensor status based on value
  const getSensorStatus = (sensorName: string, value: number) => {
    const sensorRanges = {
      'Battery Voltage': { good: [3.6, 4.2], warning: [3.4, 3.6], critical: [0, 3.4] },
      'Battery Temperature': { good: [15, 35], warning: [35, 45], critical: [45, 100] },
      'Motor Temperature': { good: [20, 60], warning: [60, 80], critical: [80, 120] },
      'Motor Vibration': { good: [0, 2], warning: [2, 5], critical: [5, 10] },
      'Charge Cycles': { good: [0, 500], warning: [500, 1000], critical: [1000, 2000] }
    };

    const range = sensorRanges[sensorName as keyof typeof sensorRanges];
    if (!range) return 'unknown';

    if (value >= range.good[0] && value <= range.good[1]) return 'good';
    if (value >= range.warning[0] && value <= range.warning[1]) return 'warning';
    return 'critical';
  };

  if (!user) return <div className="text-center text-gray-800 p-6">Please log in to see your dashboard.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 to-blue-900 text-gray-100">
      {/* Header with EV Theme */}
      <header className="bg-gradient-to-r from-green-600 to-blue-700 p-4 text-center">
        <h1 className="text-3xl font-bold">EV Health Monitor</h1>
        <p className="text-lg">Keep your electric ride in top shape</p>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-6">
        {/* Sensor Inputs Section */}
        <section className="bg-gray-800/90 p-6 rounded-lg shadow-lg mb-6">
          <h2 className="text-xl font-semibold mb-4 text-white">Your EV Stats</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.keys(sensors).map((key) => (
              <div key={key} className="flex flex-col">
                <label className="text-sm font-medium text-gray-300">
                  {key.replace('_', ' ').replace('Voltage', 'Level').replace('Temperature', 'Temp')}
                </label>
                <input
                  type="number"
                  value={sensors[key as keyof typeof sensors]}
                  onChange={(e) => setSensors({ ...sensors, [key]: parseFloat(e.target.value) })}
                  className="mt-1 p-2 border border-gray-600 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  title={`Enter your ${key.replace('_', ' ')} value`}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Action Buttons */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={predictMaintenance}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-md transition duration-200 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Checking...' : 'Check Health'}
          </button>
          <button
            onClick={simulateTwin}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md transition duration-200 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Simulating...' : 'See Future Health'}
          </button>
          {predictionMade && (
            <button
              onClick={() => setShowProof(!showProof)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg shadow-md transition duration-200"
            >
              {showProof ? 'Hide Proof' : 'Show Risk Proof'}
            </button>
          )}
        </div>

        {/* Health Metrics Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-gray-800/90 p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-medium text-white">Battery Life Left</h3>
            <p className="text-2xl mt-2 text-green-400">{batteryLifeLeft.toFixed(2)} cycles</p>
            <p className="text-sm text-gray-400">Time until battery needs replacement</p>
          </div>
          <div className="bg-gray-800/90 p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-medium text-white">Failure Risk</h3>
            <p className="text-2xl mt-2 text-yellow-400">{(failureRisk * 100).toFixed(1)}%</p>
            <p className="text-sm text-gray-400">Chance of breakdown soon</p>
          </div>
          <div className="bg-gray-800/90 p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-medium text-white">Maintenance Needed</h3>
            <p className="text-2xl mt-2 text-blue-400">
              {maintenanceType === 3 ? 'Yes (Predictive)' : maintenanceType === 1 ? 'Yes (Preventive)' : 'No'}
            </p>
            <p className="text-sm text-gray-400">Based on current data</p>
          </div>
          <div className={`p-4 rounded-lg shadow-md border-2 ${getRiskStyle().bg} ${getRiskStyle().border}`}>
            <h3 className="text-lg font-medium text-white">Overall Risk</h3>
            <p className="text-2xl mt-2 font-bold" title={getRiskStyle().text}>{riskLevel}</p>
            <p className={`text-sm ${getRiskStyle().color}`}>{getRiskStyle().text}</p>
            <p className="text-xs text-white mt-1">Confidence: {(confidence * 100).toFixed(1)}%</p>
          </div>
        </section>

        {/* RISK PROOF SECTION */}
        {showProof && predictionMade && (
          <section className="bg-gray-800/90 p-6 rounded-lg shadow-lg mb-6 border-2 border-purple-500">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-purple-400">🔍 Risk Analysis Proof</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${getRiskStyle().bg}`}>
                {riskLevel} RISK - {(failureRisk * 100).toFixed(1)}% Failure Probability
              </span>
            </div>
            
            {/* Key Risk Factors Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-white">Top Risk Contributors</h3>
                <div className="h-64">
                  <Bar
                    data={{
                      labels: contributingFactors.slice(0, 8).map(f => f.name.replace(/\s+/g, '\n')),
                      datasets: [{
                        label: 'Risk Contribution (%)',
                        data: contributingFactors.slice(0, 8).map(f => f.importance * 100),
                        backgroundColor: contributingFactors.slice(0, 8).map(f => 
                          f.importance > 0.05 ? '#EF4444' : f.importance > 0.03 ? '#F59E0B' : '#10B981'
                        ),
                        borderColor: '#374151',
                        borderWidth: 1
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          max: Math.max(...contributingFactors.map(f => f.importance * 100)) + 2,
                          ticks: { color: '#9CA3AF' },
                          title: { display: true, text: 'Impact (%)', color: '#9CA3AF' }
                        },
                        x: { 
                          ticks: {
  color: '#9CA3AF',
  font: {
    size: 10
  },
  maxRotation: 45
}

                        }
                      },
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          callbacks: {
                            label: (context) => `${context.parsed.y.toFixed(1)}% risk contribution`
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>

              {/* Detailed Risk Breakdown */}
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-white">Risk Factor Details</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {contributingFactors.slice(0, 10).map((factor, index) => {
                    const status = getSensorStatus(factor.name, factor.value);
                    const statusColors = {
                      good: 'text-green-400 bg-green-900/30',
                      warning: 'text-yellow-400 bg-yellow-900/30',
                      critical: 'text-red-400 bg-red-900/30',
                      unknown: 'text-gray-400 bg-gray-900/30'
                    };
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-600/30 rounded">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">{factor.name}</span>
                            <span className={`px-2 py-1 rounded text-xs ${statusColors[status]}`}>
                              {status.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-sm text-gray-300 mt-1">
                            Value: {factor.value} • {factor.impact}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-white">
                            {(factor.importance * 100).toFixed(1)}%
                          </div>
                          <div className="text-xs text-gray-400">risk weight</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Risk Explanation */}
            <div className="bg-gray-700/30 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-white">📋 How This Risk Was Calculated</h3>
              <div className="text-sm text-gray-300 space-y-2">
                <p>
                  <strong>Model Prediction:</strong> {failureRisk > 0.7 ? 'HIGH' : failureRisk > 0.3 ? 'MEDIUM' : 'LOW'} risk 
                  ({(failureRisk * 100).toFixed(1)}% failure probability)
                </p>
                <p>
                  <strong>Model Confidence:</strong> {(confidence * 100).toFixed(1)}% - 
                  {confidence > 0.8 ? ' Very confident in this prediction' : 
                   confidence > 0.6 ? ' Moderately confident' : ' Lower confidence, monitor closely'}
                </p>
                <p>
                  <strong>Key Issues Found:</strong> {contributingFactors.filter(f => f.importance > 0.04).length} sensors 
                  contributing significantly to risk
                </p>
                <p>
                  <strong>Recommended Action:</strong> {
                    riskLevel === 'HIGH' ? 'Schedule immediate maintenance - multiple critical factors detected' :
                    riskLevel === 'MEDIUM' ? 'Plan preventive maintenance within 2 weeks' :
                    'Continue regular monitoring - all systems appear normal'
                  }
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Twin Charts Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {voltageProfile.length > 0 && (
            <div className="bg-gray-800/90 p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4 text-green-400">Battery Voltage Forecast</h3>
              <div className="h-64">
                <Line
                  data={{
                    labels: Array.from({ length: voltageProfile.length }, (_, i) => `${i} days`),
                    datasets: [{
                      label: 'Voltage (V)',
                      data: voltageProfile,
                      borderColor: '#4CAF50',
                      backgroundColor: 'rgba(76, 175, 80, 0.3)',
                      fill: true,
                      tension: 0.2,
                    }],
                  }}
                  options={{
                    responsive: true,
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Voltage (V)', color: '#4CAF50' },
                        ticks: { color: '#A0AEC0' }
                      },
                      x: { title: { display: true, text: 'Days Ahead', color: '#4CAF50' }, ticks: { color: '#A0AEC0' } }
                    },
                    plugins: {
                      legend: { display: true, labels: { color: '#4CAF50' } },
                      tooltip: { mode: 'index', intersect: false, callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.raw} V` } }
                    },
                    animation: { duration: 800 },
                  }}
                />
              </div>
              <p className="text-sm text-gray-400 mt-2">Predicts battery voltage over 100 days</p>
            </div>
          )}
          {sohTrend.length > 0 && (
            <div className="bg-gray-800/90 p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-4 text-blue-400">Battery Health Forecast</h3>
              <div className="h-64">
                <Line
                  data={{
                    labels: Array.from({ length: sohTrend.length }, (_, i) => `${i} days`),
                    datasets: [{
                      label: 'Health (%)',
                      data: sohTrend.map(v => v * 100),
                      borderColor: '#2196F3',
                      backgroundColor: 'rgba(33, 150, 243, 0.3)',
                      fill: true,
                      tension: 0.2,
                    }],
                  }}
                  options={{
                    responsive: true,
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100,
                        title: { display: true, text: 'Health (%)', color: '#2196F3' },
                        ticks: { color: '#A0AEC0' }
                      },
                      x: { title: { display: true, text: 'Days Ahead', color: '#2196F3' }, ticks: { color: '#A0AEC0' } }
                    },
                    plugins: {
                      legend: { display: true, labels: { color: '#2196F3' } },
                      tooltip: { mode: 'index', intersect: false, callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.raw}%` } }
                    },
                    animation: { duration: 800 },
                  }}
                />
              </div>
              <p className="text-sm text-gray-400 mt-2">Predicts battery health over 100 days</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Maintenance;