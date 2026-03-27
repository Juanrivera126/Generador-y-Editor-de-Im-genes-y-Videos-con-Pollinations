// --- CONFIGURACIÓN BASE ---
const GENERATE_URL = "https://gen.pollinations.ai/image/";
const MODELS_URL = "https://gen.pollinations.ai/image/models";

let currentImageUrl = "";
let originalImageUrl = "";
let previousImageUrl = ""; 
let editorModels = []; 
let isUploading = false;

// --- VARIABLES PARA PAN & ZOOM ---
let scale = 1;
let pointX = 0;
let pointY = 0;
let startX = 0;
let startY = 0;
let isDragging = false;

// --- MODELOS DE VIDEO PREFERIDOS ---
const PREFERRED_VIDEO_MODELS = ['veo', 'seedance', 'seedance-pro', 'wan', 'ltx-2', 'p-video'];

const FALLBACK_MODELS = [
    { name: "flux", description: "Flux.1 (Schnell)", output_modalities: ["image"], input_modalities: ["text"] },
    { name: "kontext", description: "Kontext (Editor)", output_modalities: ["image"], input_modalities: ["text", "image"] },
    { name: "veo", description: "Veo (Video)", output_modalities: ["video"], input_modalities: ["text"] }
];

// --- TRADUCCIONES ---
const translations = {
    es: {
        apiKeyRequired: "Por favor, ingresa tu Pollinations API Key.",
        generatingImage: "¡Generando imagen!",
        generatingEdit: "¡Aplicando cambios!",
        generatingVideo: "¡Generando video!",
        uploading: "🚀 Subiendo a la nube...",
        uploadSuccess: "✅ Imagen cargada y lista",
        uploadError: "❌ Error al subir",
        noImageAlert: "Primero genera o sube una imagen base.",
        apiKeySuccess: "¡API Key obtenida con éxito!",
        downloading: "Descargando..."
    },
    en: {
        apiKeyRequired: "Please enter your Pollinations API Key.",
        generatingImage: "Generating image!",
        generatingEdit: "Applying changes!",
        generatingVideo: "Generating video!",
        uploading: "🚀 Uploading to cloud...",
        uploadSuccess: "✅ Image ready",
        uploadError: "❌ Upload error",
        noImageAlert: "Generate or upload a base image first.",
        apiKeySuccess: "API Key obtained successfully!",
        downloading: "Downloading..."
    }
};

let currentLang = 'es';

// ==========================================
// 1. INICIALIZACIÓN
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('preferred_language') || 'es';
    if(document.getElementById('languageSelect')) document.getElementById('languageSelect').value = savedLang;

    const savedKey = localStorage.getItem('pollinations_api_key');
    if (savedKey && document.getElementById('apiKeyInput')) document.getElementById('apiKeyInput').value = savedKey;

    fetchAndPopulateModels().then(() => {
        changeLanguage(savedLang);
    });

    document.getElementById('img_model').addEventListener('change', (e) => {
        const isEditor = isModelEditor(e.target.value);
        document.getElementById('edit-section').style.display = (isEditor && currentImageUrl) ? 'block' : 'none';
    });

    document.getElementById('img_ratio').addEventListener('change', updateBoxSize);

    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    if(dropZone) {
        dropZone.onclick = () => fileInput.click();
        dropZone.ondragover = (e) => { e.preventDefault(); dropZone.classList.add('dragover'); };
        dropZone.ondragleave = () => dropZone.classList.remove('dragover');
        dropZone.ondrop = (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            if (e.dataTransfer.files[0]) uploadFile(e.dataTransfer.files[0]);
        };
        fileInput.onchange = (e) => { if (e.target.files[0]) uploadFile(e.target.files[0]); };
    }

    initSlider();
});

// ==========================================
// 2. CONTROLES DE ARCHIVO (CARGA / DESCARGA / ABRIR)
// ==========================================

