// =====================================================
// BB84 Simulator - Main Script
// Controls the BB84 pipeline and user interface
// (protocol logic lives in alice.js / bob.js — unchanged)
// =====================================================


// -----------------------------------------------------
// Small delay for visual process updates
// -----------------------------------------------------

function delay(milliseconds) {
    return new Promise(resolve => {
        setTimeout(resolve, milliseconds);
    });
}


// -----------------------------------------------------
// Rendering helpers
// -----------------------------------------------------

const PROCESS_STEPS = [
    "stepGeneration",
    "stepEncoding",
    "stepMeasurement",
    "stepSifting",
    "stepVerification"
];

// Polarisation angle (degrees) of a photon for each basis / bit
// Z basis: 0 -> horizontal, 1 -> vertical
// X basis: 0 -> +45°,       1 -> -45°
function polarisationAngle(basis, bit) {
    if (basis === "Z") {
        return bit === 0 ? 0 : 90;
    }
    return bit === 0 ? -45 : 45;
}

function makeChip(text, classes, index) {
    const chip = document.createElement("span");
    chip.className = "chip " + classes;
    chip.style.setProperty("--i", index);
    chip.textContent = text;
    return chip;
}

function makePhotonChip(photon, index) {
    const chip = document.createElement("span");
    // colour by basis: violet = Z, peach = X
    chip.className = "chip photon b" + photon.basis;
    chip.style.setProperty("--i", index);
    chip.title = `bit ${photon.bit}, basis ${photon.basis}`;

    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "-16 -16 32 32");
    svg.setAttribute("aria-hidden", "true");

    const line = document.createElementNS(svgNS, "line");
    line.setAttribute("x1", "-12");
    line.setAttribute("y1", "0");
    line.setAttribute("x2", "12");
    line.setAttribute("y2", "0");
    line.setAttribute(
        "transform",
        `rotate(${polarisationAngle(photon.basis, photon.bit)})`
    );
    svg.appendChild(line);

    const label = document.createElement("small");
    label.textContent = `${photon.bit}·${photon.basis}`;

    chip.appendChild(svg);
    chip.appendChild(label);

    return chip;
}

// Replace the content of a container with freshly built chips
function renderInto(id, nodes, emptyText) {
    const container = document.getElementById(id);

    if (!container) {
        return;
    }

    container.replaceChildren();

    if (nodes.length === 0) {
        container.textContent = emptyText || "—";
        return;
    }

    nodes.forEach(function (node) {
        container.appendChild(node);
    });
}

function resetText(id, text) {
    const element = document.getElementById(id);

    if (element) {
        element.replaceChildren();
        element.textContent = text;
    }
}

function setValue(id, text) {
    const element = document.getElementById(id);

    element.textContent = text;

    // re-trigger the entrance animation
    element.classList.remove("pop");
    void element.offsetWidth;
    element.classList.add("pop");
}

function setPlaceholder(id, text) {
    const element = document.getElementById(id);

    element.replaceChildren();

    const span = document.createElement("span");
    span.className = "placeholder";
    span.textContent = text;
    element.appendChild(span);
}


// -----------------------------------------------------
// System / verification state
// -----------------------------------------------------

function setSystemState(state, label) {
    const status = document.getElementById("systemStatus");

    status.classList.remove("is-processing", "is-complete");

    if (state) {
        status.classList.add(state);
    }

    document.getElementById("statusText").textContent = label;
}

function setVerificationState(state, title, message) {
    const box = document.getElementById("verificationStatus");

    box.classList.remove("is-idle", "is-processing", "is-ok", "is-warn");
    box.classList.add(state);

    document.getElementById("verificationTitle").textContent = title;
    document.getElementById("verificationMessage").textContent = message;
}


// -----------------------------------------------------
// Update a process step
// -----------------------------------------------------

