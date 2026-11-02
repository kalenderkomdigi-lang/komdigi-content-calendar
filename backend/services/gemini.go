package services

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"

	"content-calendar-backend/models"
	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

// isPlaceholderKey checks if the API key is missing or a known placeholder value
func isPlaceholderKey(key string) bool {
	return key == "" ||
		strings.HasPrefix(strings.ToUpper(key), "YOUR") ||
		key == "CHANGE_ME" ||
		len(key) < 10
}

// GenerateMockIdeas generates placeholder content if the Gemini API key is missing
func GenerateMockIdeas(theme string, contentPillar string) []models.IdeaItem {
	pillar := contentPillar
	if pillar == "" || pillar == "Semua Pilar" {
		pillar = "Education/Information"
	}

	return []models.IdeaItem{
		{
			Title:        fmt.Sprintf("Program Beasiswa Digital Talent Scholarship (DTS) BLSDM Komdigi: (%s)", theme),
			Summary:      "Video publikasi resmi yang mengulas alur pendaftaran dan manfaat pelatihan gratis bidang AI, Coding, serta Digital Marketing dari program DTS BLSDM Komdigi secara terstruktur dan informatif.",
			Format:       "Reels/TikTok",
			Pillar:       pillar,
			ReferenceURL: "https://www.instagram.com/explore/tags/digitaltalentscholarship/",
		},
		{
			Title:        "Panduan Sertifikasi Standar Nasional IT & Komunikasi 💻",
			Summary:      "Slide infografis resmi memuat syarat pendaftaran, kurikulum standar industri, dan fasilitas sertifikasi kompetensi gratis yang diselenggarakan oleh BLSDM Komdigi.",
			Format:       "Carousel Instagram",
			Pillar:       pillar,
			ReferenceURL: "https://www.instagram.com/explore/tags/literasidigital/",
		},
		{
			Title:        "3 Peningkatan Kecakapan Digital Utama untuk Masyarakat 🏛️",
			Summary:      "Video informasi publik berdurasi singkat yang mengulas pentingnya Cybersecurity, Cloud Computing, dan Data Science yang diselenggarakan oleh BLSDM Komdigi.",
			Format:       "Video Pendek",
			Pillar:       pillar,
			ReferenceURL: "https://www.youtube.com/results?search_query=digital+talent+scholarship",
		},
	}
}

// GenerateMockCaption generates a placeholder caption if the Gemini API key is missing
func GenerateMockCaption(theme string, ideas []models.IdeaItem) string {
	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("🏛️ [INFORMASI PUBLIK BLSDM KOMDIGI: %s] 🏛️\n\n", strings.ToUpper(theme)))
	sb.WriteString("Halo Digiers!\n\n")
	sb.WriteString(fmt.Sprintf("Dalam rangka meningkatkan literasi serta kecakapan digital nasional, berikut adalah informasi penting terkait \"%s\" yang perlu diperhatikan oleh seluruh Digiers:\n\n", theme))
	sb.WriteString("Berikut 3 ide publikasi konten yang direkomendasikan:\n")
	for _, idea := range ideas {
		pillarStr := ""
		if idea.Pillar != "" {
			pillarStr = fmt.Sprintf(" [%s]", idea.Pillar)
		}
		sb.WriteString(fmt.Sprintf("📌 %s%s\n💡 %s\n\n", idea.Title, pillarStr, idea.Summary))
	}
	sb.WriteString("Mari bersama-sama memperkuat pemahaman digital demi mewujudkan Indonesia yang makin melek digital dan aman di ruang siber. Silakan bagikan informasi resmi ini kepada sesama Digiers dan keluarga Anda. 🏛️✨\n\n")
	sb.WriteString("#BLSDMKomdigi #DigitalTalentScholarship #LiterasiDigital #Kemenkomdigi #Komdigi")
	return sb.String()
}

