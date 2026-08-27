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

const questionHistory = new Map();

function historyKey(c, s, ch) {
    return `${c}::${s}::${ch.sort().join('||')}`;
}

app.post('/api/generate', async (req, res) => {
    const { classNum, subject, chapters } = req.body;

    if (!classNum || !subject || !chapters || chapters.length === 0) {
        return res.status(400).json({ error: 'Missing fields' });
    }

    const hKey = historyKey(classNum, subject, [...chapters]);
    const prevQuestions = questionHistory.get(hKey) || [];

    const avoidBlock = prevQuestions.length > 0
        ? `\n\n⚠️ CRITICAL: DO NOT REPEAT ANY OF THESE PREVIOUS QUESTIONS:\n"""\n${prevQuestions.slice(-80).join('\n')}\n"""\n`
        : '';

    const seed = crypto.randomBytes(16).toString('hex');
    const ts = Date.now();

    // Critical instruction: Class 9 has entirely new books based on NCF-SE.
    const syllabusContext = classNum === '9' 
        ? `CRITICAL: Class 9 now uses the BRAND NEW NCF-SE 2023/2026 syllabus. For example, Math has 'Orienting Yourself', Science has 'Exploration', Social Science is one combined book. YOU MUST ONLY ASK QUESTIONS RELEVANT TO THESE NEW SPECIFIC TITLES. DO NOT use the old pre-2024 syllabus.` 
        : `Use the rationalized NCERT Class 10 syllabus.`;

    const prompt = `You are an expert CBSE Board paper setter. Generate a UNIQUE practice question paper.

TEXTBOOK: NCERT Class ${classNum} ${subject} — Latest Edition
CHAPTERS SELECTED: ${chapters.join(' | ')}
${syllabusContext}

UNIQUE ID: ${seed}-${ts}

Generate EXACTLY 5 questions in EACH of these 6 sections (30 total):
1. SECTION A: MCQ (1 mark × 5) - 4 options (a,b,c,d), mention correct answer.
2. SECTION B: ASSERTION-REASON (1 mark × 5) - Options: (a) Both true, R explains A (b) Both true, R doesn't explain A (c) A true, R false (d) A false, R true.
3. SECTION C: SHORT ANSWER (2 marks × 5)
4. SECTION D: SHORT ANSWER (3 marks × 5)
5. SECTION E: CASE/SOURCE BASED (4 marks × 5) - A detailed passage/case (80+ words) followed by exactly 4 sub-questions (i, ii, iii, iv) of 1 mark each.
6. SECTION F: LONG ANSWER (5 marks × 5)

RULES:
1. Every question MUST be original and unique.
2. HTML formatting for science/math:
   - Subscripts: <sub>text</sub> → H<sub>2</sub>O, CO<sub>2</sub>
   - Superscripts: <sup>text</sup> → x<sup>2</sup>, m<sup>2</sup>
   - NEVER write plain H2O or x2.
3. Distribute questions across selected chapters.
4. Difficulty: 30% easy, 40% moderate, 30% hard.
${avoidBlock}

RESPOND WITH PURE VALID JSON ONLY. NO MARKDOWN:
{
  "mcq": [{"question": "q text", "options": {"a": "o1", "b": "o2", "c": "o3", "d": "o4"}, "answer": "a", "chapter": "ch"}],
  "assertion_reason": [{"assertion": "A", "reason": "R", "options": {"a": "Both true, R explains A", "b": "Both true, R not explains A", "c": "A true, R false", "d": "A false, R true"}, "answer": "a", "chapter": "ch"}],
  "short_2marks": [{"question": "q", "answer": "ans", "chapter": "ch"}],
  "short_3marks": [{"question": "q", "answer": "ans", "chapter": "ch"}],
  "case_based": [{"case_study": "passage", "sub_questions": [{"question": "sub q", "answer": "ans", "marks": 1}], "chapter": "ch"}],
  "long_answer": [{"question": "q", "answer": "ans", "chapter": "ch"}]
}`;

    try {
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: `You are a CBSE exam setter. Always use <sub> and <sup> tags for math/science. Output strictly in JSON format.`
                    },
                    { role: 'user', content: prompt }
                ],
                temperature: 1.0,
                max_tokens: 8000,
                top_p: 0.95
            })
        });

        if (!groqResponse.ok) throw new Error(`API Error: ${groqResponse.status}`);

        const data = await groqResponse.json();
        let content = data.choices?.[0]?.message?.content;

        content = content.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
        const firstBrace = content.indexOf('{');
        const lastBrace = content.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            content = content.substring(firstBrace, lastBrace + 1);
        }

        const questions = JSON.parse(content);

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

        res.json({ success: true, questions, meta: { classNum, subject, chapters } });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error', message: err.message });
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server running at http://localhost:${process.env.PORT || 3000}`);
});