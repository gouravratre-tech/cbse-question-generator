// Exact, latest NCERT Class 9 (NCF 2026-27) & Class 10 Syllabus Databases
const ncertData = {
    "9": {
        "Science": [
            "Chapter 1: Exploration: Entering the World of Secondary Science",
            "Chapter 2: Cell: The Building Block of Life",
            "Chapter 3: Tissues in Action",
            "Chapter 4: Describing Motion Around Us",
            "Chapter 5: Exploring Mixtures and their Separation",
            "Chapter 6: How Forces Affect Motion",
            "Chapter 7: Work, Energy, and Simple Machines",
            "Chapter 8: Journey Inside the Atom",
            "Chapter 9: Atomic Foundations of Matter",
            "Chapter 10: Sound Waves: Characteristics and Applications",
            "Chapter 11: Reproduction: How Life Continues",
            "Chapter 12: Patterns in Life: Diversity and Classification",
            "Chapter 13: Earth as a System: Energy, Matter, and Life"
        ],
        "Mathematics": [
            "Chapter 1: Orienting Yourself: The Use of Coordinates",
            "Chapter 2: Introduction to Linear Polynomials",
            "Chapter 3: The World of Numbers",
            "Chapter 4: Exploring Algebraic Identities",
            "Chapter 5: I'm Up and Down, and Round and Round",
            "Chapter 6: Measuring Space: Perimeter and Area",
            "Chapter 7: The Mathematics of Maybe: Introduction to Probability",
            "Chapter 8: Predicting What Comes Next: Exploring Sequences and Progressions"
        ],
        "Social Science": [
            "Chapter 1 (Intro): Understanding Social Science",
            "Chapter 2 (Geography): Shaping of the Earth's Surface",
            "Chapter 3 (Geography): Atmosphere and Climate",
            "Chapter 4 (History): Early Humans and Beginning of Civilisation",
            "Chapter 5 (History): State and Society up to 1000 CE",
            "Chapter 6 (Pol Science): Democracy",
            "Chapter 7 (Pol Science): Elections",
            "Chapter 8 (Economics): Building Blocks in Economics: The Problem of Choice",
            "Chapter 9 (Economics): The Price Puzzle: What Drives the Market"
        ]
    },
    "10": {
        "Science": [
            "Chapter 1: Chemical Reactions and Equations",
            "Chapter 2: Acids, Bases and Salts",
            "Chapter 3: Metals and Non-metals",
            "Chapter 4: Carbon and its Compounds",
            "Chapter 5: Life Processes",
            "Chapter 6: Control and Coordination",
            "Chapter 7: How do Organisms Reproduce?",
            "Chapter 8: Heredity",
            "Chapter 9: Light – Reflection and Refraction",
            "Chapter 10: The Human Eye and the Colourful World",
            "Chapter 11: Electricity",
            "Chapter 12: Magnetic Effects of Electric Current",
            "Chapter 13: Our Environment"
        ],
        "Mathematics": [
            "Chapter 1: Real Numbers", "Chapter 2: Polynomials", "Chapter 3: Pair of Linear Equations in Two Variables",
            "Chapter 4: Quadratic Equations", "Chapter 5: Arithmetic Progressions", "Chapter 6: Triangles",
            "Chapter 7: Coordinate Geometry", "Chapter 8: Introduction to Trigonometry", "Chapter 9: Some Applications of Trigonometry",
            "Chapter 10: Circles", "Chapter 11: Areas Related to Circles", "Chapter 12: Surface Areas and Volumes",
            "Chapter 13: Statistics", "Chapter 14: Probability"
        ],
        "Social Science": [
            "Hist Ch 1: The Rise of Nationalism in Europe", "Hist Ch 2: Nationalism in India", "Hist Ch 3: The Making of a Global World", 
            "Hist Ch 4: The Age of Industrialisation", "Hist Ch 5: Print Culture and the Modern World",
            "Geo Ch 1: Resources and Development", "Geo Ch 2: Forest and Wildlife Resources", "Geo Ch 3: Water Resources", 
            "Geo Ch 4: Agriculture", "Geo Ch 5: Minerals and Energy Resources", "Geo Ch 6: Manufacturing Industries", "Geo Ch 7: Lifelines of National Economy",
            "Civics Ch 1: Power Sharing", "Civics Ch 2: Federalism", "Civics Ch 3: Gender, Religion and Caste", 
            "Civics Ch 4: Political Parties", "Civics Ch 5: Outcomes of Democracy",
            "Eco Ch 1: Development", "Eco Ch 2: Sectors of the Indian Economy", "Eco Ch 3: Money and Credit", 
            "Eco Ch 4: Globalisation and the Indian Economy", "Eco Ch 5: Consumer Rights"
        ]
    }
};

