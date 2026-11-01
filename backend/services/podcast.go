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

// cleanTextForTitle returns a cleaned, capitalized version of the keyword
func cleanTextForTitle(s string) string {
	s = strings.TrimSpace(s)
	if s == "" {
		return "Topik Pilihan"
	}
	words := strings.Fields(s)
	for i, w := range words {
		if len(w) > 0 {
			words[i] = strings.ToUpper(w[:1]) + strings.ToLower(w[1:])
		}
	}
	return strings.Join(words, " ")
}

// GeneratePodcastThemesMock provides curated, ultra-relatable themes tailored to keyword or office & digital topics
func GeneratePodcastThemesMock(keyword string, category string, vibe string) []models.PodcastThemeIdea {
	kw := strings.TrimSpace(keyword)
	cat := strings.TrimSpace(category)
	if cat == "" {
		cat = "Karier & Pengembangan Diri"
	}

	// If keyword is specified, build dynamic, highly relatable themes directly centered on keyword
	if kw != "" {
		titleKw := cleanTextForTitle(kw)

		return []models.PodcastThemeIdea{
			{
				ID:                 "theme-1",
				Title:              fmt.Sprintf("Seni Menavigasi %s: Dari Overthinking Menuju Solusi Nyata", titleKw),
				Catchphrase:        fmt.Sprintf("\"Biar gak cuma jadi wacana di kepala, saatnya kita bedah tuntas %s dari sudut pandang paling aplikatif!\"", kw),
				Description:        fmt.Sprintf("Mengupas tantangan nyata dan dinamika seputar %s di dunia profesional masa kini, membedah kecemasan umum, serta menyusun strategi adaptasi terbaik.", kw),
				Category:           cat,
				Angle:              fmt.Sprintf("Komparasi jujur antara ekspektasi awal dengan realitas lapangan terkait %s.", kw),
				TargetAudience:     "Pegawai muda, profesional baru, anak magang, dan talenta digital.",
				PracticalApplication: fmt.Sprintf("Panduan aksi konkret 3 langkah untuk mengimplementasikan %s secara efektif tanpa terjebak kebiasaan lama.", kw),
				DiscussionPoints: []string{
					fmt.Sprintf("Miskonsepsi dan kesalahan umum yang sering dialami saat menghadapi %s", kw),
					fmt.Sprintf("Studi kasus nyata dan pengalaman adaptasi para rekan kerja terkait %s", kw),
					fmt.Sprintf("Langkah mitigasi praktis agar pemahaman %s berdampak langsung pada produktivitas", kw),
				},
				SuggestedQuestions: []string{
					fmt.Sprintf("Apa ketakutan atau kebingungan terbesar yang pertama kali muncul pas harus berhadapan dengan %s?", kw),
					fmt.Sprintf("Bisa ceritakan pengalaman nyata atau blunder yang pernah terjadi seputar %s dan cara mengatasinya?", kw),
					fmt.Sprintf("Tips paling realistis apa yang bisa langsung kita praktikkan hari ini terkait %s?", kw),
				},
				RelatabilityScore: 98,
			},
			{
				ID:                 "theme-2",
				Title:              fmt.Sprintf("Mitos vs Fakta Seputar %s: Apa yang Perlu Diketahui Sebelum Salah Langkah", titleKw),
				Catchphrase:        fmt.Sprintf("\"Kelihatannya rumit, tapi kalau tahu polanya, urusan %s bisa jadi jauh lebih terarah!\"", kw),
				Description:        fmt.Sprintf("Membongkar anggapan keliru yang beredar di tempat kerja mengenai %s dan menggantinya dengan wawasan berbasis data serta pengalaman nyata.", kw),
				Category:           cat,
				Angle:              fmt.Sprintf("Pendekatan investigatif dan solutif untuk mengurai kerumitan %s secara santai.", kw),
				TargetAudience:     "Praktisi muda, ASN muda, dan first jobber yang ingin memahami esensi topik ini.",
				PracticalApplication: fmt.Sprintf("Daftar ceklis evaluasi diri untuk memvalidasi apakah pendekatan kita terhadap %s sudah tepat dan efisien.", kw),
				DiscussionPoints: []string{
					fmt.Sprintf("3 mitos paling umum yang sering menghambat orang untuk maju dalam %s", kw),
					fmt.Sprintf("Fakta penting yang jarang dibahas orang di balik keberhasilan %s", kw),
					fmt.Sprintf("Cara menyaring informasi agar tidak tersesat dalam tren %s", kw),
				},
				SuggestedQuestions: []string{
					fmt.Sprintf("Pernah gak percaya mitos tentang %s yang ternyata setelah dijalani 180 derajat berbeda?", kw),
					fmt.Sprintf("Bagaimana cara membedakan antara saran yang beneran berguna sama yang cuma teori kosong tentang %s?", kw),
					fmt.Sprintf("Apa fondasi terpenting yang wajib dipahami sebelum melangkah lebih jauh dalam %s?", kw),
				},
				RelatabilityScore: 96,
			},
			{
				ID:                 "theme-3",
				Title:              fmt.Sprintf("Panduan Praktis Menguasai %s Tanpa Bikin Burnout", titleKw),
				Catchphrase:        fmt.Sprintf("\"Maju dan berkembang di bidang %s itu penting, tapi waras dan konsisten jauh lebih utama.\"", kw),
				Description:        fmt.Sprintf("Obrolan mendalam tentang cara mempelajari, menerapkan, dan mengintegrasikan %s ke dalam rutinitas kerja harian secara bertahap dan berkelanjutan.", kw),
				Category:           cat,
				Angle:              fmt.Sprintf("Harmonisasi antara ambisi peningkatan kompetensi seputar %s dan kesehatan mental kerja.", kw),
				TargetAudience:     "Pegawai muda, fresh graduates, dan generasi Z di lingkungan kantor.",
				PracticalApplication: fmt.Sprintf("Rencana aksi mingguan (micro-habits) untuk meningkatkan penguasaan %s dalam 15 menit sehari.", kw),
				DiscussionPoints: []string{
					fmt.Sprintf("Manajemen energi dan waktu saat harus belajar atau mengerjakan %s di tengah deadline", kw),
					fmt.Sprintf("Pemanfaatan tools dan fasilitas pendukung (seperti program pelatihan) untuk akselerasi %s", kw),
					fmt.Sprintf("Menjaga batasan kerja agar eksplorasi %s tetap menyenangkan dan produktif", kw),
				},
				SuggestedQuestions: []string{
					fmt.Sprintf("Seberapa sering kalian merasa kewalahan saat harus beradaptasi dengan tuntutan %s?", kw),
					fmt.Sprintf("Tools atau metode apa yang terbukti paling menghemat waktu kalian dalam urusan %s?", kw),
					fmt.Sprintf("Kapan waktu terbaik untuk bilang 'cukup dulu' agar tidak kelelahan saat mendalami %s?", kw),
				},
				RelatabilityScore: 97,
			},
			{
				ID:                 "theme-4",
				Title:              fmt.Sprintf("Peluang & Masa Depan %s: Mengubah Tantangan Jadi Nilai Tambah Karier", titleKw),
				Catchphrase:        fmt.Sprintf("\"Siapa yang siap adaptasi dengan %s hari ini, dia yang bakal jadi rujukan besok!\"", kw),
				Description:        fmt.Sprintf("Melihat prospek jangka panjang dan keunggulan kompetitif yang bisa diraih jika talenta muda proaktif menguasai %s di era transformasi digital.", kw),
				Category:           cat,
				Angle:              fmt.Sprintf("Orientasi masa depan dan peluang strategis bagi pegawai muda di lingkungan instansi terkait %s.", kw),
				TargetAudience:     "Talenta digital muda, aparatur muda, dan profesional yang berorientasi karier jangka panjang.",
				PracticalApplication: fmt.Sprintf("Strategi portofolio dan branding diri yang menunjukkan kompetensi konkret dalam %s.", kw),
				DiscussionPoints: []string{
					fmt.Sprintf("Tren industri dan kebijakan instansi yang berkaitan erat dengan %s ke depan", kw),
					fmt.Sprintf("Skill komplementer yang melipatgandakan nilai keahlian kita dalam %s", kw),
					fmt.Sprintf("Cara mendemonstrasikan hasil kerja seputar %s kepada tim dan pimpinan", kw),
				},
				SuggestedQuestions: []string{
					fmt.Sprintf("Menurut kalian, bagaimana tren %s ini bakal mengubah cara kerja kita 2-3 tahun ke depan?", kw),
					fmt.Sprintf("Peluang apa yang paling terbuka lebar tapi belum banyak dilirik orang di bidang %s?", kw),
					fmt.Sprintf("Bagaimana cara membuktikan ke atasan atau rekan kerja bahwa kita kompeten di urusan %s?", kw),
				},
				RelatabilityScore: 95,
			},
		}
	}

	// Default diverse, high-quality curated themes
	return []models.PodcastThemeIdea{
		{
			ID:                 "theme-1",
			Title:              "Lulus Kuliah Langsung Kerja: Ekspektasi vs Ditabrak Realita Kantor",
			Catchphrase:        "\"Dikiranya selesai skripsi hidup bakal tenang, taunya baru intro bos!\"",
			Description:        "Membahas syok budaya dari dunia kampus yang serba fleksibel ke dunia kantor dengan ritme 9-to-5, drama adaptasi, dan perasaan 'salah jurusan atau salah masuk dunia kerja'.",
			Category:           "Kegalauan Fresh Graduate",
			Angle:              "Komparasi jujur antara ekspektasi saat wisuda dengan realitas 3 bulan pertama di dunia kerja.",
			TargetAudience:     "Fresh graduate, anak magang, dan pegawai baru di bawah 2 tahun kerja.",
			PracticalApplication: "Tiga langkah adaptasi cepat di minggu pertama kerja agar tidak kaget budaya dan cepat diterima tim.",
			DiscussionPoints: []string{
				"Perbedaan mendasar kultur tugas kuliah vs deliverable kantor",
				"Cara berkomunikasi dengan rekan kerja lintas generasi",
				"Mengatasi rasa 'salah jurusan' dengan upskilling terarah",
			},
			SuggestedQuestions: []string{
				"Apa ekspektasi terbesar kalian pas pakai toga yang langsung hancur di minggu pertama kerja?",
				"Gimana cara ngadepin kultur kerja yang beda jauh sama dunia organisasi kampus?",
				"Pernah gak ngerasa 'kayaknya gue gak pantes di sini' alias kena imposter syndrome?",
			},
			RelatabilityScore: 98,
		},
		{
			ID:                 "theme-2",
			Title:              "Karier di Era AI & Kecakapan Digital: Kita yang Digantiin atau Kita yang Melesat?",
			Catchphrase:        "\"Daripada takut digantiin robot, mending kita yang suruh robotnya ngerjain tugas kantor!\"",
			Description:        "Obrolan santai tapi berbobot tentang bagaimana anak muda di instansi/kantor bisa memanfaatkan AI, beasiswa keahlian digital (seperti Digital Talent Scholarship), dan skill baru untuk upgrade nilai diri.",
			Category:           "Teknologi & Keterampilan Digital",
			Angle:              "Optimisme teknologi bagi anak muda kantor untuk menjadi lokomotif inovasi.",
			TargetAudience:     "Pegawai muda, talenta digital, generasi Z di lingkungan kerja.",
			PracticalApplication: "Daftar 3 tools AI gratis yang aman digunakan untuk merapikan laporan dan mempercepat riset kerja.",
			DiscussionPoints: []string{
				"Pemanfaatan AI generatif untuk efisiensi pekerjaan harian",
				"Etika dan keamanan data saat menggunakan platform kecerdasan buatan",
				"Akses pelatihan beasiswa digital gratis dari instansi resmi (BLSDM Komdigi)",
			},
			SuggestedQuestions: []string{
				"Tools AI apa yang udah ngebantu banget kerjaan kalian di kantor?",
				"Skill apa yang menurut kalian wajib dipelajari anak muda sekarang biar gak gampang tergeser?",
				"Peluang apa yang bisa dimanfaatkan anak muda di instansi buat bikin gebrakan baru?",
			},
			RelatabilityScore: 96,
		},
		{
			ID:                 "theme-3",
			Title:              "Seni Presentasi di Depan Pimpinan: Mengubah Panik Jadi Percaya Diri",
			Catchphrase:        "\"Slide udah rapi, tapi giliran dipanggil nama, suara mendadak bergetar!\"",
			Description:        "Tips praktis menghadapi demam panggung saat briefing, menyampaikan ide kepada atasan dengan lugas, dan menjawab pertanyaan menantang tanpa rasa takut.",
			Category:           "Komunikasi & Public Speaking",
			Angle:              "Teknik komunikasi taktis dari kacamata pegawai muda menghadapi dinamika rapat resmi.",
			TargetAudience:     "Staff baru, ASN muda, dan presenter kantor pemula.",
			PracticalApplication: "Teknik '3 Poin Kunci' untuk menjawab pertanyaan pimpinan secara terstruktur dalam 60 detik.",
			DiscussionPoints: []string{
				"Persiapan mental 5 menit sebelum masuk ruang rapat",
				"Cara merancang slide presentasi yang langsung menjawab kebutuhan pengambil keputusan",
				"Seni mengakui ketidaktahuan secara elegan tanpa terlihat tidak kompeten",
			},
			SuggestedQuestions: []string{
				"Momen presentasi paling bikin deg-degan apa yang pernah kalian alami di kantor?",
				"Gimana cara kalian ngontrol suara bergetar atau tangan dingin pas ngomong di depan banyak orang?",
				"Apa respons terbaik kalau pimpinan nanya hal di luar materi yang kita siapkan?",
			},
			RelatabilityScore: 97,
		},
		{
			ID:                 "theme-4",
			Title:              "Sindrom Imposter Anak Baru: 'Gue Beneran Bisa atau Cuma Hoki Masuk Sini?'",
			Catchphrase:        "\"Tiap mau kirim email rasanya deg-degan kayak mau sidang skripsi ulang.\"",
			Description:        "Mengupas tuntas rasa cemas anak baru di kantor yang merasa kurang pintar dibanding rekan kerja, takut bikin salah fatal, dan tips berdamai dengan proses belajar.",
			Category:           "Mental Health & Budaya Kerja",
			Angle:              "Membongkar mitos bahwa semua orang di kantor sudah tahu apa yang mereka lakukan.",
			TargetAudience:     "Anak magang, CPNS/ASN muda, pegawai baru.",
			PracticalApplication: "Jurnal pencapaian kecil (wins log) untuk melatih otak menyadari kontribusi nyata diri sendiri.",
			DiscussionPoints: []string{
				"Mengenali tanda-tanda imposter syndrome di lingkungan kerja",
				"Perbedaan antara rasa rendah hati yang sehat vs rasa minder yang melumpuhkan",
				"Membangun hubungan mentoring dengan senior yang suportif",
			},
			SuggestedQuestions: []string{
				"Pernah gak bikin blunder konyol pas baru masuk kantor yang bikin pengen ngilang ke Mars?",
				"Gimana cara ngilangin rasa minder pas satu ruangan sama rekan-rekan senior?",
				"Kapan titik balik kalian mulai ngerasa 'oke, gue ternyata bisa beresin tugas ini'?",
			},
			RelatabilityScore: 95,
		},
		{
			ID:                 "theme-5",
			Title:              "Antara Gaji Pertama, Biaya Hidup, dan Tuntutan Jadi 'Orang Dewasa'",
			Catchphrase:        "\"Gaji pertama turun, senangnya cuma 2 jam, sisanya mikir alokasi ini itu.\"",
			Description:        "Kegalauan finansial anak muda: dilema sandwich generation pemula, gengsi nongkrong vs tabungan masa depan, dan rasa bersalah jika belum bisa membelikan orang tua sesuatu yang mewah.",
			Category:           "Finansial & Quarter-Life Crisis",
			Angle:              "Realitas finansial anak muda pertama kali pegang uang sendiri tanpa nada menggurui.",
			TargetAudience:     "Pegawai muda, first jobber, generasi sandwich pemula.",
			PracticalApplication: "Rumus alokasi gaji sederhana 50/30/20 yang disesuaikan dengan kebutuhan hidup kota besar.",
			DiscussionPoints: []string{
				"Menentukan batas antara self-reward yang wajar vs konsumtif impulsif",
				"Komunikasi keuangan sehat dengan keluarga tanpa menimbulkan rasa bersalah",
				"Langkah awal membangun dana darurat bagi pekerja berpenghasilan pemula",
			},
			SuggestedQuestions: []string{
				"Momen pertama kalian sadar 'ternyata jadi orang dewasa itu mahal banget' kapan?",
				"Gimana cara ngatur batas antara bantu keluarga sama nyelametin tabungan pribadi?",
				"Berapa persen gaji yang rela kalian habiskan buat self-reward kopi dan healing?",
			},
			RelatabilityScore: 96,
		},
		{
			ID:                 "theme-6",
			Title:              "Work-Life Harmony: Produktif di Meja Kerja Tanpa Mengorbankan Kesehatan Mental",
			Catchphrase:        "\"Kerja keras boleh, tapi jangan sampai badan remuk dan jiwa gosong!\"",
			Description:        "Strategi mengelola beban kerja, menetapkan batasan profesional (boundaries), dan mencegah kelelahan mental (burnout) di tengah ritme kantor yang padat.",
			Category:           "Work-Life Balance & Produktivitas",
			Angle:              "Solusi realistis menjaga kestabilan energi jangka panjang bagi pekerja muda.",
			TargetAudience:     "Semua generasi pekerja muda yang ingin berkarier langgeng dan sehat.",
			PracticalApplication: "Protokol 'Shutdown Routine' di akhir jam kerja agar pikiran tidak terus terbawa urusan kantor di rumah.",
			DiscussionPoints: []string{
				"Tanda-tanda awal burnout yang sering diabaikan sebelum terlambat",
				"Seni berkata 'tidak' secara santun terhadap tugas tambahan di luar kapasitas",
				"Rutinitas relaksasi sederhana yang terbukti memulihkan fokus otak",
			},
			SuggestedQuestions: []string{
				"Pernah gak ngalamin titik jenuh banget sampai rasanya gak ada energi buat bangun pagi?",
				"Gimana cara kalian menetapkan batasan saat bos atau rekan kerja chat di luar jam kerja?",
				"Aktivitas sederhana apa yang paling ampuh nge-reset energi kalian setelah seminggu penuh kerja?",
			},
			RelatabilityScore: 94,
		},
	}
}

