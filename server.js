require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const crypto = require('crypto');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '25mb' }));
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
        const { classNum, subject, chapters, questionTypes, singleSlotReq, difficulty, styleGuide } = req.body;
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

        const difficultyBlock = difficulty && difficulty !== 'mixed'
            ? `\nDIFFICULTY LEVEL: Generate all questions strictly at "${difficulty.toUpperCase()}" difficulty (Easy = direct textbook recall, Medium = applied understanding requiring 1-2 reasoning steps, Hard = analytical / HOTS reasoning with multi-step logic).`
            : `\nDIFFICULTY LEVEL: Mixed — vary difficulty naturally across easy, medium and hard the way a real board paper would.`;

        const styleGuideBlock = styleGuide
            ? `\n\nMATCH THIS EXISTING PAPER'S STYLE PATTERN (replicate phrasing/format conventions only — never copy actual content):\n"""\n${styleGuide}\n"""\n`
            : '';

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
${difficultyBlock}${styleGuideBlock}
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

// Analyze an uploaded blueprint image (e.g. the Science board blueprint table)
// and convert it into a structured slot/section blueprint the front-end can render.
app.post('/api/analyze-blueprint', async (req, res) => {
    try {
        const { imageBase64, mimeType, images, classNum, subject } = req.body;
        const apiKey = process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY;

        // Accept either a single legacy image, or an array of page images
        const imageList = Array.isArray(images) && images.length
            ? images
            : (imageBase64 ? [{ base64: imageBase64, mimeType: mimeType || 'image/jpeg' }] : []);

        if (!apiKey) return res.status(500).json({ error: 'Server Config Error: API key is missing.' });
        if (!imageList.length) return res.status(400).json({ error: 'No blueprint image was provided.' });

        const prompt = `You are an expert CBSE board exam paper-setter and design analyst.

You are given ${imageList.length > 1 ? `${imageList.length} images that are DIFFERENT PAGES of the SAME blueprint document` : 'an image'} for a Question Paper BLUEPRINT / design. Typically one page shows an aggregate typology table (question type, marks each, number of questions, total marks, internal-choice count, and per-section marks split e.g. "Biology 30, Chemistry 25, Physics 25"), and an optional additional page may break the same totals down further by chapter/topic. Read ALL provided images together as one combined source before answering.

Convert what you see into a structured JSON blueprint definition matching EXACTLY this schema:
{
  "title": "Short descriptive title${classNum ? ` mentioning Class ${classNum}` : ''}${subject ? ` ${subject}` : ''}",
  "sections": [ { "id": "A", "name": "Section A: <short description> (Qx - Qy)", "subject": "<discipline tag if the blueprint splits by discipline, else General>" } ],
  "slots": [ { "num": 1, "type": "mcq", "marks": 1, "sec": "A", "subject": "<optional discipline tag, else omit>", "optional": false } ]
}

Rules:
- "type" must be exactly one of: mcq, assertion_reason, short_2marks, short_3marks, case_based, long_answer. Map using the marks-per-question and label (1 mark "MCQ/straight" = mcq, 1 mark "Assertion-Reason" = assertion_reason, 2 mark "Very Short Answer" = short_2marks, 3 mark "Short Answer" = short_3marks, 4 mark "Case/Source-based" = case_based, 5 mark "Long Answer" = long_answer).
- Build the full ordered "slots" array of "num" 1..N (sequential, no gaps) that satisfies the aggregate counts per question type EXACTLY as given in the typology table (e.g. if the table says 16 MCQs total, there must be exactly 16 slots with type "mcq").
- If the blueprint gives a marks split across sections/disciplines (e.g. "Biology 30, Chemistry 25, Physics 25") but does not explicitly list every question number per section, distribute the question-type counts across the sections proportionally to each section's share of total marks, keeping each section's own subtotal marks as close as possible to its stated share, and group all slots for one section contiguously (all of Section A's slots before Section B's, etc.) the way real board papers are laid out (objective questions first, then short answers, then long answers, within each section — or across the whole paper if sections aren't discipline-based).
- Use a chapter/topic breakdown page (if provided) only to sanity-check the per-type totals and to fill each section's "subject" tag — never let it override the totals from the aggregate/master typology table.
- Set "optional": true on exactly the number of slots stated as having "Internal Choice" for that question-type row, distributing them evenly/sensibly across sections. If a total internal-choice count is given without a per-type breakdown, apply it to the higher-mark question types first (Long Answer, then Case-based, then Short Answer), which is the typical CBSE pattern.
- "sec" must reference one of the section ids defined in "sections".
- Total marks across all slots (accounting that "optional" slots are still counted once, since only one alternative is answered) must equal the paper's stated total marks.

RESPOND ONLY WITH VALID JSON MATCHING THIS SCHEMA. NO MARKDOWN CODEBLOCKS, NO COMMENTARY.`;

        const models = ['gemini-3.6-flash', 'gemini-3.5-flash'];
        let apiResponse, lastError = '';

        const imageParts = imageList.map(img => ({
            inline_data: { mime_type: img.mimeType || 'image/jpeg', data: img.base64 }
        }));

        for (const model of models) {
            try {
                apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            role: 'user',
                            parts: [
                                { text: prompt },
                                ...imageParts
                            ]
                        }],
                        generationConfig: { responseMimeType: 'application/json', temperature: 0.4 }
                    })
                });
                if (apiResponse.ok) break;
                lastError = await apiResponse.text();
            } catch (e) {
                lastError = e.message;
            }
        }

        if (!apiResponse || !apiResponse.ok) {
            return res.status(500).json({ error: `Blueprint analysis failed. Details: ${lastError}` });
        }

        const result = await apiResponse.json();
        let content = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!content) return res.status(500).json({ error: 'AI returned an empty blueprint analysis. Try a clearer image.' });

        content = content.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
        const firstBrace = content.indexOf('{');
        const lastBrace = content.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) content = content.substring(firstBrace, lastBrace + 1);

        const blueprint = JSON.parse(content);
        res.json({ success: true, blueprint });

    } catch (err) {
        console.error('Blueprint Analysis Error:', err);
        res.status(500).json({ error: `Server error analyzing blueprint: ${err.message}` });
    }
});