async function uploadFile(file) {
    if (isUploading) return;
    const status = document.getElementById('uploadStatus');
    isUploading = true;
    status.style.display = 'block';
    status.textContent = translations[currentLang].uploading;

    const formData = new FormData();
    formData.append('fileToUpload', file);
    formData.append('reqtype', 'fileupload');
    formData.append('time', '1h'); 

    try {
        const response = await fetch('https://litterbox.catbox.moe/resources/internals/api.php', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const url = (await response.text()).trim();
            currentImageUrl = url;
            originalImageUrl = url;
            
            status.textContent = translations[currentLang].uploadSuccess;
            status.style.color = "#28a745";
            
            document.getElementById('img-preview').src = url;
            document.getElementById('img-preview').style.display = 'block';
            document.getElementById('img-container').style.display = 'flex';
            document.getElementById('zoom-area').style.display = 'flex';
            document.getElementById('img-buttons').style.display = 'flex';

            updateBoxSize();
            const model = document.getElementById('img_model').value;
            if (isModelEditor(model)) document.getElementById('edit-section').style.display = 'block';
            resetView();
        }
    } catch (e) {
        status.textContent = translations[currentLang].uploadError;
    } finally { isUploading = false; }
}

async function downloadImage(type = 'current') {
    let url = (type === 'original') ? previousImageUrl : currentImageUrl;
    if (!url) return;

    const t = translations[currentLang];
    const btn = document.querySelector(type === 'original' ? '#comparison-buttons button:nth-child(3)' : '#btn-download');
    const originalText = btn.textContent;

    try {
        btn.textContent = t.downloading;
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `pollinations_${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
    } catch (e) {
        window.open(url, '_blank');
    } finally {
        btn.textContent = originalText;
    }
}

function openImage(type = 'current') {
    let url = (type === 'original') ? previousImageUrl : currentImageUrl;
    if (url) window.open(url, '_blank');
}

// ==========================================
// 3. LOGICA DE IMAGEN Y DIMENSIONES
// ==========================================

function updateBoxSize() {
    const val = parseInt(document.getElementById('img_ratio').value);
    const box = document.getElementById('img-container');
    const compBox = document.getElementById('imageComparisonContainer');
    const newImg = document.getElementById('new-comparison-image');
    let w = 400, h = 400;

    switch (val) {
        case 1: w = 300; h = 400; break;
        case 2: w = 533; h = 400; break;
        case 3: w = 640; h = 360; break;
        case 4: w = 225; h = 400; break;
        case 5: w = 600; h = 400; break;
        case 6: w = 267; h = 400; break;
    }
    box.style.width = w + "px"; box.style.height = h + "px";
    compBox.style.width = w + "px"; compBox.style.height = h + "px";
    if(newImg) newImg.style.width = w + "px";
    resetView();
}

async function fetchAndPopulateModels() {
    populateSelects(FALLBACK_MODELS);
    try {
        const response = await fetch(MODELS_URL);
        const models = await response.json();
        populateSelects(models);
    } catch (e) {}
}

function populateSelects(models) {
    const imgSelect = document.getElementById('img_model');
    const vidSelect = document.getElementById('vid_model');
    imgSelect.innerHTML = ""; vidSelect.innerHTML = "";
    editorModels = [];

    models.forEach(model => {
        const suffix = model.paid_only ? " (pago)" : "";
        const displayName = (model.description || model.name) + suffix;
        const option = new Option(displayName, model.name);

        if (model.output_modalities.includes("image")) {
            imgSelect.add(option.cloneNode(true));
            if (model.input_modalities && model.input_modalities.includes("image")) editorModels.push(model.name);
        }
        if (model.output_modalities.includes("video")) vidSelect.add(option.cloneNode(true));
    });
}

function generateImage() {
    const prompt = document.getElementById('img_prompt').value.trim();
    const key = getApiKey();
    if (!key) return alert(translations[currentLang].apiKeyRequired);
    const model = document.getElementById('img_model').value;
    const url = `${GENERATE_URL}${encodeURIComponent(prompt)}?key=${key}&model=${model}&${getImageDims(document.getElementById('img_ratio').value)}`;

    document.getElementById('img_loading').style.display = 'block';
    document.getElementById('img-container').style.display = 'none';

    const img = new Image();
    img.onload = () => {
        document.getElementById('img_loading').style.display = 'none';
        document.getElementById('img-container').style.display = 'flex';
        document.getElementById('img-preview').src = url;
        document.getElementById('img-preview').style.display = 'block';
        document.getElementById('zoom-area').style.display = 'flex';
        document.getElementById('img-buttons').style.display = 'flex';
        currentImageUrl = url; originalImageUrl = url;
        updateBoxSize();
        if (isModelEditor(model)) document.getElementById('edit-section').style.display = 'block';
        resetView();
    };
    img.src = url;
}

function applyEdit() {
    const changes = document.getElementById('edit_prompt').value.trim();
    const key = getApiKey();
    const model = document.getElementById('img_model').value;
    const url = `${GENERATE_URL}${encodeURIComponent(changes)}?key=${key}&model=${model}&image=${encodeURIComponent(currentImageUrl)}&${getImageDims(document.getElementById('img_ratio').value)}`;

    document.getElementById('img_loading').style.display = 'block';
    const img = new Image();
    img.onload = () => {
        document.getElementById('img_loading').style.display = 'none';
        document.getElementById('img-container').style.display = 'none';
        document.getElementById('original-comparison-image').src = document.getElementById('img-preview').src;
        document.getElementById('new-comparison-image').src = url;
        document.getElementById('imageComparisonContainer').style.display = 'block';
        document.getElementById('img-buttons').style.display = 'none';
        document.getElementById('comparison-buttons').style.display = 'flex';
        previousImageUrl = currentImageUrl; currentImageUrl = url;
        document.getElementById('img-preview').src = url;
        updateBoxSize();
    };
    img.src = url;
}

// ==========================================
// 4. LOGICA DE VIDEO
// ==========================================

async function generateVideo() {
    const prompt = document.getElementById('vid_prompt').value || "cinematic motion";
    const time = getDuration(document.getElementById('vid_time').value);
    const key = getApiKey();
    if (!key) return alert(translations[currentLang].apiKeyRequired);

    const source = document.querySelector('input[name="vid_source"]:checked').value;
    const vidSelect = document.getElementById('vid_model');
    const selectedModel = vidSelect.value;
    const modelsQueue = [selectedModel, ...PREFERRED_VIDEO_MODELS.filter(m => m !== selectedModel)];

    let imageParam = '';
    if (source === 'image' && currentImageUrl) imageParam = `&image=${encodeURIComponent(currentImageUrl)}`;
    else if (source === 'original' && originalImageUrl) imageParam = `&image=${encodeURIComponent(originalImageUrl)}`;

    document.getElementById('vid_loading').style.display = 'block';
    startVideoProgress(translations[currentLang].generatingVideo);

    for (let model of modelsQueue) {
        const apiUrl = `https://gen.pollinations.ai/video/${encodeURIComponent(prompt)}?duration=${time}&model=${model}&seed=${Math.floor(Math.random()*999)}&nologo=true${imageParam}`;
        try {
            const response = await fetch(apiUrl, { headers: { 'Authorization': `Bearer ${key}` } });
            if (!response.ok) continue;
            const blob = await response.blob();
            const videoEl = document.getElementById('vid-player');
            videoEl.src = URL.createObjectURL(blob);
            videoEl.style.display = 'block';
            videoEl.play();
            stopVideoProgress(true);
            document.getElementById('vid_loading').style.display = 'none';
            return;
        } catch (e) {}
    }
    stopVideoProgress(false);
    document.getElementById('vid_loading').style.display = 'none';
    alert("Error en video.");
}

