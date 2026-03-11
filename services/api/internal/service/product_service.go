package service

import (
	"errors"
	"strings"

	"gorm.io/gorm"

	"turno/services/api/internal/model"
)

type ProductService struct {
	db *gorm.DB
}

type ProductListInput struct {
	Keyword    string
	CategoryID uint64
	Page       int
	PageSize   int
	SellerID   uint64
}

type ProductUpsertInput struct {
	CategoryID     uint64   `json:"categoryId"`
	Title          string   `json:"title"`
	Description    string   `json:"description"`
	Price          int64    `json:"price"`
	Currency       string   `json:"currency"`
	ConditionLevel string   `json:"conditionLevel"`
	City           string   `json:"city"`
	ShippingFee    int64    `json:"shippingFee"`
	Images         []string `json:"images"`
}

func NewProductService(db *gorm.DB) *ProductService {
	return &ProductService{db: db}
}

func (s *ProductService) List(input ProductListInput) ([]model.Product, int64, error) {
	if input.Page <= 0 {
		input.Page = 1
	}
	if input.PageSize <= 0 || input.PageSize > 50 {
		input.PageSize = 12
	}

	query := s.db.Model(&model.Product{}).Preload("Images")
	if input.SellerID > 0 {
		query = query.Where("seller_id = ?", input.SellerID)
	} else {
		query = query.Where("status = ?", "active")
	}
	if input.CategoryID > 0 {
		query = query.Where("category_id = ?", input.CategoryID)
	}
	if input.Keyword != "" {
		kw := "%" + strings.TrimSpace(input.Keyword) + "%"
		query = query.Where("title LIKE ? OR description LIKE ?", kw, kw)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var items []model.Product
	if err := query.Order("created_at desc").Offset((input.Page - 1) * input.PageSize).Limit(input.PageSize).Find(&items).Error; err != nil {
		return nil, 0, err
	}

	return items, total, nil
}

func (s *ProductService) Detail(id uint64) (*model.Product, error) {
	var product model.Product
	if err := s.db.Preload("Images").First(&product, id).Error; err != nil {
		return nil, err
	}
	return &product, nil
}

func (s *ProductService) Create(sellerID uint64, input ProductUpsertInput) (*model.Product, error) {
	if input.CategoryID == 0 || strings.TrimSpace(input.Title) == "" || input.Price <= 0 {
		return nil, errors.New("categoryId, title and price are required")
	}
	currency := input.Currency
	if currency == "" {
		currency = "CNY"
	}
	city := strings.TrimSpace(input.City)
	product := &model.Product{
		SellerID:       sellerID,
		CategoryID:     input.CategoryID,
		Title:          strings.TrimSpace(input.Title),
		Description:    strings.TrimSpace(input.Description),
		Price:          input.Price,
		Currency:       currency,
		ConditionLevel: defaultString(input.ConditionLevel, "good"),
		ShippingFee:    input.ShippingFee,
		Status:         "active",
	}
	if city != "" {
		product.City = &city
	}

	if err := s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(product).Error; err != nil {
			return err
		}
		for index, image := range input.Images {
			if strings.TrimSpace(image) == "" {
				continue
			}
			row := model.ProductImage{ProductID: product.ID, URL: image, SortOrder: index}
			if err := tx.Create(&row).Error; err != nil {
				return err
			}
		}
		return nil
	}); err != nil {
		return nil, err
	}

	return s.Detail(product.ID)
}

func (s *ProductService) Update(productID uint64, sellerID uint64, input ProductUpsertInput) (*model.Product, error) {
	var product model.Product
	if err := s.db.First(&product, productID).Error; err != nil {
		return nil, err
	}
	if product.SellerID != sellerID {
		return nil, errors.New("no permission to update product")
	}
	city := strings.TrimSpace(input.City)
	if err := s.db.Transaction(func(tx *gorm.DB) error {
		product.CategoryID = input.CategoryID
		product.Title = strings.TrimSpace(input.Title)
		product.Description = strings.TrimSpace(input.Description)
		product.Price = input.Price
		product.Currency = defaultString(input.Currency, "CNY")
		product.ConditionLevel = defaultString(input.ConditionLevel, "good")
		product.ShippingFee = input.ShippingFee
		if city == "" {
			product.City = nil
		} else {
			product.City = &city
		}
		if err := tx.Save(&product).Error; err != nil {
			return err
		}
		if err := tx.Where("product_id = ?", product.ID).Delete(&model.ProductImage{}).Error; err != nil {
			return err
		}
		for index, image := range input.Images {
			if strings.TrimSpace(image) == "" {
				continue
			}
			row := model.ProductImage{ProductID: product.ID, URL: image, SortOrder: index}
			if err := tx.Create(&row).Error; err != nil {
				return err
			}
		}
		return nil
	}); err != nil {
		return nil, err
	}
	return s.Detail(product.ID)
}

func (s *ProductService) ChangeStatus(productID uint64, sellerID uint64, status string) (*model.Product, error) {
	var product model.Product
	if err := s.db.First(&product, productID).Error; err != nil {
		return nil, err
	}
	if product.SellerID != sellerID {
		return nil, errors.New("no permission to change product status")
	}
	product.Status = status
	if err := s.db.Save(&product).Error; err != nil {
		return nil, err
	}
	return s.Detail(product.ID)
}

func defaultString(value string, fallback string) string {
	if strings.TrimSpace(value) == "" {
		return fallback
	}
	return strings.TrimSpace(value)
}
