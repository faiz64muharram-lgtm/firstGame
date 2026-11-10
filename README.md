# Sweet Escape — The Secret Garden

## Menjalankan project
1. Ekstrak ZIP.
2. Buka folder `sweet-escape-secret-garden` di VS Code.
3. Buka terminal VS Code lalu jalankan:
   ```bash
   npm install
   npm run dev
   ```
4. Buka alamat localhost yang muncul (biasanya `http://localhost:5173`).

## Memasukkan lagu utama
1. Siapkan file musik milikmu dalam format MP3.
2. Salin file tersebut ke folder `public/audio/`.
3. Ubah nama file menjadi **`your-song.mp3`**.
4. Pastikan susunannya menjadi:
   ```
   sweet-escape-secret-garden/
   ├── public/
   │   └── audio/
   │       └── your-song.mp3
   ├── src/
   ├── index.html
   └── package.json
   ```

### Kalau ingin memakai nama file lain
Buka `index.html`, cari baris:
```html
<audio id="bgMusic" src="/audio/your-song.mp3" loop preload="none"></audio>
```
Ganti `your-song.mp3` sesuai nama file musikmu. Jangan hapus `loop` agar lagu terus berulang.

Musik mulai diputar setelah tombol **MULAI PETUALANGAN** ditekan karena aturan autoplay browser. Tombol ♫ di pojok kanan atas untuk mute/unmute.

## Kontrol
- PC: WASD / tombol panah untuk bergerak, Shift untuk lari, Space untuk lompat.
- Mobile: joystick kiri untuk bergerak, tombol kanan untuk lompat/lari/aksi, geser area kanan layar untuk memutar kamera.
- Dekati objek bercahaya lalu tekan **AKSI**.

## Misi
1. Temukan empat bunga kenangan.
2. Cari kunci gazebo.
3. Temukan surat tersembunyi.
4. Datangi pintu masuk gazebo rahasia.

Collision menggunakan batas area taman dan collider berbentuk lingkaran pada pepohonan, bangku, air mancur, dan kolam. Pergerakan diuji per sumbu agar pemain bisa bergeser di sisi objek, bukan menembusnya.


## Ending rahasia — The Hidden Room
Setelah seluruh enam kenangan ditemukan dan pemain masuk ke gazebo:
- Layar melakukan transisi sinematik menuju ruangan rahasia di bawah gazebo.
- Taman disembunyikan dan ruangan baru ditampilkan dalam scene yang sama.
- NPC 3D **FAIZ GANTENK ♡** menunggu di dalam ruangan.
- Dekati NPC sampai tombol **AKSI** muncul, lalu tekan untuk membuka dialog.
- Lanjutkan dialog sampai tombol **BACA SURAT ♡** muncul.
- Surat khusus untuk Ais tampil dengan efek mesin tik.

Kontrol gerak tetap aktif di ruangan rahasia, tetapi karakter dibatasi oleh dinding dan objek ruangan. NPC juga memiliki jarak interaksi agar karakter tidak saling bertumpuk.
