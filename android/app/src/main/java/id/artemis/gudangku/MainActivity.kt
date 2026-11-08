package id.artemis.gudangku

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
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
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

private val Forest = Color(0xFF236B4B)
private val Paper = Color(0xFFF7F9F6)
private val Ink = Color(0xFF18221E)
private val Muted = Color(0xFF718078)

class MainActivity : ComponentActivity() {
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
                GudangkuHome()
            }
        }
    }
}

@Composable
private fun GudangkuHome() {
    Surface(modifier = Modifier.fillMaxSize(), color = Paper) {
        Column(
            modifier = Modifier.fillMaxSize().padding(horizontal = 24.dp, vertical = 28.dp),
            verticalArrangement = Arrangement.spacedBy(22.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("G", color = Color.White, fontWeight = FontWeight.Bold,
                    modifier = Modifier.background(Forest, RoundedCornerShape(9.dp)).padding(10.dp))
                Text("  GUDANGKU", fontWeight = FontWeight.ExtraBold, letterSpacing = 2.sp, fontSize = 14.sp)
                Spacer(Modifier.weight(1f))
                Text("PREVIEW", color = Forest, fontSize = 10.sp, fontWeight = FontWeight.Bold)
            }
            Spacer(Modifier.height(28.dp))
            Text("INVENTORY MANAGEMENT SYSTEM", color = Forest, fontSize = 10.sp, letterSpacing = 1.5.sp)
            Text("Semua stok,\nsatu kendali.", fontSize = 38.sp, lineHeight = 42.sp,
                fontWeight = FontWeight.ExtraBold, color = Ink)
            Text("Kelola produk, pergerakan barang, dan persediaan gudang dalam satu tempat.",
                color = Muted, fontSize = 14.sp, lineHeight = 22.sp)
            Text("MODUL UTAMA", color = Forest, fontSize = 10.sp, letterSpacing = 1.5.sp)
            val modules = listOf(
                "01  Produk dan kategori",
                "02  Stok masuk dan keluar",
                "03  Mutasi antar gudang",
                "04  Stok opname",
                "05  Riwayat pergerakan stok"
            )
            modules.forEach { item ->
                Surface(color = Color.White, shape = RoundedCornerShape(10.dp), shadowElevation = 1.dp) {
                    Text(item, modifier = Modifier.fillMaxWidth().padding(17.dp),
                        fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = Ink)
                }
            }
            Spacer(Modifier.weight(1f))
            Text("WEB · ANDROID NATIVE · SUPABASE", color = Muted, fontSize = 9.sp, letterSpacing = 1.sp)
        }
    }
}