function toggleVideoPrompt(isPromptOnly) {
    if (!isPromptOnly) {
        const source = document.querySelector('input[name="vid_source"]:checked').value;
        const img = (source === 'image') ? currentImageUrl : originalImageUrl;
        if (!img) {
            alert(translations[currentLang].noImageAlert);
            document.querySelector('input[name="vid_source"][value="prompt"]').checked = true;
            return;
        }
    }
    document.getElementById('vid_prompt').disabled = false;
}

// ==========================================
// 5. UTILIDADES
// ==========================================

function clearPrompt(id) { document.getElementById(id).value = ""; }

let _vidProgressTimer = null;
let _vidProgressValue = 0;

function startVideoProgress(labelText) {
    _vidProgressValue = 0;
    const bar = document.getElementById('vid_progress_bar');
    const wrap = document.getElementById('vid_progress_wrap');
    if(wrap) wrap.style.display = 'block';
    _vidProgressTimer = setInterval(() => {
        if (_vidProgressValue < 90) _vidProgressValue += 1.5;
        if(bar) bar.style.width = _vidProgressValue + '%';
        document.getElementById('vid_progress_pct').textContent = Math.floor(_vidProgressValue) + '%';
    }, 300);
}

function stopVideoProgress(success) {
    clearInterval(_vidProgressTimer);
    if(success) {
        document.getElementById('vid_progress_bar').style.width = '100%';
        document.getElementById('vid_progress_pct').textContent = '100%';
        setTimeout(() => document.getElementById('vid_progress_wrap').style.display = 'none', 1000);
    } else {
        document.getElementById('vid_progress_wrap').style.display = 'none';
    }
}