// parsePodcastThemesJSON parses JSON array or wrapper object into []models.PodcastThemeIdea
func parsePodcastThemesJSON(jsonText string) ([]models.PodcastThemeIdea, error) {
	jsonText = cleanAndRepairJSONArray(jsonText)

	// Try direct slice
	var themes []models.PodcastThemeIdea
	if err := json.Unmarshal([]byte(jsonText), &themes); err == nil && len(themes) > 0 {
		return themes, nil
	}

	// Try object wrappers: {"themes": [...]}, {"data": [...]}, {"ideas": [...]}, {"items": [...]}
	var wrapper struct {
		Themes []models.PodcastThemeIdea `json:"themes"`
		Data   []models.PodcastThemeIdea `json:"data"`
		Ideas  []models.PodcastThemeIdea `json:"ideas"`
		Items  []models.PodcastThemeIdea `json:"items"`
	}
	if err := json.Unmarshal([]byte(jsonText), &wrapper); err == nil {
		if len(wrapper.Themes) > 0 {
			return wrapper.Themes, nil
		}
		if len(wrapper.Data) > 0 {
			return wrapper.Data, nil
		}
		if len(wrapper.Ideas) > 0 {
			return wrapper.Ideas, nil
		}
		if len(wrapper.Items) > 0 {
			return wrapper.Items, nil
		}
	}

	return nil, fmt.Errorf("gagal mengurai JSON tema podcast")
}

