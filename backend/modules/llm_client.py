import json
from typing import Type, TypeVar, Union, Any, Dict, List
from pydantic import BaseModel
from smolagents import LiteLLMModel
from config import MODEL_ID, API_BASE, NUM_CTX, TEMPERATURE

# instantiate once
def _init_llm() -> LiteLLMModel:
    return LiteLLMModel(
        model_id=MODEL_ID,
        api_base=API_BASE,
        num_ctx=NUM_CTX,
        temperature=TEMPERATURE,
        flatten_messages_as_text=True,
    )

_llm: LiteLLMModel = _init_llm()

# Generic type for Pydantic models
t = TypeVar("t", bound=BaseModel)

def summarize(
    prompt: str,
    max_tokens: int = 300,
    response_model: Type[BaseModel] = None,
    extra_instructions: str = "",
) -> Union[str, BaseModel]:
    """
    Send a single-turn user prompt to the LLM and return its reply.

    If `response_model` (a subclass of pydantic.BaseModel) is provided, the function
    instructs the LLM to output valid JSON matching `response_model.schema()` and
    returns an instance of that model.

    :param prompt: The user prompt to send.
    :param max_tokens: Maximum tokens for the LLM response.
    :param response_model: Optional pydantic model class to enforce structured output.
    :param extra_instructions: Additional system instructions to guide the model.
    :return: Either a raw string or a parsed BaseModel instance.
    """
    messages: List[Dict[str, Any]] = []

    # Prepare system message for structured output or extra guidance
    if response_model is not None and issubclass(response_model, BaseModel):
        schema = response_model.schema_json(indent=None)
        sys_text = (
            f"Respond with valid JSON that matches this schema: {schema}."
        )
        if extra_instructions:
            sys_text = f"{extra_instructions}\n{sys_text}"
        messages.append({"role": "system", "content": [{"type": "text", "text": sys_text}]})
    elif extra_instructions:
        messages.append({"role": "system", "content": [{"type": "text", "text": extra_instructions}]})

    # Add the actual user message
    messages.append({
        "role": "user",
        "content": [{"type": "text", "text": prompt}],
    })

    # Call the LLM
    resp = _llm(messages, max_tokens=max_tokens)

    if resp is not None:
        content = resp.content
        print("Response content:", content)
    else:
        content = "No response from LLM."


    # If structured output is requested, parse JSON and validate
    if response_model is not None and issubclass(response_model, BaseModel):
        try:
            parsed = json.loads(content)
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse JSON from LLM response: {e}\nContent was: {content}")
        return response_model.parse_obj(parsed)

    # Otherwise return raw text
    return content

def chat(
    history: list[dict],
    max_tokens: int = 300,
) -> str:
    """
+    Send a multi‐turn conversation to the LLM.
+    `history` should be a list of message dicts:
+       { "role": "user" | "system" | "assistant",
+         "content": [{ "type": "text", "text": "..."}] }
+    Returns the assistant's raw text response.
+    """
    resp = _llm(history, max_tokens=max_tokens)
    print("Response from chat function:", resp)
    # same extraction logic as in summarize()
    if resp is not None:
        content = resp.content
        print("Response content:", content)
    else:
        content = "No response from LLM."

    return content