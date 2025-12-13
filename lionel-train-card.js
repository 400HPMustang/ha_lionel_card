/**
 * Lionel Train Controller Card
 * A custom Lovelace card for controlling Lionel LionChief trains
 * https://github.com/BlackandBlue1908/ha_lionel_card
 * Version: 2.0.0 - 3D Train Animation with Three.js
 */

// Load Three.js dynamically if not already loaded
if (!window.THREE) {
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  document.head.appendChild(script);
}

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
          margin-bottom: 12px;
          padding-bottom: 10px;
          border-bottom: 1px solid var(--surface-color);
        }
        
        .title {
          font-size: 1.1em;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .title svg {
          width: 22px;
          height: 22px;
          color: var(--accent-color);
        }
        
        .status {
          font-size: 0.7em;
          padding: 4px 10px;
          border-radius: 16px;
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

        /* 3D Train Animation Section */
        .train-animation-3d {
          border-radius: 12px;
          margin-bottom: 16px;
          position: relative;
          height: 200px;
          overflow: hidden;
          background: #111;
        }

        .train-animation-3d canvas {
          width: 100% !important;
          height: 100% !important;
          border-radius: 12px;
        }

        .train-status-text {
          position: absolute;
          bottom: 8px;
          left: 0;
          right: 0;
          text-align: center;
          font-size: 0.75em;
          color: rgba(255,255,255,0.7);
          text-transform: uppercase;
          letter-spacing: 1px;
          text-shadow: 0 1px 3px rgba(0,0,0,0.8);
          pointer-events: none;
          z-index: 10;
        }
        
        /* Throttle Section */
        .throttle-section {
          background: var(--surface-color);
          border-radius: 10px;
          padding: 10px 14px;
          margin-bottom: 12px;
        }
        
        .throttle-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }
        
        .throttle-label {
          font-size: 0.75em;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .speed-value {
          font-size: 1.4em;
          font-weight: 700;
          color: var(--primary-color);
        }
        
        .throttle-slider {
          width: 100%;
          height: 8px;
          -webkit-appearance: none;
          appearance: none;
          background: linear-gradient(to right, var(--success-color) 0%, var(--warning-color) 50%, var(--danger-color) 100%);
          border-radius: 4px;
          outline: none;
          cursor: pointer;
        }
        
        .throttle-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          background: white;
          border: 2px solid var(--primary-color);
          border-radius: 50%;
          cursor: grab;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          transition: transform 0.1s;
        }
        
        .throttle-slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }
        
        .throttle-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: white;
          border: 2px solid var(--primary-color);
          border-radius: 50%;
          cursor: grab;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
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

          <!-- 3D Train Animation Display -->
          <div class="train-animation-3d" id="train-3d-container">
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

    // Direction buttons - immediately update animation state
    btnForward.addEventListener('click', () => {
      this._pressButton('forward');
      this._trainDirection3d = true;
    });
    btnReverse.addEventListener('click', () => {
      this._pressButton('reverse');
      this._trainDirection3d = false;
    });

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

    // Get direction state from sensor or status attributes
    let isForward = true;
    
    // Try direction sensor first
    const directionSensorEntity = this._getEntityId('sensor', 'direction');
    const directionSensorState = this._hass.states[directionSensorEntity];
    if (directionSensorState && directionSensorState.state) {
      isForward = directionSensorState.state === 'forward';
    } else {
      // Fallback to status sensor attributes
      const statusEntity = this._getEntityId('sensor', 'status');
      const statusState = this._hass.states[statusEntity];
      if (statusState && statusState.attributes && statusState.attributes.direction_forward !== undefined) {
        isForward = statusState.attributes.direction_forward;
      }
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
    // Initialize 3D scene if not already done
    if (!this._scene3d && window.THREE) {
      this._init3DScene();
    }

    // Update 3D train state
    this._trainSpeed3d = speed;
    this._trainDirection3d = isForward;
    this._trainLights3d = lightsOn;

    // Update status text
    const statusText = this.shadowRoot.getElementById('train-status-text');
    if (statusText) {
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

    // Update headlight
    if (this._headlightBulb && this._spotlight) {
      if (lightsOn) {
        this._headlightBulb.material.color.setHex(0xffffee);
        this._spotlight.intensity = 20;
      } else {
        this._headlightBulb.material.color.setHex(0x333333);
        this._spotlight.intensity = 0;
      }
    }
  }

  _init3DScene() {
    const container = this.shadowRoot.getElementById('train-3d-container');
    if (!container || !window.THREE) return;

    const THREE = window.THREE;
    const width = container.clientWidth || 300;
    const height = container.clientHeight || 200;

    // Scene
    this._scene3d = new THREE.Scene();
    this._scene3d.background = new THREE.Color(0x1a3a5c);
    this._scene3d.fog = new THREE.Fog(0x2a4a6c, 120, 350);

    // Camera - side view angle to see train profile
    this._camera3d = new THREE.PerspectiveCamera(40, width / height, 1, 500);
    this._camera3d.position.set(0, 35, 90);
    this._camera3d.lookAt(0, 3, 0);

    // Renderer
    this._renderer3d = new THREE.WebGLRenderer({ antialias: true });
    this._renderer3d.setSize(width, height);
    this._renderer3d.shadowMap.enabled = true;
    container.insertBefore(this._renderer3d.domElement, container.firstChild);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xaaccff, 0.6);
    this._scene3d.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffee, 0.8);
    dirLight.position.set(50, 100, 30);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    this._scene3d.add(dirLight);

    // Ground (snow - slightly blue tinted to reduce whiteout)
    const groundGeo = new THREE.PlaneGeometry(500, 500);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0xd8e8f0, roughness: 0.95 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this._scene3d.add(ground);

    // Create track and train
    this._createMountains3D();
    this._createTown3D();
    this._createTrack3D();
    this._createTrain3D();
    this._createTrees3D();
    this._createStation3D();
    this._createSnow3D();

    // Initialize animation state
    this._trainProgress = 0;
    this._trainSpeed3d = 0;
    this._trainDirection3d = true;
    this._trainLights3d = false;
    this._particles3d = [];

    // Start animation loop
    this._animate3D();

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        this._camera3d.aspect = w / h;
        this._camera3d.updateProjectionMatrix();
        this._renderer3d.setSize(w, h);
      }
    });
    resizeObserver.observe(container);
  }

  _createTrack3D() {
    const THREE = window.THREE;
    const trackRadius = 35;
    const trackLength = 50;

    // Stadium curve path
    class StadiumCurve extends THREE.Curve {
      constructor(radius, length) {
        super();
        this.radius = radius;
        this.length = length;
        this.arcLength = Math.PI * radius;
        this.straightLength = length;
        this.totalLength = (2 * this.arcLength) + (2 * this.straightLength);
      }
      getPoint(t, optionalTarget = new THREE.Vector3()) {
        let d = t * this.totalLength;
        if (d < this.arcLength) {
          const angle = -Math.PI/2 + (Math.PI * (d / this.arcLength));
          return optionalTarget.set(this.length/2 + this.radius * Math.cos(angle), 0.3, this.radius * Math.sin(angle));
        }
        d -= this.arcLength;
        if (d < this.straightLength) {
          return optionalTarget.set((this.length/2) - d, 0.3, this.radius);
        }
        d -= this.straightLength;
        if (d < this.arcLength) {
          const angle = Math.PI/2 + (Math.PI * (d / this.arcLength));
          return optionalTarget.set(-this.length/2 + this.radius * Math.cos(angle), 0.3, this.radius * Math.sin(angle));
        }
        d -= this.arcLength;
        return optionalTarget.set((-this.length/2) + d, 0.3, -this.radius);
      }
    }

    this._trainPath = new StadiumCurve(trackRadius, trackLength);

    // Ballast
    const ballastGeo = new THREE.TubeGeometry(this._trainPath, 200, 4, 8, true);
    const ballastMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 1 });
    const ballast = new THREE.Mesh(ballastGeo, ballastMat);
    ballast.scale.y = 0.15;
    this._scene3d.add(ballast);

    // Rails
    const railOffset = 1.8;
    const railPointsL = [], railPointsR = [];
    for (let i = 0; i <= 300; i++) {
      const t = i / 300;
      const pt = this._trainPath.getPointAt(t);
      const tangent = this._trainPath.getTangentAt(t);
      const normal = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();
      railPointsL.push(pt.clone().add(normal.clone().multiplyScalar(railOffset)));
      railPointsR.push(pt.clone().add(normal.clone().multiplyScalar(-railOffset)));
    }
    const railCurveL = new THREE.CatmullRomCurve3(railPointsL, true);
    const railCurveR = new THREE.CatmullRomCurve3(railPointsR, true);
    const railMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.7, roughness: 0.2 });
    const railMeshL = new THREE.Mesh(new THREE.TubeGeometry(railCurveL, 200, 0.25, 6, true), railMat);
    const railMeshR = new THREE.Mesh(new THREE.TubeGeometry(railCurveR, 200, 0.25, 6, true), railMat);
    railMeshL.position.y = 0.4;
    railMeshR.position.y = 0.4;
    this._scene3d.add(railMeshL);
    this._scene3d.add(railMeshR);
  }

  _createTrain3D() {
    const THREE = window.THREE;
    this._trainCars = [];

    // Locomotive - elongated Polar Express style
    const locoGroup = new THREE.Group();
    const boilerMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.4, metalness: 0.3 });

    // Main frame/chassis
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(3.5, 1.2, 16), boilerMat);
    chassis.position.set(0, 1.8, 0);
    locoGroup.add(chassis);

    // Boiler - longer and properly positioned
    const boiler = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.4, 14, 24), boilerMat);
    boiler.rotation.x = Math.PI / 2;
    boiler.position.set(0, 4.2, 1.5);
    boiler.castShadow = true;
    locoGroup.add(boiler);

    // Boiler front (smokebox)
    const smokebox = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.3, 2, 24), boilerMat);
    smokebox.rotation.x = Math.PI / 2;
    smokebox.position.set(0, 4.2, 9);
    locoGroup.add(smokebox);

    // Smokebox door
    const smokeboxDoor = new THREE.Mesh(new THREE.CircleGeometry(2.2, 24), new THREE.MeshStandardMaterial({ color: 0x222222 }));
    smokeboxDoor.position.set(0, 4.2, 10.1);
    locoGroup.add(smokeboxDoor);

    // Cab - taller and more detailed
    const cab = new THREE.Mesh(new THREE.BoxGeometry(5, 6, 4.5), boilerMat);
    cab.position.set(0, 5, -6);
    cab.castShadow = true;
    locoGroup.add(cab);

    // Cab roof
    const cabRoof = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.4, 5), boilerMat);
    cabRoof.position.set(0, 8.2, -6);
    locoGroup.add(cabRoof);

    // Cab windows
    const cabWinMat = new THREE.MeshBasicMaterial({ color: 0x334455 });
    const cabWinFront = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 2), cabWinMat);
    cabWinFront.position.set(0, 6, -3.7);
    locoGroup.add(cabWinFront);
    for (let s = -1; s <= 1; s += 2) {
      const cabWinSide = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), cabWinMat);
      cabWinSide.rotation.y = s * Math.PI / 2;
      cabWinSide.position.set(s * 2.55, 6, -6);
      locoGroup.add(cabWinSide);
    }

    // Smokestack - taller
    const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 2.5, 12), new THREE.MeshStandardMaterial({ color: 0x111111 }));
    stack.position.set(0, 7.5, 7);
    locoGroup.add(stack);

    // Steam dome
    const dome = new THREE.Mesh(new THREE.SphereGeometry(1.2, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), boilerMat);
    dome.position.set(0, 6.3, 2);
    locoGroup.add(dome);

    // Sand dome
    const sandDome = new THREE.Mesh(new THREE.SphereGeometry(0.9, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), boilerMat);
    sandDome.position.set(0, 6.3, -2);
    locoGroup.add(sandDome);

    // Cowcatcher/pilot
    const cowGeo = new THREE.BoxGeometry(3.5, 1.5, 3);
    const cow = new THREE.Mesh(cowGeo, boilerMat);
    cow.position.set(0, 1.2, 10);
    locoGroup.add(cow);
    
    // Pilot bars
    for (let i = -1.2; i <= 1.2; i += 0.4) {
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.5, 8), boilerMat);
      bar.rotation.x = -Math.PI / 4;
      bar.position.set(i, 1, 11.5);
      locoGroup.add(bar);
    }

    // Headlight
    const lightHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 1.2, 12), new THREE.MeshStandardMaterial({ color: 0x111111 }));
    lightHousing.rotation.x = Math.PI / 2;
    lightHousing.position.set(0, 7, 9.5);
    locoGroup.add(lightHousing);

    this._headlightBulb = new THREE.Mesh(new THREE.CircleGeometry(0.6, 12), new THREE.MeshBasicMaterial({ color: 0x333333 }));
    this._headlightBulb.position.set(0, 7, 10.2);
    locoGroup.add(this._headlightBulb);

    this._spotlight = new THREE.SpotLight(0xffaa00, 0, 80, Math.PI / 6, 0.5, 1);
    this._spotlight.position.set(0, 7, 10);
    const target = new THREE.Object3D();
    target.position.set(0, 3, 25);
    locoGroup.add(target);
    this._spotlight.target = target;
    locoGroup.add(this._spotlight);

    // Drive wheels - larger
    const driveWheelGeo = new THREE.CylinderGeometry(1.8, 1.8, 0.5, 24);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
    for (let z = -1; z <= 6; z += 3.5) {
      for (let s = -1; s <= 1; s += 2) {
        const w = new THREE.Mesh(driveWheelGeo, wheelMat);
        w.rotation.z = Math.PI / 2;
        w.position.set(s * 2.2, 1.8, z);
        locoGroup.add(w);
        // Wheel rim
        const rim = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.1, 8, 24), rimMat);
        rim.rotation.y = Math.PI / 2;
        rim.position.set(s * 2.5, 1.8, z);
        locoGroup.add(rim);
      }
    }

    // Pilot wheels - smaller
    const pilotWheelGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.4, 16);
    for (let s = -1; s <= 1; s += 2) {
      const pw = new THREE.Mesh(pilotWheelGeo, wheelMat);
      pw.rotation.z = Math.PI / 2;
      pw.position.set(s * 1.8, 0.9, 9);
      locoGroup.add(pw);
    }

    // Connecting rods (simplified)
    const rodMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.6 });
    for (let s = -1; s <= 1; s += 2) {
      const rod = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.4, 10), rodMat);
      rod.position.set(s * 2.6, 1.8, 2.5);
      locoGroup.add(rod);
    }

    locoGroup.userData = { isEngine: true };
    this._scene3d.add(locoGroup);
    this._trainCars.push({ mesh: locoGroup, offset: 0 });

    // Tender - longer and more detailed
    const tenderGroup = new THREE.Group();
    const tenderMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });
    
    // Tender body
    const tenderBody = new THREE.Mesh(new THREE.BoxGeometry(4.2, 4.5, 10), tenderMat);
    tenderBody.position.y = 3.5;
    tenderBody.castShadow = true;
    tenderGroup.add(tenderBody);

    // Coal pile
    const coalGeo = new THREE.SphereGeometry(1.5, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    const coalMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 1 });
    for (let x = -0.8; x <= 0.8; x += 0.8) {
      for (let z = -2; z <= 2; z += 2) {
        const coal = new THREE.Mesh(coalGeo, coalMat);
        coal.position.set(x, 5.8, z);
        coal.scale.set(0.8, 0.5, 0.8);
        tenderGroup.add(coal);
      }
    }

    this._addBogie3D(tenderGroup, -3.5);
    this._addBogie3D(tenderGroup, 3.5);
    this._scene3d.add(tenderGroup);
    this._trainCars.push({ mesh: tenderGroup, offset: 0.045 });

    // Passenger cars
    const isPolarExpress = this._trainModel === 'Polar Express';
    const numCars = isPolarExpress ? 3 : 1;
    
    for (let i = 0; i < numCars; i++) {
      const carGroup = new THREE.Group();
      const carColor = isPolarExpress ? 0x1e3a5f : 0x8B4513;
      
      // Car body - longer
      const body = new THREE.Mesh(new THREE.BoxGeometry(4.2, 4.5, 14), new THREE.MeshStandardMaterial({ color: carColor, roughness: 0.3 }));
      body.position.y = 3.8;
      body.castShadow = true;
      carGroup.add(body);

      // Roof - rounded
      const roof = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 14.2, 12, 1, false, 0, Math.PI), new THREE.MeshStandardMaterial({ color: 0x3a4a5a }));
      roof.rotation.z = Math.PI / 2;
      roof.rotation.y = Math.PI / 2;
      roof.position.y = 6.1;
      roof.scale.set(1.4, 1, 1.5);
      carGroup.add(roof);

      // Clerestory (raised center roof section)
      const clerestory = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.8, 10), new THREE.MeshStandardMaterial({ color: 0x2a3a4a }));
      clerestory.position.y = 7;
      carGroup.add(clerestory);

      // Windows
      const winMat = new THREE.MeshBasicMaterial({ color: isPolarExpress ? 0xffffcc : 0x556677 });
      for (let s = -1; s <= 1; s += 2) {
        for (let w = -5.5; w <= 5.5; w += 2.2) {
          const win = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.5), winMat);
          win.rotation.y = s * Math.PI / 2;
          win.position.set(s * 2.15, 4.5, w);
          carGroup.add(win);
        }
      }

      // Window stripe (red for Polar Express)
      if (isPolarExpress) {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(4.25, 0.4, 14.1), new THREE.MeshStandardMaterial({ color: 0x8b0000 }));
        stripe.position.y = 5.5;
        carGroup.add(stripe);
        
        // Gold trim
        const goldTrim = new THREE.Mesh(new THREE.BoxGeometry(4.25, 0.15, 14.1), new THREE.MeshStandardMaterial({ color: 0xc9a227 }));
        goldTrim.position.y = 2.2;
        carGroup.add(goldTrim);
      }

      // Vestibules (end platforms)
      const vestMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
      for (let z = -1; z <= 1; z += 2) {
        const vest = new THREE.Mesh(new THREE.BoxGeometry(3.5, 4, 0.6), vestMat);
        vest.position.set(0, 3.8, z * 7.3);
        carGroup.add(vest);
      }

      this._addBogie3D(carGroup, -4.5);
      this._addBogie3D(carGroup, 4.5);
      this._scene3d.add(carGroup);
      this._trainCars.push({ mesh: carGroup, offset: 0.095 + (i * 0.048) });
    }
  }

  _addBogie3D(parent, zPos) {
    const THREE = window.THREE;
    const bogieGroup = new THREE.Group();
    bogieGroup.position.set(0, 0.8, zPos);
    bogieGroup.add(new THREE.Mesh(new THREE.BoxGeometry(2, 0.4, 2.5), new THREE.MeshStandardMaterial({ color: 0x111111 })));
    const wGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.25, 16);
    const wMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    [{ x: 1.2, z: -0.8 }, { x: -1.2, z: -0.8 }, { x: 1.2, z: 0.8 }, { x: -1.2, z: 0.8 }].forEach(pos => {
      const w = new THREE.Mesh(wGeo, wMat);
      w.rotation.z = Math.PI / 2;
      w.position.set(pos.x, 0, pos.z);
      bogieGroup.add(w);
    });
    parent.add(bogieGroup);
  }

  _createMountains3D() {
    const THREE = window.THREE;
    
    // Mountain materials - different shades for depth
    const farMountainMat = new THREE.MeshStandardMaterial({ color: 0x2a3a4a, flatShading: true });
    const midMountainMat = new THREE.MeshStandardMaterial({ color: 0x3a4a5a, flatShading: true });
    const nearMountainMat = new THREE.MeshStandardMaterial({ color: 0x4a5a6a, flatShading: true });
    const snowCapMat = new THREE.MeshStandardMaterial({ color: 0xeef4f8 });

    // Far mountain range (backdrop)
    const farMountains = [
      { x: -180, z: -200, height: 80, width: 60 },
      { x: -120, z: -220, height: 100, width: 70 },
      { x: -60, z: -210, height: 90, width: 65 },
      { x: 0, z: -230, height: 120, width: 80 },
      { x: 60, z: -215, height: 95, width: 68 },
      { x: 120, z: -225, height: 110, width: 75 },
      { x: 180, z: -205, height: 85, width: 62 },
    ];

    farMountains.forEach(m => {
      const mountain = new THREE.Mesh(
        new THREE.ConeGeometry(m.width, m.height, 6),
        farMountainMat
      );
      mountain.position.set(m.x, m.height / 2, m.z);
      mountain.rotation.y = Math.random() * Math.PI;
      this._scene3d.add(mountain);

      // Snow cap
      const snowCap = new THREE.Mesh(
        new THREE.ConeGeometry(m.width * 0.4, m.height * 0.25, 6),
        snowCapMat
      );
      snowCap.position.set(m.x, m.height * 0.75, m.z);
      snowCap.rotation.y = mountain.rotation.y;
      this._scene3d.add(snowCap);
    });

    // Mid-range mountains
    const midMountains = [
      { x: -150, z: -150, height: 55, width: 45 },
      { x: -90, z: -160, height: 65, width: 50 },
      { x: -30, z: -155, height: 60, width: 48 },
      { x: 30, z: -165, height: 70, width: 55 },
      { x: 90, z: -158, height: 58, width: 46 },
      { x: 150, z: -152, height: 52, width: 42 },
    ];

    midMountains.forEach(m => {
      const mountain = new THREE.Mesh(
        new THREE.ConeGeometry(m.width, m.height, 5),
        midMountainMat
      );
      mountain.position.set(m.x, m.height / 2, m.z);
      mountain.rotation.y = Math.random() * Math.PI;
      this._scene3d.add(mountain);

      // Snow cap
      const snowCap = new THREE.Mesh(
        new THREE.ConeGeometry(m.width * 0.35, m.height * 0.2, 5),
        snowCapMat
      );
      snowCap.position.set(m.x, m.height * 0.8, m.z);
      snowCap.rotation.y = mountain.rotation.y;
      this._scene3d.add(snowCap);
    });

    // Near hills (smaller, more detail)
    const nearHills = [
      { x: -120, z: -100, height: 25, width: 30 },
      { x: -70, z: -110, height: 30, width: 35 },
      { x: 70, z: -105, height: 28, width: 32 },
      { x: 130, z: -95, height: 22, width: 28 },
    ];

    nearHills.forEach(m => {
      const hill = new THREE.Mesh(
        new THREE.ConeGeometry(m.width, m.height, 5),
        nearMountainMat
      );
      hill.position.set(m.x, m.height / 2, m.z);
      hill.rotation.y = Math.random() * Math.PI;
      this._scene3d.add(hill);

      // Light snow dusting
      const snowDust = new THREE.Mesh(
        new THREE.ConeGeometry(m.width * 0.3, m.height * 0.15, 5),
        snowCapMat
      );
      snowDust.position.set(m.x, m.height * 0.85, m.z);
      snowDust.rotation.y = hill.rotation.y;
      this._scene3d.add(snowDust);
    });

    // Side mountains (left and right edges)
    const sideMountains = [
      { x: -200, z: -80, height: 45, width: 40 },
      { x: -210, z: -40, height: 35, width: 32 },
      { x: 200, z: -70, height: 40, width: 38 },
      { x: 205, z: -30, height: 32, width: 30 },
    ];

    sideMountains.forEach(m => {
      const mountain = new THREE.Mesh(
        new THREE.ConeGeometry(m.width, m.height, 5),
        midMountainMat
      );
      mountain.position.set(m.x, m.height / 2, m.z);
      this._scene3d.add(mountain);
    });
  }

  _createTown3D() {
    const THREE = window.THREE;
    
    // Building materials
    const brickMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9 });
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x696969, roughness: 0.8 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.85 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x2d1810, roughness: 0.7 });
    const snowRoofMat = new THREE.MeshStandardMaterial({ color: 0xf0f5f8 });
    const windowMat = new THREE.MeshBasicMaterial({ color: 0xffffaa });
    const darkWindowMat = new THREE.MeshBasicMaterial({ color: 0x334455 });

    // Town buildings positioned outside the track on the left side
    const buildings = [
      { x: -75, z: 20, w: 12, h: 14, d: 10, mat: brickMat, roofType: 'peaked' },
      { x: -85, z: 35, w: 10, h: 10, d: 8, mat: woodMat, roofType: 'peaked' },
      { x: -70, z: 45, w: 14, h: 18, d: 12, mat: stoneMat, roofType: 'peaked' },
      { x: -90, z: 55, w: 8, h: 8, d: 8, mat: woodMat, roofType: 'flat' },
      { x: -75, z: 65, w: 11, h: 12, d: 9, mat: brickMat, roofType: 'peaked' },
      // Additional buildings on right side
      { x: 75, z: 20, w: 10, h: 12, d: 9, mat: brickMat, roofType: 'peaked' },
      { x: 85, z: 35, w: 12, h: 15, d: 10, mat: stoneMat, roofType: 'peaked' },
      { x: 70, z: -20, w: 9, h: 10, d: 8, mat: woodMat, roofType: 'peaked' },
      { x: 80, z: -35, w: 11, h: 13, d: 9, mat: brickMat, roofType: 'peaked' },
      // Buildings near station
      { x: -30, z: -75, w: 10, h: 11, d: 8, mat: woodMat, roofType: 'peaked' },
      { x: 30, z: -75, w: 12, h: 14, d: 10, mat: brickMat, roofType: 'peaked' },
      // More scattered buildings
      { x: -95, z: 0, w: 8, h: 9, d: 7, mat: woodMat, roofType: 'flat' },
      { x: -80, z: -15, w: 10, h: 12, d: 8, mat: stoneMat, roofType: 'peaked' },
      { x: 90, z: 0, w: 9, h: 10, d: 8, mat: brickMat, roofType: 'peaked' },
      { x: 95, z: -20, w: 8, h: 8, d: 7, mat: woodMat, roofType: 'flat' },
    ];

    buildings.forEach(b => {
      const building = new THREE.Group();

      // Main structure
      const body = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), b.mat);
      body.position.y = b.h / 2;
      body.castShadow = true;
      body.receiveShadow = true;
      building.add(body);

      // Roof
      if (b.roofType === 'peaked') {
        const roofHeight = b.w * 0.4;
        const roof = new THREE.Mesh(
          new THREE.ConeGeometry(Math.max(b.w, b.d) * 0.75, roofHeight, 4),
          roofMat
        );
        roof.position.y = b.h + roofHeight / 2;
        roof.rotation.y = Math.PI / 4;
        roof.castShadow = true;
        building.add(roof);

        // Snow on roof
        const snowRoof = new THREE.Mesh(
          new THREE.ConeGeometry(Math.max(b.w, b.d) * 0.78, roofHeight * 0.3, 4),
          snowRoofMat
        );
        snowRoof.position.y = b.h + roofHeight * 0.7;
        snowRoof.rotation.y = Math.PI / 4;
        building.add(snowRoof);
      } else {
        // Flat roof with snow
        const flatRoof = new THREE.Mesh(
          new THREE.BoxGeometry(b.w + 0.5, 0.5, b.d + 0.5),
          roofMat
        );
        flatRoof.position.y = b.h + 0.25;
        building.add(flatRoof);

        const snowLayer = new THREE.Mesh(
          new THREE.BoxGeometry(b.w + 0.3, 0.4, b.d + 0.3),
          snowRoofMat
        );
        snowLayer.position.y = b.h + 0.7;
        building.add(snowLayer);
      }

      // Windows
      const numWindowsX = Math.floor(b.w / 4);
      const numWindowsY = Math.floor(b.h / 5);
      for (let wy = 0; wy < numWindowsY; wy++) {
        for (let wx = 0; wx < numWindowsX; wx++) {
          const isLit = Math.random() > 0.3;
          const winX = (wx - (numWindowsX - 1) / 2) * 3;
          const winY = 3 + wy * 4;
          
          // Front windows
          const winFront = new THREE.Mesh(
            new THREE.PlaneGeometry(1.5, 2),
            isLit ? windowMat : darkWindowMat
          );
          winFront.position.set(winX, winY, b.d / 2 + 0.1);
          building.add(winFront);

          // Back windows
          const winBack = new THREE.Mesh(
            new THREE.PlaneGeometry(1.5, 2),
            isLit ? windowMat : darkWindowMat
          );
          winBack.position.set(winX, winY, -b.d / 2 - 0.1);
          winBack.rotation.y = Math.PI;
          building.add(winBack);
        }
      }

      // Door
      const door = new THREE.Mesh(
        new THREE.BoxGeometry(2, 3.5, 0.3),
        new THREE.MeshStandardMaterial({ color: 0x3d2817 })
      );
      door.position.set(0, 1.75, b.d / 2);
      building.add(door);

      building.position.set(b.x, 0, b.z);
      this._scene3d.add(building);
    });

    // Church/Chapel with steeple
    const church = new THREE.Group();
    const churchBody = new THREE.Mesh(new THREE.BoxGeometry(14, 12, 20), stoneMat);
    churchBody.position.y = 6;
    churchBody.castShadow = true;
    church.add(churchBody);

    // Church roof
    const churchRoof = new THREE.Mesh(
      new THREE.CylinderGeometry(0, 12, 8, 4),
      roofMat
    );
    churchRoof.position.y = 16;
    churchRoof.rotation.y = Math.PI / 4;
    church.add(churchRoof);

    // Snow on church roof
    const churchSnow = new THREE.Mesh(
      new THREE.CylinderGeometry(0, 12.5, 2, 4),
      snowRoofMat
    );
    churchSnow.position.y = 13;
    churchSnow.rotation.y = Math.PI / 4;
    church.add(churchSnow);

    // Steeple
    const steeple = new THREE.Mesh(new THREE.BoxGeometry(5, 10, 5), stoneMat);
    steeple.position.set(0, 17, -6);
    church.add(steeple);

    const spire = new THREE.Mesh(
      new THREE.ConeGeometry(3.5, 12, 4),
      roofMat
    );
    spire.position.set(0, 28, -6);
    spire.rotation.y = Math.PI / 4;
    church.add(spire);

    // Church windows (stained glass effect)
    const stainedGlassMat = new THREE.MeshBasicMaterial({ color: 0xffcc66 });
    for (let z = -6; z <= 6; z += 6) {
      const churchWin = new THREE.Mesh(new THREE.PlaneGeometry(2, 4), stainedGlassMat);
      churchWin.position.set(7.1, 6, z);
      churchWin.rotation.y = Math.PI / 2;
      church.add(churchWin);
      
      const churchWin2 = new THREE.Mesh(new THREE.PlaneGeometry(2, 4), stainedGlassMat);
      churchWin2.position.set(-7.1, 6, z);
      churchWin2.rotation.y = -Math.PI / 2;
      church.add(churchWin2);
    }

    church.position.set(80, 0, 50);
    this._scene3d.add(church);

    // Water tower
    const waterTower = new THREE.Group();
    
    // Legs
    const legMat = new THREE.MeshStandardMaterial({ color: 0x4a3728 });
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 2) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 15, 8), legMat);
      leg.position.set(Math.cos(angle) * 4, 7.5, Math.sin(angle) * 4);
      waterTower.add(leg);
    }

    // Tank
    const tank = new THREE.Mesh(
      new THREE.CylinderGeometry(6, 5, 8, 12),
      new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.7 })
    );
    tank.position.y = 18;
    waterTower.add(tank);

    // Conical roof
    const tankRoof = new THREE.Mesh(
      new THREE.ConeGeometry(6.5, 4, 12),
      roofMat
    );
    tankRoof.position.y = 24;
    waterTower.add(tankRoof);

    // Snow on tank roof
    const tankSnow = new THREE.Mesh(
      new THREE.ConeGeometry(6.8, 1, 12),
      snowRoofMat
    );
    tankSnow.position.y = 23;
    waterTower.add(tankSnow);

    waterTower.position.set(70, 0, -70);
    this._scene3d.add(waterTower);

    // Street lamps around town
    const lampPositions = [
      { x: -65, z: 30 },
      { x: -65, z: 50 },
      { x: -65, z: 70 },
      { x: 75, z: 30 },
      { x: 75, z: 70 },
    ];

    lampPositions.forEach(pos => {
      const lamp = new THREE.Group();
      
      // Pole
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.3, 6, 8),
        new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
      );
      pole.position.y = 3;
      lamp.add(pole);

      // Lamp housing
      const housing = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 1.2, 1.2),
        new THREE.MeshStandardMaterial({ color: 0x2a2a2a })
      );
      housing.position.y = 6.5;
      lamp.add(housing);

      // Glow
      const glow = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffcc })
      );
      glow.position.y = 6;
      lamp.add(glow);

      // Point light
      const light = new THREE.PointLight(0xffffaa, 0.3, 20);
      light.position.y = 6;
      lamp.add(light);

      lamp.position.set(pos.x, 0, pos.z);
      this._scene3d.add(lamp);
    });

    // Fence along town edge
    const fenceMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5 });
    for (let z = 15; z <= 75; z += 3) {
      // Fence post
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.5, 0.3), fenceMat);
      post.position.set(-60, 1.25, z);
      this._scene3d.add(post);

      // Horizontal rails
      if (z < 75) {
        const rail1 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 3), fenceMat);
        rail1.position.set(-60, 0.8, z + 1.5);
        this._scene3d.add(rail1);
        
        const rail2 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 3), fenceMat);
        rail2.position.set(-60, 1.8, z + 1.5);
        this._scene3d.add(rail2);
      }
    }
  }

  _createTrees3D() {
    const THREE = window.THREE;
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3d2817 });
    const leavesMat = new THREE.MeshStandardMaterial({ color: 0x1e3612 });
    const snowMat = new THREE.MeshStandardMaterial({ color: 0xffffff });

    // Central Christmas tree
    const centerTree = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const s = 1.0 - (i * 0.2);
      const y = i * 5;
      const cone = new THREE.Mesh(new THREE.ConeGeometry(8 * s, 8, 10), leavesMat);
      cone.position.y = y + 4;
      cone.castShadow = true;
      centerTree.add(cone);
      const snow = new THREE.Mesh(new THREE.ConeGeometry(7 * s, 1.5, 10), snowMat);
      snow.position.y = y + 3;
      centerTree.add(snow);
    }
    const star = new THREE.Mesh(new THREE.DodecahedronGeometry(1.5), new THREE.MeshStandardMaterial({ color: 0xFFD700, emissive: 0xFFD700, emissiveIntensity: 0.5 }));
    star.position.y = 22;
    centerTree.add(star);

    // Christmas lights on tree - spiral pattern
    const lightColors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff, 0xffa500];
    this._christmasLights = [];
    for (let layer = 0; layer < 4; layer++) {
      const layerY = layer * 5 + 2;
      const layerRadius = 7 * (1.0 - layer * 0.2);
      const numLights = Math.floor(12 - layer * 2);
      
      for (let i = 0; i < numLights; i++) {
        const angle = (i / numLights) * Math.PI * 2 + layer * 0.5;
        const x = Math.cos(angle) * layerRadius;
        const z = Math.sin(angle) * layerRadius;
        
        const lightColor = lightColors[Math.floor(Math.random() * lightColors.length)];
        const lightBulb = new THREE.Mesh(
          new THREE.SphereGeometry(0.3, 8, 8),
          new THREE.MeshBasicMaterial({ color: lightColor })
        );
        lightBulb.position.set(x, layerY, z);
        centerTree.add(lightBulb);
        this._christmasLights.push({ mesh: lightBulb, baseColor: lightColor });
        
        // Add small point light for glow effect
        const pointLight = new THREE.PointLight(lightColor, 0.15, 5);
        pointLight.position.set(x, layerY, z);
        centerTree.add(pointLight);
      }
    }

    // Additional string of lights going up the tree
    for (let i = 0; i < 30; i++) {
      const t = i / 30;
      const spiralAngle = t * Math.PI * 6;
      const spiralY = t * 20 + 2;
      const spiralRadius = 7 * (1 - t * 0.7);
      const x = Math.cos(spiralAngle) * spiralRadius;
      const z = Math.sin(spiralAngle) * spiralRadius;
      
      const lightColor = lightColors[i % lightColors.length];
      const lightBulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.25, 6, 6),
        new THREE.MeshBasicMaterial({ color: lightColor })
      );
      lightBulb.position.set(x, spiralY, z);
      centerTree.add(lightBulb);
      this._christmasLights.push({ mesh: lightBulb, baseColor: lightColor });
    }

    this._scene3d.add(centerTree);

    // Surrounding trees
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const dist = 60 + Math.random() * 40;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.8, 3), trunkMat);
      trunk.position.y = 1.5;
      tree.add(trunk);
      const leaves = new THREE.Mesh(new THREE.ConeGeometry(3, 7, 8), leavesMat);
      leaves.position.y = 5;
      tree.add(leaves);
      const treeSnow = new THREE.Mesh(new THREE.ConeGeometry(3.2, 1.5, 8), snowMat);
      treeSnow.position.y = 7.5;
      tree.add(treeSnow);

      tree.position.set(x, 0, z);
      const s = 0.6 + Math.random() * 0.5;
      tree.scale.set(s, s, s);
      this._scene3d.add(tree);
    }
  }

  _createStation3D() {
    const THREE = window.THREE;
    const stationGroup = new THREE.Group();

    // Station building - rustic wooden style
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x2d1810, roughness: 0.7 });
    const windowMat = new THREE.MeshBasicMaterial({ color: 0xffffaa });

    // Main building
    const building = new THREE.Mesh(new THREE.BoxGeometry(18, 10, 12), wallMat);
    building.position.y = 5;
    building.castShadow = true;
    stationGroup.add(building);

    // Roof
    const roofGeo = new THREE.ConeGeometry(14, 6, 4);
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 13;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    stationGroup.add(roof);

    // Snow on roof
    const snowRoof = new THREE.Mesh(new THREE.ConeGeometry(14.5, 1.5, 4), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    snowRoof.position.y = 11;
    snowRoof.rotation.y = Math.PI / 4;
    stationGroup.add(snowRoof);

    // Windows (lit)
    for (let x = -5; x <= 5; x += 5) {
      const win = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 3), windowMat);
      win.position.set(x, 5, 6.1);
      stationGroup.add(win);
      const winBack = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 3), windowMat);
      winBack.position.set(x, 5, -6.1);
      winBack.rotation.y = Math.PI;
      stationGroup.add(winBack);
    }

    // Platform
    const platform = new THREE.Mesh(new THREE.BoxGeometry(30, 1, 8), new THREE.MeshStandardMaterial({ color: 0x666666 }));
    platform.position.set(0, 0.5, 10);
    platform.receiveShadow = true;
    stationGroup.add(platform);

    // Platform edge (yellow safety line)
    const safetyLine = new THREE.Mesh(new THREE.BoxGeometry(30, 0.1, 0.5), new THREE.MeshStandardMaterial({ color: 0xFFD700 }));
    safetyLine.position.set(0, 1.05, 13.5);
    stationGroup.add(safetyLine);

    // Lamp posts
    const lampMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xffffcc });
    for (let x = -12; x <= 12; x += 12) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 8, 8), lampMat);
      pole.position.set(x, 4, 12);
      stationGroup.add(pole);
      const lampHead = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 1.5), lampMat);
      lampHead.position.set(x, 8.5, 12);
      stationGroup.add(lampHead);
      const glow = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), glowMat);
      glow.position.set(x, 7.5, 12);
      stationGroup.add(glow);
      // Add point light
      const light = new THREE.PointLight(0xffffaa, 0.5, 15);
      light.position.set(x, 7.5, 12);
      stationGroup.add(light);
    }

    // Station sign
    const signMat = new THREE.MeshStandardMaterial({ color: 0x2d4a2d });
    const sign = new THREE.Mesh(new THREE.BoxGeometry(8, 2, 0.3), signMat);
    sign.position.set(0, 11, 6.2);
    stationGroup.add(sign);

    // Position station outside the track
    stationGroup.position.set(0, 0, -55);
    this._scene3d.add(stationGroup);

    // Add some benches on platform
    const benchMat = new THREE.MeshStandardMaterial({ color: 0x3d2817 });
    for (let x = -8; x <= 8; x += 8) {
      const benchSeat = new THREE.Mesh(new THREE.BoxGeometry(4, 0.3, 1.2), benchMat);
      benchSeat.position.set(x, 1.8, -45);
      this._scene3d.add(benchSeat);
      const benchBack = new THREE.Mesh(new THREE.BoxGeometry(4, 1.5, 0.2), benchMat);
      benchBack.position.set(x, 2.5, -45.5);
      this._scene3d.add(benchBack);
      // Bench legs
      for (let lx = -1.5; lx <= 1.5; lx += 3) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.5, 0.2), benchMat);
        leg.position.set(x + lx, 1, -45);
        this._scene3d.add(leg);
      }
    }

    // Add a few snowmen near the station
    this._createSnowman(-25, -50);
    this._createSnowman(28, -48);
  }

  _createSnowman(x, z) {
    const THREE = window.THREE;
    const snowMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
    const snowman = new THREE.Group();

    // Body spheres
    const bottom = new THREE.Mesh(new THREE.SphereGeometry(2.5, 16, 16), snowMat);
    bottom.position.y = 2.5;
    snowman.add(bottom);

    const middle = new THREE.Mesh(new THREE.SphereGeometry(1.8, 16, 16), snowMat);
    middle.position.y = 6;
    snowman.add(middle);

    const head = new THREE.Mesh(new THREE.SphereGeometry(1.2, 16, 16), snowMat);
    head.position.y = 8.5;
    snowman.add(head);

    // Carrot nose
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.2, 1, 8), new THREE.MeshStandardMaterial({ color: 0xff6600 }));
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, 8.5, 1.3);
    snowman.add(nose);

    // Coal eyes
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), eyeMat);
    eyeL.position.set(-0.4, 8.8, 1);
    snowman.add(eyeL);
    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), eyeMat);
    eyeR.position.set(0.4, 8.8, 1);
    snowman.add(eyeR);

    // Top hat
    const hatMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.2, 16), hatMat);
    hatBrim.position.y = 9.5;
    snowman.add(hatBrim);
    const hatTop = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1.5, 16), hatMat);
    hatTop.position.y = 10.3;
    snowman.add(hatTop);

    // Buttons
    for (let y = 4.5; y <= 6.5; y += 0.8) {
      const button = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), eyeMat);
      button.position.set(0, y, 1.7);
      snowman.add(button);
    }

    snowman.position.set(x, 0, z);
    this._scene3d.add(snowman);
  }

  _createSnow3D() {
    const THREE = window.THREE;
    const particleCount = 2000;
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
      positions.push(Math.random() * 300 - 150, Math.random() * 200, Math.random() * 300 - 150);
      velocities.push((Math.random() - 0.5) * 0.3, Math.random() * -0.8 - 0.3, (Math.random() - 0.5) * 0.3);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.userData.velocities = velocities;
    const material = new THREE.PointsMaterial({ color: 0xffffff, size: 1, transparent: true, opacity: 0.8 });
    this._snowSystem = new THREE.Points(geometry, material);
    this._scene3d.add(this._snowSystem);
  }

  _animate3D() {
    if (!this._scene3d || !this._renderer3d) return;

    const animate = () => {
      this._animationId3d = requestAnimationFrame(animate);

      // Update train position
      if (this._trainSpeed3d > 0) {
        const speedFactor = (this._trainSpeed3d / 100) * 0.002;
        if (this._trainDirection3d) {
          this._trainProgress += speedFactor;
        } else {
          this._trainProgress -= speedFactor;
        }
        if (this._trainProgress > 1) this._trainProgress -= 1;
        if (this._trainProgress < 0) this._trainProgress += 1;
      }

      // Position train cars - always face forward on track, only movement direction changes
      this._trainCars.forEach(car => {
        let carProg = this._trainProgress - car.offset;
        if (carProg < 0) carProg += 1;
        if (carProg > 1) carProg -= 1;
        const position = this._trainPath.getPointAt(carProg);
        car.mesh.position.copy(position);
        
        // Always look ahead on track (train orientation stays the same)
        let lookProg = carProg + 0.002;
        if (lookProg > 1) lookProg -= 1;
        const lookAtPos = this._trainPath.getPointAt(lookProg);
        car.mesh.lookAt(lookAtPos);
      });

      // Update smoke
      if (this._trainSpeed3d > 0) {
        this._updateSmoke3D();
      }

      // Update snow
      this._updateSnow3D();

      // Fixed camera position - no rotation
      this._renderer3d.render(this._scene3d, this._camera3d);
    };

    animate();
  }

  _updateSmoke3D() {
    const THREE = window.THREE;
    if (!this._trainCars || this._trainCars.length === 0) return;

    const engine = this._trainCars[0].mesh;
    const chance = 0.7 - (this._trainSpeed3d / 100) * 0.5;
    
    if (Math.random() > chance) {
      const stackOffset = new THREE.Vector3(0, 8.5, 7);
      stackOffset.applyMatrix4(engine.matrixWorld);
      
      const particle = {
        mesh: new THREE.Mesh(
          new THREE.SphereGeometry(0.5 + Math.random() * 0.3, 6, 6),
          new THREE.MeshBasicMaterial({ color: 0xcccccc, transparent: true, opacity: 0.4 })
        ),
        life: 1.0,
        velocity: new THREE.Vector3(0, 0.2, 0)
      };
      particle.mesh.position.copy(stackOffset);
      this._scene3d.add(particle.mesh);
      this._particles3d.push(particle);
    }

    for (let i = this._particles3d.length - 1; i >= 0; i--) {
      const p = this._particles3d[i];
      p.life -= 0.02;
      p.mesh.position.add(p.velocity);
      p.mesh.scale.multiplyScalar(1.02);
      p.mesh.material.opacity = p.life * 0.4;
      if (p.life <= 0) {
        this._scene3d.remove(p.mesh);
        this._particles3d.splice(i, 1);
      }
    }
  }

  _updateSnow3D() {
    if (!this._snowSystem) return;
    const positions = this._snowSystem.geometry.attributes.position.array;
    const velocities = this._snowSystem.geometry.userData.velocities;
    for (let i = 0; i < positions.length; i += 3) {
      positions[i] += velocities[i];
      positions[i + 1] += velocities[i + 1];
      positions[i + 2] += velocities[i + 2];
      if (positions[i + 1] < 0) {
        positions[i] = Math.random() * 300 - 150;
        positions[i + 1] = 200;
        positions[i + 2] = Math.random() * 300 - 150;
      }
    }
    this._snowSystem.geometry.attributes.position.needsUpdate = true;
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
