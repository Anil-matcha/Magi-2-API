"""Magi 2 text-to-video / image-to-video through Muapi.

Usage: MUAPI_API_KEY=... python magi2.py "prompt" [--image URL] [--resolution 1080p] [--aspect-ratio 16:9]
"""
import argparse
import os
import sys
import time

import requests

BASE = "https://api.muapi.ai/api/v1"


def main():
    p = argparse.ArgumentParser()
    p.add_argument("prompt")
    p.add_argument("--image", help="image URL; switches to magi-2-image-to-video")
    p.add_argument("--resolution", default="1080p", choices=["720p", "1080p"])
    p.add_argument("--aspect-ratio", default="16:9", choices=["16:9", "9:16", "1:1"])
    args = p.parse_args()

    key = os.environ.get("MUAPI_API_KEY")
    if not key:
        sys.exit("Set MUAPI_API_KEY")
    headers = {"x-api-key": key, "Content-Type": "application/json"}

    payload = {"prompt": args.prompt, "resolution": args.resolution, "aspect_ratio": args.aspect_ratio}
    endpoint = "magi-2-text-to-video"
    if args.image:
        endpoint = "magi-2-image-to-video"
        payload["image_url"] = args.image

    r = requests.post(f"{BASE}/{endpoint}", json=payload, headers=headers, timeout=60)
    r.raise_for_status()
    request_id = r.json()["request_id"]
    print("request_id:", request_id)

    while True:
        res = requests.get(f"{BASE}/predictions/{request_id}/result", headers=headers, timeout=60)
        res.raise_for_status()
        data = res.json()
        status = data.get("status")
        print("status:", status)
        if status == "completed":
            print("video:", data["outputs"][0])
            return
        if status == "failed":
            sys.exit(f"failed: {data}")
        time.sleep(5)


if __name__ == "__main__":
    main()
