import booleanPointInPolygon from 'https://cdn.jsdelivr.net/npm/@turf/boolean-point-in-polygon@6.5.0/+esm';
import { point } from 'https://cdn.jsdelivr.net/npm/@turf/helpers@6.5.0/+esm';
const scriptURL = 'https://script.google.com/macros/s/AKfycbzWiSWbCodiwpEpnwJRlltQP-m4kGPy8XgVidtD4q5WZUlswFIO0sSnlv0r7B9EIwM/exec';

// Sweet Alert
function notif(judul, ikon, teks) {
    swal.fire({
        title: judul,
        text: teks,
        icon: ikon,
        timer: 3000,
        showConfirmButton: false
    });
}

const tombolFilter = document.querySelector('.btn-submit');
let kosong = document.querySelector('.detail-hidden');
let kueriAll = document.querySelector('.kueri-all');

const usahaHandler = (data) => {
    let hasil = data.slice(0,10);

    if (hasil.length) {
        kosong.classList.add('detail-hidden');
        kueriAll.classList.remove('detail-hidden');

        let idsbr = hasil.map(e => e.idsbr)
        let nmusaha = hasil.map(e => e.nama_usaha)
        let isActive = hasil.map(e => e.status_perusahaan == 'Aktif' ? 'status-aktif' : 'status-not-found')
        let keberadaan = hasil.map(e => e.status_perusahaan)
        let alamat_usaha = hasil.map(e => e.alamat_usaha)
        let nmdesa = hasil.map(e => e.nmdesa)
        let kegiatan_usaha = hasil.map(e => e.kegiatan_usaha)
        let kdkec = hasil.map(e => e.kdkec)
        let kddesa = hasil.map(e => e.kddesa)
        let lat1 = hasil.map(e => e.latitude == '' || e.latitude == null ? '' : e.latitude)
        let lat2 = hasil.map(e => e.longitude == '' || e.longitude == null ? '' : e.longitude)

        let hasilEstablishments = [];

        for (let i = 0; i < hasil.length; i++) {
            hasilEstablishments.push(
                `<div class="filter-container hasil">
             <div class="toggle-icon">▼</div>
    
             <div class="info-usaha">
                <div class="info-item">
                    <span class="uppercase">${nmusaha[i]}</span>
                </div>
                <div class="info-item2">
                    <span class="${isActive[i]}">${keberadaan[i]}</span>
                </div>
                <div class="info-item alamat">
                    <span>${alamat_usaha[i]}</span><span>${nmdesa[i]}</span>
                </div>
                <div class="info-item detail-hidden">
                    <span>Kegiatan Usaha: ${kegiatan_usaha[i]}</span>
                </div>
            </div>
    
            <div class="formWrapper">
                <form action="" method="post">
                    <input type="hidden" name="idsbr" value="${idsbr[i]}">
                    <input type="hidden" name="kdkec" value="${kdkec[i]}">
                    <input type="hidden" name="kddesa" value="${kddesa[i]}">
                    <div class="row">
                        <div class="form-group full-width">
                            <label>Status Perusahaan</label>
                            <select name="hasilgc" required>
                                <option value="">--- Pilih Status ---</option>
                                <option value="3">Ditemukan</option>
                                <option value="4">Tutup</option>
                                <option value="5">Ganda</option>
                                <option value="2">Tidak ditemukan</option>
                            </select>
                        </div>
                    </div>
        
                    <div class="row">
                        <div class="form-group">
                            <label>Latitude</label>
                            <input type="text" name="latitude" value="${lat1[i]}">
                        </div>
                        <div class="form-group">
                            <label>Longitude</label>
                            <input type="text" name="longitude" value="${lat2[i]}">
                        </div>
                        <div class="form-group">
                            <button type="button" class="btn-location" title="Dapatkan koordinat berdasarkan GPS">
                                Dapatkan Lokasi
                            </button>
                        </div>
                    </div>
                    <div class="row">
                        <div class="peta"></div>
                    </div>
                    <button type="submit" class="btn-submit">Simpan Data</button>
                </form>
            </div>
        </div>`
            )
            
        }

        kueriAll.innerHTML = hasilEstablishments.join('');

        // Fungsi Toggle Buka/Tutup Card
        const cards = document.querySelectorAll('.hasil');
        const semuaPeta = document.querySelectorAll('.peta');
        const defaultLat = -8.5369965;
        const defaultLong = 118.4635260;
        let latInput = document.querySelectorAll('input[name="latitude"]');
        let longInput = document.querySelectorAll('input[name="longitude"]');
        let btnLocs = document.querySelectorAll('.btn-location');
        
        cards.forEach((card, index) => {
            const mapContainer = semuaPeta[index];
            const inputLat = latInput[index];
            const inputLng = longInput[index];
            const btnGps = btnLocs[index];

            // Fungsi ini pintar: Kalau marker belum ada dia buat, kalau sudah ada dia geser.
            const addOrMoveMarker = (lat, lng) => {
                // Pastikan peta sudah ada
                if (!mapContainer.mapInstance) return; 
                
                const newLatLng = new L.LatLng(lat, lng);

                // SKENARIO A: Marker SUDAH Ada -> Geser saja
                if (mapContainer.markerInstance) {
                    mapContainer.markerInstance.setLatLng(newLatLng);
                } 
                // SKENARIO B: Marker BELUM Ada -> Buat Baru
                else {
                    const newMarker = L.marker(newLatLng, { draggable: true }).addTo(mapContainer.mapInstance);
                    mapContainer.markerInstance = newMarker; // Simpan ke variable

                    newMarker.on('dragend', (e) => {
                        const pos = newMarker.getLatLng();
                        updateInputFromMarker(pos.lat, pos.lng);
                        mapContainer.mapInstance.panTo(pos);
                    });
                }

                mapContainer.mapInstance.setView(newLatLng, 15);
            };

            const updateInputFromMarker = (lat, lng) => {
                inputLat.value = lat.toFixed(7);
                inputLng.value = lng.toFixed(7);
            };

            // --- 3. UPDATE LOGIKA INPUT MANUAL ---
            const updateMarkerFromInput = () => {
                // Pastikan peta sudah ada
                if (!mapContainer.mapInstance) return;
            
                const latVal = parseFloat(inputLat.value);
                const lngVal = parseFloat(inputLng.value);
            
                // KONDISI A: Input Valid (Angka) -> Tampilkan Marker
                if (!isNaN(latVal) && !isNaN(lngVal)) {
                    const newLatLng = new L.LatLng(latVal, lngVal);
            
                    // Jika marker sudah ada -> Geser
                    if (mapContainer.markerInstance) {
                        mapContainer.markerInstance.setLatLng(newLatLng);
                    } 
                    // Jika marker belum ada -> Buat Baru
                    else {
                        const newMarker = L.marker(newLatLng, { draggable: true }).addTo(mapContainer.mapInstance);
                        mapContainer.markerInstance = newMarker;
            
                        // Pasang event drag pada marker baru
                        newMarker.on('dragend', (e) => {
                            const pos = newMarker.getLatLng();
                            inputLat.value = pos.lat.toFixed(7);
                            inputLng.value = pos.lng.toFixed(7);
                            mapContainer.mapInstance.panTo(pos);
                        });
                    }
                    
                    // Geser pandangan peta ke marker
                    mapContainer.mapInstance.panTo(newLatLng);
                } 
                
                // KONDISI B: Input Kosong/Invalid -> HAPUS MARKER
                else {
                    if (mapContainer.markerInstance) {
                        mapContainer.markerInstance.remove(); // <--- INI PERINTAH HAPUSNYA
                        mapContainer.markerInstance = null;   // Reset variabel jadi kosong
                    }
                }
            }

            btnGps.addEventListener('click', () => {
                const textAsli = btnGps.textContent;
                btnGps.textContent = "Mencari...";

                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            const lat = position.coords.latitude;
                            const lng = position.coords.longitude;

                            // Isi Input
                            updateInputFromMarker(lat, lng);

                            // Cek apakah peta sedang terbuka?
                            if (mapContainer.mapInstance) {
                                addOrMoveMarker(lat, lng);
                            }

                            btnGps.textContent = textAsli;
                        },
                        (error) => {
                            notif("GPS belum aktif", "error", error.message);
                            btnGps.textContent = textAsli;
                        }
                    );
                } else {
                    notif("Browser tidak mendukung Geolocation", "error", "");
                    btnGps.textContent = textAsli;
                }
            });

            // Pasang Event Listener pada Input (Live Update)
            inputLat.addEventListener('input', () => {
                if (!inputLat.value.includes(', ')) {updateMarkerFromInput()}
            });
            inputLng.addEventListener('input', updateMarkerFromInput);

            inputLat.addEventListener('change', () => {
                if (inputLat.value.includes(', ')) {
                    let koords = inputLat.value.split(', ');

                    // Set input di lat long
                    inputLat.value = koords[0];
                    inputLng.value = koords[1];

                    // Geser marker dan petanya
                    updateMarkerFromInput();
                }
            });
            inputLng.addEventListener('change', updateMarkerFromInput);
            
            
            card.addEventListener('click', (e) => {
                if (e.target.closest('.formWrapper') || e.target.closest('.btn-location')) return;
                card.classList.toggle('expanded');

                // Hanya render peta jika card dalam posisi TERBUKA
                if (card.classList.contains('expanded')) {
                    setTimeout(() => {
                        if (!mapContainer || !card.classList.contains('expanded')) return;
                    
                        // Cek apakah ada data dari database (Input value)
                        const latVal = parseFloat(inputLat.value);
                        const lngVal = parseFloat(inputLng.value);
                        const hasData = !isNaN(latVal) && !isNaN(lngVal);
                    
                        // Tentukan Pusat Peta: Kalau ada data pakai data, kalau kosong pakai Default Dompu
                        const initCenter = hasData ? [latVal, lngVal] : [defaultLat, defaultLong];
                    
                        // --- SKENARIO A: Init Peta Pertama Kali ---
                        if (!mapContainer._leaflet_id) {
                            const map = L.map(mapContainer).setView(initCenter, 15);
                    
                            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                                attribution: '&copy; OpenStreetMap contributors'
                            }).addTo(map);
                    
                            mapContainer.mapInstance = map;
                    
                            // PENTING: Panggil fungsi update ini segera setelah peta jadi.
                            // Fungsi ini otomatis akan mengecek input:
                            // - Kalau ada isi (dari DB) -> Marker Muncul.
                            // - Kalau kosong -> Marker Tidak Muncul (Peta bersih).
                            updateMarkerFromInput(); 
                    
                            // Event Klik Peta (Memunculkan Marker dari kosong)
                            map.on('click', (e) => {
                                const { lat, lng } = e.latlng;
                                
                                // Isi input dulu
                                inputLat.value = lat.toFixed(7);
                                inputLng.value = lng.toFixed(7);
                                
                                // Lalu panggil fungsi update untuk memunculkan marker
                                updateMarkerFromInput();
                            });
                            
                            map.invalidateSize();
                        } 
                        
                        // --- SKENARIO B: Peta Sudah Ada (Re-open) ---
                        else if (mapContainer.mapInstance) {
                            mapContainer.mapInstance.invalidateSize();
                            
                            // Sinkronisasi ulang (Siapa tahu user menghapus input saat card tertutup)
                            updateMarkerFromInput(); 
                        }
                    }, 400);
                }
            });
        });

        // Fungsi untuk mengirim form ke google sheet
        let gcForms = document.querySelectorAll('form');
        let hasilGc = document.querySelectorAll('select[name="hasilgc"]');
        let b = document.querySelectorAll('.btn-submit');

        gcForms.forEach((form, i) => {
            form.addEventListener('submit', (e) => {
                e.preventDefault();

                // Validasi: ditemukan tapi gak ada koordinat
                if (hasilGc[i].value == 3 && (latInput[i].value == '' || longInput[i].value == '')) {
                    notif('Gagal mengirim data', 'error', 'Jika status usahanya ditemukan harus ada koordinat');
                } else if (hasilGc[i].value == 3 && latInput[i].value != '' && longInput[i].value != '') {
                    // Ada lokasi tapi beda desa
                    fetch('https://raw.githubusercontent.com/alwi0324/belanja/refs/heads/main/desa_non%20sls_turf.geojson')
                        .then(res => res.json())
                        .then(dataSf => {
                            let poly = dataSf.features;
                            let targetDesa = poly.find(p => p.properties.iddesa == `5205${hasil[i].kdkec}${hasil[i].kddesa}`);

                            let pinPoint = point([longInput[i].value, latInput[i].value]);
                            let status = booleanPointInPolygon(pinPoint, targetDesa);

                            if (!status) {
                                Swal.fire({
                                        title: 'Mengirim Data...',
                                        text: 'Mohon tunggu sebentar',
                                        icon: 'info',
                                        timer: 2500,
                                        timerProgressBar: true,
                                        showConfirmButton: false,
                                        allowOutsideClick: false,
                                        didOpen: () => Swal.showLoading()
                                    }
                                ).then((result) => {
                                    // Tampilkan Pop-up Sukses setelah timer habis
                                    if (result.dismiss === Swal.DismissReason.timer) {
                                        notif('Lokasi tagging salah', 'error', `Lokasi usaha ini ada di ${targetDesa.properties.nmdesa.charAt(0).toUpperCase()}${targetDesa.properties.nmdesa.toLowerCase().slice(1)}`);
                                    }
                                });
                            }
                        })
                } else {
                    // Lokasinya sesuai
                    fetch(scriptURL, { method: 'POST', body: new FormData(form) })
                        .then(response => {
                            if (!response.ok) throw new Error('Network response was not ok'); // Pastikan response oke sebelum parsing JSON
                            return response.json();
                        })
                        .then(data => {
                            // Sembunyikan tombol kirim SEGERA setelah data sukses terkirim
                            b[i + 1].style.display = 'none';
                                
                            Swal.fire({
                                title: 'Mengirim Data...',
                                text: 'Mohon tunggu sebentar',
                                icon: 'info',
                                timer: 2000,
                                timerProgressBar: true,
                                showConfirmButton: false,
                                allowOutsideClick: false,
                                didOpen: () => Swal.showLoading()
                            }).
                        then((result) => {
                            if (result.dismiss === Swal.DismissReason.timer) {
                                notif('Berhasil', 'success', 'Usaha ini berhasil di-ground check');
                                filterUsaha();
                            }
                        })
                        })
                        .catch(error => notif('Groundcheck gagal', 'error', 'Silakan periksa jaringan Anda'));
                }
            });
        });
    }

}

