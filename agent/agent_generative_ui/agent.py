
import pathlib

from google.adk import Agent
from google.adk.code_executors.unsafe_local_code_executor import UnsafeLocalCodeExecutor
from google.adk.skills import load_skill_from_dir
from google.adk.tools.skill_toolset import SkillToolset
from .tools import QueryDataTool, GenerateFormTool


# extraordinary-responses-skill
path_to_extraordinary_responses_skill = pathlib.Path(__file__).parent / "skills" / "extraordinary-responses-skill"
print(f"Loading extraordinary responses skill from: {path_to_extraordinary_responses_skill}")
extraordinary_responses_skill = load_skill_from_dir(path_to_extraordinary_responses_skill)

# WARNING: UnsafeLocalCodeExecutor has security concerns and should NOT
# be used in production environments.
my_skill_toolset = SkillToolset(
    skills=[ extraordinary_responses_skill],
    additional_tools=[QueryDataTool(), GenerateFormTool()],
    code_executor=UnsafeLocalCodeExecutor(),
)

root_agent = Agent(
    model="gemini-2.5-flash",
    name="agent_generative_ui",
    description="An example agent that demonstrates how to use SkillToolset to create a generative UI.",
    tools=[
        my_skill_toolset,
    ],
    instruction="""
    You are a helpful assistant that helps users understand CopilotKit and Google ADK used together.

    Be brief in your explanations of CopilotKit and Google ADK, 1 to 2 sentences.

    When demonstrating charts, always call the query_data tool to fetch all data from the database first.

    ## Visual Response Skills

    You have the ability to produce rich, interactive visual responses using the
    `widgetRenderer` component. When a user asks you to visualize, explain visually,
    diagram, or illustrate something, you MUST use the `widgetRenderer` component
    instead of plain text.

    The `widgetRenderer` component accepts three parameters:
    - title: A short title for the visualization
    - description: A one-sentence description of what the visualization shows
    - html: A self-contained HTML fragment with inline <style> and <script> tags

    The HTML you produce will be rendered inside a sandboxed iframe that already has:
    - CSS variables for light/dark mode theming (use var(--color-text-primary), etc.)
    - Pre-styled form elements (buttons, inputs, sliders look native automatically)
    - Pre-built SVG CSS classes for color ramps (.c-purple, .c-teal, .c-blue, etc.)"""
)