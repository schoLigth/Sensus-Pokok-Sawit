// ==========================
// Saat halaman siap
// ==========================
document.addEventListener("DOMContentLoaded", function () {
    isiTanggalWaktu();
    ambilLokasi();
    loadBlokOptions();
    loadStatusOptions();
    loadKunjunganTable();
});

// ==========================
// 1. Isi tanggal & waktu
// ==========================
function isiTanggalWaktu() {
    const now = new Date();
    document.getElementById("tanggal").value = now.toISOString().split("T")[0];
    document.getElementById("waktu").value = now.toTimeString().split(" ")[0];
}

// ==========================
// 2. Ambil lokasi otomatis
// ==========================
function ambilLokasi() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (pos) {
            let lat = pos.coords.latitude.toFixed(6);
            let lon = pos.coords.longitude.toFixed(6);
            document.getElementById("lokasi").value = `Lat: ${lat}, Lon: ${lon}`;
        });
    }
}

// ==========================
// 3. Blok dropdown
// ==========================
function loadBlokOptions() {
    const pilihan = document.getElementById("pilihan");
    pilihan.innerHTML = `
        <option disabled selected>-- Pilih salah satu --</option>
        <option value="new">+ Tambah Blok Baru</option>
    `;

    let blokList = JSON.parse(localStorage.getItem("blokList")) || [];
    blokList.forEach(b => {
        const opt = document.createElement("option");
        opt.value = b;
        opt.textContent = b;
        pilihan.insertBefore(opt, pilihan.querySelector('option[value="new"]'));
    });
}

document.getElementById("pilihan").addEventListener("change", function () {
    if (this.value === "new") {
        let blokBaru = prompt("Masukkan nama blok baru:");
        if (!blokBaru) return (this.value = "");
        blokBaru = blokBaru.trim();

        let blokList = JSON.parse(localStorage.getItem("blokList")) || [];
        if (!blokList.includes(blokBaru)) {
            blokList.push(blokBaru);
            localStorage.setItem("blokList", JSON.stringify(blokList));
        }
        loadBlokOptions();
        this.value = blokBaru;
    }
});

// ==========================
// 4. Status dropdown
// ==========================
function loadStatusOptions() {
    const statusSelect = document.getElementById("status");
    const savedStatus = JSON.parse(localStorage.getItem("statusList")) || [];

    statusSelect.innerHTML = `
        <option disabled selected>-- Pilih salah satu --</option>
        <option value="Mandor">Mandor</option>
        <option value="Audit">Audit</option>
        <option value="new">+ Tambah Status Baru</option>
    `;

    savedStatus.forEach(item => {
        const option = document.createElement("option");
        option.value = item;
        option.textContent = item;
        statusSelect.insertBefore(option, statusSelect.querySelector('option[value="new"]'));
    });
}

document.addEventListener("change", function (event) {
    if (event.target.id === "status" && event.target.value === "new") {
        let newStatus = prompt("Masukkan nama status baru:");
        if (!newStatus) return (event.target.value = "");
        newStatus = newStatus.trim();

        let saved = JSON.parse(localStorage.getItem("statusList")) || [];
        if (!saved.includes(newStatus)) {
            saved.push(newStatus);
            localStorage.setItem("statusList", JSON.stringify(saved));
        }

        loadStatusOptions();
        document.getElementById("status").value = newStatus;
    }
});

// ==========================
// 5. Submit -> Simpan ke Supabase via Flask
// ==========================
document.getElementById("dataForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const data = {
        nama: document.getElementById("nama").value,
        status: document.getElementById("status").value,
        tanggal: document.getElementById("tanggal").value,
        waktu: document.getElementById("waktu").value,
        lokasi: document.getElementById("lokasi").value,
        blok: document.getElementById("pilihan").value,
    };

    const res = await fetch("/save_kunjungan", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    if (!res.ok) {
        alert("Gagal menyimpan ke database.");
        return;
    }

    // JIKA BERHASIL → PINDAH KE MAPS
    window.location.href = "/maps";

    loadKunjunganTable();

    document.getElementById("dataForm").reset();
    isiTanggalWaktu();
    ambilLokasi();
});

// ==========================
// 6. Load data dari database ke tabel
// ==========================
async function loadKunjunganTable() {
    const res = await fetch("/get_kunjungan");
    const data = await res.json();

    let tbody = document.querySelector("#dataTable tbody");
    tbody.innerHTML = "";

    data.forEach(item => {
        tbody.innerHTML += `
            <tr>
                <td>${item.nama}</td>
                <td>${item.status}</td>
                <td>${item.tanggal}</td>
                <td>${item.waktu}</td>
                <td>${item.lokasi}</td>
                <td>${item.blok}</td>
            </tr>
        `;
    });
    if (res.ok) {
        loadKunjunganTable();
    }
    cekTombolLanjut();
}

// ==========================
// 7. Cek tombol lanjut
// ==========================
function cekTombolLanjut() {
    let rows = document.querySelectorAll("#dataTable tbody tr");
    let btn = document.getElementById("btnNextWrapper");
    btn.style.display = rows.length > 0 ? "block" : "none";
}
