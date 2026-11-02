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

type GenerateIdeasRequest struct {
	Theme         string `json:"theme" binding:"required"`
	ContentPillar string `json:"content_pillar"`
}

type SaveContentRequest struct {
	DateStr string            `json:"date" binding:"required"` // Format: YYYY-MM-DD
	Theme   string            `json:"theme"`
	Ideas   []models.IdeaItem `json:"ideas"`
	Caption string            `json:"caption" binding:"required"`
}

type GenerateVideoContentRequest struct {
	Theme string          `json:"theme" binding:"required"`
	Idea  models.IdeaItem `json:"idea" binding:"required"`
}

type GenerateThemesRequest struct {
	Niche         string `json:"niche" binding:"required"`
	Date          string `json:"date"`
	ContentPillar string `json:"content_pillar"`
}

func GenerateIdeas(c *gin.Context) {
	var req GenerateIdeasRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 45*time.Second)
	defer cancel()

	ideas, err := services.GenerateContentIdeas(ctx, req.Theme, req.ContentPillar)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghasilkan ide konten: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ideas": ideas})
}

func GenerateCaption(c *gin.Context) {
	theme := c.PostForm("theme")

	var imageBytes []byte
	var mimeType string

	file, err := c.FormFile("image")
	if err == nil {
		src, err := file.Open()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuka file gambar: " + err.Error()})
			return
		}
		defer src.Close()

		buffer := make([]byte, file.Size)
		_, err = src.Read(buffer)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membaca data gambar: " + err.Error()})
			return
		}
		imageBytes = buffer
		mimeType = file.Header.Get("Content-Type")
	}

	// At least one of theme or image must be provided
	if theme == "" && len(imageBytes) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Tema atau gambar wajib diisi (minimal salah satu)"})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 60*time.Second)
	defer cancel()

	caption, err := services.GenerateCaptionFromMultimodal(ctx, theme, imageBytes, mimeType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghasilkan caption: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"caption": caption})
}

func SaveContentIdea(c *gin.Context) {
	userIdVal, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userId := userIdVal.(uint)

	var req SaveContentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	parsedDate, err := time.Parse("2006-01-02", req.DateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format tanggal tidak valid, harus YYYY-MM-DD"})
		return
	}

	theme := req.Theme
	if theme == "" {
		theme = "Analisis Gambar"
	}

	contentIdea := models.ContentIdea{
		UserID:  userId,
		Date:    parsedDate,
		Theme:   theme,
		Ideas:   req.Ideas,
		Caption: req.Caption,
	}

	if err := config.DB.Create(&contentIdea).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan ide konten ke database: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Ide konten berhasil disimpan!",
		"data":    contentIdea,
	})
}

func GetContentHistory(c *gin.Context) {
	userIdVal, exists := c.Get("userId")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userId := userIdVal.(uint)

	searchQuery := c.Query("q")

	var history []models.ContentIdea
	dbQuery := config.DB.Where("user_id = ?", userId)

	if searchQuery != "" {
		searchPattern := "%" + searchQuery + "%"
		if config.DB.Dialector.Name() == "sqlite" {
			dbQuery = dbQuery.Where("(theme LIKE ? OR caption LIKE ?)", searchPattern, searchPattern)
		} else {
			dbQuery = dbQuery.Where("(theme ILIKE ? OR caption ILIKE ?)", searchPattern, searchPattern)
		}
	}

	if err := dbQuery.Order("created_at DESC").Find(&history).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil riwayat konten"})
		return
	}

	c.JSON(http.StatusOK, history)
}

func GenerateVideoContent(c *gin.Context) {
	var req GenerateVideoContentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 60*time.Second)
	defer cancel()

	videoContent, err := services.GenerateVideoContent(ctx, req.Theme, req.Idea)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghasilkan konsep video: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"video_content": videoContent})
}

func GenerateThemes(c *gin.Context) {
	var req GenerateThemesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx, cancel := context.WithTimeout(c.Request.Context(), 60*time.Second)
	defer cancel()

	themes, err := services.GenerateContentThemes(ctx, req.Niche, req.Date, req.ContentPillar)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghasilkan rekomendasi tema: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"themes": themes})
}
