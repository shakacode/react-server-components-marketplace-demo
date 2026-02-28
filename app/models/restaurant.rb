class Restaurant < ApplicationRecord
  include DashboardAnalytics

  has_many :hours, dependent: :destroy
  has_many :special_hours, dependent: :destroy
  has_many :reviews, dependent: :destroy
  has_many :menu_items, dependent: :destroy
  has_many :orders, dependent: :destroy
  has_many :promotions, dependent: :destroy

  validates :name, presence: true
  validates :cuisine_type, presence: true
  validates :timezone, presence: true

  scope :by_cuisine, ->(cuisine) { where(cuisine_type: cuisine) }
  scope :in_city, ->(city) { where(city: city) }

  # Determine current status (open/closed/custom_hours)
  def current_status
    now = Time.current.in_time_zone(timezone)
    today = now.to_date
    current_time = now.strftime('%H:%M:%S')

    # Check for special hours first
    special = special_hours.find_by(date: today)
    if special
      return 'closed' if special.is_closed

      return 'custom_hours' if special.opens_at && special.closes_at
    end

    # Check regular hours
    day_hours = hours.find_by(day_of_week: now.wday)
    return 'closed' unless day_hours
    return 'closed' if day_hours.is_closed

    opens_at = day_hours.opens_at&.strftime('%H:%M:%S')
    closes_at = day_hours.closes_at&.strftime('%H:%M:%S')

    return 'closed' unless opens_at && closes_at

    if current_time >= opens_at && current_time <= closes_at
      'open'
    else
      'closed'
    end
  end

  # Calculate current wait time based on recent orders
  # CRITICAL: This query MUST scan the orders table to achieve 100-150ms latency
  def current_wait_time
    # Get orders from the last hour
    recent_orders = orders
                    .where(status: %w[pending preparing])
                    .where('placed_at > ?', 1.hour.ago)

    pending_count = recent_orders.count

    # Calculate average prep time from recently completed orders
    completed_recently = orders
                         .where(status: 'completed')
                         .where('completed_at > ?', 2.hours.ago)
                         .where.not(placed_at: nil, completed_at: nil)

    if completed_recently.exists?
      avg_seconds = completed_recently
                    .select('AVG(EXTRACT(EPOCH FROM (completed_at - placed_at))) as avg_time')
                    .take
                    &.avg_time
                    &.to_f || 900 # Default 15 minutes

      avg_minutes = (avg_seconds / 60).round
    else
      avg_minutes = 15 # Default 15 minutes
    end

    # Estimate based on pending orders
    estimated_minutes = (pending_count * (avg_minutes / 3.0)).round
    [estimated_minutes, 5].max # Minimum 5 minutes
  end

  # Get active promotions
  def active_promotions
    now = Time.current
    promotions.where(is_active: true)
              .where('starts_at <= ?', now)
              .where('ends_at >= ?', now)
  end

  # Get trending items (most ordered in last 24 hours)
  def trending_items
    menu_items
      .joins(order_lines: :order)
      .where(orders: { placed_at: 24.hours.ago.. })
      .group('menu_items.id')
      .order('COUNT(order_lines.id) DESC')
      .limit(3)
  end

  # Update cached rating from reviews
  def update_cached_rating!
    stats = reviews.select('AVG(rating) as avg, COUNT(*) as cnt').take
    update!(
      average_rating: stats.avg&.round(2) || 0,
      review_count: stats.cnt || 0
    )
  end
end
