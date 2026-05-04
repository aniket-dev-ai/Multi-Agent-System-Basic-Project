"""Research pipeline orchestrator."""

from typing import Any, Optional
import json
import logging
from datetime import datetime
import sys

from tenacity import retry, stop_after_attempt, wait_exponential

from agents import build_reader_agent, build_search_agent, writer_chain, critic_chain

# Configure logging
logger = logging.getLogger(__name__)
handler = logging.StreamHandler(sys.stderr)
formatter = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
handler.setFormatter(formatter)
logger.addHandler(handler)
logger.setLevel(logging.INFO)

LOG_FILE = "./log.txt"
MAX_CONTENT_LENGTH = 10000  # Max chars for content chunks
PIPELINE_TIMEOUT = 300  # 5 minutes


def log_struct(step: str, message: str) -> None:
    """Log structured entry to file (consolidated I/O)."""
    entry = {
        "timestamp": datetime.now().isoformat(),
        "step": step,
        "message": message
    }
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    except IOError as e:
        logger.error(f"Failed to write log: {e}")


@retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=1, min=2, max=10))
def _invoke_agent(agent: Any, messages: list) -> dict:
    """Invoke agent with retry logic."""
    return agent.invoke({"messages": messages})


def _validate_topic(topic: str) -> str:
    """Validate and sanitize topic input."""
    if not topic or not isinstance(topic, str):
        raise ValueError("Topic must be a non-empty string")
    topic = topic.strip()
    if len(topic) > 500:
        raise ValueError("Topic must be under 500 characters")
    if len(topic) < 2:
        raise ValueError("Topic must be at least 2 characters")
    return topic


def _extract_content(result: dict) -> str:
    """Extract and validate content from agent result."""
    try:
        if not isinstance(result, dict) or "messages" not in result:
            raise ValueError("Invalid result structure")
        messages = result["messages"]
        if not messages or len(messages) == 0:
            raise ValueError("No messages in result")
        content = messages[-1].content
        if not isinstance(content, str):
            raise ValueError("Content is not a string")
        return content
    except (KeyError, AttributeError, IndexError) as e:
        raise ValueError(f"Failed to extract content from result: {e}")


def run_research_pipeline(topic: str, verbose: bool = True, on_progress: Optional[callable] = None) -> dict:
    """Execute research pipeline with error handling.
    
    Args:
        topic: Research topic to analyze
        verbose: Whether to print progress
        on_progress: Optional callback function receiving (step_id, message)
        
    Returns:
        Dictionary with search_results, scraped_content, report, feedback
        
    Raises:
        ValueError: If topic is invalid
        Exception: If pipeline steps fail
    """
    # Validate input
    topic = _validate_topic(topic)
    state: dict[str, str] = {}

    def log(message: str, step_id: Optional[str] = None) -> None:
        if verbose:
            print(message)
        if on_progress and step_id:
            on_progress(step_id, message)

    try:
        # Step 1: Search
        log("\n" + "=" * 50)
        log("Step 1 - Search agent is working...", "searching")
        log("=" * 50)
        
        search_agent = build_search_agent()
        search_result = _invoke_agent(
            search_agent,
            [("user", f"Find recent, reliable and detailed information about: {topic}")]
        )
        state["search_results"] = _extract_content(search_result)
        log_struct("step_1", "Search completed successfully")
        log(f"Search result ({len(state['search_results'])} chars)\n")
        if verbose:
            print(state["search_results"][:500] + "...")

        # Step 2: Read/Scrape
        log("\n" + "=" * 50)
        log("Step 2 - Reader agent is working...", "reading")
        log("=" * 50)
        
        reader_agent = build_reader_agent()
        content_summary = state["search_results"][:MAX_CONTENT_LENGTH]
        reader_result = _invoke_agent(
            reader_agent,
            [(
                "user",
                f"Based on these search results about '{topic}', "
                f"pick the most relevant URL and scrape it for deeper content.\n\n"
                f"Search Results:\n{content_summary}"
            )]
        )
        state["scraped_content"] = _extract_content(reader_result)
        log_struct("step_2", "Content scraping completed")
        log(f"Scraped content ({len(state['scraped_content'])} chars)\n")
        if verbose:
            print(state["scraped_content"][:500] + "...")

        # Step 3: Generate Report
        log("\n" + "=" * 50)
        log("Step 3 - Drafting the report...", "writing")
        log("=" * 50)
        
        research_combined = (
            f"SEARCH RESULTS:\n{state['search_results']}\n\n"
            f"DETAILED SCRAPED CONTENT:\n{state['scraped_content']}"
        )
        state["report"] = writer_chain.invoke(
            {"topic": topic, "research": research_combined}
        )
        log_struct("step_3", "Report generation completed")
        log(f"Report ({len(state['report'])} chars)\n")
        if verbose:
            print(state["report"][:500] + "...")

        # Step 4: Critic Review
        log("\n" + "=" * 50)
        log("Step 4 - Critic is reviewing the report...", "critic")
        log("=" * 50)
        
        state["feedback"] = critic_chain.invoke({"report": state["report"]})
        log_struct("step_4", "Critique completed")
        log(f"Feedback ({len(state['feedback'])} chars)\n")
        if verbose:
            print(state["feedback"])

        logger.info("Pipeline completed successfully")
        return state

    except ValueError as e:
        logger.error(f"Validation error: {e}")
        log_struct("error", f"Validation error: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Pipeline failed: {e}", exc_info=True)
        log_struct("error", f"Pipeline error: {str(e)}")
        raise


if __name__ == "__main__":
    try:
        topic = input("\nEnter a research topic: ").strip()
        result = run_research_pipeline(topic, verbose=True)
        logger.info("Research completed successfully")
    except ValueError as e:
        logger.error(f"Invalid input: {e}")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Pipeline failed: {e}")
        sys.exit(1)