import { registerHooks, createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

let globalRoot;

registerHooks({
	resolve(specifier, context, nextResolve) {
		try {
			return nextResolve(specifier, context);
		} catch (error) {
			const isBare = !URL.canParse(specifier) && !/^[./#]/.test(specifier);
			if (!(error.code === "ERR_MODULE_NOT_FOUND" || error.code === "MODULE_NOT_FOUND") || !isBare) throw error;

			globalRoot ??= pathToFileURL(
				execFileSync("npm", ["root", "-g"], { encoding: "utf8" }).trim() + "/"
			).href;

			if (error.code === "MODULE_NOT_FOUND") {
				const path = createRequire(globalRoot).resolve(specifier);
				return { url: pathToFileURL(path).href, shortCircuit: true };
			}

			return nextResolve(specifier, { ...context, parentURL: globalRoot });
		}
	}
});
