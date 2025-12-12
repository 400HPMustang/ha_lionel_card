# Lionel Train Card

A custom Lovelace card for controlling Lionel LionChief trains in Home Assistant.

![Lionel Train Card](https://raw.githubusercontent.com/BlackandBlue1908/lionel-train-card/main/images/card-preview.png)

## Features

- **Large throttle slider** with color gradient (green → yellow → red)
- **Direction controls** (Forward/Reverse)
- **Quick access buttons** for Horn, Bell, Lights
- **Emergency Stop** button
- **Connection status** indicator
- **Disconnect** button

## Requirements

This card requires the [Lionel Train Controller](https://github.com/BlackandBlue1908/ha_lionel_controller) integration to be installed.

## Installation

### HACS (Recommended)

1. Open HACS in Home Assistant
2. Go to "Frontend"
3. Click the three dots menu and select "Custom repositories"
4. Add `https://github.com/BlackandBlue1908/lionel-train-card` as a "Lovelace"
5. Install "Lionel Train Card"
6. Refresh your browser (Ctrl+F5)

### Manual Installation

1. Download `lionel-train-card.js` from the [latest release](https://github.com/BlackandBlue1908/lionel-train-card/releases)
2. Copy it to `/config/www/lionel-train-card.js`
3. Add the resource in Home Assistant:
   - Go to **Settings → Dashboards → Resources**
   - Click **Add Resource**
   - URL: `/local/lionel-train-card.js`
   - Resource type: JavaScript Module
4. Refresh your browser

## Usage

Add the card to your dashboard:

```yaml
type: custom:lionel-train-card
entity: number.lc_xxxx_throttle
name: My Lionel Train
```

### Configuration Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `entity` | string | Yes | The throttle entity ID (e.g., `number.lc_1234_throttle`) |
| `name` | string | No | Display name for the card (default: "Lionel Train") |

### Finding Your Entity

1. Go to **Developer Tools → States**
2. Search for your train's throttle entity (it ends with `_throttle`)
3. Use that entity ID in the card configuration

## Card Controls

| Control | Description |
|---------|-------------|
| **Throttle** | Slide to control train speed (0-100%) |
| **Forward** | Set train direction to forward |
| **Reverse** | Set train direction to reverse |
| **Lights** | Toggle train lights on/off |
| **Horn** | Sound the horn |
| **Bell** | Ring the bell |
| **Disconnect** | Disconnect from the train |
| **Emergency Stop** | Immediately stop the train |

## Screenshots

*Coming soon*

## Support

If you encounter issues, please [open an issue](https://github.com/BlackandBlue1908/lionel-train-card/issues) on GitHub.

## License

MIT License - see [LICENSE](LICENSE) for details.
