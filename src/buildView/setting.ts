import { TFolder } from "obsidian";

const getAllFolders = (folder: TFolder, folders: Record<string, string>) => {
	for (const item of folder.children) {
		if (item instanceof TFolder && !folders[item.path]) {
			folders[item.path] = item.path;
			getAllFolders(item, folders);
		}
	}
};

export const getAllNoteFolders = (): Record<string, string> => {
	const vault = app.vault;
	const folders: Record<string, string> = {};
	for (const item of vault.getMarkdownFiles()) {
		const folder = item.parent;
		if (folder instanceof TFolder && !folders[folder.path]) {
			folders[folder.path] = folder.path;
			getAllFolders(folder, folders);
		}
	}

	return folders;
};