// Blueprint Profiles (Structured precisely matching the uploaded Science Board pattern)
const blueprints = {
    "Science-X-Disciplinary": {
        title: "Class 10 Science Blueprint (Disciplinary division)",
        sections: [
            { id: "A", name: "Section A: Biology (Q1 - Q16)", subject: "Biology" },
            { id: "B", name: "Section B: Chemistry (Q17 - Q29)", subject: "Chemistry" },
            { id: "C", name: "Section C: Physics (Q30 - Q39)", subject: "Physics" }
        ],
        slots: [
            // Biology Slots
            { num: 1, type: "mcq", marks: 1, sec: "A", subject: "Biology" },
            { num: 2, type: "mcq", marks: 1, sec: "A", subject: "Biology" },
            { num: 3, type: "mcq", marks: 1, sec: "A", subject: "Biology" },
            { num: 4, type: "mcq", marks: 1, sec: "A", subject: "Biology" },
            { num: 5, type: "mcq", marks: 1, sec: "A", subject: "Biology" },
            { num: 6, type: "mcq", marks: 1, sec: "A", subject: "Biology" },
            { num: 7, type: "mcq", marks: 1, sec: "A", subject: "Biology" },
            { num: 8, type: "assertion_reason", marks: 1, sec: "A", subject: "Biology" },
            { num: 9, type: "assertion_reason", marks: 1, sec: "A", subject: "Biology" },
            { num: 10, type: "short_2marks", marks: 2, sec: "A", subject: "Biology" },
            { num: 11, type: "short_2marks", marks: 2, sec: "A", subject: "Biology", optional: true },
            { num: 12, type: "short_2marks", marks: 2, sec: "A", subject: "Biology" },
            { num: 13, type: "short_3marks", marks: 3, sec: "A", subject: "Biology" },
            { num: 14, type: "short_3marks", marks: 3, sec: "A", subject: "Biology", optional: true },
            { num: 15, type: "case_based", marks: 4, sec: "A", subject: "Biology", optional: true },
            { num: 16, type: "long_answer", marks: 5, sec: "A", subject: "Biology", optional: true },
            // Chemistry Slots
            { num: 17, type: "mcq", marks: 1, sec: "B", subject: "Chemistry" },
            { num: 18, type: "mcq", marks: 1, sec: "B", subject: "Chemistry" },
            { num: 19, type: "mcq", marks: 1, sec: "B", subject: "Chemistry" },
            { num: 20, type: "mcq", marks: 1, sec: "B", subject: "Chemistry" },
            { num: 21, type: "mcq", marks: 1, sec: "B", subject: "Chemistry" },
            { num: 22, type: "mcq", marks: 1, sec: "B", subject: "Chemistry" },
            { num: 23, type: "mcq", marks: 1, sec: "B", subject: "Chemistry" },
            { num: 24, type: "assertion_reason", marks: 1, sec: "B", subject: "Chemistry" },
            { num: 25, type: "short_2marks", marks: 2, sec: "B", subject: "Chemistry" },
            { num: 26, type: "short_3marks", marks: 3, sec: "B", subject: "Chemistry", optional: true },
            { num: 27, type: "short_3marks", marks: 3, sec: "B", subject: "Chemistry" },
            { num: 28, type: "case_based", marks: 4, sec: "B", subject: "Chemistry", optional: true },
            { num: 29, type: "long_answer", marks: 5, sec: "B", subject: "Chemistry", optional: true },
            // Physics Slots
            { num: 30, type: "mcq", marks: 1, sec: "C", subject: "Physics" },
            { num: 31, type: "mcq", marks: 1, sec: "C", subject: "Physics" },
            { num: 32, type: "assertion_reason", marks: 1, sec: "C", subject: "Physics" },
            { num: 33, type: "short_2marks", marks: 2, sec: "C", subject: "Physics" },
            { num: 34, type: "short_2marks", marks: 2, sec: "C", subject: "Physics", optional: true },
            { num: 35, type: "short_3marks", marks: 3, sec: "C", subject: "Physics" },
            { num: 36, type: "short_3marks", marks: 3, sec: "C", subject: "Physics" },
            { num: 37, type: "short_3marks", marks: 3, sec: "C", subject: "Physics", optional: true },
            { num: 38, type: "case_based", marks: 4, sec: "C", subject: "Physics", optional: true },
            { num: 39, type: "long_answer", marks: 5, sec: "C", subject: "Physics", optional: true }
        ]
    },
    "CBSE-Standard-80": {
        title: "Standard General Blueprint (38 Qs, 80 Marks)",
        sections: [
            { id: "A", name: "Section A: Multiple Choice & Assertion-Reason Questions (Q1-20)", subject: "General" },
            { id: "B", name: "Section B: Very Short Answer SA-I (Q21-25)", subject: "General" },
            { id: "C", name: "Section C: Short Answer SA-II (Q26-31)", subject: "General" },
            { id: "D", name: "Section D: Long Answer LA (Q32-35)", subject: "General" },
            { id: "E", name: "Section E: Case / Integrated Units (Q36-38)", subject: "General" }
        ],
        slots: (() => {
            const arr = [];
            for (let i = 1; i <= 16; i++) arr.push({ num: i, type: "mcq", marks: 1, sec: "A" });
            for (let i = 17; i <= 20; i++) arr.push({ num: i, type: "assertion_reason", marks: 1, sec: "A" });
            for (let i = 21; i <= 25; i++) arr.push({ num: i, type: "short_2marks", marks: 2, sec: "B", optional: i === 23 || i === 25 });
            for (let i = 26; i <= 31; i++) arr.push({ num: i, type: "short_3marks", marks: 3, sec: "C", optional: i === 28 || i === 31 });
            for (let i = 32; i <= 35; i++) arr.push({ num: i, type: "long_answer", marks: 5, sec: "D", optional: true });
            for (let i = 36; i <= 38; i++) arr.push({ num: i, type: "case_based", marks: 4, sec: "E", optional: i === 38 });
            return arr;
        })()
    },
    "SST-NCF-9": {
        title: "Class 9 NCF Blueprint Pattern (30 Qs, 80 Marks)",
        sections: [
            { id: "A", name: "Section A: MCQs (Q1-15)", subject: "General" },
            { id: "B", name: "Section B: Short Answers (Q16-22)", subject: "General" },
            { id: "C", name: "Section C: Case / Source Units (Q23-26)", subject: "General" },
            { id: "D", name: "Section D: Long Answers (Q27-30)", subject: "General" }
        ],
        slots: (() => {
            const arr = [];
            for (let i = 1; i <= 15; i++) arr.push({ num: i, type: "mcq", marks: 1, sec: "A" });
            for (let i = 16; i <= 22; i++) arr.push({ num: i, type: "short_3marks", marks: 3, sec: "B", optional: i % 3 === 0 });
            for (let i = 23; i <= 26; i++) arr.push({ num: i, type: "case_based", marks: 4, sec: "C", optional: i === 26 });
            for (let i = 27; i <= 30; i++) arr.push({ num: i, type: "long_answer", marks: 5, sec: "D", optional: true });
            return arr;
        })()
    },
    "Custom-Draft-30": {
        title: "Flexible Custom Template (30 Slots, 100 Marks)",
        sections: [
            { id: "A", name: "MCQs & Objective Questions (Q1-10)", subject: "General" },
            { id: "B", name: "Short Answers (Q11-20)", subject: "General" },
            { id: "C", name: "Long Subjective Answers (Q21-30)", subject: "General" }
        ],
        slots: (() => {
            const arr = [];
            for (let i = 1; i <= 10; i++) arr.push({ num: i, type: "mcq", marks: 1, sec: "A" });
            for (let i = 11; i <= 20; i++) arr.push({ num: i, type: "short_3marks", marks: 3, sec: "B", optional: true });
            for (let i = 21; i <= 30; i++) arr.push({ num: i, type: "long_answer", marks: 5, sec: "C", optional: true });
            return arr;
        })()
    }
};

