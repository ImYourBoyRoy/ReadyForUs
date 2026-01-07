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
        const text = await file.text();
        const fileName = file.name.toLowerCase();

        if (fileName.endsWith('.json')) {
            return this.parseJSON(text, file.name);
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
    parseJSON(text, fileName) {
        try {
            const data = JSON.parse(text);

            // Validate structure
            if (!data.meta || !data.responses) {
                throw new Error('Invalid JSON format: missing meta or responses.');
            }

            const name = data.meta.participantName || 'Unknown';
            const mode = data.meta.mode || (data.stats?.total > 20 ? 'full' : 'lite');
            const questionCount = data.stats?.total || Object.keys(data.responses).length;

            // Build formatted responses for AI prompt
            const formattedResponses = this.formatJSONResponses(data.responses);

            return {
                name,
                mode,
                questionCount,
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
                if (colonIdx > 0 && colonIdx < 60) { // Key shouldn't be too long
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

        // Use smart comma split that preserves content inside parentheses
        const items = this.smartCommaSplit(answerText);

        // Check if this looks like free-form text (contains sentences/punctuation)
        const hasSentences = (answerText.match(/\.\s+[A-Z]/g) || []).length > 0;
        const hasDetailedProse = answerText.length > 150;

        // Build response with ALL formats for maximum compatibility
        const response = {
            text: answerText,
            selected_value: items.length === 1
                ? items[0].toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/g, '')
                : answerText.toLowerCase().replace(/\s+/g, '_').substring(0, 100),
            selected_values: items.map(v => v.toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]/g, ''))
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
     * @param {Object} responses - The responses object from JSON.
     * @returns {string} Formatted text.
     */
    formatJSONResponses(responses) {
        let text = '';

        Object.entries(responses).forEach(([questionId, data]) => {
            if (!data.question || !data.response) return;

            const q = data.question;
            const r = data.response;

            text += `**Q${q.id?.replace('q', '') || questionId}: ${q.title}**\n`;
            text += `${q.prompt}\n`;
            text += `Answer: ${this.formatResponse(q.type, r)}\n\n`;
        });

        return text;
    },

    /**
     * Format a single response based on question type.
     * @param {string} type - Question type.
     * @param {Object} response - Response object.
     * @returns {string} Formatted answer.
     */
    formatResponse(type, response) {
        if (!response) return '[No response]';

        switch (type) {
            case 'single_select':
                let single = response.selected_value || '';
                if (response.other_text) single += ` (${response.other_text})`;
                return single || '[No selection]';

            case 'multi_select':
                const values = response.selected_values || [];
                let multi = values.join(', ');
                if (response.other_text) multi += ` (Other: ${response.other_text})`;
                return multi || '[No selections]';

            case 'free_text':
                return response.text || '[No text]';

            case 'compound':
                // Format all non-empty fields
                const parts = [];
                Object.entries(response).forEach(([key, val]) => {
                    if (val && key !== 'notes') {
                        if (Array.isArray(val) && val.length > 0) {
                            parts.push(`${key}: ${val.join(', ')}`);
                        } else if (typeof val === 'string' && val.trim()) {
                            parts.push(`${key}: ${val}`);
                        } else if (typeof val === 'number') {
                            parts.push(`${key}: ${val}`);
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

        if (!questions || !responses) {
            return { mappedResponses: responses || {}, needsReview: [] };
        }

        Object.entries(responses).forEach(([qId, response]) => {
            const question = questions[qId];
            if (!question) {
                // Question doesn't exist in current schema
                needsReview.push(qId);
                return;
            }

            const mappedResponse = this.mapResponseToQuestion(response, question);
            mappedResponses[qId] = mappedResponse.response;

            if (!mappedResponse.fullyMapped) {
                needsReview.push(qId);
            }
        });

        return { mappedResponses, needsReview };
    },

    /**
     * Map a single response to match question options.
     * @param {Object} response - The imported response.
     * @param {Object} question - The question definition.
     * @returns {Object} { response, fullyMapped: boolean }
     */
    mapResponseToQuestion(response, question) {
        if (!response || !question) {
            return { response: response || {}, fullyMapped: false };
        }

        const type = question.type;
        let mappedResponse = { ...response };
        let fullyMapped = true;

        switch (type) {
            case 'multi_select': {
                const options = question.options || [];
                const importedValues = response.selected_values || [];
                const mappedValues = [];

                importedValues.forEach(imported => {
                    const match = this.findMatchingOption(imported, options);
                    if (match) {
                        mappedValues.push(match.value);
                    } else {
                        fullyMapped = false;
                    }
                });

                mappedResponse = {
                    selected_values: mappedValues,
                    other_text: response.other_text || response.text || ''
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

                fields.forEach(field => {
                    const key = field.key;
                    let value = response[key];

                    // Try to find value in various keys
                    if (!value) {
                        // Look for similar keys (fuzzy match)
                        const possibleKeys = Object.keys(response).filter(k =>
                            k.toLowerCase().includes(key.toLowerCase()) ||
                            key.toLowerCase().includes(k.toLowerCase())
                        );
                        if (possibleKeys.length > 0) {
                            value = response[possibleKeys[0]];
                        }
                    }

                    if (field.type === 'multi_select' && field.options) {
                        const values = Array.isArray(value) ? value : (value ? [value] : []);
                        const mappedValues = [];

                        values.forEach(v => {
                            const match = this.findMatchingOption(v, field.options);
                            if (match) {
                                mappedValues.push(match.value);
                            }
                        });

                        mappedResponse[key] = mappedValues;
                        if (values.length > 0 && mappedValues.length === 0) {
                            fullyMapped = false;
                        }
                    } else if (field.type === 'single_select' && field.options) {
                        const match = this.findMatchingOption(value || '', field.options);
                        mappedResponse[key] = match ? match.value : '';
                        if (value && !match) {
                            fullyMapped = false;
                        }
                    } else {
                        mappedResponse[key] = value || '';
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
                fullyMapped = false;
        }

        return { response: mappedResponse, fullyMapped };
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