func GenerateContentIdeasWithGemini(ctx context.Context, theme string, contentPillar string) ([]models.IdeaItem, error) {
	apiKey := os.Getenv("GEMINI_API_KEY")
	if isPlaceholderKey(apiKey) {
		log.Println("WARNING: GEMINI_API_KEY is not set or is a placeholder. Using mock content generator.")
		return GenerateMockIdeas(theme, contentPillar), nil
	}

	client, err := genai.NewClient(ctx, option.WithAPIKey(apiKey))
	if err != nil {
		return nil, fmt.Errorf("failed to create genai client: %v", err)
	}
	defer client.Close()

	model := client.GenerativeModel("gemini-3.5-flash-lite")
	model.GenerationConfig.ResponseMIMEType = "application/json"

	pillarInstruction := ""
	samplePillar := "Education/Information"
	if contentPillar != "" && contentPillar != "Semua Pilar" {
		samplePillar = contentPillar
		pillarInstruction = fmt.Sprintf(`
5. WAJIB FOKUS PADA PILAR KONTEN "%s":
Semua ide konten yang dihasilkan WAJIB secara spesifik merefleksikan pilar ini:
- Jika "Entertainment": Buat konten kuis interaktif, tebak-tebakan teknologi (contoh: "Tebak mana gambar AI vs manusia", "Tebak teknologi di Smart City"), mini challenge, atau mitos vs fakta yang menyenangkan masyarakat.
- Jika "Education/Information": Buat konten panduan teknis, infografis langkah praktis, penjelasan konsep teknologi/komunikasi (contoh: "Evolusi komunikasi dari surat hingga AI", "5 Kesalahan membaca statistik data").
- Jika "Trend": Buat konten pembahasan isu/tren terkini, AI Agent, AI Voice, inovasi mutakhir, atau fenomena teknologi yang sedang viral diperbincangkan.
- Jika "Konten Nasional": Buat konten wawasan kebangsaan, peringatan hari nasional (Sumpah Pemuda, Hari Pahlawan, dll), dan program prioritas kedaulatan digital RI.`, contentPillar)
	}

	prompt := fmt.Sprintf(`Buat 3 ide postingan media sosial yang informatif, menarik, edukatif, dan profesional berstandar instansi pemerintah (BLSDM Komdigi) berdasarkan tema: "%s".%s
 
Setiap ide harus memiliki:
- "title": judul konten yang informatif, jelas, resmi, dan menarik perhatian masyarakat.
- "summary": ringkasan singkat isi konten yang menjelaskan pesan edukatif/informasi publik secara terstruktur, santun, dan mudah dipahami.
- "format": jenis format konten (pilih salah satu: "Reels/TikTok", "Carousel Instagram", "Video Pendek", "Poster Infografis", "Motion Graphic")
- "pillar": sebutkan pilar konten ide ini (contoh: "%s", "Entertainment", "Education/Information", "Trend", atau "Konten Nasional")
- "reference_url": satu link YouTube, TikTok, atau Instagram yang relevan. KETENTUAN UTAMA: Jangan pernah mengarang ID video spesifik (seperti instagram.com/p/random_id atau tiktok.com/@user/video/random_id) karena link tersebut 100%% akan mati/tidak ditemukan. Sebagai gantinya, gunakan URL pencarian tagar/hashtag aktif (seperti https://www.tiktok.com/tag/literasidigital atau https://www.instagram.com/explore/tags/keamanansiber/) ATAU gunakan link pencarian video YouTube yang stabil (seperti https://www.youtube.com/results?search_query=literasi+digital). Link harus selalu valid dan berawalan https://.
 
Ketentuan:
1. Hubungkan secara jelas dengan program/fokus utama dari BLSDM Komdigi (Badan Pengembangan Sumber Daya Manusia Komunikasi dan Digital - Kemenkominfo/Komdigi), seperti program beasiswa pelatihan gratis Digital Talent Scholarship (DTS), kelas literasi digital, beasiswa IT, cybersecurity, digital marketing, AI academy, coding, atau kecakapan digital lainnya. Konten harus mengedukasi masyarakat sekaligus mempublikasikan manfaat peningkatan keterampilan digital bersama BLSDM Komdigi.
2. Menggunakan Bahasa Indonesia yang baik, benar, baku, formal, ramah, dan profesional sesuai standar penyampaian informasi publik instansi pemerintah. Hindari bahasa gaul, slang, bahasa santai yang tidak resmi, atau istilah Gen Z.
3. Variasi format: Pastikan ketiga ide memiliki format yang berbeda-beda.
4. Untuk reference_url, carikan tagar Instagram/TikTok aktif atau pencarian YouTube yang relevan dengan tipe konten ini atau tema "%s". Pastikan link URL ditulis utuh dan valid (selalu gunakan awalan https://).
 
Format output harus tepat berupa JSON array:
[
  {"title": "...", "summary": "...", "format": "Reels/TikTok", "pillar": "%s", "reference_url": "https://...."},
  {"title": "...", "summary": "...", "format": "Carousel Instagram", "pillar": "%s", "reference_url": "https://...."},
  {"title": "...", "summary": "...", "format": "Video Pendek", "pillar": "%s", "reference_url": "https://...."}  
]`, theme, pillarInstruction, samplePillar, theme, samplePillar, samplePillar, samplePillar)

	resp, err := model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		// Fallback to gemini-3.6-flash if gemini-3.5-flash-lite is not available
		log.Printf("Failed to generate with gemini-3.5-flash-lite: %v. Retrying with gemini-3.6-flash...", err)
		model = client.GenerativeModel("gemini-3.6-flash")
		model.GenerationConfig.ResponseMIMEType = "application/json"
		resp, err = model.GenerateContent(ctx, genai.Text(prompt))
		if err != nil {
			return nil, fmt.Errorf("failed to generate content: %v", err)
		}
	}

	if len(resp.Candidates) == 0 || resp.Candidates[0].Content == nil || len(resp.Candidates[0].Content.Parts) == 0 {
		return nil, fmt.Errorf("empty response from Gemini model")
	}

	var jsonText string
	for _, part := range resp.Candidates[0].Content.Parts {
		if text, ok := part.(genai.Text); ok {
			jsonText += string(text)
		}
	}

	var ideas []models.IdeaItem
	err = json.Unmarshal([]byte(jsonText), &ideas)
	if err != nil {
		log.Printf("Failed to parse JSON from Gemini response: %s. Error: %v", jsonText, err)
		return nil, fmt.Errorf("failed to parse JSON response: %v", err)
	}

	for i := range ideas {
		if ideas[i].Pillar == "" {
			if contentPillar != "" && contentPillar != "Semua Pilar" {
				ideas[i].Pillar = contentPillar
			} else {
				ideas[i].Pillar = "Education/Information"
			}
		}
	}

	return ideas, nil
}

