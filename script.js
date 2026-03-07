// --- CONFIGURACIÓN BASE ---
const DEFAULT_API_KEY = "plln_sk_aTsFV3jrACFFUvZUHnK5dCwjc90IplP7";
const GENERATE_URL = "https://enter.pollinations.ai/api/generate/image/";
const MODELS_URL = "https://enter.pollinations.ai/api/generate/image/models";
const GENERATE_VIDEO_URL = "https://enter.pollinations.ai/api/generate/video/";

let currentImageUrl = "";
let originalImageUrl = "";
let previousImageUrl = ""; // Guardar la imagen anterior para comparar
let editorModels = []; // Modelos que soportan edición (text + image)

// --- VARIABLES PARA PAN & ZOOM ---
let scale = 1;
let pointX = 0;
let pointY = 0;
let startX = 0;
let startY = 0;
let isDragging = false;

// --- LISTA FALLBACK ---
const FALLBACK_MODELS = [
    { name: "flux", description: "Flux.1 (Schnell)", output_modalities: ["image"], input_modalities: ["text"] },
    { name: "flux-realism", description: "Flux Realism", output_modalities: ["image"], input_modalities: ["text"] },
    { name: "kontext", description: "Kontext (Editor)", output_modalities: ["image"], input_modalities: ["text", "image"] },
    { name: "turbo", description: "Turbo", output_modalities: ["image"], input_modalities: ["text"] },
    { name: "luma", description: "Luma Ray", output_modalities: ["video"], input_modalities: ["text"] }
];

