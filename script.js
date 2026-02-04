// --- DOM ELEMENTS ---
const generateBtn = document.getElementById("generate-btn");
const savePaletteBtn = document.getElementById("save-palette-btn");
// Target ONLY the main palette container to avoid selecting favorites
const mainPalette = document.querySelector(".container > .palette-container");
const favoritesList = document.getElementById("favorites-list");
const savedPalettesList = document.getElementById("saved-palettes-list");
const modeButtons = document.querySelectorAll(".mode-btn");

// --- STATE ---
let favorites = JSON.parse(localStorage.getItem("mySavedColors")) || [];
let savedPalettes = JSON.parse(localStorage.getItem("mySavedPalettes")) || [];
let currentMode = "random";

// --- INITIALIZE ---
renderFavorites();
renderSavedPalettes();
generatePalette();

// --- EVENT HANDLERS ---

// 1. Mode Selection
modeButtons.forEach(btn => {
    btn.addEventListener("click", (e) => {
        modeButtons.forEach(b => b.classList.remove("active"));
        e.target.classList.add("active");
        currentMode = e.target.dataset.mode;
    });
});

// 2. Generate Button
generateBtn.addEventListener("click", generatePalette);

// 2b. Save Palette Button
savePaletteBtn.addEventListener("click", savePalette);

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

// 5. Event Delegation: Saved Palettes (Copy & Delete)
savedPalettesList.addEventListener("click", (e) => {
    // Rename palette
    const renameBtn = e.target.closest(".rename-palette-btn");
    if (renameBtn) {
        const paletteItem = renameBtn.closest(".saved-palette-item");
        const paletteIndex = parseInt(paletteItem.dataset.index);
        renameSavedPalette(paletteIndex);
        return;
    }

    // Delete palette
    const deleteBtn = e.target.closest(".delete-palette-btn");
    if (deleteBtn) {
        const paletteItem = deleteBtn.closest(".saved-palette-item");
        const paletteIndex = parseInt(paletteItem.dataset.index);
        deleteSavedPalette(paletteIndex);
        return;
    }

    // Copy color from saved palette
    const box = e.target.closest(".color-box");
    if (box && e.target.closest(".saved-palette-item")) {
        const hexValue = box.querySelector(".hex-value").textContent;
        if (e.target.closest(".copy-btn") || e.target.closest(".color")) {
            const icon = box.querySelector(".copy-btn");
            copyToClipboard(hexValue, icon);
        }
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


function renderFavorites() {
    // 1. Clear the list cleanly
    favoritesList.innerHTML = ""; 

    favorites.forEach(color => {
        // Create main container
        const box = document.createElement("div");
        box.className = "color-box";
        // Inline style for width is handled by CSS (flex: 0 0 105px)

        // Create color display
        const colorDiv = document.createElement("div");
        colorDiv.className = "color";
        colorDiv.style.backgroundColor = color;
        colorDiv.style.height = "100px"; // Keeps visual consistency with your CSS

        // Create info section
        const infoDiv = document.createElement("div");
        infoDiv.className = "color-info";

        // Hex text
        const hexSpan = document.createElement("span");
        hexSpan.className = "hex-value";
        hexSpan.textContent = color;

        // Trash Icon
        const trashIcon = document.createElement("i");
        trashIcon.className = "fas fa-trash-alt save-btn";
        trashIcon.title = "Remove";
        trashIcon.style.color = "#F63049";

        // Assemble the pieces
        infoDiv.appendChild(hexSpan);
        infoDiv.appendChild(trashIcon);
        
        box.appendChild(colorDiv);
        box.appendChild(infoDiv);

        // Add to DOM
        favoritesList.appendChild(box);
    });
}

function savePalette() {
    // Get current palette colors from the main palette
    const colorBoxes = mainPalette.querySelectorAll(".color-box");
    const currentPalette = Array.from(colorBoxes).map(box => 
        box.querySelector(".hex-value").textContent
    );

    // Prompt for palette name
    const paletteName = prompt("Enter a name for this palette:", `Palette ${savedPalettes.length + 1}`);
    
    // If user cancels, don't save
    if (paletteName === null) return;
    
    // Use default name if empty
    const finalName = paletteName.trim() || `Palette ${savedPalettes.length + 1}`;

    // Add to saved palettes with name
    savedPalettes.push({
        name: finalName,
        colors: currentPalette
    });
    localStorage.setItem("mySavedPalettes", JSON.stringify(savedPalettes));
    renderSavedPalettes();

    // Show toast notification
    const toast = document.getElementById("copy-toast");
    const originalText = toast.textContent;
    toast.textContent = "Palette saved!";
    toast.classList.add("show");
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => {
            toast.textContent = originalText;
        }, 400);
    }, 1500);
}

