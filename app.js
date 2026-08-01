const APP_VERSION = 'v1.0.0';

// ========================================== //
// 1. NAVIGATION ET INTERFACE GLOBALE         //
// ========================================== //

document.addEventListener('DOMContentLoaded', () => {
    const versionEl = document.getElementById('app-version');
    if (versionEl) {
        versionEl.textContent = APP_VERSION;
    }

    // NOUVEAU : Injecte le logo proprement

    /*
    const logoEl = document.getElementById('main-logo');
    if (logoEl) {
        logoEl.src = LOGO_BASE64;
    } */

    updateDropdown();
});

function showTab(tabId) {
    const allTabs = document.querySelectorAll('.tab-section');
    allTabs.forEach(tab => {
        tab.style.display = 'none';
    });
    document.getElementById(tabId).style.display = 'block';
    syncForm3UI();
}

function toggleRemarque(textareaId, checkbox) {
    const textarea = document.getElementById(textareaId);
    if (checkbox.checked) {
        textarea.style.display = 'block';
    } else {
        textarea.style.display = 'none';
        textarea.value = ''; 
    }
}

// ========================================== //
// 2. GESTION DES CAMIONS ET SYNCHRONISATION  //
// ========================================== //

let truckCount = 0;
let isClearingForm = false; 

function addTruck() {
    truckCount++;
    const container = document.getElementById('trucks-container');
    const template = document.getElementById('truck-template');
    const clone = template.content.cloneNode(true);
    
    clone.querySelector('.truck-number-display').textContent = truckCount;
    
    // NOUVEAU : Ajouter les options de remarques existantes au nouveau camion
    const select = clone.querySelector('.truck-remarques-select');
    if (select) {
        for (let code = 65; code < currentRemarkCharCode; code++) {
            const letter = String.fromCharCode(code);
            const opt = document.createElement('option');
            opt.value = letter;
            opt.textContent = letter;
            select.appendChild(opt);
        }
    }
    
    container.appendChild(clone);
}

function toggleSampleFields(checkbox) {
    const card = checkbox.closest('.truck-card');
    const fields = card.querySelector('.truck-sample-fields');
    const truckLineNum = card.querySelector('.truck-number-display').textContent;

    if (checkbox.checked) {
        fields.style.display = 'block';

        manualSampleCount++;
        const container = document.getElementById('samples-container');
        const template = document.getElementById('sample-template');
        const clone = template.content.cloneNode(true);

        clone.querySelector('.sample-number-display').textContent = manualSampleCount;
        clone.querySelector('.sample-truck-linked').textContent = truckLineNum;
        clone.querySelector('.sample-card').dataset.linkedTruck = truckLineNum;

        container.appendChild(clone);
        syncForm3UI(); 
        
    } else {
        fields.style.display = 'none';
        const container = document.getElementById('samples-container');
        const linkedCard = container.querySelector(`.sample-card[data-linked-truck="${truckLineNum}"]`);
        
        if (linkedCard) {
            if (isClearingForm) return; 

            if (confirm(`Voulez-vous supprimer la fiche d'échantillon associée à la Ligne #${truckLineNum} ?`)) {
                linkedCard.remove();
            } else {
                checkbox.checked = true; 
                fields.style.display = 'block';
            }
        }
    }
}

function toggleRefuse(checkbox) {
    const card = checkbox.closest('.truck-card');
    if (checkbox.checked) {
        card.style.borderColor = '#dc2626'; 
        card.style.backgroundColor = '#fef2f2'; 
    } else {
        card.style.borderColor = '#0284c7'; 
        card.style.backgroundColor = '#f8fafc'; 
    }
    calculateTotals();
}

// ========================================== //
// 3. MOTEUR MATHÉMATIQUE ET LIVE SYNC        //
// ========================================== //

document.addEventListener('input', function(e) {
    if (e.target.classList.contains('truck-volume')) {
        calculateTotals();
    }
    
    if (e.target.classList.contains('truck-sample-num') || 
        e.target.classList.contains('truck-sample-time') || 
        e.target.id === 'f2-tech-name' || 
        e.target.id === 'f1-tech-name' || 
        e.target.id === 'global-date') {
        syncForm3UI();
    }
});

function calculateTotals() {
    const volumeInputs = document.querySelectorAll('.truck-volume');
    const refuseCheckboxes = document.querySelectorAll('.truck-refuse');
    
    let totalCoulee = 0;
    let totalRefuse = 0;

    volumeInputs.forEach((input, index) => {
        const vol = parseFloat(input.value) || 0;
        const isRefused = refuseCheckboxes[index].checked;

        if (isRefused) {
            totalRefuse += vol;
        } else {
            totalCoulee += vol;
        }
    });

    const totalVerifie = totalCoulee + totalRefuse;

    document.getElementById('f2-total-coulee').value = totalCoulee.toFixed(1);
    document.getElementById('f2-total-refuse').value = totalRefuse.toFixed(1);
    document.getElementById('f2-total-verifie').value = totalVerifie.toFixed(1);
}

function syncForm3UI() {
    const globalDate = document.getElementById('global-date')?.value || '';
    const globalTech = document.getElementById('f2-tech-name')?.value || document.getElementById('f1-tech-name')?.value || '';
    const techInitials = globalTech.split(' ').filter(n => n).map(n => n[0].toUpperCase()).join('');

    const samples = document.querySelectorAll('.sample-card:not(.temoin-only-card)');
    samples.forEach(card => {
        const linkedTruckNum = card.dataset.linkedTruck;
        if (linkedTruckNum) {
            const truckCards = document.querySelectorAll('.truck-card');
            const truckCard = truckCards[linkedTruckNum - 1]; 
            if (truckCard) {
                const tNum = truckCard.querySelector('.truck-sample-num').value;
                const tTime = truckCard.querySelector('.truck-sample-time').value;

                const displayEl = card.querySelector('.sample-number-display');
                if (displayEl) displayEl.textContent = tNum ? tNum : `(Numéro manquant)`;

                const f3DateHtml = card.querySelector('.sample-prelev-date');
                const f3TechHtml = card.querySelector('.sample-prelev-tech');
                const f3TimeHtml = card.querySelector('.sample-prelev-time');

                if (f3DateHtml && !f3DateHtml.value) f3DateHtml.value = globalDate;
                if (f3TechHtml && !f3TechHtml.value) f3TechHtml.value = techInitials;
                if (f3TimeHtml && !f3TimeHtml.value) f3TimeHtml.value = tTime;
            }
        }
    });
}

