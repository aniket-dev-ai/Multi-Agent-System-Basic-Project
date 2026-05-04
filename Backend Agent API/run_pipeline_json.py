"""CLI runner for the research pipeline with JSON output."""

import argparse
import json
import sys

from pipeline import run_research_pipeline


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the research pipeline and print JSON output.")
    parser.add_argument("topic", help="Research topic to analyze")
    args = parser.parse_args()

    try:
        result = run_research_pipeline(args.topic, verbose=True)
        print(json.dumps(result, ensure_ascii=False))
    except ValueError as e:
        print(json.dumps({"success": False, "error": str(e)}), file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