// Untuk mengisi dropdown Desa
kecamatan.addEventListener('change', () => {
    let optDesa = [`<option value="">--- Semua ---</option>`];
    let kdDesa, listDesa;
    let kdKec = kecamatan.value;

    if (kdKec == "") {
        desa.disabled = true;
        desa.innerHTML = "";
        nama_usaha.readOnly = true;
        status_usaha.disabled = true;
    } else {
        desa.disabled = false;
        nama_usaha.readOnly = false;
        status_usaha.disabled = false;
        switch (kdKec) {
            case "010":
                kdDesa = ["001","002","003","004","005","006","007","008"];
                listDesa = ["HU\'U", "DAHA", "RASABOU", "CEMPI JAYA", "ADU", "SAWE", "JALA", "MARADA"];
                break;
            case "011":
                kdDesa = ["001","002","003","004","005","006"];
                listDesa = ["JAMBU", "LUNE", "WOKO", "RANGGO", "LEPADI", "TEMBA LAE"];
                break;
            case "020":
                kdDesa = ["001","002","004","005","006","007","008","009","010","011","012","013","014","015","016"];
                listDesa = ["MBAWI", "DOREBARA", "KANDAI SATU", "KARIJAWA", "POTU", "BADA",
                    "BALI", "DOROTANGGA", "OO", "KATUA", "KARAMABURA", "KAREKE", "MANGGE NAE",
                    "MANGGE ASI", "SORISAKOLO"
                ];
                break;
            case "030":
                kdDesa = ["001","002","003","004","005","006","007","008","009","010","011","012","013","014"];
                listDesa = ["RIWO", "MADAPRAMA", "BARA", "NOWA", "WAWONDURU", "MATUA",
                    "MONTABARU", "KANDAI DUA", "SIMPASAI", "SANEO", "MUMBU", "BAKAJAYA",
                    "RABABAKA","SERAKAPI"
                ];
                break;
            case "040":
                kdDesa = ["001","002","003","004","005","006"];
                listDesa = ["MBUJU", "TAROPO", "KRAMAT", "MALAJU", "LASI", "KIWU"];
                break;
            case "050":
                kdDesa = ["009","010","011","012","013","014","015","016"];
                listDesa = ["TA\'A", "KEMPO", "SORO", "KONTE", "SO NGGAJAH",
                    "TOLO KALO", "DORO KOBO", "SORO BARAT"];
                break;
            case "051":
                kdDesa = ["001","002","003","004","005","006","007","008","009","010","011","012"];
                listDesa = ["KWANGKO", "NANGATUMPU", "BANGGO", "SORIUTU", "DOROMELO", "LANCI JAYA",
                    "NUSA JAYA", "SUKA DAMAI", "TANJU", "KAMPAS MECI", "TEKASIRE", "ANAMINA"];
                break;
            case "060":
                kdDesa = ["001","002","003","004","005","006","007","008","009","010","011","012"];
                listDesa = ["DOROPETI", "BERINGIN JAYA", "PEKAT", "SORINOMO", "TAMBORA", "KADINDI",
                    "NANGAMIRO", "CALABAI", "NANGAKARA", "KADINDI BARAT", "SORI TATANGA", "KAROMBO"];
                break;
            default:
                break;
        }

        for (let i = 0; i < kdDesa.length; i++) {
            optDesa.push(`<option value="${kdDesa[i]}">${listDesa[i]}</option>`);
        }

        desa.innerHTML = optDesa.join("");
    }

});

