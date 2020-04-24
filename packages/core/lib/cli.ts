import { promises as fs } from "fs";
import * as path from "path";
import * as glob from "glob";

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

export function getOutputPath(src: string, { output }: { output?: string }): string {
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
        getOutputFileName(src)
    );
}

export function getOutputFileName(src: string, ext = ".d.ts"): string {
    return path.basename(src)
        .replace(path.extname(src), "")
        + ext;
}

export function findFiles(pattern: string | string[], options?: glob.IOptions): Promise<string[]> {
    if (!Array.isArray(pattern)) {
        return findFilesOne(pattern, options);
    }

    return Promise.all(pattern.map(p => findFilesOne(p, options)))
        .then((res) => ([] as string[]).concat(...res))
}

function findFilesOne(pattern: string, options: glob.IOptions = {}): Promise<string[]> {
    return new Promise((resolve, reject) => {
        if (pattern.startsWith("http")) {
            return resolve([pattern]);
        }

        glob(pattern, options, (err, matches) => {
            err ? reject(err) : resolve(matches);
        });
    });
}