// ========================================== //
// 4. SYSTÈME DE REMARQUES INTELLIGENT        //
// ========================================== //

let currentRemarkCharCode = 65; 

function createNewRemark(btn) {
    const detail = prompt("Entrez les détails de la remarque :");
    if (!detail) return; 

    const letter = String.fromCharCode(currentRemarkCharCode);
    currentRemarkCharCode++; 

    const globalRemarks = document.getElementById('f2-remarques-globales');
    globalRemarks.value += (globalRemarks.value ? '\n' : '') + letter + ' - ' + detail;

    const allSelects = document.querySelectorAll('.truck-remarques-select');
    allSelects.forEach(select => {
        const option = document.createElement('option');
        option.value = letter;
        option.textContent = letter; 
        select.appendChild(option);
    });

    const currentSelect = btn.closest('.input-group').querySelector('.truck-remarques-select');
    currentSelect.value = letter;
}

// ========================================== //
// 5. FORMULAIRE 3 : ÉCHANTILLONS & TÉMOINS   //
// ========================================== //

let manualSampleCount = 0;
let temoinOnlyCount = 0;

function toggleTemoinSection(checkbox) {
    const temoinContainer = checkbox.closest('.form-section').querySelector('.temoin-container');
    if (checkbox.checked) {
        temoinContainer.style.display = 'block';
    } else {
        temoinContainer.style.display = 'none';
    }
}

function addManualSample() {
    manualSampleCount++;
    const container = document.getElementById('samples-container');
    const template = document.getElementById('sample-template');
    const clone = template.content.cloneNode(true);
    
    clone.querySelector('.sample-number-display').textContent = "Indépendant M-" + manualSampleCount;
    clone.querySelector('.sample-truck-linked').textContent = "Indépendant";
    
    container.appendChild(clone);
}

function addTemoinOnly() {
    temoinOnlyCount++;
    const container = document.getElementById('samples-container');
    const template = document.getElementById('temoin-only-template');
    const clone = template.content.cloneNode(true);
    
    clone.querySelector('.temoin-number-display').textContent = "T-" + temoinOnlyCount;
    
    container.appendChild(clone);
}

// ========================================== //
// 6. MOTEUR DE SAUVEGARDE (LOCALSTORAGE)     //
// ========================================== //

let currentActiveReportKey = null;

function updateDropdown() {
    const dropdown = document.getElementById('saved-reports-dropdown');
    if (!dropdown) return;
    
    dropdown.innerHTML = '<option value="">-- Sélectionnez un rapport --</option>';
    
    let savedKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('englobe_')) {
            savedKeys.push(key);
        }
    }

    savedKeys.sort().forEach(key => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = key.replace('englobe_', '');
        dropdown.appendChild(option);
    });

    if (currentActiveReportKey) {
        dropdown.value = currentActiveReportKey;
    }
}

function clearForm() {
    isClearingForm = true; 

    const allInputs = document.querySelectorAll('input, select, textarea');
    allInputs.forEach(el => {
        if (el.id === 'saved-reports-dropdown') return; 

        if (el.type === 'checkbox') {
            el.checked = false;
            const event = new Event('change');
            el.dispatchEvent(event);
        } else {
            el.value = '';
        }
    });

    const trucksContainer = document.getElementById('trucks-container');
    const samplesContainer = document.getElementById('samples-container');
    if (trucksContainer) trucksContainer.innerHTML = '';
    if (samplesContainer) samplesContainer.innerHTML = '';
    
    truckCount = 0;
    manualSampleCount = 0;
    temoinOnlyCount = 0;
    currentRemarkCharCode = 65; // Reset des remarques

    calculateTotals();
    isClearingForm = false; 
}

let newArmed = false;
let newTimeout = null;

function newReportPrompt() {
    const newBtn = document.querySelector('button[onclick="newReportPrompt()"]');

    if (!newArmed) {
        newArmed = true;
        if (newBtn) {
            newBtn.textContent = "⚠️ Confirmer ?";
            newBtn.style.background = "#b91c1c";
        }
        newTimeout = setTimeout(() => {
            newArmed = false;
            if (newBtn) {
                newBtn.textContent = "➕ Nouveau";
                newBtn.style.background = "#0284c7";
            }
        }, 4000);
        return; 
    }

    clearTimeout(newTimeout);
    newArmed = false;
    
    if (newBtn) {
        newBtn.textContent = "➕ Nouveau";
        newBtn.style.background = "#0284c7";
    }

    currentActiveReportKey = null; 
    clearForm(); 
    
    const dropdown = document.getElementById('saved-reports-dropdown');
    if (dropdown) dropdown.value = ""; 

    alert("Écran réinitialisé. Vous pouvez commencer un nouveau rapport.");
}

