require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const crypto = require('crypto');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Store generated questions to prevent duplication
const questionHistory = new Map();

function historyKey(cls, sub, chapters) {
    return `${cls}::${sub}::${(chapters || []).sort().join('||')}`;
}

app.post('/api/generate', async (req, res) => {
    try {
        const { classNum, subject, chapters, questionTypes, singleSlotReq } = req.body;
        const apiKey = process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'Server Config Error: API key is missing.' });
        }

        if (!classNum || !subject || !chapters || chapters.length === 0) {
            return res.status(400).json({ error: 'Please select class, subject, and chapters.' });
        }

        const hKey = historyKey(classNum, subject, chapters);
        const prevQuestions = questionHistory.get(hKey) || [];
        const avoidBlock = prevQuestions.length > 0
            ? `\n\n⚠️ DO NOT REPEAT THESE PREVIOUSLY GENERATED QUESTIONS:\n"""\n${prevQuestions.slice(-100).join('\n')}\n"""\n`
            : '';

        const seed = crypto.randomBytes(16).toString('hex');
        const ts = Date.now();

        const isNcf9 = classNum === '9';
        const syllabusContext = isNcf9
            ? `Class 9 follows the NEW NCF-SE syllabus (Science: 'Exploration', Math: 'Orienting Yourself', SST: integrated book).`
            : `Class 10 follows standard NCERT/CBSE rationalized curriculum.`;

        // Customize generation behavior for single slot vs multi-pool
        let generationRules = '';
        let jsonSchema = '';

        if (singleSlotReq) {
            // High-speed, focused prompt for populating a single structural slot
            const { type, marks, context } = singleSlotReq;
            generationRules = `Generate EXACTLY ONE original question of type: "${type}" worth ${marks} marks.
Context metadata to obey: ${context || 'None'}.`;
            
            const schemaMap = {
                mcq: '"mcq": [{"question": "q with HTML sup/sub", "options": {"a": "o1", "b": "o2", "c": "o3", "d": "o4"}, "answer": "a", "chapter": "ch"}]',
                assertion_reason: '"assertion_reason": [{"assertion": "A", "reason": "R", "options": {"a": "Both true...", "b": "Both true...", "c": "A true...", "d": "A false..."}, "answer": "a", "chapter": "ch"}]',
                short_2marks: '"short_2marks": [{"question": "q", "answer": "ans", "chapter": "ch"}]',
                short_3marks: '"short_3marks": [{"question": "q", "answer": "ans", "chapter": "ch"}]',
                case_based: '"case_based": [{"case_study": "passage", "sub_questions": [{"question": "sub q", "answer": "ans", "marks": 1}], "chapter": "ch"}]',
                long_answer: '"long_answer": [{"question": "q", "answer": "ans", "chapter": "ch"}]'
            };
            jsonSchema = schemaMap[type] || schemaMap['short_2marks'];
        } else {
            // General bulk pool generation
            const activeTypes = questionTypes || ['mcq', 'short_2marks'];
            const promptBlocks = {
                mcq: "- mcq: Exactly 5 original MCQs (1 mark each). Include 4 options and the correct answer index.",
                assertion_reason: "- assertion_reason: Exactly 5 A/R questions (1 mark each) with standard CBSE choices.",
                short_2marks: "- short_2marks: Exactly 5 Short Answer questions (2 marks each) with clear key answers.",
                short_3marks: "- short_3marks: Exactly 5 Short Answer questions (3 marks each) with clear key answers.",
                case_based: "- case_based: Exactly 3 detailed case studies (4 marks each) with a stimulus passage (100+ words) followed by 4 sub-questions.",
                long_answer: "- long_answer: Exactly 3 detailed Long Answer questions (5 marks each) with clear grading answers."
            };
            const schemaBlocks = {
                mcq: '"mcq": [{"question": "q", "options": {"a": "1", "b": "2", "c": "3", "d": "4"}, "answer": "a", "chapter": "ch"}]',
                assertion_reason: '"assertion_reason": [{"assertion": "A", "reason": "R", "options": {"a": "Both...", "b": "Both...", "c": "A...", "d": "R..."}, "answer": "a", "chapter": "ch"}]',
                short_2marks: '"short_2marks": [{"question": "q", "answer": "ans", "chapter": "ch"}]',
                short_3marks: '"short_3marks": [{"question": "q", "answer": "ans", "chapter": "ch"}]',
                case_based: '"case_based": [{"case_study": "passage", "sub_questions": [{"question": "sq", "answer": "ans", "marks": 1}], "chapter": "ch"}]',
                long_answer: '"long_answer": [{"question": "q", "answer": "ans", "chapter": "ch"}]'
            };
            generationRules = activeTypes.map(t => promptBlocks[t]).join('\n');
            jsonSchema = activeTypes.map(t => schemaBlocks[t]).join(',\n  ');
        }

        const prompt = `You are an expert CBSE board paper setter. Generate unique content.

TEXTBOOK: NCERT Class ${classNum} ${subject} — Latest Edition
SELECTED CHAPTERS: ${chapters.join(' | ')}
${syllabusContext}

UNIQUE GENERATION ID: ${seed}-${ts}

You must generate questions based ONLY on these rules:
${generationRules}

FORMATTING CONSTRAINTS:
1. Science/Math: Use HTML tags for formatting. Subscripts: <sub>text</sub> (e.g. H<sub>2</sub>O). Superscripts: <sup>text</sup> (e.g. x<sup>2</sup>). Never write as flat plain text.
2. For Math: Use proper fractional layouts and simple equations.
${avoidBlock}

RESPOND ONLY WITH VALID JSON MATCHING THIS EXACT SCHAPE (NO MARKDOWN CODEBLOCKS):
{
  ${jsonSchema}
}`;

        const models = ['gemini-3.6-flash', 'gemini-3.5-flash'];
        let apiResponse;
        let successfulModel = '';
        let lastError = '';

        for (const model of models) {
            try {
                apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ role: 'user', parts: [{ text: prompt }] }],
                        generationConfig: { responseMimeType: "application/json", temperature: 1.0 }
                    })
                });

                if (apiResponse.ok) {
                    successfulModel = model;
                    break;
                } else {
                    lastError = await apiResponse.text();
                }
            } catch (e) {
                lastError = e.message;
            }
        }

        if (!apiResponse || !apiResponse.ok) {
            return res.status(500).json({ error: `AI Generation failed. Details: ${lastError}` });
        }

        const result = await apiResponse.json();
        let content = result.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!content) {
            return res.status(500).json({ error: 'AI returned an empty response. Please retry.' });
        }

        content = content.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
        const firstBrace = content.indexOf('{');
        const lastBrace = content.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            content = content.substring(firstBrace, lastBrace + 1);
        }

        const questions = JSON.parse(content);

        // Track questions in history to prevent duplication
        const newTexts = [];
        const track = (arr, key) => {
            if (Array.isArray(arr)) arr.forEach(q => { if (q[key]) newTexts.push(q[key].substring(0, 150)); });
        };
        track(questions.mcq, 'question');
        track(questions.assertion_reason, 'assertion');
        track(questions.short_2marks, 'question');
        track(questions.short_3marks, 'question');
        track(questions.long_answer, 'question');
        if (Array.isArray(questions.case_based)) {
            questions.case_based.forEach(q => { if (q.case_study) newTexts.push(q.case_study.substring(0, 150)); });
        }

        const updated = [...prevQuestions, ...newTexts].slice(-250);
        questionHistory.set(hKey, updated);

        res.json({ success: true, questions, modelUsed: successfulModel });

    } catch (err) {
        console.error('Server Catch Error:', err);
        res.status(500).json({ error: `Server internal catch error: ${err.message}` });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Active server hosted on port ${PORT}`));
