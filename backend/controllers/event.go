package controllers

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"content-calendar-backend/config"
	"content-calendar-backend/models"
	"github.com/gin-gonic/gin"
)

func GetEvents(c *gin.Context) {
	monthStr := c.Query("month")

	var events []models.Event

	dbQuery := config.DB

	if monthStr != "" {
		month, err := strconv.Atoi(monthStr)
		if err == nil && month >= 1 && month <= 12 {
			dbQuery = dbQuery.Where("month = ?", month)
		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Parameter bulan tidak valid (harus 1-12)"})
			return
		}
	}

	if err := dbQuery.Find(&events).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data hari penting"})
		return
	}

	c.JSON(http.StatusOK, events)
}

type SaveEventRequest struct {
	Title       string `json:"title" binding:"required"`
	Description string `json:"description"`
	Category    string `json:"category"`
	Date        string `json:"date"`
	Month       int    `json:"month"`
	Day         int    `json:"day"`
}

func SaveEvent(c *gin.Context) {
	var req SaveEventRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Month == 0 || req.Day == 0 {
		if req.Date != "" {
			// Parse YYYY-MM-DD
			if t, err := strconv.Atoi(req.Date); err == nil {
				_ = t
			}
			// Try time parsing
			var year, m, d int
			if n, err := fmt.Sscanf(req.Date, "%d-%d-%d", &year, &m, &d); err == nil && n == 3 {
				req.Month = m
				req.Day = d
			}
		}
	}

	if req.Month < 1 || req.Month > 12 || req.Day < 1 || req.Day > 31 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Tanggal atau Bulan/Hari tidak valid"})
		return
	}

	// Default category for user-created events
	category := req.Category
	if category == "" {
		category = "custom"
	}

	// Check if an event already exists for this day+month with the same title
	var existing models.Event
	result := config.DB.Where("month = ? AND day = ? AND title = ?", req.Month, req.Day, req.Title).First(&existing)
	if result.Error == nil {
		// Update existing event
		existing.Description = req.Description
		existing.Category = category
		if err := config.DB.Save(&existing).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui tema"})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"message": "Tema berhasil diperbarui!",
			"data":    existing,
		})
		return
	}

	event := models.Event{
		Title:       req.Title,
		Description: req.Description,
		Category:    category,
		Month:       req.Month,
		Day:         req.Day,
	}

	if err := config.DB.Create(&event).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan tema"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Tema berhasil disimpan!",
		"data":    event,
	})
}

func DeleteEvent(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID tidak valid"})
		return
	}

	var event models.Event
	if err := config.DB.First(&event, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Event tidak ditemukan"})
		return
	}

	// Only allow deleting custom or podcast themes
	if event.Category != "custom" && event.Category != "podcast" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Hanya tema kustom atau podcast yang dapat dihapus"})
		return
	}

	if err := config.DB.Delete(&event).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus tema"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Tema berhasil dihapus dari kalender"})
}

type ReminderItem struct {
	ID            uint   `json:"id"`
	Title         string `json:"title"`
	Description   string `json:"description"`
	Category      string `json:"category"`
	Month         int    `json:"month"`
	Day           int    `json:"day"`
	Status        string `json:"status"` // "today", "tomorrow", "upcoming"
	DaysUntil     int    `json:"days_until"`
	BadgeText     string `json:"badge_text"`
	Urgency       string `json:"urgency"` // "high", "medium", "normal"
	DateFormatted string `json:"date_formatted"`
}

type RemindersResponse struct {
	Summary struct {
		TodayCount     int `json:"today_count"`
		TomorrowCount  int `json:"tomorrow_count"`
		UpcomingCount  int `json:"upcoming_count"`
		TotalReminders int `json:"total_reminders"`
	} `json:"summary"`
	Reminders []ReminderItem `json:"reminders"`
}

func GetReminders(c *gin.Context) {
	now := time.Now()
	// Optionally allow overriding date via ?date=YYYY-MM-DD
	if dateParam := c.Query("date"); dateParam != "" {
		if parsed, err := time.Parse("2006-01-02", dateParam); err == nil {
			now = parsed
		}
	}

	monthNames := []string{
		"", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
		"Juli", "Agustus", "September", "Oktober", "November", "Desember",
	}

	var reminders []ReminderItem
	todayCount := 0
	tomorrowCount := 0
	upcomingCount := 0

	for i := 0; i <= 14; i++ {
		targetDate := now.AddDate(0, 0, i)
		targetMonth := int(targetDate.Month())
		targetDay := targetDate.Day()

		var events []models.Event
		if err := config.DB.Where("month = ? AND day = ?", targetMonth, targetDay).Find(&events).Error; err != nil {
			continue
		}

		for _, evt := range events {
			item := ReminderItem{
				ID:            evt.ID,
				Title:         evt.Title,
				Description:   evt.Description,
				Category:      evt.Category,
				Month:         evt.Month,
				Day:           evt.Day,
				DaysUntil:     i,
				DateFormatted: fmt.Sprintf("%d %s", evt.Day, monthNames[evt.Month]),
			}

			if i == 0 {
				item.Status = "today"
				item.BadgeText = "Hari Ini 🚨"
				item.Urgency = "high"
				todayCount++
			} else if i == 1 {
				item.Status = "tomorrow"
				item.BadgeText = "Besok (H-1) ⏳"
				item.Urgency = "medium"
				tomorrowCount++
			} else {
				item.Status = "upcoming"
				item.BadgeText = fmt.Sprintf("%d Hari Lagi 📅", i)
				item.Urgency = "normal"
				upcomingCount++
			}

			reminders = append(reminders, item)
		}
	}

	if reminders == nil {
		reminders = []ReminderItem{}
	}

	var resp RemindersResponse
	resp.Summary.TodayCount = todayCount
	resp.Summary.TomorrowCount = tomorrowCount
	resp.Summary.UpcomingCount = upcomingCount
	resp.Summary.TotalReminders = len(reminders)
	resp.Reminders = reminders

	c.JSON(http.StatusOK, resp)
}