// --- TRADUCCIONES ---
const translations = {
    es: {
        title: "Generador Pollinations (BYOP + Pan/Zoom)",
        titleEditor: "Generador y editor de imágenes",
        tabImages: "Imágenes",
        tabVideos: "Videos",
        apiKeyLabel: "Pollinations API Key",
        getKeyBtn: "🔑 Obtener",
        modelLabel: "Modelo",
        promptLabel: "Prompt",
        dimensionsLabel: "Dimensiones",
        styleLabel: "Estilo",
        generateImageBtn: "Generar Imagen",
        generateVideoBtn: "Generar Video",
        imageGeneratorTitle: "Generador de Imágenes",
        imageEditorTitle: "Generador y editor de imágenes",
        videoGeneratorTitle: "Generador de Videos",
        generatingImage: "¡Generando imagen!",
        generatingEdit: "¡Aplicando cambios!",
        generatingVideo: "¡Generando video!",
        downloadBtn: "Descargar imagen",
        openBtn: "Abrir imagen",
        scaleLabel: "Escala (Zoom)",
        durationLabel: "Duración",
        apiKeyNote: "Usa la API Key configurada en la pestaña Imágenes.",
        selectStyle: "Selecciona",
        defaultPrompt: "Cinco lindas brujas caminando por París",
        editPlaceholder: "Ej: Cambia las brujas por gatos con sombreros...",
        applyEditBtn: "Aplicar cambios",
        resetBtn: "Reiniciar",
        vidPromptSource: "Prompt de texto",
        vidOriginalSource: "Usar imagen original",
        vidImageSource: "Usar imagen editada",
        noImageAlert: "No hay una imagen disponible para usar. Genera o edita una imagen primero.",
        originalImageLabel: "🖼️ Imagen Original",
        editedImageLabel: "✨ Imagen Editada",
        originalShort: "Original",
        editedShort: "Editada",
        openBtnShort: "Abrir",
        downloadBtnShort: "Descargar",
        apiKeySuccess: "¡API Key obtenida con éxito!",
        styles: {
            0: "Fotográfico", 1: "3D", 2: "Acuarela", 3: "Arte callejero", 4: "Arte digital",
            5: "Art Nouveau", 6: "Arte Pop", 7: "Barroco", 8: "Blanco y negro", 9: "Botero",
            10: "Cartoon", 11: "Comic", 12: "Cubismo", 13: "Dibujo a lápiz", 14: "Disney",
            15: "Expresionismo", 16: "Fantasía", 17: "Fauvismo", 19: "Futurista",
            20: "Hiperrealista", 21: "Ilustración", 22: "Impresionismo", 23: "Isométrico",
            24: "Japonés (Ukiyo-e)", 25: "Japanese Woodblock", 26: "Manga", 27: "Minimalismo",
            28: "Neón", 29: "Óleo", 30: "Origami", 31: "Pintura abstracta", 32: "Pixar",
            33: "Pixelado", 34: "Plastilina", 35: "Realista", 36: "Renacimiento",
            37: "Surrealismo", 38: "Textura", 39: "Van Gogh", 40: "Vintage", 41: "Graffiti",
            42: "Vitral", 43: "Mosaico", 44: "Art Deco", 45: "Steampunk", 46: "Cyberpunk",
            47: "Vaporwave", 48: "Low Poly", 49: "Boceto", 50: "Carboncillo"
        }
    },
    en: {
        title: "Pollinations Generator (BYOP + Pan/Zoom)",
        titleEditor: "Image Generator and Editor",
        tabImages: "Images",
        tabVideos: "Videos",
        apiKeyLabel: "Pollinations API Key",
        getKeyBtn: "🔑 Get Key",
        modelLabel: "Model",
        promptLabel: "Prompt",
        dimensionsLabel: "Dimensions",
        styleLabel: "Style",
        generateImageBtn: "Generate Image",
        generateVideoBtn: "Generate Video",
        imageGeneratorTitle: "Image Generator",
        imageEditorTitle: "Image Generator and Editor",
        videoGeneratorTitle: "Video Generator",
        generatingImage: "Generating image!",
        generatingEdit: "Applying changes!",
        generatingVideo: "Generating video!",
        downloadBtn: "Download image",
        openBtn: "Open image",
        scaleLabel: "Scale (Zoom)",
        durationLabel: "Duration",
        apiKeyNote: "Use the API Key configured in the Images tab.",
        selectStyle: "Select",
        defaultPrompt: "Five beautiful witches walking through Paris",
        editPlaceholder: "Ex: Change the witches for cats with hats...",
        applyEditBtn: "Apply changes",
        resetBtn: "Restart",
        vidPromptSource: "Text Prompt",
        vidOriginalSource: "Use original image",
        vidImageSource: "Use edited image",
        noImageAlert: "No image available. Please generate or edit an image first.",
        originalImageLabel: "🖼️ Original Image",
        editedImageLabel: "✨ Edited Image",
        originalShort: "Original",
        editedShort: "Edited",
        openBtnShort: "Open",
        downloadBtnShort: "Download",
        apiKeySuccess: "API Key obtained successfully!",
        styles: {
            0: "Photographic", 1: "3D", 2: "Watercolor", 3: "Street Art", 4: "Digital Art",
            5: "Art Nouveau", 6: "Pop Art", 7: "Baroque", 8: "Black and White", 9: "Botero",
            10: "Cartoon", 11: "Comic", 12: "Cubism", 13: "Pencil Sketch", 14: "Disney",
            15: "Expressionism", 16: "Fantasy", 17: "Fauvism", 19: "Futuristic",
            20: "Hyper-Realistic", 21: "Illustration", 22: "Impressionism", 23: "Isometric",
            24: "Japanese (Ukiyo-e)", 25: "Japanese Woodblock", 26: "Manga", 27: "Minimalism",
            28: "Neon", 29: "Oil Painting", 30: "Origami", 31: "Abstract Painting", 32: "Pixar",
            33: "Pixel Art", 34: "Claymation", 35: "Realism", 36: "Renaissance",
            37: "Surrealism", 38: "Texture", 39: "Van Gogh", 40: "Vintage", 41: "Graffiti",
            42: "Stained Glass", 43: "Mosaic", 44: "Art Deco", 45: "Steampunk", 46: "Cyberpunk",
            47: "Vaporwave", 48: "Low Poly", 49: "Sketch", 50: "Charcoal"
        }
    },
    fr: {
        title: "Générateur Pollinations (BYOP + Pan/Zoom)",
        titleEditor: "Générateur et éditeur d'images",
        tabImages: "Images",
        tabVideos: "Vidéos",
        apiKeyLabel: "Clé API Pollinations",
        getKeyBtn: "🔑 Obtenir",
        modelLabel: "Modèle",
        promptLabel: "Prompt",
        dimensionsLabel: "Dimensions",
        styleLabel: "Style",
        generateImageBtn: "Générer une image",
        generateVideoBtn: "Générer une vidéo",
        imageGeneratorTitle: "Générateur d'images",
        imageEditorTitle: "Générateur et éditeur d'images",
        videoGeneratorTitle: "Générateur de vidéos",
        generatingImage: "Génération de l'image!",
        generatingEdit: "Application des changements!",
        generatingVideo: "Génération de la vidéo!",
        downloadBtn: "Télécharger l'image",
        openBtn: "Ouvrir l'image",
        scaleLabel: "Échelle (Zoom)",
        durationLabel: "Durée",
        apiKeyNote: "Utilisez la clé API configurée dans l'onglet Images.",
        selectStyle: "Sélectionner",
        defaultPrompt: "Cinve belles sorcières marchant dans Paris",
        editPlaceholder: "Ex: Changez les sorcières pour des chats avec des chapeaux...",
        applyEditBtn: "Appliquer les changements",
        resetBtn: "Réinitialiser",
        vidPromptSource: "Prompt de texte",
        vidOriginalSource: "Utiliser l'image originale",
        vidImageSource: "Utiliser l'image modifiée",
        noImageAlert: "Aucune image disponible. Veuillez d'abord générer ou modifier une image.",
        originalImageLabel: "🖼️ Image Originale",
        editedImageLabel: "✨ Image Modifiée",
        originalShort: "Originale",
        editedShort: "Modifiée",
        openBtnShort: "Ouvrir",
        downloadBtnShort: "Télécharger",
        apiKeySuccess: "Clé API obtenue avec succès !",
        styles: {
            0: "Photographique", 1: "3D", 2: "Aquarelle", 3: "Art de rue", 4: "Art numérique",
            5: "Art Nouveau", 6: "Pop Art", 7: "Baroque", 8: "Noir et blanc", 9: "Botero",
            10: "Dessin animé", 11: "Bande dessinée", 12: "Cubisme", 13: "Croquis au crayon", 14: "Disney",
            15: "Expressionnisme", 16: "Fantaisie", 17: "Fauvisme", 19: "Futuriste",
            20: "Hyper-réaliste", 21: "Illustration", 22: "Impressionnisme", 23: "Isométrique",
            24: "Japonais (Ukiyo-e)", 25: "Gravure japonaise", 26: "Manga", 27: "Minimalisme",
            28: "Néon", 29: "Peinture à l'huile", 30: "Origami", 31: "Peinture abstraite", 32: "Pixar",
            33: "Pixel Art", 34: "Pâte à modeler", 35: "Réalisme", 36: "Renaissance",
            37: "Surréalisme", 38: "Texture", 39: "Van Gogh", 40: "Vintage", 41: "Graffiti",
            42: "Vitrail", 43: "Mosaïque", 44: "Art Déco", 45: "Steampunk", 46: "Cyberpunk",
            47: "Vaporwave", 48: "Low Poly", 49: "Esquisse", 50: "Fusain"
        }
    }
};