// Analyze an uploaded sample question paper (PDF or image) and extract a
// plain-text "style guide" describing its pattern, so generation can mimic it.
app.post('/api/analyze-pattern', async (req, res) => {
    try {
        const { fileBase64, mimeType } = req.body;
        const apiKey = process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY;

        if (!apiKey) return res.status(500).json({ error: 'Server Config Error: API key is missing.' });
        if (!fileBase64) return res.status(400).json({ error: 'No sample paper file was provided.' });

        const prompt = `You are an expert CBSE board exam paper-setter. Study the attached sample question paper carefully.

Produce a concise STYLE GUIDE (plain text, max ~200 words) describing its design pattern so another paper-setter could replicate the same feel: phrasing style/tone of questions, typical sentence length, how MCQ options are worded, how case-based/source-based passages are framed, recurring instructional phrasing, and the general difficulty/HOTS balance.

IMPORTANT: Do not copy any actual question text verbatim — describe only the PATTERN, never the content. Respond with plain text only, no markdown, no JSON.`;

        const models = ['gemini-3.6-flash', 'gemini-3.5-flash'];
        let apiResponse, lastError = '';

        for (const model of models) {
            try {
                apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            role: 'user',
                            parts: [
                                { text: prompt },
                                { inline_data: { mime_type: mimeType || 'application/pdf', data: fileBase64 } }
                            ]
                        }],
                        generationConfig: { temperature: 0.4 }
                    })
                });
                if (apiResponse.ok) break;
                lastError = await apiResponse.text();
            } catch (e) {
                lastError = e.message;
            }
        }

        if (!apiResponse || !apiResponse.ok) {
            return res.status(500).json({ error: `Pattern analysis failed. Details: ${lastError}` });
        }

        const result = await apiResponse.json();
        const styleGuide = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!styleGuide) return res.status(500).json({ error: 'AI returned an empty pattern analysis. Please retry.' });

        res.json({ success: true, styleGuide: styleGuide.trim() });

    } catch (err) {
        console.error('Pattern Analysis Error:', err);
        res.status(500).json({ error: `Server error analyzing pattern: ${err.message}` });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Active server hosted on port ${PORT}`));
