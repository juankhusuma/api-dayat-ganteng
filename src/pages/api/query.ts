import type { NextApiRequest, NextApiResponse } from "next";
import { notion } from "@/lib/notion";
import katex from "katex";

import type {
    BlockObjectResponse,
    EquationRichTextItemResponse,
    Heading2BlockObjectResponse,
    Heading3BlockObjectResponse,
    ImageBlockObjectResponse,
    ParagraphBlockObjectResponse,
    QueryDatabaseResponse,
    RichTextItemResponse,
    TextRichTextItemResponse,
} from "@notionhq/client/build/src/api-endpoints";

type ContentType = "Pertanyaan" | "Jawaban" | "Solusi" | null;
type JawabanType = "A" | "B" | "C" | "D";

export interface Paragraph {
    type: "text" | "equation";
    value: string;
}

export interface Question {
    id: string;
    solution: {
        type: "image" | "paragraph";
        value: Paragraph[] | string;
    }[];
    contents: {
        type: "image" | "paragraph";
        value: Paragraph[] | string;
    }[];
    choices: Record<JawabanType, {
        type: "image" | "paragraph";
        value: Paragraph[] | string;
    }[]>;
}


export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    const { filter } = req.body;
    const databaseId = process.env.DATABASE_ID!;
    const queryRes: QueryDatabaseResponse = await notion.databases.query({
        database_id: databaseId,
        filter: filter as any,
    });

    const questions: Question[] = [];

    for (let i = 0; i < queryRes.results.length; i++) {
        const pageId = queryRes.results[i].id;
        const question: Question = {
            id: pageId,
            solution: [],
            contents: [],
            choices: {
                A: [],
                B: [],
                C: [],
                D: [],
            }
        };

        const pageBlocks = await notion.blocks.children.list({
            block_id: pageId,
        });

        let contentType: ContentType | null = null;
        let jawabanType: JawabanType | null = null;

        for (let j = 0; j < pageBlocks.results.length; j++) {
            const blockObject: BlockObjectResponse = pageBlocks.results[
                j
            ] as BlockObjectResponse;

            switch (blockObject.type) {
                case "heading_2": {
                    const h2Block: Heading2BlockObjectResponse = blockObject;
                    const h2Text = h2Block.heading_2.rich_text[0].plain_text;

                    if (h2Text === "Pertanyaan") {
                        contentType = h2Text;
                    } else if (h2Text === "Jawaban") {
                        contentType = h2Text;
                    } else if (h2Text === "Solusi") {
                        contentType = h2Text;
                    }
                    break;
                }

                case "heading_3": {
                    const h3Block: Heading3BlockObjectResponse = blockObject;
                    const h3Text = h3Block.heading_3.rich_text[0].plain_text;

                    if (h3Text === "A") {
                        jawabanType = h3Text;
                    } else if (h3Text === "B") {
                        jawabanType = h3Text;
                    } else if (h3Text === "C") {
                        jawabanType = h3Text;
                    } else if (h3Text === "D") {
                        jawabanType = h3Text;
                    }
                    break;
                }

                case "image": {
                    const imgBlock: ImageBlockObjectResponse = blockObject;
                    if (contentType === "Pertanyaan") {
                        question.contents[question.contents.length] = {
                            type: "image",
                            value: imgBlock.image.type === "external" ? imgBlock.image.external.url : imgBlock.image.file.url,
                        }
                    } else if (contentType === "Jawaban") {
                        question.choices[jawabanType as JawabanType][question.choices[jawabanType as JawabanType].length] = {
                            type: "image",
                            value: imgBlock.image.type === "external" ? imgBlock.image.external.url : imgBlock.image.file.url,
                        }
                    } else if (contentType === "Solusi") {
                        question.solution[question.solution.length] = {
                            type: "image",
                            value: imgBlock.image.type === "external" ? imgBlock.image.external.url : imgBlock.image.file.url,
                        }
                    }
                    break;
                }

                case "paragraph": {
                    const pBlock: ParagraphBlockObjectResponse = blockObject;
                    const paragraph: Paragraph[] = [];

                    for (let k = 0; k < pBlock.paragraph.rich_text.length; k++) {
                        const richText: RichTextItemResponse =
                            pBlock.paragraph.rich_text[k];

                        switch (richText.type) {
                            case "text": {
                                const textRichText: TextRichTextItemResponse = richText;

                                paragraph.push({
                                    type: "text",
                                    value: textRichText.text.content,
                                });

                                break;
                            }

                            case "equation": {
                                const equationRichText: EquationRichTextItemResponse = richText;
                                const equation = katex.renderToString(equationRichText.equation.expression, {
                                    throwOnError: false,
                                });
                                paragraph.push({
                                    type: "equation",
                                    value: equation,
                                });
                                console.log(equationRichText.equation.expression)
                                break;
                            }
                        }
                    }
                    if (contentType === "Pertanyaan") {
                        question.contents.push({
                            type: "paragraph",
                            value: [...paragraph],
                        });
                    } else if (contentType === "Jawaban") {
                        question.choices[jawabanType as JawabanType].push({
                            type: "paragraph",
                            value: [...paragraph],
                        });
                    } else if (contentType === "Solusi") {
                        question.solution.push({
                            type: "paragraph",
                            value: [...paragraph],
                        });
                    }

                    break;
                }
            }
        }

        questions.push(question);
    }

    res.status(200).json(questions);
}