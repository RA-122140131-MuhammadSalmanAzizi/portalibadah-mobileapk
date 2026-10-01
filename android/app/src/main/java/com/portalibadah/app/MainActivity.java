package com.portalibadah.app;

import android.content.Intent;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.webkit.WebView;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;

import java.util.Locale;

public class MainActivity extends BridgeActivity {

    private Insets lastSafeArea = Insets.NONE;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Android 15 ke atas sudah edge-to-edge dan diurus plugin SystemBars bawaan Capacitor.
        // Di Android 14 ke bawah, bar status dibuat transparan di sini supaya warna header
        // (mengikuti tema) tampil di belakangnya, sama seperti di Android baru.
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.VANILLA_ICE_CREAM) {
            enableLegacyEdgeToEdge();
        }
    }

    private void enableLegacyEdgeToEdge() {
        Window window = getWindow();
        WindowCompat.setDecorFitsSystemWindows(window, false);
        window.setStatusBarColor(Color.TRANSPARENT);
        window.setNavigationBarColor(Color.TRANSPARENT);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            window.setNavigationBarContrastEnforced(false);
        }

        WebView webView = getBridge().getWebView();
        View container = (View) webView.getParent();
        ViewCompat.setOnApplyWindowInsetsListener(container, (v, insets) -> {
            Insets safe = insets.getInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
            ViewGroup.MarginLayoutParams lp = (ViewGroup.MarginLayoutParams) v.getLayoutParams();
            if (insets.isVisible(WindowInsetsCompat.Type.ime())) {
                // Keyboard terbuka: halaman diperkecil setinggi keyboard, jarak bawah tidak perlu lagi
                lp.bottomMargin = insets.getInsets(WindowInsetsCompat.Type.ime()).bottom;
                safe = Insets.of(safe.left, safe.top, safe.right, 0);
            } else {
                lp.bottomMargin = 0;
            }
            v.setLayoutParams(lp);
            lastSafeArea = safe;
            injectSafeArea();
            return WindowInsetsCompat.CONSUMED;
        });

        // Setelah halaman dimuat ulang, variabel CSS hilang: kirim lagi
        getBridge().addWebViewListener(new WebViewListener() {
            @Override
            public void onPageLoaded(WebView view) {
                injectSafeArea();
            }
        });
    }

    // Sama dengan yang dilakukan Capacitor di Android 15+: --safe-area-inset-* (dalam dp)
    private void injectSafeArea() {
        WebView webView = getBridge() != null ? getBridge().getWebView() : null;
        if (webView == null) return;
        float d = getResources().getDisplayMetrics().density;
        String js = String.format(Locale.US,
            "try{var s=document.documentElement.style;"
                + "s.setProperty('--safe-area-inset-top','%dpx');"
                + "s.setProperty('--safe-area-inset-right','%dpx');"
                + "s.setProperty('--safe-area-inset-bottom','%dpx');"
                + "s.setProperty('--safe-area-inset-left','%dpx');}catch(e){}",
            (int) (lastSafeArea.top / d), (int) (lastSafeArea.right / d),
            (int) (lastSafeArea.bottom / d), (int) (lastSafeArea.left / d));
        webView.post(() -> webView.evaluateJavascript(js, null));
    }

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
