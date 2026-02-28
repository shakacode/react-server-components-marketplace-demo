# frozen_string_literal: true

module Api
  class ProductSearchController < ApplicationController
    skip_forgery_protection

    PER_PAGE = 24

    def results
      products_scope = Product.filtered_search(search_params)
      page = (search_params[:page] || 1).to_i
      total = products_scope.count
      products = products_scope.offset((page - 1) * PER_PAGE).limit(PER_PAGE)

      render json: {
        products: products.map { |p| serialize_product(p) },
        pagination: {
          current_page: page,
          total_pages: (total / PER_PAGE.to_f).ceil,
          total_count: total,
          per_page: PER_PAGE
        },
        meta: {
          query: search_params[:q] || '',
          sort: search_params[:sort] || 'relevance',
          total_results: total
        },
        timestamp: Time.current.iso8601
      }
    end

    def facets
      scope = Product.all
      scope = scope.search_query(search_params[:q]) if search_params[:q].present?

      render json: {
        facets: Product.facets(scope),
        timestamp: Time.current.iso8601
      }
    end

    def review_snippets
      product_ids = params[:product_ids]&.map(&:to_i) || []
      return render(json: { snippets: {} }) if product_ids.empty?

      snippets = ProductReview
        .where(product_id: product_ids)
        .where('rating >= 4')
        .where(verified_purchase: true)
        .select('DISTINCT ON (product_id) product_id, title, rating, reviewer_name, comment, helpful_count')
        .order(:product_id, helpful_count: :desc)
        .each_with_object({}) do |review, hash|
          hash[review.product_id] = {
            title: review.title,
            rating: review.rating,
            reviewer_name: review.reviewer_name,
            comment: review.comment&.truncate(150),
            helpful_count: review.helpful_count
          }
        end

      render json: { snippets: snippets, timestamp: Time.current.iso8601 }
    end

    private

    def search_params
      params.permit(:q, :category, :brand, :min_rating, :in_stock, :price_min, :price_max, :sort, :page)
    end

    def serialize_product(product)
      {
        id: product.id,
        name: product.name,
        description: product.description&.truncate(200),
        price: product.price.to_f,
        original_price: product.original_price&.to_f,
        category: product.category,
        brand: product.brand,
        sku: product.sku,
        images: product.images,
        features: (product.features || []).first(3),
        tags: product.tags || [],
        average_rating: product.average_rating.to_f,
        review_count: product.review_count,
        in_stock: product.in_stock,
        stock_quantity: product.stock_quantity,
        discount_percentage: product.discount_percentage
      }
    end
  end
end