function updateScale(v) { scale = v; applyTransform(); }
function startDrag(e) { isDragging = true; startX = e.clientX - pointX; startY = e.clientY - pointY; }
function drag(e) { if(isDragging) { pointX = e.clientX - startX; pointY = e.clientY - startY; applyTransform(); } }
function endDrag() { isDragging = false; }
function applyTransform() { 
    const img = document.getElementById('img-preview');
    if(img) img.style.transform = `translate(${pointX}px, ${pointY}px) scale(${scale})`; 
}

function resetView() {
    scale = 1; pointX = 0; pointY = 0;
    if(document.getElementById('scale-slider')) document.getElementById('scale-slider').value = 1;
    applyTransform();
}

function isModelEditor(m) { return editorModels.includes(m); }
function getApiKey() { return document.getElementById('apiKeyInput').value.trim(); }
function getImageDims(v) {
    const dims = { 0: "width=1024&height=1024", 1: "width=768&height=1024", 2: "width=1024&height=768", 3: "width=2048&height=1152", 4: "width=1152&height=2048", 5: "width=2048&height=1365", 6: "width=1365&height=2048" };
    return dims[v] || "width=1024&height=1024";
}
function getDuration(v) { return [2, 4, 6, 8, 10][v] || 2; }

function switchTab(t) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.getAttribute('onclick').includes(t)));
    document.querySelectorAll('.content').forEach(c => c.classList.toggle('hidden', !c.id.includes(t)));
}

function initSlider() {
    const slider = document.getElementById('comparison-slider');
    if (!slider) return;
    let resizing = false;
    slider.onmousedown = () => resizing = true;
    window.onmouseup = () => resizing = false;
    window.onmousemove = (e) => {
        if(!resizing) return;
        const rect = document.getElementById('imageComparisonContainer').getBoundingClientRect();
        let pos = ((e.clientX - rect.left) / rect.width) * 100;
        if(pos >= 0 && pos <= 100) {
            slider.style.left = pos + "%";
            document.getElementById('new-image-wrapper').style.width = pos + "%";
        }
    };
}

function changeLanguage(l) {
    currentLang = l; localStorage.setItem('preferred_language', l);
}

function resetToGeneration() {
    document.getElementById('edit-section').style.display = 'none';
    document.getElementById('imageComparisonContainer').style.display = 'none';
    document.getElementById('img-container').style.display = 'flex';
    document.getElementById('img-preview').src = originalImageUrl;
    currentImageUrl = originalImageUrl;
    updateBoxSize();
}

function startAuthFlow() {
    const redirectUrl = window.location.href.split('#')[0];
    window.location.href = `https://enter.pollinations.ai/authorize?redirect_url=${encodeURIComponent(redirectUrl)}`;
}