const API_URL = 'http://localhost:5678/api'

let allWorks = []

// ── 1. Récupérer les travaux depuis l'API ──────────────
async function fetchWorks() {
  const response = await fetch(`${API_URL}/works`)
  const works = await response.json()
  return works
}

// ── 2. Créer un élément <figure> pour un travail ───────
function createWorkElement(work) {
  const figure     = document.createElement('figure')
  const img        = document.createElement('img')
  const figcaption = document.createElement('figcaption')

  img.src                = work.imageUrl
  img.alt                = work.title
  figcaption.textContent = work.title

  figure.appendChild(img)
  figure.appendChild(figcaption)
  figure.dataset.id       = work.id
  figure.dataset.category = work.categoryId
  return figure
}

// ── 3. Afficher les travaux dans la galerie ────────────
function displayWorks(works) {
  const gallery = document.querySelector('.gallery')
  gallery.innerHTML = ''
  works.forEach(work => gallery.appendChild(createWorkElement(work)))
}

// ── 4. Initialisation ──────────────────────────────────
async function init() {
  allWorks = await fetchWorks()
  displayWorks(allWorks)

 const categories = await fetchCategories()   // ← ligne ajoutée
  createFilterButtons(categories)              // ← ligne ajoutée
  checkAdminMode()              // ← ligne ajoutée
}



init()

// ── 5. Récupérer les catégories depuis l'API ───────────
async function fetchCategories() {
  const response = await fetch(`${API_URL}/categories`)
  return await response.json()
}

// ── 6. Créer les boutons de filtre ─────────────────────
function createFilterButtons(categories) {
  const filtersDiv = document.querySelector('.filters')

  // Bouton "Tous" en premier
  const btnAll = document.createElement('button')
  btnAll.textContent = 'Tous'
  btnAll.classList.add('active')
  btnAll.addEventListener('click', () => {
    displayWorks(allWorks)
    setActiveBtn(btnAll)
  })
  filtersDiv.appendChild(btnAll)

  // Un bouton par catégorie
  categories.forEach(cat => {
    const btn = document.createElement('button')
    btn.textContent = cat.name
    btn.addEventListener('click', () => {
      const filtered = allWorks.filter(w => w.categoryId === cat.id)
      displayWorks(filtered)
      setActiveBtn(btn)
    })
    filtersDiv.appendChild(btn)
  })
}

// ── 7. Gérer le bouton actif ───────────────────────────
function setActiveBtn(activeBtn) {
  document.querySelectorAll('.filters button').forEach(b => {
    b.classList.remove('active')
  })
  activeBtn.classList.add('active')
}
// ── 8. Mode admin ──────────────────────────────────────
function checkAdminMode() {
  const token = localStorage.getItem('token')

  if (token) {
    // Changer login en logout
    const navLogin = document.querySelector('#nav-login')
    navLogin.textContent = 'logout'
    navLogin.removeAttribute('href')
    navLogin.addEventListener('click', () => {
      localStorage.removeItem('token')
      location.reload()
    })

    // Afficher le bandeau mode édition
    document.querySelector('.edit-banner').style.display = 'flex'

    // Afficher le bouton modifier
    document.querySelector('.btn-edit').style.display = 'block'

    // Masquer les filtres
    document.querySelector('.filters').style.display = 'none'
  }
}
// ── 9. Gestion de la modale ────────────────────────────
const modal    = document.querySelector('#modal')
const btnClose = document.querySelector('.modal-close')
const btnBack  = document.querySelector('.modal-back')
const btnAdd   = document.querySelector('#btn-add-photo')
const btnEdit  = document.querySelector('.btn-edit')

if (btnEdit) {
  btnEdit.addEventListener('click', () => {
    modal.classList.remove('hidden')
    loadModalGallery()
  })
}

if (btnClose) {
  btnClose.addEventListener('click', closeModal)
}

if (modal) {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal()
  })
}

function closeModal() {
  modal.classList.add('hidden')
  showGalleryView()
}

if (btnAdd) {
  btnAdd.addEventListener('click', () => {
    document.querySelector('#modal-gallery').classList.add('hidden')
    document.querySelector('#modal-form').classList.remove('hidden')
    btnBack.classList.remove('hidden')
    fillCategorySelect()
  })
}

if (btnBack) {
  btnBack.addEventListener('click', showGalleryView)
}

function showGalleryView() {
  document.querySelector('#modal-gallery').classList.remove('hidden')
  document.querySelector('#modal-form').classList.add('hidden')
  btnBack.classList.add('hidden')
}

// ── 10. Charger les photos dans la modale ──────────────
function loadModalGallery() {
  const container = document.querySelector('.modal-photos')
  container.innerHTML = ''
  allWorks.forEach(work => {
    const figure = document.createElement('figure')
    const img    = document.createElement('img')
    const btn    = document.createElement('button')
    img.src       = work.imageUrl
    img.alt       = work.title
    btn.innerHTML = '🗑'
    btn.addEventListener('click', () => deleteWork(work.id, figure))
    figure.appendChild(img)
    figure.appendChild(btn)
    container.appendChild(figure)
  })
}

// ── 11. Supprimer un travail ───────────────────────────
async function deleteWork(id, figureElement) {
  const token = localStorage.getItem('token')
  const response = await fetch(`${API_URL}/works/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  })
  if (response.ok) {
    figureElement.remove()
    const galleryFigure = document.querySelector(`.gallery [data-id='${id}']`)
    if (galleryFigure) galleryFigure.remove()
    allWorks = allWorks.filter(w => w.id !== id)
  }
}

// ── 12. Remplir le select des catégories ──────────────
async function fillCategorySelect() {
  const categories = await fetchCategories()
  const select = document.querySelector('#work-category')
  select.innerHTML = '<option value="">-- Choisir --</option>'
  categories.forEach(cat => {
    const option = document.createElement('option')
    option.value       = cat.id
    option.textContent = cat.name
    select.appendChild(option)
  })
}

// ── 13. Preview de l'image ─────────────────────────────
const workImage = document.querySelector('#work-image')
if (workImage) {
  workImage.addEventListener('change', (e) => {
    const file    = e.target.files[0]
    const preview = document.querySelector('#preview')
    if (file) {
      preview.src           = URL.createObjectURL(file)
      preview.style.display = 'block'
    }
  })
}

// ── 14. Ajouter un travail ─────────────────────────────
const addWorkForm = document.querySelector('#add-work-form')
if (addWorkForm) {
  addWorkForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    const token     = localStorage.getItem('token')
    const image     = document.querySelector('#work-image').files[0]
    const title     = document.querySelector('#work-title').value
    const category  = document.querySelector('#work-category').value
    const formError = document.querySelector('#form-error')
    if (!image || !title || !category) {
      formError.style.display = 'block'
      formError.textContent   = 'Tous les champs sont obligatoires'
      return
    }
    const formData = new FormData()
    formData.append('image',    image)
    formData.append('title',    title)
    formData.append('category', category)
    const response = await fetch(`${API_URL}/works`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    })
    if (response.ok) {
      const newWork = await response.json()
      allWorks.push(newWork)
      displayWorks(allWorks)
      loadModalGallery()
      showGalleryView()
      formError.style.display = 'none'
    }
  })
}