// GeneratePodcastThemes generates themes using Gemini (or Grok) with intelligent mock fallback
func GeneratePodcastThemes(ctx context.Context, keyword string, category string, vibe string) ([]models.PodcastThemeIdea, error) {
	kw := strings.TrimSpace(keyword)
	cat := strings.TrimSpace(category)
	if cat == "" {
		cat = "Karier & Pengembangan Diri"
	}
	if vibe == "" {
		vibe = "PodHub Santai & Solutif"
	}

	prompt := fmt.Sprintf(`Kamu adalah Produser Kreatif & Konseptor Podcast Profesional untuk media komunikasi publik dan talkshow kantor/instansi modern (gaya PodHub, Podkesmas, Makna Talks, Thirty Days of Lunch).

TUGAS UTAMA:
Buatkan 4 sampai 6 rekomendasi TEMA PODCAST yang 100%% AKURAT, SANGAT RELEVAN, MENDALAM, DAN MEMILIKI DAYA GUNA PRAKTIS (RELATE UNTUK PENGGUNAANNYA) berdasarkan permintaan pengguna berikut:

- TOPIK / KATA KUNCI UTAMA DARI PENGGUNA: "%s"
- KATEGORI FOKUS: "%s"
- GAYA / VIBE OBROLAN: "%s"

PRINSIP KESESUAIAN & AKURASI WAJIB:
1. AKURASI MUTLAK: Seluruh tema yang dihasilkan WAJIB 100%% setia, tepat sasaran, dan berfokus langsung pada topik "%s". DILARANG KERAS membelokkan atau memaksakan topik ke hal lain yang tidak diminta oleh pengguna!
2. RELATE UNTUK PENGGUNAAN (APLIKATIF & BERBOBOT): Tema podcast harus dirancang agar siap diproduksi menjadi episode nyata. Bukan sekadar komplain atau keluhan kosong, melainkan ada solusi, tips konkret, dan nilai guna nyata bagi pendengar.
3. TONE & KESESUAIAN BAHASA: Gunakan Bahasa Indonesia yang segar, mengalir, cerdas, komunikatif, dan ramah. HINDARI bahasa kasar, vulgar, atau slang merendahkan (seperti 'jilat bos', 'killer', 'neraka'). Tetap profesional, positif, dan enak didengar.
4. STRUKTUR LENGKAP: Setiap tema wajib menyertakan manfaat praktis ("practical_application"), pilar bahasan utama ("discussion_points"), serta pertanyaan pemantik ("suggested_questions").

Format output WAJIB HANYA berupa JSON Array valid:
[
  {
    "id": "theme-1",
    "title": "Judul Episode Podcast yang Menarik, Catchy, dan Jelas Topiknya",
    "catchphrase": "\"Kutipan/punchline singkat yang mencerminkan inti obrolan\"",
    "description": "Sinopsis 2-3 kalimat mengenai latar belakang masalah, apa yang dibedah, dan mengapa ini penting bagi pendengar.",
    "category": "%s",
    "angle": "Sudut pandang unik obrolan (contoh: komparasi fakta vs mitos, panduan praktis, analisis solusi)",
    "target_audience": "Sasaran pendengar yang paling relate",
    "practical_application": "Manfaat nyata dan langkah konkret yang bisa langsung diterapkan pendengar setelah mendengarkan episode ini",
    "discussion_points": [
      "Pilar bahasan 1...",
      "Pilar bahasan 2...",
      "Pilar bahasan 3..."
    ],
    "suggested_questions": [
      "Pertanyaan pemantik cerdas 1...",
      "Pertanyaan pemantik cerdas 2...",
      "Pertanyaan pemantik cerdas 3..."
    ],
    "relatability_score": 98
  }
]`, kw, cat, vibe, kw, cat)

	// Try Gemini First (as configured and verified)
	apiKey := os.Getenv("GEMINI_API_KEY")
	if !isPlaceholderKey(apiKey) {
		log.Println("Generating podcast themes with Gemini (gemini-3.5-flash-lite)...")
		client, gErr := genai.NewClient(ctx, option.WithAPIKey(apiKey))
		if gErr == nil {
			defer client.Close()
			model := client.GenerativeModel("gemini-3.5-flash-lite")
			model.GenerationConfig.ResponseMIMEType = "application/json"
			resp, rErr := model.GenerateContent(ctx, genai.Text(prompt))

			// Fallback to gemini-3.8-flash if primary model fails
			if rErr != nil {
				log.Printf("gemini-3.5-flash-lite returned error: %v. Retrying with gemini-3.8-flash...", rErr)
				model = client.GenerativeModel("gemini-3.8-flash")
				model.GenerationConfig.ResponseMIMEType = "application/json"
				resp, rErr = model.GenerateContent(ctx, genai.Text(prompt))
			}

			if rErr == nil && len(resp.Candidates) > 0 && resp.Candidates[0].Content != nil {
				var gJson string
				for _, part := range resp.Candidates[0].Content.Parts {
					if text, ok := part.(genai.Text); ok {
						gJson += string(text)
					}
				}

				themes, pErr := parsePodcastThemesJSON(gJson)
				if pErr == nil && len(themes) > 0 {
					log.Printf("Successfully generated %d podcast themes with Gemini", len(themes))
					return themes, nil
				}
				log.Printf("Failed to parse Gemini themes JSON: %v. Raw length: %d", pErr, len(gJson))
			} else if rErr != nil {
				log.Printf("Gemini theme generation failed: %v", rErr)
			}
		} else {
			log.Printf("Failed to create Gemini client: %v", gErr)
		}
	}

	// Try Grok if valid key provided
	grokKey := os.Getenv("GROK_API_KEY")
	if strings.HasPrefix(grokKey, "xai-") {
		log.Println("Attempting to generate podcast themes with Grok AI...")
		messages := []GrokMessage{
			{Role: "user", Content: prompt},
		}
		jsonText, err := callGrokAPI(ctx, messages, true)
		if err == nil {
			themes, pErr := parsePodcastThemesJSON(jsonText)
			if pErr == nil && len(themes) > 0 {
				return themes, nil
			}
		}
	}

	// Fallback to smart tailored mock themes
	log.Printf("Using intelligent mock podcast themes generator for keyword: '%s'...", kw)
	return GeneratePodcastThemesMock(kw, cat, vibe), nil
}

