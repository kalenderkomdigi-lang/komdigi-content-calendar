package database

import (
	"log"

	"content-calendar-backend/models"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func SeedDatabase(db *gorm.DB) {
	// 1. Seed Default Users (Komdigi Pegawai & Admin)
	defaultUsers := []struct {
		Name    string
		Email   string
		RawPass string
		Role    string
	}{
		{Name: "Pegawai Komdigi", Email: "pegawai@komdigi.go.id", RawPass: "123456", Role: "pegawai"},
		{Name: "Admin BLSDM Komdigi", Email: "admin@komdigi.go.id", RawPass: "password123", Role: "admin"},
		{Name: "Admin BLSDM Komdigi", Email: "admin@contentcalendar.ai", RawPass: "password123", Role: "admin"},
	}

	for _, u := range defaultUsers {
		var existingUser models.User
		if err := db.Where("email = ?", u.Email).First(&existingUser).Error; err != nil {
			hashedPassword, err := bcrypt.GenerateFromPassword([]byte(u.RawPass), bcrypt.DefaultCost)
			if err != nil {
				log.Printf("Failed to hash password for %s: %v", u.Email, err)
				continue
			}

			newUser := models.User{
				Name:     u.Name,
				Email:    u.Email,
				Password: string(hashedPassword),
				Role:     u.Role,
			}

			if err := db.Create(&newUser).Error; err != nil {
				log.Printf("Failed to seed user %s: %v", u.Email, err)
			} else {
				log.Printf("Successfully seeded default user: %s / %s (Role: %s)", u.Email, u.RawPass, u.Role)
			}
		} else {
			// Always ensure role and name are correctly set for seeded accounts
			needsUpdate := false
			if existingUser.Role != u.Role {
				existingUser.Role = u.Role
				needsUpdate = true
			}
			if existingUser.Name == "" || existingUser.Name == "Pegawai Komdigi" {
				existingUser.Name = u.Name
				needsUpdate = true
			}
			if needsUpdate {
				db.Save(&existingUser)
				log.Printf("Updated existing user %s: Name=%s, Role=%s", u.Email, existingUser.Name, existingUser.Role)
			}
		}
	}

	// Clean up old default events from database to ensure unwanted events are removed.
	// Preserves custom user-created themes (category == "custom").
	log.Println("Cleaning up existing default events for clean calendar sync...")
	if err := db.Where("category != ?", "custom").Delete(&models.Event{}).Error; err != nil {
		log.Printf("Warning: failed to clean up old events: %v", err)
	}

	// 2. Seed Default Events (Indonesian 2026 official holidays & standard calendar days)
	defaultEvents := []models.Event{
		// ===========================
		// JANUARI
		// ===========================
		{Title: "Tahun Baru Masehi", Description: "Perayaan pergantian tahun kalender Masehi.", Category: "internasional", Month: 1, Day: 1},
		{Title: "Isra Mikraj Nabi Muhammad SAW", Description: "Peringatan perjalanan suci malam hari Nabi Muhammad SAW.", Category: "nasional", Month: 1, Day: 16},
		{Title: "Hari Gizi Nasional", Description: "Memperingati pentingnya gizi dan kesehatan masyarakat Indonesia.", Category: "nasional", Month: 1, Day: 25},

		// ===========================
		// FEBRUARI
		// ===========================
		{Title: "Hari Pers Nasional", Description: "Hari penting bagi insan pers di Indonesia untuk merefleksikan peran jurnalisme dalam demokrasi.", Category: "nasional", Month: 2, Day: 9},
		{Title: "Hari Valentine", Description: "Hari kasih sayang yang dirayakan secara global.", Category: "internasional", Month: 2, Day: 14},
		{Title: "Tahun Baru Imlek 2577 Kongzili", Description: "Perayaan tahun baru masyarakat Tionghoa.", Category: "nasional", Month: 2, Day: 17},

		// ===========================
		// MARET
		// ===========================
		{Title: "Hari Perempuan Internasional", Description: "Merayakan pencapaian perempuan dan memperjuangkan kesetaraan gender di seluruh dunia.", Category: "internasional", Month: 3, Day: 8},
		{Title: "Hari Musik Nasional", Description: "Hari apresiasi bagi musik nasional Indonesia.", Category: "nasional", Month: 3, Day: 9},
		{Title: "Hari Suci Nyepi (Tahun Baru Saka 1948)", Description: "Hari hening umat Hindu menandai pergantian tahun Saka.", Category: "nasional", Month: 3, Day: 19},
		{Title: "Hari Raya Idul Fitri 1447 H (Hari Ke-1)", Description: "Hari Raya umat Islam merayakan kemenangan setelah berpuasa sebulan penuh.", Category: "nasional", Month: 3, Day: 21},
		{Title: "Hari Raya Idul Fitri 1447 H (Hari Ke-2)", Description: "Perayaan hari kedua Idul Fitri bersama keluarga dan kerabat.", Category: "nasional", Month: 3, Day: 22},
		{Title: "Hari Film Nasional", Description: "Merayakan perfilman Indonesia dan mendukung apresiasi karya sineas lokal.", Category: "nasional", Month: 3, Day: 30},

		// ===========================
		// APRIL
		// ===========================
		{Title: "Hari April Mop", Description: "Tradisi bergurau dan bercanda yang dikenal di banyak negara.", Category: "internasional", Month: 4, Day: 1},
		{Title: "Wafat Yesus Kristus (Jumat Agung)", Description: "Peringatan wafatnya Yesus Kristus bagi umat Kristiani.", Category: "nasional", Month: 4, Day: 3},
		{Title: "Hari Kebangkitan Yesus Kristus (Paskah)", Description: "Merayakan kebangkitan Yesus Kristus dari kematian.", Category: "nasional", Month: 4, Day: 5},
		{Title: "Hari Kesehatan Sedunia", Description: "Hari WHO untuk meningkatkan kesadaran kesehatan global.", Category: "internasional", Month: 4, Day: 7},
		{Title: "Hari Kartini", Description: "Mengenang perjuangan R.A. Kartini untuk emansipasi perempuan dan kesetaraan gender.", Category: "nasional", Month: 4, Day: 21},
		{Title: "Hari Bumi", Description: "Peringatan global untuk mendukung perlindungan lingkungan hidup.", Category: "internasional", Month: 4, Day: 22},
		{Title: "Hari Buku Sedunia", Description: "Merayakan literasi dan hak cipta karya sastra di seluruh dunia.", Category: "internasional", Month: 4, Day: 23},

		// ===========================
		// MEI
		// ===========================
		{Title: "Hari Buruh Internasional", Description: "Memperingati perjuangan dan hak-hak pekerja di seluruh dunia.", Category: "internasional", Month: 5, Day: 1},
		{Title: "Hari Pendidikan Nasional", Description: "Memperingati hari lahir Ki Hadjar Dewantara, bapak pendidikan nasional Indonesia.", Category: "nasional", Month: 5, Day: 2},
		{Title: "Hari Palang Merah Sedunia", Description: "Menghormati gerakan kemanusiaan Palang Merah dan Bulan Sabit Merah.", Category: "internasional", Month: 5, Day: 8},
		{Title: "Kenaikan Yesus Kristus", Description: "Peringatan kenaikan Yesus Kristus ke surga.", Category: "nasional", Month: 5, Day: 14},
		{Title: "Hari Kebangkitan Nasional", Description: "Peringatan berdirinya Boedi Oetomo sebagai tonggak kebangkitan bangsa Indonesia.", Category: "nasional", Month: 5, Day: 20},
		{Title: "Hari Raya Idul Adha 1447 H", Description: "Hari Raya Kurban umat Islam memperingati pengorbanan Nabi Ibrahim.", Category: "nasional", Month: 5, Day: 27},
		{Title: "Hari Raya Waisak 2570 BE", Description: "Peringatan Tri Suci Waisak bagi umat Buddha.", Category: "nasional", Month: 5, Day: 31},

		// ===========================
		// JUNI
		// ===========================
		{Title: "Hari Lahir Pancasila", Description: "Hari libur nasional untuk merayakan lahirnya Pancasila sebagai ideologi negara Indonesia.", Category: "nasional", Month: 6, Day: 1},
		{Title: "Hari Lingkungan Hidup Sedunia", Description: "Hari PBB untuk mendorong kesadaran dan tindakan perlindungan lingkungan.", Category: "internasional", Month: 6, Day: 5},
		{Title: "Tahun Baru Islam 1448 H", Description: "Peringatan tahun baru kalender Hijriah umat Islam.", Category: "nasional", Month: 6, Day: 16},

		// ===========================
		// JULI
		// ===========================
		{Title: "Hari Bhayangkara", Description: "Peringatan hari jadi Kepolisian Negara Republik Indonesia (Polri).", Category: "nasional", Month: 7, Day: 1},
		{Title: "Hari Koperasi Nasional", Description: "Memperingati berdirinya gerakan koperasi di Indonesia.", Category: "nasional", Month: 7, Day: 12},
		{Title: "Hari Anak Nasional", Description: "Mengingatkan pemenuhan hak anak atas perlindungan, kasih sayang, dan pendidikan.", Category: "nasional", Month: 7, Day: 23},

		// ===========================
		// AGUSTUS
		// ===========================
		{Title: "Hari Pramuka", Description: "Memperingati berdirinya Gerakan Pramuka Indonesia.", Category: "nasional", Month: 8, Day: 14},
		{Title: "Hari Kemerdekaan Republik Indonesia", Description: "Hari Proklamasi Kemerdekaan Indonesia dengan upacara bendera dan berbagai perlombaan rakyat.", Category: "nasional", Month: 8, Day: 17},
		{Title: "Maulid Nabi Muhammad SAW", Description: "Peringatan hari lahir Nabi Muhammad SAW.", Category: "nasional", Month: 8, Day: 25},

		// ===========================
		// SEPTEMBER
		// ===========================
		{Title: "Hari Olahraga Nasional", Description: "Meningkatkan kesadaran akan pentingnya olahraga bagi kesehatan bangsa.", Category: "nasional", Month: 9, Day: 9},
		{Title: "Hari Ozon Sedunia", Description: "Memperingati perlindungan lapisan ozon bumi.", Category: "internasional", Month: 9, Day: 16},
		{Title: "Hari Perdamaian Internasional", Description: "Hari PBB untuk memperkuat cita-cita perdamaian di seluruh dunia.", Category: "internasional", Month: 9, Day: 21},
		{Title: "Hari Pariwisata Dunia", Description: "Mempromosikan pariwisata global dan kontribusinya terhadap pembangunan.", Category: "internasional", Month: 9, Day: 27},

		// ===========================
		// OKTOBER
		// ===========================
		{Title: "Hari Batik Nasional", Description: "Peringatan diakuinya batik sebagai Warisan Kemanusiaan oleh UNESCO.", Category: "nasional", Month: 10, Day: 2},
		{Title: "Hari TNI", Description: "Peringatan hari jadi Tentara Nasional Indonesia.", Category: "nasional", Month: 10, Day: 5},
		{Title: "Hari Santri Nasional", Description: "Menghormati kontribusi santri dan pesantren dalam pembangunan bangsa.", Category: "nasional", Month: 10, Day: 22},
		{Title: "Hari Sumpah Pemuda", Description: "Memperingati ikrar pemuda Indonesia pada 28 Oktober 1928.", Category: "nasional", Month: 10, Day: 28},

		// ===========================
		// NOVEMBER
		// ===========================
		{Title: "Hari Pahlawan", Description: "Mengenang jasa pahlawan yang gugur dalam pertempuran Surabaya 10 November 1945.", Category: "nasional", Month: 11, Day: 10},
		{Title: "Hari Guru Nasional", Description: "Apresiasi terhadap jasa bapak/ibu guru yang mendidik generasi penerus bangsa.", Category: "nasional", Month: 11, Day: 25},

		// ===========================
		// DESEMBER
		// ===========================
		{Title: "Hari AIDS Sedunia", Description: "Meningkatkan kesadaran tentang HIV/AIDS dan mendukung pencegahannya.", Category: "internasional", Month: 12, Day: 1},
		{Title: "Hari Hak Asasi Manusia Sedunia", Description: "Peringatan global deklarasi HAM universal.", Category: "internasional", Month: 12, Day: 10},
		{Title: "Hari Ibu", Description: "Peringatan peran penting ibu dan perempuan dalam pembangunan bangsa Indonesia.", Category: "nasional", Month: 12, Day: 22},
		{Title: "Hari Raya Natal", Description: "Hari raya umat Kristiani merayakan kelahiran Yesus Kristus.", Category: "internasional", Month: 12, Day: 25},
	}

	var insertedCount int
	for _, evt := range defaultEvents {
		var count int64
		db.Model(&models.Event{}).Where("title = ? AND month = ? AND day = ?", evt.Title, evt.Month, evt.Day).Count(&count)
		if count == 0 {
			// Event doesn't exist, create it
			if err := db.Create(&evt).Error; err != nil {
				log.Printf("Failed to seed event '%s': %v", evt.Title, err)
			} else {
				insertedCount++
			}
		}
	}

	log.Printf("Successfully completed calendar sync. Seeded %d new events.", insertedCount)
}
