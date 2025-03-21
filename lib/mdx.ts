/* eslint-disable */
// Author: Annalhq Shaikh

import fs from "fs";
import matter from "gray-matter";
import { serialize } from "next-mdx-remote/serialize";
import path from "path";
import readingTime from "reading-time";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";

export interface Post {
     title: string;
     description: string;
     date: string;
     author: string;
     slug: string;
     content: string;
     readingTime: string;
     image: string;
}

function getMDXFiles(dir: string): string[] {
     return fs.readdirSync(dir).filter((file) => path.extname(file) === ".mdx");
}

async function readMDXFile(filePath: string): Promise<Post> {
     const rawContent = fs.readFileSync(filePath, "utf-8");
     const { data, content } = matter(rawContent);
     const { text: readingTimeText } = readingTime(content);

          const mdxSource = await serialize(content, {
               mdxOptions: {
                    rehypePlugins: [
                         rehypeSlug,
                         [rehypePrettyCode as any, { theme: "material-theme-darker" }],
                         [rehypeAutolinkHeadings, { behavior: "wrap" }],
                    ],
               },
               parseFrontmatter: false,
          });

     return {
          title: data.title,
          description: data.description,
          date: data.date,
          author: data.author || "GDG Team member",
          slug: path.basename(filePath, ".mdx"),
          content: JSON.stringify(mdxSource),
          readingTime: readingTimeText,
          image: data.image || "/blog-images/default.jpg",
     };
}

async function getMDXData(source: "blog" | "space"): Promise<Post[]> {
     const contentDir = path.join(process.cwd(), "content", source);
     const mdxFiles = getMDXFiles(contentDir);
     const postsPromises = mdxFiles.map((file) =>
          readMDXFile(path.join(contentDir, file))
     );

     const posts = await Promise.all(postsPromises);

     return source === "blog"
          ? posts.sort(
               (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )
          : posts;
}

export async function getBlogPosts(): Promise<Post[]> {
     return getMDXData("blog");
}

export async function getSpaceEntries(): Promise<Post[]> {
     return getMDXData("space");
}

export async function getPost(
     source: "blog" | "space",
     slug: string
): Promise<Post | null> {
     const contentDir = path.join(process.cwd(), "content", source);
     const filePath = path.join(contentDir, `${slug}.mdx`);

     try {
          return await readMDXFile(filePath);
     } catch {
          return null;
     }
}
