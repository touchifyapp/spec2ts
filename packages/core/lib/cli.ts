import { promises as fs } from "fs";
import * as path from "path";
import { glob, type GlobOptions } from "glob";

export function writeFile(path: string, content: string): Promise<void> {
    return fs.writeFile(
        path,
        content,
        { encoding: "utf8" }
    );
}

export async function mkdirp(file: string): Promise<void> {
    await fs.mkdir(path.dirname(file), { recursive: true });
}

export function getOutputPath(src: string, { output, ext }: { output?: string, ext?: string }): string {
    if (output) {
        return path.join(
            output,
            getOutputFileName(src)
        );
    }

    if (src.startsWith("http")) {
        return path.basename(src);
    }

    return path.join(
        path.dirname(src),
        getOutputFileName(src, ext)
    );
}

export function getOutputFileName(src: string, ext = ".d.ts"): string {
    return path.basename(src)
        .replace(path.extname(src), "")
        + ext;
}

export async function findFiles(pattern: string | string[], options?: GlobOptions): Promise<string[]> {
    if (!Array.isArray(pattern)) {
        return findFilesOne(pattern, options);
    }

    const res = await Promise.all(pattern.map(p => findFilesOne(p, options)));
    return res.flat();
}

async function findFilesOne(pattern: string, options: GlobOptions = {}): Promise<string[]> {
    if (pattern.startsWith("http")) {
        return [pattern];
    }

    return await glob(pattern, { ...options, withFileTypes: false });
}
