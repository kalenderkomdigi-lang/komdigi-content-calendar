package config

import (
	"fmt"
	"log"
	"os"

	"content-calendar-backend/database"
	"content-calendar-backend/models"
	"github.com/glebarez/sqlite"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDatabase() {
	dbURL := os.Getenv("DATABASE_URL")
	dbType := os.Getenv("DB_TYPE")
	if dbType == "" && dbURL == "" {
		dbType = "sqlite" // Default to SQLite for zero configuration local dev!
	}

	var db *gorm.DB
	var err error

	if dbURL != "" {
		log.Println("Connecting to PostgreSQL database using DATABASE_URL...")
		db, err = gorm.Open(postgres.New(postgres.Config{
			DSN:                  dbURL,
			PreferSimpleProtocol: true,
		}), &gorm.Config{})
		if err == nil {
			migrationDb := db
			directURL := os.Getenv("DIRECT_URL")
			if directURL != "" {
				log.Println("Connecting to PostgreSQL database using DIRECT_URL for migrations...")
				dDb, dErr := gorm.Open(postgres.Open(directURL), &gorm.Config{})
				if dErr != nil {
					log.Printf("Warning: Failed to connect to DIRECT_URL for migrations: %v. Falling back to DATABASE_URL for migrations.", dErr)
				} else {
					migrationDb = dDb
					defer func() {
						sqlDB, _ := migrationDb.DB()
						if sqlDB != nil {
							sqlDB.Close()
							log.Println("DIRECT_URL connection closed successfully.")
						}
					}()
				}
			}

			log.Println("Database connection established.")

			// Auto Migration
			log.Println("Running database migrations...")
			err = migrationDb.AutoMigrate(&models.User{}, &models.Event{}, &models.ContentIdea{}, &models.PodcastEpisode{})
			if err == nil {
				log.Println("Database migration completed.")
				database.SeedDatabase(migrationDb)
				DB = db
				return
			}
			log.Printf("Warning: Migration on PostgreSQL failed: %v. Falling back to SQLite...", err)
			db = nil
		} else {
			log.Printf("Warning: Failed to connect to database using DATABASE_URL: %v. Falling back to SQLite...", err)
		}
	}

	if dbType == "postgres" && db == nil {
		dbHost := os.Getenv("DB_HOST")
		dbPort := os.Getenv("DB_PORT")
		dbUser := os.Getenv("DB_USER")
		dbPassword := os.Getenv("DB_PASSWORD")
		dbName := os.Getenv("DB_NAME")
		dbSSLMode := os.Getenv("DB_SSLMODE")

		if dbHost == "" {
			dbHost = "localhost"
		}
		if dbPort == "" {
			dbPort = "5432"
		}
		if dbUser == "" {
			dbUser = "postgres"
		}
		if dbPassword == "" {
			dbPassword = "password"
		}
		if dbName == "" {
			dbName = "content_calendar"
		}
		if dbSSLMode == "" {
			dbSSLMode = "disable"
		}

		dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=%s",
			dbHost, dbUser, dbPassword, dbName, dbPort, dbSSLMode)

		log.Printf("Connecting to PostgreSQL database at %s:%s...", dbHost, dbPort)
		db, err = gorm.Open(postgres.New(postgres.Config{
			DSN:                  dsn,
			PreferSimpleProtocol: true,
		}), &gorm.Config{})
		if err != nil {
			log.Printf("Warning: Failed to connect to PostgreSQL at %s:%s: %v. Falling back to SQLite...", dbHost, dbPort, err)
			db = nil
		}
	}

	if db == nil {
		log.Println("Connecting to SQLite database (content_calendar.db)...")
		db, err = gorm.Open(sqlite.Open("content_calendar.db"), &gorm.Config{})
		if err != nil {
			log.Fatalf("Failed to connect to SQLite database: %v", err)
		}
	}

	log.Println("Database connection established.")

	// Auto Migration
	log.Println("Running database migrations...")
	err = db.AutoMigrate(&models.User{}, &models.Event{}, &models.ContentIdea{}, &models.PodcastEpisode{})
	if err != nil {
		log.Fatalf("Database migration failed: %v", err)
	}
	log.Println("Database migration completed.")

	// Run Seeder
	database.SeedDatabase(db)

	DB = db
}
