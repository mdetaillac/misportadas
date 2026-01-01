// Estado de la aplicación
let currentCategory = 'all';
let favorites = JSON.parse(localStorage.getItem('kiosko-favorites') || '[]');
let currentPaper = null;
let currentPaperIndex = 0;
let currentPaperList = [];
let editingCategory = 'es-nacional';
let draggedItem = null;

// Variables para swipe
let touchStartX = 0;
let touchEndX = 0;
let hasZoomed = false;
const SWIPE_THRESHOLD = 50;

// Elementos del DOM
const mainContent = document.getElementById('main-content');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const modalImage = document.getElementById('modal-image');
const modalBody = document.getElementById('modal-body');
const modalCounter = document.getElementById('modal-counter');
const editorPanel = document.getElementById('editor-panel');

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    renderNav();
    renderPapers();
    updateDate();
    setupBottomNav();
    setupEditor();
});

function updateDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = new Date().toLocaleDateString('es-ES', options);
    document.getElementById('date-info').textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
}

function renderNav() {
    const nav = document.getElementById('category-nav');
    nav.innerHTML = CATEGORIES.map(cat => `
        <button data-category="${cat.id}" class="${cat.id === currentCategory ? 'active' : ''}">
            ${cat.icon} ${cat.name}
        </button>
    `).join('');
    
    nav.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
            currentCategory = btn.dataset.category;
            nav.querySelectorAll('button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderPapers();
        });
    });
}

function getPapersForCategory(category) {
    if (category === 'all') return Object.values(PAPERS).flat();
    if (category === 'favorites') {
        const allPapers = Object.values(PAPERS).flat();
        return allPapers.filter(p => favorites.includes(p.id));
    }
    return PAPERS[category] || [];
}

function renderPapers() {
    const papers = getPapersForCategory(currentCategory);
    
    if (papers.length === 0) {
        mainContent.innerHTML = `
            <div class="empty-state">
                <span>${currentCategory === 'favorites' ? '⭐' : '📰'}</span>
                <p>${currentCategory === 'favorites' ? 'No tienes favoritos guardados' : 'No hay periódicos en esta categoría'}</p>
                <p style="margin-top: 8px; font-size: 0.85rem;">
                    ${currentCategory === 'favorites' ? 'Toca ☆ en cualquier periódico para añadirlo' : 'Usa ⚙️ Editar para añadir periódicos'}
                </p>
            </div>
        `;
        return;
    }
    
    if (currentCategory === 'all') {
        let html = '';
        CATEGORY_GROUPS.forEach(group => {
            if (PAPERS[group.key] && PAPERS[group.key].length > 0) {
                html += `<div class="section-title">${group.title}</div>`;
                html += `<div class="papers-grid">${renderPaperCards(PAPERS[group.key])}</div>`;
            }
        });
        mainContent.innerHTML = html;
    } else {
        mainContent.innerHTML = `<div class="papers-grid">${renderPaperCards(papers)}</div>`;
    }
    
    setupCardEvents();
}

function renderPaperCards(papers) {
    return papers.map(paper => {
        const isFav = favorites.includes(paper.id);
        return `
            <div class="paper-card" data-id="${paper.id}" data-country="${paper.country}">
                <img src="${getImageUrl(paper)}" alt="${paper.name}" loading="lazy" 
                     data-paper-id="${paper.id}" data-paper-country="${paper.country}"
                     onerror="handleImageError(this)">
                <button class="fav-btn ${isFav ? 'active' : ''}" data-id="${paper.id}">${isFav ? '★' : '☆'}</button>
                <div class="name">
                    ${paper.name}
                    ${paper.location ? `<div class="location">${paper.location}</div>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Maneja errores de carga buscando portadas de días anteriores
function handleImageError(img) {
    const paperId = img.dataset.paperId;
    const paperCountry = img.dataset.paperCountry;
    const paper = { id: paperId, country: paperCountry };
    
    // Contador de días hacia atrás (guardado en el elemento)
    let daysBack = parseInt(img.dataset.daysBack || '0') + 1;
    img.dataset.daysBack = daysBack;
    
    // Máximo 30 días atrás
    if (daysBack > 30) {
        img.src = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 140%22><rect fill=%22%2316213e%22 width=%22100%22 height=%22140%22/><text x=%2250%22 y=%2270%22 text-anchor=%22middle%22 fill=%22%23666%22 font-size=%2210%22>Sin portada</text></svg>';
        img.onerror = null; // Evitar más intentos
        return;
    }
    
    // Probar con el día anterior
    const checkDate = new Date();
    checkDate.setDate(checkDate.getDate() - daysBack);
    img.src = getImageUrlForDate(paper, checkDate, 200);
}

function setupCardEvents() {
    document.querySelectorAll('.paper-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('.fav-btn')) return;
            const id = card.dataset.id;
            const paperList = getPapersForCategory(currentCategory);
            const index = paperList.findIndex(p => p.id === id);
            const paper = paperList[index];
            if (paper) openModal(paper, paperList, index);
        });
    });
    
    document.querySelectorAll('.fav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            toggleFavorite(id);
            btn.classList.toggle('active');
            btn.textContent = favorites.includes(id) ? '★' : '☆';
        });
    });
}

