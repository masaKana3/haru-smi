export type PostType = "thread" | "diary";

export type Visibility = "public" | "private";

export interface Comment {
  id: string;
  postId: string;
  content: string;
  authorId: string;
  createdAt: number;
  likes: number;
}

export interface Post {
  id: string;
  type: PostType;
  title?: string;
  content: string;
  authorId: string;
  visibility: Visibility;
  topicId?: string;
  createdAt: number;
  likes: number;
  comments: Comment[];
}

export interface Topic {
  id: string;
  title: string;
  description: string;
}
