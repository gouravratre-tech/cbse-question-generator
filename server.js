require('dotenv').config();

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const crypto = require('crypto');
const path = require('path');


// ============================================================
// AI PROVIDER CONFIGURATION
// ============================================================

const AI_PROVIDERS = [
    {
        name: 'gemini',
        key: process.env.GEMINI_API_KEY,
        models: [
            'gemini-3.6-flash',
            'gemini-3.5-flash'
        ]
    },

    {
        name: 'groq',
        key: process.env.GROQ_API_KEY,
        models: [
            'openai/gpt-oss-120b',
            'openai/gpt-oss-20b'
        ]
    },

    {
        name: 'cerebras',
        key: process.env.CEREBRAS_API_KEY,
        models: [
            'llama-3.3-70b'
        ]
    },

    {
        name: 'openrouter',
        key: process.env.OPENROUTER_API_KEY,
        models: [
            'openrouter/free'
        ]
    }
].filter(provider => provider.key && provider.key.trim());


// ============================================================
// EXPRESS SETUP
// ============================================================

const app = express();

app.use(cors());

app.use(
    express.json({
        limit: '50mb'
    })
);

app.use(
    express.static(path.join(__dirname))
);

app.get('/', (req, res) => {
    res.sendFile(
        path.join(__dirname, 'index.html')
    );
});


// ============================================================
// QUESTION HISTORY
// ============================================================

const questionHistory = new Map();

function historyKey(classNum, subject, chapters) {

    return `${classNum}::${subject}::${(chapters || [])
        .slice()
        .sort()
        .join('||')}`;

}


// ============================================================
// GEMINI RESPONSE SCHEMAS
// ============================================================

const IMAGE_FIELDS = {
    imageRequired: {
        type: 'BOOLEAN'
    },

    imageType: {
        type: 'STRING'
    },

    imageDescription: {
        type: 'STRING'
    }
};


const ITEM_SCHEMAS = {

    mcq: {
        type: 'OBJECT',

        properties: {

            question: {
                type: 'STRING'
            },

            options: {
                type: 'OBJECT',

                properties: {
                    a: { type: 'STRING' },
                    b: { type: 'STRING' },
                    c: { type: 'STRING' },
                    d: { type: 'STRING' }
                },

                required: [
                    'a',
                    'b',
                    'c',
                    'd'
                ]
            },

            answer: {
                type: 'STRING',

                enum: [
                    'a',
                    'b',
                    'c',
                    'd'
                ]
            },

            chapter: {
                type: 'STRING'
            },

            ...IMAGE_FIELDS

        },

        required: [
            'question',
            'options',
            'answer',
            'imageRequired'
        ]
    },


    assertion_reason: {
        type: 'OBJECT',

        properties: {

            assertion: {
                type: 'STRING'
            },

            reason: {
                type: 'STRING'
            },

            options: {
                type: 'OBJECT',

                properties: {
                    a: { type: 'STRING' },
                    b: { type: 'STRING' },
                    c: { type: 'STRING' },
                    d: { type: 'STRING' }
                },

                required: [
                    'a',
                    'b',
                    'c',
                    'd'
                ]
            },

            answer: {
                type: 'STRING',

                enum: [
                    'a',
                    'b',
                    'c',
                    'd'
                ]
            },

            chapter: {
                type: 'STRING'
            },

            ...IMAGE_FIELDS

        },

        required: [
            'assertion',
            'reason',
            'options',
            'answer',
            'imageRequired'
        ]
    },


    short_2marks: {
        type: 'OBJECT',

        properties: {

            question: {
                type: 'STRING'
            },

            answer: {
                type: 'STRING'
            },

            chapter: {
                type: 'STRING'
            },

            ...IMAGE_FIELDS

        },

        required: [
            'question',
            'answer',
            'imageRequired'
        ]
    },


    short_3marks: {
        type: 'OBJECT',

        properties: {

            question: {
                type: 'STRING'
            },

            answer: {
                type: 'STRING'
            },

            chapter: {
                type: 'STRING'
            },

            ...IMAGE_FIELDS

        },

        required: [
            'question',
            'answer',
            'imageRequired'
        ]
    },


    long_answer: {
        type: 'OBJECT',

        properties: {

            question: {
                type: 'STRING'
            },

            answer: {
                type: 'STRING'
            },

            chapter: {
                type: 'STRING'
            },

            ...IMAGE_FIELDS

        },

        required: [
            'question',
            'answer',
            'imageRequired'
        ]
    },


    case_based: {
        type: 'OBJECT',

        properties: {

            case_study: {
                type: 'STRING'
            },

            sub_questions: {

                type: 'ARRAY',

                items: {

                    type: 'OBJECT',

                    properties: {

                        question: {
                            type: 'STRING'
                        },

                        answer: {
                            type: 'STRING'
                        },

                        marks: {
                            type: 'INTEGER'
                        }

                    },

                    required: [
                        'question',
                        'answer'
                    ]

                }

            },

            chapter: {
                type: 'STRING'
            },

            ...IMAGE_FIELDS

        },

        required: [
            'case_study',
            'sub_questions',
            'imageRequired'
        ]
    }

};


