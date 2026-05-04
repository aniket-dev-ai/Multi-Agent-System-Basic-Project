const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Security & Middleware Configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per windowMs
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Configuration
const PROCESS_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const STEP_PATTERNS = {
  searching: /step 1/i,
  reading: /step 2/i,
  writing: /step 3/i,
  critic: /step 4/i,
};
const MAX_TOPIC_LENGTH = 500;
const VALID_TOPIC_REGEX = /^[\w\s\-.'()&,]+$/;

/**
 * Get Python executable path with validation.
 * @returns {string} Path to Python executable
 * @throws {Error} If Python not found
 */
function getPythonCommand() {
  const localWindowsPython = path.join(__dirname, '.venv', 'Scripts', 'python.exe');
  const localPosixPython = path.join(__dirname, '.venv', 'bin', 'python');

  if (fs.existsSync(localWindowsPython)) {
    return localWindowsPython;
  }
  if (fs.existsSync(localPosixPython)) {
    return localPosixPython;
  }

  const defaultPython = process.platform === 'win32' ? 'python' : 'python3';
  // Validate Python is available
  const { execSync } = require('child_process');
  try {
    execSync(`${defaultPython} --version`, { stdio: 'pipe' });
    return defaultPython;
  } catch (error) {
    throw new Error('Python not found in system PATH');
  }
}

/**
 * Sanitize topic input for security.
 * @param {string} topic - Raw topic input
 * @returns {string} Sanitized topic
 * @throws {Error} If topic is invalid
 */
function validateAndSanitizeTopic(topic) {
  if (typeof topic !== 'string') {
    throw new Error('Topic must be a string');
  }
  
  const sanitized = topic.trim();
  
  if (sanitized.length === 0) {
    throw new Error('Topic cannot be empty');
  }
  
  if (sanitized.length > MAX_TOPIC_LENGTH) {
    throw new Error(`Topic must be under ${MAX_TOPIC_LENGTH} characters`);
  }
  
  if (!VALID_TOPIC_REGEX.test(sanitized)) {
    throw new Error('Topic contains invalid characters');
  }
  
  return sanitized;
}

/**
 * Detect pipeline step from text.
 * @param {string} text - Output text
 * @returns {string} Step name
 */
function detectStep(text) {
  for (const [step, pattern] of Object.entries(STEP_PATTERNS)) {
    if (pattern.test(text)) return step;
  }
  return null;
}

/**
 * Run research pipeline with timeout and error handling.
 * @param {string} topic - Sanitized research topic
 * @returns {Promise<Object>} Research results
 * @throws {Error} If pipeline fails or times out
 */
/**
 * Run research pipeline with progress reporting.
 * @param {string} topic - Sanitized research topic
 * @param {Function} onProgress - Callback for progress updates
 * @returns {Promise<Object>} Research results
 */
function runResearch(topic, onProgress = () => {}) {
  return new Promise((resolve, reject) => {
    let pythonCommand;
    try {
      pythonCommand = getPythonCommand();
    } catch (error) {
      return reject(error);
    }

    const scriptPath = path.join(__dirname, 'run_pipeline_json.py');

    // Spawn with timeout
    const child = spawn(pythonCommand, [scriptPath, topic], {
      cwd: __dirname,
      env: { ...process.env, PYTHONUNBUFFERED: '1' },
      windowsHide: true,
      timeout: PROCESS_TIMEOUT,
    });

    const stdoutBuffer = [];
    const stderrBuffer = [];
    let currentStep = 'initializing';
    let isResolved = false;

    // Timeout handler
    const timeoutHandle = setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        child.kill('SIGTERM');
        reject(new Error(`Research pipeline timed out after ${PROCESS_TIMEOUT / 1000}s`));
      }
    }, PROCESS_TIMEOUT);

    // stdout handler
    child.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      stdoutBuffer.push(text);

      const newStep = detectStep(text);
      if (newStep && newStep !== currentStep) {
        currentStep = newStep;
        onProgress(currentStep);
        console.log(`[PIPELINE] Step: ${currentStep}`);
      }
      console.log(`[PYTHON] ${text.trim()}`);
    });

    // stderr handler
    child.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      stderrBuffer.push(text);
      console.error(`[PYTHON ERROR] ${text.trim()}`);
    });

    // Error handler
    child.on('error', (error) => {
      if (!isResolved) {
        isResolved = true;
        clearTimeout(timeoutHandle);
        reject(new Error(`Failed to spawn Python process: ${error.message}`));
      }
    });

    // Close handler
    child.on('close', (code) => {
      clearTimeout(timeoutHandle);
      
      if (isResolved) return; // Already handled by timeout
      isResolved = true;

      console.log(`[PYTHON] Process exited with code: ${code}`);

      if (code !== 0) {
        const errorMsg = stderrBuffer.join('') || `Python exited with code ${code}`;
        return reject(new Error(`Pipeline failed: ${errorMsg}`));
      }

      const rawOutput = stdoutBuffer.join('').trim();
      if (!rawOutput) {
        return reject(new Error('No output from Python'));
      }

      // Find the JSON object in the output (it might contain progress text)
      try {
        const jsonMatch = rawOutput.match(/\{[\s\S]*\}$/);
        if (!jsonMatch) {
          throw new Error('Could not find JSON in output');
        }
        const parsed = JSON.parse(jsonMatch[0]);
        // Validate output structure
        if (!parsed.search_results || !parsed.report || !parsed.feedback) {
          return reject(new Error('Invalid output structure from pipeline'));
        }
        resolve(parsed);
      } catch (error) {
        reject(
          new Error(`JSON parse error: ${error.message}. Output: ${rawOutput.substring(0, 200)}`)
        );
      }
    });
  });
}

/**
 * Health check endpoint.
 */
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * SSE Research endpoint for real-time updates.
 */
app.get('/api/research/stream', async (req, res) => {
  const { topic: rawTopic } = req.query;

  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const topic = validateAndSanitizeTopic(rawTopic);
    console.log(`[API] Starting stream research for topic: ${topic}`);

    sendEvent('status', { step: 'initializing', message: 'Starting research agents...' });

    const result = await runResearch(topic, (step) => {
      const messages = {
        searching: 'Search agent is looking for information...',
        reading: 'Reader agent is analyzing search results...',
        writing: 'Writer agent is drafting the report...',
        critic: 'Critic agent is reviewing the report...',
      };
      sendEvent('status', { step, message: messages[step] || `Running ${step}...` });
    });

    sendEvent('result', {
      success: true,
      topic,
      ...result,
      timestamp: new Date().toISOString(),
    });
    
    res.end();
  } catch (error) {
    console.error(`[API ERROR] ${error.message}`);
    sendEvent('error', { error: error.message });
    res.end();
  }
});

/**
 * Research endpoint with validation and error handling (Legacy POST).
 */
app.post('/api/research', async (req, res) => {
  try {
    // Validate topic
    const topic = validateAndSanitizeTopic(req.body.topic);

    console.log(`[API] Starting research for topic: ${topic}`);
    const result = await runResearch(topic);

    res.json({
      success: true,
      topic,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`[API ERROR] ${error.message}`);

    // Determine status code based on error type
    let statusCode = 500;
    if (error.message.includes('Topic')) statusCode = 400;
    if (error.message.includes('timed out')) statusCode = 504;

    res.status(statusCode).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});


/**
 * 404 handler.
 */
app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(port, () => {
  console.log(`[SERVER] Research API listening on port ${port}`);
  console.log(`[SERVER] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[SERVER] CORS origin: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[SERVER] SIGTERM signal received: closing server');
  process.exit(0);
});
