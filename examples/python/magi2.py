"""Magi 2 text / image / reference to video through Muapi ($0.10 per second of video).

Usage: MUAPI_API_KEY=... python magi2.py "prompt" [--image URL [--last-image URL]] [--reference URL ...]
       [--duration 5] [--aspect-ratio 16:9] [--no-audio] [--seed N]
"""
import argparse
import os
import sys
import time

import requests

BASE = "https://api.muapi.ai/api/v1"
RATIOS = ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"]


def main():
    p = argparse.ArgumentParser()
    p.add_argument("prompt")
    p.add_argument("--image", help="first-frame image URL; switches to magi-2-image-to-video")
    p.add_argument("--last-image", help="optional last-frame image URL (image-to-video only)")
    p.add_argument("--reference", action="append", help="reference image URL, repeatable (up to 10); switches to magi-2-reference-to-video")
    p.add_argument("--duration", type=int, default=5, choices=range(4, 31), metavar="4-30", help="seconds, default 5")
    p.add_argument("--aspect-ratio", choices=RATIOS, help="default 16:9 (image-to-video: closest to the image)")
    p.add_argument("--no-audio", action="store_true", help="generate a silent video (same price)")
    p.add_argument("--seed", type=int)
    args = p.parse_args()
    if args.image and args.reference:
        sys.exit("Use either --image or --reference, not both")

    key = os.environ.get("MUAPI_API_KEY")
    if not key:
        sys.exit("Set MUAPI_API_KEY")
    headers = {"x-api-key": key, "Content-Type": "application/json"}

    payload = {"prompt": args.prompt, "duration": args.duration, "generate_audio": not args.no_audio}
    if args.aspect_ratio:
        payload["aspect_ratio"] = args.aspect_ratio
    if args.seed is not None:
        payload["seed"] = args.seed
    endpoint = "magi-2-text-to-video"
    if args.image:
        endpoint = "magi-2-image-to-video"
        payload["image_url"] = args.image
        if args.last_image:
            payload["last_image"] = args.last_image
    elif args.reference:
        endpoint = "magi-2-reference-to-video"
        payload["images_list"] = args.reference

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
