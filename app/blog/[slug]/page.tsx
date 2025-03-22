import Image from "next/image";
import { notFound } from "next/navigation";
import { ReactElement } from "react";

import { getBlogPosts, getPost } from "@/lib/mdx";
import dynamic from "next/dynamic";

const DynamicMarkdownRenderer = dynamic(
  () => import("@/components/markdown/mdx-renderer").then((mod) => mod.MarkdownRenderer),
  { ssr: !!false }
)

export async function generateStaticParams() {
  const posts = await getBlogPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

interface BlogPostProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogPost({
  params,
}: BlogPostProps): Promise<ReactElement> {
  const resolvedParams = await params;
  const post = await getPost("blog", resolvedParams.slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <article data-pagefind-body>
        <header className="mb-8">
          <div className="relative w-full h-64 mb-6 rounded-lg overflow-hidden">
            <Image
              src={post.image}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
          </div>
          <h2 className="mb-2 text-3xl font-bold">{post.title}</h2>
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">{post.author}</span>
            <span className="mx-2">•</span>
            <time dateTime={post.date}>{post.date}</time>
            <span className="mx-2">•</span>
            <span>{post.readingTime}</span>
          </div>
        </header>
        <DynamicMarkdownRenderer
          content={post.content}
          frontmatter={{
            title: post.title,
            description: post.description,
            date: post.date,
            author: post.author,
            image: post.image,
          }}
        />
      </article>
    </div>
  );
}