// State Store
let activeDraft = {}; // Map of slot number -> assigned question node
let activeORs = {};   // Map of slot number -> assigned OR alternative question node
let currentPool = []; // Array of generated questions currently in pool
let temporaryQToAllocate = null;

// DOM Controls
const classSelect = document.getElementById('classSelect');
const subjectSelect = document.getElementById('subjectSelect');
const blueprintSelect = document.getElementById('blueprintSelect');
const chapterBox = document.getElementById('chapterBox');
const btnFetchPool = document.getElementById('btnFetchPool');
const btnAutoFill = document.getElementById('btnAutoFill');
const poolType = document.getElementById('poolType');
const poolWrapper = document.getElementById('poolWrapper');
const blueprintSlotMatrix = document.getElementById('blueprintSlotMatrix');
const paperPreviewSection = document.getElementById('paperPreviewSection');
const boardPaper = document.getElementById('boardPaper');
const boardAnswers = document.getElementById('boardAnswers');

// Initialize events
classSelect.addEventListener('change', populateSubjects);
subjectSelect.addEventListener('change', populateChapters);
blueprintSelect.addEventListener('change', setupBlueprintDraftUI);
btnFetchPool.addEventListener('click', generatePool);
btnAutoFill.addEventListener('click', autoFillEmptySlots);

