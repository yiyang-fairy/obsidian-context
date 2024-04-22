import {
	App,
	Editor,
	MarkdownView,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";
import * as _ from "lodash";
import { ContextSettings } from "./type";
import { getAllContexts } from "./buildView/aggregatedContent";
import { getAllNoteFolders } from "./buildView/setting";

const DEFAULT_SETTINGS: ContextSettings = {
	selectedFolder: "",
	inputtedFolder: "",
	filterType: true,
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
		this.addSettingTab(new SampleSettingTab(this.app, this));
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
			.setName("选择筛选文件方式")
			.setDesc("以glob模式路径匹配")
			.addToggle((value) => {
				value
					.setValue(this.plugin.settings.filterType)
					.onChange((newValue) => {
						this.plugin.settings.filterType = newValue;
					});
			});

		new Setting(containerEl)
			.setName("手动添加文件夹")
			.setDesc("以glob模式匹配")
			.addText((text) => {
				text.setPlaceholder("输入文件夹名称")
					.setValue(this.plugin.settings.inputtedFolder)
					.onChange(async (value) => {
						debouncedHandleValueChanged(value);
					});
			});
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
					});
			});

		const handleValueChanged = async (value: string) => {
			this.plugin.settings.inputtedFolder = value;
			await this.plugin.saveSettings();
		};
		const debouncedHandleValueChanged = _.debounce(handleValueChanged, 500);
	}
}