function updateProgress() {

    const grid = document.getElementById("processGrid");

    if (!grid) {
        return;
    }

    let done = 0;

    PROCESS_STEPS.forEach(function (stepId) {
        const step = document.getElementById(stepId);

        if (step && step.classList.contains("completed")) {
            done++;
        }
    });

    grid.style.setProperty("--p", done / PROCESS_STEPS.length);
}

function setStepState(stepId, state) {

    const step = document.getElementById(stepId);

    if (!step) {
        return;
    }

    step.classList.remove("active", "completed");

    if (state === "active") {
        step.classList.add("active");
    }

    if (state === "completed") {
        step.classList.add("completed");
    }

    updateProgress();
}


// -----------------------------------------------------
// Reset all process steps
// -----------------------------------------------------

function resetProcessSteps() {

    PROCESS_STEPS.forEach(function (stepId) {
        setStepState(stepId, "reset");
    });
}


// -----------------------------------------------------
// Generate a complete BB84 secure key
// -----------------------------------------------------

async function generateSecureKey() {

    const button = document.getElementById("generateKeyButton");

    const buttonLabel = button.querySelector(".btn-label");


    // Disable button while simulation is running
    button.disabled = true;
    buttonLabel.textContent = "Processing transmission…";


    // Reset process tracker
    resetProcessSteps();


    // Reset verification display
    resetText("siftedKey", "—");
    resetText("matchingBits", "—");
    resetText("matchRate", "—");

    resetText("bobBases", "—");
    resetText("bobKey", "—");
    resetText("matchingPositions", "—");


    setSystemState("is-processing", "TRANSMISSION PROCESSING");

    setVerificationState(
        "is-processing",
        "Processing Transmission",
        "Generating and reconciling quantum states..."
    );


    console.log("Starting new BB84 transmission...");


    // =================================================
    // STEP 1 — STATE GENERATION
    // =================================================

    setStepState("stepGeneration", "active");

    await delay(450);


    const currentBits =
        generateRandomBits(NUM_BITS);


    const currentAliceBases =
        generateRandomBases(NUM_BITS);


    renderInto(
        "bits",
        currentBits.map(function (bit, i) {
            return makeChip(bit, "b" + bit, i);
        })
    );


    renderInto(
        "bases",
        currentAliceBases.map(function (basis, i) {
            return makeChip(basis, "b" + basis, i);
        })
    );


    setStepState("stepGeneration", "completed");


    // =================================================
    // STEP 2 — QUANTUM ENCODING
    // =================================================

    setStepState("stepEncoding", "active");

    await delay(450);


    const currentPhotons =
        encodePhoton(
            currentBits,
            currentAliceBases
        );


    renderInto(
        "photons",
        currentPhotons.map(function (photon, i) {
            return makePhotonChip(photon, i);
        })
    );


    setStepState("stepEncoding", "completed");


    // =================================================
    // STEP 3 — MEASUREMENT
    // =================================================

    setStepState("stepMeasurement", "active");

    await delay(450);


    const currentBobBases =
        generateRandomBases(NUM_BITS);


    const currentBobKey = [];


    for (
        let i = 0;
        i < currentPhotons.length;
        i++
    ) {

        const measuredBit =
            measurePhoton(
                currentPhotons[i],
                currentBobBases[i]
            );


        currentBobKey.push(measuredBit);

    }


    // Bob's bases — positions where they agree with Alice are highlighted
    renderInto(
        "bobBases",
        currentBobBases.map(function (basis, i) {
            const matches = basis === currentAliceBases[i];
            return makeChip(
                basis,
                "b" + basis + (matches ? " match" : ""),
                i
            );
        })
    );


    renderInto(
        "bobKey",
        currentBobKey.map(function (bit, i) {
            const matches = currentBobBases[i] === currentAliceBases[i];
            return makeChip(
                bit,
                "b" + bit + (matches ? " match" : ""),
                i
            );
        })
    );


    setStepState("stepMeasurement", "completed");


    // =================================================
    // STEP 4 — KEY SIFTING
    // =================================================

    setStepState("stepSifting", "active");

    await delay(450);


    const currentSiftedAliceKey =
        siftKey(
            currentBits,
            currentAliceBases,
            currentBobBases
        );


    const currentSiftedBobKey = [];

    const matchingPositions = [];


    for (
        let i = 0;
        i < currentBobKey.length;
        i++
    ) {

        if (
            currentAliceBases[i] ===
            currentBobBases[i]
        ) {

            currentSiftedBobKey.push(
                currentBobKey[i]
            );

            matchingPositions.push(i + 1);

        }

    }


    renderInto(
        "siftedKey",
        currentSiftedAliceKey.map(function (bit, i) {
            return makeChip(bit, "b" + bit, i);
        }),
        "No matching bases"
    );


    renderInto(
        "matchingPositions",
        matchingPositions.map(function (position, i) {
            return makeChip(position, "pos", i);
        }),
        "None"
    );


    setStepState("stepSifting", "completed");


    // =================================================
    // STEP 5 — KEY VERIFICATION
    // =================================================

    setStepState("stepVerification", "active");

    await delay(450);


    let matchingBits = 0;


    for (
        let i = 0;
        i < currentSiftedAliceKey.length;
        i++
    ) {

        if (
            currentSiftedAliceKey[i] ===
            currentSiftedBobKey[i]
        ) {

            matchingBits++;

        }

    }


    let matchRate = 0;


    if (currentSiftedAliceKey.length > 0) {

        matchRate =
            (
                matchingBits /
                currentSiftedAliceKey.length
            ) * 100;

    }


    setValue(
        "matchingBits",
        `${matchingBits} / ${currentSiftedAliceKey.length}`
    );


    setValue(
        "matchRate",
        `${matchRate.toFixed(0)}%`
    );


    // Run Riya's comparison function
    compareKeys(
        currentSiftedAliceKey,
        currentSiftedBobKey
    );


    setStepState("stepVerification", "completed");


    // =================================================
    // FINAL STATUS
    // =================================================

    setSystemState("is-complete", "TRANSMISSION COMPLETE");


    if (currentSiftedAliceKey.length === 0) {

        // Edge case: no bases matched, so there is no key to verify
        setVerificationState(
            "is-warn",
            "NO KEY ESTABLISHED",
            "No basis positions matched — run the transmission again."
        );

    } else if (matchingBits === currentSiftedAliceKey.length) {

        setVerificationState(
            "is-ok",
            "KEY VERIFIED",
            `${matchingBits} of ${currentSiftedAliceKey.length} ` +
            `sifted bits matched successfully.`
        );

    } else {

        setVerificationState(
            "is-warn",
            "KEY MISMATCH",
            `${matchingBits} of ${currentSiftedAliceKey.length} ` +
            `sifted bits matched — the key should not be trusted.`
        );

    }


    // Re-enable button
    button.disabled = false;

    buttonLabel.textContent =
        "Generate secure key";


    // Console information
    console.log("Alice's bits:", currentBits);

    console.log(
        "Alice's bases:",
        currentAliceBases
    );

    console.log(
        "Encoded photons:",
        currentPhotons
    );

    console.log(
        "Bob's bases:",
        currentBobBases
    );

    console.log(
        "Bob's measured key:",
        currentBobKey
    );

    console.log(
        "Sifted Alice key:",
        currentSiftedAliceKey
    );

    console.log(
        "Sifted Bob key:",
        currentSiftedBobKey
    );

    console.log(
        "Matching bits:",
        matchingBits
    );

    console.log(
        "Match rate:",
        matchRate.toFixed(0) + "%"
    );

}


// -----------------------------------------------------
// Generate Secure Key button
// -----------------------------------------------------

document
    .getElementById("generateKeyButton")
    .addEventListener(
        "click",
        generateSecureKey
    );


// -----------------------------------------------------
// Initial state
// -----------------------------------------------------

document.querySelectorAll("[data-num-bits]").forEach(function (el) {
    el.textContent = NUM_BITS;
});

console.log("BB84 Simulator loaded!");
