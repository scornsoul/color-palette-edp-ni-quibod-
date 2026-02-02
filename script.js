// --- 1. STATE ---
let state = {
    currentPalette: [], 
    savedColors: JSON.parse(localStorage.getItem("userSavedColors")) || [] 
};

// --- 2. DOM ELEMENTS ---
const mainPalette = document.getElementById("main-palette");
const savedList = document.getElementById("saved-colors-list");
const generateBtn = document.getElementById("generate-btn");
const template = document.getElementById("color-box-template");
const toast = document.getElementById("toast");

// --- 3. SMART ALGORITHM ---
// Uses the HSL color model formula for harmonious shifts:
// k = (n + h / 30) % 12, Color = L - a * max(min(k - 3, 9 - k, 1), -1)
function getSmartPalette() {
    const baseHue = Math.floor(Math.random() * 360);
    return [0, 20, 40, 60, 80].map(offset => hslToHex((baseHue + offset) % 360, 70, 50));
}

// --- 4. RENDERER (NO HTML STRINGS) ---
function render() {
    // Clear containers using standard DOM method
    mainPalette.innerHTML = '';
    savedList.innerHTML = '';

    // Render Main Palette
    state.currentPalette.forEach(color => {
        const clone = createColorBoxElement(color, state.savedColors.includes(color), false);
        mainPalette.appendChild(clone);
    });

    // Render Saved Colors
    state.savedColors.forEach(color => {
        const clone = createColorBoxElement(color, true, true);
        savedList.appendChild(clone);
    });

    if (state.savedColors.length === 0) {
        const emptyMsg = document.createElement('p');
        emptyMsg.textContent = "No colors saved yet.";
        emptyMsg.style.cssText = "grid-column: 1/-1; text-align: center; opacity: 0.4;";
        savedList.appendChild(emptyMsg);
    }
}

/**
 * Creates a DOM node based on the HTML template
 * @param {string} color - Hex code
 * @param {boolean} isSaved - Heart state
 * @param {boolean} isDelete - Replace heart with trash icon
 */
function createColorBoxElement(color, isSaved, isDelete) {
    const clone = document.importNode(template.content, true);
    
    // Set Visuals
    const colorDiv = clone.querySelector(".color");
    colorDiv.style.backgroundColor = color;
    
    const hexSpan = clone.querySelector(".hex-value");
    hexSpan.textContent = color;

    const saveBtn = clone.querySelector(".save-btn");
    if (isDelete) {
        saveBtn.classList.replace("fa-heart", "fa-trash-alt");
        saveBtn.classList.add("fas");
        saveBtn.dataset.action = "delete";
    } else {
        saveBtn.classList.add(isSaved ? "fas" : "far");
        if (isSaved) saveBtn.classList.add("active");
    }

    return clone;
}

// --- 5. HANDLERS ---
function handleInteraction(e) {
    const box = e.target.closest(".color-box");
    if (!box) return;

    const hex = box.querySelector(".hex-value").textContent;

    if (e.target.classList.contains("save-btn") || e.target.dataset.action === "delete") {
        const index = state.savedColors.indexOf(hex);
        index > -1 ? state.savedColors.splice(index, 1) : state.savedColors.unshift(hex);
        localStorage.setItem("userSavedColors", JSON.stringify(state.savedColors));
        render();
    } else if (e.target.classList.contains("copy-btn") || e.target.classList.contains("color")) {
        copyHex(hex, box.querySelector(".copy-btn"));
    }
}

function copyHex(text, icon) {
    navigator.clipboard.writeText(text).then(() => {
        if (icon) {
            const old = icon.className;
            icon.className = "fas fa-check action-btn";
            setTimeout(() => icon.className = old, 1000);
        }
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 2000);
    });
}

// --- 6. UTILS ---
function hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

function init() {
    state.currentPalette = getSmartPalette(); // Refresh fix
    
    generateBtn.addEventListener("click", () => {
        state.currentPalette = getSmartPalette();
        render();
    });

    mainPalette.addEventListener("click", handleInteraction);
    savedList.addEventListener("click", handleInteraction);

    render();
}

init();