#!/usr/bin/env bash
# Submit a Magi 2 text-to-video job and poll until it finishes.
# Usage: MUAPI_API_KEY=... bash examples/curl.sh
# Price: $0.10 per second of `duration` (4-30). Swap the endpoint for magi-2-image-to-video
# (add "image_url") or magi-2-reference-to-video (add "images_list": [...]).
set -euo pipefail
: "${MUAPI_API_KEY:?Set MUAPI_API_KEY}"
BASE="https://api.muapi.ai/api/v1"

resp=$(curl -sS -X POST "$BASE/magi-2-text-to-video" \
  -H "Content-Type: application/json" -H "x-api-key: $MUAPI_API_KEY" \
  -d '{"prompt":"A street musician plays violin in a rainy neon-lit alley, camera slowly pushing in","aspect_ratio":"16:9","duration":10}')
id=$(printf '%s' "$resp" | python3 -c 'import sys,json; print(json.load(sys.stdin)["request_id"])')
echo "request_id: $id"

while true; do
  out=$(curl -sS "$BASE/predictions/$id/result" -H "x-api-key: $MUAPI_API_KEY")
  status=$(printf '%s' "$out" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("status",""))')
  echo "status: $status"
  [ "$status" = "completed" ] && { echo "$out"; break; }
  [ "$status" = "failed" ] && { echo "$out"; exit 1; }
  sleep 5
done
