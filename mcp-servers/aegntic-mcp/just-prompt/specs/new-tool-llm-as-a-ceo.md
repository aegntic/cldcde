Feature Request: LLM as a CEO

## Implementation Notes

- Create a new tool 'ceo_and_board' in src/just_prompt/molecules/ceo_and_board_prompt.py
- Definition ceo_and_board_prompt(from_file: str, output_dir: str = ., models_prefixed_by_provider: List[str] = None, ceo_model: str = DEFAULT_CEO_MODEL, ceo_decision_prompt: str = DEFAULT_CEO_DECISION_PROMPT) -> None:
- Use the existing prompt_from_file_to_file function to generate responses from 'board' aka models_prefixed_by_provider.
- Then run the ceo_decision_prompt (xml style prompt) with the board's responses, and the original question prompt to get a decision.
- DEFAULT_CEO_DECISION_PROMPT is
  ```xml
        <purpose>
            You are a CEO of a company. You are given a list of responses from your board of directors. Your job is to take in the original question prompt, and each of the board members' responses, and choose the best direction for your company.
        </purpose>
        <instructions>
            <instruction>Each board member has proposed an answer to the question posed in the prompt.</instruction>
            <instruction>Given the original question prompt, and each of the board members' responses, choose the best answer.</instruction>
            <instruction>Tally the votes of the board members, choose the best direction, and explain why you chose it.</instruction>
            <instruction>To preserve anonymity, we will use model names instead of real names of your board members. When responding, use the model names in your response.</instruction>
            <instruction>As a CEO, you breakdown the decision into several categories including: risk, reward, timeline, and resources. In addition to these guiding categories, you also consider the board members' expertise and experience. As a bleeding edge CEO, you also invent new dimensions of decision making to help you make the best decision for your company.</instruction>
            <instruction>Your final CEO response should be in markdown format with a comprehensive explanation of your decision. Start the top of the file with a title that says "CEO Decision", include a table of contents, briefly describe the question/problem at hand then dive into several sections. One of your first sections should be a quick summary of your decision, then breakdown each of the boards decisions into sections with your commentary on each. Where we lead into your decision with the categories of your decision making process, and then we lead into your final decision.</instruction>
        </instructions>
        
        <original-question>{original_prompt}</original-question>
        
        <board-decisions>
            <board-response>
                <model-name>...</model-name>
                <response>...</response>
            </board-response>
            <board-response>
                <model-name>...</model-name>
                <response>...</response>
            </board-response>
            ...
        </board-decisions>
    ```
- DEFAULT_CEO_MODEL is openai:o3
- The prompt_from_file_to_file will output a file for each board member's response in the output_dir.
- Once they've been created, the ceo_and_board_prompt will read in the board member's responses, and the original question prompt into the ceo_decision_prompt and make another call with the ceo_model to get a decision. Write the decision to a file in the output_dir/ceo_decision.md.
- Be sure to validate this functionality with uv run pytest <path-to-test-file>
- After you implement update the README.md with the new tool's functionality and run `git ls-files` to update the directory tree in the readme with the new files.
- Make sure this functionality works end to end. This functionality will be exposed as an MCP tool in the server.py file.

## Relevant Files
- src/just_prompt/server.py
- src/just_prompt/molecules/ceo_and_board_prompt.py
- src/just_prompt/molecules/prompt_from_file_to_file.py
- src/just_prompt/molecules/prompt_from_file.py
- src/just_prompt/molecules/prompt.py
- src/just_prompt/atoms/llm_providers/openai.py
- src/just_prompt/atoms/shared/utils.py
- src/just_prompt/tests/molecules/test_ceo_and_board_prompt.py

## Validation (Close the Loop)
> Be sure to test this new capability with uv run pytest.

- `uv run pytest src/just_prompt/tests/molecules/test_ceo_and_board_prompt.py`
- `uv run just-prompt --help` to validate the tool works as expected.