function populateSubjects() {
    const cls = classSelect.value;
    subjectSelect.innerHTML = '<option value="">— Choose Subject —</option>';
    chapterBox.innerHTML = '<div class="empty-state">Select subject first.</div>';
    subjectSelect.disabled = !cls;
    btnFetchPool.disabled = true;
    
    if (cls && ncertData[cls]) {
        Object.keys(ncertData[cls]).forEach(sub => {
            const opt = document.createElement('option');
            opt.value = sub;
            opt.textContent = sub;
            subjectSelect.appendChild(opt);
        });
    }
}

function populateChapters() {
    const cls = classSelect.value;
    const sub = subjectSelect.value;
    chapterBox.innerHTML = '';
    btnFetchPool.disabled = true;

    if (cls && sub && ncertData[cls]?.[sub]) {
        const list = ncertData[cls][sub];
        chapterBox.innerHTML = `<div class="sel-all"><input type="checkbox" id="selAll"><label for="selAll">Select All Chapters</label></div>`;
        list.forEach((ch, i) => {
            chapterBox.innerHTML += `
                <div class="ch-item">
                    <input type="checkbox" value="${ch}" class="chk-ch" id="ch_${i}">
                    <label for="ch_${i}">${ch}</label>
                </div>
            `;
        });

        document.getElementById('selAll').addEventListener('change', function() {
            document.querySelectorAll('.chk-ch').forEach(chk => chk.checked = this.checked);
            updatePoolButtonState();
        });

        chapterBox.addEventListener('change', (e) => {
            if (e.target.classList.contains('chk-ch')) {
                const total = document.querySelectorAll('.chk-ch').length;
                const active = document.querySelectorAll('.chk-ch:checked').length;
                document.getElementById('selAll').checked = (total === active);
                updatePoolButtonState();
            }
        });
    }
}

function updatePoolButtonState() {
    const activeChs = document.querySelectorAll('.chk-ch:checked').length > 0;
    btnFetchPool.disabled = !activeChs;
    btnAutoFill.disabled = !activeChs;
}

// 1. Build Interactive Blueprint Grid based on selected Template
function setupBlueprintDraftUI() {
    const bpKey = blueprintSelect.value;
    const bp = blueprints[bpKey];
    if (!bp) return;

    activeDraft = {};
    activeORs = {};
    blueprintSlotMatrix.innerHTML = '';

    bp.sections.forEach(sec => {
        const sectionContainer = document.createElement('div');
        sectionContainer.className = 'blueprint-section';
        sectionContainer.innerHTML = `<h3 style="font-size:0.95rem; font-weight:800; color:var(--pri-dark); margin:1.5rem 0 0.6rem 0; border-bottom:2px solid var(--border); padding-bottom:0.2rem;">${sec.name}</h3>`;
        
        const secSlots = bp.slots.filter(s => s.sec === sec.id);
        secSlots.forEach(slot => {
            const card = document.createElement('div');
            card.className = 'slot-card empty';
            card.id = `slot_card_${slot.num}`;
            card.dataset.num = slot.num;
            card.dataset.type = slot.type;
            card.dataset.marks = slot.marks;
            card.dataset.subject = slot.subject || '';

            renderSlotState(card, slot);
            sectionContainer.appendChild(card);
        });

        blueprintSlotMatrix.appendChild(sectionContainer);
    });

    updateProgress();
    paperPreviewSection.style.display = 'none';
}

