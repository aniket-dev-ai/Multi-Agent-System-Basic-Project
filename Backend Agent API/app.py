import os
import json
import queue
import threading
from datetime import datetime
from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
from dotenv import load_dotenv

from pipeline import run_research_pipeline

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Configure CORS
# Allowed origin from environment or default
allowed_origin = os.getenv('CORS_ORIGIN', 'http://localhost:3001')
CORS(app, resources={r"/api/*": {"origins": allowed_origin}}, supports_credentials=True)

# Configuration
MAX_TOPIC_LENGTH = 500

def validate_topic(topic):
    if not isinstance(topic, str):
        return None, "Topic must be a string"
    
    sanitized = topic.strip()
    if not sanitized:
        return None, "Topic cannot be empty"
    
    if len(sanitized) > MAX_TOPIC_LENGTH:
        return None, f"Topic must be under {MAX_TOPIC_LENGTH} characters"
    
    return sanitized, None

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "engine": "Flask"
    })

@app.route('/api/research', methods=['POST'])
def research_legacy():
    """Legacy POST endpoint for standard JSON response."""
    data = request.json
    if not data or 'topic' not in data:
        return jsonify({"success": False, "error": "Missing topic"}), 400
    
    topic, error = validate_topic(data['topic'])
    if error:
        return jsonify({"success": False, "error": error}), 400
    
    try:
        result = run_research_pipeline(topic, verbose=False)
        return jsonify({
            "success": True,
            "topic": topic,
            **result,
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            "success": False, 
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500

@app.route('/api/research/stream', methods=['GET'])
def research_stream():
    """SSE endpoint for real-time updates."""
    raw_topic = request.args.get('topic')
    topic, error = validate_topic(raw_topic)
    
    if error:
        return jsonify({"success": False, "error": error}), 400

    def event_generator():
        # A queue to communicate between the pipeline thread and the generator
        q = queue.Queue()

        def on_progress(step, message):
            messages = {
                'searching': 'Search agent is looking for information...',
                'reading': 'Reader agent is analyzing search results...',
                'writing': 'Writer agent is drafting the report...',
                'critic': 'Critic agent is reviewing the report...',
            }
            q.put(('status', {
                'step': step, 
                'message': messages.get(step, message)
            }))

        def run_pipeline():
            try:
                result = run_research_pipeline(topic, verbose=True, on_progress=on_progress)
                q.put(('result', {
                    'success': True,
                    'topic': topic,
                    **result,
                    'timestamp': datetime.now().isoformat()
                }))
            except Exception as e:
                q.put(('error', {'error': str(e)}))
            finally:
                q.put(('done', None))

        # Start pipeline in a separate thread
        thread = threading.Thread(target=run_pipeline)
        thread.start()

        # Send initial status
        yield f"event: status\ndata: {json.dumps({'step': 'initializing', 'message': 'Starting research agents...'})}\n\n"

        while True:
            try:
                event_type, data = q.get(timeout=300) # 5 min timeout
                if event_type == 'done':
                    break
                
                yield f"event: {event_type}\ndata: {json.dumps(data)}\n\n"
                
                if event_type in ['result', 'error']:
                    break
            except queue.Empty:
                yield f"event: error\ndata: {json.dumps({'error': 'Pipeline timed out'})}\n\n"
                break

    return Response(stream_with_context(event_generator()), mimetype='text/event-stream')

if __name__ == '__main__':
    port = int(os.getenv('PORT', 3000))
    debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    print(f" * Starting Research API on port {port} (Flask)")
    app.run(host='0.0.0.0', port=port, debug=debug, threaded=True)
