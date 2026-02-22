# frozen_string_literal: true

class BlogController < ApplicationController
  include ReactOnRailsPro::RSCPayloadRenderer
  include ReactOnRailsPro::AsyncRendering

  enable_async_react_rendering only: [
    :post_rsc, :post_rsc_simple,
    :post_rsc_step1, :post_rsc_step1b, :post_rsc_step1c,
    :post_rsc_step2, :post_rsc_step3, :post_rsc_step4, :post_rsc_step5
  ]

  # V1: Full SSR — all data fetched and rendered on server
  # In SSR, the content fetch delay blocks the ENTIRE response — no HTML is sent
  # until all data is ready, because Rails must render the full page before streaming.
  def post_ssr
    content_delay = ENV.fetch("CONTENT_DELAY_MS", "0").to_f / 1000
    sleep(content_delay) if content_delay > 0
    post = BlogData.find_post(1)
    @post_data = post
    @related_posts = BlogData.related_posts(post[:id])
  end

  # V2: Client Components — basic post SSRed, related posts fetched client-side
  def post_client
    @post_data = BlogData.find_post(1)
  end

  # V3: RSC Streaming — markdown rendered server-side, related posts streamed
  # Only small metadata as sync props (keeps RSC cache key ~1.5KB vs ~28KB).
  # The heavy content (~25KB markdown) streams as an async prop.
  # In RSC, the content fetch delay only blocks the content stream — the header
  # and skeleton render immediately because sync props (post_meta) are instant.
  def post_rsc
    post = BlogData.find_post(1)
    @post_meta = post.except(:content)
    @content_delay = ENV.fetch("CONTENT_DELAY_MS", "0").to_f / 1000
    stream_view_containing_react_components(template: "blog/post_rsc")
  end

  # V4: RSC Simple — markdown rendered server-side, all data passed upfront
  def post_rsc_simple
    post = BlogData.find_post(1)
    @post_data = post
    @related_posts = BlogData.related_posts(post[:id])
    stream_view_containing_react_components(template: "blog/post_rsc_simple")
  end

  # === RSC debug steps (incremental complexity) ===

  # Step 1: Pure text, zero deps
  def post_rsc_step1
    stream_view_containing_react_components(template: "blog/post_rsc_step1")
  end

  # Step 1b: Pure text but with post props (isolate: is it the props or the imports?)
  def post_rsc_step1b
    @post_data = BlogData.find_post(1)
    stream_view_containing_react_components(template: "blog/post_rsc_step1b")
  end

  # Step 1c: Simplest possible props (string + number)
  def post_rsc_step1c
    stream_view_containing_react_components(template: "blog/post_rsc_step1c")
  end

  # Step 2: Imports BlogPostHeader (server component)
  def post_rsc_step2
    @post_data = BlogData.find_post(1)
    stream_view_containing_react_components(template: "blog/post_rsc_step2")
  end

  # Step 3: Adds InteractiveSection ('use client' component)
  def post_rsc_step3
    @post_data = BlogData.find_post(1)
    stream_view_containing_react_components(template: "blog/post_rsc_step3")
  end

  # Step 4: Adds marked (no highlight.js)
  def post_rsc_step4
    @post_data = BlogData.find_post(1)
    stream_view_containing_react_components(template: "blog/post_rsc_step4")
  end

  # Step 5: Adds full renderMarkdown (marked + highlight.js)
  def post_rsc_step5
    @post_data = BlogData.find_post(1)
    stream_view_containing_react_components(template: "blog/post_rsc_step5")
  end
end
