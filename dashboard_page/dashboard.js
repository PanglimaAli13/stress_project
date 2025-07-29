document.addEventListener('DOMContentLoaded', () => {
  // --- PENDAFTARAN PLUGIN CHART SECARA GLOBAL ---
  // Daftarkan plugin datalabels sekali saja di awal.
  Chart.register(ChartDataLabels);

  // --- Variabel Data & Pengguna ---
  const loggedInUser = "Manajer Proyek";
  let DATA_INPUT = [
    { submitDate: '2023-10-26T10:00:00Z', namaDriver: 'Manajer Proyek', tanggal: '2023-10-26', shipment: '1234567890', jumlahToko: 20, terkirim: 18, gagal: 2, alasan: 'Toko tutup lebih awal.' },
    { submitDate: '2023-10-27T10:05:00Z', namaDriver: 'Manajer Proyek', tanggal: '2023-10-27', shipment: '0987654321', jumlahToko: 25, terkirim: 25, gagal: 0, alasan: '' },
    { submitDate: '2023-10-28T09:30:00Z', namaDriver: 'Manajer Proyek', tanggal: '2023-10-28', shipment: '1122334455', jumlahToko: 15, terkirim: 12, gagal: 3, alasan: 'Alamat tidak ditemukan.' },
    { submitDate: '2023-10-28T09:35:00Z', namaDriver: 'Pengembang', tanggal: '2023-10-28', shipment: '5566778899', jumlahToko: 30, terkirim: 30, gagal: 0, alasan: '' },
  ];

  // --- Variabel State Aplikasi ---
  let sortState = { column: 'tanggal', direction: 'desc' };

  // --- Variabel Elemen DOM ---
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

  // Variabel Grafik
  let dailyChart, recapChart;

  // --- FUNGSI ---
  function renderTable(data) {
    shipmentTableBody.innerHTML = !data.length ? `<tr><td colspan="7" style="text-align:center;">Tidak ada data.</td></tr>` : '';
    data.forEach((item) => {
      const originalIndex = DATA_INPUT.indexOf(item);
      const row = `<tr><td>${new Date(item.tanggal).toLocaleDateString('id-ID', {day: '2-digit', month: '2-digit', year: 'numeric'})}</td><td>${item.shipment}</td><td>${item.jumlahToko}</td><td>${item.terkirim}</td><td>${item.gagal}</td><td>${item.alasan || '-'}</td><td class="action-icons"><i class='bx bxs-edit edit-btn' data-index="${originalIndex}" title="Edit"></i><i class='bx bxs-trash delete-btn' data-index="${originalIndex}" title="Hapus"></i></td></tr>`;
      shipmentTableBody.innerHTML += row;
    });
  }
  function updateCards(data) {
    document.getElementById('totalHk').textContent = new Set(data.map(d => d.tanggal)).size;
    document.getElementById('totalDp').textContent = data.reduce((a, b) => a + b.jumlahToko, 0);
    document.getElementById('totalTerkirim').textContent = data.reduce((a, b) => a + b.terkirim, 0);
    document.getElementById('totalGagal').textContent = data.reduce((sum, item) => sum + item.gagal, 0);
  }

  function updateCharts(data) {
    // Bar Chart (Performa Harian)
    const dailyData = {};
    [...data].sort((a,b) => new Date(a.tanggal) - new Date(b.tanggal)).forEach(item => {
      const label = new Date(item.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
      if (!dailyData[label]) dailyData[label] = { terkirim: 0, gagal: 0 };
      dailyData[label].terkirim += item.terkirim;
      dailyData[label].gagal += item.gagal;
    });
    const labels = Object.keys(dailyData);
    const datasets = [ { label: 'Terkirim', data: labels.map(l => dailyData[l].terkirim), backgroundColor: '#00c9a7' }, { label: 'Gagal', data: labels.map(l => dailyData[l].gagal), backgroundColor: '#ff5e5e' }, ];
    if (dailyChart) dailyChart.destroy();
    dailyChart = new Chart(document.getElementById('dailyPerformanceChart'), { type: 'bar', data: { labels, datasets }, options: { responsive: true, plugins: { datalabels: { display: false }, legend: { labels: { color: '#2c3e50' } } }, scales: { x: { stacked: true, ticks: { color: '#2c3e50' }, grid: { color: 'rgba(0,0,0,0.05)' } }, y: { stacked: true, ticks: { color: '#2c3e50' }, beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } } } } });
    
    // Pie Chart (Rekap Performa)
    const totalTerkirim = data.reduce((s, i) => s + i.terkirim, 0);
    const totalGagal = data.reduce((s, i) => s + i.gagal, 0);
    const pieData = [totalTerkirim, totalGagal];

    if (recapChart) recapChart.destroy();
    recapChart = new Chart(document.getElementById('recapPerformanceChart'), { 
      type: 'pie', 
      data: { 
        labels: ['Terkirim', 'Gagal'], 
        datasets: [{ 
          data: pieData, 
          backgroundColor: ['#00c9a7', '#ff5e5e'], 
          borderColor: 'rgba(255, 255, 255, 0.5)', 
          borderWidth: 4 
        }] 
      }, 
      options: { 
        responsive: true, 
        plugins: { 
          legend: { 
            position: 'bottom', 
            labels: { color: '#2c3e50' } 
          },
          // KONFIGURASI BARU UNTUK PERSENTASE
          datalabels: {
            formatter: (value, ctx) => {
              const total = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
              const percentage = (value / total) * 100;
              if (percentage < 5) return ''; // Sembunyikan jika terlalu kecil
              return percentage.toFixed(1) + "%";
            },
            color: '#fff',
            font: {
              weight: 'bold',
              size: 14,
            }
          }
        } 
      } 
    });
  }

  function updateSortIcons() {
    document.querySelectorAll('#shipmentTableHeader th[data-column]').forEach(th => {
        const icon = th.querySelector('i');
        icon.className = 'bx bx-sort';
        if (th.dataset.column === sortState.column) { icon.className = sortState.direction === 'asc' ? 'bx bx-sort-up' : 'bx bx-sort-down'; }
    });
  }
  function refreshUI() {
    let processedData = DATA_INPUT.filter(item => item.namaDriver === loggedInUser);
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;
    if (startDate && endDate) { processedData = processedData.filter(item => item.tanggal >= startDate && item.tanggal <= endDate); }
    processedData.sort((a, b) => {
      const col = sortState.column;
      const dir = sortState.direction === 'asc' ? 1 : -1;
      const valA = a[col];
      const valB = b[col];
      if (col === 'tanggal') { return (new Date(valA) - new Date(valB)) * dir; } 
      else if (typeof valA === 'number') { return (valA - valB) * dir; } 
      else { return String(valA).localeCompare(String(valB)) * dir; }
    });
    renderTable(processedData); updateCards(processedData); updateCharts(processedData); updateSortIcons();
  }
  function openModal(edit = false, index = null) {
    shipmentForm.reset();
    document.getElementById('modalTitle').textContent = edit ? 'Edit Shipment' : 'Input Shipment Baru';
    document.getElementById('editIndex').value = edit ? index : '';
    document.getElementById('namaDriver').value = loggedInUser;
    handleFormCalculation();
    if (edit) {
      const item = DATA_INPUT[index];
      if (!item) return;
      document.getElementById('tanggal').value = item.tanggal;
      document.getElementById('shipment').value = item.shipment;
      document.getElementById('jumlahToko').value = item.jumlahToko;
      document.getElementById('terkirim').value = item.terkirim;
      document.getElementById('alasan').value = item.alasan || "";
      handleFormCalculation(); 
    }
    shipmentModal.classList.remove('hidden');
  }
  function closeModal() { shipmentModal.classList.add('hidden'); }
  function handleFormCalculation() {
    const jumlahToko = parseInt(document.getElementById('jumlahToko').value) || 0;
    let terkirim = parseInt(document.getElementById('terkirim').value) || 0;
    if (terkirim > jumlahToko) { terkirim = jumlahToko; document.getElementById('terkirim').value = terkirim; }
    if (terkirim < 0) { terkirim = 0; document.getElementById('terkirim').value = terkirim; }
    const gagal = jumlahToko - terkirim;
    document.getElementById('gagal').value = gagal;
    const alasanGroup = document.getElementById('alasanGroup');
    const alasanEl = document.getElementById('alasan');
    if (gagal > 0) { alasanGroup.classList.remove('hidden'); alasanEl.required = true; } 
    else { alasanGroup.classList.add('hidden'); alasanEl.required = false; alasanEl.value = ''; }
  }

  // --- EVENT LISTENERS ---
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
  cancelLogoutBtn.addEventListener('click', () => { logoutModal.classList.add('hidden'); });
  confirmLogoutBtn.addEventListener('click', () => { alert('Anda telah logout.'); logoutModal.classList.add('hidden'); });

  shipmentForm.addEventListener('input', handleFormCalculation);
  shipmentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!shipmentForm.checkValidity()) { alert('Mohon lengkapi semua field yang wajib diisi.'); return; }
    const formData = { submitDate: new Date().toISOString(), namaDriver: loggedInUser, tanggal: document.getElementById('tanggal').value, shipment: document.getElementById('shipment').value, jumlahToko: parseInt(document.getElementById('jumlahToko').value), terkirim: parseInt(document.getElementById('terkirim').value), gagal: parseInt(document.getElementById('gagal').value), alasan: document.getElementById('alasan').value };
    const editIndex = document.getElementById('editIndex').value;
    if (editIndex !== '') { DATA_INPUT[editIndex] = formData; } else { DATA_INPUT.push(formData); }
    closeModal();
    refreshUI();
  });
  addShipmentBtn.addEventListener('click', () => openModal());
  closeModalBtn.addEventListener('click', closeModal);
  shipmentTableBody.addEventListener('click', (e) => {
    const target = e.target.closest('i');
    if (!target) return;
    const index = parseInt(target.dataset.index);
    if (target.classList.contains('edit-btn')) { openModal(true, index); }
    if (target.classList.contains('delete-btn')) { deleteModal.classList.remove('hidden'); confirmDeleteBtn.dataset.index = index; }
  });
  cancelDeleteBtn.addEventListener('click', () => deleteModal.classList.add('hidden'));
  confirmDeleteBtn.addEventListener('click', (e) => {
    const index = parseInt(e.target.dataset.index);
    DATA_INPUT.splice(index, 1);
    deleteModal.classList.add('hidden');
    refreshUI();
  });
  
  // --- INISIALISASI ---
  refreshUI();
});