func GenerateCaptionWithGemini(ctx context.Context, theme string, ideas []models.IdeaItem) (string, error) {
	apiKey := os.Getenv("GEMINI_API_KEY")
	if isPlaceholderKey(apiKey) {
		log.Println("WARNING: GEMINI_API_KEY is not set or is a placeholder. Using mock caption generator.")
		return GenerateMockCaption(theme, ideas), nil
	}

	client, err := genai.NewClient(ctx, option.WithAPIKey(apiKey))
	if err != nil {
		return "", fmt.Errorf("failed to create genai client: %v", err)
	}
	defer client.Close()

	model := client.GenerativeModel("gemini-3.5-flash-lite")

	// Convert ideas to readable string for prompt
	var ideasStr strings.Builder
	for i, idea := range ideas {
		ideasStr.WriteString(fmt.Sprintf("- Ide %d: %s (Ringkasan: %s)\n", i+1, idea.Title, idea.Summary))
	}

	prompt := fmt.Sprintf(`Buat caption media sosial resmi instansi pemerintah (BLSDM Komdigi) yang lengkap, informatif, jelas, dan profesional berdasarkan tema: "%s" dan ide konten berikut:
%s
Syarat caption:
1. Menggunakan Bahasa Indonesia yang baik, benar, baku, formal, ramah, dan komunikatif sesuai standar penyampaian informasi publik instansi pemerintah (BLSDM Komdigi). Hindari penggunaan gaya bahasa gaul, slang, bahasa santai non-formal, atau istilah Gen Z.
2. SELALU gunakan sebutan/sapaan "Digiers" (sapaan khas Komdigi) untuk menyapa audiens/masyarakat dalam caption (contoh: "Halo Digiers!", "Hai Digiers!", "Untuk Digiers yang ingin...", dll).
3. Memiliki struktur yang teratur dan jelas (Judul/Salam pembuka resmi yang menarik, penyampaian informasi/edukasi publik yang lugas dan padat, ajakan bertindak/Call to Action yang santun dan informatif, serta Tagar/Hashtag resmi instansi).
4. Gunakan emoji secara terukur, efektif, dan relevan untuk penekanan poin penting tanpa mengurangi keanggunan dan profesionalisme komunikasi instansi.
5. Respon hanya berisi teks caption langsung, jangan tambahkan pembuka markdown atau penjelasan lain.`, theme, ideasStr.String())

	resp, err := model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		// Fallback to gemini-3.6-flash
		log.Printf("Failed to generate with gemini-3.5-flash-lite: %v. Retrying with gemini-3.6-flash...", err)
		model = client.GenerativeModel("gemini-3.6-flash")
		resp, err = model.GenerateContent(ctx, genai.Text(prompt))
		if err != nil {
			return "", fmt.Errorf("failed to generate caption: %v", err)
		}
	}

	if len(resp.Candidates) == 0 || resp.Candidates[0].Content == nil || len(resp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("empty response from Gemini model")
	}

	var caption string
	for _, part := range resp.Candidates[0].Content.Parts {
		if text, ok := part.(genai.Text); ok {
			caption += string(text)
		}
	}

	return strings.TrimSpace(caption), nil
}

