document.addEventListener('DOMContentLoaded', () => {
    // --- Variabel & Konfigurasi ---
    const backendUrl = 'https://stress-project-omega.vercel.app/api'; // URL Vercel Anda
    let userProfileData = {
        nama: localStorage.getItem('loggedInUser') || "Manajer Proyek",
        role: localStorage.getItem('userRole') || "manager",
        avatarUrl: localStorage.getItem('avatarUrl') || "https://i.pravatar.cc/150?u=a042581f4e29026704d",
        // Data dummy lainnya
        email: "manager.proyek@email.com",
        telepon: "+62 812 3456 7890",
        alamat: "Jl. Teknologi No. 1, Surabaya",
        unit: "L 9134 CD"
    };

    // --- Elemen DOM ---
    const sidebar = document.querySelector(".sidebar");
    const sidebarToggleBtn = document.querySelector("#btn-sidebar-toggle");
    const logoutBtn = document.getElementById('logoutBtn');
    const logoutModal = document.getElementById('logoutModal');
    const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');
    const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
    const editProfileShowModalBtn = document.getElementById('editProfileShowModalBtn');
    const editProfileModal = document.getElementById('editProfileModal');
    const editProfileForm = document.getElementById('editProfileForm');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const successModal = document.getElementById('successModal');
    const closeSuccessModalBtn = document.getElementById('closeSuccessModalBtn');
    const unitLink = document.getElementById('unitLink');
    const unitDetailsModal = document.getElementById('unitDetailsModal');
    const closeUnitModalBtn = document.getElementById('closeUnitModalBtn');
    const avatarWrapper = document.querySelector('.profile-avatar-large-wrapper');
    const avatarUploadInput = document.getElementById('avatarUpload');
    const mainProfileImg = document.getElementById('mainProfileImg');
    const sidebarProfileImg = document.getElementById('profileImg');

    // --- Fungsi ---
    function populateProfileData() {
        // Gabungkan URL server jika path gambar bersifat relatif
        const serverUrl = 'https://stress-project-omega.vercel.app';
        const avatarSrc = userProfileData.avatarUrl.startsWith('http') ? userProfileData.avatarUrl : serverUrl + userProfileData.avatarUrl;
        
        mainProfileImg.src = avatarSrc;
        sidebarProfileImg.src = avatarSrc;

        document.getElementById('profileName').textContent = userProfileData.nama;
        document.getElementById('profileRole').textContent = userProfileData.role;
        document.getElementById('mainProfileName').textContent = userProfileData.nama;
        document.getElementById('mainProfileRole').textContent = userProfileData.role;
        document.getElementById('detailName').textContent = userProfileData.nama;
        document.getElementById('detailEmail').textContent = userProfileData.email;
        document.getElementById('detailTelepon').textContent = userProfileData.telepon;
        document.getElementById('detailAlamat').textContent = userProfileData.alamat;
        document.getElementById('unitLink').textContent = userProfileData.unit;
    }

    // --- Event Listeners ---
    sidebarToggleBtn.addEventListener("click", () => sidebar.classList.toggle("open"));
    
    logoutBtn.addEventListener('click', (e) => { e.preventDefault(); logoutModal.classList.remove('hidden'); });
    cancelLogoutBtn.addEventListener('click', () => logoutModal.classList.add('hidden'));
    confirmLogoutBtn.addEventListener('click', () => {
        logoutModal.classList.add('hidden');
        localStorage.clear();
        window.location.href = 'login.html';
    });

    editProfileShowModalBtn.addEventListener('click', () => {
        document.getElementById('editNama').value = userProfileData.nama;
        document.getElementById('editEmail').value = userProfileData.email;
        document.getElementById('editTelepon').value = userProfileData.telepon;
        document.getElementById('editAlamat').value = userProfileData.alamat;
        document.getElementById('editUnit').value = userProfileData.unit;
        editProfileModal.classList.remove('hidden');
    });

    cancelEditBtn.addEventListener('click', () => editProfileModal.classList.add('hidden'));

    editProfileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        userProfileData.nama = document.getElementById('editNama').value;
        userProfileData.email = document.getElementById('editEmail').value;
        userProfileData.telepon = document.getElementById('editTelepon').value;
        userProfileData.alamat = document.getElementById('editAlamat').value;
        userProfileData.unit = document.getElementById('editUnit').value;
        localStorage.setItem('loggedInUser', userProfileData.nama);
        populateProfileData();
        editProfileModal.classList.add('hidden');
        successModal.classList.remove('hidden');
    });
    
    closeSuccessModalBtn.addEventListener('click', () => successModal.classList.add('hidden'));
    unitLink.addEventListener('click', (e) => { e.preventDefault(); unitDetailsModal.classList.remove('hidden'); });
    closeUnitModalBtn.addEventListener('click', () => unitDetailsModal.classList.add('hidden'));

    // Logika untuk Edit Foto Profil
    avatarWrapper.addEventListener('click', () => {
        avatarUploadInput.click();
    });

    avatarUploadInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Tampilkan pratinjau langsung
        const reader = new FileReader();
        reader.onload = e => {
            mainProfileImg.src = e.target.result;
            sidebarProfileImg.src = e.target.result;
        };
        reader.readAsDataURL(file);

        // Kirim file ke server
        const formData = new FormData();
        formData.append('avatar', file);
        formData.append('peran', userProfileData.role);

        try {
            const response = await fetch(`${backendUrl}/avatar`, {
                method: 'POST',
                body: formData,
            });
            const result = await response.json();

            if (response.ok) {
                localStorage.setItem('avatarUrl', result.avatarUrl);
                userProfileData.avatarUrl = result.avatarUrl;
                alert('Foto profil berhasil diperbarui!');
            } else {
                throw new Error(result.error || 'Gagal mengunggah gambar');
            }
        } catch (error) {
            console.error('Error:', error);
            alert(error.message);
            populateProfileData(); 
        }
    });

    // --- INISIALISASI ---
    populateProfileData();
});