// ============================================================
// BUILD GEMINI RESPONSE SCHEMA
// ============================================================

function buildResponseSchema(types) {

    const properties = {};

    types.forEach(type => {

        properties[type] = {

            type: 'ARRAY',

            items:
                ITEM_SCHEMAS[type] ||
                ITEM_SCHEMAS.short_2marks

        };

    });

    return {

        type: 'OBJECT',

        properties,

        required: types

    };

}


// ============================================================
// GEMINI API
// ============================================================

async function callGemini(
    provider,
    model,
    prompt,
    responseTypes
) {

    const url =
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${provider.key.trim()}`;


    const response = await fetch(
        url,
        {

            method: 'POST',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify({

                contents: [

                    {

                        role: 'user',

                        parts: [

                            {
                                text: prompt
                            }

                        ]

                    }

                ],

                generationConfig: {

                    responseMimeType:
                        'application/json',

                    responseSchema:
                        buildResponseSchema(
                            responseTypes
                        ),

                    temperature: 1.0

                }

            })

        }
    );


    if (!response.ok) {

        const errorText =
            await response.text();

        const error =
            new Error(
                `Gemini ${response.status}: ${errorText}`
            );

        error.status =
            response.status;

        throw error;
    }


    const result =
        await response.json();


    return result
        ?.candidates?.[0]
        ?.content?.parts?.[0]
        ?.text;
}


// ============================================================
// OPENAI-COMPATIBLE API
// Used by Groq / Cerebras / OpenRouter
// ============================================================

async function callOpenAICompatible(
    provider,
    model,
    prompt,
    endpoint,
    extraHeaders = {}
) {

    const response = await fetch(
        endpoint,
        {

            method: 'POST',

            headers: {

                'Content-Type':
                    'application/json',

                'Authorization':
                    `Bearer ${provider.key.trim()}`,

                ...extraHeaders

            },

            body: JSON.stringify({

                model,

                messages: [

                    {

                        role: 'user',

                        content: prompt

                    }

                ],

                temperature: 1,

                response_format: {

                    type: 'json_object'

                }

            })

        }
    );


    if (!response.ok) {

        const errorText =
            await response.text();

        const error =
            new Error(
                `${provider.name} ${response.status}: ${errorText}`
            );

        error.status =
            response.status;

        throw error;
    }


    const result =
        await response.json();


    return result
        ?.choices?.[0]
        ?.message?.content;
}


// ============================================================
// GROQ
// ============================================================

async function callGroq(
    provider,
    model,
    prompt
) {

    return callOpenAICompatible(

        provider,

        model,

        prompt,

        'https://api.groq.com/openai/v1/chat/completions'

    );

}


// ============================================================
// CEREBRAS
// ============================================================

async function callCerebras(
    provider,
    model,
    prompt
) {

    return callOpenAICompatible(

        provider,

        model,

        prompt,

        'https://api.cerebras.ai/v1/chat/completions'

    );

}


// ============================================================
// OPENROUTER
// ============================================================

async function callOpenRouter(
    provider,
    model,
    prompt
) {

    return callOpenAICompatible(

        provider,

        model,

        prompt,

        'https://openrouter.ai/api/v1/chat/completions',

        {

            'HTTP-Referer':
                'https://cbse-question-generator-mfyy.onrender.com/',

            'X-Title':
                'CBSE Question Generator'

        }

    );

}


// ============================================================
// PROVIDER DISPATCHER
// ============================================================

async function callProvider(
    provider,
    model,
    prompt,
    responseTypes
) {

    switch (provider.name) {

        case 'gemini':

            return callGemini(
                provider,
                model,
                prompt,
                responseTypes
            );


        case 'groq':

            return callGroq(
                provider,
                model,
                prompt
            );


        case 'cerebras':

            return callCerebras(
                provider,
                model,
                prompt
            );


        case 'openrouter':

            return callOpenRouter(
                provider,
                model,
                prompt
            );


        default:

            throw new Error(
                `Unknown AI provider: ${provider.name}`
            );

    }

}


// ============================================================
// CLEAN JSON RESPONSE
// ============================================================

function cleanJsonText(content) {

    if (!content) {
        return null;
    }


    content =
        content
            .replace(
                /```json\s*/gi,
                ''
            )
            .replace(
                /```\s*/gi,
                ''
            )
            .trim();


    const firstBrace =
        content.indexOf('{');

    const lastBrace =
        content.lastIndexOf('}');


    if (
        firstBrace !== -1 &&
        lastBrace !== -1
    ) {

        content =
            content.substring(
                firstBrace,
                lastBrace + 1
            );

    }


    return content;

}


// ============================================================
// VALIDATE QUESTIONS
// ============================================================

function validateQuestions(
    questions,
    responseTypes
) {

    if (
        !questions ||
        typeof questions !== 'object'
    ) {

        return false;

    }


    return responseTypes.every(
        type =>
            Array.isArray(
                questions[type]
            )
    );

}


// ============================================================
// QUESTION GENERATION
// ============================================================

app.post(
    '/api/generate',
    async (req, res) => {

        try {

            const {

                classNum,

                subject,

                chapters,

                questionTypes,

                singleSlotReq,

                difficulty,

                styleGuide

            } = req.body;


            // ------------------------------------------------
            // CHECK API KEYS
            // ------------------------------------------------

            if (
                AI_PROVIDERS.length === 0
            ) {

                return res
                    .status(500)
                    .json({

                        error:
                            'No AI API keys are configured in Render.'

                    });

            }


            // ------------------------------------------------
            // VALIDATE REQUEST
            // ------------------------------------------------

            if (
                !classNum ||
                !subject ||
                !Array.isArray(chapters) ||
                !chapters.length
            ) {

                return res
                    .status(400)
                    .json({

                        error:
                            'Please select class, subject, and chapters.'

                    });

            }


            // ------------------------------------------------
            // QUESTION HISTORY
            // ------------------------------------------------

            const hKey =
                historyKey(
                    classNum,
                    subject,
                    chapters
                );


            const prevQuestions =
                questionHistory.get(hKey) ||
                [];


            const avoidBlock =
                prevQuestions.length

                    ? `

DO NOT REPEAT THESE PREVIOUS QUESTIONS:

${prevQuestions
    .slice(-100)
    .join('\n')}

`

                    : '';


            // ------------------------------------------------
            // RANDOM SEED
            // ------------------------------------------------

            const seed =
                crypto
                    .randomBytes(16)
                    .toString('hex');


            // ------------------------------------------------
            // QUESTION TYPES
            // ------------------------------------------------

            let generationRules = '';

            let jsonSchema = '';

            let responseTypes = [];


                const schemaMap = {

    mcq:
        '"mcq":[{"question":"q","options":{"a":"o1","b":"o2","c":"o3","d":"o4"},"answer":"a","chapter":"ch","imageRequired":false,"imageType":"","imageDescription":""}]',

    assertion_reason:
        '"assertion_reason":[{"assertion":"A","reason":"R","options":{"a":"Both A and R are true and R is the correct explanation of A","b":"Both A and R are true but R is not the correct explanation of A","c":"A is true but R is false","d":"A is false but R is true"},"answer":"a","chapter":"ch","imageRequired":false,"imageType":"","imageDescription":""}]',

    short_2marks:
        '"short_2marks":[{"question":"q","answer":"ans","chapter":"ch","imageRequired":false,"imageType":"","imageDescription":""}]',

    short_3marks:
        '"short_3marks":[{"question":"q","answer":"ans","chapter":"ch","imageRequired":false,"imageType":"","imageDescription":""}]',

    case_based:
        '"case_based":[{"case_study":"passage","sub_questions":[{"question":"sub q","answer":"ans","marks":1}],"chapter":"ch","imageRequired":false,"imageType":"","imageDescription":""}]',

    long_answer:
        '"long_answer":[{"question":"q","answer":"ans","chapter":"ch","imageRequired":false,"imageType":"","imageDescription":""}]'

};


            // ------------------------------------------------
            // SINGLE QUESTION
            // ------------------------------------------------

            if (singleSlotReq) {

                const type =
                    schemaMap[
                        singleSlotReq.type
                    ]

                        ? singleSlotReq.type

                        : 'short_2marks';


                generationRules =

                    `Generate EXACTLY ONE original ${type} question worth ${singleSlotReq.marks} marks.

Context:
${singleSlotReq.context || 'None'}`;


                jsonSchema =
                    schemaMap[type];


                responseTypes = [
                    type
                ];

            }


            // ------------------------------------------------
            // MULTIPLE QUESTIONS
            // ------------------------------------------------

            else {

                const activeTypes =

                    Array.isArray(questionTypes) &&
                    questionTypes.length

                        ? questionTypes.filter(
                            type =>
                                schemaMap[type]
                        )

                        : [
                            'mcq',
                            'short_2marks'
                        ];


                const blocks = {

                    mcq:
                        'Exactly 5 original MCQs (1 mark each).',


                    assertion_reason:
                        'Exactly 5 Assertion-Reason questions (1 mark each).',


                    short_2marks:
                        'Exactly 5 short-answer questions (2 marks each).',


                    short_3marks:
                        'Exactly 5 short-answer questions (3 marks each).',


                    case_based:
                        'Exactly 3 detailed case-based questions (4 marks each) with a stimulus passage and 4 sub-questions.',


                    long_answer:
                        'Exactly 3 detailed long-answer questions (5 marks each).'

                };


                generationRules =

                    activeTypes
                        .map(
                            type =>
                                `- ${type}: ${blocks[type]}`
                        )
                        .join('\n');


                jsonSchema =

                    activeTypes
                        .map(
                            type =>
                                schemaMap[type]
                        )
                        .join(',\n  ');


                responseTypes =
                    activeTypes;

            }


            // ------------------------------------------------
            // DIFFICULTY
            // ------------------------------------------------

            const difficultyBlock =

                difficulty &&
                difficulty !== 'mixed'

                    ? `DIFFICULTY: ${difficulty.toUpperCase()}.`

                    : 'DIFFICULTY: Mixed easy, medium and hard.';


            // ------------------------------------------------
            // SYLLABUS
            // ------------------------------------------------

            const syllabus =

                classNum === '9'

                    ? 'Class 9 follows the current NCF-SE syllabus.'

                    : 'Class 10 follows NCERT/CBSE curriculum.';


            // ------------------------------------------------
            // STYLE GUIDE
            // ------------------------------------------------

            const styleBlock =

                styleGuide

                    ? `

STYLE GUIDE:

${styleGuide}`

                    : '';


            // ------------------------------------------------
            // PROMPT
            // ------------------------------------------------

            const prompt = `

You are an expert CBSE board paper setter.

Generate original, high-quality, syllabus-aligned questions.

TEXTBOOK:
NCERT Class ${classNum} ${subject}

CHAPTERS:
${chapters.join(' | ')}

${syllabus}

UNIQUE GENERATION ID:
${seed}

QUESTION REQUIREMENTS:

${generationRules}

${difficultyBlock}

${styleBlock}

${avoidBlock}

IMPORTANT QUESTION DESIGN RULES:

1. Return ONLY valid JSON.
2. Do NOT use markdown.
3. Do NOT use code fences.
4. Do NOT add explanations before or after JSON.
5. Use HTML <sub> and <sup> for subscripts and superscripts.
6. Follow the requested question structure exactly.
7. Questions must be original.
8. Questions must be appropriate for CBSE.
9. Answers must be factually correct.
10. Do not repeat previous questions.

QUESTION DESIGN:

11. Do NOT force numerical, calculation-based, formula-based, practical, or image-based questions into every question set.

12. Use numerical or practical questions ONLY when the selected chapter genuinely contains calculations, formulas, experiments, data interpretation, measurements, or practical applications.

13. For theory-oriented chapters, prefer conceptual, analytical, reasoning, explanation, comparison, cause-effect, interpretation and competency-based questions.

14. NEVER create a numerical question just to make a question application-based.

15. Numerical/practical questions are OPTIONAL.

16. Image-based questions are OPTIONAL.

17. NEVER add an image merely for decoration.

18. Use an image ONLY when it genuinely helps assess the concept.

19. Appropriate image-based questions may use:
    - scientific diagrams
    - biological structures
    - chemical structures
    - laboratory apparatus
    - experimental setups
    - electrical circuits
    - ray diagrams
    - graphs
    - charts
    - maps
    - geometrical figures
    - data representations
    - flow diagrams
    - historical/source images
    - geographical diagrams

20. If an image does not improve the question, set imageRequired to false.

21. If an image genuinely improves assessment, set imageRequired to true.

22. When imageRequired is true, imageType must identify the visual:
    diagram, graph, map, circuit, structure, experiment, chart, figure, or other.

23. When imageRequired is true, imageDescription must precisely describe the required educational image.

24. The image description must contain enough information for a later image-generation system to create an accurate educational visual.

25. Do not claim that an image is from NCERT or a textbook unless the actual source image has been provided.

26. Image-based questions may be conceptual, analytical, numerical, practical, or competency-based depending on the chapter.

27. A competency-based question does NOT have to be numerical.

28. Do not force any particular question format.

29. Match the question format to the actual content and learning outcome of the chapter.

30. Maintain variety between questions.

31. The priority is:
    chapter relevance > learning outcome > accuracy > question quality > variety.

32. NEVER invent formulas, experiments, diagrams, numerical situations, or visual contexts unrelated to the selected chapter.

REQUIRED JSON STRUCTURE:

{
  ${jsonSchema}
}
`;


            // =================================================
            // AI PROVIDER FAILOVER
            // =================================================

            let content = null;

            let successfulProvider = null;

            let successfulModel = null;

            let lastError = null;


            for (
                const provider of AI_PROVIDERS
            ) {

                console.log(
                    `Trying provider: ${provider.name}`
                );


                for (
                    const model of provider.models
                ) {

                    try {

                        console.log(
                            `Trying model: ${provider.name} / ${model}`
                        );


                        const result =
                            await callProvider(

                                provider,

                                model,

                                prompt,

                                responseTypes

                            );


                        if (result) {

                            content =
                                result;

                            successfulProvider =
                                provider.name;

                            successfulModel =
                                model;


                            console.log(
                                `SUCCESS: ${provider.name} / ${model}`
                            );


                            break;

                        }

                    }

                    catch (error) {

                        lastError =
                            error;


                        console.error(
                            `FAILED: ${provider.name} / ${model}`
                        );


                        console.error(
                            error.message
                        );


                        // IMPORTANT:
                        // Continue to the next model/provider

                        continue;

                    }

                }


                // Stop provider loop
                // if generation succeeded

                if (content) {

                    break;

                }

            }


            // ------------------------------------------------
            // ALL PROVIDERS FAILED
            // ------------------------------------------------

            if (!content) {

                console.error(
                    'ALL AI PROVIDERS FAILED'
                );


                console.error(
                    lastError?.message
                );


                return res
                    .status(503)
                    .json({

                        error:
                            'All AI providers are temporarily unavailable. Please try again later.'

                    });

            }


            console.log(
                `Question generated using ${successfulProvider} / ${successfulModel}`
            );


            // ------------------------------------------------
            // CLEAN RESPONSE
            // ------------------------------------------------

            content =
                cleanJsonText(
                    content
                );


            // ------------------------------------------------
            // PARSE JSON
            // ------------------------------------------------

            let questions;


            try {

                questions =
                    JSON.parse(
                        content
                    );

            }

            catch (error) {

                console.error(
                    'Invalid JSON from AI:',
                    error.message
                );


                return res
                    .status(502)
                    .json({

                        error:
                            `${successfulProvider} returned invalid JSON. Please try again.`

                    });

            }


            // ------------------------------------------------
            // VALIDATE STRUCTURE
            // ------------------------------------------------

            if (
                !validateQuestions(
                    questions,
                    responseTypes
                )
            ) {

                return res
                    .status(502)
                    .json({

                        error:
                            `${successfulProvider} returned an unexpected question structure.`

                    });

            }


            // ------------------------------------------------
            // STORE QUESTION HISTORY
            // ------------------------------------------------

            const newTexts = [];


            function trackQuestions(
                arr,
                key
            ) {

                if (
                    !Array.isArray(arr)
                ) {

                    return;

                }


                arr.forEach(
                    question => {

                        if (
                            question &&
                            question[key]
                        ) {

                            newTexts.push(

                                String(
                                    question[key]
                                ).substring(
                                    0,
                                    150
                                )

                            );

                        }

                    }
                );

            }


            trackQuestions(
                questions.mcq,
                'question'
            );


            trackQuestions(
                questions.assertion_reason,
                'assertion'
            );


            trackQuestions(
                questions.short_2marks,
                'question'
            );


            trackQuestions(
                questions.short_3marks,
                'question'
            );


            trackQuestions(
                questions.long_answer,
                'question'
            );


            if (
                Array.isArray(
                    questions.case_based
                )
            ) {

                questions.case_based.forEach(
                    question => {

                        if (
                            question &&
                            question.case_study
                        ) {

                            newTexts.push(

                                String(
                                    question.case_study
                                ).substring(
                                    0,
                                    150
                                )

                            );

                        }

                    }
                );

            }


            questionHistory.set(

                hKey,

                [
                    ...prevQuestions,
                    ...newTexts
                ].slice(-250)

            );


            // ------------------------------------------------
            // SEND RESPONSE
            // ------------------------------------------------

            return res.json({

                success: true,

                questions,

                modelUsed:
                    successfulModel,

                providerUsed:
                    successfulProvider

            });

        }


        catch (error) {

            console.error(
                'Server Catch Error:',
                error
            );


            return res
                .status(500)
                .json({

                    error:
                        `Server internal error: ${error.message}`

                });

        }

    }
);


// ============================================================
// BLUEPRINT IMAGE ANALYSIS
// ============================================================

app.post(
    '/api/analyze-blueprint',
    async (req, res) => {

        try {

            const {

                imageBase64,

                mimeType,

                images,

                classNum,

                subject

            } = req.body;


            const provider =
                AI_PROVIDERS.find(
                    p =>
                        p.name === 'gemini'
                );


            const imageList =

                Array.isArray(images) &&
                images.length

                    ? images

                    : imageBase64

                        ? [
                            {
                                base64:
                                    imageBase64,

                                mimeType:
                                    mimeType ||
                                    'image/jpeg'
                            }
                        ]

                        : [];


            if (!provider) {

                return res
                    .status(500)
                    .json({

                        error:
                            'GEMINI_API_KEY is required for blueprint image analysis.'

                    });

            }


            if (
                !imageList.length
            ) {

                return res
                    .status(400)
                    .json({

                        error:
                            'No blueprint image was provided.'

                    });

            }


            const prompt = `

You are an expert CBSE board exam paper-setter.

Analyze the supplied blueprint image(s) as one document.

Return ONLY valid JSON.

Use this exact structure:

{
  "title": "...",
  "sections": [
    {
      "id": "A",
      "name": "...",
      "subject": "General"
    }
  ],
  "slots": [
    {
      "num": 1,
      "type": "mcq",
      "marks": 1,
      "sec": "A",
      "subject": "General",
      "optional": false
    }
  ]
}

Allowed question types:

mcq
assertion_reason
short_2marks
short_3marks
case_based
long_answer

Build sequential slots.

Preserve the aggregate counts, marks and internal-choice information visible in the blueprint.

Class:
${classNum || ''}

Subject:
${subject || ''}

`;


            const parts = [

                {
                    text: prompt
                }

            ];


            imageList.forEach(
                image => {

                    parts.push({

                        inline_data: {

                            mime_type:
                                image.mimeType ||
                                'image/jpeg',

                            data:
                                image.base64

                        }

                    });

                }
            );


            let resultText = null;

            let lastError = null;


            for (
                const model of provider.models
            ) {

                try {

                    const response =
                        await fetch(

                            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${provider.key.trim()}`,

                            {

                                method: 'POST',

                                headers: {

                                    'Content-Type':
                                        'application/json'

                                },

                                body: JSON.stringify({

                                    contents: [

                                        {

                                            role: 'user',

                                            parts

                                        }

                                    ],

                                    generationConfig: {

                                        responseMimeType:
                                            'application/json',

                                        temperature:
                                            0.4

                                    }

                                })

                            }

                        );


                    if (
                        !response.ok
                    ) {

                        lastError =
                            await response.text();

                        continue;

                    }


                    const data =
                        await response.json();


                    resultText =

                        data
                            ?.candidates?.[0]
                            ?.content?.parts?.[0]
                            ?.text;


                    if (
                        resultText
                    ) {

                        break;

                    }

                }

                catch (error) {

                    lastError =
                        error.message;

                }

            }


            if (
                !resultText
            ) {

                return res
                    .status(500)
                    .json({

                        error:
                            `Blueprint analysis failed: ${lastError || 'empty response'}`

                    });

            }


            const blueprint =
                JSON.parse(
                    cleanJsonText(
                        resultText
                    )
                );


            return res.json({

                success: true,

                blueprint

            });

        }


        catch (error) {

            console.error(
                'Blueprint Analysis Error:',
                error
            );


            return res
                .status(500)
                .json({

                    error:
                        `Server error analyzing blueprint: ${error.message}`

                });

        }

    }
);


