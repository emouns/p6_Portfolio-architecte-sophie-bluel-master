const API_URL = 'http://localhost:5678/api'

let allWorks = []

// ── 1. Récupérer les travaux ───────────────────────────
async function fetchWorks() {                               //cherche et trouve tous les projets sur le serveur//
  const response = await fetch(`${API_URL}/works`)          //appel GET/works sur l'api ,attend la reponse avec await// 
  return await response.json()                              //transforme le j.son  en tableau J.S ,le renvois stocké dans allworks au démmarrage//
}

// ── 2. Créer un élément <figure> ───────────────────────
function createWorkElement(work) {                              //fabrique une carte HTML avec (image,legende,data)
  const figure     = document.createElement('figure')
  const img        = document.createElement('img')
  const figcaption = document.createElement('figcaption')       //légende sous l'image//
  img.src                = work.imageUrl                        //propriété de l'objet j.son//
  img.alt                = work.title
  figcaption.textContent = work.title
  figure.appendChild(img)
  figure.appendChild(figcaption)
  figure.dataset.id       = work.id                              // colle l'id du projet sur la carte//
  figure.dataset.category = work.categoryId                    // colle la catégorie et pour le filtre //
  return figure
}

// ── 3. Afficher les travaux ────────────────────────────
function displayWorks(works) {                                    //vide la galerie et affiche les projets en parametres//
  const gallery = document.querySelector('.gallery')
  gallery.innerHTML = ''
  works.forEach(work => gallery.appendChild(createWorkElement(work)))
}

// ── 4. Init ────────────────────────────────────────────
async function init() {
  allWorks = await fetchWorks()   // charge les photos //
  displayWorks(allWorks)                // affiches les photos //
  const categories = await fetchCategories()  //charges les catégories //
  createFilterButtons(categories)       //crée les boutons filtre //
  checkAdminMode()                 // vérifie adnim //
}
init()

// ── 5. Catégories ──────────────────────────────────────
async function fetchCategories() {                             //cherche la liste des catégories sur le serveur//
  const response = await fetch(`${API_URL}/categories`)
  return await response.json()
}

// ── 6. Filtres ─────────────────────────────────────────
function createFilterButtons(categories) {                    // créer les boutons  de filtres (tous,objets,appart) //
  const filtersDiv = document.querySelector('.filters')
  const btnAll = document.createElement('button')
  btnAll.textContent = 'Tous'
  btnAll.classList.add('active')
  btnAll.addEventListener('click', () => { displayWorks(allWorks); setActiveBtn(btnAll) })
  filtersDiv.appendChild(btnAll)
  categories.forEach(cat => {
    const btn = document.createElement('button')
    btn.textContent = cat.name
    btn.addEventListener('click', () => {
      displayWorks(allWorks.filter(w => w.categoryId === cat.id))
      setActiveBtn(btn)
    })
    filtersDiv.appendChild(btn)
  })
}

function setActiveBtn(activeBtn) {                           //met en surbrillance le bouton filtre cliqué//
  document.querySelectorAll('.filters button').forEach(b => b.classList.remove('active'))
  activeBtn.classList.add('active')
}

// ── 7. Mode admin ──────────────────────────────────────
function checkAdminMode() {                                 //vérifie si l'utilisateur est en mode adnim//
  const token = localStorage.getItem('token')
  if (token) {
    const navLogin = document.querySelector('#nav-login')    //lit le token  dans localstorage si présent//
    navLogin.textContent = 'logout'
    navLogin.removeAttribute('href')
    navLogin.addEventListener('click', () => { localStorage.removeItem('token'); location.reload() })
    document.querySelector('.edit-banner').style.display = 'flex'
    document.querySelector('.btn-edit').style.display = 'flex'
    document.querySelector('.filters').style.display = 'none'
  }
}

// ── 8. Modale ──────────────────────────────────────────
const modal    = document.querySelector('#modal')
const btnClose = document.querySelector('.modal-close')
const btnBack  = document.querySelector('.modal-back')
const btnAdd   = document.querySelector('#btn-add-photo')
const btnEdit  = document.querySelector('.btn-edit')

if (btnEdit) btnEdit.addEventListener('click', () => { modal.classList.remove('hidden'); loadModalGallery() })
if (btnClose) btnClose.addEventListener('click', closeModal)
if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) closeModal() })

function closeModal() { modal.classList.add('hidden'); showGalleryView() }

if (btnAdd) {
  btnAdd.addEventListener('click', () => {
    document.querySelector('#modal-gallery').classList.add('hidden')
    document.querySelector('#modal-form').classList.remove('hidden')
    btnBack.classList.remove('hidden')
    fillCategorySelect()
  })
}
if (btnBack) btnBack.addEventListener('click', showGalleryView)

function showGalleryView() {
  document.querySelector('#modal-gallery').classList.remove('hidden')
  document.querySelector('#modal-form').classList.add('hidden')
  btnBack.classList.add('hidden')
  resetForm()
}

// ── 9. Galerie modale ─────────────────────────────────
// SVG poubelle propre pour le bouton haut-droit
const TRASH_SVG = `<svg class="trash-icon" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M1.5 3.5h11M5 3.5V2.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1M6 6.5v4M8 6.5v4M2.5 3.5l.75 7.5a1 1 0 0 0 1 .9h5.5a1 1 0 0 0 1-.9l.75-7.5" stroke="#fff" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`