let currentLang = 'es';

// ==========================================
// CAMBIO DE IDIOMA
// ==========================================

function changeLanguage(lang) {
    currentLang = lang;
    const t = translations[lang];

    // Si el modelo actual es editor, usar el título de editor
    const imgModel = document.getElementById('img_model').value;
    const isEditor = editorModels.includes(imgModel);

    document.title = isEditor ? t.titleEditor : t.title;
    document.querySelector('.tab-btn:nth-child(1)').textContent = t.tabImages;
    document.querySelector('.tab-btn:nth-child(2)').textContent = t.tabVideos;

    document.querySelector('label[for="apiKeyInput"]').textContent = t.apiKeyLabel;
    document.getElementById('getApiKeyBtn').innerHTML = t.getKeyBtn;

    document.querySelectorAll('label').forEach(label => {
        const text = label.textContent.trim();
        if (text === 'Modelo' || text === 'Model' || text === 'Modèle') label.textContent = t.modelLabel;
        if (text === 'Prompt') label.textContent = t.promptLabel;
        if (text === 'Dimensiones' || text === 'Dimensions') label.textContent = t.dimensionsLabel;
        if (text === 'Estilo' || text === 'Style') label.textContent = t.styleLabel;
        if (text === 'Duración' || text === 'Duration' || text === 'Durée') label.textContent = t.durationLabel;
        if (text.includes('Escala') || text.includes('Scale') || text.includes('Échelle')) label.textContent = t.scaleLabel;
    });

    document.querySelector('button[onclick="generateImage()"]').textContent = t.generateImageBtn;
    document.querySelector('button[onclick="generateVideo()"]').textContent = t.generateVideoBtn;

    document.getElementById('img_title').textContent = isEditor ? t.imageEditorTitle : t.imageGeneratorTitle;
    document.querySelector('#tab-video .preview h2').textContent = t.videoGeneratorTitle;

    document.getElementById('img_loading').textContent = t.generatingImage;
    document.getElementById('vid_loading').textContent = t.generatingVideo;

    document.getElementById('btn-download').textContent = t.downloadBtn;
    document.getElementById('btn-open').textContent = t.openBtn;

    const editSection = document.getElementById('edit-section');
    if (editSection) {
        editSection.querySelector('label').innerHTML = `✍️ ${t.applyEditBtn}:`;
        document.getElementById('edit_prompt').placeholder = t.editPlaceholder;
        editSection.querySelector('button[onclick="applyEdit()"]').textContent = t.applyEditBtn;
        document.getElementById('btn-reset').textContent = t.resetBtn;
    }

    const compButtons = document.getElementById('comparison-buttons');
    if (compButtons) {
        compButtons.querySelector('.lbl-original').textContent = `🖼️ ${t.originalShort}`;
        compButtons.querySelector('.lbl-edited').textContent = `✨ ${t.editedShort}`;
        compButtons.querySelectorAll('button').forEach(btn => {
            const btnText = btn.textContent.trim();
            if (btnText === 'Abrir' || btnText === 'Open' || btnText === 'Ouvrir') btn.textContent = t.openBtnShort;
            if (btnText === 'Descargar' || btnText === 'Download' || btnText === 'Télécharger') btn.textContent = t.downloadBtnShort;
        });
    }

    const apiNote = document.querySelector('#tab-video .controls > div:first-child');
    if (apiNote) apiNote.innerHTML = `<i class="fas fa-info-circle"></i> ${t.apiKeyNote}`;

    const lblPromptSrc = document.getElementById('lbl_vid_prompt_src');
    if (lblPromptSrc) lblPromptSrc.textContent = t.vidPromptSource;
    const lblOrigSrc = document.getElementById('lbl_vid_orig_src');
    if (lblOrigSrc) lblOrigSrc.textContent = t.vidOriginalSource;
    const lblImgSrc = document.getElementById('lbl_vid_img_src');
    if (lblImgSrc) lblImgSrc.textContent = t.vidImageSource;

    const appFooter = document.getElementById('app-footer');
    if (appFooter) {
        const footerText = lang === 'es'
            ? `Diseñado por <strong>Juan Guillermo Rivera Berrío</strong> con las API de Pollinations, tecnología Gemini 1.5 Flash y asistencia de Antigravity`
            : lang === 'fr'
                ? `Conçu par <strong>Juan Guillermo Rivera Berrío</strong> avec les API Pollinations, la technologie Gemini 1.5 Flash et l'assistance d'Antigravity`
                : `Designed by <strong>Juan Guillermo Rivera Berrío</strong> with Pollinations APIs, Gemini 1.5 Flash technology, and Antigravity assistance`;
        appFooter.innerHTML = footerText;
    }

    updateStyleOptions('img_style', t);
    updateStyleOptions('vid_style', t);

    localStorage.setItem('preferred_language', lang);
}

