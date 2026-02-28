# frozen_string_literal: true

module Api
  class ProductsController < ApplicationController
    skip_forgery_protection

    # GET /api/products/:id/reviews
    def reviews
      product = Product.find(params[:id])
      reviews = product.top_reviews(10)

      render json: {
        reviews: reviews.map { |r| serialize_review(r) },
        timestamp: Time.current.iso8601
      }
    end

    # GET /api/products/:id/review_stats
    def review_stats
      product = Product.find(params[:id])

      render json: {
        **product.review_stats,
        timestamp: Time.current.iso8601
      }
    end

    # GET /api/products/:id/related_products
    def related_products
      product = Product.find(params[:id])
      related = product.related_products(4)

      render json: {
        products: related.map { |p| serialize_product_card(p) },
        timestamp: Time.current.iso8601
      }
    end

    private

    def serialize_review(review)
      {
        id: review.id,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        reviewer_name: review.reviewer_name,
        verified_purchase: review.verified_purchase,
        helpful_count: review.helpful_count,
        created_at: review.created_at.iso8601
      }
    end

    def serialize_product_card(product)
      {
        id: product.id,
        name: product.name,
        price: product.price.to_f,
        original_price: product.original_price&.to_f,
        category: product.category,
        brand: product.brand,
        images: product.images,
        average_rating: product.average_rating.to_f,
        review_count: product.review_count,
        in_stock: product.in_stock,
        discount_percentage: product.discount_percentage
      }
    end
  end
end