function loadReport() {
    const dropdown = document.getElementById('saved-reports-dropdown');
    if (!dropdown) return;
    const selectedKey = dropdown.value;

    if (!selectedKey) {
        alert("Veuillez d'abord sélectionner un rapport sauvegardé dans la liste déroulante.");
        return;
    }

    const reportDataStr = localStorage.getItem(selectedKey);
    if (!reportDataStr) return;

    clearForm();
    const reportData = JSON.parse(reportDataStr);

    if (reportData.static) {
        for (const [id, value] of Object.entries(reportData.static)) {
            const el = document.getElementById(id);
            if (el) {
                if (el.type === 'checkbox') {
                    el.checked = value;
                    const event = new Event('change');
                    el.dispatchEvent(event);
                } else {
                    el.value = value;
                }
            }
        }
        
        // NOUVEAU : Restaurer l'état du compteur de remarques pour éviter les "Double A"
        const globalRem = reportData.static['f2-remarques-globales'] || '';
        const matches = globalRem.match(/^[A-Z](?=\s*-)/gm);
        if (matches && matches.length > 0) {
            const maxLetter = matches.sort().pop();
            currentRemarkCharCode = maxLetter.charCodeAt(0) + 1; // Passe à la lettre suivante
        }
    }

    if (reportData.trucks && Array.isArray(reportData.trucks)) {
        reportData.trucks.forEach(truckInfo => {
            addTruck(); 
            const cards = document.querySelectorAll('.truck-card');
            const card = cards[cards.length - 1]; 
            
            card.querySelector('.truck-id').value = truckInfo.id || '';
            card.querySelector('.truck-bordereau').value = truckInfo.bordereau || '';
            card.querySelector('.truck-volume').value = truckInfo.volume || '';
            card.querySelector('.truck-time-mix').value = truckInfo.timeMix || '';
            card.querySelector('.truck-time-start').value = truckInfo.timeStart || '';
            card.querySelector('.truck-time-end').value = truckInfo.timeEnd || '';
            card.querySelector('.truck-water').value = truckInfo.water || '';
            card.querySelector('.truck-plast').value = truckInfo.plast || '';
            card.querySelector('.truck-air1').value = truckInfo.air1 || '';
            card.querySelector('.truck-air2').value = truckInfo.air2 || '';
            card.querySelector('.truck-temp').value = truckInfo.temp || '';
            card.querySelector('.truck-slump1').value = truckInfo.slump1 || '';
            card.querySelector('.truck-slump1-sp').checked = !!truckInfo.slump1Sp;
            card.querySelector('.truck-slump2').value = truckInfo.slump2 || '';
            card.querySelector('.truck-slump2-sp').checked = !!truckInfo.slump2Sp;
            
            const refuseBox = card.querySelector('.truck-refuse');
            refuseBox.checked = !!truckInfo.refuse;
            toggleRefuse(refuseBox);

            const sampleBox = card.querySelector('.truck-sample-check');
            sampleBox.checked = !!truckInfo.sampleCheck;
            
            if (sampleBox.checked) {
                card.querySelector('.truck-sample-fields').style.display = 'block';
                if (!reportData.samples || reportData.samples.length === 0) {
                    toggleSampleFields(sampleBox);
                }
            }

            card.querySelector('.truck-sample-num').value = truckInfo.sampleNum || '';
            card.querySelector('.truck-sample-time').value = truckInfo.sampleTime || '';
            card.querySelector('.truck-remarques-select').value = truckInfo.remarqueSelect || '';
        });
        calculateTotals();
    }

    if (reportData.samples && Array.isArray(reportData.samples)) {
        document.getElementById('samples-container').innerHTML = '';
        manualSampleCount = 0;
        temoinOnlyCount = 0;

        reportData.samples.forEach(sampleInfo => {
            if (sampleInfo.isStandaloneTemoin) {
                addTemoinOnly();
            } else {
                addManualSample(); 
            }
            
            const cards = document.querySelectorAll('.sample-card');
            const card = cards[cards.length - 1]; 
            
            if (!sampleInfo.isStandaloneTemoin && sampleInfo.linkedTruck) {
                card.dataset.linkedTruck = sampleInfo.linkedTruck;
                card.querySelector('.sample-truck-linked').textContent = sampleInfo.linkedTruck;
            }
            
            if (sampleInfo['sample-temoin-check']) {
                const cb = card.querySelector('.sample-temoin-check');
                if (cb) {
                    cb.checked = true;
                    toggleTemoinSection(cb);
                }
            }

            card.querySelectorAll('input, textarea, select').forEach(input => {
                const cls = Array.from(input.classList).find(c => c.startsWith('sample-') || c.startsWith('temoin-'));
                if (cls && sampleInfo[cls] !== undefined) {
                    if (input.type === 'checkbox') input.checked = sampleInfo[cls];
                    else input.value = sampleInfo[cls];
                }
            });
        });
    }

    syncForm3UI(); 
    currentActiveReportKey = selectedKey; 
    dropdown.value = selectedKey;
    alert("Rapport chargé avec succès.");
}

