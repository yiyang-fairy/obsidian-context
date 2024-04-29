import { minimatch } from "minimatch";
import { TFile, TFolder } from "obsidian";
import Context from "src/main";
import { FileTitle } from "src/type";

const getAllFiles = (path: string) => {
	const vault = app.vault;
	const files: TFile[] = [];

	const folder = vault.getAbstractFileByPath(path);
	if (folder instanceof TFolder) {
		for (const item of folder.children) {
			if (item instanceof TFile) {
				files.push(item);
			} else {
				const subFiles = getAllFiles(item.path);
				files.push(...subFiles);
			}
		}
	}

	return files;
};

const isPathMatch = (path: string, globPattern: string): boolean => {
	const patternWithAnyDirs = `**/${globPattern}/**/*.md`;
	return minimatch(path, patternWithAnyDirs, { matchBase: true });
};

const getAllFilesByGlob = (path: string): TFile[] => {
	const files: TFile[] = [];
	const allFiles = getAllFiles("/");

	for (const file of allFiles) {
		if (isPathMatch(file.path, path)) {
			files.push(file);
		}
	}

	return files;
};

export async function getAllContexts(context: Context): Promise<string> {
	const aggregatedTitleList: Map<string, FileTitle[]> = new Map();
	const currentNotePath = this.app.workspace.getActiveFile()?.path;
	const filterType = context.settings.filterType;
	const files = filterType
		? getAllFilesByGlob(context.settings.inputtedFolder)
		: getAllFiles(context.settings.selectedFolder);
	const activeFile = this.app.workspace.getActiveFile();
	const currentContent = await activeFile.vault.read(activeFile);

	const targetHeading = getTargetH1(currentContent) || [activeFile.basename];
	const { property, propertyString } = getFileProperties(currentContent);

	if (property["catTags"]) {
		const allTags = await getAllTags(
			files,
			currentNotePath,
			property["catTags"]
		);

		return propertyString + "\n" + allTags;
	}
	// const delimiter = context.settings.delimiter;

	if (activeFile) {
		targetHeading.forEach((heading) =>
			aggregatedTitleList.set(heading, [])
		);
	}

	for (const file of files) {
		if (file.path === currentNotePath) {
			continue;
		}

		const title = file.basename;
		const content = await file.vault.read(file);
		const fileTitleContent: FileTitle[] = getHeadingsAndContent(
			content,
			"## ",
			title
			// delimiter
		);

		for (const fileTitle of fileTitleContent) {
			const target = fileTitle.subHeading.toLowerCase();

			for (const item of aggregatedTitleList) {
				const key = item[0];
				if (target.includes(key.toLowerCase())) {
					aggregatedTitleList.get(key)?.push(fileTitle);
				}
			}
		}
	}

	const aggregatedContent = createAggregatedContent(aggregatedTitleList);
	let result = "";
	for (const item of aggregatedContent) {
		const title = "# " + item[0] + "\n";
		result += title + item[1] + "\n";
	}

	return result;
}

const createAggregatedContent = (
	AggregatedTitleList: Map<string, FileTitle[]>
) => {
	const AggregatedContent: Map<string, string> = new Map();
	for (const [key, value] of AggregatedTitleList) {
		let content = "";
		for (const fileTitle of value) {
			content += `## [[${fileTitle.title}]]\n`;
			content += fileTitle.content;
		}
		AggregatedContent.set(key, content);
	}
	return AggregatedContent;
};

const getHeadingsAndContent = (
	content: string,
	type: string,
	title?: string
	// delimiter?: string
) => {
	const lines = content.split("\n");
	let isInSubHeading = false;
	let currentSubHeading = "";
	let currentContent = "";
	const subHeadings = [];
	let isH2 = false;

	for (const line of lines) {
		if (line.startsWith("# ")) {
			isH2 = false;
		}
		if (line.startsWith(type)) {
			isH2 = true;
			// 二级标题
			if (isInSubHeading && isH2) {
				// 处理上一个二级标题的内容
				// 在这里对内容进行处理
				subHeadings.push({
					title,
					subHeading: currentSubHeading,
					content: currentContent,
				});

				currentContent = "";
			}

			isInSubHeading = true;
			currentSubHeading = line.substring(type.length).trim();
		} else if (isInSubHeading && isH2) {
			// 内容行
			currentContent += line + "\n";
		}
	}

	subHeadings.push({
		title,
		subHeading: currentSubHeading,
		content: currentContent,
	});

	return subHeadings;
};

const getTargetH1 = (content: string) => {
	const lines = content.split("\n");
	const result: string[] = [];
	lines.map((line) => {
		//匹配一级标题
		if (line.startsWith("# ")) {
			const h1 = line.substring(2).trim();
			result.push(h1);
		}
	});
	return result.length > 0 ? result : null;
};
const getFileProperties = (currentContent: string) => {
	const lines = currentContent.split("\n");
	let result = "";
	let inProperty = false;
	for (const line of lines) {
		if (line.startsWith("---")) {
			if (inProperty) {
				result += line + "\n";
				break;
			}
			inProperty = true;
		} else if (inProperty) {
			result += line + "\n";
		}
	}
	const obj: { [key: string]: string[] } = {};
	const resultLines = result.split("\n");
	let key = "";
	let value: string[] = [];
	for (const line of resultLines) {
		if (line.startsWith("---") || line === "") {
			continue;
		}
		if (line.match(/^[a-zA-Z0-9_]+:/)) {
			if (key) {
				obj[key] = value;
			}
			key = line.split(":")[0].trim();
			value = line.split(":")[1].trim()
				? line.split(":")[1].trim().split("&")
				: [];
		} else {
			if (line.trim().startsWith("-")) {
				value.push(line.trim().substring(1).trim());
			}
		}
	}
	obj[key] = value;

	return {
		property: obj,
		propertyString: "---\n" + result,
	};
};
const getAllTags = async (
	files: TFile[],
	currentNotePath: string,
	targetTags: string[]
) => {
	const targetTagsObj: { [key: string]: string[] } = {};
	targetTags.forEach((tag) => {
		targetTagsObj[tag] = [];
	});
	for (const file of files) {
		if (file.path === currentNotePath) {
			continue;
		}
		const content = await file.vault.read(file);
		getTags(content, targetTagsObj);
	}

	return tagsToString(targetTagsObj);
};

const tagsToString = (targetTagsObj: { [key: string]: string[] }) => {
	let result = "";
	for (const [key, value] of Object.entries(targetTagsObj)) {
		result += `# ${key}\n`;
		for (const item of value) {
			result += "\n" + item + "\n";
		}
	}
	return result;
};
const getTags = (content: string, targetTag: { [key: string]: string[] }) => {
	const lines = content.split("\n");
	for (const line of lines) {
		const regex = /\s#(\S+)/;
		const match = line.match(regex);

		if (!match) {
			continue;
		}
		match.forEach((item) => {
			if (Object.keys(targetTag).includes(item.split("#")[1])) {
				targetTag[item.split("#")[1]].push(line);
			}
		});
	}
};
