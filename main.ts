import {
	App,
	Editor,
	MarkdownView,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";

// Remember to rename these classes and interfaces!

interface ContextSettings {
	mySetting: string;
}

interface FileTitle {
	title?: string;
	subHeading: string;
	content: string;
}

const DEFAULT_SETTINGS: ContextSettings = {
	mySetting: "default",
};

async function getAllContexts(): Promise<string> {
	const AggregatedTitleList: Map<string, FileTitle[]> = new Map();
	const currentNotePath = this.app.workspace.getActiveFile()?.path;

	const activeFile = this.app.workspace.getActiveFile();
	const currentContent = await activeFile.vault.read(activeFile);
	const secondaryHeading = getHeadingsAndContent(currentContent, "# ");

	if (activeFile) {
		secondaryHeading.forEach((heading) =>
			AggregatedTitleList.set(heading.subHeading, [])
		);
	}

	const files = this.app.vault.getMarkdownFiles();
	for (const file of files) {
		if (file.path === currentNotePath) {
			continue; // 跳过当前笔记页
		}

		const title = file.basename;
		const content = await file.vault.read(file);
		const fileTitleContent: FileTitle[] = getHeadingsAndContent(
			content,
			"## ",
			title
		);

		for (const fileTitle of fileTitleContent) {
			if (AggregatedTitleList.has(fileTitle.subHeading)) {
				AggregatedTitleList.get(fileTitle.subHeading)?.push(fileTitle);
			}
		}
	}

	const aggregatedContent = createAggregatedContent(AggregatedTitleList);

	return insertContentBeforeNextFirstLevelHeading(
		currentContent,
		aggregatedContent
	);
}

const createAggregatedContent = (
	AggregatedTitleList: Map<string, FileTitle[]>
) => {
	const AggregatedContent: Map<string, string> = new Map();
	for (const [key, value] of AggregatedTitleList) {
		let content = "";
		for (const fileTitle of value) {
			content += `## ${fileTitle.title}\n`;
			content += fileTitle.content;
		}
		AggregatedContent.set(key, content);
	}
	return AggregatedContent;
};

const insertContentBeforeNextFirstLevelHeading = (
	content: string,
	newContent: Map<string, string>
): string => {
	return content
		.split("\n")
		.map((line) => {
			if (line.startsWith("# ")) {
				const title = line.substring(2).trim();
				if (newContent.has(title)) {
					const newContentValue = newContent.get(title);
					return line + "\n" + newContentValue;
				}
			}
			return line;
		})
		.join("\n");
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
				const content = await getAllContexts();
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

		new Setting(containerEl)
			.setName("Setting #1")
			.setDesc("It's a secret")
			.addText((text) =>
				text
					.setPlaceholder("Enter your secret")
					.setValue(this.plugin.settings.mySetting)
					.onChange(async (value) => {
						this.plugin.settings.mySetting = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
