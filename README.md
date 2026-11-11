# Guardian Alerts Card (`ha-guardian-alerts-card`)

[![HACS Custom](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://github.com/hacs/integration)
[![GitHub Release](https://img.shields.io/github/v/release/tadbt/ha-guardian-alerts-card)](https://github.com/tadbt/ha-guardian-alerts-card/releases)
[![Built with Gemini](https://img.shields.io/badge/Built%20with-Gemini-8E75B2?logo=googlegemini&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

A modern, origami-inspired security and status alert banner card for **Home Assistant Lovelace**. Designed to stay completely hidden when everything is normal and surface high-visibility, theme-aware banners when monitored entities enter an alert state.

> **Tag:** `built-with-gemini`

---

## ✨ Features

- **Origami Geometric Design**: Multi-faceted paper crease gradients, a geometric faceted icon medallion, angled severity badge, and a colored bottom alert ribbon/tape strip.
- **Default "All Secured" Banner**: Automatically displays a calm green `SECURE` banner (`All Secured` with a `mdi:shield-check` shield icon) when no alert rules are active, and switches to active alert banners as soon as a sensor triggers.
- **Slow Flashing Animations**:
  - `SECURE`: Green, static origami banner with shield icon (`mdi:shield-check`).
  - `INFO`: Blue, static origami banner (`mdi:information-outline`).
  - `WARNING`: Amber, slow `3.8s` breathing flash across the surface facets and icon (`mdi:alert`).
  - `CRITICAL`: Red, urgent `2.6s` slow pulse across the surface, inner glow, and icon (`mdi:shield-alert`).
- **Theme-Aware Colors & Icons**: Automatically blends with your active Home Assistant theme (`--ha-card-background`, `--success-color`, `--info-color`, `--warning-color`, `--error-color`, `--state-icon-color`) via CSS `color-mix()`.
- **Multi-Service Actions (`on_active`, `tap_action`, `hold_action`)**: Trigger multiple services simultaneously when an alert transitions to active or when tapped/held—for example, activating a lighting `scene` **and** calling a TTS announcement `script` with `{{ message }}`.
- **Native Home Assistant Visual Editor (`<ha-form>`)**: Search entities/sensors, icons, service calls (`domain.service`), and service targets directly using Home Assistant's built-in form selectors.

---

## 📦 Installation

### Option 1: HACS (Custom Repository)

1. Open **HACS** in your Home Assistant sidebar.
2. Click the three dots menu (**⋮**) in the top-right corner and select **Custom repositories**.
3. Enter:
   - **Repository:** `https://github.com/tadbt/ha-guardian-alerts-card`
   - **Category:** **Dashboard**
4. Click **Add**, then find **Guardian Alerts Card** in HACS and click **Download**.
5. Reload your browser when prompted.

### Option 2: Manual Installation

1. Download `guardian-alerts-card.js` from the [latest GitHub Release](https://github.com/tadbt/ha-guardian-alerts-card/releases).
2. Copy it into your Home Assistant `/config/www/` directory.
3. Add the resource under **Settings → Dashboards → ⋮ → Resources**:
   - **URL:** `/local/guardian-alerts-card.js`
   - **Resource type:** `JavaScript Module`

---

## ⚙️ Configuration

You can configure the card using the **Visual Editor** (**+ Add Card → Guardian Alerts Card**) or via YAML:

```yaml
type: custom:guardian-alerts-card
alerts:
  - entity: binary_sensor.garage_entry_door
    state: "on"
    template: WARNING
    message: "Garage door is open"
    icon: mdi:garage-open
    on_active:
      - service: scene.turn_on
        target:
          entity_id: scene.warning_lights
      - service: script.tts_announce
        service_data:
          message: "{{ message }}"
          media_player: media_player.kitchen_speaker
    tap_action:
      - service: cover.close_cover
        target:
          entity_id: cover.garage_door

  - entity: alarm_control_panel.main_alarm
    state: "triggered"
    template: CRITICAL
    message: "Perimeter Intrusion Detected!"
    # Omit `icon` to use the default CRITICAL icon (mdi:shield-alert)
    on_active:
      - service: scene.turn_on
        target:
          entity_id: scene.emergency_red_lights
      - service: script.tts_announce
        service_data:
          message: "Critical alert: {{ message }}"
    hold_action:
      action: more-info

  - entity: alarm_control_panel.main_alarm
    state: "disarmed"
    template: INFO
    message: "Security system is currently disarmed"
```

---

## 📖 Alert Rule Options (`alerts`)

| Key | Type | Required | Default | Description |
| :--- | :--- | :---: | :--- | :--- |
| `entity` | `string` | **Yes** | — | Home Assistant entity ID to monitor (e.g., `binary_sensor.front_door`). |
| `state` | `string` | **Yes** | — | State value that activates the banner (case-insensitive, e.g., `"on"`, `"triggered"`). |
| `message` | `string` | **Yes** | — | Alert text displayed on the banner. |
| `template` | `'INFO' \| 'WARNING' \| 'CRITICAL'` | No | `'INFO'` | Controls the color palette, default icon, and slow-flashing behavior. |
| `icon` | `string` | No | Template default | Custom icon (e.g., `mdi:garage-open`). Defaults to `mdi:information-outline` (`INFO`), `mdi:alert` (`WARNING`), or `mdi:shield-alert` (`CRITICAL`). |
| `icon_color` | `string` | No | Theme blend | Optional CSS color override for this alert's icon (e.g., `"#22d3ee"`). |
| `on_active` | `ActionOrServiceInput` | No | — | One or more service calls executed when the rule transitions from inactive to active. |
| `tap_action` | `ActionOrServiceInput` | No | `more-info` | Action or list of service calls triggered on tap/click. |
| `hold_action` | `ActionOrServiceInput` | No | `more-info` | Action or list of service calls triggered after a `500ms` press-and-hold. |

### Template Variables in `service_data` / `data`
Inside any service call's `service_data` (or `data`), string values support:
- `{{ message }}` — Replaced with the alert rule's `message`.
- `{{ entity }}` — Replaced with the alert rule's `entity`.

---

## 🎨 Theme Variables

The card automatically adapts to your active Home Assistant theme using these CSS variables:

| CSS Variable | Purpose |
| :--- | :--- |
| `--ha-card-background` / `--card-background-color` | Base surface mixed with the alert accent color for origami facets. |
| `--info-color` | Accent & bottom ribbon color for `INFO` alerts. |
| `--warning-color` | Accent, bottom ribbon & slow-flash color for `WARNING` alerts. |
| `--error-color` | Accent, bottom ribbon & slow-flash color for `CRITICAL` alerts. |
| `--state-icon-color` / `--paper-item-icon-color` | Blended with the alert accent to color the icon inside the origami medallion. |
| `--guardian-icon-color` | Optional global theme variable to override all icon colors in the card. |

---

## 🧪 Local Development & Testing

### 1. Fast Browser Harness (Vite Hot Reload)
Includes interactive state toggles, a live theme switcher, service call logs, and the embedded Visual Editor:
```bash
npm install
npm run dev
```

### 2. Throwaway Home Assistant Container (Docker)
Builds the production bundle and launches a pre-configured `home-assistant:stable` Docker container at `http://localhost:8123` with test entities, themes, scenes, and a sample TTS script pre-loaded:
```bash
npm run test:ha
```

### 3. Production Build
Outputs the standalone ES module to `dist/guardian-alerts-card.js`:
```bash
npm run build
```

