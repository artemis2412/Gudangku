package id.artemis.gudangku

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView

private val Forest = Color(0xFF236B4B)
private val Paper = Color(0xFFF7F9F6)
private val Ink = Color(0xFF18221E)
private val Muted = Color(0xFF718078)

class MainActivity : ComponentActivity() {
    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme(colorScheme = lightColorScheme(
                primary = Forest,
                background = Paper,
                surface = Color.White,
                onBackground = Ink,
                onSurface = Ink
            )) {
                val webUrl = BuildConfig.WEB_APP_URL.trim()
                if (webUrl.isNotEmpty()) {
                    GudangkuWebApp(webUrl)
                } else {
                    GudangkuSetupScreen()
                }
            }
        }
    }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
private fun GudangkuWebApp(url: String) {
    var webView by remember { mutableStateOf<WebView?>(null) }
    var canGoBack by remember { mutableStateOf(false) }

    BackHandler(enabled = canGoBack) {
        webView?.goBack()
    }

    AndroidView(
        modifier = Modifier.fillMaxSize(),
        factory = { context ->
            WebView(context).apply {
                settings.javaScriptEnabled = true
                settings.domStorageEnabled = true
                settings.loadsImagesAutomatically = true
                settings.javaScriptCanOpenWindowsAutomatically = false
                webViewClient = object : WebViewClient() {
                    override fun onPageFinished(view: WebView, finishedUrl: String?) {
                        canGoBack = view.canGoBack()
                    }
                }
                webChromeClient = WebChromeClient()
                loadUrl(url)
                webView = this
            }
        },
        update = { view ->
            webView = view
            canGoBack = view.canGoBack()
        }
    )
}

@Composable
private fun GudangkuSetupScreen() {
    Surface(modifier = Modifier.fillMaxSize(), color = Paper) {
        Column(
            modifier = Modifier.fillMaxSize().padding(horizontal = 24.dp, vertical = 28.dp),
            verticalArrangement = Arrangement.spacedBy(18.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("G", color = Color.White, fontWeight = FontWeight.Bold,
                    modifier = Modifier.background(Forest, RoundedCornerShape(9.dp)).padding(10.dp))
                Text("  GUDANGKU", fontWeight = FontWeight.ExtraBold, letterSpacing = 2.sp, fontSize = 14.sp)
                Spacer(Modifier.weight(1f))
                Text("ANDROID", color = Forest, fontSize = 10.sp, fontWeight = FontWeight.Bold)
            }
            Spacer(Modifier.height(24.dp))
            Text("Satu aplikasi.\nSemua persediaan.", fontSize = 34.sp, lineHeight = 40.sp,
                fontWeight = FontWeight.ExtraBold, color = Ink)
            Text("Aplikasi Android hybrid GUDANGKU sudah disiapkan. Setelah alamat web produksi tersedia, aplikasi ini akan membuka sistem web yang sama dengan pengalaman layar penuh Android.",
                color = Muted, fontSize = 14.sp, lineHeight = 22.sp)
            Surface(color = Color.White, shape = RoundedCornerShape(14.dp), shadowElevation = 1.dp) {
                Column(Modifier.fillMaxWidth().padding(18.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("TAHAP BERIKUTNYA", color = Forest, fontSize = 10.sp, letterSpacing = 1.3.sp, fontWeight = FontWeight.Bold)
                    Text("Menunggu deployment web", color = Ink, fontWeight = FontWeight.Bold)
                    Text("URL web akan dipasang melalui konfigurasi build, bukan ditanam sebagai alamat sementara.", color = Muted, fontSize = 13.sp, lineHeight = 20.sp)
                }
            }
            Text("WEB + ANDROID HYBRID · SUPABASE", color = Muted, fontSize = 9.sp, letterSpacing = 1.sp)
        }
    }
}
