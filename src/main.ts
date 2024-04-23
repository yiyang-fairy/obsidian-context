import { Editor, MarkdownView, Notice, Plugin } from "obsidian";
import { ContextSettings } from "./type";
import { getAllContexts } from "./buildView/aggregatedContent";
import { ContextSettingTab } from "./setting";

const DEFAULT_SETTINGS: ContextSettings = {
	selectedFolder: "",
	inputtedFolder: "",
	filterType: true,
	delimiter: "",
};

export default class Context extends Plugin {
	settings: ContextSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		this.addRibbonIcon("cat", "Context", (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice("This is a notice! hahaha");
		});

		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: "context-cat",
			name: "Context Cat",
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				const content = await getAllContexts(this);
				editor.setValue(content);
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new ContextSettingTab(this.app, this));
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
