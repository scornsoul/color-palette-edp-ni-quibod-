// --- DOM ELEMENTS ---
const generateBtn = document.getElementById("generate-btn");
// Target ONLY the main palette container to avoid selecting favorites
const mainPalette = document.querySelector(".container > .palette-container");
const favoritesList = document.getElementById("favorites-list");
const modeButtons = document.querySelectorAll(".mode-btn");

// --- STATE ---
let favorites = JSON.parse(localStorage.getItem("mySavedColors")) || [];
let currentMode = "random";

// --- INITIALIZE ---
renderFavorites();
generatePalette();

// --- EVENT HANDLERS ---

// 1. Mode Selection
modeButtons.forEach(btn => {
    btn.addEventListener("click", (e) => {
        modeButtons.forEach(b => b.classList.remove("active"));
        e.target.classList.add("active");
        currentMode = e.target.dataset.mode;
        generatePalette();
    });
});

// 2. Generate Button
generateBtn.addEventListener("click", generatePalette);

// 3. Event Delegation: Main Palette (Copy & Save)
mainPalette.addEventListener("click", (e) => {
    const box = e.target.closest(".color-box");
    if (!box) return;

    const hexValue = box.querySelector(".hex-value").textContent;

    if (e.target.closest(".copy-btn") || e.target.closest(".color")) {
        const icon = box.querySelector(".copy-btn");
        copyToClipboard(hexValue, icon);
    } else if (e.target.closest(".save-btn")) {
        toggleFavorite(hexValue);
    }
});

// 4. Event Delegation: Favorites List (Delete)
favoritesList.addEventListener("click", (e) => {
    const trashBtn = e.target.closest(".save-btn");
    if (trashBtn) {
        const hexValue = trashBtn.closest(".color-info").querySelector(".hex-value").textContent;
        toggleFavorite(hexValue);
    }
});

// --- CORE LOGIC ---

function generatePalette() {
    let colors = [];
    
    // Smart Generation Logic
    if (currentMode === "random") {
        for (let i = 0; i < 5; i++) colors.push(generateRandomColor());
    } else {
        // Harmony functions return an array of 5 colors
        if (currentMode === "complementary") colors = generateComplementary();
        else if (currentMode === "analogous") colors = generateAnalogous();
        else if (currentMode === "triadic") colors = generateTriadic();
        else if (currentMode === "warm") colors = generateWarm();
        else if (currentMode === "cool") colors = generateCool();
    }

    // Requirement Check: Ensure No Duplicates in the generation
    const uniqueBatch = [...new Set(colors)];
    while(uniqueBatch.length < 5) {
        uniqueBatch.push(generateRandomColor());
    }
    
    updatePaletteDisplay(uniqueBatch);
}

function updatePaletteDisplay(colors) {
    // ONLY select boxes inside the main palette
    const colorBoxes = mainPalette.querySelectorAll(".color-box");
    
    colorBoxes.forEach((box, index) => {
        const color = colors[index];
        const heartIcon = box.querySelector(".save-btn");
        
        box.querySelector(".color").style.backgroundColor = color;
        box.querySelector(".hex-value").textContent = color;

        // Sync heart icon state
        const isFavorite = favorites.includes(color);
        heartIcon.classList.toggle("fas", isFavorite);
        heartIcon.classList.toggle("far", !isFavorite);
    });
}

function toggleFavorite(hex) {
    const index = favorites.indexOf(hex);
    if (index > -1) {
        favorites.splice(index, 1); // Remove if exists
    } else {
        favorites.push(hex); // Add if new
    }

    localStorage.setItem("mySavedColors", JSON.stringify(favorites));
    renderFavorites();
    
    // Sync the hearts in the main generator
    const mainHexes = mainPalette.querySelectorAll(".hex-value");
    mainHexes.forEach(span => {
        if (span.textContent === hex) {
            const heart = span.parentElement.querySelector(".save-btn");
            heart.classList.toggle("fas", favorites.includes(hex));
            heart.classList.toggle("far", !favorites.includes(hex));
        }
    });
}


//bawal yata ni kay string html sya gois!!!!!!!!!!!!!
function renderFavorites() {
    // Store data as array, render as needed (Requirement met)
    favoritesList.innerHTML = favorites.map(color => `
        <div class="color-box">
            <div class="color" style="background-color: ${color}; height: 100px;"></div>
            <div class="color-info">
                <span class="hex-value">${color}</span>
                <i class="fas fa-trash-alt save-btn" title="Remove" style="color: #F63049"></i>
            </div>
        </div>
    `).join('');
}

// --- COLOR MATH HELPERS ---

function generateRandomColor() {
    return "#" + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0').toUpperCase();
}

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

function getRandomSL() {
    return { s: Math.floor(Math.random() * 30) + 60, l: Math.floor(Math.random() * 20) + 40 };
}

function generateComplementary() {
    const h = Math.random() * 360;
    const { s, l } = getRandomSL();
    return [
        hslToHex(h, s, l),
        hslToHex(h, s, l - 10),
        hslToHex((h + 180) % 360, s, l),
        hslToHex((h + 180) % 360, s, l - 10),
        hslToHex((h + 180) % 360, s, l + 10)
    ];
}

function generateAnalogous() {
    const h = Math.random() * 360;
    const { s, l } = getRandomSL();
    return [0, 30, 60, 90, 120].map(step => hslToHex((h + step) % 360, s, l));
}

function generateTriadic() {
    const h = Math.random() * 360;
    const { s, l } = getRandomSL();
    return [
        hslToHex(h, s, l),
        hslToHex((h + 120) % 360, s, l),
        hslToHex((h + 240) % 360, s, l),
        hslToHex(h, s, l - 20),
        hslToHex((h + 120) % 360, s, l - 20)
    ];
}

function generateWarm() {
    const { s, l } = getRandomSL();
    return Array.from({length: 5}, () => hslToHex(Math.random() * 50, s, l));
}

function generateCool() {
    const { s, l } = getRandomSL();
    return Array.from({length: 5}, () => hslToHex(180 + Math.random() * 100, s, l));
}

// keep lang nako ni na method for compare and contrast sa new clipboard method
// function copyToClipboard(text, element) {
//     navigator.clipboard.writeText(text).then(() => {
//         const originalClass = element.className;
//         element.className = "fa-solid fa-check";
//         element.style.color = "#48bb78";
//         setTimeout(() => {
//             element.className = originalClass;
//             element.style.color = "";
//         }, 1500);
//     });
// }   

// mao ni new clipboard method with toast notification
function copyToClipboard(text, element) {
    navigator.clipboard.writeText(text).then(() => {
        // 1. Icon Feedback (The Checkmark)
        const originalClass = element.className;
        element.className = "fas fa-check"; 
        element.style.color = "#48bb78";

        // 2. Toast Feedback (The Popup)
        const toast = document.getElementById("copy-toast");
        toast.classList.add("show");

        // 3. Reset everything after 1.5 seconds
        setTimeout(() => {
            element.className = originalClass;
            element.style.color = "";
            toast.classList.remove("show");
        }, 1500);
    });
}