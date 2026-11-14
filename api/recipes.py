"""FridgeToMeal recipe endpoint — Vercel Python serverless function.

POST /api/recipes with JSON {"ingredients": [...], "diet": "...", "mealType": "..."}
and get back {"recipes": [ ... ]} from Gemini (gemini-3.5-flash-lite via the
OpenAI-compatible chat completions endpoint).

The Gemini API key lives server-side only, in the GEMINI_API_KEY
environment variable. When no key is configured the function answers 501
and the app shows its retry state — recipes are always live AI.
"""

import json
import os
import re
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
MODEL = "gemini-3.5-flash-lite"
MAX_INGREDIENTS = 30

SYSTEM_PROMPT = (
    "You are FridgeToMeal, a helpful cooking helper that fights food waste. "
    "Given the ingredients a user already has at home, suggest recipes that use "
    "as many of them as possible. Reply with JSON ONLY — no markdown fences, "
    "no commentary. The JSON object must have one key, \"recipes\", an array of "
    "exactly 4 recipes. Each recipe: {\"id\": a short slug string, "
    "\"title\": string, \"description\": one inviting sentence, "
    "\"match\": integer 0-100 estimating how much of the recipe the user already has, "
    "\"timeMinutes\": integer, \"servings\": integer, "
    "\"difficulty\": one of \"Easy\", \"Medium\", \"Hard\", "
    "\"cuisine\": string, "
    "\"ingredients\": [{\"name\": string, \"amount\": string, \"have\": boolean}] — "
    "mark \"have\" true only when the ingredient is in the user's list or is a basic "
    "pantry staple (oil, salt, pepper, water), "
    "\"missing\": [names of ingredients the user does NOT have], "
    "\"steps\": [short numbered cooking steps, 3-6 of them], "
    "\"tags\": [2-3 short tags]}"
)


def _read_json(handler):
    try:
        length = int(handler.headers.get("Content-Length") or 0)
    except ValueError:
        length = 0
    raw = handler.rfile.read(length) if length > 0 else b"{}"
    try:
        return json.loads(raw.decode("utf-8") or "{}")
    except (ValueError, UnicodeDecodeError):
        return None


def _send(handler, status, payload):
    body = json.dumps(payload).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


def _extract_json(text):
    """Pull the first JSON object out of model output, tolerating fences."""
    try:
        return json.loads(text)
    except ValueError:
        pass
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except ValueError:
            return None
    return None


def _validate_recipes(data):
    if not isinstance(data, dict) or not isinstance(data.get("recipes"), list):
        return None
    recipes = []
    for item in data["recipes"][:4]:
        if not isinstance(item, dict):
            continue
        if not all(
            isinstance(item.get(k), str) and item[k]
            for k in ("id", "title", "description")
        ):
            continue
        if not isinstance(item.get("ingredients"), list) or not isinstance(
            item.get("steps"), list
        ):
            continue
        recipes.append(
            {
                "id": str(item["id"])[:80],
                "title": item["title"],
                "description": item["description"],
                "match": max(0, min(100, int(item.get("match") or 0))),
                "timeMinutes": max(1, int(item.get("timeMinutes") or 20)),
                "servings": max(1, int(item.get("servings") or 2)),
                "difficulty": item.get("difficulty") if item.get("difficulty") in ("Easy", "Medium", "Hard") else "Easy",
                "cuisine": str(item.get("cuisine") or "Home cooking"),
                "ingredients": [
                    {
                        "name": str(ing.get("name", "")),
                        "amount": str(ing.get("amount", "")),
                        "have": bool(ing.get("have")),
                    }
                    for ing in item["ingredients"]
                    if isinstance(ing, dict) and ing.get("name")
                ][:15],
                "missing": [str(m) for m in item.get("missing") or []][:10],
                "steps": [str(s) for s in item["steps"] if s][:8],
                "tags": [str(t) for t in item.get("tags") or []][:4],
                "source": "live",
            }
        )
    return recipes or None


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        body = _read_json(self)
        if body is None:
            _send(self, 400, {"error": {"message": "Invalid JSON body"}})
            return

        ingredients = body.get("ingredients") or []
        if not isinstance(ingredients, list) or not ingredients:
            _send(self, 400, {"error": {"message": "Provide at least one ingredient"}})
            return
        ingredients = [str(i).strip() for i in ingredients if str(i).strip()][:MAX_INGREDIENTS]
        diet = str(body.get("diet") or "Any")[:40]
        meal_type = str(body.get("mealType") or "Any")[:40]

        api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("Gemini_API_KEY")
        if not api_key:
            _send(self, 501, {"error": {"message": "Hosted AI is not configured"}})
            return

        user_prompt = (
            f"Ingredients I already have: {', '.join(ingredients)}. "
            f"Dietary preference: {diet}. Meal type: {meal_type}. "
            "Suggest 4 recipes that use as many of my ingredients as possible, "
            "preferring simple, quick weeknight cooking."
        )
        payload = {
            "model": MODEL,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.7,
        }
        request = urllib.request.Request(
            GEMINI_URL,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
                "x-goog-api-key": api_key,
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                upstream = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            try:
                detail = json.loads(exc.read().decode("utf-8"))
                message = detail.get("error", {}).get("message", "")
            except (ValueError, UnicodeDecodeError):
                message = ""
            _send(
                self,
                exc.code if 400 <= exc.code < 600 else 502,
                {"error": {"message": message or "Upstream request failed"}},
            )
            return
        except (urllib.error.URLError, TimeoutError, OSError):
            _send(self, 502, {"error": {"message": "Upstream request failed"}})
            return

        try:
            content = upstream["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError):
            _send(self, 502, {"error": {"message": "Upstream returned an unexpected response"}})
            return

        data = _extract_json(content)
        recipes = _validate_recipes(data) if data is not None else None
        if recipes is None:
            _send(self, 502, {"error": {"message": "Could not parse recipe suggestions"}})
            return
        _send(self, 200, {"recipes": recipes})

    def do_GET(self):
        _send(self, 405, {"error": {"message": "Method not allowed"}})

    def log_message(self, *args):  # keep serverless logs clean
        pass