function loadModalGallery() {
  const container = document.querySelector('.modal-photos')     //rempli la galerie de la modale avec les projet + la poubelle//
  container.innerHTML = ''
  allWorks.forEach(work => {
    const figure = document.createElement('figure')
    const img    = document.createElement('img')
    const btn    = document.createElement('button')
    img.src      = work.imageUrl
    img.alt      = work.title
    btn.innerHTML = TRASH_SVG
    btn.title    = 'Supprimer'
    btn.addEventListener('click', (e) => { e.stopPropagation(); deleteWork(work.id, figure) })
    figure.appendChild(img)
    figure.appendChild(btn)
    container.appendChild(figure)
  })
}

// ── 10. Supprimer ──────────────────────────────────────
async function deleteWork(id, figureElement) {                   //supprime un projet  coté serveur et dans la page //
  const token = localStorage.getItem('token')
  const response = await fetch(`${API_URL}/works/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  })
  if (response.ok) {
    figureElement.remove()
    const gf = document.querySelector(`.gallery [data-id='${id}']`)
    if (gf) gf.remove()
    allWorks = allWorks.filter(w => w.id !== id)
  }
}

// ── 11. Select catégories ──────────────────────────────
async function fillCategorySelect() {                         //remplis le menu deroulant des catégories dans le formulaire d'ajout//
  const categories = await fetchCategories()                  // remet une option vide par defaut et aoute une option par catégories//
  const select = document.querySelector('#work-category')
  select.innerHTML = '<option value=""></option>'
  categories.forEach(cat => {
    const option = document.createElement('option')
    option.value       = cat.id
    option.textContent = cat.name
    select.appendChild(option)
  })
  checkFormValidity()                                        
}

// ── 12. Upload & preview ───────────────────────────────
const uploadZone        = document.querySelector('#upload-zone')
const workImage         = document.querySelector('#work-image')
const preview           = document.querySelector('#preview')
const uploadPlaceholder = document.querySelector('#upload-placeholder')
const btnUploadTrigger  = document.querySelector('#btn-upload-trigger')

if (btnUploadTrigger) {
  btnUploadTrigger.addEventListener('click', (e) => { e.stopPropagation(); workImage.click() })
}
if (uploadZone) {
  uploadZone.addEventListener('click', () => workImage.click())
}
if (workImage) {
  workImage.addEventListener('change', (e) => {
    const file = e.target.files[0]
    if (file) {
      preview.src = URL.createObjectURL(file)
      preview.style.display = 'block'
      if (uploadPlaceholder) uploadPlaceholder.style.display = 'none'
    }
    checkFormValidity()
  })
}

// ── 13. Validation Valider ────────────────────────────
function checkFormValidity() {                                    //active ou desactive le bouton valider si leformulaire est completé ou non//
  const image    = workImage && workImage.files[0]              
  const title    = document.querySelector('#work-title')
  const category = document.querySelector('#work-category')
  const btnVal   = document.querySelector('#btn-valider')
  if (!btnVal) return
  const ok = !!(image && title && title.value.trim() !== '' && category && category.value !== '')  //vérifie si toute les condition réunis//
  btnVal.disabled = !ok                                                                             //bouton vert actif //
  btnVal.classList.toggle('active', ok)                                                             //bouton grisé//
}

const workTitle    = document.querySelector('#work-title')
const workCategory = document.querySelector('#work-category')
if (workTitle)    workTitle.addEventListener('input', checkFormValidity)
if (workCategory) workCategory.addEventListener('change', checkFormValidity)

// ── 14. Reset formulaire ───────────────────────────────
function resetForm() {                                         //remet le formulaire a zero aprés ajout ou ferme de la modale//
  const form = document.querySelector('#add-work-form')
  if (form) form.reset()                                       //renitialise le formulaire html//
  if (preview) { preview.src = ''; preview.style.display = 'none' }
  if (uploadPlaceholder) uploadPlaceholder.style.display = 'flex'
  const btnVal = document.querySelector('#btn-valider')
  if (btnVal) { btnVal.disabled = true; btnVal.classList.remove('active') }
  const formError = document.querySelector('#form-error')
  if (formError) formError.style.display = 'none'
}

// ── 15. Ajouter un travail ─────────────────────────────
const addWorkForm = document.querySelector('#add-work-form')    //envoi le nouveau projet (image) au serveur en cliquant sur le bouton valider//
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
    const formData = new FormData()                               //construit un format data avec images+titre+catégorie+post/work//
    formData.append('image', image)                               
    formData.append('title', title)
    formData.append('category', category)
    const response = await fetch(`${API_URL}/works`, {             
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    })
    if (response.ok) {                                          //work avec token si ok //
      const newWork = await response.json()
      allWorks.push(newWork)
      displayWorks(allWorks)                                    //ajout du projet allwork//
      loadModalGallery()                                        // recharge de la modale//
      showGalleryView()                                         //retour sur la cue de la galerie//
      formError.style.display = 'none'
    } else {
      formError.style.display = 'block'
      formError.textContent   = 'Erreur lors de l\'ajout. Réessaie.'
    }
  })
}