function filterUsaha() {
    let kueriDasar = `SELECT A,B,C,D,E,F,G,H,I,J,K,L,M,N,O WHERE F = '${kecamatan.value}' AND A = ''`;

    if (kecamatan.value == "") {
        notif("Kecamatan belum dipilih!", "info", "Mohon pilih kecamatan terlebih dahulu");
    } else {
        // Ketiganya kosong
        if (desa.value == '' && nama_usaha.value == '' && status_usaha.value == '') {
            getSheetData({
                query: kueriDasar,
                callback: usahaHandler
            });
            
        } else if (desa.value != '' && nama_usaha.value == '' && status_usaha.value == '') {
            // Desanya dipilih
            getSheetData({
                query: `${kueriDasar} AND G = '${desa.value}'`,
                callback: usahaHandler
            });
        } else if (desa.value == '' && nama_usaha.value != '' && status_usaha.value == '') {
            // Nama usahanya (atau IDSBR/kegiatan usaha) terisi
            getSheetData({
                query: `${kueriDasar} AND (B LIKE '%${nama_usaha.value}%' OR C LIKE '%${nama_usaha.value}%' OR C LIKE '%${nama_usaha.value.toUpperCase()}%' OR C LIKE '%${nama_usaha.value.charAt(0).toUpperCase()}${nama_usaha.value.slice(1)}%' OR J LIKE '%${nama_usaha.value}%' OR J LIKE '%${nama_usaha.value.toUpperCase()}%' OR J LIKE '%${nama_usaha.value.charAt(0).toUpperCase()}${nama_usaha.value.slice(1)}%')`,
                callback: usahaHandler
            });
        } else if (desa.value == '' && nama_usaha.value == '' && status_usaha.value != '') {
            // Status usahanya terisi
            if (status_usaha.value != 'Lainnya') {
                getSheetData({
                    query: `${kueriDasar} AND K = '${status_usaha.value}'`,
                    callback: usahaHandler
                });
            } else {
                getSheetData({
                    query: `${kueriDasar} AND (K = 'Tutup Sementara' OR K = 'Aktif Nonrespons' OR K = 'Alih Usaha' OR K = 'Belum Berproduksi')`,
                    callback: usahaHandler
                });
            }
        } else if (desa.value != '' && nama_usaha.value != '' && status_usaha.value == '') {
            // Desa dan nama usaha/IDSBR terisi
            getSheetData({
                query: `${kueriDasar} AND G = '${desa.value}' AND (B LIKE '%${nama_usaha.value}%' OR C LIKE '%${nama_usaha.value}%' OR C LIKE '%${nama_usaha.value.toUpperCase()}%' OR C LIKE '%${nama_usaha.value.charAt(0).toUpperCase()}${nama_usaha.value.slice(1)}%' OR J LIKE '%${nama_usaha.value}%' OR J LIKE '%${nama_usaha.value.toUpperCase()}%' OR J LIKE '%${nama_usaha.value.charAt(0).toUpperCase()}${nama_usaha.value.slice(1)}%')`,
                callback: usahaHandler
            });
        } else if (desa.value != '' && nama_usaha.value == '' && status_usaha.value != '') {
            // Desa dan status usaha terisi
            if (status_usaha.value != 'Lainnya') {
                getSheetData({
                    query: `${kueriDasar} AND G = '${desa.value}' AND K = '${status_usaha.value}'`,
                    callback: usahaHandler
                });
            } else {
                getSheetData({
                    query: `${kueriDasar} AND G = '${desa.value}' AND (K = 'Tutup Sementara' OR K = 'Aktif Nonrespons' OR K = 'Alih Usaha' OR K = 'Belum Berproduksi')`,
                    callback: usahaHandler
                });
            }
        } else if (desa.value == '' && nama_usaha.value != '' && status_usaha.value != '') {
            // Nama usaha/IDSBR dan status usaha terisi
            if (status_usaha.value != 'Lainnya') {
                getSheetData({
                    query: `${kueriDasar} AND (B LIKE '%${nama_usaha.value}%' OR C LIKE '%${nama_usaha.value}%' OR C LIKE '%${nama_usaha.value.toUpperCase()}%' OR C LIKE '%${nama_usaha.value.charAt(0).toUpperCase()}${nama_usaha.value.slice(1)}%' OR J LIKE '%${nama_usaha.value}%' OR J LIKE '%${nama_usaha.value.toUpperCase()}%' OR J LIKE '%${nama_usaha.value.charAt(0).toUpperCase()}${nama_usaha.value.slice(1)}%') AND K = '${status_usaha.value}'`,
                    callback: usahaHandler
                });
            } else {
                getSheetData({
                    query: `${kueriDasar} AND (B LIKE '%${nama_usaha.value}%' OR C LIKE '%${nama_usaha.value}%' OR C LIKE '%${nama_usaha.value.toUpperCase()}%' OR C LIKE '%${nama_usaha.value.charAt(0).toUpperCase()}${nama_usaha.value.slice(1)}%' OR J LIKE '%${nama_usaha.value}%' OR J LIKE '%${nama_usaha.value.toUpperCase()}%' OR J LIKE '%${nama_usaha.value.charAt(0).toUpperCase()}${nama_usaha.value.slice(1)}%') AND (K = 'Tutup Sementara' OR K = 'Aktif Nonrespons' OR K = 'Alih Usaha' OR K = 'Belum Berproduksi')`,
                    callback: usahaHandler
                });
            }
            
        } else {
            // Semuanya terisi
            if (status_usaha.value != 'Lainnya') {
                getSheetData({
                    query: `${kueriDasar} AND G = '${desa.value}' AND (B LIKE '%${nama_usaha.value}%' OR C LIKE '%${nama_usaha.value}%' OR C LIKE '%${nama_usaha.value.toUpperCase()}%' OR C LIKE '%${nama_usaha.value.charAt(0).toUpperCase()}${nama_usaha.value.slice(1)}%' OR J LIKE '%${nama_usaha.value}%' OR J LIKE '%${nama_usaha.value.toUpperCase()}%' OR J LIKE '%${nama_usaha.value.charAt(0).toUpperCase()}${nama_usaha.value.slice(1)}%') AND K = '${status_usaha.value}'`,
                    callback: usahaHandler
                });
            } else {
                getSheetData({
                    query: `${kueriDasar} AND G = '${desa.value}' AND (B LIKE '%${nama_usaha.value}%' OR C LIKE '%${nama_usaha.value}%' OR C LIKE '%${nama_usaha.value.toUpperCase()}%' OR C LIKE '%${nama_usaha.value.charAt(0).toUpperCase()}${nama_usaha.value.slice(1)}%' OR J LIKE '%${nama_usaha.value}%' OR J LIKE '%${nama_usaha.value.toUpperCase()}%' OR J LIKE '%${nama_usaha.value.charAt(0).toUpperCase()}${nama_usaha.value.slice(1)}%') AND (K = 'Tutup Sementara' OR K = 'Aktif Nonrespons' OR K = 'Alih Usaha' OR K = 'Belum Berproduksi')`,
                    callback: usahaHandler
                });
            }
        }
    }
}

tombolFilter.addEventListener('click', () => {
    filterUsaha();
});



