document.addEventListener('DOMContentLoaded', function() {
    
    const loginForm = document.getElementById('loginForm');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('togglePassword');
    const errorModal = document.getElementById('errorModal');
    const closeErrorModal = document.getElementById('closeErrorModal');
    const successModal = document.getElementById('successModal');
    const proceedToDashboard = document.getElementById('proceedToDashboard');
    
    // Alamat server backend Anda yang sudah online
    const backendUrl = 'https://stress-project-omega.vercel.app/api';

    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            const icon = this.querySelector('i');
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault(); 
            const usernameSelect = document.getElementById('username');
            const peran = usernameSelect.value;
            const password = passwordInput.value;
            
            if (!peran || !password) {
                alert('Harap lengkapi semua field!');
                return;
            }
            
            fetch(`${backendUrl}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ peran: peran, password: password })
            })
            .then(response => response.json())
            .then(result => {
                if (result.data) {
                    localStorage.setItem('loggedInUser', result.data.nama);
                    localStorage.setItem('userRole', result.data.peran);
                    localStorage.setItem('avatarUrl', result.data.avatarUrl);
                    successModal.classList.remove('hidden');
                } else {
                    errorModal.classList.remove('hidden');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Tidak dapat terhubung ke server. Silakan coba lagi nanti.');
            });
        });
    }

    function hideErrorModal() {
        errorModal.classList.add('hidden');
    }

    function redirectToDashboard() {
        successModal.classList.add('hidden');
        // Arahkan ke halaman dashboard (path relatif yang benar)
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 300);
    }

    if (closeErrorModal) {
        closeErrorModal.addEventListener('click', hideErrorModal);
    }
    if (errorModal) {
        errorModal.addEventListener('click', (event) => { if (event.target === errorModal) hideErrorModal(); });
    }
    if (proceedToDashboard) {
        proceedToDashboard.addEventListener('click', redirectToDashboard);
    }
    if (successModal) {
        successModal.addEventListener('click', (event) => { if (event.target === successModal) redirectToDashboard(); });
    }
});
