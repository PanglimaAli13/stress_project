document.addEventListener('DOMContentLoaded', () => {
  if (typeof ChartDataLabels !== 'undefined') {
    Chart.register(ChartDataLabels);
  }

  const backendUrl = 'https://stress-project-omega.vercel.app/api';
  const loggedInUser = localStorage.getItem('loggedInUser') || "Manajer Proyek";
  const userRole = localStorage.getItem('userRole') || "manager";

  let DATA_INPUT = [];
  let processedData = [];
  let sortState = { column: 'tanggal', direction: 'desc' };

  const sidebar = document.querySelector(".sidebar");
  const sidebarToggleBtn = document.querySelector("#btn-sidebar-toggle");
  const logoutBtn = document.getElementById('logoutBtn');
  const shipmentTableBody = document.getElementById('shipmentTableBody');
  const shipmentTableHeader = document.getElementById('shipmentTableHeader');
  const addShipmentBtn = document.getElementById('addShipmentBtn');
  const shipmentModal = document.getElementById('shipmentModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const shipmentForm = document.getElementById('shipmentForm');
  const deleteModal = document.getElementById('deleteModal');
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
  const startDateInput = document.getElementById('startDate');
  const endDateInput = document.getElementById('endDate');
  const filterBtn = document.getElementById('filterBtn');
  const resetFilterBtn = document.getElementById('resetFilterBtn');
  const logoutModal = document.getElementById('logoutModal');
  const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');
  const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
  let dailyChart, recapChart;

  async function fetchShipments() {
      try {
          const response = await fetch(`${backendUrl}/shipments`);
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const result = await response.json();
          if (result.data) {
              DATA_INPUT = result.data;
              refreshUI();
          }
      } catch (error) {
          console.error("Gagal mengambil data shipment:", error);
          alert("Gagal terhubung ke server untuk mengambil data.");
      }
  }
  
  function renderTable(data) {
    shipmentTableBody.innerHTML = !data.length ? `<tr><td colspan="7" style="text-align:center;">Tidak ada data.</td></tr>` : '';
    data.forEach((item, index) => {
      const row = `<tr><td>${new Date(item.tanggal).toLocaleDateString('id-ID', {day: '2-digit', month: '2-digit', year: 'numeric'})}</td><td>${item.shipment}</td><td>${item.jumlahToko}</td><td>${item.terkirim}</td><td>${item.gagal}</td><td>${item.alasan || '-'}</td><td class="action-icons"><i class='bx bxs-edit edit-btn' data-index="${index}" title="Edit"></i><i class='bx bxs-trash delete-btn' data-index="${index}" title="Hapus"></i></td></tr>`;
      shipmentTableBody.innerHTML += row;
    });
  }

  function refreshUI() {
    processedData = DATA_INPUT.filter(item => item.namaDriver === loggedInUser);
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;
    if (startDate && endDate) {
        processedData = processedData.filter(item => item.tanggal >= startDate && item.tanggal <= endDate);
    }
    processedData.sort((a, b) => {
      const col = sortState.column;
      const dir = sortState.direction === 'asc' ? 1 : -1;
      const valA = a[col];
      const valB = b[col];
      if (col === 'tanggal') return (new Date(valA) - new Date(valB)) * dir;
      else if (typeof valA === 'number') return (valA - valB) * dir;
      else return String(valA).localeCompare(String(valB)) * dir;
    });
    renderTable(processedData); 
    updateCards(processedData); 
    updateCharts(processedData); 
    updateSortIcons();
  }

  function openModal(edit = false, index = null) {
    shipmentForm.reset();
    document.getElementById('modalTitle').textContent = edit ? 'Edit Shipment' : 'Input Shipment Baru';
    document.getElementById('namaDriver').value = loggedInUser;
    if (edit) {
      const item = processedData[index];
      if (!item) return;
      document.getElementById('editIndex').value = item.id; 
      document.getElementById('tanggal').value = item.tanggal;
      document.getElementById('shipment').value = item.shipment;
      document.getElementById('jumlahToko').value = item.jumlahToko;
      document.getElementById('terkirim').value = item.terkirim;
      document.getElementById('alasan').value = item.alasan || "";
    } else {
      document.getElementById('editIndex').value = '';
    }
    handleFormCalculation();
    shipmentModal.classList.remove('hidden');
  }

  function handleFormCalculation() {
    const jumlahToko = parseInt(document.getElementById('jumlahToko').value) || 0;
    let terkirim = parseInt(document.getElementById('terkirim').value) || 0;
    if (terkirim > jumlahToko) terkirim = jumlahToko;
    if (terkirim < 0) terkirim = 0;
    document.getElementById('terkirim').value = terkirim;
    const gagal = jumlahToko - terkirim;
    document.getElementById('gagal').value = gagal;
    const alasanGroup = document.getElementById('alasanGroup');
    const alasanEl = document.getElementById('alasan');
    if (gagal > 0) {
      alasanGroup.classList.remove('hidden');
      alasanEl.required = true;
    } else {
      alasanGroup.classList.add('hidden');
      alasanEl.required = false;
      alasanEl.value = '';
    }
  }

  sidebarToggleBtn.addEventListener("click", () => sidebar.classList.toggle("open"));
  filterBtn.addEventListener('click', refreshUI);
  resetFilterBtn.addEventListener('click', () => { startDateInput.value = ''; endDateInput.value = ''; refreshUI(); });
  shipmentTableHeader.addEventListener('click', (e) => {
    const headerCell = e.target.closest('th');
    if (!headerCell || !headerCell.dataset.column) return;
    const column = headerCell.dataset.column;
    sortState.column === column ? (sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc') : (sortState.column = column, sortState.direction = 'asc');
    refreshUI();
  });
  
  logoutBtn.addEventListener('click', (e) => { e.preventDefault(); logoutModal.classList.remove('hidden'); });
  cancelLogoutBtn.addEventListener('click', () => logoutModal.classList.add('hidden'));
  confirmLogoutBtn.addEventListener('click', () => {
      logoutModal.classList.add('hidden');
      localStorage.clear();
      window.location.href = 'index.html'; // Path ke halaman login
  });

  shipmentForm.addEventListener('input', handleFormCalculation);
  shipmentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!shipmentForm.checkValidity()) { alert('Mohon lengkapi semua field yang wajib diisi.'); return; }
    const formData = {
      namaDriver: loggedInUser,
      tanggal: document.getElementById('tanggal').value,
      shipment: document.getElementById('shipment').value,
      jumlahToko: parseInt(document.getElementById('jumlahToko').value),
      terkirim: parseInt(document.getElementById('terkirim').value),
      gagal: parseInt(document.getElementById('gagal').value),
      alasan: document.getElementById('alasan').value 
    };
    const editId = document.getElementById('editIndex').value;
    let url = `${backendUrl}/shipments`;
    let method = 'POST';
    if (editId) {
        url = `${backendUrl}/shipments/${editId}`;
        method = 'PUT';
    }
    try {
        const response = await fetch(url, { method: method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
        const result = await response.json();
        if (response.ok) {
            shipmentModal.classList.add('hidden');
            fetchShipments();
        } else {
            alert(`Gagal menyimpan: ${result.error}`);
        }
    } catch (error) {
        console.error("Gagal menyimpan shipment:", error);
        alert("Gagal terhubung ke server untuk menyimpan data.");
    }
  });
  
  addShipmentBtn.addEventListener('click', () => openModal());
  closeModalBtn.addEventListener('click', () => shipmentModal.classList.add('hidden'));
  shipmentTableBody.addEventListener('click', (e) => {
    const target = e.target.closest('i');
    if (!target) return;
    const index = parseInt(target.dataset.index);
    if (target.classList.contains('edit-btn')) openModal(true, index);
    if (target.classList.contains('delete-btn')) {
        const item = processedData[index];
        if(item) { deleteModal.dataset.id = item.id; deleteModal.classList.remove('hidden'); }
    }
  });
  
  cancelDeleteBtn.addEventListener('click', () => deleteModal.classList.add('hidden'));
  confirmDeleteBtn.addEventListener('click', async () => {
    const idToDelete = deleteModal.dataset.id;
    try {
        const response = await fetch(`${backendUrl}/shipments/${idToDelete}`, { method: 'DELETE' });
        const result = await response.json();
        if(response.ok) {
            deleteModal.classList.add('hidden');
            fetchShipments();
        } else {
            alert(`Gagal menghapus: ${result.error}`);
        }
    } catch(error) {
        console.error("Gagal menghapus shipment:", error);
        alert("Gagal terhubung ke server untuk menghapus data.");
    }
  });

  document.getElementById('profileName').textContent = loggedInUser;
  document.getElementById('profileRole').textContent = userRole;
  document.getElementById('welcomeSubtitle').textContent = `Selamat datang kembali, ${loggedInUser}!`;
  fetchShipments();

  function updateCards(data){/*...kode minify...*/};
  function updateCharts(data){/*...kode minify...*/};
  function updateSortIcons(){/*...kode minify...*/};
});
