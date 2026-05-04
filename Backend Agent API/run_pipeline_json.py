import argparse
import json

from pipeline import run_research_pipeline


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the research pipeline and print JSON output.")
    parser.add_argument("topic", help="Research topic to analyze")
    args = parser.parse_args()

    result = run_research_pipeline(args.topic, verbose=True)
    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