// GenerateMockMultimodalCaption generates a mock placeholder caption if the Gemini API key is missing
func GenerateMockMultimodalCaption(theme string, hasImage bool) string {
	var sb strings.Builder
	if theme != "" {
		sb.WriteString(fmt.Sprintf("🏛️ [INFORMASI PUBLIK BLSDM KOMDIGI: %s] 🏛️\n\n", strings.ToUpper(theme)))
		sb.WriteString("Halo Digiers!\n\n")
		sb.WriteString(fmt.Sprintf("Dalam rangka meningkatkan literasi serta kecakapan digital nasional, berikut adalah informasi penting terkait \"%s\" yang perlu diperhatikan oleh seluruh Digiers:\n\n", theme))
	} else {
		sb.WriteString("🏛️ [PUBLIKASI INFORMASI PUBLIK BLSDM KOMDIGI] 🏛️\n\n")
		sb.WriteString("Halo Digiers!\n\n")
		sb.WriteString("Berdasarkan materi visual yang dilampirkan, berikut informasi penting yang dapat dipelajari bersama oleh seluruh Digiers. 🧐\n\n")
	}
	if hasImage {
		sb.WriteString("📸 Catatan Visual: Lampiran foto di atas menjadi pengingat penting bagi Digiers semua untuk senantiasa menjaga keamanan informasi dan meningkatkan literasi digital di era transformasi digital ini. 🏛️✨\n\n")
	}
	sb.WriteString("Mari tingkatkan kecakapan digital bersama BLSDM Komdigi untuk Indonesia Emas. Bagikan informasi resmi ini kepada sesama Digiers dan keluarga Anda. 💻✨\n\n")
	sb.WriteString("#BLSDMKomdigi #DigitalTalentScholarship #LiterasiDigital #Kemenkomdigi #Komdigi")
	return sb.String()
}

// GenerateCaptionFromMultimodal generates a caption using multimodal features of gemini-3.5-flash
func GenerateCaptionFromMultimodal(ctx context.Context, theme string, imageBytes []byte, mimeType string) (string, error) {
	if len(imageBytes) == 0 {
		return GenerateCaptionFromThemeText(ctx, theme)
	}

	apiKey := os.Getenv("GEMINI_API_KEY")
	if isPlaceholderKey(apiKey) {
		log.Println("WARNING: GEMINI_API_KEY is not set or is a placeholder. Using mock multimodal caption generator.")
		return GenerateMockMultimodalCaption(theme, len(imageBytes) > 0), nil
	}

	client, err := genai.NewClient(ctx, option.WithAPIKey(apiKey))
	if err != nil {
		return "", fmt.Errorf("failed to create genai client: %v", err)
	}
	defer client.Close()

	model := client.GenerativeModel("gemini-3.5-flash-lite")
    
	// Build prompt dynamically based on what's provided
	var parts []genai.Part

	if theme != "" && len(imageBytes) > 0 {
		// Both theme and image provided
		prompt := fmt.Sprintf(`Buat caption media sosial resmi instansi pemerintah (BLSDM Komdigi) yang lengkap, informatif, jelas, dan profesional berdasarkan tema/topik: "%s". Saya juga telah mengunggah sebuah gambar pendukung. Harap analisis visual gambar tersebut (warna, objek, suasana, tulisan di dalamnya jika ada) dan hubungkan analisis visual gambar tersebut ke dalam caption resmi yang Anda buat agar caption tersebut selaras dengan tema DAN postingan gambar ini!`, theme)
		parts = append(parts, genai.Text(prompt))
	} else if theme != "" {
		// Theme only
		prompt := fmt.Sprintf(`Buat caption media sosial resmi instansi pemerintah (BLSDM Komdigi) yang lengkap, informatif, jelas, dan profesional berdasarkan tema/topik: "%s".`, theme)
		parts = append(parts, genai.Text(prompt))
	} else {
		// Image only
		prompt := `Buat caption media sosial resmi instansi pemerintah (BLSDM Komdigi) yang lengkap, informatif, jelas, dan profesional berdasarkan gambar yang saya unggah berikut ini. Harap analisis visual gambar tersebut secara detail (warna, objek, suasana, tulisan di dalamnya jika ada, konteks situasi) dan buat caption yang relevan, deskriptif, dan selaras dengan konten visual gambar ini!`
		parts = append(parts, genai.Text(prompt))
	}

	if len(imageBytes) > 0 {
		format := "jpeg"
		if strings.Contains(mimeType, "png") {
			format = "png"
		} else if strings.Contains(mimeType, "webp") {
			format = "webp"
		}
		parts = append(parts, genai.ImageData(format, imageBytes))
	}

	formatPrompt := `\n\nSyarat caption:
1. Menggunakan Bahasa Indonesia yang baik, benar, baku, formal, ramah, dan komunikatif sesuai standar penyampaian informasi publik instansi pemerintah (BLSDM Komdigi). Hindari penggunaan gaya bahasa gaul, slang, bahasa santai non-formal, atau istilah Gen Z.
2. SELALU gunakan sebutan/sapaan "Digiers" (sapaan khas Komdigi) untuk menyapa audiens/masyarakat dalam caption (contoh: "Halo Digiers!", "Hai Digiers!", "Untuk Digiers yang ingin...", dll).
3. Memiliki struktur yang teratur dan jelas (Judul/Salam pembuka resmi yang menarik, penyampaian informasi/edukasi publik yang lugas dan padat, ajakan bertindak/Call to Action yang santun dan informatif, serta Tagar/Hashtag resmi instansi).
4. Gunakan emoji secara terukur, efektif, dan relevan untuk penekanan poin penting tanpa mengurangi keanggunan dan profesionalisme komunikasi instansi.
5. Respon hanya berisi teks caption langsung, jangan tambahkan pembuka markdown atau penjelasan lain.`
	parts = append(parts, genai.Text(formatPrompt))

	resp, err := model.GenerateContent(ctx, parts...)
	if err != nil {
		log.Printf("Failed to generate multimodal content with gemini-3.5-flash-lite: %v. Retrying with gemini-3.6-flash...", err)
		model = client.GenerativeModel("gemini-3.6-flash")
		resp, err = model.GenerateContent(ctx, parts...)
		if err != nil {
			return "", fmt.Errorf("failed to generate caption: %v", err)
		}
	}

	if len(resp.Candidates) == 0 || resp.Candidates[0].Content == nil || len(resp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("empty response from Gemini model")
	}

	var caption string
	for _, part := range resp.Candidates[0].Content.Parts {
		if text, ok := part.(genai.Text); ok {
			caption += string(text)
		}
	}

	return strings.TrimSpace(caption), nil
}