function updateStyleOptions(selectId, t) {
    const select = document.getElementById(selectId);
    if (!select) return;
    const currentValue = select.value;

    const selectOption = select.querySelector('option[value="selecciona"]');
    if (selectOption) selectOption.textContent = t.selectStyle;

    Object.keys(t.styles).forEach(key => {
        const option = select.querySelector(`option[value="${key}"]`);
        if (option) option.textContent = t.styles[key];
    });

    select.value = currentValue;
}

// ==========================================
// 1. IMPLEMENTACIÓN BYOP (Auth Flow)
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('preferred_language') || 'es';
    document.getElementById('languageSelect').value = savedLang;

    const savedKey = localStorage.getItem('pollinations_api_key');
    if (savedKey) document.getElementById('apiKeyInput').value = savedKey;

    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const apiKey = hashParams.get('api_key');
    if (apiKey) {
        document.getElementById('apiKeyInput').value = apiKey;
        localStorage.setItem('pollinations_api_key', apiKey);
        window.history.replaceState(null, null, window.location.pathname + window.location.search);

        // Mostrar notificación de éxito
        const t = translations[savedLang];
        setTimeout(() => showToast(t.apiKeySuccess), 500);
    }

    fetchAndPopulateModels().then(() => {
        changeLanguage(savedLang);
    });

    document.getElementById('img_model').addEventListener('change', () => {
        const t = translations[currentLang];
        const val = document.getElementById('img_model').value;
        const isEditor = isModelEditor(val);
        document.title = isEditor ? t.titleEditor : t.title;
        document.getElementById('img_title').textContent = isEditor ? t.imageEditorTitle : t.imageGeneratorTitle;
    });

    initSlider();
});