function toggleFavorite(id) {
    const index = favorites.indexOf(id);
    if (index === -1) favorites.push(id);
    else favorites.splice(index, 1);
    localStorage.setItem('kiosko-favorites', JSON.stringify(favorites));
    if (currentCategory === 'favorites') renderPapers();
}

function openModal(paper, paperList, index) {
    currentPaper = paper;
    currentPaperList = paperList || [paper];
    currentPaperIndex = index || 0;
    
    updateModalContent();
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    
    setupSwipeListeners();
}

function updateModalContent() {
    const paper = currentPaperList[currentPaperIndex];
    currentPaper = paper;
    modalTitle.textContent = paper.name;
    modalCounter.textContent = `${currentPaperIndex + 1} / ${currentPaperList.length}`;
    
    // Configurar imagen con fallback
    modalImage.dataset.paperId = paper.id;
    modalImage.dataset.paperCountry = paper.country;
    modalImage.dataset.daysBack = '0';
    modalImage.onerror = function() { handleModalImageError(this); };
    modalImage.src = getImageUrl(paper, 750);
    
    // Resetear estado de zoom
    hasZoomed = false;
    
    // Actualizar estado de botones
    document.getElementById('btn-prev').disabled = currentPaperIndex === 0;
    document.getElementById('btn-next').disabled = currentPaperIndex === currentPaperList.length - 1;
}

// Maneja errores en la imagen del modal
function handleModalImageError(img) {
    const paperId = img.dataset.paperId;
    const paperCountry = img.dataset.paperCountry;
    const paper = { id: paperId, country: paperCountry };
    
    let daysBack = parseInt(img.dataset.daysBack || '0') + 1;
    img.dataset.daysBack = daysBack;
    
    if (daysBack > 30) {
        img.src = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 140%22><rect fill=%22%2316213e%22 width=%22100%22 height=%22140%22/><text x=%2250%22 y=%2270%22 text-anchor=%22middle%22 fill=%22%23666%22 font-size=%2212%22>Sin portada</text></svg>';
        img.onerror = null;
        return;
    }
    
    const checkDate = new Date();
    checkDate.setDate(checkDate.getDate() - daysBack);
    img.src = getImageUrlForDate(paper, checkDate, 750);
}

function navigatePaper(direction) {
    const newIndex = currentPaperIndex + direction;
    if (newIndex < 0 || newIndex >= currentPaperList.length) return;
    
    // Animación de swipe
    const animClass = direction > 0 ? 'swipe-left' : 'swipe-right';
    modalImage.classList.add(animClass);
    
    setTimeout(() => {
        currentPaperIndex = newIndex;
        updateModalContent();
        modalImage.classList.remove(animClass);
    }, 150);
}

function setupSwipeListeners() {
    modalBody.addEventListener('touchstart', handleTouchStart, { passive: true });
    modalBody.addEventListener('touchend', handleTouchEnd, { passive: true });
}

function handleTouchStart(e) {
    // Si hay más de un dedo = está haciendo zoom
    if (e.touches.length > 1) {
        hasZoomed = true;
        return;
    }
    
    // Si ya hizo zoom, bloquear swipe
    if (hasZoomed) return;
    
    touchStartX = e.changedTouches[0].screenX;
}

function handleTouchEnd(e) {
    // Si está en modo zoom, ignorar
    if (hasZoomed) return;
    
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}

function handleSwipe() {
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > SWIPE_THRESHOLD) {
        if (diff > 0) {
            // Swipe izquierda → siguiente
            navigatePaper(1);
        } else {
            // Swipe derecha → anterior
            navigatePaper(-1);
        }
    }
}

function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
    currentPaper = null;
}

function goToWebsite() {
    if (currentPaper) window.open(getPaperPageUrl(currentPaper), '_blank');
}

function setupBottomNav() {
    document.querySelectorAll('.bottom-nav button').forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            
            if (view === 'edit') {
                openEditor();
                return;
            }
            
            document.querySelectorAll('.bottom-nav button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            if (view === 'favorites') {
                currentCategory = 'favorites';
                updateNavSelection('favorites');
                renderPapers();
            } else if (view === 'home') {
                currentCategory = 'all';
                updateNavSelection('all');
                renderPapers();
            } else if (view === 'refresh') {
                location.reload();
            }
        });
    });
}

function updateNavSelection(category) {
    document.querySelectorAll('#category-nav button').forEach(b => {
        b.classList.toggle('active', b.dataset.category === category);
    });
}

