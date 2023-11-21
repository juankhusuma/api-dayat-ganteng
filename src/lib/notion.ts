import { Client, iteratePaginatedAPI } from "@notionhq/client";


export const notion = new Client({ auth: process.env.NOTION_AUTH_TOKEN! });