// GenerateDynamicSpeakers creates natural characters for the podcast given speaker count
func GenerateDynamicSpeakers(speakerCount int, customSpeakers []models.PodcastSpeaker) []models.PodcastSpeaker {
	if len(customSpeakers) == speakerCount && speakerCount > 0 {
		return customSpeakers
	}

	defaultTemplates := []models.PodcastSpeaker{
		{
			ID:          1,
			Name:        "Rangga",
			Role:        "Host Utama",
			Persona:     "Pembawa acara santai, komunikatif, ahli memancing curhat, dan suka bikin suasana hidup.",
			AvatarColor: "amber",
		},
		{
			ID:          2,
			Name:        "Dinda",
			Role:        "Narasumber (Fresh Grad)",
			Persona:     "Fresh graduate baru lulus 4 bulan, lagi masa adaptasi di kantor, overthinking masa depan tapi penuh semangat.",
			AvatarColor: "blue",
		},
		{
			ID:          3,
			Name:        "Bayu",
			Role:        "Narasumber (Senior Muda)",
			Persona:     "Pegawai yang sudah 3 tahun kerja di kantor, realistis, pernah melewati masa-masa galau pas lulus, solutif.",
			AvatarColor: "emerald",
		},
		{
			ID:          4,
			Name:        "Rian",
			Role:        "Narasumber (Teman Kantor Kocak)",
			Persona:     "Rekan kerja seumuran yang blak-blakan, punya banyak cerita blunder lucu, dan jago mencairkan ketegangan.",
			AvatarColor: "purple",
		},
		{
			ID:          5,
			Name:        "Sarah",
			Role:        "Narasumber / Co-Host (Talenta Muda)",
			Persona:     "Pemerhati tren karier dan teknologi muda, wawasan luas seputar skill digital, bijak dan inspiratif.",
			AvatarColor: "rose",
		},
	}

	if speakerCount < 2 {
		speakerCount = 2
	}
	if speakerCount > 5 {
		speakerCount = 5
	}

	result := make([]models.PodcastSpeaker, speakerCount)
	for i := 0; i < speakerCount; i++ {
		result[i] = defaultTemplates[i]
	}
	return result
}

