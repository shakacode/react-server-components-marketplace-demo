import React from 'react';
import { BlogPost } from '../../types/blog';

interface Props {
  post: BlogPost;
}

export function BlogPostHeader({ post }: Props) {
  return (
    <header className="mb-8">
      <div className="flex flex-wrap gap-2 mb-4">
        {post.tags.map((tag) => (
          <span
            key={tag}
            className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700"
          >
            {tag}
          </span>
        ))}
      </div>

      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
        {post.title}
      </h1>

      <div className="flex items-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
            {post.author.split(' ').map((n) => n[0]).join('')}
          </div>
          <span className="font-medium text-gray-900">{post.author}</span>
        </div>
        <span>{post.date}</span>
        <span>{post.reading_time}</span>
      </div>
    </header>
  );
}
