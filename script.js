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
                    <button type="submit" class="btn-submit">Simpan Data</button>
                </form>
            </div>
        </div>`
            )
            
        }

        kueriAll.innerHTML = hasilEstablishments.join('');

        // Fungsi Toggle Buka/Tutup Card
        const cards = document.querySelectorAll('.hasil');
        cards.forEach((card, index) => {
            // Pasang Event Listener KLIK pada Card
            card.addEventListener('click', (e) => {
                if (e.target.closest('.formWrapper')) return;
                card.classList.toggle('expanded');
            });
        });


        // Untuk tagging
        let btnLocs = document.querySelectorAll('.btn-location');
        let latInput = document.querySelectorAll('input[name="latitude"]');
        let longInput = document.querySelectorAll('input[name="longitude"]');

        btnLocs.forEach((b, i) => {
            b.addEventListener('click', () => {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                    const { latitude, longitude } = position.coords;
                    latInput[i].value = latitude.toFixed(7);
                    longInput[i].value = longitude.toFixed(7);
                    },
                    (error) => {
                    notif("GPS belum aktif","error",error.message);
                    }
                );

            });
        });

        // Pisahkan latitude dan longitude saat copas dari gmaps
        latInput.forEach((lat, i) => {
            lat.addEventListener('change', () => {
                if (lat.value.includes(',')) {
                    let koords = lat.value.split(', ');

                    // Set input di lat long
                    lat.value = koords[0];
                    longInput[i].value = koords[1];
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
                    // Lokasinya gak pas
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
                                    didOpen: () => {
                                    Swal.showLoading(); // Menampilkan spinner loading
                                    }
                                }).then((result) => {
                                    // Tampilkan Pop-up Sukses setelah timer habis
                                    if (result.dismiss === Swal.DismissReason.timer) {
                                        notif('Lokasi salah', 'error', `Lokasi usaha ini ada di: ${targetDesa.properties.nmdesa}`);
                                    }
                                });
                                
                            } else {
                                fetch(scriptURL, { method: 'POST', body: new FormData(form) })
                                    .then(response => response.json())
                                    .then(response => {
                                        b[i+1].style.display = 'none'
                                        Swal.fire({
                                        title: 'Mengirim Data...',
                                        text: 'Mohon tunggu sebentar',
                                        icon: 'info',
                                        timer: 2500,
                                        timerProgressBar: true,
                                        showConfirmButton: false,
                                        allowOutsideClick: false,
                                        didOpen: () => {
                                        Swal.showLoading(); // Menampilkan spinner loading
                                    }
                                }).then((result) => {
                                    // Tampilkan Pop-up Sukses setelah timer habis
                                    if (result.dismiss === Swal.DismissReason.timer) {
                                        notif('Berhasil', 'success', 'Usaha ini berhasil di-ground check');
                                        filterUsaha();
                                    }
                                });
                                    })
                                    .catch(error => notif('Groundcheck gagal', 'error', 'Silakan periksa jaringan Anda'));
                                }
                                
                            });
                            
                        } else if (hasilGc[i].value != 3 || hasilGc[i].value != '') {
                            // Tutup/Tidak ditemukan/ganda
                            fetch(scriptURL, { method: 'POST', body: new FormData(form) })
                                .then(response => response.json())
                                .then(response => {
                                    b[i+1].style.display = 'none'
                                    Swal.fire({
                                    title: 'Mengirim Data...',
                                    text: 'Mohon tunggu sebentar',
                                    icon: 'info',
                                    timer: 2500,
                                    timerProgressBar: true,
                                    showConfirmButton: false,
                                    allowOutsideClick: false,
                                    didOpen: () => {
                                    Swal.showLoading(); // Menampilkan spinner loading
                                }
                            }).then((result) => {
                                // Tampilkan Pop-up Sukses setelah timer habis
                                if (result.dismiss === Swal.DismissReason.timer) {
                                    notif('Berhasil', 'success', 'Usaha ini berhasil di-ground check');
                                    filterUsaha();
                                }
                            });
                                })
                                .catch(error => notif('Groundcheck gagal', 'error', 'Silakan periksa jaringan Anda'));

                }
            })
        });

    } else {
        kosong.classList.remove('detail-hidden');
        while (kueriAll.firstChild) {
            kueriAll.removeChild(kueriAll.firstChild);
        }
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

// Fungsi untuk mengambil GPS
// function getLocation() {
//     if (navigator.geolocation) {
//         navigator.geolocation.getCurrentPosition(function(position) {
//             lat.value = position.coords.latitude;
//             long.value = position.coords.longitude;
//         }, function(error) {
//             alert("Gagal mendapatkan lokasi. Pastikan GPS aktif.");
//             });
//     } else {
//         alert("Browser tidak mendukung Geolocation.");
//     }
// }

// // Validasi Form
// formUsaha.addEventListener('submit', (e) => {
//     const status = document.getElementById('status').value;
//     const lat = document.getElementById('lat').value;
//     const long = document.getElementById('long').value;

//     if (status === "Ditemukan" && (lat === "" || long === "")) {
//         alert("Kolom Latitude dan Longitude harus diisi jika Usaha ditemukan");
//         e.preventDefault(); // Batalkan submit
//     } else {
//         alert("Data berhasil disimpan!");
//     }
// });

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

