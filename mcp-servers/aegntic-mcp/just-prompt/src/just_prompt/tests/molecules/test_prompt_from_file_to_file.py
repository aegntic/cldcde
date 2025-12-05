"""
Tests for prompt_from_file_to_file functionality.
"""

import pytest
import os
import tempfile
import shutil
from dotenv import load_dotenv
from just_prompt.molecules.prompt_from_file_to_file import prompt_from_file_to_file

# Load environment variables
load_dotenv()


def test_directory_creation_and_file_writing():
    """Test that the output directory is created and files are written with real API responses."""
    # Create temporary input file with a simple question
    with tempfile.NamedTemporaryFile(mode='w+', delete=False) as temp_file:
        temp_file.write("What is the capital of France?")
        input_path = temp_file.name
    
    # Create a deep non-existent directory path
    temp_dir = os.path.join(tempfile.gettempdir(), "just_prompt_test_dir", "output")
    
    try:
        # Make real API call
        file_paths = prompt_from_file_to_file(
            input_path, 
            ["o:gpt-4o-mini"],
            temp_dir
        )
        
        # Assertions
        assert isinstance(file_paths, list)
        assert len(file_paths) == 1
        
        # Check that the file exists
        assert os.path.exists(file_paths[0])
        
        # Check that the file has a .md extension
        assert file_paths[0].endswith('.md')
        
        # Check file content contains the expected response
        with open(file_paths[0], 'r') as f:
            content = f.read()
            assert "paris" in content.lower() or "Paris" in content
    finally:
        # Clean up
        os.unlink(input_path)
        # Remove the created directory and all its contents
        if os.path.exists(os.path.dirname(temp_dir)):
            shutil.rmtree(os.path.dirname(temp_dir))