function renderSavedPalettes() {
    // 1. Clear the list
    savedPalettesList.innerHTML = "";

    savedPalettes.forEach((paletteObj, index) => {
        const palette = paletteObj.colors || paletteObj;
        const paletteName = paletteObj.name || `Palette ${index + 1}`;

        // --- Container ---
        const item = document.createElement("div");
        item.className = "saved-palette-item";
        item.dataset.index = index;

        // --- Header Section ---
        const header = document.createElement("div");
        header.className = "palette-header";

        const h3 = document.createElement("h3");
        h3.className = "palette-name";
        h3.textContent = paletteName;

        const actions = document.createElement("div");
        actions.className = "palette-actions";

        // Rename Button
        const renameBtn = document.createElement("button");
        renameBtn.className = "rename-palette-btn";
        renameBtn.title = "Rename Palette";
        const renameIcon = document.createElement("i");
        renameIcon.className = "fas fa-edit";
        renameBtn.appendChild(renameIcon);

        // Delete Button
        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-palette-btn";
        deleteBtn.title = "Delete Palette";
        const deleteIcon = document.createElement("i");
        deleteIcon.className = "fas fa-trash";
        deleteBtn.appendChild(deleteIcon);

        actions.appendChild(renameBtn);
        actions.appendChild(deleteBtn);
        
        header.appendChild(h3);
        header.appendChild(actions);

        // --- Colors Grid Section ---
        const colorsGrid = document.createElement("div");
        colorsGrid.className = "palette-colors";

        palette.forEach(color => {
            const box = document.createElement("div");
            box.className = "color-box";

            const colorDiv = document.createElement("div");
            colorDiv.className = "color";
            colorDiv.style.backgroundColor = color;
            colorDiv.dataset.color = color;

            const infoDiv = document.createElement("div");
            infoDiv.className = "color-info";

            const hexSpan = document.createElement("span");
            hexSpan.className = "hex-value";
            hexSpan.textContent = color;

            const copyIcon = document.createElement("i");
            copyIcon.className = "far fa-copy copy-btn";
            copyIcon.title = "Copy to Clipboard";

            infoDiv.appendChild(hexSpan);
            infoDiv.appendChild(copyIcon);
            
            box.appendChild(colorDiv);
            box.appendChild(infoDiv);
            
            colorsGrid.appendChild(box);
        });

        // --- Final Assembly ---
        item.appendChild(header);
        item.appendChild(colorsGrid);
        
        savedPalettesList.appendChild(item);
    });
}

function deleteSavedPalette(index) {
    savedPalettes.splice(index, 1);
    localStorage.setItem("mySavedPalettes", JSON.stringify(savedPalettes));
    renderSavedPalettes();
}

function renameSavedPalette(index) {
    const currentPalette = savedPalettes[index];
    const currentName = currentPalette.name || `Palette ${index + 1}`;
    
    const newName = prompt("Enter a new name for this palette:", currentName);
    
    // If user cancels, don't rename
    if (newName === null) return;
    
    // Use current name if empty
    const finalName = newName.trim() || currentName;
    
    // Update the palette name
    savedPalettes[index] = {
        name: finalName,
        colors: currentPalette.colors || currentPalette
    };
    
    localStorage.setItem("mySavedPalettes", JSON.stringify(savedPalettes));
    renderSavedPalettes();
}

// --- COLOR MATH HELPERS ---

function generateRandomColor() {
    // 1. Random Hue (0-360): Allows ANY color (red, blue, green, etc.)
    const h = Math.floor(Math.random() * 360);

    // 2. Smart Saturation (60-100%): Ensures colors are VIBRANT, not grey/muddy.
    const s = Math.floor(Math.random() * 40) + 60; 

    // 3. Smart Lightness (40-60%): Ensures colors are readable (not too black, not too white).
    const l = Math.floor(Math.random() * 20) + 40; 

    // 4. Use your existing helper to give back the Hex code
    return hslToHex(h, s, l);
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