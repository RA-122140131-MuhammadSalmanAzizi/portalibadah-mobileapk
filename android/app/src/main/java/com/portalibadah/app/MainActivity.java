package com.portalibadah.app;

import android.content.Intent;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    // Aplikasi ditutup (di-swipe dari daftar aplikasi terbuka): hentikan layanan media
    // agar murottal tidak tetap berbunyi di latar belakang.
    @Override
    public void onDestroy() {
        if (isFinishing()) {
            try {
                stopService(new Intent(this, com.capgo.mediasession.MediaSessionService.class));
            } catch (Exception ignored) {
            }
        }
        super.onDestroy();
    }
}