// Render individual slot configuration
function renderSlotState(card, slot) {
    const isAssigned = !!activeDraft[slot.num];
    card.className = `slot-card ${isAssigned ? 'assigned' : 'empty'}`;

    if (!isAssigned) {
        card.innerHTML = `
            <div class="slot-header">
                <span class="slot-label"><i class="fas fa-folder-open" style="color:var(--text-muted)"></i> Slot Q${slot.num}</span>
                <span class="slot-meta">${slot.type.replace('_',' ').toUpperCase()} — [${slot.marks} Marks]</span>
            </div>
            <div class="slot-body">
                <div class="slot-empty-prompt">
                    <span class="slot-empty-text"><i class="fas fa-info-circle"></i> Slot is empty</span>
                    <button class="btn btn-outline btn-sm" onclick="triggerImmediateAIForSlot(${slot.num})"><i class="fas fa-magic"></i> Auto-Generate</button>
                </div>
            </div>
        `;
    } else {
        const q = activeDraft[slot.num];
        const hasOrAssigned = !!activeORs[slot.num];

        card.innerHTML = `
            <div class="slot-header">
                <span class="slot-label"><i class="fas fa-check-circle" style="color:var(--success)"></i> Slot Q${slot.num}</span>
                <span class="slot-meta" style="color:var(--success-dark)">${slot.type.replace('_',' ').toUpperCase()} — [${slot.marks} Marks]</span>
            </div>
            <div class="slot-body">
                <div class="slot-assigned-view">
                    <div class="slot-assigned-q"><b>Q${slot.num}.</b> ${formatContent(q.question || q.assertion || q.case_study)}</div>
                    
                    <!-- Display OR choice block if optional configured on blueprint -->
                    ${slot.optional ? `
                        <div class="or-choice-slot" id="or_container_${slot.num}">
                            ${hasOrAssigned ? `
                                <div class="or-slot-header">
                                    <span class="or-tag">OR Choice Option</span>
                                    <button class="btn btn-danger btn-sm" onclick="removeORChoice(${slot.num})"><i class="fas fa-trash"></i></button>
                                </div>
                                <div class="or-body"><b>OR.</b> ${formatContent(activeORs[slot.num].question || activeORs[slot.num].assertion || activeORs[slot.num].case_study)}</div>
                            ` : `
                                <div class="or-empty">
                                    <span><i class="fas fa-link"></i> Configured for optional Internal OR Choice</span>
                                    <button class="btn btn-warning btn-sm" onclick="promptAllocateToOR(${slot.num})"><i class="fas fa-plus"></i> Assign OR</button>
                                </div>
                            `}
                        </div>
                    ` : ''}

                    <div class="slot-assigned-actions">
                        <button class="btn btn-outline btn-sm" onclick="clearSlot(${slot.num})"><i class="fas fa-times"></i> Clear Slot</button>
                    </div>
                </div>
            </div>
        `;
    }
}

// 2. Fetch a Pool of 5 Questions based on Chosen Type
async function generatePool() {
    const cls = classSelect.value;
    const sub = subjectSelect.value;
    const chs = Array.from(document.querySelectorAll('.chk-ch:checked')).map(chk => chk.value);
    const type = poolType.value;

    if (!cls || !sub || !chs.length) return alert('Please select class, subject and chapters.');

    btnFetchPool.disabled = true;
    btnFetchPool.querySelector('.loader-icon').style.display = 'inline-block';
    btnFetchPool.querySelector('.action-icon').style.display = 'none';

    try {
        const res = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ classNum: cls, subject: sub, chapters: chs, questionTypes: [type] })
        });
        const data = await res.json();
        
        if (data.success && data.questions) {
            currentPool = data.questions[type] || [];
            renderPoolWrapper(type);
        } else {
            alert('Failed: ' + (data.error || 'Unknown error'));
        }
    } catch (e) {
        alert('Server processing error. Try reducing chapters or click Generate again.');
    } finally {
        btnFetchPool.disabled = false;
        btnFetchPool.querySelector('.loader-icon').style.display = 'none';
        btnFetchPool.querySelector('.action-icon').style.display = 'inline-block';
    }
}

// Render fetched pools
function renderPoolWrapper(type) {
    poolWrapper.innerHTML = '';
    if (!currentPool.length) {
        poolWrapper.innerHTML = `<p class="empty-state">No matching questions returned for type ${type}. Please retry.</p>`;
        return;
    }

    currentPool.forEach((q, idx) => {
        const card = document.createElement('div');
        card.className = 'pool-q-card';
        card.innerHTML = `
            <div class="q-card-head">
                <span class="q-card-badge">${type.toUpperCase().replace('_',' ')}</span>
                <span class="q-card-ch">${q.chapter || ''}</span>
            </div>
            <div class="q-card-body">${formatContent(q.question || q.assertion || q.case_study)}</div>
            ${type === 'mcq' || type === 'assertion_reason' ? `
                <div class="q-card-opts">
                    <div class="q-card-opt"><b>(a)</b> ${q.options?.a || ''}</div>
                    <div class="q-card-opt"><b>(b)</b> ${q.options?.b || ''}</div>
                    <div class="q-card-opt"><b>(c)</b> ${q.options?.c || ''}</div>
                    <div class="q-card-opt"><b>(d)</b> ${q.options?.d || ''}</div>
                </div>
            ` : ''}
            <div class="q-card-actions">
                <button class="btn btn-primary btn-sm" onclick="initiateAllocation(${idx}, '${type}')"><i class="fas fa-plus"></i> Allocate to Draft</button>
            </div>
        `;
        poolWrapper.appendChild(card);
    });
}

