package com.belta1.recomp;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Bundle;
import android.os.SystemClock;
import android.text.InputType;
import android.view.View;
import android.view.inputmethod.EditorInfo;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

/**
 * The RECOMP dashboard in a native shell. Everything the dashboard does lives on the server
 * (pages/recomp_v3.jsx + /api/*), so the app is a full-screen WebView pointed at it: a deploy
 * shows up on the next load, with nothing to reinstall. What the shell adds is what a browser
 * tab cannot: its own icon and dark bars, pull to refresh, a reload when it comes back after a
 * while (the coach may have logged something, or the day changed), an offline screen, and the
 * server address as a setting (launcher long-press → "Servidor", or from the offline screen).
 */
public class MainActivity extends Activity {
    private static final String PREFS = "recomp";
    private static final String KEY_SERVER = "server";
    private static final String ACTION_SERVER = "com.belta1.recomp.SERVER";
    /** Back in the app after this long → reload, so "hoy" and the coach's writes are current. */
    private static final long STALE_MS = 5 * 60 * 1000;

    private WebView web;
    private SwipeRefreshLayout refresh;
    private ProgressBar progress;
    private View offline;
    private TextView offlineBody;
    private boolean mainFrameFailed;
    private long pausedAt;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        web = findViewById(R.id.web);
        refresh = findViewById(R.id.refresh);
        progress = findViewById(R.id.progress);
        offline = findViewById(R.id.offline);
        offlineBody = findViewById(R.id.offline_body);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setTextZoom(100);                       // the page sizes its own type; match the web
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        s.setUserAgentString(s.getUserAgentString() + " RecompAndroid/" + BuildConfig.VERSION_NAME);

        web.setWebViewClient(new Client());
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int p) {
                progress.setProgress(p);
                progress.setVisibility(p < 100 && !refresh.isRefreshing() ? View.VISIBLE : View.GONE);
            }
        });

        refresh.setColorSchemeColors(getColor(R.color.bg));
        refresh.setProgressBackgroundColorSchemeColor(getColor(R.color.bone));
        refresh.setOnRefreshListener(this::reload);
        // Only pull-to-refresh from the very top of the page, never mid-scroll.
        refresh.setOnChildScrollUpCallback((parent, child) -> web.getScrollY() > 0);

        findViewById(R.id.retry).setOnClickListener(v -> reload());
        findViewById(R.id.change_server).setOnClickListener(v -> askServer());

        if (savedInstanceState != null) web.restoreState(savedInstanceState);
        else web.loadUrl(server());
        if (ACTION_SERVER.equals(getIntent().getAction())) askServer();
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        if (ACTION_SERVER.equals(intent.getAction())) askServer();
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override
    protected void onPause() {
        super.onPause();
        pausedAt = SystemClock.elapsedRealtime();
        web.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        web.onResume();
        if (pausedAt > 0 && SystemClock.elapsedRealtime() - pausedAt > STALE_MS) reload();
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        if (offline.getVisibility() == View.VISIBLE) { moveTaskToBack(true); return; }
        if (web.canGoBack()) { web.goBack(); return; }
        // Keep the page alive (a set half-typed mid-workout) instead of finishing.
        moveTaskToBack(true);
    }

    @Override
    protected void onDestroy() {
        web.destroy();
        super.onDestroy();
    }

    // ── loading ──────────────────────────────────────────────────

    private String server() {
        String saved = getSharedPreferences(PREFS, MODE_PRIVATE).getString(KEY_SERVER, null);
        return saved != null ? saved : getString(R.string.default_server);
    }

    private void reload() {
        mainFrameFailed = false;
        String url = web.getUrl();
        // After a failed load the WebView sits on an error page; start over from the server.
        if (url == null || !url.startsWith(server())) web.loadUrl(server());
        else web.reload();
    }

    private void showOffline() {
        offlineBody.setText(getString(R.string.offline_body, server()));
        offline.setVisibility(View.VISIBLE);
        refresh.setRefreshing(false);
        progress.setVisibility(View.GONE);
    }

    private boolean isOurs(Uri uri) {
        Uri base = Uri.parse(server());
        return uri.getHost() != null && uri.getHost().equalsIgnoreCase(base.getHost()) && uri.getPort() == base.getPort();
    }

    private class Client extends WebViewClient {
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
            Uri uri = req.getUrl();
            if (isOurs(uri)) return false;
            // Anything else (a link out of the dashboard) goes to the browser.
            try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); } catch (Exception ignored) { }
            return true;
        }

        @Override
        public void onPageStarted(WebView view, String url, Bitmap favicon) {
            mainFrameFailed = false;
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            refresh.setRefreshing(false);
            if (!mainFrameFailed) offline.setVisibility(View.GONE);
        }

        @Override
        public void onReceivedError(WebView view, WebResourceRequest req, WebResourceError err) {
            if (!req.isForMainFrame()) return;
            mainFrameFailed = true;
            showOffline();
        }

        @Override
        public void onReceivedHttpError(WebView view, WebResourceRequest req, WebResourceResponse res) {
            // 502/503/504: the container is restarting (a redeploy) — same screen as offline.
            if (req.isForMainFrame() && res.getStatusCode() >= 502) {
                mainFrameFailed = true;
                showOffline();
            }
        }
    }

    // ── server address ───────────────────────────────────────────

    private void askServer() {
        EditText input = new EditText(this);
        input.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_URI);
        input.setImeOptions(EditorInfo.IME_ACTION_DONE);
        input.setSingleLine(true);
        input.setText(server());
        input.setHint(R.string.server_hint);
        input.setSelectAllOnFocus(true);
        FrameLayout box = new FrameLayout(this);
        int pad = Math.round(20 * getResources().getDisplayMetrics().density);
        box.setPadding(pad, pad / 2, pad, 0);
        box.addView(input);

        AlertDialog dialog = new AlertDialog.Builder(this, R.style.Theme_Recomp_Dialog)
                .setTitle(R.string.server_title)
                .setView(box)
                .setPositiveButton(R.string.save, null)
                .setNegativeButton(R.string.cancel, null)
                .create();
        dialog.setOnShowListener(d -> dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(v -> {
            String url = input.getText().toString().trim();
            while (url.endsWith("/")) url = url.substring(0, url.length() - 1);
            if (!url.matches("(?i)^https?://[^\\s/]+(:\\d+)?$")) {
                Toast.makeText(this, R.string.bad_url, Toast.LENGTH_LONG).show();
                return;
            }
            getSharedPreferences(PREFS, MODE_PRIVATE).edit().putString(KEY_SERVER, url).apply();
            dialog.dismiss();
            mainFrameFailed = false;
            web.clearHistory();
            web.loadUrl(url);
        }));
        dialog.show();
    }
}