// ============================================================
// SAMPLE PAPER STYLE ANALYSIS
// ============================================================

app.post(
    '/api/analyze-pattern',
    async (req, res) => {

        try {

            const {

                fileBase64,

                mimeType

            } = req.body;


            const provider =
                AI_PROVIDERS.find(
                    p =>
                        p.name === 'gemini'
                );


            if (!provider) {

                return res
                    .status(500)
                    .json({

                        error:
                            'GEMINI_API_KEY is required for pattern analysis.'

                    });

            }


            if (!fileBase64) {

                return res
                    .status(400)
                    .json({

                        error:
                            'No sample paper file was provided.'

                    });

            }


            const prompt = `

Study the attached CBSE sample paper.

Produce a concise plain-text style guide describing:

1. Phrasing
2. Tone
3. MCQ option style
4. Case-study framing
5. Instructional wording
6. Difficulty level
7. HOTS balance

Do not copy actual questions.

Plain text only.

`;


            let styleGuide = null;

            let lastError = null;


            for (
                const model of provider.models
            ) {

                try {

                    const response =
                        await fetch(

                            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${provider.key.trim()}`,

                            {

                                method: 'POST',

                                headers: {

                                    'Content-Type':
                                        'application/json'

                                },

                                body: JSON.stringify({

                                    contents: [

                                        {

                                            role: 'user',

                                            parts: [

                                                {
                                                    text:
                                                        prompt
                                                },

                                                {

                                                    inline_data: {

                                                        mime_type:
                                                            mimeType ||
                                                            'application/pdf',

                                                        data:
                                                            fileBase64

                                                    }

                                                }

                                            ]

                                        }

                                    ],

                                    generationConfig: {

                                        temperature:
                                            0.4

                                    }

                                })

                            }

                        );


                    if (
                        !response.ok
                    ) {

                        lastError =
                            await response.text();

                        continue;

                    }


                    const data =
                        await response.json();


                    styleGuide =

                        data
                            ?.candidates?.[0]
                            ?.content?.parts?.[0]
                            ?.text;


                    if (
                        styleGuide
                    ) {

                        break;

                    }

                }

                catch (error) {

                    lastError =
                        error.message;

                }

            }


            if (
                !styleGuide
            ) {

                return res
                    .status(500)
                    .json({

                        error:
                            `Pattern analysis failed: ${lastError || 'empty response'}`

                    });

            }


            return res.json({

                success: true,

                styleGuide:
                    styleGuide.trim()

            });

        }


        catch (error) {

            console.error(
                'Pattern Analysis Error:',
                error
            );


            return res
                .status(500)
                .json({

                    error:
                        `Server error analyzing pattern: ${error.message}`

                });

        }

    }
);


// ============================================================
// START SERVER
// ============================================================

const PORT =
    process.env.PORT || 3000;


app.listen(
    PORT,
    () => {

        console.log(
            `Active server hosted on port ${PORT}`
        );

        console.log(
            'Configured AI providers:',
            AI_PROVIDERS.map(
                provider =>
                    provider.name
            ).join(', ') ||
            'NONE'
        );

    }
);
