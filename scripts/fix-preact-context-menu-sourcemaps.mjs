import { readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const distDir = join(
    process.cwd(),
    "node_modules",
    "preact-context-menu",
    "dist",
);

let updated = 0;

try {
    for (const name of readdirSync(distDir)) {
        if (!name.endsWith(".js")) {
            continue;
        }

        const file = join(distDir, name);
        const original = readFileSync(file, "utf8");
        const cleaned = original.replace(
            /(?:\/\/[@#]\s*sourceMappingURL=.*|\/\*[@#]\s*sourceMappingURL=.*\*\/)\s*$/gm,
            "",
        );

        if (cleaned !== original) {
            writeFileSync(file, cleaned, "utf8");
            updated += 1;
        }
    }
} catch {
    // Dependency is optional for this script lifecycle; skip without failing install.
}

if (updated > 0) {
    console.log(
        `fix-preact-context-menu-sourcemaps: removed broken sourcemap references in ${updated} file(s).`,
    );
}
