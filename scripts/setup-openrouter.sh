#!/bin/bash

echo "🤖 OpenRouter Setup for cldcde.cc"
echo "================================"
echo ""
echo "This script will help you set up OpenRouter for AI-powered blog generation."
echo ""
echo "Step 1: Get your OpenRouter API key"
echo "-----------------------------------"
echo "1. Visit https://openrouter.ai"
echo "2. Sign up for a free account"
echo "3. Go to https://openrouter.ai/keys"
echo "4. Create a new API key"
echo ""
read -p "Press Enter when you have your API key ready..."
echo ""

echo "Step 2: Add the API key to Cloudflare"
echo "-------------------------------------"
echo "Run this command and paste your API key when prompted:"
echo ""
echo "  wrangler secret put OPENROUTER_API_KEY"
echo ""
echo "Step 3: Test the setup"
echo "----------------------"
echo "After adding the secret, redeploy the worker:"
echo ""
echo "  bunx wrangler deploy -c wrangler-ultra.toml"
echo ""
echo "Step 4: Verify it's working"
echo "---------------------------"
echo "Check the auto-generation logs at:"
echo "  https://cldcde-api.aegntic.workers.dev/api/monitoring/anthropic/stats"
echo ""
echo "Free Models Available:"
echo "- Google Gemini 2.0 Flash (Best quality, 1M context)"
echo "- Meta Llama 3.2 3B (Fast, 128K context)"
echo "- Mistral 7B Instruct (Good for code)"
echo "- Qwen 2 7B (Technical writing)"
echo ""
echo "Happy generating! 🚀"
echo ""
echo "🔧 Setting up shell aliases for deprecated commands..."

# Migration aliases for deprecated commands
# TODO: Remove these after one major release
echo "# Migration aliases for deprecated cldcde commands" >> ~/.bashrc
echo "# TODO: Remove these after one major release" >> ~/.bashrc
echo "alias cldex='echo \"⚠️ cldex is deprecated ⇒ use cldism\" && cldism \"\$@\"'" >> ~/.bashrc
echo "alias cldlist='echo \"⚠️ cldlist is deprecated ⇒ use cldism-list\" && cldism-list \"\$@\"'" >> ~/.bashrc
echo "alias cldshow='echo \"⚠️ cldshow is deprecated ⇒ use cldism-show\" && cldism-show \"\$@\"'" >> ~/.bashrc

# Also add to zshrc if it exists
if [ -f ~/.zshrc ]; then
    echo "# Migration aliases for deprecated cldcde commands" >> ~/.zshrc
    echo "# TODO: Remove these after one major release" >> ~/.zshrc
    echo "alias cldex='echo \"⚠️ cldex is deprecated ⇒ use cldism\" && cldism \"\$@\"'" >> ~/.zshrc
    echo "alias cldlist='echo \"⚠️ cldlist is deprecated ⇒ use cldism-list\" && cldism-list \"\$@\"'" >> ~/.zshrc
    echo "alias cldshow='echo \"⚠️ cldshow is deprecated ⇒ use cldism-show\" && cldism-show \"\$@\"'" >> ~/.zshrc
fi

echo "Migration aliases added to shell configuration files."
