require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const crypto = require('crypto');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// In-memory history tracking to prevent question repetition
const questionHistory = new Map();

function historyKey(c, s, ch) {
    return `${c}::${s}::${ch.sort().join('||')}`;
}

app.post('/api/generate', async (req, res) => {
    try {
        const { classNum, subject, chapters } = req.body;

        if (!process.env.GROQ_API_KEY) {
            console.error('ERROR: GROQ_API_KEY environment variable is not set!');
            return res.status(500).json({ error: 'Server Error: GROQ_API_KEY is missing in Render settings.' });
        }

        if (!classNum || !subject || !chapters || chapters.length === 0) {
            return res.status(400).json({ error: 'Please select class, subject, and chapters.' });
        }

        const hKey = historyKey(classNum, subject, [...chapters]);
        const prevQuestions = questionHistory.get(hKey) || [];

        const avoidBlock = prevQuestions.length > 0
            ? `\n\n⚠️ DO NOT REPEAT THESE QUESTIONS:\n"""\n${prevQuestions.slice(-80).join('\n')}\n"""\n`
            : '';

        const seed = crypto.randomBytes(16).toString('hex');
        const ts = Date.now();

        const syllabusContext = classNum === '9' 
            ? `Class 9 uses the NEW NCF-SE syllabus (Math: 'Orienting Yourself', Science: 'Exploration', Social Science: combined book). Ask questions strictly relevant to these.` 
            : `Use Class 10 NCERT syllabus.`;

        const prompt = `You are an expert CBSE Board paper setter. Generate a UNIQUE practice question paper.

TEXTBOOK: NCERT Class ${classNum} ${subject} — Latest Edition
CHAPTERS SELECTED: ${chapters.join(' | ')}
${syllabusContext}

UNIQUE ID: ${seed}-${ts}

Generate EXACTLY 5 questions in EACH of these 6 sections (30 total):
1. SECTION A: MCQ (1 mark × 5) - 4 options (a,b,c,d), mention correct answer.
2. SECTION B: ASSERTION-REASON (1 mark × 5) - Standard CBSE options.
3. SECTION C: SHORT ANSWER (2 marks × 5)
4. SECTION D: SHORT ANSWER (3 marks × 5)
5. SECTION E: CASE/SOURCE BASED (4 marks × 5) - Detailed passage (80+ words) followed by 4 sub-questions (i, ii, iii, iv).
6. SECTION F: LONG ANSWER (5 marks × 5)

RULES:
- Original questions only.
- Math/Science: Use <sub> for subscripts (H<sub>2</sub>O) and <sup> for superscripts (x<sup>2</sup>).
${avoidBlock}

RESPOND ONLY WITH VALID JSON (NO MARKDOWN CODEBLOCKS):
{
  "mcq": [{"question": "q", "options": {"a": "1", "b": "2", "c": "3", "d": "4"}, "answer": "a", "chapter": "ch"}],
  "assertion_reason": [{"assertion": "A", "reason": "R", "options": {"a": "Both true, R explains A", "b": "Both true, R not explains A", "c": "A true, R false", "d": "A false, R true"}, "answer": "a", "chapter": "ch"}],
  "short_2marks": [{"question": "q", "answer": "ans", "chapter": "ch"}],
  "short_3marks": [{"question": "q", "answer": "ans", "chapter": "ch"}],
  "case_based": [{"case_study": "passage", "sub_questions": [{"question": "sub q", "answer": "ans", "marks": 1}], "chapter": "ch"}],
  "long_answer": [{"question": "q", "answer": "ans", "chapter": "ch"}]
}`;

        // List of fallback models to cycle through if the primary fails
        const modelsToTry = [
            'llama3-70b-8192',
            'mixtral-8x7b-32768',
            'llama3-8b-8192',
            'llama-3.1-8b-instant',
            'gemma2-9b-it',
            
        ];
        
        let groqResponse;
        let successfulModel = '';
        let lastError = '';

        for (const model of modelsToTry) {
            console.log(`Attempting generation with model: ${model}`);
            try {
                groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${process.env.GROQ_API_KEY.trim()}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: model,
                        messages: [
                            { role: 'system', content: 'You are a CBSE exam paper generator. Output strictly in JSON format.' },
                            { role: 'user', content: prompt }
                        ],
                        temperature: 1.0,
                        max_tokens: 8000
                    })
                });

                if (groqResponse.ok) {
                    successfulModel = model;
                    console.log(`Success with model: ${model}`);
                    break; // Exit loop on success
                } else {
                    const errText = await groqResponse.text();
                    lastError = `Model ${model} returned: ${groqResponse.status} - ${errText}`;
                    console.warn(lastError);
                }
            } catch (e) {
                lastError = `Fetch attempt failed for model ${model}: ${e.message}`;
                console.warn(lastError);
            }
        }

        if (!groqResponse || !groqResponse.ok) {
            return res.status(500).json({ error: `All models failed to generate. Last error detail: ${lastError}` });
        }

        const data = await groqResponse.json();
        let content = data.choices?.[0]?.message?.content;

        if (!content) {
            return res.status(500).json({ error: 'AI returned an empty response. Please retry.' });
        }

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
            console.error('Failed to parse AI response:', content.substring(0, 300));
            return res.status(500).json({ error: 'AI response was malformed JSON. Please click Generate again.' });
        }

        // Store generated questions in history
        const newTexts = [];
        const grab = (arr, field) => {
            if (Array.isArray(arr)) arr.forEach(q => { if (q[field]) newTexts.push(q[field].substring(0, 150)); });
        };
        grab(questions.mcq, 'question');
        grab(questions.assertion_reason, 'assertion');
        grab(questions.short_2marks, 'question');
        grab(questions.short_3marks, 'question');
        grab(questions.long_answer, 'question');
        if (Array.isArray(questions.case_based)) {
            questions.case_based.forEach(q => { if (q.case_study) newTexts.push(q.case_study.substring(0, 150)); });
        }

        const updated = [...prevQuestions, ...newTexts].slice(-200);
        questionHistory.set(hKey, updated);

        res.json({ success: true, questions, meta: { classNum, subject, chapters, modelUsed: successfulModel } });

    } catch (err) {
        console.error('Server Catch Error:', err);
        res.status(500).json({ error: `Server catch error: ${err.message}` });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