// Función auxiliar para identificar modelos de edición
function isModelEditor(modelName) {
    const knownEditors = ['nanobanana', 'kontext', 'seedream-pro', 'gptimage', 'nanobanana-pro', 'gptimage-large', 'klein-large', 'zimage'];
    return editorModels.includes(modelName) || knownEditors.includes(modelName);
}

function initSlider() {
    const slider = document.getElementById('comparison-slider');
    const container = document.getElementById('imageComparisonContainer');
    const wrapper = document.getElementById('new-image-wrapper');
    const newImg = document.getElementById('new-comparison-image');

    if (!slider) return;

    let isResizing = false;

    const onMove = (e) => {
        if (!isResizing) return;
        let x = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        let rect = container.getBoundingClientRect();
        let position = ((x - rect.left) / rect.width) * 100;

        if (position >= 0 && position <= 100) {
            slider.style.left = position + "%";
            wrapper.style.width = position + "%";
        }
    };

    slider.addEventListener('mousedown', () => isResizing = true);
    window.addEventListener('mouseup', () => isResizing = false);
    window.addEventListener('mousemove', onMove);

    slider.addEventListener('touchstart', () => isResizing = true);
    window.addEventListener('touchend', () => isResizing = false);
    window.addEventListener('touchmove', onMove);

    // Ajustar tamaño del slider cuando cambie el contenedor
    const observer = new ResizeObserver(() => {
        newImg.style.width = container.offsetWidth + "px";
    });
    observer.observe(container);
}

function startAuthFlow() {
    const redirectUrl = window.location.href.split('#')[0];
    window.location.href = `https://enter.pollinations.ai/authorize?redirect_url=${encodeURIComponent(redirectUrl)}`;
}

function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.style.display = 'block';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3500);
}

function saveKeyLocally() {
    const key = document.getElementById('apiKeyInput').value;
    localStorage.setItem('pollinations_api_key', key);
}

function getApiKey() {
    const inputKey = document.getElementById('apiKeyInput').value;
    return inputKey.trim() !== "" ? inputKey : DEFAULT_API_KEY;
}

// ==========================================
// 2. LOGICA DE MODELOS
// ==========================================

async function fetchAndPopulateModels() {
    populateSelects(FALLBACK_MODELS);
    try {
        const response = await fetch(MODELS_URL);
        if (!response.ok) throw new Error("Error HTTP " + response.status);
        const models = await response.json();
        populateSelects(models);
    } catch (error) {
        console.warn("Usando modelos locales por error de conexión:", error);
    }
}

function populateSelects(models) {
    const imgSelect = document.getElementById('img_model');
    const vidSelect = document.getElementById('vid_model');
    const currentImg = imgSelect.value;
    const currentVid = vidSelect.value;

    imgSelect.innerHTML = "";
    vidSelect.innerHTML = "";
    editorModels = [];

    models.forEach(model => {
        const option = document.createElement('option');
        option.value = model.name;
        option.textContent = model.description || model.name;

        if (model.output_modalities.includes("image")) {
            imgSelect.appendChild(option.cloneNode(true));
            // Identificar modelos editores (text + image)
            if (model.input_modalities && model.input_modalities.includes("text") && model.input_modalities.includes("image")) {
                editorModels.push(model.name);
            }
        }
        if (model.output_modalities.includes("video")) vidSelect.appendChild(option.cloneNode(true));
    });

    if (currentImg && imgSelect.querySelector(`option[value="${currentImg}"]`)) imgSelect.value = currentImg;
    else if (imgSelect.options.length > 0) imgSelect.selectedIndex = 0;

    if (currentVid && vidSelect.querySelector(`option[value="${currentVid}"]`)) vidSelect.value = currentVid;
}

// ==========================================
// 3. PAN & ZOOM LOGIC
// ==========================================

