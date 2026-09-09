import { WalkthroughConfig, ManualSection } from '@/types/walkthrough';

// ============================================================================
// 1. WALKTHROUGH CONFIG: REGISTER PAGE
// ============================================================================
// ============================================================================
// 1. WALKTHROUGH CONFIG: REGISTER PAGE
// ============================================================================
export const REGISTER_WALKTHROUGH: WalkthroughConfig = {
  pageKey: 'register',
  pageTitle: 'Panduan Pendaftaran',
  steps: [
    {
      id: 'reg-form-overview',
      targetId: 'register-form-box',
      title: 'Formulir Biodata Alumni',
      badge: 'Langkah 1 dari 4',
      iconName: 'user',
      position: 'auto',
      description:
        'Lengkapi biodata dasar: nama lengkap sesuai ijazah/buku kenangan, nama panggilan, kelas kelulusan tahun 1999, nomor WhatsApp aktif, dan kata sandi baru untuk akunmu.',
    },
    {
      id: 'reg-email-otp',
      targetId: 'register-email-section',
      title: 'Email Aktif (OTP & Username)',
      badge: 'Langkah 2 dari 4',
      iconName: 'mail',
      position: 'auto',
      description:
        'Email wajib aktif karena 6 digit kode OTP verifikasi akan dikirim ke sini. Ke depannya, alamat email ini juga akan menjadi username resmi untuk login masuk.',
    },
    {
      id: 'reg-referral-friend',
      targetId: 'register-referral-section',
      title: 'Pilih 1 Teman yang Kamu Kenal',
      badge: 'Langkah 3 dari 4',
      iconName: 'users',
      position: 'auto',
      description:
        'Cukup ketikkan minimal 3 huruf nama teman seangkatan ’99 yang kamu kenal di kolom pencarian. Temanmu ini akan memvalidasi keanggotaanmu sebagai sesama alumni.',
    },
    {
      id: 'reg-selfie-photo',
      targetId: 'register-photo-section',
      title: 'Wajib Foto Wajah Asli',
      badge: 'Langkah 4 dari 4',
      iconName: 'camera',
      position: 'auto',
      description:
        'Database mewajibkan foto wajah asli agar rekan referral dan seluruh kawan-kawan alumni bisa langsung mengenali wajahmu saat ini setelah 25+ tahun berpisah.',
    },
  ],
};

// ============================================================================
// 2. WALKTHROUGH CONFIG: LOGIN PAGE
// ============================================================================
export const LOGIN_WALKTHROUGH: WalkthroughConfig = {
  pageKey: 'login',
  pageTitle: 'Panduan Masuk',
  steps: [
    {
      id: 'login-overview',
      targetId: 'login-form-box',
      title: 'Masuk ke Akun Alumni',
      badge: 'Panduan Login',
      iconName: 'logIn',
      position: 'auto',
      description:
        'Gunakan Nomor WhatsApp atau Alamat Email aktif yang kamu daftarkan sebagai username, beserta kata sandi akunmu. Jika lupa sandi, cukup klik tautan "Lupa atau Ingin Ganti Kata Sandi".',
    },
  ],
};

// ============================================================================
// 3. WALKTHROUGH CONFIG: HOME / MAIN PAGE
// ============================================================================
export const HOME_WALKTHROUGH: WalkthroughConfig = {
  pageKey: 'home',
  pageTitle: 'Panduan Fitur Utama',
  steps: [
    {
      id: 'home-story',
      targetId: 'home-story-bar',
      title: 'Cerita 24 Jam (Story)',
      badge: 'Langkah 1 dari 6',
      iconName: 'sparkles',
      position: 'bottom',
      description:
        'Kirimkan foto atau video pendek kegiatan harianmu. Cerita ini akan tampil selama 1x24 jam untuk dinikmati oleh followers dan kawan seangkatan.',
    },
    {
      id: 'home-alumni',
      targetId: 'nav-alumni',
      title: 'Menu "Alumni"',
      badge: 'Langkah 2 dari 6',
      iconName: 'users',
      position: 'top',
      description:
        'Daftar database lengkap alumni SMAN 59 Angkatan 1999. Cari kawan lama dan saring berdasarkan kelas kelulusan atau bidang profesi.',
    },
    {
      id: 'home-posting',
      targetId: 'nav-posting',
      title: 'Tombol "Posting"',
      badge: 'Langkah 3 dari 6',
      iconName: 'plus',
      position: 'top',
      description:
        'Tambah postingan baru di beranda untuk berbagi foto kenangan masa SMA, cerita reuni, maupun pengumuman.',
    },
    {
      id: 'home-seller',
      targetId: 'nav-seller',
      title: 'Menu "Seller 99"',
      badge: 'Langkah 4 dari 6',
      iconName: 'store',
      position: 'top',
      description:
        'Etalase produk & jasa UMKM karya kawan-kawan alumni, atau daftarkan usahamu gratis menjadi seller.',
    },
    {
      id: 'home-radar',
      targetId: 'nav-radar',
      title: 'Menu "Radar"',
      badge: 'Langkah 5 dari 6',
      iconName: 'radio',
      position: 'top',
      description:
        'Buka info lokasi keberadaanmu kepada followers secara aman untuk memudahkan silaturahmi atau saling sapa.',
    },
    {
      id: 'home-profile',
      targetId: 'header-profile-avatar',
      title: 'Menu Profil',
      badge: 'Langkah 6 dari 6',
      iconName: 'user',
      position: 'bottom',
      description:
        'Klik foto profilmu untuk melihat profil pribadi, linimasa postingan, memperbarui biodata, dan pengaturan akun.',
    },
  ],
};