// Modal interface helper
function initiateAllocation(poolIdx, type) {
    temporaryQToAllocate = currentPool[poolIdx];
    if (!temporaryQToAllocate) return;

    const bpKey = blueprintSelect.value;
    const bp = blueprints[bpKey];
    const modalSlotList = document.getElementById('modalSlotList');
    modalSlotList.innerHTML = '';

    // Filter slots matching question parameters
    const matchingSlots = bp.slots.filter(s => s.type === type);

    if (!matchingSlots.length) {
        alert(`No slots matching type "${type.toUpperCase().replace('_',' ')}" found in selected blueprint!`);
        return;
    }

    matchingSlots.forEach(s => {
        const status = activeDraft[s.num] ? 'Assigned' : 'Empty';
        const btn = document.createElement('button');
        btn.className = 'modal-slot-option';
        btn.innerHTML = `
            <span><b>Slot Q${s.num}</b> — [${s.marks} Marks]</span>
            <span style="font-size:0.75rem; color:${status === 'Empty' ? 'var(--text-muted)' : 'var(--success)'}">${status}</span>
        `;
        btn.onclick = () => {
            activeDraft[s.num] = temporaryQToAllocate;
            closeAllocatorModal();
            const card = document.getElementById(`slot_card_${s.num}`);
            renderSlotState(card, s);
            updateProgress();
        };
        modalSlotList.appendChild(btn);
    });

    document.getElementById('allocatorModal').style.display = 'flex';
}

function promptAllocateToOR(slotNum) {
    const bpKey = blueprintSelect.value;
    const bp = blueprints[bpKey];
    const slot = bp.slots.find(s => s.num === slotNum);
    if (!slot) return;

    const matchedInPool = currentPool.filter(q => q.question ? true : false); // fallback check
    if (!currentPool.length) {
        alert('Your generator pool is empty! Please generate some compatible questions first.');
        return;
    }

    const modalSlotList = document.getElementById('modalSlotList');
    modalSlotList.innerHTML = `<p style="font-size:0.8rem; margin-bottom:0.5rem; color:var(--text-sec);">Choose an item from the generated pool above to serve as the OR choice:</p>`;

    currentPool.forEach((q, idx) => {
        const btn = document.createElement('button');
        btn.className = 'modal-slot-option';
        btn.innerHTML = `<span><b>Option ${idx+1}:</b> ${formatContent(q.question || q.assertion || q.case_study).substring(0,60)}...</span>`;
        btn.onclick = () => {
            activeORs[slotNum] = currentPool[idx];
            closeAllocatorModal();
            const card = document.getElementById(`slot_card_${slotNum}`);
            renderSlotState(card, slot);
            updateProgress();
        };
        modalSlotList.appendChild(btn);
    });

    document.getElementById('allocatorModal').style.display = 'flex';
}

function removeORChoice(slotNum) {
    delete activeORs[slotNum];
    const bpKey = blueprintSelect.value;
    const bp = blueprints[bpKey];
    const slot = bp.slots.find(s => s.num === slotNum);
    const card = document.getElementById(`slot_card_${slotNum}`);
    renderSlotState(card, slot);
    updateProgress();
}

function closeAllocatorModal() {
    document.getElementById('allocatorModal').style.display = 'none';
    temporaryQToAllocate = null;
}

function clearSlot(slotNum) {
    delete activeDraft[slotNum];
    delete activeORs[slotNum];
    const bpKey = blueprintSelect.value;
    const bp = blueprints[bpKey];
    const slot = bp.slots.find(s => s.num === slotNum);
    const card = document.getElementById(`slot_card_${slotNum}`);
    renderSlotState(card, slot);
    updateProgress();
}

// 3. Auto-Generate matching questions for single slot instantly
async function triggerImmediateAIForSlot(slotNum) {
    const cls = classSelect.value;
    const sub = subjectSelect.value;
    const chs = Array.from(document.querySelectorAll('.chk-ch:checked')).map(chk => chk.value);
    
    if (!cls || !sub || !chs.length) {
        alert('Please select class, subject and chapters first.');
        return;
    }

    const bpKey = blueprintSelect.value;
    const bp = blueprints[bpKey];
    const slot = bp.slots.find(s => s.num === slotNum);
    if (!slot) return;

    const card = document.getElementById(`slot_card_${slotNum}`);
    card.innerHTML = `
        <div class="loader-panel">
            <div class="spinner"><i class="fas fa-circle-notch fa-spin"></i></div>
            <p style="font-size:0.75rem; color:var(--text-muted)">Generating dedicated question...</p>
        </div>
    `;

    try {
        const res = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                classNum: cls,
                subject: sub,
                chapters: chs,
                singleSlotReq: {
                    type: slot.type,
                    marks: slot.marks,
                    context: `Specific context for Board Exam Question ${slotNum} on subject discipline ${slot.subject || 'General'}`
                }
            })
        });
        const data = await res.json();
        if (data.success && data.questions) {
            const arr = data.questions[slot.type] || [];
            if (arr.length > 0) {
                activeDraft[slotNum] = arr[0];
            } else {
                throw new Error('Empty API collection returned.');
            }
        } else {
            throw new Error(data.error || 'Failed status');
        }
    } catch (e) {
        alert(`Slot Auto-Generation failed: ${e.message}. Attempting retry with fallback.`);
    } finally {
        renderSlotState(card, slot);
        updateProgress();
    }
}

