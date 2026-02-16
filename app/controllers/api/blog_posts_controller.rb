# frozen_string_literal: true

class Api::BlogPostsController < ActionController::Base
  def related_posts
    sleep(1.5) # Simulate slow recommendation engine
    post_id = params[:id]
    posts = BlogData.related_posts(post_id)

    render json: { posts: posts }
  end
end