function updateScale(newScale) {
    scale = parseFloat(newScale);
    applyTransform();
}

function startDrag(e) {
    e.preventDefault();
    isDragging = true;
    startX = e.clientX - pointX;
    startY = e.clientY - pointY;
    document.getElementById('img-container').style.cursor = "grabbing";
}

function drag(e) {
    if (!isDragging) return;
    e.preventDefault();
    pointX = e.clientX - startX;
    pointY = e.clientY - startY;
    applyTransform();
}

function endDrag() {
    isDragging = false;
    document.getElementById('img-container').style.cursor = "grab";
}

function applyTransform() {
    const img = document.getElementById('img-preview');
    img.style.transform = `translate(${pointX}px, ${pointY}px) scale(${scale})`;
}

function resetView() {
    scale = 1; pointX = 0; pointY = 0;
    document.getElementById('scale-slider').value = 1;
    applyTransform();
    // Resetear slider
    document.getElementById('comparison-slider').style.left = "50%";
    document.getElementById('new-image-wrapper').style.width = "50%";
}

// ==========================================
// 4. GENERACIÓN Y CARGA ROBUSTA
// ==========================================

// Función para intentar cargar una imagen con/sin CORS
function tryLoadImage(imageUrl, useCors = false) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        if (useCors) img.crossOrigin = "Anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = imageUrl;
    });
}

