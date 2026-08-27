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

const questionHistory = new Map();

function historyKey(c, s, ch) {
    return `${c}::${s}::${ch.sort().join('||')}`;
}

app.post('/api/generate', async (req, res) => {
    try {
        const { classNum, subject, chapters } = req.body;

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: 'GEMINI_API_KEY is missing in Render settings.' });
        }

        if (!classNum || !subject || !chapters || chapters.length === 0) {
            return res.status(400).json({ error: 'Please select class, subject, and chapters.' });
        }

        const hKey = historyKey(classNum, subject, [...chapters]);
        const prevQuestions = questionHistory.get(hKey) || [];

        const avoidBlock = prevQuestions.length > 0
            ? `\n\nDO NOT REPEAT THESE PREVIOUS QUESTIONS:\n"""\n${prevQuestions.slice(-80).join('\n')}\n"""\n`
            : '';

        const seed = crypto.randomBytes(16).toString('hex');
        const ts = Date.now();

        const syllabusCtx = classNum === '9'
            ? `Class 9 uses NEW NCF-SE 2026 books. Math: 'Orienting Yourself', Science: 'Exploration', Social Science: combined book. Ask questions RELEVANT ONLY to these new titles.`
            : `Use Class 10 rationalized NCERT syllabus.`;

        const prompt = `You are an expert CBSE Board paper setter. Generate a UNIQUE practice question paper.

TEXTBOOK: NCERT Class ${classNum} ${subject} — Latest Edition
CHAPTERS: ${chapters.join(' | ')}
${syllabusCtx}

UNIQUE ID: ${seed}-${ts}

Generate EXACTLY 5 questions in EACH section (30 total):

SECTION A: MCQ (1 mark × 5) — 4 options (a,b,c,d) + correct answer
SECTION B: ASSERTION-REASON (1 mark × 5) — A and R + 4 standard options + correct answer
SECTION C: SHORT ANSWER (2 marks × 5) — question + model answer
SECTION D: SHORT ANSWER (3 marks × 5) — question + model answer
SECTION E: CASE/SOURCE BASED (4 marks × 5) — passage (80+ words) + 4 sub-questions (i,ii,iii,iv) + answers
SECTION F: LONG ANSWER (5 marks × 5) — question + key points answer

RULES:
- Every question MUST be original
- Math/Science: Use <sub> for subscripts (H<sub>2</sub>O) and <sup> for superscripts (x<sup>2</sup>)
- NEVER write plain H2O or x2 — always use HTML tags
${avoidBlock}

RESPOND ONLY WITH VALID JSON (NO markdown, NO codeblocks):
{
  "mcq": [{"question": "q", "options": {"a": "o1", "b": "o2", "c": "o3", "d": "o4"}, "answer": "a", "chapter": "ch"}],
  "assertion_reason": [{"assertion": "A", "reason": "R", "options": {"a": "Both A and R true, R explains A", "b": "Both A and R true, R not explains A", "c": "A true, R false", "d": "A false, R true"}, "answer": "a", "chapter": "ch"}],
  "short_2marks": [{"question": "q", "answer": "ans", "chapter": "ch"}],
  "short_3marks": [{"question": "q", "answer": "ans", "chapter": "ch"}],
  "case_based": [{"case_study": "passage 80+ words", "sub_questions": [{"question": "sub q", "answer": "ans", "marks": 1}], "chapter": "ch"}],
  "long_answer": [{"question": "q", "answer": "key points", "chapter": "ch"}]
}`;

        // ===== GEMINI API CALL =====
        const apiKey = process.env.GEMINI_API_KEY.trim();
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        const geminiResponse = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [{ text: `You are a CBSE exam paper generator. Output ONLY valid JSON. No markdown. No codeblocks.\n\n${prompt}` }]
                    }
                ],
                generationConfig: {
                    temperature: 1.0,
                    maxOutputTokens: 8192,
                    topP: 0.95
                }
            })
        });

        if (!geminiResponse.ok) {
            const errText = await geminiResponse.text();
            console.error('Gemini API Error:', geminiResponse.status, errText);
            return res.status(500).json({ error: `Gemini API Error (${geminiResponse.status}): ${errText}` });
        }

        const data = await geminiResponse.json();
        let content = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!content) {
            return res.status(500).json({ error: 'AI returned empty response. Please retry.' });
        }

        // Clean response
        content = content.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
        const firstBrace = content.indexOf('{');
        const lastBrace = content.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            content = content.substring(firstBrace, lastBrace + 1);
        }

        let questions;
        try {
            questions = JSON.parse(content);
        } catch (pErr) {
            console.error('JSON Parse Error. Raw:', content.substring(0, 500));
            return res.status(500).json({ error: 'AI returned invalid JSON. Please click Generate again.' });
        }

        // History tracking
        const newTexts = [];
        const grab = (arr, field) => {
            if (Array.isArray(arr)) arr.forEach(q => {
                if (q[field]) newTexts.push(q[field].substring(0, 150));
            });
        };
        grab(questions.mcq, 'question');
        grab(questions.assertion_reason, 'assertion');
        grab(questions.short_2marks, 'question');
        grab(questions.short_3marks, 'question');
        grab(questions.long_answer, 'question');
        if (Array.isArray(questions.case_based)) {
            questions.case_based.forEach(q => {
                if (q.case_study) newTexts.push(q.case_study.substring(0, 150));
            });
        }

        const updated = [...prevQuestions, ...newTexts].slice(-200);
        questionHistory.set(hKey, updated);

        res.json({
            success: true,
            questions,
            meta: { classNum, subject, chapters }
        });

    } catch (err) {
        console.error('Server Error:', err);
        res.status(500).json({ error: `Server error: ${err.message}` });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