function saveReport() {
    const noProjet = document.getElementById('global-no-projet').value.trim() || 'SANS-NUMERO';
    const rawDate = document.getElementById('global-date').value || new Date().toISOString().split('T')[0];
    const resistance = document.getElementById('f2-spec-resistance').value.trim() || 'Mix';
    const techName = document.getElementById('f2-tech-name')?.value || document.getElementById('f1-tech-name')?.value || '';
    const techInitials = techName.split(' ').filter(n => n).map(n => n[0].toUpperCase()).join('') || 'TECH';
    
    // Nouveau format : No-Projet_Date_Resistance_Initiales
    const baseName = `${noProjet}_${rawDate}_${resistance}_${techInitials}`;
    
    if (currentActiveReportKey && !currentActiveReportKey.startsWith(baseName)) {
        currentActiveReportKey = null;
    }

    const staticData = {};
    document.querySelectorAll('input[id], select[id], textarea[id]').forEach(el => {
        if (el.id === 'saved-reports-dropdown') return;
        staticData[el.id] = el.type === 'checkbox' ? el.checked : el.value;
    });

    const trucksData = [];
    document.querySelectorAll('.truck-card').forEach(card => {
        trucksData.push({
            id: card.querySelector('.truck-id').value,
            bordereau: card.querySelector('.truck-bordereau').value,
            volume: card.querySelector('.truck-volume').value,
            timeMix: card.querySelector('.truck-time-mix').value,
            timeStart: card.querySelector('.truck-time-start').value,
            timeEnd: card.querySelector('.truck-time-end').value,
            water: card.querySelector('.truck-water').value,
            plast: card.querySelector('.truck-plast').value,
            air1: card.querySelector('.truck-air1').value,
            air2: card.querySelector('.truck-air2').value,
            temp: card.querySelector('.truck-temp').value,
            slump1: card.querySelector('.truck-slump1').value,
            slump1Sp: card.querySelector('.truck-slump1-sp').checked,
            slump2: card.querySelector('.truck-slump2').value,
            slump2Sp: card.querySelector('.truck-slump2-sp').checked,
            refuse: card.querySelector('.truck-refuse').checked,
            sampleCheck: card.querySelector('.truck-sample-check').checked,
            sampleNum: card.querySelector('.truck-sample-num').value,
            sampleTime: card.querySelector('.truck-sample-time').value,
            remarqueSelect: card.querySelector('.truck-remarques-select').value
        });
    });

    const samplesData = [];
    document.querySelectorAll('.sample-card').forEach(card => {
        const data = { 
            isStandaloneTemoin: card.classList.contains('temoin-only-card'),
            linkedTruck: card.dataset.linkedTruck || null 
        };
        
        card.querySelectorAll('input, textarea, select').forEach(input => {
            const cls = Array.from(input.classList).find(c => c.startsWith('sample-') || c.startsWith('temoin-'));
            if (cls) {
                data[cls] = input.type === 'checkbox' ? input.checked : input.value;
            }
        });
        samplesData.push(data);
    });

    if (!currentActiveReportKey) {
        let maxIndex = 0;
        let latestKey = null;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(baseName)) {
                const parts = key.split('_');
                const idx = parseInt(parts[parts.length - 1]);
                if (!isNaN(idx) && idx > maxIndex) {
                    maxIndex = idx;
                    latestKey = key;
                }
            }
        }
    }

    let saveKey = currentActiveReportKey;
    if (!saveKey) {
        let maxIndex = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(baseName)) {
                const parts = key.split('_');
                const idx = parseInt(parts[parts.length - 1]);
                if (!isNaN(idx) && idx > maxIndex) maxIndex = idx;
            }
        }
        const nextIndex = String(maxIndex + 1).padStart(2, '0');
        saveKey = `${baseName}_${nextIndex}`;
    }

    const reportData = {
        static: staticData,
        trucks: trucksData,
        samples: samplesData,
        timestamp: new Date().getTime()
    };

    localStorage.setItem(saveKey, JSON.stringify(reportData));
    currentActiveReportKey = saveKey; 
    
    alert(`Rapport sauvegardé sous :\n${saveKey.replace('englobe_', '')}`);
    updateDropdown();
    
    const dropdown = document.getElementById('saved-reports-dropdown');
    if (dropdown) dropdown.value = saveKey;
}

let deleteArmed = false;
let deleteTimeout = null;

function deleteReport() {
    const dropdown = document.getElementById('saved-reports-dropdown');
    const targetKey = currentActiveReportKey || (dropdown ? dropdown.value : null);

    if (!targetKey) {
        alert("Veuillez sélectionner un rapport sauvegardé dans la liste pour le supprimer.");
        return;
    }

    const deleteBtn = document.querySelector('button[onclick="deleteReport()"]');

    if (!deleteArmed) {
        deleteArmed = true;
        if (deleteBtn) {
            deleteBtn.textContent = "⚠️ Confirmer ?";
            deleteBtn.style.background = "#b91c1c";
        }
        deleteTimeout = setTimeout(() => {
            deleteArmed = false;
            if (deleteBtn) {
                deleteBtn.textContent = "🗑️ Supprimer";
                deleteBtn.style.background = "#ef4444";
            }
        }, 4000);
        return; 
    }

    clearTimeout(deleteTimeout);
    deleteArmed = false;
    
    if (deleteBtn) {
        deleteBtn.textContent = "🗑️ Supprimer";
        deleteBtn.style.background = "#ef4444";
    }

    localStorage.removeItem(targetKey); 
    alert(`Le rapport ${targetKey.replace('englobe_', '')} a été supprimé avec succès.`);
    
    currentActiveReportKey = null; 
    clearForm(); 
    updateDropdown(); 
}