// GenerateMockPodcastScript produces a rich, realistic Indonesian youth podcast script
func GenerateMockPodcastScript(theme string, description string, speakerCount int, customSpeakers []models.PodcastSpeaker, duration string, vibe string) models.PodcastEpisode {
	speakers := GenerateDynamicSpeakers(speakerCount, customSpeakers)

	if theme == "" {
		theme = "Kegalauan Anak Muda Saat Lulus Kuliah dan Masuk Dunia Kerja"
	}
	if duration == "" {
		duration = "20-25 Menit"
	}
	if vibe == "" {
		vibe = "PodHub Santai & Relatable"
	}

	sp1 := speakers[0] // Host
	sp2 := speakers[1] // Guest 1
	var sp3, sp4, sp5 models.PodcastSpeaker
	if speakerCount >= 3 {
		sp3 = speakers[2]
	}
	if speakerCount >= 4 {
		sp4 = speakers[3]
	}
	if speakerCount >= 5 {
		sp5 = speakers[4]
	}

	// Build segments dynamically according to speaker count
	var segments []models.PodcastSegment

	// Segmen 1: Cold Open & Opening Santai
	seg1Dialogue := []models.PodcastDialogueLine{
		{
			SpeakerID:   sp1.ID,
			SpeakerName: sp1.Name,
			SpeakerRole: sp1.Role,
			Cue:         "(tersenyum ke kamera, menepuk meja pelan)",
			Line:        fmt.Sprintf("Halo semuanya! Balik lagi di PodHub Kantor kita tercinta. Hari ini topik obrolan kita bener-bener gak ada filter, karena kita bakal bedah topik: \"%s\"!", theme),
		},
		{
			SpeakerID:   sp2.ID,
			SpeakerName: sp2.Name,
			SpeakerRole: sp2.Role,
			Cue:         "(tertawa kecil sambil menghela napas relate)",
			Line:        "Jujur pas denger judulnya tadi gue langsung kena mental duluan, Rangga. Berasa disindir langsung di depan muka!",
		},
	}

	if speakerCount >= 3 {
		seg1Dialogue = append(seg1Dialogue, models.PodcastDialogueLine{
			SpeakerID:   sp3.ID,
			SpeakerName: sp3.Name,
			SpeakerRole: sp3.Role,
			Cue:         "(terkekeh santai)",
			Line:        "Tenang Din, kamu gak sendirian. Dulu pas gue baru lulus juga tiap buka mata mikirnya: 'Gue beneran udah jadi orang dewasa apa cuma lagi main peran sinetron?'",
		})
	}
	if speakerCount >= 4 {
		seg1Dialogue = append(seg1Dialogue, models.PodcastDialogueLine{
			SpeakerID:   sp4.ID,
			SpeakerName: sp4.Name,
			SpeakerRole: sp4.Role,
			Cue:         "(menimpali heboh)",
			Line:        "Bener banget! Dulu gue pas wisuda gayanya selangit, lempar toga paling tinggi. Eh pas minggu depannya ditanyain tetangga 'Kerja di mana le?', langsung lemes!",
		})
	}
	if speakerCount >= 5 {
		seg1Dialogue = append(seg1Dialogue, models.PodcastDialogueLine{
			SpeakerID:   sp5.ID,
			SpeakerName: sp5.Name,
			SpeakerRole: sp5.Role,
			Cue:         "(mengangguk setuju dengan senyum hangat)",
			Line:        "Tapi itu fenomena yang wajar banget ya buat kita semua. Transisi dari dunia kampus ke lingkungan profesional itu salah satu fase paling menantang.",
		})
	}
	seg1Dialogue = append(seg1Dialogue, models.PodcastDialogueLine{
		SpeakerID:   sp1.ID,
		SpeakerName: sp1.Name,
		SpeakerRole: sp1.Role,
		Cue:         "(menatap audiens dengan antusias)",
		Line:        "Nah makanya di episode kali ini kita bakal kupas tuntas dari ekspektasi pas wisuda, syok budaya di kantor, sampai tips biar mental kita tetap waras dan terus berkembang!",
	})

	segments = append(segments, models.PodcastSegment{
		SegmentNumber: 1,
		Title:         fmt.Sprintf("Segmen 1: Cold Open & Intro - Mengapa Kita Perlu Membahas %s", theme),
		Duration:      "3-5 Menit",
		Summary:       fmt.Sprintf("Pembukaan kasual ala PodHub, saling menyapa, dan memperkenalkan latar belakang pentingnya topik '%s'.", theme),
		Dialogue:      seg1Dialogue,
	})

	// Segmen 2: Curhat Lapangan & Ekspektasi vs Realita
	seg2Dialogue := []models.PodcastDialogueLine{
		{
			SpeakerID:   sp1.ID,
			SpeakerName: sp1.Name,
			SpeakerRole: sp1.Role,
			Cue:         "(mencondongkan badan ke arah narasumber)",
			Line:        fmt.Sprintf("Oke %s, ceritain dong secara jujur. Pas pertama kali harus berhadapan dengan topik \"%s\", apa sih bayangan atau kekhawatiran terbesar kamu?", sp2.Name, theme),
		},
		{
			SpeakerID:   sp2.ID,
			SpeakerName: sp2.Name,
			SpeakerRole: sp2.Role,
			Cue:         "(mengingat-ingat sambil tersenyum relate)",
			Line:        fmt.Sprintf("Jujur ekspektasi gue awalnya mikir ini bakal kaku banget atau susah dipraktikkan. Tapi pas udah terjun langsung ke urusan \"%s\", ternyata tantangannya lebih ke konsistensi dan mindset kita sendiri!", theme),
		},
	}

	if speakerCount >= 3 {
		seg2Dialogue = append(seg2Dialogue, models.PodcastDialogueLine{
			SpeakerID:   sp3.ID,
			SpeakerName: sp3.Name,
			SpeakerRole: sp3.Role,
			Cue:         "(tertawa mengerti)",
			Line:        fmt.Sprintf("Klasik banget! Yang paling sering bikin orang ragu di topik \"%s\" itu karena banyak mitos dan info yang beredar setengah-setengah. Padahal kalau dipelajari pelan-pelan, ini ngebantu banget buat kerjaan kita.", theme),
		})
	}
	if speakerCount >= 4 {
		seg2Dialogue = append(seg2Dialogue, models.PodcastDialogueLine{
			SpeakerID:   sp4.ID,
			SpeakerName: sp4.Name,
			SpeakerRole: sp4.Role,
			Cue:         "(menambahkan cerita seru)",
			Line:        fmt.Sprintf("Asli! Dulu pas pertama kali dibilangin harus nguasai hal ini, gue sempat mikir: 'Aduh, apa gak nambah beban kerja nih?'. Eh ternyata pas udah diterapin, malah bikin alur kerja jauh lebih ringkas!", ),
		})
	}
	if speakerCount >= 5 {
		seg2Dialogue = append(seg2Dialogue, models.PodcastDialogueLine{
			SpeakerID:   sp5.ID,
			SpeakerName: sp5.Name,
			SpeakerRole: sp5.Role,
			Cue:         "(memberikan analisis relatable)",
			Line:        fmt.Sprintf("Dan yang menarik dari \"%s\" ini adalah relevansinya lintas fungsi ya. Mau anak magang, staf baru, sampai senior, semuanya punya sudut pandang dan manfaat masing-masing.", theme),
		})
	}

	segments = append(segments, models.PodcastSegment{
		SegmentNumber: 2,
		Title:         fmt.Sprintf("Segmen 2: Curhat Lapangan & Fenomena Nyata Seputar %s", theme),
		Duration:      "5-7 Menit",
		Summary:       fmt.Sprintf("Membongkar pengalaman nyata, dinamika, dan tantangan yang kerap dihadapi rekan kerja seputar '%s'.", theme),
		Dialogue:      seg2Dialogue,
	})

	// Segmen 3: Deep Talk & Dinamika Topik
	seg3Dialogue := []models.PodcastDialogueLine{
		{
			SpeakerID:   sp1.ID,
			SpeakerName: sp1.Name,
			SpeakerRole: sp1.Role,
			Cue:         "(nada suara lebih mendalam dan empatik)",
			Line:        fmt.Sprintf("Nah kalau kita bedah lebih dalam, apa sih titik paling krusial yang sering bikin orang salah langkah pas nerapin \"%s\"?", theme),
		},
		{
			SpeakerID:   sp2.ID,
			SpeakerName: sp2.Name,
			SpeakerRole: sp2.Role,
			Cue:         "(mengangguk kuat-kuat)",
			Line:        "Kebanyakan orang pengennya hasil instan tanpa memahami dasar-dasarnya. Jadi begitu ketemu kendala teknis atau resistensi di kantor, langsung ngerasa gak cocok.",
		},
	}

	if speakerCount >= 3 {
		seg3Dialogue = append(seg3Dialogue, models.PodcastDialogueLine{
			SpeakerID:   sp3.ID,
			SpeakerName: sp3.Name,
			SpeakerRole: sp3.Role,
			Cue:         "(berbicara dengan tenang dan bijak)",
			Line:        "Kuncinya itu ada di proses adaptasi bertahap. Jangan sungkan untuk berdiskusi terbuka dan minta masukan dari rekan yang sudah lebih berpengalaman.",
		})
	}
	if speakerCount >= 4 {
		seg3Dialogue = append(seg3Dialogue, models.PodcastDialogueLine{
			SpeakerID:   sp4.ID,
			SpeakerName: sp4.Name,
			SpeakerRole: sp4.Role,
			Cue:         "(tersenyum santai)",
			Line:        "Betul, yang penting jangan malu bertanya. Lebih baik cerewet di awal tapi hasilnya rapi, daripada sok tahu tapi ujungnya bikin kerja dua kali!",
		})
	}
	if speakerCount >= 5 {
		seg3Dialogue = append(seg3Dialogue, models.PodcastDialogueLine{
			SpeakerID:   sp5.ID,
			SpeakerName: sp5.Name,
			SpeakerRole: sp5.Role,
			Cue:         "(menekankan poin penting)",
			Line:        "Dan manfaatkan ekosistem kolaborasi. Sekarang banyak sumber daya dan pelatihan resmi instansi yang bisa kita optimalkan bersama.",
		})
	}

	segments = append(segments, models.PodcastSegment{
		SegmentNumber: 3,
		Title:         fmt.Sprintf("Segmen 3: Deep Talk & Dinamika Tantangan dalam %s", theme),
		Duration:      "5-7 Menit",
		Summary:       fmt.Sprintf("Analisis mendalam mengenai tantangan utama, sudut pandang berbeda, dan cara menyikapinya seputar '%s'.", theme),
		Dialogue:      seg3Dialogue,
	})

	// Segmen 4: Solusi Praktis & Upgrade Diri
	seg4Dialogue := []models.PodcastDialogueLine{
		{
			SpeakerID:   sp1.ID,
			SpeakerName: sp1.Name,
			SpeakerRole: sp1.Role,
			Cue:         "(tersenyum optimis)",
			Line:        fmt.Sprintf("Sekarang kita masuk ke bagian solusinya! Buat teman-teman yang lagi dengerin, apa langkah konkret pertama yang bisa langsung diterapkan terkait \"%s\"?", theme),
		},
	}

	if speakerCount >= 3 {
		seg4Dialogue = append(seg4Dialogue, models.PodcastDialogueLine{
			SpeakerID:   sp3.ID,
			SpeakerName: sp3.Name,
			SpeakerRole: sp3.Role,
			Cue:         "(memberikan tips konkret)",
			Line:        fmt.Sprintf("Pertama, mulai dari langkah kecil harian. Cari referensi atau program pelatihan resmi terstruktur, misalnya kelas peningkatan keterampilan digital dari instansi. Kuasai fundamental \"%s\" sebelum buru-buru ke level lanjut.", theme),
		})
	}
	if speakerCount >= 5 {
		seg4Dialogue = append(seg4Dialogue, models.PodcastDialogueLine{
			SpeakerID:   sp5.ID,
			SpeakerName: sp5.Name,
			SpeakerRole: sp5.Role,
			Cue:         "(menambahkan)",
			Line:        "Kedua, bangun kebiasaan evaluasi diri. Setelah mempraktikkan cara baru, catat apa yang berhasil dan bagian mana yang masih perlu disempurnakan.",
		})
	}
	if speakerCount >= 4 {
		seg4Dialogue = append(seg4Dialogue, models.PodcastDialogueLine{
			SpeakerID:   sp4.ID,
			SpeakerName: sp4.Name,
			SpeakerRole: sp4.Role,
			Cue:         "(tersenyum ceria)",
			Line:        "Dan jangan lupa jaga ritme kerja! Belajar dan adaptasi hal baru itu butuh energi, jadi pastikan istirahat dan work-life balance kalian tetap terjaga.",
		})
	}
	seg4Dialogue = append(seg4Dialogue, models.PodcastDialogueLine{
		SpeakerID:   sp2.ID,
		SpeakerName: sp2.Name,
		SpeakerRole: sp2.Role,
		Cue:         "(tersenyum lega dan bersemangat)",
		Line:        fmt.Sprintf("Obrolan kita bikin topik \"%s\" ini jadi berasa jauh lebih masuk akal dan gak bikin overthinking lagi. Semangat banget buat langsung coba praktikin!", theme),
	})

	segments = append(segments, models.PodcastSegment{
		SegmentNumber: 4,
		Title:         fmt.Sprintf("Segmen 4: Solusi Praktis & Langkah Aksi Menguasai %s", theme),
		Duration:      "4-6 Menit",
		Summary:       fmt.Sprintf("Berbagi tips konkret, aksi nyata, dan rekomendasi implementasi seputar '%s'.", theme),
		Dialogue:      seg4Dialogue,
	})

	// Segmen 5: Closing Statement & Outro
	seg5Dialogue := []models.PodcastDialogueLine{
		{
			SpeakerID:   sp1.ID,
			SpeakerName: sp1.Name,
			SpeakerRole: sp1.Role,
			Cue:         "(merangkum obrolan dengan hangat)",
			Line:        fmt.Sprintf("Sebelum kita tutup episode spesial kali ini, boleh dong masing-masing kasih satu pesan penutup terkait topik \"%s\" buat para pendengar!", theme),
		},
		{
			SpeakerID:   sp2.ID,
			SpeakerName: sp2.Name,
			SpeakerRole: sp2.Role,
			Cue:         "(menatap kamera dengan tulus)",
			Line:        fmt.Sprintf("\"Jangan takut memulai hal baru terkait %s. Langkah awal mungkin terasa canggung, tapi itu bukti nyata bahwa kita sedang bertumbuh!\"", theme),
		},
	}

	if speakerCount >= 3 {
		seg5Dialogue = append(seg5Dialogue, models.PodcastDialogueLine{
			SpeakerID:   sp3.ID,
			SpeakerName: sp3.Name,
			SpeakerRole: sp3.Role,
			Cue:         "(mengangguk mantap)",
			Line:        "\"Kompetensi dan rasa percaya diri itu dibentuk lewat proses konsisten, bukan keajaiban semalam. Teruslah belajar!\"",
		})
	}
	if speakerCount >= 4 {
		seg5Dialogue = append(seg5Dialogue, models.PodcastDialogueLine{
			SpeakerID:   sp4.ID,
			SpeakerName: sp4.Name,
			SpeakerRole: sp4.Role,
			Cue:         "(tersenyum santai)",
			Line:        "\"Hadapi setiap tantangan kerja dengan senyuman dan komunikasi terbuka. Solusi selalu ada saat kita mau berkolaborasi.\"",
		})
	}
	if speakerCount >= 5 {
		seg5Dialogue = append(seg5Dialogue, models.PodcastDialogueLine{
			SpeakerID:   sp5.ID,
			SpeakerName: sp5.Name,
			SpeakerRole: sp5.Role,
			Cue:         "(tersenyum penuh motivasi)",
			Line:        "\"Masa depan profesional yang gemilang adalah milik mereka yang adaptif, berintegritas, dan tidak pernah lelah mengasah diri.\"",
		})
	}

	seg5Dialogue = append(seg5Dialogue, models.PodcastDialogueLine{
		SpeakerID:   sp1.ID,
		SpeakerName: sp1.Name,
		SpeakerRole: sp1.Role,
		Cue:         "(melambaikan tangan ke kamera, musik outro mulai naik)",
		Line:        fmt.Sprintf("Luar biasa! Itu dia obrolan PodHub kita hari ini seputar \"%s\". Jangan lupa like, bagikan ke rekan kerja kalian, dan nantikan episode seru berikutnya! Sampai jumpa!", theme),
	})

	segments = append(segments, models.PodcastSegment{
		SegmentNumber: 5,
		Title:         fmt.Sprintf("Segmen 5: Closing Statement & Rekomendasi Terkait %s", theme),
		Duration:      "2-3 Menit",
		Summary:       fmt.Sprintf("Pesan bermakna dari masing-masing pembicara dan penutup resmi dari host untuk episode '%s'.", theme),
		Dialogue:      seg5Dialogue,
	})

	keyTakeaways := []string{
		fmt.Sprintf("Memahami esensi dan konteks nyata seputar '%s' di lingkungan kerja profesional.", theme),
		"Menghilangkan keraguan dan mitos umum lewat pemahaman berbasis fakta dan pengalaman lapangan.",
		"Menerapkan langkah aksi bertahap agar peningkatan kompetensi berkelanjutan tanpa memicu burnout.",
		"Memanfaatkan ekosistem pelatihan, kolaborasi tim, dan mentoring untuk akselerasi hasil.",
	}

	caption := fmt.Sprintf("🎙️ [PODHUB SPESIAL: %s] 🎙️\n\nSiapa bilang urusan \"%s\" itu kaku dan bikin overthinking? 🤔✨\n\nDi episode PodHub kali ini, kita hadir bersama %d pembicara yang membedah tuntas:\n📌 Realitas lapangan & tantangan umum yang sering dihadapi\n📌 Mitos vs fakta seputar penerapan praktisnya\n📌 Solusi konkret & langkah aksi nyata yang bisa langsung diterapkan di tempat kerja!\n\nSimak obrolan lengkapnya dan bagikan insight bermanfaat ini ke rekan kerja dan tim Anda! 💬🎧\n\n#PodHub #InovasiKerja #LiterasiDigital #DTS #BLSDMKomdigi #PengembanganKarier", strings.ToUpper(theme), theme, speakerCount)

	return models.PodcastEpisode{
		Title:         fmt.Sprintf("PodHub Episode: %s", theme),
		Topic:         theme,
		Category:      "Kegalauan Fresh Graduate & Adaptasi Karier",
		Vibe:          vibe,
		Duration:      duration,
		SpeakerCount:  speakerCount,
		Speakers:      speakers,
		Segments:      segments,
		KeyTakeaways:  keyTakeaways,
		SocialCaption: caption,
	}
}

