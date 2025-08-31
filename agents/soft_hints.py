import os
import json
from typing import List, Optional
import ffmpeg
from google.adk.tools import google_search, url_context
from google.adk.agents import LlmAgent, SequentialAgent
import google.genai.types as types
from .prompt import PROMPT_VISUAL_HINTS, PROMPT_HINT_RESEARCH, PROMPT_RISK_SUMMARY


def extract_frames(video_path: str, output_dir: str, fps: int = 1) -> List[str]:
    if not os.path.isfile(video_path):
        raise FileNotFoundError(f"Video not found: {video_path}")
    os.makedirs(output_dir, exist_ok=True)
    (
        ffmpeg.input(video_path)
        .filter("fps", fps=fps)
        .output(os.path.join(output_dir, "frame_%05d.jpg"), start_number=0)
        .run(overwrite_output=True, quiet=True)  # keyword args only
    )
    frames = [
        os.path.join(output_dir, f)
        for f in os.listdir(output_dir)
        if f.lower().endswith(".jpg")
    ]
    return sorted(frames)


def pick_evenly_spaced(items: List[str], limit: int) -> List[str]:
    if limit <= 0 or len(items) <= limit:
        return items
    step = len(items) / float(limit)
    idxs = [int(i * step) for i in range(limit)]
    idxs = sorted(set(min(i, len(items) - 1) for i in idxs))
    return [items[i] for i in idxs]


def image_path_to_mime(path: str) -> str:
    ext = os.path.splitext(path)[1].lower()
    if ext in (".jpg", ".jpeg"):
        return "image/jpeg"
    if ext == ".png":
        return "image/png"
    raise ValueError(f"Unsupported image extension for {path}. Use .jpg/.jpeg/.png")


def load_images_as_parts(paths: List[str]) -> List[types.Part]:
    parts: List[types.Part] = []
    for p in paths:
        mime = image_path_to_mime(p)
        with open(p, "rb") as f:
            parts.append(types.Part.from_bytes(data=f.read(), mime_type=mime))
    return parts


def prepare_parts_from_paths(
    *,
    image_path: Optional[str],
    video_path: Optional[str],
    fps: int = 1,
    max_frames: int = 8,
    tmp_dir: str = ".tmp_frames",
) -> List[types.Part]:
    parts: List[types.Part] = []

    if video_path:
        frames = extract_frames(video_path, tmp_dir, fps=fps)
        frames = pick_evenly_spaced(frames, max_frames)
        if not frames:
            raise RuntimeError(f"No frames extracted from {video_path}")
        parts.extend(load_images_as_parts(frames))

    if image_path:
        if not os.path.isfile(image_path):
            raise FileNotFoundError(f"Image not found: {image_path}")
        parts.extend(load_images_as_parts([image_path]))

    if not parts:
        raise ValueError(
            "No inputs provided. Set at least one of image_path or video_path."
        )

    return parts


class ImageSoftHintsAgent(LlmAgent):
    image_path: Optional[str] = None
    video_path: Optional[str] = None
    fps: int = 1
    max_frames: int = 8
    tmp_dir: str = ".tmp_frames"

    def __init__(
        self,
        *,
        image_path: Optional[str] = None,
        video_path: Optional[str] = None,
        fps: int = 1,
        max_frames: int = 8,
        tmp_dir: str = ".tmp_frames",
        **kwargs,  # Accept additional kwargs for the parent class
    ):
        # Call parent __init__ with required parameters
        super().__init__(
            name="ImageSoftHintsAgent",  # Provide the required name
            description="Extracts soft privacy signifiers from local images/frames (no PII).",
            model="gemini-2.0-flash-exp",
            instruction=PROMPT_VISUAL_HINTS,
            **kwargs,  # Pass any additional kwargs to parent
        )

        # Store instance variables
        self.image_path = image_path
        self.video_path = video_path
        self.fps = fps
        self.max_frames = max_frames
        self.tmp_dir = tmp_dir

    async def _build_input(self, ctx):
        print("\n=== ImageSoftHintsAgent _build_input ===")

        parts = prepare_parts_from_paths(
            image_path=self.image_path,
            video_path=self.video_path,
            fps=self.fps,
            max_frames=self.max_frames,
            tmp_dir=self.tmp_dir,
        )

        # Debug output
        print(f"Parts created: {len(parts)}")
        for i, part in enumerate(parts):
            if hasattr(part, "inline_data") and part.inline_data:
                print(f"  Part {i}: Image ({part.inline_data.mime_type})")

        return parts

    async def _postprocess_output(self, ctx, result):
        print("\n=== ImageSoftHintsAgent _postprocess_output ===")
        print(
            f"Result preview: {result.text[:500] if hasattr(result, 'text') else 'No text'}..."
        )

        try:
            data = json.loads(result.text)
            hints = data.get("hints", [])
            ctx.session.state["visual_hints"] = hints
            print(f"✅ Successfully parsed {len(hints)} hints")
        except Exception as e:
            print(f"❌ JSON parsing failed: {e}")
            ctx.session.state["visual_hints_raw"] = (
                result.text if hasattr(result, "text") else str(result)
            )
            ctx.session.state["visual_hints"] = []

        return result


class HintResearchAgent(LlmAgent):
    """
    Researches how traceable each visual hint is online.
    """

    def __init__(self):
        super().__init__(
            name="HintResearchAgent",
            description="Researches traceability of visual hints online.",
            model="gemini-2.5-pro",
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
    Synthesizes overall privacy risk from hints and research findings.
    """

    def __init__(self):
        super().__init__(
            name="RiskSummaryAgent",
            description="Synthesizes research into overall privacy risk.",
            model="gemini-2.5-pro",
            output_key="risk_summary",
            instruction=PROMPT_RISK_SUMMARY,
            tools=[google_search, url_context],
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


def make_soft_hints_pipeline(
    *,
    image_path: Optional[str] = None,
    video_path: Optional[str] = None,
    fps: int = 1,
    max_frames: int = 20,
    tmp_dir: str = "tmp",
) -> SequentialAgent:
    return SequentialAgent(
        name="SoftHintPrivacyPipeline",
        sub_agents=[
            ImageSoftHintsAgent(
                image_path=image_path,
                video_path=video_path,
                fps=fps,
                max_frames=max_frames,
                tmp_dir=tmp_dir,
            ),
            HintResearchAgent(),
            RiskSummaryAgent(),
        ],
        description=(
            "Extracts soft visual signifiers from local files, researches identifiability, "
            "and scores privacy risk. Expects outputs in session.state: "
            "visual_hints, research_findings, risk_summary."
        ),
    )


soft_hints_evaluator = make_soft_hints_pipeline(
    image_path=None, video_path="/Users/yashver/workspace/tiktoktechjam/video.mp4"
)
