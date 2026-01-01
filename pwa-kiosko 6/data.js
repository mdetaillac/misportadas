// Datos por defecto de periódicos
const DEFAULT_PAPERS = {
    "es-nacional": [
        { id: "elpais", name: "El País", country: "es" },
        { id: "elmundo", name: "El Mundo", country: "es" },
        { id: "abc", name: "ABC", country: "es" },
        { id: "larazon", name: "La Razón", country: "es" },
        { id: "lavanguardia", name: "La Vanguardia", country: "es" },
        { id: "elperiodico", name: "El Periódico", country: "es" },
        { id: "20minutos_madrid", name: "20 Minutos", country: "es" }
    ],
    "es-economica": [
        { id: "expansion", name: "Expansión", country: "es" },
        { id: "5dias", name: "Cinco Días", country: "es" },
        { id: "eleconomista", name: "El Economista", country: "es" }
    ],
    "es-regional": [
        { id: "ara", name: "Ara", location: "Barcelona", country: "es" },
        { id: "vozgalicia", name: "La Voz de Galicia", location: "A Coruña", country: "es" },
        { id: "elcorreo", name: "El Correo", location: "Bizkaia", country: "es" },
        { id: "levante", name: "Levante", location: "Valencia", country: "es" },
        { id: "diario_montanes", name: "El Diario Montañés", location: "Santander", country: "es" },
        { id: "diario_navarra", name: "Diario de Navarra", location: "Pamplona", country: "es" },
        { id: "lanuevaespana", name: "La Nueva España", location: "Oviedo", country: "es" },
        { id: "hoy_badajoz", name: "Hoy", location: "Badajoz", country: "es" },
        { id: "latribuna_toledo", name: "La Tribuna de Toledo", location: "Toledo", country: "es" },
        { id: "opinion_murcia", name: "La Opinión de Murcia", location: "Murcia", country: "es" },
        { id: "heraldo_aragon", name: "Heraldo de Aragón", location: "Zaragoza", country: "es" },
        { id: "nortecastilla_segovia", name: "Norte de Castilla", location: "Segovia", country: "es" },
        { id: "eldia_segovia", name: "El Día de Segovia", location: "Segovia", country: "es" },
        { id: "adelantado_segovia", name: "El Adelantado de Segovia", location: "Segovia", country: "es" },
        { id: "ultima_hora", name: "Última Hora", location: "Mallorca", country: "es" },
        { id: "eldia", name: "El Día", location: "Tenerife", country: "es" },
        { id: "canarias7", name: "Canarias 7", location: "Gran Canaria", country: "es" }
    ],
    "es-deportiva": [
        { id: "marca", name: "Marca", country: "es" },
        { id: "as", name: "As", country: "es" },
        { id: "mundodeportivo", name: "El Mundo Deportivo", country: "es" },
        { id: "sport", name: "Sport", country: "es" }
    ],
    "pt": [
        { id: "diario_noticias", name: "Diário de Notícias", location: "Lisboa", country: "pt" },
        { id: "publico", name: "Público", location: "Lisboa", country: "pt" }
    ],
    "fr": [
        { id: "lefigaro", name: "Le Figaro", country: "fr" },
        { id: "lemonde", name: "Le Monde", country: "fr" },
        { id: "liberation", name: "Libération", country: "fr" },
        { id: "parisien", name: "Le Parisien", country: "fr" },
        { id: "lacroix", name: "La Croix", country: "fr" },
        { id: "echos", name: "Les Echos", country: "fr" },
        { id: "sudouest", name: "Sud Ouest", location: "Aquitania", country: "fr" },
        { id: "ouestfrance", name: "Ouest France", location: "Bretaña", country: "fr" },
        { id: "l_equip", name: "L'Équipe", country: "fr" }
    ]
};

const CATEGORIES = [
    { id: "all", name: "Todo", icon: "📰" },
    { id: "favorites", name: "Favoritos", icon: "⭐" },
    { id: "es-nacional", name: "Nacional", icon: "🇪🇸" },
    { id: "es-economica", name: "Económica", icon: "💹" },
    { id: "es-regional", name: "Regional", icon: "🏘️" },
    { id: "es-deportiva", name: "Deportes", icon: "⚽" },
    { id: "pt", name: "Portugal", icon: "🇵🇹" },
    { id: "fr", name: "Francia", icon: "🇫🇷" }
];

const CATEGORY_GROUPS = [
    { key: 'es-nacional', title: '🇪🇸 España - Nacional' },
    { key: 'es-economica', title: '💹 España - Económica' },
    { key: 'es-regional', title: '🏘️ España - Regional' },
    { key: 'es-deportiva', title: '⚽ España - Deportiva' },
    { key: 'pt', title: '🇵🇹 Portugal' },
    { key: 'fr', title: '🇫🇷 Francia' }
];

function loadPapers() {
    const saved = localStorage.getItem('kiosko-papers');
    if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
    }
    return JSON.parse(JSON.stringify(DEFAULT_PAPERS));
}

function savePapers(papers) {
    localStorage.setItem('kiosko-papers', JSON.stringify(papers));
}

function resetPapers() {
    localStorage.removeItem('kiosko-papers');
    return JSON.parse(JSON.stringify(DEFAULT_PAPERS));
}

let PAPERS = loadPapers();

function getImageUrl(paper, size = 200) {
    const today = new Date();
    return getImageUrlForDate(paper, today, size);
}

function getImageUrlForDate(paper, date, size = 200) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `https://img.kiosko.net/${year}/${month}/${day}/${paper.country}/${paper.id}.${size}.jpg`;
}

// Cache para guardar la última fecha válida de cada periódico
const validDateCache = {};

// Prueba si una imagen existe cargándola
function testImage(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
    });
}

// Busca la última portada disponible (hasta 30 días atrás)
async function findValidCover(paper, size = 200, maxDaysBack = 30) {
    const cacheKey = `${paper.id}-${size}`;
    
    // Si ya encontramos una fecha válida hoy, usarla
    if (validDateCache[cacheKey]) {
        const cached = validDateCache[cacheKey];
        const now = new Date();
        // Invalidar cache si pasó más de 1 hora
        if (now - cached.timestamp < 3600000) {
            return cached.url;
        }
    }
    
    const today = new Date();
    
    for (let i = 0; i <= maxDaysBack; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        const url = getImageUrlForDate(paper, checkDate, size);
        
        const exists = await testImage(url);
        if (exists) {
            validDateCache[cacheKey] = { url, timestamp: new Date() };
            return url;
        }
    }
    
    // Último intento: imagen genérica del periódico en Kiosko.net
    const fallbackUrl = `https://img.kiosko.net/${paper.country}/${paper.id}.${size}.jpg`;
    const fallbackExists = await testImage(fallbackUrl);
    if (fallbackExists) {
        validDateCache[cacheKey] = { url: fallbackUrl, timestamp: new Date() };
        return fallbackUrl;
    }
    
    // Si no encuentra nada, devolver null para mostrar placeholder
    return null;
}

function getPaperPageUrl(paper) {
    return `https://es.kiosko.net/${paper.country}/np/${paper.id}.html`;
}
