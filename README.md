# Guardian Alerts Card (`ha-guardian-alerts-card`)

[![HACS Custom](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://github.com/hacs/integration)
[![GitHub Release](https://img.shields.io/github/v/release/tadbt/ha-guardian-alerts-card)](https://github.com/tadbt/ha-guardian-alerts-card/releases)
[![Built with Gemini](https://img.shields.io/badge/Built%20with-Gemini-8E75B2?logo=googlegemini&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

A modern, origami-inspired security and status alert banner card for **Home Assistant Lovelace**. Designed with a **"Half-and-Half" Script-Driven Architecture**: the card watches lightweight entity triggers and delegates complex alert decisions to your Home Assistant Scripts.

> **Tag:** `built-with-gemini`

---

## ✨ Features (v2.0.0)

- **Script-Driven Alert Decisions (`script` + `response_variable`)**:
  - Watch a primary `entity` (and optional `state` or additional watched `entities`).
  - When triggered, the card calls your Home Assistant `script.*` with `{ entity, state, entities, states }`.
  - Your script uses native Home Assistant conditions and returns `{ message: "..." }` (plus optional dynamic `template`, `priority`, or `icon` overrides). If it returns an empty message (`""`), the alert stays hidden.
- **Simple Static Rules Included**: For straightforward 1-entity checks, omit `script` and provide a static `message` directly on the rule.
- **Multi-Entity Watching (`entities`)**: Re-evaluate a rule's decision script automatically whenever any related entity changes state (e.g., watch both `binary_sensor.garage_door` and `person.jack`).
- **Priority Ordering (`P1` → `P4`)**: Active alerts automatically sort by priority (`P1` at the top down to `P4`).
- **Default "All Secured" Banner**: Displays a calm green `SECURE` banner (`All Secured` with `mdi:shield-check`) when no alerts are active, or hides completely when `show_default_alert: false`.
- **Origami Geometric Design & Slow Flashing Animations**:
  - `SECURE`: Green, static origami banner (`mdi:shield-check`).
  - `INFO`: Blue, static origami banner (`mdi:information-outline`).
  - `WARNING`: Amber, slow `3.8s` breathing flash (`mdi:alert`).
  - `CRITICAL`: Red, urgent `2.6s` slow pulse (`mdi:shield-alert`).
- **Interactive Tap & Hold Actions**: Built-in **Dismiss** (`action: dismiss`), **30-Minute Snooze** (`action: snooze_30m`), `more-info`, `toggle`, or custom Home Assistant service calls.
- **Native Home Assistant Visual Editor (`<ha-form>`)**: Configure priority, watched entities, trigger states, decision scripts (`domain: script`), templates, and tap actions visually.

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

### 1. Card YAML Configuration

You can configure the card using the **Visual Editor** (**+ Add Card → Guardian Alerts Card**) or via YAML:

```yaml
type: custom:guardian-alerts-card
show_default_alert: true
default_alert:
  template: SECURE
  message: "All Secured"
  icon: mdi:shield-check
alerts:
  # 1. Script-Driven Rule + Multi-Entity Watch (Option A + B)
  # Calls `script.check_garage_alert` when garage door is "on" (and re-checks when person.jack changes)
  - entity: binary_sensor.garage_entry_door
    entities:
      - person.jack
    state: "on"
    script: script.check_garage_alert
    priority: P2
    template: WARNING
    icon: mdi:garage-open
    tap_action:
      action: dismiss

  # 2. Simple Static Rule (No script needed)
  - entity: alarm_control_panel.main_alarm
    state: "triggered"
    priority: P1
    template: CRITICAL
    message: "Perimeter Intrusion Detected! ({{ state }})"
    tap_action:
      action: call-service
      service: alarm_control_panel.alarm_disarm

  # 3. Informational Banner with 30-Minute Snooze on Tap
  - entity: binary_sensor.front_porch_package
    state: "on"
    priority: P3
    template: INFO
    message: "Package waiting on front porch"
    tap_action:
      action: snooze_30m
```

### 2. Home Assistant Decision Script Example (`scripts.yaml`)

When the card calls a rule's `script`, it automatically passes:
- `entity`: Primary entity ID (e.g., `"binary_sensor.garage_entry_door"`)
- `state`: Current state of the primary entity (e.g., `"on"`)
- `entities`: Array of all watched entity IDs on the rule
- `states`: Map of `{ [entity_id]: state }` for all watched entities

Your script uses Home Assistant's `stop` action with `response_variable` to return an object containing `message` (and optional `template`, `priority`, `icon`, `icon_color`, or `active`):

```yaml
script:
  check_garage_alert:
    alias: "Check Garage Alert Decision"
    fields:
      entity:
        description: "Primary triggered entity"
      state:
        description: "Current state of primary entity"
    sequence:
      # Example: Escalate to CRITICAL P1 if nobody is home
      - if:
          - condition: state
            entity_id: person.jack
            state: "not_home"
        then:
          - variables:
              decision:
                message: "Garage door is OPEN while nobody is home!"
                template: "CRITICAL"
                priority: "P1"
          - stop: "Return critical alert"
            response_variable: decision

      # Otherwise return a standard WARNING (or return message: "" to suppress the alert)
      - variables:
          decision:
            message: "Garage door is open"
            template: "WARNING"
            priority: "P2"
      - stop: "Return warning alert"
        response_variable: decision
```

> **Tip:** To suppress an alert from showing, return `message: ""` (or `active: false`) in your script's `response_variable`.

---

## 📖 Alert Rule Options (`alerts`)

| Key | Type | Required | Default | Description |
| :--- | :--- | :---: | :--- | :--- |
| `priority` | `'P1' \| 'P2' \| 'P3' \| 'P4'` | No | `'P2'` | Priority level (`P1` highest to `P4` lowest). Can also be overridden dynamically by `script`. |
| `entity` | `string` | **Yes** | — | Primary Home Assistant entity ID to monitor (e.g., `binary_sensor.garage_door`). |
| `entities` | `string[]` | No | — | Additional watched entity IDs. Whenever any watched entity changes state while triggered, `script` is re-evaluated. |
| `state` / `states` | `string \| number \| Array<string \| number>` | No* | — | Trigger state(s) (e.g., `"on"`, `["open", "opening"]`). *Optional if `script` is set (when omitted, `script` runs on every state change of the watched entities). |
| `script` | `string` | No | — | Home Assistant script entity ID (e.g., `script.check_garage_alert`) called with `return_response: true`. |
| `script_data` | `Record<string, any>` | No | — | Optional extra variables passed to `script` alongside `{ entity, state, entities, states }`. |
| `message` | `string` | No* | — | Alert text displayed on the banner (supports `{{ state }}` and `{{ entity }}`). *Required if `script` is not set. |
| `template` | `'SECURE' \| 'INFO' \| 'WARNING' \| 'CRITICAL'` | No | `'INFO'` | Controls the color palette, default icon, and slow-flashing animation. Can be overridden by `script`. |
| `icon` | `string` | No | Template default | Custom icon (e.g., `mdi:garage-open`). Can be overridden by `script`. |
| `icon_color` | `string` | No | Theme blend | Optional CSS color override for this alert's icon (e.g., `"#22d3ee"`). |
| `tap_action` | `ActionOrServiceInput` | No | `more-info` | Supports `{ action: 'dismiss' }`, `{ action: 'snooze_30m' }`, `more-info`, `toggle`, `none`, or custom service calls. |
| `hold_action` | `ActionOrServiceInput` | No | `more-info` | Action or list of service calls triggered after a `500ms` press-and-hold. |

---

## 🎨 Theme Variables

The card automatically adapts to your active Home Assistant theme using these CSS variables:

| CSS Variable | Purpose |
| :--- | :--- |
| `--ha-card-background` / `--card-background-color` | Base surface mixed with the alert accent color for origami facets. |
| `--success-color` | Accent & bottom ribbon color for `SECURE` banners. |
| `--info-color` | Accent & bottom ribbon color for `INFO` alerts. |
| `--warning-color` | Accent, bottom ribbon & slow-flash color for `WARNING` alerts. |
| `--error-color` | Accent, bottom ribbon & slow-flash color for `CRITICAL` alerts. |
| `--state-icon-color` / `--paper-item-icon-color` | Blended with the alert accent to color the icon inside the origami medallion. |
| `--guardian-icon-color` | Optional global theme variable to override all icon colors in the card. |

---

## 🧪 Local Development & Testing

### 1. Fast Browser Harness (Vite Hot Reload)
Includes interactive state toggles, a simulated `script.check_garage_alert` decision runner, a live theme switcher, and the embedded Visual Editor:
```bash
npm install
npm run dev
```

### 2. Throwaway Home Assistant Container (Docker)
Builds the production bundle and launches a pre-configured `home-assistant:stable` Docker container at `http://localhost:8123` with test entities, themes, and `script.check_garage_alert` pre-loaded:
```bash
npm run test:ha
```

### 3. Production Build
Outputs the standalone ES module to `dist/guardian-alerts-card.js`:
```bash
npm run build
```
