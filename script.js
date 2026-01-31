// --- DOM ELEMENTS ---
const generateBtn = document.getElementById("generate-btn");
const paletteContainer = document.querySelector(".palette-container");
const favoritesList = document.getElementById("favorites-list");

// --- STATE ---
// Load favorites from localStorage or start with an empty array
let favorites = JSON.parse(localStorage.getItem("mySavedColors")) || [];

// Initial render of favorites on page load
renderFavorites();

// Generate initial palette on page load
generatePalette();

// --- EVENT LISTENERS ---

// 1. Generate new palette
generateBtn.addEventListener("click", generatePalette);

// 2. Handle clicks inside the main palette (Copy & Save)
paletteContainer.addEventListener("click", (e) => {
    // A. Handle Copy Button
    const copyBtn = e.target.closest(".copy-btn");
    if (copyBtn) {
        const hexElement = copyBtn.closest(".color-info").querySelector(".hex-value");
        copyToClipboard(hexElement.textContent, copyBtn);
        return;
    }

    // B. Handle Save (Heart) Button
    const saveBtn = e.target.closest(".save-btn");
    if (saveBtn) {
        const hexValue = saveBtn.closest(".color-info").querySelector(".hex-value").textContent;
        toggleFavorite(hexValue);
        return;
    }

    // C. Handle clicking the color block itself to copy
    const colorEl = e.target.closest(".color");
    if (colorEl) {
        const hexValue = colorEl.nextElementSibling.querySelector(".hex-value").textContent;
        const icon = colorEl.nextElementSibling.querySelector(".copy-btn");
        copyToClipboard(hexValue, icon);
    }
});

// --- FUNCTIONS ---

function generatePalette() {
    const colors = [];
    for (let i = 0; i < 5; i++) {
        colors.push(generateRandomColor());
    }
    updatePaletteDisplay(colors);
}

function generateRandomColor() {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function updatePaletteDisplay(colors) {
    const colorBoxes = document.querySelectorAll(".container .color-box");

    colorBoxes.forEach((box, index) => {
        const color = colors[index];
        const colorDiv = box.querySelector(".color");
        const hexValue = box.querySelector(".hex-value");
        const heartIcon = box.querySelector(".save-btn");

        colorDiv.style.backgroundColor = color;
        hexValue.textContent = color;

        // Reset heart icon: if color is already in favorites, make it solid
        if (favorites.includes(color)) {
            heartIcon.classList.replace("far", "fas");
        } else {
            heartIcon.classList.replace("fas", "far");
        }
    });
}

function toggleFavorite(hex) {
    if (favorites.includes(hex)) {
        // Remove from favorites
        favorites = favorites.filter(c => c !== hex);
    } else {
        // Add to favorites
        favorites.push(hex);
    }

    // Save to LocalStorage
    localStorage.setItem("mySavedColors", JSON.stringify(favorites));
    
    // Refresh UI
    renderFavorites();
    syncHeartIcons();
}

function renderFavorites() {
    if (!favoritesList) return; // Guard clause if element doesn't exist yet
    
    favoritesList.innerHTML = "";
    
    favorites.forEach(color => {
        const favBox = document.createElement("div");
        favBox.classList.add("color-box");
        favBox.innerHTML = `
            <div class="color" style="background-color: ${color}; height: 100px;"></div>
            <div class="color-info">
                <span class="hex-value">${color}</span>
                <i class="fas fa-trash-alt save-btn" title="Remove" style="color: #F63049"></i>
            </div>
        `;
        
        // Clicking the trash icon removes it
        favBox.querySelector(".save-btn").addEventListener("click", () => toggleFavorite(color));
        
        favoritesList.appendChild(favBox);
    });
}

// Ensures the main palette hearts match the saved state
function syncHeartIcons() {
    const mainHexes = document.querySelectorAll(".container .hex-value");
    mainHexes.forEach(span => {
        const heart = span.nextElementSibling.querySelector(".save-btn");
        if (favorites.includes(span.textContent)) {
            heart.classList.replace("far", "fas");
        } else {
            heart.classList.replace("fas", "far");
        }
    });
}

function copyToClipboard(text, element) {
    navigator.clipboard.writeText(text)
        .then(() => showCopySuccess(element))
        .catch(err => console.error("Could not copy:", err));
}

function showCopySuccess(element) {
    if (!element) return;
    const icon = element.querySelector("i") || element;
    
    const originalClass = icon.className;
    icon.className = "fa-solid fa-check";
    icon.style.color = "#48bb78";

    setTimeout(() => {
        icon.className = originalClass;
        icon.style.color = "";
    }, 1500);
}