// ========== EDITOR ==========
function setupEditor() {
    document.getElementById('editor-close').addEventListener('click', closeEditor);
    document.getElementById('btn-add-paper').addEventListener('click', () => toggleAddForm(true));
    document.getElementById('btn-reset').addEventListener('click', resetToDefaults);
    document.getElementById('btn-cancel-add').addEventListener('click', () => toggleAddForm(false));
    document.getElementById('btn-save-paper').addEventListener('click', savePaper);
    
    // Tabs del editor
    document.querySelectorAll('.editor-tabs button').forEach(btn => {
        btn.addEventListener('click', () => {
            editingCategory = btn.dataset.cat;
            document.querySelectorAll('.editor-tabs button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderEditorList();
        });
    });
}

function openEditor() {
    editorPanel.classList.add('open');
    document.body.style.overflow = 'hidden';
    editingCategory = 'es-nacional';
    document.querySelectorAll('.editor-tabs button').forEach(b => {
        b.classList.toggle('active', b.dataset.cat === editingCategory);
    });
    renderEditorList();
}

function closeEditor() {
    editorPanel.classList.remove('open');
    document.body.style.overflow = '';
    toggleAddForm(false);
    renderPapers(); // Actualizar vista principal
}

function renderEditorList() {
    const list = document.getElementById('editor-list');
    const papers = PAPERS[editingCategory] || [];
    
    if (papers.length === 0) {
        list.innerHTML = '<div class="empty-state"><span>📭</span><p>No hay periódicos en esta categoría</p></div>';
        return;
    }
    
    list.innerHTML = papers.map((paper, index) => `
        <div class="editor-item" draggable="true" data-index="${index}">
            <div class="drag-handle">⋮⋮</div>
            <div class="paper-info">
                <div class="paper-name">${paper.name}</div>
                <div class="paper-id">${paper.id}${paper.location ? ' • ' + paper.location : ''}</div>
            </div>
            <button class="delete-btn" data-index="${index}">🗑️</button>
        </div>
    `).join('');
    
    setupDragAndDrop();
    setupDeleteButtons();
}

function setupDragAndDrop() {
    const items = document.querySelectorAll('.editor-item');
    
    items.forEach(item => {
        item.addEventListener('dragstart', (e) => {
            draggedItem = item;
            item.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });
        
        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
            draggedItem = null;
        });
        
        item.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (draggedItem && draggedItem !== item) {
                const list = document.getElementById('editor-list');
                const items = [...list.querySelectorAll('.editor-item')];
                const draggedIndex = items.indexOf(draggedItem);
                const targetIndex = items.indexOf(item);
                
                if (draggedIndex < targetIndex) {
                    item.after(draggedItem);
                } else {
                    item.before(draggedItem);
                }
            }
        });
        
        item.addEventListener('drop', (e) => {
            e.preventDefault();
            saveOrder();
        });
    });
}

function saveOrder() {
    const items = document.querySelectorAll('.editor-item');
    const newOrder = [];
    items.forEach(item => {
        const index = parseInt(item.dataset.index);
        newOrder.push(PAPERS[editingCategory][index]);
    });
    PAPERS[editingCategory] = newOrder;
    savePapers(PAPERS);
    renderEditorList();
}

function setupDeleteButtons() {
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            const paper = PAPERS[editingCategory][index];
            if (confirm(`¿Eliminar "${paper.name}"?`)) {
                PAPERS[editingCategory].splice(index, 1);
                savePapers(PAPERS);
                renderEditorList();
            }
        });
    });
}

function toggleAddForm(show) {
    document.getElementById('add-form').classList.toggle('open', show);
    if (show) {
        document.getElementById('new-paper-id').value = '';
        document.getElementById('new-paper-name').value = '';
        document.getElementById('new-paper-location').value = '';
        document.getElementById('new-paper-country').value = 'es';
    }
}

function savePaper() {
    const id = document.getElementById('new-paper-id').value.trim();
    const name = document.getElementById('new-paper-name').value.trim();
    const location = document.getElementById('new-paper-location').value.trim();
    const country = document.getElementById('new-paper-country').value;
    
    if (!id || !name) {
        alert('El ID y el nombre son obligatorios');
        return;
    }
    
    // Verificar si ya existe
    const allPapers = Object.values(PAPERS).flat();
    if (allPapers.some(p => p.id === id)) {
        alert('Ya existe un periódico con ese ID');
        return;
    }
    
    const newPaper = { id, name, country };
    if (location) newPaper.location = location;
    
    if (!PAPERS[editingCategory]) PAPERS[editingCategory] = [];
    PAPERS[editingCategory].push(newPaper);
    savePapers(PAPERS);
    
    toggleAddForm(false);
    renderEditorList();
}

function resetToDefaults() {
    if (confirm('¿Restaurar todos los periódicos a la configuración original?\n\nEsto eliminará todos los cambios que hayas hecho.')) {
        PAPERS = resetPapers();
        renderEditorList();
    }
}

// Event listeners del modal
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('btn-website').addEventListener('click', goToWebsite);
document.getElementById('btn-close').addEventListener('click', closeModal);
document.getElementById('btn-prev').addEventListener('click', () => navigatePaper(-1));
document.getElementById('btn-next').addEventListener('click', () => navigatePaper(1));
document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('open')) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowLeft') navigatePaper(-1);
    if (e.key === 'ArrowRight') navigatePaper(1);
});
modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.classList.contains('modal-body')) closeModal();
});
