package main

import (
	"log"
	"net/http"
	"os"

	"content-calendar-backend/config"
	"content-calendar-backend/controllers"
	"content-calendar-backend/middleware"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load environmental variables from .env file if it exists
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables.")
	}

	// Initialize Database
	config.ConnectDatabase()

	// Initialize Gin Router
	r := gin.Default()
	r.MaxMultipartMemory = 20 << 20 // 20 MB max upload size

	// Configure CORS
	corsConfig := cors.DefaultConfig()
	corsConfig.AllowAllOrigins = true // In production, replace with specific origins
	corsConfig.AllowHeaders = []string{"Origin", "Content-Length", "ContentType", "Content-Type", "Authorization"}
	corsConfig.AllowMethods = []string{"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"}
	r.Use(cors.New(corsConfig))

	// Global Ping Route
	r.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "pong"})
	})

	// API Routes Group
	api := r.Group("/api")
	{
		// Authentication Routes
		auth := api.Group("/auth")
		{
			auth.POST("/login", controllers.Login)
			auth.POST("/register", controllers.Register)
			auth.GET("/session", middleware.AuthMiddleware(), controllers.CheckSession)
		}

		// Admin Management Routes (Protected by Auth & Admin Role)
		admin := api.Group("/admin")
		admin.Use(middleware.AuthMiddleware(), middleware.AdminMiddleware())
		{
			admin.GET("/users", controllers.GetUsers)
			admin.POST("/users", controllers.CreateUserByAdmin)
			admin.PUT("/users/:id", controllers.UpdateUserByAdmin)
			admin.DELETE("/users/:id", controllers.DeleteUserByAdmin)
		}

		// Event/Calendar Routes
		api.GET("/events", controllers.GetEvents)
		api.GET("/events/reminders", controllers.GetReminders)
		api.POST("/events", middleware.AuthMiddleware(), controllers.SaveEvent)
		api.DELETE("/events/:id", middleware.AuthMiddleware(), controllers.DeleteEvent)

		// Content Generation & Log Routes
		content := api.Group("/content")
		{
			content.POST("/generate-ideas", controllers.GenerateIdeas)
			content.POST("/generate-caption", controllers.GenerateCaption)
			content.POST("/generate-video", controllers.GenerateVideoContent)
			content.POST("/generate-theme", controllers.GenerateThemes)

			// Protected Routes
			protected := content.Group("")
			protected.Use(middleware.AuthMiddleware())
			{
				protected.POST("/save", controllers.SaveContentIdea)
				protected.GET("/history", controllers.GetContentHistory)
			}
		}

		// PodHub / Podcast Generator Routes
		podcast := api.Group("/podcast")
		{
			podcast.POST("/generate-themes", controllers.GeneratePodcastThemesHandler)
			podcast.POST("/generate-script", controllers.GeneratePodcastScriptHandler)

			// Protected Routes
			protected := podcast.Group("")
			protected.Use(middleware.AuthMiddleware())
			{
				protected.POST("/save", controllers.SavePodcastHandler)
				protected.GET("/history", controllers.GetPodcastHistoryHandler)
				protected.DELETE("/:id", controllers.DeletePodcastEpisodeHandler)
			}
		}
	}

	// Start Gin Server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Starting Content Calendar AI backend server on port %s...", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to run Gin server: %v", err)
	}
}
