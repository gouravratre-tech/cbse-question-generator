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
function historyKey(c, s, ch, types, each) { return `${c}::${s}::${ch.sort().join('||')}::${types.sort().join(',')}::${each}`; }

const QTYPE_LABELS = {
    mcq: 'MCQ (1 mark each)',
    assertion_reason: 'Assertion-Reason (1 mark each)',
    short_2marks: 'Short Answer (2 marks each)',
    short_3marks: 'Short Answer (3 marks each)',
    case_based: 'Case/Source Based (4 marks each) — passage + 4 sub-questions',
    long_answer: 'Long Answer (5 marks each)'
};

const QTYPE_JSON_KEYS = {
    mcq: 'mcq', assertion_reason: 'assertion_reason', short_2marks: 'short_2marks',
    short_3marks: 'short_3marks', case_based: 'case_based', long_answer: 'long_answer'
};

app.post('/api/generate', async (req, res) => {
    try {
        const { classNum, subject, chapters, questionTypes, questionsEach } = req.body;

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: 'GEMINI_API_KEY missing in Render settings.' });
        }

        if (!classNum || !subject || !chapters?.length) {
            return res.status(400).json({ error: 'Select class, subject & chapters.' });
        }

        const types = questionTypes || ['mcq','assertion_reason','short_2marks','short_3marks','case_based','long_answer'];
        const each = questionsEach || 5;

        if (types.length === 0) {
            return res.status(400).json({ error: 'Select at least one question type.' });
        }

        const hKey = historyKey(classNum, subject, [...chapters], [...types], each);
        const prevQ = questionHistory.get(hKey) || [];
        const avoidBlock = prevQ.length > 0
            ? `\n\nDO NOT REPEAT:\n"""\n${prevQ.slice(-60).join('\n')}\n"""\n`
            : '';

        const seed = crypto.randomBytes(12).toString('hex');

        const syllabusCtx = classNum === '9'
            ? `Class 9 uses NEW NCF-SE 2026 books. Math: 'Orienting Yourself', Science: 'Exploration', Social Science: combined book.`
            : `Class 10 rationalized NCERT syllabus.`;

        const totalQ = types.length * each;

        // Build section descriptions
        let sectionDesc = '';
        types.forEach(t => {
            sectionDesc += `- ${QTYPE_LABELS[t]}: Generate ${each} unique questions\n`;
        });

        const prompt = `You are an expert CBSE Board paper setter. Generate a UNIQUE practice paper.

TEXTBOOK: NCERT Class ${classNum} ${subject}
CHAPTERS: ${chapters.join(' | ')}
${syllabusCtx}
UNIQUE ID: ${seed}

Generate EXACTLY ${each} questions for EACH of these ${types.length} selected sections (${totalQ} total):

${sectionDesc}

RULES:
- Every question MUST be original
- Math/Science: Use <sub> (e.g., H<sub>2</sub>O, CO<sub>2</sub>) and <sup> (e.g., x<sup>2</sup>, m<sup>2</sup>)
- NEVER write plain H2O or x2
- MCQ: 4 options (a,b,c,d) + correct answer
- Assertion-Reason: A + R + 4 standard options + correct answer
- Case-Based: passage (80+ words) + exactly 4 sub-questions (i,ii,iii,iv) of 1 mark each
${avoidBlock}

OUTPUT ONLY VALID JSON (no markdown, no codeblocks):
{
  "mcq": [{"question": "q", "options": {"a": "o1", "b": "o2", "c": "o3", "d": "o4"}, "answer": "a", "chapter": "ch"}],
  "assertion_reason": [{"assertion": "A", "reason": "R", "options": {"a": "Both true, R explains A", "b": "Both true, R not explains A", "c": "A true, R false", "d": "A false, R true"}, "answer": "a", "chapter": "ch"}],
  "short_2marks": [{"question": "q", "answer": "ans", "chapter": "ch"}],
  "short_3marks": [{"question": "q", "answer": "ans", "chapter": "ch"}],
  "case_based": [{"case_study": "passage", "sub_questions": [{"question": "sub q", "answer": "ans", "marks": 1}], "chapter": "ch"}],
  "long_answer": [{"question": "q", "answer": "key points", "chapter": "ch"}]
}`;

        // Only include requested keys in prompt
        const expectedKeys = types.map(t => `"${QTYPE_JSON_KEYS[t]}": ...`);
        const trimmedPrompt = prompt.replace(
            /"mcq".*"long_answer".*\}/s,
            `{ ${expectedKeys.join(',\n  ')} }`
        );

        // Gemini API Call
        const apiKey = process.env.GEMINI_API_KEY.trim();
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

        const geminiResponse = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `You are a CBSE exam paper generator. Output ONLY valid JSON. No markdown.\n\n${prompt}` }] }],
                generationConfig: { temperature: 1.0, maxOutputTokens: 8192, topP: 0.95 }
            })
        });

        if (!geminiResponse.ok) {
            const errText = await geminiResponse.text();
            console.error('Gemini Error:', geminiResponse.status, errText);
            return res.status(500).json({ error: `Gemini API Error: ${errText}` });
        }

        const data = await geminiResponse.json();
        let content = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!content) return res.status(500).json({ error: 'AI returned empty response.' });

        content = content.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
        const f = content.indexOf('{');
        const l = content.lastIndexOf('}');
        if (f !== -1 && l !== -1) content = content.substring(f, l + 1);

        let questions;
        try { questions = JSON.parse(content); }
        catch (e) {
            console.error('JSON Parse Error:', content.substring(0, 300));
            return res.status(500).json({ error: 'AI returned invalid JSON. Try again.' });
        }

        // Ensure all requested types exist as arrays
        types.forEach(t => {
            const key = QTYPE_JSON_KEYS[t];
            if (!Array.isArray(questions[key])) questions[key] = [];
        });

        // History tracking
        const newTexts = [];
        types.forEach(t => {
            const key = QTYPE_JSON_KEYS[t];
            (questions[key] || []).forEach(q => {
                const txt = q.question || q.assertion || q.case_study || '';
                if (txt) newTexts.push(txt.substring(0, 150));
            });
        });
        questionHistory.set(hKey, [...prevQ, ...newTexts].slice(-200));

        res.json({ success: true, questions, meta: { classNum, subject, chapters, types, each } });

    } catch (err) {
        console.error('Server Error:', err);
        res.status(500).json({ error: `Server error: ${err.message}` });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
