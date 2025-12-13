/**
 * Lionel Train Controller Card
 * A custom Lovelace card for controlling Lionel LionChief trains
 * https://github.com/BlackandBlue1908/ha_lionel_card
 */

class LionelTrainCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  set hass(hass) {
    this._hass = hass;
    this._updateCard();
  }

  setConfig(config) {
    this._config = config || {};
    this._deviceName = this._config.device || '';
    if (this._deviceName) {
      this._render();
    }
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
              <span>Random</span>
            </button>
            <button class="voice-btn" id="btn-announce-ready">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z"/>
              </svg>
              <span>Ready to Roll</span>
            </button>
            <button class="voice-btn" id="btn-announce-hey">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z"/>
              </svg>
              <span>Hey There</span>
            </button>
            <button class="voice-btn" id="btn-announce-squeaky">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z"/>
              </svg>
              <span>Squeaky</span>
            </button>
            <button class="voice-btn" id="btn-announce-water">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z"/>
              </svg>
              <span>Water & Fire</span>
            </button>
            <button class="voice-btn" id="btn-announce-freight">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z"/>
              </svg>
              <span>Fastest Freight</span>
            </button>
            <button class="voice-btn" id="btn-announce-penna">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z"/>
              </svg>
              <span>Penna Flyer</span>
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
    if (!this._hass || !this._config) return;

    // Update connection status
    const connectionEntity = this._getEntityId('binary_sensor', 'connected');
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
    if (throttleState && throttleEl && speedEl) {
      const value = parseFloat(throttleState.state) || 0;
      throttleEl.value = value;
      speedEl.textContent = `${Math.round(value)}%`;
    }

    // Update lights button state
    const lightsEntity = this._getEntityId('switch', 'lights');
    const lightsState = this._hass.states[lightsEntity];
    const lightsBtn = this.shadowRoot.getElementById('btn-lights');
    if (lightsState && lightsBtn) {
      if (lightsState.state === 'on') {
        lightsBtn.classList.add('active');
      } else {
        lightsBtn.classList.remove('active');
      }
    }
  }

  getCardSize() {
    return 7;
  }

  static getConfigElement() {
    return document.createElement('lionel-train-card-editor');
  }

  static getStubConfig() {
    return {
      device: 'Polar Express',
      name: 'Lionel Train'
    };
  }
}

// Card Editor
class LionelTrainCardEditor extends HTMLElement {
  set hass(hass) {
    this._hass = hass;
    // Re-render when hass is updated to populate device list
    if (this._config) {
      this._render();
    }
  }

  setConfig(config) {
    this._config = config || {};
    if (this._hass) {
      this._render();
    }
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
    this._rendered = true;
    const devices = this._getLionelDevices();
    
    const deviceOptions = devices.length > 0 
      ? devices.map(d => `<option value="${d}" ${this._config.device === d ? 'selected' : ''}>${d}</option>`).join('')
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
          <input type="text" id="name" value="${this._config.name || ''}" placeholder="Leave blank to use device name">
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
