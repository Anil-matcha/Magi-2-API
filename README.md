# Magi 2 API: Text, Image and Reference to Video with Native Audio (Uncensored / Spicy Notes) on Muapi

An API guide and runnable examples for **Magi 2** (Sand AI's MAGI-2 Preview), the open-weights audio-video generation model, called through [Muapi](https://muapi.ai). Compare the `magi-2-text-to-video`, `magi-2-image-to-video` and `magi-2-reference-to-video` endpoints, see the request and response schemas, and copy-paste cURL, Python and JavaScript examples. Includes an honest section on what "uncensored Magi 2" and "Magi 2 spicy" actually mean for open weights versus a hosted API. This guide covers Muapi endpoints only; it does not document Sand AI's own tooling.

## Related Projects

- [MuAPI](https://muapi.ai) — Unified API for image, video, and audio generation across hundreds of AI models.
- [Magi 2 on MuAPI](https://muapi.ai/magi-2) — Landing page for the Magi 2 API with the full endpoint catalog.
- [Spicy AI Video Generator API](https://github.com/Anil-matcha/Spicy-AI-Video-Generator-API) — compare relaxed-moderation video endpoints across Seedance, Wan and MiniMax H3.
- [Awesome Uncensored AI Video Models](https://github.com/Anil-matcha/awesome-uncensored-ai-video-models) — source-tracked catalog of local and hosted uncensored and low-filter video models.
- [Wan-3.0-Spicy-API](https://github.com/Anil-matcha/Wan-3.0-Spicy-API) — Python SDK for the Wan 3.0 Spicy video tier.
- [Seedance-2.5-Spicy-API](https://github.com/Anil-matcha/Seedance-2.5-Spicy-API) — Python SDK for the Seedance 2.5 Spicy video tier.
- [AI-Video-API](https://github.com/Anil-matcha/AI-Video-API) — endpoint guide for video-generation APIs in general.
- [Image-to-Video-API](https://github.com/Anil-matcha/Image-to-Video-API) — image-to-video endpoints compared.

## Overview

- [Magi 2 API landing page](https://muapi.ai/magi-2)
- [Magi 2 text-to-video playground](https://muapi.ai/playground/magi-2-text-to-video)
- [Magi 2 image-to-video playground](https://muapi.ai/playground/magi-2-image-to-video)
- [Magi 2 reference-to-video playground](https://muapi.ai/playground/magi-2-reference-to-video)
- [Muapi API documentation](https://muapi.ai/docs/api-reference)
- [Video generation docs](https://muapi.ai/docs/video-generation)
- [Create or manage an API key](https://muapi.ai/access-keys)

Requests go to `https://api.muapi.ai/api/v1/{endpoint}` with an `x-api-key` header. A submission returns a `request_id`; poll `GET /api/v1/predictions/{request_id}/result` until the task is `completed`. The generated video URL is in `outputs`. Pricing is a flat **$0.10 per second** of requested video on all three endpoints (a 5 s clip is $0.50, 30 s is $3.00); aspect ratio, generated audio and references do not change the price.

## What is Magi 2?

According to the [model card on Hugging Face](https://huggingface.co/sand-ai/MAGI-2-preview) and the [GitHub repository](https://github.com/SandAI-org/MAGI-2-preview), MAGI-2 Preview from Sand AI is:

- a **114B-parameter mixture-of-experts** model that activates about **6B parameters per token**;
- a **unified audio-video** generator: sound is generated alongside the picture;
- available for **text-to-video** (prompt), **image-to-video** (prompt plus a still image, optionally a last frame) and **reference-to-video** (prompt plus reference images, videos and audio);
- a **two-stage** pipeline: `magi2_preview` denoises the clip at low resolution, then `magi2_refiner` upscales it to **1080p**;
- served on Muapi at **1080p** with clip lengths from **4 to 30 seconds**;
- published as **open weights** (the model card lists Apache 2.0; always read the license file before commercial use), roughly **307 GB** in total.

Magi 2 is not [MAGI-1](https://github.com/SandAI-org/MAGI-1), Sand AI's earlier autoregressive chunk-by-chunk video model. Searches for "magi api" often return MAGI-1 results; the endpoints in this repo are for Magi 2.

## Endpoint comparison

| Workflow | Muapi endpoint | Required inputs | Optional inputs | Output |
|---|---|---|---|---|
| Text-to-video | `magi-2-text-to-video` | `prompt` | `aspect_ratio`, `duration`, `generate_audio`, `seed` | 4-30 s 1080p video with generated audio |
| Image-to-video | `magi-2-image-to-video` | `prompt`, `image_url` | `last_image`, `aspect_ratio`, `duration`, `generate_audio`, `seed` | 4-30 s 1080p video with generated audio |
| Reference-to-video | `magi-2-reference-to-video` | `prompt` | `images_list`, `videos_list`, `audios_list`, `aspect_ratio`, `duration`, `generate_audio`, `seed` | 4-30 s 1080p video with generated audio |

All three cost **$0.10 per second** of `duration` ([text-to-video](https://muapi.ai/playground/magi-2-text-to-video), [image-to-video](https://muapi.ai/playground/magi-2-image-to-video), [reference-to-video](https://muapi.ai/playground/magi-2-reference-to-video) playgrounds show the live price).

## Request schemas

Shared fields (all three endpoints):

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `prompt` | string | Yes | — | Describe the scene, motion, camera and sound (up to 15,000 characters). Put dialogue in quotation marks. |
| `aspect_ratio` | enum | No | `16:9` | `16:9`, `9:16`, `1:1`, `4:3`, `3:4`, `21:9`. On image-to-video it is optional and defaults to the closest ratio to the image. |
| `duration` | integer | No | `5` | Whole seconds, 4 to 30. Price is `duration` x $0.10. |
| `generate_audio` | boolean | No | `true` | Generate synchronized audio. `false` gives a silent clip at the same price. |
| `seed` | integer | No | random | 0 to 2147483647. Omit for a random seed. |

### `magi-2-text-to-video`

`POST https://api.muapi.ai/api/v1/magi-2-text-to-video`: shared fields only.

### `magi-2-image-to-video`

`POST https://api.muapi.ai/api/v1/magi-2-image-to-video`

| Field | Type | Required | Description |
|---|---|---|---|
| `image_url` | string | Yes | Public URL of the first-frame image. It may be cropped to the chosen aspect ratio. |
| `last_image` | string | No | Public URL of an image that guides the final frame. |

### `magi-2-reference-to-video`

`POST https://api.muapi.ai/api/v1/magi-2-reference-to-video`

| Field | Type | Required | Description |
|---|---|---|---|
| `images_list` | string[] | No | Up to 10 reference image URLs. |
| `videos_list` | string[] | No | Up to 5 reference video URLs, 2-30 s each and 30 s combined; longer clips are trimmed. |
| `audios_list` | string[] | No | Up to 5 reference audio URLs, 2-30 s each and 30 s combined; longer clips are trimmed. |

Explain in the `prompt` what each reference is for (for example `@image_1` as the character and `@image_2` as the setting). With no references, generation uses the prompt alone.

Field names and defaults follow the playground pages above; if a field is rejected, check the playground for the current schema.

### Responses

Submit response:

```json
{"request_id": "REQUEST_ID", "status": "pending"}
```

Result response, once finished (`status` moves through `pending` and `processing`, and ends as `completed` or `failed`):

```json
{"request_id": "REQUEST_ID", "status": "completed", "outputs": ["https://.../video.mp4"]}
```

## Quick start with cURL

```bash
export MUAPI_API_KEY=your_key_here

curl -X POST "https://api.muapi.ai/api/v1/magi-2-text-to-video" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $MUAPI_API_KEY" \
  -d '{"prompt": "A street musician plays violin in a rainy neon-lit alley, camera slowly pushing in, rain and violin audible", "aspect_ratio": "16:9", "duration": 10}'

# Then poll with the returned request_id:
curl "https://api.muapi.ai/api/v1/predictions/REQUEST_ID/result" -H "x-api-key: $MUAPI_API_KEY"
```

Runnable versions live in [`examples/`](examples):

| File | Run |
|---|---|
| [`examples/curl.sh`](examples/curl.sh) | `MUAPI_API_KEY=... bash examples/curl.sh` |
| [`examples/python/magi2.py`](examples/python/magi2.py) | `pip install -r examples/python/requirements.txt && python examples/python/magi2.py "your prompt"` |
| [`examples/javascript/magi2.mjs`](examples/javascript/magi2.mjs) | `node examples/javascript/magi2.mjs "your prompt"` (Node 18+) |

Add `--image https://example.com/photo.jpg` to use the image-to-video endpoint (and `--last-image URL` to guide the ending), or `--reference URL` (repeatable) to use reference-to-video with reference images. Both scripts also take `--duration 4-30`, `--aspect-ratio` and `--no-audio`.

## Open weights vs hosted Magi 2 API

| | Self-host the open weights | Muapi `magi-2-*` endpoints |
|---|---|---|
| Setup | ~307 GB of weights, a multi-GPU server and the Sand AI Docker image | One API key and an HTTP request |
| Cost model | Your own GPU time | $0.10 per second of video |
| Scaling | You manage queues and GPUs | Asynchronous submit-and-poll, webhooks available |
| Control | Full control of the pipeline and checkpoints | Fixed endpoint parameters (4-30 s, six aspect ratios, audio on/off) |
| Other models | Separate setup per model | Same key works for Seedance, Wan, Kling, MiniMax and more |

## Uncensored and spicy Magi 2: what it means

People search for "uncensored Magi 2", "Magi 2 spicy" and "Magi 2 NSFW AI video". Three things are worth knowing:

1. **Open weights are not automatically uncensored.** Self-hosting removes a provider's hosted moderation layer, but it does not show that the model itself is low-filter, and it does not remove the license terms or your legal obligations. Test the exact checkpoint you plan to use.
2. **Hosted endpoints have their own moderation behavior.** How a given Muapi endpoint treats mature prompts can differ from the open weights and from other endpoints. Test the specific endpoint; do not assume.
3. **"Spicy" on Muapi is a specific, labelled tier.** Muapi's spicy endpoints apply relaxed (reduced) automated content moderation. For those, see the spicy video repositories listed under [Related Projects](#related-projects).

> **Content policy notice:** Muapi's [terms](https://muapi.ai/terms) and applicable law apply to every endpoint. Do not generate content involving minors, non-consensual imagery of real people, or other prohibited material.

## Links

- [muapi.ai](https://muapi.ai)
- [Magi 2 API](https://muapi.ai/magi-2)
- [Create an API key](https://muapi.ai/access-keys)
- [Sand AI MAGI-2-preview (GitHub)](https://github.com/SandAI-org/MAGI-2-preview)
- [MAGI-2-preview (Hugging Face)](https://huggingface.co/sand-ai/MAGI-2-preview)

## License

MIT for the examples in this repository. Magi 2 model weights are under their own license; see the [model card](https://huggingface.co/sand-ai/MAGI-2-preview).