// GeneratePodcastScript generates a full podcast script using Grok/Gemini with mock fallback
func GeneratePodcastScript(ctx context.Context, theme string, description string, speakerCount int, customSpeakers []models.PodcastSpeaker, duration string, vibe string) (models.PodcastEpisode, error) {
	if speakerCount < 2 {
		speakerCount = 2
	}
	if speakerCount > 5 {
		speakerCount = 5
	}
	if duration == "" {
		duration = "20-25 Menit"
	}
	if vibe == "" {
		vibe = "PodHub Kasual & Relatable"
	}

	speakers := GenerateDynamicSpeakers(speakerCount, customSpeakers)
	speakersJson, _ := json.Marshal(speakers)

	prompt := fmt.Sprintf(`Kamu adalah Scriptwriter & Produser Eksekutif Podcast PodHub Anak Muda Indonesia yang sangat handal, gaul, natural, cerdas, dan komunikatif.

TUGAS UTAMA:
Buatkan NASKAH LENGKAP PODCAST / PODHUB TALKSHOW ANAK MUDA KANTOR yang 100%% SETIA DAN SPESIFIK MEMBAHAS TEMA BERIKUT:

- JUDUL TEMA YANG DITENTUKAN PENGGUNA: "%s"
- DESKRIPSI & SUDUT PANDANG: "%s"
- Jumlah Pembicara yang Hadir: %d orang.
- Profil Pembicara:
%s
- Estimasi Durasi: "%s"
- Gaya/Vibe Acara: "%s"

INSTRUKSI WAJIB DIPATUHI:
1. JUDUL EPISODE PADA OUTPUT JSON HARUS TEPAT: "PodHub Episode: %s" (DILARANG KERAS mengganti judul atau mengarang judul lain!).
2. TOPIK PEMBAHASAN ("topic") HARUS BERNILAI PERSIS: "%s".
3. SELURUH PERCAKAPAN DARI AWAL HINGGA AKHIR HARUS MEMBAHAS SECARA MENDALAM TEMA "%s". Jangan menyimpang ke topik lain yang tidak relevan!
4. Dialog antar pembicara (%d orang) harus mengalir sangat alami ala obrolan PodHub (Deddy Corbuzier / Agak Laen / VINDES / tongkrongan kantor muda), ada humor cerdas, jujur, relatable, dan solutif.
5. Setiap pembicara (%d orang) HARUS MENDAPAT PORSI DIALOG yang aktif dan seimbang sesuai karakternya.
6. Setiap baris dialog memiliki petunjuk panggung/intonasi "cue" (contoh: "(tertawa lepas)", "(menghela napas relate)", "(menimpali cepat)", "(menatap kamera)").
7. Susun dalam 5 Segmen yang semuanya berpusat pada tema "%s":
   - Segmen 1: Cold Open & Pembukaan Santai (Ice breaking, sapaan hangat, dan mengenalkan tema obrolan "%s").
   - Segmen 2: Curhat Lapangan & Fenomena Nyata (Membongkar pengalaman nyata dan kegalauan seputar "%s").
   - Segmen 3: Deep Talk & Dinamika Obrolan (Perdebatan seru, saling menanggapi, adu sudut pandang seputar "%s").
   - Segmen 4: Tips Solutif & Sudut Pandang Positif (Solusi praktis dan cara menyikapi "%s").
   - Segmen 5: Closing Statement & Outro (Pesan bermakna dari masing-masing orang tentang "%s" + outro penutup host).
8. Sertakan "key_takeaways" (array 4 poin penting seputar "%s") dan "social_caption" promosi.

Format output WAJIB HANYA berupa JSON Object valid:
{
  "title": "PodHub Episode: %s",
  "topic": "%s",
  "category": "Podcast Anak Muda Kantor",
  "vibe": "%s",
  "duration": "%s",
  "speaker_count": %d,
  "speakers": %s,
  "segments": [
    {
      "segment_number": 1,
      "title": "Segmen 1: Cold Open & Intro - ...",
      "duration": "3-5 Menit",
      "summary": "...",
      "dialogue": [
        {
          "speaker_id": 1,
          "speaker_name": "Rangga",
          "speaker_role": "Host Utama",
          "cue": "(tersenyum santai)",
          "line": "..."
        }
      ]
    }
  ],
  "key_takeaways": ["...", "...", "...", "..."],
  "social_caption": "..."
}`, theme, description, speakerCount, string(speakersJson), duration, vibe, theme, theme, theme, speakerCount, speakerCount, theme, theme, theme, theme, theme, theme, theme, theme, theme, vibe, duration, speakerCount, string(speakersJson))

	// Try Gemini First (verified working model)
	apiKey := os.Getenv("GEMINI_API_KEY")
	if !isPlaceholderKey(apiKey) {
		log.Println("Attempting to generate podcast script with Gemini (gemini-3.5-flash-lite)...")
		client, gErr := genai.NewClient(ctx, option.WithAPIKey(apiKey))
		if gErr == nil {
			defer client.Close()
			model := client.GenerativeModel("gemini-3.5-flash-lite")
			model.GenerationConfig.ResponseMIMEType = "application/json"
			resp, rErr := model.GenerateContent(ctx, genai.Text(prompt))

			// Retry with gemini-3.8-flash if primary fails
			if rErr != nil {
				log.Printf("gemini-3.5-flash-lite script error: %v. Retrying with gemini-3.8-flash...", rErr)
				model = client.GenerativeModel("gemini-3.8-flash")
				model.GenerationConfig.ResponseMIMEType = "application/json"
				resp, rErr = model.GenerateContent(ctx, genai.Text(prompt))
			}

			if rErr == nil && len(resp.Candidates) > 0 && resp.Candidates[0].Content != nil {
				var gJson string
				for _, part := range resp.Candidates[0].Content.Parts {
					if text, ok := part.(genai.Text); ok {
						gJson += string(text)
					}
				}
				gJson = cleanJSONString(gJson)
				var episode models.PodcastEpisode
				if jsonErr := json.Unmarshal([]byte(gJson), &episode); jsonErr == nil && len(episode.Segments) > 0 {
					episode.Topic = theme
					if !strings.Contains(strings.ToLower(episode.Title), strings.ToLower(theme)) {
						episode.Title = fmt.Sprintf("PodHub Episode: %s", theme)
					}
					log.Printf("Successfully generated podcast script for theme: '%s' (%d segments)", theme, len(episode.Segments))
					return episode, nil
				} else if jsonErr != nil {
					log.Printf("Failed to unmarshal Gemini script JSON: %v. Raw length: %d", jsonErr, len(gJson))
				}
			} else if rErr != nil {
				log.Printf("Gemini script generation failed: %v", rErr)
			}
		} else {
			log.Printf("Failed to create Gemini client for script: %v", gErr)
		}
	}

	// Try Grok if valid xAI key is provided
	grokKey := os.Getenv("GROK_API_KEY")
	if strings.HasPrefix(grokKey, "xai-") {
		messages := []GrokMessage{
			{Role: "user", Content: prompt},
		}
		log.Println("Attempting to generate podcast script with Grok AI...")
		jsonText, err := callGrokAPI(ctx, messages, true)
		if err == nil {
			jsonText = cleanJSONString(jsonText)
			var episode models.PodcastEpisode
			if jsonErr := json.Unmarshal([]byte(jsonText), &episode); jsonErr == nil && len(episode.Segments) > 0 {
				episode.Topic = theme
				if !strings.Contains(strings.ToLower(episode.Title), strings.ToLower(theme)) {
					episode.Title = fmt.Sprintf("PodHub Episode: %s", theme)
				}
				return episode, nil
			}
		}
	}

	// Fallback to high quality mock script
	log.Printf("Falling back to Mock Podcast Script Generator for theme: '%s'...", theme)
	return GenerateMockPodcastScript(theme, description, speakerCount, customSpeakers, duration, vibe), nil
}