// ============================================================================
// 4. USER MANUAL DIGITAL DOCUMENTATION (BOOKLET / LIVE GUIDE MODAL)
// ============================================================================
export const MANUAL_SECTIONS: ManualSection[] = [
  {
    id: 'manual-register',
    title: 'Panduan Lengkap Pendaftaran Akun',
    category: 'register',
    iconName: 'user',
    summary: 'Langkah mudah bergabung dengan rumah digital alumni SMAN 59 Angkatan 1999.',
    details: [
      'Isi data nama lengkap sesuai dengan dokumen sekolah/buku kenangan agar sistem dan rekan seangkatan mudah mengenali identitasmu.',
      'Gunakan Alamat Email Aktif karena kode verifikasi 6 digit OTP akan dikirimkan ke email tersebut. Email ini juga akan menjadi username utama akunmu.',
      'Pilih 1 Rekan Alumni sebagai referral validasi dengan mengetik minimal 3 huruf nama kawan seangkatan yang kamu kenal di kolom pencarian.',
      'Unggah Foto Selfie Wajah Asli saat ini agar rekan referral dan seluruh alumni mengenali wajahmu secara langsung setelah puluhan tahun lulus.',
      'Masukkan 6 digit kode OTP yang diterima melalui email untuk menyelesaikan verifikasi dan mengaktifkan akunmu.',
    ],
    tips: 'Jika email OTP belum masuk, periksa folder Spam atau Promosi, atau klik kirim ulang setelah 60 detik.',
  },
  {
    id: 'manual-login',
    title: 'Panduan Masuk / Login Akun',
    category: 'login',
    iconName: 'logIn',
    summary: 'Akses mudah ke akun alumni yang sudah terdaftar.',
    details: [
      'Gunakan Nomor WhatsApp atau Alamat Email aktif yang kamu daftarkan saat registrasi.',
      'Masukkan Kata Sandi yang telah kamu tentukan dengan benar.',
      'Demi keamanan bersama, sistem akan mengunci sementara form login jika terjadi kesalahan kata sandi sebanyak 3 kali berturut-turut.',
      'Bila lupa kata sandi, klik tautan "Lupa atau Ingin Ganti Kata Sandi" untuk mereset kata sandi melalui verifikasi email.',
    ],
    tips: 'Simpan kredensial login di browser HP agar kamu tidak perlu mengetik ulang setiap kali berkunjung.',
  },
  {
    id: 'manual-features',
    title: 'Panduan Navigasi & Fitur Utama',
    category: 'features',
    iconName: 'sparkles',
    summary: 'Penjelasan lengkap fungsi menu dan navigasi di dalam Forsil99.',
    details: [
      'Cerita 24 Jam (Story): Bagikan momen foto/video kegiatan harianmu yang otomatis hilang setelah 24 jam.',
      'Tab Alumni: Direktori seluruh kawan alumni SMAN 59 Angkatan ’99 dengan filter kelas dan pencarian instan.',
      'Posting (+): Tombol di tengah navigasi bawah untuk menerbitkan postingan kenangan nostalgia, cerita, atau info komunitas.',
      'Seller 99: Direktori usaha alumni ’99 dan pendaftaran toko/UMKM secara mandiri dan gratis.',
      'Radar Lokasi: Pantau dan bagikan sinyal lokasi kepada kawan terdekat untuk mempermudah temu kangen dan silaturahmi.',
      'Profil Saya: Akses di pojok kanan atas untuk melihat postinganmu, album kenangan, dan pengaturan profil.',
    ],
    tips: 'Gunakan filter tab di atas timeline beranda untuk menyaring postingan khusus kategori Kenangan ’99 atau Cerita alumni.',
  },
  {
    id: 'manual-faq',
    title: 'Pertanyaan Umum (FAQ) & Privasi',
    category: 'faq',
    iconName: 'shield',
    summary: 'Jawaban atas pertanyaan seputar keamanan dan perlindungan data pribadi.',
    details: [
      'Apakah data nomor HP dan email saya aman? Ya, Forsil99 menerapkan kebijakan privasi ketat sesuai UU Perlindungan Data Pribadi (UU PDP). Kontak pribadimu hanya dapat diakses secara terbatas sesuai izin yang kamu tentukan.',
      'Siapa yang boleh mendaftar? Khusus alumni SMAN 59 Jakarta lulusan tahun 1999.',
      'Bagaimana jika kawan referral saya belum mengonfirmasi? Kamu tetap dapat masuk dan melihat linimasa publik sembari menunggu verifikasi dari rekanmu atau tim admin.',
    ],
    tips: 'Kamu dapat membaca Kebijakan Privasi lengkap kapan saja melalui tautan di bagian bawah aplikasi.',
  },
];
