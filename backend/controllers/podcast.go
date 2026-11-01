package controllers

import (
	"context"
	"net/http"
	"time"

	"content-calendar-backend/config"
	"content-calendar-backend/models"
	"content-calendar-backend/services"
	"github.com/gin-gonic/gin"
)

type GeneratePodcastThemesRequest struct {
	Keyword  string `json:"keyword"`
	Category string `json:"category"`
	Vibe     string `json:"vibe"`
}

type GeneratePodcastScriptRequest struct {
	Theme          string                  `json:"theme" binding:"required"`
	Description    string                  `json:"description"`
	SpeakerCount   int                     `json:"speaker_count"`
	CustomSpeakers []models.PodcastSpeaker `json:"custom_speakers"`
	Duration       string                  `json:"duration"`
	Vibe           string                  `json:"vibe"`
}

type SavePodcastRequest struct {
	Title         string                  `json:"title" binding:"required"`
	Topic         string                  `json:"topic" binding:"required"`
	Category      string                  `json:"category"`
	Vibe          string                  `json:"vibe"`
	Duration      string                  `json:"duration"`
	SpeakerCount  int                     `json:"speaker_count"`
	Speakers      []models.PodcastSpeaker `json:"speakers"`
	Segments      []models.PodcastSegment `json:"segments"`
	KeyTakeaways  []string                `json:"key_takeaways"`
	SocialCaption string                  `json:"social_caption"`
}

// GeneratePodcastThemesHandler handles generation of youth podcast themes
func GeneratePodcastThemesHandler(c *gin.Context) {
	var req GeneratePodcastThemesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		// Keyword can be empty, so we allow binding errors if empty body
		req = GeneratePodcastThemesRequest{}
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 45*time.Second)
	defer cancel()

	themes, err := services.GeneratePodcastThemes(ctx, req.Keyword, req.Category, req.Vibe)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghasilkan tema podcast: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"themes": themes})
}

// GeneratePodcastScriptHandler handles multi-speaker script creation
func GeneratePodcastScriptHandler(c *gin.Context) {
	var req GeneratePodcastScriptRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Tema wajib diisi: " + err.Error()})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 90*time.Second)
	defer cancel()

	episode, err := services.GeneratePodcastScript(
		ctx,
		req.Theme,
		req.Description,
		req.SpeakerCount,
		req.CustomSpeakers,
		req.Duration,
		req.Vibe,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghasilkan naskah podcast: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"episode": episode})
}

// SavePodcastHandler saves podcast episode to database
func SavePodcastHandler(c *gin.Context) {
	userIdVal, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userId := userIdVal.(uint)

	var req SavePodcastRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	episode := models.PodcastEpisode{
		UserID:        userId,
		Title:         req.Title,
		Topic:         req.Topic,
		Category:      req.Category,
		Vibe:          req.Vibe,
		Duration:      req.Duration,
		SpeakerCount:  req.SpeakerCount,
		Speakers:      req.Speakers,
		Segments:      req.Segments,
		KeyTakeaways:  req.KeyTakeaways,
		SocialCaption: req.SocialCaption,
	}

	if err := config.DB.Create(&episode).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan episode podcast: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Episode podcast berhasil disimpan!",
		"data":    episode,
	})
}

// GetPodcastHistoryHandler retrieves saved podcast episodes for the user
func GetPodcastHistoryHandler(c *gin.Context) {
	userIdVal, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userId := userIdVal.(uint)

	searchQuery := c.Query("q")

	var episodes []models.PodcastEpisode
	dbQuery := config.DB.Where("user_id = ?", userId)

	if searchQuery != "" {
		searchPattern := "%" + searchQuery + "%"
		if config.DB.Dialector.Name() == "sqlite" {
			dbQuery = dbQuery.Where("(title LIKE ? OR topic LIKE ? OR category LIKE ?)", searchPattern, searchPattern, searchPattern)
		} else {
			dbQuery = dbQuery.Where("(title ILIKE ? OR topic ILIKE ? OR category ILIKE ?)", searchPattern, searchPattern, searchPattern)
		}
	}

	if err := dbQuery.Order("created_at DESC").Find(&episodes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil riwayat episode podcast"})
		return
	}

	c.JSON(http.StatusOK, episodes)
}

// DeletePodcastEpisodeHandler removes a saved podcast episode
func DeletePodcastEpisodeHandler(c *gin.Context) {
	userIdVal, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userId := userIdVal.(uint)

	id := c.Param("id")
	if err := config.DB.Where("id = ? AND user_id = ?", id, userId).Delete(&models.PodcastEpisode{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus episode podcast"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Episode podcast berhasil dihapus"})
}
