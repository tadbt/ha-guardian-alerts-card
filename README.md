# Guardian Alerts Card (`ha-guardian-alerts-card`)

[![HACS Custom](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://github.com/hacs/integration)
[![GitHub Release](https://img.shields.io/github/v/release/tadbt/ha-guardian-alerts-card)](https://github.com/tadbt/ha-guardian-alerts-card/releases)
[![Built with Gemini](https://img.shields.io/badge/Built%20with-Gemini-8E75B2?logo=googlegemini&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

A modern, origami-inspired security and status alert banner card for **Home Assistant Lovelace**. Focused purely on clean alert display: it shows a calm `All Secured` banner when everything is normal, and surfaces high-visibility, priority-sorted banners when monitored entities enter an alert state.

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
- **Time-in-State Delays (`for`)**: Optionally require an entity to remain in its matching state for a configured duration (e.g., `00:05:00`) before showing the banner.
- **Dismiss or Snooze on Tap**: Tap an active alert banner to dismiss it (until the entity clears and re-triggers) or snooze it for 30 minutes.
- **Native Home Assistant Visual Editor (`<ha-form>`)**: Configure priority, alert template, entity, Equal / Not Equal state match, time-in-state delay, icon, message, and tap behavior using Home Assistant's built-in form selectors.

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
  - priority: P1
    template: CRITICAL
    entity: alarm_control_panel.main_alarm
    state: "triggered"
    message: "Perimeter Intrusion Detected!"
    tap_action:
      action: dismiss

  - priority: P2
    template: WARNING
    entity: binary_sensor.garage_entry_door
    state: "on"
    for:
      minutes: 5
    icon: mdi:garage-open
    message: "Garage door has been open for 5+ minutes"
    tap_action:
      action: snooze_30m

  - priority: P3
    template: INFO
    entity: alarm_control_panel.main_alarm
    state: "disarmed"
    message: "Security system is currently disarmed"
```

---

## 📖 Alert Rule Options (`alerts`)

| Key | Type | Required | Default | Description |
| :--- | :--- | :---: | :--- | :--- |
| `priority` | `'P1' \| 'P2' \| 'P3' \| 'P4'` | No | `'P2'` | Priority level (`P1` highest to `P4` lowest). Active alerts and rules are automatically ordered by priority. |
| `template` | `'SECURE' \| 'INFO' \| 'WARNING' \| 'CRITICAL'` | No | `'INFO'` | Controls the color palette, default icon, and slow-flashing behavior. |
| `entity` | `string` | **Yes** | — | Home Assistant entity ID to monitor (e.g., `sensor.temperature`, `person.john`, `binary_sensor.front_door`). |
| `operator` | `'equals' \| 'not_equals' \| 'contains'` | No | `'equals'` | How to compare the entity's state against `state`: **Equal (`=`)** or **Not Equal (`≠`)** in the Visual Editor; `contains` is also supported in YAML. |
| `state` | `string \| number \| Array<string \| number>` | **Yes** | — | Single state/value or list of multiple trigger states (e.g., `"on"`, `["open", "opening"]`, `["armed_away", "armed_home"]`). |
| `for` | `{ hours?, minutes?, seconds? } \| string \| number` | No | `0` (immediate) | How long the entity must stay in the matching state before the alert shows (e.g., `{ minutes: 5 }`, `"00:05:00"`, or `30`). |
| `icon` | `string` | No | Template default | Custom icon (e.g., `mdi:garage-open`). Defaults to `mdi:shield-check` (`SECURE`), `mdi:information-outline` (`INFO`), `mdi:alert` (`WARNING`), or `mdi:shield-alert` (`CRITICAL`). |
| `icon_color` | `string` | No | Theme blend | Optional CSS color override for this alert's icon (e.g., `"#22d3ee"`). |
| `message` | `string` | No | `<entity name> is <state>` | Alert text displayed on the banner (supports `{{ state }}` and `{{ entity }}`). Leave empty to use the automatic text. |
| `tap_action` | `{ action: 'dismiss' \| 'snooze_30m' \| 'none', snooze_minutes?: number }` | No | `{ action: 'dismiss' }` | Dismisses the banner until the state clears, snoozes it for 30 minutes, or does nothing (`none`). |

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
Includes interactive state toggles, a live theme switcher, and the embedded Visual Editor:
```bash
npm install
npm run dev
```

### 2. Throwaway Home Assistant Container (Docker)
Builds the production bundle and launches a pre-configured `home-assistant:stable` Docker container at `http://localhost:8123` with test entities and themes pre-loaded:
```bash
npm run test:ha
```

### 3. Production Build
Outputs the standalone ES module to `dist/guardian-alerts-card.js`:
```bash
npm run build
```
