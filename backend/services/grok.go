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

	// Ensure pillar is set if model omitted it
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
- "duration": Estimasi durasi total (contoh: "60-120 detik")
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