// === MOTEUR D'EXPORT MULTI-TEMPLATE (OFFLINE BASE64) === //
async function exportToPDF() {
    try {
        const btn = document.querySelector('button[onclick="exportToPDF()"]');
        const originalText = btn ? btn.textContent : "📄 Exporter en PDF";
        if (btn) {
            btn.textContent = "⏳ Génération en cours...";
            btn.disabled = true;
        }

        let compiledRemarks = [];
        for (let i = 1; i <= 8; i++) {
            const check = document.getElementById(`f1-s${i}-remarques-check`);
            const text = document.getElementById(`f1-s${i}-remarques-text`);
            if (check && check.checked && text && text.value.trim() !== "") {
                compiledRemarks.push(`Section ${i} : ${text.value.trim()}`);
            }
        }
        const compilationBox = document.getElementById('f1-s9-remarques-compilation');
        if (compilationBox) {
            compilationBox.value = compiledRemarks.join('; '); /* \n\n */
        }

        const mergedPdf = await PDFLib.PDFDocument.create();
        mergedPdf.registerFontkit(fontkit);
        
        const getBuffer = (base64) => {
            const str = window.atob(base64);
            const bytes = new Uint8Array(str.length);
            for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i);
            return bytes.buffer;
        };

        const fontBytes = new Uint8Array(getBuffer(TAHOMA_FONT));
        const tahomaFont = await mergedPdf.embedFont(fontBytes);

        // Remplacez tout ce qui est entre les guillemets par votre vrai Base64
        /*
        const LOGO_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAACywAAAQhCAYAAAB1dOqIAAAACXBIWXMAAC4jAAAuIwF4pT92AAAgAElEQVR4nOzc4VEcWZaA0XsV+x88gLEA1gJYC8Ra0LQFTVsgZMHSFjSyYJAFCx6ABQMegAVvI7dfzdQIkADVLbIyz4nIQBREd+V9qtKfr2621gIAAAAAAAAAAAAAoMIHUwUAAAAAAAAAAAAAqgiWAQAAAAAAAAAAAIAygmUAAAAAAAAAAAAAoIxgGQAAAAAAAAAAAAAoI1gGAAAAAAAAAAAAAMoIlgEAAAAAAAAAAACAMoJlAAAAAAAAAAAAAKCMYBkAAAAAAAAAAAAAKCNYBgAAAAAAAAAAAADKCJYBAAAAAAAAAAAAgDKCZQAAAAAAAAAAAACgjGAZAAAAAAAAAAAAACgjWAYAAAAAAAAAAAAAygiWAQAAAAAAAAAAAIAygmUAAAAAAAAAAAAAoIxgGQAAAAAAAAAAAAAoI1gGAAAAAAAAAAAAAMoIlgEAAAAAAAAAAACAMoJlAAAAAAAAAAAAAKCMYBkAAAAAAAAAAAAAKCNYBgAAAAAAAAAAAADKCJYBAAAAAAAAAAAAgDKCZQAAAAAAAAAAAACgjGAZAAAAAAAAAAAAACgjWAYAAAAAAAAAAAAAygiWAQAAAAAAAAAAAIAygmUAAAAAAAAAAAAAoIxgGQAAAAAAAAAAAAAoI1gGAAAAAAAAAAAAAMoIlgEAAAAAAAAAAACAMoJlAAAAAAAAAAAAAKCMYBkAAAAAAAAAAAAAKCNYBgAAAAAAAAAAAADKCJYBAAAAAAAAAAAAgDKCZQAAAAAAAAAAAACgjGAZAAAAAAAAAAAAACgjWAYAAAAAAAAAAAAAygiWAQAAAAAAAAAAAIAygmUAAAAAAAAAAAAAoIxgGQAAAAAAAAAAAAAoI1gGAAAAAAAAAAAAAMoIlgEAAAAAAAAAAACAMoJlAAAAAAAAAAAAAKCMYBkAAAAAAAAAAAAAKCNYBgAAAAAAAAAAAADKCJYBAAAAAAAAAAAAgDKCZQAAAAAAAAAAAACgjGAZAAAAAAAAAAAAACgjWAYAAAAAAAAAAAAAygiWAQAAAAAAAAAAAIAygmUAAAAAAAAAAAAAoIxgGQAAAAAAAAAAAAAoI1gGAAAAAAAAAAAAAMoIlgEAAAAAAAAAAACAMoJlAAAAAAAAAAAAAKCMYBkAAAAAAAAAAAAAKCNYBgAAAAAAAAAAAADKCJYBAAAAAAAAAAAAgDKCZQAAAAAAAAAAAACgjGAZAAAAAAAAAAAAACgjWAYAAAAAAAAAAAAAygiWAQAAAAAAAAAAAIAygmUAAAAAAAAAAAAAoIxgGQAAAAAAAAAAAAAoI1gGAAAAAAAAAAAAAMoIlgEAAAAAAAAAAACAMoJlAAAAAAAAAAAAAKCMYBkAAAAAAAAAAAAAKCNYBgAAAAAAAAAAAADKCJYBAAAAAAAAAAAAgDKCZQAAAAAAAAAAAACgjGAZAAAAAAAAAAAAACgjWAYAAAAAAAAAAAAAygiWAQAAAAAAAAAAAIAygmUAAAAAAAAAAAAAoIxgGQAAAAAAAAAAAAAoI1gGAAAAAAAAAAAAAMoIlgEAAAAAAAAAAACAMoJlAAAAAAAAAAAAAKCMYBkAAAAAAAAAAAAAKCNYBgAAAAAAAAAAAADKCJYBAAAAAAAAAAAAgDKCZQAAAAAAAAAAAACgjGAZAAAAAAAAAAAAACgjWAYAAAAAAAAAAAAAygiWAQAAAAAAAAAAAIAygmUAAAAAAAAAAAAAoIxgGQAAAAAAAAAAAAAoI1gGAAAAAAAAAAAAAMoIlgEAAAAAAAAAAACAMoJlAAAAAAAAAAAAAKCMYBkAAAAAAAAAAAAAKCNYBgAAAAAAAAAAAADKCJYBAAAAAAAAAAAAgDKCZQAAAAAAAAAAAACgjGAZAAAAAAAAAAAAACgjWAYAAAAAAAAAAAAAygiWAQAAAAAAAAAAAIAygmUAAAAAAAAAAAAAoIxgGQAAAAAAAAAAAAAoI1gGAAAAAAAAAAAAAMoIlgEAAAAAAAAAAACAMoJlAAAAAAAAAAAAAKCMYBkAAAAAAAAAAAAAKCNYBgAAAAAAAAAAAADKCJYBAAAAAAAAAAAAgDKCZQAAAAAAAAAAAACgjGAZAAAAAAAAAAAAACgjWAYAAAAAAAAAAAAAygiWAQAAAAAAAAAAAIAygmUAAAAAAAAAAAAAoIxgGQAAAAAAAAAAAAAoI1gGAAAAAAAAAAAAAMoIlgEAAAAAAAAAAACAMoJlAAAAAAAAAAAAAKCMYBkAAAAAAAAAAAAAKCNYBgAAAAAAAAAAAADKCJYBAAAAAAAAAAAAgDKCZQAAAAAAAAAAAACgjGAZAAAAAAAAAAAAACgjWAYAAAAAAAAAAAAAygiWAQAAAAAAAAAAAIAygmUAAAAAAAAAAAAAoIxgGQAAAAAAAAAAAAAoI1gGAAAAAAAAAAAAAMoIlgEAAAAAAAAAAACAMoJlAAAAAAAAAAAAAKCMYBkAAAAAAAAAAAAAKCNYBgAAAAAAAAAAAADKCJYBAAAAAAAAAAAAgDKCZQAAAAAAAAAAAACgjGAZAAAAAAAAAAAAACgjWAYAAAAAAAAAAAAAygiWAQAAAAAAAAAAAIAygmUAAAAAAAAAAAAAoIxgGQAAAAAAAAAAAAAoI1gGAAAAAAAAAAAAAMoIlgEAAAAAAAAAAACAMoJlAAAAAAAAAAAAAKCMYBkAAAAAAAAAAAAAKCNYBgAAAAAAAAAAAADKCJYBAAAAAAAAAAAAgDKCZQAAAAAAAAAAAACgjGAZAAAAAAAAAAAAACgjWAYAAAAAAAAAAAAAygiWAQAAAAAAAAAAAIAygmUAAAAAAAAAAAAAoIxgGQAAAAAAAAAAAAAoI1gGAAAAAAAAAAAAAMoIlgEAAAAAAAAAAACAMoJlAAAAAAAAAAAAAKCMYBkAAAAAAAAAAAAAKCNYBgAAAAAAAAAAAADKCJYBAAAAAAAAAAAAgDKCZQAAAAAAAAAAAACgjGAZAAAAAAAAAAAAACgjWAYAAAAAAAAAAAAAygiWAQAAAAAAAAAAAIAygmUAAAAAAAAAAAAAoIxgGQAAAAAAAAAAAAAoI1gGAAAAAAAAAAAAAMoIlgEAAAAAAAAAAACAMoJlAAAAAAAAAAAAAKCMYBkAAAAAAAAAAAAAKCNYBgAAAAAAAAAAAADKCJYBAAAAAAAAAAAAgDKCZQAAAAAAAAAAAACgjGAZAAAAAAAAAAAAACgjWAYAAAAAAAAAAAAAygiWAQAAAAAAAAAAAIAygmUAAAAAAAAAAAAAoIxgGQAAAAAAAAAAAAAoI1gGAAAAAAAAAAAAAMoIlgEAAAAAAAAAAACAMoJlAAAAAAAAAAAAAKCMYBkAAAAAAAAAAAAAKCNYBgAAAAAAAAAAAADKCJYBAAAAAAAAAAAAgDKCZQAAAAAAAAAAAACgjGAZAAAAAAAAAAAAACgjWAYAAAAAAAAAAAAAygiWAQAAAAAAAAAAAIAygmUAAAAAAAAAAAAAoIxgGQAAAAAAAAAAAAAoI1gGAAAAAAAAAAAAAMoIlgEA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IGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAyhmUAAAAAAAAAAAAAIGNYBgAAAAAAAAAAAAAa2x6ZTBnfdJlP9gAAAABJRU5ErkJggg==";
        */

        // ==========================================
        // ETAPE 1 : Formulaire 1
        // ==========================================
        const subDocF1 = await PDFLib.PDFDocument.load(getBuffer(TEMPLATE_F1));
        subDocF1.registerFontkit(fontkit);
        const formF1 = subDocF1.getForm();
        
        formF1.getFields().forEach(field => {
            const name = field.getName();
            const el = document.getElementById(name);
            if (el) {
                try {
                    if (el.type === 'checkbox') {
                        el.checked ? formF1.getCheckBox(name).check() : formF1.getCheckBox(name).uncheck();
                    } else {
                        formF1.getTextField(name).setText(el.value || "");
                    }
                } catch (e) {}
            }
        });

        try {
            const subFont = await subDocF1.embedFont(fontBytes);
            formF1.updateFieldAppearances(subFont);
            if (formF1.acroForm) formF1.acroForm.dict.set(PDFLib.PDFName.of('NeedAppearances'), PDFLib.PDFBool.False);
        } catch (e) {}

        const copiedPagesF1 = await mergedPdf.copyPages(subDocF1, subDocF1.getPageIndices());
        copiedPagesF1.forEach(page => mergedPdf.addPage(page));

        // ==========================================
        // ETAPE 2 : Formulaire 2 (Multi-pages Dynamique)
        // ==========================================
        const allTrucks = Array.from(document.querySelectorAll('.truck-card'));
        const maxTrucksPerPage = 17;
        const nbPagesF2 = Math.max(1, Math.ceil(allTrucks.length / maxTrucksPerPage));
        let volumeCumuleF2 = 0;
        
        // Extraire TOUTES les remarques du dictionnaire global
        const allRemarksText = document.getElementById('f2-remarques-globales').value || "";
        const remarksDict = {};
        const generalText = [];
        
        allRemarksText.split('\n').forEach(line => {
            const match = line.trim().match(/^([A-Z])\s*-\s*(.*)/);
            if (match) {
                remarksDict[match[1]] = line.trim();
            } else if (line.trim() !== "") {
                generalText.push(line.trim());
            }
        });

        for (let p = 0; p < nbPagesF2; p++) {
            const subDocF2 = await PDFLib.PDFDocument.load(getBuffer(TEMPLATE_F2));
            subDocF2.registerFontkit(fontkit);
            const formF2 = subDocF2.getForm();

            // Remplir les données globales pour cette page F2 (Sauf remarques globales qu'on fait à la fin)
            formF2.getFields().forEach(field => {
                const name = field.getName();
                if (name === 'f2-remarques-globales') return; 
                
                const el = document.getElementById(name);
                if (el) {
                    try {
                        if (el.type === 'checkbox') el.checked ? formF2.getCheckBox(name).check() : formF2.getCheckBox(name).uncheck();
                        else formF2.getTextField(name).setText(el.value || "");
                    } catch (e) {}
                }
            });

            try { formF2.getTextField('f2-page-number').setText(`${p + 1} de ${nbPagesF2}`); } catch(e) {}

            const chunk = allTrucks.slice(p * maxTrucksPerPage, (p + 1) * maxTrucksPerPage);
            const pageRemarksSet = new Set();
            
            chunk.forEach((card, index) => {
                const row = index + 1; 
                const trySetF2 = (cls, pdfName, isCheck = false) => {
                    const el = card.querySelector(cls);
                    if (!el) return;
                    try {
                        if (isCheck) el.checked ? formF2.getCheckBox(pdfName).check() : formF2.getCheckBox(pdfName).uncheck();
                        else if (el.value) formF2.getTextField(pdfName).setText(el.value);
                    } catch (e) {}
                };

                const isRefused = card.querySelector('.truck-refuse').checked;
                const volInput = card.querySelector('.truck-volume');
                
                if (volInput && volInput.value) {
                    const vol = parseFloat(volInput.value);
                    if (!isRefused) {
                        volumeCumuleF2 += vol;
                    }
                    try { formF2.getTextField(`truck-${row}-vol-un`).setText(vol.toString()); } catch(e) {}
                    try { formF2.getTextField(`truck-${row}-vol-cum`).setText(isRefused ? "" : volumeCumuleF2.toFixed(1)); } catch(e) {}
                }

                trySetF2('.truck-id', `truck-${row}-id`);
                trySetF2('.truck-bordereau', `truck-${row}-bordereau`);
                trySetF2('.truck-time-mix', `truck-${row}-time-mix`);
                trySetF2('.truck-time-start', `truck-${row}-time-start`);
                trySetF2('.truck-time-end', `truck-${row}-time-end`);
                trySetF2('.truck-water', `truck-${row}-water`);
                trySetF2('.truck-plast', `truck-${row}-plast`);
                trySetF2('.truck-air1', `truck-${row}-air1`);
                trySetF2('.truck-air2', `truck-${row}-air2`);
                trySetF2('.truck-temp', `truck-${row}-temp`);
                trySetF2('.truck-slump1', `truck-${row}-slump1`);
                trySetF2('.truck-slump1-sp', `truck-${row}-slump1-sp`, true);
                trySetF2('.truck-slump2', `truck-${row}-slump2`);
                trySetF2('.truck-slump2-sp', `truck-${row}-slump2-sp`, true);
                trySetF2('.truck-sample-check', `truck-${row}-sample-check`, true);
                trySetF2('.truck-sample-num', `truck-${row}-sample-num`);
                trySetF2('.truck-sample-time', `truck-${row}-sample-time`);
                
                // NOUVEAU : Setter robuste qui essaie TextField PUIS Dropdown si Foxit a changé le type
                if (isRefused) {
                    try { formF2.getCheckBox(`truck-${row}-refuse`).check(); } catch(e) {}
                    try { formF2.getTextField(`truck-${row}-remarque`).setText("N/C"); } 
                    catch(e1) { try { formF2.getDropdown(`truck-${row}-remarque`).select("N/C"); } catch(e2) {} }
                } else {
                    const elRem = card.querySelector('.truck-remarques-select');
                    if (elRem && elRem.value) {
                        try { formF2.getTextField(`truck-${row}-remarque`).setText(elRem.value); } 
                        catch(e1) { try { formF2.getDropdown(`truck-${row}-remarque`).select(elRem.value); } catch(e2) {} }
                        
                        if (elRem.value !== "N/C") {
                            pageRemarksSet.add(elRem.value); // Enregistre cette lettre pour la page active !
                        }
                    }
                }
            });

            // Injection des remarques spécifiques à CETTE page avec double interligne pour Foxit
            const pageNotes = Array.from(pageRemarksSet).sort().map(L => remarksDict[L]).filter(x => x);
            const finalRemarksText = [...generalText, ...pageNotes].join('; '); /* \n\n */
            try { formF2.getTextField('f2-remarques-globales').setText(finalRemarksText); } catch(e) {}

            try {
                const subFont = await subDocF2.embedFont(fontBytes);
                formF2.updateFieldAppearances(subFont);
                if (formF2.acroForm) formF2.acroForm.dict.set(PDFLib.PDFName.of('NeedAppearances'), PDFLib.PDFBool.False);
            } catch (e) {}

            const copiedPagesF2 = await mergedPdf.copyPages(subDocF2, subDocF2.getPageIndices());
            copiedPagesF2.forEach(page => mergedPdf.addPage(page));
        }

        // ==========================================
        // ETAPE 3 : Formulaire 3 (1 page par échantillon)
        // ==========================================
        const samples = document.querySelectorAll('.sample-card:not(.temoin-only-card)');
        for (const card of samples) {
            const subDoc = await PDFLib.PDFDocument.load(getBuffer(TEMPLATE_F3));
            subDoc.registerFontkit(fontkit);
            const form = subDoc.getForm();

            const num = Array.from(samples).indexOf(card) + 1;
            const linkedTruckNum = card.dataset.linkedTruck;
            const globalDate = document.getElementById('global-date').value;
            const globalTech = document.getElementById('f2-tech-name')?.value || document.getElementById('f1-tech-name')?.value || '';
            const techInitials = globalTech.split(' ').filter(n => n).map(n => n[0].toUpperCase()).join('');
            
            const f3DateHtml = card.querySelector('.sample-prelev-date');
            const f3TechHtml = card.querySelector('.sample-prelev-tech');
            const f3TimeHtml = card.querySelector('.sample-prelev-time');

            if (f3DateHtml && !f3DateHtml.value && globalDate) {
                try { form.getTextField('sample-prelev-date').setText(globalDate); } catch(e){}
                try { form.getTextField(`sample-${num}-prelev-date`).setText(globalDate); } catch(e){}
            }
            if (f3TechHtml && !f3TechHtml.value && techInitials) {
                try { form.getTextField('sample-prelev-tech').setText(techInitials); } catch(e){}
                try { form.getTextField(`sample-${num}-prelev-tech`).setText(techInitials); } catch(e){}
            }

            if (linkedTruckNum) {
                const truckCards = document.querySelectorAll('.truck-card');
                const truckCard = truckCards[linkedTruckNum - 1]; 
                if (truckCard) {
                    const tNum = truckCard.querySelector('.truck-sample-num').value;
                    const tTime = truckCard.querySelector('.truck-sample-time').value;
                    
                    if (tNum) {
                        try { form.getTextField('sample-no').setText(tNum); } catch(e){}
                        try { form.getTextField(`sample-${num}-no`).setText(tNum); } catch(e){}
                    }
                    if (f3TimeHtml && !f3TimeHtml.value && tTime) {
                        try { form.getTextField('sample-prelev-time').setText(tTime); } catch(e){}
                        try { form.getTextField(`sample-${num}-prelev-time`).setText(tTime); } catch(e){}
                    }
                }
            }

            card.querySelectorAll('input, textarea').forEach(input => {
                const targetClass = Array.from(input.classList).find(c => c.startsWith('sample-'));
                if (targetClass) {
                    const numberedName = targetClass.replace('sample-', `sample-${num}-`);
                    try {
                        if (input.type === 'checkbox') {
                            input.checked ? form.getCheckBox(targetClass).check() : form.getCheckBox(targetClass).uncheck();
                            input.checked ? form.getCheckBox(numberedName).check() : form.getCheckBox(numberedName).uncheck();
                        } else if (input.value) {
                            form.getTextField(targetClass).setText(input.value);
                            form.getTextField(numberedName).setText(input.value);
                        }
                    } catch(e) {}
                }
            });

            form.getFields().forEach(field => {
                const name = field.getName();
                if (name.startsWith('global-')) {
                    const el = document.getElementById(name);
                    if (el && el.value) {
                        try { form.getTextField(name).setText(el.value); } catch(e) {}
                    }
                }
            });

            try {
                const subFont = await subDoc.embedFont(fontBytes);
                form.updateFieldAppearances(subFont);
                if (form.acroForm) form.acroForm.dict.set(PDFLib.PDFName.of('NeedAppearances'), PDFLib.PDFBool.False);
            } catch (e) {}

            const copiedPages = await mergedPdf.copyPages(subDoc, subDoc.getPageIndices());
            copiedPages.forEach(page => mergedPdf.addPage(page));
        }

        // ==========================================
        // ETAPE 4 : Formulaire 4 (1 page par témoin)
        // ==========================================
        const temoinCheckboxes = document.querySelectorAll('.sample-temoin-check:checked');
        const temoinStandalone = document.querySelectorAll('.temoin-only-card');
        
        const allTemoins = [];
        temoinCheckboxes.forEach(cb => allTemoins.push(cb.closest('.sample-card').querySelector('.temoin-container')));
        temoinStandalone.forEach(card => allTemoins.push(card));

        for (const container of allTemoins) {
            const subDoc = await PDFLib.PDFDocument.load(getBuffer(TEMPLATE_TEMOIN));
            subDoc.registerFontkit(fontkit);
            const form = subDoc.getForm();

            const num = Array.from(allTemoins).indexOf(container) + 1;
            const globalDate = document.getElementById('global-date').value;
            const globalTech = document.getElementById('f2-tech-name')?.value || document.getElementById('f1-tech-name')?.value || '';
            const techInitials = globalTech.split(' ').filter(n => n).map(n => n[0].toUpperCase()).join('');

            container.querySelectorAll('input, textarea').forEach(input => {
                const targetClass = Array.from(input.classList).find(c => c.startsWith('temoin-'));
                if (targetClass) {
                    const numberedName = targetClass.replace('temoin-', `temoin-${num}-`);
                    try {
                        if (input.type === 'checkbox') {
                            input.checked ? form.getCheckBox(targetClass).check() : form.getCheckBox(targetClass).uncheck();
                            input.checked ? form.getCheckBox(numberedName).check() : form.getCheckBox(numberedName).uncheck();
                        } else if (input.value) {
                            form.getTextField(targetClass).setText(input.value);
                            form.getTextField(numberedName).setText(input.value);
                        }
                    } catch(e) {}
                }
            });

            const tDateHtml = container.querySelector('.temoin-prelev-date');
            const tTechHtml = container.querySelector('.temoin-prelev-tech');

            if (tDateHtml && !tDateHtml.value && globalDate) {
                try { form.getTextField('temoin-prelev-date').setText(globalDate); } catch(e){}
                try { form.getTextField(`temoin-${num}-prelev-date`).setText(globalDate); } catch(e){}
            }
            if (tTechHtml && !tTechHtml.value && techInitials) {
                try { form.getTextField('temoin-prelev-tech').setText(techInitials); } catch(e){}
                try { form.getTextField(`temoin-${num}-prelev-tech`).setText(techInitials); } catch(e){}
            }

            form.getFields().forEach(field => {
                const name = field.getName();
                if (name.startsWith('global-')) {
                    const el = document.getElementById(name);
                    if (el && el.value) {
                        try { form.getTextField(name).setText(el.value); } catch(e) {}
                    }
                }
            });

            try {
                const subFont = await subDoc.embedFont(fontBytes);
                form.updateFieldAppearances(subFont);
                if (form.acroForm) form.acroForm.dict.set(PDFLib.PDFName.of('NeedAppearances'), PDFLib.PDFBool.False);
            } catch (e) {}

            const copiedPages = await mergedPdf.copyPages(subDoc, subDoc.getPageIndices());
            copiedPages.forEach(page => mergedPdf.addPage(page));
        }

        const noProjetVal = document.getElementById('global-no-projet').value.trim() || 'SANS-NUMERO';
        const rawDateVal = document.getElementById('global-date').value || new Date().toISOString().split('T')[0];
        const resistanceVal = document.getElementById('f2-spec-resistance').value.trim() || 'Mix';
        const techNameVal = document.getElementById('f2-tech-name')?.value || document.getElementById('f1-tech-name')?.value || '';
        const initialsVal = techNameVal.split(' ').filter(n => n).map(n => n[0].toUpperCase()).join('') || 'TECH';

        const pdfBytes = await mergedPdf.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        // Le PDF téléchargé aura aussi le nouveau nom !
        link.download = `Rapport_${noProjetVal}_${rawDateVal}_${resistanceVal}_${initialsVal}.pdf`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 100);

        if (btn) {
            btn.textContent = originalText;
            btn.disabled = false;
        }
        alert("Export PDF généré avec succès !");

    } catch (error) {
        console.error("Erreur lors de l'export multi-template :", error);
        alert("Erreur lors de l'export PDF. Vérifiez la console.");
        const btn = document.querySelector('button[onclick="exportToPDF()"]');
        if(btn) {
            btn.textContent = "📄 Exporter en PDF";
            btn.disabled = false;
        }
    }
}