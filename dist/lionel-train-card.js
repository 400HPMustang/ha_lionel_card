/**
 * Lionel Train Controller Card
 * A custom Lovelace card for controlling Lionel LionChief trains
 * https://github.com/BlackandBlue1908/ha_lionel_card
 * Version: 1.2.0 - Oval track with Polar Express design
 */

// Train model announcement name mappings
// Contributors: Add your train model here!
const TRAIN_MODELS = {
  "Generic": {
    random: "Random",
    ready_to_roll: "Ready to Roll",
    hey_there: "Hey There",
    squeaky: "Squeaky",
    water_and_fire: "Water & Fire",
    fastest_freight: "Fastest Freight",
    penna_flyer: "Penna Flyer",
  },
  "Polar Express": {
    random: "Random",
    ready_to_roll: "Polar Express",
    hey_there: "All Aboard",
    squeaky: "You Coming?",
    water_and_fire: "Tickets",
    fastest_freight: "First Gift",
    penna_flyer: "The King",
  },
};

const TRAIN_MODEL_OPTIONS = Object.keys(TRAIN_MODELS);

class LionelTrainCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  set hass(hass) {
    this._hass = hass;
    this._updateTrainModel();
    this._updateCard();
  }

  setConfig(config) {
    this._config = config || {};
    this._deviceName = this._config.device || '';
    this._trainModel = 'Generic'; // Will be updated from sensor
    if (this._deviceName) {
      this._render();
    }
  }

  _updateTrainModel() {
    if (!this._hass || !this._deviceName) return;
    
    // Read train model from the sensor entity
    const trainModelEntity = this._getEntityId('sensor', 'train_model');
    const trainModelState = this._hass.states[trainModelEntity];
    
    if (trainModelState && trainModelState.state) {
      const newModel = trainModelState.state;
      if (newModel !== this._trainModel && TRAIN_MODELS[newModel]) {
        this._trainModel = newModel;
        // Re-render to update announcement labels
        if (this.shadowRoot.innerHTML) {
          this._render();
        }
      }
    }
  }

  _getAnnouncementName(key) {
    const model = TRAIN_MODELS[this._trainModel] || TRAIN_MODELS['Generic'];
    return model[key] || key;
  }

  _getEntityId(domain, suffix) {
    // Convert device name to entity format: "Polar Express" -> "polar_express"
    const entityBase = this._deviceName.toLowerCase().replace(/\s+/g, '_');
    return `${domain}.${entityBase}_${suffix}`;
  }

  _render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --card-bg: var(--ha-card-background, var(--card-background-color, #1c1c1c));
          --primary-color: #2196F3;
          --accent-color: #FF9800;
          --text-color: var(--primary-text-color, #e0e0e0);
          --text-secondary: var(--secondary-text-color, #9e9e9e);
          --surface-color: rgba(255,255,255,0.05);
          --surface-hover: rgba(255,255,255,0.1);
          --success-color: #4CAF50;
          --danger-color: #f44336;
          --warning-color: #FF9800;
        }
        
        .card {
          background: var(--card-bg);
          border-radius: 16px;
          padding: 20px;
          font-family: var(--paper-font-body1_-_font-family, 'Roboto', sans-serif);
          color: var(--text-color);
        }
        
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--surface-color);
        }
        
        .title {
          font-size: 1.3em;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .title svg {
          width: 28px;
          height: 28px;
          color: var(--accent-color);
        }
        
        .status {
          font-size: 0.8em;
          padding: 6px 14px;
          border-radius: 20px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .status.connected {
          background: var(--success-color);
          color: white;
        }
        
        .status.disconnected {
          background: var(--danger-color);
          color: white;
        }

        /* Train Animation Section - Oval Track */
        .train-animation {
          background: linear-gradient(to bottom, #1a2a1a 0%, #0d1a0d 100%);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
          position: relative;
          height: 140px;
          overflow: hidden;
        }

        .oval-track {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 85%;
          height: 70%;
          transform: translate(-50%, -50%);
          border: 6px solid #5a5a5a;
          border-radius: 50%;
          box-shadow: inset 0 0 10px rgba(0,0,0,0.5), 0 0 5px rgba(0,0,0,0.3);
        }

        .oval-track::before {
          content: '';
          position: absolute;
          top: -3px;
          left: -3px;
          right: -3px;
          bottom: -3px;
          border: 3px dashed #4a3a2a;
          border-radius: 50%;
          opacity: 0.6;
        }

        .train-wrapper {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 85%;
          height: 70%;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }

        .train-pivot {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          transform-origin: center center;
        }

        .train {
          position: absolute;
          display: flex;
          align-items: flex-end;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
          transform-origin: center center;
        }

        /* Generic Locomotive */
        .locomotive {
          position: relative;
          width: 45px;
          height: 28px;
          background: linear-gradient(to bottom, #2a2a2a 0%, #1a1a1a 100%);
          border-radius: 4px 12px 2px 2px;
          border: 1px solid #3a3a3a;
        }

        .cab {
          position: absolute;
          top: -6px;
          right: 3px;
          width: 18px;
          height: 12px;
          background: linear-gradient(to bottom, #3a3a3a 0%, #2a2a2a 100%);
          border-radius: 3px 3px 0 0;
          border: 1px solid #4a4a4a;
        }

        .smokestack {
          position: absolute;
          top: -10px;
          left: 8px;
          width: 7px;
          height: 8px;
          background: linear-gradient(to bottom, #4a4a4a 0%, #2a2a2a 100%);
          border-radius: 2px 2px 0 0;
        }

        .headlight {
          position: absolute;
          top: 8px;
          right: -3px;
          width: 6px;
          height: 6px;
          background: #333;
          border-radius: 50%;
          transition: all 0.3s ease;
          z-index: 5;
        }

        .headlight.on {
          background: #ffeb3b;
          box-shadow: 0 0 10px 3px rgba(255, 235, 59, 0.7), 0 0 20px 6px rgba(255, 235, 59, 0.4);
        }

        .wheel {
          position: absolute;
          bottom: -5px;
          width: 8px;
          height: 8px;
          background: #2a2a2a;
          border: 1px solid #5a5a5a;
          border-radius: 50%;
        }

        .wheel.w1 { left: 5px; }
        .wheel.w2 { left: 18px; }
        .wheel.w3 { right: 5px; }

        .smoke {
          position: absolute;
          top: -18px;
          left: 9px;
          opacity: 0;
        }

        .smoke.active .smoke-puff {
          animation: smoke-rise 1.2s ease-out infinite;
        }

        .smoke-puff {
          width: 6px;
          height: 6px;
          background: rgba(200, 200, 200, 0.7);
          border-radius: 50%;
          position: absolute;
        }

        .smoke-puff:nth-child(1) { animation-delay: 0s; }
        .smoke-puff:nth-child(2) { animation-delay: 0.25s; left: 4px; }
        .smoke-puff:nth-child(3) { animation-delay: 0.5s; left: -2px; }

        @keyframes smoke-rise {
          0% { opacity: 0.8; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-15px) scale(1.8); }
        }

        /* Polar Express Special Design */
        .train.polar-express .locomotive {
          width: 50px;
          height: 30px;
          background: linear-gradient(to bottom, #1a1a1a 0%, #0a0a0a 100%);
          border-radius: 3px 8px 2px 2px;
          border: 1px solid #2a2a2a;
        }

        .train.polar-express .cab {
          top: -8px;
          right: 2px;
          width: 20px;
          height: 14px;
          background: linear-gradient(to bottom, #1a1a1a 0%, #0a0a0a 100%);
        }

        .train.polar-express .smokestack {
          top: -12px;
          left: 6px;
          width: 8px;
          height: 10px;
          background: #1a1a1a;
        }

        .train.polar-express .boiler-band {
          position: absolute;
          top: 6px;
          left: 2px;
          width: 30px;
          height: 3px;
          background: #c9a227;
          border-radius: 1px;
        }

        /* Polar Express Passenger Cars */
        .passenger-car {
          position: relative;
          width: 38px;
          height: 22px;
          background: linear-gradient(to bottom, #1e4a6e 0%, #15364f 100%);
          border-radius: 2px;
          margin-left: 3px;
          border: 1px solid #2a5a7e;
        }

        .passenger-car .windows {
          position: absolute;
          top: 5px;
          left: 3px;
          right: 3px;
          height: 8px;
          display: flex;
          gap: 3px;
        }

        .passenger-car .window {
          flex: 1;
          background: rgba(255, 230, 150, 0.3);
          border-radius: 1px;
        }

        .passenger-car .window.lit {
          background: rgba(255, 230, 150, 0.9);
          box-shadow: 0 0 4px rgba(255, 230, 150, 0.5);
        }

        .passenger-car .car-stripe {
          position: absolute;
          bottom: 4px;
          left: 0;
          right: 0;
          height: 2px;
          background: #c9a227;
        }

        .passenger-car .car-wheel {
          position: absolute;
          bottom: -4px;
          width: 6px;
          height: 6px;
          background: #1a1a1a;
          border: 1px solid #3a3a3a;
          border-radius: 50%;
        }

        .passenger-car .car-wheel.cw1 { left: 4px; }
        .passenger-car .car-wheel.cw2 { right: 4px; }

        .train-status-text {
          position: absolute;
          bottom: 6px;
          left: 0;
          right: 0;
          text-align: center;
          font-size: 0.7em;
          color: rgba(255,255,255,0.6);
          text-transform: uppercase;
          letter-spacing: 1px;
          text-shadow: 0 1px 2px rgba(0,0,0,0.5);
        }
        
        /* Throttle Section */
        .throttle-section {
          background: var(--surface-color);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
        }
        
        .throttle-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        
        .throttle-label {
          font-size: 0.9em;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .speed-value {
          font-size: 2.5em;
          font-weight: 700;
          color: var(--primary-color);
        }
        
        .throttle-slider {
          width: 100%;
          height: 12px;
          -webkit-appearance: none;
          appearance: none;
          background: linear-gradient(to right, var(--success-color) 0%, var(--warning-color) 50%, var(--danger-color) 100%);
          border-radius: 6px;
          outline: none;
          cursor: pointer;
        }
        
        .throttle-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 28px;
          height: 28px;
          background: white;
          border: 3px solid var(--primary-color);
          border-radius: 50%;
          cursor: grab;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          transition: transform 0.1s;
        }
        
        .throttle-slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }
        
        .throttle-slider::-moz-range-thumb {
          width: 28px;
          height: 28px;
          background: white;
          border: 3px solid var(--primary-color);
          border-radius: 50%;
          cursor: grab;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        
        /* Direction Buttons */
        .direction-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 16px;
        }
        
        .direction-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px;
          border: 2px solid var(--surface-hover);
          border-radius: 12px;
          background: var(--surface-color);
          color: var(--text-color);
          font-size: 0.95em;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .direction-btn:hover {
          background: var(--primary-color);
          border-color: var(--primary-color);
          color: white;
        }
        
        .direction-btn.active {
          background: var(--primary-color);
          border-color: var(--primary-color);
          color: white;
        }
        
        .direction-btn svg {
          width: 20px;
          height: 20px;
        }
        
        /* Section Headers */
        .section-header {
          font-size: 0.75em;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin: 16px 0 10px 0;
          padding-left: 4px;
        }
        
        /* Control Buttons Grid */
        .controls {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }
        
        .control-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 14px 8px;
          border: none;
          border-radius: 12px;
          background: var(--surface-color);
          color: var(--text-color);
          cursor: pointer;
          transition: all 0.2s ease;
          min-height: 70px;
        }
        
        .control-btn:hover {
          background: var(--surface-hover);
          transform: translateY(-2px);
        }
        
        .control-btn:active {
          transform: translateY(0);
        }
        
        .control-btn.active {
          background: var(--accent-color);
          color: white;
        }
        
        .control-btn.lights-btn.active {
          background: #FFC107;
          color: #333;
        }
        
        .control-btn svg {
          width: 26px;
          height: 26px;
          margin-bottom: 6px;
        }
        
        .control-btn span {
          font-size: 0.7em;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        /* Voice/Announcement Buttons */
        .voice-controls {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }
        
        .voice-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 10px 6px;
          border: none;
          border-radius: 10px;
          background: var(--surface-color);
          color: var(--text-color);
          cursor: pointer;
          transition: all 0.2s ease;
          min-height: 60px;
        }
        
        .voice-btn:hover {
          background: #9C27B0;
          color: white;
        }
        
        .voice-btn:active {
          transform: scale(0.95);
        }
        
        .voice-btn svg {
          width: 22px;
          height: 22px;
          margin-bottom: 4px;
        }
        
        .voice-btn span {
          font-size: 0.6em;
          font-weight: 500;
          text-align: center;
          line-height: 1.2;
        }
        
        /* Connection Buttons */
        .connection-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 16px;
        }
        
        .connect-btn {
          padding: 12px;
          border: none;
          border-radius: 10px;
          font-size: 0.85em;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        
        .connect-btn svg {
          width: 18px;
          height: 18px;
        }
        
        .connect-btn.connect {
          background: var(--success-color);
          color: white;
        }
        
        .connect-btn.connect:hover {
          background: #43A047;
        }
        
        .connect-btn.disconnect {
          background: var(--surface-color);
          color: var(--text-color);
          border: 1px solid var(--surface-hover);
        }
        
        .connect-btn.disconnect:hover {
          background: var(--danger-color);
          color: white;
          border-color: var(--danger-color);
        }
        
        /* Emergency Stop */
        .stop-btn {
          width: 100%;
          padding: 16px;
          margin-top: 16px;
          border: none;
          border-radius: 12px;
          background: var(--danger-color);
          color: white;
          font-size: 1em;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .stop-btn:hover {
          background: #d32f2f;
          transform: scale(1.02);
          box-shadow: 0 4px 12px rgba(244, 67, 54, 0.4);
        }
        
        .stop-btn:active {
          transform: scale(0.98);
        }
        
        .stop-btn svg {
          width: 22px;
          height: 22px;
        }
        
        .unavailable {
          opacity: 0.4;
          pointer-events: none;
        }

        /* Auto Reconnect Toggle */
        .auto-reconnect-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 0;
          margin-top: 8px;
          border-top: 1px solid var(--surface-hover);
        }

        .auto-reconnect-label {
          font-size: 0.85em;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .auto-reconnect-label svg {
          width: 18px;
          height: 18px;
        }

        .toggle-switch {
          position: relative;
          width: 44px;
          height: 24px;
          background: var(--surface-hover);
          border-radius: 12px;
          cursor: pointer;
          transition: background 0.3s ease;
        }

        .toggle-switch.active {
          background: var(--success-color);
        }

        .toggle-switch::after {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          transition: transform 0.3s ease;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .toggle-switch.active::after {
          transform: translateX(20px);
        }
        
        /* Expandable Settings Section */
        .settings-toggle {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          margin-top: 16px;
          background: var(--surface-color);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .settings-toggle:hover {
          background: var(--surface-hover);
        }
        
        .settings-toggle-label {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.9em;
          font-weight: 500;
          color: var(--text-secondary);
        }
        
        .settings-toggle-label svg {
          width: 20px;
          height: 20px;
        }
        
        .settings-toggle-icon {
          width: 20px;
          height: 20px;
          color: var(--text-secondary);
          transition: transform 0.3s ease;
        }
        
        .settings-toggle-icon.expanded {
          transform: rotate(180deg);
        }
        
        .settings-content {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease;
        }
        
        .settings-content.expanded {
          max-height: 500px;
        }
        
        .settings-inner {
          padding: 16px 0;
        }
        
        /* Volume Sliders */
        .volume-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;
        }
        
        .volume-row:last-child {
          margin-bottom: 0;
        }
        
        .volume-label {
          min-width: 80px;
          font-size: 0.8em;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .volume-label svg {
          width: 16px;
          height: 16px;
        }
        
        .volume-slider {
          flex: 1;
          height: 6px;
          -webkit-appearance: none;
          appearance: none;
          background: var(--surface-hover);
          border-radius: 3px;
          outline: none;
          cursor: pointer;
        }
        
        .volume-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          background: var(--primary-color);
          border-radius: 50%;
          cursor: grab;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }
        
        .volume-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          background: var(--primary-color);
          border: none;
          border-radius: 50%;
          cursor: grab;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }
        
        .volume-value {
          min-width: 24px;
          text-align: center;
          font-size: 0.85em;
          font-weight: 600;
          color: var(--primary-color);
        }
      </style>
      
      <ha-card>
        <div class="card">
          <div class="header">
            <div class="title">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,4L3,7L4.5,8.5L3,10V11H21V10L19.5,8.5L21,7L12,4M3,12V15H5V19H3V21H21V19H19V15H21V12H3M7,15H9V19H7V15M11,15H13V19H11V15M15,15H17V19H15V15Z"/>
              </svg>
              <span>${this._config.name || this._deviceName}</span>
            </div>
            <div class="status disconnected" id="status">Disconnected</div>
          </div>

          <!-- Animated Train Display -->
          <div class="train-animation">
            <div class="oval-track"></div>
            <div class="train-wrapper">
              <div class="train-pivot" id="train-pivot">
                <div class="train ${this._trainModel === 'Polar Express' ? 'polar-express' : ''}" id="train">
                  <div class="locomotive">
                    <div class="cab"></div>
                    <div class="smokestack"></div>
                    ${this._trainModel === 'Polar Express' ? '<div class="boiler-band"></div>' : ''}
                    <div class="headlight" id="train-headlight"></div>
                    <div class="smoke" id="train-smoke">
                      <div class="smoke-puff"></div>
                      <div class="smoke-puff"></div>
                      <div class="smoke-puff"></div>
                    </div>
                    <div class="wheel w1"></div>
                    <div class="wheel w2"></div>
                    <div class="wheel w3"></div>
                  </div>
                  ${this._trainModel === 'Polar Express' ? `
                  <div class="passenger-car">
                    <div class="windows">
                      <div class="window lit"></div>
                      <div class="window lit"></div>
                      <div class="window lit"></div>
                    </div>
                    <div class="car-stripe"></div>
                    <div class="car-wheel cw1"></div>
                    <div class="car-wheel cw2"></div>
                  </div>
                  <div class="passenger-car">
                    <div class="windows">
                      <div class="window lit"></div>
                      <div class="window lit"></div>
                      <div class="window lit"></div>
                    </div>
                    <div class="car-stripe"></div>
                    <div class="car-wheel cw1"></div>
                    <div class="car-wheel cw2"></div>
                  </div>
                  ` : ''}
                </div>
              </div>
            </div>
            <div class="train-status-text" id="train-status-text">Stopped</div>
          </div>
          
          <div class="throttle-section">
            <div class="throttle-header">
              <span class="throttle-label">Throttle</span>
              <span class="speed-value" id="speed-display">0%</span>
            </div>
            <input type="range" class="throttle-slider" id="throttle" min="0" max="100" value="0">
          </div>
          
          <div class="direction-section">
            <button class="direction-btn" id="btn-reverse">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z"/>
              </svg>
              Reverse
            </button>
            <button class="direction-btn" id="btn-forward">
              Forward
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M4,11V13H16L10.5,18.5L11.92,19.92L19.84,12L11.92,4.08L10.5,5.5L16,11H4Z"/>
              </svg>
            </button>
          </div>
          
          <div class="section-header">Controls</div>
          <div class="controls">
            <button class="control-btn lights-btn" id="btn-lights">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,2A7,7 0 0,0 5,9C5,11.38 6.19,13.47 8,14.74V17A1,1 0 0,0 9,18H15A1,1 0 0,0 16,17V14.74C17.81,13.47 19,11.38 19,9A7,7 0 0,0 12,2M9,21A1,1 0 0,0 10,22H14A1,1 0 0,0 15,21V20H9V21Z"/>
              </svg>
              <span>Lights</span>
            </button>
            <button class="control-btn" id="btn-horn">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,1C7,1 3,5 3,10V17A3,3 0 0,0 6,20H9V12H5V10A7,7 0 0,1 12,3A7,7 0 0,1 19,10V12H15V20H18A3,3 0 0,0 21,17V10C21,5 17,1 12,1Z"/>
              </svg>
              <span>Horn</span>
            </button>
            <button class="control-btn" id="btn-bell">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M21,19V20H3V19L5,17V11C5,7.9 7.03,5.17 10,4.29C10,4.19 10,4.1 10,4A2,2 0 0,1 12,2A2,2 0 0,1 14,4C14,4.1 14,4.19 14,4.29C16.97,5.17 19,7.9 19,11V17L21,19M14,21A2,2 0 0,1 12,23A2,2 0 0,1 10,21"/>
              </svg>
              <span>Bell</span>
            </button>
          </div>
          
          <div class="section-header">Announcements</div>
          <div class="voice-controls">
            <button class="voice-btn" id="btn-announce-random">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M14.5,2.5C14.5,2.5 16.5,2.5 16.5,4.5C16.5,6.5 14.5,6.5 14.5,6.5M18,2.5C18,2.5 21,2.5 21,6C21,9.5 18,9.5 18,9.5M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M12,7A5,5 0 0,0 7,12A5,5 0 0,0 12,17A5,5 0 0,0 17,12A5,5 0 0,0 12,7Z"/>
              </svg>
              <span>${this._getAnnouncementName('random')}</span>
            </button>
            <button class="voice-btn" id="btn-announce-ready">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z"/>
              </svg>
              <span>${this._getAnnouncementName('ready_to_roll')}</span>
            </button>
            <button class="voice-btn" id="btn-announce-hey">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z"/>
              </svg>
              <span>${this._getAnnouncementName('hey_there')}</span>
            </button>
            <button class="voice-btn" id="btn-announce-squeaky">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z"/>
              </svg>
              <span>${this._getAnnouncementName('squeaky')}</span>
            </button>
            <button class="voice-btn" id="btn-announce-water">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z"/>
              </svg>
              <span>${this._getAnnouncementName('water_and_fire')}</span>
            </button>
            <button class="voice-btn" id="btn-announce-freight">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z"/>
              </svg>
              <span>${this._getAnnouncementName('fastest_freight')}</span>
            </button>
            <button class="voice-btn" id="btn-announce-penna">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z"/>
              </svg>
              <span>${this._getAnnouncementName('penna_flyer')}</span>
            </button>
          </div>
          
          <div class="connection-section">
            <button class="connect-btn connect" id="btn-connect">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M14.88,16.29L13,18.17V14.41L14.88,16.29M13,3.83L10.88,5.95L13,8.07V3.83M17.71,7.71L12,2H11V9.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L11,14.41V22H12L17.71,16.29L13.41,12L17.71,7.71Z"/>
              </svg>
              Connect
            </button>
            <button class="connect-btn disconnect" id="btn-disconnect">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M14.88,16.29L13,18.17V14.41L14.88,16.29M13,3.83L10.88,5.95L13,8.07V3.83M17.71,7.71L12,2H11V9.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L11,14.41V22H12L17.71,16.29L13.41,12L17.71,7.71M3.41,1.86L2,3.27L7.73,9H6V15H8V9.27L20.73,22L22.14,20.59L3.41,1.86Z"/>
              </svg>
              Disconnect
            </button>
            <div class="auto-reconnect-row">
              <div class="auto-reconnect-label">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,6V9L16,5L12,1V4A8,8 0 0,0 4,12C4,13.57 4.46,15.03 5.24,16.26L6.7,14.8C6.25,13.97 6,13 6,12A6,6 0 0,1 12,6M18.76,7.74L17.3,9.2C17.74,10.04 18,11 18,12A6,6 0 0,1 12,18V15L8,19L12,23V20A8,8 0 0,0 20,12C20,10.43 19.54,8.97 18.76,7.74Z"/>
                </svg>
                Auto Reconnect
              </div>
              <div class="toggle-switch" id="toggle-auto-reconnect"></div>
            </div>
          </div>
          
          <!-- Expandable Settings Section -->
          <div class="settings-toggle" id="settings-toggle">
            <div class="settings-toggle-label">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/>
              </svg>
              Volume Settings
            </div>
            <svg class="settings-toggle-icon" id="settings-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z"/>
            </svg>
          </div>
          <div class="settings-content" id="settings-content">
            <div class="settings-inner">
              <div class="volume-row">
                <div class="volume-label">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M14,3.23V5.29C16.89,6.15 19,8.83 19,12C19,15.17 16.89,17.84 14,18.7V20.77C18,19.86 21,16.28 21,12C21,7.72 18,4.14 14,3.23M16.5,12C16.5,10.23 15.5,8.71 14,7.97V16C15.5,15.29 16.5,13.76 16.5,12M3,9V15H7L12,20V4L7,9H3Z"/></svg>
                  Master
                </div>
                <input type="range" class="volume-slider" id="vol-master" min="0" max="7" value="5">
                <span class="volume-value" id="vol-master-val">5</span>
              </div>
              <div class="volume-row">
                <div class="volume-label">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12,1C7,1 3,5 3,10V17A3,3 0 0,0 6,20H9V12H5V10A7,7 0 0,1 12,3A7,7 0 0,1 19,10V12H15V20H18A3,3 0 0,0 21,17V10C21,5 17,1 12,1Z"/></svg>
                  Horn
                </div>
                <input type="range" class="volume-slider" id="vol-horn" min="0" max="7" value="5">
                <span class="volume-value" id="vol-horn-val">5</span>
              </div>
              <div class="volume-row">
                <div class="volume-label">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M21,19V20H3V19L5,17V11C5,7.9 7.03,5.17 10,4.29C10,4.19 10,4.1 10,4A2,2 0 0,1 12,2A2,2 0 0,1 14,4C14,4.1 14,4.19 14,4.29C16.97,5.17 19,7.9 19,11V17L21,19M14,21A2,2 0 0,1 12,23A2,2 0 0,1 10,21"/></svg>
                  Bell
                </div>
                <input type="range" class="volume-slider" id="vol-bell" min="0" max="7" value="5">
                <span class="volume-value" id="vol-bell-val">5</span>
              </div>
              <div class="volume-row">
                <div class="volume-label">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z"/></svg>
                  Speech
                </div>
                <input type="range" class="volume-slider" id="vol-speech" min="0" max="7" value="5">
                <span class="volume-value" id="vol-speech-val">5</span>
              </div>
              <div class="volume-row">
                <div class="volume-label">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12,4L3,7L4.5,8.5L3,10V11H21V10L19.5,8.5L21,7L12,4M3,12V15H5V19H3V21H21V19H19V15H21V12H3Z"/></svg>
                  Engine
                </div>
                <input type="range" class="volume-slider" id="vol-engine" min="0" max="7" value="5">
                <span class="volume-value" id="vol-engine-val">5</span>
              </div>
            </div>
          </div>
          
          <button class="stop-btn" id="btn-stop">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M18,18H6V6H18V18Z"/>
            </svg>
            Emergency Stop
          </button>
        </div>
      </ha-card>
    `;

    this._setupEventListeners();
  }

  _setupEventListeners() {
    const throttle = this.shadowRoot.getElementById('throttle');
    const btnStop = this.shadowRoot.getElementById('btn-stop');
    const btnForward = this.shadowRoot.getElementById('btn-forward');
    const btnReverse = this.shadowRoot.getElementById('btn-reverse');
    const btnLights = this.shadowRoot.getElementById('btn-lights');
    const btnHorn = this.shadowRoot.getElementById('btn-horn');
    const btnBell = this.shadowRoot.getElementById('btn-bell');
    const btnConnect = this.shadowRoot.getElementById('btn-connect');
    const btnDisconnect = this.shadowRoot.getElementById('btn-disconnect');

    // Throttle slider
    throttle.addEventListener('input', (e) => {
      this._setThrottle(parseInt(e.target.value));
    });

    // Stop button
    btnStop.addEventListener('click', () => {
      this._pressButton('stop');
      throttle.value = 0;
      this.shadowRoot.getElementById('speed-display').textContent = '0%';
    });

    // Direction buttons
    btnForward.addEventListener('click', () => this._pressButton('forward'));
    btnReverse.addEventListener('click', () => this._pressButton('reverse'));

    // Control buttons
    btnLights.addEventListener('click', () => this._toggleSwitch('lights'));
    btnHorn.addEventListener('click', () => this._pressButton('horn'));
    btnBell.addEventListener('click', () => this._pressButton('bell'));
    
    // Connection buttons
    btnConnect.addEventListener('click', () => this._pressButton('connect'));
    btnDisconnect.addEventListener('click', () => this._pressButton('disconnect'));

    // Auto-reconnect toggle
    const autoReconnectToggle = this.shadowRoot.getElementById('toggle-auto-reconnect');
    if (autoReconnectToggle) {
      autoReconnectToggle.addEventListener('click', () => this._toggleSwitch('auto_reconnect'));
    }

    // Announcement buttons
    const announcements = [
      { id: 'btn-announce-random', name: 'random' },
      { id: 'btn-announce-ready', name: 'ready_to_roll' },
      { id: 'btn-announce-hey', name: 'hey_there' },
      { id: 'btn-announce-squeaky', name: 'squeaky' },
      { id: 'btn-announce-water', name: 'water_and_fire' },
      { id: 'btn-announce-freight', name: 'fastest_freight' },
      { id: 'btn-announce-penna', name: 'penna_flyer' },
    ];

    announcements.forEach(({ id, name }) => {
      const btn = this.shadowRoot.getElementById(id);
      if (btn) {
        btn.addEventListener('click', () => this._pressButton(`announcement_${name}`));
      }
    });

    // Settings toggle
    const settingsToggle = this.shadowRoot.getElementById('settings-toggle');
    const settingsContent = this.shadowRoot.getElementById('settings-content');
    const settingsIcon = this.shadowRoot.getElementById('settings-icon');
    
    settingsToggle.addEventListener('click', () => {
      settingsContent.classList.toggle('expanded');
      settingsIcon.classList.toggle('expanded');
    });

    // Volume sliders
    const volumeControls = [
      { id: 'vol-master', entity: 'master_volume' },
      { id: 'vol-horn', entity: 'horn_volume' },
      { id: 'vol-bell', entity: 'bell_volume' },
      { id: 'vol-speech', entity: 'speech_volume' },
      { id: 'vol-engine', entity: 'engine_volume' },
    ];

    volumeControls.forEach(({ id, entity }) => {
      const slider = this.shadowRoot.getElementById(id);
      const valueDisplay = this.shadowRoot.getElementById(`${id}-val`);
      if (slider) {
        slider.addEventListener('input', (e) => {
          const value = parseInt(e.target.value);
          valueDisplay.textContent = value;
          this._setVolume(entity, value);
        });
      }
    });
  }

  _setVolume(entity, value) {
    const entityId = this._getEntityId('number', entity);
    this._hass.callService('number', 'set_value', {
      entity_id: entityId,
      value: value
    });
  }

  _setThrottle(value) {
    const entityId = this._getEntityId('number', 'throttle');
    this._hass.callService('number', 'set_value', {
      entity_id: entityId,
      value: value
    });
    this.shadowRoot.getElementById('speed-display').textContent = `${value}%`;
  }

  _pressButton(action) {
    const entityId = this._getEntityId('button', action);
    this._hass.callService('button', 'press', {
      entity_id: entityId
    });
  }

  _toggleSwitch(action) {
    const entityId = this._getEntityId('switch', action);
    this._hass.callService('switch', 'toggle', {
      entity_id: entityId
    });
  }

  _updateCard() {
    if (!this._hass || !this._config || !this._deviceName) return;

    // Update connection status
    const connectionEntity = this._getEntityId('binary_sensor', 'connection');
    const connectionState = this._hass.states[connectionEntity];
    const statusEl = this.shadowRoot.getElementById('status');
    
    if (statusEl && connectionState) {
      const isConnected = connectionState.state === 'on';
      statusEl.textContent = isConnected ? 'Connected' : 'Disconnected';
      statusEl.className = `status ${isConnected ? 'connected' : 'disconnected'}`;
    }

    // Update throttle value
    const throttleEntity = this._getEntityId('number', 'throttle');
    const throttleState = this._hass.states[throttleEntity];
    const throttleEl = this.shadowRoot.getElementById('throttle');
    const speedEl = this.shadowRoot.getElementById('speed-display');
    let currentSpeed = 0;
    if (throttleState && throttleEl && speedEl) {
      currentSpeed = parseFloat(throttleState.state) || 0;
      throttleEl.value = currentSpeed;
      speedEl.textContent = `${Math.round(currentSpeed)}%`;
    }

    // Update lights button state and train headlight
    const lightsEntity = this._getEntityId('switch', 'lights');
    const lightsState = this._hass.states[lightsEntity];
    const lightsBtn = this.shadowRoot.getElementById('btn-lights');
    const trainHeadlight = this.shadowRoot.getElementById('train-headlight');
    let lightsOn = false;
    if (lightsState) {
      lightsOn = lightsState.state === 'on';
      if (lightsBtn) {
        if (lightsOn) {
          lightsBtn.classList.add('active');
        } else {
          lightsBtn.classList.remove('active');
        }
      }
      if (trainHeadlight) {
        if (lightsOn) {
          trainHeadlight.classList.add('on');
        } else {
          trainHeadlight.classList.remove('on');
        }
      }
    }

    // Get direction state
    const directionEntity = this._getEntityId('switch', 'direction');
    const directionState = this._hass.states[directionEntity];
    let isForward = true;
    if (directionState) {
      isForward = directionState.state === 'on';
    }

    // Update train animation
    this._updateTrainAnimation(currentSpeed, isForward, lightsOn);

    // Update auto-reconnect toggle
    const autoReconnectEntity = this._getEntityId('switch', 'auto_reconnect');
    const autoReconnectState = this._hass.states[autoReconnectEntity];
    const autoReconnectToggle = this.shadowRoot.getElementById('toggle-auto-reconnect');
    if (autoReconnectState && autoReconnectToggle) {
      if (autoReconnectState.state === 'on') {
        autoReconnectToggle.classList.add('active');
      } else {
        autoReconnectToggle.classList.remove('active');
      }
    }

    // Update volume sliders
    const volumeControls = [
      { id: 'vol-master', entity: 'master_volume' },
      { id: 'vol-horn', entity: 'horn_volume' },
      { id: 'vol-bell', entity: 'bell_volume' },
      { id: 'vol-speech', entity: 'speech_volume' },
      { id: 'vol-engine', entity: 'engine_volume' },
    ];

    volumeControls.forEach(({ id, entity }) => {
      const volumeEntity = this._getEntityId('number', entity);
      const volumeState = this._hass.states[volumeEntity];
      const slider = this.shadowRoot.getElementById(id);
      const valueDisplay = this.shadowRoot.getElementById(`${id}-val`);
      if (volumeState && slider && valueDisplay) {
        const value = parseFloat(volumeState.state) || 0;
        slider.value = value;
        valueDisplay.textContent = Math.round(value);
      }
    });
  }

  _updateTrainAnimation(speed, isForward, lightsOn) {
    const trainPivot = this.shadowRoot.getElementById('train-pivot');
    const train = this.shadowRoot.getElementById('train');
    const smoke = this.shadowRoot.getElementById('train-smoke');
    const statusText = this.shadowRoot.getElementById('train-status-text');

    if (!trainPivot || !train || !smoke || !statusText) return;

    // Update smoke animation based on speed
    if (speed > 0) {
      smoke.classList.add('active');
      smoke.style.opacity = Math.min(0.3 + (speed / 100) * 0.7, 1);
    } else {
      smoke.classList.remove('active');
      smoke.style.opacity = 0;
    }

    // Animate train around oval track
    if (speed > 0) {
      if (!this._trainAnimationId) {
        this._trainAngle = this._trainAngle || 0;
        this._animateTrainOval();
      }
      this._trainSpeed = speed;
      this._trainDirection = isForward;
    } else {
      if (this._trainAnimationId) {
        cancelAnimationFrame(this._trainAnimationId);
        this._trainAnimationId = null;
      }
    }

    // Update status text
    if (speed === 0) {
      statusText.textContent = 'Stopped';
    } else if (speed < 30) {
      statusText.textContent = isForward ? 'Crawling Forward' : 'Crawling Backward';
    } else if (speed < 60) {
      statusText.textContent = isForward ? 'Moving Forward' : 'Moving Backward';
    } else {
      statusText.textContent = isForward ? 'Full Speed Ahead!' : 'Full Speed Reverse!';
    }
  }

  _animateTrainOval() {
    const trainPivot = this.shadowRoot.getElementById('train-pivot');
    const train = this.shadowRoot.getElementById('train');
    const wrapper = this.shadowRoot.querySelector('.train-wrapper');
    
    if (!trainPivot || !train || !wrapper) return;

    const animate = () => {
      if (!this._trainSpeed || this._trainSpeed === 0) {
        this._trainAnimationId = null;
        return;
      }

      // Calculate rotation speed based on train speed (0.3 to 2 degrees per frame)
      const rotateAmount = 0.3 + (this._trainSpeed / 100) * 1.7;
      
      if (this._trainDirection) {
        this._trainAngle += rotateAmount;
      } else {
        this._trainAngle -= rotateAmount;
      }
      
      if (this._trainAngle >= 360) this._trainAngle -= 360;
      if (this._trainAngle < 0) this._trainAngle += 360;

      // Get wrapper dimensions for ellipse calculation
      const wrapperRect = wrapper.getBoundingClientRect();
      const radiusX = wrapperRect.width / 2 - 30;
      const radiusY = wrapperRect.height / 2 - 15;

      // Calculate position on ellipse
      const angleRad = (this._trainAngle * Math.PI) / 180;
      const x = Math.cos(angleRad) * radiusX;
      const y = Math.sin(angleRad) * radiusY;

      // Calculate tangent angle for train rotation (perpendicular to radius)
      // For an ellipse, the tangent angle is different from the position angle
      const tangentAngle = Math.atan2(radiusX * Math.sin(angleRad), -radiusY * Math.cos(angleRad));
      let trainRotation = (tangentAngle * 180) / Math.PI + 90;
      
      // Flip train when going backwards (reverse direction)
      if (!this._trainDirection) {
        trainRotation += 180;
      }

      trainPivot.style.transform = `translate(${x}px, ${y}px)`;
      train.style.transform = `rotate(${trainRotation}deg)`;

      this._trainAnimationId = requestAnimationFrame(animate);
    };

    this._trainAnimationId = requestAnimationFrame(animate);
  }

  getCardSize() {
    return 7;
  }

  static getConfigElement() {
    return document.createElement('lionel-train-card-editor');
  }

  static getStubConfig() {
    return {
      device: '',
      name: ''
    };
  }
}

// Card Editor
class LionelTrainCardEditor extends HTMLElement {
  constructor() {
    super();
    this._config = {};
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  setConfig(config) {
    this._config = config || {};
    this._render();
  }

  _getLionelDevices() {
    if (!this._hass) return [];
    
    // Find all Lionel train devices by looking for throttle entities
    const devices = [];
    const seen = new Set();
    
    Object.keys(this._hass.states).forEach(entityId => {
      if (entityId.startsWith('number.') && entityId.endsWith('_throttle')) {
        // Extract device name: number.polar_express_throttle -> Polar Express
        const base = entityId.replace('number.', '').replace('_throttle', '');
        const deviceName = base.split('_').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        
        if (!seen.has(deviceName)) {
          seen.add(deviceName);
          devices.push(deviceName);
        }
      }
    });
    
    return devices;
  }

  _render() {
    if (!this._config) return;
    
    const devices = this._getLionelDevices();
    const currentDevice = this._config.device || '';
    const currentName = this._config.name || '';
    
    const deviceOptions = devices.length > 0 
      ? devices.map(d => `<option value="${d}" ${currentDevice === d ? 'selected' : ''}>${d}</option>`).join('')
      : '<option value="">No Lionel trains found</option>';

    this.innerHTML = `
      <style>
        .editor {
          padding: 16px;
        }
        .editor .field {
          margin-bottom: 16px;
        }
        .editor label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
          color: var(--primary-text-color);
        }
        .editor select,
        .editor input {
          width: 100%;
          padding: 10px;
          border: 1px solid var(--divider-color, #ccc);
          border-radius: 8px;
          background: var(--card-background-color, white);
          color: var(--primary-text-color);
          font-size: 14px;
          box-sizing: border-box;
        }
        .editor select:focus,
        .editor input:focus {
          outline: none;
          border-color: var(--primary-color);
        }
        .editor .hint {
          font-size: 12px;
          color: var(--secondary-text-color);
          margin-top: 4px;
        }
      </style>
      <div class="editor">
        <div class="field">
          <label>Train Device</label>
          <select id="device">
            <option value="">Select a train...</option>
            ${deviceOptions}
          </select>
          <div class="hint">Select your Lionel train from the list</div>
        </div>
        
        <div class="field">
          <label>Card Name (optional)</label>
          <input type="text" id="name" value="${currentName}" placeholder="Leave blank to use device name">
        </div>
      </div>
    `;

    this.querySelector('#device').addEventListener('change', (e) => {
      this._config = { ...this._config, device: e.target.value };
      this._fireEvent();
    });

    this.querySelector('#name').addEventListener('change', (e) => {
      this._config = { ...this._config, name: e.target.value };
      this._fireEvent();
    });
  }

  _fireEvent() {
    const event = new CustomEvent('config-changed', {
      detail: { config: this._config },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }
}

// Register the card
customElements.define('lionel-train-card', LionelTrainCard);
customElements.define('lionel-train-card-editor', LionelTrainCardEditor);

// Register with Home Assistant
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'lionel-train-card',
  name: 'Lionel Train Controller',
  description: 'A custom card for controlling Lionel LionChief trains',
  preview: true
});

console.info('%c LIONEL-TRAIN-CARD %c v1.0.0 ', 
  'color: white; background: #1976D2; font-weight: bold;',
  'color: #1976D2; background: white; font-weight: bold;'
);