// GenerateMockVideoContent generates a placeholder video concept if the Gemini API key is missing
func GenerateMockVideoContent(theme string, idea models.IdeaItem) models.VideoContent {
	ideaTitle := idea.Title
	if ideaTitle == "" {
		ideaTitle = "Informasi Publik Digital"
	}

	return models.VideoContent{
		Title:    fmt.Sprintf("Konsep Video Production: %s 🎬", ideaTitle),
		Format:   idea.Format,
		Duration: "30-60 detik",
		Hook:     fmt.Sprintf("\"Tahukah Anda pentingnya menjaga keamanan data pribadi di era digital saat ini? Mari simak penjelasan resmi berikut.\" 🏛️ (Topik: %s)", theme),
		Scenes: []models.VideoScene{
			{
				SceneNumber: 1,
				Visual:      "Presenter resmi berdiri di depan latar kantor BLSDM Komdigi dengan pencahayaan profesional",
				Narration:   "Tahukah Anda bahwa perlindungan data pribadi merupakan hal penting yang wajib kita jaga bersama di ruang siber?",
				Duration:    "0-8 detik",
			},
			{
				SceneNumber: 2,
				Visual:      "Tampilan infografis resmi memaparkan contoh kata sandi yang kuat dan aman",
				Narration:   "Gunakan kombinasi kata sandi yang kompleks serta aktifkan autentikasi dua faktor pada akun Anda.",
				Duration:    "8-20 detik",
			},
			{
				SceneNumber: 3,
				Visual:      "Animasi grafik membandingkan praktik keamanan siber yang benar dan risiko kebocoran data",
				Narration:   "Dengan menerapkan langkah-langkah pencegahan ini, Anda dapat melindungi informasi pribadi dari potensi kejahatan digital.",
				Duration:    "20-40 detik",
			},
			{
				SceneNumber: 4,
				Visual:      "Presenter menyampaikan penutup disertai teks alamat portal resmi BLSDM Komdigi",
				Narration:   "Ikuti terus kanal resmi BLSDM Komdigi untuk mendapatkan informasi dan pelatihan kecakapan digital gratis.",
				Duration:    "40-60 detik",
			},
		},
		Caption:         fmt.Sprintf("🏛️ [EDUKASI PUBLIK BLSDM KOMDIGI: %s] 🏛️\n\nHalo Digiers! Keamanan data pribadi adalah tanggung jawab kita bersama. Mari tingkatkan kewaspadaan dan kecakapan digital seluruh Digiers demi mewujudkan ruang siber yang aman dan kondusif. ✨", theme),
		Hashtags:        []string{"#BLSDMKomdigi", "#DigitalTalentScholarship", "#LiterasiDigital", "#KeamananSiber", "#Komdigi"},
		MusicSuggestion: "Musik instrumen latar yang tenang, profesional, elegan, dan menginspirasi.",
		CTA:             "Kunjungi portal resmi BLSDM Komdigi untuk pendaftaran beasiswa dan kelas pelatihan gratis! 💻",
	}
}

