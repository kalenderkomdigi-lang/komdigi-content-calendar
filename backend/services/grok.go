package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"content-calendar-backend/models"
)

type GrokMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type GrokChatRequest struct {
	Model          string          `json:"model"`
	Messages       []GrokMessage   `json:"messages"`
	ResponseFormat *ResponseFormat `json:"response_format,omitempty"`
}

type ResponseFormat struct {
	Type string `json:"type"`
}

type GrokChatResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

func isGrokPlaceholderKey(key string) bool {
	return key == "" ||
		strings.HasPrefix(strings.ToUpper(key), "YOUR") ||
		key == "CHANGE_ME" ||
		len(key) < 10 ||
		!strings.HasPrefix(key, "xai-")
}

func cleanJSONString(s string) string {
	s = strings.TrimSpace(s)
	// Remove potential markdown code blocks
	if strings.HasPrefix(s, "```json") {
		s = strings.TrimPrefix(s, "```json")
		s = strings.TrimSuffix(s, "```")
	} else if strings.HasPrefix(s, "```") {
		s = strings.TrimPrefix(s, "```")
		s = strings.TrimSuffix(s, "```")
	}
	return strings.TrimSpace(s)
}


func callGrokAPI(ctx context.Context, messages []GrokMessage, jsonMode bool) (string, error) {
	apiKey := os.Getenv("GROK_API_KEY")
	if isGrokPlaceholderKey(apiKey) {
		apiKey = os.Getenv("XAI_API_KEY")
	}
	if isGrokPlaceholderKey(apiKey) {
		apiKey = os.Getenv("DEEPSEEK_API_KEY")
	}
	if isGrokPlaceholderKey(apiKey) {
		return "", fmt.Errorf("GROK_API_KEY is not set or is a placeholder")
	}

	reqBody := GrokChatRequest{
		Model:    "grok-beta",
		Messages: messages,
	}
	if jsonMode {
		reqBody.ResponseFormat = &ResponseFormat{Type: "json_object"}
	}

	jsonBytes, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("failed to marshal grok request: %v", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", "https://api.x.ai/v1/chat/completions", bytes.NewBuffer(jsonBytes))
	if err != nil {
		return "", fmt.Errorf("failed to create http request: %v", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("http request failed: %v", err)
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response body: %v", err)
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("Grok API error (status %d): %s", resp.StatusCode, string(bodyBytes))
	}

	var chatResp GrokChatResponse
	if err := json.Unmarshal(bodyBytes, &chatResp); err != nil {
		return "", fmt.Errorf("failed to decode Grok response: %v", err)
	}

	if len(chatResp.Choices) == 0 {
		return "", fmt.Errorf("empty response choices from Grok")
	}

	return chatResp.Choices[0].Message.Content, nil
}

func GenerateContentIdeas(ctx context.Context, theme string, contentPillar string) ([]models.IdeaItem, error) {
	pillarInstruction := ""
	samplePillar := "Education/Information"
	if contentPillar != "" && contentPillar != "Semua Pilar" {
		samplePillar = contentPillar
		pillarInstruction = fmt.Sprintf(`
5. WAJIB FOKUS PADA PILAR KONTEN "%s":
Semua ide konten yang dihasilkan WAJIB secara spesifik merefleksikan karakteristik pilar ini:
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
- "pillar": sebutkan pilar konten untuk ide ini (contoh: "%s", "Entertainment", "Education/Information", "Trend", atau "Konten Nasional")
- "reference_url": satu link contoh konten yang SESUAI DENGAN FORMAT-nya. KETENTUAN UTAMA:
  * Jika format "Carousel Instagram" atau "Poster Infografis": WAJIB gunakan link Instagram explore tags/hashtag (contoh: https://www.instagram.com/explore/tags/literasidigital/) karena carousel dan poster adalah konten gambar/slide di Instagram. JANGAN gunakan link YouTube untuk format ini.
  * Jika format "Reels/TikTok": gunakan link TikTok tag (contoh: https://www.tiktok.com/tag/literasidigital) atau Instagram Reels explore tags.
  * Jika format "Video Pendek" atau "Motion Graphic": gunakan link pencarian YouTube (contoh: https://www.youtube.com/results?search_query=literasi+digital).
  * Jangan pernah mengarang ID video/post spesifik (seperti instagram.com/p/random_id atau tiktok.com/@user/video/random_id) karena link tersebut 100%% akan mati/tidak ditemukan.
  * Link harus selalu valid dan berawalan https://.
 
Ketentuan:
1. Hubungkan secara jelas dengan program/fokus utama dari BLSDM Komdigi (Badan Pengembangan Sumber Daya Manusia Komunikasi dan Digital - Kemenkominfo/Komdigi), seperti program beasiswa pelatihan gratis Digital Talent Scholarship (DTS), kelas literasi digital, beasiswa IT, cybersecurity, digital marketing, AI academy, coding, atau kecakapan digital lainnya. Konten harus mengedukasi masyarakat sekaligus mempublikasikan manfaat peningkatan keterampilan digital bersama BLSDM Komdigi.
2. Menggunakan Bahasa Indonesia yang baik, benar, baku, formal, ramah, dan profesional sesuai standar penyampaian informasi publik instansi pemerintah. Hindari bahasa gaul, slang, bahasa santai yang tidak resmi, atau istilah Gen Z.
3. Variasi format: Pastikan ketiga ide memiliki format yang berbeda-beda.
4. Untuk reference_url, pastikan link SESUAI DENGAN FORMAT konten:
   - Carousel Instagram / Poster Infografis -> gunakan tagar Instagram (https://www.instagram.com/explore/tags/...)
   - Reels/TikTok -> gunakan tagar TikTok (https://www.tiktok.com/tag/...) atau Instagram Reels tags
   - Video Pendek / Motion Graphic -> gunakan pencarian YouTube (https://www.youtube.com/results?search_query=...)
   Pastikan link URL ditulis utuh dan valid (selalu gunakan awalan https://).
 
Format output harus tepat berupa JSON array:
[
  {"title": "...", "summary": "...", "format": "Reels/TikTok", "pillar": "%s", "reference_url": "https://...."},
  {"title": "...", "summary": "...", "format": "Carousel Instagram", "pillar": "%s", "reference_url": "https://...."},
  {"title": "...", "summary": "...", "format": "Video Pendek", "pillar": "%s", "reference_url": "https://...."}  
]`, theme, pillarInstruction, samplePillar, samplePillar, samplePillar, samplePillar)

	messages := []GrokMessage{
		{Role: "user", Content: prompt},
	}

	log.Println("Attempting to generate ideas with Grok AI...")
	jsonText, err := callGrokAPI(ctx, messages, true)
	if err != nil {
		log.Printf("Grok AI ideas generation failed: %v. Falling back to Gemini...", err)
		return GenerateContentIdeasWithGemini(ctx, theme, contentPillar)
	}

	jsonText = cleanJSONString(jsonText)
	var ideas []models.IdeaItem
	err = json.Unmarshal([]byte(jsonText), &ideas)
	if err != nil {
		log.Printf("Failed to parse JSON from Grok response: %s. Error: %v. Falling back to Gemini...", jsonText, err)
		return GenerateContentIdeasWithGemini(ctx, theme, contentPillar)
	}

	// Ensure pillar is set if model omitted it and sanitize references
	for i := range ideas {
		if ideas[i].Pillar == "" {
			if contentPillar != "" && contentPillar != "Semua Pilar" {
				ideas[i].Pillar = contentPillar
			} else {
				ideas[i].Pillar = "Education/Information"
			}
		}

		// Sanitize reference URLs based on format
		fmtLower := strings.ToLower(ideas[i].Format)
		refLower := strings.ToLower(ideas[i].ReferenceURL)
		if strings.Contains(fmtLower, "carousel") || strings.Contains(fmtLower, "poster") || strings.Contains(fmtLower, "infografis") {
			if strings.Contains(refLower, "youtube.com") || strings.Contains(refLower, "youtu.be") || !strings.Contains(refLower, "instagram.com") {
				if strings.Contains(fmtLower, "carousel") {
					ideas[i].ReferenceURL = "https://www.instagram.com/explore/tags/carouseltips/"
				} else {
					ideas[i].ReferenceURL = "https://www.instagram.com/explore/tags/infografis/"
				}
			}
		} else if strings.Contains(fmtLower, "reels") || strings.Contains(fmtLower, "tiktok") {
			if strings.Contains(refLower, "youtube.com") && !strings.Contains(refLower, "shorts") {
				ideas[i].ReferenceURL = "https://www.tiktok.com/tag/literasidigital"
			}
		}
	}

	return ideas, nil
}

func GenerateCaption(ctx context.Context, theme string, ideas []models.IdeaItem) (string, error) {
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

	messages := []GrokMessage{
		{Role: "user", Content: prompt},
	}

	log.Println("Attempting to generate caption with Grok AI...")
	caption, err := callGrokAPI(ctx, messages, false)
	if err != nil {
		log.Printf("Grok AI caption generation failed: %v. Falling back to Gemini...", err)
		return GenerateCaptionWithGemini(ctx, theme, ideas)
	}

	return strings.TrimSpace(caption), nil
}

func GenerateCaptionFromThemeText(ctx context.Context, theme string) (string, error) {
	prompt := fmt.Sprintf(`Buat caption media sosial resmi instansi pemerintah (BLSDM Komdigi) yang lengkap, informatif, jelas, dan profesional berdasarkan tema/topik: "%s".`, theme)
	formatPrompt := `

Syarat caption:
1. Menggunakan Bahasa Indonesia yang baik, benar, baku, formal, ramah, dan komunikatif sesuai standar penyampaian informasi publik instansi pemerintah (BLSDM Komdigi). Hindari penggunaan gaya bahasa gaul, slang, bahasa santai non-formal, atau istilah Gen Z.
2. SELALU gunakan sebutan/sapaan "Digiers" (sapaan khas Komdigi) untuk menyapa audiens/masyarakat dalam caption (contoh: "Halo Digiers!", "Hai Digiers!", "Untuk Digiers yang ingin...", dll).
3. Memiliki struktur yang teratur dan jelas (Judul/Salam pembuka resmi yang menarik, penyampaian informasi/edukasi publik yang lugas dan padat, ajakan bertindak/Call to Action yang santun dan informatif, serta Tagar/Hashtag resmi instansi).
4. Gunakan emoji secara terukur, efektif, dan relevan untuk penekanan poin penting tanpa mengurangi keanggunan dan profesionalisme komunikasi instansi.
5. Respon hanya berisi teks caption langsung, jangan tambahkan pembuka markdown atau penjelasan lain.`

	messages := []GrokMessage{
		{Role: "user", Content: prompt + formatPrompt},
	}

	log.Println("Attempting to generate text-only caption with Grok AI...")
	caption, err := callGrokAPI(ctx, messages, false)
	if err != nil {
		log.Printf("Grok AI text caption generation failed: %v. Falling back to Gemini...", err)
		return GenerateCaptionFromThemeTextWithGemini(ctx, theme)
	}

	return strings.TrimSpace(caption), nil
}

func GenerateVideoContent(ctx context.Context, theme string, idea models.IdeaItem) (models.VideoContent, error) {
	fmtLower := strings.ToLower(idea.Format)
	isCarousel := strings.Contains(fmtLower, "carousel") || strings.Contains(fmtLower, "carrousel") || strings.Contains(fmtLower, "karosel") || strings.Contains(fmtLower, "slide")
	isPoster := strings.Contains(fmtLower, "poster") || strings.Contains(fmtLower, "infografis")
	var prompt string

	if isCarousel {
		prompt = fmt.Sprintf(`Kamu adalah penulis konten Carousel Instagram profesional untuk media sosial resmi instansi pemerintah (BLSDM Komdigi).

Konten ini adalah CAROUSEL INSTAGRAM (slide gambar geser). Setiap slide berisi TEKS KONTEN SAJA:
- "visual" = Judul/heading singkat topik slide tersebut (contoh: "Kecerdasan Buatan (AI)", "Manfaat Cloud Computing")
- "narration" = Paragraf penjelasan lengkap isi slide tersebut

DILARANG KERAS:
- Jangan gunakan istilah kamera, shot, angle, studio, presenter, pembawa acara, adegan, voiceover, detik, tipografi, desain grafis, layout, warna, ilustrasi, icon, atau deskripsi visual/desain apapun.
- Cukup tulis KONTEN TEKS murni: heading topik dan paragraf penjelasan.

Berdasarkan tema: "%s" dan IDE KONTEN:
- Judul Ide: "%s"
- Ringkasan: "%s"
- Format: Carousel Instagram (5-7 Slide)
- Pilar: "%s"

Buatkan konten teks slide-by-slide (5-7 slide):
- "title": Judul Carousel
- "format": "Carousel Instagram"
- "duration": "5-7 Slide"
- "hook": Headline besar penarik perhatian untuk Cover (Slide 1)
- "scenes": Array berisi 5-7 slide:
  * Slide 1 (Cover):
    - "scene_number": 1
    - "duration": "Slide 1 (Cover)"
    - "visual": Headline/hook utama carousel (contoh: "INI DIA! 5 Teknologi yang Mengubah Dunia")
    - "narration": Sama dengan visual atau kosong
  * Slide 2-N (Isi Materi):
    - "scene_number": 2, 3, dst.
    - "duration": "Slide 2", "Slide 3", dst.
    - "visual": Judul/heading singkat topik slide (contoh: "Kecerdasan Buatan (AI)")
    - "narration": Paragraf penjelasan lengkap tentang topik tersebut
  * Slide Terakhir (CTA/Penutup):
    - "scene_number": Terakhir
    - "duration": "Slide Terakhir (CTA)"
    - "visual": Heading penutup (contoh: "Simpan & Bagikan!")
    - "narration": "Simpan postingan ini dan bagikan kepada sesama Digiers! Kunjungi portal resmi BLSDM Komdigi untuk informasi lebih lanjut."
- "caption": Caption Instagram lengkap dengan sapaan "Halo Digiers!", ringkasan materi, ajakan bertindak (CTA).
- "hashtags": Array hashtag (#BLSDMKomdigi #DigitalTalentScholarship #LiterasiDigital)
- "music_suggestion": Rekomendasi audio/lagu tren Instagram
- "cta": Call to Action penutup

Format output harus tepat berupa JSON object:
{
  "title": "...",
  "format": "Carousel Instagram",
  "duration": "5 Slide",
  "hook": "...",
  "scenes": [
    {"scene_number": 1, "duration": "Slide 1 (Cover)", "visual": "...", "narration": "..."},
    {"scene_number": 2, "duration": "Slide 2", "visual": "...", "narration": "..."},
    {"scene_number": 3, "duration": "Slide 3", "visual": "...", "narration": "..."},
    {"scene_number": 4, "duration": "Slide 4", "visual": "...", "narration": "..."},
    {"scene_number": 5, "duration": "Slide 5 (CTA)", "visual": "...", "narration": "..."}
  ],
  "caption": "...",
  "hashtags": ["#BLSDMKomdigi", "#DigitalTalentScholarship", "#LiterasiDigital"],
  "music_suggestion": "...",
  "cta": "..."
}`, theme, idea.Title, idea.Summary, idea.Pillar)
	} else if isPoster {
		prompt = fmt.Sprintf(`Kamu adalah Graphic Designer dan Creative Director profesional untuk infografis media sosial resmi instansi pemerintah (BLSDM Komdigi).

Berdasarkan tema: "%s" dan IDE KONTEN:
- Judul Ide: "%s"
- Ringkasan: "%s"
- Format: "%s"

Buatkan 1 RANCANGAN STRUKTUR & KONTEN POSTER INFOGRAFIS (Single Slide):
- "title": Judul Poster Infografis
- "format": "Poster Infografis"
- "duration": "1 Lembar Poster (Format 4:5 / 1080x1350px)"
- "hook": Headline Utama di Bagian Header Poster
- "scenes": Array berisi 3-4 section poster:
  * Section 1: Header (Judul Utama & Sub-Header)
    - "scene_number": 1
    - "duration": "Bagian Atas (Header)"
    - "visual": Tata letak banner atas, logo resmi Komdigi RI, tipografi judul tegas
    - "narration": Teks Headline & Sub-judul utama poster
  * Section 2 & 3: Body (Bagan Data / Infografik / Poin Inti)
    - "scene_number": 2, 3
    - "duration": "Bagian Tengah (Infografik)"
    - "visual": Bagan visual, ikon grafis, statistik perbandingan, diagram alur
    - "narration": Teks poin-poin penjelasan edukatif yang ringkas dan padat
  * Section 4: Footer (Identitas & CTA)
    - "scene_number": 4
    - "duration": "Bagian Bawah (Footer & CTA)"
    - "visual": Logo program BLSDM Komdigi, QR code link pendaftaran, identitas resmi
    - "narration": Teks Call to Action dan sumber data resmi
- "caption": Caption media sosial pendukung
- "hashtags": Array hashtags resmi
- "music_suggestion": Audio tren latar yang tenang (opsional untuk postingan feed IG)
- "cta": Call to Action penutup

Format output harus tepat berupa JSON object:
{
  "title": "...",
  "format": "Poster Infografis",
  "duration": "1 Lembar Poster (1080x1350px)",
  "hook": "...",
  "scenes": [
    {"scene_number": 1, "duration": "Bagian Atas (Header)", "visual": "...", "narration": "..."},
    {"scene_number": 2, "duration": "Bagian Tengah (Infografik)", "visual": "...", "narration": "..."},
    {"scene_number": 3, "duration": "Bagian Bawah (Footer & CTA)", "visual": "...", "narration": "..."}
  ],
  "caption": "...",
  "hashtags": ["#BLSDMKomdigi", "#DigitalTalentScholarship", "#LiterasiDigital"],
  "music_suggestion": "...",
  "cta": "..."
}`, theme, idea.Title, idea.Summary, idea.Format)
	} else {
		// Reels / Video / TikTok
		prompt = fmt.Sprintf(`Kamu adalah tim komunikasi publik dan produser video profesional untuk media sosial resmi instansi pemerintah (BLSDM Komdigi).

Berdasarkan tema utama: "%s" dan IDE KONTEN:
- Judul Ide: "%s"
- Ringkasan: "%s"
- Format Asli: "%s"
- Referensi URL: "%s"

Buatkan 1 KONSEP STORYBOARD VIDEO PRODUCTION LENGKAP yang informatif, edukatif, terstruktur, dan siap diproduksi untuk publikasi resmi instansi. Video ini berformat pendek (Reels/TikTok/YouTube Shorts) dengan pendekatan profesional dan komunikatif.

Konsep video harus mencakup:
- "title": Judul video yang informatif, jelas, resmi, dan ramah publik
- "format": "Reels/TikTok"
- "duration": Estimasi durasi total (contoh: "30-60 detik")
- "hook": Kalimat pembuka atau visual yang menarik perhatian masyarakat di 3 detik pertama secara komunikatif dan santun
- "scenes": Array berisi 4-6 scene/adegan storyboard, setiap scene memiliki:
  - "scene_number": Nomor urut scene (integer)
  - "visual": Deskripsi detail visual/shot (angle kamera, pencahayaan, latar tempat, teks overlay resmi)
  - "narration": Naskah dialog/narasi resmi yang santun, baku, dan profesional
  - "duration": Rentang waktu scene (contoh: "0-5 detik")
- "caption": Caption media sosial resmi siap publikasi yang informatif, santun, dan komunikatif
- "hashtags": Array of strings berisi hashtag resmi (#BLSDMKomdigi #DigitalTalentScholarship #LiterasiDigital)
- "music_suggestion": Saran musik/audio latar yang tenang, profesional, dan elegan
- "cta": Call to Action resmi dan santun

Format output harus tepat berupa JSON object:
{
  "title": "...",
  "format": "Reels/TikTok",
  "duration": "...",
  "hook": "...",
  "scenes": [
    {"scene_number": 1, "duration": "0-5 detik", "visual": "...", "narration": "..."},
    {"scene_number": 2, "duration": "5-15 detik", "visual": "...", "narration": "..."}
  ],
  "caption": "...",
  "hashtags": ["#BLSDMKomdigi", "#DigitalTalentScholarship", "#LiterasiDigital"],
  "music_suggestion": "...",
  "cta": "..."
}`, theme, idea.Title, idea.Summary, idea.Format, idea.ReferenceURL)
	}

	messages := []GrokMessage{
		{Role: "user", Content: prompt},
	}

	log.Println("Attempting to generate video script with Grok AI...")
	jsonText, err := callGrokAPI(ctx, messages, true)
	if err != nil {
		log.Printf("Grok AI video script generation failed: %v. Falling back to Gemini...", err)
		return GenerateVideoContentWithGemini(ctx, theme, idea)
	}

	jsonText = cleanJSONString(jsonText)
	var videoContent models.VideoContent
	err = json.Unmarshal([]byte(jsonText), &videoContent)
	if err != nil {
		log.Printf("Failed to parse JSON from Grok video response: %s. Error: %v. Falling back to Gemini...", jsonText, err)
		return GenerateVideoContentWithGemini(ctx, theme, idea)
	}

	if isCarousel {
		videoContent.Format = "Carousel Instagram"
		if !strings.Contains(strings.ToLower(videoContent.Duration), "slide") {
			videoContent.Duration = fmt.Sprintf("%d Slide (1080x1350px 4:5)", len(videoContent.Scenes))
		}
		for i := range videoContent.Scenes {
			videoContent.Scenes[i].SceneNumber = i + 1
			if i == 0 {
				videoContent.Scenes[i].Duration = "Slide 1 (Cover)"
			} else if i == len(videoContent.Scenes)-1 {
				videoContent.Scenes[i].Duration = fmt.Sprintf("Slide %d (CTA/Penutup)", i+1)
			} else {
				videoContent.Scenes[i].Duration = fmt.Sprintf("Slide %d", i+1)
			}
		}
	} else if isPoster {
		videoContent.Format = "Poster Infografis"
		videoContent.Duration = "1 Lembar Poster (1080x1350px)"
	}

	return videoContent, nil
}

// GenerateContentThemes generates 3 recommendations for themes using Grok AI with fallback to Gemini
func GenerateContentThemes(ctx context.Context, niche string, dateStr string, contentPillar string) ([]string, error) {
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

	messages := []GrokMessage{
		{Role: "user", Content: prompt},
	}

	log.Println("Attempting to generate content themes with Grok AI...")
	jsonText, err := callGrokAPI(ctx, messages, true)
	if err != nil {
		log.Printf("Grok AI themes generation failed: %v. Falling back to Gemini...", err)
		geminiCtx, geminiCancel := context.WithTimeout(context.Background(), 60*time.Second)
		defer geminiCancel()
		return GenerateContentThemesWithGemini(geminiCtx, niche, dateStr, contentPillar)
	}

	jsonText = cleanAndRepairJSONArray(jsonText)
	var themes []string
	err = json.Unmarshal([]byte(jsonText), &themes)
	if err != nil {
		log.Printf("Failed to parse JSON from Grok themes response: %s. Error: %v. Falling back to Gemini...", jsonText, err)
		geminiCtx, geminiCancel := context.WithTimeout(context.Background(), 60*time.Second)
		defer geminiCancel()
		return GenerateContentThemesWithGemini(geminiCtx, niche, dateStr, contentPillar)
	}

	return themes, nil
}
