document.addEventListener('DOMContentLoaded', () => {
  // --- PENDAFTARAN PLUGIN CHART SECARA GLOBAL ---
  Chart.register(ChartDataLabels);

  // --- Variabel Data & Pengguna ---
  const loggedInUser = localStorage.getItem('loggedInUser') || "Manajer Proyek";
  const userRole = localStorage.getItem('userRole') || "manager";

  // --- UPDATE UI DENGAN INFO PENGGUNA ---
  document.getElementById('profileName').textContent = loggedInUser;
  document.getElementById('profileRole').textContent = userRole;
  document.getElementById('welcomeSubtitle').textContent = `Selamat datang kembali, ${loggedInUser}!`;
  
  // --- Variabel State Aplikasi ---
  let DATA_INPUT = []; // Ini akan menampung data asli dari server
  let processedData = []; // Ini akan menampung data yang sudah difilter/disortir untuk ditampilkan
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
  async function fetchShipments() {
      try {
          // Inilah bagian yang terhubung ke server
          const response = await fetch('https://stress-project-omega.vercel.app/api/shipments');
          const result = await response.json();
          if (result.data) {
              DATA_INPUT = result.data;
              refreshUI();
          }
      } catch (error) {
          console.error("Gagal mengambil data shipment:", error);
          alert("Gagal terhubung ke server untuk mengambil data. Pastikan server backend sudah berjalan.");
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
      if (col === 'tanggal') { return (new Date(valA) - new Date(valB)) * dir; } 
      else if (typeof valA === 'number') { return (valA - valB) * dir; } 
      else { return String(valA).localeCompare(String(valB)) * dir; }
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

  // --- EVENT LISTENERS ---
  sidebarToggleBtn.addEventListener("click", () => sidebar.classList.toggle("open"));
  
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
    let url = 'https://stress-project-omega.vercel.app/api/shipments';
    let method = 'POST';

    if (editId) {
        url = `https://stress-project-omega.vercel.app/api/shipments/${editId}`;
        method = 'PUT';
    }

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        const result = await response.json();
        if (response.ok) {
            closeModal();
            fetchShipments();
        } else {
            alert(`Gagal menyimpan: ${result.error}`);
        }
    } catch (error) {
        console.error("Gagal menyimpan shipment:", error);
        alert("Gagal terhubung ke server untuk menyimpan data.");
    }
  });

  // (Sisa event listener & fungsi lainnya tidak berubah)
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
  confirmLogoutBtn.addEventListener('click', () => { logoutModal.classList.add('hidden'); localStorage.clear(); window.location.href = '../login_page/login.html'; });
  shipmentForm.addEventListener('input', handleFormCalculation);
  addShipmentBtn.addEventListener('click', () => openModal());
  closeModalBtn.addEventListener('click', () => shipmentModal.classList.add('hidden'));
  shipmentTableBody.addEventListener('click', (e) => {
    const target = e.target.closest('i');
    if (!target) return;
    const index = parseInt(target.dataset.index);
    if (target.classList.contains('edit-btn')) { openModal(true, index); }
    if (target.classList.contains('delete-btn')) { const item = processedData[index]; if(item) { deleteModal.dataset.id = item.id; deleteModal.classList.remove('hidden'); } }
  });
  cancelDeleteBtn.addEventListener('click', () => deleteModal.classList.add('hidden'));
  confirmDeleteBtn.addEventListener('click', (e) => { console.log("Menghapus item dengan ID:", deleteModal.dataset.id); deleteModal.classList.add('hidden'); });
  
  // --- INISIALISASI ---
  fetchShipments();

  // --- SISA FUNGSI (TIDAK BERUBAH) ---
  function updateCards(data){document.getElementById('totalHk').textContent=new Set(data.map(d=>d.tanggal)).size;document.getElementById('totalDp').textContent=data.reduce((a,b)=>a+b.jumlahToko,0);document.getElementById('totalTerkirim').textContent=data.reduce((a,b)=>a+b.terkirim,0);document.getElementById('totalGagal').textContent=data.reduce((s,i)=>s+i.gagal,0)}
  function updateCharts(data){const a={};[...data].sort((c,d)=>new Date(c.tanggal)-new Date(d.tanggal)).forEach(c=>{const d=new Date(c.tanggal).toLocaleDateString("id-ID",{day:"2-digit",month:"short"});a[d]||(a[d]={terkirim:0,gagal:0}),a[d].terkirim+=c.terkirim,a[d].gagal+=c.gagal});const b=Object.keys(a),e=[{label:"Terkirim",data:b.map(c=>a[c].terkirim),backgroundColor:"#00c9a7"},{label:"Gagal",data:b.map(c=>a[c].gagal),backgroundColor:"#ff5e5e"}];dailyChart&&dailyChart.destroy(),dailyChart=new Chart(document.getElementById("dailyPerformanceChart"),{type:"bar",data:{labels:b,datasets:e},options:{responsive:!0,plugins:{datalabels:{display:!1},legend:{labels:{color:"#2c3e50"}}},scales:{x:{stacked:!0,ticks:{color:"#2c3e50"},grid:{color:"rgba(0,0,0,0.05)"}},y:{stacked:!0,ticks:{color:"#2c3e50"},beginAtZero:!0,grid:{color:"rgba(0,0,0,0.05)"}}}}});const c=[data.reduce((d,f)=>d+f.terkirim,0),data.reduce((d,f)=>d+f.gagal,0)];recapChart&&recapChart.destroy(),recapChart=new Chart(document.getElementById("recapPerformanceChart"),{type:"pie",data:{labels:["Terkirim","Gagal"],datasets:[{data:c,backgroundColor:["#00c9a7","#ff5e5e"],borderColor:"rgba(255, 255, 255, 0.5)",borderWidth:4}]},options:{responsive:!0,plugins:{legend:{position:"bottom",labels:{color:"#2c3e50"}},datalabels:{formatter:(d,f)=>{const g=f.chart.data.datasets[0].data.reduce((h,k)=>h+k,0),l=d/g*100;return l<5?"":l.toFixed(1)+"%"},color:"#fff",font:{weight:"bold",size:14}}}}})}
  function updateSortIcons(){document.querySelectorAll("#shipmentTableHeader th[data-column]").forEach(a=>{const b=a.querySelector("i");b.className="bx bx-sort",a.dataset.column===sortState.column&&(b.className="asc"===sortState.direction?"bx bx-sort-up":"bx bx-sort-down")})}
  function handleFormCalculation(){const a=parseInt(document.getElementById("jumlahToko").value)||0;let b=parseInt(document.getElementById("terkirim").value)||0;b>a&&(b=a,document.getElementById("terkirim").value=b),b<0&&(b=0,document.getElementById("terkirim").value=0);const c=a-b;document.getElementById("gagal").value=c;const d=document.getElementById("alasanGroup"),e=document.getElementById("alasan");c>0?(d.classList.remove("hidden"),e.required=!0):(d.classList.add("hidden"),e.required=!1,e.value="")}
});