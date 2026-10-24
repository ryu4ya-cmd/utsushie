"""設計図JSON（system-prompt.md の出力）から、各動画モデル向けの指示文と字幕を組み立てる。

使い方: python3 build_prompts.py examples/plans.json > examples/prompts.md
外部APIは呼ばない。設計図の検査（カットの隙間、セリフの長さ）もここで行う。
"""
import json
import sys

VEO_MAX_SEC = 8
MAX_CHARS_PER_SEC = 7


def check(plan):
    problems = []
    shots = plan["shots"]
    if not shots:
        return ["shots が空（safety.ok=false の可能性）"]
    if shots[0]["start"] != 0 or shots[-1]["end"] != plan["duration_sec"]:
        problems.append("カットが 0 秒から尺の終わりまでを覆っていない")
    for i, (a, b) in enumerate(zip(shots, shots[1:]), 1):
        if a["end"] != b["start"]:
            problems.append(f"カット{i}と{i + 1}の間に隙間か重なり")
    ids = {c["id"] for c in plan["characters"]}
    for i, s in enumerate(shots, 1):
        if s["end"] - s["start"] < 4:
            problems.append(f"カット{i}が4秒未満")
        for d in s["dialogue"]:
            if d["speaker"] not in ids:
                problems.append(f"カット{i}の話し手 {d['speaker']} が登場人物にいない")
            room = s["end"] - d["at"]
            if len(d["line_ja"]) > MAX_CHARS_PER_SEC * room:
                problems.append(f"カット{i}の「{d['line_ja']}」が残り{room}秒に入らない")
    return problems


def sheet(plan, cid, shot):
    c = next(c for c in plan["characters"] if c["id"] == cid)
    text = c["sheet"]
    if cid in shot.get("wardrobe", {}):
        text += f", wearing {shot['wardrobe'][cid]}"
    return text


def who(plan, cid):
    # 2人以上いるときは、セリフの話し手を外見で指す
    c = next(c for c in plan["characters"] if c["id"] == cid)
    return f"{cid}, {c['sheet'].split(',')[0]}," if len(plan["characters"]) > 1 else cid


def audio(plan, shot, dialogue=None):
    parts = []
    for d in shot["dialogue"] if dialogue is None else dialogue:
        c = next(c for c in plan["characters"] if c["id"] == d["speaker"])
        voice = f" in a {c['voice']}" if c["voice"] else ""
        parts.append(f"{who(plan, d['speaker'])} says in Japanese{voice}, "
                     f"{d['delivery']}, with matching lip movement: 「{d['line_ja']}」")
    if shot["sfx"]:
        parts.append("Sound effects: " + ", ".join(shot["sfx"]))
    if shot["ambience"]:
        parts.append("Ambience: " + ", ".join(shot["ambience"]))
    return ". ".join(parts)


def shot_body(plan, shot, with_sheets=True, dialogue=None):
    if with_sheets:
        cast = " ".join(f"{cid} is {sheet(plan, cid, shot)}." for cid in shot["characters"])
    else:
        cast = " ".join(f"{cid} wears {shot['wardrobe'][cid]}." for cid in shot.get("wardrobe", {}))
    return " ".join(x for x in (f"{shot['framing'].capitalize()}, {shot['camera']}.", cast,
                                shot["action"], audio(plan, shot, dialogue) + ".") if x.strip(" ."))


def header(plan):
    music = plan["music"] or "No background music"
    return (f"{plan['aspect_ratio']} vertical video, {plan['duration_sec']} seconds. " if plan["aspect_ratio"] == "9:16"
            else f"{plan['aspect_ratio']} video, {plan['duration_sec']} seconds. ") + \
        f"Style: {plan['style']}. Setting: {plan['setting']} {music}."


def negative(plan):
    return "Avoid: " + ", ".join(plan["negative"]) + "."


def kling(plan):
    lines = [header(plan)]
    for i, s in enumerate(plan["shots"], 1):
        lines.append(f"Shot {i} ({s['start']}-{s['end']}s): {shot_body(plan, s)}")
    lines.append(negative(plan))
    return "\n".join(lines)


def seedance(plan):
    cast = " ".join(f"{c['id']}: {c['sheet']}." for c in plan["characters"])
    lines = [header(plan), f"Characters (keep identical in every shot): {cast}"]
    for s in plan["shots"]:
        lines.append(f"[{s['start']}-{s['end']}s] {shot_body(plan, s, with_sheets=False)}")
    lines.append(negative(plan))
    return "\n".join(lines)


def veo(plan):
    """Veo は1回8秒まで。8秒を超える分は「延長」用の2本目に分け、境目をまたぐカットは両方に入れる。"""
    parts = []
    segments = [(0, min(VEO_MAX_SEC, plan["duration_sec"]), "1本目（8秒）")]
    if plan["duration_sec"] > VEO_MAX_SEC:
        segments.append((VEO_MAX_SEC, plan["duration_sec"], f"延長（続き{plan['duration_sec'] - VEO_MAX_SEC}秒）"))
    for seg_start, seg_end, label in segments:
        length = seg_end - seg_start
        body = [header(plan).replace(f"{plan['duration_sec']} seconds", f"{length} seconds")]
        if seg_start > 0:
            body.append("Continue seamlessly from the last frame of the previous clip.")
        for s in plan["shots"]:
            if s["end"] <= seg_start or s["start"] >= seg_end:
                continue
            lines = [d for d in s["dialogue"] if seg_start <= d["at"] < seg_end]
            start, end = max(s["start"], seg_start) - seg_start, min(s["end"], seg_end) - seg_start
            body.append(f"{start}-{end}s: {shot_body(plan, s, dialogue=lines)}")
        body.append(negative(plan))
        parts.append((label, "\n".join(body)))
    return parts


def subtitles(plan):
    out = []
    for s in plan["shots"]:
        for d in s["dialogue"]:
            end = min(d["at"] + max(1.0, len(d["line_ja"]) / 5), s["end"])
            out.append({"start": d["at"], "end": round(end, 1), "text": d["line_ja"]})
    return out


def main(path):
    plans = json.load(open(path, encoding="utf-8"))
    for n, plan in enumerate(plans, 1):
        print(f"## {n}. {plan['title_ja']}\n")
        problems = check(plan)
        print("検査: " + ("問題なし" if not problems else " / ".join(problems)) + "\n")
        print("### Kling 3.0\n\n```text\n" + kling(plan) + "\n```\n")
        print("### Seedance 2\n\n```text\n" + seedance(plan) + "\n```\n")
        for label, text in veo(plan):
            print(f"### Veo 3.1 {label}\n\n```text\n{text}\n```\n")
        print("### 字幕\n\n```json\n" + json.dumps(subtitles(plan), ensure_ascii=False) + "\n```\n")


if __name__ == "__main__":
    main(sys.argv[1])
