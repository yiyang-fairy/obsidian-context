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

	const activeFile = this.app.workspace.getActiveFile();
	const currentContent = await activeFile.vault.read(activeFile);
	const secondaryHeading = getHeadingsAndContent(currentContent, "# ");
	const delimiter = context.settings.delimiter;

	if (activeFile) {
		secondaryHeading.forEach((heading) =>
			aggregatedTitleList.set(heading.subHeading, [])
		);
	}

	const filterType = context.settings.filterType;
	const files = filterType
		? getAllFilesByGlob(context.settings.inputtedFolder)
		: getAllFiles(context.settings.selectedFolder);

	for (const file of files) {
		if (file.path === currentNotePath) {
			continue;
		}

		const title = file.basename;
		const content = await file.vault.read(file);
		const fileTitleContent: FileTitle[] = getHeadingsAndContent(
			content,
			"## ",
			title,
			delimiter
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
	title?: string,
	delimiter?: string
) => {
	const lines = content.split("\n");
	let isInSubHeading = false;
	let currentSubHeading = "";
	let currentContent = "";
	const subHeadings = [];

	for (const line of lines) {
		if (
			line.startsWith(type) ||
			(delimiter && line.startsWith(delimiter))
		) {
			// 二级标题
			if (isInSubHeading) {
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
		} else if (isInSubHeading) {
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
