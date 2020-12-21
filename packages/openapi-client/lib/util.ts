export function camelCase(str: string): string {
    const regex = /[A-Z\xC0-\xD6\xD8-\xDE_$]?[a-z\xDF-\xF6\xF8-\xFF_$]+|[A-Z\xC0-\xD6\xD8-\xDE_$]+(?![a-z\xDF-\xF6\xF8-\xFF_$])|\d+/g;
    const words = str.match(regex);
    if (!words) return "";

    let result = "";
    const len = words.length;

    for (let i = 0; i < len; i++) {
        const word = words[i];
        let tmp = word.toLowerCase();

        if (i !== 0) {
            tmp = tmp[0].toUpperCase() + tmp.substr(1);
        }

        result += tmp;
    }

    return result;
}