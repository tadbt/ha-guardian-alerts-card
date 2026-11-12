#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HA_CONFIG_DIR="${ROOT_DIR}/.ha-test-config"
CONTAINER_NAME="ha-guardian-test"
PORT="${HA_PORT:-8123}"
CACHE_BUST="$(date +%s)"

echo "==> 1. Building guardian-alerts-card bundle..."
cd "${ROOT_DIR}"
npm run build

echo "==> 2. Preparing throwaway Home Assistant config in ${HA_CONFIG_DIR}..."
mkdir -p "${HA_CONFIG_DIR}/www"
cp "${ROOT_DIR}/dist/guardian-alerts-card.js" "${HA_CONFIG_DIR}/www/guardian-alerts-card.js"

cat > "${HA_CONFIG_DIR}/configuration.yaml" <<EOF
default_config:

# Load the custom card module globally on every dashboard
frontend:
  extra_module_url:
    - /local/guardian-alerts-card.js?v=${CACHE_BUST}
  themes:
    Origami Neon:
      ha-card-background: "#160d2e"
      primary-text-color: "#f8fafc"
      state-icon-color: "#22d3ee"
      success-color: "#10b981"
      info-color: "#06b6d4"
      warning-color: "#facc15"
      error-color: "#f43f5e"
    Origami Light:
      ha-card-background: "#ffffff"
      primary-text-color: "#0f172a"
      state-icon-color: "#334155"
      success-color: "#16a34a"
      info-color: "#0284c7"
      warning-color: "#d97706"
      error-color: "#dc2626"

# Test helper toggles for the card
input_boolean:
  garage_entry_door:
    name: Simulate Garage Entry Door
    initial: true
    icon: mdi:garage-open
  perimeter_intrusion:
    name: Simulate Perimeter Intrusion
    initial: true
    icon: mdi:shield-alert
  alert_scene_indicator:
    name: Alert Scene Activated
    initial: false
    icon: mdi:lightbulb-alert

template:
  - binary_sensor:
      - name: "Garage Entry Door"
        unique_id: garage_entry_door
        device_class: garage_door
        state: "{{ is_state('input_boolean.garage_entry_door', 'on') }}"

alarm_control_panel:
  - platform: manual
    name: Main Alarm
    code_arm_required: false
    delay_time: 0
    arming_time: 0
    trigger_time: 120

scene:
  - name: Security Alert Lights
    id: security_alert_lights
    entities:
      input_boolean.alert_scene_indicator: "on"

script:
  tts_announce:
    alias: "TTS Broadcast Script (Test)"
    fields:
      message:
        description: "The TTS message to broadcast"
        example: "Intrusion detected"
    sequence:
      - action: persistent_notification.create
        data:
          title: "TTS Script Triggered"
          message: "Broadcasting TTS: {{ message }}"

lovelace:
  dashboards:
    lovelace-guardian:
      mode: yaml
      title: Guardian Alerts
      icon: mdi:shield-alert
      show_in_sidebar: true
      filename: ui-lovelace.yaml
EOF

cat > "${HA_CONFIG_DIR}/ui-lovelace.yaml" <<'EOF'
title: Guardian Alerts Sandbox
views:
  - title: Test View
    path: default_view
    cards:
      - type: entities
        title: Test Controls (Toggle States Here)
        entities:
          - entity: input_boolean.garage_entry_door
          - entity: input_boolean.perimeter_intrusion
          - entity: input_boolean.alert_scene_indicator
          - entity: binary_sensor.garage_entry_door
          - entity: alarm_control_panel.main_alarm

      - type: custom:guardian-alerts-card
        alerts:
          - priority: P1
            entity: input_boolean.perimeter_intrusion
            state: "on"
            template: CRITICAL
            message: "Perimeter Intrusion Detected! (Tap to dismiss)"
            tap_action:
              action: dismiss
          - priority: P2
            entity: binary_sensor.garage_entry_door
            state: "on"
            template: WARNING
            message: "Garage door opened (Tap to snooze 30m)"
            icon: mdi:garage-open
            tap_action:
              action: snooze_30m
          - priority: P3
            entity: alarm_control_panel.main_alarm
            state: "disarmed"
            template: INFO
            message: "Main Alarm is Disarmed (Static Origami INFO)"
EOF

OVERVIEW_STORAGE_JSON='{
  "version": 1,
  "minor_version": 1,
  "key": "lovelace",
  "data": {
    "config": {
      "title": "Guardian Alerts Sandbox",
      "views": [
        {
          "title": "Test View",
          "path": "default_view",
          "cards": [
            {
              "type": "entities",
              "title": "Test Controls (Toggle States Here)",
              "entities": [
                "input_boolean.garage_entry_door",
                "input_boolean.perimeter_intrusion",
                "binary_sensor.garage_entry_door",
                "alarm_control_panel.main_alarm"
              ]
            },
            {
              "type": "custom:guardian-alerts-card",
              "alerts": [
                {
                  "priority": "P1",
                  "entity": "input_boolean.perimeter_intrusion",
                  "state": "on",
                  "template": "CRITICAL",
                  "message": "Perimeter Intrusion Detected! (Tap to dismiss)",
                  "tap_action": { "action": "dismiss" }
                },
                {
                  "priority": "P2",
                  "entity": "binary_sensor.garage_entry_door",
                  "state": "on",
                  "template": "WARNING",
                  "message": "Garage door opened (Tap to snooze 30m)",
                  "icon": "mdi:garage-open",
                  "tap_action": { "action": "snooze_30m", "snooze_minutes": 30 }
                },
                {
                  "priority": "P3",
                  "entity": "alarm_control_panel.main_alarm",
                  "state": "disarmed",
                  "template": "INFO",
                  "message": "Main Alarm is Disarmed (Static Origami INFO)"
                }
              ]
            }
          ]
        }
      ]
    }
  }
}'

# Stop any existing container with the same name
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "==> Removing previous ${CONTAINER_NAME} container..."
  docker rm -f "${CONTAINER_NAME}" >/dev/null
fi

# Write Overview dashboard into .storage (using container permissions in case .storage is owned by root)
docker run --rm \
  -v "${HA_CONFIG_DIR}:/config" \
  --entrypoint sh \
  ghcr.io/home-assistant/home-assistant:stable \
  -c "mkdir -p /config/.storage && printf '%s\n' '${OVERVIEW_STORAGE_JSON}' > /config/.storage/lovelace && printf '%s\n' '${OVERVIEW_STORAGE_JSON/\"key\": \"lovelace\"/\"key\": \"lovelace.lovelace\"}' > /config/.storage/lovelace.lovelace"

echo "==> 3. Starting throwaway Home Assistant container on http://localhost:${PORT} ..."
echo "    -> Overview dashboard and sidebar 'Guardian Alerts' dashboard are preloaded!"
echo "    (Press Ctrl+C to stop and destroy the container)"
docker run --rm -it \
  --name "${CONTAINER_NAME}" \
  -p "${PORT}:8123" \
  -v "${HA_CONFIG_DIR}:/config" \
  -v "${ROOT_DIR}/dist/guardian-alerts-card.js:/config/www/guardian-alerts-card.js:ro" \
  ghcr.io/home-assistant/home-assistant:stable
