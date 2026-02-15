// ./js/import-manager.js
/**
 * Import manager for the Slow Build Check-In questionnaire.
 * 
 * Handles importing saved questionnaire results from .txt and .json files,
 * parsing participant names and responses, validating compatibility between
 * files, and generating AI prompts for individuals or couples.
 * 
 * Usage: ImportManager.parseFile(file) returns parsed data with name, mode, responses.
 */

const ImportManager = {
    /**
     * Parse an uploaded file (JSON or TXT).
     * @param {File} file - The uploaded file.
     * @returns {Promise<Object>} Parsed data with name, mode, questionCount, responses.
     */
    async parseFile(file) {
        // Guard against malformed/oversized inputs from edited files.
        // Exported files from this app are much smaller than this ceiling.
        const MAX_IMPORT_SIZE_BYTES = 5 * 1024 * 1024;
        if (file.size > MAX_IMPORT_SIZE_BYTES) {
            throw new Error('File is too large. Please import a file under 5MB.');
        }

        const text = await file.text();
        const fileName = file.name.toLowerCase();

        if (fileName.endsWith('.json')) {
            return await this.parseJSON(text, file.name);
        } else if (fileName.endsWith('.txt')) {
            return this.parseTXT(text, file.name);
        } else {
            throw new Error('Unsupported file format. Please upload a .json or .txt file.');
        }
    },

    /**
     * Parse JSON format results.
     * @param {string} text - File content.
     * @param {string} fileName - Original file name.
     * @returns {Object} Parsed data.
     */
    async parseJSON(text, fileName) {
        try {
            const data = JSON.parse(text);

            // Validate structure
            if (!data.meta || !data.responses) {
                throw new Error('Invalid JSON format: missing meta or responses.');
            }

            const name = data.meta.participantName || 'Unknown';
            const mode = data.meta.mode || (data.stats?.total > 20 ? 'full' : 'lite');
            const questionCount = data.stats?.total || Object.keys(data.responses).length;

            // HYDRATION: Try to load the specific phase questions for this file
            // This ensures we have the correct Labels for the Values (e.g. "Weekly" instead of "weekly_10")
            let externalQuestions = null;
            if (data.meta?.artifact?.id && typeof DataLoader !== 'undefined') {
                try {
                    const phaseId = await DataLoader.getPhaseIdByArtifactId(data.meta.artifact.id);
                    if (phaseId) {
                        const phase = DataLoader.getPhases().find(p => p.id === phaseId);
                        if (phase) {
                            const res = await fetch(`./${phase.data_path}/questions.json?v=${DataLoader.CACHE_VERSION || '1'}`);
                            if (res.ok) {
                                const qData = await res.json();
                                // Store as array for easy searching in formatJSONResponses
                                if (qData.questions) {
                                    externalQuestions = Object.values(qData.questions);
                                }
                            }
                        }
                    }
                } catch (err) {
                    console.warn('ImportManager: Failed to hydrate phase questions:', err);
                }
            }

            // Build formatted responses for AI prompt
            const formattedResponses = this.formatJSONResponses(data, externalQuestions);

            // Extract artifact ID for validation
            const artifactId = data.meta?.artifact?.id || null;

            return {
                name,
                mode,
                questionCount,
                meta: data.meta || {},
                artifactId,
                stats: data.stats || {},
                responses: data.responses,
                formattedText: formattedResponses,
                fileName,
                format: 'json'
            };
        } catch (error) {
            throw new Error(`Failed to parse JSON file: ${error.message}`);
        }
    },

    /**
     * Parse TXT format results.
     * @param {string} text - File content.
     * @param {string} fileName - Original file name.
     * @returns {Object} Parsed data.
     */
    parseTXT(text, fileName) {
        try {
            // Extract participant name from "Completed by: NAME"
            const nameMatch = text.match(/Completed by:\s*(.+)/i);
            const name = nameMatch ? nameMatch[1].trim() : 'Unknown';

            // Extract question count from "Progress: X/Y questions"
            const progressMatch = text.match(/Progress:\s*(\d+)\/(\d+)\s*questions/i);
            const questionCount = progressMatch ? parseInt(progressMatch[2], 10) : 0;

            // Determine mode based on question count
            const mode = questionCount > 20 ? 'full' : 'lite';

            // Parse structured responses from TXT
            const responses = this.extractTXTResponses(text);

            // The text file itself is already formatted for reading
            const formattedText = text.trim();

            return {
                name,
                mode,
                questionCount,
                responses,
                formattedText,
                fileName,
                format: 'txt'
            };
        } catch (error) {
            throw new Error(`Failed to parse TXT file: ${error.message}`);
        }
    },

    /**
     * Extract structured responses from TXT format.
     * Parses Q{N}: lines and answers after ➤
     * @param {string} text - Full TXT content.
     * @returns {Object} Responses keyed by question ID (q01, q02, etc.)
     */
    extractTXTResponses(text) {
        const responses = {};
        const lines = text.split('\n');

        let currentQuestion = null;
        let currentTitle = '';
        let currentPrompt = '';
        let collectingAnswer = false;
        let answerLines = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Match question line: Q1: Title or Q01: Title
            const questionMatch = line.match(/^Q(\d+):\s*(.+)/);
            if (questionMatch) {
                // Save previous question's answer if exists
                if (currentQuestion && answerLines.length > 0) {
                    responses[currentQuestion] = this.parseTXTAnswer(answerLines.join(' ').trim(), currentTitle);
                }

                // Start new question
                const qNum = parseInt(questionMatch[1], 10);
                currentQuestion = `q${qNum.toString().padStart(2, '0')}`;
                currentTitle = questionMatch[2].trim();
                currentPrompt = '';
                collectingAnswer = false;
                answerLines = [];
                continue;
            }

            // Match prompt line (in quotes)
            const promptMatch = line.match(/^\s*"(.+)"$/);
            if (promptMatch && currentQuestion && !collectingAnswer) {
                currentPrompt = promptMatch[1];
                continue;
            }

            // Match answer line (starts with ➤)
            if (line.includes('➤')) {
                collectingAnswer = true;
                const answerPart = line.split('➤')[1] || '';
                answerLines.push(answerPart.trim());
                continue;
            }

            // Continue collecting multi-line answer
            if (collectingAnswer && line.trim() && !line.startsWith('Q') && !line.startsWith('▸') && !line.includes('───')) {
                answerLines.push(line.trim());
            } else if (line.startsWith('▸') || line.includes('───')) {
                // Section header - stop collecting
                if (currentQuestion && answerLines.length > 0) {
                    responses[currentQuestion] = this.parseTXTAnswer(answerLines.join(' ').trim(), currentTitle);
                }
                collectingAnswer = false;
                answerLines = [];
            }
        }

        // Don't forget the last question
        if (currentQuestion && answerLines.length > 0) {
            responses[currentQuestion] = this.parseTXTAnswer(answerLines.join(' ').trim(), currentTitle);
        }

        return responses;
    },

    /**
     * Parse a single answer from TXT format into response object.
     * Detects question type from answer patterns and returns appropriate format.
     * @param {string} answerText - The raw answer text.
     * @param {string} title - Question title for context.
     * @returns {Object} Response object suitable for questionnaire engine.
     */
    parseTXTAnswer(answerText, title) {
        if (!answerText) return { text: '', selected_value: '', selected_values: [] };

        // Strategy: ALWAYS return all three formats so the engine can find what it needs
        // The questionnaire engine checks for specific keys based on question type:
        // - single_select: selected_value
        // - multi_select: selected_values (array)
        // - free_text: text
        // - compound: any keys

        // Check if it's clearly a compound answer (has labeled fields with colons AND semicolons)
        // Pattern: "Label: value; Label2: value2"
        if (answerText.includes(': ') && answerText.includes(';')) {
            const response = {};
            // Split by semicolons followed by capital letters (field separators)
            const parts = answerText.split(/;\s*(?=[A-Z])/);

            parts.forEach(part => {
                const colonIdx = part.indexOf(':');
                if (colonIdx > 0 && colonIdx < 100) { // Key can be up to 100 chars for long labels
                    const key = part.substring(0, colonIdx).trim()
                        .toLowerCase()
                        .replace(/[^\w\s]/g, '')
                        .replace(/\s+/g, '_');
                    const value = part.substring(colonIdx + 1).trim();

                    // Check if value is a short comma-separated list (options)
                    // Use smart split that preserves parentheses
                    const items = this.smartCommaSplit(value);
                    if (items.length > 1 && value.length < 150) {
                        response[key] = items;
                    } else {
                        response[key] = value;
                    }
                }
            });

            if (Object.keys(response).length > 0) {
                // Also add text format for compatibility
                response.text = answerText;
                return response;
            }
        }

        // Check for (Other: ...) pattern and extract it before splitting
        // Use balanced parentheses matching to handle nested parens like "(Other: change(s)...)"
        let otherText = '';
        let cleanedText = answerText;
        const otherStart = answerText.search(/\(Other:\s*/i);
        if (otherStart !== -1) {
            // Find the matching closing paren using balanced counting
            let parenDepth = 0;
            let startContent = -1;
            let endParen = -1;
            for (let i = otherStart; i < answerText.length; i++) {
                if (answerText[i] === '(') {
                    if (startContent === -1 && parenDepth === 0) {
                        // Find the content start after "Other:"
                        const colonMatch = answerText.slice(i).match(/^\(Other:\s*/i);
                        if (colonMatch) {
                            startContent = i + colonMatch[0].length;
                        }
                    }
                    parenDepth++;
                } else if (answerText[i] === ')') {
                    parenDepth--;
                    if (parenDepth === 0) {
                        endParen = i;
                        break;
                    }
                }
            }
            if (endParen !== -1 && startContent !== -1) {
                otherText = answerText.slice(startContent, endParen).trim();
                // Remove the entire (Other: ...) part from the text
                cleanedText = (answerText.slice(0, otherStart) + answerText.slice(endParen + 1)).trim();
                cleanedText = cleanedText.replace(/,\s*$/, '').replace(/,\s*,/g, ',').trim();
            }
        }

        // Use smart comma split that preserves content inside parentheses
        const items = this.smartCommaSplit(cleanedText);

        // Check if this looks like free-form text (contains sentences/punctuation)
        const hasSentences = (answerText.match(/\.\s+[A-Z]/g) || []).length > 0;
        const hasDetailedProse = answerText.length > 150;

        // Keep raw items for label matching (findMatchingOption will match by label)
        // Also create normalized versions and deduplicate
        const rawItems = items.filter(v => v.trim());
        const selectedValues = [...new Set(
            items.map(v => v.toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/g, ''))
                .filter(v => v) // Only remove empty strings, not valid values
        )];

        // Build response with ALL formats for maximum compatibility
        const response = {
            text: answerText,
            selected_value: items.length === 1
                ? items[0].toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/g, '')
                : answerText.toLowerCase().replace(/\s+/g, '_').substring(0, 100),
            selected_values: selectedValues,
            raw_items: rawItems, // Keep raw labels for matching in mapResponseToQuestion
            other_text: otherText
        };

        return response;
    },

    /**
     * Split a string by commas, but preserve content inside parentheses.
     * "A (x, y), B, C (z)" -> ["A (x, y)", "B", "C (z)"]
     * @param {string} text - Text to split.
     * @returns {Array<string>} Array of items.
     */
    smartCommaSplit(text) {
        if (!text) return [];

        const items = [];
        let current = '';
        let parenDepth = 0;

        for (let i = 0; i < text.length; i++) {
            const char = text[i];

            if (char === '(') {
                parenDepth++;
                current += char;
            } else if (char === ')') {
                parenDepth = Math.max(0, parenDepth - 1);
                current += char;
            } else if (char === ',' && parenDepth === 0) {
                // This is a real separator
                const trimmed = current.trim();
                if (trimmed) items.push(trimmed);
                current = '';
            } else {
                current += char;
            }
        }

        // Don't forget the last item
        const trimmed = current.trim();
        if (trimmed) items.push(trimmed);

        return items;
    },

    /**
     * Format JSON responses into readable text for AI prompt.
     * @param {Object} data - The responses object from JSON.
     * @returns {string} Formatted text.
     */
    formatJSONResponses(data, externalQuestions = null) {
        if (!data || !data.responses) return '';

        let text = '';
        Object.entries(data.responses).forEach(([questionId, entry]) => {
            // HYDRATION FIX: Look up the full question definition from the app's data loader
            // The imported 'entry.question' might be a skeletal snapshot (missing options/fields).
            // We trust the App's current definition for metadata (options/labels) while using the Import's ID and Response.
            let fullQuestion = null;

            // 1. Try external hydration (Best Match from correct phase)
            if (externalQuestions) {
                fullQuestion = externalQuestions.find(q => q.id === questionId);
            }

            // 2. Try to find the question in the currently loaded definitions from DataLoader (Database)
            // This is preferred because ImportModal switches DataLoader to the correct phase
            if (!fullQuestion && typeof DataLoader !== 'undefined') {
                const fullQs = DataLoader.getQuestions('full');
                fullQuestion = fullQs.find(q => q.id === questionId);
            }

            // Fallback: Check active session state (QuestionnaireEngine)
            if (!fullQuestion && typeof QuestionnaireEngine !== 'undefined' && QuestionnaireEngine.questions) {
                fullQuestion = QuestionnaireEngine.questions.find(q => q.id === questionId);
            }

            // Use the hydrated question if found, otherwise fall back to the imported snapshot
            const q = fullQuestion || entry.question;
            const r = entry.response;

            if (!q) return;

            text += `**Q${q.id?.replace('q', '') || questionId}: ${q.title}**\n`;
            text += `${q.prompt}\n`;
            text += `Answer: ${this.formatResponse(q, r)}\n\n`;
        });

        if (!text) console.warn('formatJSONResponses produced empty text');
        return text;
    },

    /**
     * Format a single response based on question type.
     * @param {Object} question - Question object (with type and options).
     * @param {Object} response - Response object.
     * @returns {string} Formatted answer (using labels where possible).
     */
    formatResponse(question, response) {
        if (!response) return '[No response]';
        const type = question.type;

        // Helper to find label by value using robust matching
        const getLabel = (val) => {
            if (!question.options) return val;
            const opt = this.findMatchingOption(val, question.options);
            return opt ? opt.label : val;
        };

        switch (type) {
            case 'single_select':
                const singleVal = response.selected_value;
                let singleLabel = singleVal ? getLabel(singleVal) : '';

                // If label wasn't found (or it was 'other'), append specific text if available
                if (response.other_text) {
                    // If the value was 'other', simpler to just show the text? 
                    // Or show "Other (My reason)"
                    if (singleVal === 'other') {
                        singleLabel = `Other (${response.other_text})`;
                    } else {
                        singleLabel += ` (${response.other_text})`;
                    }
                }
                return singleLabel || '[No selection]';

            case 'multi_select':
                const values = response.selected_values || [];
                // Map all values to labels
                const labels = values.map(v => v === 'other' ? `Other (${response.other_text || ''})` : getLabel(v));
                return labels.join(', ') || '[No selections]';

            case 'free_text':
                return response.text || '[No text]';

            case 'compound':
                // Format all non-empty fields
                const parts = [];
                const processedFields = new Set();
                Object.entries(response).forEach(([key, val]) => {
                    if (val && key !== 'notes') {
                        // Find the field definition to get the label and options
                        // Robust lookup: match by key OR label (in case import uses labels as keys)
                        const fieldDef = question.fields ? question.fields.find(f => f.key === key || f.label === key) : null;
                        const canonicalKey = fieldDef ? fieldDef.key : key;

                        // If both canonical key and label key exist in payload, prefer canonical key once.
                        if (fieldDef && key !== canonicalKey && Object.prototype.hasOwnProperty.call(response, canonicalKey)) {
                            return;
                        }
                        if (processedFields.has(canonicalKey)) {
                            return;
                        }

                        // Use field label if available, otherwise capitalize key
                        // Cleaning the key for display if no label: frequency -> Frequency
                        const displayKey = fieldDef ? (fieldDef.label || key) : key;

                        let displayVal = val;

                        // effective 'getLabel' for this specific field
                        const getFieldLabel = (v) => {
                            if (!fieldDef) return v;

                            // Only look up options for select types
                            const isSelect = ['single_select', 'multi_select'].includes(fieldDef.type) ||
                                (fieldDef.options && fieldDef.options.length > 0);

                            if (!isSelect || !fieldDef.options) return v;

                            const opt = this.findMatchingOption(v, fieldDef.options);
                            return opt ? opt.label : v;
                        };

                        if (Array.isArray(val) && val.length > 0) {
                            // Map all items if it's an array (e.g. multi_select inside compound)
                            displayVal = val.map(v => getFieldLabel(v)).join(', ');
                        } else if (typeof val === 'string' && val.trim()) {
                            displayVal = getFieldLabel(val);
                        }

                        // Only add if we have a value
                        if (displayVal !== null && displayVal !== undefined && displayVal !== '') {
                            parts.push(`${displayKey}: ${displayVal}`);
                            processedFields.add(canonicalKey);
                        }
                    }
                });
                return parts.join('; ') || '[Partial response]';

            default:
                return JSON.stringify(response);
        }
    },

    /**
     * Validate that two parsed files are compatible for couple's prompt.
     * @param {Object} parsedA - First parsed file.
     * @param {Object} parsedB - Second parsed file.
     * @returns {Object} Validation result with isValid and message.
     */
    validateCompatibility(parsedA, parsedB) {
        if (!parsedA || !parsedB) {
            return { isValid: false, message: 'Both files are required for couple\'s prompt.' };
        }

        if (parsedA.mode !== parsedB.mode) {
            return {
                isValid: false,
                message: `Mode mismatch: ${parsedA.name} completed ${parsedA.mode} (${parsedA.questionCount} questions), but ${parsedB.name} completed ${parsedB.mode} (${parsedB.questionCount} questions). Both must complete the same version.`
            };
        }

        return { isValid: true, message: 'Files are compatible.' };
    },

    /**
     * Build an individual AI prompt from parsed data.
     * @param {Object} parsed - Parsed file data.
     * @param {Object} prompt - Prompt template from DataLoader.
     * @returns {string} Complete AI prompt text.
     */
    buildIndividualPrompt(parsed, prompt) {
        if (!prompt) {
            throw new Error('Prompt template not found.');
        }

        let text = '';

        // Role
        text += '=== SYSTEM ROLE ===\n';
        text += prompt.role + '\n\n';

        // Context
        text += '=== CONTEXT ===\n';
        prompt.context.forEach(c => text += `• ${c}\n`);
        text += '\n';

        // Participant
        text += `=== PARTICIPANT: ${parsed.name} ===\n\n`;

        // Responses
        text += '=== RESPONSES ===\n\n';
        text += parsed.formattedText + '\n';

        // Output format
        text += '=== REQUESTED OUTPUT FORMAT ===\n';
        prompt.output_format.forEach(section => {
            text += `\n### ${section.section}\n`;
            section.requirements.forEach(req => text += `• ${req}\n`);
        });

        // Constraints
        text += '\n=== CONSTRAINTS ===\n';
        prompt.constraints.forEach(c => text += `• ${c}\n`);

        return text;
    },

    /**
     * Build a couple's AI prompt from two parsed files.
     * @param {Object} parsedA - First person's parsed data.
     * @param {Object} parsedB - Second person's parsed data.
     * @param {Object} prompt - Couple prompt template.
     * @returns {string} Complete couple's AI prompt text.
     */
    buildCouplePrompt(parsedA, parsedB, prompt) {
        if (!prompt) {
            throw new Error('Couple prompt template not found.');
        }

        let text = '';

        // Role
        text += '=== SYSTEM ROLE ===\n';
        text += prompt.role + '\n\n';

        // Context
        text += '=== CONTEXT ===\n';
        prompt.context.forEach(c => text += `• ${c}\n`);
        text += '\n';

        // Person A responses
        text += `=== ${parsedA.name.toUpperCase()}'S RESPONSES ===\n\n`;
        text += parsedA.formattedText || this.extractFormattedText(parsedA);
        text += '\n';

        // Person B responses
        text += `=== ${parsedB.name.toUpperCase()}'S RESPONSES ===\n\n`;
        text += parsedB.formattedText || this.extractFormattedText(parsedB);
        text += '\n';

        // Output format (replace placeholders with actual names)
        text += '=== REQUESTED OUTPUT FORMAT ===\n';
        prompt.output_format.forEach(section => {
            let sectionTitle = section.section
                .replace(/\[Person A\]/g, parsedA.name)
                .replace(/\[Person B\]/g, parsedB.name);
            text += `\n### ${sectionTitle}\n`;
            section.requirements.forEach(req => {
                let requirement = req
                    .replace(/\[Person A\]/g, parsedA.name)
                    .replace(/\[Person B\]/g, parsedB.name)
                    .replace(/\bA\b(?='s|')/g, parsedA.name)
                    .replace(/\bB\b(?='s|')/g, parsedB.name);
                text += `• ${requirement}\n`;
            });
        });

        // Constraints
        text += '\n=== CONSTRAINTS ===\n';
        prompt.constraints.forEach(c => text += `• ${c}\n`);

        return text;
    },

    /**
     * Extract formatted text from TXT file or build from JSON.
     * @param {Object} parsed - Parsed file data.
     * @returns {string} Formatted response text.
     */
    extractFormattedText(parsed) {
        if (parsed.format === 'txt') {
            // For TXT, extract just the Q&A portion
            const lines = parsed.formattedText.split('\n');
            const startIdx = lines.findIndex(l => l.startsWith('Q1:') || l.startsWith('Q01:'));
            if (startIdx > -1) {
                // Find the footer
                const endIdx = lines.findIndex((l, i) => i > startIdx && l.includes('═════'));
                return lines.slice(startIdx, endIdx > -1 ? endIdx : undefined).join('\n');
            }
        }
        return parsed.formattedText;
    },

    /**
     * Validate and map imported responses against actual question definitions.
     * Maps label-based values to actual option values and tracks incomplete imports.
     * @param {Object} responses - Imported responses keyed by question ID.
     * @param {Object} questions - Questions object from DataLoader.
     * @returns {Object} { mappedResponses, needsReview: [questionIds] }
     */
    validateAndMapResponses(responses, questions) {
        const mappedResponses = {};
        const needsReview = [];
        const fieldWarnings = {}; // Track per-field warnings for each question

        if (!questions || !responses) {
            return { mappedResponses: responses || {}, needsReview: [], fieldWarnings: {} };
        }

        Object.entries(responses).forEach(([qId, response]) => {
            const question = questions[qId];
            if (!question) {
                // Question doesn't exist in current schema
                needsReview.push(qId);
                fieldWarnings[qId] = ['Question not found in current questionnaire'];
                return;
            }

            const mappedResult = this.mapResponseToQuestion(response, question);
            mappedResponses[qId] = mappedResult.response;

            if (mappedResult.warnings && mappedResult.warnings.length > 0) {
                fieldWarnings[qId] = mappedResult.warnings;
            }

            if (!mappedResult.fullyMapped) {
                needsReview.push(qId);
            }
        });

        return { mappedResponses, needsReview, fieldWarnings };
    },

    /**
     * Map a single response to match question options.
     * @param {Object} response - The imported response.
     * @param {Object} question - The question definition.
     * @returns {Object} { response, fullyMapped: boolean }
     */
    mapResponseToQuestion(response, question) {
        if (!response || !question) {
            return { response: response || {}, fullyMapped: false, warnings: ['Invalid response or question'] };
        }

        const type = question.type;
        let mappedResponse = { ...response };
        let fullyMapped = true;
        const warnings = []; // Track specific field-level issues

        switch (type) {
            case 'multi_select': {
                const options = question.options || [];
                // Use raw_items (original labels) for matching if available, else fall back to selected_values
                const importedValues = response.raw_items || response.selected_values || [];
                const mappedValues = [];

                importedValues.forEach(imported => {
                    const match = this.findMatchingOption(imported, options);
                    if (match) {
                        mappedValues.push(match.value);
                    } else {
                        fullyMapped = false;
                    }
                });

                // Only include other_text if 'other' is in selected values
                // Also check for (Other: ...) pattern in the raw text
                let otherText = response.other_text || '';
                if (!otherText && response.text) {
                    const otherMatch = response.text.match(/\(Other:\s*([^)]+)\)/i);
                    if (otherMatch) {
                        otherText = otherMatch[1].trim();
                    }
                }

                mappedResponse = {
                    selected_values: mappedValues,
                    other_text: mappedValues.includes('other') ? otherText : ''
                };

                // If nothing matched but we had values, mark for review
                if (importedValues.length > 0 && mappedValues.length === 0) {
                    fullyMapped = false;
                }
                break;
            }

            case 'single_select': {
                const options = question.options || [];
                const imported = response.selected_value || response.text || '';
                const match = this.findMatchingOption(imported, options);

                if (match) {
                    mappedResponse = {
                        selected_value: match.value,
                        other_text: response.other_text || ''
                    };
                } else {
                    mappedResponse = {
                        selected_value: '',
                        other_text: imported // Store as other_text for reference
                    };
                    fullyMapped = false;
                }
                break;
            }

            case 'free_text': {
                mappedResponse = {
                    text: response.text || ''
                };
                fullyMapped = !!response.text;
                break;
            }

            case 'compound': {
                // Compound questions have multiple fields
                const fields = question.fields || [];
                mappedResponse = {};

                // Helper to normalize strings for matching
                const normalize = (str) => str.toLowerCase()
                    .replace(/[^\w\s]/g, '')
                    .replace(/\s+/g, '_')
                    .trim();

                fields.forEach(field => {
                    const key = field.key;
                    const label = field.label || '';
                    const normalizedLabel = normalize(label);

                    let value = response[key];

                    // Try to find value by matching response keys against this field's label
                    if (value === undefined) {
                        // TXT parser creates keys from labels, so look for keys that match the label
                        const responseKeys = Object.keys(response);

                        for (const rKey of responseKeys) {
                            const normalizedRKey = normalize(rKey);

                            // Try various matching strategies
                            if (normalizedRKey === normalizedLabel ||
                                normalizedLabel.includes(normalizedRKey) ||
                                normalizedRKey.includes(normalizedLabel) ||
                                normalizedRKey.startsWith(normalize(label.split(' ').slice(0, 3).join(' ')))) {
                                value = response[rKey];
                                break;
                            }

                            // Special mappings for common field patterns
                            if (field.type === 'number' &&
                                (normalizedRKey.includes('number') || normalizedRKey.includes('how_many'))) {
                                value = response[rKey];
                                break;
                            }
                            if (key === 'milestone_text' && normalizedRKey.includes('milestone')) {
                                value = response[rKey];
                                break;
                            }
                            if (key === 'natural_sign_text' && normalizedRKey.includes('sign')) {
                                value = response[rKey];
                                break;
                            }
                            // Q6 specific mappings
                            if (key === 'trigger_rule' &&
                                (normalizedRKey.includes('feels_off') ||
                                    normalizedRKey.includes('something_feels') ||
                                    normalizedRKey.includes('when_do_we_talk'))) {
                                value = response[rKey];
                                break;
                            }
                            if (key === 'frequency' &&
                                (normalizedRKey.includes('how_often') || normalizedRKey === 'frequency')) {
                                value = response[rKey];
                                break;
                            }
                            if (key === 'format' &&
                                (normalizedRKey.includes('preferred_format') ||
                                    normalizedRKey.includes('format_choose'))) {
                                value = response[rKey];
                                break;
                            }
                        }
                    }

                    // Also try fuzzy key match (but exclude generic 'text' key to avoid false matches)
                    if (value === undefined) {
                        const possibleKeys = Object.keys(response).filter(k =>
                            k !== 'text' && // Exclude generic text key
                            (k.toLowerCase().includes(key.toLowerCase()) ||
                                key.toLowerCase().includes(k.toLowerCase()))
                        );
                        if (possibleKeys.length > 0) {
                            value = response[possibleKeys[0]];
                        }
                    }

                    if (field.type === 'multi_select' && field.options) {
                        // If value is a string, split it into individual items
                        let values;
                        if (Array.isArray(value)) {
                            values = value;
                        } else if (typeof value === 'string' && value.includes(',')) {
                            // It's a comma-separated string, split it preserving parentheses
                            values = this.smartCommaSplit(value);
                        } else {
                            values = value ? [value] : [];
                        }

                        const mappedValues = [];

                        values.forEach(v => {
                            const match = this.findMatchingOption(v, field.options);
                            if (match) {
                                mappedValues.push(match.value);
                            }
                        });

                        mappedResponse[key] = mappedValues;
                        if (values.length > 0 && mappedValues.length === 0) {
                            warnings.push(`Field "${field.label || key}": no options matched`);
                            fullyMapped = false;
                        } else if (values.length > mappedValues.length) {
                            warnings.push(`Field "${field.label || key}": ${values.length - mappedValues.length} option(s) not matched`);
                            fullyMapped = false;
                        }
                    } else if (field.type === 'single_select' && field.options) {
                        const match = this.findMatchingOption(value || '', field.options);
                        mappedResponse[key] = match ? match.value : '';
                        if (value && !match) {
                            warnings.push(`Field "${field.label || key}": "${value}" not matched`);
                            fullyMapped = false;
                        }
                    } else if (field.type === 'number') {
                        // Parse number from value
                        const numVal = parseInt(value, 10);
                        mappedResponse[key] = isNaN(numVal) ? null : numVal;
                    } else {
                        mappedResponse[key] = value || '';
                    }
                });

                // Handle schema evolution: detect ranked_select fields with old-format data
                // Old exports may have selected_values (multi_select) or selected_value (single_select)
                // that should now map to ranked_select fields in compound questions
                fields.forEach(field => {
                    if (field.type === 'ranked_select') {
                        const key = field.key;

                        // Check if this field is still empty after normal mapping
                        if (!mappedResponse[key] || (Array.isArray(mappedResponse[key]) && mappedResponse[key].length === 0)) {
                            // Check if response has old multi_select format (array)
                            if (response.selected_values && Array.isArray(response.selected_values)) {
                                // Map old multi-select values to ranked field
                                const mappedValues = [];
                                response.selected_values.forEach(oldValue => {
                                    const match = this.findMatchingOption(oldValue, field.options);
                                    if (match) {
                                        mappedValues.push(match.value);
                                    }
                                });

                                if (mappedValues.length > 0) {
                                    mappedResponse[key] = mappedValues;
                                    warnings.push(`Field "${field.label || key}": converted from old multi-select format (unranked)`);
                                    fullyMapped = false; // Mark for review to allow user to rank
                                }
                            }
                            // Check if response has old single_select format (string)
                            else if (response.selected_value && typeof response.selected_value === 'string') {
                                const match = this.findMatchingOption(response.selected_value, field.options);
                                if (match) {
                                    mappedResponse[key] = [match.value];
                                    warnings.push(`Field "${field.label || key}": converted from old single-select format`);
                                    fullyMapped = false; // Mark for review
                                }
                            }
                        }
                    }
                });

                // Preserve text fallback
                if (response.text) {
                    mappedResponse._importedText = response.text;
                }
                break;
            }

            default:
                // Unknown type, keep as-is
                warnings.push(`Unknown question type: ${type}`);
                fullyMapped = false;
        }

        return { response: mappedResponse, fullyMapped, warnings };
    },

    /**
     * Find a matching option by comparing labels and values.
     * @param {string} imported - The imported value (could be label or value).
     * @param {Array} options - Array of option objects with value and label.
     * @returns {Object|null} Matching option or null.
     */
    findMatchingOption(imported, options) {
        if (!imported || !options || options.length === 0) return null;

        const normalize = (str) => str.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, '_')
            .trim();

        const normalizedImport = normalize(String(imported));

        // Try exact value match first
        let match = options.find(opt => opt.value === imported);
        if (match) return match;

        // Try normalized value match
        match = options.find(opt => normalize(opt.value) === normalizedImport);
        if (match) return match;

        // Try label match (exact)
        match = options.find(opt => opt.label && opt.label.toLowerCase() === String(imported).toLowerCase());
        if (match) return match;

        // Try normalized label match
        match = options.find(opt => opt.label && normalize(opt.label) === normalizedImport);
        if (match) return match;

        // Try partial label match (label contains imported or vice versa)
        match = options.find(opt => {
            if (!opt.label) return false;
            const normalizedLabel = normalize(opt.label);
            return normalizedLabel.includes(normalizedImport) ||
                normalizedImport.includes(normalizedLabel);
        });
        if (match) return match;

        // Try matching by start of label
        match = options.find(opt => {
            if (!opt.label) return false;
            return normalize(opt.label).startsWith(normalizedImport.substring(0, 10));
        });

        return match || null;
    }
};

// Export for ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ImportManager;
}
