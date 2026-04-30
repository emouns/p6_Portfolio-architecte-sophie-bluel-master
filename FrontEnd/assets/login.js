const form     = document.querySelector('#login-form')
const errorMsg = document.querySelector('#error-msg')

form.addEventListener('submit', async (e) => {   //formulaire soumis//
  e.preventDefault()                            // bloque le chargement de la page //

  const email    = document.querySelector('#email').value
  const password = document.querySelector('#password').value

  const response = await fetch('http://localhost:5678/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },       //envoyer en json a backend//
    body: JSON.stringify({ email, password })
  })

  if (response.ok) {
    const data = await response.json()
    localStorage.setItem('token', data.token)  //stocke la clé //
    window.location.href = './index.html'      //redirige vers index.html//
  } else {
    errorMsg.style.display = 'block'           //affiche message erreur//
  }
})