// GenerateVideoContentWithGemini generates a detailed video concept using Gemini based on a specific theme and a single idea
func GenerateVideoContentWithGemini(ctx context.Context, theme string, idea models.IdeaItem) (models.VideoContent, error) {
	apiKey := os.Getenv("GEMINI_API_KEY")
	if isPlaceholderKey(apiKey) {
		log.Println("WARNING: GEMINI_API_KEY is not set or is a placeholder. Using mock video content generator.")
		return GenerateMockVideoContent(theme, idea), nil
	}

	client, err := genai.NewClient(ctx, option.WithAPIKey(apiKey))
	if err != nil {
		return models.VideoContent{}, fmt.Errorf("failed to create genai client: %v", err)
	}
	defer client.Close()

	model := client.GenerativeModel("gemini-3.5-flash-lite")
	model.GenerationConfig.ResponseMIMEType = "application/json"

	prompt := fmt.Sprintf(`Kamu adalah tim komunikasi publik dan produser video profesional untuk media sosial resmi instansi pemerintah (BLSDM Komdigi).
 
Berdasarkan tema utama: "%s" dan IDE KONTEN spesifik berikut:
- Judul Ide: "%s"
- Ringkasan: "%s"
- Format Asli: "%s"
- Referensi URL: "%s"
 
Buatkan 1 KONSEP VIDEO PRODUCTION LENGKAP yang informatif, edukatif, terstruktur, dan siap diproduksi untuk publikasi resmi instansi. Video ini berformat pendek (Reels/TikTok/YouTube Shorts) dengan pendekatan profesional dan komunikatif.
 
Konsep video harus mencakup:
- "title": Judul video/konten yang informatif, jelas, resmi, dan ramah publik (sesuaikan dengan format asli "%s" jika relevan)
- "format": Format video (pilih: "Reels/TikTok", "YouTube Shorts", atau "Video Pendek")
- "duration": Estimasi durasi total (contoh: "30-60 detik")
- "hook": Kalimat pembuka atau visual yang menarik perhatian masyarakat di 3 detik pertama secara komunikatif dan santun.
- "scenes": Array berisi 4-6 scene/adegan storyboard, setiap scene memiliki:
  - "scene_number": Nomor urut scene (integer)
  - "visual": Deskripsi detail visual/shot (angle kamera, pencahayaan, latar tempat, teks overlay resmi, transisi)
  - "narration": Naskah dialog/narasi resmi yang santun, baku, dan profesional untuk dibacakan narator atau ditampilkan di layar
  - "duration": Rentang waktu scene (contoh: "0-5 detik")
- "caption": Caption media sosial resmi siap publikasi yang informatif, santun, dan komunikatif
- "hashtags": Array of strings berisi 6-10 hashtags resmi dan relevan (masukkan hashtag seperti #BLSDMKomdigi #DigitalTalentScholarship #LiterasiDigital #Komdigi) (contoh: ["#BLSDMKomdigi", "#DTS", "#LiterasiDigital"])
- "music_suggestion": Saran musik/audio latar yang tenang, profesional, elegan, dan sesuai untuk konten instansi pemerintah
- "cta": Call to Action resmi dan santun yang mengarahkan masyarakat untuk mendaftar atau mengakses informasi lebih lanjut melalui portal resmi BLSDM Komdigi (seperti website Digital Talent Scholarship)
 
Ketentuan:
1. Hubungkan secara jelas dengan program/fokus utama dari BLSDM Komdigi (Badan Pengembangan Sumber Daya Manusia Komunikasi dan Digital - Kemenkominfo/Komdigi), seperti program beasiswa pelatihan gratis Digital Talent Scholarship (DTS), kelas literasi digital, beasiswa IT, cybersecurity, digital marketing, AI academy, coding, atau kecakapan digital lainnya.
2. Menggunakan Bahasa Indonesia yang baik, benar, baku, formal, ramah, dan profesional sesuai standar instansi pemerintah. Hindari kata-kata gaul, slang, atau istilah Gen Z. SELALU gunakan sebutan/sapaan "Digiers" (sapaan khas Komdigi) untuk menyapa audiens/masyarakat di caption maupun narasi video.
3. Visual harus detail dan mudah diproduksi oleh tim media sosial instansi.
4. Narasi harus terstruktur, santun, baku, dan komunikatif.
5. Konsep harus edukatif, original, dan membangun citra positif pelayanan publik.
6. KETENTUAN STRING JSON: Semua value text di dalam JSON harus ditulis dalam satu baris (single line) tanpa karakter enter/newline mentah. Jika membutuhkan baris baru di dalam teks (misalnya untuk caption), gunakan escape character "\\n".
 
Format output harus tepat berupa JSON object:
{
  "title": "...",
  "format": "...",
  "duration": "...",
  "hook": "...",
  "scenes": [
    {"scene_number": 1, "visual": "...", "narration": "...", "duration": "..."},
    {"scene_number": 2, "visual": "...", "narration": "...", "duration": "..."}
  ],
  "caption": "...",
  "hashtags": ["#BLSDMKomdigi", "#DigitalTalentScholarship", "#LiterasiDigital"],
  "music_suggestion": "...",
  "cta": "..."
}`, theme, idea.Title, idea.Summary, idea.Format, idea.ReferenceURL, idea.Format)

	resp, err := model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		log.Printf("Failed to generate with gemini-3.5-flash-lite: %v. Retrying with gemini-3.6-flash...", err)
		model = client.GenerativeModel("gemini-3.6-flash")
		model.GenerationConfig.ResponseMIMEType = "application/json"
		resp, err = model.GenerateContent(ctx, genai.Text(prompt))
		if err != nil {
			return models.VideoContent{}, fmt.Errorf("failed to generate video content: %v", err)
		}
	}

	if len(resp.Candidates) == 0 || resp.Candidates[0].Content == nil || len(resp.Candidates[0].Content.Parts) == 0 {
		return models.VideoContent{}, fmt.Errorf("empty response from Gemini model")
	}

	var jsonText string
	for _, part := range resp.Candidates[0].Content.Parts {
		if text, ok := part.(genai.Text); ok {
			jsonText += string(text)
		}
	}

	var videoContent models.VideoContent
	err = json.Unmarshal([]byte(jsonText), &videoContent)
	if err != nil {
		log.Printf("Failed to parse JSON from Gemini video response: %s. Error: %v", jsonText, err)
		return models.VideoContent{}, fmt.Errorf("failed to parse JSON response: %v", err)
	}

	return videoContent, nil
}

