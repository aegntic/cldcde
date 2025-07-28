from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="aegnt",
    version="0.1.0",
    author="AEGNTIC",
    author_email="hello@aegntic.com",
    description="Advanced Engineered General Network of Thinkers - AI agent collaboration framework",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/aegntic/cldcde/tree/main/aegnt",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "Topic :: Software Development :: Libraries :: Application Frameworks",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
    python_requires=">=3.8",
    install_requires=[
        "asyncio",
        "aiohttp",
        "pydantic>=2.0",
        "python-dotenv",
        "click",
        "rich",
        "httpx",
        "websockets",
    ],
    extras_require={
        "dev": [
            "pytest",
            "pytest-asyncio",
            "pytest-cov",
            "black",
            "flake8",
            "mypy",
        ],
    },
    entry_points={
        "console_scripts": [
            "aegnt=aegnt.cli:main",
        ],
    },
    include_package_data=True,
    package_data={
        "aegnt": [
            "agents/*.md",
            "prompts/**/*.md",
            "instructions/*.md",
            "tools/*.json",
        ],
    },
)