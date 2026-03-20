"""End-to-end test for the AI Feedback pipeline.

Creates a test .docx file, uploads it via the REST API, and polls until complete.
Requires GOOGLE_API_KEY to be set.

Usage:
    uv run python test_pipeline.py
"""

import asyncio
import json
import sys
import time

# Add current dir to path
sys.path.insert(0, ".")

from dotenv import load_dotenv
load_dotenv()

from agent_ai_feedback.tools.extract_text import extract_text_from_file
from agent_ai_feedback.tools.page_to_image import document_to_images
from agent_ai_feedback.agent_runner import run_agents_pipeline


SAMPLE_TEXT = """The Impact of Climate Change on Marine Ecosystems

Introduction

Climate change is one of the most pressing environmental issues of our time. Rising ocean temperatures and increasing acidification are threatening marine biodiversity worldwide. This report examines the effects of climate change on coral reefs, fish populations, and ocean chemistry.

Effects on Coral Reefs

Coral bleaching events have increased dramatically over the past two decades. When ocean temperatures rise by just 1-2 degrees Celsius, corals expel their symbiotic algae, leading to widespread bleaching. The Great Barrier Reef has experienced three mass bleaching events since 2016.

Impact on Fish Populations

Many fish species are migrating to cooler waters as ocean temperatures rise. Studies show that tropical fish species are moving poleward at a rate of approximately 70 kilometers per decade. This disrupts existing food webs and affects fishing communities that depend on these species.

Ocean Acidification

The ocean absorbs about 30% of the CO2 produced by humans. This absorption leads to ocean acidification, which reduces the availability of carbonate ions needed by shellfish and corals to build their shells and skeletons.

Conclusion

The evidence clearly shows that climate change is having a profound impact on marine ecosystems. Urgent action is needed to reduce greenhouse gas emissions and protect ocean biodiversity for future generations.
"""


async def test_agents_pipeline():
    """Test the agent pipeline directly (without file upload)."""
    print("=" * 60)
    print("AI Feedback Pipeline - End-to-End Test")
    print("=" * 60)

    print("\n1. Testing agent pipeline with sample text...")
    start = time.time()

    try:
        result = await run_agents_pipeline(SAMPLE_TEXT, "")
        elapsed = time.time() - start

        print(f"\n   Completed in {elapsed:.1f}s")
        print(f"\n2. Results:")
        print(f"   Title: {result['generated_title']}")
        print(f"   Subject: {result['detected_subject']}")
        print(f"   Rubric categories ({len(result['rubric_categories'])}):")
        for cat in result["rubric_categories"]:
            name = cat.get("name", "?")
            desc = cat.get("description", "?")
            print(f"     - {name}: {desc}")

        print(f"\n   Feedback items ({len(result['feedback_items'])}):")
        for i, item in enumerate(result["feedback_items"]):
            print(f"\n     [{i+1}] {item.get('rubric_category', '?')}")
            print(f"         Excerpt: {item.get('excerpt', '?')[:80]}...")
            print(f"         Feedback: {item.get('explanation', '?')[:100]}...")

        print(f"\n{'=' * 60}")
        print("TEST PASSED" if result["feedback_items"] else "TEST FAILED - no feedback items")
        print(f"{'=' * 60}")
        return True

    except Exception as e:
        elapsed = time.time() - start
        print(f"\n   FAILED after {elapsed:.1f}s: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = asyncio.run(test_agents_pipeline())
    sys.exit(0 if success else 1)
