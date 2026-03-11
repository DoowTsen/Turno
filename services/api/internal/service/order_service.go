package service

import (
	"errors"
	"fmt"
	"time"

	"gorm.io/gorm"

	"turno/services/api/internal/model"
)

type OrderService struct {
	db *gorm.DB
}

type CreateOrderInput struct {
	ProductID       uint64 `json:"productId"`
	ReceiverName    string `json:"receiverName"`
	ReceiverPhone   string `json:"receiverPhone"`
	ReceiverRegion  string `json:"receiverRegion"`
	ReceiverAddress string `json:"receiverAddress"`
}

type ShipOrderInput struct {
	Carrier    string `json:"carrier"`
	TrackingNo string `json:"trackingNo"`
}

func NewOrderService(db *gorm.DB) *OrderService {
	return &OrderService{db: db}
}

func (s *OrderService) Create(buyerID uint64, input CreateOrderInput) (*model.Order, error) {
	var product model.Product
	if err := s.db.First(&product, input.ProductID).Error; err != nil {
		return nil, err
	}
	if product.Status != "active" {
		return nil, errors.New("product is not available")
	}
	if product.SellerID == buyerID {
		return nil, errors.New("cannot buy your own product")
	}

	order := &model.Order{
		OrderNo:         generateOrderNo(),
		BuyerID:         buyerID,
		SellerID:        product.SellerID,
		ProductID:       product.ID,
		TotalAmount:     product.Price + product.ShippingFee,
		ShippingFee:     product.ShippingFee,
		Currency:        product.Currency,
		Status:          "paid",
		ReceiverName:    input.ReceiverName,
		ReceiverPhone:   input.ReceiverPhone,
		ReceiverRegion:  input.ReceiverRegion,
		ReceiverAddress: input.ReceiverAddress,
	}

	if err := s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(order).Error; err != nil {
			return err
		}
		if err := tx.Model(&model.Product{}).Where("id = ?", product.ID).Update("status", "sold").Error; err != nil {
			return err
		}
		link := "/me/orders/sell"
		return createNotification(tx, product.SellerID, "order", "你有一笔新订单待处理", "商品《"+product.Title+"》已成交，请尽快确认并安排发货。", &link)
	}); err != nil {
		return nil, err
	}
	return s.Detail(order.ID, buyerID)
}

func (s *OrderService) Detail(orderID uint64, userID uint64) (*model.Order, error) {
	var order model.Order
	if err := s.db.Preload("Shipment").First(&order, orderID).Error; err != nil {
		return nil, err
	}
	if order.BuyerID != userID && order.SellerID != userID {
		return nil, errors.New("no permission to view order")
	}
	return &order, nil
}

func (s *OrderService) ListByBuyer(userID uint64) ([]model.Order, error) {
	var orders []model.Order
	if err := s.db.Preload("Shipment").Where("buyer_id = ?", userID).Order("created_at desc").Find(&orders).Error; err != nil {
		return nil, err
	}
	return orders, nil
}

func (s *OrderService) ListBySeller(userID uint64) ([]model.Order, error) {
	var orders []model.Order
	if err := s.db.Preload("Shipment").Where("seller_id = ?", userID).Order("created_at desc").Find(&orders).Error; err != nil {
		return nil, err
	}
	return orders, nil
}

func (s *OrderService) Cancel(orderID, userID uint64) (*model.Order, error) {
	var order model.Order
	if err := s.db.First(&order, orderID).Error; err != nil {
		return nil, err
	}
	if order.BuyerID != userID {
		return nil, errors.New("no permission to cancel order")
	}
	if order.Status != "paid" {
		return nil, errors.New("current order cannot be cancelled")
	}
	if err := s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&order).Update("status", "cancelled").Error; err != nil {
			return err
		}
		if err := tx.Model(&model.Product{}).Where("id = ?", order.ProductID).Update("status", "active").Error; err != nil {
			return err
		}
		link := "/me/orders/sell"
		return createNotification(tx, order.SellerID, "order", "订单已取消", "订单号 " + order.OrderNo + " 已由买家取消，商品已恢复可售状态。", &link)
	}); err != nil {
		return nil, err
	}
	return s.Detail(order.ID, userID)
}

func (s *OrderService) Ship(orderID, sellerID uint64, input ShipOrderInput) (*model.Order, error) {
	var order model.Order
	if err := s.db.First(&order, orderID).Error; err != nil {
		return nil, err
	}
	if order.SellerID != sellerID {
		return nil, errors.New("no permission to ship order")
	}
	if order.Status != "paid" {
		return nil, errors.New("current order cannot be shipped")
	}
	if err := s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&order).Update("status", "shipped").Error; err != nil {
			return err
		}
		shipment := model.Shipment{OrderID: order.ID, Carrier: input.Carrier, TrackingNo: input.TrackingNo, Status: "shipped"}
		if err := tx.Create(&shipment).Error; err != nil {
			return err
		}
		link := "/me/orders/buy"
		return createNotification(tx, order.BuyerID, "shipment", "卖家已发货", "订单号 " + order.OrderNo + " 已发货，物流单号：" + input.TrackingNo, &link)
	}); err != nil {
		return nil, err
	}
	return s.Detail(order.ID, sellerID)
}

func (s *OrderService) ConfirmReceipt(orderID, buyerID uint64) (*model.Order, error) {
	var order model.Order
	if err := s.db.First(&order, orderID).Error; err != nil {
		return nil, err
	}
	if order.BuyerID != buyerID {
		return nil, errors.New("no permission to confirm receipt")
	}
	if order.Status != "shipped" {
		return nil, errors.New("current order cannot be confirmed")
	}
	if err := s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&order).Update("status", "completed").Error; err != nil {
			return err
		}
		link := "/me/orders/sell"
		return createNotification(tx, order.SellerID, "order", "买家已确认收货", "订单号 " + order.OrderNo + " 已完成，平台将把这笔交易计入成交履约。", &link)
	}); err != nil {
		return nil, err
	}
	return s.Detail(order.ID, buyerID)
}

func generateOrderNo() string {
	return fmt.Sprintf("TRN%s", time.Now().Format("20060102150405.000"))
}
