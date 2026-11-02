package models

import (
	"time"
)

type User struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Name      string    `gorm:"default:'Pegawai Komdigi'" json:"name"`
	Email     string    `gorm:"uniqueIndex;not null" json:"email"`
	Password  string    `gorm:"not null" json:"-"`
	Role      string    `gorm:"default:'pegawai'" json:"role"` // 'admin' or 'pegawai'
	CreatedAt time.Time `json:"created_at"`
}

type Event struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Title       string    `gorm:"not null" json:"title"`
	Description string    `json:"description"`
	Category    string    `gorm:"not null" json:"category"` // 'nasional', 'internasional', 'teknologi', 'literasi_digital'
	Month       int       `gorm:"not null" json:"month"`    // 1-12
	Day         int       `gorm:"not null" json:"day"`      // 1-31
	CreatedAt   time.Time `json:"created_at"`
}

type IdeaItem struct {
	Title        string `json:"title"`
	Summary      string `json:"summary"`
	Format       string `json:"format"`           // "Video Pendek", "Poster", "Infografis", "Carousel", "Reels"
	ReferenceURL string `json:"reference_url"`    // Link contoh konten serupa (YouTube, Instagram, dsb)
	Pillar       string `json:"pillar,omitempty"` // Content Pillar: "Entertainment", "Trend", "Education/Information", "Konten Nasional"
}

type VideoScene struct {
	SceneNumber int    `json:"scene_number"`
	Visual      string `json:"visual"`
	Narration   string `json:"narration"`
	Duration    string `json:"duration"`
}

type VideoContent struct {
	Title           string       `json:"title"`
	Format          string       `json:"format"`
	Duration        string       `json:"duration"`
	Hook            string       `json:"hook"`
	Scenes          []VideoScene `json:"scenes"`
	Caption         string       `json:"caption"`
	Hashtags        []string     `json:"hashtags"`
	MusicSuggestion string       `json:"music_suggestion"`
	CTA             string       `json:"cta"`
}

type ContentIdea struct {
	ID        uint       `gorm:"primaryKey" json:"id"`
	UserID    uint       `gorm:"not null" json:"user_id"`
	User      User       `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"-"`
	Date      time.Time  `gorm:"type:date;not null" json:"date"`
	Theme     string     `gorm:"not null" json:"theme"`
	Ideas     []IdeaItem `gorm:"serializer:json;type:jsonb;not null" json:"ideas"`
	Caption   string     `gorm:"not null" json:"caption"`
	CreatedAt time.Time  `json:"created_at"`
}

type PodcastSpeaker struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	Role        string `json:"role"`        // Host, Co-Host, Guest 1, Guest 2, etc.
	Persona     string `json:"persona"`     // e.g., "Fresh Graduate yang baru 3 bulan kerja, sering overthinking gaji vs gaya hidup"
	AvatarColor string `json:"avatar_color"` // Tailwind color accent e.g., "amber", "blue", "emerald", "purple"
}

type PodcastDialogueLine struct {
	SpeakerID   int    `json:"speaker_id"`
	SpeakerName string `json:"speaker_name"`
	SpeakerRole string `json:"speaker_role"`
	Cue         string `json:"cue"`  // Stage/intonation direction e.g., "(tertawa santai)", "(menghela napas relate)"
	Line        string `json:"line"` // The spoken words
}

type PodcastSegment struct {
	SegmentNumber int                   `json:"segment_number"`
	Title         string                `json:"title"`
	Duration      string                `json:"duration"`
	Summary       string                `json:"summary"`
	Dialogue      []PodcastDialogueLine `json:"dialogue"`
}

type PodcastThemeIdea struct {
	ID                   string   `json:"id"`
	Title                string   `json:"title"`
	Catchphrase          string   `json:"catchphrase"`
	Description          string   `json:"description"`
	Category             string   `json:"category"`
	Angle                string   `json:"angle"`
	TargetAudience       string   `json:"target_audience"`
	SuggestedQuestions   []string `json:"suggested_questions"`
	RelatabilityScore    int      `json:"relatability_score"`
	PracticalApplication string   `json:"practical_application,omitempty"`
	DiscussionPoints     []string `json:"discussion_points,omitempty"`
}

type PodcastEpisode struct {
	ID            uint             `gorm:"primaryKey" json:"id"`
	UserID        uint             `gorm:"not null" json:"user_id"`
	User          User             `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"-"`
	Title         string           `gorm:"not null" json:"title"`
	Topic         string           `gorm:"not null" json:"topic"`
	Category      string           `json:"category"`
	Vibe          string           `json:"vibe"`
	Duration      string           `json:"duration"`
	SpeakerCount  int              `json:"speaker_count"`
	Speakers      []PodcastSpeaker `gorm:"serializer:json;type:jsonb" json:"speakers"`
	Segments      []PodcastSegment `gorm:"serializer:json;type:jsonb" json:"segments"`
	KeyTakeaways  []string         `gorm:"serializer:json;type:jsonb" json:"key_takeaways"`
	SocialCaption string           `json:"social_caption"`
	CreatedAt     time.Time        `json:"created_at"`
}

