## This is an example how to shared state UI <> ADK
### UI - page.tsx
```tsx
"use client";
import {
  useAgent,
  UseAgentUpdate,
  useCopilotKit,
  useConfigureSuggestions,
  CopilotChat,
  CopilotSidebar,
} from "@copilotkit/react-core/v2";
import React, { useState, useEffect, useRef } from "react";
import "@copilotkit/react-core/v2/styles.css";
import "./style.css";
import { useMobileView } from "@/utils/use-mobile-view";
import { useMobileChat } from "@/utils/use-mobile-chat";
import { useURLParams } from "@/contexts/url-params-context";
import { CopilotKit } from "@copilotkit/react-core";

interface SharedStateProps {
  params: Promise<{
    integrationId: string;
  }>;
}

export default function SharedState({ params }: SharedStateProps) {
  const { integrationId } = React.use(params);
  const { isMobile } = useMobileView();
  const { chatDefaultOpen } = useURLParams();
  const defaultChatHeight = 50;
  const { isChatOpen, setChatHeight, setIsChatOpen, isDragging, chatHeight, handleDragStart } =
    useMobileChat(defaultChatHeight);

  const chatTitle = "AI Recipe Assistant";
  const chatDescription = "Ask me to craft recipes";

  return (
    <CopilotKit
      runtimeUrl={`/api/copilotkit/${integrationId}`}
      showDevConsole={false}
      agent="shared_state"
    >
      <div className="min-h-screen w-full flex items-center justify-center">
        <Recipe />
        {isMobile ? (
          <>
            {/* Chat Toggle Button */}
            <div className="fixed bottom-0 left-0 right-0 z-50">
              <div className="bg-gradient-to-t from-white via-white to-transparent h-6"></div>
              <div
                className="bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between cursor-pointer shadow-lg"
                onClick={() => {
                  if (!isChatOpen) {
                    setChatHeight(defaultChatHeight); // Reset to good default when opening
                  }
                  setIsChatOpen(!isChatOpen);
                }}
              >
                <div className="flex items-center gap-3">
                  <div>
                    <div className="font-medium text-gray-900">{chatTitle}</div>
                    <div className="text-sm text-gray-500">{chatDescription}</div>
                  </div>
                </div>
                <div
                  className={`transform transition-transform duration-300 ${isChatOpen ? "rotate-180" : ""}`}
                >
                  <svg
                    className="w-6 h-6 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 15l7-7 7 7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Pull-Up Chat Container */}
            <div
              className={`fixed inset-x-0 bottom-0 z-40 bg-white rounded-t-2xl shadow-[0px_0px_20px_0px_rgba(0,0,0,0.15)] transform transition-all duration-300 ease-in-out flex flex-col ${
                isChatOpen ? "translate-y-0" : "translate-y-full"
              } ${isDragging ? "transition-none" : ""}`}
              style={{
                height: `${chatHeight}vh`,
                paddingBottom: "env(safe-area-inset-bottom)", // Handle iPhone bottom padding
              }}
            >
              {/* Drag Handle Bar */}
              <div
                className="flex justify-center pt-3 pb-2 flex-shrink-0 cursor-grab active:cursor-grabbing"
                onMouseDown={handleDragStart}
              >
                <div className="w-12 h-1 bg-gray-400 rounded-full hover:bg-gray-500 transition-colors"></div>
              </div>

              {/* Chat Header */}
              <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900">{chatTitle}</h3>
                  </div>
                  <button
                    onClick={() => setIsChatOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <svg
                      className="w-5 h-5 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Chat Content - Flexible container for messages and input */}
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden pb-16">
                <CopilotChat
                  agentId="shared_state"
                  className="h-full flex flex-col"
                />
              </div>
            </div>

            {/* Backdrop */}
            {isChatOpen && (
              <div className="fixed inset-0 z-30" onClick={() => setIsChatOpen(false)} />
            )}
          </>
        ) : (
          <CopilotSidebar
            agentId="shared_state"
            defaultOpen={chatDefaultOpen}
            labels={{
              modalHeaderTitle: chatTitle,
            }}
          />
        )}
      </div>
    </CopilotKit>
  );
}

enum SkillLevel {
  BEGINNER = "Beginner",
  INTERMEDIATE = "Intermediate",
  ADVANCED = "Advanced",
}

enum CookingTime {
  FiveMin = "5 min",
  FifteenMin = "15 min",
  ThirtyMin = "30 min",
  FortyFiveMin = "45 min",
  SixtyPlusMin = "60+ min",
}

const cookingTimeValues = [
  { label: CookingTime.FiveMin, value: 0 },
  { label: CookingTime.FifteenMin, value: 1 },
  { label: CookingTime.ThirtyMin, value: 2 },
  { label: CookingTime.FortyFiveMin, value: 3 },
  { label: CookingTime.SixtyPlusMin, value: 4 },
];

enum SpecialPreferences {
  HighProtein = "High Protein",
  LowCarb = "Low Carb",
  Spicy = "Spicy",
  BudgetFriendly = "Budget-Friendly",
  OnePotMeal = "One-Pot Meal",
  Vegetarian = "Vegetarian",
  Vegan = "Vegan",
}

interface Ingredient {
  icon: string;
  name: string;
  amount: string;
}

interface Recipe {
  title: string;
  skill_level: SkillLevel;
  cooking_time: CookingTime;
  special_preferences: string[];
  ingredients: Ingredient[];
  instructions: string[];
}

interface RecipeAgentState {
  recipe: Recipe;
}

const INITIAL_STATE: RecipeAgentState = {
  recipe: {
    title: "Make Your Recipe",
    skill_level: SkillLevel.INTERMEDIATE,
    cooking_time: CookingTime.FortyFiveMin,
    special_preferences: [],
    ingredients: [
      { icon: "🥕", name: "Carrots", amount: "3 large, grated" },
      { icon: "🌾", name: "All-Purpose Flour", amount: "2 cups" },
    ],
    instructions: ["Preheat oven to 350°F (175°C)"],
  },
};

function Recipe() {
  const { isMobile } = useMobileView();
  const { agent } = useAgent({
    agentId: "shared_state",
    updates: [UseAgentUpdate.OnStateChanged, UseAgentUpdate.OnRunStatusChanged],
  });
  const { copilotkit } = useCopilotKit();

  useConfigureSuggestions({
    suggestions: [
      {
        title: "Create Italian recipe",
        message: "Create a delicious Italian pasta recipe.",
      },
      {
        title: "Make it healthier",
        message: "Make the recipe healthier with more vegetables.",
      },
      {
        title: "Suggest variations",
        message: "Suggest some creative variations of this recipe.",
      },
    ],
    available: "always",
  });

  const agentState = agent.state as RecipeAgentState | undefined;
  const setAgentState = (s: RecipeAgentState) => agent.setState(s);
  const isLoading = agent.isRunning;

  // Set initial state on mount
  useEffect(() => {
    if (!agentState?.recipe) {
      setAgentState(INITIAL_STATE);
    }
  }, []);

  const [recipe, setRecipe] = useState(INITIAL_STATE.recipe);
  const [editingInstructionIndex, setEditingInstructionIndex] = useState<number | null>(null);
  const newInstructionRef = useRef<HTMLTextAreaElement>(null);

  const updateRecipe = (partialRecipe: Partial<Recipe>) => {
    setAgentState({
      ...(agentState || INITIAL_STATE),
      recipe: {
        ...recipe,
        ...partialRecipe,
      },
    });
    setRecipe({
      ...recipe,
      ...partialRecipe,
    });
  };

  const newRecipeState = { ...recipe };
  const newChangedKeys = [];
  const changedKeysRef = useRef<string[]>([]);

  for (const key in recipe) {
    if (
      agentState &&
      agentState.recipe &&
      (agentState.recipe as any)[key] !== undefined &&
      (agentState.recipe as any)[key] !== null
    ) {
      let agentValue = (agentState.recipe as any)[key];
      const recipeValue = (recipe as any)[key];

      // Check if agentValue is a string and replace \n with actual newlines
      if (typeof agentValue === "string") {
        agentValue = agentValue.replace(/\\n/g, "\n");
      }

      if (JSON.stringify(agentValue) !== JSON.stringify(recipeValue)) {
        (newRecipeState as any)[key] = agentValue;
        newChangedKeys.push(key);
      }
    }
  }

  if (newChangedKeys.length > 0) {
    changedKeysRef.current = newChangedKeys;
  } else if (!isLoading) {
    changedKeysRef.current = [];
  }

  useEffect(() => {
    setRecipe(newRecipeState);
  }, [JSON.stringify(newRecipeState)]);

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateRecipe({
      title: event.target.value,
    });
  };

  const handleSkillLevelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    updateRecipe({
      skill_level: event.target.value as SkillLevel,
    });
  };

  const handleDietaryChange = (preference: string, checked: boolean) => {
    if (checked) {
      updateRecipe({
        special_preferences: [...recipe.special_preferences, preference],
      });
    } else {
      updateRecipe({
        special_preferences: recipe.special_preferences.filter((p) => p !== preference),
      });
    }
  };

  const handleCookingTimeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    updateRecipe({
      cooking_time: cookingTimeValues[Number(event.target.value)].label,
    });
  };

  const addIngredient = () => {
    // Pick a random food emoji from our valid list
    updateRecipe({
      ingredients: [...recipe.ingredients, { icon: "🍴", name: "", amount: "" }],
    });
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
    const updatedIngredients = [...recipe.ingredients];
    updatedIngredients[index] = {
      ...updatedIngredients[index],
      [field]: value,
    };
    updateRecipe({ ingredients: updatedIngredients });
  };

  const removeIngredient = (index: number) => {
    const updatedIngredients = [...recipe.ingredients];
    updatedIngredients.splice(index, 1);
    updateRecipe({ ingredients: updatedIngredients });
  };

  const addInstruction = () => {
    const newIndex = recipe.instructions.length;
    updateRecipe({
      instructions: [...recipe.instructions, ""],
    });
    // Set the new instruction as the editing one
    setEditingInstructionIndex(newIndex);

    // Focus the new instruction after render
    setTimeout(() => {
      const textareas = document.querySelectorAll(".instructions-container textarea");
      const newTextarea = textareas[textareas.length - 1] as HTMLTextAreaElement;
      if (newTextarea) {
        newTextarea.focus();
      }
    }, 50);
  };

  const updateInstruction = (index: number, value: string) => {
    const updatedInstructions = [...recipe.instructions];
    updatedInstructions[index] = value;
    updateRecipe({ instructions: updatedInstructions });
  };

  const removeInstruction = (index: number) => {
    const updatedInstructions = [...recipe.instructions];
    updatedInstructions.splice(index, 1);
    updateRecipe({ instructions: updatedInstructions });
  };

  // Simplified icon handler that defaults to a fork/knife for any problematic icons
  const getProperIcon = (icon: string | undefined): string => {
    // If icon is undefined  return the default
    if (!icon) {
      return "🍴";
    }

    return icon;
  };

  return (
    <form
      data-testid="recipe-card"
      style={isMobile ? { marginBottom: "100px" } : {}}
      className="recipe-card"
    >
      {/* Recipe Title */}
      <div className="recipe-header">
        <input
          type="text"
          value={recipe.title || ""}
          onChange={handleTitleChange}
          className="recipe-title-input"
        />

        <div className="recipe-meta">
          <div className="meta-item">
            <span className="meta-icon">🕒</span>
            <select
              className="meta-select"
              value={cookingTimeValues.find((t) => t.label === recipe.cooking_time)?.value || 3}
              onChange={handleCookingTimeChange}
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23555' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e\")",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 0px center",
                backgroundSize: "12px",
                appearance: "none",
                WebkitAppearance: "none",
              }}
            >
              {cookingTimeValues.map((time) => (
                <option key={time.value} value={time.value}>
                  {time.label}
                </option>
              ))}
            </select>
          </div>

          <div className="meta-item">
            <span className="meta-icon">🏆</span>
            <select
              className="meta-select"
              value={recipe.skill_level}
              onChange={handleSkillLevelChange}
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23555' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e\")",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 0px center",
                backgroundSize: "12px",
                appearance: "none",
                WebkitAppearance: "none",
              }}
            >
              {Object.values(SkillLevel).map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Dietary Preferences */}
      <div className="section-container relative">
        {changedKeysRef.current.includes("special_preferences") && <Ping />}
        <h2 className="section-title">Dietary Preferences</h2>
        <div className="dietary-options">
          {Object.values(SpecialPreferences).map((option) => (
            <label key={option} className="dietary-option">
              <input
                type="checkbox"
                checked={recipe.special_preferences.includes(option)}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleDietaryChange(option, e.target.checked)
                }
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Ingredients */}
      <div className="section-container relative">
        {changedKeysRef.current.includes("ingredients") && <Ping />}
        <div className="section-header">
          <h2 className="section-title">Ingredients</h2>
          <button
            data-testid="add-ingredient-button"
            type="button"
            className="add-button"
            onClick={addIngredient}
          >
            + Add Ingredient
          </button>
        </div>
        <div data-testid="ingredients-container" className="ingredients-container">
          {recipe.ingredients.map((ingredient, index) => (
            <div key={index} data-testid="ingredient-card" className="ingredient-card">
              <div className="ingredient-icon">{getProperIcon(ingredient.icon)}</div>
              <div className="ingredient-content">
                <input
                  type="text"
                  value={ingredient.name || ""}
                  onChange={(e) => updateIngredient(index, "name", e.target.value)}
                  placeholder="Ingredient name"
                  className="ingredient-name-input"
                />
                <input
                  type="text"
                  value={ingredient.amount || ""}
                  onChange={(e) => updateIngredient(index, "amount", e.target.value)}
                  placeholder="Amount"
                  className="ingredient-amount-input"
                />
              </div>
              <button
                type="button"
                className="remove-button"
                onClick={() => removeIngredient(index)}
                aria-label="Remove ingredient"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="section-container relative">
        {changedKeysRef.current.includes("instructions") && <Ping />}
        <div className="section-header">
          <h2 className="section-title">Instructions</h2>
          <button type="button" className="add-step-button" onClick={addInstruction}>
            + Add Step
          </button>
        </div>
        <div data-testid="instructions-container" className="instructions-container">
          {recipe.instructions.map((instruction, index) => (
            <div key={index} className="instruction-item">
              {/* Number Circle */}
              <div className="instruction-number">{index + 1}</div>

              {/* Vertical Line */}
              {index < recipe.instructions.length - 1 && <div className="instruction-line" />}

              {/* Instruction Content */}
              <div
                className={`instruction-content ${
                  editingInstructionIndex === index
                    ? "instruction-content-editing"
                    : "instruction-content-default"
                }`}
                onClick={() => setEditingInstructionIndex(index)}
              >
                <textarea
                  className="instruction-textarea"
                  value={instruction || ""}
                  onChange={(e) => updateInstruction(index, e.target.value)}
                  placeholder={!instruction ? "Enter cooking instruction..." : ""}
                  onFocus={() => setEditingInstructionIndex(index)}
                  onBlur={(e) => {
                    // Only blur if clicking outside this instruction
                    if (!e.relatedTarget || !e.currentTarget.contains(e.relatedTarget as Node)) {
                      setEditingInstructionIndex(null);
                    }
                  }}
                />

                {/* Delete Button (only visible on hover) */}
                <button
                  type="button"
                  className={`instruction-delete-btn ${
                    editingInstructionIndex === index
                      ? "instruction-delete-btn-editing"
                      : "instruction-delete-btn-default"
                  } remove-button`}
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent triggering parent onClick
                    removeInstruction(index);
                  }}
                  aria-label="Remove instruction"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Improve with AI Button */}
      <div className="action-container">
        <button
          data-testid="improve-button"
          className={isLoading ? "improve-button loading" : "improve-button"}
          type="button"
          onClick={() => {
            if (!isLoading) {
              agent.addMessage({
                id: crypto.randomUUID(),
                role: "user",
                content: "Improve the recipe",
              });
              copilotkit.runAgent({ agent });
            }
          }}
          disabled={isLoading}
        >
          {isLoading ? "Please Wait..." : "Improve with AI"}
        </button>
      </div>
    </form>
  );
}

function Ping() {
  return (
    <span className="ping-animation">
      <span className="ping-circle"></span>
      <span className="ping-dot"></span>
    </span>
  );
}
```
### ADK - shared_state.py
```py
"""Shared State feature."""

from __future__ import annotations

from dotenv import load_dotenv
load_dotenv()
import json
from enum import Enum
from typing import Dict, List, Any, Optional
from fastapi import FastAPI
from ag_ui_adk import ADKAgent, add_adk_fastapi_endpoint, AGUIToolset

# ADK imports
from google.adk.agents import LlmAgent
from google.adk.agents.callback_context import CallbackContext
from google.adk.sessions import InMemorySessionService, Session
from google.adk.runners import Runner
from google.adk.events import Event, EventActions
from google.adk.tools import FunctionTool, ToolContext
from google.genai.types import Content, Part , FunctionDeclaration
from google.adk.models import LlmResponse, LlmRequest
from google.genai import types

from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum

class SkillLevel(str, Enum):
    # Add your skill level values here
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"

class SpecialPreferences(str, Enum):
    # Add your special preferences values here
    VEGETARIAN = "vegetarian"
    VEGAN = "vegan"
    GLUTEN_FREE = "gluten_free"
    DAIRY_FREE = "dairy_free"
    KETO = "keto"
    LOW_CARB = "low_carb"

class CookingTime(str, Enum):
    # Add your cooking time values here
    QUICK = "under_30_min"
    MEDIUM = "30_60_min"
    LONG = "over_60_min"

class Ingredient(BaseModel):
    icon: str = Field(..., description="The icon emoji of the ingredient")
    name: str
    amount: str

class Recipe(BaseModel):
    skill_level: SkillLevel = Field(..., description="The skill level required for the recipe")
    special_preferences: Optional[List[SpecialPreferences]] = Field(
        None,
        description="A list of special preferences for the recipe"
    )
    cooking_time: Optional[CookingTime] = Field(
        None,
        description="The cooking time of the recipe"
    )
    ingredients: List[Ingredient] = Field(..., description="Entire list of ingredients for the recipe")
    instructions: List[str] = Field(..., description="Entire list of instructions for the recipe")
    changes: Optional[str] = Field(
        None,
        description="A description of the changes made to the recipe"
    )

def generate_recipe(
    tool_context: ToolContext,
    skill_level: str,
    title: str,
    special_preferences: List[str] = [],
    cooking_time: str = "",
    ingredients: List[dict] = [],
    instructions: List[str] = [],
    changes: str = ""
) -> Dict[str, str]:
    """
    Generate or update a recipe using the provided recipe data.

    Args:
        "title": {
            "type": "string",
            "description": "**REQUIRED** - The title of the recipe."
        },
        "skill_level": {
            "type": "string",
            "enum": ["Beginner","Intermediate","Advanced"],
            "description": "**REQUIRED** - The skill level required for the recipe. Must be one of the predefined skill levels (Beginner, Intermediate, Advanced)."
        },
        "special_preferences": {
            "type": "array",
            "items": {"type": "string"},
            "enum": ["High Protein","Low Carb","Spicy","Budget-Friendly","One-Pot Meal","Vegetarian","Vegan"],
            "description": "**OPTIONAL** - Special dietary preferences for the recipe as comma-separated values. Example: 'High Protein, Low Carb, Gluten Free'. Leave empty array if no special preferences."
        },
        "cooking_time": {
            "type": "string",
            "enum": [5 min, 15 min, 30 min, 45 min, 60+ min],
            "description": "**OPTIONAL** - The total cooking time for the recipe. Must be one of the predefined time slots (5 min, 15 min, 30 min, 45 min, 60+ min). Omit if time is not specified."
        },
        "ingredients": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "icon": {"type": "string", "description": "The icon emoji (not emoji code like '\x1f35e', but the actual emoji like 🥕) of the ingredient"},
                    "name": {"type": "string"},
                    "amount": {"type": "string"}
                }
            },
            "description": "Entire list of ingredients for the recipe, including the new ingredients and the ones that are already in the recipe"
        },
        "instructions": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Entire list of instructions for the recipe, including the new instructions and the ones that are already there"
            },
        "changes": {
            "type": "string",
            "description": "**OPTIONAL** - A brief description of what changes were made to the recipe compared to the previous version. Example: 'Added more spices for flavor', 'Reduced cooking time', 'Substituted ingredient X for Y'. Omit if this is a new recipe."
        }

    Returns:
        Dict indicating success status and message
    """
    try:


        # Create RecipeData object to validate structure
        recipe = {
            "title": title,
            "skill_level": skill_level,
            "special_preferences": special_preferences ,
            "cooking_time": cooking_time ,
            "ingredients": ingredients ,
            "instructions": instructions ,
            "changes": changes
        }

        # Update the session state with the new recipe
        current_recipe = tool_context.state.get("recipe", {})
        if current_recipe:
            # Merge with existing recipe
            for key, value in recipe.items():
                if value is not None or value != "":
                    current_recipe[key] = value
        else:
            current_recipe = recipe

        tool_context.state["recipe"] = current_recipe



        return {"status": "success", "message": "Recipe generated successfully"}

    except Exception as e:
        return {"status": "error", "message": f"Error generating recipe: {str(e)}"}



def on_before_agent(callback_context: CallbackContext):
    """
    Initialize recipe state if it doesn't exist.
    """

    if "recipe" not in callback_context.state:
        # Initialize with default recipe
        default_recipe =     {
            "title": "Make Your Recipe",
            "skill_level": "Beginner",
            "special_preferences": [],
            "cooking_time": '15 min',
            "ingredients": [{"icon": "🍴", "name": "Sample Ingredient", "amount": "1 unit"}],
            "instructions": ["First step instruction"]
        }
        callback_context.state["recipe"] = default_recipe


    return None


# --- Define the Callback Function ---
#  modifying the agent's system prompt to incude the current state of recipe
def before_model_modifier(
    callback_context: CallbackContext, llm_request: LlmRequest
) -> Optional[LlmResponse]:
    """Inspects/modifies the LLM request or skips the call."""
    agent_name = callback_context.agent_name
    if agent_name == "RecipeAgent":
        recipe_json = "No recipe yet"
        if "recipe" in callback_context.state and callback_context.state["recipe"] is not None:
            try:
                recipe_json = json.dumps(callback_context.state["recipe"], indent=2)
            except Exception as e:
                recipe_json = f"Error serializing recipe: {str(e)}"
        # --- Modification Example ---
        # Add a prefix to the system instruction
        original_instruction = llm_request.config.system_instruction or types.Content(role="system", parts=[])
        prefix = f"""You are a helpful assistant for creating recipes.
        This is the current state of the recipe: {recipe_json}
        You can improve the recipe by calling the generate_recipe tool."""
        # Ensure system_instruction is Content and parts list exists
        if not isinstance(original_instruction, types.Content):
            # Handle case where it might be a string (though config expects Content)
            original_instruction = types.Content(role="system", parts=[types.Part(text=str(original_instruction))])
        if not original_instruction.parts:
            original_instruction.parts.append(types.Part(text="")) # Add an empty part if none exist

        # Modify the text of the first part
        modified_text = prefix + (original_instruction.parts[0].text or "")
        original_instruction.parts[0].text = modified_text
        llm_request.config.system_instruction = original_instruction



    return None


# --- Define the Callback Function ---
def simple_after_model_modifier(
    callback_context: CallbackContext, llm_response: LlmResponse
) -> Optional[LlmResponse]:
    """Stop the consecutive tool calling of the agent"""
    agent_name = callback_context.agent_name
    # --- Inspection ---
    if agent_name == "RecipeAgent":
        original_text = ""
        if llm_response.content and llm_response.content.parts:
            # Assuming simple text response for this example
            if  llm_response.content.role=='model' and llm_response.content.parts[0].text:
                original_text = llm_response.content.parts[0].text
                callback_context._invocation_context.end_invocation = True

        elif llm_response.error_message:
            return None
        else:
            return None # Nothing to modify
    return None


shared_state_agent = LlmAgent(
        name="RecipeAgent",
        model="gemini-2.5-pro",
        instruction=f"""
        When a user asks for a recipe or wants to modify one, you MUST use the generate_recipe tool.

        IMPORTANT RULES:
        1. Always use the generate_recipe tool for any recipe-related requests
        2. When creating a new recipe, provide at least skill_level, ingredients, and instructions
        3. When modifying an existing recipe, include the changes parameter to describe what was modified
        4. Be creative and helpful in generating complete, practical recipes
        5. After using the tool, provide a brief summary of what you created or changed
        6. If user ask to improve the recipe then add more ingredients and make it healthier
        7. When you see the 'Recipe generated successfully' confirmation message, wish the user well with their cooking by telling them to enjoy their dish.

        Examples of when to use the tool:
        - "Create a pasta recipe" → Use tool with skill_level, ingredients, instructions
        - "Make it vegetarian" → Use tool with special_preferences=["vegetarian"] and changes describing the modification
        - "Add some herbs" → Use tool with updated ingredients and changes describing the addition

        Always provide complete, practical recipes that users can actually cook.
        """,
        tools=[
            AGUIToolset(), # Add the tools provided by the AG-UI client
            generate_recipe,
        ],
        before_agent_callback=on_before_agent,
        before_model_callback=before_model_modifier,
        after_model_callback = simple_after_model_modifier
    )

# Create ADK middleware agent instance
adk_shared_state_agent = ADKAgent(
    adk_agent=shared_state_agent,
    app_name="demo_app",
    user_id="demo_user",
    session_timeout_seconds=3600,
    use_in_memory_services=True
)

# Create FastAPI app
app = FastAPI(title="ADK Middleware Shared State")

# Add the ADK endpoint
add_adk_fastapi_endpoint(app, adk_shared_state_agent, path="/")

```