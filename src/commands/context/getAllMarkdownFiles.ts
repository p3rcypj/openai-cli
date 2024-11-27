import fs from 'fs';
import path from 'path';

export const getAllMarkdownFiles = (dir: string): string[] => {
    const list = fs.readdirSync(dir);

    return list.reduce((results: string[], file: string) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat && stat.isDirectory())
            return results.concat(getAllMarkdownFiles(filePath));
        else if (path.extname(file) === '.md')
            return results.concat(filePath);
        else
            return results;
    }, []);
};
