export interface BlogPost {
  id: number;
  title: string;
  author: string;
  date: string;
  reading_time: string;
  tags: string[];
  content: string;
  excerpt: string;
}

export interface RelatedPost {
  id: number;
  title: string;
  excerpt: string;
  date: string;
  tags: string[];
}
