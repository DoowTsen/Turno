package service

import (
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"turno/services/api/internal/model"
)

type FavoriteService struct {
	db *gorm.DB
}

func NewFavoriteService(db *gorm.DB) *FavoriteService {
	return &FavoriteService{db: db}
}

func (s *FavoriteService) List(userID uint64) ([]model.Product, error) {
	var products []model.Product
	err := s.db.Model(&model.Product{}).
		Joins("JOIN favorites ON favorites.product_id = products.id").
		Where("favorites.user_id = ?", userID).
		Preload("Images").
		Order("favorites.created_at desc").
		Find(&products).Error
	return products, err
}

func (s *FavoriteService) Add(userID, productID uint64) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		row := model.Favorite{UserID: userID, ProductID: productID}
		if err := tx.Clauses(clause.OnConflict{DoNothing: true}).Create(&row).Error; err != nil {
			return err
		}
		return tx.Model(&model.Product{}).Where("id = ?", productID).UpdateColumn("favorite_count", gorm.Expr("favorite_count + 1")).Error
	})
}

func (s *FavoriteService) Remove(userID, productID uint64) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("user_id = ? AND product_id = ?", userID, productID).Delete(&model.Favorite{}).Error; err != nil {
			return err
		}
		return tx.Model(&model.Product{}).Where("id = ? AND favorite_count > 0", productID).UpdateColumn("favorite_count", gorm.Expr("favorite_count - 1")).Error
	})
}
