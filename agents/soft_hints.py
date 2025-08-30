import os
import ffmpeg
import json
from typing import List
from google.adk.agents import LlmAgent, SequentialAgent, BaseAgent
import google.genai.types as types
from prompt import PROMPT_VISUAL_HINTS, PROMPT_HINT_RESEARCH, PROMPT_RISK_SUMMARY


def extract_frames(video_path: str, output_dir: str, fps: int = 1) -> List[str]:
    os.makedirs(output_dir, exist_ok=True)
    (
        ffmpeg.input(video_path)
        .filter("fps", fps=fps)
        .output(os.path.join(output_dir, "frame_%04d.jpg"), start_number=0)
        .run(overwrite_output=True, quiet=True)
    )
    return sorted(
        [
            os.path.join(output_dir, f)
            for f in os.listdir(output_dir)
            if f.endswith(".jpg")
        ]
    )


def load_files_as_parts(file_paths: List[str]) -> List[types.Part]:
    parts = []
    for path in file_paths:
        ext = os.path.splitext(path)[1].lower()
        if ext in [".jpg", ".jpeg"]:
            mime = "image/jpeg"
        elif ext == ".png":
            mime = "image/png"
        else:
            raise ValueError(f"Unsupported image extension {ext}")
        with open(path, "rb") as f:
            parts.append(types.Part.from_bytes(data=f.read(), mime_type=mime))
    return parts


def prepare_parts_from_project_path(path: str) -> List[types.Part]:
    ext = os.path.splitext(path)[1].lower()
    if ext == ".mp4":
        frame_dir = os.path.join("tmp_frames")
        frame_files = extract_frames(path, frame_dir, fps=1)
        return load_files_as_parts(frame_files)
    elif ext in [".jpg", ".jpeg", ".png"]:
        return load_files_as_parts([path])
    else:
        raise ValueError("Only .mp4 video or .jpg/.jpeg/.png images supported.")


class ImageSoftHintsAgent(LlmAgent):
    """
    LLM vision agent: inspects image frames for soft privacy signifiers.
    """

    def __init__(self):
        super().__init__(
            name="ImageSoftHintsAgent",
            description="Extracts soft privacy signifiers from images (no PII).",
            model="gemini-2.0-flash",
            instruction=PROMPT_VISUAL_HINTS,
        )

    async def _build_input(self, ctx):
        file_path = ctx.session.state.get(
            "local_file"
        )  # e.g., "project/data/video.mp4"
        if not file_path:
            raise ValueError("No 'local_file' provided in session.state")
        parts = prepare_parts_from_project_path(file_path)
        return [types.Part.from_text(text=PROMPT_VISUAL_HINTS), *parts]

    async def _postprocess_output(self, ctx, result):
        try:
            data = json.loads(result.text)
            ctx.session.state["visual_hints"] = data.get("hints", [])
        except Exception:
            ctx.session.state["visual_hints_raw"] = result.text
        return result


class HintResearchAgent(LlmAgent):
    """
    Researches how traceable each visual hint is online.
    """

    def __init__(self):
        super().__init__(
            name="HintResearchAgent",
            description="Researches traceability of visual hints online.",
            model="gemini-2.0-flash",
            instruction=PROMPT_HINT_RESEARCH,
        )

    async def _build_input(self, ctx):
        hints = ctx.session.state.get("visual_hints", [])
        text = (
            PROMPT_HINT_RESEARCH
            + "\n\nHINTS_JSON:\n"
            + json.dumps({"hints": hints}, ensure_ascii=False)
        )
        return [types.Part.from_text(text=text)]

    async def _postprocess_output(self, ctx, result):
        try:
            data = json.loads(result.text)
            ctx.session.state["research_findings"] = data.get("findings", [])
        except Exception:
            ctx.session.state["research_findings_raw"] = result.text
        return result


class RiskSummaryAgent(LlmAgent):
    """
    Summarises overall privacy risk from hints and research findings.
    """

    def __init__(self):
        super().__init__(
            name="RiskSummaryAgent",
            description="Synthesises research into overall privacy risk.",
            model="gemini-2.0-flash",
            instruction=PROMPT_RISK_SUMMARY,
        )

    async def _build_input(self, ctx):
        payload = {
            "visual_hints": ctx.session.state.get("visual_hints", []),
            "research_findings": ctx.session.state.get("research_findings", []),
        }
        text = (
            PROMPT_RISK_SUMMARY
            + "\n\nDATA:\n"
            + json.dumps(payload, ensure_ascii=False)
        )
        return [types.Part.from_text(text=text)]

    async def _postprocess_output(self, ctx, result):
        try:
            ctx.session.state["risk_summary"] = json.loads(result.text)
        except Exception:
            ctx.session.state["risk_summary_raw"] = result.text
        return result


soft_hints_evaluator = SequentialAgent(
    name="SoftHintPrivacyPipeline",
    sub_agents=[
        ImageSoftHintsAgent(),
        HintResearchAgent(),
        RiskSummaryAgent(),
    ],
    description="Extracts soft signifiers, researches identifiability, and scores risk.",
)
