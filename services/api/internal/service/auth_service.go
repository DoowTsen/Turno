package service

import (
	"errors"
	"strings"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"turno/services/api/internal/auth"
	"turno/services/api/internal/config"
	"turno/services/api/internal/model"
)

type AuthService struct {
	db  *gorm.DB
	cfg *config.Config
}

type RegisterInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Nickname string `json:"nickname"`
	Language string `json:"language"`
}

type LoginInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func NewAuthService(db *gorm.DB, cfg *config.Config) *AuthService {
	return &AuthService{db: db, cfg: cfg}
}

func (s *AuthService) Register(input RegisterInput) (*model.User, string, error) {
	email := strings.TrimSpace(strings.ToLower(input.Email))
	if email == "" || input.Password == "" || strings.TrimSpace(input.Nickname) == "" {
		return nil, "", errors.New("email, password and nickname are required")
	}

	var count int64
	if err := s.db.Model(&model.User{}).Where("email = ?", email).Count(&count).Error; err != nil {
		return nil, "", err
	}
	if count > 0 {
		return nil, "", errors.New("email already exists")
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, "", err
	}

	language := input.Language
	if language == "" {
		language = "zh-CN"
	}

	user := &model.User{
		Email:             &email,
		PasswordHash:      string(hashed),
		Nickname:          strings.TrimSpace(input.Nickname),
		PreferredLanguage: language,
		Role:              "user",
		Status:            "active",
	}

	if err := s.db.Create(user).Error; err != nil {
		return nil, "", err
	}

	token, err := auth.GenerateToken(s.cfg.JWT.Secret, user.ID, user.Role, s.cfg.JWT.AccessTokenHours)
	if err != nil {
		return nil, "", err
	}

	return user, token, nil
}

func (s *AuthService) Login(input LoginInput) (*model.User, string, error) {
	email := strings.TrimSpace(strings.ToLower(input.Email))
	if email == "" || input.Password == "" {
		return nil, "", errors.New("email and password are required")
	}

	var user model.User
	if err := s.db.Where("email = ?", email).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, "", errors.New("invalid credentials")
		}
		return nil, "", err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.Password)); err != nil {
		return nil, "", errors.New("invalid credentials")
	}

	token, err := auth.GenerateToken(s.cfg.JWT.Secret, user.ID, user.Role, s.cfg.JWT.AccessTokenHours)
	if err != nil {
		return nil, "", err
	}

	return &user, token, nil
}

func (s *AuthService) Me(userID uint64) (*model.User, error) {
	var user model.User
	if err := s.db.First(&user, userID).Error; err != nil {
		return nil, err
	}
	return &user, nil
}
