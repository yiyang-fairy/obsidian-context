import { Editor, MarkdownView, Plugin } from "obsidian";
import { ContextSettings } from "./type";
import {
	autoUpdateContext,
	updateContext,
} from "./buildView/aggregatedContent";
import { ContextSettingTab } from "./setting";

const DEFAULT_SETTINGS: ContextSettings = {
	selectedFolder: "",
	inputtedFolder: "",
	filterType: true,
	// delimiter: "",
};

export default class Context extends Plugin {
	settings: ContextSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		this.addRibbonIcon("cat", "Context Cat", async (evt: MouseEvent) => {
			const view = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (view) {
				updateContext(view.editor, this);
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: "context-cat",
			name: "Context Cat",
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				updateContext(editor, this);
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new ContextSettingTab(this.app, this));
		this.registerEvent(
			this.app.workspace.on(
				"active-leaf-change",
				this.onActiveLeafChange.bind(this)
			)
		);
	}
	async onActiveLeafChange() {
		const activeFile = this.app.workspace.getActiveFile();
		if (activeFile) {
			autoUpdateContext(activeFile, this);
		}
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
