// Suara adzan untuk notifikasi alarm sholat (Android).
// File ada di android/app/src/main/res/raw/ahmad_nafees_adzan.mp3 (nama resource harus huruf kecil).
// Suara channel Android tidak bisa diubah setelah dibuat, jadi mengganti suara = membuat channel baru.
export const ADZAN_SOUND = "ahmad_nafees_adzan.mp3";
export const ADZAN_CHANNEL_ID = "adzan_nafees_v1";
export const ADZAN_CHANNEL_NAME = "Adzan Sholat (Ahmad Nafees)";
// Channel lama yang dihapus agar suara lama tidak dipakai lagi
export const OLD_ADZAN_CHANNEL_IDS = ["adzan_channel_v1_2_3"];
