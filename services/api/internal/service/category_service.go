package service

import (
	"gorm.io/gorm"

	"turno/services/api/internal/model"
)

type CategoryService struct {
	db *gorm.DB
}

type CategoryNode struct {
	ID       uint64         `json:"id"`
	ParentID *uint64        `json:"parentId,omitempty"`
	Slug     string         `json:"slug"`
	Name     string         `json:"name"`
	Children []CategoryNode `json:"children,omitempty"`
}

func NewCategoryService(db *gorm.DB) *CategoryService {
	return &CategoryService{db: db}
}

func (s *CategoryService) Tree(language string) ([]CategoryNode, error) {
	var categories []model.Category
	if err := s.db.Preload("I18n").Where("status = ?", "active").Order("sort_order asc, id asc").Find(&categories).Error; err != nil {
		return nil, err
	}

	nodes := make(map[uint64]*CategoryNode)
	roots := make([]CategoryNode, 0)
	for _, category := range categories {
		name := category.Slug
		for _, item := range category.I18n {
			if item.Language == language {
				name = item.Name
				break
			}
			if item.Language == "zh-CN" {
				name = item.Name
			}
		}
		nodes[category.ID] = &CategoryNode{ID: category.ID, ParentID: category.ParentID, Slug: category.Slug, Name: name}
	}

	for _, category := range categories {
		node := nodes[category.ID]
		if category.ParentID == nil {
			roots = append(roots, *node)
			continue
		}
		parent := nodes[*category.ParentID]
		if parent != nil {
			parent.Children = append(parent.Children, *node)
		}
	}

	finalRoots := make([]CategoryNode, 0, len(roots))
	for _, root := range roots {
		finalRoots = append(finalRoots, *nodes[root.ID])
	}
	return finalRoots, nil
}