// Función para usar proxy si falla la carga directa
function getProxiedUrl(url) {
    return `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
}

async function loadImageWithFallback(url, onSuccess, onError) {
    try {
        // 1. Intento directo
        await tryLoadImage(url, false);
        onSuccess(url);
    } catch (e) {
        try {
            // 2. Intento con CORS
            await tryLoadImage(url, true);
            onSuccess(url);
        } catch (corsE) {
            try {
                // 3. Intento con Proxy
                const proxied = getProxiedUrl(url);
                await tryLoadImage(proxied, false);
                onSuccess(proxied);
            } catch (proxyE) {
                onError();
            }
        }
    }
}

function generateImage() {
    const promptValue = document.getElementById('img_prompt').value.trim();
    if (!promptValue) return alert(translations[currentLang].promptRequiredAlert || "Prompt required");

    const style = getStyleName(document.getElementById('img_style').value);
    const model = document.getElementById('img_model').value;
    const key = getApiKey();

    // ESTRATEGIA MODELO.HTML: Prompt limpio + Key + Modelo
    const fullPrompt = `${promptValue}, ${style}`;
    const url = `${GENERATE_URL}${encodeURIComponent(fullPrompt)}?key=${key}&model=${model}`;

    document.getElementById('img_loading').style.display = 'block';
    document.getElementById('img_loading').textContent = translations[currentLang].generatingImage;
    document.getElementById('img-container').style.display = 'none';
    document.getElementById('imageComparisonContainer').style.display = 'none';
    document.getElementById('zoom-area').style.display = 'none';
    document.getElementById('edit-section').style.display = 'none';
    document.getElementById('img-buttons').style.display = 'none';
    document.getElementById('comparison-buttons').style.display = 'none';

    // Asegurar que los controles estén habilitados
    toggleConfigControls(true);
    resetView();

    loadImageWithFallback(url, (finalUrl) => {
        document.getElementById('img_loading').style.display = 'none';
        document.getElementById('img-container').style.display = 'flex';
        const img = document.getElementById('img-preview');
        img.style.display = 'block';
        img.src = finalUrl;

        document.getElementById('zoom-area').style.display = 'flex';
        document.getElementById('img-buttons').style.display = 'flex';
        document.getElementById('comparison-buttons').style.display = 'none';

        currentImageUrl = url; // SIEMPRE guardar la URL LIMPIA para la API
        originalImageUrl = url;
        previousImageUrl = url;

        if (isModelEditor(model)) {
            document.getElementById('edit-section').style.display = 'block';
        }
    }, () => {
        document.getElementById('img_loading').style.display = 'none';
        alert(currentLang === 'es' ? "Error cargando la imagen." : "Error loading image.");
    });
}

function applyEdit() {
    const changes = document.getElementById('edit_prompt').value.trim();
    if (!changes) return alert(currentLang === 'es' ? "Describe los cambios" : "Describe the changes");

    const model = document.getElementById('img_model').value;
    const key = getApiKey();
    const t = translations[currentLang];

    // ESTRATEGIA MODELO.HTML: Changes + Key + Model + image(currentImageUrl)
    const editUrl = `${GENERATE_URL}${encodeURIComponent(changes)}?key=${key}&model=${model}&image=${encodeURIComponent(currentImageUrl)}`;

    document.getElementById('img_loading').style.display = 'block';
    document.getElementById('img_loading').textContent = t.generatingEdit;

    // Inhabilitar controles de configuración durante la edición
    toggleConfigControls(false);

    loadImageWithFallback(editUrl, (finalUrl) => {
        document.getElementById('img_loading').style.display = 'none';
        document.getElementById('img-container').style.display = 'none';
        document.getElementById('zoom-area').style.display = 'none';

        const originalImg = document.getElementById('original-comparison-image');
        const editedImg = document.getElementById('new-comparison-image');

        // El original es lo que el usuario estaba viendo justo antes
        originalImg.src = document.getElementById('img-preview').src;
        editedImg.src = finalUrl;

        document.getElementById('imageComparisonContainer').style.display = 'block';
        document.getElementById('img-buttons').style.display = 'none';
        document.getElementById('comparison-buttons').style.display = 'flex';

        previousImageUrl = currentImageUrl; // La anterior a este edit
        currentImageUrl = editUrl; // La nueva URL LIMPIA de la API

        // Actualizamos img-preview para que la siguiente comparación sea correcta
        document.getElementById('img-preview').src = finalUrl;
    }, () => {
        document.getElementById('img_loading').style.display = 'none';
        alert(currentLang === 'es' ? "La edición falló. Prueba con otro cambio." : "Edit failed. Try another change.");
    });
}

function generateVideo() {
    const prompt = document.getElementById('vid_prompt').value;
    const style = getStyleName(document.getElementById('vid_style').value);
    const dims = getVideoDims(document.getElementById('vid_ratio').value);
    const time = getDuration(document.getElementById('vid_time').value);
    const model = document.getElementById('vid_model').value;
    const key = getApiKey();
    const seed = Math.floor(Math.random() * 9999);

    const source = document.querySelector('input[name="vid_source"]:checked').value;
    // ESTRATEGIA: Usar GENERATE_VIDEO_URL para videos
    let url = `${GENERATE_VIDEO_URL}${encodeURIComponent(prompt)},${style} style?key=${key}&duration=${time}&model=${model}&seed=${seed}`;

    if (source === 'image' && currentImageUrl) {
        url += `&image=${encodeURIComponent(currentImageUrl)}`;
    } else if (source === 'original' && originalImageUrl) {
        url += `&image=${encodeURIComponent(originalImageUrl)}`;
    }

    document.getElementById('vid_loading').style.display = 'block';
    const iframe = document.getElementById('vid-iframe');
    iframe.style.display = 'none';
    iframe.src = url;
    iframe.style.display = 'block';
    setTimeout(() => { document.getElementById('vid_loading').style.display = 'none'; }, 2000);
}

function toggleVideoPrompt(show) {
    const promptArea = document.getElementById('vid_prompt');
    const lbl = document.getElementById('lbl_vid_prompt');

    if (show) {
        promptArea.disabled = false;
        promptArea.style.opacity = "1";
    } else {
        const source = document.querySelector('input[name="vid_source"]:checked').value;
        const imgToUse = (source === 'image') ? currentImageUrl : originalImageUrl;

        if (!imgToUse) {
            alert(translations[currentLang].noImageAlert || "No image available.");
            document.querySelector('input[name="vid_source"][value="prompt"]').checked = true;
            return;
        }
    }
}

async function downloadImage(type = 'current') {
    let urlToDownload = currentImageUrl;
    if (type === 'original') urlToDownload = previousImageUrl;

    if (!urlToDownload) return;

    const btn = document.getElementById('btn-download');
    const originalText = btn.textContent;
    btn.textContent = translations[currentLang].downloadingStatus || "Descargando...";
    btn.disabled = true;

    try {
        let response;
        try {
            response = await fetch(urlToDownload);
        } catch (e) {
            response = await fetch(getProxiedUrl(urlToDownload));
        }

        if (!response.ok) throw new Error("Error en red");

        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `pollinations_${Date.now()}.jpg`;
        document.body.appendChild(a);
        a.click();

        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);

    } catch (error) {
        console.error("Error descargando:", error);
        window.open(urlToDownload, '_blank');
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

function openImage(type = 'current') {
    let urlToOpen = currentImageUrl;
    if (type === 'original') urlToOpen = previousImageUrl;
    if (urlToOpen) window.open(urlToOpen, '_blank');
}

// ==========================================
// 5. UTILIDADES UI (Tabs, Mappers, etc)
// ==========================================

function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.content').forEach(c => c.classList.add('hidden'));
    if (tab === 'image') {
        document.getElementById('tab-image').classList.remove('hidden');
        document.querySelectorAll('.tab-btn')[0].classList.add('active');
        updateBoxSize();
    } else {
        document.getElementById('tab-video').classList.remove('hidden');
        document.querySelectorAll('.tab-btn')[1].classList.add('active');
    }
}

function clearPrompt(id) { document.getElementById(id).value = ""; }

function updateBoxSize() {
    const val = parseInt(document.getElementById('img_ratio').value);
    const box = document.getElementById('img-container');
    const compBox = document.getElementById('imageComparisonContainer');
    let w = 400, h = 400;

    switch (val) {
        case 1: w = 300; h = 400; break;
        case 2: w = 533; h = 400; break;
        case 3: w = 640; h = 360; break;
        case 4: w = 225; h = 400; break;
        case 5: w = 600; h = 400; break;
        case 6: w = 267; h = 400; break;
    }
    box.style.width = w + "px";
    box.style.height = h + "px";
    compBox.style.width = w + "px";
    compBox.style.height = h + "px";
    resetView();
}

// --- MAPPERS ---
function getStyleName(val) {
    const styles = {
        0: "photography", 1: "3D", 2: "watercolor", 3: "street-art", 4: "Digital Art",
        5: "Art-Nouveau", 6: "pop-art", 7: "Baroque", 8: "black and white painting",
        9: "botero", 10: "cartoon", 11: "comic", 12: "Cubism", 13: "pencil-sketch",
        14: "Disney", 15: "Expressionism", 16: "fantasy-art", 17: "Fauvism",
        19: "Futurista", 20: "Hyper-Realistic", 21: "illustration", 22: "Impressionism",
        23: "isometric", 24: "Ukiyo-e", 25: "Japanese Woodblock", 26: "Manga",
        27: "Minimalism", 28: "neon", 29: "oil-painting", 30: "origami",
        31: "abstract painting", 32: "pixar", 33: "pixel-art", 34: "Claymation",
        35: "realism", 36: "Renaissance", 37: "Surrealism", 38: "texture",
        39: "van-gogh", 40: "vintage", 41: "graffiti", 42: "stained-glass",
        43: "mosaic", 44: "art-deco", 45: "steampunk", 46: "cyberpunk",
        47: "vaporwave", 48: "low-poly", 49: "sketch", 50: "charcoal"
    };
    return styles[val] || "photography";
}

function getImageDims(val) {
    const dims = {
        0: "width=1024&height=1024", 1: "width=768&height=1024", 2: "width=1024&height=768",
        3: "width=2048&height=1152", 4: "width=1152&height=2048", 5: "width=2048&height=1365",
        6: "width=1365&height=2048"
    };
    return dims[val] || "width=1024&height=1024";
}

function getVideoDims(val) {
    return getImageDims(val);
}

function getDuration(val) {
    return [2, 4, 6, 8, 10][val] || 2;
}

function resetToGeneration() {
    toggleConfigControls(true);
    document.getElementById('edit-section').style.display = 'none';
    document.getElementById('imageComparisonContainer').style.display = 'none';
    document.getElementById('img-container').style.display = 'flex';
    document.getElementById('img-buttons').style.display = 'flex';
    document.getElementById('comparison-buttons').style.display = 'none';
    document.getElementById('zoom-area').style.display = 'flex';

    // Volvieron a la imagen original
    const img = document.getElementById('img-preview');
    img.src = originalImageUrl;
    currentImageUrl = originalImageUrl;
    resetView();
}

function toggleConfigControls(enabled) {
    const container = document.getElementById('gen-controls-group');
    if (!container) return;
    const inputs = container.querySelectorAll('select, textarea, button');
    inputs.forEach(input => {
        input.disabled = !enabled;
        input.style.opacity = enabled ? "1" : "0.6";
        input.style.pointerEvents = enabled ? "auto" : "none";
    });
}