// Auto-fill all remaining empty slots in sequence
async function autoFillEmptySlots() {
    const bpKey = blueprintSelect.value;
    const bp = blueprints[bpKey];
    const emptySlots = bp.slots.filter(s => !activeDraft[s.num]);

    if (!emptySlots.length) {
        alert('All slots are populated!');
        return;
    }

    if (!confirm(`Are you sure you want to let Gemini auto-fill the remaining ${emptySlots.length} blueprint slots?`)) return;

    btnAutoFill.disabled = true;
    for (const slot of emptySlots) {
        await triggerImmediateAIForSlot(slot.num);
    }
    btnAutoFill.disabled = false;
    updateProgress();
}

// 4. Update board progress metrics
function updateProgress() {
    const bpKey = blueprintSelect.value;
    const bp = blueprints[bpKey];
    if (!bp) return;

    const total = bp.slots.length;
    const active = Object.keys(activeDraft).length;
    const percent = Math.round((active / total) * 100);

    document.getElementById('slotsCount').textContent = `${active}/${total}`;
    document.getElementById('slotsPercent').textContent = `${percent}%`;
    document.getElementById('progressFill').style.width = `${percent}%`;

    // Trigger printable paper compiler when paper is fully complete
    if (percent === 100) {
        paperPreviewSection.style.display = 'block';
        compileBoardPaper();
    } else {
        paperPreviewSection.style.display = 'none';
    }
}

// Format superscripts and subscripts cleanly
function formatContent(str) {
    if (!str) return '';
    return str
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\n/g, '<br>');
}

