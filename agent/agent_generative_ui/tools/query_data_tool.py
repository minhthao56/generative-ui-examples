from google.adk.tools.base_tool import BaseTool
from google.genai import types
from pathlib import Path
import csv

# Read data at module load time to avoid file I/O issues in
# LangGraph Cloud's sandboxed tool execution environment.
_csv_path = Path(__file__).parent / "db.csv"
with open(_csv_path) as _f:
    _cached_data = list(csv.DictReader(_f))


class QueryDataTool(BaseTool):
    """A tool to query the database using natural language."""

    def __init__(self):
        super().__init__(
            name="query_data",
            description="Query the database, takes natural language. Always call before showing a chart or graph.",
        )

    def _get_declaration(self) -> types.FunctionDeclaration | None:
        return types.FunctionDeclaration(
            name=self.name,
            description=self.description,
            parameters_json_schema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Natural language query to search the database.",
                    },
                },
                "required": ["query"],
            },
        )

    async def run_async(self, *, args: dict, tool_context) -> list:
        return _cached_data
