"""Agent builders for research pipeline."""

from typing import Any
import logging

from langchain.agents import create_agent
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from tool import web_search, scrape_url
from dotenv import load_dotenv

load_dotenv()

# Configure logging
logger = logging.getLogger(__name__)

# Initialize LLM with valid model
try:
    llm = ChatOpenAI(model="gpt-4.1-mini-2025-04-14", temperature=0.2, max_retries=2)
except Exception as e:
    logger.warning(f"Failed to initialize gpt-4.1-mini-2025-04-14: {e}. Falling back to gpt-4.1-mini-2025-04-14")
    llm = ChatOpenAI(model="gpt-4.1-mini-2025-04-14", temperature=0.2, max_retries=2)

def build_search_agent() -> Any:
    """Build search agent with web search tool."""
    try:
        return create_agent(model=llm, tools=[web_search])
    except Exception as e:
        logger.error(f"Failed to build search agent: {e}")
        raise


def build_reader_agent() -> Any:
    """Build reader agent with URL scraping tool."""
    try:
        return create_agent(model=llm, tools=[scrape_url])
    except Exception as e:
        logger.error(f"Failed to build reader agent: {e}")
        raise
    
# Writer chain
writer_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are an expert research writer. Write clear, structured and insightful reports."),
    ("human", """Write a detailed research report on the topic below.

Topic: {topic}

Research Gathered:
{research}

Structure the report as:
- Introduction
- Key Findings (minimum 5 well-explained points)
- Conclusion
- Sources (list all URLs found in the research)

Be detailed, factual and professional."""),
])

writer_chain = writer_prompt | llm | StrOutputParser()

# Critic chain
critic_prompt = ChatPromptTemplate.from_messages([
     ("system", "You are a sharp and constructive research critic. Be honest and specific."),
    ("human", """Review the research report below and evaluate it strictly.

Report:
{report}

Respond in this exact format:

Score: X/10

Strengths:
- ...
- ...

Areas to Improve:
- ...
- ...

One line verdict:
..."""),
])

critic_chain = critic_prompt | llm | StrOutputParser()