package service

import (
	"errors"
	"strings"

	"gorm.io/gorm"

	"turno/services/api/internal/model"
)

type UserService struct {
	db *gorm.DB
}

type UpdateProfileInput struct {
	Nickname  string `json:"nickname"`
	AvatarURL string `json:"avatarUrl"`
}

type UpdateLanguageInput struct {
	Language string `json:"language"`
}

type AddressUpsertInput struct {
	ReceiverName  string `json:"receiverName"`
	ReceiverPhone string `json:"receiverPhone"`
	Province      string `json:"province"`
	City          string `json:"city"`
	District      string `json:"district"`
	DetailAddress string `json:"detailAddress"`
	IsDefault     bool   `json:"isDefault"`
}

func NewUserService(db *gorm.DB) *UserService {
	return &UserService{db: db}
}

func (s *UserService) UpdateProfile(userID uint64, input UpdateProfileInput) (*model.User, error) {
	var user model.User
	if err := s.db.First(&user, userID).Error; err != nil {
		return nil, err
	}
	if strings.TrimSpace(input.Nickname) == "" {
		return nil, errors.New("nickname is required")
	}
	user.Nickname = strings.TrimSpace(input.Nickname)
	if strings.TrimSpace(input.AvatarURL) == "" {
		user.AvatarURL = nil
	} else {
		avatar := strings.TrimSpace(input.AvatarURL)
		user.AvatarURL = &avatar
	}
	if err := s.db.Save(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (s *UserService) UpdateLanguage(userID uint64, input UpdateLanguageInput) (*model.User, error) {
	var user model.User
	if err := s.db.First(&user, userID).Error; err != nil {
		return nil, err
	}
	if strings.TrimSpace(input.Language) == "" {
		return nil, errors.New("language is required")
	}
	user.PreferredLanguage = strings.TrimSpace(input.Language)
	if err := s.db.Save(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (s *UserService) ListAddresses(userID uint64) ([]model.UserAddress, error) {
	var addresses []model.UserAddress
	if err := s.db.Where("user_id = ?", userID).Order("is_default desc, id desc").Find(&addresses).Error; err != nil {
		return nil, err
	}
	return addresses, nil
}

func (s *UserService) CreateAddress(userID uint64, input AddressUpsertInput) (*model.UserAddress, error) {
	address, err := normalizeAddressInput(input)
	if err != nil {
		return nil, err
	}
	address.UserID = userID

	if err := s.db.Transaction(func(tx *gorm.DB) error {
		var count int64
		if err := tx.Model(&model.UserAddress{}).Where("user_id = ?", userID).Count(&count).Error; err != nil {
			return err
		}
		if count == 0 {
			address.IsDefault = true
		}
		if address.IsDefault {
			if err := tx.Model(&model.UserAddress{}).Where("user_id = ?", userID).Update("is_default", false).Error; err != nil {
				return err
			}
		}
		return tx.Create(address).Error
	}); err != nil {
		return nil, err
	}

	return address, nil
}

func (s *UserService) UpdateAddress(userID uint64, addressID uint64, input AddressUpsertInput) (*model.UserAddress, error) {
	var address model.UserAddress
	if err := s.db.Where("id = ? AND user_id = ?", addressID, userID).First(&address).Error; err != nil {
		return nil, err
	}

	normalized, err := normalizeAddressInput(input)
	if err != nil {
		return nil, err
	}

	if err := s.db.Transaction(func(tx *gorm.DB) error {
		address.ReceiverName = normalized.ReceiverName
		address.ReceiverPhone = normalized.ReceiverPhone
		address.Province = normalized.Province
		address.City = normalized.City
		address.District = normalized.District
		address.DetailAddress = normalized.DetailAddress
		if normalized.IsDefault {
			if err := tx.Model(&model.UserAddress{}).Where("user_id = ?", userID).Update("is_default", false).Error; err != nil {
				return err
			}
			address.IsDefault = true
		} else {
			address.IsDefault = address.IsDefault && !normalized.IsDefault
		}
		return tx.Save(&address).Error
	}); err != nil {
		return nil, err
	}

	return &address, nil
}

func (s *UserService) DeleteAddress(userID uint64, addressID uint64) error {
	var address model.UserAddress
	if err := s.db.Where("id = ? AND user_id = ?", addressID, userID).First(&address).Error; err != nil {
		return err
	}

	return s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Delete(&address).Error; err != nil {
			return err
		}
		if address.IsDefault {
			var fallback model.UserAddress
			if err := tx.Where("user_id = ?", userID).Order("id asc").First(&fallback).Error; err == nil {
				return tx.Model(&fallback).Update("is_default", true).Error
			} else if !errors.Is(err, gorm.ErrRecordNotFound) {
				return err
			}
		}
		return nil
	})
}

func (s *UserService) SetDefaultAddress(userID uint64, addressID uint64) (*model.UserAddress, error) {
	var address model.UserAddress
	if err := s.db.Where("id = ? AND user_id = ?", addressID, userID).First(&address).Error; err != nil {
		return nil, err
	}

	if err := s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&model.UserAddress{}).Where("user_id = ?", userID).Update("is_default", false).Error; err != nil {
			return err
		}
		return tx.Model(&address).Update("is_default", true).Error
	}); err != nil {
		return nil, err
	}

	address.IsDefault = true
	return &address, nil
}

func normalizeAddressInput(input AddressUpsertInput) (*model.UserAddress, error) {
	address := &model.UserAddress{
		ReceiverName:  strings.TrimSpace(input.ReceiverName),
		ReceiverPhone: strings.TrimSpace(input.ReceiverPhone),
		Province:      strings.TrimSpace(input.Province),
		City:          strings.TrimSpace(input.City),
		District:      strings.TrimSpace(input.District),
		DetailAddress: strings.TrimSpace(input.DetailAddress),
		IsDefault:     input.IsDefault,
	}
	if address.ReceiverName == "" || address.ReceiverPhone == "" || address.Province == "" || address.City == "" || address.District == "" || address.DetailAddress == "" {
		return nil, errors.New("receiverName, receiverPhone, province, city, district and detailAddress are required")
	}
	return address, nil
}
