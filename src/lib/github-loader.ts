import { GithubRepoLoader } from "@langchain/community/document_loaders/web/github";
import { Document } from "@langchain/core/documents";
import { generateEmbedding, summariseCode } from "./gemini";
import { db } from "@/server/db";
import { sleep } from "@trpc/server/unstable-core-do-not-import";

export const loadGitHubRepo = async (
  githubUrl: string,
  githubToken?: string,
) => {
  const loader = new GithubRepoLoader(githubUrl, {
    accessToken: githubToken || "",
    branch: "main",
    ignoreFiles: [
      "package-lock.json",
      "yarn.lock",
      "pnpm-lock.yaml",
      "bun.lockb",
    ],
    recursive: true,
    unknown: "warn",
    maxConcurrency: 5,
  });
  const docs = await loader.load();
  return docs;
};

export const indexGithubRepo = async (
  projectId: string,
  githubUrl: string,
  githubToken?: string,
) => {
  const docs = await loadGitHubRepo(githubUrl, githubToken);
  for (let i = 0; i < docs.length; i++) {
    try {
      console.log(`processing ${i} of ${docs.length}`);
      await sleep(1000);
      const doc = docs[i];
      const summary = await summariseCode(doc!);
      const embeddingValues = await generateEmbedding(summary);
      const sourceCodeEmbedding = await db.sourceCodeEmbedding.create({
        data: {
          summary: summary,
          sourceCode: JSON.parse(JSON.stringify(doc?.pageContent)),
          fileName: doc?.metadata.source,
          projectId,
        },
      });
      await db.$executeRaw`
      UPDATE "SourceCodeEmbedding"
      SET "summaryEmbedding" = ${embeddingValues}::vector
      WHERE "id" = ${sourceCodeEmbedding.id}
      `;
    } catch (error) {
      console.error("Error processing document", error);
    }
  }
};

// export const indexGithubRepo = async (
//   projectId: string,
//   githubUrl: string,
//   githubToken?: string,
// ) => {
//   const docs = await loadGitHubRepo(githubUrl, githubToken);
//   const allEmbeddings = await generateEmbeddings(docs);
//   await Promise.allSettled(
//     allEmbeddings.map(async (embedding, index) => {
//       console.log(`processing ${index} of ${allEmbeddings.length}`);
//       if (!embedding) return;

//       const sourceCodeEmbedding = await db.sourceCodeEmbedding.create({
//         data: {
//           summary: embedding.summary,
//           sourceCode: embedding.sourceCode,
//           fileName: embedding.filename,
//           projectId,
//         },
//       });
//       await db.$executeRaw`
//       UPDATE "SourceCodeEmbedding"
//       SET embedding = ${embedding.embedding}::vector
//       WHERE id = ${sourceCodeEmbedding.id}
//       `;
//     }),
//   );
// };

const generateEmbeddings = async (docs: Document[]) => {
  return await Promise.all(
    docs.map(async (doc) => {
      const summary = await summariseCode(doc);
      const embedding = await generateEmbedding(summary);
      return {
        summary,
        embedding,
        sourceCode: JSON.parse(JSON.stringify(doc.pageContent)),
        filename: doc.metadata.source,
      };
    }),
  );
};