// 5. Compile Board Paper layout
function compileBoardPaper() {
    const bpKey = blueprintSelect.value;
    const bp = blueprints[bpKey];
    
    // Header compiler
    let paperHTML = `
        <h2>CENTRAL BOARD OF SECONDARY EDUCATION</h2>
        <h3>PRACTICE QUESTION PAPER (2025-26)</h3>
        <div class="board-meta">
            <span>Subject: ${subjectSelect.value}</span>
            <span>Max Marks: 80</span>
            <span>Time: 3 Hours</span>
        </div>
        <div class="board-instructions">
            <strong>General Instructions:</strong>
            <ol>
                <li>This question paper contains 39 questions in total.</li>
                <li>All questions are compulsory.</li>
                <li>There is no overall choice. However, internal choices are provided in several questions. A student has to attempt only one of the alternatives in such questions.</li>
                <li>Use of calculators is not permitted. Draw neat labelled diagrams wherever necessary.</li>
            </ol>
        </div>
    `;

    let answerHTML = `
        <h2 style="text-align:center; font-family:'Inter', sans-serif;">MARKING SCHEME / ANSWER KEY</h2>
        <div class="board-meta">
            <span>Subject: ${subjectSelect.value}</span>
            <span>Max Marks: 80</span>
        </div>
    `;

    bp.sections.forEach(sec => {
        paperHTML += `<div class="board-sec-head"><div>${sec.name}</div><div>CBSE Pattern</div></div>`;
        answerHTML += `<div class="board-sec-head"><div>Solutions: ${sec.name}</div></div>`;

        const secSlots = bp.slots.filter(s => s.sec === sec.id);
        secSlots.forEach(slot => {
            const q = activeDraft[slot.num];
            const hasOr = !!activeORs[slot.num];

            if (q) {
                paperHTML += `<div class="board-q-item"><div class="board-q-text">`;
                paperHTML += `<span class="board-q-num">${slot.num}.</span>`;
                
                // Content compilation
                paperHTML += `<div class="board-q-val">${formatContent(q.question || q.assertion || q.case_study)}`;
                
                if (slot.type === 'mcq') {
                    paperHTML += `
                        <div class="board-opts">
                            <div class="board-opt"><b>(a)</b> ${formatContent(q.options?.a)}</div>
                            <div class="board-opt"><b>(b)</b> ${formatContent(q.options?.b)}</div>
                            <div class="board-opt"><b>(c)</b> ${formatContent(q.options?.c)}</div>
                            <div class="board-opt"><b>(d)</b> ${formatContent(q.options?.d)}</div>
                        </div>
                    `;
                } else if (slot.type === 'assertion_reason') {
                    paperHTML += `
                        <div class="board-ar-box">
                            <b>Assertion (A):</b> ${formatContent(q.assertion)}<br>
                            <b>Reason (R):</b> ${formatContent(q.reason)}
                        </div>
                        <div class="board-opts" style="margin-top:0.4rem;">
                            <div class="board-opt"><b>(a)</b> Both A and R are true and R is the correct explanation of A.</div>
                            <div class="board-opt"><b>(b)</b> Both A and R are true but R is not the correct explanation of A.</div>
                            <div class="board-opt"><b>(c)</b> A is true but R is false.</div>
                            <div class="board-opt"><b>(d)</b> A is false but R is true.</div>
                        </div>
                    `;
                } else if (slot.type === 'case_based') {
                    paperHTML += `<div class="board-case-box">${formatContent(q.case_study)}</div><div class="board-case-subqs">`;
                    (q.sub_questions || []).forEach((sq, i) => {
                        const lbl = ['(i)','(ii)','(iii)','(iv)'][i];
                        paperHTML += `<div class="board-case-subq"><span>${lbl} ${formatContent(sq.question)}</span> <span>[1 Mark]</span></div>`;
                    });
                    paperHTML += `</div>`;
                }

                paperHTML += `</div>`;
                paperHTML += `<span class="board-q-marks">[${slot.marks} Marks]</span>`;
                paperHTML += `</div></div>`; // Closing tags for question markup

                // Compile answers
                answerHTML += `<div class="board-q-item"><b>Q${slot.num} Solution Key:</b><br>`;
                if (slot.type === 'mcq') {
                    answerHTML += `Correct Option: <span class="a-correct">(${q.answer.toUpperCase()}) ${q.options?.[q.answer]}</span>`;
                } else if (slot.type === 'assertion_reason') {
                    answerHTML += `Correct Option: <span class="a-correct">(${q.answer.toUpperCase()})</span>`;
                } else if (slot.type === 'case_based') {
                    (q.sub_questions || []).forEach((sq, i) => {
                        const lbl = ['(i)','(ii)','(iii)','(iv)'][i];
                        answerHTML += `<br><b>${lbl} Answer:</b> ${formatContent(sq.answer)}`;
                    });
                } else {
                    answerHTML += `Suggested marking point evaluation:<br>${formatContent(q.answer)}`;
                }
                answerHTML += `</div>`;

                // If internal choice OR assigned
                if (hasOr) {
                    const o = activeORs[slot.num];
                    paperHTML += `<div class="board-or-divider">OR</div>`;
                    paperHTML += `<div class="board-q-item"><div class="board-q-text">`;
                    paperHTML += `<span class="board-q-num">${slot.num}.</span>`;
                    paperHTML += `<div class="board-q-val">${formatContent(o.question || o.assertion || o.case_study)}`;
                    
                    if (slot.type === 'case_based') {
                        paperHTML += `<div class="board-case-box">${formatContent(o.case_study)}</div><div class="board-case-subqs">`;
                        (o.sub_questions || []).forEach((sq, i) => {
                            const lbl = ['(i)','(ii)','(iii)','(iv)'][i];
                            paperHTML += `<div class="board-case-subq"><span>${lbl} ${formatContent(sq.question)}</span> <span>[1 Mark]</span></div>`;
                        });
                        paperHTML += `</div>`;
                    }
                    paperHTML += `</div>`;
                    paperHTML += `<span class="board-q-marks">[${slot.marks} Marks]</span>`;
                    paperHTML += `</div></div>`;

                    // Compile OR answers
                    answerHTML += `<div class="board-q-item" style="border-left: 2px solid var(--accent); padding-left:10px;"><b>OR Alternate Solution Key:</b><br>`;
                    if (slot.type === 'case_based') {
                        (o.sub_questions || []).forEach((sq, i) => {
                            const lbl = ['(i)','(ii)','(iii)','(iv)'][i];
                            answerHTML += `<br><b>${lbl} Answer:</b> ${formatContent(sq.answer)}`;
                        });
                    } else {
                        answerHTML += `Suggested alternate marking evaluation:<br>${formatContent(o.answer)}`;
                    }
                    answerHTML += `</div>`;
                }
            }
        });
    });

    boardPaper.innerHTML = paperHTML;
    boardAnswers.innerHTML = answerHTML;
}

// Toggle printable answers layout
document.getElementById('btnToggleAnswers').addEventListener('click', () => {
    const state = boardAnswers.style.display !== 'none';
    boardAnswers.style.display = state ? 'none' : 'block';
    document.getElementById('btnToggleAnswers').innerHTML = state 
        ? `<i class="fas fa-key"></i> Show Answer Key` 
        : `<i class="fas fa-eye-slash"></i> Hide Answer Key`;
});

document.getElementById('btnPrintPaper').addEventListener('click', () => {
    window.print();
});
