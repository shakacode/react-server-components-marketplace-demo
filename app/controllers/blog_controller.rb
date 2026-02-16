# frozen_string_literal: true

class BlogController < ApplicationController
  include ReactOnRailsPro::RSCPayloadRenderer
  include ReactOnRailsPro::AsyncRendering

  enable_async_react_rendering only: [:post_rsc]

  # V1: Full SSR — all data fetched and rendered on server
  def post_ssr
    post = BlogData.find_post(1)
    @post_data = post
    @related_posts = BlogData.related_posts(post[:id])
  end

  # V2: Client Components — basic post SSRed, related posts fetched client-side
  def post_client
    @post_data = BlogData.find_post(1)
  end

  # V3: RSC Streaming — markdown rendered server-side, related posts streamed
  def post_rsc
    @post_data = BlogData.find_post(1)
    stream_view_containing_react_components(template: "blog/post_rsc")
  end
end
