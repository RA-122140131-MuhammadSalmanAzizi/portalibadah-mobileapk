# Portal Ibadah (Mobile App Version)

Aplikasi Portal Ibadah versi mobile (Android) yang dibangun menggunakan Next.js dan Capacitor.

## Versi History

### Versi 1.0.0
- **Mobile Adaptation**: Konversi dari versi web (https://portalibadah.vercel.app/) menjadi aplikasi mobile native Android.
- **Fitur Utama**:
  - Al-Qur'an Digital (Baca & Audio).
  - Jadwal Sholat Akurat (Otomatis & Manual).
  - Kumpulan Doa Harian.
  - Notifikasi Adzan (Background Alarm).
  - Penyesuaian UI/UX untuk layar mobile.

### Versi 1.1.0
- **New Feature**: Jadwal Sholat Tambahan (Custom Alarm).
  - User dapat menambahkan hingga 5 jadwal alarm custom (misal: Tahajud, Dhuha).
  - Manajemen alarm (Tambah, Hapus, Toggle ON/OFF).
- **Improvements**:
  - Perbaikan format Tanggal Hijriyah (Fixed "Juli" -> "Rajab").
  - Optimasi permission handling untuk Notifikasi & Lokasi.
  - Perbaikan Splash Screen dan App Name.
### Versi 1.2.2
- **Bug Fix**: Perbaikan durasi audio Adzan (Full Duration).
- **Update**: Informasi versi aplikasi diperbarui.

### Versi 1.3.0
- **Zero-Flicker Navigation**: Transisi antar halaman Al-Qur'an kini **seamless** tanpa refresh/kedip pada Header & Audio Player. Menggunakan internal state & `pushState`.
- **Enhanced Swipe**: Logic swipe gesture yang lebih natural (Kanan->Next, Kiri->Prev) dengan **Direction Locking** untuk mencegah pantulan saat scroll vertikal.
- **Improved Audio Controls**: 
  - Tombol Stop kini *persistent* (tetap muncul saat pause).
  - Tampilan tombol lebih konsisten dan modern.
- **Performance**: Optimasi prefetching gambar halaman tetangga (+/- 2 halaman).

## Tech Stack
- **Framework**: Next.js 14+ (App Router)
- **Mobile Runtime**: Capacitor 5+
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Data**: eQuran.id, MyQuran API

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run development server:
   ```bash
   npm run dev
   ```

3. Build & Sync to Android:
   ```bash
   npm run build
   npx cap sync android
   ```

4. Open in Android Studio:
   ```bash
   npx cap open android
   ```