// GenerateCaptionFromThemeTextWithGemini generates a text-only caption using Gemini when DeepSeek fails or is not available.
func GenerateCaptionFromThemeTextWithGemini(ctx context.Context, theme string) (string, error) {
	apiKey := os.Getenv("GEMINI_API_KEY")
	if isPlaceholderKey(apiKey) {
		log.Println("WARNING: GEMINI_API_KEY is not set or is a placeholder. Using mock multimodal caption generator.")
		return GenerateMockMultimodalCaption(theme, false), nil
	}

	client, err := genai.NewClient(ctx, option.WithAPIKey(apiKey))
	if err != nil {
		return "", fmt.Errorf("failed to create genai client: %v", err)
	}
	defer client.Close()

	model := client.GenerativeModel("gemini-3.5-flash-lite")

	prompt := fmt.Sprintf(`Buat caption media sosial resmi instansi pemerintah (BLSDM Komdigi) yang lengkap, informatif, jelas, dan profesional berdasarkan tema/topik: "%s".`, theme)
	formatPrompt := `\n\nSyarat caption:
1. Menggunakan Bahasa Indonesia yang baik, benar, baku, formal, ramah, dan komunikatif sesuai standar penyampaian informasi publik instansi pemerintah (BLSDM Komdigi). Hindari penggunaan gaya bahasa gaul, slang, bahasa santai non-formal, atau istilah Gen Z.
2. SELALU gunakan sebutan/sapaan "Digiers" (sapaan khas Komdigi) untuk menyapa audiens/masyarakat dalam caption (contoh: "Halo Digiers!", "Hai Digiers!", "Untuk Digiers yang ingin...", dll).
3. Memiliki struktur yang teratur dan jelas (Judul/Salam pembuka resmi yang menarik, penyampaian informasi/edukasi publik yang lugas dan padat, ajakan bertindak/Call to Action yang santun dan informatif, serta Tagar/Hashtag resmi instansi).
4. Gunakan emoji secara terukur, efektif, dan relevan untuk penekanan poin penting tanpa mengurangi keanggunan dan profesionalisme komunikasi instansi.
5. Respon hanya berisi teks caption langsung, jangan tambahkan pembuka markdown atau penjelasan lain.`

	resp, err := model.GenerateContent(ctx, genai.Text(prompt+formatPrompt))
	if err != nil {
		log.Printf("Failed to generate with gemini-3.5-flash-lite: %v. Retrying with gemini-3.6-flash...", err)
		model = client.GenerativeModel("gemini-3.6-flash")
		resp, err = model.GenerateContent(ctx, genai.Text(prompt+formatPrompt))
		if err != nil {
			return "", fmt.Errorf("failed to generate caption: %v", err)
		}
	}

	if len(resp.Candidates) == 0 || resp.Candidates[0].Content == nil || len(resp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("empty response from Gemini model")
	}

	var caption string
	for _, part := range resp.Candidates[0].Content.Parts {
		if text, ok := part.(genai.Text); ok {
			caption += string(text)
		}
	}

	return strings.TrimSpace(caption), nil
}

