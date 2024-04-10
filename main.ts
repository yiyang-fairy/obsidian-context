import {
	App,
	Editor,
	MarkdownView,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	TFile,
	TFolder,
} from "obsidian";

// Remember to rename these classes and interfaces!

interface ContextSettings {
	selectedFolder: string;
	inputedFloder: string;
}

interface FileTitle {
	title?: string;
	subHeading: string;
	content: string;
}

const DEFAULT_SETTINGS: ContextSettings = {
	selectedFolder: "",
	inputedFloder: "",
};
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
async function getAllContexts(context: Context): Promise<string> {
	const aggregatedTitleList: Map<string, FileTitle[]> = new Map();
	const currentNotePath = this.app.workspace.getActiveFile()?.path;

	const activeFile = this.app.workspace.getActiveFile();
	const currentContent = await activeFile.vault.read(activeFile);
	const secondaryHeading = getHeadingsAndContent(currentContent, "# ");

	if (activeFile) {
		secondaryHeading.forEach((heading) =>
			aggregatedTitleList.set(heading.subHeading, [])
		);
	}

	const files = getAllFiles(context.settings.selectedFolder);
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
		);

		for (const fileTitle of fileTitleContent) {
			const target = fileTitle.subHeading.toLowerCase();

			for (const [key, value] of aggregatedTitleList) {
				if (target === key.toLowerCase()) {
					aggregatedTitleList.get(key)?.push(fileTitle);
				}
			}
		}

		console.log();
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
) => {
	const lines = content.split("\n");
	let isInSubHeading = false;
	let currentSubHeading = "";
	let currentContent = "";
	const subHeadings = [];

	for (const line of lines) {
		if (line.startsWith(type)) {
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

export default class Context extends Plugin {
	settings: ContextSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon(
			"cat",
			"Context",
			(evt: MouseEvent) => {
				// Called when the user clicks the icon.
				new Notice("This is a notice! hahaha");
			}
		);
		// Perform additional things with the ribbon
		ribbonIconEl.addClass("my-plugin-ribbon-class");

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText("Status Bar Text");

		// This adds a simple command that can be triggered anywhere
		// this.addCommand({
		// 	id: "open-sample-modal-simple",
		// 	name: "Open sample modal (simple)",
		// 	callback: () => {
		// 		new SampleModal(this.app).open();
		// 	},
		// });
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: "context-cat",
			name: "Context Cat",
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				const content = await getAllContexts(this);
				editor.setValue(content);
			},
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		// this.addCommand({
		// 	id: "open-sample-modal-complex",
		// 	name: "Open sample modal (complex)",
		// 	checkCallback: (checking: boolean) => {
		// 		// Conditions to check
		// 		const markdownView =
		// 			this.app.workspace.getActiveViewOfType(MarkdownView);
		// 		if (markdownView) {
		// 			// If checking is true, we're simply "checking" if the command can be run.
		// 			// If checking is false, then we want to actually perform the operation.
		// 			if (!checking) {
		// 				new SampleModal(this.app).open();
		// 			}

		// 			// This command will only show up in Command Palette when the check function returns true
		// 			return true;
		// 		}
		// 	},
		// });

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, "click", (evt: MouseEvent) => {
			console.log("click", evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(
			window.setInterval(() => console.log("setInterval"), 5 * 60 * 1000)
		);
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

// class SampleModal extends Modal {
// 	constructor(app: App) {
// 		super(app);
// 	}

// 	onOpen() {
// 		const { contentEl } = this;
// 		contentEl.setText("Woah!");
// 	}

// 	onClose() {
// 		const { contentEl } = this;
// 		contentEl.empty();
// 	}
// }

class SampleSettingTab extends PluginSettingTab {
	plugin: Context;

	constructor(app: App, plugin: Context) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl).setName("Context Setting");

		new Setting(containerEl)
			.setName("选择文件夹")
			.setDesc("选择你想查找的文件夹")
			.addDropdown(async (dropdown) => {
				const folders = getAllNoteFolders(); // 获取所有文件夹的列表
				dropdown
					.addOptions(folders) // 将文件夹列表添加为下拉框的选项
					.setValue(this.plugin.settings.selectedFolder) // 设置下拉框的初始值为已保存的设置值
					.onChange(async (value) => {
						this.plugin.settings.selectedFolder = value; // 将选择的文件夹保存到设置中
						await this.plugin.saveSettings();

						// 点击后展示选择的文件夹
						showSelectedFolder(value);
					});
			});

		new Setting(containerEl)
			.setName("手动添加文件夹")
			.setDesc("添加你想查找的文件夹")
			.addText((text) => {
				text.setPlaceholder("输入文件夹名称")
					.setValue(this.plugin.settings.inputedFloder)
					.onChange(async (value) => {
						this.plugin.settings.inputedFloder = value;
						await this.plugin.saveSettings();
					});
			});
	}
}

function getAllFolders(folder: TFolder, folders: Record<string, string>) {
	for (const item of folder.children) {
		if (item instanceof TFolder && !folders[item.path]) {
			folders[item.path] = item.path;
			getAllFolders(item, folders);
		}
	}
}

function getAllNoteFolders(): Record<string, string> {
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
}

const showSelectedFolder = (folder: string) => {
	new Notice(`Selected folder: ${folder}`);
};