// GenerateMockThemes generates a list of placeholder themes if the Gemini API key is missing
func GenerateMockThemes(niche string, contentPillar string) []string {
	prefix := ""
	if contentPillar != "" && contentPillar != "Semua Pilar" {
		prefix = fmt.Sprintf("[%s] ", contentPillar)
	}

	return []string{
		fmt.Sprintf("%sPeningkatan Kapasitas SDM Digital Melalui %s 🚀", prefix, niche),
		fmt.Sprintf("%sFakta dan Edukasi Keamanan Informasi Seputar %s 🏛️", prefix, niche),
		fmt.Sprintf("%sPanduan Pemanfaatan Program Pelatihan %s BLSDM Komdigi 🎓", prefix, niche),
	}
}

// GenerateContentThemesWithGemini generates 3 recommendations for themes using Gemini
func GenerateContentThemesWithGemini(ctx context.Context, niche string, dateStr string, contentPillar string) ([]string, error) {
	apiKey := os.Getenv("GEMINI_API_KEY")
	if isPlaceholderKey(apiKey) {
		log.Println("WARNING: GEMINI_API_KEY is not set or is a placeholder. Using mock themes generator.")
		return GenerateMockThemes(niche, contentPillar), nil
	}

	client, err := genai.NewClient(ctx, option.WithAPIKey(apiKey))
	if err != nil {
		return nil, fmt.Errorf("failed to create genai client: %v", err)
	}
	defer client.Close()

	model := client.GenerativeModel("gemini-3.5-flash-lite")
	model.GenerationConfig.ResponseMIMEType = "application/json"

	pillarNote := ""
	if contentPillar != "" && contentPillar != "Semua Pilar" {
		pillarNote = fmt.Sprintf("\n- Sangat disarankan tema mengarah ke pilar konten: \"%s\".", contentPillar)
	}

	prompt := fmt.Sprintf(`Buat 3 rekomendasi tema/topik konten media sosial yang informatif, edukatif, dan profesional berstandar instansi pemerintah (BLSDM Komdigi) berdasarkan niche: "%s".
 
Setiap tema harus:
- Singkat, padat, berupa judul topik/tema konten (maksimal 6-8 kata, tanpa tanda petik, contoh: "Panduan Keamanan Data Pribadi Masyarakat").
- Relevan dengan edukasi publik dan peningkatan keterampilan digital masyarakat Indonesia.%s
- Secara profesional dihubungkan dengan program/fokus utama dari BLSDM Komdigi (Badan Pengembangan Sumber Daya Manusia Komunikasi dan Digital - Kemenkominfo/Komdigi), seperti program beasiswa pelatihan gratis Digital Talent Scholarship (DTS), kelas literasi digital, beasiswa IT, cybersecurity, digital marketing, AI academy, coding, atau kecakapan digital lainnya.

Jika tanggal "%s" disediakan, sesuaikan tema tersebut agar relevan dengan hari penting/event nasional/internasional pada tanggal tersebut (jika ada).

Format output harus tepat berupa JSON array of strings:
[
  "Tema 1",
  "Tema 2",
  "Tema 3"
]`, niche, pillarNote, dateStr)

	resp, err := model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		log.Printf("Failed to generate themes with gemini-3.5-flash-lite: %v. Retrying with gemini-3.6-flash...", err)
		model = client.GenerativeModel("gemini-3.6-flash")
		model.GenerationConfig.ResponseMIMEType = "application/json"
		resp, err = model.GenerateContent(ctx, genai.Text(prompt))
		if err != nil {
			return nil, fmt.Errorf("failed to generate themes: %v", err)
		}
	}

	if len(resp.Candidates) == 0 || resp.Candidates[0].Content == nil || len(resp.Candidates[0].Content.Parts) == 0 {
		return nil, fmt.Errorf("empty response from Gemini model")
	}

	var jsonText string
	for _, part := range resp.Candidates[0].Content.Parts {
		if text, ok := part.(genai.Text); ok {
			jsonText += string(text)
		}
	}

	jsonText = cleanAndRepairJSONArray(jsonText)

	var themes []string
	err = json.Unmarshal([]byte(jsonText), &themes)
	if err != nil {
		log.Printf("Failed to parse JSON from Gemini themes response: %s. Error: %v", jsonText, err)
		return nil, fmt.Errorf("failed to parse JSON response: %v", err)
	}

	return themes, nil
}

// cleanAndRepairJSONArray cleans markdown wrappers and repairs trailing missing brackets for JSON arrays
func cleanAndRepairJSONArray(s string) string {
	s = strings.TrimSpace(s)
	if strings.HasPrefix(s, "```json") {
		s = strings.TrimPrefix(s, "```json")
		s = strings.TrimSuffix(s, "```")
	} else if strings.HasPrefix(s, "```") {
		s = strings.TrimPrefix(s, "```")
		s = strings.TrimSuffix(s, "```")
	}
	s = strings.TrimSpace(s)

	if strings.HasPrefix(s, "[") && !strings.HasSuffix(s, "]") {
		s = strings.TrimRight(s, ", \t\n\r")
		s = s + "\n]"
	}
	return s
}


